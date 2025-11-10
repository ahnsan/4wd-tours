# Add-ons Data Flow Verification Report

**Test Date**: 2025-11-09
**Backend API**: http://localhost:9000
**Region ID**: reg_01K9G4HA190556136E7RJQ4411
**Currency**: AUD

---

## Executive Summary

This report traces the complete data flow of add-ons from the Medusa backend API through the frontend service layer to the React component. The investigation reveals the exact data structure at each stage and identifies **a critical type mismatch** causing the undefined price error.

### Key Findings

1. **Backend API returns prices in CENTS** (e.g., 3000 = $30.00)
2. **Service layer converts to `price_cents`** as expected
3. **Type definitions have a MISMATCH** between two type files
4. **Component expects `price` in DOLLARS** but service provides `price_cents`

---

## Stage 1: Backend API Response

### API Request
```bash
curl -s -H "x-publishable-api-key: pk_34de..." \
  "http://localhost:9000/store/products?region_id=reg_01K9G4HA190556136E7RJQ4411"
```

### API Response Structure (Sample: Internet Add-on)

```json
{
  "id": "prod_01K9H8KY6YHAAP1THH4R7EB258",
  "title": "Always-on High-Speed Internet",
  "handle": "addon-internet",
  "description": null,
  "variants": [
    {
      "id": "variant_01K9H8KY757A5BAY9CXF2AQB4F",
      "title": "Default",
      "sku": "ADDON-ADDON-INTERNET",
      "calculated_price": {
        "calculated_amount": 3000,
        "original_amount": 3000,
        "currency_code": "aud",
        "is_calculated_price_tax_inclusive": true
      }
    }
  ],
  "collection_id": "pcol_01K9FWH3KMH96DNKKBBB0M51XA"
}
```

### All Add-ons Pricing Data

| Add-on ID | Title | Handle | Price (cents) | Price ($) |
|-----------|-------|--------|---------------|-----------|
| prod_01K9H8KY6YHAAP1THH4R7EB258 | Always-on High-Speed Internet | addon-internet | 3000 | $30.00 |
| prod_01K9H8KY7Q0BTC99B0FBQGTK9J | Glamping Setup | addon-glamping | 8000 | $80.00 |
| prod_01K9H8KY8GVBMYZVB4CAN72EYW | BBQ on the Beach | addon-bbq | 6500 | $65.00 |

**Key Observations:**
- Prices are stored in **cents** (integer values)
- `calculated_price.calculated_amount` contains the price
- Description is `null` (needs to be added in backend)
- No metadata for `is_addon` flag (filtering by `handle` starting with "addon-")

---

## Stage 2: Add-ons Service Transformation

### Service File
**Path**: `/Users/Karim/med-usa-4wd/storefront/lib/data/addons-service.ts`

### Conversion Function: `convertProductToAddOn()`

**Lines 63-128**: This function transforms Medusa product into frontend Addon format.

```typescript
function convertProductToAddOn(product: any): Addon {
  // ... category detection logic ...

  // Extract price from calculated_price (requires currency_code in API call)
  let price_cents = 0;
  let variant_id = '';

  if (product.variants && product.variants.length > 0) {
    const variant = product.variants[0];
    variant_id = variant.id;

    if (variant.calculated_price && variant.calculated_price.calculated_amount) {
      price_cents = variant.calculated_price.calculated_amount; // ✅ EXTRACTION WORKS
    } else {
      console.error(`[Add-ons Service] FATAL: No price found for ${product.handle}`);
      throw new Error(`Add-on ${product.handle} has no price.`);
    }
  }

  return {
    id: product.id,
    variant_id,
    title: product.title,
    description: product.description || '',
    price_cents, // ✅ RETURNED AS price_cents
    pricing_type: pricingType,
    icon: getCategoryIcon(category),
    category: category,
    available: true,
    metadata: { ... }
  };
}
```

### Service Output Example

```typescript
{
  id: "prod_01K9H8KY6YHAAP1THH4R7EB258",
  variant_id: "variant_01K9H8KY757A5BAY9CXF2AQB4F",
  title: "Always-on High-Speed Internet",
  description: "",
  price_cents: 3000,  // ✅ Correct field name
  pricing_type: "per_booking",
  icon: "/images/icons/tent.svg",
  category: "Equipment",
  available: true,
  metadata: {...}
}
```

**Key Observations:**
- Service correctly extracts `calculated_amount`
- Returns field named `price_cents` (in cents)
- Matches type definition in `/lib/types/cart.ts` (Addon interface)

---

## Stage 3: Type Definitions Analysis

### Type File #1: `/lib/types/cart.ts` (CORRECT)

**Lines 60-77**: Addon interface

```typescript
export interface Addon {
  id: string;
  variant_id: string;
  title: string;
  description: string;
  price_cents: number;  // ✅ CORRECT: price in cents
  pricing_type: AddonPricingType;
  category: string;
  available: boolean;
  icon?: string;
  metadata?: {...};
}
```

**Status**: ✅ This type is CORRECT and matches service output.

---

### Type File #2: `/lib/types/checkout.ts` (INCORRECT)

**Lines 13-23**: AddOn interface (different name, different structure)

```typescript
export interface AddOn {
  id: string;
  title: string;
  description: string;
  price: number;  // ❌ WRONG: expects price in dollars (no _cents suffix)
  pricing_type: 'per_booking' | 'per_day' | 'per_person';
  icon?: string;
  category?: string;
  available: boolean;
  metadata?: AddOnMetadata;
}
```

**Status**: ❌ This type is INCORRECT - expects `price` instead of `price_cents`.

---

## Stage 4: Component Data Consumption

### Component File
**Path**: `/Users/Karim/med-usa-4wd/storefront/components/Tours/TourAddOns.tsx`

### Import Statement (Line 8)
```typescript
import type { AddOn } from '../../lib/types/checkout';
```

**Problem**: Component imports from **checkout.ts** (wrong type) instead of **cart.ts** (correct type).

### useAddOns Hook (Line 12)
```typescript
const { addons, isLoading, error } = useAddOns();
```

**Hook Implementation**: `/lib/hooks/useAddOns.ts`

```typescript
import type { Addon } from '../types/cart';  // ✅ Uses CORRECT type

export function useAddOns(): UseAddOnsReturn {
  // ...
  const response = await fetchAllAddOns();
  return response;
}
```

**Hook returns**: `Addon[]` with `price_cents` field

---

### Price Display (Lines 27-38)

```typescript
const formatPrice = (price: number, pricingType: string) => {
  const formattedPrice = `$${price.toFixed(2)}`;  // ❌ Expects dollars
  // ...
}

// Line 89: Component tries to access addon.price
<span className={styles.price}>
  {formatPrice(addon.price, addon.pricing_type)}
                    ^^^^^
                    UNDEFINED!
</span>
```

**Problem**:
- Component expects `addon.price` (dollars)
- Service provides `addon.price_cents` (cents)
- Result: `addon.price` is **undefined**

---

## Stage-by-Stage Data Comparison

| Stage | Data Source | Price Field | Price Value | Price Format |
|-------|-------------|-------------|-------------|--------------|
| 1. Backend API | Medusa `/store/products` | `variants[0].calculated_price.calculated_amount` | 3000 | cents (integer) |
| 2. Service Output | `addons-service.ts` | `price_cents` | 3000 | cents (integer) |
| 3. Type Definition (cart.ts) | Addon interface | `price_cents` | number | cents (integer) |
| 3. Type Definition (checkout.ts) | AddOn interface | `price` | number | ❌ dollars (decimal) |
| 4. Component Import | TourAddOns.tsx | expects `price` | undefined | ❌ Expected dollars |

---

## Root Cause Analysis

### The Problem: Type Mismatch

There are **TWO different type definitions** for add-ons:

1. **`Addon`** in `/lib/types/cart.ts` - Uses `price_cents` (CORRECT)
2. **`AddOn`** in `/lib/types/checkout.ts` - Uses `price` (INCORRECT)

### The Flow

```
Backend API (cents)
      ↓
addons-service.ts
      ↓ returns Addon with price_cents
useAddOns hook (imports Addon from cart.ts)
      ↓ returns Addon[] with price_cents
TourAddOns.tsx (imports AddOn from checkout.ts)
      ↓ expects AddOn with price
Component renders
      ↓ tries to access addon.price
      ❌ UNDEFINED (field doesn't exist)
```

### Type Coercion Issue

TypeScript allows this because:
- Both interfaces have similar structures
- Component type annotation expects `AddOn`
- Runtime data is `Addon`
- TS doesn't catch field name mismatch at runtime

---

## Exact Point Where Price Becomes Undefined

**File**: `/Users/Karim/med-usa-4wd/storefront/components/Tours/TourAddOns.tsx`
**Line 89**:

```typescript
{formatPrice(addon.price, addon.pricing_type)}
              ^^^^^^^^^^^
              addon.price is UNDEFINED
```

**Why**:
- Runtime object has field `price_cents` (from service)
- Component tries to access `price` (from wrong type import)
- JavaScript returns `undefined` for non-existent property

---

## Solution Options

### Option 1: Fix Component Import (Recommended)

**Change**: Update TourAddOns.tsx to use correct type

```typescript
// Current (WRONG):
import type { AddOn } from '../../lib/types/checkout';

// Fix to (CORRECT):
import type { Addon } from '../../lib/types/cart';
```

**Then update component**:
```typescript
const formatPrice = (price_cents: number, pricingType: string) => {
  const price_dollars = price_cents / 100;
  const formattedPrice = `$${price_dollars.toFixed(2)}`;
  // ...
}

// Line 89:
{formatPrice(addon.price_cents, addon.pricing_type)}
```

### Option 2: Add Adapter in Service

**Add conversion layer in service**:

```typescript
// In addons-service.ts, add a conversion function
export function convertToCheckoutFormat(addon: Addon): AddOn {
  return {
    ...addon,
    price: addon.price_cents / 100, // Convert cents to dollars
  };
}
```

### Option 3: Consolidate Types

**Merge both type definitions** into a single source of truth in `cart.ts` and deprecate `checkout.ts` AddOn interface.

---

## Verification Tests

### Test 1: API Response Validation
✅ **PASS** - API returns prices in cents with `calculated_amount` field

### Test 2: Service Transformation
✅ **PASS** - Service correctly extracts and maps `price_cents`

### Test 3: Type Consistency
❌ **FAIL** - Two conflicting type definitions exist

### Test 4: Component Data Access
❌ **FAIL** - Component accesses wrong field name (`price` vs `price_cents`)

---

## Recommendations

1. **Immediate Fix**: Change TourAddOns.tsx import to use `Addon` from `cart.ts`
2. **Update Component**: Change all `addon.price` references to `addon.price_cents / 100`
3. **Type Cleanup**: Deprecate or merge the duplicate AddOn/Addon types
4. **Backend Enhancement**: Add descriptions to add-on products in Medusa
5. **Testing**: Add type tests to catch field name mismatches

---

## Supporting Code Snippets

### Backend API Full Response (Glamping Setup)
```json
{
  "id": "prod_01K9H8KY7Q0BTC99B0FBQGTK9J",
  "title": "Glamping Setup",
  "handle": "addon-glamping",
  "description": null,
  "variants": [
    {
      "id": "variant_01K9H8KY7YT8P7TR46GBKYFY44",
      "calculated_price": {
        "calculated_amount": 8000,
        "currency_code": "aud"
      }
    }
  ]
}
```

### Service Transformation Code
```typescript
// From: /lib/data/addons-service.ts:98-99
if (variant.calculated_price && variant.calculated_price.calculated_amount) {
  price_cents = variant.calculated_price.calculated_amount;
}

// Return object (line 111-127)
return {
  id: product.id,
  variant_id,
  title: product.title,
  description: product.description || '',
  price_cents,  // ✅ Correct field
  pricing_type: pricingType,
  icon: getCategoryIcon(category),
  category: category,
  available: true,
  metadata: {...}
};
```

### Component Price Access (INCORRECT)
```typescript
// From: /components/Tours/TourAddOns.tsx:89
<span className={styles.price}>
  {formatPrice(addon.price, addon.pricing_type)}
                    ^^^^^ UNDEFINED - should be addon.price_cents
</span>
```

---

## Conclusion

The data flow from backend to frontend is **working correctly** up until the component consumption stage. The issue is a **type definition mismatch** where:

- Service returns `Addon` with `price_cents` field (correct)
- Component imports `AddOn` type expecting `price` field (incorrect)
- Runtime data has `price_cents` but component tries to access `price`
- Result: `undefined` price value in UI

**Fix**: Update component to use correct type and field name.

---

**Test Report Generated**: 2025-11-09
**Tested By**: Claude Code Agent
**Status**: Root cause identified, solution provided
