#!/bin/bash

# Bundle Analysis Script
# Analyzes Next.js bundle size and identifies optimization opportunities

set -e

echo "=================================================="
echo "   Bundle Size Analysis"
echo "=================================================="
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Bundle size targets
TARGET_FIRST_LOAD_JS=200  # KB
WARN_FIRST_LOAD_JS=150    # KB

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "${RED}Error: Must run from storefront directory${NC}"
    exit 1
fi

# Check if @next/bundle-analyzer is installed
if ! grep -q "@next/bundle-analyzer" package.json; then
    echo "Installing @next/bundle-analyzer..."
    npm install --save-dev @next/bundle-analyzer
fi

echo "Building production bundle..."
echo ""

# Build with bundle analyzer
ANALYZE=true npm run build

echo ""
echo "=================================================="
echo "   Bundle Analysis Results"
echo "=================================================="
echo ""

# Parse build output to get bundle sizes
if [ -d ".next" ]; then
    echo "Analyzing bundle composition..."
    echo ""

    # Get route sizes from build manifest
    if [ -f ".next/analyze/client.html" ]; then
        echo "Client-side bundle analysis saved to: .next/analyze/client.html"
        echo "Server-side bundle analysis saved to: .next/analyze/server.html"
        echo ""
        echo "Open these files in your browser for detailed analysis"
    fi

    # Parse Next.js build output
    echo "Route Sizes:"
    echo "------------"

    # This would typically parse the Next.js build output
    # For now, we'll use du to estimate sizes
    if [ -d ".next/static/chunks/pages" ]; then
        find .next/static/chunks/pages -name "*.js" -exec du -h {} \; | sort -hr | head -10
    fi

    echo ""
    echo "Recommendations:"
    echo "---------------"
    echo "1. Check client.html for large dependencies"
    echo "2. Look for duplicate packages (different versions)"
    echo "3. Identify unused code that can be removed"
    echo "4. Consider code splitting for large components"
    echo "5. Use dynamic imports for below-fold content"
    echo ""

    # Check for common bloat patterns
    echo "Checking for common issues..."

    if grep -r "moment" package.json 2>/dev/null; then
        echo -e "${YELLOW}⚠ Found moment.js - consider using date-fns or native Intl${NC}"
    fi

    if grep -r "lodash\":" package.json 2>/dev/null; then
        echo -e "${YELLOW}⚠ Found lodash - consider using lodash-es for tree-shaking${NC}"
    fi

    # Check for duplicate React versions
    REACT_COUNT=$(find node_modules -name "react" -type d | wc -l)
    if [ "$REACT_COUNT" -gt 1 ]; then
        echo -e "${YELLOW}⚠ Multiple React versions detected - check for version conflicts${NC}"
    fi

    echo ""
    echo "${GREEN}Bundle analysis complete!${NC}"
    echo "Review .next/analyze/ directory for detailed reports"

else
    echo "${RED}Error: Build directory not found${NC}"
    exit 1
fi
