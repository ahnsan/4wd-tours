#!/bin/bash
set -e

# Build admin if not already built (only needed on first deploy or after code changes)
if [ ! -d ".medusa/admin" ] && [ "$DISABLE_ADMIN" != "true" ]; then
  echo "🏗️  Building admin dashboard (first deploy)..."
  npx medusa build
else
  echo "⏭️  Skipping admin build (already exists or disabled)"
fi

echo "🔄 Running database migrations..."
npx medusa db:migrate

echo "✅ Migrations complete! Starting Medusa server..."
exec medusa start
