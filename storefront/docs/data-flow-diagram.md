# Add-ons Data Flow Diagram

## Visual Flow Chart

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         BACKEND (Medusa API)                             │
│  http://localhost:9000/store/products?region_id=reg_01K9G...            │
└──────────────────────────────────┬──────────────────────────────────────┘
                                   │
                                   │ Returns JSON:
                                   │ {
                                   │   variants: [{
                                   │     calculated_price: {
                                   │       calculated_amount: 3000  ← CENTS
                                   │     }
                                   │   }]
                                   │ }
                                   ↓
┌─────────────────────────────────────────────────────────────────────────┐
│                    SERVICE LAYER (addons-service.ts)                     │
│  /lib/data/addons-service.ts                                            │
│                                                                          │
│  convertProductToAddOn():                                               │
│  • Extracts variant.calculated_price.calculated_amount                  │
│  • Maps to: price_cents = 3000                                          │
│  • Returns: Addon { price_cents: 3000 }                                 │
└──────────────────────────────────┬──────────────────────────────────────┘
                                   │
                                   │ Returns Addon interface:
                                   │ {
                                   │   id: "prod_...",
                                   │   title: "Internet",
                                   │   price_cents: 3000,  ← CORRECT FIELD
                                   │   pricing_type: "per_booking"
                                   │ }
                                   ↓
┌─────────────────────────────────────────────────────────────────────────┐
│                      HOOK LAYER (useAddOns.ts)                          │
│  /lib/hooks/useAddOns.ts                                                │
│                                                                          │
│  import { Addon } from '../types/cart';  ← CORRECT TYPE                 │
│                                                                          │
│  Returns: {                                                             │
│    addons: Addon[],  ← Array of Addon with price_cents                  │
│    isLoading,                                                           │
│    error                                                                │
│  }                                                                      │
└──────────────────────────────────┬──────────────────────────────────────┘
                                   │
                                   │ Provides Addon[] to component
                                   │
                                   ↓
┌─────────────────────────────────────────────────────────────────────────┐
│                    COMPONENT (TourAddOns.tsx)                           │
│  /components/Tours/TourAddOns.tsx                                       │
│                                                                          │
│  import { AddOn } from '../../lib/types/checkout';  ← WRONG TYPE!       │
│                                    ^^^^^^^^                             │
│  const { addons } = useAddOns();                                        │
│                                                                          │
│  Runtime data: Addon { price_cents: 3000 }                              │
│  Expected type: AddOn { price: number }                                 │
│                                                                          │
│  Line 89:                                                               │
│  formatPrice(addon.price, ...)  ← UNDEFINED!                            │
│              ^^^^^^^^^^^            No such field                       │
│              Expected: addon.price_cents                                │
└─────────────────────────────────────────────────────────────────────────┘
```

## Type Mismatch Detail

```
┌──────────────────────────────────┐     ┌──────────────────────────────────┐
│  /lib/types/cart.ts (CORRECT)    │     │ /lib/types/checkout.ts (WRONG)   │
│                                  │     │                                  │
│  export interface Addon {        │     │ export interface AddOn {         │
│    id: string;                   │     │   id: string;                    │
│    variant_id: string;           │     │   title: string;                 │
│    title: string;                │     │   description: string;           │
│    description: string;          │     │   price: number;  ← WRONG!       │
│    price_cents: number; ← OK!    │     │   pricing_type: ...;             │
│    pricing_type: ...;            │     │   icon?: string;                 │
│    category: string;             │     │   category?: string;             │
│    available: boolean;           │     │   available: boolean;            │
│    icon?: string;                │     │ }                                │
│    metadata?: {...};             │     │                                  │
│  }                               │     │                                  │
│                                  │     │                                  │
│  Used by:                        │     │ Used by:                         │
│  ✅ addons-service.ts            │     │ ❌ TourAddOns.tsx                │
│  ✅ useAddOns.ts                 │     │ ❌ Wrong expectations            │
└──────────────────────────────────┘     └──────────────────────────────────┘
           │                                          │
           │                                          │
           │              MISMATCH!                   │
           │     Service provides: price_cents       │
           │     Component expects: price            │
           └──────────────────────────────────────────┘
```

## Data Transformation Chain

```
Stage 1: API Response
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
{
  variants[0].calculated_price.calculated_amount: 3000
}

         ↓ (convertProductToAddOn)

Stage 2: Service Output
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
{
  price_cents: 3000
}
Type: Addon (from cart.ts)

         ↓ (useAddOns hook)

Stage 3: Hook Return
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
{
  addons: [{
    price_cents: 3000
  }]
}
Type: Addon[] (from cart.ts)

         ↓ (Component consumption)

Stage 4: Component Access
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
addon.price  ← UNDEFINED!
      ^^^^^
Expected field from AddOn type (checkout.ts)
Actual field in data: price_cents
```

## Field Mapping Comparison

| Data Layer | Source File | Type Used | Price Field | Value | Unit |
|------------|-------------|-----------|-------------|-------|------|
| API | Medusa | - | calculated_amount | 3000 | cents |
| Service | addons-service.ts | Addon | price_cents | 3000 | cents |
| Hook | useAddOns.ts | Addon | price_cents | 3000 | cents |
| Component (Expected) | TourAddOns.tsx | AddOn | price | undefined | dollars |
| Component (Actual) | TourAddOns.tsx | Addon | price_cents | 3000 | cents |

## The Bug in Action

```typescript
// Component code (TourAddOns.tsx:27-38)
const formatPrice = (price: number, pricingType: string) => {
  const formattedPrice = `$${price.toFixed(2)}`;
  //                             ^^^^^
  //                             price is UNDEFINED
  //
  // Expected: price = 30.00 (dollars)
  // Actual: price = undefined
  // Available: price_cents = 3000 (cents)
  //
  // Result: $NaN
  switch (pricingType) {
    case 'per_day':
      return `${formattedPrice}/day`;
    case 'per_person':
      return `${formattedPrice}/person`;
    default:
      return formattedPrice;
  }
};

// Line 89 - Renders undefined
{formatPrice(addon.price, addon.pricing_type)}
//           ^^^^^^^^^^^
//           addon.price = undefined
//           addon.price_cents = 3000 (available but not accessed)
```

## Fix Visualization

```
BEFORE (BROKEN):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Component imports: AddOn (wrong type)
Component expects: addon.price (doesn't exist)
Runtime provides: addon.price_cents (ignored)
Result: undefined → $NaN


AFTER (FIXED):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Component imports: Addon (correct type)
Component expects: addon.price_cents (exists!)
Runtime provides: addon.price_cents = 3000
Conversion: price_cents / 100 = 30.00
Result: $30.00
```

## Solution Summary

```diff
  // TourAddOns.tsx

- import type { AddOn } from '../../lib/types/checkout';
+ import type { Addon } from '../../lib/types/cart';

- const formatPrice = (price: number, pricingType: string) => {
-   const formattedPrice = `$${price.toFixed(2)}`;
+ const formatPrice = (price_cents: number, pricingType: string) => {
+   const price_dollars = price_cents / 100;
+   const formattedPrice = `$${price_dollars.toFixed(2)}`;
    // ... rest of function
  }

  // Line 89:
- {formatPrice(addon.price, addon.pricing_type)}
+ {formatPrice(addon.price_cents, addon.pricing_type)}
```

---

**Diagram Generated**: 2025-11-09
**Root Cause**: Type import mismatch between cart.ts and checkout.ts
**Impact**: Component accesses non-existent field causing undefined price
**Solution**: Update component to use Addon type from cart.ts
