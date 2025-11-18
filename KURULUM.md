# 🚀 OAuth Platform - Yerel Kurulum Kılavuzu

Bu kılavuz, OAuth Multi-Tenant SaaS Authentication Platform'unu kendi bilgisayarınızda çalıştırmanız için adım adım talimatlar içerir.

## 📋 Gereksinimler

Sisteminizde şu programların kurulu olması gerekiyor:

### Opsiyonel 1: Docker ile (ÖNERİLEN - EN KOLAY)
- **Docker Desktop** ([İndir](https://www.docker.com/products/docker-desktop))
- **Git** ([İndir](https://git-scm.com/downloads))

### Opsiyonel 2: Manuel Kurulum
- **Node.js** 18 veya üzeri ([İndir](https://nodejs.org/))
- **PostgreSQL** 14 veya üzeri ([İndir](https://www.postgresql.org/download/))
- **Git** ([İndir](https://git-scm.com/downloads))

## 🎯 Seçenek 1: Docker ile Kurulum (ÖNERİLEN)

### Adım 1: Projeyi İndirin

Terminal/Komut İstemi'ni açın ve şu komutları çalıştırın:

```bash
# Projeyi klonlayın (GitHub linkinizi buraya yazın)
git clone <github-repo-url>
cd oauth
```

### Adım 2: Docker Desktop'ı Başlatın

- Docker Desktop uygulamasını açın ve çalıştığından emin olun
- Windows: Sistem tepsisinde Docker simgesi yeşil olmalı
- Mac: Menü çubuğunda Docker simgesi aktif olmalı

### Adım 3: Ortam Değişkenlerini Ayarlayın

```bash
# .env.example dosyasını .env olarak kopyalayın
cp .env.example .env
```

**Windows PowerShell için:**
```powershell
Copy-Item .env.example .env
```

Şimdi `.env` dosyasını bir metin editörü ile açın ve şu satırları düzenleyin:

```env
# PostgreSQL Ayarları
DB_HOST=postgres
DB_PORT=5432
DB_NAME=oauth_db
DB_USER=postgres
DB_PASSWORD=postgres

# JWT Gizli Anahtar (Güvenli bir değer girin - en az 32 karakter)
JWT_SECRET=cok-gizli-ve-uzun-bir-anahtar-buraya-yazilacak-123456789

# Email Ayarları (İSTEĞE BAĞLI - Gmail kullanıyorsanız)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=sizin-email@gmail.com
SMTP_PASSWORD=gmail-uygulama-sifresi
```

#### Gmail Uygulama Şifresi Nasıl Alınır?

1. Google Hesabınıza gidin: https://myaccount.google.com/
2. **Güvenlik** → **2 Adımlı Doğrulama**'yı etkinleştirin
3. **Uygulama şifreleri**'ne tıklayın
4. Uygulama seçin: **Mail**
5. Cihaz seçin: **Diğer** → "OAuth Platform" yazın
6. **Oluştur**'a tıklayın
7. Verilen 16 haneli şifreyi kopyalayıp `SMTP_PASSWORD` kısmına yapıştırın

**NOT**: Email ayarları opsiyoneldir. Email göndermek istemiyorsanız boş bırakabilirsiniz.

### Adım 4: Tüm Servisleri Başlatın

```bash
docker-compose up -d
```

Bu komut şunları başlatır:
- **PostgreSQL veritabanı** (port: 5432)
- **Auth Service (Backend API)** (port: 3000)
- **Admin Dashboard (Frontend)** (port: 5173)

İlk çalıştırmada Docker imajlarını indireceği için 2-5 dakika sürebilir.

### Adım 5: Servislerin Çalışıp Çalışmadığını Kontrol Edin

```bash
# Servislerin durumunu kontrol edin
docker-compose ps
```

Çıktı şöyle görünmeli:
```
NAME                           STATUS
oauth-admin-dashboard          running
oauth-auth-service             running
oauth-postgres                 running
```

Logları görmek için:
```bash
# Tüm servislerin loglarını göster
docker-compose logs -f

# Sadece auth-service loglarını göster
docker-compose logs -f auth-service

# Sadece admin-dashboard loglarını göster
docker-compose logs -f admin-dashboard
```

### Adım 6: Platforma Erişin

Tarayıcınızı açın ve şu adreslere gidin:

- **Admin Dashboard**: http://localhost:5173
- **API**: http://localhost:3000
- **API Sağlık Kontrolü**: http://localhost:3000/api/health

### Adım 7: Giriş Yapın

Varsayılan test hesapları (seed data'dan):

**Super Admin Hesabı:**
- Email: `admin@example.com`
- Şifre: `Test123!`

**Normal Kullanıcı Hesabı:**
- Email: `ahmet@example.com`
- Şifre: `Test123!`

### 🎉 Tebrikler!

Platform başarıyla kuruldu! Artık:
- ✅ Organizasyonlar oluşturabilirsiniz
- ✅ Domain'ler ekleyebilirsiniz
- ✅ Kullanıcıları davet edebilirsiniz
- ✅ Planları yönetebilirsiniz
- ✅ Analitiği görüntüleyebilirsiniz

---

## 🎯 Seçenek 2: Manuel Kurulum (Docker Kullanmadan)

### Adım 1: Projeyi İndirin

```bash
git clone <github-repo-url>
cd oauth
```

### Adım 2: PostgreSQL Veritabanını Kurun

#### Windows:
1. PostgreSQL'i yükleyin: https://www.postgresql.org/download/windows/
2. pgAdmin'i açın
3. Yeni bir veritabanı oluşturun: `oauth_db`

#### Mac (Homebrew ile):
```bash
brew install postgresql@14
brew services start postgresql@14
createdb oauth_db
```

#### Linux (Ubuntu/Debian):
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
sudo -u postgres createdb oauth_db
```

### Adım 3: Veritabanı Şemalarını Yükleyin

```bash
# Schema dosyalarını yükle
psql -U postgres -d oauth_db -f database/schema.sql
psql -U postgres -d oauth_db -f database/organization-schema.sql

# Test verileri yükle (opsiyonel)
psql -U postgres -d oauth_db -f database/seed.sql
```

**NOT**: PostgreSQL şifreniz varsa `-W` ekleyin ve şifrenizi girin.

### Adım 4: Backend (Auth Service) Kurulumu

```bash
cd auth-service

# Bağımlılıkları yükle
npm install

# .env dosyasını oluştur
cp .env.example .env
```

`.env` dosyasını düzenleyin:

```env
NODE_ENV=development
PORT=3000

# Veritabanı
DB_HOST=localhost
DB_PORT=5432
DB_NAME=oauth_db
DB_USER=postgres
DB_PASSWORD=your-postgres-password

# JWT
JWT_SECRET=cok-gizli-ve-uzun-bir-anahtar-buraya-yazilacak-123456789
JWT_EXPIRES_IN=24h
JWT_REFRESH_EXPIRES_IN=7d

# Email (opsiyonel)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=sizin-email@gmail.com
SMTP_PASSWORD=gmail-uygulama-sifresi

# CORS
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3001,http://localhost:3002

# Frontend URL
FRONTEND_URL=http://localhost:5173
```

Backend'i başlatın:

```bash
npm run dev
```

Backend şu adreste çalışacak: http://localhost:3000

### Adım 5: Frontend (Admin Dashboard) Kurulumu

Yeni bir terminal açın:

```bash
cd admin-dashboard

# Bağımlılıkları yükle
npm install

# .env dosyasını oluştur
cp .env.example .env
```

`.env` dosyasını düzenleyin:

```env
VITE_API_URL=http://localhost:3000/api
```

Frontend'i başlatın:

```bash
npm run dev
```

Admin Dashboard şu adreste açılacak: http://localhost:5173

### 🎉 Tebrikler!

Manuel kurulum tamamlandı! Artık her iki terminal penceresi de açık kalmalı:
- Terminal 1: Backend (port 3000)
- Terminal 2: Frontend (port 5173)

---

## 🧪 Kurulumu Test Edin

### 1. API Sağlık Kontrolü

```bash
curl http://localhost:3000/api/health
```

Beklenen çıktı:
```json
{
  "status": "ok",
  "timestamp": "2025-11-18T..."
}
```

### 2. Veritabanı Kontrolü

```bash
# Docker ile
docker-compose exec postgres psql -U postgres -d oauth_db -c "SELECT COUNT(*) FROM organizations;"

# Manuel kurulumda
psql -U postgres -d oauth_db -c "SELECT COUNT(*) FROM organizations;"
```

Beklenen çıktı: En az 2 organizasyon olmalı.

### 3. Admin Dashboard'a Giriş

1. http://localhost:5173 adresine gidin
2. Email: `admin@example.com`
3. Şifre: `Test123!`
4. Giriş yapın ve Dashboard'u görün

---

## 🛠️ Yaygın Sorunlar ve Çözümleri

### Problem: Port zaten kullanımda

**Hata:**
```
Error: Port 3000 is already in use
```

**Çözüm:**

```bash
# Portu kullanan programı bulun
# Windows
netstat -ano | findstr :3000

# Mac/Linux
lsof -i :3000

# İşlemi sonlandırın
# Windows
taskkill /PID <PID> /F

# Mac/Linux
kill -9 <PID>
```

Ya da `docker-compose.yml` ve `.env` dosyalarındaki portları değiştirin.

### Problem: Docker servisi başlamıyor

**Çözüm:**

```bash
# Servisleri durdurun
docker-compose down

# Volumeleri temizleyin
docker-compose down -v

# Yeniden başlatın
docker-compose up -d

# Logları kontrol edin
docker-compose logs -f
```

### Problem: Veritabanına bağlanamıyor

**Hata:**
```
Error: connect ECONNREFUSED 127.0.0.1:5432
```

**Çözüm:**

```bash
# Docker ile
docker-compose ps postgres  # PostgreSQL çalışıyor mu kontrol edin
docker-compose restart postgres

# Manuel kurulumda
# Windows
pg_ctl status

# Mac
brew services list

# Linux
sudo systemctl status postgresql
```

### Problem: Email gönderilmiyor

**Çözüm:**

1. `.env` dosyasında SMTP bilgilerini kontrol edin
2. Gmail kullanıyorsanız, Uygulama Şifresini doğru oluşturduğunuzdan emin olun
3. 2 Adımlı Doğrulama'nın açık olduğunu kontrol edin
4. Logları kontrol edin:
   ```bash
   docker-compose logs -f auth-service | grep -i email
   ```

### Problem: Admin Dashboard boş sayfa gösteriyor

**Çözüm:**

1. Tarayıcı konsolunu açın (F12)
2. Hataları kontrol edin
3. Backend'in çalıştığından emin olun: http://localhost:3000/api/health
4. `.env` dosyasında `VITE_API_URL` doğru mu kontrol edin
5. Sayfayı yeniden yükleyin (Ctrl+F5 / Cmd+Shift+R)

---

## 📊 Veritabanı Yönetimi

### Organizasyonları Görüntüleme

```bash
docker-compose exec postgres psql -U postgres -d oauth_db -c "SELECT name, plan, status FROM organizations;"
```

### Subscription Planlarını Görüntüleme

```bash
docker-compose exec postgres psql -U postgres -d oauth_db -c "SELECT name, monthly_price, yearly_price FROM subscription_plans;"
```

### Kullanıcıları Görüntüleme

```bash
docker-compose exec postgres psql -U postgres -d oauth_db -c "SELECT email, first_name, last_name FROM users;"
```

### Veritabanını Sıfırlama

```bash
# Tüm verileri sil ve yeniden başlat
docker-compose down -v
docker-compose up -d

# Sadece verileri sil, schema'yı koru
docker-compose exec postgres psql -U postgres -d oauth_db -c "TRUNCATE TABLE users, organizations, domains, tenants CASCADE;"
```

---

## 🚀 Kullanıma Başlayın

### 1. Yeni Organizasyon Oluşturun

1. Admin Dashboard'a giriş yapın
2. **Organizations** sayfasına gidin
3. **Create Organization** butonuna tıklayın
4. Formu doldurun:
   - **Name**: Firma adı
   - **Slug**: URL dostu isim (örn: firma-a)
   - **Owner Email**: Firma sahibinin emaili
   - **Plan**: Trial / Starter / Business / Enterprise seçin
5. **Create** butonuna tıklayın
6. Email gönderilirse, hoş geldiniz emaili alacaksınız

### 2. Domain Ekleyin

1. **Domains** sayfasına gidin
2. **Create Domain** butonuna tıklayın
3. Formu doldurun:
   - **Organization**: Organizasyon seçin
   - **Name**: Domain adı (örn: CRM Sistemi)
   - **Slug**: crm
   - **Domain**: crm.example.com
   - **Description**: Açıklama
4. **Create Domain** butonuna tıklayın

### 3. Kullanıcı Davet Edin

1. **Organizations** sayfasında bir organizasyona tıklayın
2. **Invite User** butonuna tıklayın
3. Email, isim ve rol bilgilerini girin
4. **Send Invitation** butonuna tıklayın

### 4. Analytics'i Görüntüleyin

1. **Analytics** sayfasına gidin
2. Kullanım trendlerini görün
3. API çağrı istatistiklerini inceleyin
4. Hata raporlarını kontrol edin

### 5. Ayarları Düzenleyin

1. **Settings** sayfasına gidin
2. **General**: Platform ayarları
3. **Email**: SMTP yapılandırması
4. **Security**: JWT token süreleri
5. **System**: Sistem bilgileri ve veritabanı yönetimi

---

## 🔒 Güvenlik Kontrol Listesi

Production'a geçmeden önce:

- [ ] `JWT_SECRET` değerini güçlü, rastgele bir değere değiştirin (en az 32 karakter)
- [ ] Varsayılan admin şifresini değiştirin (admin@example.com)
- [ ] `ALLOWED_ORIGINS` değerini gerçek domain'lerinize göre güncelleyin
- [ ] HTTPS etkinleştirin (production'da)
- [ ] Güvenlik duvarı kurallarını yapılandırın
- [ ] Düzenli veritabanı yedekleme stratejisi oluşturun
- [ ] Audit log'larını aktif edin
- [ ] Monitoring ve alerting kurulumunu yapın

---

## 📁 Proje Yapısı

```
oauth/
├── auth-service/              # Backend API servisi
│   ├── src/
│   │   ├── config/           # Konfigürasyon dosyaları
│   │   ├── controllers/      # Route controller'ları
│   │   ├── middleware/       # Express middleware'ler
│   │   ├── routes/           # API route tanımları
│   │   ├── services/         # İş mantığı
│   │   ├── types/            # TypeScript tip tanımları
│   │   └── index.ts          # Giriş noktası
│   ├── .env.example          # Örnek ortam değişkenleri
│   └── package.json
│
├── admin-dashboard/          # React admin paneli
│   ├── src/
│   │   ├── components/       # React komponentleri
│   │   ├── pages/            # Sayfa komponentleri
│   │   ├── stores/           # Zustand state yönetimi
│   │   ├── services/         # API servisleri
│   │   └── lib/              # Yardımcı kütüphaneler
│   ├── .env.example
│   └── package.json
│
├── database/                 # Veritabanı dosyaları
│   ├── schema.sql            # Ana veritabanı şeması
│   ├── organization-schema.sql  # Organizasyon şeması
│   └── seed.sql              # Test verileri
│
├── docker-compose.yml        # Docker yapılandırması
├── .env.example              # Genel ortam değişkenleri
├── README.md                 # İngilizce dokümantasyon
├── KURULUM.md               # Türkçe kurulum kılavuzu (bu dosya)
└── SETUP.md                  # Detaylı kurulum kılavuzu
```

---

## 🆘 Yardım Alma

### Sorun mu yaşıyorsunuz?

1. **Logları kontrol edin:**
   ```bash
   docker-compose logs -f
   ```

2. **Servislerin durumunu kontrol edin:**
   ```bash
   docker-compose ps
   ```

3. **Servisleri yeniden başlatın:**
   ```bash
   docker-compose restart
   ```

4. **Tam reset (dikkatli kullanın, tüm veri silinir):**
   ```bash
   docker-compose down -v
   docker-compose up -d
   ```

### Daha fazla yardım için:

- **README.md**: İngilizce genel dokümantasyon
- **SETUP.md**: Detaylı kurulum talimatları
- **GitHub Issues**: Sorun bildirin veya soru sorun

---

## 🎓 Sonraki Adımlar

Kurulum tamamlandıktan sonra:

1. **Test Edin**: Tüm özellikleri test edin ve tanıyın
2. **Özelleştirin**: Logo, renkler ve branding'i güncelleyin
3. **Planları Ayarlayın**: Subscription planlarını ihtiyacınıza göre düzenleyin
4. **Domain'leri Ekleyin**: Kendi SaaS uygulamalarınızı ekleyin
5. **Kullanıcıları Davet Edin**: Ekibinizi platforma davet edin
6. **Production'a Hazırlık**: Güvenlik kontrol listesini tamamlayın

---

**İyi çalışmalar! 🚀**

Sorularınız için: GitHub Issues
