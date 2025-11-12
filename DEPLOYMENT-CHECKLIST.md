# Railway Backend Deployment Checklist - Separate Admin

**Date**: 2025-11-11
**Status**: READY FOR DEPLOYMENT
**DO NOT PUSH YET** - Complete checklist first

---

## Pre-Deployment Checklist

### 1. Review Modified Files

- [ ] Review `/medusa-config.ts` changes:
  ```bash
  git diff medusa-config.ts
  ```
  - [ ] Verify `admin.disable = true`
  - [ ] Verify `admin.backendUrl` is configured
  - [ ] CORS configuration looks correct

- [ ] Review `/scripts/railway-start.sh` changes:
  ```bash
  git diff scripts/railway-start.sh
  ```
  - [ ] Verify admin build logic removed
  - [ ] Verify migrations still run
  - [ ] Verify server start command present

- [ ] Review documentation:
  ```bash
  ls -lh docs/{RAILWAY-ENVIRONMENT-VARIABLES,BACKEND-VERIFICATION-GUIDE,RAILWAY-BACKEND-PREPARATION-SUMMARY}.md
  ```
  - [ ] All documentation files created
  - [ ] Documentation is complete

---

### 2. Set Railway Environment Variables

**CRITICAL**: Set these BEFORE pushing code:

```bash
# Login to Railway
railway login
railway link

# Set required variables
railway variables set ADMIN_CORS="https://admin-4wd-tours.vercel.app,https://*.vercel.app"
railway variables set AUTH_CORS="https://admin-4wd-tours.vercel.app,https://*.vercel.app"
railway variables set BACKEND_URL="https://4wd-tours-production.up.railway.app"

# Verify variables are set
railway variables | grep -E "(ADMIN_CORS|AUTH_CORS|BACKEND_URL)"
```

**Checklist**:
- [ ] `ADMIN_CORS` set with correct Vercel admin domain
- [ ] `AUTH_CORS` set (should match ADMIN_CORS)
- [ ] `BACKEND_URL` set to Railway URL
- [ ] Variables verified with `railway variables`

**Note**: Replace `admin-4wd-tours.vercel.app` with your actual Vercel admin URL

---

### 3. Verify Existing Variables

```bash
# Check all critical variables are present
railway variables
```

**Required Variables**:
- [ ] `DATABASE_URL` - Present (Railway provides)
- [ ] `JWT_SECRET` - Present and 64+ characters
- [ ] `COOKIE_SECRET` - Present and 64+ characters
- [ ] `STORE_CORS` - Present with storefront domains
- [ ] `NODE_ENV` - Set to "production"
- [ ] `STRIPE_API_KEY` - Present (if using payments)

**Optional but Recommended**:
- [ ] `REDIS_URL` - Present (improves performance)

---

## Deployment Steps

### 4. Commit Changes

```bash
cd /Users/Karim/med-usa-4wd

# Stage modified files
git add medusa-config.ts
git add scripts/railway-start.sh
git add docs/RAILWAY-ENVIRONMENT-VARIABLES.md
git add docs/BACKEND-VERIFICATION-GUIDE.md
git add docs/RAILWAY-BACKEND-PREPARATION-SUMMARY.md
git add DEPLOYMENT-CHECKLIST.md

# Check what will be committed
git status

# Commit with descriptive message
git commit -m "feat: prepare Railway backend for separate Vercel admin deployment

- Disable built-in admin UI in medusa-config.ts
- Remove admin build logic from railway-start.sh
- Configure CORS for separate Vercel admin
- Add comprehensive deployment documentation

BREAKING CHANGE: Admin UI no longer accessible at /app
Admin must be deployed separately on Vercel
Backend now only provides API endpoints"
```

**Checklist**:
- [ ] All files staged
- [ ] Commit message is descriptive
- [ ] Changes ready to push

---

### 5. Push and Deploy

```bash
# Push to trigger Railway deployment
git push origin main
```

**Checklist**:
- [ ] Code pushed to git
- [ ] Railway deployment triggered automatically

---

### 6. Monitor Deployment

**Watch in Railway Dashboard**:
1. Go to https://railway.app/
2. Select project: `4wd-tours-production`
3. Select backend service
4. Click "Deployments" tab
5. Watch current deployment

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
```

**Checklist**:
- [ ] Deployment shows "Success" status
- [ ] No errors in deployment logs
- [ ] Migrations completed successfully
- [ ] Server started successfully
- [ ] No admin build attempts

---

## Post-Deployment Verification

### 7. Test Backend Health

```bash
curl https://4wd-tours-production.up.railway.app/health
```

**Expected**: `{"status":"ok"}`

**Checklist**:
- [ ] Health endpoint returns 200 OK
- [ ] Response is valid JSON

---

### 8. Verify Admin UI is Disabled

```bash
curl https://4wd-tours-production.up.railway.app/app
```

**Expected**: 404 Not Found or error message

**Checklist**:
- [ ] Admin UI is NOT accessible
- [ ] Returns 404 or error (as intended)

---

### 9. Test Store API

```bash
curl "https://4wd-tours-production.up.railway.app/store/products?limit=1" \
  -H "x-publishable-api-key: pk_c1aea896aab279e937a2375566b06bfda34775b149b33353ca77eb3e8588a91b"
```

**Expected**: JSON response with products

**Checklist**:
- [ ] Store API returns 200 OK
- [ ] Response contains products array
- [ ] No CORS errors

---

### 10. Test Admin API (Basic)

```bash
# Should require authentication
curl "https://4wd-tours-production.up.railway.app/admin/products?limit=1"
```

**Expected**: 401 Unauthorized (authentication required)

**Checklist**:
- [ ] Admin API requires authentication
- [ ] Returns 401 without token (security working)

---

### 11. Test CORS from Storefront

**Open Vercel storefront in browser**:
```
https://4wd-tours-913f.vercel.app
```

**Open browser DevTools → Console**, run:
```javascript
fetch('https://4wd-tours-production.up.railway.app/store/products?limit=1', {
  headers: {
    'x-publishable-api-key': 'pk_c1aea896aab279e937a2375566b06bfda34775b149b33353ca77eb3e8588a91b'
  }
})
  .then(r => r.json())
  .then(data => console.log('✅ CORS working:', data))
  .catch(err => console.error('❌ CORS error:', err));
```

**Checklist**:
- [ ] No CORS errors in browser console
- [ ] Store API responds successfully from storefront

---

### 12. Check Railway Logs

```bash
railway logs --tail 50
```

**Look for**:
- [ ] No error messages
- [ ] Successful API requests
- [ ] No admin build errors
- [ ] No missing file errors

---

## Success Criteria

**All Tests Pass** ✅

- [x] Code changes reviewed
- [x] Railway variables set
- [x] Code committed and pushed
- [ ] Railway deployment succeeded
- [ ] Backend health check passes
- [ ] Admin UI disabled (404 at /app)
- [ ] Store API works correctly
- [ ] Admin API requires authentication
- [ ] CORS works from storefront
- [ ] No errors in Railway logs

**Status**: Ready to proceed with admin deployment

---

## Next Steps

### After Backend Verification ✅

1. **Deploy Admin to Vercel**:
   - Create admin project
   - Configure environment variables
   - Deploy to Vercel

2. **Test Admin Connection**:
   - Verify admin can connect to Railway backend
   - Test admin login
   - Test admin API calls

3. **End-to-End Testing**:
   - Test complete workflows
   - Verify all functionality
   - Monitor for issues

---

## Rollback Plan

**If issues occur**:

### Option 1: Git Rollback
```bash
git revert HEAD
git push origin main
```

### Option 2: Railway Dashboard
1. Go to Railway dashboard
2. Deployments → Previous deployment
3. Click "Redeploy"

### Option 3: Quick Fix
1. Railway dashboard → Variables
2. Edit medusa-config.ts
3. Change `disable: true` to `disable: false`
4. Redeploy

---

## Support

**Documentation**:
- Environment Variables: `/docs/RAILWAY-ENVIRONMENT-VARIABLES.md`
- Verification Guide: `/docs/BACKEND-VERIFICATION-GUIDE.md`
- Summary: `/docs/RAILWAY-BACKEND-PREPARATION-SUMMARY.md`

**Commands**:
```bash
# View logs
railway logs --tail 100

# View variables
railway variables

# Test health
curl https://4wd-tours-production.up.railway.app/health
```

---

**Last Updated**: 2025-11-11
**Ready for Deployment**: YES
**Changes Pushed**: NO (Awaiting approval)
