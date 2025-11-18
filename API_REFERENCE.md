# API Reference

Complete API documentation for Multi-Domain Multi-Tenant Auth System.

**Base URL:** `http://localhost:3000/api`

## Authentication

All management endpoints require authentication via JWT token:

```
Authorization: Bearer YOUR_JWT_TOKEN
```

---

## 📑 Table of Contents

- [Auth Endpoints](#auth-endpoints)
- [Domain Management](#domain-management)
- [Tenant Management](#tenant-management)
- [Role Management](#role-management)
- [Permission Management](#permission-management)
- [User Management](#user-management)

---

## Auth Endpoints

### POST /auth/register

Register a new user.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "first_name": "John",
  "last_name": "Doe"
}
```

**Response:** `201 Created`
```json
{
  "message": "User registered successfully",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "first_name": "John",
    "last_name": "Doe"
  }
}
```

---

### POST /auth/login

Login and get JWT token.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "domain": "crm.localhost:3001"  // Optional: filter by domain
}
```

**Response:** `200 OK`
```json
{
  "message": "Login successful",
  "user": {
    "id": "uuid",
    "email": "user@example.com"
  },
  "available_contexts": [
    {
      "domain_id": "uuid",
      "domain_name": "CRM System",
      "domain_url": "crm.localhost:3001",
      "tenants": [
        {
          "tenant_id": "uuid",
          "tenant_name": "Firma A",
          "role": "Admin"
        }
      ]
    }
  ],
  "token": "jwt-token",
  "refresh_token": "refresh-token",
  "needs_context_selection": false
}
```

---

### POST /auth/select-context

Select domain and tenant context (if multiple available).

**Headers:** `Authorization: Bearer TOKEN`

**Request:**
```json
{
  "domain_id": "uuid",
  "tenant_id": "uuid"
}
```

**Response:** `200 OK`
```json
{
  "message": "Context selected",
  "token": "new-jwt-token",
  "refresh_token": "new-refresh-token"
}
```

---

### POST /auth/switch-context

Switch to different tenant within same domain.

**Headers:** `Authorization: Bearer TOKEN`

**Request:**
```json
{
  "tenant_id": "uuid"
}
```

**Response:** `200 OK`
```json
{
  "message": "Context switched",
  "token": "new-jwt-token"
}
```

---

### GET /auth/my-contexts

Get all available contexts for current user.

**Headers:** `Authorization: Bearer TOKEN`

**Response:** `200 OK`
```json
{
  "contexts": [
    {
      "domain": "crm.localhost:3001",
      "domain_id": "uuid",
      "domain_name": "CRM System",
      "tenants": [...]
    }
  ],
  "current_context": {
    "domain_id": "uuid",
    "tenant_id": "uuid"
  }
}
```

---

### POST /auth/refresh

Refresh access token.

**Request:**
```json
{
  "refresh_token": "your-refresh-token"
}
```

**Response:** `200 OK`
```json
{
  "message": "Token refreshed",
  "token": "new-jwt-token"
}
```

---

### POST /auth/logout

Logout and revoke refresh token.

**Request:**
```json
{
  "refresh_token": "your-refresh-token"
}
```

**Response:** `200 OK`
```json
{
  "message": "Logged out successfully"
}
```

---

### GET /auth/me

Get current user info.

**Headers:** `Authorization: Bearer TOKEN`

**Response:** `200 OK`
```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com"
  },
  "contexts": [...],
  "current_context": {...}
}
```

---

## Domain Management

### GET /domains

List all domains.

**Headers:** `Authorization: Bearer TOKEN`

**Response:** `200 OK`
```json
{
  "domains": [
    {
      "id": "uuid",
      "name": "CRM System",
      "slug": "crm",
      "domain": "crm.localhost:3001",
      "is_active": true
    }
  ]
}
```

---

### GET /domains/:id

Get domain by ID.

**Headers:** `Authorization: Bearer TOKEN`

**Response:** `200 OK`
```json
{
  "domain": {
    "id": "uuid",
    "name": "CRM System",
    "slug": "crm",
    "domain": "crm.localhost:3001",
    "description": "Customer Relationship Management",
    "is_active": true
  }
}
```

---

### GET /domains/:id/stats

Get domain statistics.

**Headers:** `Authorization: Bearer TOKEN`

**Response:** `200 OK`
```json
{
  "domain": {...},
  "stats": {
    "total_tenants": 10,
    "active_tenants": 8,
    "total_users": 45,
    "total_roles": 5,
    "total_permissions": 20
  }
}
```

---

### POST /domains

Create new domain.

**Headers:** `Authorization: Bearer TOKEN`

**Request:**
```json
{
  "name": "Inventory System",
  "slug": "inventory",
  "domain": "inventory.localhost:3003",
  "description": "Inventory management system",
  "logo_url": "https://example.com/logo.png",
  "settings": {
    "theme": "blue",
    "features": ["export", "import"]
  }
}
```

**Response:** `201 Created`
```json
{
  "message": "Domain created successfully",
  "domain": {...}
}
```

---

### PUT /domains/:id

Update domain.

**Headers:** `Authorization: Bearer TOKEN`

**Request:**
```json
{
  "name": "Updated Name",
  "is_active": true
}
```

**Response:** `200 OK`
```json
{
  "message": "Domain updated successfully",
  "domain": {...}
}
```

---

### DELETE /domains/:id

Delete domain.

**Headers:** `Authorization: Bearer TOKEN`

**Response:** `200 OK`
```json
{
  "message": "Domain deleted successfully"
}
```

---

## Tenant Management

### GET /tenants

List tenants (optionally filtered by domain_id).

**Headers:** `Authorization: Bearer TOKEN`

**Query params:**
- `domain_id` (optional): Filter by domain

**Response:** `200 OK`
```json
{
  "tenants": [
    {
      "id": "uuid",
      "domain_id": "uuid",
      "name": "Firma A",
      "slug": "firma-a",
      "is_active": true
    }
  ]
}
```

---

### GET /tenants/:id

Get tenant by ID.

---

### GET /tenants/:id/stats

Get tenant statistics.

**Response:** `200 OK`
```json
{
  "tenant": {...},
  "stats": {
    "total_users": 15,
    "active_users": 12
  }
}
```

---

### GET /tenants/:id/users

Get tenant users.

**Response:** `200 OK`
```json
{
  "users": [
    {
      "id": "uuid",
      "email": "user@example.com",
      "first_name": "John",
      "role_name": "Admin",
      "joined_at": "2025-01-01T00:00:00Z"
    }
  ]
}
```

---

### POST /tenants

Create tenant.

**Request:**
```json
{
  "domain_id": "uuid",
  "name": "New Company",
  "slug": "new-company",
  "description": "Company description"
}
```

**Response:** `201 Created`

---

### PUT /tenants/:id

Update tenant.

---

### DELETE /tenants/:id

Delete tenant.

---

## Role Management

### GET /roles

List roles (optionally filtered by domain_id).

**Query params:**
- `domain_id` (optional): Filter by domain

**Response:** `200 OK`
```json
{
  "roles": [
    {
      "id": "uuid",
      "domain_id": "uuid",
      "name": "Admin",
      "slug": "admin",
      "is_system": true,
      "is_active": true
    }
  ]
}
```

---

### GET /roles/:id

Get role by ID.

---

### GET /roles/:id/permissions

Get role permissions.

**Response:** `200 OK`
```json
{
  "role": {...},
  "permissions": [
    {
      "id": "uuid",
      "name": "Create Users",
      "slug": "users-create",
      "resource": "users",
      "action": "create"
    }
  ]
}
```

---

### POST /roles

Create role.

**Request:**
```json
{
  "domain_id": "uuid",
  "name": "Manager",
  "slug": "manager",
  "description": "Team manager role",
  "is_system": false
}
```

**Response:** `201 Created`

---

### PUT /roles/:id

Update role.

**Note:** Cannot modify name/slug of system roles.

---

### DELETE /roles/:id

Delete role.

**Note:** Cannot delete system roles.

---

### POST /roles/:id/permissions

Assign permissions to role (replaces all existing).

**Request:**
```json
{
  "permission_ids": [
    "uuid1",
    "uuid2",
    "uuid3"
  ]
}
```

**Response:** `200 OK`

---

### POST /roles/:id/permissions/add

Add single permission to role.

**Request:**
```json
{
  "permission_id": "uuid"
}
```

---

### DELETE /roles/:id/permissions/:permission_id

Remove permission from role.

---

## Permission Management

### GET /permissions

List permissions.

**Query params:**
- `domain_id` (optional): Filter by domain
- `resource` (optional): Filter by resource

**Response:** `200 OK`
```json
{
  "permissions": [
    {
      "id": "uuid",
      "domain_id": "uuid",
      "name": "Create Products",
      "slug": "products-create",
      "resource": "products",
      "action": "create"
    }
  ]
}
```

---

### GET /permissions/domains/:domain_id/resources

Get all unique resources for a domain.

**Response:** `200 OK`
```json
{
  "resources": [
    "products",
    "orders",
    "customers",
    "reports"
  ]
}
```

---

### GET /permissions/:id

Get permission by ID.

---

### POST /permissions

Create permission.

**Request:**
```json
{
  "domain_id": "uuid",
  "name": "Export Reports",
  "slug": "reports-export",
  "resource": "reports",
  "action": "export",
  "description": "Export reports to various formats"
}
```

**Response:** `201 Created`

---

### POST /permissions/bulk

Bulk create permissions.

**Request:**
```json
{
  "domain_id": "uuid",
  "permissions": [
    {
      "name": "Create Products",
      "slug": "products-create",
      "resource": "products",
      "action": "create"
    },
    {
      "name": "Read Products",
      "slug": "products-read",
      "resource": "products",
      "action": "read"
    }
  ]
}
```

**Response:** `201 Created`
```json
{
  "message": "2 permissions created successfully",
  "permissions": [...]
}
```

---

### PUT /permissions/:id

Update permission.

---

### DELETE /permissions/:id

Delete permission.

---

## User Management

### GET /user-management/users

List users with filters.

**Query params:**
- `domain_id` (optional)
- `tenant_id` (optional)
- `is_active` (optional): true/false
- `search` (optional): Search in email/name

**Response:** `200 OK`
```json
{
  "users": [
    {
      "id": "uuid",
      "email": "user@example.com",
      "first_name": "John",
      "last_name": "Doe",
      "is_active": true,
      "is_email_verified": true,
      "last_login_at": "2025-01-01T00:00:00Z"
    }
  ]
}
```

---

### GET /user-management/users/:user_id/access

Get all access (tenants/roles) for a user.

**Response:** `200 OK`
```json
{
  "access": [
    {
      "tenant_id": "uuid",
      "tenant_name": "Firma A",
      "domain_name": "CRM System",
      "domain_url": "crm.localhost:3001",
      "role_name": "Admin",
      "is_active": true
    }
  ]
}
```

---

### POST /user-management/users/assign

Assign user to tenant with role.

**Request:**
```json
{
  "user_id": "uuid",
  "tenant_id": "uuid",
  "role_id": "uuid"
}
```

**Response:** `201 Created`

---

### POST /user-management/users/remove

Remove user from tenant.

**Request:**
```json
{
  "user_id": "uuid",
  "tenant_id": "uuid"
}
```

---

### PUT /user-management/users/role

Update user's role in tenant.

**Request:**
```json
{
  "user_id": "uuid",
  "tenant_id": "uuid",
  "role_id": "uuid"
}
```

---

### POST /user-management/users/deactivate

Deactivate user in tenant.

**Request:**
```json
{
  "user_id": "uuid",
  "tenant_id": "uuid"
}
```

---

### POST /user-management/users/reactivate

Reactivate user in tenant.

---

## Invitation System

### POST /user-management/invitations

Create invitation.

**Request:**
```json
{
  "tenant_id": "uuid",
  "role_id": "uuid",
  "email": "newuser@example.com",
  "expires_in_days": 7
}
```

**Response:** `201 Created`
```json
{
  "message": "Invitation created successfully",
  "invitation": {
    "id": "uuid",
    "token": "invitation-token-uuid",
    "email": "newuser@example.com",
    "expires_at": "2025-01-08T00:00:00Z"
  }
}
```

---

### GET /user-management/invitations/:token

Get invitation details (public endpoint).

**Response:** `200 OK`
```json
{
  "invitation": {
    "email": "newuser@example.com",
    "tenant_name": "Firma A",
    "domain_name": "CRM System",
    "role_name": "Manager",
    "expires_at": "2025-01-08T00:00:00Z"
  }
}
```

---

### POST /user-management/invitations/:token/accept

Accept invitation (public endpoint).

**Request:**
```json
{
  "email": "newuser@example.com",
  "password": "SecurePass123!",
  "first_name": "Jane",
  "last_name": "Smith"
}
```

**Response:** `200 OK`
```json
{
  "message": "Invitation accepted successfully",
  "user": {
    "id": "uuid",
    "email": "newuser@example.com"
  }
}
```

---

### GET /user-management/tenants/:tenant_id/invitations

List invitations for tenant.

---

### DELETE /user-management/invitations/:id

Cancel invitation.

---

## Error Responses

All endpoints may return these error responses:

### 400 Bad Request
```json
{
  "error": "Validation failed",
  "details": [
    {
      "field": "email",
      "message": "Invalid email format"
    }
  ]
}
```

### 401 Unauthorized
```json
{
  "error": "No token provided"
}
```

### 403 Forbidden
```json
{
  "error": "Permission denied. Required permission: users-create"
}
```

### 404 Not Found
```json
{
  "error": "Domain not found"
}
```

### 409 Conflict
```json
{
  "error": "Domain slug already exists"
}
```

### 500 Internal Server Error
```json
{
  "error": "Failed to create domain"
}
```

---

## Rate Limiting

*TODO: Implement rate limiting*

Recommended limits:
- Auth endpoints: 10 requests/minute
- Other endpoints: 100 requests/minute

---

## Webhooks

*TODO: Implement webhooks*

Planned webhook events:
- `user.created`
- `user.assigned_to_tenant`
- `user.role_changed`
- `tenant.created`
- `domain.created`

---

## SDK Support

*TODO: Create SDKs*

Planned SDKs:
- JavaScript/TypeScript
- Python
- PHP
- Go
- Ruby

---

For integration guide, see [INTEGRATION.md](./INTEGRATION.md)
