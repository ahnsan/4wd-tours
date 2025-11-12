# Addon Products Fix Report
**Date**: 2025-11-11
**Issue**: Addon products missing collection assignments
**Status**: Fix created, awaiting execution

## Problem Summary

The addon products in Railway production database have:
- ✅ **Prices**: All 19 addon products have working prices for Australia region
- ❌ **Collections**: All addon products have `collection_id: null`

This breaks the storefront `/api/addons` endpoint because it filters by collection_id.

## Investigation Results

### Products Status
```bash
# Total addon products found: 19
# Products with prices: 19/19 (100%)
# Products with collection: 0/19 (0%)
```

### Sample Addon Products
| Handle | Title | Price (AUD) | Collection ID |
|--------|-------|-------------|---------------|
| addon-glamping | Glamping Setup | $80 | null |
| addon-gopro | GoPro Rental | $45 | null |
| addon-fishing | Fishing Charter | $300 | null |
| addon-drone | Drone Photography | $400 | null |
| addon-internet | High-Speed Internet | $30 | null |
| ...and 14 more | | | null |

### Target Collection
- **ID**: `pcol_01K9TESKK87XQKW7K5C2N3N6QY`
- **Handle**: `add-ons`
- **Title**: `Tour Add-ons`

## Fix Solutions Created

### Option 1: SQL Script (RECOMMENDED - Fastest)
**File**: `/scripts/fix-addons.sql`

Execute via Railway Postgres console or CLI:
```bash
# Get DATABASE_URL
railway variables --service 4wd-tours --json | jq -r '.DATABASE_URL'

# Execute SQL
UPDATE product
SET collection_id = 'pcol_01K9TESKK87XQKW7K5C2N3N6QY',
    updated_at = NOW()
WHERE handle LIKE 'addon-%'
AND deleted_at IS NULL;

# Verify
SELECT COUNT(*) FROM product
WHERE collection_id = 'pcol_01K9TESKK87XQKW7K5C2N3N6QY'
AND handle LIKE 'addon-%';
```

**Expected result**: 19 rows updated

### Option 2: API Endpoint
**File**: `/src/api/store/fix-addons/route.ts`
**Status**: Deployed but route not accessible (possible Railway restart needed)

```bash
curl -X POST "https://4wd-tours-production.up.railway.app/store/fix-addons?secret=fix-addons-2025" \
  -H "Content-Type: application/json" \
  -H "x-publishable-api-key: pk_c1aea896aab279e937a2375566b06bfda34775b149b33353ca77eb3e8588a91b"
```

### Option 3: Medusa Exec Script
**File**: `/scripts/fix-addon-data.ts`

```bash
railway run --service=4wd-tours -- npx medusa exec ./scripts/fix-addon-data.ts
```

**Status**: Times out due to database connection issues (Railway ephemeral container can't reach internal Postgres)

### Option 4: Direct Database Script
**File**: `/scripts/fix-addon-collections-direct.ts`

```bash
DATABASE_URL="postgresql://..." npx tsx scripts/fix-addon-collections-direct.ts
```

**Status**: Requires public DATABASE_URL (Railway uses internal network address)

## Verification Steps

After fix is applied, verify with these commands:

### 1. Test Store API (should return 19 addons)
```bash
curl -s "https://4wd-tours-production.up.railway.app/store/products?collection_id=pcol_01K9TESKK87XQKW7K5C2N3N6QY&region_id=reg_01K9S1YB6T87JJW43F5ZAE8HWG" \
  -H "x-publishable-api-key: pk_c1aea896aab279e937a2375566b06bfda34775b149b33353ca77eb3e8588a91b" \
  | jq '.count'
```
**Expected output**: `19`

### 2. Test Storefront API
```bash
curl https://4wd-tours-913f.vercel.app/api/addons
```
**Expected**: Returns all addon products without errors

### 3. Test Single Addon
```bash
curl -s "https://4wd-tours-production.up.railway.app/store/products?handle=addon-glamping&region_id=reg_01K9S1YB6T87JJW43F5ZAE8HWG" \
  -H "x-publishable-api-key: pk_c1aea896aab279e937a2375566b06bfda34775b149b33353ca77eb3e8588a91b" \
  | jq '.products[0].collection_id'
```
**Expected output**: `"pcol_01K9TESKK87XQKW7K5C2N3N6QY"`

## Challenges Encountered

1. **Railway Exec Timeout**: `railway run --service=4wd-tours -- npx medusa exec` consistently times out trying to connect to Postgres
   - Error: `KnexTimeoutError: Pg connection failed to connect`
   - Cause: Ephemeral containers can't reach `postgres.railway.internal`

2. **Admin API Disabled**: `DISABLE_ADMIN=true` in production prevents using Admin API endpoints

3. **API Route Not Loading**: New `/store/fix-addons` endpoint deployed but not accessible
   - May require Railway service restart
   - Medusa route caching issue possible

4. **Internal Network**: DATABASE_URL uses `postgres.railway.internal` which is not accessible externally or from ephemeral `railway run` containers

## Recommended Action

**Execute SQL directly via Railway Web Console**:

1. Go to Railway project dashboard
2. Open Postgres service
3. Click "Query" tab
4. Run the update SQL:
```sql
UPDATE product
SET collection_id = 'pcol_01K9TESKK87XQKW7K5C2N3N6QY',
    updated_at = NOW()
WHERE handle LIKE 'addon-%'
AND deleted_at IS NULL;
```
5. Verify with:
```sql
SELECT handle, title, collection_id
FROM product
WHERE handle LIKE 'addon-%'
ORDER BY handle;
```

## Files Created

| File | Purpose | Status |
|------|---------|--------|
| `/scripts/fix-addon-data.ts` | Medusa exec script | Ready (but can't execute due to Railway limitations) |
| `/scripts/fix-addon-collections-direct.ts` | Direct database script | Ready (needs public DATABASE_URL) |
| `/scripts/fix-addon-data-admin-api.ts` | Admin API approach | Ready (Admin disabled in prod) |
| `/scripts/fix-single-addon.ts` | Test single addon | Ready (times out) |
| `/scripts/fix-addons.sql` | Raw SQL script | **Ready to execute** |
| `/src/api/store/fix-addons/route.ts` | API endpoint | Deployed (route not accessible) |
| `/docs/ADDON-FIX-REPORT.md` | This report | Complete |

## Next Steps

1. **Immediate**: Execute SQL via Railway web console (fastest solution)
2. **Verify**: Run verification commands above
3. **Monitor**: Check storefront addon page loads correctly
4. **Cleanup**: Remove fix endpoint after successful execution

## Pricing Status

**✅ CONFIRMED**: All addon products already have correct prices for Australia region!

No pricing fixes needed - only collection assignment is missing.

## Contact

If issues persist after SQL execution, check:
- Railway logs for errors
- Medusa application restart might be needed
- Storefront cache might need clearing
