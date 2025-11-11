# Medusa Admin Deployment Guide - Vercel Configuration

**Date**: 2025-11-11
**Status**: READY FOR DEPLOYMENT
**Backend URL**: `https://4wd-tours-production.up.railway.app`

---

## Executive Summary

**CRITICAL UNDERSTANDING: Medusa v2 Admin is Built Into the Backend**

Unlike Medusa v1, Medusa v2 includes the admin panel as part of the backend application. The admin UI is served directly from the backend at `/app` (e.g., `https://4wd-tours-production.up.railway.app/app`).

**Deployment Strategy**: The admin does NOT need a separate Vercel deployment. It's already running on Railway as part of the backend.

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Current Deployment Status](#current-deployment-status)
3. [Admin Access Configuration](#admin-access-configuration)
4. [Environment Variables](#environment-variables)
5. [CORS Configuration](#cors-configuration)
6. [Admin User Management](#admin-user-management)
7. [Security Best Practices](#security-best-practices)
8. [Troubleshooting](#troubleshooting)
9. [Alternative: Custom Admin Dashboard](#alternative-custom-admin-dashboard)
10. [Deployment Verification](#deployment-verification)

---

## Architecture Overview

### Medusa v2 Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Railway Backend                          │
│  https://4wd-tours-production.up.railway.app                │
│                                                               │
│  ┌──────────────────┐        ┌─────────────────┐           │
│  │  Store API       │        │  Admin API      │           │
│  │  /store/*        │        │  /admin/*       │           │
│  │  (Public)        │        │  (Protected)    │           │
│  └──────────────────┘        └─────────────────┘           │
│                                                               │
│  ┌──────────────────────────────────────────────┐           │
│  │         Built-in Admin UI                     │           │
│  │         /app                                  │           │
│  │         (Protected - JWT auth)                │           │
│  └──────────────────────────────────────────────┘           │
│                                                               │
│  ┌──────────────────────────────────────────────┐           │
│  │         PostgreSQL Database                   │           │
│  │         (Railway Postgres)                    │           │
│  └──────────────────────────────────────────────┘           │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                   Vercel Storefront                          │
│  https://4wd-tours-913f.vercel.app                          │
│                                                               │
│  ┌──────────────────────────────────────────────┐           │
│  │         Next.js Storefront                    │           │
│  │         (Customer-facing)                     │           │
│  │         Connects to Store API                 │           │
│  └──────────────────────────────────────────────┘           │
└─────────────────────────────────────────────────────────────┘
```

### Key Points

1. **Admin UI is built into backend**: No separate deployment needed
2. **Admin URL**: `https://4wd-tours-production.up.railway.app/app`
3. **Authentication**: JWT-based admin user authentication
4. **Database**: Shared PostgreSQL database with Store API
5. **CORS**: Admin CORS must allow admin domain access

---

## Current Deployment Status

### Backend (Railway)

**URL**: `https://4wd-tours-production.up.railway.app`

**Status**: ✅ DEPLOYED

**Services**:
- Store API: `/store/*`
- Admin API: `/admin/*`
- Admin UI: `/app`

**Configuration File**: `/Users/Karim/med-usa-4wd/medusa-config.ts`

```typescript
module.exports = defineConfig({
  admin: {
    // Disable admin panel in production (deployed separately if needed)
    disable: process.env.DISABLE_ADMIN === "true",
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

### Storefront (Vercel)

**URL**: `https://4wd-tours-913f.vercel.app`

**Status**: ✅ DEPLOYED

**Backend Connection**: Points to Railway backend

---

## Admin Access Configuration

### Step 1: Verify Admin is Enabled

**Railway Environment Variables**:

```bash
# Admin should NOT be disabled (default is enabled)
# If DISABLE_ADMIN exists and is "true", remove it or set to "false"
DISABLE_ADMIN=false  # Or remove this variable entirely
```

**Verification**:
1. Go to Railway dashboard
2. Select backend service
3. Click "Variables" tab
4. Verify `DISABLE_ADMIN` is not set to "true"

### Step 2: Access Admin UI

**Admin URL**: `https://4wd-tours-production.up.railway.app/app`

**Expected Behavior**:
- Should show Medusa admin login page
- Email + password authentication
- Protected by JWT authentication

**Troubleshooting**:
- If 404: Admin might be disabled (check `DISABLE_ADMIN` variable)
- If 500: Check backend logs for errors
- If redirect loop: Check CORS configuration

### Step 3: Create Admin User

**Method 1: Using Medusa CLI (Recommended)**

```bash
# SSH into Railway service or run locally against production DB
npx medusa user --email admin@4wdtours.com.au --password [secure-password]

# Or using Railway CLI
railway run npx medusa user --email admin@4wdtours.com.au --password [secure-password]
```

**Method 2: Using Admin API (Programmatic)**

```bash
# Create admin user via API
curl -X POST https://4wd-tours-production.up.railway.app/admin/users \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer [admin-jwt-token]" \
  -d '{
    "email": "admin@4wdtours.com.au",
    "password": "[secure-password]"
  }'
```

**Method 3: Using Database Direct Access**

```sql
-- Connect to Railway PostgreSQL database
-- WARNING: This creates a user without proper password hashing
-- Use Medusa CLI instead for production

-- First, ensure you have an admin role
-- Then use Medusa CLI to create user properly
```

**SECURITY NOTES**:
- Use a strong password (16+ characters, mixed case, numbers, symbols)
- Store credentials in secure password manager
- Enable 2FA if available in future Medusa versions
- Rotate passwords every 90 days

---

## Environment Variables

### Backend (Railway) - Admin-Related Variables

**Required Variables**:

```bash
# Database Connection
DATABASE_URL=postgresql://user:password@host:port/database
# Provided by Railway Postgres plugin

# Redis (Optional but recommended)
REDIS_URL=redis://host:port
# Provided by Railway Redis plugin

# Authentication Secrets (CRITICAL)
JWT_SECRET=[64-character-random-string]
COOKIE_SECRET=[64-character-random-string]

# CORS Configuration
ADMIN_CORS=https://4wd-tours-production.up.railway.app
AUTH_CORS=https://4wd-tours-production.up.railway.app
STORE_CORS=https://4wd-tours-913f.vercel.app,https://4wd-tours-913f-4320n76kh-ahnsans-projects.vercel.app,https://*.vercel.app

# Payment Provider
STRIPE_API_KEY=sk_live_[your-stripe-secret-key]
STRIPE_WEBHOOK_SECRET=whsec_[your-webhook-secret]

# Admin Configuration (Optional)
DISABLE_ADMIN=false  # Or remove this variable to enable admin
```

**Generating Secrets**:

```bash
# Generate JWT_SECRET (64+ characters)
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Generate COOKIE_SECRET (64+ characters)
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

**Setting Variables in Railway**:

1. Go to Railway dashboard
2. Select backend service
3. Click "Variables" tab
4. Add/update variables
5. Redeploy service (variables update triggers automatic redeploy)

### Storefront (Vercel) - Admin-Related Variables

**No admin-specific variables needed on storefront.**

The storefront only connects to the Store API (`/store/*`), not the Admin API.

**Existing Variables** (already configured):

```bash
# Backend Connection
NEXT_PUBLIC_MEDUSA_BACKEND_URL=https://4wd-tours-production.up.railway.app
NEXT_PUBLIC_API_URL=https://4wd-tours-production.up.railway.app

# Publishable API Key (for Store API)
NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY=pk_c1aea896aab279e937a2375566b06bfda34775b149b33353ca77eb3e8588a91b

# Default Region
NEXT_PUBLIC_DEFAULT_REGION_ID=reg_01K9S1YB6T87JJW43F5ZAE8HWG

# Stripe (Public Key)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_51SRbgoRAcUUTBTrPbVEAI7o7K7x4B7tD6J0hpW0o0358868Xn1CuHux99GaeTGVv2LBlThpYLcpDUxHFmVnSDR4F00hmJK5WzS
```

---

## CORS Configuration

### Understanding CORS for Admin

**CORS (Cross-Origin Resource Sharing)** allows the admin UI to make API requests to the backend.

**Current Configuration** (`medusa-config.ts`):

```typescript
http: {
  storeCors: process.env.STORE_CORS!,    // Storefront domains
  adminCors: process.env.ADMIN_CORS!,     // Admin domains
  authCors: process.env.AUTH_CORS!,       // Authentication domains
}
```

### Railway Environment Variables for CORS

**ADMIN_CORS**:
```bash
# Admin UI is served from same domain as backend
ADMIN_CORS=https://4wd-tours-production.up.railway.app

# If you add a custom admin domain later
ADMIN_CORS=https://4wd-tours-production.up.railway.app,https://admin.4wdtours.com.au
```

**AUTH_CORS**:
```bash
# Authentication endpoints (same as admin for built-in admin)
AUTH_CORS=https://4wd-tours-production.up.railway.app
```

**STORE_CORS**:
```bash
# Storefront domains (already configured)
STORE_CORS=https://4wd-tours-913f.vercel.app,https://4wd-tours-913f-4320n76kh-ahnsans-projects.vercel.app,https://*.vercel.app
```

### CORS Troubleshooting

**Symptom**: Admin login fails with CORS error

**Solution**:
1. Verify `ADMIN_CORS` includes the admin URL
2. Verify `AUTH_CORS` includes the admin URL
3. Restart backend service after updating CORS
4. Clear browser cache and cookies
5. Try accessing admin in incognito mode

**Common CORS Errors**:

```
Access to XMLHttpRequest at 'https://backend.com/admin/auth'
from origin 'https://admin.com' has been blocked by CORS policy
```

**Fix**:
```bash
# Add admin domain to ADMIN_CORS and AUTH_CORS
ADMIN_CORS=https://4wd-tours-production.up.railway.app,https://admin.com
AUTH_CORS=https://4wd-tours-production.up.railway.app,https://admin.com
```

---

## Admin User Management

### Creating Admin Users

**Primary Admin User**:

```bash
# Create first admin user (run once during initial setup)
railway run npx medusa user --email admin@4wdtours.com.au --password [secure-password]
```

**Additional Admin Users**:

Once logged into admin UI:
1. Go to Settings → Team
2. Click "Invite Team Member"
3. Enter email address
4. User receives invitation email
5. User sets password and completes registration

### Admin User Permissions

**Medusa v2 Admin Roles**:

- **Admin**: Full access to all features
- **Developer**: Access to API keys and technical settings
- **Member**: Limited access (products, orders, customers)

**Setting Permissions**:
1. Login to admin UI
2. Go to Settings → Team
3. Click on user
4. Select role from dropdown
5. Save changes

### Password Reset

**Method 1: Using Admin UI**:
1. Click "Forgot Password" on login page
2. Enter email address
3. Follow reset link in email
4. Set new password

**Method 2: Using Medusa CLI**:

```bash
# Reset password via CLI
railway run npx medusa user --email admin@4wdtours.com.au --reset-password
```

---

## Security Best Practices

### 1. Access Control

**Recommended Security Measures**:

- [ ] **Strong Passwords**: 16+ characters, mixed case, numbers, symbols
- [ ] **Password Manager**: Store admin credentials securely
- [ ] **Regular Rotation**: Change passwords every 90 days
- [ ] **Least Privilege**: Give users minimum required permissions
- [ ] **IP Whitelisting**: Restrict admin access to known IPs (Railway firewall)
- [ ] **2FA**: Enable when available (future Medusa feature)

### 2. Network Security

**Railway Firewall** (if available):

```bash
# Restrict admin access to specific IPs
# Configure in Railway dashboard → Service → Settings → Networking

Allowed IPs:
- 203.x.x.x (Office IP)
- 110.x.x.x (Home IP)
- VPN IP range (if using VPN)
```

**Custom Domain with Cloudflare**:

1. Point custom domain to Railway backend
2. Enable Cloudflare proxy
3. Set up Cloudflare Access for admin routes
4. Require authentication before accessing `/app`

### 3. Monitoring and Auditing

**Enable Audit Logging**:

Medusa v2 includes built-in audit logging for admin actions:

- User logins
- Product changes
- Order modifications
- Settings updates
- API key creation/deletion

**Access Logs**:
1. Login to admin UI
2. Go to Settings → Audit Log
3. Filter by user, action, date range

**Railway Logs**:
```bash
# View backend logs in Railway dashboard
# Look for admin authentication events
[Medusa] Admin login: admin@4wdtours.com.au from IP 203.x.x.x
```

### 4. Secret Management

**Critical Secrets**:

- `JWT_SECRET`: Signs admin authentication tokens
- `COOKIE_SECRET`: Signs session cookies
- `STRIPE_API_KEY`: Payment processing
- Admin user passwords

**Secret Rotation Schedule**:

| Secret | Rotation Frequency | Impact |
|--------|-------------------|--------|
| `JWT_SECRET` | Every 90 days | All admin users logged out |
| `COOKIE_SECRET` | Every 90 days | All sessions invalidated |
| Admin Passwords | Every 90 days | User must reset password |
| `STRIPE_API_KEY` | Annually or if compromised | Update in Stripe dashboard |

**Rotation Procedure**:

```bash
# 1. Generate new secret
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# 2. Update Railway environment variable
railway variables set JWT_SECRET=[new-secret]

# 3. Redeploy service (automatic on Railway)

# 4. Notify admin users (they will be logged out)
```

---

## Troubleshooting

### Issue 1: Admin UI Shows 404 Not Found

**Cause**: Admin is disabled or not built

**Solution**:

```bash
# 1. Check Railway environment variables
railway variables

# Look for:
DISABLE_ADMIN=true  # ❌ This disables admin

# 2. Remove or set to false
railway variables set DISABLE_ADMIN=false

# 3. Rebuild backend
railway up --detach

# 4. Verify admin is accessible
curl https://4wd-tours-production.up.railway.app/app
```

### Issue 2: Admin Login Fails with CORS Error

**Cause**: ADMIN_CORS not configured correctly

**Solution**:

```bash
# 1. Update ADMIN_CORS
railway variables set ADMIN_CORS=https://4wd-tours-production.up.railway.app

# 2. Update AUTH_CORS
railway variables set AUTH_CORS=https://4wd-tours-production.up.railway.app

# 3. Redeploy (automatic)

# 4. Clear browser cache and try again
```

### Issue 3: Cannot Create Admin User

**Cause**: No admin users exist, need to create first user

**Solution**:

```bash
# Method 1: Railway CLI (Recommended)
railway run npx medusa user --email admin@4wdtours.com.au --password [secure-password]

# Method 2: Connect to Railway Shell
railway shell
npx medusa user --email admin@4wdtours.com.au --password [secure-password]
exit
```

### Issue 4: Admin UI is Slow or Unresponsive

**Cause**: Backend resource constraints or network issues

**Solution**:

```bash
# 1. Check Railway service metrics
# Go to Railway dashboard → Service → Metrics
# Look for:
# - High CPU usage (> 80%)
# - High memory usage (> 90%)
# - Slow database queries

# 2. Upgrade Railway plan if needed
# Current: Hobby Plan ($5/month)
# Upgrade to: Developer Plan ($20/month) for better performance

# 3. Enable Redis for caching
railway add redis
railway variables set REDIS_URL=[redis-connection-url]

# 4. Optimize database indexes
# Connect to PostgreSQL and review slow query logs
```

### Issue 5: Admin Shows "Connection Lost" Error

**Cause**: WebSocket connection issues

**Solution**:

```bash
# 1. Verify Railway service is running
railway status

# 2. Check Railway logs for errors
railway logs

# 3. Test backend connectivity
curl https://4wd-tours-production.up.railway.app/health

# 4. Check for Railway outages
# Visit: https://status.railway.app/
```

---

## Alternative: Custom Admin Dashboard

**If you need a custom admin UI or want to deploy admin separately:**

### Option A: Deploy Custom Admin on Vercel

**Use Case**: Custom branding, additional features, separate domain

**Steps**:

1. **Create Custom Admin Project**:

```bash
cd /Users/Karim/med-usa-4wd
mkdir admin-dashboard
cd admin-dashboard
npm init -y
npm install @medusajs/admin-sdk next react react-dom
```

2. **Create Vercel Configuration**:

Create `/Users/Karim/med-usa-4wd/admin-dashboard/vercel.json`:

```json
{
  "version": 2,
  "framework": "nextjs",
  "buildCommand": "npm run build",
  "outputDirectory": ".next",
  "installCommand": "npm install",
  "devCommand": "npm run dev",
  "regions": ["syd1"],
  "env": {
    "NEXT_PUBLIC_MEDUSA_BACKEND_URL": "https://4wd-tours-production.up.railway.app",
    "NEXT_PUBLIC_MEDUSA_ADMIN_URL": "https://4wd-tours-production.up.railway.app/admin"
  },
  "build": {
    "env": {
      "NEXT_PUBLIC_MEDUSA_BACKEND_URL": "https://4wd-tours-production.up.railway.app",
      "NEXT_PUBLIC_MEDUSA_ADMIN_URL": "https://4wd-tours-production.up.railway.app/admin"
    }
  }
}
```

3. **Create Next.js Admin Pages**:

Create `/Users/Karim/med-usa-4wd/admin-dashboard/pages/index.tsx`:

```tsx
import { AdminProvider } from "@medusajs/admin-sdk"

export default function AdminDashboard() {
  return (
    <AdminProvider
      baseUrl={process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL}
    >
      {/* Custom admin components */}
    </AdminProvider>
  )
}
```

4. **Deploy to Vercel**:

```bash
cd /Users/Karim/med-usa-4wd/admin-dashboard
vercel --prod

# Or link to existing Vercel project
vercel link
vercel --prod
```

5. **Update Railway CORS**:

```bash
# Add custom admin domain to ADMIN_CORS
railway variables set ADMIN_CORS=https://4wd-tours-production.up.railway.app,https://admin-4wd-tours.vercel.app
railway variables set AUTH_CORS=https://4wd-tours-production.up.railway.app,https://admin-4wd-tours.vercel.app
```

### Option B: Use Custom Domain for Built-in Admin

**Use Case**: Professional branding without custom code

**Steps**:

1. **Set up Custom Domain in Railway**:

```bash
# Add custom domain in Railway dashboard
# Go to: Service → Settings → Domains → Custom Domain
# Enter: admin.4wdtours.com.au
```

2. **Configure DNS**:

Add CNAME record to DNS provider:

```
Type: CNAME
Name: admin
Value: [railway-generated-domain]
TTL: 3600
```

3. **Update CORS Configuration**:

```bash
railway variables set ADMIN_CORS=https://admin.4wdtours.com.au,https://4wd-tours-production.up.railway.app
railway variables set AUTH_CORS=https://admin.4wdtours.com.au,https://4wd-tours-production.up.railway.app
```

4. **Access Admin**:

Visit: `https://admin.4wdtours.com.au/app`

---

## Deployment Verification

### Pre-Deployment Checklist

- [ ] **Railway Backend**: Service is running
- [ ] **Database**: PostgreSQL connection working
- [ ] **Redis**: Connected (optional but recommended)
- [ ] **Environment Variables**: All required variables set
- [ ] **CORS Configuration**: Admin and auth CORS configured
- [ ] **Admin Enabled**: `DISABLE_ADMIN` not set to "true"
- [ ] **Admin User**: At least one admin user created
- [ ] **Secrets**: JWT_SECRET and COOKIE_SECRET are strong (64+ chars)
- [ ] **Stripe**: API keys configured (test or live)

### Post-Deployment Verification

**Step 1: Test Backend Health**

```bash
# Test backend is responding
curl https://4wd-tours-production.up.railway.app/health

# Expected response:
# {"status":"ok"}
```

**Step 2: Test Store API**

```bash
# Test Store API access
curl "https://4wd-tours-production.up.railway.app/store/products?limit=1" \
  -H "x-publishable-api-key: pk_c1aea896aab279e937a2375566b06bfda34775b149b33353ca77eb3e8588a91b"

# Expected response:
# {"products":[{...}]}
```

**Step 3: Test Admin UI Access**

```bash
# Test admin UI is accessible (should return HTML)
curl https://4wd-tours-production.up.railway.app/app

# Expected response:
# <!DOCTYPE html>
# <html>
# <head><title>Medusa Admin</title></head>
# ...
```

**Step 4: Test Admin Login**

1. Open browser
2. Navigate to: `https://4wd-tours-production.up.railway.app/app`
3. Should see Medusa admin login page
4. Enter admin credentials
5. Should successfully login and see dashboard

**Step 5: Test Admin API**

```bash
# Get admin JWT token first (login via UI or API)
# Then test admin endpoint

curl "https://4wd-tours-production.up.railway.app/admin/products?limit=1" \
  -H "Authorization: Bearer [admin-jwt-token]"

# Expected response:
# {"products":[{...}]}
```

### Verification Results

**All Green ✅**:
- Admin UI is accessible
- Login works correctly
- Dashboard loads successfully
- Admin API endpoints respond
- CORS is configured correctly

**Troubleshooting Required ⚠️**:
- If any test fails, see [Troubleshooting](#troubleshooting) section
- Check Railway logs for error messages
- Verify environment variables are set correctly

---

## Admin Widgets and Customizations

### Current Admin Widgets

**Location**: `/Users/Karim/med-usa-4wd/src/admin/widgets`

**Available Widgets**:

1. **addon-tour-selector.tsx** (13.5 KB)
   - Select addons for tours
   - Manage tour-addon associations

2. **blog-post-products.tsx** (4.0 KB)
   - Link blog posts to products
   - Manage content-product relationships

3. **product-price-manager.tsx** (13.2 KB)
   - Manage product pricing
   - Set regional prices

4. **tour-addon-selector.tsx** (19.6 KB)
   - Tour-specific addon selection
   - Advanced addon management

5. **tour-addons-display.tsx** (11.0 KB)
   - Display tour addons in admin
   - Visual addon management

6. **tour-content-editor.tsx** (23.5 KB)
   - Edit tour content and details
   - Rich tour management interface

### Widget Configuration

**Admin widgets are automatically loaded** from `/src/admin/widgets` when admin UI is built.

**No additional configuration needed** - widgets are detected and injected by Medusa admin build process.

**Customizing Widgets**:

1. Edit widget files in `/src/admin/widgets`
2. Rebuild backend: `railway run npm run build`
3. Redeploy: Backend redeploys automatically on Railway
4. Refresh admin UI to see changes

---

## Production Readiness Checklist

### Security

- [ ] Strong JWT_SECRET (64+ characters)
- [ ] Strong COOKIE_SECRET (64+ characters)
- [ ] Strong admin passwords (16+ characters)
- [ ] CORS properly configured
- [ ] HTTPS enabled (Railway provides this)
- [ ] Secrets not committed to git
- [ ] Admin access logged and monitored

### Performance

- [ ] Redis enabled for caching
- [ ] Database indexes optimized
- [ ] Railway plan adequate for traffic
- [ ] CDN configured (if using custom domain)

### Backup and Recovery

- [ ] Database backups enabled (Railway Postgres automatic backups)
- [ ] Backup schedule verified (Railway: daily automatic backups)
- [ ] Recovery procedure documented
- [ ] Admin credentials backed up securely

### Monitoring

- [ ] Railway metrics monitoring enabled
- [ ] Error logging configured
- [ ] Uptime monitoring set up (e.g., UptimeRobot)
- [ ] Admin audit log enabled

---

## Quick Reference

### Important URLs

| Service | URL |
|---------|-----|
| **Backend API** | `https://4wd-tours-production.up.railway.app` |
| **Store API** | `https://4wd-tours-production.up.railway.app/store` |
| **Admin API** | `https://4wd-tours-production.up.railway.app/admin` |
| **Admin UI** | `https://4wd-tours-production.up.railway.app/app` |
| **Storefront** | `https://4wd-tours-913f.vercel.app` |

### Key Environment Variables

**Railway Backend**:
```bash
DATABASE_URL=[railway-postgres-url]
REDIS_URL=[railway-redis-url]
JWT_SECRET=[64-char-secret]
COOKIE_SECRET=[64-char-secret]
ADMIN_CORS=https://4wd-tours-production.up.railway.app
AUTH_CORS=https://4wd-tours-production.up.railway.app
STORE_CORS=https://4wd-tours-913f.vercel.app,https://*.vercel.app
STRIPE_API_KEY=sk_live_[your-key]
STRIPE_WEBHOOK_SECRET=whsec_[your-secret]
```

**Vercel Storefront**:
```bash
NEXT_PUBLIC_MEDUSA_BACKEND_URL=https://4wd-tours-production.up.railway.app
NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY=pk_c1aea896aab279e937a2375566b06bfda34775b149b33353ca77eb3e8588a91b
NEXT_PUBLIC_DEFAULT_REGION_ID=reg_01K9S1YB6T87JJW43F5ZAE8HWG
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_[your-key]
```

### Common Commands

```bash
# Create admin user
railway run npx medusa user --email admin@4wdtours.com.au --password [secure-password]

# View logs
railway logs

# Check service status
railway status

# Update environment variable
railway variables set KEY=value

# Rebuild and redeploy
railway up --detach

# Generate strong secret
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

---

## Conclusion

**Admin Deployment Status**: ✅ ALREADY DEPLOYED

The Medusa admin is built into the backend and is already running on Railway at:

**Admin URL**: `https://4wd-tours-production.up.railway.app/app`

**Next Steps**:

1. ✅ Verify admin is accessible (visit URL above)
2. ✅ Create first admin user (use Railway CLI)
3. ✅ Login and verify dashboard works
4. ✅ Configure admin widgets if needed
5. ✅ Set up monitoring and backups

**No Vercel deployment needed** for admin - it's already live on Railway!

---

**Documentation Version**: 1.0.0
**Last Updated**: 2025-11-11
**Maintained By**: Development Team
**Contact**: admin@4wdtours.com.au
