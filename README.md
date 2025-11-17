# 🔐 Multi-Tenant SaaS Authentication Platform

Enterprise-grade multi-domain multi-tenant authentication and authorization system that you can sell as a service (SaaS).

## 🌟 Overview

This is a **Multi-Tenant SaaS Platform** (Model 2 - "Inception" Architecture) where you provide authentication, role management, and subscription services to other companies.

### Architecture Hierarchy

```
🏢 Organizations (Your Customers)
  └── 🌐 Domains (Their SaaS Applications)
      └── 🏛️ Tenants (Their Customers/Clients)
          └── 👥 Users (End Users)
              └── 🔑 Roles & Permissions
```

### Example Use Case

**Your Customer:** TechCorp Inc. (subscribed to your auth service)
- **Domain 1:** crm.techcorp.com (their CRM application)
  - **Tenant 1:** Acme Corp (one of their clients)
    - Users: John, Jane, Bob
  - **Tenant 2:** XYZ Ltd
    - Users: Alice, Charlie
- **Domain 2:** analytics.techcorp.com (their Analytics application)
  - **Tenant 1:** Acme Corp
    - Users: John, Jane

## 🎯 Key Features

### 1. **Organization Management (SaaS)**
- ✅ Multi-organization support (your customers)
- ✅ Subscription plans (Trial, Starter, Business, Enterprise)
- ✅ Usage-based limits (domains, tenants, users, API calls)
- ✅ Automatic limit enforcement
- ✅ Overage tracking and billing

### 2. **Multi-Domain Multi-Tenant**
- ✅ Each organization can have multiple domains (applications)
- ✅ Each domain can have multiple tenants (clients)
- ✅ Complete data isolation between organizations and tenants
- ✅ Domain-aware authentication

### 3. **Advanced RBAC**
- ✅ Granular role and permission system
- ✅ Cross-domain and cross-tenant access
- ✅ Permission inheritance and composition

### 4. **Usage Tracking & Analytics**
- ✅ Real-time API usage tracking
- ✅ Monthly usage reports
- ✅ API endpoint analytics
- ✅ Error rate monitoring
- ✅ Performance metrics
- ✅ Audit logs

### 5. **Plan Limits & Enforcement**
- ✅ Automatic limit checking before operations
- ✅ Soft limits with upgrade prompts
- ✅ Hard limits with subscription enforcement
- ✅ Feature flags per plan

### 6. **Rate Limiting**
- ✅ Organization-based rate limiting
- ✅ Configurable limits per plan
- ✅ Usage headers in API responses

## 📊 Subscription Plans

| Feature | Trial | Starter | Business | Enterprise |
|---------|-------|---------|----------|------------|
| **Price** | Free (14 days) | $299/mo | $999/mo | Custom |
| **Domains** | 1 | 3 | 10 | Unlimited |
| **Tenants** | 10 | 50 | 200 | Unlimited |
| **Users** | 100 | 1,000 | 10,000 | Unlimited |
| **API Calls/Month** | 10,000 | 100,000 | 1,000,000 | Unlimited |
| **Storage** | 1 GB | 10 GB | 100 GB | Unlimited |
| **Email Support** | ✅ | ✅ | ✅ | ✅ |
| **API Access** | ✅ | ✅ | ✅ | ✅ |
| **Custom Domain** | ❌ | ❌ | ✅ | ✅ |
| **SSO** | ❌ | ❌ | ✅ | ✅ |
| **White Label** | ❌ | ❌ | ❌ | ✅ |
| **Priority Support** | ❌ | ❌ | ✅ | ✅ |
| **SLA** | - | - | 99.9% | 99.99% |

## 🏗️ Tech Stack

- **Backend:** Node.js + TypeScript + Express
- **Database:** PostgreSQL
- **Authentication:** JWT (Access + Refresh Tokens)
- **Payment:** Stripe (ready for integration)
- **API Style:** RESTful

## 📁 Project Structure

```
oauth/
├── database/
│   ├── schema.sql                  # Core auth schema
│   ├── organization-schema.sql     # Organization/SaaS layer
│   └── seed.sql                    # Test data
│
├── auth-service/
│   ├── src/
│   │   ├── config/
│   │   │   └── database.ts
│   │   │
│   │   ├── middleware/
│   │   │   ├── auth.middleware.ts              # JWT auth
│   │   │   ├── limit-enforcement.middleware.ts # Plan limits
│   │   │   └── usage-tracking.middleware.ts    # Usage logging
│   │   │
│   │   ├── services/
│   │   │   ├── organization.service.ts         # Organization CRUD
│   │   │   ├── domain.service.ts               # Domain management
│   │   │   └── analytics.service.ts            # Usage analytics
│   │   │
│   │   ├── controllers/
│   │   │   ├── organization.controller.ts
│   │   │   ├── domain.controller.ts
│   │   │   └── analytics.controller.ts
│   │   │
│   │   ├── routes/
│   │   │   ├── organization.routes.ts
│   │   │   ├── domain.routes.ts
│   │   │   ├── analytics.routes.ts
│   │   │   └── index.ts
│   │   │
│   │   └── index.ts                            # Main server
│   │
│   ├── package.json
│   └── tsconfig.json
│
└── README.md
```

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL 14+
- npm or yarn

### Installation

1. **Clone the repository**

```bash
git clone <repository-url>
cd oauth
```

2. **Install dependencies**

```bash
cd auth-service
npm install
```

3. **Setup environment variables**

```bash
cp .env.example .env
```

Edit `.env` with your configuration:

```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=oauth_db
DB_USER=postgres
DB_PASSWORD=your-password

# JWT
JWT_SECRET=your-super-secret-key
JWT_REFRESH_SECRET=your-refresh-secret-key

# Server
PORT=3000
NODE_ENV=development
```

4. **Setup database**

```bash
# Create database
createdb oauth_db

# Run migrations
psql oauth_db < ../database/schema.sql
psql oauth_db < ../database/organization-schema.sql

# (Optional) Load test data
psql oauth_db < ../database/seed.sql
```

5. **Start the server**

```bash
# Development
npm run dev

# Production
npm run build
npm start
```

The API will be available at `http://localhost:3000`

## 📚 API Documentation

### Authentication

All protected endpoints require a Bearer token:

```
Authorization: Bearer <your-jwt-token>
```

### Core Endpoints

#### **Organizations**

```
POST   /api/organizations              # Create organization (signup)
GET    /api/organizations              # List all organizations (super admin)
GET    /api/organizations/:id          # Get organization details
PUT    /api/organizations/:id          # Update organization
GET    /api/organizations/:id/usage    # Get current usage
GET    /api/organizations/:id/stats    # Get detailed statistics
PUT    /api/organizations/:id/plan     # Change subscription plan
DELETE /api/organizations/:id          # Deactivate organization

GET    /api/organizations/plans        # Get all available plans
GET    /api/organizations/slug/:slug   # Get organization by slug
```

#### **Domains**

```
POST   /api/domains                    # Create domain (with limit check)
GET    /api/domains                    # Get all domains for organization
GET    /api/domains/:id                # Get domain details
PUT    /api/domains/:id                # Update domain
DELETE /api/domains/:id                # Delete domain
GET    /api/domains/:id/stats          # Get domain statistics
```

#### **Analytics**

```
# Usage Reports
GET    /api/analytics/usage/monthly              # Monthly usage report
GET    /api/analytics/usage/trend                # Usage trend (last N months)
GET    /api/analytics/overage                    # Calculate current overage

# API Usage Analytics
GET    /api/analytics/api-usage/breakdown        # Usage by endpoint
GET    /api/analytics/api-usage/by-user          # Usage by user
GET    /api/analytics/api-usage/daily            # Daily usage stats
GET    /api/analytics/api-usage/hourly-pattern   # Hourly usage pattern

# Performance & Errors
GET    /api/analytics/errors                     # Error statistics
GET    /api/analytics/performance/slowest        # Slowest endpoints

# Audit
GET    /api/analytics/events                     # Organization events (audit log)

# Platform (Super Admin Only)
GET    /api/analytics/platform                   # Platform-wide statistics
```

### Example: Create Organization (Signup)

```bash
curl -X POST http://localhost:3000/api/organizations \
  -H "Content-Type: application/json" \
  -d '{
    "name": "TechCorp Inc.",
    "slug": "techcorp",
    "owner_email": "admin@techcorp.com",
    "company_name": "TechCorp Inc.",
    "plan": "starter"
  }'
```

Response:

```json
{
  "success": true,
  "message": "Organization created successfully",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "TechCorp Inc.",
    "slug": "techcorp",
    "plan": "starter",
    "status": "active",
    "max_domains": 3,
    "max_tenants": 50,
    "max_users": 1000,
    "trial_ends_at": null,
    "created_at": "2025-11-17T20:00:00Z"
  }
}
```

### Example: Get Usage Statistics

```bash
curl http://localhost:3000/api/organizations/:id/usage \
  -H "Authorization: Bearer <token>"
```

Response:

```json
{
  "success": true,
  "data": {
    "current_domains": 2,
    "current_tenants": 15,
    "current_users": 250,
    "current_api_calls": 45000,
    "max_domains": 3,
    "max_tenants": 50,
    "max_users": 1000,
    "max_api_calls_per_month": 100000,
    "domains_percentage": 67,
    "tenants_percentage": 30,
    "users_percentage": 25,
    "api_calls_percentage": 45
  }
}
```

## 🔒 Security Features

1. **JWT Authentication** - Secure token-based auth
2. **Row-Level Security** - Complete data isolation
3. **Rate Limiting** - Organization-based API rate limiting
4. **Audit Logging** - Complete audit trail
5. **Subscription Enforcement** - Automatic plan limits
6. **Input Validation** - Request validation on all endpoints

## 💡 Monetization Strategy

### Base Pricing
- **Trial:** Free for 14 days
- **Starter:** $299/month
- **Business:** $999/month
- **Enterprise:** Custom pricing

### Overage Pricing
- **Extra Users:** $5 per user/month
- **Extra API Calls:** $1 per 1,000 calls
- **Extra Storage:** $2 per GB/month

## 🎯 Roadmap

- [x] Organization management
- [x] Multi-domain support
- [x] Usage tracking and analytics
- [x] Plan limits enforcement
- [x] Rate limiting
- [ ] Stripe integration for billing
- [ ] Invoice generation
- [ ] Email notifications
- [ ] React admin dashboard
- [ ] Organization signup flow
- [ ] Billing portal

## 📄 License

MIT License

---

Made with ❤️ for SaaS founders
