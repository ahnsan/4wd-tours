# Price Type Safety Enhancement (Optional)

## Overview

This document describes an optional type safety enhancement using TypeScript branded types to prevent price unit confusion.

## The Problem

Currently, prices are just `number` types, which can lead to mistakes:

```typescript
const priceDollars = 2000;
const priceCents = 200000;

// Both are just numbers - easy to mix up!
function displayPrice(price: number) {
  // Is this dollars or cents? We don't know!
  return `$${price}`;
}
```

## The Solution: Branded Types

Branded types use TypeScript's type system to distinguish between dollars and cents:

```typescript
// Brand types for compile-time safety
type PriceCents = number & { __brand: 'cents' };
type PriceDollars = number & { __brand: 'dollars' };

// Helper functions for safe conversion
function toCents(dollars: number): PriceCents {
  return Math.round(dollars * 100) as PriceCents;
}

function toDollars(cents: PriceCents): PriceDollars {
  return (cents / 100) as PriceDollars;
}

// Now the type system helps us!
function displayPrice(cents: PriceCents): string {
  const dollars = toDollars(cents);
  return `$${dollars.toFixed(2)}`;
}

// TypeScript will error if you pass dollars where cents are expected
const apiPrice = 2000; // dollars from API
displayPrice(apiPrice); // ❌ Error: number is not assignable to PriceCents
displayPrice(toCents(apiPrice)); // ✅ Correct
```

## Implementation Guide

### Step 1: Add Type Definitions

Add to `/lib/types/pricing.ts`:

```typescript
/**
 * Branded type for prices in cents
 * Prevents accidental mixing of dollar and cent values
 */
export type PriceCents = number & { __brand: 'cents' };

/**
 * Branded type for prices in dollars
 * Prevents accidental mixing of dollar and cent values
 */
export type PriceDollars = number & { __brand: 'dollars' };

/**
 * Convert dollars to cents with type safety
 */
export function toCents(dollars: number): PriceCents {
  return Math.round(dollars * 100) as PriceCents;
}

/**
 * Convert cents to dollars with type safety
 */
export function toDollars(cents: PriceCents): PriceDollars {
  return (cents / 100) as PriceDollars;
}

/**
 * Create a PriceCents from raw number (use with caution)
 */
export function asCents(cents: number): PriceCents {
  return cents as PriceCents;
}
```

### Step 2: Update Type Definitions

Update `/lib/types/cart.ts`:

```typescript
import type { PriceCents } from './pricing';

export interface Tour {
  id: string;
  variant_id: string;
  handle: string;
  title: string;
  description: string;
  base_price_cents: PriceCents;  // ← Now type-safe!
  duration_days: number;
  // ... rest of fields
}

export interface Addon {
  id: string;
  variant_id: string;
  title: string;
  price_cents: PriceCents;  // ← Now type-safe!
  pricing_type: AddonPricingType;
  // ... rest of fields
}

export interface CartAddon {
  addon: Addon;
  quantity: number;
  calculated_price_cents: PriceCents;  // ← Now type-safe!
  line_item_id?: string;
}
```

### Step 3: Update Conversion Functions

Update `/lib/utils/pricing.ts`:

```typescript
import { toCents, type PriceCents } from '@/lib/types/pricing';

export function getProductPrice(product: any): ProductPrice | null {
  if (product.variants && product.variants.length > 0) {
    const variant = product.variants[0];

    if (variant.calculated_price && variant.calculated_price.calculated_amount) {
      return {
        amount: toCents(variant.calculated_price.calculated_amount),  // ← Type-safe conversion
        currency_code: variant.calculated_price.currency_code || 'AUD',
      };
    }
  }
  // ... rest of function
}
```

### Step 4: Update Calculation Functions

Update `/lib/utils/priceCalculations.ts`:

```typescript
import type { PriceCents } from '@/lib/types/pricing';

export function calculateTourPrice(tour: Tour, participants: number): PriceCents {
  if (participants < 1) {
    throw new Error('Participants must be at least 1');
  }

  // TypeScript ensures tour.base_price_cents is PriceCents
  return (tour.base_price_cents * participants * tour.duration_days) as PriceCents;
}

export function calculateAddonPrice(
  addon: Addon,
  quantity: number,
  context: PriceCalculationContext
): PriceCents {
  // TypeScript ensures addon.price_cents is PriceCents
  const basePrice = addon.price_cents;

  switch (addon.pricing_type) {
    case 'per_booking':
      return (basePrice * quantity) as PriceCents;
    case 'per_day':
      return (basePrice * quantity * context.tour_duration_days) as PriceCents;
    case 'per_person':
      return (basePrice * quantity * context.participants) as PriceCents;
    default:
      throw new Error(`Unknown pricing type: ${addon.pricing_type}`);
  }
}
```

## Benefits

### 1. Compile-Time Safety

```typescript
// ❌ Error at compile time
const apiPriceDollars = 2000;
const tour: Tour = {
  base_price_cents: apiPriceDollars,  // Error: number not assignable to PriceCents
  // ...
};

// ✅ Correct
const tour: Tour = {
  base_price_cents: toCents(apiPriceDollars),  // OK
  // ...
};
```

### 2. Self-Documenting Code

```typescript
// Clear intention - this function works with cents
function calculateGST(priceCents: PriceCents): PriceCents {
  return Math.round(priceCents * 0.1) as PriceCents;
}

// Clear intention - this function works with dollars
function formatPrice(priceCents: PriceCents): string {
  const dollars = toDollars(priceCents);
  return `$${dollars.toFixed(2)}`;
}
```

### 3. IDE Autocomplete

TypeScript will show you exactly what unit is expected:

```typescript
// Hover over parameter shows: priceCents: PriceCents
calculateGST(???)  // IDE clearly shows this needs PriceCents
```

## Drawbacks

### 1. More Verbose

Every conversion requires explicit function calls:

```typescript
// Before
const price = amount * 100;

// After
const price = toCents(amount);
```

### 2. Type Casting in Calculations

Arithmetic operations lose the brand:

```typescript
const total: PriceCents = price1 + price2;  // Error: number not assignable to PriceCents
const total = (price1 + price2) as PriceCents;  // Need to cast
```

### 3. Migration Effort

Updating all existing code to use branded types requires:
- Updating all type definitions
- Adding type casts to calculations
- Updating function signatures
- Testing thoroughly

## Recommendation

**Use branded types if:**
- ✅ Starting a new project
- ✅ Team has strong TypeScript experience
- ✅ You want maximum compile-time safety
- ✅ You have time for thorough testing

**Skip branded types if:**
- ❌ Existing codebase is large
- ❌ Team prefers simpler code
- ❌ Naming conventions (e.g., `_cents` suffix) are sufficient
- ❌ Migration risk outweighs benefits

## Current Status

**NOT IMPLEMENTED** - This is an optional enhancement.

The current codebase uses:
- Clear naming conventions (`price_cents`, `tourTotalCents`)
- Comprehensive comments explaining units
- Strict use of `formatPrice()` for display

These provide adequate safety without the complexity of branded types.

## Future Consideration

If price-related bugs become frequent, consider implementing branded types:
1. Start with new code only
2. Gradually migrate existing code
3. Add runtime validation helpers
4. Update all tests

---

**See Also:**
- `/docs/pricing/PRICING-STANDARD-V2.md` - Main pricing standard
- `/lib/utils/pricing.ts` - Current implementation
- TypeScript Handbook: Branded Types
