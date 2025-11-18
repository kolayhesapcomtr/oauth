# ⚡ Hızlı Başlangıç - 5 Dakikada Çalıştır!

OAuth Multi-Tenant SaaS Platform'u en hızlı şekilde çalıştırmak için bu klavuzu takip edin.

## 🎯 Seçenekler

### Seçenek 1: Otomatik Script (ÖNERİLEN) ⚡

```bash
# Repository'yi clone'la
git clone https://github.com/kolayhesapcomtr/oauth.git
cd oauth

# Tek komutla başlat!
./quick-start.sh
```

**Bu kadar!** Script otomatik olarak:
- ✅ Gereksinimleri kontrol eder
- ✅ PostgreSQL veritabanını hazırlar
- ✅ Migration'ları çalıştırır
- ✅ Backend ve Frontend dependencies'i yükler
- ✅ Servisleri başlatır

**Erişim:**
- Frontend: http://localhost:5173
- Backend: http://localhost:3000

---

### Seçenek 2: Docker Compose 🐳

```bash
# Repository'yi clone'la
git clone https://github.com/kolayhesapcomtr/oauth.git
cd oauth

# Docker ile başlat
docker-compose up -d

# Logları izle
docker-compose logs -f
```

**Erişim:**
- Frontend: http://localhost:5173
- Backend: http://localhost:3000
- PostgreSQL: localhost:5432

---

### Seçenek 3: Manuel Kurulum 🔧

Adım adım manuel kurulum için [LOCAL_SETUP_GUIDE.md](./LOCAL_SETUP_GUIDE.md) dosyasını okuyun.

---

## 🎮 İlk Giriş

### 1. Kullanıcı Oluştur

Frontend'e git: http://localhost:5173/register

```
Email:     admin@test.com
Password:  Admin123!
Ad:        Admin
Soyad:     User
```

### 2. Login Ol

http://localhost:5173/login

```
Email:     admin@test.com
Password:  Admin123!
```

### 3. Dashboard'u Keşfet!

Login olduktan sonra:
- 🏢 **Organizasyonlar** - Yeni organizasyon oluştur
- 🌐 **Domain'ler** - Domain ekle (örn: crm.test.com)
- 🏘️ **Kiracılar (Tenants)** - Tenant ekle
- 👥 **Kullanıcılar** - Kullanıcı davet et
- 💳 **Ödeme Ayarları** - iyzico/PayTR entegre et
- 📊 **Ödemeler** - İşlem geçmişini gör

---

## 🛑 Durdurma

### Otomatik Script ile:
```bash
./stop.sh
```

### Docker ile:
```bash
docker-compose down
```

### Manuel:
```bash
# Backend ve Frontend process'lerini durdur
pkill -f "npm run dev"

# veya port bazlı
kill $(lsof -ti:3000)
kill $(lsof -ti:5173)
```

---

## 📚 Sonraki Adımlar

1. **Veritabanını İncele**
   ```bash
   psql -h localhost -U postgres -d oauth_db
   \dt  # Tabloları listele
   ```

2. **API Dokümantasyonunu Gör**
   - Backend: http://localhost:3000/api-docs (yakında)

3. **Test Et**
   - Organizasyon oluştur
   - Domain ekle
   - Tenant ekle
   - Kullanıcı davet et
   - Ödeme ayarları yap

4. **Kodu Keşfet**
   - Backend: `auth-service/src/`
   - Frontend: `admin-dashboard/src/`
   - Database: `database/migrations-*.sql`

---

## ❓ Sorun mu Yaşıyorsun?

### Port kullanımda hatası
```bash
# Hangi process kullanıyor bul
lsof -i :3000
lsof -i :5173

# Durdur
kill -9 <PID>
```

### Database connection hatası
```bash
# PostgreSQL çalışıyor mu?
pg_isready -h localhost -p 5432

# Başlat
brew services start postgresql  # macOS
sudo systemctl start postgresql # Linux
docker-compose up -d postgres   # Docker
```

### Migration hataları
```bash
# Veritabanını sıfırla
psql -U postgres -c "DROP DATABASE oauth_db;"
psql -U postgres -c "CREATE DATABASE oauth_db;"

# Migration'ları tekrar çalıştır
cd database
psql -U postgres -d oauth_db -f migrations-001-initial-schema.sql
psql -U postgres -d oauth_db -f migrations-002-rbac.sql
psql -U postgres -d oauth_db -f migrations-003-subscriptions.sql
psql -U postgres -d oauth_db -f migrations-004-payment-providers.sql
```

---

## 📖 Dokümantasyon

- 📘 [Detaylı Kurulum Klavuzu](./LOCAL_SETUP_GUIDE.md)
- 📙 [README](./README.md)
- 📕 [Deployment Readiness Report](./DEPLOYMENT_READINESS_REPORT.md)

---

## 🎉 Hazırsın!

Platform çalışıyor! Artık:
- ✅ Multi-tenant sistemini keşfedebilirsin
- ✅ Ödeme entegrasyonlarını test edebilirsin
- ✅ API'leri kullanabilirsin
- ✅ Kodu özelleştirebilirsin

**İyi kodlamalar! 🚀**
