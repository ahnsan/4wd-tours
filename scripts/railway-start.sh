#!/bin/bash
set -e

echo "🔄 Running database migrations..."
npx medusa db:migrate

echo "✅ Migrations complete! Starting Medusa server..."
exec medusa start
