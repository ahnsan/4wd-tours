#!/bin/bash
# Medusa Admin - Deploy Only Script
# Use this when admin is already built and you just want to deploy

set -e  # Exit on error

echo "========================================================"
echo "Medusa Admin - Quick Deploy to Vercel"
echo "========================================================"
echo ""

# Color codes
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Get directories
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# Check if admin is already built
if [ ! -f "index.html" ]; then
    echo -e "${RED}❌ Admin not built yet!${NC}"
    echo ""
    echo "Please run the build first:"
    echo "  cd $PROJECT_ROOT"
    echo "  npx medusa build --admin-only"
    echo ""
    echo "Or use the full build-and-deploy script:"
    echo "  bash $SCRIPT_DIR/build-and-deploy.sh"
    echo ""
    exit 1
fi

echo -e "${GREEN}✅ Admin build found${NC}"
echo ""

# Check Vercel authentication
echo -e "${BLUE}Checking Vercel authentication...${NC}"

if ! npx vercel whoami &>/dev/null; then
    echo -e "${YELLOW}⚠️  Not logged in to Vercel${NC}"
    echo "   Opening login prompt..."
    npx vercel login
else
    VERCEL_USER=$(npx vercel whoami 2>/dev/null || echo "unknown")
    echo -e "${GREEN}✅ Logged in as: $VERCEL_USER${NC}"
fi

echo ""
echo -e "${BLUE}Deploying to Vercel...${NC}"
echo ""

# Deploy
if npx vercel --prod; then
    echo ""
    echo -e "${GREEN}========================================================"
    echo -e "✅ Deployment Successful!"
    echo -e "========================================================${NC}"
    echo ""
    echo -e "${YELLOW}Don't forget to update Railway CORS if this is a new domain!${NC}"
    echo ""
else
    echo ""
    echo -e "${RED}❌ Deployment failed${NC}"
    exit 1
fi
