# Railway CORS Configuration for Medusa Admin

Critical guide for configuring Cross-Origin Resource Sharing (CORS) on Railway backend to allow Vercel admin access.

## Why CORS Configuration is Critical

When your admin is deployed on Vercel (different domain), the browser blocks API requests to Railway unless CORS is properly configured. Without correct CORS:

- Admin login will fail
- API requests will be blocked
- Console will show CORS errors

## Quick Setup (TL;DR)

```bash
# 1. Get your Vercel admin URL after deployment
# Example: https://medusa-admin-4wd-tours-abc123.vercel.app

# 2. Update Railway variables (replace with your actual URL)
railway variables set ADMIN_CORS="http://localhost:5173,http://localhost:9000,https://medusa-admin-4wd-tours-abc123.vercel.app"

railway variables set AUTH_CORS="http://localhost:5173,http://localhost:9000,https://medusa-admin-4wd-tours-abc123.vercel.app"

# 3. Wait for automatic redeploy (~2-3 minutes)

# 4. Test login on your admin URL
```

---

## Detailed Setup Guide

### Step 1: Get Your Admin URL

After deploying to Vercel, you'll receive a URL like:

```
https://medusa-admin-4wd-tours-[unique-hash].vercel.app
```

**Copy this entire URL** - you'll need it exactly as shown.

### Step 2: Access Railway Dashboard

1. **Go to Railway**: https://railway.app
2. **Login** to your account
3. **Select Project**: "4wd-tours" or your backend project
4. **Click Service**: Select your Medusa backend service
5. **Go to Variables**: Click "Variables" tab

### Step 3: Update ADMIN_CORS Variable

#### Current Value (Example)
```
ADMIN_CORS=http://localhost:5173,http://localhost:9000
```

#### New Value (Add Your Vercel URL)
```
ADMIN_CORS=http://localhost:5173,http://localhost:9000,https://medusa-admin-4wd-tours-abc123.vercel.app
```

**Important Rules:**
- Separate URLs with commas (`,`)
- No spaces between URLs
- Include `https://` prefix
- No trailing slashes
- Keep localhost URLs for local development

#### Using Railway Dashboard

1. Find `ADMIN_CORS` variable
2. Click "Edit" (pencil icon)
3. Append your Vercel URL to the end
4. Click "Update"

#### Using Railway CLI

```bash
# Install Railway CLI if not already installed
npm install -g @railway/cli

# Login
railway login

# Link to your project
railway link

# Get current value
railway variables get ADMIN_CORS

# Set new value (replace with your URLs)
railway variables set ADMIN_CORS="http://localhost:5173,http://localhost:9000,https://your-admin.vercel.app"
```

### Step 4: Update AUTH_CORS Variable

Repeat the same process for `AUTH_CORS`:

#### Current Value (Example)
```
AUTH_CORS=http://localhost:5173,http://localhost:9000
```

#### New Value
```
AUTH_CORS=http://localhost:5173,http://localhost:9000,https://medusa-admin-4wd-tours-abc123.vercel.app
```

### Step 5: Wait for Redeployment

Railway automatically triggers a redeploy when environment variables change.

**Monitor Progress:**
1. Watch the "Deployments" tab in Railway dashboard
2. Wait for "Deployed" status (~2-3 minutes)
3. Check logs for any errors

```bash
# Using Railway CLI
railway logs --follow
```

### Step 6: Verify CORS Configuration

#### Method 1: Test Login

1. Go to your admin URL
2. Try to login
3. Check browser console (F12 → Console)
4. Should NOT see CORS errors

#### Method 2: Browser Console Test

```javascript
// Open admin URL in browser
// Open DevTools (F12) → Console
// Run this command:

fetch('https://4wd-tours-production.up.railway.app/admin/auth', {
  method: 'GET',
  credentials: 'include',
  headers: {
    'Content-Type': 'application/json'
  }
})
.then(response => {
  console.log('CORS OK - Status:', response.status)
})
.catch(error => {
  console.error('CORS Error:', error)
})
```

**Expected Result:**
- Status 200 or 401 (authentication required) = CORS working
- CORS error = CORS not configured correctly

#### Method 3: curl Test

```bash
# Test from command line
curl -v https://4wd-tours-production.up.railway.app/admin/auth \
  -H "Origin: https://medusa-admin-4wd-tours-abc123.vercel.app"

# Look for these headers in response:
# Access-Control-Allow-Origin: https://medusa-admin-4wd-tours-abc123.vercel.app
# Access-Control-Allow-Credentials: true
```

---

## Common CORS Issues and Solutions

### Issue 1: Still Getting CORS Errors

**Symptoms:**
```
Access to XMLHttpRequest at 'https://4wd-tours-production.up.railway.app/admin/auth'
from origin 'https://your-admin.vercel.app' has been blocked by CORS policy
```

**Solutions:**

#### Check URLs Match Exactly

```bash
# Verify Railway variables
railway variables get ADMIN_CORS
railway variables get AUTH_CORS

# Compare with your actual Vercel URL
# They must match EXACTLY (including https://)
```

#### Check for Typos

Common mistakes:
- `http://` instead of `https://`
- Trailing slash: `https://admin.vercel.app/` (wrong) vs `https://admin.vercel.app` (correct)
- Spaces in the variable value
- Missing commas between URLs

#### Force Redeploy

```bash
# Sometimes Railway needs a manual redeploy
railway up --detach

# Or in dashboard: Deployments → Redeploy
```

#### Clear Browser Cache

```bash
# Hard refresh in browser
# Mac: Cmd + Shift + R
# Windows/Linux: Ctrl + Shift + R

# Or use incognito mode
```

### Issue 2: Login Works Locally But Not on Vercel

**Cause:** Different domains need different CORS configuration

**Solution:**

```bash
# Make sure BOTH localhost AND Vercel URLs are in CORS
ADMIN_CORS=http://localhost:5173,https://your-admin.vercel.app
AUTH_CORS=http://localhost:5173,https://your-admin.vercel.app
```

### Issue 3: Multiple Vercel Deployments

If you have multiple Vercel deployments (preview branches):

```bash
# Add all Vercel URLs to CORS
ADMIN_CORS=http://localhost:5173,https://admin-main.vercel.app,https://admin-dev.vercel.app,https://admin-*.vercel.app

# Or use wildcard (less secure, not recommended for production)
ADMIN_CORS=http://localhost:5173,https://*.vercel.app
```

### Issue 4: Custom Domain

If you added a custom domain in Vercel:

```bash
# Add both Vercel URL and custom domain
ADMIN_CORS=http://localhost:5173,https://medusa-admin-abc123.vercel.app,https://admin.4wdtours.com.au

AUTH_CORS=http://localhost:5173,https://medusa-admin-abc123.vercel.app,https://admin.4wdtours.com.au
```

---

## Advanced CORS Configuration

### Understanding Medusa CORS Settings

Medusa has three CORS settings in `medusa-config.ts`:

```typescript
http: {
  storeCors: process.env.STORE_CORS,  // Storefront domains
  adminCors: process.env.ADMIN_CORS,  // Admin dashboard domains
  authCors: process.env.AUTH_CORS,    // Authentication endpoints
}
```

**STORE_CORS**: Allows storefront to access Store API (`/store/*`)
**ADMIN_CORS**: Allows admin to access Admin API (`/admin/*`)
**AUTH_CORS**: Allows admin to access authentication endpoints

### Why Both ADMIN_CORS and AUTH_CORS?

Both are needed because:
1. **ADMIN_CORS** - Admin API data operations (products, orders, etc.)
2. **AUTH_CORS** - Login, logout, session management

**Best Practice:** Keep them in sync:

```bash
# Always update both with the same values
ADMIN_CORS=http://localhost:5173,https://your-admin.vercel.app
AUTH_CORS=http://localhost:5173,https://your-admin.vercel.app
```

### Complete Railway Environment Variables

For reference, here's the complete set of variables needed:

```bash
# Database
DATABASE_URL=postgresql://user:pass@host:port/dbname

# Redis (optional but recommended)
REDIS_URL=redis://host:port

# Security Secrets
JWT_SECRET=[64-character-random-string]
COOKIE_SECRET=[64-character-random-string]

# CORS Configuration
STORE_CORS=http://localhost:8000,https://4wd-tours-913f.vercel.app
ADMIN_CORS=http://localhost:5173,https://medusa-admin-4wd-tours-abc123.vercel.app
AUTH_CORS=http://localhost:5173,https://medusa-admin-4wd-tours-abc123.vercel.app

# Stripe (if using payments)
STRIPE_API_KEY=sk_live_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx

# Node Environment
NODE_ENV=production
```

---

## Testing CORS Configuration

### Pre-Deployment Test (Local)

Before deploying to Vercel, test CORS locally:

```bash
# 1. Start local admin with production backend
cd /Users/Karim/med-usa-4wd/admin
serve -s . -l 3000

# 2. Update Railway CORS temporarily
ADMIN_CORS=...,http://localhost:3000
AUTH_CORS=...,http://localhost:3000

# 3. Test login at http://localhost:3000
# 4. Remove localhost:3000 after testing
```

### Post-Deployment Test Checklist

After deploying and updating CORS:

- [ ] Railway variables updated with Vercel URL
- [ ] Railway backend redeployed successfully
- [ ] Can access admin URL without errors
- [ ] Login page loads (no CORS errors in console)
- [ ] Can submit login form
- [ ] Dashboard loads after login
- [ ] Products list API call succeeds
- [ ] No CORS errors in browser console during any operation

---

## CORS Security Best Practices

### 1. Be Specific with Domains

```bash
# ✅ Good - Specific domains
ADMIN_CORS=http://localhost:5173,https://admin.4wdtours.com.au

# ❌ Bad - Too permissive (avoid in production)
ADMIN_CORS=*
ADMIN_CORS=http://localhost:5173,https://*.vercel.app
```

### 2. Use HTTPS in Production

```bash
# ✅ Good - HTTPS for production
ADMIN_CORS=http://localhost:5173,https://admin.4wdtours.com.au

# ❌ Bad - HTTP in production
ADMIN_CORS=http://localhost:5173,http://admin.4wdtours.com.au
```

### 3. Keep Development and Production Separate

```bash
# ✅ Good - Separate environments
# Development Railway
ADMIN_CORS=http://localhost:5173,https://admin-dev.vercel.app

# Production Railway
ADMIN_CORS=https://admin.4wdtours.com.au
```

### 4. Review Regularly

```bash
# Check CORS quarterly
railway variables get ADMIN_CORS
railway variables get AUTH_CORS

# Remove old/unused domains
# Update if URLs changed
```

---

## Troubleshooting Commands

### Check Current CORS Configuration

```bash
# Using Railway CLI
railway variables get ADMIN_CORS
railway variables get AUTH_CORS
railway variables get STORE_CORS

# Or in one command
railway variables | grep CORS
```

### Test Backend CORS Response

```bash
# Test from specific origin
curl -v https://4wd-tours-production.up.railway.app/admin/auth \
  -H "Origin: https://your-admin.vercel.app" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: Content-Type" \
  -X OPTIONS

# Look for these in response:
# Access-Control-Allow-Origin: https://your-admin.vercel.app
# Access-Control-Allow-Credentials: true
# Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS
```

### View Railway Logs

```bash
# Check for CORS-related errors
railway logs | grep -i cors

# Or watch in real-time
railway logs --follow
```

---

## Quick Reference

### Railway Dashboard URL
https://railway.app/project/[your-project-id]

### Variables to Update
1. `ADMIN_CORS` - Admin API access
2. `AUTH_CORS` - Authentication access

### Format
```
VARIABLE_NAME=value1,value2,value3
```

### Example Values
```bash
ADMIN_CORS=http://localhost:5173,http://localhost:9000,https://medusa-admin-4wd-tours-abc123.vercel.app

AUTH_CORS=http://localhost:5173,http://localhost:9000,https://medusa-admin-4wd-tours-abc123.vercel.app

STORE_CORS=http://localhost:8000,https://4wd-tours-913f.vercel.app
```

---

## Need Help?

If CORS is still not working:

1. **Check Railway logs**: `railway logs --follow`
2. **Verify exact URLs**: No trailing slashes, correct protocol
3. **Test with curl**: See if headers are returned
4. **Try incognito mode**: Rule out browser caching
5. **Force redeploy**: `railway up --detach`

---

**Document Version**: 1.0.0
**Last Updated**: 2025-11-11
**Status**: Ready for Use
