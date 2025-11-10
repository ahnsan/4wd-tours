# Add-ons Bug Visualization - Side by Side Comparison

## The Problem in Pictures

### What the Service Provides vs What the Component Expects

```
┌───────────────────────────────────────────────────────────────────────┐
│                      ACTUAL DATA (from service)                       │
├───────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  {                                                                    │
│    id: "prod_01K9H8KY6YHAAP1THH4R7EB258",                            │
│    variant_id: "variant_01K9H8KY757A5BAY9CXF2AQB4F",                 │
│    title: "Always-on High-Speed Internet",                           │
│    description: "",                                                   │
│    price_cents: 3000,          ← THIS EXISTS ✅                       │
│    pricing_type: "per_booking",                                      │
│    category: "Equipment",                                            │
│    available: true,                                                  │
│    icon: "/images/icons/tent.svg"                                    │
│  }                                                                    │
│                                                                       │
│  Type: Addon (from /lib/types/cart.ts)                               │
└───────────────────────────────────────────────────────────────────────┘

                                    ↓
                          Component tries to access
                                    ↓

┌───────────────────────────────────────────────────────────────────────┐
│                    EXPECTED DATA (by component)                       │
├───────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  {                                                                    │
│    id: "prod_01K9H8KY6YHAAP1THH4R7EB258",                            │
│    title: "Always-on High-Speed Internet",                           │
│    description: "",                                                   │
│    price: ???,                     ← THIS DOESN'T EXIST ❌            │
│    pricing_type: "per_booking",                                      │
│    category: "Equipment",                                            │
│    available: true,                                                  │
│    icon: "/images/icons/tent.svg"                                    │
│  }                                                                    │
│                                                                       │
│  Type: AddOn (from /lib/types/checkout.ts)                           │
└───────────────────────────────────────────────────────────────────────┘

                                    ↓
                            addon.price = undefined
                                    ↓
                        formatPrice(undefined) → $NaN
```

---

## Code Execution Step-by-Step

### Step 1: Service Returns Data
```typescript
// File: /lib/data/addons-service.ts
function convertProductToAddOn(product: any): Addon {
  // ...
  return {
    id: product.id,
    variant_id,
    title: product.title,
    description: product.description || '',
    price_cents: 3000,  // ✅ Field created here
    pricing_type: pricingType,
    category: category,
    available: true,
    icon: getCategoryIcon(category)
  };
}
// Returns: Addon with price_cents field
```

### Step 2: Hook Passes Data Through
```typescript
// File: /lib/hooks/useAddOns.ts
import type { Addon } from '../types/cart';  // ✅ Correct type

export function useAddOns(): UseAddOnsReturn {
  const response = await fetchAllAddOns();
  return {
    addons: response.addons,  // Still has price_cents
    isLoading,
    error
  };
}
```

### Step 3: Component Receives Data
```typescript
// File: /components/Tours/TourAddOns.tsx
import type { AddOn } from '../../lib/types/checkout';  // ❌ WRONG TYPE!

export default function TourAddOns() {
  const { addons } = useAddOns();

  // addons runtime type: Addon[] (has price_cents)
  // addons declared type: AddOn[] (expects price)
  // TypeScript doesn't catch this!
}
```

### Step 4: Component Tries to Use Price
```typescript
// File: /components/Tours/TourAddOns.tsx (line 27-38)
const formatPrice = (price: number, pricingType: string) => {
  const formattedPrice = `$${price.toFixed(2)}`;
  //                             ^^^^^
  //                        undefined.toFixed(2)
  //                        TypeError!
  // ...
}

// Line 89:
{formatPrice(addon.price, addon.pricing_type)}
//           ^^^^^^^^^^^
//           addon.price = undefined
//           addon.price_cents = 3000 (but not accessed)
```

---

## Browser Console Output

### Current (Broken) State
```
🔴 Error in browser console:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TypeError: Cannot read property 'toFixed' of undefined
    at formatPrice (TourAddOns.tsx:28)
    at TourAddOns.tsx:89

Rendered output: $NaN
```

### After Fix
```
🟢 No errors:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[useAddOns] Loaded 3 add-ons from api (SWR)

Rendered output: $30.00
```

---

## Visual Field Comparison

### What Exists in Runtime Object

```javascript
const addon = {
  id: "prod_01K9H8KY6YHAAP1THH4R7EB258",
  variant_id: "variant_01K9H8KY757A5BAY9CXF2AQB4F",
  title: "Always-on High-Speed Internet",
  description: "",
  price_cents: 3000,          // ✅ THIS FIELD EXISTS
  pricing_type: "per_booking",
  icon: "/images/icons/tent.svg",
  category: "Equipment",
  available: true,
  metadata: {...}
};

// What works:
console.log(addon.price_cents);  // 3000 ✅
console.log(addon.price_cents / 100);  // 30 ✅

// What doesn't work:
console.log(addon.price);  // undefined ❌
console.log(addon.price / 100);  // NaN ❌
```

---

## The Fix - Before & After

### BEFORE (Broken Code)

```typescript
// ❌ WRONG TYPE IMPORT
import type { AddOn } from '../../lib/types/checkout';

export default function TourAddOns() {
  const { addons } = useAddOns();

  // ❌ WRONG PARAMETER NAME
  const formatPrice = (price: number, pricingType: string) => {
    // ❌ WRONG CALCULATION (price is undefined)
    const formattedPrice = `$${price.toFixed(2)}`;
    // ...
  };

  return (
    // ❌ WRONG FIELD ACCESS
    <span className={styles.price}>
      {formatPrice(addon.price, addon.pricing_type)}
    </span>
  );
}

// Result: $NaN ❌
```

### AFTER (Fixed Code)

```typescript
// ✅ CORRECT TYPE IMPORT
import type { Addon } from '../../lib/types/cart';

export default function TourAddOns() {
  const { addons } = useAddOns();

  // ✅ CORRECT PARAMETER NAME
  const formatPrice = (price_cents: number, pricingType: string) => {
    // ✅ CORRECT CALCULATION
    const price_dollars = price_cents / 100;
    const formattedPrice = `$${price_dollars.toFixed(2)}`;
    // ...
  };

  return (
    // ✅ CORRECT FIELD ACCESS
    <span className={styles.price}>
      {formatPrice(addon.price_cents, addon.pricing_type)}
    </span>
  );
}

// Result: $30.00 ✅
```

---

## Type Definition Side-by-Side

### cart.ts (CORRECT - Used by Service)
```typescript
export interface Addon {
  id: string;
  variant_id: string;      // ✅ Has variant_id
  title: string;
  description: string;
  price_cents: number;     // ✅ Uses price_cents (cents)
  pricing_type: AddonPricingType;
  category: string;        // ✅ Required
  available: boolean;
  icon?: string;
  metadata?: {
    max_quantity?: number;
    quantity_allowed?: boolean;
    recommended_for?: string[];
    tags?: string[];
  };
}
```

### checkout.ts (WRONG - Used by Component)
```typescript
export interface AddOn {
  id: string;
  // ❌ Missing variant_id
  title: string;
  description: string;
  price: number;           // ❌ Uses price (dollars?)
  pricing_type: 'per_booking' | 'per_day' | 'per_person';
  icon?: string;
  category?: string;       // ❌ Optional (should be required)
  available: boolean;
  metadata?: AddOnMetadata;
}
```

---

## Runtime vs Compile Time

### Why TypeScript Doesn't Catch This

```typescript
// The types are "compatible" because they share many fields
// TypeScript uses structural typing, not nominal typing

type Addon = { price_cents: number; title: string; id: string; ... };
type AddOn = { price: number; title: string; id: string; ... };

// These are considered compatible for assignment because:
// - Both have id, title, etc. (shared fields match)
// - price and price_cents are both "number"
// - TypeScript doesn't validate field NAMES at runtime

// So this passes type checking:
const addon: AddOn = getSomeAddon() as AddOn;
//                   ^^^^^^^^^^^^^^^^^^^^^^^^
//                   Returns Addon but cast to AddOn
//                   TypeScript allows it!

// But at runtime:
console.log(addon.price);  // undefined (field doesn't exist)
console.log(addon.price_cents);  // 3000 (field exists)
```

---

## Testing Matrix

### Test Case 1: Internet Add-on ($30.00)
```
API returns: calculated_amount = 3000
Service maps: price_cents = 3000
Component SHOULD display: $30.00
Component CURRENTLY displays: $NaN ❌
```

### Test Case 2: Glamping Setup ($80.00)
```
API returns: calculated_amount = 8000
Service maps: price_cents = 8000
Component SHOULD display: $80.00
Component CURRENTLY displays: $NaN ❌
```

### Test Case 3: BBQ on Beach ($65.00)
```
API returns: calculated_amount = 6500
Service maps: price_cents = 6500
Component SHOULD display: $65.00
Component CURRENTLY displays: $NaN ❌
```

---

## The Chain of Events

```
1. User visits page with TourAddOns component
          ↓
2. Component calls useAddOns() hook
          ↓
3. Hook calls fetchAllAddOns() from service
          ↓
4. Service fetches from API: GET /store/products
          ↓
5. API returns products with calculated_amount: 3000
          ↓
6. Service extracts: price_cents = 3000
          ↓
7. Service returns: Addon { price_cents: 3000 }
          ↓
8. Hook receives: Addon[]
          ↓
9. Component declares: addons as AddOn[] (wrong type)
          ↓
10. Component tries: addon.price (field doesn't exist)
          ↓
11. JavaScript returns: undefined
          ↓
12. formatPrice(undefined) called
          ↓
13. undefined.toFixed(2) throws error OR returns NaN
          ↓
14. Browser displays: $NaN
          ↓
15. User sees broken UI ❌
```

---

## Expected vs Actual

### Expected Behavior
```
Component renders:
┌────────────────────────────────┐
│  📶 Always-on High-Speed       │
│     Internet                   │
│                                │
│  Stay connected with...        │
│                                │
│  $30.00         [+ Add]        │
└────────────────────────────────┘
```

### Actual Behavior (Current)
```
Component renders:
┌────────────────────────────────┐
│  📶 Always-on High-Speed       │
│     Internet                   │
│                                │
│                                │
│                                │
│  $NaN           [+ Add]        │
└────────────────────────────────┘
          ^^^^^
        BROKEN!
```

---

## Summary

The bug is a **type import mismatch**:

- **Service provides**: `Addon` with `price_cents` field
- **Component expects**: `AddOn` with `price` field
- **Result**: Component tries to access non-existent field
- **Fix**: Change component to import and use correct type

**Total changes needed**: 3 lines
**Estimated fix time**: 2 minutes
**Impact**: Fixes all add-on pricing display issues

---

**Visualization Created**: 2025-11-09
**Bug Severity**: High (blocks feature)
**Fix Complexity**: Low (simple type correction)
