# Railway Environment Variables - Separate Admin Deployment

**Date**: 2025-11-11
**Status**: READY FOR CONFIGURATION
**Purpose**: Configure Railway backend to work with separate Vercel admin deployment

---

## Overview

This document lists all required environment variables for the Railway backend when the admin UI is deployed separately on Vercel.

**Architecture**:
- **Railway Backend**: API endpoints only (Store API + Admin API)
- **Vercel Admin**: Admin UI that connects to Railway Admin API
- **Vercel Storefront**: Customer-facing store that connects to Railway Store API

---

## Required Environment Variables

### 1. Database Configuration

#### DATABASE_URL
**Description**: PostgreSQL database connection URL

**Format**: `postgresql://username:password@host:port/database`

**Source**: Railway PostgreSQL plugin (automatically set)

**Example**:
```bash
DATABASE_URL=postgresql://postgres:password@containers-us-west-123.railway.app:5432/railway
```

**Notes**:
- Automatically provided by Railway when PostgreSQL plugin is added
- Never commit this to version control
- Contains sensitive credentials

---

#### DB_NAME (Optional)
**Description**: Database name for reference

**Format**: String

**Value**:
```bash
DB_NAME=medusa-4wd-tours-production
```

**Notes**:
- Optional - extracted from DATABASE_URL if not set
- Used for logging and reference purposes

---

### 2. Redis Configuration

#### REDIS_URL
**Description**: Redis connection URL for caching and sessions

**Format**: `redis://username:password@host:port`

**Source**: Railway Redis plugin (automatically set) or external Redis provider

**Example**:
```bash
REDIS_URL=redis://default:password@containers-us-west-456.railway.app:6379
```

**Notes**:
- Recommended for production (improves performance)
- Optional but highly recommended
- Can use Upstash Redis if Railway Redis is not available

---

### 3. Authentication Secrets

#### JWT_SECRET
**Description**: Secret key for signing JSON Web Tokens (admin authentication)

**Format**: Hexadecimal string (minimum 64 characters)

**Generation**:
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

**Example**:
```bash
JWT_SECRET=a1b2c3d4e5f6789012345678901234567890abcdefabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcdef
```

**CRITICAL SECURITY NOTES**:
- MUST be at least 64 characters
- MUST be different from development/staging
- MUST be kept secret - never commit to git
- Changing this will log out all admin users
- Rotate every 90 days

---

#### COOKIE_SECRET
**Description**: Secret key for signing session cookies

**Format**: Hexadecimal string (minimum 64 characters)

**Generation**:
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

**Example**:
```bash
COOKIE_SECRET=9876543210fedcbafedcbafedcbafedcba1234567890abcdefabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcdef
```

**CRITICAL SECURITY NOTES**:
- MUST be at least 64 characters
- MUST be different from JWT_SECRET
- MUST be different from development/staging
- Changing this will invalidate all sessions
- Rotate every 90 days

---

### 4. CORS Configuration

#### STORE_CORS
**Description**: Allowed origins for Store API requests (customer-facing storefront)

**Format**: Comma-separated list of URLs (no spaces)

**Value**:
```bash
STORE_CORS=https://4wd-tours-913f.vercel.app,https://4wd-tours-913f-4320n76kh-ahnsans-projects.vercel.app,https://*.vercel.app
```

**Notes**:
- Include all Vercel deployment URLs (production + preview)
- Use wildcard for Vercel preview deployments: `https://*.vercel.app`
- NO localhost URLs in production
- NO trailing slashes
- NO spaces between URLs

**Adding Custom Domain**:
```bash
STORE_CORS=https://www.4wdtours.com.au,https://4wd-tours-913f.vercel.app,https://*.vercel.app
```

---

#### ADMIN_CORS
**Description**: Allowed origins for Admin API requests (admin dashboard)

**Format**: Comma-separated list of URLs (no spaces)

**CRITICAL**: Must include the Vercel admin deployment domain

**Value**:
```bash
ADMIN_CORS=https://admin-4wd-tours.vercel.app,https://admin-4wd-tours-*.vercel.app,https://*.vercel.app
```

**Notes**:
- MUST include the Vercel admin deployment URL
- Include wildcard for Vercel preview deployments
- Admin won't work without correct CORS configuration
- Add custom admin domain if using one

**Example with Custom Domain**:
```bash
ADMIN_CORS=https://admin.4wdtours.com.au,https://admin-4wd-tours.vercel.app,https://*.vercel.app
```

---

#### AUTH_CORS
**Description**: Allowed origins for authentication endpoints

**Format**: Comma-separated list of URLs (no spaces)

**CRITICAL**: Must match ADMIN_CORS for admin authentication to work

**Value**:
```bash
AUTH_CORS=https://admin-4wd-tours.vercel.app,https://admin-4wd-tours-*.vercel.app,https://*.vercel.app
```

**Notes**:
- Should match ADMIN_CORS exactly
- Required for admin login/logout to work
- Also needs to include storefront if using customer authentication

**Example with Both Admin and Store**:
```bash
AUTH_CORS=https://admin-4wd-tours.vercel.app,https://4wd-tours-913f.vercel.app,https://*.vercel.app
```

---

### 5. Admin Configuration

#### DISABLE_ADMIN
**Description**: Disable built-in admin UI (admin deployed separately)

**Format**: Boolean string

**Value**:
```bash
DISABLE_ADMIN=true
```

**Notes**:
- MUST be set to "true" for separate admin deployment
- This is now hardcoded in medusa-config.ts (this variable is no longer needed)
- Keep for backward compatibility or remove entirely

**RECOMMENDATION**: This variable can be removed since admin is now disabled in code.

---

#### BACKEND_URL
**Description**: Public URL of the Railway backend (for admin to connect)

**Format**: HTTPS URL

**Value**:
```bash
BACKEND_URL=https://4wd-tours-production.up.railway.app
```

**Notes**:
- Used by admin to connect to backend API
- Should match Railway deployment URL
- Will be passed to Vercel admin as NEXT_PUBLIC_MEDUSA_BACKEND_URL

**Alternative**: Can use RAILWAY_PUBLIC_DOMAIN instead (automatically set by Railway)

---

### 6. Stripe Payment Configuration

#### STRIPE_API_KEY
**Description**: Stripe secret API key for payment processing

**Format**: String starting with `sk_test_` (test) or `sk_live_` (production)

**Source**: Stripe Dashboard → API Keys

**Value (Test Mode)**:
```bash
STRIPE_API_KEY=sk_test_your_stripe_test_key_here
```

**Value (Live Mode)**:
```bash
STRIPE_API_KEY=sk_live_your_stripe_secret_key_here
```

**CRITICAL NOTES**:
- NEVER commit to version control
- Use test keys for development
- Use live keys ONLY in production
- Rotate if compromised

---

#### STRIPE_WEBHOOK_SECRET
**Description**: Stripe webhook signing secret for verifying webhook events

**Format**: String starting with `whsec_`

**Source**: Stripe Dashboard → Webhooks → Add Endpoint

**Webhook URL**: `https://4wd-tours-production.up.railway.app/hooks/payment/stripe_stripe`

**Required Events**:
- payment_intent.succeeded
- payment_intent.payment_failed
- payment_intent.amount_capturable_updated
- charge.succeeded

**Value**:
```bash
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here
```

**Setup Instructions**:
1. Go to Stripe Dashboard → Webhooks
2. Click "Add Endpoint"
3. Enter webhook URL: `https://4wd-tours-production.up.railway.app/hooks/payment/stripe_stripe`
4. Select events (listed above)
5. Copy webhook signing secret
6. Add to Railway environment variables

---

### 7. Node Environment

#### NODE_ENV
**Description**: Node.js environment mode

**Format**: String

**Value**:
```bash
NODE_ENV=production
```

**Notes**:
- MUST be "production" for production deployments
- Affects logging, error handling, and performance
- Never set to "development" in production

---

### 8. Railway Platform Variables (Automatic)

These variables are automatically set by Railway - DO NOT manually configure:

#### RAILWAY_ENVIRONMENT
**Description**: Railway environment name

**Value**: `production`

**Notes**: Automatically set by Railway

---

#### RAILWAY_PUBLIC_DOMAIN
**Description**: Public domain of Railway deployment

**Value**: `4wd-tours-production.up.railway.app`

**Notes**:
- Automatically set by Railway
- Can be used instead of BACKEND_URL

---

#### PORT
**Description**: Port number for server to listen on

**Value**: Automatically set by Railway (usually 3000 or 9000)

**Notes**:
- Automatically set by Railway
- DO NOT manually configure

---

## Complete Configuration Checklist

Copy this checklist and verify all variables are set correctly in Railway:

### Critical Security (REQUIRED)
- [ ] `JWT_SECRET` - 64+ characters, cryptographically random
- [ ] `COOKIE_SECRET` - 64+ characters, cryptographically random
- [ ] Secrets are different from development
- [ ] Secrets are different from each other

### Database (REQUIRED)
- [ ] `DATABASE_URL` - Railway PostgreSQL connection URL
- [ ] Database is accessible from Railway service

### CORS Configuration (REQUIRED)
- [ ] `STORE_CORS` - Includes Vercel storefront domain(s)
- [ ] `ADMIN_CORS` - Includes Vercel admin domain(s)
- [ ] `AUTH_CORS` - Matches ADMIN_CORS
- [ ] NO localhost URLs in production CORS

### Admin Configuration (REQUIRED)
- [ ] `BACKEND_URL` - Railway backend URL (or use RAILWAY_PUBLIC_DOMAIN)
- [ ] Admin is disabled in medusa-config.ts

### Payment Processing (REQUIRED for live transactions)
- [ ] `STRIPE_API_KEY` - Test or Live mode key
- [ ] `STRIPE_WEBHOOK_SECRET` - Webhook signing secret
- [ ] Stripe webhook endpoint created and active

### Optional but Recommended
- [ ] `REDIS_URL` - Redis connection for caching
- [ ] `DB_NAME` - Database name for reference

### Environment
- [ ] `NODE_ENV` - Set to "production"

---

## Setting Variables in Railway

### Method 1: Railway Dashboard (Recommended)

1. Go to Railway dashboard: https://railway.app/
2. Select your project: `4wd-tours-production`
3. Select backend service
4. Click "Variables" tab
5. Click "New Variable"
6. Enter variable name and value
7. Click "Add"
8. Service will automatically redeploy

### Method 2: Railway CLI

```bash
# Install Railway CLI if not installed
npm i -g @railway/cli

# Login to Railway
railway login

# Link to project
railway link

# Set variable
railway variables set KEY=value

# Set multiple variables
railway variables set JWT_SECRET=xxx COOKIE_SECRET=yyy

# View all variables
railway variables

# Delete variable
railway variables delete KEY
```

### Method 3: Bulk Import (Multiple Variables)

Create a file `railway-variables.txt`:

```
JWT_SECRET=your-jwt-secret-here
COOKIE_SECRET=your-cookie-secret-here
STORE_CORS=https://4wd-tours-913f.vercel.app,https://*.vercel.app
ADMIN_CORS=https://admin-4wd-tours.vercel.app,https://*.vercel.app
AUTH_CORS=https://admin-4wd-tours.vercel.app,https://*.vercel.app
BACKEND_URL=https://4wd-tours-production.up.railway.app
STRIPE_API_KEY=sk_test_your_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_secret_here
NODE_ENV=production
```

**IMPORTANT**: Never commit this file to git! Add to .gitignore.

Import using Railway CLI:
```bash
cat railway-variables.txt | while read line; do
  KEY=$(echo $line | cut -d= -f1)
  VALUE=$(echo $line | cut -d= -f2-)
  railway variables set $KEY="$VALUE"
done
```

---

## Verifying Configuration

### Step 1: Check Variables in Railway

```bash
railway variables
```

**Verify**:
- All required variables are present
- Values are not empty
- Secrets are sufficiently long
- URLs are correct and use HTTPS
- No localhost URLs in production

### Step 2: Check Railway Logs

```bash
railway logs --tail 100
```

**Look for**:
- No errors about missing environment variables
- No CORS errors
- Database connection successful
- Redis connection successful (if configured)

### Step 3: Test Backend API

```bash
# Test health endpoint
curl https://4wd-tours-production.up.railway.app/health

# Test Store API
curl "https://4wd-tours-production.up.railway.app/store/products?limit=1" \
  -H "x-publishable-api-key: pk_c1aea896aab279e937a2375566b06bfda34775b149b33353ca77eb3e8588a91b"

# Test Admin API (requires authentication)
curl "https://4wd-tours-production.up.railway.app/admin/products?limit=1" \
  -H "Authorization: Bearer YOUR_ADMIN_JWT_TOKEN"
```

### Step 4: Verify Admin UI is Disabled

```bash
# Should return 404 or error (admin UI not served)
curl https://4wd-tours-production.up.railway.app/app
```

**Expected**: 404 or error indicating admin is disabled.

---

## Troubleshooting

### Issue 1: CORS Errors

**Symptom**: Admin or storefront gets CORS errors when calling API

**Solution**:
```bash
# Verify CORS variables include the correct domains
railway variables | grep CORS

# Update ADMIN_CORS to include Vercel admin domain
railway variables set ADMIN_CORS=https://admin-4wd-tours.vercel.app,https://*.vercel.app

# Update AUTH_CORS to match ADMIN_CORS
railway variables set AUTH_CORS=https://admin-4wd-tours.vercel.app,https://*.vercel.app
```

### Issue 2: Admin Cannot Connect to Backend

**Symptom**: Admin UI shows "Cannot connect to backend" error

**Solution**:
```bash
# Verify BACKEND_URL is set correctly
railway variables | grep BACKEND_URL

# Test backend is accessible
curl https://4wd-tours-production.up.railway.app/health

# Check Railway logs for errors
railway logs --tail 100
```

### Issue 3: Authentication Errors

**Symptom**: Admin login fails with authentication error

**Solution**:
```bash
# Verify JWT_SECRET and COOKIE_SECRET are set
railway variables | grep SECRET

# Check secrets are at least 64 characters
# Regenerate if needed:
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Update secrets
railway variables set JWT_SECRET=new-secret
railway variables set COOKIE_SECRET=new-secret
```

### Issue 4: Database Connection Errors

**Symptom**: Backend logs show database connection errors

**Solution**:
```bash
# Verify DATABASE_URL is set
railway variables | grep DATABASE_URL

# Test database connection
railway run npx medusa db:migrate

# Check PostgreSQL plugin is active
# Go to Railway dashboard → Plugins → PostgreSQL → Status
```

---

## Secret Rotation Schedule

| Secret | Frequency | Impact | Procedure |
|--------|-----------|--------|-----------|
| `JWT_SECRET` | Every 90 days | All admin users logged out | Generate new → Update Railway → Notify admins |
| `COOKIE_SECRET` | Every 90 days | All sessions invalidated | Generate new → Update Railway → Users re-login |
| `STRIPE_API_KEY` | Annually or if compromised | Payment processing interrupted briefly | Update in Stripe Dashboard → Update Railway |
| `STRIPE_WEBHOOK_SECRET` | When webhook endpoint changes | Webhook events stop working | Create new endpoint → Update Railway |

---

## Environment Variable Comparison

### Development (.env.local)
```bash
NODE_ENV=development
DATABASE_URL=postgres://localhost/medusa-4wd-tours
REDIS_URL=redis://localhost:6379
JWT_SECRET=development-jwt-secret-not-for-production
COOKIE_SECRET=development-cookie-secret-not-for-production
STORE_CORS=http://localhost:8000
ADMIN_CORS=http://localhost:5173,http://localhost:9000
AUTH_CORS=http://localhost:5173,http://localhost:9000
STRIPE_API_KEY=sk_test_...
```

### Production (Railway)
```bash
NODE_ENV=production
DATABASE_URL=postgresql://... (Railway PostgreSQL)
REDIS_URL=redis://... (Railway Redis)
JWT_SECRET=... (64+ character random string)
COOKIE_SECRET=... (64+ character random string)
STORE_CORS=https://4wd-tours-913f.vercel.app,https://*.vercel.app
ADMIN_CORS=https://admin-4wd-tours.vercel.app,https://*.vercel.app
AUTH_CORS=https://admin-4wd-tours.vercel.app,https://*.vercel.app
BACKEND_URL=https://4wd-tours-production.up.railway.app
STRIPE_API_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

**Key Differences**:
- Production uses HTTPS, development uses HTTP
- Production uses Railway-provided database/redis
- Production uses live Stripe keys
- Production secrets are 64+ characters and cryptographically random
- Production CORS allows Vercel domains only

---

## Quick Reference

**Generate Strong Secret**:
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

**View All Variables**:
```bash
railway variables
```

**Set Variable**:
```bash
railway variables set KEY=value
```

**Delete Variable**:
```bash
railway variables delete KEY
```

**Check Railway Logs**:
```bash
railway logs --tail 100
```

**Test Backend Health**:
```bash
curl https://4wd-tours-production.up.railway.app/health
```

---

## Next Steps

After configuring Railway environment variables:

1. ✅ Verify all variables are set correctly
2. ✅ Deploy changes to Railway (automatic on variable update)
3. ✅ Test backend API endpoints
4. ✅ Verify admin UI is disabled
5. ✅ Configure Vercel admin deployment with BACKEND_URL
6. ✅ Test admin can connect to Railway backend
7. ✅ Test storefront can connect to Railway Store API
8. ✅ Monitor Railway logs for errors

---

**Last Updated**: 2025-11-11
**Maintained By**: Development Team
