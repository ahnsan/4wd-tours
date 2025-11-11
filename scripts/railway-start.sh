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

    # Verify build succeeded
    if [ -f ".medusa/admin/dist/index.html" ]; then
      echo "✅ Admin dashboard built successfully!"
    else
      echo "❌ ERROR: Admin build failed - index.html not found after build"
      echo "📁 Checking build directory structure..."
      ls -la .medusa/admin/ || echo "No .medusa/admin directory"
      ls -la .medusa/admin/dist/ || echo "No .medusa/admin/dist directory"
      exit 1
    fi
  else
    echo "✅ Admin build files found."
  fi
fi

echo "✅ Migrations complete! Starting Medusa server..."
exec medusa start
