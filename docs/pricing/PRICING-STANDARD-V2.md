# Medusa v2 Pricing Standard - Frontend Implementation Guide

**Last Updated:** 2025-11-10
**Status:** Active (Post DB Migration)
**Applies To:** All frontend pricing code

---

## Table of Contents

1. [Overview](#overview)
2. [Critical Change Summary](#critical-change-summary)
3. [The Pricing Flow](#the-pricing-flow)
4. [Standard Patterns](#standard-patterns)
5. [Files That Handle Pricing](#files-that-handle-pricing)
6. [Common Mistakes to Avoid](#common-mistakes-to-avoid)
7. [Testing Checklist](#testing-checklist)
8. [Migration Notes](#migration-notes)

---

## Overview

After the Medusa v2 database migration, the pricing format returned by the API has changed fundamentally:

- **BEFORE (Medusa v1):** API returned prices in **CENTS** (e.g., 200000 = $2000.00)
- **AFTER (Medusa v2):** API returns prices in **DOLLARS** (e.g., 2000 = $2000.00)

This change requires careful handling in the frontend to prevent price inflation bugs.

---

## Critical Change Summary

### ⚠️ The Golden Rule

> **API returns DOLLARS → Frontend stores CENTS → Display shows DOLLARS**

### The Conversion Pattern

```typescript
// ✅ CORRECT: Medusa v2 Post-Migration Pattern
const apiPrice = variant.calculated_price.calculated_amount; // 2000 (dollars)
const internalPrice = Math.round(apiPrice * 100);            // 200000 (cents)
const displayPrice = formatPrice(internalPrice);             // "$2,000.00"
```

### Why This Matters

**WRONG (Pre-Migration Code):**
```typescript
// This was correct BEFORE migration when API returned cents
const price = variant.calculated_price.calculated_amount; // Was cents
const display = formatCurrency(price / 100); // Correct then
```

**NOW THIS CAUSES 100x INFLATION:**
```typescript
const price = variant.calculated_price.calculated_amount; // NOW dollars (2000)
// If we DON'T multiply by 100, internal calculations are wrong
// If we still divide by 100 for display: 2000 / 100 = $20.00 (WRONG!)
```

---

## The Pricing Flow

### 1. API Response (Medusa v2)

```json
{
  "calculated_price": {
    "calculated_amount": 2000.00,  // ← DOLLARS (Post-Migration)
    "currency_code": "AUD"
  }
}
```

### 2. Frontend Conversion (Immediate)

```typescript
// ⚠️ MEDUSA v2 PRICING FORMAT (Post-Migration):
// After DB migration, Medusa v2 API returns prices in DOLLARS
// Frontend stores prices internally in CENTS for precision
// Conversion: API dollars → Frontend cents (multiply by 100)
price_cents: Math.round(calculatedPrice.calculated_amount * 100)
// Result: 200000 cents
```

### 3. Internal Storage (Always Cents)

```typescript
interface Tour {
  base_price_cents: number;  // 200000 (stored as cents)
  duration_days: number;
}

interface Addon {
  price_cents: number;        // 5000 (stored as cents)
  pricing_type: 'per_booking' | 'per_day' | 'per_person';
}
```

### 4. Calculations (Always in Cents)

```typescript
// Calculate tour total in CENTS
const tourTotalCents = tour.base_price_cents * participants * duration_days;

// Calculate addon total in CENTS
const addonTotalCents = addon.price_cents * quantity;

// Calculate GST in CENTS
const gstCents = Math.round(subtotalCents * 0.1);
```

### 5. Display (Convert Back to Dollars)

```typescript
// formatPrice() automatically divides by 100
import { formatPrice } from '@/lib/utils/pricing';

const displayPrice = formatPrice(tourTotalCents);  // "$2,000.00"
```

---

## Standard Patterns

### Pattern 1: API Data Conversion

**Location:** Data services and adapters
**When:** Converting API responses to frontend types

```typescript
// ✅ CORRECT Pattern (All data adapters)
if (variant.calculated_price && variant.calculated_price.calculated_amount) {
  // ⚠️ MEDUSA v2 PRICING FORMAT (Post-Migration):
  // After DB migration, Medusa v2 API returns prices in DOLLARS
  // Frontend stores prices internally in CENTS for precision
  // Conversion: API dollars → Frontend cents (multiply by 100)
  // Display: formatPrice() converts cents → dollars (divide by 100)
  price_cents: Math.round(variant.calculated_price.calculated_amount * 100)
}
```

**Files Using This Pattern:**
- `/lib/utils/pricing.ts` (line 133-141)
- `/lib/utils/addon-adapter.ts` (line 78-84)
- `/lib/data/tours-service.ts` (line 83-89)

### Pattern 2: Price Calculations

**Location:** Component logic, cart calculations
**When:** Computing totals, tax, etc.

```typescript
// ✅ CORRECT Pattern (All calculations in cents)

// Calculate tour total in CENTS
const tourTotalCents = cart.tour_booking
  ? cart.tour_booking.tour.base_price_cents * cart.tour_booking.participants
  : 0;

// Calculate addons total in CENTS (already stored in cents)
const addonsTotalCents = cart.addons?.reduce((sum, addon) => {
  return sum + addon.calculated_price_cents;
}, 0) || 0;

// Subtotal in CENTS (before tax)
const subtotalCents = tourTotalCents + addonsTotalCents;

// Calculate GST in CENTS (10% in Australia)
const gstCents = Math.round(subtotalCents * 0.1);

// Grand total in CENTS
const grandTotalCents = subtotalCents + gstCents;
```

**Files Using This Pattern:**
- `/components/Checkout/BookingSummary.tsx` (line 51-72)
- `/components/Checkout/StickySummary.tsx` (line 24-36)
- `/lib/utils/priceCalculations.ts` (various functions)

### Pattern 3: Display Formatting

**Location:** All UI components
**When:** Showing prices to users

```typescript
// ✅ CORRECT Pattern (Use formatPrice everywhere)
import { formatPrice } from '@/lib/utils/pricing';

// Display tour price
<div>{formatPrice(tourTotalCents)}</div>

// Display addon price
<div>{formatPrice(addon.price_cents)}</div>

// Display unit price
<span>{formatPrice(addon.price_cents)}/day</span>

// ❌ WRONG: Manual division
<div>${tourTotalCents / 100}</div>  // NO! Use formatPrice()
```

**Files Using This Pattern:**
- `/components/Checkout/BookingSummary.tsx` (multiple locations)
- All pricing display components

---

## Files That Handle Pricing

### Core Utilities

| File | Purpose | Key Functions |
|------|---------|---------------|
| `/lib/utils/pricing.ts` | Main pricing utilities | `getProductPrice()`, `formatPrice()`, `calculateAddonPrice()` |
| `/lib/utils/priceCalculations.ts` | Calculation logic | `calculateTourPrice()`, `calculateAddonPrice()`, `generatePriceBreakdown()` |

### Data Services

| File | Converts API → Frontend |
|------|------------------------|
| `/lib/utils/addon-adapter.ts` | Converts Medusa products to Addon type (line 78-84) |
| `/lib/data/tours-service.ts` | Converts Medusa products to Tour type (line 83-89) |
| `/lib/data/addons-service.ts` | Fetches and converts addon data |

### UI Components

| File | Displays Prices |
|------|----------------|
| `/components/Checkout/BookingSummary.tsx` | Main booking summary (UPDATED) |
| `/components/Checkout/PriceSummary.tsx` | Order summary sidebar |
| `/components/Checkout/StickySummary.tsx` | Sticky checkout summary |
| `/components/Checkout/AddOnCard.tsx` | Individual addon cards |
| `/components/Tours/TourAddOns.tsx` | Tour addons display |

### Context & State

| File | Manages Price State |
|------|---------------------|
| `/lib/context/CartContext.tsx` | Cart state management |
| `/lib/hooks/useAddOnSelection.ts` | Addon selection logic |

---

## Common Mistakes to Avoid

### ❌ Mistake 1: Forgetting to Multiply by 100

```typescript
// ❌ WRONG: Missing conversion
const price = variant.calculated_price.calculated_amount;
// This gives you dollars when you need cents!

// ✅ CORRECT: Always multiply by 100
const price = Math.round(variant.calculated_price.calculated_amount * 100);
```

### ❌ Mistake 2: Double Division

```typescript
// ❌ WRONG: Dividing cents that are already dollars
const tourTotal = (tourPriceInDollars / 100) * participants;
// If API gives dollars, this makes $2000 become $20!

// ✅ CORRECT: Store in cents, calculate in cents
const tourTotalCents = tourPriceInCents * participants;
```

### ❌ Mistake 3: Mixing formatCurrency and formatPrice

```typescript
// ❌ WRONG: formatCurrency expects dollars
import { formatCurrency } from '@/lib/utils/pricing';
const display = formatCurrency(priceInCents / 100);

// ✅ CORRECT: formatPrice expects cents
import { formatPrice } from '@/lib/utils/pricing';
const display = formatPrice(priceInCents);
```

### ❌ Mistake 4: Inconsistent Units

```typescript
// ❌ WRONG: Mixing dollars and cents
const tourPrice = 2000;          // Is this dollars or cents?
const addonPrice = 5000;         // Is this dollars or cents?
const total = tourPrice + addonPrice;  // WRONG!

// ✅ CORRECT: Always use _cents suffix
const tourPriceCents = 200000;   // 200000 cents = $2000
const addonPriceCents = 5000;    // 5000 cents = $50
const totalCents = tourPriceCents + addonPriceCents;
```

---

## Testing Checklist

### Unit Tests

- [ ] `getProductPrice()` returns cents (not dollars)
- [ ] `calculateAddonPrice()` calculates in cents
- [ ] `formatPrice()` correctly converts cents to dollars
- [ ] All calculation functions use cents internally

### Integration Tests

- [ ] Tour prices display correctly ($2000, not $20 or $200,000)
- [ ] Addon prices display correctly
- [ ] Cart totals match expected values
- [ ] Tax calculations are accurate (10% GST)
- [ ] Checkout total matches Medusa backend

### Visual Tests

- [ ] Tour listing page shows correct prices
- [ ] Tour detail page shows correct prices
- [ ] Addon selection shows correct prices
- [ ] Booking summary shows correct breakdown
- [ ] Checkout page shows correct total

### Edge Cases

- [ ] Zero prices handled correctly
- [ ] Negative prices rejected
- [ ] Rounding errors minimal (<1 cent)
- [ ] Multi-participant calculations correct
- [ ] Multi-day tour calculations correct
- [ ] Per-day addon calculations correct
- [ ] Per-person addon calculations correct

---

## Migration Notes

### What Changed

**BEFORE Migration (Medusa v1):**
```typescript
// API returned cents
calculated_amount: 200000  // $2000.00 as cents

// Frontend stored as-is
price_cents: 200000

// Display divided by 100
formatCurrency(price_cents / 100)  // "$2,000.00"
```

**AFTER Migration (Medusa v2):**
```typescript
// API returns dollars
calculated_amount: 2000  // $2000.00 as dollars

// Frontend converts to cents
price_cents: Math.round(2000 * 100)  // 200000

// Display uses formatPrice
formatPrice(price_cents)  // "$2,000.00"
```

### Migration Impact

| Area | Impact | Fix Required |
|------|--------|--------------|
| API adapters | HIGH | Multiply by 100 on conversion |
| UI components | MEDIUM | Use `formatPrice()` instead of manual division |
| Calculations | LOW | Already in cents (no change) |
| Tests | HIGH | Update expected values |

### Rollback Plan

If issues occur, revert these commits:
1. `/lib/utils/pricing.ts` - Remove ×100 multiplication
2. `/lib/utils/addon-adapter.ts` - Remove ×100 multiplication
3. `/lib/data/tours-service.ts` - Remove ×100 multiplication
4. `/components/Checkout/BookingSummary.tsx` - Restore formatCurrency

---

## Quick Reference Card

```typescript
// ═══════════════════════════════════════════════════════════
// MEDUSA V2 PRICING QUICK REFERENCE
// ═══════════════════════════════════════════════════════════

// 1️⃣ API RESPONSE (Dollars)
const apiResponse = {
  calculated_price: {
    calculated_amount: 2000.00  // ← DOLLARS
  }
};

// 2️⃣ CONVERSION (Dollars → Cents)
const priceCents = Math.round(apiResponse.calculated_price.calculated_amount * 100);
// Result: 200000 cents

// 3️⃣ STORAGE (Always Cents)
interface Tour {
  base_price_cents: number;  // 200000
}

// 4️⃣ CALCULATIONS (Always Cents)
const totalCents = tour.base_price_cents * participants;

// 5️⃣ DISPLAY (Cents → Dollars)
import { formatPrice } from '@/lib/utils/pricing';
const display = formatPrice(totalCents);  // "$2,000.00"

// ═══════════════════════════════════════════════════════════
```

---

## Support

**Questions?**
- Check `/lib/utils/pricing.ts` for reference implementation
- See `/lib/utils/priceCalculations.ts` for calculation examples
- Review `/components/Checkout/BookingSummary.tsx` for display patterns

**Found a Bug?**
1. Verify the price is in cents in storage
2. Check if API conversion is applied (×100)
3. Ensure formatPrice() is used for display
4. Test with actual Medusa v2 API response

---

**End of Pricing Standard v2**
