# Add-ons Price Bug - Complete Analysis & Fix

**Date**: 2025-11-09
**Status**: Root Cause Identified
**Severity**: High (Blocks add-on purchases)
**Component**: TourAddOns.tsx

---

## Quick Summary

The "undefined price" error in the TourAddOns component is caused by a **type definition mismatch**. The component imports the wrong type (`AddOn` from checkout.ts) which expects a `price` field, but the actual data has a `price_cents` field (from the `Addon` type in cart.ts).

### The Issue in One Sentence
Component tries to access `addon.price` but the data only has `addon.price_cents`.

---

## Test Results Summary

### ✅ Tests PASSED

1. **Backend API Test**
   - API returns add-ons correctly
   - Prices are in cents (e.g., 3000 = $30.00)
   - Field: `variants[0].calculated_price.calculated_amount`
   - Tested 3 add-ons: Internet ($30), Glamping ($80), BBQ ($65)

2. **Service Layer Test**
   - addons-service.ts correctly extracts prices
   - Properly maps to `price_cents` field
   - Returns correct `Addon` type from cart.ts
   - No data loss or transformation errors

3. **Hook Test**
   - useAddOns.ts correctly imports `Addon` type
   - Returns array of addons with `price_cents`
   - SWR caching works as expected

### ❌ Tests FAILED

1. **Component Type Import**
   - Component imports wrong type: `AddOn` from checkout.ts
   - Should import: `Addon` from cart.ts
   - TypeScript doesn't catch this at compile time

2. **Component Data Access**
   - Tries to access: `addon.price` (doesn't exist)
   - Should access: `addon.price_cents` (exists)
   - Result: undefined → $NaN in UI

---

## Data Flow at Each Stage

| Stage | File | Type | Price Field | Value | Status |
|-------|------|------|-------------|-------|--------|
| 1. API | Medusa Backend | - | `calculated_amount` | 3000 cents | ✅ OK |
| 2. Service | addons-service.ts | Addon | `price_cents` | 3000 cents | ✅ OK |
| 3. Hook | useAddOns.ts | Addon | `price_cents` | 3000 cents | ✅ OK |
| 4. Component | TourAddOns.tsx | **AddOn** | `price` | **undefined** | ❌ FAIL |

---

## Root Cause Analysis

### Type Definitions Conflict

There are **two different interfaces** for add-ons in the codebase:

#### Type 1: `/lib/types/cart.ts` - Addon (CORRECT)
```typescript
export interface Addon {
  id: string;
  variant_id: string;
  title: string;
  description: string;
  price_cents: number;  // ✅ Used by service & hook
  pricing_type: AddonPricingType;
  category: string;
  available: boolean;
  icon?: string;
  metadata?: {...};
}
```

#### Type 2: `/lib/types/checkout.ts` - AddOn (INCORRECT)
```typescript
export interface AddOn {
  id: string;
  title: string;
  description: string;
  price: number;  // ❌ Used by component (wrong!)
  pricing_type: 'per_booking' | 'per_day' | 'per_person';
  icon?: string;
  category?: string;
  available: boolean;
  metadata?: AddOnMetadata;
}
```

### What Happens

```
1. Service creates: Addon { price_cents: 3000 }
2. Hook returns: Addon[] { price_cents: 3000 }
3. Component imports: AddOn type (expects price field)
4. Component tries: addon.price
5. JavaScript returns: undefined (field doesn't exist)
6. formatPrice(undefined) → $NaN
```

---

## The Fix (3 Changes Required)

### Change 1: Fix Component Import
**File**: `/Users/Karim/med-usa-4wd/storefront/components/Tours/TourAddOns.tsx`
**Line**: 8

```diff
- import type { AddOn } from '../../lib/types/checkout';
+ import type { Addon } from '../../lib/types/cart';
```

### Change 2: Update formatPrice Function
**File**: `/Users/Karim/med-usa-4wd/storefront/components/Tours/TourAddOns.tsx`
**Lines**: 27-38

```diff
- const formatPrice = (price: number, pricingType: string) => {
-   const formattedPrice = `$${price.toFixed(2)}`;
+ const formatPrice = (price_cents: number, pricingType: string) => {
+   const price_dollars = price_cents / 100;
+   const formattedPrice = `$${price_dollars.toFixed(2)}`;
    switch (pricingType) {
      case 'per_day':
        return `${formattedPrice}/day`;
      case 'per_person':
        return `${formattedPrice}/person`;
      case 'per_booking':
      default:
        return formattedPrice;
    }
  };
```

### Change 3: Fix Price Access
**File**: `/Users/Karim/med-usa-4wd/storefront/components/Tours/TourAddOns.tsx`
**Line**: 89

```diff
  <span className={styles.price}>
-   {formatPrice(addon.price, addon.pricing_type)}
+   {formatPrice(addon.price_cents, addon.pricing_type)}
  </span>
```

---

## Verification Steps

After applying the fix:

1. **Type Check**
   ```bash
   npm run typecheck
   ```
   Expected: No type errors

2. **Build Test**
   ```bash
   npm run build
   ```
   Expected: Successful build

3. **Visual Test**
   - Navigate to page with TourAddOns component
   - Verify prices display correctly (e.g., "$30.00", "$80.00")
   - Verify pricing type suffix (e.g., "/day", "/person")

4. **Console Check**
   - Open browser DevTools
   - Check for no errors
   - Verify add-ons data in console logs

---

## API Test Results

### Test Command
```bash
curl -s -H "x-publishable-api-key: pk_34de..." \
  "http://localhost:9000/store/products?region_id=reg_01K9G4HA190556136E7RJQ4411" \
  | jq '.products[] | select(.handle | startswith("addon-"))'
```

### Actual Backend Data

| Product ID | Title | Handle | Price (cents) | Price ($) | Variant ID |
|------------|-------|--------|---------------|-----------|------------|
| prod_01K9H8KY6YHAAP1THH4R7EB258 | Always-on High-Speed Internet | addon-internet | 3000 | $30.00 | variant_01K9H8KY757A5BAY9CXF2AQB4F |
| prod_01K9H8KY7Q0BTC99B0FBQGTK9J | Glamping Setup | addon-glamping | 8000 | $80.00 | variant_01K9H8KY7YT8P7TR46GBKYFY44 |
| prod_01K9H8KY8GVBMYZVB4CAN72EYW | BBQ on the Beach | addon-bbq | 6500 | $65.00 | variant_01K9H8KY8RSBMRHZH3XYPPR50Y |

### Sample API Response (Internet Add-on)
```json
{
  "id": "prod_01K9H8KY6YHAAP1THH4R7EB258",
  "title": "Always-on High-Speed Internet",
  "handle": "addon-internet",
  "description": null,
  "variants": [
    {
      "id": "variant_01K9H8KY757A5BAY9CXF2AQB4F",
      "calculated_price": {
        "calculated_amount": 3000,
        "currency_code": "aud"
      }
    }
  ]
}
```

---

## Additional Recommendations

### 1. Type Consolidation (Optional but Recommended)

Merge the two type definitions to avoid future confusion:

**Option A**: Keep only `/lib/types/cart.ts` types
- Remove AddOn from checkout.ts
- Update all imports to use Addon from cart.ts

**Option B**: Create type alias
```typescript
// In checkout.ts
export type { Addon as AddOn } from './cart';
```

### 2. Backend Enhancements

The API returns `description: null` for all add-ons. Consider adding descriptions in Medusa:

```typescript
// Example descriptions for add-ons
"Always-on High-Speed Internet": "Stay connected with reliable 4G/5G internet throughout your journey"
"Glamping Setup": "Premium camping experience with luxury tents and comfortable amenities"
"BBQ on the Beach": "Enjoy a delicious beachside BBQ dinner under the stars"
```

### 3. Add Unit Tests

Create tests to catch type mismatches:

```typescript
// __tests__/TourAddOns.test.tsx
it('should display correct price from price_cents', () => {
  const addon = {
    price_cents: 3000,
    // ...
  };
  expect(formatPrice(addon.price_cents, 'per_booking')).toBe('$30.00');
});
```

### 4. Add TypeScript Strict Checks

Enable stricter TypeScript checks in `tsconfig.json`:
```json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true
  }
}
```

---

## File Locations

All test documentation saved to:

1. **Main Report**: `/Users/Karim/med-usa-4wd/storefront/docs/data-flow-test-results.md`
   - Complete data flow analysis
   - Stage-by-stage comparison
   - API response samples
   - Detailed code snippets

2. **Visual Diagrams**: `/Users/Karim/med-usa-4wd/storefront/docs/data-flow-diagram.md`
   - Flow charts
   - Type mismatch diagrams
   - Before/after comparisons

3. **Summary**: `/Users/Karim/med-usa-4wd/storefront/docs/addons-bug-fix-summary.md` (this file)
   - Quick reference
   - Action items
   - Verification steps

---

## Action Items Checklist

- [ ] Apply Change 1: Update import statement
- [ ] Apply Change 2: Modify formatPrice function
- [ ] Apply Change 3: Fix price access in JSX
- [ ] Run type check: `npm run typecheck`
- [ ] Run build: `npm run build`
- [ ] Test in browser: Verify prices display correctly
- [ ] Optional: Consolidate type definitions
- [ ] Optional: Add descriptions in Medusa backend
- [ ] Optional: Add unit tests
- [ ] Git commit with proper message

---

## Expected Outcome

### Before Fix
```
Price displayed: $NaN
Console error: Cannot read property 'toFixed' of undefined
User experience: Broken, can't see prices
```

### After Fix
```
Price displayed: $30.00, $80.00/day, $65.00/person
Console: No errors
User experience: Clean, functional add-ons display
```

---

**Report Generated**: 2025-11-09
**Testing Method**: End-to-end data flow tracing
**Tools Used**: curl, jq, TypeScript analysis, runtime debugging
**Confidence Level**: High - Root cause definitively identified
