# Production Deployment Plan - Best Practices

**Date**: 2025-11-12
**Status**: PLANNING PHASE
**Goal**: Deploy to Railway + Vercel with proper environment separation

---

## Core Principles

1. **Same Code, Different Config**: One codebase works everywhere via environment variables
2. **Verify Before Deploy**: Check local works, then check each production step
3. **Data First, Code Second**: Ensure database state is correct before deploying frontend
4. **Incremental Deployment**: Deploy one service at a time, verify, then proceed

---

## Phase 1: Pre-Deployment Verification (LOCAL)

### 1.1 Verify Local Backend Works
```bash
# Terminal 1: Start backend
npm run dev

# Terminal 2: Test endpoints
curl http://localhost:9000/health
curl http://localhost:9000/store/products?limit=1
```

**Success Criteria**:
- ✅ Backend starts without errors
- ✅ Admin UI loads at http://localhost:9000/app
- ✅ Store API returns products
- ✅ Admin API requires auth

### 1.2 Verify Local Database State
```sql
-- Check collections
SELECT id, handle, title FROM product_collection;
-- Should return: 2 rows (4WD Tours, Tour Add-ons)

-- Check products have collections
SELECT COUNT(*) FROM product WHERE collection_id IS NOT NULL;
-- Should return: 24 (all products assigned)

-- Check addon pricing exists
SELECT p.handle, pr.amount, pr.currency_code
FROM product p
JOIN product_variant pv ON pv.product_id = p.id
JOIN variant_price_set vps ON vps.variant_id = pv.id
JOIN price_set ps ON ps.id = vps.price_set_id
JOIN price pr ON pr.price_set_id = ps.id
WHERE p.handle LIKE 'addon-%'
LIMIT 5;
-- Should return: Prices in dollars (50, 200, etc.)
```

**Success Criteria**:
- ✅ 2 collections exist
- ✅ 24 products have collection_id
- ✅ All addons have regional pricing

### 1.3 Verify Local Storefront Works
```bash
cd storefront
npm run dev

# Test in browser
open http://localhost:8000
open http://localhost:8000/tours/1d-fraser-island
```

**Success Criteria**:
- ✅ Homepage loads
- ✅ Tour pages load with correct pricing
- ✅ Add-ons page loads without 500 errors

---

## Phase 2: Railway Backend Deployment

### 2.1 Set Railway Environment Variables

**Required Variables**:
```bash
# Admin Configuration
DISABLE_ADMIN=true
BACKEND_URL=https://4wd-tours-production.up.railway.app

# CORS Configuration
STORE_CORS=https://4wd-tours-913f.vercel.app,https://*.vercel.app
ADMIN_CORS=https://medusa-admin-4wd-tours-fixed.vercel.app,https://*.vercel.app
AUTH_CORS=https://medusa-admin-4wd-tours-fixed.vercel.app,https://*.vercel.app

# Secrets (already set)
JWT_SECRET=[already-configured]
COOKIE_SECRET=[already-configured]
DATABASE_URL=[auto-provided-by-railway]
REDIS_URL=[auto-provided-by-railway]

# Stripe (already set)
STRIPE_API_KEY=[already-configured]
STRIPE_WEBHOOK_SECRET=[already-configured]

# Node Environment
NODE_ENV=production
```

**Action Items**:
1. ✅ Verify all variables in Railway dashboard
2. ✅ Update DISABLE_ADMIN to `true`
3. ✅ Update BACKEND_URL to Railway URL
4. ✅ Update all CORS variables

### 2.2 Deploy Backend Code

```bash
# Push latest code
git push origin master

# Monitor deployment
railway logs --service=4wd-tours
```

**Success Criteria**:
- ✅ Build completes without TypeScript errors
- ✅ Migrations run successfully
- ✅ Server starts without crashes
- ✅ Health endpoint returns 200
- ✅ Admin UI returns 404 (disabled correctly)

### 2.3 Verify Railway Database State

**CRITICAL: Check database has correct data**

```bash
# Option A: Railway Dashboard > Data tab
# Check product_collection table: Should have 2 rows

# Option B: Railway CLI
railway connect
\c railway
SELECT COUNT(*) FROM product_collection;
SELECT COUNT(*) FROM product WHERE collection_id IS NOT NULL;
```

**If database is missing data, STOP and run seed scripts first**:
```bash
railway run --service=4wd-tours -- npx medusa exec ./scripts/seed-tours.ts
```

### 2.4 Add Regional Pricing for Add-ons

**TWO OPTIONS**:

**Option A: HTTP Endpoint (if deployed)**
```bash
curl "https://4wd-tours-production.up.railway.app/store/fix-addons?secret=fix-addons-2025" \
  -H "x-publishable-api-key: pk_c1aea896aab279e937a2375566b06bfda34775b149b33353ca77eb3e8588a91b"
```

**Option B: Railway Dashboard SQL (RECOMMENDED)**
```sql
-- Add pricing for all addons at once
-- See scripts/fix-addons-pricing.sql
```

**Success Criteria**:
- ✅ All 17 addon products have Australia region pricing
- ✅ Store API returns addons with calculated_amount

---

## Phase 3: Vercel Storefront Deployment

### 3.1 Set Vercel Storefront Environment Variables

```bash
# Backend Connection
NEXT_PUBLIC_MEDUSA_BACKEND_URL=https://4wd-tours-production.up.railway.app
NEXT_PUBLIC_API_URL=https://4wd-tours-production.up.railway.app

# Publishable API Key (from Railway Medusa admin)
NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY=pk_c1aea896aab279e937a2375566b06bfda34775b149b33353ca77eb3e8588a91b

# Default Region
NEXT_PUBLIC_DEFAULT_REGION_ID=reg_01K9S1YB6T87JJW43F5ZAE8HWG

# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_[your-live-key]
```

### 3.2 Deploy Storefront

```bash
cd storefront
npx vercel --prod
```

**Success Criteria**:
- ✅ Build completes successfully
- ✅ Homepage loads (200)
- ✅ Tour pages load with correct data
- ✅ Add-ons API returns 200 (not 500)
- ✅ Add-ons page displays products

---

## Phase 4: Vercel Admin Deployment

### 4.1 Rebuild Admin with Production Backend URL

```bash
# Set production backend URL for admin build
export BACKEND_URL=https://4wd-tours-production.up.railway.app

# Build admin
npx medusa build --admin-only

# Verify build output
ls -la .medusa/admin/
cat .medusa/admin/index.html | grep -o 'backendUrl"[^"]*'
# Should show: "backendUrl":"https://4wd-tours-production.up.railway.app"
```

### 4.2 Deploy Admin to Vercel

```bash
cd .medusa/admin
npx vercel --prod

# Or if using separate admin directory
cd admin
npx vercel --prod
```

**Success Criteria**:
- ✅ Admin loads without 404
- ✅ Admin can connect to Railway backend
- ✅ Login works
- ✅ Products visible in admin

---

## Phase 5: Post-Deployment Verification

### 5.1 Test Complete User Journey

**Storefront (Customer Path)**:
1. Visit https://4wd-tours-913f.vercel.app
2. Browse tours
3. Select a tour
4. Add add-ons
5. Proceed to checkout
6. Complete payment (test mode)

**Admin (Management Path)**:
1. Visit https://medusa-admin-4wd-tours-fixed.vercel.app
2. Login with admin credentials
3. View orders
4. View products
5. Edit product
6. Save changes

### 5.2 Monitor for Errors

```bash
# Railway logs
railway logs --service=4wd-tours --tail

# Vercel logs
vercel logs 4wd-tours-913f --prod
```

**Look for**:
- ❌ CORS errors
- ❌ Authentication failures
- ❌ Database connection errors
- ❌ 500 errors

---

## Rollback Plan

If deployment fails:

### Rollback Railway
```bash
# Revert to previous deployment in Railway dashboard
# Or revert git commit and push
git revert HEAD
git push origin master
```

### Rollback Vercel
```bash
# Revert to previous deployment in Vercel dashboard
# Or redeploy previous version
vercel rollback
```

---

## Common Issues and Solutions

### Issue: Add-ons API returns 500
**Cause**: Missing regional pricing
**Fix**: Run fix-addons endpoint or SQL script

### Issue: CORS errors
**Cause**: Missing domain in Railway CORS variables
**Fix**: Update STORE_CORS, ADMIN_CORS, AUTH_CORS in Railway

### Issue: Admin can't connect to backend
**Cause**: Wrong BACKEND_URL in admin build
**Fix**: Rebuild admin with correct BACKEND_URL

### Issue: Database missing data
**Cause**: Seed scripts never ran on production
**Fix**: Run seed scripts via Railway CLI

---

## Success Metrics

**Deployment is successful when**:
- ✅ All Railway health checks pass
- ✅ Storefront loads without errors
- ✅ Admin loads and connects to backend
- ✅ Complete user journey works (browse → select → checkout)
- ✅ No CORS errors in browser console
- ✅ No 500 errors in any API endpoints
- ✅ Railway logs show no critical errors

---

**Next Steps**: Execute this plan step-by-step with agent swarm
