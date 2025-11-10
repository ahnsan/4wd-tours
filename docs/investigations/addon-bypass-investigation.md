# Add-ons Flow Bypass Investigation

**Date**: 2025-11-09
**Investigator**: Claude Code
**Issue**: Add-ons step might be getting bypassed in checkout flow

## Executive Summary

The add-ons flow is NOT being bypassed - it's working as designed. However, **all tours may be showing NO add-ons** if the products haven't been properly seeded with `applicable_tours` metadata.

## Key Findings

### 1. Tour Flow Architecture

The current checkout flow after booking a tour is:

```
Tour Detail Page
    ↓ (User clicks "Book Now")
    ↓ (Tour added to cart via addTourToCart)
    ↓
router.push('/checkout/add-ons')  ← OLD PAGE (deprecated?)
    OR
router.push('/checkout/add-ons-flow')  ← NEW MULTI-STEP FLOW
    ↓
/checkout (Final payment page)
```

**Current Issue**: Tour detail page redirects to `/checkout/add-ons` (line 195 of tour-detail-client.tsx) but the modern multi-step flow is at `/checkout/add-ons-flow`.

### 2. Add-on Filtering Logic

Add-ons are filtered by tour using the `applicable_tours` metadata field:

**File**: `/Users/Karim/med-usa-4wd/storefront/lib/data/addon-filtering.ts`

```typescript
export function isAddonApplicableToTour(addon: AddOn, tourHandle: string): boolean {
  // No applicable_tours defined = not applicable (fail-safe)
  if (!addon.metadata?.applicable_tours || addon.metadata.applicable_tours.length === 0) {
    return false;
  }

  // Wildcard "*" means applicable to all tours
  if (addon.metadata.applicable_tours.includes('*')) {
    return true;
  }

  // Check if tour handle is in the list
  return addon.metadata.applicable_tours.includes(tourHandle);
}
```

**Critical**: If an add-on has NO `applicable_tours` metadata, it will NEVER show for ANY tour.

### 3. Product Seed Data Analysis

**File**: `/Users/Karim/med-usa-4wd/src/modules/seeding/tour-seed.ts`

#### Tours Available (5 total):
1. `1d-rainbow-beach` - 1 Day Rainbow Beach Tour ($2000)
2. `1d-fraser-island` - 1 Day Fraser Island Tour ($2000)
3. `2d-fraser-rainbow` - 2 Day Fraser + Rainbow Combo ($4000)
4. `3d-fraser-rainbow` - 3 Day Fraser & Rainbow Combo ($6000)
5. `4d-fraser-rainbow` - 4 Day Fraser & Rainbow Combo ($8000)

#### Add-ons Available (18 total):

**UNIVERSAL ADD-ONS** (applicable_tours: ["*"]) - 14 items:
- Food & Beverage (3):
  - `addon-gourmet-bbq` - $180 per booking
  - `addon-picnic-hamper` - $85 per booking
  - `addon-seafood-platter` - $150 per booking

- Connectivity (2):
  - `addon-internet` - $30 per day
  - `addon-starlink` - $50 per day

- Photography (3):
  - `addon-drone-photography` - $200 per booking
  - `addon-gopro` - $75 per booking
  - `addon-photo-album` - $150 per booking

- Accommodation (1):
  - `addon-beach-cabana` - $180 per day

- Activities (5):
  - `addon-fishing` - $65 per day
  - `addon-bodyboarding` - $35 per day
  - `addon-paddleboarding` - $55 per day
  - `addon-kayaking` - $75 per day

**MULTI-DAY TOUR ONLY** (2d/3d/4d-fraser-rainbow) - 2 items:
- `addon-glamping` - $250 per day (Accommodation)
- `addon-eco-lodge` - $300 per day (Accommodation)

**RAINBOW BEACH TOURS ONLY** (1d-rainbow-beach, 2d/3d/4d-fraser-rainbow) - 1 item:
- `addon-sandboarding` - $45 per day (Activities)

**NOT AVAILABLE FOR 1d-fraser-island** (1 item):
- `addon-sandboarding` - Rainbow Beach tours only

### 4. Expected Add-on Counts by Tour

| Tour Handle | Expected Add-ons | Categories |
|-------------|------------------|------------|
| 1d-rainbow-beach | 15 | All universal (14) + sandboarding (1) |
| 1d-fraser-island | 14 | Universal only |
| 2d-fraser-rainbow | 17 | Universal (14) + multi-day (2) + sandboarding (1) |
| 3d-fraser-rainbow | 17 | Universal (14) + multi-day (2) + sandboarding (1) |
| 4d-fraser-rainbow | 17 | Universal (14) + multi-day (2) + sandboarding (1) |

### 5. Add-ons Flow Behavior

**File**: `/Users/Karim/med-usa-4wd/storefront/app/checkout/add-ons-flow/page.tsx`

The multi-step add-ons flow:
- Loads category steps filtered by tour handle (line 72)
- Shows "No Add-ons Available" if steps.length === 0 (line 311-324)
- Auto-redirects to checkout with "Continue to Checkout" button if no add-ons

**Empty State Handling**:
```typescript
// Empty state - no addons for this tour
if (!currentStep || steps.length === 0) {
  return (
    <div className={styles.errorContainer}>
      <h2>No Add-ons Available</h2>
      <p>
        {cart.tour_booking?.tour?.title
          ? `This tour doesn't have any add-ons available.`
          : 'Please select a tour to view available add-ons.'}
      </p>
      <button onClick={() => router.push('/checkout')} className={styles.button}>
        Continue to Checkout
      </button>
    </div>
  );
}
```

## Root Cause Analysis

### Possible Issues:

1. **Products Not Seeded**: The backend database may not have the tour and add-on products seeded yet
2. **Missing Metadata**: Add-on products exist but `applicable_tours` metadata is missing
3. **Wrong Route**: Tour detail page redirects to `/checkout/add-ons` instead of `/checkout/add-ons-flow`
4. **API/Backend Down**: Add-ons service fails to fetch products from backend

## Testing Checklist

### Backend Verification:
- [ ] Check if Medusa backend is running
- [ ] Verify products are seeded: `npm run seed`
- [ ] Query products API: `GET /store/products`
- [ ] Verify add-on products have `metadata.applicable_tours` field
- [ ] Check add-on products have `metadata.addon: true` flag

### Frontend Verification:
- [ ] Test add-ons flow for each tour:
  - [ ] 1d-rainbow-beach (expect 15 add-ons)
  - [ ] 1d-fraser-island (expect 14 add-ons)
  - [ ] 2d-fraser-rainbow (expect 17 add-ons)
  - [ ] 3d-fraser-rainbow (expect 17 add-ons)
  - [ ] 4d-fraser-rainbow (expect 17 add-ons)
- [ ] Verify filtering logic in browser console
- [ ] Check network requests for `/store/products`

### Flow Verification:
- [ ] After booking tour, verify redirect URL
- [ ] Ensure multi-step flow displays correctly
- [ ] Test category progression (Food → Photo → Equipment → Activities → Connectivity)
- [ ] Verify "Skip All" functionality
- [ ] Test final redirect to `/checkout`

## Recommended Actions

### Immediate Fixes:

1. **Ensure Products are Seeded**:
   ```bash
   npm run seed
   ```

2. **Update Tour Detail Redirect** (line 195):
   ```typescript
   // OLD: router.push('/checkout/add-ons');
   // NEW:
   router.push('/checkout/add-ons-flow');
   ```

3. **Test API Endpoint**:
   ```bash
   curl -H "x-publishable-api-key: YOUR_KEY" \
        "http://localhost:9000/store/products?region_id=YOUR_REGION_ID"
   ```

### Investigation Script:

Create a test script to verify add-on associations:

```typescript
// Test script: test-addon-associations.ts
import { fetchAllAddOns } from '@/lib/data/addons-service';
import { filterAddonsForTour } from '@/lib/data/addon-filtering';

const TOURS = [
  '1d-rainbow-beach',
  '1d-fraser-island',
  '2d-fraser-rainbow',
  '3d-fraser-rainbow',
  '4d-fraser-rainbow'
];

async function testAddonAssociations() {
  const { addons } = await fetchAllAddOns();

  console.log(`\n📦 Total Add-ons: ${addons.length}\n`);

  for (const tourHandle of TOURS) {
    const filtered = filterAddonsForTour(addons, tourHandle);
    console.log(`🎯 ${tourHandle}: ${filtered.length} add-ons`);
    console.log(`   Categories:`, [...new Set(filtered.map(a => a.category))]);
  }

  // Find add-ons with missing metadata
  const invalid = addons.filter(a =>
    !a.metadata?.applicable_tours ||
    a.metadata.applicable_tours.length === 0
  );

  if (invalid.length > 0) {
    console.log(`\n⚠️  ${invalid.length} add-ons missing applicable_tours:`);
    invalid.forEach(a => console.log(`   - ${a.title} (${a.id})`));
  }
}
```

## Configuration Files to Check

1. **Environment Variables** (`.env`):
   - `NEXT_PUBLIC_API_URL` - Backend API URL
   - `NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY` - API key

2. **Seed Scripts**:
   - `/Users/Karim/med-usa-4wd/src/scripts/seed.ts`
   - `/Users/Karim/med-usa-4wd/src/scripts/seed-addons.ts`
   - `/Users/Karim/med-usa-4wd/src/modules/seeding/tour-seed.ts`

3. **Service Files**:
   - `/Users/Karim/med-usa-4wd/storefront/lib/data/addons-service.ts`
   - `/Users/Karim/med-usa-4wd/storefront/lib/data/addon-flow-service.ts`
   - `/Users/Karim/med-usa-4wd/storefront/lib/data/addon-filtering.ts`

## Expected Behavior vs Current Behavior

### Expected:
1. User books a tour → Redirected to `/checkout/add-ons-flow`
2. Multi-step flow shows 14-17 add-ons (depending on tour)
3. User can select add-ons across 5 categories
4. User proceeds to `/checkout` for payment

### Current (if bypassing):
1. User books a tour → Redirected to `/checkout/add-ons` or `/checkout/add-ons-flow`
2. Page shows "No Add-ons Available"
3. User immediately proceeds to `/checkout`

## Next Steps

1. **Run seed script** to ensure products exist
2. **Test API endpoint** to verify products are accessible
3. **Update tour detail redirect** to use new flow
4. **Run test script** to verify add-on associations
5. **Document findings** in this report

## Files Modified/Created

- Investigation report: `/Users/Karim/med-usa-4wd/docs/investigations/addon-bypass-investigation.md`
- Test script (to be created): `/Users/Karim/med-usa-4wd/scripts/test-addon-associations.ts`

## Conclusion

The add-ons flow is **not being bypassed by design** - it correctly shows "No Add-ons Available" when:
1. Products aren't seeded
2. Add-ons have no `applicable_tours` metadata
3. API fails to return products

**Most Likely Issue**: Products not seeded or API not accessible.

**Fix**: Run `npm run seed` and verify backend is running.
