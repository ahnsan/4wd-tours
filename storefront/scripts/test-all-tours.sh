#!/bin/bash

###############################################################################
# Tour Pages Testing Script
#
# Comprehensive test suite for all tour pages in Sunshine Coast 4WD Tours
# Tests HTTP status, response time, rendering, and backend data availability
#
# Usage:
#   ./scripts/test-all-tours.sh [--verbose] [--backend-check]
#
# Options:
#   --verbose        Show detailed response information
#   --backend-check  Also test backend API data availability
#
# Exit codes:
#   0 - All tests passed
#   1 - Some tests failed
#   2 - Critical error (services not running)
###############################################################################

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
FRONTEND_URL="${FRONTEND_URL:-http://localhost:8000}"
BACKEND_URL="${BACKEND_URL:-http://localhost:9000}"
VERBOSE=false
BACKEND_CHECK=false

# Parse arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    --verbose)
      VERBOSE=true
      shift
      ;;
    --backend-check)
      BACKEND_CHECK=true
      shift
      ;;
    *)
      echo "Unknown option: $1"
      echo "Usage: $0 [--verbose] [--backend-check]"
      exit 1
      ;;
  esac
done

# Tour handles to test
TOUR_HANDLES=(
  "2d-fraser-rainbow"
  "2-day-fraser-rainbow"
  "rainbow-beach-tag-along"
  "fraser-island-camping"
  "kgari-camping"
  "fraser-rainforest-hiking"
  "sunset-beach-safari"
  "hinterland-discovery"
  "4wd-skills-training"
  "1d-fraser-island"
  "1d-rainbow-beach"
  "3d-fraser-rainbow"
  "4d-fraser-rainbow"
)

# Regression pages to test
REGRESSION_PAGES=(
  "/:Home"
  "/tours:Tours Listing"
  "/checkout:Checkout"
  "/checkout/add-ons:Checkout Add-ons"
  "/blog:Blog"
)

# Counters
PASS_COUNT=0
FAIL_COUNT=0
WARN_COUNT=0
TOTAL_TIME=0

###############################################################################
# Functions
###############################################################################

print_header() {
  echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo -e "${BLUE}$1${NC}"
  echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo ""
}

check_service() {
  local url=$1
  local name=$2

  if curl -s -o /dev/null -w "%{http_code}" "$url" | grep -q "200"; then
    echo -e "${GREEN}✓${NC} $name is running"
    return 0
  else
    echo -e "${RED}✗${NC} $name is not accessible at $url"
    return 1
  fi
}

test_tour_page() {
  local handle=$1
  local url="${FRONTEND_URL}/tours/${handle}"

  # Get HTTP status and response time
  local http_status=$(curl -s -o /dev/null -w "%{http_code}" "$url")
  local response_time=$(curl -s -o /dev/null -w "%{time_total}" "$url")

  # Add to total time
  TOTAL_TIME=$(echo "$TOTAL_TIME + $response_time" | bc)

  # Get response content
  local response=$(curl -s "$url")

  # Determine result
  local result_icon=""
  local result_text=""
  local result_code=0

  if echo "$response" | grep -q "<h1"; then
    result_icon="${GREEN}✓${NC}"
    result_text="OK"
    ((PASS_COUNT++))
  elif [ "$http_status" = "404" ]; then
    result_icon="${RED}✗${NC}"
    result_text="404 Not Found"
    ((FAIL_COUNT++))
    result_code=1
  elif [ "$http_status" = "500" ]; then
    result_icon="${RED}✗${NC}"
    result_text="500 Internal Server Error"
    ((FAIL_COUNT++))
    result_code=1
  else
    result_icon="${YELLOW}⚠${NC}"
    result_text="Unknown (HTTP $http_status)"
    ((WARN_COUNT++))
    result_code=2
  fi

  # Format output
  printf "%-35s %-6s %-9s %b %-20s\n" \
    "$handle" \
    "$http_status" \
    "${response_time}s" \
    "$result_icon" \
    "$result_text"

  # Verbose output
  if [ "$VERBOSE" = true ]; then
    if [ $result_code -ne 0 ]; then
      echo "  URL: $url"
      echo "  Response preview:"
      echo "$response" | head -5 | sed 's/^/    /'
    fi
  fi

  return $result_code
}

test_page() {
  local path=$1
  local name=$2
  local url="${FRONTEND_URL}${path}"

  # Get HTTP status and response time
  local http_status=$(curl -s -o /dev/null -w "%{http_code}" "$url")
  local response_time=$(curl -s -o /dev/null -w "%{time_total}" "$url")

  # Get response content
  local response=$(curl -s "$url")

  # Determine result
  local result_icon=""
  local result_text=""

  if echo "$response" | grep -q "<html"; then
    result_icon="${GREEN}✓${NC}"
    result_text="OK"
    ((PASS_COUNT++))
  elif [ "$http_status" = "404" ]; then
    # 404 is acceptable for unimplemented pages
    result_icon="${YELLOW}⚠${NC}"
    result_text="Not implemented (404)"
    ((WARN_COUNT++))
  elif [ "$http_status" = "500" ]; then
    result_icon="${RED}✗${NC}"
    result_text="500 Error"
    ((FAIL_COUNT++))
  else
    result_icon="${YELLOW}⚠${NC}"
    result_text="HTTP $http_status"
    ((WARN_COUNT++))
  fi

  printf "%-35s %-6s %-9s %b %-20s\n" \
    "$name" \
    "$http_status" \
    "${response_time}s" \
    "$result_icon" \
    "$result_text"
}

test_backend_tour() {
  local handle=$1
  local url="${BACKEND_URL}/store/products?handle=${handle}"

  # Get response
  local response=$(curl -s "$url" 2>/dev/null)

  # Check if product exists
  local count=$(echo "$response" | jq -r '.products | length' 2>/dev/null || echo "0")

  if [ "$count" = "1" ]; then
    local title=$(echo "$response" | jq -r '.products[0].title' 2>/dev/null)
    local status=$(echo "$response" | jq -r '.products[0].status' 2>/dev/null)
    echo -e "  ${GREEN}✓${NC} Found in backend: $title (status: $status)"
  else
    echo -e "  ${YELLOW}⚠${NC} Not found in backend (using mock data)"
  fi
}

###############################################################################
# Main Test Execution
###############################################################################

print_header "TOUR PAGES TESTING SUITE"

# Check services are running
echo "Checking services..."
check_service "$FRONTEND_URL" "Frontend" || exit 2
check_service "${BACKEND_URL}/health" "Backend API" || exit 2
echo ""

# Test tour pages
print_header "TESTING TOUR PAGES (${#TOUR_HANDLES[@]} handles)"

echo "┌───────────────────────────────────┬────────┬───────────┬────────────────────────┐"
echo "│ Handle                            │ Status │ Time      │ Result                 │"
echo "├───────────────────────────────────┼────────┼───────────┼────────────────────────┤"

for handle in "${TOUR_HANDLES[@]}"; do
  printf "│ "
  test_tour_page "$handle"
  printf " │\n"

  # Backend check if requested
  if [ "$BACKEND_CHECK" = true ]; then
    test_backend_tour "$handle"
  fi
done

echo "└───────────────────────────────────┴────────┴───────────┴────────────────────────┘"
echo ""

# Test regression pages
print_header "REGRESSION TESTING (${#REGRESSION_PAGES[@]} pages)"

echo "┌───────────────────────────────────┬────────┬───────────┬────────────────────────┐"
echo "│ Page                              │ Status │ Time      │ Result                 │"
echo "├───────────────────────────────────┼────────┼───────────┼────────────────────────┤"

for page_info in "${REGRESSION_PAGES[@]}"; do
  # Split path and name
  IFS=':' read -r path name <<< "$page_info"
  printf "│ "
  test_page "$path" "$name"
  printf " │\n"
done

echo "└───────────────────────────────────┴────────┴───────────┴────────────────────────┘"
echo ""

# Calculate average time
TOTAL_TESTS=$((PASS_COUNT + FAIL_COUNT + WARN_COUNT))
AVG_TIME=$(echo "scale=3; $TOTAL_TIME / $TOTAL_TESTS" | bc)

# Print summary
print_header "TEST SUMMARY"

echo "Results:"
echo -e "  ${GREEN}✓${NC} Passing:  $PASS_COUNT"
echo -e "  ${RED}✗${NC} Failing:  $FAIL_COUNT"
echo -e "  ${YELLOW}⚠${NC} Warnings: $WARN_COUNT"
echo -e "  ${BLUE}━${NC} Total:    $TOTAL_TESTS"
echo ""

echo "Performance:"
echo "  Average response time: ${AVG_TIME}s"
echo "  Total test time: ${TOTAL_TIME}s"
echo ""

# Exit code
if [ $FAIL_COUNT -eq 0 ]; then
  echo -e "${GREEN}✓ All critical tests passed!${NC}"
  exit 0
else
  echo -e "${RED}✗ Some tests failed. Please review the results above.${NC}"
  exit 1
fi
