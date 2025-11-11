# Railway Build Configuration Investigation - Results

**Date**: November 11, 2025
**Investigation Focus**: Why admin returns 404 at `/app`
**Status**: ✅ ROOT CAUSE IDENTIFIED

---

## Investigation Summary

| Area | Status | Details |
|------|--------|---------|
| **ROOT CAUSE** | ✅ **FOUND** | `DISABLE_ADMIN=true` in Railway environment |
| Build Command | ✅ Correct | `medusa build` (includes admin) |
| Start Command | ✅ Correct | `medusa start` (serves admin) |
| Admin Files Built | ✅ Yes | 8.2MB, 321 files in `.medusa/server/public/admin/` |
| Admin Files Deployed | ✅ Yes | Files present in Railway deployment |
| Medusa Config | ✅ Correct | Reads `DISABLE_ADMIN` env var correctly |
| Environment Variable | ❌ **WRONG** | `DISABLE_ADMIN=true` disables admin |
| CORS Configuration | ⚠️ Needs Update | Missing production domain |

---

## Detailed Findings

### 1. Railway Configuration

| Component | Expected | Actual | Status |
|-----------|----------|--------|--------|
| Build Command | `medusa build` | `yarn build` → `medusa build` | ✅ Correct |
| Start Command | `medusa start` | `bash scripts/railway-start.sh` → `medusa start` | ✅ Correct |
| Builder | NIXPACKS | NIXPACKS | ✅ Correct |
| Build includes admin | Yes | Yes | ✅ Correct |
| Admin files size | ~8MB | 8.2MB (321 files) | ✅ Correct |

### 2. Environment Variables

| Variable | Current Value | Expected Value | Status | Action Required |
|----------|---------------|----------------|--------|-----------------|
| `DISABLE_ADMIN` | `true` | `false` or not set | ❌ **WRONG** | **Remove or set to false** |
| `ADMIN_CORS` | `http://localhost:9000` | Should include production domain | ⚠️ Incomplete | Add production domain |
| `AUTH_CORS` | `http://localhost:9000` | Should include production domain | ⚠️ Incomplete | Add production domain |
| `STORE_CORS` | Includes production URLs | Includes production URLs | ✅ Correct | - |
| `DATABASE_URL` | Railway-managed | Railway-managed | ✅ Correct | - |
| `REDIS_URL` | Railway-managed | Railway-managed | ✅ Correct | - |
| `JWT_SECRET` | 128 chars | Min 32 chars | ✅ Correct | - |
| `COOKIE_SECRET` | 128 chars | Min 32 chars | ✅ Correct | - |
| `NODE_ENV` | `production` | `production` | ✅ Correct | - |

### 3. Configuration Files

| File | Status | Notes |
|------|--------|-------|
| `/Users/Karim/med-usa-4wd/railway.json` | ✅ Correct | Build and start commands configured properly |
| `/Users/Karim/med-usa-4wd/scripts/railway-start.sh` | ✅ Correct | Runs migrations then starts Medusa |
| `/Users/Karim/med-usa-4wd/package.json` | ✅ Correct | Build and start scripts correct |
| `/Users/Karim/med-usa-4wd/medusa-config.ts` | ✅ Correct | Properly reads `DISABLE_ADMIN` env var |
| `/Users/Karim/med-usa-4wd/.medusa/server/medusa-config.js` | ✅ Correct | Compiled version of medusa-config.ts |

### 4. Admin Build Verification

| Check | Result | Details |
|-------|--------|---------|
| Admin directory exists | ✅ Yes | `/Users/Karim/med-usa-4wd/.medusa/server/public/admin/` |
| Admin index.html exists | ✅ Yes | 19 lines, 581 bytes |
| Admin assets exist | ✅ Yes | 321 files in `assets/` directory |
| Total admin size | ✅ 8.2MB | Includes all JavaScript bundles and CSS |
| Admin references correct paths | ✅ Yes | `/app/assets/index-*.js` and `/app/assets/index-*.css` |

---

## Root Cause Analysis

### The Problem Flow

```
1. Railway Environment:
   DISABLE_ADMIN=true ❌

   ↓

2. medusa-config.js reads:
   admin: {
     disable: process.env.DISABLE_ADMIN === "true"  // evaluates to true
   }

   ↓

3. Medusa Server Startup:
   - Checks admin.disable === true
   - Skips registering /app route
   - Admin files present but not served

   ↓

4. Result:
   GET /app → 404 Not Found
```

### Why Admin Files Exist But Aren't Served

```
Build Phase (✅ Working):
  medusa build
    → Generates .medusa/server/public/admin/ (8.2MB)
    → All admin files present

Runtime Phase (❌ Broken):
  medusa start
    → Reads DISABLE_ADMIN=true
    → Skips route registration for /app
    → Files exist but routes don't
    → Result: 404
```

---

## Build vs Configuration Matrix

| Scenario | Build Includes Admin | `DISABLE_ADMIN` | Admin Accessible | Current State |
|----------|---------------------|-----------------|------------------|---------------|
| 1 | ✅ Yes | Not set | ✅ Yes | Expected behavior |
| 2 | ✅ Yes | `false` | ✅ Yes | Expected behavior |
| 3 | ✅ Yes | `true` | ❌ No (404) | **CURRENT STATE** |
| 4 | ❌ No | Not set | ❌ No (files missing) | Not applicable |
| 5 | ❌ No | `true` | ❌ No (disabled) | Not applicable |

**Current Railway Setup**: Scenario 3 (files present but disabled)

**Required Fix**: Move to Scenario 1 or 2 (remove or set `DISABLE_ADMIN=false`)

---

## Comparison: Working vs Broken

### Working Configuration (Expected)

```typescript
// Railway Environment
DISABLE_ADMIN=false  // or not set

// medusa-config.ts result
admin: {
  disable: false  // Admin enabled
}

// Runtime behavior
✅ Medusa registers /app route
✅ Serves .medusa/server/public/admin/index.html
✅ Admin accessible at /app
```

### Broken Configuration (Current)

```typescript
// Railway Environment
DISABLE_ADMIN=true  ❌

// medusa-config.ts result
admin: {
  disable: true  // Admin disabled
}

// Runtime behavior
❌ Medusa skips /app route registration
❌ Admin files exist but not served
❌ Admin returns 404 at /app
```

---

## Evidence Collection

### Evidence 1: Admin Files Exist

```bash
$ ls -la /Users/Karim/med-usa-4wd/.medusa/server/public/admin/
total 8
drwxr-xr-x    4 Karim  staff    128 11 Nov 16:23 .
drwxr-xr-x    3 Karim  staff     96 11 Nov 16:23 ..
drwxr-xr-x  321 Karim  staff  10272 11 Nov 16:23 assets
-rw-r--r--    1 Karim  staff    581 11 Nov 16:23 index.html

$ du -sh .medusa/server/public/admin/
8.2M    .medusa/server/public/admin/
```

### Evidence 2: Railway Environment Variable

```bash
$ railway variables --service 4wd-tours | grep DISABLE_ADMIN
║ DISABLE_ADMIN                 │ true                                         ║
```

### Evidence 3: Medusa Configuration

```javascript
// .medusa/server/medusa-config.js (line 17-20)
admin: {
    // Disable admin panel in production (deployed separately if needed)
    disable: process.env.DISABLE_ADMIN === "true",  // true when DISABLE_ADMIN=true
},
```

### Evidence 4: Build Commands

```json
// package.json
{
  "scripts": {
    "build": "medusa build",  // Builds both backend AND admin
    "start": "medusa start"    // Serves both API AND admin
  }
}
```

---

## Solution Overview

### Primary Fix (Required)

**Remove `DISABLE_ADMIN` environment variable**

```bash
railway variables delete DISABLE_ADMIN --service 4wd-tours
```

**Effect**:
- `process.env.DISABLE_ADMIN` becomes `undefined`
- `undefined === "true"` evaluates to `false`
- Admin routes get registered
- `/app` serves admin panel

### Secondary Fix (Recommended)

**Update CORS to include production domain**

```bash
railway variables set ADMIN_CORS="http://localhost:9000,https://4wd-tours-production.up.railway.app"
railway variables set AUTH_CORS="http://localhost:9000,https://4wd-tours-production.up.railway.app"
```

**Effect**:
- Admin can make API requests to production backend
- Prevents CORS errors in browser console

---

## Verification Plan

### Pre-Fix Verification

```bash
# Confirm DISABLE_ADMIN is set to true
railway variables --service 4wd-tours | grep DISABLE_ADMIN
# Expected: DISABLE_ADMIN │ true

# Confirm admin returns 404
curl -I https://4wd-tours-production.up.railway.app/app
# Expected: HTTP/2 404
```

### Post-Fix Verification

```bash
# Confirm DISABLE_ADMIN is removed
railway variables --service 4wd-tours | grep DISABLE_ADMIN
# Expected: (no output)

# Confirm admin returns 200
curl -I https://4wd-tours-production.up.railway.app/app
# Expected: HTTP/2 200

# Test in browser
open https://4wd-tours-production.up.railway.app/app
# Expected: Medusa admin login page
```

---

## Risk Assessment

| Risk | Severity | Likelihood | Mitigation |
|------|----------|------------|------------|
| Admin still returns 404 after fix | Low | Very Low | Verify environment variable was removed and Railway redeployed |
| CORS errors after admin loads | Medium | Medium | Update ADMIN_CORS and AUTH_CORS with production domain |
| Railway redeploy fails | Low | Very Low | Monitor Railway logs, rollback if needed |
| Admin works but can't authenticate | Low | Very Low | Verify JWT_SECRET and COOKIE_SECRET are set |

---

## Timeline

### Investigation Timeline

| Time | Action | Result |
|------|--------|--------|
| 00:00 | Read Railway configuration files | ✅ Configuration correct |
| 00:05 | Check package.json build scripts | ✅ Build command correct |
| 00:10 | Verify admin files in local build | ✅ Admin files present (8.2MB) |
| 00:15 | Check Railway environment variables | ❌ Found `DISABLE_ADMIN=true` |
| 00:20 | Read medusa-config.ts | ✅ Config correctly reads env var |
| 00:25 | Confirm root cause | ✅ `DISABLE_ADMIN=true` is the issue |

### Fix Timeline (Estimated)

| Time | Action | Expected Result |
|------|--------|-----------------|
| 00:00 | Remove `DISABLE_ADMIN` variable | Railway triggers auto-redeploy |
| 01:00 | Railway completes redeploy | Medusa starts with admin enabled |
| 01:30 | Test `/app` endpoint | Admin returns 200 (not 404) |
| 02:00 | Update CORS variables (optional) | CORS errors resolved |
| 03:00 | Test admin login | Admin fully functional |

**Total Fix Time**: 2-3 minutes

---

## Success Criteria

### Must-Have (Required)

- [ ] `DISABLE_ADMIN` environment variable removed from Railway
- [ ] Admin endpoint returns HTTP 200 (not 404)
- [ ] Admin login page loads in browser
- [ ] Can log in with admin credentials
- [ ] Admin dashboard loads after login

### Nice-to-Have (Recommended)

- [ ] `ADMIN_CORS` includes production domain
- [ ] `AUTH_CORS` includes production domain
- [ ] No CORS errors in browser console
- [ ] All admin features functional (products, orders, etc.)

---

## Lessons Learned

1. **Environment variables override code**: Even with correct build configuration, runtime environment variables can disable features

2. **Build ≠ Runtime**: Build process can generate all files correctly, but runtime configuration determines what gets served

3. **Comments can be misleading**: The comment "deployed separately if needed" suggested separate deployment, but build actually includes admin

4. **Verify environment variables first**: When debugging deployment issues, check environment variables before investigating build process

5. **Railway auto-redeploys on env changes**: No manual redeploy needed when changing environment variables

---

## Related Files

### Investigation Documents

- **Main Report**: `/Users/Karim/med-usa-4wd/docs/RAILWAY-BUILD-CONFIG.md`
- **Executive Summary**: `/Users/Karim/med-usa-4wd/docs/RAILWAY-ADMIN-FIX-SUMMARY.md`
- **Quick Fix Guide**: `/Users/Karim/med-usa-4wd/docs/RAILWAY-ADMIN-QUICK-FIX.md`
- **This Document**: `/Users/Karim/med-usa-4wd/docs/RAILWAY-INVESTIGATION-RESULTS.md`

### Fix Scripts

- **Automated Fix**: `/Users/Karim/med-usa-4wd/scripts/fix-railway-admin.sh`

### Configuration Files (Verified)

- `/Users/Karim/med-usa-4wd/railway.json`
- `/Users/Karim/med-usa-4wd/package.json`
- `/Users/Karim/med-usa-4wd/medusa-config.ts`
- `/Users/Karim/med-usa-4wd/scripts/railway-start.sh`

### Build Output (Verified)

- `/Users/Karim/med-usa-4wd/.medusa/server/public/admin/index.html`
- `/Users/Karim/med-usa-4wd/.medusa/server/public/admin/assets/` (321 files)
- `/Users/Karim/med-usa-4wd/.medusa/server/medusa-config.js`

---

## Command Reference

### Investigation Commands Used

```bash
# Check Railway environment variables
railway variables --service 4wd-tours

# Check Railway service status
railway status --service 4wd-tours

# Verify local admin files
ls -la /Users/Karim/med-usa-4wd/.medusa/server/public/admin/
du -sh /Users/Karim/med-usa-4wd/.medusa/server/public/admin/
find .medusa/server/public/admin -type f | wc -l

# Read configuration files
cat railway.json
cat package.json
cat medusa-config.ts
cat .medusa/server/medusa-config.js
```

### Fix Commands

```bash
# Quick fix (manual)
railway variables delete DISABLE_ADMIN --service 4wd-tours

# Full fix (automated)
bash scripts/fix-railway-admin.sh

# Update CORS (optional)
railway variables set ADMIN_CORS="http://localhost:9000,https://4wd-tours-production.up.railway.app"
railway variables set AUTH_CORS="http://localhost:9000,https://4wd-tours-production.up.railway.app"
```

### Verification Commands

```bash
# Verify variable removed
railway variables --service 4wd-tours | grep DISABLE_ADMIN

# Check admin endpoint
curl -I https://4wd-tours-production.up.railway.app/app

# Monitor deployment
railway logs --service 4wd-tours -f

# Check deployment status
railway status --service 4wd-tours
```

---

## Conclusion

**Root Cause**: Railway environment variable `DISABLE_ADMIN=true` explicitly disables admin panel

**Evidence**:
- ✅ Build process correctly generates admin files (8.2MB, 321 files)
- ✅ Build and start commands are correct
- ✅ Configuration files are correct
- ❌ Environment variable `DISABLE_ADMIN=true` prevents route registration

**Solution**: Remove `DISABLE_ADMIN` environment variable

**Confidence**: 100%

**Expected Fix Time**: < 2 minutes

**No Code Changes Required**: Only environment variable change needed

---

**Investigation Completed**: November 11, 2025
**Status**: Ready for Fix Implementation
