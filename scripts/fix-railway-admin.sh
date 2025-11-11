#!/bin/bash
set -e

echo "=========================================="
echo "Railway Admin Fix Script"
echo "=========================================="
echo ""
echo "This script will:"
echo "1. Remove DISABLE_ADMIN environment variable"
echo "2. Update ADMIN_CORS to include production domain"
echo "3. Update AUTH_CORS to include production domain"
echo "4. Trigger Railway redeploy"
echo ""

# Get Railway service info
echo "📋 Current Railway service:"
railway status --service 4wd-tours
echo ""

# Get current DISABLE_ADMIN value
echo "🔍 Checking current DISABLE_ADMIN value..."
DISABLE_ADMIN_VALUE=$(railway variables --service 4wd-tours | grep "DISABLE_ADMIN" | awk '{print $3}' || echo "not_set")
echo "Current value: $DISABLE_ADMIN_VALUE"
echo ""

if [ "$DISABLE_ADMIN_VALUE" = "true" ]; then
  echo "❌ DISABLE_ADMIN is set to 'true' - this is preventing admin from being served"
  echo ""
  read -p "Do you want to remove DISABLE_ADMIN? (y/n): " -n 1 -r
  echo ""
  if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "🗑️  Removing DISABLE_ADMIN environment variable..."
    railway variables delete DISABLE_ADMIN --service 4wd-tours
    echo "✅ DISABLE_ADMIN removed"
  else
    echo "⏭️  Skipping DISABLE_ADMIN removal"
  fi
else
  echo "✅ DISABLE_ADMIN is not set to 'true' (current: $DISABLE_ADMIN_VALUE)"
fi
echo ""

# Update ADMIN_CORS
echo "🔧 Updating ADMIN_CORS..."
CURRENT_ADMIN_CORS=$(railway variables --service 4wd-tours | grep "^║ ADMIN_CORS" | awk -F'│' '{print $2}' | xargs || echo "")
echo "Current ADMIN_CORS: $CURRENT_ADMIN_CORS"
NEW_ADMIN_CORS="http://localhost:9000,https://4wd-tours-production.up.railway.app"
echo "New ADMIN_CORS: $NEW_ADMIN_CORS"
echo ""
read -p "Update ADMIN_CORS? (y/n): " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
  railway variables set ADMIN_CORS="$NEW_ADMIN_CORS" --service 4wd-tours
  echo "✅ ADMIN_CORS updated"
else
  echo "⏭️  Skipping ADMIN_CORS update"
fi
echo ""

# Update AUTH_CORS
echo "🔧 Updating AUTH_CORS..."
CURRENT_AUTH_CORS=$(railway variables --service 4wd-tours | grep "^║ AUTH_CORS" | awk -F'│' '{print $2}' | xargs || echo "")
echo "Current AUTH_CORS: $CURRENT_AUTH_CORS"
NEW_AUTH_CORS="http://localhost:9000,https://4wd-tours-production.up.railway.app"
echo "New AUTH_CORS: $NEW_AUTH_CORS"
echo ""
read -p "Update AUTH_CORS? (y/n): " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
  railway variables set AUTH_CORS="$NEW_AUTH_CORS" --service 4wd-tours
  echo "✅ AUTH_CORS updated"
else
  echo "⏭️  Skipping AUTH_CORS update"
fi
echo ""

# Check if redeploy is needed
echo "=========================================="
echo "Summary"
echo "=========================================="
echo ""
echo "Changes made. Railway will automatically redeploy on environment variable changes."
echo ""
echo "📋 Next steps:"
echo "1. Wait for Railway to complete the redeploy (check Railway dashboard)"
echo "2. Test admin access: https://4wd-tours-production.up.railway.app/app"
echo "3. Expected: Medusa admin login page (not 404)"
echo ""
echo "🔍 Monitor deployment:"
echo "   railway logs --service 4wd-tours"
echo ""
echo "✅ Verify admin endpoint:"
echo "   curl -I https://4wd-tours-production.up.railway.app/app"
echo ""
echo "=========================================="
echo "Fix script complete!"
echo "=========================================="
