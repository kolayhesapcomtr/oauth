-- ============================================
-- PAYMENT PROVIDER INTEGRATION
-- Flexible multi-provider payment system for organizations
-- ============================================

-- ============================================
-- 1. PAYMENT PROVIDERS (Reference Table)
-- ============================================
CREATE TABLE IF NOT EXISTS payment_providers (
    id VARCHAR(50) PRIMARY KEY,  -- 'iyzico', 'paytr', 'param', 'manual'
    name VARCHAR(255) NOT NULL,
    description TEXT,
    logo_url VARCHAR(500),
    is_active BOOLEAN DEFAULT true,
    supports_subscriptions BOOLEAN DEFAULT true,
    supports_sub_merchant BOOLEAN DEFAULT false,  -- iyzico gibi
    required_credentials JSONB NOT NULL,  -- Hangi alanlar gerekli
    -- Example: {"api_key": "string", "secret_key": "string", "merchant_id": "string"}
    setup_instructions TEXT,
    documentation_url VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert default providers
INSERT INTO payment_providers (id, name, description, supports_sub_merchant, required_credentials, setup_instructions) VALUES
(
    'iyzico',
    'iyzico',
    'Türkiye''nin lider ödeme altyapısı. Sub Merchant desteği ile organizasyonlar kendi hesaplarına direkt ödeme alabilir.',
    true,
    '{"api_key": "string", "secret_key": "string", "sub_merchant_key": "string"}',
    'iyzico''da Sub Merchant hesabı açın ve API bilgilerinizi buraya girin.'
),
(
    'paytr',
    'PayTR',
    'Kolay entegrasyon, hızlı ödeme. Sanal POS ve ödeme formu çözümleri.',
    false,
    '{"merchant_id": "string", "merchant_key": "string", "merchant_salt": "string"}',
    'PayTR''de merchant hesabı açın ve API bilgilerinizi buraya girin.'
),
(
    'param',
    'Param (Akbank)',
    'Akbank''ın güvenilir ödeme sistemi.',
    false,
    '{"client_code": "string", "client_username": "string", "client_password": "string", "guid": "string"}',
    'Param merchant hesabı için Akbank ile iletişime geçin.'
),
(
    'manual',
    'Manuel Ödeme',
    'Banka transferi, kapıda ödeme gibi manuel yöntemler için.',
    false,
    '{}',
    'Manuel ödeme için otomatik işlem yapılmaz. Ödemeleri manuel takip edin.'
)
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- 2. ORGANIZATION PAYMENT SETTINGS
-- ============================================
CREATE TABLE IF NOT EXISTS organization_payment_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    payment_provider_id VARCHAR(50) NOT NULL REFERENCES payment_providers(id),

    -- Encrypted credentials (her provider farklı alanlar kullanır)
    credentials JSONB NOT NULL,  -- ENCRYPTED!
    -- Example for iyzico:
    -- {
    --   "api_key": "encrypted_value",
    --   "secret_key": "encrypted_value",
    --   "sub_merchant_key": "encrypted_value"
    -- }

    -- Settings
    is_active BOOLEAN DEFAULT true,
    is_live_mode BOOLEAN DEFAULT false,  -- true: production, false: sandbox/test

    -- Commission (Platform fee)
    commission_type VARCHAR(50) DEFAULT 'percentage',  -- 'percentage', 'fixed', 'none'
    commission_percentage DECIMAL(5,2) DEFAULT 10.00,  -- %10
    commission_fixed_amount DECIMAL(10,2) DEFAULT 0,  -- Fixed amount per transaction

    -- Test credentials (sandbox)
    test_credentials JSONB,

    -- Status
    setup_completed_at TIMESTAMP,
    last_verified_at TIMESTAMP,

    -- Metadata
    metadata JSONB DEFAULT '{}',

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    UNIQUE(organization_id, payment_provider_id)
);

CREATE INDEX idx_org_payment_settings_org ON organization_payment_settings(organization_id);
CREATE INDEX idx_org_payment_settings_provider ON organization_payment_settings(payment_provider_id);
CREATE INDEX idx_org_payment_settings_active ON organization_payment_settings(is_active);

-- ============================================
-- 3. TENANT PAYMENTS (Transaction Log)
-- ============================================
CREATE TABLE IF NOT EXISTS tenant_payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Relations
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    subscription_plan_id UUID REFERENCES tenant_subscription_plans(id),

    -- Payment Info
    payment_provider_id VARCHAR(50) NOT NULL REFERENCES payment_providers(id),
    amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'TRY',

    -- Commission
    platform_commission DECIMAL(10,2) DEFAULT 0,
    organization_net_amount DECIMAL(10,2) NOT NULL,

    -- Provider specific
    provider_payment_id VARCHAR(255),  -- iyzico payment ID, PayTR merchant_oid, etc.
    provider_conversation_id VARCHAR(255),  -- iyzico conversation ID
    provider_status VARCHAR(100),  -- 'success', 'failure', 'pending'
    provider_response JSONB,  -- Full provider response

    -- Payment method
    payment_method VARCHAR(50),  -- 'credit_card', 'debit_card', 'bank_transfer', etc.
    card_last_4 VARCHAR(4),
    card_brand VARCHAR(50),  -- 'visa', 'mastercard', etc.

    -- Billing period (for subscriptions)
    billing_period_start DATE,
    billing_period_end DATE,

    -- Status
    status VARCHAR(50) NOT NULL,  -- 'pending', 'completed', 'failed', 'refunded'
    paid_at TIMESTAMP,
    failed_at TIMESTAMP,
    failure_reason TEXT,

    -- Refund
    refunded_at TIMESTAMP,
    refund_reason TEXT,
    refund_amount DECIMAL(10,2),

    -- User info (who made payment)
    payer_email VARCHAR(255),
    payer_name VARCHAR(255),
    payer_phone VARCHAR(50),

    -- Metadata
    metadata JSONB DEFAULT '{}',

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_tenant_payments_tenant ON tenant_payments(tenant_id);
CREATE INDEX idx_tenant_payments_org ON tenant_payments(organization_id);
CREATE INDEX idx_tenant_payments_provider ON tenant_payments(payment_provider_id);
CREATE INDEX idx_tenant_payments_status ON tenant_payments(status);
CREATE INDEX idx_tenant_payments_created ON tenant_payments(created_at DESC);

-- ============================================
-- 4. PLATFORM COMMISSIONS (Earnings Tracking)
-- ============================================
CREATE TABLE IF NOT EXISTS platform_commissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Relations
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    payment_id UUID NOT NULL REFERENCES tenant_payments(id) ON DELETE CASCADE,

    -- Commission details
    commission_amount DECIMAL(10,2) NOT NULL,
    commission_type VARCHAR(50) NOT NULL,  -- 'percentage', 'fixed'
    commission_rate DECIMAL(5,2),  -- %10, etc.

    -- Original transaction
    original_amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'TRY',

    -- Status
    status VARCHAR(50) DEFAULT 'pending',  -- 'pending', 'collected', 'written_off'
    collected_at TIMESTAMP,

    -- Metadata
    metadata JSONB DEFAULT '{}',

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_platform_commissions_org ON platform_commissions(organization_id);
CREATE INDEX idx_platform_commissions_payment ON platform_commissions(payment_id);
CREATE INDEX idx_platform_commissions_status ON platform_commissions(status);

-- ============================================
-- 5. PAYMENT WEBHOOKS (Provider callbacks)
-- ============================================
CREATE TABLE IF NOT EXISTS payment_webhooks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    payment_provider_id VARCHAR(50) NOT NULL REFERENCES payment_providers(id),
    organization_id UUID REFERENCES organizations(id),

    -- Webhook data
    event_type VARCHAR(100) NOT NULL,  -- 'payment.success', 'payment.failed', etc.
    payload JSONB NOT NULL,
    headers JSONB,

    -- Processing
    processed BOOLEAN DEFAULT false,
    processed_at TIMESTAMP,
    processing_error TEXT,

    -- Related payment
    payment_id UUID REFERENCES tenant_payments(id),

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_payment_webhooks_provider ON payment_webhooks(payment_provider_id);
CREATE INDEX idx_payment_webhooks_org ON payment_webhooks(organization_id);
CREATE INDEX idx_payment_webhooks_processed ON payment_webhooks(processed);

-- ============================================
-- 6. TRIGGERS
-- ============================================

CREATE TRIGGER update_org_payment_settings_updated_at
    BEFORE UPDATE ON organization_payment_settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tenant_payments_updated_at
    BEFORE UPDATE ON tenant_payments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Auto-create commission record on successful payment
CREATE OR REPLACE FUNCTION create_platform_commission()
RETURNS TRIGGER AS $$
BEGIN
    -- Only create commission if payment is completed and has commission amount
    IF NEW.status = 'completed' AND NEW.platform_commission > 0 THEN
        INSERT INTO platform_commissions (
            organization_id,
            payment_id,
            commission_amount,
            commission_type,
            commission_rate,
            original_amount,
            currency
        ) VALUES (
            NEW.organization_id,
            NEW.id,
            NEW.platform_commission,
            'percentage',  -- You can make this dynamic
            10.00,  -- You can get this from organization settings
            NEW.amount,
            NEW.currency
        )
        ON CONFLICT DO NOTHING;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER create_commission_on_payment
    AFTER INSERT OR UPDATE ON tenant_payments
    FOR EACH ROW
    EXECUTE FUNCTION create_platform_commission();

-- ============================================
-- 7. VIEWS
-- ============================================

-- Organization payment overview
CREATE OR REPLACE VIEW v_organization_payment_overview AS
SELECT
    o.id as organization_id,
    o.name as organization_name,

    ops.payment_provider_id,
    pp.name as provider_name,
    ops.is_active as payment_active,
    ops.is_live_mode,

    -- Payment stats
    COUNT(tp.id) as total_payments,
    SUM(CASE WHEN tp.status = 'completed' THEN 1 ELSE 0 END) as successful_payments,
    SUM(CASE WHEN tp.status = 'completed' THEN tp.amount ELSE 0 END) as total_revenue,
    SUM(CASE WHEN tp.status = 'completed' THEN tp.platform_commission ELSE 0 END) as total_platform_commission,
    SUM(CASE WHEN tp.status = 'completed' THEN tp.organization_net_amount ELSE 0 END) as total_net_revenue

FROM organizations o
LEFT JOIN organization_payment_settings ops ON o.id = ops.organization_id
LEFT JOIN payment_providers pp ON ops.payment_provider_id = pp.id
LEFT JOIN tenant_payments tp ON o.id = tp.organization_id
GROUP BY o.id, o.name, ops.payment_provider_id, pp.name, ops.is_active, ops.is_live_mode;

-- ============================================
-- FUNCTIONS
-- ============================================

-- Calculate commission for a payment
CREATE OR REPLACE FUNCTION calculate_commission(
    p_amount DECIMAL(10,2),
    p_organization_id UUID
) RETURNS TABLE (
    commission_amount DECIMAL(10,2),
    net_amount DECIMAL(10,2)
) AS $$
DECLARE
    v_commission_type VARCHAR(50);
    v_commission_percentage DECIMAL(5,2);
    v_commission_fixed DECIMAL(10,2);
    v_calculated_commission DECIMAL(10,2);
BEGIN
    -- Get commission settings
    SELECT commission_type, commission_percentage, commission_fixed_amount
    INTO v_commission_type, v_commission_percentage, v_commission_fixed
    FROM organization_payment_settings
    WHERE organization_id = p_organization_id AND is_active = true
    LIMIT 1;

    -- Calculate based on type
    IF v_commission_type = 'percentage' THEN
        v_calculated_commission := p_amount * (v_commission_percentage / 100);
    ELSIF v_commission_type = 'fixed' THEN
        v_calculated_commission := v_commission_fixed;
    ELSE
        v_calculated_commission := 0;
    END IF;

    RETURN QUERY SELECT
        v_calculated_commission,
        p_amount - v_calculated_commission;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- COMMENTS
-- ============================================
COMMENT ON TABLE payment_providers IS 'Available payment providers (iyzico, PayTR, etc.)';
COMMENT ON TABLE organization_payment_settings IS 'Organization-specific payment provider credentials';
COMMENT ON TABLE tenant_payments IS 'All tenant payment transactions';
COMMENT ON TABLE platform_commissions IS 'Platform earnings from successful payments';
COMMENT ON TABLE payment_webhooks IS 'Webhook callbacks from payment providers';
