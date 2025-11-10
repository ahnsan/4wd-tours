# Add-on Filtering Design - Tour-Specific Addons

## Executive Summary

This document outlines the complete design for filtering and displaying tour-specific addons in the 4WD Medusa storefront. The filtering system will ensure customers only see relevant addons based on their cart tour selection, improving UX and conversion rates.

---

## 1. Current State Analysis

### 1.1 Current Addon Display Flow

**File: `/Users/Karim/med-usa-4wd/storefront/app/checkout/add-ons-flow/page.tsx`**

```typescript
// Current flow (lines 54-68):
useEffect(() => {
  async function loadSteps() {
    setIsLoading(true);
    const categorySteps = await getCategorySteps(); // Fetches ALL addons
    setSteps(categorySteps);
    setIsLoading(false);
  }
  loadSteps();
}, [showToast]);
```

**Current behavior:**
- Fetches ALL addons without filtering
- No tour-specific logic
- All 18+ addons shown regardless of tour selection

### 1.2 Data Fetching Service

**File: `/Users/Karim/med-usa-4wd/storefront/lib/data/addon-flow-service.ts`**

```typescript
// Current implementation (lines 131-144):
export async function getAddonsByCategory(): Promise<Record<string, AddOn[]>> {
  const response = await fetchAllAddOns(); // No tour filtering
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
```

**Current behavior:**
- `fetchAllAddOns()` fetches all products with handle starting with "addon-"
- No filtering by tour applicability
- Grouping only by category

### 1.3 Backend Addon Structure

**File: `/Users/Karim/med-usa-4wd/src/modules/seeding/tour-seed.ts`**

**Example addon metadata:**
```typescript
{
  title: "Gourmet Beach BBQ",
  handle: "addon-gourmet-bbq",
  price: 18000,
  metadata: {
    addon: true,
    unit: "per_booking",
    category: "Food & Beverage",
    description: "BBQ setup with premium meats...",
    persuasive_title: "...",
    features: [...],
    // NOTE: No 'applicable_tours' field exists yet
  }
}
```

**Current metadata fields:**
- `addon`: boolean
- `unit`: "per_booking" | "per_day" | "per_person"
- `category`: string
- `description`, `persuasive_title`, `features`, etc.

**Missing field:**
- ❌ `applicable_tours`: No tour-specific filtering metadata

### 1.4 Cart State

**Cart structure (from code analysis):**
```typescript
interface CartState {
  tour: Tour | null;
  participants: number;
  tour_start_date: string | null;
  selected_addons: SelectedAddOn[];
  // ...
}

interface Tour {
  id: string;
  handle: string; // e.g., "1d-rainbow-beach"
  title: string;
  duration_days: number;
  // ...
}
```

**Available tour data in cart:**
- ✅ `cart.tour.id` (Medusa product ID)
- ✅ `cart.tour.handle` (e.g., "1d-rainbow-beach")
- ✅ `cart.tour.duration_days` (1-4 days)

---

## 2. Filtering Strategy Design

### 2.1 Recommended Approach: **Hybrid Filtering (Backend + Frontend)**

**Why hybrid?**
1. **Backend API filtering** - Most efficient for initial data fetch
2. **Frontend validation** - Ensures correct display if cart changes
3. **Performance** - Reduced payload size
4. **Flexibility** - Easy to add client-side overrides

### 2.2 Metadata Schema Extension

**Add `applicable_tours` field to addon metadata:**

```typescript
// Backend: src/modules/seeding/tour-seed.ts
export const ADDONS = [
  {
    title: "Gourmet Beach BBQ",
    handle: "addon-gourmet-bbq",
    price: 18000,
    metadata: {
      addon: true,
      unit: "per_booking",
      category: "Food & Beverage",

      // NEW FIELD: Tour applicability
      applicable_tours: ["1d-rainbow-beach", "1d-fraser-island", "2d-fraser-camping", "4d-ultimate-adventure"],
      // Special value: ["*"] or null = Universal addon (applies to all tours)

      // Existing fields...
      description: "...",
      persuasive_title: "...",
      features: [...],
    }
  },

  // Example: Universal addon (applies to all tours)
  {
    title: "Always-on High-Speed Internet",
    handle: "addon-internet",
    price: 3000,
    metadata: {
      addon: true,
      unit: "per_day",
      category: "Connectivity",
      applicable_tours: ["*"], // Universal - shown for ALL tours
      // OR: applicable_tours: null (same behavior)
    }
  },

  // Example: Tour-specific addon
  {
    title: "Fraser Island Photography Package",
    handle: "addon-fraser-photography",
    price: 25000,
    metadata: {
      addon: true,
      unit: "per_booking",
      category: "Photography",
      applicable_tours: ["1d-fraser-island", "2d-fraser-camping"], // Only Fraser tours
    }
  }
];
```

**Schema rules:**
- `applicable_tours: ["*"]` → Universal (all tours)
- `applicable_tours: null` → Universal (all tours)
- `applicable_tours: []` → Not applicable to any tour (hidden)
- `applicable_tours: ["tour-handle-1", "tour-handle-2"]` → Specific tours only

### 2.3 TypeScript Type Updates

**File: `/Users/Karim/med-usa-4wd/storefront/lib/types/checkout.ts`**

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

  // NEW: Tour applicability metadata
  metadata?: {
    applicable_tours?: string[] | null; // Tour handles or ["*"] for universal
    [key: string]: any; // Other metadata fields
  };
}
```

---

## 3. Filtering Algorithm Design

### 3.1 Core Filtering Function

**File: `/Users/Karim/med-usa-4wd/storefront/lib/data/addon-filtering.ts` (NEW FILE)**

```typescript
/**
 * Addon Filtering Service
 * Filters addons based on tour applicability
 */

import type { AddOn } from '../types/checkout';

/**
 * Check if an addon is applicable to a specific tour
 */
export function isAddonApplicableToTour(
  addon: AddOn,
  tourHandle: string | null
): boolean {
  // No tour selected -> show all addons (or none, based on requirements)
  if (!tourHandle) {
    return true; // Or false - to be decided
  }

  // Extract applicable_tours from metadata
  const applicableTours = addon.metadata?.applicable_tours;

  // Universal addons (null, undefined, or ["*"])
  if (!applicableTours || applicableTours.length === 0) {
    return true; // Universal addon
  }

  if (applicableTours.includes("*")) {
    return true; // Universal addon
  }

  // Check if tour handle is in the applicable list
  return applicableTours.includes(tourHandle);
}

/**
 * Filter addons array by tour applicability
 */
export function filterAddonsByTour(
  allAddons: AddOn[],
  tourHandle: string | null
): AddOn[] {
  if (!tourHandle) {
    // Edge case: No tour in cart
    // Options:
    // A) Return all addons
    // B) Return empty array
    // C) Return only universal addons
    // Recommended: Return empty array (force tour selection first)
    return [];
  }

  return allAddons.filter(addon => isAddonApplicableToTour(addon, tourHandle));
}

/**
 * Filter addons grouped by category
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
}

export function getFilteringStats(
  allAddons: AddOn[],
  filteredAddons: AddOn[]
): FilterStats {
  const categoriesBefore = new Set(allAddons.map(a => a.category)).size;
  const categoriesAfter = new Set(filteredAddons.map(a => a.category)).size;

  return {
    total_addons: allAddons.length,
    applicable_addons: filteredAddons.length,
    filtered_count: allAddons.length - filteredAddons.length,
    categories_before: categoriesBefore,
    categories_after: categoriesAfter,
  };
}
```

### 3.2 Service Layer Integration

**File: `/Users/Karim/med-usa-4wd/storefront/lib/data/addon-flow-service.ts`**

**Modified implementation:**

```typescript
import type { AddOn } from '../types/checkout';
import { fetchAllAddOns, type AddOnsResponse } from './addons-service';
import { filterAddonsByTour, filterAddonsByCategoryAndTour } from './addon-filtering';

// ... existing code ...

/**
 * Get addons grouped by category (WITH TOUR FILTERING)
 */
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

/**
 * Get category steps in order for multi-step flow (WITH TOUR FILTERING)
 */
export async function getCategorySteps(
  tourHandle?: string | null
): Promise<CategoryStep[]> {
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

### 3.3 Component Integration

**File: `/Users/Karim/med-usa-4wd/storefront/app/checkout/add-ons-flow/page.tsx`**

**Modified implementation:**

```typescript
// Inside AddOnsFlowContent component

// Load category steps WITH TOUR FILTERING
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
      console.log(`[Add-ons Flow] Loaded ${categorySteps.length} categories for tour: ${tourHandle || 'none'}`);

    } catch (error) {
      console.error('[Add-ons Flow] Failed to load steps:', error);
      showToast('Failed to load add-ons. Please try again.', 'error');
    } finally {
      setIsLoading(false);
    }
  }

  loadSteps();
}, [showToast, cart.tour?.handle]); // Re-run when tour changes

// Check if tour is selected
useEffect(() => {
  if (!cart.tour) {
    console.warn('[Add-ons Flow] No tour selected, redirecting to home');
    router.push('/'); // Enforce tour selection
  }
}, [cart.tour, router]);
```

---

## 4. Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         USER JOURNEY                             │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  1. User selects tour (e.g., "1D Rainbow Beach")                │
│     → cart.tour = { handle: "1d-rainbow-beach", ... }           │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  2. User navigates to Add-ons Flow page                         │
│     → /checkout/add-ons-flow                                     │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  3. Component loads and triggers data fetch                     │
│     → getCategorySteps(cart.tour.handle)                        │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  4. Service fetches ALL addons from API                         │
│     → fetchAllAddOns() → Medusa API                             │
│     → Returns ~18 addons                                        │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  5. Service groups addons by category                           │
│     → getAddonsByCategory("1d-rainbow-beach")                   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  6. FILTERING OCCURS (CLIENT-SIDE)                              │
│     → filterAddonsByCategoryAndTour(grouped, "1d-rainbow-beach")│
│                                                                  │
│     For each addon:                                             │
│       • Check metadata.applicable_tours                         │
│       • If null/["*"] → Include (universal)                     │
│       • If includes "1d-rainbow-beach" → Include                │
│       • Otherwise → Exclude                                     │
│                                                                  │
│     Result: ~8-12 applicable addons (down from 18)              │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  7. Service creates category steps                              │
│     → Only categories with applicable addons                    │
│     → e.g., 4 categories instead of 5                           │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  8. Component renders filtered addons                           │
│     → Multi-step flow with only relevant addons                 │
└─────────────────────────────────────────────────────────────────┘
```

### Backend API Filtering (Future Enhancement)

**Option: Add API endpoint with tour filtering**

```typescript
// Future: API route for filtered addons
// GET /store/addons?tour_handle=1d-rainbow-beach

export async function GET(request: Request) {
  const url = new URL(request.url);
  const tourHandle = url.searchParams.get('tour_handle');

  // Fetch from Medusa with metadata filtering
  const allAddons = await fetchAllAddOns();
  const filtered = filterAddonsByTour(allAddons.addons, tourHandle);

  return Response.json({ addons: filtered });
}
```

---

## 5. Edge Cases & Handling

### 5.1 No Tour in Cart

**Scenario:** User navigates directly to `/checkout/add-ons-flow` without selecting a tour

**Solution:**
```typescript
// In page.tsx
useEffect(() => {
  if (!cart.tour) {
    console.warn('[Add-ons Flow] No tour selected, redirecting to home');
    router.push('/'); // Force tour selection
  }
}, [cart.tour, router]);
```

**Empty state UI:**
```tsx
if (!cart.tour) {
  return (
    <div className={styles.errorContainer}>
      <h2>Please Select a Tour First</h2>
      <p>You need to select a tour before choosing add-ons.</p>
      <button onClick={() => router.push('/')}>Browse Tours</button>
    </div>
  );
}
```

### 5.2 Tour Changes Mid-Flow

**Scenario:** User changes tour selection while on add-ons page

**Solution:**
```typescript
useEffect(() => {
  async function loadSteps() {
    // ... load steps
  }
  loadSteps();
}, [cart.tour?.handle]); // Re-run when tour handle changes

// Clear incompatible addons when tour changes
useEffect(() => {
  const tourHandle = cart.tour?.handle;

  cart.selected_addons.forEach(addon => {
    if (!isAddonApplicableToTour(addon, tourHandle)) {
      removeAddOn(addon.id);
      showToast(`${addon.title} removed (not applicable to new tour)`, 'info');
    }
  });
}, [cart.tour?.handle]);
```

**User feedback:**
- Toast notification: "Tour changed - some add-ons have been removed"
- Visual indicator showing new addon count

### 5.3 Universal Addons (Applicable to All Tours)

**Scenario:** Connectivity addons work with all tours

**Solution:**
```typescript
{
  title: "Always-on High-Speed Internet",
  metadata: {
    applicable_tours: ["*"], // Universal
  }
}

// Filter logic handles this:
if (applicableTours.includes("*")) {
  return true; // Always show
}
```

### 5.4 Previously Selected Addon No Longer Applicable

**Scenario:** User selected addon for Tour A, then switches to Tour B where addon isn't applicable

**Solution Options:**

**Option A: Auto-remove (Recommended)**
```typescript
useEffect(() => {
  const tourHandle = cart.tour?.handle;

  cart.selected_addons.forEach(addon => {
    if (!isAddonApplicableToTour(addon, tourHandle)) {
      removeAddOn(addon.id);
      showToast(`${addon.title} removed (not available for this tour)`, 'warning');
    }
  });
}, [cart.tour?.handle]);
```

**Option B: Warn user before removing**
```typescript
const incompatibleAddons = cart.selected_addons.filter(
  addon => !isAddonApplicableToTour(addon, cart.tour?.handle)
);

if (incompatibleAddons.length > 0) {
  showConfirmModal({
    title: "Some add-ons are not compatible",
    message: `The following add-ons are not available for ${cart.tour.title}: ${incompatibleAddons.map(a => a.title).join(', ')}`,
    confirmText: "Remove incompatible add-ons",
    onConfirm: () => {
      incompatibleAddons.forEach(addon => removeAddOn(addon.id));
    }
  });
}
```

**Recommended: Option A (Auto-remove with toast notification)**

### 5.5 Multiple Tours in Cart (Future)

**Scenario:** Future feature allowing multiple tours

**Solution:**
```typescript
export function filterAddonsByMultipleTours(
  allAddons: AddOn[],
  tourHandles: string[]
): AddOn[] {
  if (tourHandles.length === 0) return [];

  return allAddons.filter(addon => {
    const applicableTours = addon.metadata?.applicable_tours;

    if (!applicableTours || applicableTours.includes("*")) {
      return true; // Universal
    }

    // Show addon if applicable to ANY tour in cart (union)
    return tourHandles.some(handle => applicableTours.includes(handle));

    // Alternative: Show only if applicable to ALL tours (intersection)
    // return tourHandles.every(handle => applicableTours.includes(handle));
  });
}
```

**Recommended: Union approach (show if applicable to any tour)**

### 5.6 All Addons Filtered Out for a Category

**Scenario:** A category has no applicable addons for selected tour

**Solution:**
```typescript
// In getCategorySteps():
CATEGORY_ORDER.forEach((categoryName) => {
  const addons = groupedAddons[categoryName] || [];

  // Only include categories that have addons (after filtering)
  if (addons.length > 0) {
    steps.push({...}); // Include category
  }
  // Otherwise, skip category entirely
});
```

**Result:** Category step is completely hidden (not shown in progress)

### 5.7 Empty State After Filtering

**Scenario:** No addons are applicable to selected tour

**Solution:**
```tsx
if (steps.length === 0) {
  return (
    <div className={styles.emptyContainer}>
      <h2>No Add-ons Available</h2>
      <p>There are no add-ons available for {cart.tour?.title}.</p>
      <p>You can proceed directly to checkout.</p>
      <button onClick={() => router.push('/checkout/')}>
        Continue to Checkout
      </button>
    </div>
  );
}
```

---

## 6. Performance Optimization

### 6.1 Caching Strategy

**Use SWR for client-side caching:**

```typescript
import useSWR from 'swr';

function useFilteredAddons(tourHandle: string | null) {
  const { data, error, isLoading } = useSWR(
    tourHandle ? ['category-steps', tourHandle] : null,
    () => getCategorySteps(tourHandle),
    {
      revalidateOnFocus: false, // Don't refetch on window focus
      dedupingInterval: 60000, // Dedupe requests within 1 minute
      keepPreviousData: true, // Keep old data while fetching new
    }
  );

  return { steps: data || [], error, isLoading };
}

// Usage in component:
const { steps, isLoading } = useFilteredAddons(cart.tour?.handle || null);
```

**Benefits:**
- Automatic caching
- Deduplication of requests
- Background revalidation
- No refetch on tour switch if already cached

### 6.2 Memoization

**Memoize filtering results:**

```typescript
import { useMemo } from 'react';

const filteredSteps = useMemo(() => {
  return getCategorySteps(cart.tour?.handle);
}, [cart.tour?.handle]); // Only recompute when tour changes
```

**Memoize filter indicator:**

```typescript
const filterStats = useMemo(() => {
  if (!steps.length) return null;

  const totalAddons = steps.reduce((sum, step) => sum + step.addons.length, 0);
  return {
    count: totalAddons,
    categories: steps.length,
    tourTitle: cart.tour?.title,
  };
}, [steps, cart.tour?.title]);
```

### 6.3 Avoid Re-filtering on Every Render

**❌ Bad (filters on every render):**
```typescript
function MyComponent() {
  const filteredAddons = filterAddonsByTour(allAddons, cart.tour?.handle);
  // Re-runs on every render!
}
```

**✅ Good (filters only when dependencies change):**
```typescript
function MyComponent() {
  const filteredAddons = useMemo(
    () => filterAddonsByTour(allAddons, cart.tour?.handle),
    [allAddons, cart.tour?.handle]
  );
}
```

### 6.4 Lazy Loading

**Load addons data only when needed:**

```typescript
// Don't fetch addons until user reaches the page
useEffect(() => {
  if (!cart.tour) return; // Early exit

  loadSteps(); // Only fetch when tour exists
}, [cart.tour]);
```

### 6.5 API Endpoint Optimization (Future)

**Create dedicated API route:**

```typescript
// app/api/addons/route.ts
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const tourHandle = searchParams.get('tour_handle');

  // Server-side filtering (more efficient)
  const filtered = await getFilteredAddonsFromDB(tourHandle);

  return Response.json({ addons: filtered });
}
```

**Benefits:**
- Reduced payload size (only send applicable addons)
- Server-side caching possible
- Faster client-side rendering

### 6.6 Performance Budgets

**Target metrics:**
- Initial load: < 500ms
- Filtering operation: < 50ms
- Tour switch: < 200ms
- No visible lag when switching tours

**Monitoring:**
```typescript
const startTime = performance.now();
const filtered = filterAddonsByTour(addons, tourHandle);
const endTime = performance.now();

if (endTime - startTime > 50) {
  console.warn(`[Performance] Filtering took ${endTime - startTime}ms (budget: 50ms)`);
}
```

---

## 7. User Experience Design

### 7.1 Loading States

**Initial load:**
```tsx
{isLoading && (
  <div className={styles.loadingContainer}>
    <div className={styles.spinner}></div>
    <p>Loading add-ons for {cart.tour?.title}...</p>
  </div>
)}
```

**Tour switch (keep old data visible):**
```tsx
{isLoading && (
  <div className={styles.loadingOverlay}>
    <p>Updating add-ons...</p>
  </div>
)}
```

### 7.2 Filter Indicator

**Show what's being filtered:**
```tsx
<div className={styles.filterIndicator}>
  <InfoIcon />
  <span>
    Showing {stats.count} add-ons available for {cart.tour.title}
  </span>
  <button onClick={handleShowAll} className={styles.linkButton}>
    Show all add-ons
  </button>
</div>
```

### 7.3 Empty States

**No addons after filtering:**
```tsx
<div className={styles.emptyState}>
  <EmptyIcon />
  <h3>No add-ons available for this tour</h3>
  <p>
    {cart.tour.title} doesn't have any additional add-ons at the moment.
    You can proceed directly to checkout.
  </p>
  <button onClick={() => router.push('/checkout/')}>
    Continue to Checkout
  </button>
</div>
```

**Category with no addons:**
```tsx
// Don't show category at all (handled in getCategorySteps)
// Progress bar automatically adjusts to show only populated categories
```

### 7.4 Tour Change Warning

**When tour changes with selected addons:**
```tsx
{incompatibleAddons.length > 0 && (
  <div className={styles.warningBanner}>
    <WarningIcon />
    <p>
      <strong>Tour changed:</strong> {incompatibleAddons.length} add-on(s)
      removed because they're not available for {cart.tour.title}.
    </p>
    <button onClick={handleDismiss}>Dismiss</button>
  </div>
)}
```

### 7.5 "Show All" Override

**Allow users to see all addons (optional):**
```tsx
const [showAllAddons, setShowAllAddons] = useState(false);

const displayedSteps = useMemo(() => {
  if (showAllAddons) {
    return getCategorySteps(null); // No filtering
  }
  return getCategorySteps(cart.tour?.handle);
}, [showAllAddons, cart.tour?.handle]);

// UI toggle:
<div className={styles.filterControls}>
  <label>
    <input
      type="checkbox"
      checked={showAllAddons}
      onChange={(e) => setShowAllAddons(e.target.checked)}
    />
    Show all add-ons (including unavailable)
  </label>
</div>
```

**With visual indication on unavailable addons:**
```tsx
<AddOnCard
  addon={addon}
  isSelected={selectedAddOns.has(addon.id)}
  disabled={!isAddonApplicableToTour(addon, cart.tour?.handle)}
  badge={!isAddonApplicableToTour(addon, cart.tour?.handle) && (
    <Badge variant="warning">Not available for this tour</Badge>
  )}
/>
```

### 7.6 Filter Summary in Progress Bar

```tsx
<div className={styles.progressSection}>
  <div className={styles.progressBar}>
    <div className={styles.progressFill} style={{ width: `${progress}%` }} />
  </div>
  <p className={styles.progressText}>
    Step {currentStep.stepNumber} of {currentStep.totalSteps}
    <span className={styles.filterHint}>
      ({totalApplicableAddons} add-ons for {cart.tour.title})
    </span>
  </p>
</div>
```

---

## 8. Implementation Checklist

### Phase 1: Backend Metadata (Required First)

- [ ] **Update addon seed data** (`src/modules/seeding/tour-seed.ts`)
  - [ ] Add `applicable_tours` field to all 18 addons
  - [ ] Define universal addons (e.g., connectivity, insurance)
  - [ ] Define tour-specific addons (e.g., Fraser photography)
  - [ ] Run seed script: `npm run seed`

### Phase 2: Type Definitions

- [ ] **Update AddOn interface** (`lib/types/checkout.ts`)
  - [ ] Add `metadata?: { applicable_tours?: string[] | null }`

### Phase 3: Filtering Logic

- [ ] **Create filtering service** (`lib/data/addon-filtering.ts`)
  - [ ] `isAddonApplicableToTour()` function
  - [ ] `filterAddonsByTour()` function
  - [ ] `filterAddonsByCategoryAndTour()` function
  - [ ] `getFilteringStats()` function

### Phase 4: Service Layer Integration

- [ ] **Update addon-flow-service** (`lib/data/addon-flow-service.ts`)
  - [ ] Modify `getAddonsByCategory()` to accept `tourHandle` param
  - [ ] Modify `getCategorySteps()` to accept `tourHandle` param
  - [ ] Add filtering calls

### Phase 5: Component Integration

- [ ] **Update add-ons-flow page** (`app/checkout/add-ons-flow/page.tsx`)
  - [ ] Pass `cart.tour?.handle` to `getCategorySteps()`
  - [ ] Add dependency on `cart.tour?.handle` to useEffect
  - [ ] Handle incompatible addons on tour change

### Phase 6: Edge Cases

- [ ] Handle no tour in cart (redirect to home)
- [ ] Handle tour change mid-flow (remove incompatible addons)
- [ ] Handle empty state (no applicable addons)
- [ ] Handle empty categories (skip in progress)

### Phase 7: User Experience

- [ ] Add loading state for initial load
- [ ] Add loading state for tour switch
- [ ] Add filter indicator ("Showing X add-ons for Tour Y")
- [ ] Add empty state UI
- [ ] Add tour change warning toast
- [ ] (Optional) Add "Show all add-ons" toggle

### Phase 8: Performance

- [ ] Add useMemo for filtering results
- [ ] Add useMemo for filter stats
- [ ] Consider SWR/React Query caching
- [ ] Measure and log filtering performance

### Phase 9: Testing

- [ ] Unit tests for filtering functions
- [ ] Integration tests for service layer
- [ ] E2E tests for user flows:
  - [ ] Select tour → see filtered addons
  - [ ] Switch tour → see different addons
  - [ ] Switch tour with selected addons → incompatible removed
  - [ ] Universal addons show for all tours
- [ ] Performance tests (filtering < 50ms)

### Phase 10: Documentation

- [ ] Update API documentation
- [ ] Add inline code comments
- [ ] Update user-facing help text
- [ ] Create admin guide for managing `applicable_tours`

---

## 9. Code Examples

### 9.1 Complete Filtering Function

```typescript
/**
 * /Users/Karim/med-usa-4wd/storefront/lib/data/addon-filtering.ts
 */

import type { AddOn } from '../types/checkout';

/**
 * Check if an addon is applicable to a specific tour
 */
export function isAddonApplicableToTour(
  addon: AddOn,
  tourHandle: string | null
): boolean {
  // No tour selected - decision: show nothing (force tour selection)
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
    return true;
  }

  // Check if tour handle is in the applicable list
  return applicableTours.includes(tourHandle);
}

/**
 * Filter addons array by tour applicability
 */
export function filterAddonsByTour(
  allAddons: AddOn[],
  tourHandle: string | null
): AddOn[] {
  return allAddons.filter(addon => isAddonApplicableToTour(addon, tourHandle));
}

/**
 * Filter addons grouped by category
 * Only returns categories that have applicable addons
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
}

export function getFilteringStats(
  allAddons: AddOn[],
  filteredAddons: AddOn[]
): FilterStats {
  const categoriesBefore = new Set(allAddons.map(a => a.category)).size;
  const categoriesAfter = new Set(filteredAddons.map(a => a.category)).size;

  return {
    total_addons: allAddons.length,
    applicable_addons: filteredAddons.length,
    filtered_count: allAddons.length - filteredAddons.length,
    categories_before: categoriesBefore,
    categories_after: categoriesAfter,
  };
}
```

### 9.2 Service Layer Integration

```typescript
/**
 * /Users/Karim/med-usa-4wd/storefront/lib/data/addon-flow-service.ts
 * (MODIFIED)
 */

import type { AddOn } from '../types/checkout';
import { fetchAllAddOns } from './addons-service';
import { filterAddonsByCategoryAndTour } from './addon-filtering';

// ... existing code ...

/**
 * Get addons grouped by category (WITH TOUR FILTERING)
 */
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

/**
 * Get category steps in order for multi-step flow (WITH TOUR FILTERING)
 */
export async function getCategorySteps(
  tourHandle?: string | null
): Promise<CategoryStep[]> {
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

### 9.3 Component Integration

```typescript
/**
 * /Users/Karim/med-usa-4wd/storefront/app/checkout/add-ons-flow/page.tsx
 * (MODIFIED)
 */

function AddOnsFlowContent() {
  const { cart, removeAddOn } = useCartContext();
  const [steps, setSteps] = useState<CategoryStep[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load category steps WITH TOUR FILTERING
  useEffect(() => {
    async function loadSteps() {
      try {
        setIsLoading(true);

        // Get tour handle from cart
        const tourHandle = cart.tour?.handle || null;

        // Fetch steps filtered by tour
        const categorySteps = await getCategorySteps(tourHandle);
        setSteps(categorySteps);

        // Log filtering results
        console.log(
          `[Add-ons Flow] Loaded ${categorySteps.length} categories for tour: ${tourHandle || 'none'}`
        );

      } catch (error) {
        console.error('[Add-ons Flow] Failed to load steps:', error);
        showToast('Failed to load add-ons. Please try again.', 'error');
      } finally {
        setIsLoading(false);
      }
    }

    loadSteps();
  }, [cart.tour?.handle]); // Re-run when tour changes

  // Remove incompatible addons when tour changes
  useEffect(() => {
    const tourHandle = cart.tour?.handle;

    cart.selected_addons.forEach(addon => {
      if (!isAddonApplicableToTour(addon, tourHandle)) {
        removeAddOn(addon.id);
        showToast(
          `${addon.title} removed (not available for this tour)`,
          'warning'
        );
      }
    });
  }, [cart.tour?.handle]);

  // Enforce tour selection
  useEffect(() => {
    if (!cart.tour) {
      console.warn('[Add-ons Flow] No tour selected, redirecting to home');
      router.push('/');
    }
  }, [cart.tour, router]);

  // Rest of component...
}
```

---

## 10. Testing Strategy

### 10.1 Unit Tests

**File: `lib/data/__tests__/addon-filtering.test.ts`**

```typescript
import { isAddonApplicableToTour, filterAddonsByTour } from '../addon-filtering';

describe('Addon Filtering', () => {
  const mockAddons = [
    {
      id: '1',
      title: 'Universal Addon',
      metadata: { applicable_tours: ['*'] },
    },
    {
      id: '2',
      title: 'Fraser Only',
      metadata: { applicable_tours: ['1d-fraser-island'] },
    },
    {
      id: '3',
      title: 'Rainbow Only',
      metadata: { applicable_tours: ['1d-rainbow-beach'] },
    },
    {
      id: '4',
      title: 'Multi-Tour',
      metadata: { applicable_tours: ['1d-fraser-island', '2d-fraser-camping'] },
    },
    {
      id: '5',
      title: 'No Metadata',
      metadata: {},
    },
  ];

  test('universal addon shows for all tours', () => {
    expect(isAddonApplicableToTour(mockAddons[0], '1d-rainbow-beach')).toBe(true);
    expect(isAddonApplicableToTour(mockAddons[0], '1d-fraser-island')).toBe(true);
  });

  test('tour-specific addon shows only for that tour', () => {
    expect(isAddonApplicableToTour(mockAddons[1], '1d-fraser-island')).toBe(true);
    expect(isAddonApplicableToTour(mockAddons[1], '1d-rainbow-beach')).toBe(false);
  });

  test('multi-tour addon shows for multiple specific tours', () => {
    expect(isAddonApplicableToTour(mockAddons[3], '1d-fraser-island')).toBe(true);
    expect(isAddonApplicableToTour(mockAddons[3], '2d-fraser-camping')).toBe(true);
    expect(isAddonApplicableToTour(mockAddons[3], '1d-rainbow-beach')).toBe(false);
  });

  test('addon without metadata is universal', () => {
    expect(isAddonApplicableToTour(mockAddons[4], '1d-rainbow-beach')).toBe(true);
  });

  test('no tour selected returns empty array', () => {
    const filtered = filterAddonsByTour(mockAddons, null);
    expect(filtered).toEqual([]);
  });

  test('filtering returns correct subset', () => {
    const filtered = filterAddonsByTour(mockAddons, '1d-fraser-island');
    expect(filtered).toHaveLength(3); // Universal, Fraser Only, Multi-Tour
  });
});
```

### 10.2 Integration Tests

**Test service layer with real API:**

```typescript
describe('getCategorySteps with filtering', () => {
  test('returns only applicable categories', async () => {
    const steps = await getCategorySteps('1d-rainbow-beach');

    // Verify only populated categories
    steps.forEach(step => {
      expect(step.addons.length).toBeGreaterThan(0);
    });
  });

  test('returns different results for different tours', async () => {
    const rainbowSteps = await getCategorySteps('1d-rainbow-beach');
    const fraserSteps = await getCategorySteps('1d-fraser-island');

    expect(rainbowSteps).not.toEqual(fraserSteps);
  });
});
```

### 10.3 E2E Tests

**Test complete user flow:**

```typescript
describe('Addon filtering E2E', () => {
  test('user sees filtered addons for selected tour', () => {
    cy.visit('/');
    cy.selectTour('1D Rainbow Beach');
    cy.visit('/checkout/add-ons-flow');

    cy.get('[data-testid="addon-card"]').should('have.length.lessThan', 18);
    cy.get('[data-testid="filter-indicator"]').should(
      'contain',
      '1 Day Rainbow Beach'
    );
  });

  test('incompatible addons removed when tour changes', () => {
    cy.visit('/checkout/add-ons-flow');
    cy.get('[data-testid="addon-card-fraser-photo"]').click(); // Select Fraser-only addon

    cy.changeTour('1D Rainbow Beach');

    cy.get('[data-testid="toast"]').should(
      'contain',
      'Fraser Island Photography Package removed'
    );
  });
});
```

---

## 11. Performance Targets

### 11.1 Metrics

| Operation | Target | Measurement |
|-----------|--------|-------------|
| Initial addon fetch | < 500ms | Time to first addon displayed |
| Filtering operation | < 50ms | Client-side filter execution |
| Tour switch | < 200ms | Update UI with new addons |
| Category step generation | < 100ms | Create filtered step array |

### 11.2 Monitoring

```typescript
// Add performance logging
const startTime = performance.now();
const filtered = filterAddonsByTour(addons, tourHandle);
const endTime = performance.now();

if (process.env.NODE_ENV === 'development') {
  console.log(`[Performance] Filtering ${addons.length} addons took ${endTime - startTime}ms`);
}
```

---

## 12. Future Enhancements

### 12.1 Backend API Filtering

**Create dedicated API endpoint:**
```typescript
// app/api/addons/route.ts
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const tourHandle = searchParams.get('tour_handle');

  const filtered = await fetchFilteredAddonsFromMedusa(tourHandle);

  return Response.json({ addons: filtered });
}
```

**Benefits:**
- Reduced payload size
- Server-side caching
- Faster client rendering

### 12.2 Smart Recommendations

**Suggest addons based on tour characteristics:**
```typescript
function getRecommendedAddons(tour: Tour, allAddons: AddOn[]): AddOn[] {
  const applicable = filterAddonsByTour(allAddons, tour.handle);

  // Prioritize by tour characteristics
  if (tour.duration_days >= 3) {
    // Multi-day tours: prioritize connectivity and camping gear
    return applicable.sort((a, b) => {
      if (a.category === 'Connectivity') return -1;
      if (b.category === 'Connectivity') return 1;
      return 0;
    });
  }

  return applicable;
}
```

### 12.3 Analytics

**Track filtering effectiveness:**
```typescript
trackEvent('addons_filtered', {
  tour_handle: tourHandle,
  total_addons: allAddons.length,
  applicable_addons: filtered.length,
  categories_before: categoriesBefore,
  categories_after: categoriesAfter,
});
```

### 12.4 A/B Testing

**Test filtering vs. no filtering:**
```typescript
const isFilteringEnabled = useFeatureFlag('addon-filtering');

const steps = await getCategorySteps(
  isFilteringEnabled ? cart.tour?.handle : null
);
```

---

## 13. Summary

### Key Decisions

1. **Filtering Approach:** Hybrid (client-side with backend metadata)
2. **Metadata Field:** `applicable_tours: string[] | null`
3. **Universal Addons:** `["*"]` or `null`
4. **No Tour:** Redirect to home (force tour selection)
5. **Tour Change:** Auto-remove incompatible addons with toast
6. **Empty Categories:** Skip entirely (don't show in progress)
7. **Performance:** Client-side filtering with memoization

### Implementation Priority

**Phase 1 (Critical):**
- Add `applicable_tours` metadata to backend
- Create filtering service
- Update addon-flow-service
- Update page component

**Phase 2 (Important):**
- Edge case handling
- UX improvements (loading, empty states)
- Performance optimization

**Phase 3 (Nice-to-have):**
- "Show all" toggle
- Analytics
- Backend API filtering
- Smart recommendations

### Success Metrics

- ✅ Only applicable addons shown
- ✅ No lag when switching tours
- ✅ Clear user feedback
- ✅ Edge cases handled gracefully
- ✅ 90+ PageSpeed score maintained

---

## 14. Next Steps

1. **Review & approve this design**
2. **Update backend metadata** (add `applicable_tours` to all addons)
3. **Implement filtering service** (create new file)
4. **Integrate into existing flow** (modify service + component)
5. **Test thoroughly** (unit, integration, E2E)
6. **Deploy and monitor**

---

*Document version: 1.0*
*Last updated: 2025-11-08*
*Author: Claude Code Agent*
