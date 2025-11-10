# Rollback Plan: Medusa v2 Pricing Migration

**Emergency Rollback Procedure**
**Last Updated**: November 10, 2025

---

## When to Use This Rollback

Use this rollback plan if:
- Orders are being created with incorrect amounts after migration
- Frontend displays wrong prices after code update
- Database migration caused data corruption
- Need to revert to pre-migration state for debugging

**WARNING**: Only use this if absolutely necessary. The migration fixes critical bugs.

---

## Table of Contents

1. [Quick Rollback (Frontend Only)](#quick-rollback-frontend-only)
2. [Full Rollback (Database + Frontend)](#full-rollback-database--frontend)
3. [Verification Steps](#verification-steps)
4. [Re-Migration Instructions](#re-migration-instructions)

---

## Quick Rollback (Frontend Only)

If only frontend changes are causing issues (database is correct):

### Step 1: Revert Code Changes

```bash
cd /Users/Karim/med-usa-4wd/storefront

# Option A: Git revert (recommended)
git log --oneline | grep -i "price\|pricing"
git revert <commit-hash>

# Option B: Manual revert (if no git commit)
# Continue to Step 2
```

---

### Step 2: Revert addon-adapter.ts

**File**: `/Users/Karim/med-usa-4wd/storefront/lib/utils/addon-adapter.ts`
**Lines**: 78-82

**Revert TO**:
```typescript
// Pricing
price_cents: calculatedPrice.calculated_amount,
currency_code: calculatedPrice.currency_code || 'aud',

// Availability
available: product.status === 'published',
```

**Current (POST-migration)**:
```typescript
// CRITICAL FIX: Medusa v2 returns prices in dollars (major units), not cents
// Frontend expects cents, so we multiply by 100 to convert dollars → cents
price_cents: Math.round(calculatedPrice.calculated_amount * 100),
currency_code: calculatedPrice.currency_code || 'aud',

// Store API only returns published products
available: true,
```

---

### Step 3: Revert pricing.ts

**File**: `/Users/Karim/med-usa-4wd/storefront/lib/utils/pricing.ts`
**Lines**: 133-139

**Revert TO**:
```typescript
if (variant.calculated_price && variant.calculated_price.calculated_amount) {
  return {
    amount: variant.calculated_price.calculated_amount,
    currency_code: variant.calculated_price.currency_code || 'AUD',
  };
}
```

**Current (POST-migration)**:
```typescript
if (variant.calculated_price && variant.calculated_price.calculated_amount) {
  // CRITICAL FIX: Medusa v2 returns prices in dollars (major units), not cents
  // Convert to cents by multiplying by 100
  return {
    amount: Math.round(variant.calculated_price.calculated_amount * 100),
    currency_code: variant.calculated_price.currency_code || 'AUD',
  };
}
```

---

### Step 4: Restart Frontend

```bash
# Kill development server
pkill -f "next dev"

# Clear cache
rm -rf .next

# Restart
npm run dev
```

---

### Step 5: Verify Rollback

```bash
# Check that code reverted
git diff HEAD storefront/lib/utils/addon-adapter.ts
git diff HEAD storefront/lib/utils/pricing.ts

# Should show your reverts
```

---

## Full Rollback (Database + Frontend)

If database migration needs to be reverted:

### CRITICAL WARNING

**DO NOT run database rollback unless**:
1. You have a confirmed database backup
2. You verified backup integrity
3. You have approval from team lead
4. You documented the reason for rollback

---

### Step 1: Verify Backup Exists

```bash
# Check for database backup
ls -lh /path/to/backups/medusa_db_*.sql

# If no backup, CREATE ONE NOW before rolling back
pg_dump medusa_db > /tmp/medusa_db_before_rollback_$(date +%Y%m%d_%H%M%S).sql
```

---

### Step 2: Identify Affected Records

```bash
# Connect to database
psql -d medusa_db

# Check current prices (should be in dollars for v2)
SELECT id, amount, currency_code, created_at
FROM price
WHERE currency_code = 'AUD'
ORDER BY amount DESC
LIMIT 20;

# If amounts like 200, 2000, 50 (dollars) → database was migrated
# If amounts like 20000, 200000, 5000 (cents) → database NOT migrated
```

---

### Step 3: Rollback Database (Multiply by 100)

**ONLY RUN THIS IF**: You confirmed database has dollar amounts and need cents format.

```sql
-- Start transaction (can rollback if error)
BEGIN;

-- Backup current state
CREATE TABLE price_backup_20251110 AS SELECT * FROM price;

-- Convert dollars → cents (multiply by 100)
UPDATE price
SET amount = amount * 100
WHERE currency_code = 'AUD';

-- Verify changes
SELECT id, amount, currency_code
FROM price
WHERE currency_code = 'AUD'
ORDER BY amount DESC
LIMIT 10;

-- If correct, commit
COMMIT;

-- If wrong, rollback
ROLLBACK;
```

**Expected Results After Rollback**:
- $200 tour → 20000 (cents)
- $2000 tour → 200000 (cents)
- $50 addon → 5000 (cents)

---

### Step 4: Revert Backend Seed Script

**File**: `/Users/Karim/med-usa-4wd/src/scripts/seed.ts`

**Revert commit**: `fe7a6ff`

```bash
cd /Users/Karim/med-usa-4wd

# Option A: Git revert
git revert fe7a6ff

# Option B: Manual changes
# Find all price amounts in seed.ts and multiply by 100
# Example: amount: 200 → amount: 20000
```

---

### Step 5: Revert Frontend Code

Follow [Quick Rollback (Frontend Only)](#quick-rollback-frontend-only) steps above.

---

### Step 6: Restart All Services

```bash
# Backend
cd /Users/Karim/med-usa-4wd
npm run dev  # or whatever starts Medusa backend

# Frontend
cd /Users/Karim/med-usa-4wd/storefront
rm -rf .next
npm run dev
```

---

## Verification Steps

After rollback, verify system is working:

### 1. Database Verification

```sql
-- Prices should be in CENTS (if fully rolled back)
SELECT id, amount, currency_code
FROM price
WHERE currency_code = 'AUD'
LIMIT 10;

-- Expected: 20000 (cents) for $200 tour
```

---

### 2. API Verification

```bash
# Fetch product from Store API
curl "http://localhost:9000/store/products/<product_id>?region_id=<region_id>"

# Check calculated_amount value
# If rollback complete: should be in cents (20000)
# If migration active: should be in dollars (200)
```

---

### 3. Frontend Display Verification

1. Open `http://localhost:8000/tours`
2. Check tour prices:
   - **If rollback successful**: Prices should show correctly (no 1000x inflation)
   - **If rollback failed**: Prices may still be wrong

3. Check browser console for errors
4. Check cart operations work

---

### 4. Test Order Creation

**CRITICAL TEST**:

1. Add tour to cart
2. Add addon to cart
3. Proceed to checkout
4. Complete order (test mode)

**Check order in database**:
```sql
SELECT id, total, subtotal, currency_code
FROM "order"
ORDER BY created_at DESC
LIMIT 1;
```

**Expected**:
- Rollback successful: Order total matches expected amount
- Rollback failed: Order total is wrong (1000x inflation)

---

## Re-Migration Instructions

If you rolled back and need to re-apply the migration:

### Step 1: Review Why Rollback Was Needed

Document the issue that caused rollback:
- Was it database corruption?
- Frontend bug?
- Testing issue?
- Misunderstanding of requirements?

---

### Step 2: Fix Root Cause

Before re-migrating:
1. Fix the bug that caused rollback
2. Test thoroughly in development
3. Create new database backup
4. Document changes

---

### Step 3: Re-Apply Migration

**Database Migration**:
```sql
-- Verify current state (should be cents)
SELECT amount FROM price WHERE currency_code = 'AUD' LIMIT 5;

-- Convert cents → dollars (divide by 100)
BEGIN;

UPDATE price
SET amount = amount / 100
WHERE currency_code = 'AUD';

-- Verify
SELECT amount FROM price WHERE currency_code = 'AUD' LIMIT 5;

COMMIT;
```

**Frontend Code**:
1. Re-apply changes to `addon-adapter.ts` (multiply by 100)
2. Re-apply changes to `pricing.ts` (multiply by 100)
3. Test thoroughly before deploying

---

### Step 4: Extended Testing

Before deploying re-migration:
- [ ] Run full test suite
- [ ] Manual testing of all price displays
- [ ] Test cart operations
- [ ] Test order creation (end-to-end)
- [ ] Verify database values
- [ ] Check API responses
- [ ] Review browser console for errors

---

## Emergency Contacts

If rollback causes critical issues:

1. **Check documentation**: `/docs/MEDUSA-V2-PRICING-MIGRATION.md`
2. **Review developer guide**: `/docs/DEVELOPER-PRICING-GUIDE.md`
3. **Check Medusa docs**: https://docs.medusajs.com/resources/commerce-modules/product/price
4. **Consult team lead**: Document issue and findings

---

## Rollback Checklist

Use this checklist when performing rollback:

### Pre-Rollback
- [ ] Documented reason for rollback
- [ ] Created database backup
- [ ] Verified backup integrity
- [ ] Got approval (if production)
- [ ] Notified team

### During Rollback
- [ ] Reverted frontend code (addon-adapter.ts)
- [ ] Reverted frontend code (pricing.ts)
- [ ] Reverted database (if needed)
- [ ] Reverted backend seed script (if needed)
- [ ] Restarted services
- [ ] Cleared caches

### Post-Rollback
- [ ] Verified database prices
- [ ] Verified API responses
- [ ] Verified frontend displays
- [ ] Tested cart operations
- [ ] Tested order creation
- [ ] Documented results
- [ ] Created plan for re-migration (if needed)

---

## Common Rollback Scenarios

### Scenario 1: Frontend Shows Wrong Prices

**Issue**: Prices displayed as $200,000 instead of $200

**Solution**: Frontend rollback only (Step 2-3 above)

**Likely Cause**: Frontend code reverted but database not rolled back

---

### Scenario 2: Orders Create with Wrong Amounts

**Issue**: Order totals incorrect in database

**Solution**: Full rollback (database + frontend)

**Likely Cause**: Database not migrated correctly

---

### Scenario 3: Cart Operations Fail

**Issue**: Adding items to cart fails or shows errors

**Solution**: Check both frontend and API responses, may need partial rollback

**Likely Cause**: Mismatch between frontend expectations and API format

---

## Prevention

To avoid needing rollbacks:

1. **Always test in development first**
2. **Create database backups before migrations**
3. **Use transactions for database changes**
4. **Test end-to-end before deploying**
5. **Document all changes**
6. **Review code carefully**
7. **Use staging environment**

---

## Additional Resources

- **Migration Guide**: `/Users/Karim/med-usa-4wd/docs/MEDUSA-V2-PRICING-MIGRATION.md`
- **Developer Guide**: `/Users/Karim/med-usa-4wd/docs/DEVELOPER-PRICING-GUIDE.md`
- **Pricing Utils**: `/Users/Karim/med-usa-4wd/storefront/lib/utils/pricing.ts`
- **Medusa v2 Docs**: https://docs.medusajs.com/resources/commerce-modules/product/price

---

**Document Version**: 1.0
**Last Updated**: November 10, 2025
**Review Date**: Before any production rollback
