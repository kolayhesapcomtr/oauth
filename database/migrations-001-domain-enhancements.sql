-- ============================================
-- MIGRATION 001: Domain Enhancements
-- Adds OAuth client credentials, callback URLs, and usage tracking
-- ============================================

-- Add OAuth client credentials to domains table
ALTER TABLE domains ADD COLUMN IF NOT EXISTS client_id VARCHAR(255) UNIQUE;
ALTER TABLE domains ADD COLUMN IF NOT EXISTS client_secret VARCHAR(255);

-- Generate client_id and client_secret for existing domains
UPDATE domains
SET
    client_id = 'client_' || gen_random_uuid()::text,
    client_secret = encode(gen_random_bytes(32), 'hex')
WHERE client_id IS NULL OR client_secret IS NULL;

-- Make them NOT NULL after populating
ALTER TABLE domains ALTER COLUMN client_id SET NOT NULL;
ALTER TABLE domains ALTER COLUMN client_secret SET NOT NULL;

CREATE INDEX IF NOT EXISTS idx_domains_client_id ON domains(client_id);

-- ============================================
-- Domain Callback URLs
-- ============================================
CREATE TABLE IF NOT EXISTS domain_callback_urls (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    domain_id UUID NOT NULL REFERENCES domains(id) ON DELETE CASCADE,
    url VARCHAR(500) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_domain_callbacks_domain_id ON domain_callback_urls(domain_id);

-- Trigger for updated_at
CREATE TRIGGER update_domain_callbacks_updated_at
BEFORE UPDATE ON domain_callback_urls
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- API Usage Logs
-- ============================================
CREATE TABLE IF NOT EXISTS api_usage_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    domain_id UUID REFERENCES domains(id) ON DELETE CASCADE,
    endpoint VARCHAR(255) NOT NULL,
    method VARCHAR(10) NOT NULL,
    status_code INTEGER,
    response_time_ms INTEGER,
    user_agent TEXT,
    ip_address VARCHAR(45),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_api_usage_organization_id ON api_usage_logs(organization_id);
CREATE INDEX IF NOT EXISTS idx_api_usage_domain_id ON api_usage_logs(domain_id);
CREATE INDEX IF NOT EXISTS idx_api_usage_created_at ON api_usage_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_api_usage_endpoint ON api_usage_logs(endpoint);

-- ============================================
-- COMMENTS
-- ============================================
COMMENT ON COLUMN domains.client_id IS 'OAuth 2.0 client identifier';
COMMENT ON COLUMN domains.client_secret IS 'OAuth 2.0 client secret (should be kept secure)';
COMMENT ON TABLE domain_callback_urls IS 'Allowed redirect URIs for OAuth 2.0 authorization code flow';
COMMENT ON TABLE api_usage_logs IS 'Track all API calls for usage monitoring, billing, and analytics';
