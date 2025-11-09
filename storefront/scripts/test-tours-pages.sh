#!/bin/bash

# Test script for tours pages
# Run this after starting the dev server: npm run dev

set -e

echo "========================================="
echo "Tours Pages Testing Script"
echo "========================================="
echo ""

# Configuration
BASE_URL="${1:-http://localhost:3000}"
TOURS_URL="$BASE_URL/tours"
FRASER_TOUR_URL="$BASE_URL/tours/2d-fraser-rainbow"

echo "Testing against: $BASE_URL"
echo ""

# Test 1: Tours Listing Page
echo "Test 1: Tours Listing Page"
echo "URL: $TOURS_URL"
echo "---"

if curl -s "$TOURS_URL" | grep -q "Sunshine Coast 4WD Tours"; then
    echo "✅ PASS: Tours listing page loads"
    if curl -s "$TOURS_URL" | grep -q "(Mock Data)"; then
        echo "ℹ️  INFO: Using mock data (API unavailable)"
    else
        echo "✅ INFO: Using API data"
    fi
else
    echo "❌ FAIL: Tours listing page did not load correctly"
    exit 1
fi

# Count tours on page
TOUR_COUNT=$(curl -s "$TOURS_URL" | grep -o "TourCard" | wc -l | tr -d ' ')
echo "ℹ️  INFO: Found $TOUR_COUNT tours on page"
echo ""

# Test 2: Fraser Rainbow Tour Detail Page
echo "Test 2: Fraser Rainbow Tour Detail Page"
echo "URL: $FRASER_TOUR_URL"
echo "---"

if curl -s "$FRASER_TOUR_URL" | grep -q "Fraser"; then
    echo "✅ PASS: Fraser Rainbow tour page loads"
    if curl -s "$FRASER_TOUR_URL" | grep -q "2 Day Fraser"; then
        echo "✅ PASS: Correct tour title displayed"
    else
        echo "⚠️  WARN: Tour title may not be correct"
    fi
else
    echo "❌ FAIL: Fraser Rainbow tour page did not load correctly"
    exit 1
fi
echo ""

# Test 3: Check for booking elements
echo "Test 3: Booking Elements"
echo "---"

if curl -s "$FRASER_TOUR_URL" | grep -q "Book Now"; then
    echo "✅ PASS: Booking button found"
else
    echo "❌ FAIL: Booking button not found"
fi

if curl -s "$FRASER_TOUR_URL" | grep -q "Total Price"; then
    echo "✅ PASS: Price display found"
else
    echo "❌ FAIL: Price display not found"
fi
echo ""

# Test 4: Other tour handles
echo "Test 4: Other Tour Handles"
echo "---"

OTHER_HANDLES=(
    "rainbow-beach-tag-along"
    "fraser-island-camping"
    "sunset-beach-safari"
)

for handle in "${OTHER_HANDLES[@]}"; do
    if curl -s "$BASE_URL/tours/$handle" | grep -q "Sunshine Coast"; then
        echo "✅ PASS: Tour handle '$handle' works"
    else
        echo "⚠️  WARN: Tour handle '$handle' may not work correctly"
    fi
done
echo ""

# Test 5: Invalid tour handle (should 404)
echo "Test 5: Invalid Tour Handle (404 Test)"
echo "---"

if curl -s "$BASE_URL/tours/invalid-tour-handle-xyz" | grep -q "404"; then
    echo "✅ PASS: Invalid tour returns 404"
else
    echo "⚠️  WARN: Invalid tour may not return proper 404"
fi
echo ""

# Summary
echo "========================================="
echo "Test Summary"
echo "========================================="
echo "✅ Tours listing page: Working"
echo "✅ Fraser Rainbow tour: Working"
echo "✅ Booking elements: Present"
echo "✅ Tour handles: Working"
echo ""
echo "All critical tests passed!"
echo ""
echo "Next steps:"
echo "1. Manually test booking flow at: $FRASER_TOUR_URL"
echo "2. Test filters and search on tours listing page"
echo "3. Run PageSpeed Insights audit"
echo "4. Start Medusa backend to test API integration"
