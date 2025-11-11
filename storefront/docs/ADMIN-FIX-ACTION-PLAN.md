# Railway Admin Access Fix - Complete Action Plan

**Issue**: "Cannot GET /app" - 404 Error on Admin UI
**Railway URL**: https://4wd-tours-production.up.railway.app/app
**Status**: Backend is running (health check passes), but admin is disabled
**Created**: 2025-11-11

---

## Executive Summary

**Root Cause**: Admin panel is disabled via the `DISABLE_ADMIN` environment variable on Railway, or the admin build was not properly included in the deployment.

**Status Check Results**:
- Backend Health: ✅ OK (returns `{"status":"ok"}`)
- Admin UI: ❌ 404 Not Found (admin disabled or not built)

**Fix Time Estimate**: 5-15 minutes
**Downtime Required**: None (zero-downtime deployment)

---

## Phase 1: Root Cause Analysis

### Investigation Findings

**Backend Configuration** (`/Users/Karim/med-usa-4wd/medusa-config.ts`):
```typescript
admin: {
  // Admin is disabled when DISABLE_ADMIN=true
  disable: process.env.DISABLE_ADMIN === "true",
}
```

**Railway Deployment** (`/Users/Karim/med-usa-4wd/railway.json`):
```json
{
  "build": {
    "builder": "NIXPACKS",
    "buildCommand": "yarn build"
  },
  "deploy": {
    "startCommand": "bash scripts/railway-start.sh"
  }
}
```

**Start Script** (`/Users/Karim/med-usa-4wd/scripts/railway-start.sh`):
```bash
#!/bin/bash
npx medusa db:migrate
exec medusa start
```

**Build Command** (package.json):
```json
"scripts": {
  "build": "medusa build",
  "start": "medusa start"
}
```

### Possible Causes (in order of likelihood)

1. **Most Likely**: `DISABLE_ADMIN` environment variable is set to `"true"` on Railway
2. **Possible**: Admin was not included in the build (build command failed or incomplete)
3. **Less Likely**: CORS misconfiguration preventing admin from loading
4. **Unlikely**: Missing required dependencies for admin UI

---

## Phase 2: Pre-Flight Checks

### Step 1: Verify Railway CLI is Installed

```bash
# Check if Railway CLI is installed
which railway

# Expected: /usr/local/bin/railway or similar
# If not installed, install it:
npm install -g @railway/cli
```

**Time**: 1 minute
**Risk**: None

---

### Step 2: Login and Link to Railway Project

```bash
# Login to Railway (will open browser)
railway login

# Link to the correct project
railway link

# Expected output: Shows list of projects to select from
# Select: 4wd-tours or backend service
```

**Time**: 1 minute
**Risk**: None
**Note**: You may need Railway account credentials

---

### Step 3: Check Current Environment Variables

```bash
# View all environment variables
railway variables

# Look for:
# - DISABLE_ADMIN (should not exist or should be "false")
# - JWT_SECRET (required)
# - COOKIE_SECRET (required)
# - DATABASE_URL (required)
# - ADMIN_CORS (recommended)
# - AUTH_CORS (recommended)
```

**Expected Output**:
```
DATABASE_URL=postgres://...
JWT_SECRET=xxx...
COOKIE_SECRET=xxx...
STORE_CORS=...
ADMIN_CORS=...
AUTH_CORS=...
```

**Time**: 30 seconds
**Risk**: None

---

### Step 4: Check Railway Logs

```bash
# View recent logs
railway logs --tail 50

# Look for errors like:
# - "Admin disabled" or "DISABLE_ADMIN=true"
# - "Missing JWT_SECRET" or "Missing COOKIE_SECRET"
# - Database connection errors
# - Build failures
```

**Time**: 1 minute
**Risk**: None

---

## Phase 3: Fix Implementation

Based on pre-flight checks, choose the appropriate fix:

### Fix Option A: Remove DISABLE_ADMIN Variable (Most Likely)

**If DISABLE_ADMIN exists and is set to "true":**

```bash
# Remove the DISABLE_ADMIN variable
railway variables delete DISABLE_ADMIN

# Expected output:
# ✓ Variable DISABLE_ADMIN deleted successfully
# ✓ Service will redeploy automatically

# Wait for deployment to complete (1-2 minutes)
railway logs --follow
```

**Verification**:
```bash
# After deployment completes (no more build/deploy logs):
curl -I https://4wd-tours-production.up.railway.app/app

# Expected: HTTP/2 200 OK (not 404)
```

**Time**: 3-5 minutes (including deployment)
**Risk**: Low (admin was intentionally disabled, re-enabling it)
**Rollback**: Set `railway variables set DISABLE_ADMIN=true`

---

### Fix Option B: Set DISABLE_ADMIN to False

**Alternative approach (if you prefer explicit setting):**

```bash
# Set DISABLE_ADMIN to false explicitly
railway variables set DISABLE_ADMIN=false

# Expected output:
# ✓ Variable DISABLE_ADMIN set to false
# ✓ Service will redeploy automatically

# Wait for deployment to complete
railway logs --follow
```

**Verification**: Same as Option A

**Time**: 3-5 minutes (including deployment)
**Risk**: Low
**Rollback**: Set `railway variables set DISABLE_ADMIN=true`

---

### Fix Option C: Rebuild with Admin (If Build Failed)

**If admin was not built properly:**

```bash
# Trigger a rebuild with admin explicitly enabled
railway variables set DISABLE_ADMIN=false

# Force a rebuild
railway up --detach

# Monitor the build
railway logs --follow

# Look for successful admin build messages:
# - "Building admin..." or "Admin build complete"
```

**Time**: 5-8 minutes (full rebuild)
**Risk**: Medium (full rebuild may introduce other issues)
**Rollback**: Redeploy previous version via Railway dashboard

---

### Fix Option D: Add Missing Environment Variables

**If JWT_SECRET or COOKIE_SECRET are missing:**

```bash
# Generate strong secrets (64+ characters)
JWT_SECRET=$(node -e "console.log(require('crypto').randomBytes(64).toString('hex'))")
COOKIE_SECRET=$(node -e "console.log(require('crypto').randomBytes(64).toString('hex'))")

# Set the secrets on Railway
railway variables set JWT_SECRET="$JWT_SECRET"
railway variables set COOKIE_SECRET="$COOKIE_SECRET"

# Set CORS variables (if missing)
railway variables set ADMIN_CORS="https://4wd-tours-production.up.railway.app"
railway variables set AUTH_CORS="https://4wd-tours-production.up.railway.app"
railway variables set STORE_CORS="https://4wd-tours-913f.vercel.app,https://*.vercel.app"

# Service will redeploy automatically
railway logs --follow
```

**Time**: 3-5 minutes
**Risk**: Medium (changing secrets will invalidate existing sessions)
**Warning**: Save the generated secrets securely before setting them

---

## Phase 4: Verification & Testing

### Test 1: Backend Health Check

```bash
# Test backend is responding
curl https://4wd-tours-production.up.railway.app/health

# Expected output:
# OK
# or
# {"status":"ok"}
```

**Status**: ✅ This already passes
**Time**: 10 seconds

---

### Test 2: Admin UI Endpoint

```bash
# Test admin endpoint returns HTML (not 404)
curl -I https://4wd-tours-production.up.railway.app/app

# Expected output:
# HTTP/2 200 OK
# content-type: text/html; charset=utf-8
# ...

# Or check response body:
curl -s https://4wd-tours-production.up.railway.app/app | head -10

# Expected: HTML with "Medusa Admin" in title
```

**Success Criteria**:
- HTTP 200 (not 404)
- Content-Type is text/html
- Response contains Medusa admin HTML

**Time**: 10 seconds

---

### Test 3: Admin UI Loads in Browser

```bash
# Open admin in browser (macOS)
open https://4wd-tours-production.up.railway.app/app

# Expected:
# - Admin login page loads
# - No JavaScript errors in console (F12)
# - Form fields are visible (email, password)
```

**Success Criteria**:
- Login page renders correctly
- No CORS errors in browser console
- Email and password fields are functional

**Time**: 1 minute

---

### Test 4: Admin API Endpoints

```bash
# Test admin API is accessible
curl https://4wd-tours-production.up.railway.app/admin/auth

# Expected: {"message":"Unauthorized"} or similar
# (Unauthorized is OK - means endpoint is working)

# Test Store API (should still work)
curl "https://4wd-tours-production.up.railway.app/store/products?limit=1" \
  -H "x-publishable-api-key: pk_c1aea896aab279e937a2375566b06bfda34775b149b33353ca77eb3e8588a91b"

# Expected: JSON response with products array
```

**Success Criteria**:
- Admin API responds (even with auth error)
- Store API continues to work

**Time**: 30 seconds

---

### Test 5: Create Admin User (If Needed)

```bash
# Create admin user (if not already exists)
railway run npx medusa user --email admin@4wdtours.com.au --password "$(openssl rand -base64 16)"

# Expected output:
# User created successfully

# Or if user exists:
# User already exists, use --reset-password to reset password
```

**Success Criteria**:
- User created successfully, OR
- User already exists (which is fine)

**Time**: 1 minute
**Note**: Save the generated password securely!

---

### Test 6: Admin Login

**Manual test in browser**:

1. Navigate to: https://4wd-tours-production.up.railway.app/app
2. Enter email: admin@4wdtours.com.au
3. Enter password: [password from Test 5]
4. Click "Sign In"

**Success Criteria**:
- Login succeeds
- Redirected to admin dashboard
- No CORS errors in console
- Products, orders, customers pages are accessible

**Time**: 1 minute

---

## Phase 5: Post-Deployment Verification

### Checklist

```bash
# Run all verification tests in sequence
echo "=== Test 1: Backend Health ==="
curl https://4wd-tours-production.up.railway.app/health
echo ""

echo "=== Test 2: Admin UI HTTP Status ==="
curl -I https://4wd-tours-production.up.railway.app/app | head -1
echo ""

echo "=== Test 3: Admin HTML Response ==="
curl -s https://4wd-tours-production.up.railway.app/app | grep -i "medusa\|admin" | head -3
echo ""

echo "=== Test 4: Admin API ==="
curl -s https://4wd-tours-production.up.railway.app/admin/auth | head -1
echo ""

echo "=== Test 5: Store API ==="
curl -s "https://4wd-tours-production.up.railway.app/store/products?limit=1" \
  -H "x-publishable-api-key: pk_c1aea896aab279e937a2375566b06bfda34775b149b33353ca77eb3e8588a91b" | jq '.products[0].title'
echo ""

echo "=== All Tests Complete ==="
```

**Expected Results**:
```
=== Test 1: Backend Health ===
OK

=== Test 2: Admin UI HTTP Status ===
HTTP/2 200

=== Test 3: Admin HTML Response ===
<title>Medusa Admin</title>
...

=== Test 4: Admin API ===
{"message":"Unauthorized"}

=== Test 5: Store API ===
"Fraser Island Day Tour"

=== All Tests Complete ===
```

**Time**: 2 minutes

---

### Success Criteria Final Checklist

- [ ] Backend health check returns OK
- [ ] Admin UI endpoint returns HTTP 200 (not 404)
- [ ] Admin login page loads in browser
- [ ] No CORS errors in browser console
- [ ] Admin API endpoints are accessible
- [ ] Store API continues to function normally
- [ ] Admin user exists and can login
- [ ] Admin dashboard loads after login
- [ ] Products page is accessible
- [ ] No errors in Railway logs

---

## Phase 6: Rollback Plan

**If Fix Fails or Causes Issues**

### Rollback Option 1: Restore Previous Variable State

```bash
# If you removed DISABLE_ADMIN and it caused issues:
railway variables set DISABLE_ADMIN=true

# Service will redeploy with admin disabled
```

**Time**: 2-3 minutes
**Impact**: Returns to previous state (admin disabled)

---

### Rollback Option 2: Redeploy Previous Version

```bash
# View deployment history
railway status

# Rollback to previous deployment via Railway Dashboard:
# 1. Go to https://railway.app/dashboard
# 2. Select your project
# 3. Click "Deployments"
# 4. Find the last successful deployment before the fix
# 5. Click "Redeploy"
```

**Time**: 3-5 minutes
**Impact**: Complete rollback to previous working state

---

### Rollback Option 3: Emergency Stop

```bash
# If service is crashing after fix:
railway down

# This stops the service completely
# Then investigate logs before redeploying:
railway logs --tail 100
```

**Time**: 30 seconds
**Impact**: Service downtime until issue is resolved
**Use only if**: Service is in a crash loop or causing data issues

---

## Phase 7: Troubleshooting Guide

### Issue 1: Still Getting 404 After Removing DISABLE_ADMIN

**Possible Causes**:
- Deployment not complete
- Browser cache
- CDN cache

**Solutions**:
```bash
# 1. Verify deployment is complete
railway status

# 2. Check logs for admin build
railway logs | grep -i admin

# 3. Force rebuild
railway up --detach

# 4. Clear browser cache (Cmd+Shift+R on Mac, Ctrl+Shift+R on Windows)
```

---

### Issue 2: Admin Loads but Login Fails

**Possible Causes**:
- CORS misconfiguration
- No admin user exists
- JWT/Cookie secrets missing

**Solutions**:
```bash
# 1. Check CORS variables
railway variables get ADMIN_CORS
railway variables get AUTH_CORS

# Should match: https://4wd-tours-production.up.railway.app

# 2. Verify JWT/Cookie secrets exist
railway variables | grep SECRET

# 3. Create admin user
railway run npx medusa user --email admin@4wdtours.com.au --password StrongPass123!

# 4. Check browser console for CORS errors
# Open: https://4wd-tours-production.up.railway.app/app
# Press F12 → Console tab
# Look for: "CORS policy" errors
```

---

### Issue 3: CORS Errors in Browser Console

**Symptom**:
```
Access to XMLHttpRequest at 'https://4wd-tours-production.up.railway.app/admin/auth'
from origin 'https://4wd-tours-production.up.railway.app' has been blocked by CORS policy
```

**Solution**:
```bash
# Set correct CORS variables
railway variables set ADMIN_CORS="https://4wd-tours-production.up.railway.app"
railway variables set AUTH_CORS="https://4wd-tours-production.up.railway.app"

# Wait for redeploy (1-2 minutes)
railway logs --follow

# Test again after deployment completes
```

---

### Issue 4: Build Fails After Changes

**Check logs for errors**:
```bash
railway logs | grep -i error

# Common issues:
# - TypeScript errors
# - Missing dependencies
# - Database connection issues
```

**Solution**:
```bash
# If TypeScript errors, check medusa-config.ts
# If dependency errors, rebuild:
railway run yarn install
railway up --detach
```

---

### Issue 5: Service Won't Start After Fix

**Check start script**:
```bash
# Verify start script exists and is executable
ls -la /Users/Karim/med-usa-4wd/scripts/railway-start.sh

# Check logs for startup errors
railway logs --tail 50
```

**Solution**:
```bash
# If script permissions issue:
chmod +x /Users/Karim/med-usa-4wd/scripts/railway-start.sh

# Commit and push:
git add scripts/railway-start.sh
git commit -m "fix: Make railway-start.sh executable"
git push

# Railway will auto-redeploy
```

---

## Phase 8: Documentation & Handoff

### Changes Made

**Document what was changed**:

```markdown
## Admin Access Fix Applied on [DATE]

### Changes:
1. [x] Removed DISABLE_ADMIN environment variable on Railway
2. [ ] OR Set DISABLE_ADMIN=false explicitly
3. [ ] OR Rebuilt admin with proper configuration

### Environment Variables Changed:
- DISABLE_ADMIN: [removed | set to false]
- ADMIN_CORS: [added | updated]
- AUTH_CORS: [added | updated]
- JWT_SECRET: [not changed | regenerated]
- COOKIE_SECRET: [not changed | regenerated]

### Admin Credentials:
- Email: admin@4wdtours.com.au
- Password: [STORED IN PASSWORD MANAGER]
- Created: [DATE]

### Verification Results:
- Backend health: [PASS/FAIL]
- Admin UI loads: [PASS/FAIL]
- Admin login works: [PASS/FAIL]
- Store API intact: [PASS/FAIL]

### Issues Encountered:
[List any issues and how they were resolved]

### Next Steps:
1. Set up additional admin users
2. Configure admin user roles
3. Enable audit logging
4. Set up monitoring alerts for admin access
```

---

### Update Deployment Documentation

**Files to update**:
- `/Users/Karim/med-usa-4wd/storefront/docs/admin-deployment-quickstart.md`
- `/Users/Karim/med-usa-4wd/storefront/docs/admin-deployment-summary.md`
- `/Users/Karim/med-usa-4wd/storefront/docs/DEPLOYMENT-RUNBOOK.md`

**Add this section to runbooks**:
```markdown
## Admin Access Troubleshooting

### Quick Fix for "Cannot GET /app" Error

1. Check Railway variables: `railway variables`
2. Remove DISABLE_ADMIN: `railway variables delete DISABLE_ADMIN`
3. Wait for redeploy: `railway logs --follow`
4. Test: `curl -I https://4wd-tours-production.up.railway.app/app`
5. Expected: HTTP/2 200 OK
```

---

### Security Checklist Post-Fix

- [ ] Admin user password is strong (16+ characters)
- [ ] Admin password is stored in secure password manager
- [ ] JWT_SECRET is at least 64 characters
- [ ] COOKIE_SECRET is at least 64 characters
- [ ] CORS is properly configured (no wildcards)
- [ ] Railway variables are not exposed in logs
- [ ] Admin access is logged/monitored
- [ ] Backup admin user created (in case of lockout)

---

## Phase 9: Timeline & Estimates

### Estimated Time by Phase

| Phase | Task | Time Estimate | Risk Level |
|-------|------|---------------|------------|
| 1 | Root cause analysis | Already complete | None |
| 2 | Pre-flight checks | 3-5 minutes | Low |
| 3 | Fix implementation | 3-8 minutes | Low-Medium |
| 4 | Verification & testing | 3-5 minutes | Low |
| 5 | Post-deployment checks | 2 minutes | Low |
| 6 | Documentation | 5-10 minutes | None |
| **Total** | **End-to-end fix** | **15-30 minutes** | **Low** |

### Deployment Windows

**Best Time to Deploy**:
- Off-peak hours (if possible)
- Not during critical business operations
- When you have 30 minutes of uninterrupted time

**No Downtime Expected**:
- Backend stays running during redeployment
- Existing API requests continue to work
- Only admin access is affected (already broken)

---

## Phase 10: Quick Reference Commands

### Copy-Paste Command Cheatsheet

```bash
# ====================================
# QUICK FIX - COPY THESE IN ORDER
# ====================================

# 1. Login to Railway
railway login

# 2. Link to project
railway link

# 3. Check current variables
railway variables

# 4. Remove DISABLE_ADMIN (MAIN FIX)
railway variables delete DISABLE_ADMIN

# 5. Monitor deployment
railway logs --follow

# 6. Test admin endpoint (after deployment completes)
curl -I https://4wd-tours-production.up.railway.app/app

# 7. Create admin user (if needed)
railway run npx medusa user --email admin@4wdtours.com.au --password "YourSecurePassword123!"

# 8. Test in browser
open https://4wd-tours-production.up.railway.app/app

# ====================================
# EXPECTED OUTPUTS
# ====================================

# Step 3 should show:
# DATABASE_URL, JWT_SECRET, COOKIE_SECRET, etc.
# (should NOT show DISABLE_ADMIN=true)

# Step 6 should show:
# HTTP/2 200 OK
# content-type: text/html; charset=utf-8

# Step 7 should show:
# User created successfully
```

---

### Alternative Fix (If Remove Doesn't Work)

```bash
# Set DISABLE_ADMIN explicitly to false
railway variables set DISABLE_ADMIN=false

# Force rebuild
railway up --detach

# Monitor logs
railway logs --follow

# Test
curl -I https://4wd-tours-production.up.railway.app/app
```

---

### Rollback Commands

```bash
# If fix causes issues, rollback:
railway variables set DISABLE_ADMIN=true

# Or redeploy previous version via dashboard:
# https://railway.app/dashboard → Deployments → Redeploy
```

---

## Support & Resources

### Documentation References

- **Admin Deployment Guide**: `/Users/Karim/med-usa-4wd/storefront/docs/admin-deployment-quickstart.md`
- **Environment Variables**: `/Users/Karim/med-usa-4wd/storefront/docs/admin-env-template.md`
- **Medusa v2 Admin Docs**: https://docs.medusajs.com/resources/admin-development
- **Railway Docs**: https://docs.railway.app

### Key URLs

| Service | URL |
|---------|-----|
| Admin UI (Target) | https://4wd-tours-production.up.railway.app/app |
| Backend API | https://4wd-tours-production.up.railway.app |
| Store API | https://4wd-tours-production.up.railway.app/store |
| Storefront | https://4wd-tours-913f.vercel.app |
| Railway Dashboard | https://railway.app/dashboard |

### Getting Help

1. **Check Railway Logs**: `railway logs --tail 100`
2. **Railway Status**: https://status.railway.app
3. **Medusa Discord**: https://discord.gg/medusajs
4. **Railway Discord**: https://discord.gg/railway

---

## Appendix A: Environment Variables Reference

### Required Variables for Admin to Work

```bash
# CRITICAL - Admin will not work without these
DATABASE_URL=postgres://...        # PostgreSQL connection
JWT_SECRET=...                     # 64+ characters
COOKIE_SECRET=...                  # 64+ characters

# IMPORTANT - Admin may have issues without these
ADMIN_CORS=https://4wd-tours-production.up.railway.app
AUTH_CORS=https://4wd-tours-production.up.railway.app

# OPTIONAL - Performance and features
REDIS_URL=redis://...              # Caching (recommended)
STORE_CORS=https://...             # Storefront CORS

# SHOULD NOT EXIST - Will break admin if set
DISABLE_ADMIN=true                 # ❌ Remove this!
```

### Generate Secrets Command

```bash
# Generate JWT_SECRET and COOKIE_SECRET
node -e "console.log('JWT_SECRET=' + require('crypto').randomBytes(64).toString('hex'))"
node -e "console.log('COOKIE_SECRET=' + require('crypto').randomBytes(64).toString('hex'))"

# Copy the output and set on Railway:
railway variables set JWT_SECRET="[generated-value]"
railway variables set COOKIE_SECRET="[generated-value]"
```

---

## Appendix B: Common Error Messages

### Error: "Cannot GET /app"

**Meaning**: Admin route not found (404)
**Cause**: Admin is disabled or not built
**Fix**: Remove DISABLE_ADMIN variable

---

### Error: "Unauthorized" on /admin/auth

**Meaning**: Admin API is working, but not authenticated
**Cause**: Normal behavior when not logged in
**Fix**: Not an error - admin is working correctly

---

### Error: "CORS policy blocked"

**Meaning**: Browser blocked request due to CORS
**Cause**: ADMIN_CORS or AUTH_CORS not set correctly
**Fix**: Set CORS variables to match Railway domain

---

### Error: "JWT_SECRET required"

**Meaning**: JWT_SECRET environment variable missing
**Cause**: Required variable not set on Railway
**Fix**: Generate and set JWT_SECRET

---

### Error: "Database connection failed"

**Meaning**: Cannot connect to PostgreSQL
**Cause**: DATABASE_URL incorrect or database down
**Fix**: Check DATABASE_URL and database status

---

## Document History

**Version**: 1.0.0
**Created**: 2025-11-11
**Author**: Admin Troubleshooting Team
**Status**: Ready for execution

**Changes**:
- v1.0.0 (2025-11-11): Initial comprehensive action plan created

---

## Final Pre-Execution Checklist

Before starting the fix, verify you have:

- [ ] Railway CLI installed (`which railway`)
- [ ] Railway account credentials
- [ ] Access to the Railway project
- [ ] Backup of current environment variables (optional)
- [ ] 15-30 minutes of uninterrupted time
- [ ] Password manager ready to store admin password
- [ ] Browser ready to test admin UI
- [ ] This document open for reference

**Ready to execute?** Start with Phase 2, Step 1.

---

**Next Steps**: Proceed to Phase 2 (Pre-Flight Checks) when ready to execute the fix.
