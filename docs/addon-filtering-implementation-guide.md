# Addon Filtering - Step-by-Step Implementation Guide

## Overview

This guide provides the exact implementation steps to add tour-specific filtering to the addon flow. Follow these steps in order.

**Estimated time:** 6-7 hours
**Difficulty:** Medium
**Prerequisites:** Understanding of React, TypeScript, and Medusa.js

---

## Implementation Steps

### Step 1: Update Backend Metadata (30 minutes)

**File:** `/Users/Karim/med-usa-4wd/src/modules/seeding/tour-seed.ts`

**Action:** Add `applicable_tours` field to each addon in the `ADDONS` array.

#### Example Updates:

```typescript
// BEFORE
{
  title: "Gourmet Beach BBQ",
  handle: "addon-gourmet-bbq",
  price: 18000,
  metadata: {
    addon: true,
    unit: "per_booking",
    category: "Food & Beverage",
    // ... other fields
  }
}

// AFTER
{
  title: "Gourmet Beach BBQ",
  handle: "addon-gourmet-bbq",
  price: 18000,
  metadata: {
    addon: true,
    unit: "per_booking",
    category: "Food & Beverage",
    applicable_tours: ["*"], // ← ADD THIS: Universal addon
    // ... other fields
  }
}
```

#### Decision Matrix for `applicable_tours`:

| Addon Type | Value | Example |
|------------|-------|---------|
| Universal (all tours) | `["*"]` or `null` | Internet, Insurance |
| Tour-specific | `["tour-handle-1", "tour-handle-2"]` | Fraser Photography |
| Multi-day only | `["2d-fraser-camping", "4d-ultimate-adventure"]` | Camping gear |
| Single tour | `["1d-rainbow-beach"]` | Beach-specific equipment |

#### Suggested Categorization:

```typescript
// Food & Beverage - Mostly universal
{
  title: "Gourmet Beach BBQ",
  metadata: { applicable_tours: ["*"] }
}

{
  title: "Picnic Hamper",
  metadata: { applicable_tours: ["*"] }
}

{
  title: "Seafood Platter",
  metadata: { applicable_tours: ["*"] }
}

// Connectivity - Universal
{
  title: "Always-on High-Speed Internet",
  metadata: { applicable_tours: ["*"] }
}

{
  title: "Starlink Satellite Internet",
  metadata: { applicable_tours: ["2d-fraser-camping", "4d-ultimate-adventure"] } // Multi-day only
}

// Photography - Tour-specific
{
  title: "Fraser Island Photography Package",
  metadata: {
    applicable_tours: ["1d-fraser-island", "2d-fraser-camping"]
  }
}

{
  title: "Rainbow Beach Photography Session",
  metadata: {
    applicable_tours: ["1d-rainbow-beach"]
  }
}

// Equipment - Mixed
{
  title: "Glamping Setup",
  metadata: {
    applicable_tours: ["2d-fraser-camping", "4d-ultimate-adventure"] // Multi-day only
  }
}

{
  title: "Fishing Gear Package",
  metadata: {
    applicable_tours: ["1d-fraser-island", "2d-fraser-camping", "4d-ultimate-adventure"] // Water-based tours
  }
}

// Activities - Tour-specific
{
  title: "Sunset Kayaking",
  metadata: {
    applicable_tours: ["1d-rainbow-beach", "4d-ultimate-adventure"]
  }
}
```

#### After updating:

```bash
cd /Users/Karim/med-usa-4wd
npm run seed  # Re-seed database with updated metadata
```

**Validation:**
- [ ] All addons have `applicable_tours` field
- [ ] Universal addons use `["*"]` or `null`
- [ ] Tour-specific addons use actual tour handles
- [ ] Seed script runs without errors

---

### Step 2: Update TypeScript Types (15 minutes)

**File:** `/Users/Karim/med-usa-4wd/storefront/lib/types/checkout.ts`

**Action:** Add metadata type to `AddOn` interface.

```typescript
export interface AddOn {
  id: string;
  title: string;
  description: string;
  price: number;
  pricing_type: 'per_booking' | 'per_day' | 'per_person';
  icon?: string;
  category?: string;
  available: boolean;

  // ADD THIS:
  metadata?: {
    applicable_tours?: string[] | null;
    [key: string]: any; // Allow other metadata fields
  };
}
```

**Validation:**
- [ ] No TypeScript errors in checkout.ts
- [ ] Other files using AddOn compile successfully

---

### Step 3: Create Filtering Service (1 hour)

**File:** `/Users/Karim/med-usa-4wd/storefront/lib/data/addon-filtering.ts` (NEW FILE)

**Action:** Create complete filtering service.

```typescript
/**
 * Addon Filtering Service
 * Filters addons based on tour applicability
 */

import type { AddOn } from '../types/checkout';

/**
 * Check if an addon is applicable to a specific tour
 *
 * @param addon - The addon to check
 * @param tourHandle - The tour handle (e.g., "1d-rainbow-beach") or null
 * @returns true if addon is applicable to the tour
 */
export function isAddonApplicableToTour(
  addon: AddOn,
  tourHandle: string | null
): boolean {
  // No tour selected - don't show any addons
  if (!tourHandle) {
    return false;
  }

  // Extract applicable_tours from metadata
  const applicableTours = addon.metadata?.applicable_tours;

  // Universal addons: null, undefined, empty array, or ["*"]
  if (
    !applicableTours ||
    applicableTours.length === 0 ||
    applicableTours.includes("*")
  ) {
    return true; // Universal - show for all tours
  }

  // Check if tour handle is in the applicable list
  return applicableTours.includes(tourHandle);
}

/**
 * Filter an array of addons by tour applicability
 *
 * @param allAddons - All available addons
 * @param tourHandle - The tour handle or null
 * @returns Filtered array of applicable addons
 */
export function filterAddonsByTour(
  allAddons: AddOn[],
  tourHandle: string | null
): AddOn[] {
  return allAddons.filter(addon => isAddonApplicableToTour(addon, tourHandle));
}

/**
 * Filter addons grouped by category, removing empty categories
 *
 * @param groupedAddons - Addons grouped by category
 * @param tourHandle - The tour handle or null
 * @returns Filtered categories with only applicable addons
 */
export function filterAddonsByCategoryAndTour(
  groupedAddons: Record<string, AddOn[]>,
  tourHandle: string | null
): Record<string, AddOn[]> {
  const filtered: Record<string, AddOn[]> = {};

  Object.entries(groupedAddons).forEach(([category, addons]) => {
    const applicableAddons = filterAddonsByTour(addons, tourHandle);

    // Only include category if it has applicable addons
    if (applicableAddons.length > 0) {
      filtered[category] = applicableAddons;
    }
  });

  return filtered;
}

/**
 * Get statistics about filtering results
 */
export interface FilterStats {
  total_addons: number;
  applicable_addons: number;
  filtered_count: number;
  categories_before: number;
  categories_after: number;
  tour_handle: string | null;
}

export function getFilteringStats(
  allAddons: AddOn[],
  filteredAddons: AddOn[],
  tourHandle: string | null
): FilterStats {
  const categoriesBefore = new Set(allAddons.map(a => a.category)).size;
  const categoriesAfter = new Set(filteredAddons.map(a => a.category)).size;

  return {
    total_addons: allAddons.length,
    applicable_addons: filteredAddons.length,
    filtered_count: allAddons.length - filteredAddons.length,
    categories_before: categoriesBefore,
    categories_after: categoriesAfter,
    tour_handle: tourHandle,
  };
}
```

**Validation:**
- [ ] File compiles without errors
- [ ] All exports are correct
- [ ] JSDoc comments are complete

---

### Step 4: Update Service Layer (30 minutes)

**File:** `/Users/Karim/med-usa-4wd/storefront/lib/data/addon-flow-service.ts`

**Action:** Modify existing functions to accept and use `tourHandle` parameter.

#### 4.1 Update imports:

```typescript
// ADD THIS IMPORT
import { filterAddonsByCategoryAndTour } from './addon-filtering';
```

#### 4.2 Update `getAddonsByCategory` function:

```typescript
// BEFORE
export async function getAddonsByCategory(): Promise<Record<string, AddOn[]>> {
  const response = await fetchAllAddOns();
  const grouped: Record<string, AddOn[]> = {};

  response.addons.forEach((addon) => {
    const category = addon.category || 'Other';
    if (!grouped[category]) {
      grouped[category] = [];
    }
    grouped[category].push(addon);
  });

  return grouped;
}

// AFTER
export async function getAddonsByCategory(
  tourHandle?: string | null
): Promise<Record<string, AddOn[]>> {
  const response = await fetchAllAddOns();
  const grouped: Record<string, AddOn[]> = {};

  response.addons.forEach((addon) => {
    const category = addon.category || 'Other';
    if (!grouped[category]) {
      grouped[category] = [];
    }
    grouped[category].push(addon);
  });

  // Apply tour filtering if tour handle provided
  if (tourHandle !== undefined) {
    return filterAddonsByCategoryAndTour(grouped, tourHandle);
  }

  return grouped;
}
```

#### 4.3 Update `getCategorySteps` function:

```typescript
// BEFORE
export async function getCategorySteps(): Promise<CategoryStep[]> {
  const groupedAddons = await getAddonsByCategory();
  const steps: CategoryStep[] = [];

  CATEGORY_ORDER.forEach((categoryName, index) => {
    const addons = groupedAddons[categoryName] || [];

    // Only include categories that have addons
    if (addons.length > 0) {
      steps.push({
        categoryName,
        stepNumber: steps.length + 1,
        totalSteps: CATEGORY_ORDER.length,
        intro: CATEGORY_INTROS[categoryName],
        addons
      });
    }
  });

  // Update totalSteps
  const actualTotal = steps.length;
  steps.forEach(step => {
    step.totalSteps = actualTotal;
  });

  return steps;
}

// AFTER
export async function getCategorySteps(
  tourHandle?: string | null
): Promise<CategoryStep[]> {
  // Pass tourHandle to getAddonsByCategory for filtering
  const groupedAddons = await getAddonsByCategory(tourHandle);
  const steps: CategoryStep[] = [];

  CATEGORY_ORDER.forEach((categoryName) => {
    const addons = groupedAddons[categoryName] || [];

    // Only include categories that have addons (after filtering)
    if (addons.length > 0) {
      steps.push({
        categoryName,
        stepNumber: steps.length + 1,
        totalSteps: CATEGORY_ORDER.length,
        intro: CATEGORY_INTROS[categoryName],
        addons
      });
    }
  });

  // Update totalSteps to reflect actual number of steps
  const actualTotal = steps.length;
  steps.forEach(step => {
    step.totalSteps = actualTotal;
  });

  return steps;
}
```

**Validation:**
- [ ] No TypeScript errors
- [ ] Function signatures updated
- [ ] Filtering integration works

---

### Step 5: Update Component (30 minutes)

**File:** `/Users/Karim/med-usa-4wd/storefront/app/checkout/add-ons-flow/page.tsx`

**Action:** Pass tour handle to service and handle tour changes.

#### 5.1 Import filtering function:

```typescript
// ADD THIS IMPORT
import { isAddonApplicableToTour } from '../../../lib/data/addon-filtering';
```

#### 5.2 Update the load steps effect:

```typescript
// BEFORE
useEffect(() => {
  async function loadSteps() {
    try {
      setIsLoading(true);
      const categorySteps = await getCategorySteps();
      setSteps(categorySteps);
    } catch (error) {
      console.error('[Add-ons Flow] Failed to load steps:', error);
      showToast('Failed to load add-ons. Please try again.', 'error');
    } finally {
      setIsLoading(false);
    }
  }

  loadSteps();
}, [showToast]);

// AFTER
useEffect(() => {
  async function loadSteps() {
    try {
      setIsLoading(true);

      // Get tour handle from cart
      const tourHandle = cart.tour?.handle || null;

      // Fetch steps filtered by tour
      const categorySteps = await getCategorySteps(tourHandle);
      setSteps(categorySteps);

      // Log filtering results (development only)
      if (process.env.NODE_ENV === 'development') {
        console.log(
          `[Add-ons Flow] Loaded ${categorySteps.length} categories for tour: ${tourHandle || 'none'}`
        );
      }

    } catch (error) {
      console.error('[Add-ons Flow] Failed to load steps:', error);
      showToast('Failed to load add-ons. Please try again.', 'error');
    } finally {
      setIsLoading(false);
    }
  }

  loadSteps();
}, [showToast, cart.tour?.handle]); // ← ADD cart.tour?.handle dependency
```

#### 5.3 Add incompatible addon removal on tour change:

```typescript
// ADD THIS NEW EFFECT (after the loadSteps effect)
// Remove incompatible addons when tour changes
useEffect(() => {
  const tourHandle = cart.tour?.handle;

  // Check each selected addon for compatibility
  cart.selected_addons.forEach(addon => {
    if (!isAddonApplicableToTour(addon, tourHandle)) {
      // Remove addon
      removeAddOn(addon.id);

      // Show toast notification
      showToast(
        `${addon.title} removed (not available for this tour)`,
        'warning'
      );
    }
  });
}, [cart.tour?.handle]); // Run when tour handle changes
```

**Validation:**
- [ ] Component compiles without errors
- [ ] Dependencies updated correctly
- [ ] Tour handle passed to service

---

### Step 6: Handle Edge Cases (1 hour)

#### 6.1 Enforce tour selection:

Already exists in the code (line 98-103), but ensure it's active:

```typescript
useEffect(() => {
  if (!cart.tour) {
    console.warn('[Add-ons Flow] No tour selected, redirecting to home');
    router.push('/'); // ENSURE THIS IS UNCOMMENTED IN PRODUCTION
  }
}, [cart.tour, router]);
```

#### 6.2 Handle empty state:

Update the conditional rendering (around line 243-251):

```typescript
// BEFORE
if (!currentStep) {
  return (
    <div className={styles.errorContainer}>
      <h2>No add-ons available</h2>
      <button onClick={() => router.push('/checkout/')} className={styles.button}>
        Continue to Checkout
      </button>
    </div>
  );
}

// AFTER (more descriptive)
if (!currentStep || steps.length === 0) {
  return (
    <div className={styles.errorContainer}>
      <h2>No Add-ons Available</h2>
      <p>
        There are no add-ons available for {cart.tour?.title || 'this tour'}.
        You can proceed directly to checkout.
      </p>
      <button onClick={() => router.push('/checkout/')} className={styles.button}>
        Continue to Checkout
      </button>
    </div>
  );
}
```

**Validation:**
- [ ] No tour redirects to home
- [ ] Empty state shows when no addons
- [ ] Tour change removes incompatible addons

---

### Step 7: Add UX Improvements (1 hour)

#### 7.1 Add filter indicator (optional but recommended):

Add after the progress section (around line 272):

```typescript
{/* Filter Indicator */}
{cart.tour && steps.length > 0 && (
  <div className={styles.filterIndicator}>
    <span className={styles.filterText}>
      Showing {steps.reduce((sum, step) => sum + step.addons.length, 0)} add-ons
      available for {cart.tour.title}
    </span>
  </div>
)}
```

Add corresponding styles to `addons-flow.module.css`:

```css
.filterIndicator {
  text-align: center;
  margin: 1rem 0;
  padding: 0.75rem;
  background-color: var(--color-info-light, #e3f2fd);
  border-radius: 8px;
  border-left: 4px solid var(--color-info, #2196f3);
}

.filterText {
  font-size: 0.875rem;
  color: var(--color-text-secondary, #666);
  font-weight: 500;
}
```

#### 7.2 Improve loading state for tour switch:

Update the loading container (around line 234-240) to show tour name:

```typescript
if (isLoading) {
  return (
    <div className={styles.loadingContainer}>
      <div className={styles.spinner}></div>
      <p>Loading add-ons{cart.tour ? ` for ${cart.tour.title}` : ''}...</p>
    </div>
  );
}
```

**Validation:**
- [ ] Filter indicator shows correct count
- [ ] Loading state shows tour name
- [ ] Styles look good

---

### Step 8: Performance Optimization (30 minutes)

#### 8.1 Add memoization for current step:

Already exists (line 105-110), but verify it's optimal:

```typescript
const currentStep = useMemo(() => {
  if (steps.length === 0 || currentStepIndex >= steps.length) {
    return null;
  }
  return steps[currentStepIndex];
}, [steps, currentStepIndex]); // ✓ Correct dependencies
```

#### 8.2 Add performance logging (development only):

Add to the loadSteps function:

```typescript
async function loadSteps() {
  try {
    setIsLoading(true);

    const tourHandle = cart.tour?.handle || null;

    // Performance logging
    const startTime = performance.now();

    const categorySteps = await getCategorySteps(tourHandle);

    const endTime = performance.now();
    const duration = endTime - startTime;

    setSteps(categorySteps);

    if (process.env.NODE_ENV === 'development') {
      console.log(
        `[Add-ons Flow] Loaded ${categorySteps.length} categories for tour: ${tourHandle || 'none'} in ${duration.toFixed(2)}ms`
      );

      if (duration > 500) {
        console.warn(`[Performance] Loading took ${duration.toFixed(2)}ms (budget: 500ms)`);
      }
    }

  } catch (error) {
    // ... error handling
  }
}
```

**Validation:**
- [ ] Filtering completes in < 50ms
- [ ] Total load time < 500ms
- [ ] No unnecessary re-renders

---

### Step 9: Testing (2 hours)

#### 9.1 Create unit tests:

**File:** `/Users/Karim/med-usa-4wd/storefront/lib/data/__tests__/addon-filtering.test.ts` (NEW)

```typescript
import { isAddonApplicableToTour, filterAddonsByTour, filterAddonsByCategoryAndTour } from '../addon-filtering';
import type { AddOn } from '../../types/checkout';

describe('Addon Filtering', () => {
  const mockAddons: AddOn[] = [
    {
      id: '1',
      title: 'Universal Addon',
      description: 'Test',
      price: 1000,
      pricing_type: 'per_booking',
      available: true,
      metadata: { applicable_tours: ['*'] },
    },
    {
      id: '2',
      title: 'Fraser Only',
      description: 'Test',
      price: 1000,
      pricing_type: 'per_booking',
      available: true,
      metadata: { applicable_tours: ['1d-fraser-island'] },
    },
    {
      id: '3',
      title: 'Rainbow Only',
      description: 'Test',
      price: 1000,
      pricing_type: 'per_booking',
      available: true,
      metadata: { applicable_tours: ['1d-rainbow-beach'] },
    },
    {
      id: '4',
      title: 'No Metadata',
      description: 'Test',
      price: 1000,
      pricing_type: 'per_booking',
      available: true,
    },
  ];

  describe('isAddonApplicableToTour', () => {
    test('universal addon shows for all tours', () => {
      expect(isAddonApplicableToTour(mockAddons[0], '1d-rainbow-beach')).toBe(true);
      expect(isAddonApplicableToTour(mockAddons[0], '1d-fraser-island')).toBe(true);
    });

    test('tour-specific addon shows only for that tour', () => {
      expect(isAddonApplicableToTour(mockAddons[1], '1d-fraser-island')).toBe(true);
      expect(isAddonApplicableToTour(mockAddons[1], '1d-rainbow-beach')).toBe(false);
    });

    test('addon without metadata is universal', () => {
      expect(isAddonApplicableToTour(mockAddons[3], '1d-rainbow-beach')).toBe(true);
    });

    test('no tour selected returns false', () => {
      expect(isAddonApplicableToTour(mockAddons[0], null)).toBe(false);
    });
  });

  describe('filterAddonsByTour', () => {
    test('filters correctly for specific tour', () => {
      const filtered = filterAddonsByTour(mockAddons, '1d-fraser-island');
      expect(filtered).toHaveLength(2); // Universal + Fraser Only
      expect(filtered.map(a => a.id)).toContain('1');
      expect(filtered.map(a => a.id)).toContain('2');
    });

    test('no tour returns empty array', () => {
      const filtered = filterAddonsByTour(mockAddons, null);
      expect(filtered).toEqual([]);
    });
  });

  describe('filterAddonsByCategoryAndTour', () => {
    test('removes empty categories', () => {
      const grouped = {
        'Food & Beverage': [mockAddons[1]], // Fraser only
        'Equipment': [mockAddons[2]], // Rainbow only
      };

      const filtered = filterAddonsByCategoryAndTour(grouped, '1d-fraser-island');

      expect(filtered['Food & Beverage']).toBeDefined();
      expect(filtered['Equipment']).toBeUndefined(); // Removed (no applicable addons)
    });
  });
});
```

Run tests:
```bash
npm test addon-filtering
```

#### 9.2 Manual testing checklist:

- [ ] **Test 1: Select Rainbow Beach tour**
  - Navigate to `/checkout/add-ons-flow`
  - Verify only applicable addons show
  - Verify filter indicator shows correct tour

- [ ] **Test 2: Switch tours**
  - Select Rainbow Beach tour
  - Add Rainbow-specific addon
  - Switch to Fraser Island tour
  - Verify Rainbow addon removed
  - Verify toast notification shown

- [ ] **Test 3: Universal addons**
  - Select any tour
  - Verify universal addons (Internet, BBQ) show

- [ ] **Test 4: Empty state**
  - If a tour has no addons:
  - Verify empty state shows
  - Verify "Continue to Checkout" button works

- [ ] **Test 5: No tour selected**
  - Clear cart or navigate without tour
  - Verify redirect to home page

- [ ] **Test 6: Performance**
  - Check browser console for load times
  - Verify filtering < 50ms
  - Verify no lag when switching tours

**Validation:**
- [ ] All unit tests pass
- [ ] All manual tests pass
- [ ] No console errors

---

### Step 10: Documentation & Cleanup (30 minutes)

#### 10.1 Add inline documentation:

Ensure all new functions have JSDoc comments (already done in examples above).

#### 10.2 Update README (if needed):

Add note about addon filtering to project README.

#### 10.3 Remove console.logs in production:

Ensure all `console.log` statements use `process.env.NODE_ENV === 'development'` guard.

#### 10.4 Code review:

- [ ] No hardcoded values
- [ ] All edge cases handled
- [ ] TypeScript strict mode passes
- [ ] No unused imports
- [ ] Consistent code style

**Validation:**
- [ ] Documentation complete
- [ ] No dev-only code in production
- [ ] Code review passed

---

## Final Checklist

### Backend
- [ ] `applicable_tours` added to all addons
- [ ] Seed script updated and tested
- [ ] Database re-seeded successfully

### Frontend
- [ ] TypeScript types updated
- [ ] Filtering service created
- [ ] Service layer updated
- [ ] Component updated
- [ ] Edge cases handled
- [ ] UX improvements added
- [ ] Performance optimized

### Testing
- [ ] Unit tests written and passing
- [ ] Manual tests completed
- [ ] Performance targets met (<50ms filtering)
- [ ] No console errors

### Documentation
- [ ] Inline comments added
- [ ] README updated
- [ ] Implementation guide reviewed

---

## Deployment

1. **Commit changes:**
```bash
git add .
git commit -m "Add tour-specific addon filtering

- Add applicable_tours metadata to addons
- Create filtering service
- Update addon-flow-service to filter by tour
- Update add-ons-flow component
- Handle edge cases (no tour, tour change)
- Add UX improvements (filter indicator, empty state)
- Add unit tests
"
```

2. **Create PR and request review**

3. **Deploy to staging:**
```bash
npm run build
npm run deploy:staging
```

4. **Test on staging:**
- [ ] Test all tours
- [ ] Test addon selection
- [ ] Test tour switching

5. **Deploy to production:**
```bash
npm run deploy:production
```

---

## Troubleshooting

### Issue: Addons not filtering

**Check:**
1. `tourHandle` is being passed to `getCategorySteps()`
2. `applicable_tours` exists in addon metadata
3. Tour handle matches exactly (e.g., "1d-rainbow-beach")

**Debug:**
```typescript
console.log('Tour handle:', cart.tour?.handle);
console.log('Addon metadata:', addon.metadata?.applicable_tours);
console.log('Is applicable:', isAddonApplicableToTour(addon, cart.tour?.handle));
```

### Issue: All addons disappearing

**Check:**
1. Universal addons have `["*"]` or `null`, not `[]`
2. `applicable_tours` field is spelled correctly
3. Tour handle is valid

### Issue: Performance issues

**Check:**
1. Memoization is working (use React DevTools)
2. useEffect dependencies are correct
3. Not fetching on every render

**Debug:**
```typescript
const startTime = performance.now();
// ... filtering code
console.log(`Filtering took ${performance.now() - startTime}ms`);
```

---

## Post-Deployment Monitoring

### Metrics to track:

1. **Addon conversion rate** by tour
2. **Average addons per booking** (should increase)
3. **Page load time** (should stay < 500ms)
4. **Filtering errors** (should be 0)

### Analytics to add:

```typescript
trackEvent('addon_filtering_applied', {
  tour_handle: tourHandle,
  addons_shown: filteredAddons.length,
  addons_total: allAddons.length,
});
```

---

## Success Criteria

✅ **Functional:**
- Only applicable addons show for each tour
- Tour switching works smoothly
- Edge cases handled gracefully

✅ **Performance:**
- Filtering < 50ms
- Total load time < 500ms
- No visible lag

✅ **UX:**
- Clear feedback to users
- Empty states handled
- Loading states smooth

✅ **Quality:**
- Unit tests passing
- No TypeScript errors
- Code reviewed

---

*Implementation guide version: 1.0*
*See `addon-filtering-design.md` for complete architecture*
