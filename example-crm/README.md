# CRM System - Example Multi-Tenant Application

Example CRM application demonstrating multi-domain multi-tenant authentication system integration.

## Features

- ✅ **Domain-aware Login**: Automatically filters tenants by domain
- ✅ **Tenant Switching**: Switch between organizations seamlessly
- ✅ **Multi-domain Navigation**: Navigate to other apps (Analytics) while maintaining auth
- ✅ **Permission-based UI**: Show/hide features based on user permissions
- ✅ **Role-based Access**: Different experiences for different roles
- ✅ **JWT Authentication**: Secure token-based auth with refresh tokens
- ✅ **TypeScript**: Fully typed for better DX
- ✅ **TailwindCSS**: Modern, responsive UI

## Tech Stack

- **React 19** - UI library
- **Vite** - Build tool
- **TypeScript** - Type safety
- **React Router** - Routing
- **Zustand** - State management
- **Axios** - HTTP client
- **TailwindCSS** - Styling
- **Lucide React** - Icons

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment

```bash
cp .env.example .env
```

Edit `.env`:
```env
VITE_AUTH_API_URL=http://localhost:3000/api
VITE_DOMAIN_URL=crm.localhost:3001
VITE_APP_NAME=CRM System
```

### 3. Start Development Server

```bash
npm run dev
```

App will be available at `http://localhost:3001`

### 4. Login with Test Account

Use one of these test accounts:

| Email | Password | Access |
|-------|----------|--------|
| ahmet@example.com | Test123! | Firma A (Admin), Firma B (Sales) |
| mehmet@example.com | Test123! | Firma B (Manager) |
| ayse@example.com | Test123! | Firma A (Sales) |

## Project Structure

```
example-crm/
├── src/
│   ├── components/
│   │   ├── AppSwitcher.tsx      # Switch between apps
│   │   ├── Layout.tsx            # Main layout with navbar
│   │   ├── ProtectedRoute.tsx    # Route protection
│   │   └── TenantSwitcher.tsx    # Switch organizations
│   ├── lib/
│   │   ├── api.ts                # API client with interceptors
│   │   └── jwt.ts                # JWT utilities
│   ├── pages/
│   │   ├── DashboardPage.tsx     # Main dashboard
│   │   └── LoginPage.tsx         # Login page
│   ├── store/
│   │   └── authStore.ts          # Zustand auth store
│   ├── types/
│   │   └── index.ts              # TypeScript types
│   ├── App.tsx                   # Root component
│   ├── main.tsx                  # Entry point
│   └── index.css                 # Global styles
├── .env.example
├── package.json
├── tailwind.config.js
├── tsconfig.json
└── vite.config.ts
```

## Key Components

### AuthStore (`src/store/authStore.ts`)

Global authentication state using Zustand:

```typescript
const {
  user,              // Current user
  token,             // JWT access token
  contexts,          // Available domains and tenants
  currentContext,    // Current domain + tenant
  currentTenant,     // Current tenant info with permissions
  isAuthenticated,   // Auth status
  login,             // Login function
  logout,            // Logout function
  switchTenant,      // Switch organization
  hasPermission,     // Check permission
  hasRole,           // Check role
} = useAuthStore();
```

### TenantSwitcher

Allows users to switch between organizations they have access to within the same domain.

```typescript
import { TenantSwitcher } from '../components/TenantSwitcher';

// In your navbar
<TenantSwitcher />
```

### AppSwitcher

Navigate to other applications while maintaining authentication.

```typescript
import { AppSwitcher } from '../components/AppSwitcher';

// Shows other apps user has access to
<AppSwitcher />
```

### ProtectedRoute

Protect routes based on authentication, permissions, or roles.

```typescript
<Route
  path="/customers"
  element={
    <ProtectedRoute requirePermission="customers-read">
      <CustomersPage />
    </ProtectedRoute>
  }
/>

// Or with role
<ProtectedRoute requireRole="admin">
  <AdminPanel />
</ProtectedRoute>
```

## Authentication Flow

### 1. Login

```typescript
// User visits crm.localhost:3001/login
// Enters credentials
await authStore.login(email, password);

// Backend receives:
POST /api/auth/login
{
  email: "ahmet@example.com",
  password: "Test123!",
  domain: "crm.localhost:3001"  // Auto-added by frontend
}

// Response (if single tenant):
{
  token: "jwt-token",
  refresh_token: "refresh-token",
  user: {...},
  available_contexts: [...]  // Only CRM contexts
}

// User redirected to /dashboard
```

### 2. Tenant Switching

```typescript
// User clicks tenant switcher
// Selects "Firma B"
await authStore.switchTenant(firmaBId);

// Backend:
POST /api/auth/switch-context
{ tenant_id: "firma-b-id" }

// Response:
{ token: "new-jwt-with-firma-b-context" }

// Page reloads with new context
```

### 3. Cross-Domain Navigation

```typescript
// User clicks "Apps" → "Analytics"
// Frontend navigates to:
window.location.href = "http://analytics.localhost:3002";

// Analytics app:
// - Reads token from localStorage (same auth service)
// - Validates token
// - Shows Analytics tenants
// - Auto-selects if user has only one Analytics tenant
```

## Permission-Based UI

```typescript
const canCreateCustomers = hasPermission('customers-create');

<button disabled={!canCreateCustomers}>
  Add Customer
</button>

{canCreateCustomers && (
  <CreateCustomerForm />
)}
```

## API Integration

### Making Authenticated Requests

```typescript
import { api } from '../lib/api';

// Token automatically added by interceptor
const response = await api.get('/customers');

// If token expires, automatically refreshed
// If refresh fails, user redirected to login
```

### Custom API Endpoints

```typescript
import { api } from '../lib/api';

export const customersApi = {
  list: async () => {
    const { data } = await api.get('/customers');
    return data;
  },

  create: async (customer: Customer) => {
    const { data } = await api.post('/customers', customer);
    return data;
  },
};
```

## Testing Scenarios

### Scenario 1: Admin User

Login as `ahmet@example.com` (Admin at Firma A):

- ✅ Can view all sections
- ✅ Has all permissions
- ✅ Can switch to Firma B (Sales role)
- ✅ Permissions change when switching
- ✅ Can navigate to Analytics app

### Scenario 2: Limited User

Login as `mehmet@example.com` (Manager at Firma B):

- ✅ Limited permissions shown
- ✅ Some actions disabled
- ❌ Cannot switch to other tenants (not a member)
- ❌ No access to Analytics

### Scenario 3: Multi-App User

Login as `ahmet@example.com`:

- ✅ Access to CRM (2 tenants)
- ✅ Access to Analytics (1 tenant)
- ✅ App switcher shows both
- ✅ Token valid across both apps

## Build for Production

```bash
# Build
npm run build

# Preview production build
npm run preview
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| VITE_AUTH_API_URL | Auth service URL | http://localhost:3000/api |
| VITE_DOMAIN_URL | This app's domain | crm.localhost:3001 |
| VITE_APP_NAME | Application name | CRM System |

## Troubleshooting

### "No token provided" error

- Make sure Auth Service is running on http://localhost:3000
- Check CORS settings in Auth Service

### "User has no access"

- User account doesn't have any tenant access in CRM domain
- Check database seed data

### Token expired

- Refresh token automatically used
- If refresh fails, user logged out

### CORS errors

- Auth Service must allow this origin in ALLOWED_ORIGINS
- Default: `http://localhost:3001,http://localhost:3002`

## Next Steps

1. Add customer management pages
2. Add invoice management pages
3. Add user management (admin only)
4. Add real-time notifications
5. Add tenant invitation system
6. Add audit log viewer

## License

MIT
