# Add-ons Naming Consistency Analysis Report

**Analysis Date:** 2025-11-09
**Objective:** Verify naming consistency across the entire add-ons journey from backend to frontend
**Error Source:** TourAddOns.tsx line 89 - undefined price field

---

## Executive Summary

**CRITICAL FINDING:** Major naming inconsistency identified between type definitions causing runtime errors.

### Severity: HIGH
- **Impact:** Runtime error in TourAddOns component preventing add-ons display
- **Root Cause:** Type definition mismatch between `checkout.ts` and `cart.ts`
- **Files Affected:** 2 type files, 1 component file

---

## 1. TYPE DEFINITION MISMATCHES

### 1.1 AddOn Interface Inconsistencies

#### **CRITICAL ISSUE:** Price Field Naming

**File:** `/Users/Karim/med-usa-4wd/storefront/lib/types/checkout.ts`
```typescript
export interface AddOn {
  id: string;
  title: string;
  description: string;
  price: number;                    // ❌ WRONG: Uses "price"
  pricing_type: 'per_booking' | 'per_day' | 'per_person';
  icon?: string;
  category?: string;
  available: boolean;
  metadata?: AddOnMetadata;
}
```

**File:** `/Users/Karim/med-usa-4wd/storefront/lib/types/cart.ts`
```typescript
export interface Addon {
  id: string;
  variant_id: string;               // ✅ CORRECT: Has variant_id
  title: string;
  description: string;
  price_cents: number;              // ✅ CORRECT: Uses "price_cents"
  pricing_type: AddonPricingType;
  category: string;
  available: boolean;
  icon?: string;
  metadata?: { ... };
}
```

**File:** `/Users/Karim/med-usa-4wd/storefront/components/Tours/TourAddOns.tsx`
```typescript
import type { AddOn } from '../../lib/types/checkout';  // ❌ WRONG TYPE

const formatPrice = (price: number, pricingType: string) => {
  const formattedPrice = `$${price.toFixed(2)}`;  // ❌ ERROR: price is undefined
  // ...
}

// Line 89: Called with addon.price which doesn't exist
{formatPrice(addon.price, addon.pricing_type)}  // ❌ RUNTIME ERROR
```

### 1.2 Naming Convention Analysis

| Layer | Type Name | Price Field | Variant ID Field | Case Convention |
|-------|-----------|-------------|------------------|-----------------|
| **checkout.ts** | `AddOn` | `price` | ❌ Missing | PascalCase |
| **cart.ts** | `Addon` | `price_cents` | `variant_id` | PascalCase |
| **addons-service.ts** | `Addon` (imports cart.ts) | `price_cents` | `variant_id` | snake_case fields |
| **addon-filtering.ts** | `AddOn` (imports checkout.ts) | `price` | ❌ Missing | snake_case fields |
| **addon-flow-service.ts** | `Addon` (imports cart.ts) | `price_cents` | `variant_id` | snake_case fields |
| **useAddOns hook** | `Addon` (imports cart.ts) | `price_cents` | `variant_id` | snake_case fields |

---

## 2. DATA FLOW ANALYSIS

### 2.1 Backend → Frontend Price Field Flow

```
┌─────────────────────────────────────────────────────────────────┐
│ MEDUSA BACKEND (Correct)                                        │
├─────────────────────────────────────────────────────────────────┤
│ Product Variant Response:                                       │
│   {                                                              │
│     id: "variant_xxx",                                          │
│     calculated_price: {                                         │
│       calculated_amount: 5000,  // cents                        │
│       currency_code: "AUD"                                      │
│     }                                                            │
│   }                                                              │
└────────────────────┬────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────────┐
│ ADDONS-SERVICE.TS (Correct)                                     │
├─────────────────────────────────────────────────────────────────┤
│ convertProductToAddOn():                                         │
│   price_cents = variant.calculated_price.calculated_amount       │
│   return {                                                       │
│     id: product.id,                                             │
│     variant_id: variant.id,        ✅ CORRECT                   │
│     price_cents: price_cents,       ✅ CORRECT                   │
│     pricing_type: pricingType       ✅ CORRECT                   │
│   }                                                              │
│ Returns: Addon (from cart.ts)                                   │
└────────────────────┬────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────────┐
│ USEADDONS HOOK (Correct)                                        │
├─────────────────────────────────────────────────────────────────┤
│ import type { Addon } from '../types/cart';  ✅ CORRECT         │
│ Returns: Addon[]                                                 │
└────────────────────┬────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────────┐
│ TOURADDONS COMPONENT (INCORRECT!)                               │
├─────────────────────────────────────────────────────────────────┤
│ import type { AddOn } from '../../lib/types/checkout';          │
│                                  ❌ WRONG TYPE!                 │
│ const { addons } = useAddOns();  // Returns Addon[]              │
│ // But typed as AddOn[]                                         │
│                                                                  │
│ formatPrice(addon.price, addon.pricing_type)                    │
│              ^^^^^^^^^^^                                         │
│              ❌ ERROR: addon.price is undefined                 │
│              ✅ SHOULD BE: addon.price_cents                    │
└─────────────────────────────────────────────────────────────────┘
```

### 2.2 Field Name Transformations

```
Backend API          →  Service Layer      →  Type Definition    →  Component
─────────────────────────────────────────────────────────────────────────────
calculated_amount    →  price_cents        →  price_cents        →  price ❌
(variant.calculated_    (Addon interface)     (cart.ts)             (checkout.ts)
 _price.calculated_
 _amount)
```

---

## 3. FILE-BY-FILE ANALYSIS

### 3.1 Type Definitions

#### `/Users/Karim/med-usa-4wd/storefront/lib/types/checkout.ts`
**Status:** ⚠️ OUTDATED - Should not be used for add-ons
**Issues:**
- ❌ Uses `price` instead of `price_cents`
- ❌ Missing `variant_id` field (required for Medusa cart operations)
- ❌ Inconsistent with backend data structure
**Usage:** Used by `addon-filtering.ts` and `TourAddOns.tsx`
**Recommendation:** DEPRECATE for add-ons, replace with `cart.ts` Addon type

#### `/Users/Karim/med-usa-4wd/storefront/lib/types/cart.ts`
**Status:** ✅ CORRECT - Aligned with Medusa backend
**Features:**
- ✅ Uses `price_cents` (matches backend cents convention)
- ✅ Has `variant_id` (required for cart operations)
- ✅ Matches `addons-service.ts` output
**Usage:** Used by `addons-service.ts`, `addon-flow-service.ts`, `useAddOns.ts`
**Recommendation:** Use this as the SINGLE SOURCE OF TRUTH

### 3.2 Service Layer

#### `/Users/Karim/med-usa-4wd/storefront/lib/data/addons-service.ts`
**Status:** ✅ CORRECT
**Analysis:**
```typescript
// Line 90: Comment correctly identifies field name
// Extract price from calculated_price (requires currency_code in API call)

// Lines 98-99: Correctly extracts price
if (variant.calculated_price && variant.calculated_price.calculated_amount) {
  price_cents = variant.calculated_price.calculated_amount;  // ✅ CORRECT
}

// Lines 111-127: Correctly returns Addon type
return {
  id: product.id,
  variant_id,           // ✅ CORRECT
  price_cents,          // ✅ CORRECT
  pricing_type,         // ✅ CORRECT
  // ...
};
```

#### `/Users/Karim/med-usa-4wd/storefront/lib/data/addon-filtering.ts`
**Status:** ⚠️ TYPE MISMATCH
**Issues:**
```typescript
// Line 10: Imports wrong type
import type { AddOn } from '../types/checkout';  // ❌ SHOULD BE: Addon from cart.ts
```
**Impact:** Low (filtering logic doesn't use price fields)

#### `/Users/Karim/med-usa-4wd/storefront/lib/data/addon-flow-service.ts`
**Status:** ✅ CORRECT
**Analysis:**
```typescript
// Line 11: Correct import with explanatory comment
// CRITICAL FIX: Use Addon from cart.ts (has variant_id), not AddOn from checkout.ts
import type { Addon } from '../types/cart';  // ✅ CORRECT

// Line 127: Type annotation reinforces correct type
addons: Addon[]; // Use Addon from cart.ts (has variant_id)
```

### 3.3 Frontend Components

#### `/Users/Karim/med-usa-4wd/storefront/components/Tours/TourAddOns.tsx`
**Status:** ❌ CRITICAL ERROR
**Lines 8, 23, 89:**
```typescript
// Line 8: WRONG TYPE IMPORT
import type { AddOn } from '../../lib/types/checkout';  // ❌ ERROR

// Line 23: Function expects price but receives addon with price_cents
const handleAddToCart = (addon: AddOn) => {  // ❌ WRONG TYPE
  addAddOn(addon, 1);
};

// Line 27-38: formatPrice function
const formatPrice = (price: number, pricingType: string) => {
  const formattedPrice = `$${price.toFixed(2)}`;  // ❌ ERROR: price is undefined
  // ...
}

// Line 89: RUNTIME ERROR
{formatPrice(addon.price, addon.pricing_type)}
              ^^^^^^^^^^^
              undefined - addon has price_cents, not price
```

**Fix Required:**
```typescript
// SHOULD BE:
import type { Addon } from '../../lib/types/cart';

const formatPrice = (price_cents: number, pricingType: string) => {
  const price_dollars = price_cents / 100;
  const formattedPrice = `$${price_dollars.toFixed(2)}`;
  // ...
}

{formatPrice(addon.price_cents, addon.pricing_type)}
```

#### `/Users/Karim/med-usa-4wd/storefront/app/checkout/add-ons/page.tsx`
**Status:** ✅ CORRECT
**Analysis:**
```typescript
// Line 12: Correct import
import type { Addon } from '../../../lib/types/cart';  // ✅ CORRECT

// Line 282: Correctly uses price_cents
sorted.sort((a, b) => a.price_cents - b.price_cents);  // ✅ CORRECT
```

#### `/Users/Karim/med-usa-4wd/storefront/app/checkout/add-ons-flow/page.tsx`
**Status:** ✅ CORRECT
**Analysis:**
```typescript
// Lines 17-18: Correct import with comment
// CRITICAL FIX: Use Addon from cart.ts (has variant_id), not AddOn from checkout.ts
import type { Addon } from '../../../lib/types/cart';  // ✅ CORRECT

// Line 208: Correctly uses price_cents
price_cents: addon.price_cents  // ✅ CORRECT
```

### 3.4 Hooks

#### `/Users/Karim/med-usa-4wd/storefront/lib/hooks/useAddOns.ts`
**Status:** ✅ CORRECT
**Analysis:**
```typescript
// Line 6: Correct import
import type { Addon } from '../types/cart';  // ✅ CORRECT

// Lines 18-24: Correct return type
interface UseAddOnsReturn {
  addons: Addon[];  // ✅ CORRECT
  // ...
}
```

---

## 4. NAMING CONVENTION SUMMARY

### 4.1 Price Field Naming

| Field Name | Location | Status | Usage |
|------------|----------|--------|-------|
| `calculated_amount` | Medusa API response | ✅ Correct | Backend only |
| `price_cents` | cart.ts, addons-service.ts | ✅ Correct | **STANDARD** |
| `price` | checkout.ts | ❌ Wrong | DEPRECATED |
| `calculated_price_cents` | CartAddon type | ✅ Correct | After calculation |

### 4.2 Type Name Conventions

| Type Name | File | Case | Status |
|-----------|------|------|--------|
| `Addon` | cart.ts | PascalCase | ✅ STANDARD |
| `AddOn` | checkout.ts | PascalCase | ❌ DEPRECATED |
| `CartAddon` | cart.ts | PascalCase | ✅ CORRECT |

### 4.3 Field Naming Patterns

**Consistent Pattern (Recommended):**
```typescript
// All monetary values in cents with _cents suffix
price_cents: number;
calculated_price_cents: number;
tour_total_cents: number;
addons_total_cents: number;
subtotal_cents: number;
tax_cents: number;
total_cents: number;

// All IDs with _id suffix
variant_id: string;
addon_id: string;
tour_id: string;
cart_id: string;
line_item_id: string;

// All types with _type suffix
pricing_type: AddonPricingType;

// Boolean availability
available: boolean;
```

---

## 5. DISCREPANCIES FOUND

### 5.1 Critical Issues

1. **TourAddOns.tsx Type Mismatch**
   - **File:** `/Users/Karim/med-usa-4wd/storefront/components/Tours/TourAddOns.tsx`
   - **Issue:** Imports `AddOn` from `checkout.ts` instead of `Addon` from `cart.ts`
   - **Impact:** Runtime error - `addon.price` is undefined
   - **Line:** 8, 23, 89
   - **Severity:** CRITICAL

2. **addon-filtering.ts Type Mismatch**
   - **File:** `/Users/Karim/med-usa-4wd/storefront/lib/data/addon-filtering.ts`
   - **Issue:** Imports `AddOn` from `checkout.ts` instead of `Addon` from `cart.ts`
   - **Impact:** Low (doesn't use price fields)
   - **Line:** 10
   - **Severity:** MEDIUM

### 5.2 Minor Inconsistencies

1. **Type Name Capitalization**
   - `Addon` (cart.ts) vs `AddOn` (checkout.ts)
   - Recommendation: Use `Addon` consistently

2. **Missing variant_id in checkout.ts**
   - checkout.ts `AddOn` doesn't have `variant_id`
   - Required for Medusa cart operations

---

## 6. RECOMMENDED STANDARDIZED NAMING CONVENTION

### 6.1 Single Source of Truth

**PRIMARY TYPE:** `/Users/Karim/med-usa-4wd/storefront/lib/types/cart.ts`

```typescript
// ✅ USE THIS EVERYWHERE
export interface Addon {
  id: string;              // Medusa product ID
  variant_id: string;      // Medusa variant ID (required for cart operations)
  title: string;
  description: string;
  price_cents: number;     // Base price in cents
  pricing_type: AddonPricingType;
  category: string;
  available: boolean;
  icon?: string;
  metadata?: { ... };
}

export interface CartAddon {
  addon: Addon;
  quantity: number;
  calculated_price_cents: number;  // Calculated based on pricing rules
  line_item_id?: string;
}
```

### 6.2 Naming Standards

**Monetary Values:**
- Always use `_cents` suffix
- Store as integers (cents)
- Format: `price_cents`, `total_cents`, `calculated_price_cents`

**IDs:**
- Always use `_id` suffix
- Format: `variant_id`, `addon_id`, `tour_id`, `cart_id`

**Types:**
- Use `_type` suffix for type discriminators
- Format: `pricing_type`, `payment_type`

**Boolean Flags:**
- Use adjectives without prefix
- Format: `available`, `active`, `enabled`

**Timestamps:**
- Use past tense with `_at` suffix
- Format: `created_at`, `updated_at`, `synced_at`

---

## 7. FILES REQUIRING UPDATES

### 7.1 Critical Updates (IMMEDIATE)

1. **`/Users/Karim/med-usa-4wd/storefront/components/Tours/TourAddOns.tsx`**
   - **Change:** Line 8: Import `Addon` from `cart.ts` instead of `AddOn` from `checkout.ts`
   - **Change:** Line 23: Update type annotation `addon: Addon`
   - **Change:** Line 27: Update function signature `formatPrice(price_cents: number, ...)`
   - **Change:** Line 89: Call with `formatPrice(addon.price_cents, ...)`
   - **Priority:** CRITICAL - Fixes runtime error

### 7.2 High Priority Updates

2. **`/Users/Karim/med-usa-4wd/storefront/lib/data/addon-filtering.ts`**
   - **Change:** Line 10: Import `Addon` from `cart.ts` instead of `AddOn` from `checkout.ts`
   - **Priority:** HIGH - Type consistency

### 7.3 Deprecation

3. **`/Users/Karim/med-usa-4wd/storefront/lib/types/checkout.ts`**
   - **Action:** Add deprecation notice for `AddOn` interface
   - **Action:** Update comments to redirect to `cart.ts`
   - **Priority:** MEDIUM - Documentation

```typescript
/**
 * @deprecated Use Addon from '../types/cart' instead
 * This type is outdated and missing required fields (variant_id, price_cents)
 */
export interface AddOn {
  // ...
}
```

---

## 8. DATA FLOW DIAGRAM

```
┌──────────────────────────────────────────────────────────────────────┐
│ MEDUSA BACKEND                                                        │
│ ┌──────────────────────────────────────────────────────────────────┐ │
│ │ Product API Response                                              │ │
│ │ {                                                                 │ │
│ │   id: "prod_xxx",                                                 │ │
│ │   handle: "addon-glamping",                                       │ │
│ │   variants: [{                                                    │ │
│ │     id: "variant_xxx",                                            │ │
│ │     calculated_price: {                                           │ │
│ │       calculated_amount: 5000,  // cents                          │ │
│ │       currency_code: "AUD"                                        │ │
│ │     }                                                              │ │
│ │   }]                                                               │ │
│ │ }                                                                 │ │
│ └──────────────────────────────────────────────────────────────────┘ │
└──────────────────────────┬───────────────────────────────────────────┘
                           │
                           ▼
┌──────────────────────────────────────────────────────────────────────┐
│ SERVICE LAYER                                                         │
│ ┌──────────────────────────────────────────────────────────────────┐ │
│ │ addons-service.ts                                                 │ │
│ │ convertProductToAddOn()                                           │ │
│ │                                                                   │ │
│ │ Extract:                                                          │ │
│ │   price_cents = variant.calculated_price.calculated_amount        │ │
│ │   variant_id = variant.id                                         │ │
│ │                                                                   │ │
│ │ Return Type: Addon (from cart.ts) ✅                              │ │
│ │ {                                                                 │ │
│ │   id: "prod_xxx",                                                 │ │
│ │   variant_id: "variant_xxx",                                      │ │
│ │   price_cents: 5000,                                              │ │
│ │   pricing_type: "per_day"                                         │ │
│ │ }                                                                 │ │
│ └──────────────────────────────────────────────────────────────────┘ │
└──────────────────────────┬───────────────────────────────────────────┘
                           │
                           ▼
┌──────────────────────────────────────────────────────────────────────┐
│ HOOKS LAYER                                                           │
│ ┌──────────────────────────────────────────────────────────────────┐ │
│ │ useAddOns.ts                                                      │ │
│ │                                                                   │ │
│ │ Import: Addon from '../types/cart' ✅                             │ │
│ │                                                                   │ │
│ │ Return: {                                                         │ │
│ │   addons: Addon[],  // Array of Addon type from cart.ts          │ │
│ │   isLoading,                                                      │ │
│ │   error                                                           │ │
│ │ }                                                                 │ │
│ └──────────────────────────────────────────────────────────────────┘ │
└──────────────┬────────────────────────────────┬───────────────────────┘
               │                                │
               ▼                                ▼
┌──────────────────────────────┐  ┌────────────────────────────────────┐
│ COMPONENT (CORRECT)          │  │ COMPONENT (ERROR)                  │
│ ┌──────────────────────────┐ │  │ ┌────────────────────────────────┐ │
│ │ add-ons/page.tsx         │ │  │ │ TourAddOns.tsx                 │ │
│ │                          │ │  │ │                                │ │
│ │ Import: Addon ✅         │ │  │ │ Import: AddOn ❌               │ │
│ │   from cart.ts           │ │  │ │   from checkout.ts             │ │
│ │                          │ │  │ │                                │ │
│ │ Usage:                   │ │  │ │ Usage:                         │ │
│ │   addon.price_cents ✅   │ │  │ │   addon.price ❌ UNDEFINED!    │ │
│ │   addon.variant_id ✅    │ │  │ │   addon.variant_id ❌ N/A      │ │
│ └──────────────────────────┘ │  │ └────────────────────────────────┘ │
└──────────────────────────────┘  └────────────────────────────────────┘
```

---

## 9. SPECIFIC FIXES REQUIRED

### Fix 1: TourAddOns.tsx (CRITICAL)

**File:** `/Users/Karim/med-usa-4wd/storefront/components/Tours/TourAddOns.tsx`

**Current Code (Lines 1-89):**
```typescript
import type { AddOn } from '../../lib/types/checkout';  // ❌ WRONG

const handleAddToCart = (addon: AddOn) => {  // ❌ WRONG TYPE
  addAddOn(addon, 1);
};

const formatPrice = (price: number, pricingType: string) => {
  const formattedPrice = `$${price.toFixed(2)}`;  // ❌ price is undefined
  // ...
}

{formatPrice(addon.price, addon.pricing_type)}  // ❌ RUNTIME ERROR
```

**Fixed Code:**
```typescript
import type { Addon } from '../../lib/types/cart';  // ✅ CORRECT

const handleAddToCart = (addon: Addon) => {  // ✅ CORRECT TYPE
  addAddOn(addon, 1);
};

const formatPrice = (price_cents: number, pricingType: string) => {
  const price_dollars = price_cents / 100;  // ✅ Convert cents to dollars
  const formattedPrice = `$${price_dollars.toFixed(2)}`;
  // ...
}

{formatPrice(addon.price_cents, addon.pricing_type)}  // ✅ CORRECT
```

### Fix 2: addon-filtering.ts

**File:** `/Users/Karim/med-usa-4wd/storefront/lib/data/addon-filtering.ts`

**Current Code (Line 10):**
```typescript
import type { AddOn } from '../types/checkout';  // ❌ WRONG
```

**Fixed Code:**
```typescript
import type { Addon } from '../types/cart';  // ✅ CORRECT
```

**Update all function signatures:**
```typescript
// Before
export function isAddonApplicableToTour(addon: AddOn, tourHandle: string): boolean

// After
export function isAddonApplicableToTour(addon: Addon, tourHandle: string): boolean
```

### Fix 3: checkout.ts Deprecation Notice

**File:** `/Users/Karim/med-usa-4wd/storefront/lib/types/checkout.ts`

**Add to top of AddOn interface:**
```typescript
/**
 * @deprecated Use Addon from './cart' instead
 *
 * This AddOn interface is outdated and incompatible with the Medusa backend.
 * It's missing required fields (variant_id) and uses incorrect naming (price vs price_cents).
 *
 * Migration:
 * - Replace `AddOn` imports with `Addon` from './cart'
 * - Update `addon.price` to `addon.price_cents`
 * - Ensure conversion from cents to dollars for display: `price_cents / 100`
 *
 * See: /Users/Karim/med-usa-4wd/storefront/lib/types/cart.ts
 */
export interface AddOn {
  // ... existing code
}
```

---

## 10. VERIFICATION CHECKLIST

After fixes are applied, verify:

- [ ] TourAddOns.tsx imports `Addon` from `cart.ts`
- [ ] TourAddOns.tsx uses `addon.price_cents` not `addon.price`
- [ ] TourAddOns.tsx converts cents to dollars before display
- [ ] addon-filtering.ts imports `Addon` from `cart.ts`
- [ ] All function signatures updated to use `Addon` type
- [ ] checkout.ts has deprecation notices
- [ ] No TypeScript errors in affected files
- [ ] Runtime test: TourAddOns component renders prices correctly
- [ ] Runtime test: Add-ons can be added to cart
- [ ] Price displays match expected values (cents / 100)

---

## 11. CONCLUSION

### Key Findings

1. **Root Cause:** Type definition mismatch between `checkout.ts` (deprecated) and `cart.ts` (current)
2. **Primary Error:** TourAddOns.tsx imports wrong type and accesses non-existent `price` field
3. **Impact:** Runtime error preventing add-ons display in TourAddOns component
4. **Scope:** 2 files need critical updates, 1 file needs deprecation notice

### Recommended Actions

**IMMEDIATE (Priority 1):**
1. Fix TourAddOns.tsx import and field access
2. Update addon-filtering.ts import

**SHORT-TERM (Priority 2):**
3. Add deprecation notices to checkout.ts
4. Audit all files for `AddOn` vs `Addon` imports
5. Update any remaining references to deprecated type

**LONG-TERM (Priority 3):**
6. Consider removing checkout.ts `AddOn` type entirely
7. Consolidate all add-on types in cart.ts
8. Add linting rules to prevent import from deprecated types

### Success Criteria

- ✅ No runtime errors in TourAddOns component
- ✅ Prices display correctly (formatted from cents)
- ✅ All TypeScript type checks pass
- ✅ Consistent type imports across codebase
- ✅ Single source of truth for add-on types (cart.ts)

---

**Analysis Complete**
**Next Steps:** Apply fixes in order of priority, then run verification checklist
