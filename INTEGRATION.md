# Yeni Proje Entegrasyon Rehberi

Bu dokümanda yeni bir SaaS projesini auth sistemine nasıl entegre edeceğinizi detaylıyla anlat

ıyoruz.

## 📋 İçindekiler

1. [Hızlı Başlangıç](#hızlı-başlangıç)
2. [Domain Kaydı](#1-domain-kaydı)
3. [Rol ve Yetkilendirme Yapısı](#2-rol-ve-yetkilendirme-yapısı)
4. [Frontend Entegrasyonu](#3-frontend-entegrasyonu)
5. [Backend Entegrasyonu](#4-backend-entegrasyonu)
6. [Test ve Doğrulama](#5-test-ve-doğrulama)

---

## Hızlı Başlangıç

Yeni bir proje eklemek için 4 temel adım:

1. **Domain kaydı** - Auth service'e yeni domain ekle
2. **Rol/Yetki tanımları** - Permission ve role'leri oluştur
3. **Frontend kurulumu** - Login ve auth state management
4. **Backend kurulumu** - Token validation ve permission check

---

## 1. Domain Kaydı

### Adım 1.1: Domain Oluştur

Auth Service API'sine POST isteği ile yeni domain ekleyin:

```bash
curl -X POST http://localhost:3000/api/domains \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -d '{
    "name": "Inventory System",
    "slug": "inventory",
    "domain": "inventory.localhost:3003",
    "description": "Inventory and warehouse management system"
  }'
```

**Response:**
```json
{
  "message": "Domain created successfully",
  "domain": {
    "id": "domain-uuid-here",
    "name": "Inventory System",
    "slug": "inventory",
    "domain": "inventory.localhost:3003",
    "is_active": true
  }
}
```

### Adım 1.2: İlk Tenant Oluştur

Her domain'de en az bir tenant olmalı:

```bash
curl -X POST http://localhost:3000/api/tenants \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -d '{
    "domain_id": "domain-uuid-here",
    "name": "Demo Company",
    "slug": "demo-company",
    "description": "Demo organization for testing"
  }'
```

---

## 2. Rol ve Yetkilendirme Yapısı

### Adım 2.1: Permissions Tanımla

Önce projenizde hangi kaynaklar (resources) ve aksiyonlar (actions) olacağını belirleyin:

**Örnek: Inventory System**
- Resources: `products`, `warehouses`, `orders`, `reports`
- Actions: `create`, `read`, `update`, `delete`, `export`

Bulk permission creation:

```bash
curl -X POST http://localhost:3000/api/permissions/bulk \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -d '{
    "domain_id": "domain-uuid-here",
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
      },
      {
        "name": "Update Products",
        "slug": "products-update",
        "resource": "products",
        "action": "update"
      },
      {
        "name": "Delete Products",
        "slug": "products-delete",
        "resource": "products",
        "action": "delete"
      },
      {
        "name": "View Warehouses",
        "slug": "warehouses-read",
        "resource": "warehouses",
        "action": "read"
      }
    ]
  }'
```

### Adım 2.2: Roles Oluştur

```bash
# Admin Role
curl -X POST http://localhost:3000/api/roles \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -d '{
    "domain_id": "domain-uuid-here",
    "name": "Admin",
    "slug": "admin",
    "description": "Full system access",
    "is_system": true
  }'

# Warehouse Manager Role
curl -X POST http://localhost:3000/api/roles \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -d '{
    "domain_id": "domain-uuid-here",
    "name": "Warehouse Manager",
    "slug": "warehouse-manager",
    "description": "Manage warehouse operations"
  }'

# Viewer Role
curl -X POST http://localhost:3000/api/roles \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -d '{
    "domain_id": "domain-uuid-here",
    "name": "Viewer",
    "slug": "viewer",
    "description": "Read-only access"
  }'
```

### Adım 2.3: Role'lere Permission Ata

```bash
# Admin - Tüm yetkiler
curl -X POST http://localhost:3000/api/roles/ROLE_UUID/permissions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -d '{
    "permission_ids": [
      "perm-uuid-1",
      "perm-uuid-2",
      "perm-uuid-3",
      "perm-uuid-4",
      "perm-uuid-5"
    ]
  }'

# Warehouse Manager - Sınırlı yetkiler
curl -X POST http://localhost:3000/api/roles/ROLE_UUID/permissions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -d '{
    "permission_ids": [
      "products-read",
      "products-update",
      "warehouses-read"
    ]
  }'
```

---

## 3. Frontend Entegrasyonu

### Adım 3.1: Proje Kurulumu

CRM örneğinden kopyalayarak başlayın:

```bash
# Yeni proje oluştur
npm create vite@latest inventory-system -- --template react-ts
cd inventory-system

# Dependencies yükle
npm install react-router-dom axios zustand clsx lucide-react
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

### Adım 3.2: Dosya Yapısını Kopyala

CRM projesinden bu dosyaları kopyalayın:

```
src/
├── lib/
│   ├── api.ts          # Axios client (VITE_DOMAIN_URL değiştir)
│   └── jwt.ts          # JWT utilities
├── store/
│   └── authStore.ts    # Zustand store
├── types/
│   └── index.ts        # TypeScript types
├── components/
│   ├── ProtectedRoute.tsx
│   ├── TenantSwitcher.tsx
│   ├── AppSwitcher.tsx
│   └── Layout.tsx
└── pages/
    ├── LoginPage.tsx
    └── DashboardPage.tsx
```

### Adım 3.3: Environment Değişkenleri

`.env` dosyası:

```env
VITE_AUTH_API_URL=http://localhost:3000/api
VITE_DOMAIN_URL=inventory.localhost:3003
VITE_APP_NAME=Inventory System
```

### Adım 3.4: Konfigürasyon

`vite.config.ts`:

```typescript
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3003,  // ← Yeni port
    host: true,
  },
})
```

### Adım 3.5: Permission-Based Components

```typescript
// src/components/ProtectedButton.tsx
import { useAuthStore } from '../store/authStore';

export function ProtectedButton({
  permission,
  children,
  onClick
}: {
  permission: string;
  children: React.ReactNode;
  onClick: () => void;
}) {
  const hasPermission = useAuthStore((state) => state.hasPermission);

  if (!hasPermission(permission)) {
    return null; // veya disabled button
  }

  return <button onClick={onClick}>{children}</button>;
}

// Kullanım
<ProtectedButton permission="products-create" onClick={handleCreate}>
  Add Product
</ProtectedButton>
```

---

## 4. Backend Entegrasyonu

### Seçenek A: Node.js / Express

#### Adım 4.1: Middleware Oluştur

```typescript
// middleware/auth.ts
import jwt from 'jsonwebtoken';
import axios from 'axios';

const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || 'http://localhost:3000/api';
const JWT_SECRET = process.env.JWT_SECRET || 'your-jwt-secret';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    tenant_id: string;
    domain_id: string;
    permissions: string[];
  };
}

export const authenticate = (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }

  const token = authHeader.substring(7);

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;

    // Check if this domain is in user's contexts
    const currentDomain = decoded.contexts.find(
      (ctx: any) => ctx.domain === req.hostname || ctx.domain.includes(req.hostname)
    );

    if (!currentDomain) {
      return res.status(403).json({ error: 'No access to this domain' });
    }

    // Get current tenant from context
    const currentTenant = currentDomain.tenants.find(
      (t: any) => t.tenant_id === decoded.current_context?.tenant_id
    );

    if (!currentTenant) {
      return res.status(403).json({ error: 'No active tenant context' });
    }

    req.user = {
      id: decoded.sub,
      email: decoded.email,
      tenant_id: currentTenant.tenant_id,
      domain_id: currentDomain.domain_id,
      permissions: currentTenant.permissions,
    };

    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};

export const requirePermission = (permission: string) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (!req.user.permissions.includes(permission)) {
      return res.status(403).json({
        error: `Permission denied. Required: ${permission}`,
      });
    }

    next();
  };
};
```

#### Adım 4.2: Kullanım

```typescript
import express from 'express';
import { authenticate, requirePermission } from './middleware/auth';

const app = express();

// Protected route
app.get('/api/products',
  authenticate,
  requirePermission('products-read'),
  async (req, res) => {
    // req.user.tenant_id ile tenant-specific data getir
    const products = await db.products.findMany({
      where: { tenant_id: req.user!.tenant_id }
    });

    res.json({ products });
  }
);

// Create product
app.post('/api/products',
  authenticate,
  requirePermission('products-create'),
  async (req, res) => {
    const product = await db.products.create({
      data: {
        ...req.body,
        tenant_id: req.user!.tenant_id,  // ← Otomatik tenant isolation
      }
    });

    res.json({ product });
  }
);
```

### Seçenek B: Python / FastAPI

```python
# auth_middleware.py
from fastapi import Request, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import jwt

JWT_SECRET = "your-jwt-secret"
security = HTTPBearer()

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    token = credentials.credentials

    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=["HS256"])

        # Domain check
        # ... (benzer logic)

        return {
            "id": payload["sub"],
            "email": payload["email"],
            "tenant_id": payload["current_context"]["tenant_id"],
            "permissions": payload["contexts"][0]["tenants"][0]["permissions"]
        }
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

def require_permission(permission: str):
    async def permission_checker(user = Depends(get_current_user)):
        if permission not in user["permissions"]:
            raise HTTPException(
                status_code=403,
                detail=f"Permission denied. Required: {permission}"
            )
        return user
    return permission_checker

# Kullanım
@app.get("/api/products")
async def get_products(user = Depends(require_permission("products-read"))):
    products = await db.products.find({"tenant_id": user["tenant_id"]})
    return {"products": products}
```

---

## 5. Test ve Doğrulama

### Adım 5.1: Kullanıcı Oluştur ve Tenant'a Ekle

```bash
# Mevcut bir kullanıcıyı yeni tenant'a ekle
curl -X POST http://localhost:3000/api/user-management/users/assign \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -d '{
    "user_id": "user-uuid",
    "tenant_id": "tenant-uuid",
    "role_id": "admin-role-uuid"
  }'
```

### Adım 5.2: Login Testi

```bash
# inventory.localhost:3003 domain'i ile login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test123!",
    "domain": "inventory.localhost:3003"
  }'
```

**Beklenen response:**
```json
{
  "message": "Login successful",
  "user": {...},
  "available_contexts": [
    {
      "domain_name": "Inventory System",
      "domain_url": "inventory.localhost:3003",
      "tenants": [...]
    }
  ],
  "token": "jwt-token-here"
}
```

### Adım 5.3: Permission Test

Frontend'de:

```typescript
const { hasPermission } = useAuthStore();

// Test et
console.log('Can create products:', hasPermission('products-create'));
console.log('Can delete products:', hasPermission('products-delete'));
```

Backend'de:

```bash
# Test protected endpoint
curl -X GET http://localhost:3003/api/products \
  -H "Authorization: Bearer YOUR_TOKEN"

# Yetkisiz endpoint (403 dönmeli)
curl -X DELETE http://localhost:3003/api/products/123 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## 📊 Checklist

Yeni proje eklerken kontrol listesi:

- [ ] Domain kaydı yapıldı
- [ ] En az bir tenant oluşturuldu
- [ ] Permissions tanımlandı (bulk creation)
- [ ] Roles oluşturuldu (Admin, Manager, Viewer)
- [ ] Role'lere permissions atandı
- [ ] Frontend kuruldu ve çalışıyor
- [ ] Login sayfası domain-aware
- [ ] Backend middleware kuruldu
- [ ] Token validation çalışıyor
- [ ] Permission check çalışıyor
- [ ] Tenant isolation doğrulandı
- [ ] Test kullanıcısı eklendi
- [ ] Cross-domain navigation test edildi

---

## 🔧 Troubleshooting

### "User has no access to this domain"

**Sebep:** Kullanıcının bu domain'de hiç tenant erişimi yok.

**Çözüm:**
```bash
curl -X POST http://localhost:3000/api/user-management/users/assign \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -d '{
    "user_id": "USER_ID",
    "tenant_id": "TENANT_ID",
    "role_id": "ROLE_ID"
  }'
```

### "Permission denied"

**Sebep:** User'ın rolünde bu permission yok.

**Çözüm:**
1. Role'ü kontrol et: `GET /api/roles/{role_id}/permissions`
2. Permission ekle: `POST /api/roles/{role_id}/permissions/add`

### CORS Hatası

Auth Service'in `.env` dosyasında yeni domain'i ekleyin:

```env
ALLOWED_ORIGINS=http://localhost:3001,http://localhost:3002,http://localhost:3003
```

---

## 📚 İleri Seviye

### Multi-Tenant Data Isolation

**Database Level:**

```sql
-- PostgreSQL Row Level Security (RLS)
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation ON products
  USING (tenant_id = current_setting('app.current_tenant_id')::uuid);
```

**Application Level:**

```typescript
// Global tenant context
class TenantContext {
  private static tenantId: string;

  static set(tenantId: string) {
    this.tenantId = tenantId;
  }

  static get(): string {
    if (!this.tenantId) {
      throw new Error('Tenant context not set');
    }
    return this.tenantId;
  }
}

// Middleware'de set et
app.use((req, res, next) => {
  if (req.user) {
    TenantContext.set(req.user.tenant_id);
  }
  next();
});

// Kullanım
const products = await db.products.findMany({
  where: { tenant_id: TenantContext.get() }
});
```

### Invitation System

Yeni kullanıcıları tenant'a davet edin:

```typescript
// Create invitation
const invitation = await fetch('http://localhost:3000/api/user-management/invitations', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    tenant_id: 'tenant-uuid',
    role_id: 'role-uuid',
    email: 'newuser@example.com',
    expires_in_days: 7
  })
});

// Email gönder (invitation.token ile)
// Kullanıcı linke tıklayınca:
// GET /api/user-management/invitations/{token}
// POST /api/user-management/invitations/{token}/accept
```

---

## 🎯 Best Practices

1. **Permission Naming Convention**
   - Format: `{resource}-{action}`
   - Örnekler: `products-create`, `orders-read`, `reports-export`

2. **Role Hierarchy**
   ```
   Super Admin (is_system: true)
   └── Admin
       └── Manager
           └── User
               └── Viewer
   ```

3. **Environment Separation**
   - Development: `*.localhost:300X`
   - Staging: `*.staging.yourdomain.com`
   - Production: `*.yourdomain.com`

4. **Security**
   - Her zaman HTTPS kullanın (production)
   - JWT secret'i güçlü tutun (min 256 bit)
   - Token expiry süresini kısa tutun (24h)
   - Refresh token kullanın
   - Rate limiting ekleyin

5. **Monitoring**
   - Audit logs takip edin
   - Failed login attempts loglay ın
   - Permission denied olaylarını izleyin

---

## 🆘 Destek

Sorun yaşıyorsanız:

1. README.md'yi kontrol edin
2. Logları kontrol edin: `docker-compose logs -f auth-service`
3. Database'i kontrol edin: `psql -d auth_system`
4. GitHub Issues açın

---

**Tebrikler! Yeni projeniz artık auth sistemine entegre! 🎉**
