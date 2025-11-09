#!/bin/bash

# Accessibility Testing Script for Med USA 4WD Tours
# Tests WCAG 2.1 AA compliance using axe-core

set -e

echo "=========================================="
echo "Med USA 4WD Tours - Accessibility Audit"
echo "=========================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if server is running
check_server() {
  echo "Checking if development server is running..."
  if ! curl -s http://localhost:3000 > /dev/null; then
    echo -e "${RED}Error: Development server is not running on http://localhost:3000${NC}"
    echo "Please run 'npm run dev' in another terminal first."
    exit 1
  fi
  echo -e "${GREEN}Server is running!${NC}"
  echo ""
}

# Install axe if not already installed
install_axe() {
  if ! command -v axe &> /dev/null; then
    echo "Installing @axe-core/cli..."
    npm install -g @axe-core/cli
    echo ""
  fi
}

# Run axe accessibility tests
run_axe_tests() {
  echo "Running accessibility tests..."
  echo ""

  # Test pages
  PAGES=(
    "http://localhost:3000"
    "http://localhost:3000/checkout/add-ons"
    "http://localhost:3000/checkout/payment"
  )

  TOTAL_VIOLATIONS=0
  TOTAL_PASSES=0

  for PAGE in "${PAGES[@]}"; do
    echo "=========================================="
    echo "Testing: $PAGE"
    echo "=========================================="

    # Run axe and capture output
    RESULT=$(axe "$PAGE" --tags wcag2a,wcag2aa,wcag21a,wcag21aa --stdout 2>&1) || true

    # Count violations
    VIOLATIONS=$(echo "$RESULT" | grep -o "Violation of" | wc -l | tr -d ' ')
    PASSES=$(echo "$RESULT" | grep -o "Pass:" | wc -l | tr -d ' ')

    TOTAL_VIOLATIONS=$((TOTAL_VIOLATIONS + VIOLATIONS))
    TOTAL_PASSES=$((TOTAL_PASSES + PASSES))

    if [ "$VIOLATIONS" -eq 0 ]; then
      echo -e "${GREEN}✓ No accessibility violations found!${NC}"
    else
      echo -e "${RED}✗ Found $VIOLATIONS violation(s)${NC}"
      echo "$RESULT"
    fi

    echo -e "${GREEN}✓ $PASSES checks passed${NC}"
    echo ""
  done

  echo "=========================================="
  echo "Summary"
  echo "=========================================="
  echo -e "Total violations: ${RED}$TOTAL_VIOLATIONS${NC}"
  echo -e "Total passes: ${GREEN}$TOTAL_PASSES${NC}"
  echo ""

  if [ "$TOTAL_VIOLATIONS" -eq 0 ]; then
    echo -e "${GREEN}✓ All pages pass WCAG 2.1 AA compliance!${NC}"
    exit 0
  else
    echo -e "${RED}✗ Some pages have accessibility issues that need attention${NC}"
    exit 1
  fi
}

# Main execution
main() {
  check_server
  install_axe
  run_axe_tests
}

main
