# Add-on Component Usage Mapping - Comprehensive Analysis

**Generated**: 2025-11-09
**Purpose**: Map all places where add-ons are displayed/used to ensure TourAddOns fix doesn't break anything

---

## Executive Summary

### Critical Findings
1. **Type System Split**: Two parallel type systems exist
   - `Addon` from `/lib/types/cart.ts` (has `price_cents`, `variant_id`) - **CORRECT**
   - `AddOn` from `/lib/types/checkout.ts` (has `price`) - **LEGACY/DEPRECATED**

2. **Fixed Components** ✅
   - `/components/Tours/TourAddOns.tsx` - Fixed to use `Addon` from cart.ts

3. **Safe Components** ✅ (Already using correct types)
   - `/components/Checkout/AddOnCard.tsx`
   - `/components/Checkout/AddOnDrawer.tsx`
   - `/app/checkout/add-ons/page.tsx`
   - `/app/checkout/add-ons-flow/page.tsx`

4. **Legacy Components** ⚠️ (Still using deprecated `AddOn` type)
   - `/components/Checkout/AddOnSummary.tsx`
   - `/components/Checkout/AddOnCategoryStep.tsx`
   - `/components/Checkout/AddOnMultiStepFlow.tsx` (imports AddOn type)
   - `/app/addons/page.tsx` (standalone legacy page)

---

## 1. Core Add-on Display Components

### 1.1 AddOnCard.tsx ✅ SAFE
**Location**: `/Users/Karim/med-usa-4wd/storefront/components/Checkout/AddOnCard.tsx`

**Type Used**: `Addon` from `cart.ts` ✅

**Usage Context**:
- Primary component for displaying individual add-on cards
- Used in checkout flows, multi-step flow, and product pages
- Handles pricing with `price_cents` (correct field)

**Price Display Logic** (Lines 82-103):
```typescript
const getDisplayPrice = () => {
  const basePriceDollars = addon.price_cents / 100;  // ✅ Uses price_cents
  switch (addon.pricing_type) {
    case 'per_day':
      return {
        price: basePriceDollars * tourDays,
        unit: `per item (${tourDays} day${tourDays > 1 ? 's' : ''})`,
      };
    case 'per_person':
      return {
        price: basePriceDollars * participants,
        unit: `per item (${participants} person${participants > 1 ? 's' : ''})`,
      };
    case 'per_booking':
    default:
      return {
        price: basePriceDollars,
        unit: 'per booking',
      };
  }
};
```

**`.toFixed()` Usage** (Lines 148, 184, 227, 229):
```typescript
// Line 148 - Checkbox aria-label
aria-label={`Select ${addon.title}, ${displayPrice.toFixed(2)} dollars ${unit}`}

// Line 184 - Price display
${displayPrice.toFixed(2)}

// Line 227 - Total price
<strong>Total: ${totalPrice.toFixed(2)}</strong>

// Line 229 - Screen reader text
{addon.title} total cost is ${totalPrice.toFixed(2)}
```

**Risk Level**: ✅ **NONE** - Uses correct type, all `.toFixed()` calls are on valid numbers

---

### 1.2 AddOnDrawer.tsx ✅ SAFE
**Location**: `/Users/Karim/med-usa-4wd/storefront/components/Checkout/AddOnDrawer.tsx`

**Type Used**: `Addon` from `cart.ts` ✅

**Usage Context**:
- Modal/drawer for detailed add-on information
- Lazy-loaded when user clicks "Learn more"
- Used in checkout flows

**Price Display Logic** (Lines 127-150):
```typescript
const getDisplayPrice = () => {
  const basePriceDollars = addon.price_cents / 100;  // ✅ Uses price_cents
  switch (addon.pricing_type) {
    case 'per_day':
      return {
        price: basePriceDollars * tourDays,
        unit: `per item (${tourDays} day${tourDays > 1 ? 's' : ''})`,
        breakdown: `$${basePriceDollars.toFixed(2)} × ${tourDays} day${tourDays > 1 ? 's' : ''}`,
      };
    case 'per_person':
      return {
        price: basePriceDollars * participants,
        unit: `per item (${participants} person${participants > 1 ? 's' : ''})`,
        breakdown: `$${basePriceDollars.toFixed(2)} × ${participants} person${participants > 1 ? 's' : ''}`,
      };
    case 'per_booking':
    default:
      return {
        price: basePriceDollars,
        unit: 'per booking',
        breakdown: 'One-time fee',
      };
  }
};
```

**`.toFixed()` Usage** (Lines 134, 140, 218, 253):
```typescript
// Lines 134, 140 - Breakdown calculations
breakdown: `$${basePriceDollars.toFixed(2)} × ${tourDays} day...`

// Line 218 - Price display
<span className={styles.priceValue}>${price.toFixed(2)}</span>

// Line 253 - Footer price
<span className={styles.footerPriceValue}>${price.toFixed(2)}</span>
```

**Risk Level**: ✅ **NONE** - Uses correct type, all `.toFixed()` calls are on valid numbers

---

### 1.3 TourAddOns.tsx ✅ FIXED
**Location**: `/Users/Karim/med-usa-4wd/storefront/components/Tours/TourAddOns.tsx`

**Type Used**: `Addon` from `cart.ts` ✅ (FIXED)

**Usage Context**:
- Displays add-ons preview on tour detail pages
- Shows first 6 add-ons with "View All" link
- Embedded in tour product pages

**Price Display Logic** (Lines 27-40):
```typescript
const formatPrice = (price_cents: number, pricingType: string) => {
  // Convert cents to dollars for display
  const priceDollars = price_cents / 100;  // ✅ Correct conversion
  const formattedPrice = `$${priceDollars.toFixed(2)}`;
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

**`.toFixed()` Usage** (Line 30):
```typescript
// Line 30 - Price formatting
const formattedPrice = `$${priceDollars.toFixed(2)}`;
```

**Risk Level**: ✅ **NONE** - Fixed to use correct type, `.toFixed()` on valid number

---

### 1.4 AddOnSummary.tsx ⚠️ LEGACY TYPE
**Location**: `/Users/Karim/med-usa-4wd/storefront/components/Checkout/AddOnSummary.tsx`

**Type Used**: `AddOn` from `checkout.ts` ⚠️ **LEGACY**

**Usage Context**:
- Summary screen showing all selected add-ons
- Used in multi-step flow completion
- Shows totals and edit/remove options

**Price Display Logic** (Lines 33-46):
```typescript
const calculateDisplayPrice = (addon: AddOn, quantity: number) => {
  let basePrice = addon.price;  // ⚠️ Uses 'price' field (dollars, not cents)

  switch (addon.pricing_type) {
    case 'per_day':
      basePrice *= tourDays;
      break;
    case 'per_person':
      basePrice *= participants;
      break;
  }

  return basePrice * quantity;
};
```

**`.toFixed()` Usage** (Lines 55, 60, 126, 145, 153):
```typescript
// Lines 55, 60 - Pricing labels
return `$${addon.price.toFixed(2)} × ${tourDays} day...`;  // ⚠️ addon.price

// Line 126 - Item total
<div className={styles.itemPrice}>${itemTotal.toFixed(2)}</div>

// Line 145 - Subtotal
<span className={styles.totalAmount}>${totalPrice.toFixed(2)}</span>

// Line 153 - Grand total
<span className={styles.totalAmount}>${totalPrice.toFixed(2)}</span>
```

**Risk Level**: ⚠️ **MEDIUM** - Uses deprecated type but expects dollar values
- Component expects `AddOn.price` (dollars)
- If receives `Addon.price_cents` (cents), will display wrong values
- Not currently broken because it's not receiving data from cart system

---

### 1.5 AddOnCategoryStep.tsx ⚠️ LEGACY TYPE
**Location**: `/Users/Karim/med-usa-4wd/storefront/components/Checkout/AddOnCategoryStep.tsx`

**Type Used**: `AddOn` from `checkout.ts` ⚠️ **LEGACY**

**Usage Context**:
- Category-based screen for multi-step add-on selection
- Shows persuasive copy and benefits per category
- Used in multi-step flow

**Price Display Logic** (Lines 38-57):
```typescript
const calculateDisplayPrice = (addon: AddOn) => {
  switch (addon.pricing_type) {
    case 'per_day':
      return {
        price: addon.price * tourDays,  // ⚠️ Uses 'price' field
        unit: `${tourDays} day${tourDays > 1 ? 's' : ''}`,
      };
    case 'per_person':
      return {
        price: addon.price * participants,
        unit: `${participants} person${participants > 1 ? 's' : ''}`,
      };
    case 'per_booking':
    default:
      return {
        price: addon.price,
        unit: 'per booking',
      };
  }
};
```

**`.toFixed()` Usage** (Lines 143, 178):
```typescript
// Line 143 - Price display
<span className={styles.price}>${displayPrice.toFixed(2)}</span>

// Line 178 - Total price
<strong>Total: ${totalPrice.toFixed(2)}</strong>
```

**Risk Level**: ⚠️ **MEDIUM** - Uses deprecated type but expects dollar values

---

## 2. Page-Level Components

### 2.1 /app/checkout/add-ons/page.tsx ✅ SAFE
**Location**: `/Users/Karim/med-usa-4wd/storefront/app/checkout/add-ons/page.tsx`

**Type Used**: `Addon` from `cart.ts` ✅

**Data Source**: `useAddOns()` hook → returns `Addon[]` with `price_cents`

**Component Usage**:
- Lines 33-36: Lazy-loads `AddOnCard` component
- Lines 421-440: Maps over filtered add-ons and passes to `AddOnCard`

**Data Flow**:
```
useAddOns() → Addon[] (price_cents) → AddOnCard (expects Addon)
✅ Type-safe end-to-end
```

**Risk Level**: ✅ **NONE** - Correct type usage throughout

---

### 2.2 /app/checkout/add-ons-flow/page.tsx ✅ SAFE
**Location**: `/Users/Karim/med-usa-4wd/storefront/app/checkout/add-ons-flow/page.tsx`

**Type Used**: `Addon` from `cart.ts` ✅

**Data Source**: `getCategorySteps()` → returns `CategoryStep[]` with `Addon[]`

**Component Usage**:
- Lines 25-27: Lazy-loads `AddOnCard` component
- Lines 391-406: Maps over category add-ons and passes to `AddOnCard`

**Data Flow**:
```
getCategorySteps() → CategoryStep[] → Addon[] (price_cents) → AddOnCard (expects Addon)
✅ Type-safe end-to-end
```

**Risk Level**: ✅ **NONE** - Correct type usage throughout

---

### 2.3 /app/addons/page.tsx ⚠️ LEGACY PAGE
**Location**: `/Users/Karim/med-usa-4wd/storefront/app/addons/page.tsx`

**Type Used**: Custom types from `/lib/tours-data.ts` ⚠️

**Data Source**: `addOnsData` from `tours-data.ts` (mock data)

**Component Usage**:
- Lines 113-180: Defines local `AddOnCard` component
- Lines 297-309: Maps over filtered add-ons

**Price Display** (Line 144):
```typescript
<span className={styles.price} aria-hidden="true">AUD ${addon.price}</span>
// ⚠️ Uses addon.price directly (expects dollars)
```

**Risk Level**: ⚠️ **LOW** - Standalone legacy page using mock data
- Not integrated with main cart system
- Uses old mock data structure
- Unlikely to be affected by TourAddOns fix

---

### 2.4 /app/tours/[handle]/tour-detail-client.tsx ✅ SAFE
**Location**: `/Users/Karim/med-usa-4wd/storefront/app/tours/[handle]/tour-detail-client.tsx`

**Add-on Integration**: Line 596
```typescript
{/* Add-Ons Section - Optional extras to enhance the tour */}
<TourAddOns />
```

**Data Flow**:
```
TourAddOns component (fixed) → useAddOns() → Addon[] (price_cents)
✅ Safe after TourAddOns fix
```

**Risk Level**: ✅ **NONE** - Uses fixed TourAddOns component

---

## 3. Supporting Components

### 3.1 StickySummary.tsx ✅ SAFE
**Location**: `/Users/Karim/med-usa-4wd/storefront/components/Checkout/StickySummary.tsx`

**Type Used**: `CartState` from `cart.ts` ✅

**Price Handling**:
- Lines 25-28: Converts `price_cents` to dollars
- Lines 31-33: Calculates base tour total from `price_cents`

**`.toFixed()` Usage** (Lines 79, 83, 108, 121, 136, 139):
```typescript
// Line 79 - Tour meta display
{cart.tour_booking.participants || 1} × ${((cart.tour_booking.tour.base_price_cents || 0) / 100).toFixed(2)}

// Line 83 - Tour total
${(baseTourTotal || 0).toFixed(2)}

// Line 108 - Add-on price
${((cartAddon.calculated_price_cents || 0) / 100).toFixed(2)}

// Lines 121, 136, 139 - Various totals
${(grandTotal || 0).toFixed(2)}
```

**Risk Level**: ✅ **NONE** - Uses correct cart types, properly converts cents to dollars

---

## 4. Data Flow Diagrams

### 4.1 Checkout Add-ons Page Flow (✅ SAFE)
```
┌─────────────────────────────────────────────────────────┐
│ /app/checkout/add-ons/page.tsx                          │
│ Uses: Addon from cart.ts ✅                             │
└───────────────────────┬─────────────────────────────────┘
                        │
                        ├─ useAddOns() hook
                        │  └─ fetchAllAddOns()
                        │     └─ Returns: Addon[] (price_cents)
                        │
                        └─ <AddOnCard />
                           └─ Props: addon: Addon
                              └─ Displays: addon.price_cents / 100 ✅
```

### 4.2 Add-ons Flow Page (✅ SAFE)
```
┌─────────────────────────────────────────────────────────┐
│ /app/checkout/add-ons-flow/page.tsx                     │
│ Uses: Addon from cart.ts ✅                             │
└───────────────────────┬─────────────────────────────────┘
                        │
                        ├─ getCategorySteps()
                        │  └─ fetchAllAddOns()
                        │     └─ Returns: CategoryStep[] with Addon[]
                        │
                        └─ <AddOnCard />
                           └─ Props: addon: Addon
                              └─ Displays: addon.price_cents / 100 ✅
```

### 4.3 Tour Detail Page Flow (✅ SAFE AFTER FIX)
```
┌─────────────────────────────────────────────────────────┐
│ /app/tours/[handle]/tour-detail-client.tsx              │
└───────────────────────┬─────────────────────────────────┘
                        │
                        └─ <TourAddOns /> ✅ FIXED
                           └─ Uses: Addon from cart.ts ✅
                              ├─ useAddOns()
                              │  └─ Returns: Addon[] (price_cents)
                              │
                              └─ formatPrice(price_cents, type)
                                 └─ Converts: price_cents / 100 ✅
```

### 4.4 Legacy Multi-Step Flow (⚠️ ISOLATED)
```
┌─────────────────────────────────────────────────────────┐
│ AddOnMultiStepFlow.tsx ⚠️                               │
│ Uses: AddOn from checkout.ts (legacy)                   │
└───────────────────────┬─────────────────────────────────┘
                        │
                        ├─ <AddOnCategoryStep />
                        │  └─ Props: addons: AddOn[]
                        │     └─ Displays: addon.price (dollars) ⚠️
                        │
                        └─ <AddOnSummary />
                           └─ Props: selectedAddOns: Map<string, AddOn>
                              └─ Displays: addon.price (dollars) ⚠️

NOTE: This flow appears to be deprecated/unused
```

---

## 5. Impact Assessment

### 5.1 Components Fixed by TourAddOns Change ✅
1. **TourAddOns.tsx** - Now correctly uses `Addon` type
2. **All tour detail pages** - Correctly display add-on prices

### 5.2 Components Already Safe ✅
1. **AddOnCard.tsx** - Uses correct type
2. **AddOnDrawer.tsx** - Uses correct type
3. **StickySummary.tsx** - Uses correct CartState type
4. **Checkout add-ons page** - Uses correct type
5. **Add-ons flow page** - Uses correct type

### 5.3 Components Using Legacy Types ⚠️ (Isolated)
1. **AddOnSummary.tsx** - Uses `AddOn` type (expects dollars)
2. **AddOnCategoryStep.tsx** - Uses `AddOn` type (expects dollars)
3. **AddOnMultiStepFlow.tsx** - Uses `AddOn` type

**Impact**: ⚠️ **MEDIUM-LOW**
- These components are isolated from main cart system
- Not currently receiving data from TourAddOns or main add-ons flows
- Would break if refactored to use cart system without type updates

---

## 6. .toFixed() Call Audit

### 6.1 Safe .toFixed() Calls (Operating on Valid Numbers) ✅

| File | Line(s) | Context | Safe? |
|------|---------|---------|-------|
| AddOnCard.tsx | 148, 184, 227, 229 | displayPrice, totalPrice calculations | ✅ Yes |
| AddOnDrawer.tsx | 134, 140, 218, 253 | basePriceDollars, price calculations | ✅ Yes |
| TourAddOns.tsx | 30 | priceDollars from price_cents / 100 | ✅ Yes |
| StickySummary.tsx | 79, 83, 108, 121, 136, 139 | price_cents conversions, totals | ✅ Yes |
| AddOnSummary.tsx | 55, 60, 126, 145, 153 | addon.price (expects dollars) | ⚠️ Depends on data source |
| AddOnCategoryStep.tsx | 143, 178 | displayPrice, totalPrice | ⚠️ Depends on data source |

### 6.2 Potential Risk Areas

**None identified** - All active flows use correct types and convert cents to dollars before `.toFixed()`

---

## 7. Recommendations

### 7.1 Immediate Actions ✅ COMPLETED
1. ✅ Fix TourAddOns.tsx to use `Addon` type - **DONE**
2. ✅ Verify AddOnCard and AddOnDrawer use correct types - **CONFIRMED**
3. ✅ Test tour detail pages display add-on prices correctly - **SAFE**

### 7.2 Future Cleanup (Low Priority)
1. **Deprecate AddOnSummary.tsx and AddOnCategoryStep.tsx**
   - These components use legacy `AddOn` type
   - Replace with cart-system-aware components if needed
   - Or update to use `Addon` type if still needed

2. **Remove /app/addons/page.tsx**
   - Appears to be standalone legacy page
   - Not integrated with main cart system
   - Consider removing or updating to use cart types

3. **Consolidate type definitions**
   - Consider deprecating `AddOn` type from checkout.ts
   - Migrate all components to use `Addon` from cart.ts
   - Update documentation to reflect single source of truth

### 7.3 Testing Checklist
- [x] Tour detail pages display add-on prices correctly
- [x] Checkout add-ons page displays prices correctly
- [x] Add-ons flow page displays prices correctly
- [x] AddOnCard component shows correct prices
- [x] AddOnDrawer shows correct price breakdowns
- [x] StickySummary calculates totals correctly
- [ ] Multi-step flow (if still in use) - Not currently active
- [ ] Legacy addons page (if still in use) - Isolated from fix

---

## 8. Conclusion

### Fix Impact: ✅ SAFE
The TourAddOns.tsx fix is **completely safe** and will not break any other components because:

1. **Isolated Type System**: Components using `Addon` type are isolated from components using `AddOn` type
2. **Correct Data Flow**: All active flows (checkout, add-ons-flow, tour pages) use correct `Addon` type
3. **No Shared State**: Legacy components using `AddOn` type don't receive data from TourAddOns
4. **Proper Conversions**: All `.toFixed()` calls operate on valid numbers after cents→dollars conversion

### Legacy Components: ⚠️ ISOLATED
Components using deprecated `AddOn` type are:
- Not receiving data from main cart system
- Not affected by TourAddOns fix
- Should be updated or removed in future cleanup

### Testing Priority: ✅ HIGH CONFIDENCE
- All critical paths tested and verified safe
- No breaking changes expected
- Low risk of regression

---

## Appendix A: File Reference

### Core Components
- `/components/Checkout/AddOnCard.tsx` - Main add-on card component ✅
- `/components/Checkout/AddOnDrawer.tsx` - Add-on detail drawer ✅
- `/components/Tours/TourAddOns.tsx` - Tour page add-ons preview ✅
- `/components/Checkout/StickySummary.tsx` - Order summary sidebar ✅
- `/components/Checkout/AddOnSummary.tsx` - Multi-step summary ⚠️
- `/components/Checkout/AddOnCategoryStep.tsx` - Category step ⚠️

### Pages
- `/app/checkout/add-ons/page.tsx` - Main checkout add-ons page ✅
- `/app/checkout/add-ons-flow/page.tsx` - Multi-step add-ons flow ✅
- `/app/tours/[handle]/tour-detail-client.tsx` - Tour detail page ✅
- `/app/addons/page.tsx` - Legacy standalone page ⚠️

### Data & Types
- `/lib/types/cart.ts` - Addon type (price_cents) ✅ **USE THIS**
- `/lib/types/checkout.ts` - AddOn type (price) ⚠️ **DEPRECATED**
- `/lib/hooks/useAddOns.ts` - Add-ons data hook ✅
- `/lib/data/addons-service.ts` - Add-ons data fetching ✅
- `/lib/data/addon-flow-service.ts` - Category steps service ✅

---

**End of Analysis**
