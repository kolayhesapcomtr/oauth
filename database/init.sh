#!/bin/bash

# Database initialization script for OAuth Multi-Tenant SaaS Platform

echo "🚀 Initializing OAuth Multi-Tenant SaaS Platform Database..."

# Configuration
DB_NAME=${DB_NAME:-"oauth_db"}
DB_USER=${DB_USER:-"postgres"}
DB_HOST=${DB_HOST:-"localhost"}
DB_PORT=${DB_PORT:-"5432"}

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Database:${NC} $DB_NAME"
echo -e "${YELLOW}User:${NC} $DB_USER"
echo -e "${YELLOW}Host:${NC} $DB_HOST:$DB_PORT"
echo ""

# Check if psql is installed
if ! command -v psql &> /dev/null; then
    echo -e "${RED}❌ Error: psql is not installed${NC}"
    echo "Please install PostgreSQL client tools"
    exit 1
fi

# Check if database exists
if psql -h $DB_HOST -p $DB_PORT -U $DB_USER -lqt | cut -d \| -f 1 | grep -qw $DB_NAME; then
    echo -e "${YELLOW}⚠️  Database $DB_NAME already exists${NC}"
    read -p "Do you want to drop and recreate it? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo -e "${YELLOW}Dropping database...${NC}"
        dropdb -h $DB_HOST -p $DB_PORT -U $DB_USER $DB_NAME
        echo -e "${GREEN}✅ Database dropped${NC}"
    else
        echo -e "${YELLOW}Skipping database creation${NC}"
        DB_EXISTS=true
    fi
fi

# Create database if it doesn't exist
if [ "$DB_EXISTS" != "true" ]; then
    echo -e "${YELLOW}Creating database...${NC}"
    createdb -h $DB_HOST -p $DB_PORT -U $DB_USER $DB_NAME
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Database created${NC}"
    else
        echo -e "${RED}❌ Failed to create database${NC}"
        exit 1
    fi
fi

# Run schema migrations
echo ""
echo -e "${YELLOW}Running schema migrations...${NC}"

# 1. Core schema
echo "  📝 Applying core schema..."
psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -f "$(dirname "$0")/schema.sql" > /dev/null 2>&1
if [ $? -eq 0 ]; then
    echo -e "  ${GREEN}✅ Core schema applied${NC}"
else
    echo -e "  ${RED}❌ Failed to apply core schema${NC}"
    exit 1
fi

# 2. Organization schema
echo "  📝 Applying organization schema..."
psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -f "$(dirname "$0")/organization-schema.sql" > /dev/null 2>&1
if [ $? -eq 0 ]; then
    echo -e "  ${GREEN}✅ Organization schema applied${NC}"
else
    echo -e "  ${RED}❌ Failed to apply organization schema${NC}"
    exit 1
fi

# 3. Seed data (optional)
echo ""
read -p "Do you want to load test data? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${YELLOW}Loading test data...${NC}"
    if [ -f "$(dirname "$0")/seed.sql" ]; then
        psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -f "$(dirname "$0")/seed.sql" > /dev/null 2>&1
        if [ $? -eq 0 ]; then
            echo -e "${GREEN}✅ Test data loaded${NC}"
        else
            echo -e "${RED}❌ Failed to load test data${NC}"
        fi
    else
        echo -e "${YELLOW}⚠️  seed.sql not found, skipping${NC}"
    fi
fi

# Verify installation
echo ""
echo -e "${YELLOW}Verifying installation...${NC}"

# Check tables
TABLE_COUNT=$(psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';")
echo -e "  📊 Tables created: ${GREEN}$TABLE_COUNT${NC}"

# Check plans
PLAN_COUNT=$(psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -t -c "SELECT COUNT(*) FROM subscription_plans;")
echo -e "  💳 Subscription plans: ${GREEN}$PLAN_COUNT${NC}"

echo ""
echo -e "${GREEN}🎉 Database initialization complete!${NC}"
echo ""
echo "Next steps:"
echo "  1. Configure your .env file in auth-service/"
echo "  2. Run: cd auth-service && npm install"
echo "  3. Run: npm run dev"
echo ""
echo "For more information, see README.md"
