# 🚀 Local Kurulum Klavuzu - OAuth Multi-Tenant SaaS Platform

Bu klavuz, projeyi GitHub'dan çekip local ortamınızda çalıştırmanız için gereken tüm adımları detaylı olarak açıklar.

## 📋 İçindekiler
1. [Gereksinimler](#-gereksinimler)
2. [Hızlı Kurulum (Docker)](#-hızlı-kurulum-docker)
3. [Manuel Kurulum](#-manuel-kurulum)
4. [Veritabanı Yapısı](#-veritabanı-yapısı)
5. [İlk Kullanıcı Oluşturma](#-ilk-kullanıcı-oluşturma)
6. [Test ve Doğrulama](#-test-ve-doğrulama)
7. [Sorun Giderme](#-sorun-giderme)

---

## 📦 Gereksinimler

### Zorunlu:
- **Node.js** v18+ (LTS önerilen)
- **PostgreSQL** v14+
- **npm** v8+ veya **yarn** v1.22+
- **Git**

### Opsiyonel:
- **Docker** ve **Docker Compose** (kolay kurulum için)
- **pgAdmin** veya **DBeaver** (veritabanı yönetimi için)

### Gereksinim Kontrolü:
```bash
# Versiyonları kontrol et
node --version   # v18.0.0 veya üstü
npm --version    # 8.0.0 veya üstü
psql --version   # 14.0 veya üstü
git --version    # herhangi bir versiyon
```

---

## 🐳 Hızlı Kurulum (Docker)

Docker kullanarak en hızlı yol:

### 1. Repository'yi Clone'la
```bash
git clone https://github.com/kolayhesapcomtr/oauth.git
cd oauth
```

### 2. Docker ile Başlat
```bash
# Tüm servisleri başlat (PostgreSQL + Backend + Frontend)
docker-compose up -d

# Logları izle
docker-compose logs -f
```

### 3. Migration'ları Çalıştır
```bash
# PostgreSQL container'ına bağlan
docker exec -it oauth-postgres psql -U postgres -d oauth_db

# Migration'ları çalıştır (PostgreSQL içinde)
\i /docker-entrypoint-initdb.d/migrations-001-initial-schema.sql
\i /docker-entrypoint-initdb.d/migrations-002-rbac.sql
\i /docker-entrypoint-initdb.d/migrations-003-subscriptions.sql
\i /docker-entrypoint-initdb.d/migrations-004-payment-providers.sql
\q
```

### 4. Erişim
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3000
- **PostgreSQL**: localhost:5432

**Docker kurulumunu tamamladıysanız, [İlk Kullanıcı Oluşturma](#-ilk-kullanıcı-oluşturma) bölümüne geçin.**

---

## 🔧 Manuel Kurulum

Docker kullanmadan adım adım kurulum:

### Adım 1: Repository'yi Clone'la

```bash
# GitHub'dan projeyi çek
git clone https://github.com/kolayhesapcomtr/oauth.git
cd oauth

# Branch'i kontrol et
git branch -a
git checkout claude/implement-oauth-01TQwSDairAvenqJ41vSpURD
```

### Adım 2: PostgreSQL Veritabanı Kurulumu

#### Seçenek A: PostgreSQL Yüklüyse (Doğrudan)

```bash
# PostgreSQL'e bağlan
psql -U postgres

# Veritabanını oluştur
CREATE DATABASE oauth_db;

# Kullanıcı oluştur (opsiyonel)
CREATE USER oauth_user WITH PASSWORD 'secure_password_123';
GRANT ALL PRIVILEGES ON DATABASE oauth_db TO oauth_user;

# Çıkış
\q
```

#### Seçenek B: Sadece PostgreSQL için Docker

```bash
# PostgreSQL container'ı başlat
docker run --name oauth-postgres \
  -e POSTGRES_DB=oauth_db \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -p 5432:5432 \
  -d postgres:14

# Container'ın hazır olmasını bekle (5-10 saniye)
sleep 10

# Test et
psql -h localhost -U postgres -d oauth_db -c "SELECT version();"
```

### Adım 3: Veritabanı Migration'larını Çalıştır

```bash
# Database dizinine git
cd /path/to/oauth

# Her migration'ı sırayla çalıştır
psql -h localhost -U postgres -d oauth_db -f database/migrations-001-initial-schema.sql
psql -h localhost -U postgres -d oauth_db -f database/migrations-002-rbac.sql
psql -h localhost -U postgres -d oauth_db -f database/migrations-003-subscriptions.sql
psql -h localhost -U postgres -d oauth_db -f database/migrations-004-payment-providers.sql

# Başarılı olup olmadığını kontrol et
psql -h localhost -U postgres -d oauth_db -c "\dt"
```

**Beklenen Çıktı:** 30+ tablo görmeli siniz (users, organizations, domains, tenants, roles, permissions, vb.)

### Adım 4: Backend (Auth Service) Kurulumu

```bash
# Auth service dizinine git
cd auth-service

# Bağımlılıkları yükle
npm install

# Environment dosyasını oluştur
cp .env.example .env

# .env dosyasını düzenle
nano .env  # veya VSCode ile aç: code .env
```

#### `.env` Dosyası İçeriği:

```bash
# Server
NODE_ENV=development
PORT=3000

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=oauth_db
DB_USER=postgres
DB_PASSWORD=postgres

# JWT Secrets (geliştirme için - production'da değiştirin!)
JWT_SECRET=your-super-secret-jwt-key-change-in-production-min-256-bits
JWT_EXPIRES_IN=24h
JWT_REFRESH_SECRET=your-super-secret-refresh-key-change-in-production
JWT_REFRESH_EXPIRES_IN=7d

# CORS (Frontend URL)
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3001

# Email (Opsiyonel - şu an çalışmıyor, gelecekte eklenecek)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=noreply@yourdomain.com

# Payment Provider Encryption (AES-256)
PAYMENT_ENCRYPTION_KEY=your-32-character-encryption-key-here-must-be-32-chars
```

#### Backend'i Başlat:

```bash
# Geliştirme modunda çalıştır (hot reload ile)
npm run dev

# VEYA production build
npm run build
npm start
```

**Beklenen Çıktı:**
```
🚀 Server running on port 3000
✅ Database connected successfully
```

**API Test:**
```bash
curl http://localhost:3000/api/health
# Beklenen: {"status":"ok","timestamp":"..."}
```

### Adım 5: Frontend (Admin Dashboard) Kurulumu

Yeni bir terminal açın:

```bash
# Frontend dizinine git
cd admin-dashboard

# Bağımlılıkları yükle
npm install

# Environment dosyası oluştur
cp .env.example .env

# .env dosyasını düzenle
nano .env
```

#### Frontend `.env` İçeriği:

```bash
VITE_API_URL=http://localhost:3000/api
```

#### Frontend'i Başlat:

```bash
# Geliştirme sunucusunu başlat
npm run dev

# VEYA production build
npm run build
npm run preview
```

**Beklenen Çıktı:**
```
VITE v4.x.x  ready in xxx ms

➜  Local:   http://localhost:5173/
➜  Network: use --host to expose
```

### Adım 6: Browser'da Aç

1. Tarayıcıda aç: **http://localhost:5173**
2. Login sayfasını görmeli siniz

---

## 🗄️ Veritabanı Yapısı

Migration'lar tamamlandığında oluşan tablo yapısı:

### 📊 Temel Tablolar

#### 1. **users** - Kullanıcılar (Global)
```sql
- id (UUID, PK)
- email (unique)
- password_hash
- first_name, last_name
- is_active, is_email_verified
- is_super_admin
- created_at, updated_at
```

#### 2. **organizations** - Organizasyonlar
```sql
- id (UUID, PK)
- name
- slug (unique)
- owner_id (FK → users)
- subscription_plan (trial, starter, business, enterprise)
- subscription_status, trial_ends_at
- created_at
```

#### 3. **domains** - Domain'ler (Uygulamalar)
```sql
- id (UUID, PK)
- organization_id (FK → organizations)
- name (örn: "CRM Sistemi")
- domain (örn: "crm.example.com")
- is_active
```

#### 4. **tenants** - Kiracılar (Müşteriler)
```sql
- id (UUID, PK)
- organization_id (FK → organizations)
- domain_id (FK → domains)
- name (örn: "Firma A")
- slug
- subscription_plan_id (FK → tenant_subscription_plans)
- is_active
```

#### 5. **roles** - Roller
```sql
- id (UUID, PK)
- name (admin, manager, user, vb.)
- description
- is_system_role
- created_by_tenant_id
```

#### 6. **permissions** - İzinler
```sql
- id (UUID, PK)
- name (users:create, users:read, vb.)
- description
- resource, action
```

#### 7. **user_tenant_roles** - Kullanıcı-Tenant-Rol İlişkisi
```sql
- user_id (FK → users)
- tenant_id (FK → tenants)
- role_id (FK → roles)
- is_active
- invited_by, assigned_at
```

### 💳 Ödeme Sistemi Tabloları

#### 8. **payment_providers** - Ödeme Sağlayıcıları
```sql
- id (iyzico, paytr, param, manual)
- name
- supports_sub_merchant (boolean)
- required_credentials (JSON)
- is_active
```

#### 9. **organization_payment_settings** - Org Ödeme Ayarları
```sql
- id (UUID, PK)
- organization_id (FK)
- payment_provider_id (FK)
- credentials (ENCRYPTED JSON)
- test_credentials (ENCRYPTED JSON)
- is_live_mode
- commission_percentage
```

#### 10. **tenant_payments** - Tenant Ödemeleri
```sql
- id (UUID, PK)
- tenant_id, organization_id
- amount, currency
- payment_provider_id
- provider_payment_id
- status (pending, completed, failed, refunded)
- platform_commission
- organization_net_amount
- payer_email, payer_name
- paid_at, refunded_at
```

#### 11. **platform_commissions** - Platform Komisyonları
```sql
- id (UUID, PK)
- organization_id
- payment_id (FK → tenant_payments)
- commission_amount
- commission_rate
```

### 📋 Abonelik Tabloları

#### 12. **subscription_plans** - Platform Abonelik Planları
```sql
- id (UUID, PK)
- name (Trial, Starter, Business, Enterprise)
- price_monthly, price_yearly
- max_domains, max_tenants, max_users
- features (JSON)
```

#### 13. **tenant_subscription_plans** - Tenant Planları (Org tarafından oluşturulan)
```sql
- id (UUID, PK)
- organization_id (FK)
- name, description
- price, billing_period
- max_users, max_storage_gb
- features (JSON)
- is_active, is_public
```

### 🔐 Diğer Önemli Tablolar

- **invitations** - Davet tokenleri
- **refresh_tokens** - JWT refresh tokenleri
- **audit_logs** - İşlem logları
- **organization_usage_stats** - Kullanım istatistikleri
- **payment_webhooks** - Ödeme webhook logları

**Toplam: ~30 tablo**

---

## 👤 İlk Kullanıcı Oluşturma

Sisteme ilk defa giriş yapmak için bir super admin oluşturun:

### Yöntem 1: API ile (cURL)

```bash
# Super admin kayıt
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@test.com",
    "password": "Admin123!",
    "first_name": "Admin",
    "last_name": "User"
  }'
```

### Yöntem 2: Doğrudan Veritabanından

```bash
# PostgreSQL'e bağlan
psql -h localhost -U postgres -d oauth_db

-- Super admin oluştur
INSERT INTO users (id, email, password_hash, first_name, last_name, is_super_admin, is_email_verified, is_active)
VALUES (
  gen_random_uuid(),
  'admin@test.com',
  '$2b$10$8ZqQqY4Zu7Z.vKqHMJzSzO5K/F6LJMqLjHJqGHqQF0qQJ9vQJ9vQ.',  -- şifre: Admin123!
  'Admin',
  'User',
  true,
  true,
  true
);

-- Kontrol et
SELECT email, is_super_admin FROM users WHERE email = 'admin@test.com';

\q
```

### Yöntem 3: Frontend'den Kayıt

1. http://localhost:5173/register adresine git
2. Formu doldur:
   - Email: admin@test.com
   - Password: Admin123!
   - First Name: Admin
   - Last Name: User
3. "Kayıt Ol" butonuna tıkla

---

## ✅ Test ve Doğrulama

### 1. Backend API Testleri

```bash
# Health check
curl http://localhost:3000/api/health

# Login test
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@test.com",
    "password": "Admin123!"
  }'
```

**Başarılı login çıktısı:**
```json
{
  "message": "Login successful",
  "user": {
    "id": "...",
    "email": "admin@test.com",
    "first_name": "Admin"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "..."
}
```

### 2. Frontend Login Testi

1. http://localhost:5173/login adresine git
2. Email: `admin@test.com`, Password: `Admin123!`
3. Login butonuna tıkla
4. Dashboard'a yönlendirilmeli siniz

### 3. Veritabanı Bağlantı Testi

```bash
# Tablo sayısını kontrol et
psql -h localhost -U postgres -d oauth_db -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';"

# Kullanıcı sayısını kontrol et
psql -h localhost -U postgres -d oauth_db -c "SELECT COUNT(*) FROM users;"

# Organizasyon sayısı
psql -h localhost -U postgres -d oauth_db -c "SELECT COUNT(*) FROM organizations;"
```

### 4. Tam Akış Testi

#### A. Organizasyon Oluşturma
1. Super admin olarak login ol
2. "Organizasyonlar" sayfasına git
3. "Yeni Organizasyon" butonuna tıkla
4. Form doldur ve kaydet

#### B. Domain Ekleme
1. Organizasyon sayfasında "Domain Ekle"
2. Domain bilgilerini gir (örn: crm.test.com)
3. Kaydet

#### C. Tenant (Kiracı) Oluşturma
1. Domain detay sayfasına git
2. "Yeni Tenant" ekle
3. Tenant bilgilerini gir
4. Kaydet

#### D. Kullanıcı Davet Etme
1. Tenant sayfasında "Kullanıcı Davet Et"
2. Email ve rol seç
3. Davet gönder
4. Davet linkini kontrol et

#### E. Ödeme Ayarları (Opsiyonel)
1. Organizasyon paneline geç
2. "Ödeme Ayarları" menüsüne git
3. iyzico veya PayTR seç
4. Test credentials gir
5. Verify et

---

## 🔧 Sorun Giderme

### Sorun 1: Backend Başlamıyor - Database Connection Error

**Hata:**
```
Error: connect ECONNREFUSED 127.0.0.1:5432
```

**Çözüm:**
```bash
# PostgreSQL çalışıyor mu kontrol et
pg_isready -h localhost -p 5432

# Docker kullanıyorsanız
docker ps | grep postgres

# PostgreSQL'i başlat
# macOS (Homebrew):
brew services start postgresql

# Linux (systemd):
sudo systemctl start postgresql

# Docker:
docker start oauth-postgres
```

### Sorun 2: Migration Hataları

**Hata:**
```
ERROR: relation "users" already exists
```

**Çözüm:**
```bash
# Veritabanını sıfırla ve tekrar oluştur
psql -U postgres -c "DROP DATABASE oauth_db;"
psql -U postgres -c "CREATE DATABASE oauth_db;"

# Migration'ları tekrar çalıştır
psql -U postgres -d oauth_db -f database/migrations-001-initial-schema.sql
psql -U postgres -d oauth_db -f database/migrations-002-rbac.sql
psql -U postgres -d oauth_db -f database/migrations-003-subscriptions.sql
psql -U postgres -d oauth_db -f database/migrations-004-payment-providers.sql
```

### Sorun 3: Frontend API'ye Bağlanamıyor

**Hata:** Console'da `ERR_CONNECTION_REFUSED`

**Çözüm:**
1. Backend'in çalıştığını kontrol et: `curl http://localhost:3000/api/health`
2. CORS ayarlarını kontrol et: `auth-service/.env` → `ALLOWED_ORIGINS`
3. Frontend .env'yi kontrol et: `VITE_API_URL=http://localhost:3000/api`

### Sorun 4: JWT Token Geçersiz

**Hata:**
```json
{"error": "Invalid token"}
```

**Çözüm:**
```bash
# Backend .env dosyasında JWT_SECRET'i kontrol et
# En az 32 karakter olmalı
# Değiştirdiyseniz backend'i yeniden başlatın
```

### Sorun 5: Port Zaten Kullanımda

**Hata:**
```
Error: listen EADDRINUSE: address already in use :::3000
```

**Çözüm:**
```bash
# Portu kullanan process'i bul
lsof -i :3000  # macOS/Linux
netstat -ano | findstr :3000  # Windows

# Process'i öldür
kill -9 <PID>  # macOS/Linux
taskkill /PID <PID> /F  # Windows

# Veya farklı port kullan
# auth-service/.env → PORT=3001
```

### Sorun 6: npm install Hataları

**Hata:**
```
npm ERR! code ERESOLVE
```

**Çözüm:**
```bash
# Node version kontrol et
node --version  # 18+ olmalı

# Package-lock.json'u sil ve tekrar dene
rm package-lock.json
rm -rf node_modules
npm install

# Veya legacy peer deps kullan
npm install --legacy-peer-deps
```

### Sorun 7: TypeScript Derleme Hataları

**Hata:**
```
error TS2307: Cannot find module 'xyz'
```

**Çözüm:**
```bash
# Type definitions'ı yükle
npm install --save-dev @types/node @types/express

# tsconfig.json'u kontrol et
# "moduleResolution": "node" olmalı

# Clean build
rm -rf dist
npm run build
```

---

## 🎯 Sonraki Adımlar

Kurulum tamamlandıktan sonra:

1. ✅ **DEPLOYMENT_READINESS_REPORT.md** dosyasını oku
2. ✅ Kritik eksikleri gider:
   - Email servisi entegrasyonu
   - Organization kullanıcı davet sistemi
3. ✅ Production environment hazırlığı yap
4. ✅ Security ayarlarını sıkılaştır (JWT secrets, CORS, vb.)
5. ✅ Monitoring ve logging ekle

---

## 📞 Destek

Sorun yaşıyorsanız:

1. **GitHub Issues**: Sorunları raporlayın
2. **Logları kontrol edin**:
   ```bash
   # Backend logs
   cd auth-service && npm run dev

   # Frontend logs
   cd admin-dashboard && npm run dev

   # Database logs
   docker logs oauth-postgres
   ```

3. **Database durumunu kontrol edin**:
   ```bash
   psql -U postgres -d oauth_db -c "\d+"
   ```

---

## 🎉 Başarılı Kurulum!

Tebrikler! OAuth Multi-Tenant SaaS Platform'unuz local ortamınızda çalışıyor.

**Erişim Noktaları:**
- 🌐 Frontend: http://localhost:5173
- 🔧 Backend API: http://localhost:3000
- 🗄️ PostgreSQL: localhost:5432
- 📊 API Docs: http://localhost:3000/api-docs (gelecekte)

**Test Kullanıcısı:**
- Email: admin@test.com
- Password: Admin123!
- Rol: Super Admin

---

**İyi kodlamalar! 🚀**
