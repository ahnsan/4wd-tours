# Medusa Pricing & Add-ons Best Practices - Research Findings

**Date:** 2025-11-09
**Task:** Research Medusa pricing documentation to fix price.toFixed error
**Status:** Complete

---

## Executive Summary

This research reveals a **critical type mismatch** between Medusa API response structure and our frontend implementation. The Medusa API returns price data in a nested `calculated_price` object with price values in **cents (integers)**, while our frontend code expects a direct `price` property as a **number (dollars)**.

### Root Cause of price.toFixed Error

**The Error:**
```
TypeError: Cannot read properties of undefined (reading 'toFixed')
```

**The Problem:**
- AddOnSummary.tsx (line 55-57) calls `addon.price.toFixed(2)`
- AddOnDrawer.tsx (line 218, 253) calls `price.toFixed(2)`
- The `AddOn` interface in `lib/types/checkout.ts` defines `price: number`
- However, **Medusa v2 does NOT return a `price` field directly**

---

## 1. Medusa Pricing Structure (Official Documentation)

### 1.1 Correct Field Names for Product Prices

According to Medusa documentation and our codebase analysis:

**Primary Price Fields (Medusa v2):**
- `calculated_price` - Object containing the calculated price for the current context
- `calculated_price.calculated_amount` - **The actual price in CENTS (integer)**
- `calculated_price.original_amount` - Original price before any price lists in CENTS
- `calculated_price.currency_code` - Currency code (e.g., "AUD")
- `calculated_price.price_list_type` - Type of price list applied (e.g., "sale")

**With Tax Context:**
- `calculated_price.calculated_amount_with_tax` - Price including taxes
- `calculated_price.calculated_amount_without_tax` - Price excluding taxes
- `calculated_price.is_calculated_price_tax_inclusive` - Boolean indicating if price includes tax

**Legacy Format (Medusa v1):**
- `variants[0].prices[0].amount` - Price in cents
- `variants[0].prices[0].currency_code` - Currency code

### 1.2 Required Query Parameters

To retrieve pricing information, you MUST include:

```typescript
// For storefront API calls
const queryParams = {
  region_id: 'reg_01K9G4HA190556136E7RJQ4411', // Or currency_code
  fields: '*variants.calculated_price' // CRITICAL: Must request calculated_price
};
```

**Example API URL:**
```
GET /store/products?region_id=reg_01K9G4HA190556136E7RJQ4411&fields=*variants.calculated_price
```

---

## 2. How to Safely Access Price Data

### 2.1 Correct Access Pattern (From Our Codebase)

**File:** `/lib/data/addons-service.ts` (lines 98-103)

```typescript
// ✅ CORRECT: Safe nested access with error handling
if (product.variants && product.variants.length > 0) {
  const variant = product.variants[0];

  if (variant.calculated_price && variant.calculated_price.calculated_amount) {
    price_cents = variant.calculated_price.calculated_amount; // Integer in cents
  } else {
    console.error(`FATAL: No price found for ${product.handle}`);
    throw new Error(`Add-on ${product.handle} has no price`);
  }
}
```

### 2.2 Null Safety Checklist

**Required Checks (In Order):**
1. ✅ Check `product.variants` exists and is array
2. ✅ Check `product.variants.length > 0`
3. ✅ Check `variant.calculated_price` exists
4. ✅ Check `variant.calculated_price.calculated_amount` exists
5. ✅ Validate amount is a number
6. ✅ Provide fallback or error handling

### 2.3 Fallback Pattern (From Our Codebase)

**File:** `/lib/utils/pricing.ts` (lines 127-163)

```typescript
export function getProductPrice(product: any): ProductPrice | null {
  // Primary: Try calculated_price (Medusa v2)
  if (product.variants && product.variants.length > 0) {
    const variant = product.variants[0];

    if (variant.calculated_price && variant.calculated_price.calculated_amount) {
      return {
        amount: variant.calculated_price.calculated_amount, // cents
        currency_code: variant.calculated_price.currency_code || 'AUD',
      };
    }

    // Fallback: Try variant.prices array (Medusa v1)
    if (variant.prices && variant.prices.length > 0) {
      const audPrice = variant.prices.find((p: any) => p.currency_code === 'AUD');
      if (audPrice) {
        return {
          amount: audPrice.amount, // cents
          currency_code: 'AUD',
        };
      }
    }
  }

  // Last resort: Hardcoded prices (development only)
  if (product.handle && TOUR_PRICES[product.handle] !== undefined) {
    return {
      amount: TOUR_PRICES[product.handle],
      currency_code: 'AUD',
    };
  }

  return null; // No price found - fail gracefully
}
```

---

## 3. Standard Pricing Structure from Medusa Responses

### 3.1 API Response Example (Medusa v2)

```typescript
{
  "products": [
    {
      "id": "prod_01HXYZ...",
      "handle": "addon-glamping",
      "title": "Glamping Setup",
      "variants": [
        {
          "id": "variant_01HXYZ...",
          "calculated_price": {
            "calculated_amount": 25000,        // 25000 cents = $250.00
            "original_amount": 25000,
            "currency_code": "AUD",
            "price_list_type": null,
            "calculated_amount_with_tax": 27500,   // With 10% GST
            "calculated_amount_without_tax": 25000,
            "is_calculated_price_tax_inclusive": false
          }
        }
      ]
    }
  ]
}
```

### 3.2 Price Conversion Formula

**Medusa stores prices in CENTS (integers):**
```typescript
// ✅ CORRECT: Convert cents to dollars for display
const priceDollars = calculated_amount / 100;
const formattedPrice = priceDollars.toFixed(2); // "250.00"

// ❌ WRONG: Calling toFixed on undefined
const formattedPrice = addon.price.toFixed(2); // Error if price doesn't exist
```

---

## 4. Discrepancies Between Current Implementation and Medusa Standards

### 4.1 Critical Type Mismatch

**Current Implementation (WRONG):**

**File:** `/lib/types/checkout.ts` (line 17)
```typescript
export interface AddOn {
  id: string;
  title: string;
  description: string;
  price: number;  // ❌ WRONG: Expects dollars as number
  pricing_type: 'per_booking' | 'per_day' | 'per_person';
  // ...
}
```

**Medusa Standard (CORRECT):**

**File:** `/lib/types/cart.ts` (lines 60-77)
```typescript
export interface Addon {
  id: string;
  variant_id: string;
  title: string;
  description: string;
  price_cents: number;  // ✅ CORRECT: Stores cents as integer
  pricing_type: AddonPricingType;
  category: string;
  available: boolean;
  // ...
}
```

### 4.2 Component Usage Analysis

**Problem Locations:**

1. **AddOnSummary.tsx** (lines 55-57, 60)
   ```typescript
   // ❌ UNSAFE: Assumes addon.price exists and is a number
   return `$${addon.price.toFixed(2)} × ${tourDays} day${tourDays > 1 ? 's' : ''}`;
   ```

2. **AddOnDrawer.tsx** (lines 218, 253)
   ```typescript
   // ❌ UNSAFE: Assumes price variable exists
   <span className={styles.priceValue}>${price.toFixed(2)}</span>
   ```

3. **AddOnCard.tsx** (line 84)
   ```typescript
   // ✅ CORRECT: Uses price_cents
   const basePriceDollars = addon.price_cents / 100;
   ```

### 4.3 Data Transformation Issue

**The Problem:**
- `addons-service.ts` correctly fetches `price_cents` from Medusa API
- `checkout.ts` type expects `price` (dollars)
- Components using `checkout.ts` types call `.toFixed()` on undefined `price` field

**The Solution Required:**
Either:
1. Convert `price_cents` to `price` during data transformation, OR
2. Update all components to use `price_cents` and convert to dollars when displaying

---

## 5. Naming Conventions from Medusa Docs

### 5.1 Price Field Names

**Medusa Standard:**
- `price_cents` or `amount` - Price in cents (integer)
- `calculated_price` - Object containing calculated pricing
- `calculated_amount` - Final calculated price in cents
- `original_amount` - Original price before price lists
- `unit_price` - Price per unit in line items

**Currency Fields:**
- `currency_code` - Three-letter currency code (ISO 4217)

### 5.2 Product Metadata Fields

**For Add-ons:**
```typescript
metadata: {
  unit: 'per_booking' | 'per_day' | 'per_person',
  quantity_allowed: boolean,
  max_quantity: number,
  recommended_for: string[],
  tags: string[],
  applicable_tours: string[]
}
```

### 5.3 Variant Naming

**Medusa Standard:**
- `variant_id` - Unique variant identifier
- `variants[0]` - Access first variant (default variant)
- `variant.calculated_price` - Calculated price object
- `variant.prices` - Legacy price array

---

## 6. Specific Code Examples from Our Codebase

### 6.1 Correct Implementation (addons-service.ts)

```typescript
// ✅ CORRECT: Properly extracts price from Medusa response
function convertProductToAddOn(product: any): Addon {
  let price_cents = 0;
  let variant_id = '';

  if (product.variants && product.variants.length > 0) {
    const variant = product.variants[0];
    variant_id = variant.id;

    // Safe nested access with error handling
    if (variant.calculated_price && variant.calculated_price.calculated_amount) {
      price_cents = variant.calculated_price.calculated_amount;
    } else {
      console.error(`FATAL: No price found for ${product.handle}`);
      throw new Error(`Add-on ${product.handle} has no price`);
    }
  }

  return {
    id: product.id,
    variant_id,
    title: product.title,
    price_cents,  // ✅ Stored in cents
    pricing_type: pricingType,
    // ...
  };
}
```

### 6.2 Correct Display (AddOnCard.tsx)

```typescript
// ✅ CORRECT: Safe conversion from cents to dollars
const getDisplayPrice = () => {
  const basePriceDollars = addon.price_cents / 100;  // Convert cents to dollars
  switch (addon.pricing_type) {
    case 'per_day':
      return {
        price: basePriceDollars * tourDays,
        unit: `per item (${tourDays} day${tourDays > 1 ? 's' : ''})`,
      };
    // ...
  }
};

const { price: displayPrice, unit } = getDisplayPrice();
// displayPrice is now a safe number
<span>${displayPrice.toFixed(2)}</span>  // Safe to call toFixed
```

### 6.3 Incorrect Implementation (AddOnSummary.tsx)

```typescript
// ❌ WRONG: Assumes addon.price exists
const getPricingLabel = (addon: AddOn) => {
  switch (addon.pricing_type) {
    case 'per_day':
      return `$${addon.price.toFixed(2)} × ${tourDays} days`;
      //         ^^^^^^^^^^^^ ERROR: addon.price is undefined!
  }
};
```

---

## 7. Recommended Fixes

### 7.1 Immediate Fix (Type Safety)

**Option A: Add null safety to AddOnSummary.tsx**

```typescript
const getPricingLabel = (addon: AddOn) => {
  // Safe access with fallback
  const priceValue = addon.price ?? 0;

  switch (addon.pricing_type) {
    case 'per_day':
      return `$${priceValue.toFixed(2)} × ${tourDays} days`;
    case 'per_person':
      return `$${priceValue.toFixed(2)} × ${participants} persons`;
    default:
      return `$${priceValue.toFixed(2)} per booking`;
  }
};
```

### 7.2 Long-term Fix (Align with Medusa Standards)

**Option B: Standardize on price_cents everywhere**

1. Update `lib/types/checkout.ts`:
   ```typescript
   export interface AddOn {
     id: string;
     title: string;
     description: string;
     price_cents: number;  // ✅ Change to price_cents
     pricing_type: 'per_booking' | 'per_day' | 'per_person';
     // ...
   }
   ```

2. Update all components to convert cents to dollars:
   ```typescript
   const priceDollars = addon.price_cents / 100;
   const formattedPrice = priceDollars.toFixed(2);
   ```

### 7.3 Data Transformation Layer

**Option C: Transform at service boundary**

```typescript
// In addons-service.ts, add a transformation layer
export function transformForCheckout(addon: Addon): CheckoutAddOn {
  return {
    ...addon,
    price: addon.price_cents / 100,  // Convert to dollars
  };
}
```

---

## 8. Currency Handling Best Practices

### 8.1 Medusa Standard

**ALWAYS store prices in cents (integers):**
- Avoids floating-point precision issues
- Standard for payment processing (Stripe, PayPal, etc.)
- Medusa stores ALL prices in smallest currency unit

**ONLY convert to dollars for display:**
```typescript
// ✅ Storage: cents (integer)
const price_cents = 25000;

// ✅ Display: dollars (formatted)
const displayPrice = (price_cents / 100).toFixed(2); // "250.00"
```

### 8.2 Formatting Utilities

**From our codebase (priceCalculations.ts):**

```typescript
// ✅ CORRECT: Format cents to display with currency symbol
export function formatCentsToDisplay(cents: number, currencyCode: string = 'AUD'): string {
  const dollars = cents / 100;
  return new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency: currencyCode,
  }).format(dollars);
}

// Usage:
formatCentsToDisplay(25000); // "$250.00"
```

---

## 9. Summary of Findings

### Critical Issues Found:

1. **Type Mismatch**: `checkout.ts` defines `price: number` but Medusa returns `calculated_price.calculated_amount`
2. **Missing Field**: Components call `addon.price.toFixed()` but `price` field doesn't exist in Medusa response
3. **Unsafe Access**: No null checks before calling `.toFixed()` on potentially undefined values
4. **Dual Type System**: Codebase has TWO AddOn interfaces (cart.ts vs checkout.ts) with different field names

### Correct Medusa Patterns:

1. ✅ Store prices in cents (integers)
2. ✅ Use `calculated_price.calculated_amount` from Medusa API
3. ✅ Request `fields=*variants.calculated_price` in API calls
4. ✅ Convert cents to dollars ONLY for display
5. ✅ Always check nested fields exist before accessing
6. ✅ Use fallback values or error handling

### Files Requiring Updates:

- `/lib/types/checkout.ts` - Update AddOn interface
- `/components/Checkout/AddOnSummary.tsx` - Add null safety
- `/components/Checkout/AddOnDrawer.tsx` - Add null safety
- Any other components using `checkout.ts` AddOn type

---

## 10. References

### Documentation Sources:
- Medusa v2 Store API: https://docs.medusajs.com/resources/storefront-development/products/price
- Pricing Module: https://docs.medusajs.com/resources/commerce-modules/pricing/price-calculation
- Product Variants: https://docs.medusajs.com/resources/commerce-modules/product/guides/price

### Codebase References:
- `/lib/data/addons-service.ts` (lines 90-103) - Correct price extraction
- `/lib/types/cart.ts` (lines 60-77) - Medusa-compatible Addon type
- `/lib/utils/pricing.ts` (lines 127-163) - Safe price access pattern
- `/lib/utils/priceCalculations.ts` - Price formatting utilities
- `/components/Checkout/AddOnCard.tsx` (line 84) - Correct cents conversion

---

**Generated:** 2025-11-09
**Research Agent:** Claude Code
**Next Steps:** Fix type mismatches and add null safety to components
