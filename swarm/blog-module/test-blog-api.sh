#!/bin/bash

# Blog Module API Testing Script
# Tests all blog endpoints with sample data

set -e

API_URL="http://localhost:9000"
ADMIN_TOKEN=""  # Will be populated if admin auth is required

echo "========================================="
echo "Blog Module API Testing"
echo "========================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test counter
TESTS_PASSED=0
TESTS_FAILED=0

test_endpoint() {
    local name="$1"
    local method="$2"
    local endpoint="$3"
    local data="$4"
    local expected_code="$5"

    echo -e "${BLUE}Testing:${NC} $name"
    echo "  $method $endpoint"

    if [ -n "$data" ]; then
        response=$(curl -s -w "\n%{http_code}" -X $method "$API_URL$endpoint" \
            -H "Content-Type: application/json" \
            -d "$data" 2>&1)
    else
        response=$(curl -s -w "\n%{http_code}" -X $method "$API_URL$endpoint" 2>&1)
    fi

    http_code=$(echo "$response" | tail -n 1)
    body=$(echo "$response" | sed '$d')

    if [ "$http_code" == "$expected_code" ]; then
        echo -e "  ${GREEN}✓ PASSED${NC} (HTTP $http_code)"
        ((TESTS_PASSED++))
        echo "$body" | jq '.' 2>/dev/null || echo "$body"
    else
        echo -e "  ${RED}✗ FAILED${NC} (Expected $expected_code, got $http_code)"
        ((TESTS_FAILED++))
        echo "$body"
    fi
    echo ""
}

# Wait for server to be ready
echo "Checking if Medusa server is running..."
MAX_RETRIES=30
RETRY_COUNT=0

while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
    if curl -s -o /dev/null -w "%{http_code}" $API_URL/health | grep -q "200"; then
        echo -e "${GREEN}✓ Server is ready${NC}"
        break
    fi

    ((RETRY_COUNT++))
    if [ $RETRY_COUNT -eq $MAX_RETRIES ]; then
        echo -e "${RED}✗ Server not responding after 30 attempts${NC}"
        echo "Please start the Medusa server: npm run dev"
        exit 1
    fi

    echo "Waiting for server... ($RETRY_COUNT/$MAX_RETRIES)"
    sleep 1
done

echo ""
echo "========================================="
echo "STORE API TESTS (Public Endpoints)"
echo "========================================="
echo ""

# Test 1: List all posts (should be empty initially)
test_endpoint \
    "List all published posts" \
    "GET" \
    "/store/posts" \
    "" \
    "200"

# Store post ID for later tests
POST_ID=""
POST_SLUG="essential-4wd-accessories-camping-sunshine-coast"

echo "========================================="
echo "ADMIN API TESTS"
echo "========================================="
echo ""

# Test 2: Create first blog post
POST_DATA='{
  "title": "Essential 4WD Accessories for Your Sunshine Coast Camping Adventure",
  "slug": "essential-4wd-accessories-camping-sunshine-coast",
  "content": "<h2>Planning Your 4WD Camping Adventure</h2><p>The Sunshine Coast offers some of Australias most spectacular 4WD camping destinations.</p>",
  "excerpt": "Planning a 4WD camping trip on the Sunshine Coast? Discover the must-have accessories that will make your adventure safer, more comfortable, and unforgettable.",
  "author": "Sarah Mitchell",
  "category": "guides",
  "tags": ["4wd-accessories", "camping", "sunshine-coast"],
  "seo_title": "Essential 4WD Camping Accessories Guide - Sunshine Coast | 2025",
  "seo_description": "Complete guide to must-have 4WD accessories for camping trips on the Sunshine Coast.",
  "is_published": true
}'

response=$(curl -s -X POST "$API_URL/admin/posts" \
    -H "Content-Type: application/json" \
    -d "$POST_DATA")

if echo "$response" | jq -e '.post.id' > /dev/null 2>&1; then
    POST_ID=$(echo "$response" | jq -r '.post.id')
    echo -e "${GREEN}✓ Post created successfully${NC}"
    echo "  Post ID: $POST_ID"
    ((TESTS_PASSED++))
else
    echo -e "${RED}✗ Failed to create post${NC}"
    echo "$response"
    ((TESTS_FAILED++))
fi
echo ""

# Test 3: Create second blog post (Fraser Island)
POST_DATA_2='{
  "title": "Fraser Island 4WD Adventure: Your Complete Guide",
  "slug": "fraser-island-4wd-adventure-guide",
  "content": "<h2>Discovering Kgari (Fraser Island)</h2><p>Kgari, traditionally known as Fraser Island, is a 4WD enthusiasts dream destination.</p>",
  "excerpt": "Kgari (Fraser Island) is the worlds largest sand island and a 4WD paradise. Discover what makes this UNESCO World Heritage site a must-visit destination.",
  "author": "Mike Thompson",
  "category": "destinations",
  "tags": ["fraser-island", "kgari", "world-heritage"],
  "seo_title": "Fraser Island (Kgari) 4WD Adventure Guide 2025",
  "is_published": true
}'

test_endpoint \
    "Create second blog post (Fraser Island)" \
    "POST" \
    "/admin/posts" \
    "$POST_DATA_2" \
    "200"

# Test 4: Create draft post
POST_DATA_3='{
  "title": "Top 5 Sunshine Coast 4WD Tracks for Beginners",
  "slug": "sunshine-coast-4wd-tracks-beginners",
  "content": "<h2>Starting Your 4WD Journey</h2>",
  "excerpt": "New to 4WD adventures? Start your off-road journey with these beginner-friendly tracks.",
  "author": "Sarah Mitchell",
  "category": "guides",
  "tags": ["beginner-tracks", "sunshine-coast"],
  "is_published": false
}'

test_endpoint \
    "Create draft post" \
    "POST" \
    "/admin/posts" \
    "$POST_DATA_3" \
    "200"

# Test 5: List all posts (admin view - includes drafts)
test_endpoint \
    "List all posts (admin)" \
    "GET" \
    "/admin/posts" \
    "" \
    "200"

if [ -n "$POST_ID" ]; then
    # Test 6: Get single post by ID
    test_endpoint \
        "Get post by ID" \
        "GET" \
        "/admin/posts/$POST_ID" \
        "" \
        "200"

    # Test 7: Update post
    UPDATE_DATA='{
      "title": "Essential 4WD Accessories for Your Sunshine Coast Camping Adventure [UPDATED]",
      "tags": ["4wd-accessories", "camping", "sunshine-coast", "updated"]
    }'

    test_endpoint \
        "Update post" \
        "PUT" \
        "/admin/posts/$POST_ID" \
        "$UPDATE_DATA" \
        "200"
fi

echo "========================================="
echo "STORE API TESTS (After Creating Posts)"
echo "========================================="
echo ""

# Test 8: List published posts
test_endpoint \
    "List published posts (should show 2)" \
    "GET" \
    "/store/posts" \
    "" \
    "200"

# Test 9: Get post by slug
test_endpoint \
    "Get post by slug" \
    "GET" \
    "/store/posts/$POST_SLUG" \
    "" \
    "200"

# Test 10: Filter by category
test_endpoint \
    "Filter posts by category" \
    "GET" \
    "/store/posts?category=guides" \
    "" \
    "200"

# Test 11: Search posts
test_endpoint \
    "Search posts" \
    "GET" \
    "/store/posts?q=Fraser+Island" \
    "" \
    "200"

# Test 12: Pagination
test_endpoint \
    "Pagination test" \
    "GET" \
    "/store/posts?limit=1&offset=0" \
    "" \
    "200"

echo "========================================="
echo "PRODUCT LINKING TESTS"
echo "========================================="
echo ""

# First, get available products
echo "Fetching available products..."
PRODUCTS_RESPONSE=$(curl -s "$API_URL/store/products")
PRODUCT_IDS=$(echo "$PRODUCTS_RESPONSE" | jq -r '.products[0:2] | map(.id) | join(",")')

if [ -n "$PRODUCT_IDS" ] && [ "$PRODUCT_IDS" != "null" ] && [ -n "$POST_ID" ]; then
    # Test 13: Link products to post
    PRODUCT_LINK_DATA="{
      \"product_ids\": [\"$(echo $PRODUCT_IDS | cut -d',' -f1)\"],
      \"action\": \"set\"
    }"

    test_endpoint \
        "Link products to post" \
        "POST" \
        "/admin/posts/$POST_ID/products" \
        "$PRODUCT_LINK_DATA" \
        "200"

    # Test 14: Get post with linked products
    test_endpoint \
        "Get post with linked products" \
        "GET" \
        "/store/posts/$POST_SLUG" \
        "" \
        "200"
else
    echo "No products available for linking test"
    ((TESTS_FAILED++))
fi

echo ""
echo "========================================="
echo "TEST SUMMARY"
echo "========================================="
echo -e "${GREEN}Passed: $TESTS_PASSED${NC}"
echo -e "${RED}Failed: $TESTS_FAILED${NC}"
echo "Total: $((TESTS_PASSED + TESTS_FAILED))"
echo ""

if [ $TESTS_FAILED -eq 0 ]; then
    echo -e "${GREEN}✓ All tests passed!${NC}"
    exit 0
else
    echo -e "${RED}✗ Some tests failed${NC}"
    exit 1
fi
