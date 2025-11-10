#!/bin/bash

# Metadata Preservation Fix - Testing Script
# This script verifies that the metadata preservation fix is working correctly

set -e

echo "=========================================="
echo "METADATA PRESERVATION FIX - TEST SCRIPT"
echo "=========================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test counters
TESTS_PASSED=0
TESTS_FAILED=0
TESTS_TOTAL=0

# Helper function to check if test passed
check_result() {
    TESTS_TOTAL=$((TESTS_TOTAL + 1))
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✅ PASS${NC}: $2"
        TESTS_PASSED=$((TESTS_PASSED + 1))
    else
        echo -e "${RED}❌ FAIL${NC}: $2"
        TESTS_FAILED=$((TESTS_FAILED + 1))
    fi
}

echo "Part 1: Compilation Checks"
echo "=========================================="

# Check if server is running
if lsof -i :8000 | grep -q LISTEN; then
    check_result 0 "Development server is running on port 8000"
else
    check_result 1 "Development server is NOT running"
    echo "Please start the server with: npm run dev"
    exit 1
fi

# Check HTTP response
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:8000/checkout/add-ons-flow?tour=2d-fraser-rainbow")
if [ "$HTTP_CODE" = "200" ]; then
    check_result 0 "Add-ons flow page returns HTTP 200"
else
    check_result 1 "Add-ons flow page returns HTTP $HTTP_CODE (expected 200)"
fi

echo ""
echo "Part 2: Code Implementation Verification"
echo "=========================================="

# Check metadata preservation in CartContext
if grep -q "applicable_tours: metadata.applicable_tours" /Users/Karim/med-usa-4wd/storefront/lib/context/CartContext.tsx; then
    check_result 0 "CartContext restores applicable_tours from metadata"
else
    check_result 1 "CartContext does NOT restore applicable_tours"
fi

if grep -q "applicable_tours: addon.metadata?.applicable_tours" /Users/Karim/med-usa-4wd/storefront/lib/context/CartContext.tsx; then
    check_result 0 "CartContext stores applicable_tours to metadata"
else
    check_result 1 "CartContext does NOT store applicable_tours"
fi

# Check metadata logging
if grep -q "console.log.*Storing addon metadata" /Users/Karim/med-usa-4wd/storefront/lib/context/CartContext.tsx; then
    check_result 0 "CartContext logs metadata storage"
else
    check_result 1 "CartContext does NOT log metadata storage"
fi

if grep -q "console.log.*Restored addon metadata" /Users/Karim/med-usa-4wd/storefront/lib/context/CartContext.tsx; then
    check_result 0 "CartContext logs metadata restoration"
else
    check_result 1 "CartContext does NOT log metadata restoration"
fi

# Check AddonLineItemMetadata type definition
if grep -q "applicable_tours?: string\[\]" /Users/Karim/med-usa-4wd/storefront/lib/types/cart.ts; then
    check_result 0 "AddonLineItemMetadata type includes applicable_tours"
else
    check_result 1 "AddonLineItemMetadata type missing applicable_tours"
fi

echo ""
echo "Part 3: Validation Logic"
echo "=========================================="

# Check if isAddonApplicableToTour function exists
if grep -q "isAddonApplicableToTour" /Users/Karim/med-usa-4wd/storefront/lib/data/addon-filtering.ts; then
    check_result 0 "isAddonApplicableToTour validation function exists"
else
    check_result 1 "isAddonApplicableToTour validation function missing"
fi

# Check if detectIncompatibleAddons function exists
if grep -q "detectIncompatibleAddons" /Users/Karim/med-usa-4wd/storefront/lib/data/addon-filtering.ts; then
    check_result 0 "detectIncompatibleAddons function exists"
else
    check_result 1 "detectIncompatibleAddons function missing"
fi

echo ""
echo "Part 4: Page Implementation"
echo "=========================================="

# Check if AddOnsFlow uses detectIncompatibleAddons
if grep -q "detectIncompatibleAddons" /Users/Karim/med-usa-4wd/storefront/app/checkout/add-ons-flow/page.tsx; then
    check_result 0 "AddOnsFlow page uses incompatible addon detection"
else
    check_result 1 "AddOnsFlow page does NOT use incompatible addon detection"
fi

# Check if AddOnsFlow has tour change detection
if grep -q "Tour change detection" /Users/Karim/med-usa-4wd/storefront/app/checkout/add-ons-flow/page.tsx; then
    check_result 0 "AddOnsFlow page has tour change detection"
else
    check_result 1 "AddOnsFlow page missing tour change detection"
fi

echo ""
echo "=========================================="
echo "TEST SUMMARY"
echo "=========================================="
echo -e "Total Tests: $TESTS_TOTAL"
echo -e "${GREEN}Passed: $TESTS_PASSED${NC}"
echo -e "${RED}Failed: $TESTS_FAILED${NC}"
echo ""

if [ $TESTS_FAILED -eq 0 ]; then
    echo -e "${GREEN}✅ ALL TESTS PASSED!${NC}"
    echo ""
    echo "Next Steps:"
    echo "1. Navigate to: http://localhost:8000/checkout/add-ons-flow?tour=2d-fraser-rainbow"
    echo "2. Open browser DevTools (F12) and go to Console tab"
    echo "3. Click ADD on 'BBQ on the Beach' or any addon"
    echo "4. Verify console logs show:"
    echo "   - [CartContext] Storing addon metadata: {...}"
    echo "   - [CartContext] Restored addon metadata: {...}"
    echo "5. Check that applicable_tours array is present in logs"
    echo "6. Verify NO removal toast appears after adding addon"
    echo "7. Verify addon stays in cart"
    echo ""
    exit 0
else
    echo -e "${RED}❌ TESTS FAILED!${NC}"
    echo ""
    echo "Please review the failed tests above and fix the implementation."
    exit 1
fi
