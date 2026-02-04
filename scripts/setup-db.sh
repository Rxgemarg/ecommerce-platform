#!/bin/bash

# Simple PostgreSQL setup for development without Docker
# This uses pgadmin/PostgreSQL if available, or provides instructions

echo "🔍 Checking for PostgreSQL installation..."

# Check if PostgreSQL is installed
if command -v psql &> /dev/null; then
    echo "✅ PostgreSQL client found"
else
    echo "❌ PostgreSQL client not found"
    echo "Installing PostgreSQL client..."
    sudo apt-get update && sudo apt-get install -y postgresql-client
fi

# Check if we can connect to a local PostgreSQL
if psql -h localhost -U postgres -d postgres -c "SELECT 1;" &> /dev/null; then
    echo "✅ PostgreSQL is running locally"
    echo "Creating development database..."
    createdb -h localhost -U postgres ecommerce 2>/dev/null || echo "Database may already exist"
    
    # Update .env with local connection
    cat > .env << EOF
# Database
DATABASE_URL="postgresql://postgres:password@localhost:5432/ecommerce"

# JWT Secret (if using JWT auth)
JWT_SECRET="dev-super-secret-jwt-key-change-in-production"

# Session Secret (if using cookie auth)
SESSION_SECRET="dev-super-secret-session-key-change-in-production"

# API Configuration
API_PORT=3001
API_HOST=localhost

# Next.js Configuration
NEXT_PUBLIC_API_URL=http://localhost:3001

# Redis (Optional - for Phase 2)
REDIS_URL="redis://localhost:6379"

# Meilisearch (Optional - for Phase 2)
MEILISEARCH_URL="http://localhost:7700"
MEILISEARCH_KEY="dev-meilisearch-key"

# File Upload
UPLOAD_DIR="./uploads"
MAX_FILE_SIZE=5242880

# CORS Configuration
ALLOWED_ORIGINS="http://localhost:3000,http://localhost:3002"

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Email (Optional)
SMTP_HOST=""
SMTP_PORT=""
SMTP_USER=""
SMTP_PASS=""
FROM_EMAIL=""

# Payment (Sandbox)
STRIPE_PUBLIC_KEY=""
STRIPE_SECRET_KEY=""
STRIPE_WEBHOOK_SECRET=""
EOF
    echo "✅ Environment configured for local PostgreSQL"
    echo "📝 Note: Using 'postgres' user with 'password' - adjust if your local setup differs"
else
    echo "⚠️  PostgreSQL is not running locally"
    echo ""
    echo "Options to get PostgreSQL running:"
    echo ""
    echo "1. Start PostgreSQL service:"
    echo "   sudo systemctl start postgresql"
    echo ""
    echo "2. Install PostgreSQL locally:"
    echo "   sudo apt-get install postgresql postgresql-contrib"
    echo "   sudo -u postgres createuser --interactive"
    echo "   sudo -u postgres createdb ecommerce"
    echo ""
    echo "3. Use Docker (if permissions can be fixed):"
    echo "   sudo usermod -aG docker \$USER"
    echo "   # Log out and back in, then:"
    echo "   docker compose up -d postgres"
    echo ""
    echo "4. Use a cloud PostgreSQL service (ElephantSQL, Supabase, etc.)"
    echo ""
    
    # Create a template .env with placeholder
    cat > .env << EOF
# Database - PLEASE UPDATE WITH YOUR DATABASE URL
DATABASE_URL="postgresql://username:password@host:5432/database"

# JWT Secret (if using JWT auth)
JWT_SECRET="dev-super-secret-jwt-key-change-in-production"

# Session Secret (if using cookie auth)
SESSION_SECRET="dev-super-secret-session-key-change-in-production"

# API Configuration
API_PORT=3001
API_HOST=localhost

# Next.js Configuration
NEXT_PUBLIC_API_URL=http://localhost:3001

# Redis (Optional - for Phase 2)
REDIS_URL="redis://localhost:6379"

# Meilisearch (Optional - for Phase 2)
MEILISEARCH_URL="http://localhost:7700"
MEILISEARCH_KEY="dev-meilisearch-key"

# File Upload
UPLOAD_DIR="./uploads"
MAX_FILE_SIZE=5242880

# CORS Configuration
ALLOWED_ORIGINS="http://localhost:3000,http://localhost:3002"

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Email (Optional)
SMTP_HOST=""
SMTP_PORT=""
SMTP_USER=""
SMTP_PASS=""
FROM_EMAIL=""

# Payment (Sandbox)
STRIPE_PUBLIC_KEY=""
STRIPE_SECRET_KEY=""
STRIPE_WEBHOOK_SECRET=""
EOF
    echo "📝 Created .env template - please update DATABASE_URL"
fi