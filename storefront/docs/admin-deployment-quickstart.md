# Medusa Admin Deployment - Quick Start Guide

**For**: Deploying and accessing Medusa admin on Railway
**Time**: 5-10 minutes
**Last Updated**: 2025-11-11

---

## TL;DR - The Quick Version

**Admin URL**: `https://4wd-tours-production.up.railway.app/app`

**Status**: ✅ Already deployed on Railway (built into backend)

**Next Steps**:
1. Create admin user (see [Step 3](#step-3-create-admin-user))
2. Login at admin URL above
3. Done!

---

## Understanding Medusa v2 Admin

**IMPORTANT**: Medusa v2 includes admin UI as part of the backend application.

```
┌─────────────────────────────────┐
│     Railway Backend             │
│                                 │
│  ┌───────────────────┐         │
│  │   Admin UI        │ ← You want this
│  │   /app            │         │
│  └───────────────────┘         │
│                                 │
│  ┌───────────────────┐         │
│  │   Admin API       │         │
│  │   /admin/*        │         │
│  └───────────────────┘         │
│                                 │
│  ┌───────────────────┐         │
│  │   Store API       │         │
│  │   /store/*        │         │
│  └───────────────────┘         │
└─────────────────────────────────┘
```

**No separate Vercel deployment needed** - admin runs on Railway with the backend.

---

## Quick Start Steps

### Step 1: Verify Backend is Running

**Check Railway Dashboard**:

1. Go to [Railway Dashboard](https://railway.app/dashboard)
2. Find your backend service
3. Verify status shows "Active" (green)

**Test Backend URL**:

```bash
# Should return {"status":"ok"}
curl https://4wd-tours-production.up.railway.app/health
```

**Expected Output**:
```json
{"status":"ok"}
```

✅ **If backend is running, continue to Step 2**
❌ **If backend is not running, see [Troubleshooting](#troubleshooting)**

---

### Step 2: Verify Admin is Enabled

**Check Railway Variables**:

1. Go to Railway Dashboard → Backend Service → Variables
2. Look for `DISABLE_ADMIN` variable
3. **If exists and is "true"**: Remove it or set to "false"
4. **If doesn't exist**: Good! Admin is enabled by default

**Test Admin UI**:

```bash
# Should return HTML (Medusa admin page)
curl https://4wd-tours-production.up.railway.app/app
```

**Expected Output**:
```html
<!DOCTYPE html>
<html>
<head><title>Medusa Admin</title></head>
...
```

✅ **If you see HTML, admin is enabled**
❌ **If 404, admin is disabled - remove `DISABLE_ADMIN` variable**

---

### Step 3: Create Admin User

**Option A: Railway CLI (Recommended)**

```bash
# Install Railway CLI (if not already installed)
npm install -g @railway/cli

# Login to Railway
railway login

# Link to your project
railway link

# Create admin user
railway run npx medusa user --email admin@4wdtours.com.au --password YourSecurePassword123!
```

**Option B: Railway Shell**

```bash
# Open Railway shell
railway shell

# Create admin user
npx medusa user --email admin@4wdtours.com.au --password YourSecurePassword123!

# Exit shell
exit
```

**Option C: Local with Production Database (Advanced)**

```bash
# Get DATABASE_URL from Railway
railway variables get DATABASE_URL

# Set in local environment
export DATABASE_URL=[railway-database-url]

# Create user
npx medusa user --email admin@4wdtours.com.au --password YourSecurePassword123!
```

**Password Requirements**:
- Minimum 8 characters (16+ recommended)
- Mix of uppercase, lowercase, numbers, symbols
- No common words or patterns

**Example Strong Password**:
```
!Sunshine4WD_Admin2025#
```

---

### Step 4: Login to Admin

**Visit Admin URL**:

```
https://4wd-tours-production.up.railway.app/app
```

**Login Credentials**:
- **Email**: admin@4wdtours.com.au
- **Password**: [password you set in Step 3]

**Expected Result**:
- Login successful
- Redirected to admin dashboard
- See products, orders, customers, etc.

✅ **If login works, you're done!**
❌ **If login fails, see [Troubleshooting](#troubleshooting)**

---

## Verifying Admin Access

### Test 1: Dashboard Access

1. Login to admin (Step 4)
2. Should see main dashboard
3. Verify no errors in browser console (F12)

### Test 2: Products Page

1. Click "Products" in left sidebar
2. Should see list of products
3. Click on a product to view details

### Test 3: Custom Widgets

**Your custom admin widgets** should be visible:

1. Go to Products → Select a product
2. Look for custom widgets:
   - Tour Content Editor
   - Tour Addon Selector
   - Product Price Manager

**Location**: `/Users/Karim/med-usa-4wd/src/admin/widgets`

**Widgets**:
- `tour-content-editor.tsx` - Edit tour details
- `tour-addon-selector.tsx` - Manage tour addons
- `product-price-manager.tsx` - Set product prices
- `addon-tour-selector.tsx` - Link addons to tours
- `tour-addons-display.tsx` - Display tour addons
- `blog-post-products.tsx` - Link blog posts to products

---

## Environment Variables Checklist

### Required Variables (Railway Backend)

**Critical Variables** (must be set):

- [ ] `DATABASE_URL` - PostgreSQL connection (auto-set by Railway)
- [ ] `JWT_SECRET` - Authentication token signing (64+ chars)
- [ ] `COOKIE_SECRET` - Session cookie signing (64+ chars)
- [ ] `ADMIN_CORS` - Admin CORS origins
- [ ] `AUTH_CORS` - Auth CORS origins
- [ ] `STORE_CORS` - Store CORS origins

**Optional Variables**:

- [ ] `REDIS_URL` - Redis caching (auto-set by Railway Redis plugin)
- [ ] `DISABLE_ADMIN` - Should be "false" or not set
- [ ] `LOG_LEVEL` - Logging level (info, warn, error)

### Generate Secrets

**If JWT_SECRET or COOKIE_SECRET not set**:

```bash
# Generate JWT_SECRET (64+ characters)
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Generate COOKIE_SECRET (64+ characters)
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Copy output and set in Railway
railway variables set JWT_SECRET=[output-here]
railway variables set COOKIE_SECRET=[output-here]
```

### CORS Configuration

**Set CORS variables in Railway**:

```bash
# Admin CORS (same domain as backend)
railway variables set ADMIN_CORS=https://4wd-tours-production.up.railway.app

# Auth CORS (same as admin)
railway variables set AUTH_CORS=https://4wd-tours-production.up.railway.app

# Store CORS (storefront domain)
railway variables set STORE_CORS=https://4wd-tours-913f.vercel.app,https://*.vercel.app
```

---

## Troubleshooting

### Issue 1: 404 Not Found on /app

**Cause**: Admin is disabled

**Solution**:

```bash
# Check Railway variables
railway variables

# If DISABLE_ADMIN=true, remove it
railway variables delete DISABLE_ADMIN

# Or set to false
railway variables set DISABLE_ADMIN=false

# Redeploy (automatic on Railway)
```

**Verification**:
```bash
curl https://4wd-tours-production.up.railway.app/app
# Should return HTML, not 404
```

---

### Issue 2: Login Fails - "Invalid Credentials"

**Cause**: Admin user not created or wrong password

**Solution**:

```bash
# Reset password for existing user
railway run npx medusa user --email admin@4wdtours.com.au --reset-password

# Or create new user
railway run npx medusa user --email newadmin@4wdtours.com.au --password NewSecurePassword123!
```

---

### Issue 3: CORS Error on Login

**Symptom**: Browser console shows CORS policy error

**Error Message**:
```
Access to XMLHttpRequest at 'https://4wd-tours-production.up.railway.app/admin/auth'
from origin 'https://4wd-tours-production.up.railway.app' has been blocked by CORS policy
```

**Solution**:

```bash
# Set correct CORS variables
railway variables set ADMIN_CORS=https://4wd-tours-production.up.railway.app
railway variables set AUTH_CORS=https://4wd-tours-production.up.railway.app

# Service will redeploy automatically
# Wait 1-2 minutes, then try again
```

**Verification**:
```bash
# Check CORS is set correctly
railway variables get ADMIN_CORS
railway variables get AUTH_CORS
```

---

### Issue 4: Admin UI is Slow

**Cause**: Backend resource constraints

**Solutions**:

1. **Enable Redis Caching**:
```bash
# Add Redis plugin in Railway dashboard
# REDIS_URL will be set automatically

# Verify Redis is connected
railway logs | grep redis
```

2. **Upgrade Railway Plan**:
   - Current: Hobby Plan ($5/month)
   - Upgrade to: Developer Plan ($20/month)
   - Better: Pro Plan ($50/month)
   - Benefits: More CPU, RAM, faster response times

3. **Optimize Database**:
```bash
# Connect to database
railway connect

# Check slow queries
SELECT query, mean_exec_time, calls
FROM pg_stat_statements
ORDER BY mean_exec_time DESC
LIMIT 10;

# Add indexes if needed (consult with database admin)
```

---

### Issue 5: Backend Not Responding

**Cause**: Service crashed or restarting

**Check Railway Logs**:

```bash
# View recent logs
railway logs

# Look for errors like:
# - "Out of memory"
# - "Database connection failed"
# - "Port already in use"
```

**Solution**:

```bash
# Restart service
railway restart

# Or redeploy
railway up --detach

# Monitor logs
railway logs --follow
```

---

## Advanced Configuration

### Custom Admin Domain

**Want custom domain** (e.g., `admin.4wdtours.com.au`)?

**Steps**:

1. **Add Custom Domain in Railway**:
   - Go to Railway Dashboard → Service → Settings → Domains
   - Click "Custom Domain"
   - Enter: `admin.4wdtours.com.au`
   - Copy provided DNS record

2. **Configure DNS**:
   ```
   Type: CNAME
   Name: admin
   Value: [railway-provided-value]
   TTL: 3600
   ```

3. **Update CORS**:
   ```bash
   railway variables set ADMIN_CORS=https://admin.4wdtours.com.au,https://4wd-tours-production.up.railway.app
   railway variables set AUTH_CORS=https://admin.4wdtours.com.au,https://4wd-tours-production.up.railway.app
   ```

4. **Access Admin**:
   ```
   https://admin.4wdtours.com.au/app
   ```

---

### Multiple Admin Users

**Create additional admin users**:

**Method 1: Via Admin UI** (Recommended):

1. Login to admin as primary admin
2. Go to Settings → Team
3. Click "Invite Team Member"
4. Enter email address
5. User receives invitation email
6. User sets password and completes registration

**Method 2: Via CLI**:

```bash
# Create second admin
railway run npx medusa user --email manager@4wdtours.com.au --password SecurePassword123!

# Create third admin
railway run npx medusa user --email support@4wdtours.com.au --password AnotherPassword456!
```

**Method 3: Via Admin API**:

```bash
# Get admin JWT token first (login via UI)
# Then create user via API

curl -X POST https://4wd-tours-production.up.railway.app/admin/users \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer [admin-jwt-token]" \
  -d '{
    "email": "newuser@4wdtours.com.au",
    "password": "SecurePassword123!"
  }'
```

---

### Admin User Permissions

**Set user roles** (available in admin UI):

1. Login to admin
2. Go to Settings → Team
3. Click on user
4. Select role:
   - **Admin**: Full access to all features
   - **Developer**: Access to API keys and technical settings
   - **Member**: Limited access (products, orders, customers)
5. Save changes

---

## Quick Command Reference

### Railway CLI Commands

```bash
# Login to Railway
railway login

# Link to project
railway link

# View logs
railway logs

# Follow logs in real-time
railway logs --follow

# View variables
railway variables

# Set variable
railway variables set KEY=value

# Get variable
railway variables get KEY

# Delete variable
railway variables delete KEY

# Run command in Railway environment
railway run [command]

# Open Railway shell
railway shell

# Restart service
railway restart

# Check service status
railway status
```

### Medusa CLI Commands

```bash
# Create admin user
npx medusa user --email admin@example.com --password SecurePassword123!

# Reset admin password
npx medusa user --email admin@example.com --reset-password

# Run database migrations
npx medusa db:migrate

# Start Medusa server
npx medusa start

# Build Medusa
npx medusa build
```

### Testing Commands

```bash
# Test backend health
curl https://4wd-tours-production.up.railway.app/health

# Test admin UI (should return HTML)
curl https://4wd-tours-production.up.railway.app/app

# Test Store API
curl "https://4wd-tours-production.up.railway.app/store/products?limit=1" \
  -H "x-publishable-api-key: pk_c1aea896aab279e937a2375566b06bfda34775b149b33353ca77eb3e8588a91b"
```

---

## Next Steps

### After Admin is Working

1. **Configure Admin Settings**:
   - [ ] Update store details (name, contact info)
   - [ ] Configure regions and currencies
   - [ ] Set up shipping options
   - [ ] Configure payment providers

2. **Manage Products**:
   - [ ] Add/update tour products
   - [ ] Configure tour addons
   - [ ] Set up product categories
   - [ ] Upload product images

3. **Security**:
   - [ ] Create additional admin users
   - [ ] Set up user roles and permissions
   - [ ] Enable audit logging
   - [ ] Set up monitoring alerts

4. **Backup**:
   - [ ] Verify Railway automatic backups
   - [ ] Test database restore procedure
   - [ ] Document recovery steps

---

## Support and Resources

### Documentation

- **Full Deployment Guide**: `/Users/Karim/med-usa-4wd/storefront/docs/admin-vercel-deployment.md`
- **Environment Variables**: `/Users/Karim/med-usa-4wd/storefront/docs/admin-env-template.md`
- **Medusa Documentation**: [https://docs.medusajs.com](https://docs.medusajs.com)
- **Railway Documentation**: [https://docs.railway.app](https://docs.railway.app)

### Key URLs

| Service | URL |
|---------|-----|
| **Admin UI** | `https://4wd-tours-production.up.railway.app/app` |
| **Admin API** | `https://4wd-tours-production.up.railway.app/admin` |
| **Store API** | `https://4wd-tours-production.up.railway.app/store` |
| **Storefront** | `https://4wd-tours-913f.vercel.app` |
| **Railway Dashboard** | `https://railway.app/dashboard` |

### Getting Help

1. **Check Logs**: `railway logs` for error messages
2. **Railway Status**: [https://status.railway.app](https://status.railway.app)
3. **Medusa Discord**: [https://discord.gg/medusajs](https://discord.gg/medusajs)
4. **Railway Discord**: [https://discord.gg/railway](https://discord.gg/railway)

---

**Document Version**: 1.0.0
**Last Updated**: 2025-11-11
**Estimated Time**: 5-10 minutes
**Difficulty**: Easy
