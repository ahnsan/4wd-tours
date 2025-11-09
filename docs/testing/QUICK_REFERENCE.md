# Testing Automation - Quick Reference Card

## 🚀 Quick Commands

```bash
# Full validation (run before committing)
make validate

# Run unit tests only
make test-unit

# Run E2E tests only
make test-e2e

# Run all tests
make test-all

# Fix linting issues
make lint-fix

# Type check
make type-check

# Full CI pipeline locally
make ci
```

## 📋 Common Tasks

### Starting Development
```bash
# Start backend
make start-backend

# Start frontend (in another terminal)
make start-frontend

# Run tests in watch mode
cd storefront && npm run test:watch
```

### Before Committing
```bash
# Validate everything
cd storefront && npm run validate

# Or use Makefile
make validate
```

### Committing Changes
```bash
# Add changes
git add .

# Commit (hooks run automatically)
git commit -m "Your message"

# Pre-commit hook runs:
# ✓ Type checking
# ✓ Linting
# ✓ Unit tests with coverage
```

### Pushing Changes
```bash
# Push (pre-push hook runs automatically)
git push

# Pre-push hook runs:
# ✓ All unit tests
# ✓ E2E tests
# ✓ Build verification
```

## 🧪 Test Commands

```bash
cd storefront

# Run all tests
npm test

# Watch mode
npm run test:watch

# With coverage
npm run test:coverage

# CI mode
npm run test:ci

# E2E tests
npm run test:e2e

# E2E in UI mode
npm run test:e2e:ui

# Debug E2E tests
npm run test:e2e:debug

# Accessibility tests
npm run test:a11y
```

## 🔧 Troubleshooting

### Hooks not running?
```bash
chmod +x .husky/pre-commit .husky/pre-push
git config core.hooksPath .husky
```

### Tests failing?
```bash
# Clear caches
rm -rf storefront/node_modules storefront/.next
cd storefront && npm ci
npx jest --clearCache
```

### Coverage too low?
```bash
cd storefront
npm run test:coverage
open coverage/lcov-report/index.html
```

### Type errors?
```bash
cd storefront
npm run type-check
```

## 🚨 Emergency Override (USE SPARINGLY!)

```bash
# Skip pre-commit hook
git commit --no-verify -m "Emergency fix"

# Skip pre-push hook
git push --no-verify
```

**⚠️ Only use in genuine emergencies!**
- Create ticket immediately
- Fix issues within 24 hours
- Notify team

## 📊 Coverage Requirements

**Minimum: 90% for all categories**
- Branches: 90%
- Functions: 90%
- Lines: 90%
- Statements: 90%

## 🎯 What Runs Where

### Pre-commit Hook
- Type checking
- Linting
- Unit tests + coverage

### Pre-push Hook
- All unit tests
- E2E tests
- Build verification

### CI/CD Pipeline
- Unit tests (all)
- Type checking
- Linting
- E2E tests (multi-browser)
- Build verification
- Coverage upload

## 📁 Key Files

```
.husky/pre-commit              # Pre-commit hook
.husky/pre-push                # Pre-push hook
storefront/jest.config.js      # Jest config (90% thresholds)
storefront/playwright.config.ts # Playwright config
.github/workflows/test.yml     # CI/CD workflow
Makefile                       # Convenient commands
TESTING_MANDATE.md             # Hard requirements
docs/testing/testing-guide.md  # Full guide
```

## 🔍 Viewing Results

### Coverage Report
```bash
cd storefront
npm run test:coverage
open coverage/lcov-report/index.html
```

### Playwright Report
```bash
cd storefront
npm run test:e2e:report
```

### CI Results
1. Go to GitHub repository
2. Click "Actions" tab
3. Select workflow run
4. View job results

## 💡 Best Practices

1. **Write tests first** (TDD approach)
2. **Run tests in watch mode** during development
3. **Run `make validate`** before committing
4. **Check coverage** for new code
5. **Fix type errors** immediately
6. **Never bypass hooks** without justification

## 📚 Documentation

- **Full Guide:** `docs/testing/testing-guide.md`
- **Requirements:** `TESTING_MANDATE.md`
- **Setup Summary:** `docs/testing/AUTOMATION_SETUP_SUMMARY.md`

## ✅ Checklist for New Features

- [ ] Write tests first
- [ ] Ensure 90%+ coverage
- [ ] Add E2E tests if user-facing
- [ ] Include accessibility tests for UI
- [ ] Run `make validate`
- [ ] Commit (hooks run)
- [ ] Push (hooks run)
- [ ] Create PR
- [ ] Wait for CI to pass
- [ ] Request review

---

**Need Help?**
1. Check `testing-guide.md`
2. Review `TESTING_MANDATE.md`
3. Run `./scripts/verify-test-setup.sh`
4. Ask team
