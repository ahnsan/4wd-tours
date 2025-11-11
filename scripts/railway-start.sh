#!/bin/bash
set -e

echo "🔄 Running database migrations..."
npx medusa db:migrate

# Check if admin is enabled and build files are missing
if [ "$DISABLE_ADMIN" != "true" ]; then
  echo "📦 Checking admin build files..."
  if [ ! -f ".medusa/admin/dist/index.html" ]; then
    echo "🏗️  Admin build files not found. Building admin dashboard..."
    npx medusa build --admin-only
  else
    echo "✅ Admin build files found."
  fi
fi

echo "✅ Migrations complete! Starting Medusa server..."
exec medusa start
