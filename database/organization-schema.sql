-- ============================================
-- MULTI-TENANT SAAS PLATFORM - ORGANIZATION LAYER
-- Organizations = Your customers who use your auth system
-- ============================================

-- ============================================
-- 1. ORGANIZATIONS (Super Tenant - Your Customers)
-- ============================================
CREATE TABLE organizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Basic Info
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,

    -- Owner/Contact
    owner_email VARCHAR(255) NOT NULL,
    company_name VARCHAR(255),
    contact_phone VARCHAR(50),

    -- Subscription
    plan VARCHAR(50) NOT NULL DEFAULT 'trial',  -- 'trial', 'starter', 'business', 'enterprise'
    status VARCHAR(50) NOT NULL DEFAULT 'active',  -- 'active', 'trial', 'cancelled', 'suspended', 'past_due'

    -- Plan Limits
    max_domains INTEGER NOT NULL DEFAULT 3,
    max_tenants INTEGER NOT NULL DEFAULT 50,
    max_users INTEGER NOT NULL DEFAULT 1000,
    max_api_calls_per_month INTEGER NOT NULL DEFAULT 100000,
    max_storage_gb INTEGER NOT NULL DEFAULT 10,

    -- Features (JSONB for flexibility)
    features JSONB DEFAULT '{"email_support": true, "api_access": true, "custom_domain": false, "sso": false, "white_label": false}',

    -- Billing Info
    stripe_customer_id VARCHAR(255),
    stripe_subscription_id VARCHAR(255),
    billing_email VARCHAR(255),

    -- Trial & Subscription Dates
    trial_ends_at TIMESTAMP,
    subscription_starts_at TIMESTAMP,
    subscription_ends_at TIMESTAMP,

    -- Metadata
    metadata JSONB DEFAULT '{}',

    -- Status
    is_active BOOLEAN DEFAULT true,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_organizations_slug ON organizations(slug);
CREATE INDEX idx_organizations_owner_email ON organizations(owner_email);
CREATE INDEX idx_organizations_status ON organizations(status);
CREATE INDEX idx_organizations_is_active ON organizations(is_active);

-- ============================================
-- 2. UPDATE EXISTING TABLES
-- ============================================

-- Domains now belong to organizations
ALTER TABLE domains ADD COLUMN organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;
CREATE INDEX idx_domains_organization_id ON domains(organization_id);

-- Users can be super admins (your staff) or organization admins
ALTER TABLE users ADD COLUMN is_super_admin BOOLEAN DEFAULT false;
ALTER TABLE users ADD COLUMN organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL;
CREATE INDEX idx_users_organization_id ON users(organization_id);
CREATE INDEX idx_users_is_super_admin ON users(is_super_admin);

-- ============================================
-- 3. ORGANIZATION SUBSCRIPTIONS (Detailed)
-- ============================================
CREATE TABLE organization_subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

    -- Plan Info
    plan_id VARCHAR(50) NOT NULL,
    plan_name VARCHAR(255) NOT NULL,

    -- Pricing
    amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',
    billing_cycle VARCHAR(50) NOT NULL,  -- 'monthly', 'yearly'

    -- Status
    status VARCHAR(50) NOT NULL,  -- 'active', 'cancelled', 'past_due'

    -- Stripe Info
    stripe_subscription_id VARCHAR(255),
    stripe_price_id VARCHAR(255),

    -- Dates
    current_period_start TIMESTAMP,
    current_period_end TIMESTAMP,
    cancel_at_period_end BOOLEAN DEFAULT false,
    cancelled_at TIMESTAMP,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_org_subscriptions_org_id ON organization_subscriptions(organization_id);
CREATE INDEX idx_org_subscriptions_status ON organization_subscriptions(status);

-- ============================================
-- 4. USAGE TRACKING
-- ============================================
CREATE TABLE organization_usage (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

    year INTEGER NOT NULL,
    month INTEGER NOT NULL,

    -- Current counts
    total_domains INTEGER DEFAULT 0,
    total_tenants INTEGER DEFAULT 0,
    total_users INTEGER DEFAULT 0,
    total_api_calls INTEGER DEFAULT 0,
    total_storage_gb DECIMAL(10,2) DEFAULT 0,

    -- Overage (kullanım aşımı)
    overage_users INTEGER DEFAULT 0,
    overage_api_calls INTEGER DEFAULT 0,
    overage_storage_gb DECIMAL(10,2) DEFAULT 0,

    -- Calculated at end of month
    overage_charge DECIMAL(10,2) DEFAULT 0,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    UNIQUE(organization_id, year, month)
);

CREATE INDEX idx_org_usage_org_date ON organization_usage(organization_id, year, month);

-- ============================================
-- 5. API USAGE LOG (For rate limiting & analytics)
-- ============================================
CREATE TABLE api_usage_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,

    -- Request Info
    endpoint VARCHAR(500),
    method VARCHAR(10),
    status_code INTEGER,
    response_time_ms INTEGER,

    -- Context
    domain_id UUID REFERENCES domains(id) ON DELETE SET NULL,
    tenant_id UUID REFERENCES tenants(id) ON DELETE SET NULL,

    -- IP & User Agent
    ip_address INET,
    user_agent TEXT,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Partitioning by month for performance
CREATE INDEX idx_api_usage_org_created ON api_usage_log(organization_id, created_at DESC);
CREATE INDEX idx_api_usage_created ON api_usage_log(created_at DESC);

-- ============================================
-- 6. INVOICES
-- ============================================
CREATE TABLE invoices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

    -- Invoice Info
    invoice_number VARCHAR(50) UNIQUE NOT NULL,

    -- Amounts
    subtotal DECIMAL(10,2) NOT NULL,
    tax DECIMAL(10,2) DEFAULT 0,
    total DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',

    -- Period
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,

    -- Status
    status VARCHAR(50) NOT NULL,  -- 'draft', 'open', 'paid', 'void', 'uncollectible'

    -- Payment
    stripe_invoice_id VARCHAR(255),
    paid_at TIMESTAMP,
    due_date DATE,

    -- Line items (JSON)
    line_items JSONB DEFAULT '[]',

    -- PDF
    pdf_url VARCHAR(500),

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_invoices_org_id ON invoices(organization_id);
CREATE INDEX idx_invoices_status ON invoices(status);
CREATE INDEX idx_invoices_period ON invoices(period_start, period_end);

-- ============================================
-- 7. ORGANIZATION EVENTS (Audit Log)
-- ============================================
CREATE TABLE organization_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,

    event_type VARCHAR(100) NOT NULL,  -- 'subscription.created', 'plan.upgraded', 'limit.exceeded'

    -- Actor (who did it)
    actor_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    actor_type VARCHAR(50),  -- 'user', 'system', 'stripe'

    -- Event data
    metadata JSONB DEFAULT '{}',

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_org_events_org_id ON organization_events(organization_id, created_at DESC);
CREATE INDEX idx_org_events_type ON organization_events(event_type);

-- ============================================
-- 8. PLAN DEFINITIONS (Reference table)
-- ============================================
CREATE TABLE subscription_plans (
    id VARCHAR(50) PRIMARY KEY,  -- 'starter', 'business', 'enterprise'
    name VARCHAR(255) NOT NULL,
    description TEXT,

    -- Pricing
    monthly_price DECIMAL(10,2),
    yearly_price DECIMAL(10,2),

    -- Limits
    max_domains INTEGER NOT NULL,
    max_tenants INTEGER NOT NULL,
    max_users INTEGER NOT NULL,
    max_api_calls_per_month INTEGER NOT NULL,
    max_storage_gb INTEGER NOT NULL,

    -- Features
    features JSONB NOT NULL,

    -- Stripe IDs
    stripe_monthly_price_id VARCHAR(255),
    stripe_yearly_price_id VARCHAR(255),

    -- Display
    display_order INTEGER DEFAULT 0,
    is_visible BOOLEAN DEFAULT true,
    is_custom BOOLEAN DEFAULT false,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert default plans
INSERT INTO subscription_plans (id, name, description, monthly_price, yearly_price, max_domains, max_tenants, max_users, max_api_calls_per_month, max_storage_gb, features, display_order) VALUES
('trial', 'Free Trial', '14-day free trial', 0, 0, 1, 10, 100, 10000, 1, '{"email_support": true, "api_access": true, "custom_domain": false, "sso": false, "white_label": false, "priority_support": false}', 0),
('starter', 'Starter', 'Perfect for small teams', 299, 2990, 3, 50, 1000, 100000, 10, '{"email_support": true, "api_access": true, "custom_domain": false, "sso": false, "white_label": false, "priority_support": false}', 1),
('business', 'Business', 'For growing companies', 999, 9990, 10, 200, 10000, 1000000, 100, '{"email_support": true, "api_access": true, "custom_domain": true, "sso": true, "white_label": false, "priority_support": true, "sla": "99.9%"}', 2),
('enterprise', 'Enterprise', 'Custom solution for large organizations', NULL, NULL, -1, -1, -1, -1, -1, '{"email_support": true, "api_access": true, "custom_domain": true, "sso": true, "white_label": true, "priority_support": true, "dedicated_support": true, "sla": "99.99%", "custom_features": true}', 3);

-- ============================================
-- TRIGGERS
-- ============================================

-- Auto-update updated_at
CREATE TRIGGER update_organizations_updated_at BEFORE UPDATE ON organizations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_org_subscriptions_updated_at BEFORE UPDATE ON organization_subscriptions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_org_usage_updated_at BEFORE UPDATE ON organization_usage FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_invoices_updated_at BEFORE UPDATE ON invoices FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- VIEWS
-- ============================================

-- Organization overview with current usage
CREATE OR REPLACE VIEW v_organization_overview AS
SELECT
    o.id,
    o.name,
    o.slug,
    o.plan,
    o.status,
    o.owner_email,

    -- Limits
    o.max_domains,
    o.max_tenants,
    o.max_users,
    o.max_api_calls_per_month,

    -- Current usage
    (SELECT COUNT(*) FROM domains WHERE organization_id = o.id AND is_active = true) as current_domains,
    (SELECT COUNT(*) FROM tenants t JOIN domains d ON t.domain_id = d.id WHERE d.organization_id = o.id AND t.is_active = true) as current_tenants,
    (SELECT COUNT(DISTINCT utr.user_id) FROM user_tenant_roles utr
     JOIN tenants t ON utr.tenant_id = t.id
     JOIN domains d ON t.domain_id = d.id
     WHERE d.organization_id = o.id AND utr.is_active = true) as current_users,

    -- Subscription info
    o.trial_ends_at,
    o.subscription_ends_at,

    o.created_at
FROM organizations o
WHERE o.is_active = true;

-- ============================================
-- FUNCTIONS
-- ============================================

-- Check if organization has reached limit
CREATE OR REPLACE FUNCTION check_organization_limit(
    p_organization_id UUID,
    p_limit_type VARCHAR,
    p_current_count INTEGER
) RETURNS BOOLEAN AS $$
DECLARE
    v_max_limit INTEGER;
BEGIN
    -- Get the limit for this organization
    EXECUTE format('SELECT max_%s FROM organizations WHERE id = $1', p_limit_type)
    INTO v_max_limit
    USING p_organization_id;

    -- -1 means unlimited (enterprise)
    IF v_max_limit = -1 THEN
        RETURN true;
    END IF;

    RETURN p_current_count < v_max_limit;
END;
$$ LANGUAGE plpgsql;

-- Update monthly usage
CREATE OR REPLACE FUNCTION update_monthly_usage(p_organization_id UUID) RETURNS VOID AS $$
DECLARE
    v_year INTEGER := EXTRACT(YEAR FROM CURRENT_DATE);
    v_month INTEGER := EXTRACT(MONTH FROM CURRENT_DATE);
BEGIN
    INSERT INTO organization_usage (organization_id, year, month, total_domains, total_tenants, total_users, total_api_calls)
    VALUES (
        p_organization_id,
        v_year,
        v_month,
        (SELECT COUNT(*) FROM domains WHERE organization_id = p_organization_id),
        (SELECT COUNT(*) FROM tenants t JOIN domains d ON t.domain_id = d.id WHERE d.organization_id = p_organization_id),
        (SELECT COUNT(DISTINCT utr.user_id) FROM user_tenant_roles utr
         JOIN tenants t ON utr.tenant_id = t.id
         JOIN domains d ON t.domain_id = d.id
         WHERE d.organization_id = p_organization_id),
        (SELECT COUNT(*) FROM api_usage_log WHERE organization_id = p_organization_id
         AND EXTRACT(YEAR FROM created_at) = v_year
         AND EXTRACT(MONTH FROM created_at) = v_month)
    )
    ON CONFLICT (organization_id, year, month)
    DO UPDATE SET
        total_domains = EXCLUDED.total_domains,
        total_tenants = EXCLUDED.total_tenants,
        total_users = EXCLUDED.total_users,
        total_api_calls = EXCLUDED.total_api_calls,
        updated_at = CURRENT_TIMESTAMP;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- COMMENTS
-- ============================================
COMMENT ON TABLE organizations IS 'Your customers who use your auth system as a service';
COMMENT ON TABLE organization_subscriptions IS 'Subscription details for each organization';
COMMENT ON TABLE organization_usage IS 'Monthly usage tracking for billing and analytics';
COMMENT ON TABLE api_usage_log IS 'API call logs for rate limiting and usage tracking';
COMMENT ON TABLE invoices IS 'Generated invoices for organizations';
COMMENT ON TABLE subscription_plans IS 'Available subscription plans and their limits';
