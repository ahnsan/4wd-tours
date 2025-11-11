# Add-ons Migration to Production - Execution Plan

**Generated**: November 11, 2025
**Coordinator**: Migration Coordinator Agent
**Status**: Ready for Execution

---

## Executive Summary

This document provides a step-by-step execution plan for migrating 6 add-on products with images to the production environment on Railway and Vercel.

**Migration Scope**:
- **6 Add-on Products** to be seeded in Railway backend database
- **6 Add-on Images** (already present) to be deployed with Vercel storefront
- **Total Image Size**: 5.2MB (optimized for Next.js)
- **Target Environment**: Production (Railway backend + Vercel storefront)

---

## Current State Analysis

### Backend (Railway)
- **Service**: 4wd-tours
- **Project**: precious-alignment
- **Environment**: production
- **Public URL**: https://4wd-tours-production.up.railway.app
- **Health Status**: OK (verified)
- **Database**: PostgreSQL (accessible)

### Storefront (Vercel)
- **URL**: https://4wd-tours-913f.vercel.app
- **Images Location**: `/storefront/public/images/addons/`
- **Image Manifest**: `/storefront/public/addon-images-manifest.json`
- **Image Serving**: Via Next.js Image component (auto-optimized to WebP/AVIF)

### Local Resources Ready
- **Seed Script**: `/scripts/seed-addons.ts` (idempotent, re-runnable)
- **Upsert Module**: `/src/modules/seeding/addon-upsert.ts`
- **Addon Images**: 20 images in `/storefront/public/images/addons/` (includes extras)
- **Required Images**: 6 images for the 6 add-ons in seed script

---

## Add-ons to be Migrated

The following 6 add-on products will be created in the production database:

| Handle | Title | Category | Unit | Price (AUD) | SKU | Image Available |
|--------|-------|----------|------|-------------|-----|-----------------|
| `addon-internet` | Always-on High-Speed Internet | Connectivity | per_day | $50.00 | ADDON-INTERNET | Yes |
| `addon-glamping` | Glamping Setup | Equipment | per_booking | $250.00 | ADDON-GLAMPING | Yes |
| `addon-bbq` | BBQ on the Beach | Food & Beverage | per_day | $180.00 | ADDON-BBQ | Yes |
| `addon-camera` | Professional Camera Rental | Photography | per_booking | $75.00 | ADDON-CAMERA | Yes |
| `addon-picnic` | Gourmet Picnic Package | Food & Beverage | per_day | $85.00 | ADDON-PICNIC | Yes |
| `addon-fishing` | Fishing Gear Package | Equipment | per_day | $65.00 | ADDON-FISHING | Yes |

**Total Value**: $705 AUD in add-ons available per booking

---

## Step-by-Step Execution Plan

### Phase 1: Pre-Migration Verification (5 minutes)

#### 1.1 Verify Storefront Images
```bash
# Check that all required images exist
cd /Users/Karim/med-usa-4wd/storefront/public/images/addons
ls -lh addon-internet.jpg addon-glamping.jpg addon-bbq.jpg \
       addon-camera.jpg addon-picnic.jpg addon-fishing.jpg
```

**Expected**: All 6 image files present

#### 1.2 Verify Seed Script
```bash
# Check seed script syntax
cd /Users/Karim/med-usa-4wd
npx tsc --noEmit scripts/seed-addons.ts
```

**Expected**: No TypeScript errors

#### 1.3 Test Railway Connection
```bash
cd /Users/Karim/med-usa-4wd
railway status
curl https://4wd-tours-production.up.railway.app/health
```

**Expected**: Railway connected, backend responding "OK"

---

### Phase 2: Image Deployment (10 minutes)

#### 2.1 Deploy Storefront to Vercel
The addon images are already in `/storefront/public/images/addons/`. They will be automatically deployed with the next Vercel deployment.

**Option A: Automatic Deployment (Recommended)**
```bash
# If you have git push to trigger Vercel
cd /Users/Karim/med-usa-4wd
git add storefront/public/images/addons/
git commit -m "Add addon product images for production migration"
git push origin main
```

**Option B: Manual Vercel Deployment**
```bash
cd /Users/Karim/med-usa-4wd/storefront
vercel --prod
```

**Verification**:
- Check that images are accessible at:
  - `https://4wd-tours-913f.vercel.app/images/addons/addon-internet.jpg`
  - `https://4wd-tours-913f.vercel.app/images/addons/addon-glamping.jpg`
  - etc.

---

### Phase 3: Database Seeding (15 minutes)

#### 3.1 Execute Seed Script on Railway

**Method 1: Via Railway CLI (Recommended)**
```bash
cd /Users/Karim/med-usa-4wd
railway run npx medusa exec ./scripts/seed-addons.ts
```

**Method 2: Via Railway Dashboard**
1. Go to Railway Dashboard: https://railway.app/dashboard
2. Select project: `precious-alignment`
3. Select service: `4wd-tours`
4. Click "Settings" → "Deploy"
5. Add one-time command: `npx medusa exec ./scripts/seed-addons.ts`

**Method 3: SSH into Railway Service**
```bash
# If Railway provides SSH access
railway shell
npx medusa exec ./scripts/seed-addons.ts
exit
```

**Expected Output**:
```
🌱 Starting add-ons seeding...

✓ Add-ons collection ready (ID: pcol_xxxxx)

Creating add-on products...

✓ Created product "addon-internet" with variant and price (prod_xxxxx)
✓ Created product "addon-glamping" with variant and price (prod_xxxxx)
✓ Created product "addon-bbq" with variant and price (prod_xxxxx)
✓ Created product "addon-camera" with variant and price (prod_xxxxx)
✓ Created product "addon-picnic" with variant and price (prod_xxxxx)
✓ Created product "addon-fishing" with variant and price (prod_xxxxx)

✅ Add-ons seeding complete!
   Created 6 add-on products
   All products have handles starting with "addon-"
   Products will appear on /checkout/add-ons page
```

#### 3.2 Verify Idempotency (Re-run Safety)
```bash
# Run seed script again to verify it's idempotent
railway run npx medusa exec ./scripts/seed-addons.ts
```

**Expected Output**:
```
✓ Add-ons collection ready (ID: pcol_xxxxx)
✓ Product "addon-internet" already exists with prices (prod_xxxxx)
✓ Product "addon-glamping" already exists with prices (prod_xxxxx)
...
```

---

### Phase 4: Verification (10 minutes)

#### 4.1 Verify in Railway Database

**Option A: Direct Database Query via Railway CLI**
```bash
cd /Users/Karim/med-usa-4wd
railway connect postgres

# In PostgreSQL shell:
SELECT handle, title, status FROM product WHERE handle LIKE 'addon-%';
\q
```

**Expected**: 6 rows returned with addon products

**Option B: Via Medusa Admin Script**
```bash
cd /Users/Karim/med-usa-4wd
railway run npx medusa exec ./scripts/list-products.ts | grep addon-
```

#### 4.2 Test Store API Endpoint

First, get the Medusa publishable API key:
```bash
cd /Users/Karim/med-usa-4wd
railway run npx medusa exec ./scripts/get-api-key.ts
```

Then test the products endpoint:
```bash
# Replace pk_xxxxx with actual publishable key
export MEDUSA_PUBLISHABLE_KEY="pk_xxxxx"

curl -H "x-publishable-api-key: $MEDUSA_PUBLISHABLE_KEY" \
     "https://4wd-tours-production.up.railway.app/store/products?handle=addon-internet"

curl -H "x-publishable-api-key: $MEDUSA_PUBLISHABLE_KEY" \
     "https://4wd-tours-production.up.railway.app/store/products?handle=addon-"
```

**Expected**: JSON response with addon products including:
- `handle`: "addon-internet", etc.
- `title`: "Always-on High-Speed Internet", etc.
- `variants`: array with variant data
- `calculated_price`: price information

#### 4.3 Test Storefront Add-ons Page

```bash
# Check if add-ons page loads
curl -I https://4wd-tours-913f.vercel.app/checkout/add-ons

# Check if add-ons API works from storefront
curl https://4wd-tours-913f.vercel.app/api/addons
```

**Expected**: 200 OK responses

#### 4.4 Verify Image URLs

```bash
# Test that all addon images are accessible
for addon in internet glamping bbq camera picnic fishing; do
  curl -I "https://4wd-tours-913f.vercel.app/images/addons/addon-$addon.jpg"
done
```

**Expected**: All return 200 OK

#### 4.5 Manual Browser Verification

1. **Add-ons Page**: Visit https://4wd-tours-913f.vercel.app/checkout/add-ons
   - Should display 6 add-on cards
   - Each card should show correct image
   - Prices should display correctly
   - Click each card to verify details

2. **Checkout Flow**: Add a tour to cart, proceed to checkout
   - Add-ons drawer should appear
   - Should show all 6 add-ons
   - Images should load quickly (Next.js optimized)
   - Selecting add-ons should update cart

---

## Phase 5: Post-Migration Validation (5 minutes)

### 5.1 Collection Verification
```bash
# Verify "Add-ons" collection exists and has products
cd /Users/Karim/med-usa-4wd
railway run npx medusa exec ./scripts/check-collections.ts
```

**Expected**: "Add-ons" collection with 6 products

### 5.2 Pricing Verification
```bash
# Verify prices are correctly linked to variants
railway run npx medusa exec ./scripts/check-pricing-links.ts
```

**Expected**: All 6 addon variants have price sets linked

### 5.3 Metadata Verification
```bash
# Verify metadata is correctly stored
railway run npx medusa exec ./src/modules/seeding/verify-addon-metadata.ts
```

**Expected**: All addons have metadata including:
- `category`
- `unit`
- `icon`
- `description`
- `persuasive_title`
- `persuasive_description`
- `features` (array)
- `social_proof`
- `best_for` (array)

---

## Rollback Plan

If migration fails or issues are detected:

### 1. Database Rollback
```bash
# Delete addon products if needed
cd /Users/Karim/med-usa-4wd
railway run npx medusa exec ./scripts/delete-all-products.ts --filter="addon-"
```

### 2. Collection Cleanup
```bash
# Remove "Add-ons" collection if needed (will not delete products)
railway run npx medusa exec ./scripts/delete-collection.ts --handle="add-ons"
```

### 3. Storefront Rollback
```bash
# Revert Vercel deployment to previous version
vercel rollback https://4wd-tours-913f.vercel.app
```

---

## Troubleshooting

### Issue: Seed Script Fails with "Collection not found"
**Solution**: The script creates the collection first. If it fails, check:
```bash
railway run npx medusa exec ./scripts/check-collections.ts
```

### Issue: Price is 0 or null in API response
**Solution**: Check price set linkage:
```bash
railway run npx medusa exec ./scripts/check-pricing-links.ts
```

### Issue: Images not loading on storefront
**Solution**:
1. Verify images exist in Vercel deployment
2. Check Next.js image optimization settings
3. Verify image paths in manifest match actual files

### Issue: Railway CLI times out
**Solution**:
1. Use Railway Dashboard method instead
2. Check DATABASE_URL is correctly set as reference
3. Verify Railway service is running: `railway status`

---

## Success Criteria

Migration is considered successful when:

- [ ] All 6 addon products exist in Railway database
- [ ] All products have status "published"
- [ ] All products have variants with correct SKUs
- [ ] All variants have price sets linked (visible in API)
- [ ] "Add-ons" collection exists with 6 products
- [ ] All addon handles start with "addon-"
- [ ] Store API returns all addons with prices
- [ ] All 6 addon images are accessible on Vercel
- [ ] Images load on /checkout/add-ons page
- [ ] Add-ons appear in checkout drawer
- [ ] Metadata is intact for all products
- [ ] Re-running seed script is idempotent (no duplicates)

---

## Next Steps After Migration

1. **Monitor Performance**:
   - Check PageSpeed Insights for image optimization
   - Monitor Core Web Vitals on add-ons page

2. **Update Documentation**:
   - Mark migration as complete in project docs
   - Document any lessons learned

3. **Enable Inventory Management** (Optional):
   - If needed, enable `manage_inventory` for specific add-ons
   - Set up stock quantities

4. **A/B Testing** (Optional):
   - Test different persuasive copy variations
   - Monitor conversion rates for each add-on

5. **Analytics Setup**:
   - Track which add-ons are most popular
   - Monitor average order value with add-ons

---

## Contact & Support

- **Railway Dashboard**: https://railway.app/dashboard
- **Vercel Dashboard**: https://vercel.com/dashboard
- **Project Repo**: /Users/Karim/med-usa-4wd/
- **Documentation**: /Users/Karim/med-usa-4wd/docs/

---

## Appendix: File Locations

### Backend (Railway)
- Seed Script: `/scripts/seed-addons.ts`
- Upsert Module: `/src/modules/seeding/addon-upsert.ts`
- Verification Script: `/src/modules/seeding/verify-addon-metadata.ts`

### Storefront (Vercel)
- Images: `/storefront/public/images/addons/`
- Manifest: `/storefront/public/addon-images-manifest.json`
- Image Utils: `/storefront/lib/utils/addon-images.ts`
- Adapter: `/storefront/lib/utils/addon-adapter.ts`
- Add-ons Page: `/storefront/app/checkout/add-ons/page.tsx`

### Configuration
- Railway Config: `/railway.json`
- Start Script: `/scripts/railway-start.sh`
- Environment Variables: Railway Dashboard

---

**End of Execution Plan**
