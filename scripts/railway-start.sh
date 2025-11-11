#!/bin/bash
set -e

# ========================================
# Railway Backend Start Script
# ========================================
# Purpose: Start Medusa backend server without admin UI
# Admin UI is deployed separately on Vercel
# This script only handles:
#   1. Database migrations
#   2. Backend server startup
# ========================================

echo "========================================="
echo "Railway Backend Startup"
echo "========================================="
echo "Admin: Disabled (Deployed separately on Vercel)"
echo "Backend API: Store + Admin API endpoints"
echo "========================================="

# Run database migrations
echo "🔄 Running database migrations..."
npx medusa db:migrate

if [ $? -eq 0 ]; then
  echo "✅ Migrations completed successfully!"
else
  echo "❌ Migration failed! Check logs above."
  exit 1
fi

# Start Medusa backend server (API only, no admin UI)
echo "🚀 Starting Medusa backend server..."
echo "📡 Store API will be available at: /store/*"
echo "🔐 Admin API will be available at: /admin/*"
echo "⚠️  Admin UI is NOT served from this backend"
echo "========================================="

exec medusa start
