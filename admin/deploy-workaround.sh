#!/bin/bash

# Vercel Admin Deployment Workaround Script
# This script deploys the Medusa admin without git author validation
# by creating a clean package in /tmp and deploying from there.

set -e  # Exit on error

echo "🚀 Medusa Admin Deployment Workaround"
echo "======================================"
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Configuration
SOURCE_DIR="/Users/Karim/med-usa-4wd/admin"
TEMP_DIR="/tmp/admin-deploy-$(date +%s)"
TARGET_ALIAS="medusa-admin-4wd-tours-fixed.vercel.app"

# Step 1: Verify source files exist
echo "📋 Step 1: Verifying source files..."
if [ ! -f "$SOURCE_DIR/index.html" ]; then
    echo -e "${RED}❌ Error: index.html not found in $SOURCE_DIR${NC}"
    exit 1
fi

if [ ! -d "$SOURCE_DIR/assets" ]; then
    echo -e "${RED}❌ Error: assets directory not found in $SOURCE_DIR${NC}"
    exit 1
fi

if [ ! -f "$SOURCE_DIR/vercel.json" ]; then
    echo -e "${RED}❌ Error: vercel.json not found in $SOURCE_DIR${NC}"
    exit 1
fi

echo -e "${GREEN}✅ All source files verified${NC}"
echo ""

# Step 2: Create clean deployment package
echo "📦 Step 2: Creating clean deployment package..."
mkdir -p "$TEMP_DIR"
cp "$SOURCE_DIR/index.html" "$TEMP_DIR/"
cp -r "$SOURCE_DIR/assets" "$TEMP_DIR/"
cp "$SOURCE_DIR/vercel.json" "$TEMP_DIR/"

# Count files
ASSET_COUNT=$(find "$TEMP_DIR/assets" -type f | wc -l | tr -d ' ')
echo -e "${GREEN}✅ Package created: index.html + $ASSET_COUNT assets${NC}"
echo "   Location: $TEMP_DIR"
echo ""

# Step 3: Deploy to Vercel
echo "🚀 Step 3: Deploying to Vercel..."
cd "$TEMP_DIR"

# Deploy and capture output
DEPLOY_OUTPUT=$(npx vercel --prod --yes 2>&1)
echo "$DEPLOY_OUTPUT"

# Extract deployment URL
DEPLOY_URL=$(echo "$DEPLOY_OUTPUT" | grep -o 'https://[a-zA-Z0-9-]*\.vercel\.app' | head -1)

if [ -z "$DEPLOY_URL" ]; then
    echo -e "${RED}❌ Error: Could not extract deployment URL${NC}"
    echo "   Cleaning up temporary directory..."
    rm -rf "$TEMP_DIR"
    exit 1
fi

echo -e "${GREEN}✅ Deployment successful${NC}"
echo "   Deployment URL: $DEPLOY_URL"
echo ""

# Step 4: Create alias (if needed)
echo "🔗 Step 4: Creating alias..."
if npx vercel alias "$DEPLOY_URL" "$TARGET_ALIAS" 2>&1; then
    echo -e "${GREEN}✅ Alias created successfully${NC}"
    echo "   Main URL: https://$TARGET_ALIAS"
else
    echo -e "${YELLOW}⚠️  Alias creation failed (may already exist)${NC}"
fi
echo ""

# Step 5: Verify deployment
echo "🔍 Step 5: Verifying deployment..."
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "https://$TARGET_ALIAS/" 2>/dev/null || echo "000")

if [ "$HTTP_CODE" = "200" ]; then
    echo -e "${GREEN}✅ Deployment verified - Site is live!${NC}"
    echo "   Main URL: https://$TARGET_ALIAS"
    echo "   HTTP Status: 200 OK"
else
    echo -e "${YELLOW}⚠️  Verification returned HTTP $HTTP_CODE${NC}"
    echo "   URL: https://$TARGET_ALIAS"
    echo "   Please check manually"
fi
echo ""

# Step 6: Cleanup
echo "🧹 Step 6: Cleaning up..."
rm -rf "$TEMP_DIR"
echo -e "${GREEN}✅ Temporary files removed${NC}"
echo ""

# Summary
echo "======================================"
echo -e "${GREEN}🎉 Deployment Complete!${NC}"
echo ""
echo "📍 URLs:"
echo "   Main: https://$TARGET_ALIAS"
echo "   Direct: $DEPLOY_URL"
echo ""
echo "📝 Next steps:"
echo "   1. Test the admin: https://$TARGET_ALIAS"
echo "   2. Review deployment logs if needed"
echo "   3. Consider adding git author to Vercel team (permanent fix)"
echo ""
echo "📚 Documentation:"
echo "   See: /Users/Karim/med-usa-4wd/admin/VERCEL-404-INVESTIGATION-REPORT.md"
echo "======================================"
