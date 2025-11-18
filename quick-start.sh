#!/bin/bash

# OAuth Multi-Tenant Platform - Quick Start Script
# Bu script tüm servisleri otomatik olarak başlatır

set -e

echo "🚀 OAuth Multi-Tenant Platform - Quick Start"
echo "=============================================="
echo ""

# Renk kodları
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Hata durumunda mesaj göster
error_exit() {
    echo -e "${RED}❌ Hata: $1${NC}" 1>&2
    exit 1
}

# Başarı mesajı
success() {
    echo -e "${GREEN}✅ $1${NC}"
}

# Uyarı mesajı
warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

# Gereksinim kontrolü
check_requirements() {
    echo "📋 Gereksinimleri kontrol ediliyor..."

    # Node.js kontrolü
    if ! command -v node &> /dev/null; then
        error_exit "Node.js bulunamadı. Lütfen Node.js 18+ yükleyin."
    fi
    NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$NODE_VERSION" -lt 18 ]; then
        error_exit "Node.js 18+ gerekli. Mevcut: v$NODE_VERSION"
    fi
    success "Node.js $(node -v) bulundu"

    # PostgreSQL kontrolü
    if ! command -v psql &> /dev/null; then
        warning "psql bulunamadı. PostgreSQL yüklü mü?"
    else
        success "PostgreSQL bulundu"
    fi

    # npm kontrolü
    if ! command -v npm &> /dev/null; then
        error_exit "npm bulunamadı."
    fi
    success "npm $(npm -v) bulundu"

    echo ""
}

# PostgreSQL kontrol ve başlatma
setup_database() {
    echo "🗄️  Veritabanı hazırlanıyor..."

    # PostgreSQL çalışıyor mu kontrol et
    if pg_isready -h localhost -p 5432 &> /dev/null; then
        success "PostgreSQL çalışıyor"

        # Veritabanı var mı kontrol et
        if psql -h localhost -U postgres -lqt | cut -d \| -f 1 | grep -qw oauth_db; then
            success "oauth_db veritabanı mevcut"
        else
            echo "📦 oauth_db veritabanı oluşturuluyor..."
            psql -h localhost -U postgres -c "CREATE DATABASE oauth_db;" || error_exit "Veritabanı oluşturulamadı"
            success "oauth_db veritabanı oluşturuldu"
        fi

        # Migration'ları çalıştır
        echo "🔄 Migration'lar çalıştırılıyor..."
        psql -h localhost -U postgres -d oauth_db -f database/migrations-001-initial-schema.sql > /dev/null 2>&1 || true
        psql -h localhost -U postgres -d oauth_db -f database/migrations-002-rbac.sql > /dev/null 2>&1 || true
        psql -h localhost -U postgres -d oauth_db -f database/migrations-003-subscriptions.sql > /dev/null 2>&1 || true
        psql -h localhost -U postgres -d oauth_db -f database/migrations-004-payment-providers.sql > /dev/null 2>&1 || true
        success "Migration'lar tamamlandı"

    else
        warning "PostgreSQL çalışmıyor gibi görünüyor"
        echo "Docker ile PostgreSQL başlatmak ister misiniz? (y/n)"
        read -r response
        if [[ "$response" =~ ^[Yy]$ ]]; then
            docker-compose up -d postgres || error_exit "PostgreSQL başlatılamadı"
            echo "⏳ PostgreSQL'in hazır olması bekleniyor (10 saniye)..."
            sleep 10
            success "PostgreSQL Docker ile başlatıldı"
        else
            error_exit "PostgreSQL gerekli. Lütfen PostgreSQL'i başlatın."
        fi
    fi

    echo ""
}

# Backend kurulum
setup_backend() {
    echo "🔧 Backend kurulumu yapılıyor..."

    cd auth-service

    # package.json var mı kontrol et
    if [ ! -f "package.json" ]; then
        error_exit "auth-service/package.json bulunamadı"
    fi

    # node_modules var mı
    if [ ! -d "node_modules" ]; then
        echo "📦 Backend dependencies yükleniyor..."
        npm install || error_exit "Backend dependencies yüklenemedi"
        success "Backend dependencies yüklendi"
    else
        success "Backend dependencies mevcut"
    fi

    # .env dosyası var mı
    if [ ! -f ".env" ]; then
        echo "⚙️  .env dosyası oluşturuluyor..."
        cp .env.example .env || error_exit ".env dosyası oluşturulamadı"
        success ".env dosyası oluşturuldu"
        warning "Lütfen auth-service/.env dosyasını düzenleyin!"
    else
        success ".env dosyası mevcut"
    fi

    cd ..
    echo ""
}

# Frontend kurulum
setup_frontend() {
    echo "🎨 Frontend kurulumu yapılıyor..."

    cd admin-dashboard

    # package.json var mı kontrol et
    if [ ! -f "package.json" ]; then
        error_exit "admin-dashboard/package.json bulunamadı"
    fi

    # node_modules var mı
    if [ ! -d "node_modules" ]; then
        echo "📦 Frontend dependencies yükleniyor..."
        npm install || error_exit "Frontend dependencies yüklenemedi"
        success "Frontend dependencies yüklendi"
    else
        success "Frontend dependencies mevcut"
    fi

    # .env dosyası var mı
    if [ ! -f ".env" ]; then
        echo "⚙️  .env dosyası oluşturuluyor..."
        cp .env.example .env || error_exit ".env dosyası oluşturulamadı"
        success ".env dosyası oluşturuldu"
    else
        success ".env dosyası mevcut"
    fi

    cd ..
    echo ""
}

# Servisleri başlat
start_services() {
    echo "🚀 Servisler başlatılıyor..."
    echo ""
    echo "Backend ve Frontend ayrı terminal pencerelerinde başlatılacak."
    echo "Devam etmek için bir tuşa basın..."
    read -n 1 -s

    # Backend'i arka planda başlat
    echo "📡 Backend başlatılıyor (http://localhost:3000)..."
    cd auth-service
    npm run dev > ../backend.log 2>&1 &
    BACKEND_PID=$!
    cd ..
    success "Backend başlatıldı (PID: $BACKEND_PID)"

    # Backend'in hazır olmasını bekle
    echo "⏳ Backend'in hazır olması bekleniyor..."
    for i in {1..30}; do
        if curl -s http://localhost:3000/api/health > /dev/null 2>&1; then
            success "Backend hazır!"
            break
        fi
        if [ $i -eq 30 ]; then
            error_exit "Backend 30 saniye içinde başlamadı. backend.log'u kontrol edin."
        fi
        sleep 1
    done

    # Frontend'i arka planda başlat
    echo "🎨 Frontend başlatılıyor (http://localhost:5173)..."
    cd admin-dashboard
    npm run dev > ../frontend.log 2>&1 &
    FRONTEND_PID=$!
    cd ..
    success "Frontend başlatıldı (PID: $FRONTEND_PID)"

    # PID'leri kaydet
    echo "$BACKEND_PID" > .backend.pid
    echo "$FRONTEND_PID" > .frontend.pid

    echo ""
}

# Ana işlem
main() {
    check_requirements
    setup_database
    setup_backend
    setup_frontend
    start_services

    echo ""
    echo "=============================================="
    echo "✅ KURULUM TAMAMLANDI!"
    echo "=============================================="
    echo ""
    echo "📍 Erişim Noktaları:"
    echo "   🌐 Frontend:  http://localhost:5173"
    echo "   🔧 Backend:   http://localhost:3000"
    echo "   🗄️  Database:  localhost:5432/oauth_db"
    echo ""
    echo "📊 Loglar:"
    echo "   Backend:  tail -f backend.log"
    echo "   Frontend: tail -f frontend.log"
    echo ""
    echo "🛑 Durdurmak için:"
    echo "   ./stop.sh"
    echo ""
    echo "📖 Daha fazla bilgi için:"
    echo "   LOCAL_SETUP_GUIDE.md"
    echo ""
    echo "🎉 İyi kodlamalar!"
    echo ""
}

# Script'i çalıştır
main
