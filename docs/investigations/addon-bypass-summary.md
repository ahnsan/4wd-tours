# Add-ons Flow Investigation - Quick Summary

## TL;DR

**The add-ons flow is NOT bypassed** - it works correctly. However, it may show "No Add-ons Available" for these reasons:

1. ❌ Backend products not seeded
2. ❌ Add-ons missing `applicable_tours` metadata
3. ❌ Wrong redirect URL in tour detail page

## Quick Test

Run this to check if products are properly configured:

```bash
npm run test:addons
```

## Expected Results by Tour

| Tour | Expected Add-ons |
|------|------------------|
| 1d-rainbow-beach | 15 add-ons |
| 1d-fraser-island | 14 add-ons |
| 2d-fraser-rainbow | 17 add-ons |
| 3d-fraser-rainbow | 17 add-ons |
| 4d-fraser-rainbow | 17 add-ons |

## Add-on Categories

- **Food & Beverage**: 3 add-ons (all universal)
- **Connectivity**: 2 add-ons (all universal)
- **Photography**: 3 add-ons (all universal)
- **Accommodation**: 3 add-ons (1 universal, 2 multi-day only)
- **Activities**: 7 add-ons (6 universal, 1 Rainbow Beach only)

## Configuration Rules

### Universal Add-ons (14 total)
All tours get these add-ons via `applicable_tours: ["*"]`

### Multi-day Only (2 total)
Only 2d/3d/4d tours get:
- Glamping Setup
- Eco-Lodge Upgrade

### Rainbow Beach Only (1 total)
Only Rainbow Beach tours get:
- Sandboarding Gear

## Common Issues & Fixes

### Issue 1: "No Add-ons Available" appears for all tours

**Cause**: Products not seeded or backend not running

**Fix**:
```bash
npm run seed
```

### Issue 2: Some tours have fewer add-ons than expected

**Cause**: Missing `applicable_tours` metadata

**Fix**: Check seed data in `/Users/Karim/med-usa-4wd/src/modules/seeding/tour-seed.ts`

### Issue 3: Add-ons page not showing after booking

**Cause**: Wrong redirect URL in tour detail page

**Fix**: Update line 195 in `tour-detail-client.tsx`:
```typescript
// Change from:
router.push('/checkout/add-ons');

// To:
router.push('/checkout/add-ons-flow');
```

## Key Files

- **Seed Data**: `/Users/Karim/med-usa-4wd/src/modules/seeding/tour-seed.ts`
- **Filtering Logic**: `/Users/Karim/med-usa-4wd/storefront/lib/data/addon-filtering.ts`
- **Flow Service**: `/Users/Karim/med-usa-4wd/storefront/lib/data/addon-flow-service.ts`
- **Add-ons Flow Page**: `/Users/Karim/med-usa-4wd/storefront/app/checkout/add-ons-flow/page.tsx`
- **Tour Detail**: `/Users/Karim/med-usa-4wd/storefront/app/tours/[handle]/tour-detail-client.tsx`

## Test Commands

```bash
# Seed all products
npm run seed

# Test add-on associations
npm run test:addons

# Start backend
npm run dev

# Start frontend (in storefront directory)
cd storefront && npm run dev
```

## Next Actions

1. ✅ Run `npm run seed` to ensure products exist
2. ✅ Run `npm run test:addons` to verify associations
3. ⚠️ Update tour detail redirect if needed
4. ✅ Test each tour's add-ons flow manually

## Full Investigation Report

See `/Users/Karim/med-usa-4wd/docs/investigations/addon-bypass-investigation.md`
