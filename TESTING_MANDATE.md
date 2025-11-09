# TESTING MANDATE

## ABSOLUTE REQUIREMENTS

This is a **HARD DIRECTIVE** that must be followed for all code changes.

### Pre-commit Requirements

Before ANY commit is allowed:

1. ✅ All unit tests MUST pass
2. ✅ Code coverage MUST be >= 90% (branches, functions, lines, statements)
3. ✅ TypeScript type checking MUST pass with no errors
4. ✅ ESLint MUST pass with no errors
5. ✅ Code MUST be properly formatted (Prettier)

**These checks are AUTOMATICALLY enforced by the pre-commit hook.**

### Pre-push Requirements

Before ANY push is allowed:

1. ✅ All pre-commit requirements
2. ✅ All E2E tests MUST pass
3. ✅ Build MUST succeed with no errors
4. ✅ No regressions in existing functionality

**These checks are AUTOMATICALLY enforced by the pre-push hook.**

### CI/CD Requirements

Before ANY deployment or PR merge:

1. ✅ All tests pass in CI environment
2. ✅ Coverage thresholds met (90% minimum)
3. ✅ Type checking passes
4. ✅ Linting passes
5. ✅ Build succeeds
6. ✅ All E2E tests pass on multiple browsers/devices
7. ✅ No accessibility violations

**These checks are AUTOMATICALLY enforced by GitHub Actions.**

## Enforcement Mechanisms

This mandate is enforced through multiple layers:

### 1. Git Hooks (Husky)

**Pre-commit Hook** (`.husky/pre-commit`):
- Runs TypeScript type checking
- Runs ESLint
- Runs unit tests with coverage validation
- **Cannot commit if any check fails**

**Pre-push Hook** (`.husky/pre-push`):
- Runs all unit tests
- Runs all E2E tests
- Builds the project
- **Cannot push if any check fails**

### 2. Lint-staged

Automatically runs on staged files:
- ESLint fixes
- Prettier formatting
- Related Jest tests
- **Runs before commit is finalized**

### 3. Jest Coverage Thresholds

Configured in `storefront/jest.config.js`:
```javascript
coverageThreshold: {
  global: {
    branches: 90,
    functions: 90,
    lines: 90,
    statements: 90,
  },
}
```

**Tests will FAIL if coverage drops below 90%.**

### 4. GitHub Actions Workflow

Located at `.github/workflows/test.yml`:
- Runs on every push to main/develop
- Runs on every pull request
- Includes separate jobs for:
  - Unit tests with coverage
  - TypeScript type checking
  - Linting
  - E2E tests (multiple browsers)
  - Build verification
- **PR cannot be merged if any job fails**

## Coverage Requirements

### Minimum Coverage (HARD REQUIREMENT)

All code must maintain **minimum 90% coverage** across:
- **Branches**: 90%
- **Functions**: 90%
- **Lines**: 90%
- **Statements**: 90%

### Coverage Reporting

- Coverage reports are generated on every test run
- HTML reports available in `storefront/coverage/lcov-report/index.html`
- CI uploads coverage to Codecov
- Coverage badge should be displayed in README

## Test Categories

### Unit Tests
- Location: `storefront/tests/unit/`
- Run: `npm run test:unit`
- Focus: Individual components, functions, utilities

### Integration Tests
- Location: `storefront/tests/integration/`
- Run: `npm run test:integration`
- Focus: Component interactions, API calls

### Accessibility Tests
- Location: `storefront/tests/a11y/`
- Run: `npm run test:a11y`
- Focus: WCAG compliance, screen reader support

### E2E Tests
- Location: `storefront/tests/e2e/`
- Run: `npm run test:e2e`
- Focus: Complete user workflows, cross-browser testing

## Developer Workflow

### Standard Development Flow

1. **Start development**
   ```bash
   make start-frontend
   ```

2. **Run tests in watch mode during development**
   ```bash
   cd storefront && npm run test:watch
   ```

3. **Before committing, validate your changes**
   ```bash
   cd storefront && npm run validate
   ```

4. **Commit changes** (hooks run automatically)
   ```bash
   git add .
   git commit -m "Your commit message"
   ```
   - Pre-commit hook runs automatically
   - Type checking, linting, and tests execute
   - Commit proceeds only if all checks pass

5. **Push changes** (pre-push hook runs automatically)
   ```bash
   git push
   ```
   - Pre-push hook runs automatically
   - Full test suite and build verification execute
   - Push proceeds only if all checks pass

6. **Create PR**
   - GitHub Actions runs automatically
   - Wait for all CI checks to pass
   - Address any failures before requesting review

### Quick Commands

```bash
# Run all validations
make validate

# Run unit tests only
make test-unit

# Run E2E tests only
make test-e2e

# Run all tests
make test-all

# Type check
make type-check

# Lint and fix
make lint-fix

# Full CI pipeline locally
make ci
```

## Overriding Checks (EMERGENCY ONLY)

### When to Override

Overriding should be **EXTREMELY RARE** and only in genuine emergencies:
- Critical production bug fix needed immediately
- Blocking issue preventing team progress
- Test infrastructure failure (not code issues)

### How to Override

```bash
# Skip pre-commit hooks (USE WITH EXTREME CAUTION)
git commit --no-verify -m "Emergency fix: [reason]"

# Skip pre-push hooks (USE WITH EXTREME CAUTION)
git push --no-verify
```

### Mandatory Follow-up

If you override checks:

1. **Immediately create a ticket** to fix the underlying issues
2. **Notify the team** in Slack/Discord with explanation
3. **Create a follow-up PR** within 24 hours to address the issues
4. **Document the incident** in project documentation

**WARNING**: Frequent use of `--no-verify` indicates deeper issues that must be addressed.

## Troubleshooting

### Tests Failing Locally

```bash
# Clear all caches and reinstall
rm -rf storefront/node_modules storefront/.next
cd storefront && npm ci

# Clear Jest cache
cd storefront && npx jest --clearCache

# Update Playwright browsers
cd storefront && npx playwright install
```

### Coverage Below Threshold

```bash
# Run coverage report to see what's missing
cd storefront && npm run test:coverage

# Open HTML report in browser
open storefront/coverage/lcov-report/index.html
```

### Type Errors

```bash
# Run type check to see all errors
cd storefront && npm run type-check

# Common fixes:
# - Update type definitions
# - Add missing types
# - Fix incorrect type usage
```

### Linting Errors

```bash
# Auto-fix linting issues
cd storefront && npm run lint:fix

# If auto-fix doesn't work, manually address remaining issues
```

### E2E Tests Failing

```bash
# Run in headed mode to see what's happening
cd storefront && npm run test:e2e:debug

# Run specific test file
cd storefront && npx playwright test tests/e2e/specific-test.spec.ts

# Update snapshots if UI intentionally changed
cd storefront && npx playwright test --update-snapshots
```

### Git Hooks Not Running

```bash
# Ensure Husky is properly installed
npx husky install

# Verify hooks are executable
chmod +x .husky/pre-commit .husky/pre-push

# Check git config
git config core.hooksPath
# Should output: .husky
```

## Continuous Improvement

### Monitoring Test Health

- Review failed test trends weekly
- Identify flaky tests and fix them
- Keep test execution time under control
- Update test coverage goals as codebase matures

### Adding New Tests

When adding new features:

1. **Write tests FIRST** (TDD approach)
2. **Ensure 90%+ coverage** of new code
3. **Add E2E tests** for user-facing features
4. **Include accessibility tests** for UI components
5. **Document test scenarios** in code comments

### Test Performance

- Unit tests should complete in < 30 seconds
- E2E tests should complete in < 5 minutes
- Optimize slow tests regularly
- Use test parallelization where appropriate

## Questions?

See `/Users/Karim/med-usa-4wd/docs/testing/testing-guide.md` for detailed instructions.

For issues or questions:
1. Check this mandate first
2. Review testing-guide.md documentation
3. Check CI logs for specific errors
4. Ask team for help if needed

---

**REMEMBER**: These requirements exist to maintain code quality, prevent bugs, and ensure confidence in deployments. They are non-negotiable except in genuine emergencies.
