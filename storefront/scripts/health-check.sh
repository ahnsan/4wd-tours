#!/bin/bash

#############################################################
# Health Check Script for Sunshine Coast 4WD Tours
#
# This script performs comprehensive pre-deployment health
# checks to prevent 500 errors and catch issues early.
#
# Usage:
#   ./scripts/health-check.sh
#   ./scripts/health-check.sh --production
#
# Exit Codes:
#   0 - All checks passed
#   1 - One or more checks failed
#############################################################

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
BASE_URL="${BASE_URL:-http://localhost:8000}"
BACKEND_URL="${BACKEND_URL:-http://localhost:9000}"
TIMEOUT=10
FAILED_CHECKS=0
TOTAL_CHECKS=0

# Production mode flag
PRODUCTION_MODE=false
if [[ "$1" == "--production" ]]; then
  PRODUCTION_MODE=true
  BASE_URL="${BASE_URL:-https://sunshinecoast4wdtours.com.au}"
fi

echo -e "${BLUE}================================================${NC}"
echo -e "${BLUE}  Health Check - Sunshine Coast 4WD Tours${NC}"
echo -e "${BLUE}================================================${NC}"
echo ""
echo -e "Mode: ${YELLOW}$([ "$PRODUCTION_MODE" = true ] && echo "PRODUCTION" || echo "DEVELOPMENT")${NC}"
echo -e "Frontend URL: ${YELLOW}${BASE_URL}${NC}"
echo -e "Backend URL: ${YELLOW}${BACKEND_URL}${NC}"
echo ""

#############################################################
# Helper Functions
#############################################################

check_url() {
  local url=$1
  local expected_status=$2
  local description=$3

  TOTAL_CHECKS=$((TOTAL_CHECKS + 1))

  echo -n "Testing: ${description}... "

  # Make request and capture status code
  local status=$(curl -s -o /dev/null -w "%{http_code}" --connect-timeout $TIMEOUT --max-time $TIMEOUT "$url" 2>/dev/null || echo "000")

  # Check if status matches expected (accept multiple valid codes)
  if [[ "$expected_status" == *"$status"* ]]; then
    echo -e "${GREEN}✓ PASSED${NC} (HTTP $status)"
    return 0
  else
    echo -e "${RED}✗ FAILED${NC} (Expected: $expected_status, Got: $status)"
    FAILED_CHECKS=$((FAILED_CHECKS + 1))
    return 1
  fi
}

check_json_response() {
  local url=$1
  local expected_field=$2
  local description=$3

  TOTAL_CHECKS=$((TOTAL_CHECKS + 1))

  echo -n "Testing: ${description}... "

  # Make request and capture response
  local response=$(curl -s --connect-timeout $TIMEOUT --max-time $TIMEOUT "$url" 2>/dev/null || echo "{}")

  # Check if expected field exists in JSON
  if echo "$response" | grep -q "\"$expected_field\""; then
    echo -e "${GREEN}✓ PASSED${NC} (Field '$expected_field' found)"
    return 0
  else
    echo -e "${RED}✗ FAILED${NC} (Field '$expected_field' not found)"
    FAILED_CHECKS=$((FAILED_CHECKS + 1))
    return 1
  fi
}

#############################################################
# Backend Health Checks
#############################################################

echo -e "${BLUE}--- Backend Health Checks ---${NC}"
echo ""

check_url "$BACKEND_URL/health" "200" "Medusa backend health endpoint"
check_json_response "$BACKEND_URL/store/products" "products" "Store API products endpoint"

echo ""

#############################################################
# Frontend Critical Routes
#############################################################

echo -e "${BLUE}--- Frontend Critical Routes ---${NC}"
echo ""

# Homepage
check_url "$BASE_URL/" "200 308" "Homepage"

# Tours listing page
check_url "$BASE_URL/tours" "200 308" "Tours listing page"

# Tour detail pages (all known tours)
TOUR_HANDLES=(
  "1d-fraser-island"
  "1d-rainbow-beach"
  "2d-fraser-rainbow"
  "3d-fraser-rainbow"
  "4d-fraser-rainbow"
)

for handle in "${TOUR_HANDLES[@]}"; do
  check_url "$BASE_URL/tours/$handle" "200 308" "Tour page: $handle"
done

echo ""

#############################################################
# Checkout Flow Routes
#############################################################

echo -e "${BLUE}--- Checkout Flow Routes ---${NC}"
echo ""

check_url "$BASE_URL/checkout/add-ons" "200 308" "Add-ons selection page"
check_url "$BASE_URL/checkout" "200 308" "Checkout page"

echo ""

#############################################################
# Static Assets & Resources
#############################################################

echo -e "${BLUE}--- Static Assets ---${NC}"
echo ""

check_url "$BASE_URL/images/tour_options.png" "200 404" "Default tour placeholder image"
check_url "$BASE_URL/favicon.ico" "200 404" "Favicon"

echo ""

#############################################################
# API Endpoints (if applicable)
#############################################################

if [ "$PRODUCTION_MODE" = false ]; then
  echo -e "${BLUE}--- API Endpoints ---${NC}"
  echo ""

  # Check if custom API routes exist
  if curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/api/log-error" | grep -q "405\|404\|200"; then
    echo -e "API route check: ${GREEN}✓ PASSED${NC}"
  else
    echo -e "API route check: ${YELLOW}⚠ WARNING${NC} (Routes may not be available)"
  fi

  echo ""
fi

#############################################################
# Environment Variables Check
#############################################################

if [ "$PRODUCTION_MODE" = false ]; then
  echo -e "${BLUE}--- Environment Variables ---${NC}"
  echo ""

  if [ -f ".env.local" ]; then
    echo -e "Environment file: ${GREEN}✓ FOUND${NC} (.env.local)"

    # Check for required environment variables
    ENV_VARS=(
      "NEXT_PUBLIC_API_URL"
      "NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY"
    )

    for var in "${ENV_VARS[@]}"; do
      if grep -q "^${var}=" .env.local; then
        echo -e "  $var: ${GREEN}✓ SET${NC}"
      else
        echo -e "  $var: ${YELLOW}⚠ MISSING${NC}"
      fi
    done
  else
    echo -e "Environment file: ${YELLOW}⚠ NOT FOUND${NC} (.env.local)"
  fi

  echo ""
fi

#############################################################
# Summary
#############################################################

echo -e "${BLUE}================================================${NC}"
echo -e "${BLUE}  Health Check Summary${NC}"
echo -e "${BLUE}================================================${NC}"
echo ""

PASSED_CHECKS=$((TOTAL_CHECKS - FAILED_CHECKS))

echo -e "Total Checks: ${BLUE}$TOTAL_CHECKS${NC}"
echo -e "Passed: ${GREEN}$PASSED_CHECKS${NC}"
echo -e "Failed: ${RED}$FAILED_CHECKS${NC}"
echo ""

if [ $FAILED_CHECKS -eq 0 ]; then
  echo -e "${GREEN}✓ ALL HEALTH CHECKS PASSED${NC}"
  echo -e "${GREEN}✓ System is ready for deployment${NC}"
  echo ""
  exit 0
else
  echo -e "${RED}✗ HEALTH CHECK FAILED${NC}"
  echo -e "${RED}✗ $FAILED_CHECKS check(s) failed${NC}"
  echo ""
  echo -e "${YELLOW}Please fix the issues above before deploying.${NC}"
  echo ""
  exit 1
fi
