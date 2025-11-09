#!/bin/bash

##############################################################################
# Performance Testing Script - Lighthouse CI
#
# BMAD Performance Targets:
# - p95 TTI < 2s (Moto G4 emulation)
# - CLS < 0.1
# - LCP < 2.5s
# - Main thread long task < 200ms
#
# Usage:
#   ./scripts/performance/test-performance.sh [url] [output-dir]
#
# Example:
#   ./scripts/performance/test-performance.sh http://localhost:8000 ./lighthouse-reports
##############################################################################

set -e

# Configuration
URL="${1:-http://localhost:8000/checkout/add-ons}"
OUTPUT_DIR="${2:-./lighthouse-reports}"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
REPORT_NAME="lighthouse-${TIMESTAMP}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Create output directory
mkdir -p "${OUTPUT_DIR}"

echo "======================================================================"
echo "  Lighthouse Performance Testing"
echo "======================================================================"
echo "URL: ${URL}"
echo "Output: ${OUTPUT_DIR}/${REPORT_NAME}"
echo "======================================================================"
echo ""

# Check if URL is accessible
echo "Checking if URL is accessible..."
if ! curl -s -o /dev/null -w "%{http_code}" "${URL}" | grep -q "200"; then
    echo -e "${RED}ERROR: URL is not accessible. Make sure the development server is running.${NC}"
    echo "Run: npm run dev"
    exit 1
fi
echo -e "${GREEN}✓ URL is accessible${NC}"
echo ""

# Run Lighthouse with mobile emulation (Moto G4)
echo "Running Lighthouse with Mobile (Moto G4) emulation..."
npx lighthouse "${URL}" \
  --output=html \
  --output=json \
  --output-path="${OUTPUT_DIR}/${REPORT_NAME}" \
  --emulated-form-factor=mobile \
  --throttling.cpuSlowdownMultiplier=4 \
  --throttling.rttMs=150 \
  --throttling.throughputKbps=1638.4 \
  --throttling.requestLatencyMs=562.5 \
  --throttling.downloadThroughputKbps=1638.4 \
  --throttling.uploadThroughputKbps=675 \
  --screenEmulation.mobile=true \
  --screenEmulation.width=360 \
  --screenEmulation.height=640 \
  --screenEmulation.deviceScaleFactor=3 \
  --chrome-flags="--headless --no-sandbox --disable-gpu" \
  --quiet

echo ""
echo "======================================================================"
echo "  Analyzing Results Against BMAD Targets"
echo "======================================================================"

# Parse JSON report
JSON_REPORT="${OUTPUT_DIR}/${REPORT_NAME}.report.json"

if [ ! -f "${JSON_REPORT}" ]; then
    echo -e "${RED}ERROR: JSON report not found at ${JSON_REPORT}${NC}"
    exit 1
fi

# Extract metrics using Node.js
node - <<EOF
const fs = require('fs');
const report = JSON.parse(fs.readFileSync('${JSON_REPORT}', 'utf8'));

const audits = report.audits;
const RED = '\033[0;31m';
const GREEN = '\033[0;32m';
const YELLOW = '\033[1;33m';
const NC = '\033[0m';

// Performance score
const perfScore = report.categories.performance.score * 100;
console.log('');
console.log('Performance Score: ' + perfScore.toFixed(0) + '/100');
console.log('');

// Core Web Vitals
const metrics = [
  {
    name: 'LCP (Largest Contentful Paint)',
    value: audits['largest-contentful-paint'].numericValue / 1000,
    unit: 's',
    target: 2.5,
    good: 2.5,
    needsImprovement: 4.0
  },
  {
    name: 'TTI (Time to Interactive)',
    value: audits['interactive'].numericValue / 1000,
    unit: 's',
    target: 2.0,
    good: 3.8,
    needsImprovement: 7.3
  },
  {
    name: 'CLS (Cumulative Layout Shift)',
    value: audits['cumulative-layout-shift'].numericValue,
    unit: '',
    target: 0.1,
    good: 0.1,
    needsImprovement: 0.25
  },
  {
    name: 'TBT (Total Blocking Time)',
    value: audits['total-blocking-time'].numericValue,
    unit: 'ms',
    target: 200,
    good: 200,
    needsImprovement: 600
  },
  {
    name: 'FCP (First Contentful Paint)',
    value: audits['first-contentful-paint'].numericValue / 1000,
    unit: 's',
    target: 1.8,
    good: 1.8,
    needsImprovement: 3.0
  },
  {
    name: 'SI (Speed Index)',
    value: audits['speed-index'].numericValue / 1000,
    unit: 's',
    target: 3.4,
    good: 3.4,
    needsImprovement: 5.8
  }
];

let allPassed = true;

metrics.forEach(metric => {
  const status = metric.value <= metric.target ? 'PASS' : 'FAIL';
  const color = metric.value <= metric.good ? GREEN :
                metric.value <= metric.needsImprovement ? YELLOW : RED;

  if (status === 'FAIL') allPassed = false;

  console.log(\`\${color}[\${status}]\${NC} \${metric.name}: \${metric.value.toFixed(2)}\${metric.unit} (target: ≤\${metric.target}\${metric.unit})\`);
});

console.log('');
console.log('======================================================================');

if (allPassed) {
  console.log(\`\${GREEN}✓ ALL PERFORMANCE TARGETS MET!\${NC}\`);
} else {
  console.log(\`\${RED}✗ SOME PERFORMANCE TARGETS NOT MET\${NC}\`);
}

console.log('======================================================================');
console.log('');

// Additional insights
console.log('Additional Metrics:');
console.log('');

const additionalMetrics = [
  {
    name: 'First Meaningful Paint',
    value: audits['first-meaningful-paint']?.numericValue / 1000 || 0,
    unit: 's'
  },
  {
    name: 'Max Potential FID',
    value: audits['max-potential-fid']?.numericValue || 0,
    unit: 'ms'
  },
  {
    name: 'Server Response Time',
    value: audits['server-response-time']?.numericValue || 0,
    unit: 'ms'
  }
];

additionalMetrics.forEach(metric => {
  console.log(\`  \${metric.name}: \${metric.value.toFixed(2)}\${metric.unit}\`);
});

console.log('');
console.log('Reports saved to:');
console.log(\`  HTML: \${process.env.OUTPUT_DIR}/\${process.env.REPORT_NAME}.report.html\`);
console.log(\`  JSON: \${process.env.OUTPUT_DIR}/\${process.env.REPORT_NAME}.report.json\`);
console.log('');

process.exit(allPassed ? 0 : 1);
EOF

EXIT_CODE=$?

# Open HTML report in browser (optional)
if command -v open &> /dev/null; then
    echo "Opening report in browser..."
    open "${OUTPUT_DIR}/${REPORT_NAME}.report.html"
elif command -v xdg-open &> /dev/null; then
    echo "Opening report in browser..."
    xdg-open "${OUTPUT_DIR}/${REPORT_NAME}.report.html"
fi

exit ${EXIT_CODE}
