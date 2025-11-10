# Add-on Price Error Fix - November 9, 2025

## Issue Summary

**Error**: `TypeError: Cannot read properties of undefined (reading 'toFixed')`
**Location**: `components/Tours/TourAddOns.tsx:28`
**Impact**: 4 runtime errors on all tour/product pages
**Status**: ✅ FIXED

---

## Root Cause Analysis

### The Problem

The `TourAddOns.tsx` component was importing the wrong type definition, causing it to access a field that doesn't exist in the actual runtime data.

**Type Mismatch:**
```typescript
// Component imported (WRONG):
import type { AddOn } from '../../lib/types/checkout';

// This type expects:
interface AddOn {
  price: number;  // ❌ This field doesn't exist in runtime data
}

// But runtime data has (from cart.ts):
interface Addon {
  price_cents: number;  // ✅ This is the actual field
}
```

**Data Flow:**
```
Medusa API (price in cents)
  → addons-service.ts (converts to price_cents)
    → useAddOns hook (returns Addon[])
      → TourAddOns.tsx (expects AddOn with 'price')
        ❌ Accesses addon.price → undefined
        ❌ Calls price.toFixed(2) → TypeError
```

### Why It Failed

1. **Dual Type Systems**: The codebase has two competing type definitions:
   - `/lib/types/checkout.ts` - `AddOn` interface (outdated, uses `price`)
   - `/lib/types/cart.ts` - `Addon` interface (correct, uses `price_cents`)

2. **Field Name Mismatch**: Component accessed `addon.price` but data had `addon.price_cents`

3. **No Type Safety**: TypeScript didn't catch this because the hook was typed as returning `any[]`

4. **Missing Conversion**: No cents-to-dollars conversion before calling `.toFixed()`

---

## The Fix

### Changes Made

**File**: `/Users/Karim/med-usa-4wd/storefront/components/Tours/TourAddOns.tsx`

#### Change 1: Import Correct Type
```diff
- import type { AddOn } from '../../lib/types/checkout';
+ import type { Addon } from '../../lib/types/cart';
```

#### Change 2: Update Function Signature and Add Conversion
```diff
- const formatPrice = (price: number, pricingType: string) => {
-   const formattedPrice = `$${price.toFixed(2)}`;
+ const formatPrice = (price_cents: number, pricingType: string) => {
+   // Convert cents to dollars for display
+   const priceDollars = price_cents / 100;
+   const formattedPrice = `$${priceDollars.toFixed(2)}`;
```

#### Change 3: Use Correct Field
```diff
  <span className={styles.price}>
-   {formatPrice(addon.price, addon.pricing_type)}
+   {formatPrice(addon.price_cents, addon.pricing_type)}
  </span>
```

#### Change 4: Update Type Annotation
```diff
- const handleAddToCart = (addon: AddOn) => {
+ const handleAddToCart = (addon: Addon) => {
```

---

## Medusa Best Practices Applied

### 1. Price Storage Standard
**Medusa Requirement**: Always store prices in cents (integers)

```typescript
// ✅ CORRECT: Medusa standard
{
  price_cents: 3000  // $30.00
}

// ❌ WRONG: Don't store as dollars
{
  price: 30.00
}
```

### 2. Price Access Pattern
**Medusa API Response**:
```typescript
{
  variants: [{
    calculated_price: {
      calculated_amount: 3000,  // Price in cents
      currency_code: "AUD"
    }
  }]
}
```

### 3. Display Conversion
**Best Practice**: Convert cents to dollars ONLY for display

```typescript
// ✅ CORRECT
const priceDollars = price_cents / 100;
const display = `$${priceDollars.toFixed(2)}`;  // "$30.00"

// ❌ WRONG
const display = `$${price.toFixed(2)}`;  // Error if price undefined
```

### 4. Type Safety
**Standard**: Use `price_cents` field name consistently

```typescript
// ✅ CORRECT (matches Medusa)
interface Addon {
  price_cents: number;
  variant_id: string;
}

// ❌ WRONG (doesn't match API)
interface AddOn {
  price: number;
}
```

---

## Verification Results

### Test Suite
```bash
✅ PASS checkout/pricing.spec.ts
✅ PASS addon-filtering.test.ts
✅ PASS addons/pricing.test.ts
✅ PASS pricing.test.ts
✅ PASS cart-service.test.ts
✅ PASS CartContext.test.tsx
```

### Runtime Verification
- ✅ Frontend compiles without errors
- ✅ Tour pages load successfully
- ✅ No console errors
- ✅ Add-ons section renders (when available)

---

## Swarm Investigation Summary

A coordinated swarm of 4 specialized agents investigated this issue:

### 1. Research Agent
- **Task**: Analyze Medusa documentation
- **Finding**: Confirmed `price_cents` is the Medusa standard
- **Documentation**: https://docs.medusajs.com/llms-full.txt

### 2. Debug Agent
- **Task**: Investigate TourAddOns.tsx error
- **Finding**: Type import mismatch on line 8
- **Solution**: Change import from checkout.ts to cart.ts

### 3. Naming Consistency Agent
- **Task**: Verify field naming across codebase
- **Finding**: Two competing type definitions
- **Recommendation**: Consolidate to cart.ts standard

### 4. Data Flow Testing Agent
- **Task**: Test end-to-end data flow
- **Finding**: Service returns `price_cents`, component expects `price`
- **Evidence**: Actual API calls and data structures

---

## Related Files Analysis

### ✅ Correct Files (Using cart.ts)
- `/lib/data/addons-service.ts` - Service layer
- `/lib/hooks/useAddOns.ts` - React hook
- `/app/checkout/add-ons/page.tsx` - Checkout page
- `/app/checkout/add-ons-flow/page.tsx` - Flow page
- `/lib/data/addon-flow-service.ts` - Flow service

### ❌ Fixed Files
- `/components/Tours/TourAddOns.tsx` - **FIXED** ✅

### ⚠️ Needs Attention (Future)
- `/lib/types/checkout.ts` - Consider deprecating `AddOn` type
- `/lib/data/addon-filtering.ts` - Update import to use cart.ts

---

## Naming Convention Standard

Going forward, use these standards for add-ons:

### Type Names
- ✅ `Addon` (from `/lib/types/cart.ts`)
- ❌ `AddOn` (from `/lib/types/checkout.ts`) - deprecated

### Field Names
- ✅ `price_cents` - Monetary values in cents
- ✅ `variant_id` - Product variant identifier
- ✅ `pricing_type` - Pricing model (per_booking, per_day, per_person)
- ❌ `price` - Do not use for monetary values

### Conversion Pattern
```typescript
// Always convert at display boundary
const displayPrice = addon.price_cents / 100;
const formatted = `$${displayPrice.toFixed(2)}`;
```

---

## Impact Assessment

### Files Changed
- 1 file modified: `TourAddOns.tsx`
- 4 code changes total

### Risk Level
- **Low** - Localized change, no breaking changes
- Type-safe fix with immediate error prevention

### Performance
- No performance impact
- Same runtime behavior, just correct data access

---

## Lessons Learned

### 1. Type System Fragmentation
**Problem**: Multiple type definitions for same entity
**Solution**: Establish single source of truth

### 2. Medusa Standards
**Problem**: Custom implementations not following Medusa patterns
**Solution**: Always consult Medusa docs before implementing

### 3. Type Safety Gaps
**Problem**: `any` types allowed mismatches through
**Solution**: Enable strict TypeScript, add validation

### 4. Documentation Gaps
**Problem**: No documented naming conventions
**Solution**: This document + update CLAUDE.md

---

## Recommendations

### Immediate (Completed)
- ✅ Fix TourAddOns.tsx type import
- ✅ Add cents-to-dollars conversion
- ✅ Use correct field name

### Short Term
1. Update `/lib/data/addon-filtering.ts` import
2. Add JSDoc comments documenting the correct type
3. Update development guidelines in CLAUDE.md

### Long Term
1. Consolidate type definitions to single source
2. Add runtime validation for price data
3. Create utility functions for price formatting
4. Add pre-commit hook to check for deprecated types

---

## References

### Documentation
- Medusa Pricing: https://docs.medusajs.com/resources/commerce-modules/pricing/price-calculation
- Medusa Store API: https://docs.medusajs.com/resources/storefront-development/products/price

### Related Files
- `/lib/types/cart.ts:60-77` - Correct Addon interface
- `/lib/types/checkout.ts:13-23` - Deprecated AddOn interface
- `/lib/data/addons-service.ts:111-127` - Data transformation
- `/lib/utils/pricing.ts` - Price formatting utilities

### Memory/Documentation
- Research findings: `/memory/swarm/addons-error-fix/medusa-pricing-docs`
- Data flow tests: `/memory/swarm/addons-error-fix/data-flow-tests`
- Naming analysis: `/memory/swarm/addons-error-fix/naming-consistency`

---

## Success Criteria

### Before Fix
- ❌ 4 runtime errors on tour pages
- ❌ Add-on prices showing as `$NaN`
- ❌ Type mismatch between service and component
- ❌ No cents-to-dollars conversion

### After Fix
- ✅ Zero runtime errors
- ✅ Correct price display (e.g., "$30.00")
- ✅ Type safety between service and component
- ✅ Proper Medusa pricing standard compliance

---

**Fix Completed**: November 9, 2025
**Implemented By**: Swarm coordination (4 agents)
**Verified By**: Test suite + runtime validation
**Status**: Production ready ✅
