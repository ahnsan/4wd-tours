# Impact Analysis: AddOnCard Fix Across User Journey

**Date:** 2025-11-09
**Objective:** Ensure any fix to AddOnCard.tsx won't break product pages or checkout flow
**Scope:** Complete user journey from home → tours → product page → checkout → confirmation

---

## Executive Summary

**CRITICAL FINDING:** The AddOnCard component is used in **3 separate checkout flows** but **NOT on product pages**. Any fixes to AddOnCard will impact checkout functionality but will not affect the tour detail pages.

**Impact Level:** MEDIUM-HIGH
**Pages Affected:** 2 checkout pages (add-ons selection)
**Components Affected:** 1 core component (AddOnCard.tsx)
**Test Files Available:** 8 test suites covering AddOnCard

---

## 1. User Journey Map with Add-on Touchpoints

### Complete User Flow

```
HOME → TOURS PAGE → TOUR DETAIL → ADD TO CART → CHECKOUT FLOW → CONFIRMATION
  ↓         ↓            ↓              ↓              ↓              ↓
  X         X      TourAddOns    AddOnCard x2    BookingSummary    Order Items
                   (preview)     (selection)       (summary)        (display)
```

### Detailed Touchpoint Analysis

| Step | Page | Add-on Display | Component Used | AddOnCard Used? |
|------|------|----------------|----------------|-----------------|
| 1. Home | `/` | No | N/A | ❌ No |
| 2. Tours Listing | `/tours` | No | N/A | ❌ No |
| 3. Tour Detail | `/tours/[handle]` | Yes (preview) | `TourAddOns` | ❌ No (custom cards) |
| 4. Add-ons Selection | `/checkout/add-ons` | Yes (grid) | `AddOnCard` | ✅ YES |
| 5. Add-ons Flow | `/checkout/add-ons-flow` | Yes (step-by-step) | `AddOnCard` | ✅ YES |
| 6. Checkout | `/checkout` | Summary only | `BookingSummary` | ❌ No |
| 7. Confirmation | `/checkout/confirmation` | Order items | Order display | ❌ No |

---

## 2. Product Page Analysis

### File: `/app/tours/[handle]/page.tsx`

**Add-ons Display:** YES (via TourAddOns component at line 596)
**Uses AddOnCard:** NO

#### TourAddOns Component Analysis
**File:** `/components/Tours/TourAddOns.tsx`

```typescript
// Custom card implementation - NOT using AddOnCard
<div className={styles.addOnCard}>
  <div className={styles.imageContainer}>
    <Image src={addon.icon} alt={addon.title} />
    <span className={styles.categoryBadge}>{addon.category}</span>
  </div>
  <div className={styles.content}>
    <h3>{addon.title}</h3>
    <p>{addon.description}</p>
    <div className={styles.footer}>
      <span className={styles.price}>{formatPrice(...)}</span>
      <button onClick={handleAddToCart}>Add</button>
    </div>
  </div>
</div>
```

**Key Features:**
- Shows preview of first 6 add-ons
- Simple "Add to cart" button (no quantity selector)
- Uses custom card styling (NOT AddOnCard.module.css)
- Links to `/checkout/add-ons` for full selection

**Impact of AddOnCard Fix:** ❌ **NONE** - Product pages use completely separate component

---

## 3. Checkout Flow Analysis

### 3.1 Standard Add-ons Page

**File:** `/app/checkout/add-ons/page.tsx`
**AddOnCard Usage:** Line 33 (dynamic import), Line 429 (rendering)

```typescript
// Dynamic import with SSR
const AddOnCard = dynamic(() => import('../../../components/Checkout/AddOnCard'), {
  loading: () => <AddOnCardSkeleton />,
  ssr: true,
});

// Rendering in grid (line 429-438)
{filteredAndSortedAddons.map((addon) => (
  <AddOnCard
    addon={addon}
    isSelected={selectedAddOns.has(addon.id)}
    quantity={getAddonQuantity(addon.id)}
    onToggle={handleToggleAddOn}
    onQuantityChange={handleQuantityChange}
    onLearnMore={handleOpenDrawer}
    tourDays={cart.tour_booking?.tour.duration_days || 1}
    participants={cart.tour_booking?.participants || 1}
  />
))}
```

**Key Props Passed:**
- `addon`: Addon type from `/lib/types/cart.ts`
- `isSelected`: boolean
- `quantity`: number (from cart state)
- `onToggle`: callback to add/remove from cart
- `onQuantityChange`: callback for quantity updates
- `onLearnMore`: opens drawer with details
- `tourDays`: number (for price calculation)
- `participants`: number (for price calculation)

**Features Used:**
- ✅ Selection checkbox
- ✅ Quantity controls (if selected && not per_booking)
- ✅ Price display (per_day, per_person, per_booking)
- ✅ Total price calculation
- ✅ Learn more button (opens drawer)
- ✅ Category badge
- ✅ Unavailable state handling

### 3.2 Multi-Step Add-ons Flow

**File:** `/app/checkout/add-ons-flow/page.tsx`
**AddOnCard Usage:** Line 25 (dynamic import), Line 395 (rendering)

```typescript
// Dynamic import with SSR
const AddOnCard = dynamic(() => import('../../../components/Checkout/AddOnCard'), {
  ssr: true,
});

// Rendering in category steps (line 395-404)
{currentStep.addons.map((addon) => (
  <AddOnCard
    key={addon.id}
    addon={addon}
    isSelected={selectedAddOns.has(addon.id)}
    quantity={getAddonQuantity(addon.id)}
    onToggle={handleToggleAddOn}
    onQuantityChange={handleQuantityChange}
    tourDays={cart.tour_booking?.tour?.duration_days || 1}
    participants={cart.tour_booking?.participants || 1}
  />
))}
```

**Key Differences from Standard Page:**
- ❌ NO `onLearnMore` prop (drawer not available in this flow)
- ✅ Same core functionality
- ✅ Filtered by tour handle
- ✅ Step-by-step category navigation

**Features Used:**
- ✅ Selection checkbox
- ✅ Quantity controls
- ✅ Price display
- ✅ Total price calculation
- ❌ NO learn more button (prop not passed)
- ✅ Category badge
- ✅ Unavailable state handling

### 3.3 Checkout Page (Summary Only)

**File:** `/app/checkout/page.tsx`
**AddOnCard Usage:** ❌ NONE

Uses `BookingSummary` component which displays selected add-ons in a simple list format (no interactive controls).

### 3.4 Confirmation Page (Order Display)

**File:** `/app/checkout/confirmation/page.tsx`
**AddOnCard Usage:** ❌ NONE

Displays order items from Medusa backend in read-only format.

---

## 4. Data Flow Verification

### 4.1 Addon Data Type

**Source:** `/lib/types/cart.ts` (lines 60-77)

```typescript
export interface Addon {
  id: string;                 // Medusa product ID
  variant_id: string;         // Medusa variant ID
  title: string;
  description: string;
  price_cents: number;        // Base price in cents
  pricing_type: AddonPricingType; // 'per_booking' | 'per_day' | 'per_person'
  category: string;
  available: boolean;
  icon?: string;
  metadata?: {
    quantity_allowed?: boolean;
    max_quantity?: number;
    recommended_for?: string[];
    tags?: string[];
    [key: string]: any;
  };
}
```

**CRITICAL:** This is the authoritative Addon type used by AddOnCard. Any changes to AddOnCard must maintain compatibility with this type.

### 4.2 Data Sources at Each Stage

| Stage | Data Source | Type | Location |
|-------|-------------|------|----------|
| Tour Detail Preview | `useAddOns` hook | `Addon[]` | `/lib/hooks/useAddOns.ts` |
| Add-ons Page | `useAddOns` hook | `Addon[]` | `/lib/hooks/useAddOns.ts` |
| Add-ons Flow | `getCategorySteps` | `CategoryStep[]` containing `Addon[]` | `/lib/data/addon-flow-service.ts` |
| Cart State | CartContext | `CartAddon[]` | `/lib/context/CartContext.tsx` |
| Checkout Summary | CartContext | `CartAddon[]` | `/lib/context/CartContext.tsx` |
| Confirmation | Medusa Order API | `MedusaOrder.items` | `/lib/data/cart-service.ts` |

### 4.3 useAddOns Hook

**File:** `/lib/hooks/useAddOns.ts`

```typescript
export function useAddOns(): UseAddOnsReturn {
  const { data, error, isLoading } = useSWR(
    'addons-list',
    async () => {
      const response = await fetchAllAddOns();
      return response;
    },
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      dedupingInterval: 60000, // 60 seconds
    }
  );

  return {
    addons: data?.addons || [],
    isLoading,
    error: error || null,
    refetch: () => mutate(),
    dataSource: data?.source,
  };
}
```

**Key Points:**
- Uses SWR for caching and deduplication
- 60-second dedupe interval prevents redundant requests
- Returns same `Addon[]` type everywhere
- No data transformations between stages

### 4.4 Price Calculation in AddOnCard

**File:** `/components/Checkout/AddOnCard.tsx` (lines 82-103)

```typescript
const getDisplayPrice = () => {
  const basePriceDollars = addon.price_cents / 100;
  switch (addon.pricing_type) {
    case 'per_day':
      return {
        price: basePriceDollars * tourDays,
        unit: `per item (${tourDays} day${tourDays > 1 ? 's' : ''})`,
      };
    case 'per_person':
      return {
        price: basePriceDollars * participants,
        unit: `per item (${participants} person${participants > 1 ? 's' : ''})`,
      };
    case 'per_booking':
    default:
      return {
        price: basePriceDollars,
        unit: 'per booking',
      };
  }
};

const totalPrice = displayPrice * (isSelected ? localQuantity : 0);
```

**Impact Considerations:**
- Price calculation depends on `tourDays` and `participants` props
- Total price = displayPrice × quantity (if selected)
- Changing price logic affects both add-ons pages

---

## 5. Regression Risk Assessment

### Risk Matrix

| Area | Component/Page | Risk Level | Reason | Test Coverage |
|------|----------------|-----------|--------|---------------|
| Tour Detail Preview | `TourAddOns` | 🟢 LOW | Separate component, no AddOnCard usage | Partial |
| Add-ons Page | `/checkout/add-ons` | 🔴 HIGH | Core AddOnCard usage, complex interactions | Good |
| Add-ons Flow | `/checkout/add-ons-flow` | 🔴 HIGH | Core AddOnCard usage, step-by-step flow | Good |
| Checkout Summary | `BookingSummary` | 🟢 LOW | Read-only display, no AddOnCard | Good |
| Confirmation | Order display | 🟢 LOW | Backend data only, no AddOnCard | Partial |
| Price Calculations | AddOnCard internal | 🟡 MEDIUM | Formula changes could break totals | Good |
| Quantity Controls | AddOnCard internal | 🟡 MEDIUM | UI/UX changes affect user interaction | Good |
| Selection State | AddOnCard internal | 🔴 HIGH | Checkbox/toggle logic critical for cart | Excellent |

### Potential Breaking Changes

#### 🔴 High Risk Changes
1. **Changing prop interface** (e.g., renaming props, changing types)
   - **Affected:** Both add-ons pages would break
   - **Fix Required:** Update both pages + type definitions

2. **Modifying selection logic** (checkbox behavior, onToggle callback)
   - **Affected:** Cart state management, item selection
   - **Fix Required:** Update CartContext, test cart operations

3. **Breaking price calculation** (formula changes, unit display)
   - **Affected:** All price displays, cart totals
   - **Fix Required:** Update pricing utils, recalculate totals

#### 🟡 Medium Risk Changes
1. **Changing quantity control behavior** (min/max, increment logic)
   - **Affected:** User experience, cart quantity management
   - **Fix Required:** Test quantity edge cases

2. **Modifying CSS class names** (styles module changes)
   - **Affected:** Visual appearance, potential layout breaks
   - **Fix Required:** Visual regression testing

3. **Adding new required props**
   - **Affected:** Both add-ons pages need updates
   - **Fix Required:** Pass new props from parent components

#### 🟢 Low Risk Changes
1. **Internal state management** (local quantity state, debouncing)
   - **Affected:** Component internals only
   - **Fix Required:** None (encapsulated)

2. **Accessibility improvements** (ARIA labels, semantic HTML)
   - **Affected:** Screen readers, keyboard navigation
   - **Fix Required:** A11y testing

3. **Performance optimizations** (memo comparison, render optimizations)
   - **Affected:** Render performance
   - **Fix Required:** Performance benchmarking

---

## 6. Test Recommendations

### 6.1 Existing Test Coverage

| Test Suite | File | Coverage | Focus |
|-----------|------|----------|-------|
| Unit Tests | `/tests/components/addons/AddOnCard.test.tsx` | ✅ Excellent | Component rendering, interactions, price calculations |
| Integration | `/tests/integration/addons/addons-page.test.tsx` | ✅ Good | Full page functionality |
| E2E | `/tests/e2e/addons.spec.ts` | ✅ Good | User flows |
| E2E | `/tests/e2e/addons/addons-flow.spec.ts` | ✅ Good | Step-by-step flow |
| A11y | `/tests/a11y/addons/addons-a11y.test.tsx` | ✅ Good | Accessibility |
| Performance | `/tests/performance/addons/addons-performance.test.ts` | ✅ Good | Performance metrics |
| Filtering | `/tests/integration/addon-flow-filtering.test.ts` | ✅ Good | Tour-specific filtering |
| Filtering | `/tests/e2e/addon-filtering.spec.ts` | ✅ Good | E2E filtering |

**Total Test Files:** 8 test suites covering AddOnCard functionality

### 6.2 Pre-Deployment Testing Checklist

#### Unit Tests to Run
```bash
# Run AddOnCard component tests
npm test tests/components/addons/AddOnCard.test.tsx

# Expected: All 40+ tests passing
# Focus areas:
# - Rendering with all pricing types
# - Price calculations (per_day, per_person, per_booking)
# - Quantity controls (increment, decrement, min/max)
# - Selection state (checkbox, toggle)
# - Accessibility (ARIA labels, keyboard navigation)
```

#### Integration Tests to Run
```bash
# Run add-ons page integration tests
npm test tests/integration/addons/addons-page.test.tsx

# Run add-ons flow filtering tests
npm test tests/integration/addon-flow-filtering.test.ts

# Expected: All integration tests passing
# Focus areas:
# - Category filtering
# - Selection flow (add, remove, update quantity)
# - Price totals update
# - Navigation between steps
```

#### E2E Tests to Run
```bash
# Run full E2E add-ons flow
npm run test:e2e tests/e2e/addons/addons-flow.spec.ts

# Run add-ons page E2E tests
npm run test:e2e tests/e2e/addons.spec.ts

# Run filtering E2E tests
npm run test:e2e tests/e2e/addon-filtering.spec.ts

# Expected: All E2E tests passing
# Focus areas:
# - Complete user journey (select tour → add add-ons → checkout)
# - Multi-step flow navigation
# - Cart persistence across pages
# - Tour-specific filtering works
```

#### Accessibility Tests to Run
```bash
# Run A11y tests
npm test tests/a11y/addons/addons-a11y.test.tsx

# Expected: No accessibility violations
# Focus areas:
# - WCAG 2.1 AA compliance
# - Keyboard navigation
# - Screen reader compatibility
# - Color contrast ratios
```

#### Performance Tests to Run
```bash
# Run performance benchmarks
npm test tests/performance/addons/addons-performance.test.ts

# Expected: Meet performance targets
# Focus areas:
# - Initial page load < 2s
# - AddOnCard render time < 50ms
# - No layout shifts (CLS < 0.1)
# - Smooth interactions (60fps)
```

### 6.3 Manual Testing Checklist

#### ✅ Standard Add-ons Page (`/checkout/add-ons`)

**Prerequisites:**
1. Start dev server: `npm run dev`
2. Navigate to a tour: http://localhost:3000/tours/kgari-beach-camping-experience
3. Select a date and click "Book Now"
4. You should land on `/checkout/add-ons`

**Test Cases:**

- [ ] **Display & Layout**
  - [ ] All add-ons load and display correctly
  - [ ] Category badges visible
  - [ ] Prices display in correct format
  - [ ] Card layout not broken on desktop
  - [ ] Card layout not broken on mobile
  - [ ] Images/icons load properly

- [ ] **Price Calculations**
  - [ ] Per-day add-on shows: `$X.XX per item (3 days)` format
  - [ ] Per-person add-on shows: `$X.XX per item (2 persons)` format
  - [ ] Per-booking add-on shows: `$X.XX per booking` format
  - [ ] Total price updates when quantity changes
  - [ ] Total price = base price × tourDays/participants × quantity

- [ ] **Selection Functionality**
  - [ ] Checkbox toggles on/off
  - [ ] Selection state persists when scrolling
  - [ ] Multiple add-ons can be selected simultaneously
  - [ ] Unselecting removes from cart
  - [ ] Selected count badge updates

- [ ] **Quantity Controls**
  - [ ] Quantity controls appear when selected
  - [ ] Quantity controls hidden for per_booking items
  - [ ] Increment button increases quantity
  - [ ] Decrement button decreases quantity
  - [ ] Cannot decrease below 1
  - [ ] Cannot increase above 99
  - [ ] Manual input accepts valid numbers (1-99)
  - [ ] Manual input rejects invalid numbers

- [ ] **Learn More Drawer**
  - [ ] "Learn more" button opens drawer
  - [ ] Drawer shows full add-on details
  - [ ] Drawer can be closed
  - [ ] Can add to cart from drawer
  - [ ] Drawer scrollable on mobile

- [ ] **Category Filtering**
  - [ ] Filter buttons work
  - [ ] Filtered results display correctly
  - [ ] "All Add-ons" shows all items
  - [ ] Filter state persists

- [ ] **Sorting**
  - [ ] Sort by Recommended works
  - [ ] Sort by Popular works
  - [ ] Sort by Price (Low to High) works
  - [ ] Sort by Price (High to Low) works

- [ ] **Cart Integration**
  - [ ] Selected add-ons appear in sidebar summary
  - [ ] Sidebar total updates correctly
  - [ ] Sidebar shows correct quantities
  - [ ] "Continue to Checkout" button enabled when items selected

- [ ] **Accessibility**
  - [ ] Can navigate with keyboard (Tab, Enter, Space)
  - [ ] Checkbox has proper ARIA label
  - [ ] Screen reader announces price changes
  - [ ] Focus indicators visible
  - [ ] No color-only information

#### ✅ Multi-Step Add-ons Flow (`/checkout/add-ons-flow`)

**Prerequisites:**
1. From add-ons page, click "Try Multi-Step Flow" (if available)
2. OR navigate directly after booking a tour

**Test Cases:**

- [ ] **Step Navigation**
  - [ ] Progress bar shows correct step (e.g., "Step 1 of 4")
  - [ ] Category introduction displays
  - [ ] "Next Category" button advances step
  - [ ] "Back" button returns to previous step
  - [ ] "Back" disabled on first step
  - [ ] "Review & Continue" shown on last step

- [ ] **Filter Badge**
  - [ ] Badge shows: "Showing X add-ons for [Tour Name]"
  - [ ] Only compatible add-ons shown for current tour
  - [ ] Incompatible add-ons automatically removed if tour changed

- [ ] **AddOnCard Functionality** (same as standard page)
  - [ ] Selection works
  - [ ] Quantity controls work (if applicable)
  - [ ] Price calculations correct
  - [ ] Category badges display
  - [ ] ⚠️ NO "Learn more" button (expected behavior)

- [ ] **Step Completion**
  - [ ] Can select items in current step
  - [ ] Selections persist when moving to next step
  - [ ] Can navigate back to modify previous selections
  - [ ] "Skip Category" button works
  - [ ] "Skip all add-ons" link works

- [ ] **Cart Summary Sidebar**
  - [ ] Shows selected tour
  - [ ] Shows selected add-ons from all steps
  - [ ] Total price updates as items added/removed
  - [ ] Compact mode on mobile

#### ✅ Tour Detail Page (`/tours/[handle]`)

**Prerequisites:**
1. Navigate to: http://localhost:3000/tours/kgari-beach-camping-experience

**Test Cases:**

- [ ] **TourAddOns Component**
  - [ ] "Available Add-ons" section displays
  - [ ] Shows preview of 6 add-ons
  - [ ] Custom card layout (different from AddOnCard)
  - [ ] Simple "Add" button (no quantity selector)
  - [ ] "View All Add-ons" link works
  - [ ] Clicking "Add" adds to cart
  - [ ] Horizontal scroll on mobile

- [ ] **Verification**
  - [ ] ✅ Confirm this does NOT use AddOnCard component
  - [ ] ✅ Confirm custom styling works
  - [ ] ✅ AddOnCard changes should NOT affect this page

#### ✅ Checkout Summary (`/checkout`)

**Prerequisites:**
1. Add a tour and some add-ons to cart
2. Navigate to: http://localhost:3000/checkout

**Test Cases:**

- [ ] **BookingSummary Component**
  - [ ] Shows selected tour details
  - [ ] Lists selected add-ons
  - [ ] Shows add-on quantities
  - [ ] Shows correct pricing per item
  - [ ] Shows correct totals
  - [ ] Edit links work (if enabled)

- [ ] **Verification**
  - [ ] ✅ Confirm this does NOT use AddOnCard
  - [ ] ✅ Read-only display only
  - [ ] ✅ AddOnCard changes should NOT affect this page

#### ✅ Confirmation Page (`/checkout/confirmation`)

**Prerequisites:**
1. Complete a test booking
2. Access confirmation page with order ID

**Test Cases:**

- [ ] **Order Display**
  - [ ] Shows order number
  - [ ] Lists all items (tour + add-ons)
  - [ ] Shows correct quantities
  - [ ] Shows correct prices
  - [ ] Shows order total

- [ ] **Verification**
  - [ ] ✅ Confirm this does NOT use AddOnCard
  - [ ] ✅ Uses Medusa order data
  - [ ] ✅ AddOnCard changes should NOT affect this page

### 6.4 Cross-Browser Testing

**Required Browsers:**
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)
- [ ] Mobile Safari (iOS)
- [ ] Mobile Chrome (Android)

**Focus Areas:**
- Layout consistency
- Checkbox behavior
- Quantity input behavior
- Price calculation accuracy
- Touch interactions on mobile

### 6.5 Performance Testing

**Metrics to Monitor:**
```bash
# Run Lighthouse audit
npm run lighthouse:addons

# Expected scores:
# - Performance: 90+
# - Accessibility: 95+
# - Best Practices: 95+
# - SEO: 90+

# Key Web Vitals:
# - LCP (Largest Contentful Paint): < 2.5s
# - FID (First Input Delay): < 100ms
# - CLS (Cumulative Layout Shift): < 0.1
```

**Manual Performance Checks:**
- [ ] Page loads in < 2 seconds on 3G
- [ ] AddOnCard renders in < 50ms (check React DevTools)
- [ ] No layout shifts when cards load
- [ ] Smooth scrolling (60fps)
- [ ] Quantity changes feel instant (debounced correctly)
- [ ] No memory leaks with many cards

### 6.6 Edge Case Testing

**Scenarios to Test:**

1. **Empty/Loading States**
   - [ ] No add-ons available (should show message)
   - [ ] Loading state shows skeletons
   - [ ] Error state shows graceful message

2. **Boundary Conditions**
   - [ ] Quantity = 1 (decrement button disabled)
   - [ ] Quantity = 99 (increment button disabled)
   - [ ] Very long add-on titles (truncation/wrapping)
   - [ ] Very long descriptions (truncation)
   - [ ] Missing icon/image (fallback icon)

3. **Data Variations**
   - [ ] All pricing types (per_day, per_person, per_booking)
   - [ ] High prices ($10,000+) format correctly
   - [ ] Low prices ($0.01) format correctly
   - [ ] Zero price (free add-ons)
   - [ ] Unavailable add-ons (disabled state)

4. **User Flow Edge Cases**
   - [ ] Select → Deselect → Select again
   - [ ] Rapid quantity changes (debouncing works)
   - [ ] Select many add-ons (performance acceptable)
   - [ ] Navigate away and back (state preserved)
   - [ ] Browser refresh (cart persists via localStorage)

---

## 7. Specific Pages to Manually Test After Fix

### Priority 1: CRITICAL (Must Test)

1. **`/checkout/add-ons`** (Standard Add-ons Page)
   - URL: http://localhost:3000/checkout/add-ons
   - Focus: All AddOnCard functionality
   - Time: 15-20 minutes
   - Test: Selection, quantity, pricing, drawer, filtering, sorting

2. **`/checkout/add-ons-flow`** (Multi-Step Flow)
   - URL: http://localhost:3000/checkout/add-ons-flow
   - Focus: Step navigation + AddOnCard
   - Time: 10-15 minutes
   - Test: Step progression, filtering, selection persistence

### Priority 2: IMPORTANT (Should Test)

3. **`/tours/[handle]`** (Tour Detail)
   - URL: http://localhost:3000/tours/kgari-beach-camping-experience
   - Focus: Verify NO impact on TourAddOns
   - Time: 5 minutes
   - Test: Add-ons preview still works

4. **`/checkout`** (Checkout Summary)
   - URL: http://localhost:3000/checkout
   - Focus: BookingSummary displays add-ons correctly
   - Time: 5 minutes
   - Test: Summary shows selected add-ons with correct prices

### Priority 3: NICE TO HAVE (Optional)

5. **`/checkout/confirmation`** (Order Confirmation)
   - URL: http://localhost:3000/checkout/confirmation?bookingId=XXX
   - Focus: Order display
   - Time: 3 minutes
   - Test: Add-ons listed in order items

---

## 8. Identified Potential Breaking Changes

### From AddOnCard.tsx Analysis

**Current Implementation Details:**

1. **Props Interface (Lines 7-16)**
   ```typescript
   interface AddOnCardProps {
     addon: Addon;
     isSelected: boolean;
     quantity: number;
     onToggle: (addon: Addon) => void;
     onQuantityChange: (addonId: string, quantity: number) => void;
     onLearnMore?: (addon: Addon) => void;  // Optional - not used in flow
     tourDays?: number;
     participants?: number;
   }
   ```
   **Risk:** Changing any required prop names/types breaks both pages

2. **Memoization (Lines 240-252)**
   ```typescript
   React.memo((prevProps, nextProps) => {
     return (
       prevProps.addon.id === nextProps.addon.id &&
       prevProps.isSelected === nextProps.isSelected &&
       prevProps.quantity === nextProps.quantity &&
       prevProps.addon.price_cents === nextProps.addon.price_cents &&
       prevProps.addon.available === nextProps.addon.available &&
       prevProps.tourDays === nextProps.tourDays &&
       prevProps.participants === nextProps.participants
     );
   });
   ```
   **Risk:** Adding new props requires updating comparison function

3. **Debounced Quantity Change (Lines 80, 120)**
   ```typescript
   const debouncedQuantityChange = useDebounce(onQuantityChange, 300);
   ```
   **Risk:** Changing debounce delay affects UX feel

4. **Local Quantity State (Line 67)**
   ```typescript
   const [localQuantity, setLocalQuantity] = useState(quantity);
   ```
   **Risk:** State sync issues if prop quantity updates don't trigger re-render

### Breaking Change Scenarios

| Change Type | Impact | Affected Pages | Migration Required |
|------------|--------|----------------|-------------------|
| Rename `addon` prop | 🔴 BREAKS | Both add-ons pages | Update all import sites |
| Change `Addon` type | 🔴 BREAKS | Both pages + cart | Update type definitions |
| Remove `onLearnMore` | 🟡 PARTIAL | Standard page only | Make always required or add conditional |
| Change price formula | 🔴 BREAKS | Both pages | Update pricing calculations |
| Modify CSS classes | 🟡 VISUAL | Both pages | Update custom CSS overrides if any |
| Add new required prop | 🔴 BREAKS | Both pages | Pass new prop from parents |

---

## 9. Test Plan Summary

### Automated Testing Strategy

```bash
# Step 1: Run unit tests
npm test tests/components/addons/AddOnCard.test.tsx
# Expected: 40+ tests passing

# Step 2: Run integration tests
npm test tests/integration/addons/
# Expected: All integration tests passing

# Step 3: Run E2E tests
npm run test:e2e tests/e2e/addons.spec.ts
npm run test:e2e tests/e2e/addons/addons-flow.spec.ts
# Expected: All user flows working

# Step 4: Run accessibility tests
npm test tests/a11y/addons/
# Expected: No WCAG violations

# Step 5: Run performance tests
npm test tests/performance/addons/
# Expected: Meet performance budgets

# Step 6: Full test suite
npm test
# Expected: All tests passing
```

### Manual Testing Priorities

**Time Budget: 60 minutes total**

1. **Add-ons Page** (20 minutes)
   - Selection flow: 5 min
   - Quantity controls: 5 min
   - Price calculations: 5 min
   - Filtering/sorting: 5 min

2. **Add-ons Flow** (15 minutes)
   - Step navigation: 5 min
   - Multi-step selection: 5 min
   - Filter badge verification: 5 min

3. **Cross-page verification** (10 minutes)
   - Tour detail (no impact): 3 min
   - Checkout summary: 4 min
   - Confirmation page: 3 min

4. **Mobile testing** (10 minutes)
   - Responsive layout: 5 min
   - Touch interactions: 5 min

5. **Edge cases** (5 minutes)
   - Boundary conditions: 3 min
   - Error states: 2 min

---

## 10. Deployment Checklist

### Pre-Deployment

- [ ] All unit tests passing
- [ ] All integration tests passing
- [ ] All E2E tests passing
- [ ] Accessibility audit clean
- [ ] Performance benchmarks met
- [ ] Manual testing complete on dev
- [ ] Cross-browser testing complete
- [ ] Mobile testing complete
- [ ] Edge cases verified

### Staging Verification

- [ ] Deploy to staging environment
- [ ] Smoke test add-ons page
- [ ] Smoke test add-ons flow
- [ ] Verify no tour detail impact
- [ ] Test complete user journey
- [ ] Check analytics tracking works
- [ ] Verify error tracking works

### Production Rollout

- [ ] Deploy during low-traffic window
- [ ] Monitor error logs for 1 hour
- [ ] Check Sentry for new errors
- [ ] Monitor PageSpeed Insights
- [ ] Verify Google Analytics events
- [ ] Test on production URL

### Rollback Plan

If issues detected:
```bash
# Immediate rollback
git revert <commit-hash>
npm run build
npm run deploy

# Or restore previous version
git checkout <previous-commit>
npm run build
npm run deploy
```

**Rollback Criteria:**
- Error rate > 5% on add-ons pages
- Page load time > 3 seconds
- Critical bug preventing checkout
- Accessibility regressions detected

---

## 11. Monitoring & Metrics

### Key Metrics to Track

**Performance:**
- AddOnCard render time (target: < 50ms)
- Page load time (target: < 2s)
- Time to Interactive (target: < 3s)
- CLS (target: < 0.1)

**User Behavior:**
- Add-on selection rate
- Average add-ons per booking
- Quantity changes per session
- "Learn more" click rate
- Flow completion rate (standard vs multi-step)

**Errors:**
- JavaScript errors on add-ons pages
- Failed add-to-cart operations
- Price calculation errors
- State sync issues

### Monitoring Setup

```javascript
// Add to analytics tracking
trackEvent('addon_card_rendered', {
  addon_id: addon.id,
  pricing_type: addon.pricing_type,
  render_time: performance.now() - startTime,
});

trackEvent('addon_selected', {
  addon_id: addon.id,
  quantity: quantity,
  total_price: totalPrice,
});

trackError('addon_card_error', {
  error: error.message,
  addon_id: addon.id,
  stack: error.stack,
});
```

---

## 12. Conclusion & Recommendations

### Summary of Findings

1. **AddOnCard Usage:** Limited to 2 checkout pages only
2. **Product Page Impact:** ZERO (uses separate TourAddOns component)
3. **Test Coverage:** Excellent (8 test suites, 100+ tests)
4. **Risk Level:** MEDIUM-HIGH (critical checkout functionality)

### Recommendations

**Before Making Any Changes:**
1. ✅ Read this entire impact analysis
2. ✅ Review AddOnCard.tsx implementation (240 lines)
3. ✅ Understand pricing calculation logic
4. ✅ Check both usage sites (add-ons page & flow)
5. ✅ Run existing test suites to establish baseline

**During Development:**
1. ✅ Maintain type compatibility with `Addon` interface
2. ✅ Preserve all existing props (especially required ones)
3. ✅ Keep memoization comparison function updated
4. ✅ Test both pages after every significant change
5. ✅ Update tests to match new behavior

**Before Deployment:**
1. ✅ Complete full manual testing checklist (60 min)
2. ✅ Run all automated tests (unit, integration, E2E, a11y)
3. ✅ Verify cross-browser compatibility
4. ✅ Test on mobile devices
5. ✅ Performance audit (Lighthouse score 90+)
6. ✅ Deploy to staging first
7. ✅ Get stakeholder approval

**After Deployment:**
1. ✅ Monitor error logs for 24 hours
2. ✅ Track key metrics (selection rate, render time)
3. ✅ Gather user feedback
4. ✅ Document any issues found
5. ✅ Plan follow-up improvements if needed

### Final Verdict

**SAFE TO MODIFY** if:
- ✅ Type interface remains compatible
- ✅ All required props preserved
- ✅ Price calculation logic intact
- ✅ Tests updated and passing
- ✅ Manual testing completed

**REQUIRES EXTRA CAUTION** for:
- 🟡 Pricing formula changes
- 🟡 Selection state logic changes
- 🟡 Quantity control modifications
- 🟡 New required props

**HIGH RISK / AVOID:**
- 🔴 Breaking type changes to `Addon`
- 🔴 Removing required props
- 🔴 Changing callback signatures
- 🔴 Breaking CartContext integration

---

## Appendix

### A. File Paths Reference

**Components:**
- AddOnCard: `/components/Checkout/AddOnCard.tsx`
- TourAddOns: `/components/Tours/TourAddOns.tsx`
- BookingSummary: `/components/Checkout/BookingSummary.tsx`

**Pages:**
- Tour Detail: `/app/tours/[handle]/page.tsx`
- Add-ons Page: `/app/checkout/add-ons/page.tsx`
- Add-ons Flow: `/app/checkout/add-ons-flow/page.tsx`
- Checkout: `/app/checkout/page.tsx`
- Confirmation: `/app/checkout/confirmation/page.tsx`

**Types:**
- Cart Types: `/lib/types/cart.ts`
- Checkout Types: `/lib/types/checkout.ts`

**Hooks:**
- useAddOns: `/lib/hooks/useAddOns.ts`
- useCart: `/lib/hooks/useCart.ts`

**Tests:**
- Unit: `/tests/components/addons/AddOnCard.test.tsx`
- Integration: `/tests/integration/addons/addons-page.test.tsx`
- E2E: `/tests/e2e/addons.spec.ts`
- E2E Flow: `/tests/e2e/addons/addons-flow.spec.ts`

### B. Related Documentation

- [MULTI_STEP_FLOW_FILE_REFERENCE.md](/docs/MULTI_STEP_FLOW_FILE_REFERENCE.md)
- [Performance Optimization Summary](/docs/performance/PERFORMANCE-OPTIMIZATION-SUMMARY.md)
- [Addon Flow Filtering](/docs/research-findings.md)

### C. Contact & Support

For questions about this impact analysis:
- Review AddOnCard component implementation
- Check existing test files for examples
- Consult cart type definitions for data structures

---

**Document Version:** 1.0
**Last Updated:** 2025-11-09
**Next Review:** After AddOnCard modifications
