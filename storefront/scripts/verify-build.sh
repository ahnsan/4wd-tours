#!/bin/bash
# Build Verification Script
# Prevents webpack cache corruption by testing critical pages after changes
#
# Usage: ./scripts/verify-build.sh
# Run this after making code changes to ensure no build errors

set -e

echo "🔍 Build Verification Script"
echo "============================"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
BASE_URL="http://localhost:8000"
TIMEOUT=5

# Critical pages to test
declare -a PAGES=(
    "/"
    "/tours"
    "/tours/1d-fraser-island"
    "/tours/2d-fraser-rainbow"
    "/checkout/add-ons?tour=1d-fraser-island"
    "/checkout/add-ons-flow?tour=1d-fraser-island"
    "/checkout"
)

# Function to test a page
test_page() {
    local path=$1
    local url="${BASE_URL}${path}"

    echo -n "Testing ${path}... "

    # Get HTTP status code
    status=$(curl -s -o /dev/null -w "%{http_code}" --max-time $TIMEOUT "$url" 2>/dev/null || echo "000")

    if [ "$status" = "200" ]; then
        echo -e "${GREEN}✓ OK${NC} (${status})"
        return 0
    elif [ "$status" = "000" ]; then
        echo -e "${RED}✗ TIMEOUT${NC}"
        return 1
    else
        echo -e "${RED}✗ FAILED${NC} (${status})"
        return 1
    fi
}

# Check if server is running
echo "Checking if Next.js dev server is running..."
if ! curl -s -o /dev/null --max-time 2 "$BASE_URL" 2>/dev/null; then
    echo -e "${RED}✗ Server not running${NC}"
    echo ""
    echo "Please start the dev server first:"
    echo "  cd /Users/Karim/med-usa-4wd/storefront"
    echo "  npm run dev"
    exit 1
fi
echo -e "${GREEN}✓ Server is running${NC}"
echo ""

# Test all critical pages
echo "Testing critical pages..."
echo ""

failed=0
for page in "${PAGES[@]}"; do
    if ! test_page "$page"; then
        ((failed++))
    fi
done

echo ""
echo "============================"

if [ $failed -eq 0 ]; then
    echo -e "${GREEN}✓ All tests passed!${NC}"
    echo ""
    echo "Build verification complete. No webpack cache issues detected."
    exit 0
else
    echo -e "${RED}✗ ${failed} test(s) failed${NC}"
    echo ""
    echo "Webpack cache corruption detected!"
    echo ""
    echo "To fix:"
    echo "  1. Stop the dev server (Ctrl+C)"
    echo "  2. Clear build cache: rm -rf .next node_modules/.cache"
    echo "  3. Restart dev server: npm run dev"
    echo "  4. Run this script again: ./scripts/verify-build.sh"
    exit 1
fi
