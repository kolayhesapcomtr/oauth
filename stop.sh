#!/bin/bash

# OAuth Multi-Tenant Platform - Stop Script
# Çalışan servisleri durdurur

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "🛑 OAuth Platform servisleri durduruluyor..."
echo ""

# Backend'i durdur
if [ -f ".backend.pid" ]; then
    BACKEND_PID=$(cat .backend.pid)
    if kill -0 "$BACKEND_PID" 2>/dev/null; then
        kill "$BACKEND_PID"
        echo -e "${GREEN}✅ Backend durduruldu (PID: $BACKEND_PID)${NC}"
    else
        echo -e "${YELLOW}⚠️  Backend zaten çalışmıyor${NC}"
    fi
    rm .backend.pid
else
    echo -e "${YELLOW}⚠️  Backend PID dosyası bulunamadı${NC}"
fi

# Frontend'i durdur
if [ -f ".frontend.pid" ]; then
    FRONTEND_PID=$(cat .frontend.pid)
    if kill -0 "$FRONTEND_PID" 2>/dev/null; then
        kill "$FRONTEND_PID"
        echo -e "${GREEN}✅ Frontend durduruldu (PID: $FRONTEND_PID)${NC}"
    else
        echo -e "${YELLOW}⚠️  Frontend zaten çalışmıyor${NC}"
    fi
    rm .frontend.pid
else
    echo -e "${YELLOW}⚠️  Frontend PID dosyası bulunamadı${NC}"
fi

# 3000 ve 5173 portlarında çalışan process'leri bul ve durdur
echo ""
echo "🔍 Port 3000 ve 5173'te çalışan process'ler kontrol ediliyor..."

# Port 3000 (Backend)
PID_3000=$(lsof -ti:3000 2>/dev/null)
if [ -n "$PID_3000" ]; then
    kill -9 $PID_3000 2>/dev/null
    echo -e "${GREEN}✅ Port 3000'deki process durduruldu${NC}"
fi

# Port 5173 (Frontend)
PID_5173=$(lsof -ti:5173 2>/dev/null)
if [ -n "$PID_5173" ]; then
    kill -9 $PID_5173 2>/dev/null
    echo -e "${GREEN}✅ Port 5173'teki process durduruldu${NC}"
fi

echo ""
echo -e "${GREEN}✅ Tüm servisler durduruldu!${NC}"
echo ""
