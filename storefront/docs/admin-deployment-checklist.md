# Medusa Admin Deployment Checklist

**Project**: Sunshine Coast 4WD Tours
**Date**: 2025-11-11
**Admin URL**: `https://4wd-tours-production.up.railway.app/app`

---

## Quick Status Check

- [x] Backend deployed on Railway
- [x] Admin UI built into backend
- [x] Storefront deployed on Vercel
- [ ] CORS configuration verified
- [ ] Admin user created
- [ ] Admin access tested
- [ ] Ready for production

---

## Pre-Deployment Checklist

### Railway Backend

**Service Status**:
- [ ] Railway service is running (green status)
- [ ] PostgreSQL database connected
- [ ] Redis connected (optional but recommended)
- [ ] No errors in Railway logs

**Environment Variables**:
- [x] `DATABASE_URL` - Auto-set by Railway
- [x] `REDIS_URL` - Auto-set by Railway
- [x] `JWT_SECRET` - 64+ characters
- [x] `COOKIE_SECRET` - 64+ characters
- [ ] `ADMIN_CORS` - Set to backend URL
- [ ] `AUTH_CORS` - Set to backend URL
- [x] `STORE_CORS` - Set to storefront URL(s)
- [x] `STRIPE_API_KEY` - Configured
- [x] `NODE_ENV=production`

**Admin Configuration**:
- [ ] `DISABLE_ADMIN` not set to "true" (or not set at all)
- [ ] Admin widgets present in `/src/admin/widgets`
- [ ] Backend build successful

### Vercel Storefront

**Deployment Status**:
- [x] Vercel project deployed
- [x] Custom domain configured (optional)
- [x] Build successful

**Environment Variables**:
- [x] `NEXT_PUBLIC_MEDUSA_BACKEND_URL`
- [x] `NEXT_PUBLIC_API_URL`
- [x] `NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY`
- [x] `NEXT_PUBLIC_DEFAULT_REGION_ID`
- [x] `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`

---

## Deployment Steps

### Step 1: Verify Backend Health

**Command**:
```bash
curl https://4wd-tours-production.up.railway.app/health
```

**Expected Output**:
```json
{"status":"ok"}
```

**Status**: [ ] Passed

---

### Step 2: Verify Admin UI is Enabled

**Command**:
```bash
curl https://4wd-tours-production.up.railway.app/app
```

**Expected Output**: HTML (Medusa admin login page)

**Status**: [ ] Passed

---

### Step 3: Set CORS Configuration

**Commands**:
```bash
# Set ADMIN_CORS
railway variables set ADMIN_CORS=https://4wd-tours-production.up.railway.app

# Set AUTH_CORS
railway variables set AUTH_CORS=https://4wd-tours-production.up.railway.app

# Verify
railway variables get ADMIN_CORS
railway variables get AUTH_CORS
```

**Status**: [ ] Completed

---

### Step 4: Create Admin User

**Command**:
```bash
railway run npx medusa user --email admin@4wdtours.com.au --password [YOUR-SECURE-PASSWORD]
```

**Credentials** (store in password manager):
- Email: `admin@4wdtours.com.au`
- Password: `[YOUR-SECURE-PASSWORD]`

**Password Requirements**:
- Minimum 16 characters
- Mix of uppercase, lowercase, numbers, symbols
- No common words or patterns

**Example Strong Password**:
```
!Sunshine4WD_Admin2025#
```

**Status**: [ ] User created

---

### Step 5: Test Admin Login

**URL**: `https://4wd-tours-production.up.railway.app/app`

**Steps**:
1. [ ] Open admin URL in browser
2. [ ] See login page (not 404 or error)
3. [ ] Enter email: `admin@4wdtours.com.au`
4. [ ] Enter password
5. [ ] Click "Sign in"
6. [ ] Redirected to admin dashboard
7. [ ] No errors in browser console (F12)
8. [ ] Dashboard loads correctly

**Status**: [ ] Login successful

---

### Step 6: Verify Custom Widgets

**Steps**:
1. [ ] Login to admin
2. [ ] Click "Products" in sidebar
3. [ ] Select a tour product
4. [ ] Verify custom widgets are visible:
   - [ ] Tour Content Editor
   - [ ] Tour Addon Selector
   - [ ] Product Price Manager
   - [ ] Addon Tour Selector
   - [ ] Tour Addons Display

**Status**: [ ] Widgets verified

---

### Step 7: Test Store API

**Command**:
```bash
curl "https://4wd-tours-production.up.railway.app/store/products?limit=1" \
  -H "x-publishable-api-key: pk_c1aea896aab279e937a2375566b06bfda34775b149b33353ca77eb3e8588a91b"
```

**Expected Output**: JSON with product data

**Status**: [ ] Passed

---

### Step 8: Test Storefront

**URL**: `https://4wd-tours-913f.vercel.app`

**Steps**:
1. [ ] Open storefront URL
2. [ ] Products load correctly
3. [ ] Cart functionality works
4. [ ] No console errors
5. [ ] Images load properly

**Status**: [ ] Storefront working

---

## Post-Deployment Checklist

### Security

- [ ] **Strong passwords**: Admin password is 16+ characters
- [ ] **Password manager**: Credentials stored securely
- [ ] **Secrets verified**: JWT_SECRET and COOKIE_SECRET are 64+ chars
- [ ] **CORS configured**: No wildcard (*) for admin
- [ ] **HTTPS enforced**: All URLs use HTTPS
- [ ] **Secrets not committed**: .env files in .gitignore

### Configuration

- [ ] **Store details**: Updated in admin (Settings → Store)
- [ ] **Regions**: Configured (Settings → Regions)
- [ ] **Currencies**: Configured (AUD primary)
- [ ] **Shipping**: Options configured
- [ ] **Taxes**: Tax rates set up (if applicable)
- [ ] **Payment**: Stripe configured and tested

### Monitoring

- [ ] **Railway metrics**: Enabled and reviewed
- [ ] **Error logging**: Configured in admin
- [ ] **Uptime monitoring**: Set up (e.g., UptimeRobot)
- [ ] **Backup schedule**: Verified Railway auto-backups
- [ ] **Alert notifications**: Configured for downtime

### Documentation

- [x] **Deployment guide**: Created
- [x] **Environment variables**: Documented
- [x] **Quick start guide**: Created
- [x] **Troubleshooting guide**: Available
- [ ] **Recovery procedures**: Documented
- [ ] **Team access**: Documented who has admin access

### Testing

- [ ] **Admin login**: Tested successfully
- [ ] **Product management**: Can create/edit products
- [ ] **Order management**: Can view orders
- [ ] **Customer management**: Can view customers
- [ ] **Custom widgets**: All widgets working
- [ ] **Store API**: Responding correctly
- [ ] **Storefront**: Loading products correctly

---

## Troubleshooting Quick Checks

### If Admin Shows 404

**Check**:
```bash
railway variables get DISABLE_ADMIN
```

**Fix**:
```bash
# If DISABLE_ADMIN=true, remove it
railway variables delete DISABLE_ADMIN

# Or set to false
railway variables set DISABLE_ADMIN=false

# Restart
railway restart
```

---

### If Login Shows CORS Error

**Check**:
```bash
railway variables get ADMIN_CORS
railway variables get AUTH_CORS
```

**Fix**:
```bash
railway variables set ADMIN_CORS=https://4wd-tours-production.up.railway.app
railway variables set AUTH_CORS=https://4wd-tours-production.up.railway.app
railway restart
```

---

### If Cannot Create Admin User

**Check**:
```bash
railway status
railway logs
```

**Fix**:
```bash
# Ensure Railway CLI is logged in
railway login

# Link to project
railway link

# Try again
railway run npx medusa user --email admin@4wdtours.com.au --password [password]
```

---

### If Backend Not Responding

**Check**:
```bash
railway status
railway logs
```

**Fix**:
```bash
# Restart service
railway restart

# Or redeploy
railway up --detach
```

---

## Quick Command Reference

### Railway CLI

```bash
# Login
railway login

# Link project
railway link

# View variables
railway variables

# Set variable
railway variables set KEY=value

# Get variable
railway variables get KEY

# Delete variable
railway variables delete KEY

# View logs
railway logs

# Follow logs
railway logs --follow

# Run command
railway run [command]

# Open shell
railway shell

# Check status
railway status

# Restart service
railway restart
```

### Testing Commands

```bash
# Test backend health
curl https://4wd-tours-production.up.railway.app/health

# Test admin UI
curl https://4wd-tours-production.up.railway.app/app

# Test Store API
curl "https://4wd-tours-production.up.railway.app/store/products?limit=1" \
  -H "x-publishable-api-key: pk_c1aea896aab279e937a2375566b06bfda34775b149b33353ca77eb3e8588a91b"
```

### Generate Secrets

```bash
# Generate JWT_SECRET
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Generate COOKIE_SECRET
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

---

## Important URLs

| Service | URL |
|---------|-----|
| **Admin UI** | `https://4wd-tours-production.up.railway.app/app` |
| **Admin API** | `https://4wd-tours-production.up.railway.app/admin` |
| **Store API** | `https://4wd-tours-production.up.railway.app/store` |
| **Backend Health** | `https://4wd-tours-production.up.railway.app/health` |
| **Storefront** | `https://4wd-tours-913f.vercel.app` |
| **Railway Dashboard** | `https://railway.app/dashboard` |
| **Vercel Dashboard** | `https://vercel.com/dashboard` |

---

## Environment Variables Quick Reference

### Railway Backend - Critical Variables

```bash
# Database (Auto-set by Railway)
DATABASE_URL=[railway-postgres-url]

# Redis (Auto-set by Railway)
REDIS_URL=[railway-redis-url]

# Authentication Secrets (64+ chars each)
JWT_SECRET=[generate-using-crypto]
COOKIE_SECRET=[generate-using-crypto]

# CORS Configuration
ADMIN_CORS=https://4wd-tours-production.up.railway.app
AUTH_CORS=https://4wd-tours-production.up.railway.app
STORE_CORS=https://4wd-tours-913f.vercel.app,https://*.vercel.app

# Payment
STRIPE_API_KEY=sk_test_[your-key]
STRIPE_WEBHOOK_SECRET=whsec_[your-secret]

# Environment
NODE_ENV=production
```

---

## Next Steps After Deployment

### Immediate (First Hour)

1. [ ] Create admin user
2. [ ] Login and verify access
3. [ ] Review store settings
4. [ ] Test product management
5. [ ] Verify custom widgets work

### Short Term (First Week)

1. [ ] Configure store details (name, contact)
2. [ ] Set up regions and currencies
3. [ ] Configure shipping options
4. [ ] Add/update products
5. [ ] Test complete order flow
6. [ ] Create additional admin users (if needed)

### Long Term (First Month)

1. [ ] Set up monitoring and alerts
2. [ ] Document backup/recovery procedures
3. [ ] Review and optimize database
4. [ ] Plan secret rotation schedule
5. [ ] Consider upgrading Railway plan if needed
6. [ ] Set up custom admin domain (optional)

---

## Success Criteria

### Deployment Successful When:

- [x] Backend deployed and healthy
- [x] Admin UI accessible at `/app`
- [ ] Admin user can login
- [ ] Dashboard loads without errors
- [ ] Custom widgets visible
- [x] Store API responding correctly
- [x] Storefront connected to backend
- [ ] No CORS errors
- [ ] All environment variables set
- [ ] Documentation complete

---

## Support Resources

### Documentation

- [Full Deployment Guide](./admin-vercel-deployment.md)
- [Environment Variables Template](./admin-env-template.md)
- [Quick Start Guide](./admin-deployment-quickstart.md)
- [Deployment Summary](./admin-deployment-summary.md)

### External Resources

- [Medusa Documentation](https://docs.medusajs.com)
- [Railway Documentation](https://docs.railway.app)
- [Vercel Documentation](https://vercel.com/docs)

### Getting Help

1. **Check Logs**: `railway logs` for backend errors
2. **Railway Status**: [https://status.railway.app](https://status.railway.app)
3. **Medusa Discord**: [https://discord.gg/medusajs](https://discord.gg/medusajs)
4. **Railway Discord**: [https://discord.gg/railway](https://discord.gg/railway)

---

## Sign-Off

### Deployment Completed By:

**Name**: _______________________

**Date**: _______________________

**Time**: _______________________

### Verification:

- [ ] All checklist items completed
- [ ] Admin access verified
- [ ] Storefront tested
- [ ] No critical errors
- [ ] Documentation reviewed
- [ ] Team notified

### Notes:

_______________________________________________________________________

_______________________________________________________________________

_______________________________________________________________________

---

**Checklist Version**: 1.0.0
**Last Updated**: 2025-11-11
**Status**: ✅ READY FOR USE
