# MANDATORY E2E TESTING PROTOCOL

## Hard Directive: Test Before Deploy

**CRITICAL RULE**: Run E2E tests BEFORE deploying ANY changes that affect:
- API endpoints or routes
- Backend configuration (medusa-config.ts, etc.)
- Environment variables
- Database schema or migrations
- Frontend services that call backend APIs
- Cart, checkout, or payment flows

## Why This Matters

**Real Example (2025-11-09)**: Backend configuration change broke tours API
- ❌ **Without tests**: Tours page broken, took significant time to debug
- ✅ **With tests**: Would have caught immediately in < 2 minutes

## Test Execution Requirements

### 1. Before ANY Backend/API Changes

```bash
# MANDATORY: Run smoke tests first (fastest - 2 minutes)
cd storefront
npx playwright test tests/smoke/pages-load.spec.ts --reporter=list

# If smoke tests PASS, proceed with change
# If smoke tests FAIL, DO NOT deploy changes
```

### 2. After Backend/API Changes

```bash
# MANDATORY: Re-run smoke tests to verify no breaking changes
npx playwright test tests/smoke/pages-load.spec.ts --reporter=list

# MANDATORY: Run critical E2E tests
npx playwright test tests/e2e/tour-to-addons-error-free.spec.ts --reporter=list
npx playwright test tests/e2e/checkout-flow.spec.ts --reporter=list
npx playwright test tests/e2e/navigation.spec.ts --reporter=list
```

### 3. Before Git Commit

```bash
# Run ALL E2E tests
npx playwright test tests/e2e/ --reporter=list --max-failures=5
```

## Test Categories

### Smoke Tests (tests/smoke/)
- **Purpose**: Verify all pages load without errors
- **Duration**: ~2 minutes
- **When to run**: BEFORE and AFTER any backend changes
- **Covers**: Home, Tours, Tour Detail, Add-ons, Checkout, Blog

### Critical E2E Tests (tests/e2e/)
- **tour-to-addons-error-free.spec.ts**: Full booking flow validation
- **checkout-flow.spec.ts**: Complete checkout process
- **navigation.spec.ts**: Navigation and routing
- **booking-flow.spec.ts**: End-to-end booking journey

### Full Test Suite
- Smoke tests + E2E tests + Unit tests + A11y tests
- Run before major releases or deployments

## Failure Response Protocol

### If Smoke Tests Fail
1. **STOP**: Do not proceed with deployment
2. **REVERT**: Undo recent changes
3. **DEBUG**: Identify root cause
4. **FIX**: Correct the issue
5. **RE-TEST**: Run smoke tests again
6. **ONLY THEN**: Proceed with deployment

### If E2E Tests Fail
1. **DOCUMENT**: Note which test(s) failed
2. **ANALYZE**: Review test failure output
3. **FIX**: Correct breaking changes
4. **VERIFY**: Re-run failed tests
5. **FULL SUITE**: Run all tests before commit

## Backend Requirements

### Clean Backend Instance
```bash
# Kill any duplicate processes
pkill -9 -f "medusa develop"

# Start ONE clean instance
cd /Users/Karim/med-usa-4wd
npx medusa develop

# Verify healthy
curl http://localhost:9000/health
# Expected: "OK"
```

### Clean Frontend Instance
```bash
# Kill duplicates
pkill -9 -f "next dev"

# Start fresh
cd /Users/Karim/med-usa-4wd/storefront
npm run dev
```

## Test Environment Validation

Before running tests, verify:

```bash
# 1. Backend health
curl -s http://localhost:9000/health
# Expected: OK

# 2. Backend API (with publishable key)
curl -s "http://localhost:9000/store/products" \
  -H "x-publishable-api-key: pk_34de56e6f305b46e6d22bb1d2d3304bd9eea498066ca7749bd667318dca31ffc" \
  | jq '.products | length'
# Expected: 8 (or number of products)

# 3. Frontend running
curl -s -o /dev/null -w "%{http_code}" http://localhost:8000/
# Expected: 200

# 4. No duplicate processes
lsof -ti:9000 | wc -l
# Expected: 1 (not 2 or 3!)

lsof -ti:8000 | wc -l
# Expected: 1
```

## Automated Pre-Commit Hook

**Recommended**: Install git pre-commit hook

```bash
# .git/hooks/pre-commit
#!/bin/bash

echo "Running smoke tests before commit..."
cd storefront && npx playwright test tests/smoke/pages-load.spec.ts --reporter=list

if [ $? -ne 0 ]; then
  echo "❌ Smoke tests failed! Commit blocked."
  echo "Fix tests before committing."
  exit 1
fi

echo "✅ Smoke tests passed. Proceeding with commit..."
exit 0
```

## Common Test Failures

### "Backend not responding"
**Cause**: Multiple backend instances or backend crashed
**Fix**:
```bash
pkill -9 -f "medusa develop"
npx medusa develop
```

### "Failed to fetch tour/products"
**Cause**: Publishable API key missing or backend API broken
**Fix**:
1. Check `.env.local` has `NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY`
2. Restart frontend to load env vars
3. Verify backend API manually with curl

### "Connection refused"
**Cause**: Backend not running on port 9000
**Fix**: Start Medusa backend

## Success Criteria

Tests pass when:
- ✅ All smoke tests pass (47 tests)
- ✅ No "Failed to fetch" errors in console
- ✅ No 404/500 errors for API endpoints
- ✅ Performance tests pass (FCP < 2.5s)

## Historical Incidents

### 2025-11-09: Backend Configuration Change
- **Issue**: Invalid payment module config prevented backend startup
- **Impact**: Tours API broken, all pages failed to load
- **Detection**: Would have been caught by smoke tests in 2 minutes
- **Lesson**: ALWAYS run smoke tests before configuration changes

---

**Last Updated**: 2025-11-09
**Next Review**: 2025-12-09
