# Addon Filtering API Documentation

**Version**: 1.0
**Last Updated**: November 8, 2025
**Module**: `/storefront/lib/data/addon-filtering.ts`

---

## Table of Contents

1. [Overview](#overview)
2. [Core Functions](#core-functions)
3. [Utility Functions](#utility-functions)
4. [Type Definitions](#type-definitions)
5. [Usage Examples](#usage-examples)
6. [Performance Considerations](#performance-considerations)

---

## Overview

The Addon Filtering API provides functions to filter and manage addons based on tour compatibility. It uses the `metadata.applicable_tours` field to determine which addons should be displayed for specific tours.

### Key Concepts

- **Universal Addons**: Addons with `applicable_tours: ["*"]` appear for all tours
- **Tour-Specific Addons**: Addons with specific tour handles only appear for those tours
- **Fail-Safe Filtering**: Missing or invalid metadata results in addon being hidden (not shown)

---

## Core Functions

### isAddonApplicableToTour()

Checks if an addon is applicable to a specific tour.

**Signature:**
```typescript
function isAddonApplicableToTour(
  addon: AddOn,
  tourHandle: string
): boolean
```

**Parameters:**
- `addon` (AddOn): The addon to check
- `tourHandle` (string): The tour handle (e.g., "1d-rainbow-beach")

**Returns:**
- `boolean`: `true` if addon applies to the tour, `false` otherwise

**Logic:**
1. Returns `false` if addon or metadata is missing
2. Returns `false` if `applicable_tours` is missing or empty
3. Returns `true` if `applicable_tours` includes `"*"` (universal)
4. Returns `true` if `applicable_tours` includes the tour handle
5. Returns `false` otherwise

**Example:**
```typescript
const bbqAddon = {
  id: 'addon-gourmet-bbq',
  title: 'BBQ on the Beach',
  metadata: {
    applicable_tours: ['*']
  }
};

const glampingAddon = {
  id: 'addon-glamping',
  title: 'Glamping Setup',
  metadata: {
    applicable_tours: ['2d-fraser-rainbow', '3d-fraser-rainbow']
  }
};

// Universal addon
isAddonApplicableToTour(bbqAddon, '1d-rainbow-beach'); // true
isAddonApplicableToTour(bbqAddon, '3d-fraser-rainbow'); // true

// Multi-day only addon
isAddonApplicableToTour(glampingAddon, '1d-rainbow-beach'); // false
isAddonApplicableToTour(glampingAddon, '3d-fraser-rainbow'); // true
```

**Performance:** O(n) where n is length of `applicable_tours` array (typically < 5)

---

### filterAddonsForTour()

Filters an array of addons for a specific tour.

**Signature:**
```typescript
function filterAddonsForTour(
  addons: AddOn[],
  tourHandle: string
): AddOn[]
```

**Parameters:**
- `addons` (AddOn[]): Array of all addons
- `tourHandle` (string): Tour handle to filter for

**Returns:**
- `AddOn[]`: Filtered array of applicable addons

**Behavior:**
- Returns empty array if `addons` is null/undefined
- Returns all addons if `tourHandle` is empty string
- Filters using `isAddonApplicableToTour()` for non-empty tour handles
- Logs performance metrics in development mode

**Example:**
```typescript
const allAddons = await fetchAllAddOns();

// Get addons for 1-day Rainbow Beach tour
const dayTripAddons = filterAddonsForTour(
  allAddons,
  '1d-rainbow-beach'
);
// Returns: ~13-14 addons (universal + Rainbow Beach specific)

// Get addons for 3-day tour
const multiDayAddons = filterAddonsForTour(
  allAddons,
  '3d-fraser-rainbow'
);
// Returns: ~16 addons (all addons)
```

**Performance:**
- Target: < 50ms for 100 addons
- Typical: < 5ms for 20 addons
- Complexity: O(n × m) where n = addon count, m = avg applicable_tours length

**Console Output (Development):**
```
[Addon Filtering] Filtered 16 addons to 13 for tour "1d-rainbow-beach" in 2.45ms
```

---

### groupAddonsByCategory()

Groups addons by their category.

**Signature:**
```typescript
function groupAddonsByCategory(
  addons: AddOn[]
): Record<string, AddOn[]>
```

**Parameters:**
- `addons` (AddOn[]): Array of addons (typically pre-filtered)

**Returns:**
- `Record<string, AddOn[]>`: Object mapping category names to addon arrays

**Example:**
```typescript
const filteredAddons = filterAddonsForTour(allAddons, '1d-rainbow-beach');
const grouped = groupAddonsByCategory(filteredAddons);

console.log(grouped);
// {
//   "Food & Beverage": [addon1, addon2, addon3],
//   "Connectivity": [addon4, addon5],
//   "Photography": [addon6, addon7, addon8],
//   "Activities": [addon9, addon10, addon11, addon12, addon13],
//   "Equipment": [addon14]
// }
```

**Use Case:**
- Multi-step addon flow (one category per step)
- Category-based UI organization
- Analytics by category

**Performance:** O(n) where n is number of addons

---

### getCategorySteps() Integration

The addon flow service integrates filtering:

**Signature:**
```typescript
async function getCategorySteps(): Promise<CategoryStep[]>
```

**Returns:**
- `CategoryStep[]`: Array of category steps with filtered addons

**Behavior:**
- Fetches all addons from backend
- Groups by category
- Filters out empty categories
- Maintains category order
- Updates step numbers and totals

**Example:**
```typescript
const steps = await getCategorySteps();

// Iterate through multi-step flow
steps.forEach((step, index) => {
  console.log(`Step ${step.stepNumber}/${step.totalSteps}: ${step.categoryName}`);
  console.log(`Addons: ${step.addons.length}`);
  console.log(`Intro: ${step.intro.title}`);
});

// Output:
// Step 1/5: Food & Beverage
// Addons: 3
// Intro: Elevate Your Dining Experience
//
// Step 2/5: Photography
// Addons: 3
// Intro: Capture Every Moment
// ...
```

---

## Utility Functions

### getFilteringStats()

Get statistics about filtering operation.

**Signature:**
```typescript
function getFilteringStats(
  allAddons: AddOn[],
  filteredAddons: AddOn[]
): {
  total: number;
  filtered: number;
  removed: number;
  percentageShown: number;
}
```

**Example:**
```typescript
const stats = getFilteringStats(allAddons, filteredAddons);

console.log(stats);
// {
//   total: 16,
//   filtered: 13,
//   removed: 3,
//   percentageShown: 81
// }
```

---

### detectIncompatibleAddons()

Find addons in a selection that are not compatible with a tour.

**Signature:**
```typescript
function detectIncompatibleAddons(
  selectedAddons: AddOn[],
  tourHandle: string
): AddOn[]
```

**Use Case:**
- Tour change detection
- Cart validation
- Warning messages

**Example:**
```typescript
// User switches from 3-day to 1-day tour
const incompatible = detectIncompatibleAddons(
  currentSelection,
  '1d-rainbow-beach'
);

if (incompatible.length > 0) {
  showWarning(`${incompatible.length} addons removed due to tour change`);
  // Remove from cart
  incompatible.forEach(addon => removeFromCart(addon.id));
}
```

---

### hasApplicableToursMetadata()

Type guard to check if addon has valid metadata.

**Signature:**
```typescript
function hasApplicableToursMetadata(addon: AddOn): boolean
```

**Example:**
```typescript
const validAddons = allAddons.filter(hasApplicableToursMetadata);
// Only addons with proper metadata
```

---

### getAllTourHandlesFromAddons()

Extract all unique tour handles referenced in addons.

**Signature:**
```typescript
function getAllTourHandlesFromAddons(addons: AddOn[]): string[]
```

**Returns:**
- `string[]`: Sorted array of unique tour handles (excludes `"*"`)

**Use Case:**
- Admin validation
- Debugging
- Tour-addon relationship analysis

**Example:**
```typescript
const handles = getAllTourHandlesFromAddons(allAddons);

console.log(handles);
// ["1d-fraser-island", "1d-rainbow-beach", "2d-fraser-rainbow", "3d-fraser-rainbow", "4d-fraser-rainbow"]
```

---

## Type Definitions

### AddOn

Extended from `/lib/types/checkout.ts`:

```typescript
interface AddOn {
  id: string;
  title: string;
  description: string;
  price: number;
  pricing_type: 'per_booking' | 'per_day' | 'per_person';
  icon?: string;
  category?: string;
  available: boolean;
  metadata?: AddOnMetadata;
}
```

### AddOnMetadata

```typescript
interface AddOnMetadata {
  addon?: boolean;
  unit?: 'per_booking' | 'per_day' | 'per_person';
  category?: string;
  applicable_tours?: string[];  // ← Key field for filtering
  description?: string;
  persuasive_title?: string;
  persuasive_description?: string;
  value_proposition?: string;
  urgency_text?: string;
  features?: string[];
  testimonial?: string;
  category_intro?: string;
  category_persuasion?: string;
}
```

### FilteringStats

```typescript
interface FilteringStats {
  total: number;
  filtered: number;
  removed: number;
  percentageShown: number;
}
```

---

## Usage Examples

### Basic Filtering

```typescript
import { filterAddonsForTour } from '@/lib/data/addon-filtering';
import { fetchAllAddOns } from '@/lib/data/addons-service';

async function getAddonsForTour(tourHandle: string) {
  const { addons } = await fetchAllAddOns();
  return filterAddonsForTour(addons, tourHandle);
}

// Usage
const dayTripAddons = await getAddonsForTour('1d-rainbow-beach');
```

### Multi-Step Flow with Filtering

```typescript
import { getCategorySteps } from '@/lib/data/addon-flow-service';

export default async function AddOnsPage() {
  const steps = await getCategorySteps();

  return (
    <div>
      {steps.map((step) => (
        <CategoryStep
          key={step.categoryName}
          step={step}
          addons={step.addons}  // Already filtered
        />
      ))}
    </div>
  );
}
```

### Tour Change Handler

```typescript
import { detectIncompatibleAddons } from '@/lib/data/addon-filtering';

function handleTourChange(newTourHandle: string) {
  const incompatible = detectIncompatibleAddons(
    cart.selectedAddons,
    newTourHandle
  );

  if (incompatible.length > 0) {
    // Show warning
    toast.warning(
      `${incompatible.length} addon(s) removed (not available for this tour)`
    );

    // Remove from cart
    incompatible.forEach(addon => {
      cart.removeAddon(addon.id);
    });
  }

  // Update tour
  cart.setTour(newTourHandle);
}
```

### Analytics Integration

```typescript
import { getFilteringStats } from '@/lib/data/addon-filtering';

async function trackAddonFiltering(tourHandle: string) {
  const { addons } = await fetchAllAddOns();
  const filtered = filterAddonsForTour(addons, tourHandle);
  const stats = getFilteringStats(addons, filtered);

  analytics.track('Addons Filtered', {
    tour: tourHandle,
    total: stats.total,
    shown: stats.filtered,
    removed: stats.removed,
    percentage: stats.percentageShown
  });
}
```

---

## Performance Considerations

### Optimization Techniques

1. **Memoization**
   ```typescript
   // Cache filtered results per tour
   const cache = new Map<string, AddOn[]>();

   function getCachedFilteredAddons(addons: AddOn[], tourHandle: string) {
     const key = `${tourHandle}-${addons.length}`;
     if (!cache.has(key)) {
       cache.set(key, filterAddonsForTour(addons, tourHandle));
     }
     return cache.get(key)!;
   }
   ```

2. **Early Returns**
   - Already implemented in `isAddonApplicableToTour()`
   - Checks cheapest conditions first

3. **Avoid Re-filtering**
   ```typescript
   // ❌ Bad: Re-filters on every render
   function Component() {
     const filtered = filterAddonsForTour(allAddons, tourHandle);
     return <AddonList addons={filtered} />;
   }

   // ✅ Good: Filter once, pass down
   function Component() {
     const filtered = useMemo(
       () => filterAddonsForTour(allAddons, tourHandle),
       [allAddons, tourHandle]
     );
     return <AddonList addons={filtered} />;
   }
   ```

### Performance Targets

| Operation | Target | Typical |
|-----------|--------|---------|
| `isAddonApplicableToTour()` | < 1ms | 0.05ms |
| `filterAddonsForTour(20)` | < 10ms | 2-5ms |
| `filterAddonsForTour(100)` | < 50ms | 15-25ms |
| `groupAddonsByCategory()` | < 5ms | 1-2ms |
| `getCategorySteps()` | < 50ms | 10-20ms |

---

## Error Handling

### Graceful Degradation

```typescript
// Function handles null/undefined gracefully
filterAddonsForTour(null, 'tour-handle');
// Returns: []

filterAddonsForTour(addons, null);
// Returns: all addons

filterAddonsForTour(addons, '');
// Returns: all addons
```

### Validation

```typescript
// Validate addon metadata
import { hasApplicableToursMetadata } from '@/lib/data/addon-filtering';

const invalidAddons = allAddons.filter(
  addon => !hasApplicableToursMetadata(addon)
);

if (invalidAddons.length > 0) {
  console.error('Invalid addon metadata:', invalidAddons);
  // Alert admin or log to monitoring
}
```

---

## Testing

See comprehensive test suites:
- **Unit Tests**: `/tests/unit/addon-filtering.test.ts`
- **Integration Tests**: `/tests/integration/addon-flow-filtering.test.ts`
- **E2E Tests**: `/tests/e2e/addon-filtering.spec.ts`

---

## Migration Guide

### From Mock Data to Backend Filtering

Before:
```typescript
// All addons shown regardless of tour
const addons = await fetchAllAddOns();
```

After:
```typescript
// Filter based on tour in cart
const { tour } = useCart();
const { addons } = await fetchAllAddOns();
const filtered = filterAddonsForTour(addons, tour.handle);
```

---

## Changelog

### v1.0 (November 2025)
- Initial release
- Core filtering functions
- Integration with addon flow service
- Comprehensive test coverage
- Performance optimizations

---

**Next**: [Admin Guide](../guides/admin-addon-mapping-guide.md)
**Related**: [Technical Specifications](../addon-tour-mapping-technical-specs.md)
