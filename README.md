# Multi-Domain Multi-Tenant Auth System

Enterprise-grade authentication and authorization system supporting multiple SaaS applications with organization-based multi-tenancy and role-based access control (RBAC).

## 🎯 Features

- **Multi-Domain Support**: Single auth service for multiple SaaS products
- **Multi-Tenancy**: Organization-based tenant isolation
- **RBAC**: Fine-grained role and permission system
- **JWT Authentication**: Stateless authentication with refresh tokens
- **Context Switching**: Users can switch between tenants seamlessly
- **SSO Ready**: Single sign-on across all your applications
- **Audit Logging**: Complete audit trail of all actions
- **Type-Safe**: Built with TypeScript

## 🏗️ Architecture

```
┌─────────────────────────────────────────┐
│   Auth Service (auth.yourdomain.com)    │
│                                         │
│  ├── OAuth 2.0 / JWT                   │
│  ├── User Management                   │
│  ├── Role & Permission Management      │
│  └── Multi-Tenant Context              │
└─────────────────────────────────────────┘
            │
            │ JWT Tokens
            ▼
┌───────────────────────────────────────────┐
│         Your Applications                 │
│                                           │
│  CRM (crm.com)        Analytics           │
│  ├── Firma A          ├── Firma C        │
│  └── Firma B          └── Firma D        │
└───────────────────────────────────────────┘
```

## 📊 Data Hierarchy

```
User (Global)
 │
 ├── Domain 1 (CRM)
 │   ├── Tenant A (Firma A)
 │   │   └── Role: Admin
 │   └── Tenant B (Firma B)
 │       └── Role: Sales
 │
 └── Domain 2 (Analytics)
     └── Tenant C (Firma C)
         └── Role: Viewer
```

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- PostgreSQL 14+
- Docker & Docker Compose (optional)

### 1. Installation

```bash
# Clone repository
git clone <repo-url>
cd oauth

# Install dependencies
npm install
cd auth-service && npm install
```

### 2. Setup Database

#### Using Docker Compose (Recommended)

```bash
# Start PostgreSQL
docker-compose up -d postgres

# Wait for PostgreSQL to be ready
sleep 5

# Create database and run migrations
npm run db:setup
```

#### Manual Setup

```bash
# Create database
createdb auth_system

# Run schema
psql -d auth_system -f database/schema.sql

# Run seed data (optional, for testing)
psql -d auth_system -f database/seed.sql
```

### 3. Environment Configuration

```bash
# Copy example environment
cp auth-service/.env.example auth-service/.env

# Edit .env file with your settings
nano auth-service/.env
```

### 4. Start Development Server

```bash
# From auth-service directory
cd auth-service
npm run dev

# Or from root
npm run dev:auth
```

Server will start on `http://localhost:3000`

## 📡 API Endpoints

### Authentication

#### Register
```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "first_name": "John",
  "last_name": "Doe"
}
```

#### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "ahmet@example.com",
  "password": "Test123!",
  "domain": "crm.localhost:3001"  // Optional: filter by domain
}
```

**Response:**
```json
{
  "message": "Login successful",
  "user": {
    "id": "uuid",
    "email": "ahmet@example.com",
    "first_name": "Ahmet"
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

#### Select Context (if multiple contexts available)
```http
POST /api/auth/select-context
Authorization: Bearer <token>
Content-Type: application/json

{
  "domain_id": "domain-uuid",
  "tenant_id": "tenant-uuid"
}
```

#### Switch Context (change tenant)
```http
POST /api/auth/switch-context
Authorization: Bearer <token>
Content-Type: application/json

{
  "tenant_id": "tenant-uuid"
}
```

#### Get My Contexts
```http
GET /api/auth/my-contexts
Authorization: Bearer <token>
```

#### Refresh Token
```http
POST /api/auth/refresh
Content-Type: application/json

{
  "refresh_token": "your-refresh-token"
}
```

#### Get Current User
```http
GET /api/auth/me
Authorization: Bearer <token>
```

#### Logout
```http
POST /api/auth/logout
Content-Type: application/json

{
  "refresh_token": "your-refresh-token"
}
```

## 🔐 JWT Token Structure

```json
{
  "sub": "user-uuid",
  "email": "user@example.com",
  "contexts": [
    {
      "domain": "crm.localhost:3001",
      "domain_id": "domain-uuid",
      "domain_name": "CRM System",
      "tenants": [
        {
          "tenant_id": "tenant-uuid",
          "tenant_name": "Firma A",
          "tenant_slug": "firma-a",
          "roles": ["admin"],
          "permissions": ["users-create", "users-read", ...]
        }
      ]
    }
  ],
  "current_context": {
    "domain_id": "domain-uuid",
    "tenant_id": "tenant-uuid"
  },
  "iat": 1234567890,
  "exp": 1234571490
}
```

## 🧪 Test Data

After running seed data, you can use these test accounts:

| Email | Password | Access |
|-------|----------|--------|
| ahmet@example.com | Test123! | CRM (Firma A: Admin, Firma B: Sales), Analytics (Firma C: Viewer) |
| mehmet@example.com | Test123! | CRM (Firma B: Manager) |
| ayse@example.com | Test123! | CRM (Firma A: Sales), Analytics (Firma C: Analyst) |
| admin@example.com | Test123! | Super Admin (All) |

## 🎨 Usage Flow

### Scenario 1: User with Single Domain Access

```
1. User visits crm.localhost:3001
2. Clicks "Login"
3. Enters email/password
4. System detects domain from URL (crm.localhost:3001)
5. Login successful → User gets JWT token
6. Redirected to CRM dashboard
7. If user has multiple tenants, dropdown shows: [Firma A ▼]
```

### Scenario 2: User with Multiple Domain Access

```
1. User visits crm.localhost:3001
2. Logs in → Gets token with CRM context
3. Works in Firma A
4. Wants to switch to Analytics
5. Clicks "Apps" → "Analytics" in navbar
6. Redirected to analytics.localhost:3002
7. Token is still valid (same auth service)
8. Analytics validates token, shows Firma C context
```

### Scenario 3: Tenant Switching

```
1. User working in CRM / Firma A
2. Dropdown shows: [Firma A ▼]
3. Clicks dropdown → Shows "Firma B"
4. Selects Firma B
5. Frontend calls /api/auth/switch-context
6. New token generated with Firma B context
7. Page refreshes with Firma B data
```

## 🔧 Project Structure

```
oauth/
├── auth-service/              # Central authentication service
│   ├── src/
│   │   ├── config/           # Configuration files
│   │   ├── controllers/      # Route controllers
│   │   ├── middleware/       # Express middleware
│   │   ├── routes/           # API routes
│   │   ├── services/         # Business logic
│   │   ├── types/            # TypeScript types
│   │   ├── utils/            # Utility functions
│   │   └── index.ts          # Entry point
│   ├── package.json
│   └── tsconfig.json
│
├── client-library/           # Client library for apps (TODO)
├── example-crm/             # Example CRM app (TODO)
├── example-analytics/       # Example Analytics app (TODO)
│
├── database/
│   ├── schema.sql           # Database schema
│   └── seed.sql             # Test data
│
├── docker-compose.yml
├── package.json
└── README.md
```

## 🛠️ Development

### Run Tests
```bash
# TODO: Add tests
npm test
```

### Build for Production
```bash
cd auth-service
npm run build

# Start production server
npm start
```

### Database Migrations
```bash
# TODO: Add migration system
npm run db:migrate
```

## 🚢 Deployment

### Docker

```bash
# Build and run all services
docker-compose up -d

# View logs
docker-compose logs -f auth-service

# Stop services
docker-compose down
```

### Environment Variables

Required environment variables for production:

```bash
NODE_ENV=production
PORT=3000

DB_HOST=your-postgres-host
DB_PORT=5432
DB_NAME=auth_system
DB_USER=your-db-user
DB_PASSWORD=your-db-password

JWT_SECRET=your-very-long-and-secure-secret-key
JWT_EXPIRES_IN=24h
JWT_REFRESH_EXPIRES_IN=7d

ALLOWED_ORIGINS=https://crm.yourdomain.com,https://analytics.yourdomain.com
```

## 🔒 Security Best Practices

1. **JWT Secret**: Use a strong, random secret (at least 256 bits)
2. **HTTPS**: Always use HTTPS in production
3. **Password Policy**: Enforce strong passwords (implemented)
4. **Token Expiry**: Keep access tokens short-lived (24h default)
5. **Refresh Tokens**: Store securely, revoke on logout
6. **CORS**: Configure allowed origins properly
7. **Rate Limiting**: Add rate limiting for auth endpoints (TODO)
8. **Audit Logs**: Monitor audit logs for suspicious activity

## 📝 Status

### ✅ Completed Features

- [x] **Multi-Organization Architecture**: Organizations → Domains → Tenants → Users hierarchy
- [x] **Subscription Management**: Trial, Starter, Business, Enterprise plans with usage limits
- [x] **Admin Dashboard**: Full-featured React admin panel with:
  - Organization management
  - Domain CRUD operations
  - Analytics with charts (Recharts)
  - Settings page (General, Email, Security, System)
  - User invitation system
  - Plan upgrade modal
- [x] **Email Notifications**: Welcome emails, plan upgrades, usage warnings, trial expiry, monthly reports
- [x] **Usage Tracking**: API call logging and limit enforcement
- [x] **Docker Setup**: Complete containerization with PostgreSQL, Auth Service, Admin Dashboard
- [x] **RBAC System**: Role-Based Access Control with granular permissions
- [x] **JWT Authentication**: Stateless auth with refresh tokens
- [x] **Multi-Tenant Context**: Users can switch between tenants seamlessly

### 🚧 In Progress / TODO

- [ ] Domain and Tenant management APIs (backend CRUD endpoints)
- [ ] Client library for easy integration
- [ ] Example CRM project
- [ ] Example Analytics project
- [ ] Rate limiting (auth endpoints)
- [ ] Email verification
- [ ] Password reset flow
- [ ] OAuth 2.0 providers (Google, GitHub)
- [ ] API documentation (Swagger/OpenAPI)
- [ ] Unit and integration tests
- [ ] CI/CD pipeline

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details

## 💬 Support

For questions or issues, please open an issue on GitHub.

---

**Built with ❤️ for modern SaaS applications**
