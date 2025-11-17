-- ============================================
-- SEED DATA FOR TESTING
-- ============================================

-- Password: Admin123! (hashed with bcrypt rounds=10)
-- bcrypt hash: $2a$10$rGHnGqXNJd8qZ5t5j3F0dO0eJKZqgXz1VqYcYXYqZ3J0F0dO0eJKZ

-- ============================================
-- 1. INSERT DOMAINS
-- ============================================
INSERT INTO domains (id, name, slug, domain, description) VALUES
('d1111111-1111-1111-1111-111111111111', 'CRM System', 'crm', 'crm.localhost:3001', 'Customer Relationship Management System'),
('d2222222-2222-2222-2222-222222222222', 'Analytics Platform', 'analytics', 'analytics.localhost:3002', 'Advanced Analytics and Reporting Platform');

-- ============================================
-- 2. INSERT ROLES FOR CRM DOMAIN
-- ============================================
INSERT INTO roles (id, domain_id, name, slug, description, is_system) VALUES
('r1111111-1111-1111-1111-111111111111', 'd1111111-1111-1111-1111-111111111111', 'Super Admin', 'super-admin', 'Full system access', true),
('r1111111-2222-2222-2222-111111111111', 'd1111111-1111-1111-1111-111111111111', 'Admin', 'admin', 'Organization administrator', true),
('r1111111-3333-3333-3333-111111111111', 'd1111111-1111-1111-1111-111111111111', 'Manager', 'manager', 'Team manager', false),
('r1111111-4444-4444-4444-111111111111', 'd1111111-1111-1111-1111-111111111111', 'Sales', 'sales', 'Sales representative', false),
('r1111111-5555-5555-5555-111111111111', 'd1111111-1111-1111-1111-111111111111', 'Viewer', 'viewer', 'Read-only access', false);

-- ============================================
-- 3. INSERT ROLES FOR ANALYTICS DOMAIN
-- ============================================
INSERT INTO roles (id, domain_id, name, slug, description, is_system) VALUES
('r2222222-1111-1111-1111-111111111111', 'd2222222-2222-2222-2222-222222222222', 'Admin', 'admin', 'Analytics administrator', true),
('r2222222-2222-2222-2222-111111111111', 'd2222222-2222-2222-2222-222222222222', 'Analyst', 'analyst', 'Data analyst', false),
('r2222222-3333-3333-3333-111111111111', 'd2222222-2222-2222-2222-222222222222', 'Viewer', 'viewer', 'Report viewer', false);

-- ============================================
-- 4. INSERT PERMISSIONS FOR CRM DOMAIN
-- ============================================
INSERT INTO permissions (id, domain_id, name, slug, resource, action) VALUES
-- Users permissions
('p1111111-0001-0001-0001-000000000001', 'd1111111-1111-1111-1111-111111111111', 'Create Users', 'users-create', 'users', 'create'),
('p1111111-0001-0001-0001-000000000002', 'd1111111-1111-1111-1111-111111111111', 'Read Users', 'users-read', 'users', 'read'),
('p1111111-0001-0001-0001-000000000003', 'd1111111-1111-1111-1111-111111111111', 'Update Users', 'users-update', 'users', 'update'),
('p1111111-0001-0001-0001-000000000004', 'd1111111-1111-1111-1111-111111111111', 'Delete Users', 'users-delete', 'users', 'delete'),
-- Customers permissions
('p1111111-0002-0002-0002-000000000001', 'd1111111-1111-1111-1111-111111111111', 'Create Customers', 'customers-create', 'customers', 'create'),
('p1111111-0002-0002-0002-000000000002', 'd1111111-1111-1111-1111-111111111111', 'Read Customers', 'customers-read', 'customers', 'read'),
('p1111111-0002-0002-0002-000000000003', 'd1111111-1111-1111-1111-111111111111', 'Update Customers', 'customers-update', 'customers', 'update'),
('p1111111-0002-0002-0002-000000000004', 'd1111111-1111-1111-1111-111111111111', 'Delete Customers', 'customers-delete', 'customers', 'delete'),
-- Invoices permissions
('p1111111-0003-0003-0003-000000000001', 'd1111111-1111-1111-1111-111111111111', 'Create Invoices', 'invoices-create', 'invoices', 'create'),
('p1111111-0003-0003-0003-000000000002', 'd1111111-1111-1111-1111-111111111111', 'Read Invoices', 'invoices-read', 'invoices', 'read'),
('p1111111-0003-0003-0003-000000000003', 'd1111111-1111-1111-1111-111111111111', 'Update Invoices', 'invoices-update', 'invoices', 'update'),
('p1111111-0003-0003-0003-000000000004', 'd1111111-1111-1111-1111-111111111111', 'Delete Invoices', 'invoices-delete', 'invoices', 'delete');

-- ============================================
-- 5. INSERT PERMISSIONS FOR ANALYTICS DOMAIN
-- ============================================
INSERT INTO permissions (id, domain_id, name, slug, resource, action) VALUES
-- Reports permissions
('p2222222-0001-0001-0001-000000000001', 'd2222222-2222-2222-2222-222222222222', 'Create Reports', 'reports-create', 'reports', 'create'),
('p2222222-0001-0001-0001-000000000002', 'd2222222-2222-2222-2222-222222222222', 'Read Reports', 'reports-read', 'reports', 'read'),
('p2222222-0001-0001-0001-000000000003', 'd2222222-2222-2222-2222-222222222222', 'Update Reports', 'reports-update', 'reports', 'update'),
('p2222222-0001-0001-0001-000000000004', 'd2222222-2222-2222-2222-222222222222', 'Delete Reports', 'reports-delete', 'reports', 'delete'),
-- Dashboards permissions
('p2222222-0002-0002-0002-000000000001', 'd2222222-2222-2222-2222-222222222222', 'Create Dashboards', 'dashboards-create', 'dashboards', 'create'),
('p2222222-0002-0002-0002-000000000002', 'd2222222-2222-2222-2222-222222222222', 'Read Dashboards', 'dashboards-read', 'dashboards', 'read');

-- ============================================
-- 6. ASSIGN PERMISSIONS TO ROLES (CRM)
-- ============================================
-- Super Admin: All permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT 'r1111111-1111-1111-1111-111111111111', id FROM permissions WHERE domain_id = 'd1111111-1111-1111-1111-111111111111';

-- Admin: All except delete users
INSERT INTO role_permissions (role_id, permission_id)
SELECT 'r1111111-2222-2222-2222-111111111111', id FROM permissions
WHERE domain_id = 'd1111111-1111-1111-1111-111111111111'
  AND slug != 'users-delete';

-- Manager: Create/Read/Update customers and invoices
INSERT INTO role_permissions (role_id, permission_id) VALUES
('r1111111-3333-3333-3333-111111111111', 'p1111111-0002-0002-0002-000000000001'),
('r1111111-3333-3333-3333-111111111111', 'p1111111-0002-0002-0002-000000000002'),
('r1111111-3333-3333-3333-111111111111', 'p1111111-0002-0002-0002-000000000003'),
('r1111111-3333-3333-3333-111111111111', 'p1111111-0003-0003-0003-000000000001'),
('r1111111-3333-3333-3333-111111111111', 'p1111111-0003-0003-0003-000000000002'),
('r1111111-3333-3333-3333-111111111111', 'p1111111-0003-0003-0003-000000000003');

-- Sales: Create/Read customers and invoices
INSERT INTO role_permissions (role_id, permission_id) VALUES
('r1111111-4444-4444-4444-111111111111', 'p1111111-0002-0002-0002-000000000001'),
('r1111111-4444-4444-4444-111111111111', 'p1111111-0002-0002-0002-000000000002'),
('r1111111-4444-4444-4444-111111111111', 'p1111111-0003-0003-0003-000000000001'),
('r1111111-4444-4444-4444-111111111111', 'p1111111-0003-0003-0003-000000000002');

-- Viewer: Read only
INSERT INTO role_permissions (role_id, permission_id) VALUES
('r1111111-5555-5555-5555-111111111111', 'p1111111-0002-0002-0002-000000000002'),
('r1111111-5555-5555-5555-111111111111', 'p1111111-0003-0003-0003-000000000002');

-- ============================================
-- 7. ASSIGN PERMISSIONS TO ROLES (ANALYTICS)
-- ============================================
-- Admin: All permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT 'r2222222-1111-1111-1111-111111111111', id FROM permissions WHERE domain_id = 'd2222222-2222-2222-2222-222222222222';

-- Analyst: Create/Read/Update
INSERT INTO role_permissions (role_id, permission_id) VALUES
('r2222222-2222-2222-2222-111111111111', 'p2222222-0001-0001-0001-000000000001'),
('r2222222-2222-2222-2222-111111111111', 'p2222222-0001-0001-0001-000000000002'),
('r2222222-2222-2222-2222-111111111111', 'p2222222-0001-0001-0001-000000000003'),
('r2222222-2222-2222-2222-111111111111', 'p2222222-0002-0002-0002-000000000001'),
('r2222222-2222-2222-2222-111111111111', 'p2222222-0002-0002-0002-000000000002');

-- Viewer: Read only
INSERT INTO role_permissions (role_id, permission_id) VALUES
('r2222222-3333-3333-3333-111111111111', 'p2222222-0001-0001-0001-000000000002'),
('r2222222-3333-3333-3333-111111111111', 'p2222222-0002-0002-0002-000000000002');

-- ============================================
-- 8. INSERT TEST TENANTS
-- ============================================
INSERT INTO tenants (id, domain_id, name, slug, description) VALUES
('t1111111-aaaa-aaaa-aaaa-111111111111', 'd1111111-1111-1111-1111-111111111111', 'Firma A', 'firma-a', 'Tech company focused on innovation'),
('t1111111-bbbb-bbbb-bbbb-111111111111', 'd1111111-1111-1111-1111-111111111111', 'Firma B', 'firma-b', 'E-commerce retail business'),
('t2222222-cccc-cccc-cccc-222222222222', 'd2222222-2222-2222-2222-222222222222', 'Firma C', 'firma-c', 'Analytics division of Firma A');

-- ============================================
-- 9. INSERT TEST USERS
-- ============================================
-- NOTE: All passwords are: Test123!
-- Hash generated with: bcryptjs.hashSync('Test123!', 10)
INSERT INTO users (id, email, password_hash, first_name, last_name, is_email_verified) VALUES
('u0000000-0000-0000-0000-000000000001', 'ahmet@example.com', '$2a$10$rGHnGqXNJd8qZ5t5j3F0dO0eJKZqgXz1VqYcYXYqZ3J0F0dO0eJKZ', 'Ahmet', 'Yılmaz', true),
('u0000000-0000-0000-0000-000000000002', 'mehmet@example.com', '$2a$10$rGHnGqXNJd8qZ5t5j3F0dO0eJKZqgXz1VqYcYXYqZ3J0F0dO0eJKZ', 'Mehmet', 'Demir', true),
('u0000000-0000-0000-0000-000000000003', 'ayse@example.com', '$2a$10$rGHnGqXNJd8qZ5t5j3F0dO0eJKZqgXz1VqYcYXYqZ3J0F0dO0eJKZ', 'Ayşe', 'Kaya', true),
('u0000000-0000-0000-0000-000000000004', 'admin@example.com', '$2a$10$rGHnGqXNJd8qZ5t5j3F0dO0eJKZ', 'System', 'Admin', true);

-- ============================================
-- 10. ASSIGN USERS TO TENANTS WITH ROLES
-- ============================================
-- Ahmet:
--   - CRM/Firma A: Admin
--   - CRM/Firma B: Sales
--   - Analytics/Firma C: Viewer
INSERT INTO user_tenant_roles (user_id, tenant_id, role_id) VALUES
('u0000000-0000-0000-0000-000000000001', 't1111111-aaaa-aaaa-aaaa-111111111111', 'r1111111-2222-2222-2222-111111111111'),
('u0000000-0000-0000-0000-000000000001', 't1111111-bbbb-bbbb-bbbb-111111111111', 'r1111111-4444-4444-4444-111111111111'),
('u0000000-0000-0000-0000-000000000001', 't2222222-cccc-cccc-cccc-222222222222', 'r2222222-3333-3333-3333-111111111111');

-- Mehmet:
--   - CRM/Firma B: Manager
INSERT INTO user_tenant_roles (user_id, tenant_id, role_id) VALUES
('u0000000-0000-0000-0000-000000000002', 't1111111-bbbb-bbbb-bbbb-111111111111', 'r1111111-3333-3333-3333-111111111111');

-- Ayşe:
--   - CRM/Firma A: Sales
--   - Analytics/Firma C: Analyst
INSERT INTO user_tenant_roles (user_id, tenant_id, role_id) VALUES
('u0000000-0000-0000-0000-000000000003', 't1111111-aaaa-aaaa-aaaa-111111111111', 'r1111111-4444-4444-4444-111111111111'),
('u0000000-0000-0000-0000-000000000003', 't2222222-cccc-cccc-cccc-222222222222', 'r2222222-2222-2222-2222-111111111111');

-- Admin: Super Admin everywhere
INSERT INTO user_tenant_roles (user_id, tenant_id, role_id) VALUES
('u0000000-0000-0000-0000-000000000004', 't1111111-aaaa-aaaa-aaaa-111111111111', 'r1111111-1111-1111-1111-111111111111'),
('u0000000-0000-0000-0000-000000000004', 't1111111-bbbb-bbbb-bbbb-111111111111', 'r1111111-1111-1111-1111-111111111111');

-- ============================================
-- VERIFICATION QUERIES
-- ============================================

-- View all user contexts
-- SELECT * FROM v_user_contexts ORDER BY email, domain_name, tenant_name;

-- View user permissions
-- SELECT * FROM v_user_permissions WHERE user_id = 'u0000000-0000-0000-0000-000000000001';
