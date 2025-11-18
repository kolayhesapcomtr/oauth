# 🚀 Setup Guide - OAuth Multi-Tenant SaaS Platform

Complete setup guide for the OAuth Multi-Tenant SaaS Authentication Platform.

## 📋 Prerequisites

- **Docker & Docker Compose** (recommended) OR
- **Node.js** 18+ and **PostgreSQL** 14+
- **Gmail Account** (for email notifications) or another SMTP server

## 🎯 Quick Start with Docker (Recommended)

### 1. Clone the Repository

```bash
git clone <repository-url>
cd oauth
```

### 2. Configure Environment Variables

```bash
# Copy example env file
cp .env.example .env

# Edit .env and add your SMTP credentials
nano .env
```

Add your Gmail credentials:
```env
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
```

**Note**: For Gmail, you need to create an [App Password](https://support.google.com/accounts/answer/185833?hl=en).

### 3. Start All Services

```bash
docker-compose up -d
```

This will start:
- **PostgreSQL** on port 5432
- **Auth Service** on port 3000
- **Admin Dashboard** on port 5173

### 4. Verify Installation

```bash
# Check services are running
docker-compose ps

# Check auth service logs
docker-compose logs -f auth-service

# Check admin dashboard logs
docker-compose logs -f admin-dashboard
```

### 5. Access the Platform

- **Admin Dashboard**: http://localhost:5173
- **API**: http://localhost:3000
- **API Health**: http://localhost:3000/api/health

### 6. Default Login Credentials

From the seed data:
- **Email**: admin@example.com
- **Password**: Test123!

## 🛠️ Manual Setup (Without Docker)

### 1. Install Dependencies

```bash
# Auth Service
cd auth-service
npm install

# Admin Dashboard
cd ../admin-dashboard
npm install
```

### 2. Setup PostgreSQL Database

```bash
# Create database
createdb oauth_db

# Run migrations
psql oauth_db < database/schema.sql
psql oauth_db < database/organization-schema.sql

# Load seed data (optional)
psql oauth_db < database/seed.sql
```

### 3. Configure Auth Service

```bash
cd auth-service
cp .env.example .env
nano .env
```

Update with your settings:
```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=oauth_db
DB_USER=postgres
DB_PASSWORD=your-password

JWT_SECRET=your-super-secret-key
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
```

### 4. Configure Admin Dashboard

```bash
cd admin-dashboard
cp .env.example .env
nano .env
```

Update API URL:
```env
VITE_API_URL=http://localhost:3000/api
```

### 5. Start Services

```bash
# Terminal 1: Auth Service
cd auth-service
npm run dev

# Terminal 2: Admin Dashboard
cd admin-dashboard
npm run dev
```

## 📧 Email Configuration

### Gmail Setup

1. Enable 2-Step Verification in your Google Account
2. Generate an App Password:
   - Go to Google Account → Security
   - 2-Step Verification → App passwords
   - Select "Mail" and "Other (Custom name)"
   - Copy the generated password

3. Use in .env:
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=generated-app-password
```

### Other SMTP Providers

**SendGrid:**
```env
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASSWORD=your-sendgrid-api-key
```

**Mailgun:**
```env
SMTP_HOST=smtp.mailgun.org
SMTP_PORT=587
SMTP_USER=your-mailgun-username
SMTP_PASSWORD=your-mailgun-password
```

## 🧪 Testing the Installation

### 1. Test API Health

```bash
curl http://localhost:3000/api/health
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2025-11-17T..."
}
```

### 2. Test Database Connection

```bash
docker-compose exec postgres psql -U postgres -d oauth_db -c "SELECT COUNT(*) FROM organizations;"
```

### 3. Test Organization Creation

```bash
curl -X POST http://localhost:3000/api/organizations \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Org",
    "slug": "test-org",
    "owner_email": "test@example.com",
    "plan": "trial"
  }'
```

### 4. Test Email Notifications

Create an organization via API (see above). You should receive a welcome email.

## 📊 Database Management

### View Organizations

```bash
docker-compose exec postgres psql -U postgres -d oauth_db -c "SELECT name, plan, status FROM organizations;"
```

### View Subscription Plans

```bash
docker-compose exec postgres psql -U postgres -d oauth_db -c "SELECT id, name, monthly_price FROM subscription_plans;"
```

### Reset Database

```bash
docker-compose down -v
docker-compose up -d
```

## 🔧 Troubleshooting

### Port Already in Use

If ports 3000, 5173, or 5432 are already in use:

```bash
# Find process using port
lsof -i :3000

# Kill process
kill -9 <PID>
```

Or change ports in `docker-compose.yml`.

### Email Not Sending

1. Check SMTP credentials in .env
2. Ensure Gmail App Password is correct
3. Check auth-service logs:
```bash
docker-compose logs -f auth-service | grep email
```

### Database Connection Failed

```bash
# Check PostgreSQL is running
docker-compose ps postgres

# View PostgreSQL logs
docker-compose logs postgres

# Restart PostgreSQL
docker-compose restart postgres
```

### Admin Dashboard Not Loading

```bash
# Check if vite is running
docker-compose logs admin-dashboard

# Restart dashboard
docker-compose restart admin-dashboard

# Check browser console for errors
```

## 🎯 Next Steps

1. **Customize Branding**: Update logos and colors in admin dashboard
2. **Configure Plans**: Adjust subscription plans in database
3. **Setup Production**: Configure production environment variables
4. **Add Domains**: Create your first domain via admin dashboard
5. **Invite Users**: Send invitations to team members

## 📚 Additional Resources

- [API Documentation](./README.md#api-documentation)
- [Architecture Overview](./README.md#architecture)
- [Subscription Plans](./README.md#subscription-plans)
- [Email Templates](./auth-service/src/services/email.service.ts)

## 🆘 Getting Help

- Check logs: `docker-compose logs -f`
- View all services: `docker-compose ps`
- Restart services: `docker-compose restart`
- Full reset: `docker-compose down -v && docker-compose up -d`

## 🔒 Security Checklist

Before going to production:

- [ ] Change JWT_SECRET to a strong random value
- [ ] Update default admin password
- [ ] Configure proper CORS origins
- [ ] Enable HTTPS
- [ ] Setup firewall rules
- [ ] Configure backup strategy
- [ ] Enable audit logging
- [ ] Setup monitoring and alerts

---

**Need Help?** Open an issue on GitHub or contact support@yourplatform.com
