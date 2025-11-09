# Comprehensive Testing Guide

## Overview

This guide covers all aspects of testing in the Sunshine Coast 4WD Tours application, from writing tests to running them locally and in CI/CD.

## Table of Contents

1. [Test Environment Setup](#test-environment-setup)
2. [Running Tests](#running-tests)
3. [Writing Tests](#writing-tests)
4. [Coverage Requirements](#coverage-requirements)
5. [CI/CD Pipeline](#cicd-pipeline)
6. [Debugging Tests](#debugging-tests)
7. [Best Practices](#best-practices)
8. [Troubleshooting](#troubleshooting)

---

## Test Environment Setup

### Initial Setup

```bash
# Clone repository
git clone <repository-url>
cd med-usa-4wd

# Install dependencies
make setup

# This will:
# - Install backend dependencies
# - Install storefront dependencies
# - Install Playwright browsers
```

### Environment Configuration

Create `.env.local` in the storefront directory:

```bash
# Storefront environment variables
NEXT_PUBLIC_MEDUSA_BACKEND_URL=http://localhost:9000
NEXT_PUBLIC_BASE_URL=http://localhost:8000
```

### IDE Setup (VSCode)

The project includes VSCode settings (`.vscode/settings.json`) that:
- Enable format on save
- Run ESLint auto-fixes
- Show Jest tests in watch mode
- Display coverage on load

**Recommended VSCode Extensions:**
- ESLint
- Prettier
- Jest Runner
- Playwright Test for VSCode

---

## Running Tests

### Quick Reference

```bash
# Run all tests
make test-all

# Run unit tests only
make test-unit

# Run E2E tests only
make test-e2e

# Run validation (type-check + lint + tests)
make validate

# Full CI pipeline locally
make ci
```

### Detailed Test Commands

#### Unit Tests

```bash
# Run all unit tests
cd storefront && npm run test

# Run tests in watch mode (development)
cd storefront && npm run test:watch

# Run with coverage
cd storefront && npm run test:coverage

# Run specific test file
cd storefront && npm test -- tests/unit/components/Button.test.tsx

# Run tests matching pattern
cd storefront && npm test -- --testNamePattern="Button"
```

#### E2E Tests

```bash
# Run all E2E tests
cd storefront && npm run test:e2e

# Run in UI mode (interactive)
cd storefront && npm run test:e2e:ui

# Run specific test file
cd storefront && npx playwright test tests/e2e/checkout-flow.spec.ts

# Run on specific browser
cd storefront && npx playwright test --project="Desktop Chrome"

# Run mobile tests only
cd storefront && npm run test:e2e:mobile

# Debug mode (step through tests)
cd storefront && npm run test:e2e:debug
```

#### Accessibility Tests

```bash
# Run accessibility tests
cd storefront && npm run test:a11y

# Run specific a11y test
cd storefront && npm test -- tests/a11y/homepage.test.tsx
```

#### Type Checking

```bash
# Run TypeScript type check
cd storefront && npm run type-check
```

#### Linting

```bash
# Run linter
cd storefront && npm run lint

# Run linter with auto-fix
cd storefront && npm run lint:fix
```

---

## Writing Tests

### Unit Tests

#### Component Tests

```typescript
// tests/unit/components/Button.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from '@/components/Button';

describe('Button', () => {
  it('renders with correct text', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });

  it('calls onClick when clicked', () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick}>Click me</Button>);

    fireEvent.click(screen.getByText('Click me'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('is disabled when disabled prop is true', () => {
    render(<Button disabled>Click me</Button>);
    expect(screen.getByRole('button')).toBeDisabled();
  });
});
```

#### Utility Function Tests

```typescript
// tests/unit/lib/formatPrice.test.ts
import { formatPrice } from '@/lib/formatPrice';

describe('formatPrice', () => {
  it('formats USD prices correctly', () => {
    expect(formatPrice(1999, 'USD')).toBe('$19.99');
  });

  it('formats AUD prices correctly', () => {
    expect(formatPrice(2999, 'AUD')).toBe('A$29.99');
  });

  it('handles zero correctly', () => {
    expect(formatPrice(0, 'USD')).toBe('$0.00');
  });
});
```

#### Hook Tests

```typescript
// tests/unit/hooks/useCart.test.tsx
import { renderHook, act } from '@testing-library/react';
import { useCart } from '@/hooks/useCart';

describe('useCart', () => {
  it('initializes with empty cart', () => {
    const { result } = renderHook(() => useCart());
    expect(result.current.items).toEqual([]);
    expect(result.current.total).toBe(0);
  });

  it('adds item to cart', () => {
    const { result } = renderHook(() => useCart());

    act(() => {
      result.current.addItem({ id: '1', name: 'Test Tour', price: 100 });
    });

    expect(result.current.items).toHaveLength(1);
    expect(result.current.total).toBe(100);
  });
});
```

### E2E Tests

```typescript
// tests/e2e/checkout-flow.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Checkout Flow', () => {
  test('completes full checkout process', async ({ page }) => {
    // Navigate to tour page
    await page.goto('/tours/rainbow-beach');

    // Select tour date
    await page.click('[data-testid="date-picker"]');
    await page.click('[data-testid="date-option-tomorrow"]');

    // Add to cart
    await page.click('[data-testid="add-to-cart"]');
    await expect(page.locator('[data-testid="cart-count"]')).toHaveText('1');

    // Go to cart
    await page.click('[data-testid="cart-icon"]');
    await expect(page).toHaveURL(/.*cart/);

    // Proceed to checkout
    await page.click('[data-testid="checkout-button"]');

    // Fill customer information
    await page.fill('[name="email"]', 'test@example.com');
    await page.fill('[name="firstName"]', 'John');
    await page.fill('[name="lastName"]', 'Doe');

    // Complete checkout
    await page.click('[data-testid="complete-order"]');

    // Verify success
    await expect(page.locator('h1')).toContainText('Order Confirmed');
  });

  test('validates required fields', async ({ page }) => {
    await page.goto('/checkout');

    // Try to submit without filling fields
    await page.click('[data-testid="complete-order"]');

    // Check for validation messages
    await expect(page.locator('[data-testid="email-error"]')).toBeVisible();
    await expect(page.locator('[data-testid="name-error"]')).toBeVisible();
  });
});
```

### Accessibility Tests

```typescript
// tests/a11y/homepage.test.tsx
import { render } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import HomePage from '@/app/page';

expect.extend(toHaveNoViolations);

describe('Homepage Accessibility', () => {
  it('has no accessibility violations', async () => {
    const { container } = render(<HomePage />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('has proper heading hierarchy', () => {
    const { container } = render(<HomePage />);
    const h1 = container.querySelector('h1');
    expect(h1).toBeInTheDocument();
  });

  it('has alt text on all images', () => {
    const { container } = render(<HomePage />);
    const images = container.querySelectorAll('img');
    images.forEach(img => {
      expect(img).toHaveAttribute('alt');
    });
  });
});
```

---

## Coverage Requirements

### Thresholds

All code must maintain **90% minimum coverage**:

```javascript
// jest.config.js
coverageThreshold: {
  global: {
    branches: 90,
    functions: 90,
    lines: 90,
    statements: 90,
  },
}
```

### Viewing Coverage Reports

```bash
# Generate coverage report
cd storefront && npm run test:coverage

# Open HTML report in browser
open storefront/coverage/lcov-report/index.html
```

### Coverage Report Breakdown

The HTML report shows:
- **Overall coverage percentage** for each category
- **File-by-file breakdown** with color coding:
  - Green: Good coverage (>90%)
  - Yellow: Warning (80-90%)
  - Red: Insufficient (<80%)
- **Uncovered lines** highlighted in red
- **Branch coverage** showing which conditions aren't tested

### Improving Coverage

1. **Identify uncovered lines** in the HTML report
2. **Write tests** for those specific scenarios
3. **Re-run coverage** to verify improvement
4. **Commit changes** once threshold is met

---

## CI/CD Pipeline

### GitHub Actions Workflow

Location: `.github/workflows/test.yml`

#### Pipeline Jobs

1. **Unit Tests**
   - Runs all unit tests with coverage
   - Uploads coverage to Codecov
   - Archives coverage reports

2. **Type Check**
   - Validates TypeScript types
   - Ensures no type errors

3. **Lint**
   - Runs ESLint
   - Checks code quality

4. **E2E Tests**
   - Starts backend and frontend
   - Runs Playwright tests
   - Tests multiple browsers
   - Archives test results

5. **Build**
   - Builds production bundle
   - Verifies build succeeds
   - Archives build artifacts

6. **All Tests Passed**
   - Final gate
   - Requires all jobs to succeed

#### Viewing CI Results

1. Go to GitHub repository
2. Click "Actions" tab
3. Select workflow run
4. View individual job results
5. Download artifacts (coverage, Playwright reports)

#### CI Triggers

- **Push to main/develop**: Full test suite
- **Pull Request**: Full test suite
- **Manual trigger**: Available for any branch

---

## Debugging Tests

### Unit Test Debugging

#### VS Code Debugger

1. Set breakpoint in test file
2. Click "Debug" button in Jest Runner
3. Step through code

#### Console Debugging

```typescript
test('debugs component state', () => {
  const { debug } = render(<MyComponent />);

  // Print component HTML
  debug();

  // Print specific element
  debug(screen.getByRole('button'));
});
```

#### Screen Queries

```typescript
import { screen } from '@testing-library/react';

// Print all available roles
screen.logTestingPlaygroundURL();

// Find elements by role
screen.getByRole('button', { name: /click me/i });

// Query debugging
screen.debug(screen.getByTestId('my-element'));
```

### E2E Test Debugging

#### Interactive Debugging

```bash
# Run in debug mode (headed browser with DevTools)
cd storefront && npm run test:e2e:debug
```

#### Screenshots and Videos

Playwright automatically captures:
- **Screenshots** on failure
- **Videos** on failure
- **Traces** on retry

Location: `storefront/test-results/`

#### Viewing Traces

```bash
# Open trace viewer
npx playwright show-trace storefront/test-results/trace.zip
```

#### Slow Motion

```typescript
test.use({
  launchOptions: {
    slowMo: 1000 // 1 second delay between actions
  }
});
```

#### Step-by-Step Execution

```typescript
test('debugs with pause', async ({ page }) => {
  await page.goto('/');

  // Pause test execution
  await page.pause();

  // Continue manually in browser
});
```

---

## Best Practices

### Test Organization

```
tests/
├── unit/
│   ├── components/
│   ├── lib/
│   └── hooks/
├── integration/
│   ├── api/
│   └── workflows/
├── a11y/
│   └── pages/
└── e2e/
    ├── checkout/
    ├── tours/
    └── user/
```

### Naming Conventions

- **Test files**: `*.test.tsx` or `*.spec.ts`
- **E2E files**: `*.spec.ts`
- **Describe blocks**: Feature or component name
- **Test cases**: "should do something" or "does something"

### Test Structure (AAA Pattern)

```typescript
test('adds item to cart', () => {
  // Arrange - Set up test data
  const item = { id: '1', name: 'Tour', price: 100 };

  // Act - Perform action
  const { result } = renderHook(() => useCart());
  act(() => result.current.addItem(item));

  // Assert - Verify result
  expect(result.current.items).toContain(item);
});
```

### Test Data

```typescript
// Use factories for consistent test data
const createMockTour = (overrides = {}) => ({
  id: '1',
  title: 'Rainbow Beach Tour',
  price: 19900,
  duration: 480,
  ...overrides,
});

test('renders tour details', () => {
  const tour = createMockTour({ title: 'Custom Tour' });
  render(<TourCard tour={tour} />);
  expect(screen.getByText('Custom Tour')).toBeInTheDocument();
});
```

### Mocking

```typescript
// Mock API calls
jest.mock('@/lib/medusa', () => ({
  sdk: {
    store: {
      product: {
        list: jest.fn().mockResolvedValue({
          products: [{ id: '1', title: 'Test Tour' }],
        }),
      },
    },
  },
}));

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    pathname: '/',
  }),
}));
```

### Async Testing

```typescript
// Use waitFor for async operations
import { waitFor } from '@testing-library/react';

test('loads data asynchronously', async () => {
  render(<AsyncComponent />);

  await waitFor(() => {
    expect(screen.getByText('Loaded')).toBeInTheDocument();
  });
});

// Use findBy for elements that appear later
test('shows error message', async () => {
  render(<FormComponent />);

  fireEvent.submit(screen.getByRole('form'));

  const error = await screen.findByRole('alert');
  expect(error).toHaveTextContent('Validation failed');
});
```

---

## Troubleshooting

### Common Issues

#### 1. Tests Pass Locally but Fail in CI

**Causes:**
- Different Node.js versions
- Missing environment variables
- Timezone differences
- Parallel execution issues

**Solutions:**
```bash
# Use same Node version as CI (check .github/workflows/test.yml)
nvm use 18

# Set CI environment variable locally
CI=true npm test

# Run tests sequentially
npm test -- --runInBand
```

#### 2. Flaky E2E Tests

**Causes:**
- Race conditions
- Network timeouts
- Animation timing

**Solutions:**
```typescript
// Wait for network to be idle
await page.goto('/', { waitUntil: 'networkidle' });

// Increase timeout for slow operations
await page.click('button', { timeout: 10000 });

// Wait for specific condition
await page.waitForSelector('[data-loaded="true"]');

// Disable animations in tests
test.use({
  viewport: { width: 1280, height: 720 },
  hasTouch: false,
  reducedMotion: 'reduce',
});
```

#### 3. Coverage Threshold Not Met

**Solution:**
```bash
# Generate detailed coverage report
npm run test:coverage

# Identify uncovered files
open coverage/lcov-report/index.html

# Add tests for uncovered code
# Re-run until threshold is met
```

#### 4. TypeScript Errors in Tests

**Solutions:**
```typescript
// Use type assertions when needed
const mockFn = jest.fn() as jest.MockedFunction<typeof actualFn>;

// Import types properly
import type { Product } from '@medusajs/types';

// Use any as last resort (with comment explaining why)
// @ts-expect-error - Third-party library type issue
const result = problematicFunction();
```

#### 5. Slow Test Execution

**Optimizations:**
```javascript
// jest.config.js
module.exports = {
  // Use faster test environment
  testEnvironment: 'jest-environment-jsdom',

  // Parallel execution
  maxWorkers: '50%',

  // Cache test results
  cache: true,
  cacheDirectory: '.jest-cache',
};
```

```bash
# Run only changed tests
npm test -- --onlyChanged

# Run affected tests
npm test -- --changedSince=main
```

### Getting Help

1. **Check this guide** for solutions
2. **Review TESTING_MANDATE.md** for requirements
3. **Check CI logs** for specific error messages
4. **Search GitHub issues** for similar problems
5. **Ask team members** in Slack/Discord

### Useful Links

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Testing Library](https://testing-library.com/docs/react-testing-library/intro)
- [Playwright Documentation](https://playwright.dev/docs/intro)
- [Jest-Axe](https://github.com/nickcolley/jest-axe)

---

## Summary

This testing infrastructure ensures:
- ✅ High code quality through comprehensive coverage
- ✅ Automated validation on every commit and push
- ✅ Confidence in deployments through CI/CD
- ✅ Fast feedback during development
- ✅ Accessibility compliance
- ✅ Cross-browser compatibility

**Remember:** Tests are documentation, safety nets, and quality gates. Write them well, maintain them diligently.
