#!/bin/bash
# Medusa Admin - Build and Deploy Script
# This script builds the admin from the parent Medusa project and deploys to Vercel

set -e  # Exit on error

echo "========================================================"
echo "Medusa Admin - Build & Deploy to Vercel"
echo "========================================================"
echo ""

# Color codes for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Get the directory where this script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
ADMIN_BUILD_DIR="$PROJECT_ROOT/.medusa/admin"
ADMIN_DEPLOY_DIR="$SCRIPT_DIR"

echo -e "${BLUE}Configuration:${NC}"
echo "  Project Root: $PROJECT_ROOT"
echo "  Build Output: $ADMIN_BUILD_DIR"
echo "  Deploy From:  $ADMIN_DEPLOY_DIR"
echo ""

# Step 1: Build admin from parent project
echo -e "${YELLOW}[1/5]${NC} Building admin with medusa build --admin-only..."
cd "$PROJECT_ROOT"

if ! npx medusa build --admin-only; then
    echo -e "${RED}❌ Build failed!${NC}"
    echo "   Check for TypeScript errors in src/admin/ directory"
    exit 1
fi

echo -e "${GREEN}✅ Admin built successfully${NC}"
echo ""

# Step 2: Verify build output exists
echo -e "${YELLOW}[2/5]${NC} Verifying build output..."

if [ ! -d "$ADMIN_BUILD_DIR" ]; then
    echo -e "${RED}❌ Build directory not found: $ADMIN_BUILD_DIR${NC}"
    exit 1
fi

if [ ! -f "$ADMIN_BUILD_DIR/index.html" ]; then
    echo -e "${RED}❌ index.html not found in build output${NC}"
    exit 1
fi

# Count assets
ASSET_COUNT=$(find "$ADMIN_BUILD_DIR/assets" -type f 2>/dev/null | wc -l | xargs)
BUILD_SIZE=$(du -sh "$ADMIN_BUILD_DIR" | cut -f1)

echo -e "${GREEN}✅ Build verified${NC}"
echo "   Size: $BUILD_SIZE"
echo "   Assets: $ASSET_COUNT files"
echo ""

# Step 3: Copy build to admin deployment directory
echo -e "${YELLOW}[3/5]${NC} Preparing deployment files..."

# Create necessary directories
mkdir -p "$ADMIN_DEPLOY_DIR"

# Copy build files (excluding vercel.json if it already exists in deploy dir)
rsync -av --exclude='vercel.json' --exclude='DEPLOY.md' --exclude='DEPLOY-NOW.sh' \
    "$ADMIN_BUILD_DIR/" "$ADMIN_DEPLOY_DIR/"

# Ensure vercel.json exists with correct backend URL
if [ ! -f "$ADMIN_DEPLOY_DIR/vercel.json" ]; then
    echo -e "${YELLOW}⚠️  vercel.json not found, creating default...${NC}"
    cat > "$ADMIN_DEPLOY_DIR/vercel.json" <<'EOF'
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "version": 2,
  "name": "medusa-admin-4wd-tours",
  "framework": null,
  "buildCommand": "echo 'Admin is pre-built'",
  "outputDirectory": ".",
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ],
  "headers": [
    {
      "source": "/assets/(.*)",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=31536000, immutable"
        }
      ]
    }
  ],
  "env": {
    "MEDUSA_ADMIN_BACKEND_URL": "https://4wd-tours-production.up.railway.app"
  }
}
EOF
fi

echo -e "${GREEN}✅ Files prepared${NC}"
echo ""

# Step 4: Check Vercel authentication
echo -e "${YELLOW}[4/5]${NC} Checking Vercel authentication..."

if ! npx vercel whoami &>/dev/null; then
    echo -e "${YELLOW}⚠️  Not logged in to Vercel${NC}"
    echo "   Opening login prompt..."
    npx vercel login
else
    VERCEL_USER=$(npx vercel whoami 2>/dev/null || echo "unknown")
    echo -e "${GREEN}✅ Logged in as: $VERCEL_USER${NC}"
fi

echo ""

# Step 5: Deploy to Vercel
echo -e "${YELLOW}[5/5]${NC} Deploying to Vercel..."
echo ""

cd "$ADMIN_DEPLOY_DIR"

# Check if this is first deployment
if [ ! -f ".vercel/project.json" ]; then
    echo -e "${BLUE}First time deployment - you'll be asked to configure the project${NC}"
    echo ""
fi

# Deploy to production
if npx vercel --prod; then
    echo ""
    echo -e "${GREEN}========================================================"
    echo -e "✅ Deployment Successful!"
    echo -e "========================================================${NC}"
    echo ""
    echo -e "${BLUE}📋 NEXT STEPS:${NC}"
    echo ""
    echo "1. ${YELLOW}Copy your admin URL${NC} from the output above"
    echo ""
    echo "2. ${YELLOW}Update Railway CORS:${NC}"
    echo "   a. Go to https://railway.app"
    echo "   b. Select your backend service"
    echo "   c. Go to Variables tab"
    echo "   d. Update ADMIN_CORS:"
    echo "      Add your Vercel URL to the list"
    echo "   e. Update AUTH_CORS:"
    echo "      Add your Vercel URL to the list"
    echo "   f. Redeploy (automatic after variable change)"
    echo ""
    echo "3. ${YELLOW}Test admin access:${NC}"
    echo "   a. Visit your admin URL"
    echo "   b. Login with admin credentials"
    echo "   c. Verify dashboard loads"
    echo "   d. Check products list works"
    echo ""
    echo -e "${BLUE}📖 Full documentation:${NC}"
    echo "   $PROJECT_ROOT/admin/README.md"
    echo ""
else
    echo ""
    echo -e "${RED}========================================================"
    echo -e "❌ Deployment Failed!"
    echo -e "========================================================${NC}"
    echo ""
    echo "Check the error messages above for details."
    echo ""
    echo "Common issues:"
    echo "  - Not logged in to Vercel (run: vercel login)"
    echo "  - Vercel project limit reached"
    echo "  - Network connectivity issues"
    echo ""
    exit 1
fi
