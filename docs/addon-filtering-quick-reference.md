# Addon Filtering Quick Reference

## TL;DR

**Problem:** All 18 addons show for every tour, regardless of relevance.

**Solution:** Filter addons by `applicable_tours` metadata field.

**Implementation:** Client-side filtering with backend metadata support.

---

## Filtering Logic Flow

```
User selects tour → Tour handle extracted → Addons fetched → Filter applied → Display filtered addons
   "1d-rainbow-beach"         ↓                 18 addons         ↓              8-12 addons
                              ↓                                    ↓
                    getCategorySteps(tourHandle)    filterAddonsByCategoryAndTour()
```

---

## Metadata Schema

```typescript
// Universal addon (shows for ALL tours)
{
  title: "Always-on High-Speed Internet",
  metadata: {
    applicable_tours: ["*"]  // or null or undefined
  }
}

// Tour-specific addon
{
  title: "Fraser Island Photography Package",
  metadata: {
    applicable_tours: ["1d-fraser-island", "2d-fraser-camping"]
  }
}

// Not applicable to any tour
{
  title: "Disabled Addon",
  metadata: {
    applicable_tours: []  // Never shown
  }
}
```

---

## Core Filtering Function

```typescript
export function isAddonApplicableToTour(
  addon: AddOn,
  tourHandle: string | null
): boolean {
  if (!tourHandle) return false; // No tour = no addons

  const applicableTours = addon.metadata?.applicable_tours;

  // Universal: null, undefined, empty, or ["*"]
  if (!applicableTours || applicableTours.length === 0 || applicableTours.includes("*")) {
    return true;
  }

  // Check if tour is in list
  return applicableTours.includes(tourHandle);
}
```

---

## Edge Cases

| Scenario | Behavior |
|----------|----------|
| No tour in cart | Redirect to home |
| Tour changes mid-flow | Remove incompatible addons + toast |
| Universal addon | Always show |
| Empty category after filtering | Skip category entirely |
| All addons filtered out | Show empty state + "Continue to checkout" |

---

## Files to Modify

### 1. Backend Metadata
**File:** `/Users/Karim/med-usa-4wd/src/modules/seeding/tour-seed.ts`

Add `applicable_tours` to each addon in `ADDONS` array.

### 2. Filtering Service (NEW)
**File:** `/Users/Karim/med-usa-4wd/storefront/lib/data/addon-filtering.ts`

```typescript
export function isAddonApplicableToTour(addon, tourHandle): boolean
export function filterAddonsByTour(addons, tourHandle): AddOn[]
export function filterAddonsByCategoryAndTour(grouped, tourHandle): Record<string, AddOn[]>
```

### 3. Service Layer
**File:** `/Users/Karim/med-usa-4wd/storefront/lib/data/addon-flow-service.ts`

```typescript
// BEFORE
export async function getCategorySteps(): Promise<CategoryStep[]>

// AFTER
export async function getCategorySteps(tourHandle?: string | null): Promise<CategoryStep[]>
```

### 4. Component
**File:** `/Users/Karim/med-usa-4wd/storefront/app/checkout/add-ons-flow/page.tsx`

```typescript
// BEFORE
const categorySteps = await getCategorySteps();

// AFTER
const tourHandle = cart.tour?.handle || null;
const categorySteps = await getCategorySteps(tourHandle);
```

---

## Performance Optimizations

```typescript
// 1. Memoize filtering
const filteredSteps = useMemo(
  () => getCategorySteps(cart.tour?.handle),
  [cart.tour?.handle]
);

// 2. Use SWR for caching
const { data } = useSWR(['steps', tourHandle], () => getCategorySteps(tourHandle));

// 3. Only re-fetch when tour changes
useEffect(() => {
  loadSteps();
}, [cart.tour?.handle]); // Not [cart]!
```

---

## Example Addon Configuration

```typescript
// Food & Beverage - Universal (all tours)
{
  title: "Gourmet Beach BBQ",
  handle: "addon-gourmet-bbq",
  metadata: {
    applicable_tours: ["*"],
    category: "Food & Beverage",
  }
}

// Photography - Fraser Island only
{
  title: "Fraser Island Photography Package",
  handle: "addon-fraser-photography",
  metadata: {
    applicable_tours: ["1d-fraser-island", "2d-fraser-camping"],
    category: "Photography",
  }
}

// Equipment - Rainbow Beach only
{
  title: "Beach Camping Gear",
  handle: "addon-beach-camping",
  metadata: {
    applicable_tours: ["1d-rainbow-beach"],
    category: "Equipment",
  }
}

// Connectivity - Universal
{
  title: "Always-on High-Speed Internet",
  handle: "addon-internet",
  metadata: {
    applicable_tours: null, // Universal
    category: "Connectivity",
  }
}
```

---

## Testing Checklist

- [ ] Universal addons show for all tours
- [ ] Tour-specific addons show only for applicable tours
- [ ] Empty categories are skipped
- [ ] No tour redirects to home
- [ ] Tour change removes incompatible addons
- [ ] Filtering completes in < 50ms
- [ ] UI updates smoothly on tour switch
- [ ] Empty state shows when no addons applicable

---

## User Experience

### Filter Indicator
```tsx
<div className={styles.filterIndicator}>
  Showing 8 add-ons for 1 Day Rainbow Beach Tour
</div>
```

### Empty State
```tsx
<div className={styles.emptyState}>
  <h3>No add-ons available for this tour</h3>
  <button onClick={goToCheckout}>Continue to Checkout</button>
</div>
```

### Tour Change Toast
```tsx
Toast: "Fraser Island Photography Package removed (not available for this tour)"
```

---

## Implementation Steps

1. **Add metadata** to backend addons (30 min)
2. **Create filtering service** (1 hour)
3. **Update service layer** (30 min)
4. **Update component** (30 min)
5. **Handle edge cases** (1 hour)
6. **Add UX improvements** (1 hour)
7. **Test thoroughly** (2 hours)

**Total: ~6-7 hours**

---

## Decision Summary

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Where to filter? | Client-side | Simpler, faster to implement |
| Metadata field? | `applicable_tours: string[]` | Clear, flexible |
| Universal addons? | `["*"]` or `null` | Intuitive |
| No tour in cart? | Redirect to home | Force tour selection |
| Tour change? | Auto-remove + toast | Best UX |
| Empty category? | Skip entirely | Cleaner flow |

---

## API Signature Reference

```typescript
// Filtering service
isAddonApplicableToTour(addon: AddOn, tourHandle: string | null): boolean
filterAddonsByTour(addons: AddOn[], tourHandle: string | null): AddOn[]
filterAddonsByCategoryAndTour(grouped: Record<string, AddOn[]>, tourHandle: string | null): Record<string, AddOn[]>

// Service layer
getCategorySteps(tourHandle?: string | null): Promise<CategoryStep[]>
getAddonsByCategory(tourHandle?: string | null): Promise<Record<string, AddOn[]>>

// Component usage
const steps = await getCategorySteps(cart.tour?.handle || null);
```

---

## Quick Troubleshooting

**Problem:** All addons still showing

**Solution:** Check that `tourHandle` is being passed to `getCategorySteps()`

---

**Problem:** Addons disappear when tour changes

**Solution:** Expected behavior - ensure toast notification is shown

---

**Problem:** Universal addons not showing

**Solution:** Check `applicable_tours` is `["*"]` or `null`, not `[]`

---

**Problem:** Filtering is slow

**Solution:** Add `useMemo()` around filtering calls

---

*Quick reference version: 1.0*
*See `addon-filtering-design.md` for complete documentation*
