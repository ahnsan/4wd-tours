# Add-ons Service Design Document

**Version**: 1.0.0
**Date**: 2025-11-10
**Status**: Design Phase - Ready for Implementation

---

## Executive Summary

This document outlines the complete design for a new streamlined `addons.ts` service that will replace the current 781-line, 3-service architecture with a single 150-line service using the Medusa SDK directly.

**Key Metrics**:
- **Current**: 3 files, 781 lines, 3 transformation layers
- **Proposed**: 1 file, ~150 lines, 0 transformation layers
- **Reduction**: 81% code reduction, 100% transformation elimination

---

## 1. Architecture Overview

### Current Architecture (Problems)

```
┌─────────────────────────────────────────────────────────────┐
│ CURRENT (OVER-ENGINEERED)                                   │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  addons-service.ts (297 lines)                               │
│  ├─ fetchAllAddOns() - Custom fetch with transformations    │
│  ├─ fetchAddOnById() - Single addon fetching                │
│  ├─ convertProductToAddOn() - Manual transformation         │
│  └─ Custom type handling                                     │
│                                                               │
│  addon-flow-service.ts (287 lines)                           │
│  ├─ getAddonsByCategory() - Client-side grouping            │
│  ├─ getCategorySteps() - Multi-step wizard logic            │
│  ├─ Category metadata and copy                              │
│  └─ Step progression utilities                              │
│                                                               │
│  addon-filtering.ts (197 lines)                              │
│  ├─ isAddonApplicableToTour() - Client-side filtering       │
│  ├─ filterAddonsForTour() - Performance tracking            │
│  ├─ groupAddonsByCategory() - Duplicate grouping            │
│  └─ detectIncompatibleAddons() - Tour change detection      │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

### Proposed Architecture (Simplified)

```
┌─────────────────────────────────────────────────────────────┐
│ PROPOSED (MEDUSA BEST PRACTICES)                            │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  addons.ts (~150 lines)                                      │
│  ├─ Uses Medusa SDK directly (no custom fetch)              │
│  ├─ Server-side filtering (Medusa Query)                    │
│  ├─ No transformations (use Product type directly)          │
│  ├─ Standard cart operations                                │
│  └─ Simple utility functions                                │
│                                                               │
│  Benefits:                                                   │
│  ✅ 81% less code                                            │
│  ✅ No transformation layers                                 │
│  ✅ Server-side filtering (faster)                           │
│  ✅ Type-safe (Medusa SDK types)                             │
│  ✅ Easier to maintain                                       │
│  ✅ Follows official Medusa patterns                         │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. Function Specifications

### 2.1 Core Data Fetching

#### `fetchAddonsForTour(tourHandle: string, regionId: string): Promise<StoreProduct[]>`

**Purpose**: Fetch add-ons applicable to a specific tour using server-side filtering.

**Implementation Approach**:
```typescript
import { sdk } from '@/lib/data/medusa-client'
import type { HttpTypes } from '@medusajs/types'

export type Addon = HttpTypes.StoreProduct

export async function fetchAddonsForTour(
  tourHandle: string,
  regionId: string
): Promise<Addon[]> {
  try {
    // Use Medusa SDK's list method with built-in query filtering
    const { products } = await sdk.store.product.list({
      // Filter by collection
      collection_handle: 'add-ons',

      // Only published products
      status: 'published',

      // Region for pricing
      region_id: regionId,

      // SERVER-SIDE filtering using metadata
      // This eliminates need for client-side filtering service!
      metadata: {
        addon: true,
        $or: [
          { applicable_tours: { $contains: tourHandle } },
          { applicable_tours: { $contains: '*' } }
        ]
      },

      // Include pricing and variants
      fields: '+variants.calculated_price.*,+metadata'
    })

    return products
  } catch (error) {
    console.error('[Addons] Failed to fetch:', error)
    throw error
  }
}
```

**Medusa SDK Methods Used**:
- `sdk.store.product.list()` - Standard Medusa product listing
- Built-in query filtering (no custom filtering needed!)
- Automatic pricing calculation via `region_id`

**What This Eliminates**:
- ❌ Custom fetch logic (fetchWithTimeout, headers, etc.)
- ❌ Manual transformation (convertProductToAddOn)
- ❌ Client-side filtering (entire addon-filtering.ts)
- ❌ Custom type conversion (Product → Addon)

**Type Safety**: Uses `HttpTypes.StoreProduct` directly from Medusa SDK.

---

### 2.2 Data Organization

#### `groupByCategory(addons: Addon[]): Record<string, Addon[]>`

**Purpose**: Group add-ons by category for UI display.

**Implementation Approach**:
```typescript
export function groupByCategory(addons: Addon[]): Record<string, Addon[]> {
  return addons.reduce((groups, addon) => {
    // Use category from metadata (set by backend)
    const category = addon.metadata?.category as string || 'Other'

    if (!groups[category]) {
      groups[category] = []
    }

    groups[category].push(addon)
    return groups
  }, {} as Record<string, Addon[]>)
}
```

**Medusa SDK Methods Used**: None (pure utility function)

**What This Eliminates**:
- ❌ Duplicate grouping logic in addon-filtering.ts
- ❌ Category mapping and inference logic
- ❌ Custom category constants

---

### 2.3 Cart Operations

#### `addAddonToCart(cartId: string, variantId: string, quantity: number): Promise<HttpTypes.StoreCart>`

**Purpose**: Add an add-on to the cart using Medusa cart operations.

**Implementation Approach**:
```typescript
export async function addAddonToCart(
  cartId: string,
  variantId: string,
  quantity: number = 1
): Promise<HttpTypes.StoreCart> {
  const { cart } = await sdk.store.cart.addLineItem(cartId, {
    variant_id: variantId,
    quantity,
    metadata: {
      is_addon: true,
      // Additional context can be added here
    }
  })

  return cart
}
```

**Medusa SDK Methods Used**:
- `sdk.store.cart.addLineItem()` - Standard Medusa cart operation

**What This Eliminates**:
- ❌ Custom cart service integration
- ❌ Manual price calculation
- ❌ Custom metadata handling

---

#### `removeAddonFromCart(cartId: string, lineItemId: string): Promise<HttpTypes.StoreCart>`

**Purpose**: Remove an add-on from the cart.

**Implementation Approach**:
```typescript
export async function removeAddonFromCart(
  cartId: string,
  lineItemId: string
): Promise<HttpTypes.StoreCart> {
  const { cart } = await sdk.store.cart.deleteLineItem(cartId, lineItemId)
  return cart
}
```

**Medusa SDK Methods Used**:
- `sdk.store.cart.deleteLineItem()` - Standard Medusa cart operation

---

### 2.4 Price Utilities

#### `getAddonPrice(addon: Addon): PriceDisplay`

**Purpose**: Extract and format add-on price from Medusa product.

**Implementation Approach**:
```typescript
export interface PriceDisplay {
  amount: number           // Amount in cents
  currency: string         // Currency code (e.g., 'aud')
  formatted: string        // Formatted string (e.g., '$50.00')
}

export function getAddonPrice(addon: Addon): PriceDisplay {
  const variant = addon.variants?.[0]
  const price = variant?.calculated_price

  if (!price) {
    throw new Error(`No price for add-on ${addon.handle}`)
  }

  return {
    amount: price.calculated_amount,
    currency: price.currency_code,
    formatted: new Intl.NumberFormat('en-AU', {
      style: 'currency',
      currency: price.currency_code.toUpperCase()
    }).format(price.calculated_amount / 100)
  }
}
```

**Medusa SDK Methods Used**: None (pure utility function)

**What This Eliminates**:
- ❌ Custom price extraction logic
- ❌ Price validation and error handling complexity
- ❌ Currency code inference

---

#### `getPricingUnit(addon: Addon): 'per_booking' | 'per_day' | 'per_person'`

**Purpose**: Get pricing unit from add-on metadata.

**Implementation Approach**:
```typescript
export type PricingUnit = 'per_booking' | 'per_day' | 'per_person'

export function getPricingUnit(addon: Addon): PricingUnit {
  return (addon.metadata?.unit as PricingUnit) || 'per_booking'
}
```

**Medusa SDK Methods Used**: None (pure utility function)

---

## 3. Type Definitions

### Primary Types

```typescript
import type { HttpTypes } from '@medusajs/types'

// Use Medusa's StoreProduct type directly - no custom Addon type!
export type Addon = HttpTypes.StoreProduct

// Price display interface
export interface PriceDisplay {
  amount: number
  currency: string
  formatted: string
}

// Pricing unit type
export type PricingUnit = 'per_booking' | 'per_day' | 'per_person'
```

**What This Eliminates**:
- ❌ Custom `Addon` type in cart.ts
- ❌ Custom `CartAddon` type
- ❌ Custom `AddOnResponse`, `AddOnsResponse` types
- ❌ Type conversion utilities

---

## 4. Error Handling Strategy

### Principles

1. **Fail Fast**: Don't hide errors, surface them immediately
2. **Descriptive Messages**: Include context (tour handle, addon ID, etc.)
3. **Logged Errors**: All errors logged to console for debugging
4. **No Silent Failures**: Never return empty arrays without logging

### Implementation Pattern

```typescript
export async function fetchAddonsForTour(
  tourHandle: string,
  regionId: string
): Promise<Addon[]> {
  try {
    const { products } = await sdk.store.product.list({...})

    // Log success
    console.log(`[Addons] Fetched ${products.length} add-ons for ${tourHandle}`)

    return products
  } catch (error) {
    // Log detailed error
    console.error('[Addons] Failed to fetch:', {
      tourHandle,
      regionId,
      error: error instanceof Error ? error.message : 'Unknown error'
    })

    // Re-throw with context
    throw new Error(
      `Failed to fetch add-ons for tour "${tourHandle}": ${
        error instanceof Error ? error.message : 'Unknown error'
      }`
    )
  }
}
```

### Error Categories

1. **Network Errors**: SDK handles these, we just log and re-throw
2. **Invalid Data**: Validate and throw descriptive errors
3. **Missing Required Fields**: Fail fast with clear messages

---

## 5. What to Eliminate

### Files to Delete

1. **Services** (replaced by single addons.ts):
   - ❌ `lib/data/addons-service.ts` (297 lines)
   - ❌ `lib/data/addon-flow-service.ts` (287 lines)
   - ❌ `lib/data/addon-filtering.ts` (197 lines)

2. **Custom Types**:
   - ❌ Custom `Addon` type in `lib/types/cart.ts`
   - ❌ `CartAddon` type (use line items directly)
   - ❌ `AddOnResponse`, `AddOnsResponse` types

3. **Transformation Functions**:
   - ❌ `convertProductToAddOn()`
   - ❌ `getCategoryIcon()` (use metadata)
   - ❌ `getBackendHandleMap()`

4. **Client-Side Filtering**:
   - ❌ `isAddonApplicableToTour()`
   - ❌ `filterAddonsForTour()`
   - ❌ `detectIncompatibleAddons()`
   - ❌ `getAllTourHandlesFromAddons()`

5. **Multi-Step Flow Logic** (if using simple page):
   - ❌ `getCategorySteps()`
   - ❌ `getCategoryStep()`
   - ❌ `calculateProgress()`
   - ❌ `isValidStepIndex()`
   - ❌ Navigation helpers

### Code Patterns to Eliminate

1. **Custom Fetch Logic**:
```typescript
// ❌ ELIMINATE
async function fetchWithTimeout(url, options, timeout) {...}
const response = await fetchWithTimeout(...)
const data = await response.json()

// ✅ REPLACE WITH
const { products } = await sdk.store.product.list({...})
```

2. **Manual Transformations**:
```typescript
// ❌ ELIMINATE
function convertProductToAddOn(product: any): Addon {...}
const addons = products.map(convertProductToAddOn)

// ✅ REPLACE WITH
const { products } = await sdk.store.product.list({...})
// Use products directly - they're already the right type!
```

3. **Client-Side Filtering**:
```typescript
// ❌ ELIMINATE
const filtered = addons.filter(addon =>
  isAddonApplicableToTour(addon, tourHandle)
)

// ✅ REPLACE WITH
// Server-side filtering in SDK call:
const { products } = await sdk.store.product.list({
  metadata: {
    $or: [
      { applicable_tours: { $contains: tourHandle } },
      { applicable_tours: { $contains: '*' } }
    ]
  }
})
```

4. **Custom Headers and API Keys**:
```typescript
// ❌ ELIMINATE
function buildHeaders(): Record<string, string> {
  const headers = { 'Content-Type': 'application/json' }
  if (apiKey) headers['x-publishable-api-key'] = apiKey
  return headers
}

// ✅ REPLACE WITH
// SDK handles this automatically via medusa-client.ts config
```

---

## 6. Complete Service Structure

### File: `/lib/data/addons.ts` (~150 lines)

```typescript
/**
 * Add-ons Data Service
 *
 * Simplified service using Medusa SDK directly.
 * Follows Medusa best practices - no custom transformations.
 *
 * Official Docs: https://docs.medusajs.com/resources/storefront-development
 */

import { sdk } from '@/lib/data/medusa-client'
import type { HttpTypes } from '@medusajs/types'

// ============================================================================
// Type Definitions
// ============================================================================

export type Addon = HttpTypes.StoreProduct
export type PricingUnit = 'per_booking' | 'per_day' | 'per_person'

export interface PriceDisplay {
  amount: number
  currency: string
  formatted: string
}

// ============================================================================
// Core Functions
// ============================================================================

/**
 * Fetch add-ons for a specific tour
 * Uses server-side filtering via Medusa SDK
 */
export async function fetchAddonsForTour(
  tourHandle: string,
  regionId: string
): Promise<Addon[]> {
  try {
    const { products } = await sdk.store.product.list({
      collection_handle: 'add-ons',
      status: 'published',
      region_id: regionId,
      metadata: {
        addon: true,
        $or: [
          { applicable_tours: { $contains: tourHandle } },
          { applicable_tours: { $contains: '*' } }
        ]
      },
      fields: '+variants.calculated_price.*,+metadata'
    })

    console.log(`[Addons] Fetched ${products.length} add-ons for ${tourHandle}`)
    return products
  } catch (error) {
    console.error('[Addons] Failed to fetch:', { tourHandle, regionId, error })
    throw new Error(
      `Failed to fetch add-ons for tour "${tourHandle}": ${
        error instanceof Error ? error.message : 'Unknown error'
      }`
    )
  }
}

/**
 * Group add-ons by category
 */
export function groupByCategory(addons: Addon[]): Record<string, Addon[]> {
  return addons.reduce((groups, addon) => {
    const category = addon.metadata?.category as string || 'Other'
    if (!groups[category]) groups[category] = []
    groups[category].push(addon)
    return groups
  }, {} as Record<string, Addon[]>)
}

/**
 * Add add-on to cart
 */
export async function addAddonToCart(
  cartId: string,
  variantId: string,
  quantity: number = 1
): Promise<HttpTypes.StoreCart> {
  const { cart } = await sdk.store.cart.addLineItem(cartId, {
    variant_id: variantId,
    quantity,
    metadata: { is_addon: true }
  })

  return cart
}

/**
 * Remove add-on from cart
 */
export async function removeAddonFromCart(
  cartId: string,
  lineItemId: string
): Promise<HttpTypes.StoreCart> {
  const { cart } = await sdk.store.cart.deleteLineItem(cartId, lineItemId)
  return cart
}

/**
 * Get add-on price display
 */
export function getAddonPrice(addon: Addon): PriceDisplay {
  const variant = addon.variants?.[0]
  const price = variant?.calculated_price

  if (!price) {
    throw new Error(`No price for add-on ${addon.handle}`)
  }

  return {
    amount: price.calculated_amount,
    currency: price.currency_code,
    formatted: new Intl.NumberFormat('en-AU', {
      style: 'currency',
      currency: price.currency_code.toUpperCase()
    }).format(price.calculated_amount / 100)
  }
}

/**
 * Get pricing unit from metadata
 */
export function getPricingUnit(addon: Addon): PricingUnit {
  return (addon.metadata?.unit as PricingUnit) || 'per_booking'
}
```

**Total Lines**: ~150 lines (including comments and spacing)

---

## 7. Comparison: Before vs After

### Code Metrics

| Metric | Before | After | Change |
|--------|--------|-------|--------|
| Service Files | 3 | 1 | -67% |
| Total Lines | 781 | 150 | -81% |
| Custom Types | 5 | 2 | -60% |
| Transformation Layers | 3 | 0 | -100% |
| Custom Fetch Logic | Yes | No | ✅ Eliminated |
| Client-Side Filtering | Yes | No | ✅ Eliminated |

### Performance Impact

| Aspect | Before | After | Improvement |
|--------|--------|-------|-------------|
| Data Transfer | All add-ons | Filtered add-ons | Less data |
| Filtering | Client-side | Server-side | Faster |
| Type Safety | Custom types | Medusa SDK types | Better |
| Maintainability | High complexity | Low complexity | Much easier |

---

## 8. Migration Strategy

### Phase 1: Create New Service (Parallel)
1. Create `lib/data/addons.ts` with new implementation
2. Keep old files temporarily
3. Test new service in isolation

### Phase 2: Update Consumers
1. Update components to use new service
2. Update hooks to use new types
3. Test integration

### Phase 3: Remove Old Code
1. Delete old service files
2. Delete unused types
3. Delete transformation utilities
4. Run tests

---

## 9. Success Criteria

### Functional Requirements
- ✅ Add-ons display correctly for all tours
- ✅ Server-side filtering works
- ✅ Add to cart works
- ✅ Remove from cart works
- ✅ Pricing displays correctly
- ✅ All categories show correctly

### Non-Functional Requirements
- ✅ Code reduced by >60%
- ✅ Performance same or better
- ✅ No new bugs introduced
- ✅ Passes all automated tests
- ✅ Easier to maintain

---

## 10. Risk Assessment

### Low Risk
- **Server-side filtering**: Medusa Query supports this natively
- **SDK reliability**: Official Medusa SDK, well-tested
- **Type safety**: Using official Medusa types

### Mitigation
- Test with real data first
- Add metadata as needed
- Keep old code until fully validated

---

## 11. Next Steps

1. **Review this design** with team
2. **Create addons.ts** following this specification
3. **Test in isolation** with real backend data
4. **Update components** to use new service
5. **Remove old code** after validation
6. **Document patterns** for future reference

---

**End of Design Document**
