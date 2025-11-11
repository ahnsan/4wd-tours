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

    # The build outputs to .medusa/admin/ but server expects .medusa/admin/dist/
    # Move files to correct location
    if [ -f ".medusa/admin/index.html" ]; then
      echo "📂 Moving admin build files to dist directory..."
      mkdir -p .medusa/admin/dist
      mv .medusa/admin/index.html .medusa/admin/dist/
      mv .medusa/admin/assets .medusa/admin/dist/ 2>/dev/null || true
      echo "✅ Admin dashboard built and moved successfully!"
    else
      echo "❌ ERROR: Admin build failed - index.html not found in .medusa/admin/"
      echo "📁 Directory structure:"
      ls -la .medusa/admin/ || echo "No .medusa/admin directory"
      exit 1
    fi
  else
    echo "✅ Admin build files found."
  fi
fi

echo "✅ Migrations complete! Starting Medusa server..."
exec medusa start
