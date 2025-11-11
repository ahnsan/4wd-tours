# Backend Configuration Verification Guide

**Date**: 2025-11-11
**Status**: READY FOR TESTING
**Purpose**: Verify Railway backend works correctly with separate Vercel admin deployment

---

## Overview

This guide provides step-by-step verification procedures to ensure the Railway backend is correctly configured to work with a separate admin deployment on Vercel.

**What We're Testing**:
1. Backend starts without admin UI
2. Store API endpoints work correctly
3. Admin API endpoints are accessible
4. CORS is configured correctly
5. No admin-related errors in logs

---

## Pre-Verification Checklist

Before running verification tests, ensure:

- [ ] `medusa-config.ts` has `admin.disable = true`
- [ ] `scripts/railway-start.sh` is updated (no admin build logic)
- [ ] Railway environment variables are set (see RAILWAY-ENVIRONMENT-VARIABLES.md)
- [ ] Backend is deployed to Railway
- [ ] You have a valid Medusa publishable API key

---

## Local Verification (Development)

### Step 1: Prepare Local Environment

Create a test configuration file `.env.test`:

```bash
# Copy from .env but set admin to disabled
NODE_ENV=development
DATABASE_URL=postgres://localhost/medusa-4wd-tours
REDIS_URL=redis://localhost:6379

# Use development secrets (not production!)
JWT_SECRET=development-jwt-secret-minimum-32-chars-not-for-production-use-only
COOKIE_SECRET=development-cookie-secret-minimum-32-chars-not-for-production-use-only

# CORS - Allow local testing
STORE_CORS=http://localhost:8000,http://localhost:3000
ADMIN_CORS=http://localhost:5173,http://localhost:9000,http://localhost:3001
AUTH_CORS=http://localhost:5173,http://localhost:9000,http://localhost:3001

# Stripe test keys
STRIPE_API_KEY=sk_test_your_stripe_test_key_here

# Backend URL for admin to connect
BACKEND_URL=http://localhost:9000
```

**Note**: Make sure this file is in .gitignore!

### Step 2: Start Local Backend

```bash
# Navigate to project directory
cd /Users/Karim/med-usa-4wd

# Start with test environment
NODE_ENV=development npm run dev

# Or explicitly use test env file
NODE_ENV=development npx medusa develop
```

**Expected Output**:
```
========================================
Medusa Backend Starting
========================================
Admin: Disabled (Deployed separately)
Backend API: Store + Admin API endpoints
========================================
✅ Database connected
✅ Redis connected
🚀 Server listening on http://localhost:9000
📡 Store API: http://localhost:9000/store
🔐 Admin API: http://localhost:9000/admin
⚠️  Admin UI is NOT available at /app
```

**Look for**:
- ✅ No errors about missing admin files
- ✅ No errors about admin build
- ✅ Server starts successfully
- ✅ Both Store and Admin APIs are available

**Red Flags** (should NOT see):
- ❌ "Building admin..."
- ❌ "Admin build failed"
- ❌ Errors about missing .medusa/admin directory
- ❌ Admin UI warnings

### Step 3: Test Admin UI is Disabled

```bash
# Try to access admin UI (should fail)
curl http://localhost:9000/app

# Or open in browser
open http://localhost:9000/app
```

**Expected Result**:
- 404 Not Found
- Or error message indicating admin is disabled
- Or "Cannot GET /app"

**Success**: Admin UI is not accessible (as intended)

### Step 4: Test Store API

```bash
# Test health endpoint
curl http://localhost:9000/health

# Expected: {"status":"ok"}
```

```bash
# Test store products endpoint
curl "http://localhost:9000/store/products?limit=1" \
  -H "x-publishable-api-key: YOUR_PUBLISHABLE_KEY"

# Expected: JSON response with products array
```

**Success Indicators**:
- ✅ Health endpoint returns `{"status":"ok"}`
- ✅ Products endpoint returns products (even if empty array)
- ✅ No CORS errors
- ✅ No authentication errors

### Step 5: Test Admin API

```bash
# Admin API requires authentication
# First, you need an admin JWT token

# Method 1: Get token via admin login endpoint
curl -X POST http://localhost:9000/admin/auth/token \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@medusa-test.com",
    "password": "supersecret"
  }'

# Expected: {"token": "eyJhbGc..."}

# Method 2: Use existing admin session token from browser DevTools
```

```bash
# Test admin products endpoint with token
curl "http://localhost:9000/admin/products?limit=1" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json"

# Expected: JSON response with products array
```

**Success Indicators**:
- ✅ Can obtain JWT token via authentication
- ✅ Admin endpoints respond with data
- ✅ Proper authentication is required (401 without token)

### Step 6: Check Logs for Errors

```bash
# Watch logs while testing
tail -f nohup.out

# Or if running in terminal, check console output
```

**Look for**:
- ✅ No admin build errors
- ✅ No missing file errors
- ✅ No CORS errors
- ✅ Successful API requests logged

**Red Flags**:
- ❌ "Cannot find module .medusa/admin"
- ❌ "Admin build failed"
- ❌ CORS policy errors
- ❌ Unhandled promise rejections

---

## Production Verification (Railway)

### Step 1: Deploy to Railway

```bash
# If using Railway CLI
railway up

# Or push to git (if connected to Railway)
git push origin main
```

**Monitor Deployment**:
1. Go to Railway dashboard
2. Select backend service
3. Watch deployment logs in real-time

**Expected in Logs**:
```
========================================
Railway Backend Startup
========================================
Admin: Disabled (Deployed separately on Vercel)
Backend API: Store + Admin API endpoints
========================================
🔄 Running database migrations...
✅ Migrations completed successfully!
🚀 Starting Medusa backend server...
📡 Store API will be available at: /store/*
🔐 Admin API will be available at: /admin/*
⚠️  Admin UI is NOT served from this backend
========================================
```

**Success Indicators**:
- ✅ Migrations run successfully
- ✅ Server starts without errors
- ✅ No admin build attempts
- ✅ Clear message that admin is disabled

### Step 2: Test Railway Backend Health

```bash
# Replace with your Railway URL
BACKEND_URL="https://4wd-tours-production.up.railway.app"

# Test health endpoint
curl $BACKEND_URL/health

# Expected: {"status":"ok"}
```

**Success**: Backend is reachable and responding

### Step 3: Test Railway Admin UI is Disabled

```bash
# Try to access admin UI (should fail)
curl $BACKEND_URL/app

# Or open in browser
open https://4wd-tours-production.up.railway.app/app
```

**Expected Results**:
- 404 Not Found
- Or error page
- Or "Cannot GET /app"

**Success**: Admin UI is not accessible (as intended)

### Step 4: Test Railway Store API

```bash
# Test with valid publishable key
curl "$BACKEND_URL/store/products?limit=1" \
  -H "x-publishable-api-key: pk_c1aea896aab279e937a2375566b06bfda34775b149b33353ca77eb3e8588a91b"

# Expected: JSON response with products
```

**Success Indicators**:
- ✅ Returns valid JSON
- ✅ No CORS errors (test from Vercel storefront)
- ✅ No authentication errors
- ✅ Products returned (or empty array)

### Step 5: Test Railway Admin API

```bash
# Admin API requires JWT token
# You'll need to authenticate first

# Try without token (should fail with 401)
curl "$BACKEND_URL/admin/products?limit=1"

# Expected: 401 Unauthorized

# With valid token (get from admin UI after login)
curl "$BACKEND_URL/admin/products?limit=1" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Expected: JSON response with products
```

**Success Indicators**:
- ✅ Returns 401 without authentication (security working)
- ✅ Returns data with valid JWT token
- ✅ No CORS errors when called from Vercel admin

### Step 6: Test CORS Configuration

**From Vercel Storefront** (test in browser console):

```javascript
// Open https://4wd-tours-913f.vercel.app
// Open browser DevTools → Console
// Run this test:

fetch('https://4wd-tours-production.up.railway.app/store/products?limit=1', {
  headers: {
    'x-publishable-api-key': 'pk_c1aea896aab279e937a2375566b06bfda34775b149b33353ca77eb3e8588a91b'
  }
})
  .then(r => r.json())
  .then(data => console.log('✅ CORS working:', data))
  .catch(err => console.error('❌ CORS error:', err));
```

**Expected**: No CORS errors, data returned

**From Vercel Admin** (test in browser console):

```javascript
// Open https://admin-4wd-tours.vercel.app (once deployed)
// Open browser DevTools → Console
// Run this test:

// First, get JWT token from admin login
// Then test admin API:

fetch('https://4wd-tours-production.up.railway.app/admin/products?limit=1', {
  headers: {
    'Authorization': 'Bearer YOUR_JWT_TOKEN',
    'Content-Type': 'application/json'
  }
})
  .then(r => r.json())
  .then(data => console.log('✅ Admin CORS working:', data))
  .catch(err => console.error('❌ Admin CORS error:', err));
```

**Expected**: No CORS errors, admin data returned

**Success Indicators**:
- ✅ Storefront can call Store API without CORS errors
- ✅ Admin can call Admin API without CORS errors
- ✅ Proper authentication is enforced

### Step 7: Check Railway Logs

```bash
# View Railway logs
railway logs --tail 100

# Or in Railway dashboard:
# Service → Logs → View live logs
```

**Look for**:
- ✅ Successful startup messages
- ✅ Successful API requests
- ✅ No admin build errors
- ✅ No CORS errors
- ✅ Database connections successful

**Red Flags**:
- ❌ "Cannot find module .medusa/admin"
- ❌ "CORS policy blocked"
- ❌ Database connection errors
- ❌ Unhandled errors

---

## Verification Checklist

### Configuration ✅
- [ ] medusa-config.ts has admin.disable = true
- [ ] railway-start.sh has no admin build logic
- [ ] Railway environment variables are set
- [ ] CORS variables include Vercel domains

### Local Testing ✅
- [ ] Backend starts without admin build
- [ ] Admin UI returns 404 at /app
- [ ] Store API responds correctly
- [ ] Admin API requires authentication
- [ ] No errors in logs

### Railway Testing ✅
- [ ] Deployment succeeds without errors
- [ ] Backend health endpoint works
- [ ] Admin UI returns 404 at /app
- [ ] Store API responds correctly
- [ ] Admin API requires authentication
- [ ] CORS works from Vercel storefront
- [ ] CORS works from Vercel admin (once deployed)
- [ ] Railway logs show no errors

---

## Troubleshooting

### Issue 1: Backend Still Tries to Build Admin

**Symptom**: Logs show "Building admin..." or admin build errors

**Diagnosis**:
```bash
# Check medusa-config.ts
cat medusa-config.ts | grep -A 3 "admin:"

# Should show: disable: true
```

**Solution**:
```bash
# Verify medusa-config.ts has:
admin: {
  disable: true,
  ...
}

# Redeploy to Railway
git add medusa-config.ts
git commit -m "fix: ensure admin is disabled"
git push origin main
```

---

### Issue 2: Store API Returns CORS Errors

**Symptom**: Storefront gets CORS errors when calling Store API

**Diagnosis**:
```bash
# Check STORE_CORS variable
railway variables | grep STORE_CORS

# Should include Vercel storefront domain
```

**Solution**:
```bash
# Update STORE_CORS to include Vercel domain
railway variables set STORE_CORS="https://4wd-tours-913f.vercel.app,https://*.vercel.app"

# Wait for automatic redeploy
# Test again from storefront
```

---

### Issue 3: Admin API Returns CORS Errors

**Symptom**: Admin UI gets CORS errors when calling Admin API

**Diagnosis**:
```bash
# Check ADMIN_CORS and AUTH_CORS variables
railway variables | grep ADMIN_CORS
railway variables | grep AUTH_CORS

# Should include Vercel admin domain
```

**Solution**:
```bash
# Update ADMIN_CORS to include admin domain
railway variables set ADMIN_CORS="https://admin-4wd-tours.vercel.app,https://*.vercel.app"

# Update AUTH_CORS to match
railway variables set AUTH_CORS="https://admin-4wd-tours.vercel.app,https://*.vercel.app"

# Wait for automatic redeploy
# Test again from admin
```

---

### Issue 4: Admin API Returns 401 Even with Valid Token

**Symptom**: Admin API always returns 401 Unauthorized

**Diagnosis**:
```bash
# Check JWT_SECRET is set
railway variables | grep JWT_SECRET

# Check token is not expired
# Check token is from the correct backend
```

**Solution**:
```bash
# Verify JWT_SECRET is set and correct
railway variables set JWT_SECRET="your-64-character-secret"

# Try logging in again to get fresh token
# Ensure admin is using correct backend URL
```

---

### Issue 5: Backend Crashes on Startup

**Symptom**: Railway logs show crash or restart loop

**Diagnosis**:
```bash
# Check Railway logs for error message
railway logs --tail 100

# Common causes:
# - Missing required environment variables
# - Database connection error
# - Invalid configuration
```

**Solution**:
```bash
# Verify all required variables are set
railway variables

# Check for missing secrets
# Check DATABASE_URL is valid
# Check medusa-config.ts syntax

# Test locally first:
npm run dev
```

---

## Success Criteria

### All Tests Pass ✅

1. **Configuration**:
   - ✅ Admin is disabled in code
   - ✅ Railway start script has no admin build
   - ✅ All environment variables are set

2. **Backend Functionality**:
   - ✅ Backend starts without errors
   - ✅ Admin UI is not accessible
   - ✅ Store API works correctly
   - ✅ Admin API works with authentication
   - ✅ Database connections work
   - ✅ No errors in logs

3. **CORS Configuration**:
   - ✅ Storefront can call Store API
   - ✅ Admin can call Admin API (once deployed)
   - ✅ No CORS errors in browser console
   - ✅ Proper authentication is enforced

4. **Production Ready**:
   - ✅ Railway deployment succeeds
   - ✅ Backend is stable (no crashes)
   - ✅ Logs show clean startup
   - ✅ Ready for admin deployment on Vercel

---

## Next Steps

After successful verification:

1. ✅ **Backend is Ready**: Railway backend is configured correctly
2. ✅ **Admin Can Be Deployed**: Ready to deploy admin to Vercel
3. ✅ **Storefront Works**: Existing storefront continues to function
4. ✅ **APIs Accessible**: Both Store and Admin APIs are working

**Proceed to**:
- Deploy admin to Vercel
- Configure admin environment variables (NEXT_PUBLIC_MEDUSA_BACKEND_URL)
- Test admin can connect to Railway backend
- Verify end-to-end functionality

---

## Quick Reference Commands

**Test Backend Health**:
```bash
curl https://4wd-tours-production.up.railway.app/health
```

**Test Store API**:
```bash
curl "https://4wd-tours-production.up.railway.app/store/products?limit=1" \
  -H "x-publishable-api-key: pk_c1aea896aab279e937a2375566b06bfda34775b149b33353ca77eb3e8588a91b"
```

**Test Admin API** (requires JWT token):
```bash
curl "https://4wd-tours-production.up.railway.app/admin/products?limit=1" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Check Railway Logs**:
```bash
railway logs --tail 100
```

**View Railway Variables**:
```bash
railway variables
```

---

**Last Updated**: 2025-11-11
**Maintained By**: Development Team
