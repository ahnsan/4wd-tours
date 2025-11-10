#!/bin/bash
# Clean Rebuild Script
# Fixes webpack cache corruption issues
#
# Usage: ./scripts/clean-rebuild.sh

set -e

echo "🧹 Clean Rebuild Script"
echo "======================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo "This script will:"
echo "  1. Stop Next.js dev server"
echo "  2. Clear all build caches"
echo "  3. Restart dev server"
echo "  4. Verify all pages work"
echo ""

read -p "Continue? (y/n) " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Cancelled."
    exit 0
fi

echo ""
echo "Step 1: Stopping Next.js dev server..."
pkill -f "next dev" 2>/dev/null || true
sleep 2
echo -e "${GREEN}✓ Server stopped${NC}"

echo ""
echo "Step 2: Clearing build caches..."
cd /Users/Karim/med-usa-4wd/storefront
rm -rf .next
rm -rf node_modules/.cache
echo -e "${GREEN}✓ Caches cleared${NC}"
echo "  - Removed .next/"
echo "  - Removed node_modules/.cache/"

echo ""
echo "Step 3: Starting Next.js dev server..."
npm run dev > /tmp/nextjs-rebuild.log 2>&1 &
DEV_PID=$!
echo "  Started with PID: $DEV_PID"

echo ""
echo "Waiting for server to be ready..."
for i in {1..30}; do
    if curl -s -o /dev/null --max-time 1 http://localhost:8000 2>/dev/null; then
        echo -e "${GREEN}✓ Server is ready${NC}"
        break
    fi
    echo -n "."
    sleep 1
done
echo ""

echo ""
echo "Step 4: Running verification tests..."
echo ""

# Run verification script
if [ -f "./scripts/verify-build.sh" ]; then
    ./scripts/verify-build.sh
else
    echo -e "${YELLOW}⚠ Verification script not found, skipping tests${NC}"
fi

echo ""
echo -e "${GREEN}✓ Clean rebuild complete!${NC}"
echo ""
echo "Dev server is running at http://localhost:8000"
echo "Logs: /tmp/nextjs-rebuild.log"
