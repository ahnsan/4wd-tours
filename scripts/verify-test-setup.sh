#!/bin/bash

# Test Automation Setup Verification Script
# This script verifies that all automated testing components are properly configured

set -e

echo "🔍 Verifying Automated Test Setup..."
echo "===================================="
echo ""

# Color codes
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Counters
PASSED=0
FAILED=0

# Function to check if file exists
check_file() {
    if [ -f "$1" ]; then
        echo -e "${GREEN}✓${NC} $2"
        ((PASSED++))
    else
        echo -e "${RED}✗${NC} $2 - File not found: $1"
        ((FAILED++))
    fi
}

# Function to check if directory exists
check_dir() {
    if [ -d "$1" ]; then
        echo -e "${GREEN}✓${NC} $2"
        ((PASSED++))
    else
        echo -e "${RED}✗${NC} $2 - Directory not found: $1"
        ((FAILED++))
    fi
}

# Function to check if command exists
check_command() {
    if command -v "$1" &> /dev/null; then
        echo -e "${GREEN}✓${NC} $2"
        ((PASSED++))
    else
        echo -e "${RED}✗${NC} $2 - Command not found: $1"
        ((FAILED++))
    fi
}

# Function to check git config
check_git_config() {
    local config_value=$(git config --get "$1" 2>/dev/null || echo "")
    if [ "$config_value" == "$2" ]; then
        echo -e "${GREEN}✓${NC} $3"
        ((PASSED++))
    else
        echo -e "${RED}✗${NC} $3 - Expected: $2, Got: $config_value"
        ((FAILED++))
    fi
}

# Function to check npm script exists
check_npm_script() {
    if grep -q "\"$1\":" "$2" 2>/dev/null; then
        echo -e "${GREEN}✓${NC} $3"
        ((PASSED++))
    else
        echo -e "${RED}✗${NC} $3 - Script not found in package.json"
        ((FAILED++))
    fi
}

echo "1. Git Hooks Configuration"
echo "-------------------------"
check_git_config "core.hooksPath" ".husky" "Git hooks path configured"
check_dir ".husky" "Husky directory exists"
check_file ".husky/pre-commit" "Pre-commit hook exists"
check_file ".husky/pre-push" "Pre-push hook exists"
check_file ".husky/_/husky.sh" "Husky shell script exists"

# Check hooks are executable
if [ -x ".husky/pre-commit" ]; then
    echo -e "${GREEN}✓${NC} Pre-commit hook is executable"
    ((PASSED++))
else
    echo -e "${RED}✗${NC} Pre-commit hook is not executable"
    ((FAILED++))
fi

if [ -x ".husky/pre-push" ]; then
    echo -e "${GREEN}✓${NC} Pre-push hook is executable"
    ((PASSED++))
else
    echo -e "${RED}✗${NC} Pre-push hook is not executable"
    ((FAILED++))
fi

echo ""
echo "2. Package Configuration"
echo "-----------------------"
check_file "storefront/package.json" "Storefront package.json exists"
check_npm_script "test:ci" "storefront/package.json" "test:ci script exists"
check_npm_script "test:e2e:ci" "storefront/package.json" "test:e2e:ci script exists"
check_npm_script "type-check" "storefront/package.json" "type-check script exists"
check_npm_script "validate" "storefront/package.json" "validate script exists"
check_npm_script "prepare" "storefront/package.json" "prepare script exists"

# Check lint-staged configuration
if grep -q "lint-staged" "storefront/package.json" 2>/dev/null; then
    echo -e "${GREEN}✓${NC} lint-staged configuration exists"
    ((PASSED++))
else
    echo -e "${RED}✗${NC} lint-staged configuration not found"
    ((FAILED++))
fi

echo ""
echo "3. Dependencies"
echo "--------------"
if grep -q "\"husky\":" "storefront/package.json" 2>/dev/null; then
    echo -e "${GREEN}✓${NC} Husky dependency installed"
    ((PASSED++))
else
    echo -e "${RED}✗${NC} Husky dependency not found"
    ((FAILED++))
fi

if grep -q "\"lint-staged\":" "storefront/package.json" 2>/dev/null; then
    echo -e "${GREEN}✓${NC} lint-staged dependency installed"
    ((PASSED++))
else
    echo -e "${RED}✗${NC} lint-staged dependency not found"
    ((FAILED++))
fi

echo ""
echo "4. Jest Configuration"
echo "--------------------"
check_file "storefront/jest.config.js" "Jest config exists"

# Check coverage thresholds
if grep -q "branches: 90" "storefront/jest.config.js" 2>/dev/null; then
    echo -e "${GREEN}✓${NC} Coverage threshold: branches 90%"
    ((PASSED++))
else
    echo -e "${RED}✗${NC} Coverage threshold for branches not set to 90%"
    ((FAILED++))
fi

if grep -q "functions: 90" "storefront/jest.config.js" 2>/dev/null; then
    echo -e "${GREEN}✓${NC} Coverage threshold: functions 90%"
    ((PASSED++))
else
    echo -e "${RED}✗${NC} Coverage threshold for functions not set to 90%"
    ((FAILED++))
fi

if grep -q "lines: 90" "storefront/jest.config.js" 2>/dev/null; then
    echo -e "${GREEN}✓${NC} Coverage threshold: lines 90%"
    ((PASSED++))
else
    echo -e "${RED}✗${NC} Coverage threshold for lines not set to 90%"
    ((FAILED++))
fi

if grep -q "statements: 90" "storefront/jest.config.js" 2>/dev/null; then
    echo -e "${GREEN}✓${NC} Coverage threshold: statements 90%"
    ((PASSED++))
else
    echo -e "${RED}✗${NC} Coverage threshold for statements not set to 90%"
    ((FAILED++))
fi

echo ""
echo "5. Playwright Configuration"
echo "--------------------------"
check_file "storefront/playwright.config.ts" "Playwright config exists"

echo ""
echo "6. GitHub Actions Workflow"
echo "-------------------------"
check_file ".github/workflows/test.yml" "Test workflow exists"

# Check workflow jobs
if grep -q "unit-tests:" ".github/workflows/test.yml" 2>/dev/null; then
    echo -e "${GREEN}✓${NC} Unit tests job configured"
    ((PASSED++))
else
    echo -e "${RED}✗${NC} Unit tests job not found"
    ((FAILED++))
fi

if grep -q "type-check:" ".github/workflows/test.yml" 2>/dev/null; then
    echo -e "${GREEN}✓${NC} Type check job configured"
    ((PASSED++))
else
    echo -e "${RED}✗${NC} Type check job not found"
    ((FAILED++))
fi

if grep -q "e2e-tests:" ".github/workflows/test.yml" 2>/dev/null; then
    echo -e "${GREEN}✓${NC} E2E tests job configured"
    ((PASSED++))
else
    echo -e "${RED}✗${NC} E2E tests job not found"
    ((FAILED++))
fi

echo ""
echo "7. VSCode Settings"
echo "-----------------"
check_file ".vscode/settings.json" "VSCode settings exists"

# Check for key settings
if grep -q "formatOnSave" ".vscode/settings.json" 2>/dev/null; then
    echo -e "${GREEN}✓${NC} Format on save configured"
    ((PASSED++))
else
    echo -e "${RED}✗${NC} Format on save not configured"
    ((FAILED++))
fi

echo ""
echo "8. Documentation"
echo "---------------"
check_file "TESTING_MANDATE.md" "Testing mandate exists"
check_file "docs/testing/testing-guide.md" "Testing guide exists"

echo ""
echo "9. Makefile"
echo "----------"
check_file "Makefile" "Makefile exists"

# Check for key targets
if grep -q "^test-unit:" "Makefile" 2>/dev/null; then
    echo -e "${GREEN}✓${NC} test-unit target exists"
    ((PASSED++))
else
    echo -e "${RED}✗${NC} test-unit target not found"
    ((FAILED++))
fi

if grep -q "^test-e2e:" "Makefile" 2>/dev/null; then
    echo -e "${GREEN}✓${NC} test-e2e target exists"
    ((PASSED++))
else
    echo -e "${RED}✗${NC} test-e2e target not found"
    ((FAILED++))
fi

if grep -q "^validate:" "Makefile" 2>/dev/null; then
    echo -e "${GREEN}✓${NC} validate target exists"
    ((PASSED++))
else
    echo -e "${RED}✗${NC} validate target not found"
    ((FAILED++))
fi

echo ""
echo "===================================="
echo "Summary"
echo "===================================="
echo -e "Passed: ${GREEN}$PASSED${NC}"
echo -e "Failed: ${RED}$FAILED${NC}"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}✓ All checks passed! Test automation is properly configured.${NC}"
    echo ""
    echo "Next steps:"
    echo "1. Run 'make validate' to test the setup"
    echo "2. Try making a commit to test pre-commit hooks"
    echo "3. Review TESTING_MANDATE.md for requirements"
    echo "4. Review docs/testing/testing-guide.md for usage"
    exit 0
else
    echo -e "${RED}✗ Some checks failed. Please review the errors above.${NC}"
    exit 1
fi
