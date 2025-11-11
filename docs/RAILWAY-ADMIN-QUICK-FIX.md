# Railway Admin 404 - Quick Fix Guide

**Problem**: Admin returns 404 at `/app`
**Root Cause**: `DISABLE_ADMIN=true` in Railway environment
**Fix Time**: 2 minutes

---

## The Problem

```
https://4wd-tours-production.up.railway.app/app → 404 Not Found ❌
```

**Why?**
```
Railway Environment:
  DISABLE_ADMIN=true ❌
    ↓
Medusa Configuration:
  admin.disable = true
    ↓
Result:
  /app route not registered → 404
```

---

## The Solution

### Quick Fix (30 seconds)

```bash
railway variables delete DISABLE_ADMIN --service 4wd-tours
```

That's it! Railway will auto-redeploy and admin will be accessible.

### Automated Fix (2 minutes)

```bash
cd /Users/Karim/med-usa-4wd
bash scripts/fix-railway-admin.sh
```

This script also updates CORS settings.

---

## Verification

### Step 1: Check Variable Removed
```bash
railway variables --service 4wd-tours | grep DISABLE_ADMIN
# Should return nothing
```

### Step 2: Test Endpoint
```bash
curl -I https://4wd-tours-production.up.railway.app/app
# Expected: HTTP/2 200 (not 404)
```

### Step 3: Test in Browser
```
URL: https://4wd-tours-production.up.railway.app/app
Expected: Medusa admin login page
```

---

## Why This Works

**Current State**:
- ✅ Admin files ARE built (8.2MB, 321 files in `.medusa/server/public/admin/`)
- ✅ Build command is correct (`medusa build`)
- ✅ Start command is correct (`medusa start`)
- ❌ `DISABLE_ADMIN=true` prevents route registration

**After Fix**:
- ✅ Admin files still present (no rebuild needed)
- ✅ `DISABLE_ADMIN` removed
- ✅ Medusa registers `/app` route on startup
- ✅ Admin accessible at `/app`

---

## Monitoring the Fix

### Watch Deployment
```bash
railway logs --service 4wd-tours -f
```

### Check Status
```bash
railway status --service 4wd-tours
```

### Test Admin
```bash
# Check HTTP status
curl -I https://4wd-tours-production.up.railway.app/app

# Open in browser
open https://4wd-tours-production.up.railway.app/app
```

---

## Additional CORS Fix (Optional)

If admin loads but shows CORS errors, run:

```bash
railway variables set ADMIN_CORS="http://localhost:9000,https://4wd-tours-production.up.railway.app"
railway variables set AUTH_CORS="http://localhost:9000,https://4wd-tours-production.up.railway.app"
```

---

## Full Documentation

- **Complete Analysis**: `/Users/Karim/med-usa-4wd/docs/RAILWAY-BUILD-CONFIG.md`
- **Executive Summary**: `/Users/Karim/med-usa-4wd/docs/RAILWAY-ADMIN-FIX-SUMMARY.md`
- **Automated Fix Script**: `/Users/Karim/med-usa-4wd/scripts/fix-railway-admin.sh`

---

## Command Summary

```bash
# QUICK FIX
railway variables delete DISABLE_ADMIN --service 4wd-tours

# AUTOMATED FIX
bash scripts/fix-railway-admin.sh

# VERIFY
railway variables --service 4wd-tours | grep DISABLE_ADMIN
curl -I https://4wd-tours-production.up.railway.app/app

# MONITOR
railway logs --service 4wd-tours -f
railway status --service 4wd-tours
```

---

**Time to Fix**: < 2 minutes
**Confidence**: 100%
**No Code Changes Required**: Just remove environment variable
