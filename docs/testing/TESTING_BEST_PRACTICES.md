# Testing Best Practices - Medusa 4WD Tours Platform

## Quick Reference Guide

### Test Writing Standards

#### 1. AAA Pattern (Arrange-Act-Assert)

```typescript
it("should add tour to cart with correct price", async () => {
  // Arrange - Set up test data and mocks
  const cart = new Cart()
  const tour = { id: "tour_1", name: "Fraser Island", price: 15000 }
  const quantity = 2

  // Act - Execute the function being tested
  await cart.addTour(tour, quantity)

  // Assert - Verify the expected outcome
  expect(cart.items).toHaveLength(1)
  expect(cart.items[0].quantity).toBe(2)
  expect(cart.total).toBe(30000)
})
```

#### 2. Descriptive Test Names

Use clear, specific descriptions that explain WHAT is being tested and WHAT the expected behavior is:

```typescript
// ❌ Bad
it("should work", () => {})
it("test cart", () => {})
it("handles error", () => {})

// ✅ Good
it("should calculate total with 10% GST for Australian customers", () => {})
it("should throw validation error when email is invalid", () => {})
it("should persist cart items to localStorage after adding tour", () => {})
```

#### 3. One Assertion Per Test

Focus each test on a single behavior:

```typescript
// ❌ Bad - Testing multiple behaviors
it("should handle cart operations", () => {
  cart.addItem(item1)
  expect(cart.items).toHaveLength(1)

  cart.updateQuantity(item1.id, 3)
  expect(cart.items[0].quantity).toBe(3)

  cart.removeItem(item1.id)
  expect(cart.items).toHaveLength(0)
})

// ✅ Good - Separate tests for each behavior
describe("Cart", () => {
  it("should add item to cart", () => {
    cart.addItem(item1)
    expect(cart.items).toHaveLength(1)
  })

  it("should update item quantity", () => {
    cart.addItem(item1)
    cart.updateQuantity(item1.id, 3)
    expect(cart.items[0].quantity).toBe(3)
  })

  it("should remove item from cart", () => {
    cart.addItem(item1)
    cart.removeItem(item1.id)
    expect(cart.items).toHaveLength(0)
  })
})
```

#### 4. Mock External Dependencies

Isolate the code under test:

```typescript
// ❌ Bad - Testing with real database
it("should create product", async () => {
  const product = await productService.create({ name: "Tour" })
  expect(product).toBeDefined()
})

// ✅ Good - Using mocks
it("should create product", async () => {
  const mockProductModule = {
    createProducts: jest.fn().mockResolvedValue([{ id: "prod_1" }])
  }

  const service = new ProductService(mockProductModule)
  const result = await service.create({ name: "Tour" })

  expect(mockProductModule.createProducts).toHaveBeenCalledWith([
    { name: "Tour" }
  ])
  expect(result.id).toBe("prod_1")
})
```

#### 5. Test Edge Cases

Don't just test the happy path:

```typescript
describe("Cart.calculateTotal", () => {
  it("should calculate correct total with items", () => {
    cart.addItem({ price: 100 })
    expect(cart.calculateTotal()).toBe(110) // with GST
  })

  it("should return 0 for empty cart", () => {
    expect(cart.calculateTotal()).toBe(0)
  })

  it("should handle null items gracefully", () => {
    cart.items = null
    expect(cart.calculateTotal()).toBe(0)
  })

  it("should handle undefined prices", () => {
    cart.addItem({ price: undefined })
    expect(cart.calculateTotal()).toBe(0)
  })

  it("should handle negative quantities", () => {
    expect(() => cart.addItem({ price: 100, quantity: -1 }))
      .toThrow("Quantity must be positive")
  })

  it("should handle very large quantities", () => {
    cart.addItem({ price: 100, quantity: 10000 })
    expect(cart.calculateTotal()).toBeGreaterThan(0)
  })
})
```

#### 6. Test Error Paths

Verify error handling:

```typescript
describe("BookingService.createBooking", () => {
  it("should throw error when tour is fully booked", async () => {
    mockTourService.getAvailability.mockResolvedValue(0)

    await expect(
      bookingService.createBooking({ tourId: "tour_1", guests: 4 })
    ).rejects.toThrow("Tour is fully booked")
  })

  it("should throw error when payment fails", async () => {
    mockPaymentService.charge.mockRejectedValue(new Error("Payment declined"))

    await expect(
      bookingService.createBooking({ tourId: "tour_1", guests: 4 })
    ).rejects.toThrow("Payment declined")
  })

  it("should validate email format", async () => {
    await expect(
      bookingService.createBooking({ email: "invalid-email" })
    ).rejects.toThrow("Invalid email format")
  })
})
```

---

## Test Organization

### Directory Structure

```
/tests
  /unit                    # Isolated unit tests
    /blog
    /seeding
    /services

  /api                     # API endpoint tests
    /admin
    /store

  /integration             # Integration tests
    /workflows
    /modules

/storefront/tests
  /unit                    # Frontend unit tests
    /components
    /contexts
    /hooks

  /e2e                     # End-to-end tests
    /booking-flow.spec.ts
    /cart-management.spec.ts
```

### Naming Conventions

**Test Files:**
- Unit/API tests: `*.spec.ts`
- E2E tests: `*.spec.ts`
- React component tests: `*.test.tsx`

**Test Suites:**
```typescript
describe("ServiceName", () => {})           // For services
describe("ComponentName", () => {})         // For components
describe("functionName", () => {})          // For functions
describe("GET /api/endpoint", () => {})     // For API routes
```

---

## Testing Patterns

### 1. Unit Testing Services

```typescript
import BlogModuleService from "../../../src/modules/blog/service"

describe("BlogModuleService", () => {
  let service: BlogModuleService
  let mockListPosts: jest.Mock

  beforeEach(() => {
    mockListPosts = jest.fn()
    service = new BlogModuleService()
    service.listPosts = mockListPosts
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe("listPublishedPosts", () => {
    it("should return only published posts", async () => {
      const mockPosts = [
        { id: "1", is_published: true },
        { id: "2", is_published: true },
      ]
      mockListPosts.mockResolvedValue(mockPosts)

      const result = await service.listPublishedPosts()

      expect(result).toEqual(mockPosts)
      expect(mockListPosts).toHaveBeenCalledWith(
        { is_published: true },
        { order: { published_at: "DESC" } }
      )
    })
  })
})
```

### 2. API Integration Testing

```typescript
import { medusaIntegrationTestRunner } from "@medusajs/test-utils"

medusaIntegrationTestRunner({
  testSuite: ({ getContainer, api }) => {
    describe("GET /store/add-ons", () => {
      beforeEach(async () => {
        // Seed test data
        const container = getContainer()
        const productService = container.resolve("productModuleService")
        await productService.createProducts([{
          handle: "snorkeling-gear",
          metadata: { addon: true }
        }])
      })

      it("should return all add-ons", async () => {
        const response = await api.get("/store/add-ons")

        expect(response.status).toBe(200)
        expect(response.data.addons).toBeDefined()
        expect(response.data.addons.length).toBeGreaterThan(0)
      })

      it("should filter by metadata.addon", async () => {
        const response = await api.get("/store/add-ons")

        response.data.addons.forEach(addon => {
          expect(addon.metadata?.addon).toBe(true)
        })
      })

      it("should complete request in under 300ms", async () => {
        const start = Date.now()
        await api.get("/store/add-ons")
        const duration = Date.now() - start

        expect(duration).toBeLessThan(300)
      })
    })
  }
})
```

### 3. React Component Testing

```typescript
import { render, screen, fireEvent } from '@testing-library/react'
import { CartContext } from '../contexts/CartContext'
import AddToCartButton from '../components/AddToCartButton'

describe("AddToCartButton", () => {
  const mockAddToCart = jest.fn()
  const tour = { id: "tour_1", name: "Fraser Island", price: 15000 }

  const renderComponent = () => {
    return render(
      <CartContext.Provider value={{ addToCart: mockAddToCart }}>
        <AddToCartButton tour={tour} />
      </CartContext.Provider>
    )
  }

  it("should render button with correct text", () => {
    renderComponent()
    expect(screen.getByText("Add to Cart")).toBeInTheDocument()
  })

  it("should call addToCart when clicked", () => {
    renderComponent()

    const button = screen.getByText("Add to Cart")
    fireEvent.click(button)

    expect(mockAddToCart).toHaveBeenCalledWith(tour)
  })

  it("should disable button while loading", () => {
    renderComponent()

    const button = screen.getByText("Add to Cart")
    fireEvent.click(button)

    expect(button).toBeDisabled()
  })

  it("should show success message after adding", async () => {
    renderComponent()

    fireEvent.click(screen.getByText("Add to Cart"))

    expect(await screen.findByText("Added to cart!")).toBeInTheDocument()
  })
})
```

### 4. E2E Testing with Playwright

```typescript
import { test, expect } from '@playwright/test'

test.describe("Booking Flow", () => {
  test("should complete full booking journey", async ({ page }) => {
    // Navigate to tours
    await page.goto('/tours')
    await expect(page).toHaveTitle(/Tours/)

    // Select a tour
    await page.click('text=Fraser Island 1 Day Tour')
    await expect(page).toHaveURL(/\/tours\/fraser-island/)

    // Select date and guests
    await page.fill('[data-testid="date-picker"]', '2025-12-01')
    await page.fill('[data-testid="guest-quantity"]', '2')
    await page.click('text=Add to Cart')

    // Verify cart
    await page.click('[data-testid="cart-icon"]')
    await expect(page.locator('[data-testid="cart-item"]')).toHaveCount(1)

    // Proceed to checkout
    await page.click('text=Proceed to Checkout')
    await expect(page).toHaveURL(/\/checkout/)

    // Fill customer details
    await page.fill('[name="email"]', 'test@example.com')
    await page.fill('[name="firstName"]', 'John')
    await page.fill('[name="lastName"]', 'Doe')
    await page.fill('[name="phone"]', '+61400000000')

    // Complete booking
    await page.click('text=Complete Booking')

    // Verify confirmation
    await expect(page).toHaveURL(/\/confirmation/)
    await expect(page.locator('text=Booking Confirmed')).toBeVisible()
  })

  test("should persist cart across page reloads", async ({ page }) => {
    await page.goto('/tours')
    await page.click('text=Fraser Island 1 Day Tour')
    await page.click('text=Add to Cart')

    // Reload page
    await page.reload()

    // Verify cart persists
    await page.click('[data-testid="cart-icon"]')
    await expect(page.locator('[data-testid="cart-item"]')).toHaveCount(1)
  })
})
```

---

## Coverage Guidelines

### Target Coverage Metrics

- **Overall Project:** ≥80%
- **Critical Business Logic:** 100%
- **API Endpoints:** ≥80%
- **Services:** ≥90%
- **Components:** ≥80%
- **Utilities:** ≥90%

### What to Cover

**High Priority:**
1. Business logic (booking, payments, cart)
2. Data transformations
3. Validation functions
4. Error handling
5. API endpoints
6. State management

**Medium Priority:**
1. UI components
2. Utility functions
3. Formatters
4. Filters

**Low Priority (Can Skip):**
1. Type definitions
2. Constants
3. Simple getters/setters
4. Third-party library wrappers

### Coverage Report

```bash
# Generate HTML coverage report
npm run test:coverage

# View report
open coverage/index.html
```

---

## Common Testing Pitfalls

### ❌ Don't

1. **Test implementation details**
```typescript
// Bad - Testing internal state
expect(component.state.internalCounter).toBe(5)

// Good - Testing behavior
expect(screen.getByText("Count: 5")).toBeInTheDocument()
```

2. **Use real external services**
```typescript
// Bad
const user = await fetch('https://api.example.com/user')

// Good
mockFetch.mockResolvedValue({ id: 1, name: "John" })
```

3. **Share test state**
```typescript
// Bad
let sharedCart = new Cart()

it("test 1", () => {
  sharedCart.addItem(item1)
})

it("test 2", () => {
  sharedCart.addItem(item2) // Depends on test 1
})

// Good
let cart: Cart

beforeEach(() => {
  cart = new Cart()
})

it("test 1", () => {
  cart.addItem(item1)
})

it("test 2", () => {
  cart.addItem(item2) // Independent
})
```

4. **Write flaky tests**
```typescript
// Bad - Relies on timing
await new Promise(resolve => setTimeout(resolve, 1000))

// Good - Wait for specific condition
await waitFor(() => {
  expect(screen.getByText("Loaded")).toBeInTheDocument()
})
```

5. **Test too much in one test**
```typescript
// Bad
it("should handle entire booking flow", async () => {
  // 50 lines of test code...
})

// Good
describe("Booking flow", () => {
  it("should validate customer email", () => {})
  it("should calculate total with GST", () => {})
  it("should create booking record", () => {})
  it("should send confirmation email", () => {})
})
```

### ✅ Do

1. **Use data-testid for E2E tests**
```tsx
<button data-testid="add-to-cart-btn">Add to Cart</button>
```

2. **Group related tests**
```typescript
describe("Cart", () => {
  describe("adding items", () => {})
  describe("removing items", () => {})
  describe("calculating totals", () => {})
})
```

3. **Clean up after tests**
```typescript
afterEach(() => {
  jest.clearAllMocks()
  localStorage.clear()
})
```

4. **Use meaningful test data**
```typescript
// Bad
const user = { id: 1, name: "Test" }

// Good
const australianCustomer = {
  id: "cust_au_123",
  name: "John Smith",
  country: "AU",
  gstApplicable: true
}
```

---

## Performance Testing

### Response Time Testing

```typescript
it("should respond in under 300ms", async () => {
  const start = performance.now()

  await api.get("/store/products")

  const duration = performance.now() - start
  expect(duration).toBeLessThan(300)
})
```

### Memory Leak Testing

```typescript
it("should not leak memory on repeated calls", async () => {
  const initialMemory = process.memoryUsage().heapUsed

  for (let i = 0; i < 1000; i++) {
    await service.processData(largeDataset)
  }

  const finalMemory = process.memoryUsage().heapUsed
  const memoryIncrease = finalMemory - initialMemory

  expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024) // 50MB
})
```

---

## Debugging Failed Tests

### 1. Use .only to isolate

```typescript
it.only("should test specific behavior", () => {
  // This test runs alone
})
```

### 2. Add debug output

```typescript
it("should calculate total", () => {
  console.log("Cart state:", cart)
  const total = cart.calculateTotal()
  console.log("Calculated total:", total)
  expect(total).toBe(100)
})
```

### 3. Use debugger

```typescript
it("should process data", () => {
  debugger // Execution pauses here
  const result = service.process(data)
  expect(result).toBeDefined()
})
```

### 4. Check async issues

```typescript
// Add await to all promises
await cart.addItem(item)
await expect(cart.items).toHaveLength(1)
```

---

## Continuous Integration

### Pre-commit Hook

```bash
# Install husky
npm install --save-dev husky

# Add pre-commit hook
npx husky add .husky/pre-commit "npm run test:unit"
```

### GitHub Actions

See `.github/workflows/tests.yml` in project root for complete CI/CD setup.

---

## Additional Resources

### Documentation
- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Playwright Documentation](https://playwright.dev/docs/intro)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [Medusa Testing Guide](https://docs.medusajs.com/development/testing)

### Tools
- [Majestic](https://github.com/Raathigesh/majestic) - Jest GUI
- [Testing Playground](https://testing-playground.com/) - Test query builder
- [jest-preview](https://www.jest-preview.com/) - Visual debugging for Jest

---

**Last Updated:** November 8, 2025
**Maintained By:** Testing Implementation Agent
