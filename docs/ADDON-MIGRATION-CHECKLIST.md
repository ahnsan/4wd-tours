# Add-ons Migration Checklist

Quick checklist for executing the add-ons migration to production.

---

## Pre-Migration Checks

- [ ] Railway CLI logged in: `railway status`
- [ ] Vercel CLI logged in: `vercel whoami`
- [ ] Backend health check: `curl https://4wd-tours-production.up.railway.app/health`
- [ ] All 6 addon images exist: `ls -lh storefront/public/images/addons/addon-*.jpg | grep -E "(internet|glamping|bbq|camera|picnic|fishing)"`
- [ ] Seed script verified: `npx tsc --noEmit scripts/seed-addons.ts`

---

## Phase 1: Deploy Images

- [ ] Navigate to storefront: `cd /Users/Karim/med-usa-4wd/storefront`
- [ ] Deploy to Vercel: `vercel --prod`
- [ ] Note deployment URL: ___________________________________
- [ ] Verify image access: `curl -I https://4wd-tours-913f.vercel.app/images/addons/addon-internet.jpg`
- [ ] Check HTTP status: Expected **200 OK**

---

## Phase 2: Seed Database

- [ ] Navigate to root: `cd /Users/Karim/med-usa-4wd`
- [ ] Run seed script: `railway run npx medusa exec ./scripts/seed-addons.ts`
- [ ] Watch for success message: "✅ Add-ons seeding complete!"
- [ ] Note product IDs from output: ___________________________________
- [ ] Verify idempotency: Re-run seed script (should show "already exists")

### Alternative if Railway CLI times out:
- [ ] Go to Railway Dashboard: https://railway.app/dashboard
- [ ] Select project: precious-alignment → service: 4wd-tours
- [ ] Run command: `npx medusa exec ./scripts/seed-addons.ts`

---

## Phase 3: Verification

### 3.1 Database Verification
- [ ] Connect to database: `railway connect postgres`
- [ ] Query products: `SELECT handle, title, status FROM product WHERE handle LIKE 'addon-%';`
- [ ] Verify 6 rows returned
- [ ] Exit database: `\q`

### 3.2 API Verification
- [ ] Get publishable key: `railway run npx medusa exec ./scripts/get-api-key.ts`
- [ ] Test single addon:
  ```bash
  curl -H "x-publishable-api-key: pk_xxxxx" \
       "https://4wd-tours-production.up.railway.app/store/products?handle=addon-internet"
  ```
- [ ] Verify response contains product data with prices
- [ ] Test all addons:
  ```bash
  curl -H "x-publishable-api-key: pk_xxxxx" \
       "https://4wd-tours-production.up.railway.app/store/products?handle=addon-"
  ```
- [ ] Verify response contains 6 products

### 3.3 Storefront Verification
- [ ] Visit add-ons page: https://4wd-tours-913f.vercel.app/checkout/add-ons
- [ ] Verify 6 addon cards display
- [ ] Verify all images load correctly
- [ ] Verify prices display correctly
- [ ] Click each addon to view details

### 3.4 Image URL Verification
Test each image:
- [ ] addon-internet: `curl -I https://4wd-tours-913f.vercel.app/images/addons/addon-internet.jpg`
- [ ] addon-glamping: `curl -I https://4wd-tours-913f.vercel.app/images/addons/addon-glamping.jpg`
- [ ] addon-bbq: `curl -I https://4wd-tours-913f.vercel.app/images/addons/addon-bbq.jpg`
- [ ] addon-camera: `curl -I https://4wd-tours-913f.vercel.app/images/addons/addon-camera.jpg`
- [ ] addon-picnic: `curl -I https://4wd-tours-913f.vercel.app/images/addons/addon-picnic.jpg`
- [ ] addon-fishing: `curl -I https://4wd-tours-913f.vercel.app/images/addons/addon-fishing.jpg`
All should return **200 OK**

### 3.5 Checkout Flow Verification
- [ ] Add a tour to cart
- [ ] Proceed to checkout
- [ ] Verify add-ons drawer appears
- [ ] Select an addon (e.g., Glamping Setup)
- [ ] Verify addon appears in cart
- [ ] Verify price is added to total
- [ ] Remove addon
- [ ] Verify addon is removed from cart

---

## Phase 4: Post-Migration Validation

### 4.1 Collection Check
- [ ] Run: `railway run npx medusa exec ./scripts/check-collections.ts`
- [ ] Verify "Add-ons" collection exists
- [ ] Verify collection has 6 products

### 4.2 Pricing Check
- [ ] Run: `railway run npx medusa exec ./scripts/check-pricing-links.ts`
- [ ] Verify all 6 variants have price sets linked
- [ ] Verify prices are in correct region (Australia)

### 4.3 Metadata Check
- [ ] Run: `railway run npx medusa exec ./src/modules/seeding/verify-addon-metadata.ts`
- [ ] Verify all addons have complete metadata:
  - [ ] category
  - [ ] unit
  - [ ] icon
  - [ ] description
  - [ ] persuasive_title
  - [ ] persuasive_description
  - [ ] features (array)
  - [ ] social_proof
  - [ ] best_for (array)

---

## Success Criteria

All must be checked:
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

## Migration Complete!

Date completed: ___________________________________
Time taken: ___________________________________
Issues encountered: ___________________________________
___________________________________
___________________________________

Notes:
___________________________________
___________________________________
___________________________________

---

## Rollback (If Needed)

If migration fails:
- [ ] Delete addon products: `railway run npx medusa exec ./scripts/delete-all-products.ts --filter="addon-"`
- [ ] Rollback Vercel: `vercel rollback https://4wd-tours-913f.vercel.app`
- [ ] Document issue: ___________________________________

---

## Reference Documentation

- Full execution plan: `/docs/ADDON-MIGRATION-EXECUTION-PLAN.md`
- Quick start guide: `/docs/ADDON-MIGRATION-QUICK-START.md`
- Coordination summary: `/docs/ADDON-MIGRATION-COORDINATION-SUMMARY.md`
