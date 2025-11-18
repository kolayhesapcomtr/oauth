-- ============================================
-- TENANT SUBSCRIPTION SYSTEM
-- Allows organizations to create their own subscription plans
-- and manage tenant subscriptions independently
-- ============================================

-- ============================================
-- 1. TENANT SUBSCRIPTION PLANS
-- Each organization can create their own pricing plans for tenants
-- ============================================
CREATE TABLE IF NOT EXISTS tenant_subscription_plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    domain_id UUID REFERENCES domains(id) ON DELETE CASCADE,  -- Optional: plan can be domain-specific

    -- Plan Details
    name VARCHAR(255) NOT NULL,  -- e.g., "Free", "Pro", "Enterprise"
    slug VARCHAR(100) NOT NULL,  -- e.g., "free", "pro", "enterprise"
    description TEXT,

    -- Pricing (Organization sets their own prices)
    monthly_price DECIMAL(10,2) DEFAULT 0,
    yearly_price DECIMAL(10,2) DEFAULT 0,
    currency VARCHAR(3) DEFAULT 'USD',

    -- Tenant Limits (How much resources tenant gets)
    max_users INTEGER DEFAULT 10,
    max_storage_gb DECIMAL(10,2) DEFAULT 1,
    max_api_calls_per_month INTEGER DEFAULT 10000,
    max_custom_fields INTEGER DEFAULT 5,

    -- Features (What features tenant gets)
    features JSONB DEFAULT '{}',
    -- Example features:
    -- {
    --   "custom_branding": false,
    --   "api_access": true,
    --   "advanced_analytics": false,
    --   "priority_support": false,
    --   "sso": false,
    --   "webhooks": false
    -- }

    -- Trial Settings
    has_trial BOOLEAN DEFAULT false,
    trial_days INTEGER DEFAULT 0,

    -- Display & Status
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    is_public BOOLEAN DEFAULT true,  -- Is plan visible to new tenants?

    -- Metadata
    metadata JSONB DEFAULT '{}',

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    -- Ensure unique slug per organization
    UNIQUE(organization_id, slug)
);

CREATE INDEX idx_tenant_plans_org_id ON tenant_subscription_plans(organization_id);
CREATE INDEX idx_tenant_plans_domain_id ON tenant_subscription_plans(domain_id);
CREATE INDEX idx_tenant_plans_is_active ON tenant_subscription_plans(is_active, is_public);

-- ============================================
-- 2. UPDATE TENANTS TABLE
-- Add subscription information to tenants
-- ============================================
ALTER TABLE tenants
    ADD COLUMN IF NOT EXISTS subscription_plan_id UUID REFERENCES tenant_subscription_plans(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS subscription_status VARCHAR(50) DEFAULT 'active',
    -- Statuses: 'trial', 'active', 'cancelled', 'suspended', 'past_due'

    ADD COLUMN IF NOT EXISTS subscription_starts_at TIMESTAMP,
    ADD COLUMN IF NOT EXISTS subscription_ends_at TIMESTAMP,
    ADD COLUMN IF NOT EXISTS trial_starts_at TIMESTAMP,
    ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMP,

    -- Billing (if organization wants to collect payment)
    ADD COLUMN IF NOT EXISTS stripe_customer_id VARCHAR(255),
    ADD COLUMN IF NOT EXISTS stripe_subscription_id VARCHAR(255),

    -- Usage limits from plan (cached for performance)
    ADD COLUMN IF NOT EXISTS max_users INTEGER DEFAULT -1,  -- -1 = unlimited or use plan default
    ADD COLUMN IF NOT EXISTS max_storage_gb DECIMAL(10,2) DEFAULT -1,
    ADD COLUMN IF NOT EXISTS max_api_calls_per_month INTEGER DEFAULT -1;

CREATE INDEX idx_tenants_subscription_plan ON tenants(subscription_plan_id);
CREATE INDEX idx_tenants_subscription_status ON tenants(subscription_status);

-- ============================================
-- 3. TENANT USAGE TRACKING
-- Track monthly usage per tenant for billing
-- ============================================
CREATE TABLE IF NOT EXISTS tenant_usage (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,

    year INTEGER NOT NULL,
    month INTEGER NOT NULL,

    -- Current counts
    total_users INTEGER DEFAULT 0,
    total_active_users INTEGER DEFAULT 0,
    total_api_calls INTEGER DEFAULT 0,
    total_storage_gb DECIMAL(10,2) DEFAULT 0,

    -- Overage (if tenant exceeds plan limits)
    overage_users INTEGER DEFAULT 0,
    overage_api_calls INTEGER DEFAULT 0,
    overage_storage_gb DECIMAL(10,2) DEFAULT 0,

    -- Billing
    base_charge DECIMAL(10,2) DEFAULT 0,
    overage_charge DECIMAL(10,2) DEFAULT 0,
    total_charge DECIMAL(10,2) DEFAULT 0,

    -- Metadata
    metadata JSONB DEFAULT '{}',

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    UNIQUE(tenant_id, year, month)
);

CREATE INDEX idx_tenant_usage_tenant_date ON tenant_usage(tenant_id, year, month);
CREATE INDEX idx_tenant_usage_date ON tenant_usage(year, month);

-- ============================================
-- 4. TENANT SUBSCRIPTION HISTORY
-- Track subscription changes over time
-- ============================================
CREATE TABLE IF NOT EXISTS tenant_subscription_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,

    -- Change details
    action VARCHAR(50) NOT NULL,  -- 'created', 'upgraded', 'downgraded', 'cancelled', 'renewed'
    from_plan_id UUID REFERENCES tenant_subscription_plans(id) ON DELETE SET NULL,
    to_plan_id UUID REFERENCES tenant_subscription_plans(id) ON DELETE SET NULL,

    -- Actor (who made the change)
    actor_user_id UUID REFERENCES users(id) ON DELETE SET NULL,

    -- Pricing at time of change
    monthly_price DECIMAL(10,2),
    yearly_price DECIMAL(10,2),

    -- Metadata
    metadata JSONB DEFAULT '{}',

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_tenant_sub_history_tenant ON tenant_subscription_history(tenant_id, created_at DESC);

-- ============================================
-- 5. DEFAULT PLANS FOR EXISTING ORGANIZATIONS
-- Create a default "Free" plan for each organization
-- ============================================
INSERT INTO tenant_subscription_plans (
    organization_id,
    name,
    slug,
    description,
    monthly_price,
    yearly_price,
    max_users,
    max_storage_gb,
    max_api_calls_per_month,
    max_custom_fields,
    features,
    has_trial,
    trial_days,
    display_order,
    is_active,
    is_public
)
SELECT
    id as organization_id,
    'Free' as name,
    'free' as slug,
    'Ücretsiz başlangıç planı' as description,
    0 as monthly_price,
    0 as yearly_price,
    10 as max_users,
    1 as max_storage_gb,
    10000 as max_api_calls_per_month,
    5 as max_custom_fields,
    '{"custom_branding": false, "api_access": true, "advanced_analytics": false, "priority_support": false}'::jsonb as features,
    false as has_trial,
    0 as trial_days,
    0 as display_order,
    true as is_active,
    true as is_public
FROM organizations
WHERE is_active = true
ON CONFLICT (organization_id, slug) DO NOTHING;

-- Assign existing tenants to the Free plan
UPDATE tenants t
SET
    subscription_plan_id = (
        SELECT tsp.id
        FROM tenant_subscription_plans tsp
        JOIN domains d ON d.organization_id = tsp.organization_id
        WHERE d.id = t.domain_id
        AND tsp.slug = 'free'
        LIMIT 1
    ),
    subscription_status = 'active',
    subscription_starts_at = t.created_at
WHERE subscription_plan_id IS NULL;

-- ============================================
-- 6. TRIGGERS
-- ============================================

-- Auto-update updated_at
CREATE TRIGGER update_tenant_plans_updated_at
    BEFORE UPDATE ON tenant_subscription_plans
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tenant_usage_updated_at
    BEFORE UPDATE ON tenant_usage
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Track subscription changes
CREATE OR REPLACE FUNCTION track_tenant_subscription_change()
RETURNS TRIGGER AS $$
BEGIN
    -- Only track if plan actually changed
    IF (OLD.subscription_plan_id IS DISTINCT FROM NEW.subscription_plan_id) THEN
        INSERT INTO tenant_subscription_history (
            tenant_id,
            action,
            from_plan_id,
            to_plan_id,
            metadata
        ) VALUES (
            NEW.id,
            CASE
                WHEN OLD.subscription_plan_id IS NULL THEN 'created'
                WHEN NEW.subscription_plan_id IS NULL THEN 'cancelled'
                ELSE 'upgraded'
            END,
            OLD.subscription_plan_id,
            NEW.subscription_plan_id,
            jsonb_build_object(
                'old_status', OLD.subscription_status,
                'new_status', NEW.subscription_status
            )
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER track_tenant_subscription
    AFTER UPDATE ON tenants
    FOR EACH ROW
    EXECUTE FUNCTION track_tenant_subscription_change();

-- ============================================
-- 7. FUNCTIONS
-- ============================================

-- Get current usage for a tenant
CREATE OR REPLACE FUNCTION get_tenant_current_usage(p_tenant_id UUID)
RETURNS TABLE (
    users_count INTEGER,
    active_users_count INTEGER,
    api_calls_this_month INTEGER,
    storage_gb DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        (SELECT COUNT(DISTINCT user_id)::INTEGER
         FROM user_tenant_roles
         WHERE tenant_id = p_tenant_id) as users_count,

        (SELECT COUNT(DISTINCT user_id)::INTEGER
         FROM user_tenant_roles
         WHERE tenant_id = p_tenant_id AND is_active = true) as active_users_count,

        (SELECT COUNT(*)::INTEGER
         FROM api_usage_log
         WHERE tenant_id = p_tenant_id
         AND EXTRACT(YEAR FROM created_at) = EXTRACT(YEAR FROM CURRENT_DATE)
         AND EXTRACT(MONTH FROM created_at) = EXTRACT(MONTH FROM CURRENT_DATE)) as api_calls_this_month,

        0::DECIMAL as storage_gb;  -- TODO: Implement storage tracking
END;
$$ LANGUAGE plpgsql;

-- Check if tenant can add more users
CREATE OR REPLACE FUNCTION can_tenant_add_user(p_tenant_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    v_max_users INTEGER;
    v_current_users INTEGER;
BEGIN
    -- Get tenant's max users limit
    SELECT
        COALESCE(t.max_users, tsp.max_users, -1)
    INTO v_max_users
    FROM tenants t
    LEFT JOIN tenant_subscription_plans tsp ON t.subscription_plan_id = tsp.id
    WHERE t.id = p_tenant_id;

    -- -1 means unlimited
    IF v_max_users = -1 THEN
        RETURN true;
    END IF;

    -- Count current users
    SELECT COUNT(DISTINCT user_id) INTO v_current_users
    FROM user_tenant_roles
    WHERE tenant_id = p_tenant_id AND is_active = true;

    RETURN v_current_users < v_max_users;
END;
$$ LANGUAGE plpgsql;

-- Update monthly usage for a tenant
CREATE OR REPLACE FUNCTION update_tenant_monthly_usage(p_tenant_id UUID)
RETURNS VOID AS $$
DECLARE
    v_year INTEGER := EXTRACT(YEAR FROM CURRENT_DATE);
    v_month INTEGER := EXTRACT(MONTH FROM CURRENT_DATE);
    v_usage RECORD;
    v_plan RECORD;
    v_overage_users INTEGER := 0;
    v_overage_api INTEGER := 0;
BEGIN
    -- Get current usage
    SELECT * INTO v_usage FROM get_tenant_current_usage(p_tenant_id);

    -- Get plan limits
    SELECT
        COALESCE(t.max_users, tsp.max_users, -1) as max_users,
        COALESCE(t.max_api_calls_per_month, tsp.max_api_calls_per_month, -1) as max_api_calls,
        COALESCE(tsp.monthly_price, 0) as base_price
    INTO v_plan
    FROM tenants t
    LEFT JOIN tenant_subscription_plans tsp ON t.subscription_plan_id = tsp.id
    WHERE t.id = p_tenant_id;

    -- Calculate overage
    IF v_plan.max_users > 0 AND v_usage.users_count > v_plan.max_users THEN
        v_overage_users := v_usage.users_count - v_plan.max_users;
    END IF;

    IF v_plan.max_api_calls > 0 AND v_usage.api_calls_this_month > v_plan.max_api_calls THEN
        v_overage_api := v_usage.api_calls_this_month - v_plan.max_api_calls;
    END IF;

    -- Insert or update usage
    INSERT INTO tenant_usage (
        tenant_id, year, month,
        total_users, total_active_users, total_api_calls, total_storage_gb,
        overage_users, overage_api_calls,
        base_charge, total_charge
    ) VALUES (
        p_tenant_id, v_year, v_month,
        v_usage.users_count, v_usage.active_users_count,
        v_usage.api_calls_this_month, v_usage.storage_gb,
        v_overage_users, v_overage_api,
        v_plan.base_price, v_plan.base_price  -- TODO: Add overage pricing
    )
    ON CONFLICT (tenant_id, year, month)
    DO UPDATE SET
        total_users = EXCLUDED.total_users,
        total_active_users = EXCLUDED.total_active_users,
        total_api_calls = EXCLUDED.total_api_calls,
        total_storage_gb = EXCLUDED.total_storage_gb,
        overage_users = EXCLUDED.overage_users,
        overage_api_calls = EXCLUDED.overage_api_calls,
        base_charge = EXCLUDED.base_charge,
        total_charge = EXCLUDED.total_charge,
        updated_at = CURRENT_TIMESTAMP;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 8. VIEWS
-- ============================================

-- Tenant subscription overview
CREATE OR REPLACE VIEW v_tenant_subscriptions AS
SELECT
    t.id as tenant_id,
    t.name as tenant_name,
    t.slug as tenant_slug,

    tsp.id as plan_id,
    tsp.name as plan_name,
    tsp.monthly_price,
    tsp.yearly_price,
    tsp.max_users as plan_max_users,
    tsp.max_api_calls_per_month as plan_max_api_calls,

    t.subscription_status,
    t.subscription_starts_at,
    t.subscription_ends_at,
    t.trial_ends_at,

    -- Current usage
    (SELECT COUNT(DISTINCT user_id) FROM user_tenant_roles WHERE tenant_id = t.id AND is_active = true) as current_users,

    d.name as domain_name,
    o.name as organization_name,
    o.id as organization_id
FROM tenants t
LEFT JOIN tenant_subscription_plans tsp ON t.subscription_plan_id = tsp.id
LEFT JOIN domains d ON t.domain_id = d.id
LEFT JOIN organizations o ON d.organization_id = o.id;

-- ============================================
-- COMMENTS
-- ============================================
COMMENT ON TABLE tenant_subscription_plans IS 'Subscription plans that organizations create for their tenants';
COMMENT ON TABLE tenant_usage IS 'Monthly usage tracking per tenant for billing';
COMMENT ON TABLE tenant_subscription_history IS 'Audit log of subscription changes';
COMMENT ON COLUMN tenants.subscription_plan_id IS 'Current subscription plan of the tenant';
COMMENT ON COLUMN tenants.subscription_status IS 'trial, active, cancelled, suspended, past_due';
