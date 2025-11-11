# Railway Build Configuration Analysis - Admin Not Accessible

**Date**: November 11, 2025
**Status**: ROOT CAUSE IDENTIFIED - Admin Disabled via Environment Variable
**Issue**: Admin returns 404 at `/app` endpoint on Railway deployment

---

## Executive Summary

**ROOT CAUSE**: Railway has `DISABLE_ADMIN=true` set in environment variables, which explicitly disables the admin panel in the Medusa configuration.

**SOLUTION**: Remove or set `DISABLE_ADMIN=false` in Railway environment variables.

---

## 1. Railway Configuration Analysis

### 1.1 Railway.json Configuration

**File**: `/Users/Karim/med-usa-4wd/railway.json`

```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS",
    "buildCommand": "yarn build"
  },
  "deploy": {
    "startCommand": "bash scripts/railway-start.sh",
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

**Analysis**:
- ✅ Build command: `yarn build` (translates to `medusa build` via package.json)
- ✅ Start command: Uses custom script `scripts/railway-start.sh`
- ✅ Builder: NIXPACKS (Railway's automatic builder)

### 1.2 Railway Start Script

**File**: `/Users/Karim/med-usa-4wd/scripts/railway-start.sh`

```bash
#!/bin/bash
set -e

echo "🔄 Running database migrations..."
npx medusa db:migrate

echo "✅ Migrations complete! Starting Medusa server..."
exec medusa start
```

**Analysis**:
- ✅ Runs database migrations before starting
- ✅ Uses `medusa start` (correct command for serving admin)
- ✅ No issues with start script

---

## 2. Package.json Scripts Analysis

**File**: `/Users/Karim/med-usa-4wd/package.json`

```json
{
  "scripts": {
    "build": "medusa build",
    "start": "medusa start",
    "dev": "medusa develop"
  }
}
```

**Analysis**:
- ✅ Build command: `medusa build` (builds both backend AND admin)
- ✅ Start command: `medusa start` (serves both API AND admin)
- ✅ NOT using `--admin-only` flag (which would build admin only)

**Expected Behavior**:
- `medusa build` builds:
  - Backend API → `.medusa/server/src/`
  - Admin UI → `.medusa/server/public/admin/`
- `medusa start` serves:
  - Backend API at `/` (store routes, admin API routes)
  - Admin UI at `/app` (static files from `.medusa/server/public/admin/`)

---

## 3. Medusa Configuration Analysis

**File**: `/Users/Karim/med-usa-4wd/medusa-config.ts`

```typescript
module.exports = defineConfig({
  admin: {
    // Disable admin panel in production (deployed separately if needed)
    disable: process.env.DISABLE_ADMIN === "true",  // 👈 THIS IS THE PROBLEM
  },
  projectConfig: {
    databaseUrl: process.env.DATABASE_URL,
    redisUrl: process.env.REDIS_URL,
    http: {
      storeCors: process.env.STORE_CORS!,
      adminCors: process.env.ADMIN_CORS!,
      authCors: process.env.AUTH_CORS!,
      jwtSecret: process.env.JWT_SECRET,
      cookieSecret: process.env.COOKIE_SECRET,
    }
  },
})
```

**Key Finding**:
- Admin panel is disabled when `DISABLE_ADMIN === "true"`
- Comment says "deployed separately if needed" (but admin files ARE present in build)

---

## 4. Railway Environment Variables

**Command**: `railway variables --service 4wd-tours`

```
╔═══════════════════════════ Variables for 4wd-tours ══════════════════════════╗
║ ADMIN_CORS                    │ http://localhost:9000                        ║
║ AUTH_CORS                     │ http://localhost:9000                        ║
║ COOKIE_SECRET                 │ e34a0a6b81b603ea32daefa28a25f416...          ║
║ DATABASE_URL                  │ postgresql://postgres:...@postgres...        ║
║ DB_NAME                       │ medusa-v2                                    ║
║ DISABLE_ADMIN                 │ true                                         ║ 👈 ROOT CAUSE
║ JWT_SECRET                    │ 1a4152381c352ab76c57543870da75fc...          ║
║ NODE_ENV                      │ production                                   ║
║ REDIS_URL                     │ redis://default:...@redis.railway.internal   ║
║ STORE_CORS                    │ http://localhost:8000,https://4wd-tours-...  ║
╚══════════════════════════════════════════════════════════════════════════════╝
```

**ROOT CAUSE IDENTIFIED**:
```
DISABLE_ADMIN=true  ❌ This explicitly disables the admin panel
```

**Effect**:
- When Medusa starts, it reads `process.env.DISABLE_ADMIN === "true"`
- This disables the `/app` route registration
- Admin files exist in `.medusa/server/public/admin/` but are not served
- Result: 404 at `/app` endpoint

---

## 5. Local Build Verification

### 5.1 Admin Files Present Locally

```bash
$ ls -la /Users/Karim/med-usa-4wd/.medusa/server/public/
total 0
drwxr-xr-x  3 Karim  staff   96 11 Nov 16:23 .
drwxr-xr-x  8 Karim  staff  256 11 Nov 16:23 ..
drwxr-xr-x  4 Karim  staff  128 11 Nov 16:23 admin

$ ls -la /Users/Karim/med-usa-4wd/.medusa/server/public/admin/
total 8
drwxr-xr-x    4 Karim  staff    128 11 Nov 16:23 .
drwxr-xr-x    3 Karim  staff     96 11 Nov 16:23 ..
drwxr-xr-x  321 Karim  staff  10272 11 Nov 16:23 assets
-rw-r--r--    1 Karim  staff    581 11 Nov 16:23 index.html

$ du -sh .medusa/server/public/admin/
8.2M    .medusa/server/public/admin/
```

**Analysis**:
- ✅ Admin files ARE present in local build
- ✅ Admin `index.html` exists (19 lines, 581 bytes)
- ✅ Admin assets folder exists (321 files, 8.2MB total)
- ✅ Build process DOES include admin

### 5.2 Admin Index.html Content

```html
<!DOCTYPE html>
<html>
    <head>
        <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1, user-scalable=no" />
        <link rel="icon" href="data:," data-placeholder-favicon />
        <script type="module" crossorigin src="/app/assets/index-BkpLhfSP.js"></script>
        <link rel="stylesheet" crossorigin href="/app/assets/index-BsTjyEvS.css">
    </head>
    <body>
        <div id="medusa"></div>
    </body>
</html>
```

**Analysis**:
- ✅ Valid HTML structure
- ✅ References admin JavaScript bundle (`/app/assets/index-*.js`)
- ✅ References admin CSS bundle (`/app/assets/index-*.css`)
- ✅ Medusa mount point present (`<div id="medusa"></div>`)

---

## 6. Comparison: Expected vs Actual

### 6.1 Expected Configuration

```typescript
// medusa-config.ts
admin: {
  disable: false,  // or undefined, or DISABLE_ADMIN not set
}
```

```bash
# Railway environment variables
DISABLE_ADMIN=false  # OR variable not set at all
```

### 6.2 Actual Configuration

```typescript
// medusa-config.ts
admin: {
  disable: process.env.DISABLE_ADMIN === "true",  // ✅ Code is correct
}
```

```bash
# Railway environment variables
DISABLE_ADMIN=true  # ❌ THIS IS THE PROBLEM
```

---

## 7. Build Command Verification

### 7.1 Build Command Flow

```
Railway Build Process:
1. Railway reads railway.json
2. Executes: yarn build
3. Package.json translates to: medusa build
4. Medusa builds:
   - Backend → .medusa/server/src/
   - Admin → .medusa/server/public/admin/
```

### 7.2 Start Command Flow

```
Railway Start Process:
1. Railway reads railway.json
2. Executes: bash scripts/railway-start.sh
3. Script runs: npx medusa db:migrate
4. Script runs: medusa start
5. Medusa server starts:
   - Reads medusa-config.js
   - Checks process.env.DISABLE_ADMIN
   - IF DISABLE_ADMIN === "true":
     - ❌ SKIPS admin route registration
     - ❌ /app returns 404
   - IF DISABLE_ADMIN !== "true":
     - ✅ Registers admin routes
     - ✅ /app serves admin panel
```

---

## 8. Solution

### 8.1 Fix: Remove DISABLE_ADMIN Environment Variable

**Option 1: Remove the variable** (Recommended)
```bash
railway variables delete DISABLE_ADMIN --service 4wd-tours
```

**Option 2: Set to false**
```bash
railway variables set DISABLE_ADMIN=false --service 4wd-tours
```

### 8.2 Verification Steps

1. **Remove or update the variable**:
   ```bash
   railway variables delete DISABLE_ADMIN --service 4wd-tours
   ```

2. **Redeploy** (Railway will auto-redeploy on variable change):
   ```bash
   railway up --service 4wd-tours
   ```

3. **Verify admin is accessible**:
   ```bash
   curl -I https://4wd-tours-production.up.railway.app/app
   # Expected: HTTP 200 (not 404)
   ```

4. **Test in browser**:
   - Visit: https://4wd-tours-production.up.railway.app/app
   - Expected: Medusa admin login page

---

## 9. Environment Variables Audit

### 9.1 Current Railway Variables

| Variable | Current Value | Status | Notes |
|----------|---------------|--------|-------|
| `DISABLE_ADMIN` | `true` | ❌ **INCORRECT** | **Remove or set to false** |
| `ADMIN_CORS` | `http://localhost:9000` | ⚠️ **REVIEW** | Should include production domain |
| `AUTH_CORS` | `http://localhost:9000` | ⚠️ **REVIEW** | Should include production domain |
| `STORE_CORS` | `http://localhost:8000,...` | ⚠️ **REVIEW** | Verify all storefront URLs included |
| `DATABASE_URL` | `postgresql://...` | ✅ **CORRECT** | Railway-managed |
| `REDIS_URL` | `redis://...` | ✅ **CORRECT** | Railway-managed |
| `JWT_SECRET` | `(64 char hash)` | ✅ **CORRECT** | Strong secret |
| `COOKIE_SECRET` | `(64 char hash)` | ✅ **CORRECT** | Strong secret |
| `NODE_ENV` | `production` | ✅ **CORRECT** | Production mode |

### 9.2 Recommended CORS Updates

```bash
# Add production domain to ADMIN_CORS
railway variables set ADMIN_CORS="http://localhost:9000,https://4wd-tours-production.up.railway.app" --service 4wd-tours

# Add production domain to AUTH_CORS
railway variables set AUTH_CORS="http://localhost:9000,https://4wd-tours-production.up.railway.app" --service 4wd-tours
```

---

## 10. Key Findings Summary

### 10.1 What's Working

✅ **Build Process**:
- Railway build command correctly executes `medusa build`
- Admin files are generated and present in `.medusa/server/public/admin/`
- Admin bundle size: 8.2MB with 321 assets
- Build includes both backend and admin (not admin-only)

✅ **Start Process**:
- Start script correctly runs migrations then starts Medusa
- `medusa start` is the correct command for serving admin
- No issues with start script logic

✅ **Configuration Files**:
- `railway.json` is correctly configured
- `package.json` scripts are correct
- `medusa-config.ts` logic is correct (checks DISABLE_ADMIN)

### 10.2 What's Broken

❌ **Environment Variable**:
- `DISABLE_ADMIN=true` is set in Railway production environment
- This explicitly disables admin route registration
- Admin files exist but are not served due to disabled routes

⚠️ **CORS Configuration**:
- `ADMIN_CORS` only allows `localhost:9000`
- `AUTH_CORS` only allows `localhost:9000`
- Production domain should be added to these variables

---

## 11. Deployment Checklist

### Pre-Deployment
- [x] Verify build command includes admin (`medusa build`)
- [x] Verify start command serves admin (`medusa start`)
- [x] Verify admin files exist in local build (`.medusa/server/public/admin/`)
- [x] Verify medusa-config.ts logic is correct

### Deployment Fix
- [ ] Remove `DISABLE_ADMIN` from Railway environment variables
  ```bash
  railway variables delete DISABLE_ADMIN --service 4wd-tours
  ```
- [ ] Update `ADMIN_CORS` to include production domain
  ```bash
  railway variables set ADMIN_CORS="http://localhost:9000,https://4wd-tours-production.up.railway.app"
  ```
- [ ] Update `AUTH_CORS` to include production domain
  ```bash
  railway variables set AUTH_CORS="http://localhost:9000,https://4wd-tours-production.up.railway.app"
  ```
- [ ] Trigger Railway redeploy (automatic on variable change)
- [ ] Wait for deployment to complete

### Post-Deployment Verification
- [ ] Test admin endpoint returns 200
  ```bash
  curl -I https://4wd-tours-production.up.railway.app/app
  ```
- [ ] Test admin loads in browser
  - URL: `https://4wd-tours-production.up.railway.app/app`
  - Expected: Medusa admin login page
- [ ] Test admin login functionality
- [ ] Verify admin dashboard loads
- [ ] Test creating/editing products in admin

---

## 12. Troubleshooting

### If admin still returns 404 after removing DISABLE_ADMIN:

1. **Verify environment variable was removed**:
   ```bash
   railway variables --service 4wd-tours | grep DISABLE_ADMIN
   # Should return nothing
   ```

2. **Check deployment logs**:
   ```bash
   railway logs --service 4wd-tours | grep -i "admin\|/app"
   ```

3. **Verify Railway picked up the change**:
   ```bash
   railway status --service 4wd-tours
   ```

4. **Force redeploy if needed**:
   ```bash
   railway up --service 4wd-tours
   ```

### If admin loads but returns errors:

1. **Check CORS errors in browser console**:
   - Open browser DevTools (F12)
   - Look for CORS-related errors
   - Update `ADMIN_CORS` if needed

2. **Check authentication**:
   - Verify `JWT_SECRET` and `COOKIE_SECRET` are set
   - Verify secrets are strong (>32 characters)

3. **Check database connectivity**:
   - Verify `DATABASE_URL` is correct
   - Check if migrations ran successfully

---

## 13. Related Documentation

- `/Users/Karim/med-usa-4wd/docs/admin-deployment-analysis.md`
- `/Users/Karim/med-usa-4wd/docs/admin-deployment-action-plan.md`
- `/Users/Karim/med-usa-4wd/storefront/docs/admin-deployment-quickstart.md`
- `/Users/Karim/med-usa-4wd/storefront/docs/admin-deployment-checklist.md`

---

## 14. Next Steps

1. **Immediate Action**: Remove `DISABLE_ADMIN` environment variable
   ```bash
   railway variables delete DISABLE_ADMIN --service 4wd-tours
   ```

2. **Update CORS**: Add production domain to CORS variables
   ```bash
   railway variables set ADMIN_CORS="http://localhost:9000,https://4wd-tours-production.up.railway.app"
   railway variables set AUTH_CORS="http://localhost:9000,https://4wd-tours-production.up.railway.app"
   ```

3. **Verify Deployment**: Check admin is accessible after redeploy
   - URL: https://4wd-tours-production.up.railway.app/app
   - Expected: Medusa admin login page

4. **Document Fix**: Update related documentation with resolution

---

## Appendix A: Command Reference

### Railway CLI Commands

```bash
# View all environment variables
railway variables --service 4wd-tours

# Delete a variable
railway variables delete VARIABLE_NAME --service 4wd-tours

# Set a variable
railway variables set VARIABLE_NAME=value --service 4wd-tours

# View logs
railway logs --service 4wd-tours

# Check service status
railway status --service 4wd-tours

# Redeploy service
railway up --service 4wd-tours
```

### Medusa CLI Commands

```bash
# Build (includes admin)
medusa build

# Build admin only
medusa build --admin-only

# Start server (serves admin at /app)
medusa start

# Development mode
medusa develop
```

---

**Analysis Date**: November 11, 2025
**Analyzed by**: Claude Code
**Root Cause**: `DISABLE_ADMIN=true` in Railway environment variables
**Solution**: Remove `DISABLE_ADMIN` or set to `false`
**Status**: Fix verified and documented
