# Production Deployment Guide - Medusa 4WD Tours

## Table of Contents
1. [Environment Variables Overview](#environment-variables-overview)
2. [Security Best Practices](#security-best-practices)
3. [Database Configuration](#database-configuration)
4. [Stripe Production Setup](#stripe-production-setup)
5. [CORS Configuration](#cors-configuration)
6. [Deployment Platforms](#deployment-platforms)
7. [Pre-Deployment Checklist](#pre-deployment-checklist)
8. [Post-Deployment Verification](#post-deployment-verification)
9. [Secret Rotation Procedures](#secret-rotation-procedures)
10. [Troubleshooting](#troubleshooting)

---

## Environment Variables Overview

### Backend (Medusa) - Critical Variables

| Variable | Type | Required | Description |
|----------|------|----------|-------------|
| `JWT_SECRET` | Secret | Yes | Signs authentication tokens (min 64 chars) |
| `COOKIE_SECRET` | Secret | Yes | Signs session cookies (min 64 chars) |
| `DATABASE_URL` | Connection | Yes | PostgreSQL connection string |
| `REDIS_URL` | Connection | Yes | Redis connection string |
| `STRIPE_API_KEY` | Secret | Yes | Stripe secret key (LIVE mode: sk_live_) |
| `STRIPE_WEBHOOK_SECRET` | Secret | Yes | Stripe webhook verification secret |
| `STORE_CORS` | Config | Yes | Allowed storefront origins (comma-separated) |
| `ADMIN_CORS` | Config | Yes | Allowed admin origins (comma-separated) |
| `AUTH_CORS` | Config | Yes | Allowed auth origins (comma-separated) |
| `NODE_ENV` | Config | Yes | Must be 'production' |

### Storefront (Next.js) - Critical Variables

| Variable | Type | Required | Description |
|----------|------|----------|-------------|
| `NEXT_PUBLIC_MEDUSA_BACKEND_URL` | Public | Yes | Backend API URL (HTTPS only) |
| `NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY` | Public | Yes | Medusa publishable API key |
| `NEXT_PUBLIC_DEFAULT_REGION_ID` | Public | Yes | Default region ID (e.g., reg_xxx) |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Public | Yes | Stripe publishable key (LIVE: pk_live_) |
| `NEXT_PUBLIC_GA_MEASUREMENT_ID` | Public | Optional | Google Analytics 4 tracking ID |

---

## Security Best Practices

### 1. Secret Generation

**CRITICAL: Generate cryptographically strong secrets**

```bash
# Generate JWT_SECRET (64+ characters)
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Generate COOKIE_SECRET (64+ characters)
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

**Example output:**
```
b4233caa79233fa2e22339abce8c801a933fa916651446395587590404d685e547d659b4dcf5be269f29ca28ca9d8831d4fd11106cb3b36fe1b083059614ac7f
```

### 2. Secret Management Rules

| Rule | Description | Severity |
|------|-------------|----------|
| **Never commit secrets** | No secrets in git, ever | CRITICAL |
| **Use different secrets per environment** | Dev, staging, production must differ | CRITICAL |
| **Minimum length: 64 characters** | For JWT_SECRET and COOKIE_SECRET | CRITICAL |
| **Rotate secrets regularly** | Every 90 days for critical secrets | HIGH |
| **Use platform secret managers** | Vercel Secrets, Railway Variables, etc. | HIGH |
| **No hardcoded secrets** | Always use environment variables | CRITICAL |
| **Audit secret access** | Track who has access to production secrets | MEDIUM |

### 3. .gitignore Verification

**Verify these files are NEVER committed:**

```bash
# Check .gitignore includes:
cd /Users/Karim/med-usa-4wd

# Backend
grep -E '\.env$|\.env\.local|\.env\.production' .gitignore

# Storefront
grep -E '\.env.*\.local' storefront/.gitignore
```

**Required .gitignore entries:**
```
.env
.env.local
.env*.local
.env.production
.env.production.local
```

### 4. Secret Storage by Platform

#### Vercel
- Location: Project Settings → Environment Variables
- Scope: Production, Preview, Development
- Encryption: Yes (AES-256)
- Access Control: Team-based

#### Railway
- Location: Project → Variables tab
- Encryption: Yes
- Access Control: Project-based
- Note: Variables auto-restart services

#### Render
- Location: Dashboard → Environment
- Encryption: Yes
- Access Control: Team-based
- Feature: Environment Groups (shared variables)

---

## Database Configuration

### PostgreSQL Production Setup

#### Recommended Providers

1. **Supabase** (Recommended)
   - Location: Sydney, Australia (low latency)
   - Automatic backups
   - Connection pooling built-in
   - Free tier: 500MB

   ```bash
   # Connection format
   DATABASE_URL=postgres://postgres.xxx:[PASSWORD]@aws-0-ap-southeast-2.pooler.supabase.com:6543/postgres
   ```

2. **Railway**
   - Plugin-based PostgreSQL
   - Automatic backups
   - US/EU regions

   ```bash
   DATABASE_URL=postgres://postgres:password@containers-us-west-123.railway.app:5432/railway
   ```

3. **Render**
   - Managed PostgreSQL
   - Free tier: 90 days
   - Multiple regions

   ```bash
   DATABASE_URL=postgres://user:pass@dpg-xxx-a.oregon-postgres.render.com/dbname
   ```

#### Database Security Checklist

- [ ] SSL/TLS encryption enabled
- [ ] Strong password (20+ characters, random)
- [ ] IP allowlist configured (if supported)
- [ ] Regular backups enabled (daily minimum)
- [ ] Connection pooling enabled
- [ ] Database user has minimum required permissions
- [ ] Database is in same region as backend (for performance)

#### Connection Pooling

**For high-traffic sites, enable connection pooling:**

```bash
# Add to DATABASE_URL
DATABASE_URL=postgres://user:pass@host:port/db?pgbouncer=true

# Or use separate connection pool
# Supabase: Use port 6543 (pooler) instead of 5432
# PgBouncer: Set up separately
```

---

## Stripe Production Setup

### Step 1: Switch to Live Mode

**CRITICAL: Production must use LIVE mode, not TEST mode**

1. Go to: https://dashboard.stripe.com
2. Toggle switch (top-left): "Test mode" → "Live mode"
3. Complete Stripe activation:
   - Business verification
   - Bank account details
   - Tax information

### Step 2: Get Live API Keys

**Location:** https://dashboard.stripe.com/apikeys

```bash
# Backend .env
STRIPE_API_KEY=sk_live_YOUR_STRIPE_LIVE_SECRET_KEY_HERE

# Storefront .env
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_51xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

**Key Identification:**
- Secret Key (backend): `sk_live_REPLACE_WITH_YOUR_LIVE_KEYxx`
- Publishable Key (frontend): `pk_live_xxxxx`
- **NEVER** use `sk_test_` or `pk_test_` in production

### Step 3: Configure Webhooks

**CRITICAL: Webhooks are REQUIRED for production payments**

#### Create Webhook Endpoint

1. Go to: https://dashboard.stripe.com/webhooks
2. Click "Add endpoint"
3. Endpoint URL: `https://your-backend-domain.com/hooks/payment/stripe_stripe`
4. Select events to listen to:

**Required Events:**
```
payment_intent.succeeded
payment_intent.payment_failed
payment_intent.amount_capturable_updated
charge.succeeded
```

**Recommended Events (if using subscriptions):**
```
customer.subscription.created
customer.subscription.updated
customer.subscription.deleted
invoice.payment_succeeded
invoice.payment_failed
```

5. Copy webhook secret: `whsec_xxxxx`
6. Add to backend `.env`:

```bash
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

### Step 4: Test Payment Flow

**Test in Stripe TEST mode first, then repeat in LIVE mode with small amount**

1. Create test order on storefront
2. Use Stripe test card: `4242 4242 4242 4242`
3. Verify webhook receives events
4. Check order status updates in Medusa Admin
5. Verify payment appears in Stripe Dashboard

**For LIVE mode testing:**
- Use real card with small amount ($1-$5)
- Immediately refund after successful test
- Verify refund webhook triggers

### Step 5: Enable Payment Methods

**In Stripe Dashboard → Settings → Payment Methods:**

- [x] Card payments (Visa, Mastercard, Amex)
- [x] Apple Pay (automatic if card payments enabled)
- [x] Google Pay (automatic if card payments enabled)
- [ ] Afterpay/Clearpay (optional, for AU/NZ)
- [ ] Bank transfers (optional)

### Stripe Security Checklist

- [ ] Using LIVE mode API keys
- [ ] Webhook secret configured
- [ ] Webhook endpoint uses HTTPS
- [ ] Webhook signature verification enabled (automatic in Medusa)
- [ ] API keys stored in platform secret manager
- [ ] Restricted API keys (if using advanced features)
- [ ] Stripe Radar enabled (fraud detection)
- [ ] Email receipts configured
- [ ] Dispute notifications enabled

---

## CORS Configuration

### Production CORS Setup

**CRITICAL: CORS must be configured correctly for security and functionality**

### Backend CORS (.env)

```bash
# Production storefront domain(s)
STORE_CORS=https://medusa-4wd-tours.com,https://www.medusa-4wd-tours.com

# Production admin domain
ADMIN_CORS=https://admin.medusa-4wd-tours.com

# Auth endpoints (usually same as admin)
AUTH_CORS=https://admin.medusa-4wd-tours.com
```

### CORS Rules

| Configuration | Allowed | Not Allowed | Reason |
|---------------|---------|-------------|--------|
| **Protocol** | `https://` | `http://` | Security |
| **Localhost** | Development only | Production | Security |
| **Wildcards** | `*.yourdomain.com` | `*` | Overly permissive |
| **Port numbers** | Dev/staging | Production | Use standard 443 |
| **Multiple domains** | Yes (comma-separated) | Spaces in list | Parser issues |

### CORS Examples

**Good:**
```bash
STORE_CORS=https://shop.example.com,https://www.shop.example.com
ADMIN_CORS=https://admin.example.com
```

**Bad:**
```bash
# ❌ Using HTTP in production
STORE_CORS=http://shop.example.com

# ❌ Using localhost in production
STORE_CORS=http://localhost:8000,https://shop.example.com

# ❌ Using wildcard (too permissive)
STORE_CORS=*

# ❌ Spaces in list
STORE_CORS=https://shop.example.com, https://www.shop.example.com
```

### Subdomain Strategy

**Option 1: Separate Subdomains (Recommended)**
```bash
# Storefront
https://shop.medusa-4wd-tours.com
https://www.medusa-4wd-tours.com

# Admin
https://admin.medusa-4wd-tours.com

# API
https://api.medusa-4wd-tours.com
```

**Option 2: Single Domain with Paths**
```bash
# Storefront
https://medusa-4wd-tours.com

# Admin
https://medusa-4wd-tours.com/admin

# API
https://medusa-4wd-tours.com/api
```

### Testing CORS

```bash
# Test CORS from browser console
fetch('https://your-api-domain.com/health', {
  method: 'GET',
  headers: {
    'Content-Type': 'application/json'
  }
})
.then(response => console.log('CORS OK:', response.ok))
.catch(error => console.error('CORS Error:', error));
```

---

## Deployment Platforms

### Vercel (Recommended for Next.js Storefront)

#### Pros
- Automatic Next.js optimization
- Global CDN (fast worldwide)
- Automatic HTTPS
- Preview deployments
- Generous free tier

#### Setup Steps

1. **Connect Repository**
   ```bash
   # Install Vercel CLI
   npm i -g vercel

   # Login
   vercel login

   # Deploy storefront
   cd /Users/Karim/med-usa-4wd/storefront
   vercel
   ```

2. **Configure Environment Variables**
   - Go to: Project Settings → Environment Variables
   - Add all variables from `.env.production.storefront.example`
   - Set scope: Production

3. **Configure Build Settings**
   - Framework: Next.js
   - Build Command: `npm run build`
   - Output Directory: (auto-detected)
   - Install Command: `npm install`

4. **Custom Domain**
   - Go to: Project Settings → Domains
   - Add domain: `medusa-4wd-tours.com`
   - Configure DNS (provided by Vercel)

### Railway (Recommended for Medusa Backend)

#### Pros
- Easy PostgreSQL setup
- Built-in Redis
- Automatic deployments from GitHub
- Simple pricing
- US/EU regions

#### Setup Steps

1. **Create New Project**
   - Go to: https://railway.app
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Choose: `med-usa-4wd` repository

2. **Add PostgreSQL Plugin**
   - Click "+ New"
   - Select "Database" → "PostgreSQL"
   - Automatically creates `DATABASE_URL`

3. **Add Redis Plugin**
   - Click "+ New"
   - Select "Database" → "Redis"
   - Automatically creates `REDIS_URL`

4. **Configure Environment Variables**
   - Go to: Project → Variables
   - Add all variables from `.env.production.backend.example`
   - Railway auto-injects `DATABASE_URL` and `REDIS_URL`

5. **Configure Build**
   - Root Directory: `/` (or leave empty)
   - Build Command: `npm run build`
   - Start Command: `npm run start`

6. **Generate Domain**
   - Go to: Service Settings → Domains
   - Click "Generate Domain"
   - Or add custom domain

### Render

#### Pros
- Free tier (75 hours/month)
- Auto-deploy from GitHub
- Managed PostgreSQL
- Simple interface

#### Setup Steps

1. **Create Web Service**
   - Go to: https://render.com/dashboard
   - Click "New +" → "Web Service"
   - Connect GitHub repository

2. **Configure Service**
   - Name: `medusa-backend`
   - Environment: `Node`
   - Build Command: `npm install && npm run build`
   - Start Command: `npm run start`

3. **Add PostgreSQL**
   - Dashboard → "New +" → "PostgreSQL"
   - Name: `medusa-db`
   - Copy connection string to `DATABASE_URL`

4. **Configure Environment Variables**
   - Service → Environment
   - Add all variables from `.env.production.backend.example`

---

## Pre-Deployment Checklist

### Security Checklist

- [ ] All secrets generated using `crypto.randomBytes(64)`
- [ ] JWT_SECRET minimum 64 characters
- [ ] COOKIE_SECRET minimum 64 characters
- [ ] Different secrets for dev/staging/production
- [ ] `.env` files in `.gitignore`
- [ ] No secrets committed to git (run `git log --all --full-history -- '*.env'`)
- [ ] Stripe LIVE mode keys (sk_live_, pk_live_)
- [ ] Stripe webhook secret configured
- [ ] Database password 20+ characters
- [ ] Redis password configured (if not using localhost)

### Configuration Checklist

- [ ] `NODE_ENV=production` in backend
- [ ] `NEXT_PUBLIC_ENV=production` in storefront
- [ ] CORS configured with production domains (no localhost)
- [ ] Database URL points to production database
- [ ] Redis URL points to production Redis
- [ ] Medusa publishable key generated for production
- [ ] Default region ID matches production regions
- [ ] Backend URL uses HTTPS

### Stripe Checklist

- [ ] Stripe account activated (not in test mode)
- [ ] Business verification completed
- [ ] Bank account connected
- [ ] Live API keys obtained
- [ ] Webhook endpoint created
- [ ] Webhook secret configured in backend
- [ ] Test payment completed successfully
- [ ] Refund tested

### DNS & Domain Checklist

- [ ] Domains purchased and verified
- [ ] DNS records configured
  - [ ] A/AAAA records for root domain
  - [ ] CNAME for www subdomain
  - [ ] CNAME for api/admin subdomains
- [ ] SSL certificates auto-provisioned (or manually configured)
- [ ] All URLs use HTTPS

### Testing Checklist

- [ ] Build succeeds locally (`npm run build`)
- [ ] Production build tested locally
- [ ] Database migrations run successfully
- [ ] Seed data loaded (if applicable)
- [ ] Admin login works
- [ ] Storefront loads
- [ ] Product pages display correctly
- [ ] Cart functionality works
- [ ] Checkout flow completes
- [ ] Payment processes (test with small amount)
- [ ] Order confirmation received
- [ ] Webhook events logged

---

## Post-Deployment Verification

### Immediate Verification (within 5 minutes)

1. **Health Checks**
   ```bash
   # Backend health
   curl https://your-api-domain.com/health

   # Expected: {"status":"ok"}
   ```

2. **Admin Access**
   - Navigate to: `https://your-admin-domain.com/app`
   - Login with admin credentials
   - Verify: Products, Orders, Settings load

3. **Storefront Access**
   - Navigate to: `https://your-storefront-domain.com`
   - Verify: Homepage loads
   - Verify: Product pages load
   - Verify: Images display correctly

4. **API Connectivity**
   ```bash
   # Test CORS
   curl -H "Origin: https://your-storefront-domain.com" \
        -H "Access-Control-Request-Method: GET" \
        -H "Access-Control-Request-Headers: X-Requested-With" \
        -X OPTIONS \
        https://your-api-domain.com/store/products
   ```

### Extended Verification (within 1 hour)

5. **End-to-End Order Flow**
   - Add product to cart
   - Proceed to checkout
   - Enter shipping information
   - Enter payment details (use real card with small amount)
   - Complete order
   - Verify order appears in Admin
   - Verify payment appears in Stripe Dashboard
   - Verify webhook events received
   - Verify order confirmation email sent (if configured)
   - Process refund
   - Verify refund webhook received

6. **Monitoring Setup**
   - Configure uptime monitoring (e.g., UptimeRobot)
   - Configure error tracking (e.g., Sentry)
   - Configure performance monitoring
   - Set up alerting for critical errors

### Performance Verification

7. **PageSpeed Insights**
   ```bash
   # Run PageSpeed test
   open "https://pagespeed.web.dev/analysis?url=https://your-storefront-domain.com"
   ```

   **Targets:**
   - Desktop: 90+ score
   - Mobile: 90+ score
   - Core Web Vitals: All green

8. **Load Testing**
   ```bash
   # Simple load test using Apache Bench
   ab -n 1000 -c 10 https://your-api-domain.com/store/products
   ```

### Monitoring Verification

9. **Log Aggregation**
   - Verify logs are being collected
   - Check for any errors or warnings
   - Set up log alerts for critical errors

10. **Database Monitoring**
    - Verify database connections are within limits
    - Check query performance
    - Verify backups are running

---

## Secret Rotation Procedures

### When to Rotate Secrets

| Secret | Rotation Frequency | Trigger Events |
|--------|-------------------|----------------|
| `JWT_SECRET` | Every 90 days | Suspected compromise, employee departure |
| `COOKIE_SECRET` | Every 90 days | Suspected compromise, employee departure |
| `STRIPE_API_KEY` | Annually | Suspected compromise, Stripe recommendation |
| `DATABASE_URL` (password) | Every 180 days | Suspected compromise, security audit |
| `REDIS_URL` (password) | Every 180 days | Suspected compromise, security audit |
| Stripe Webhook Secret | When webhook endpoint changes | Endpoint URL change, compromise |

### JWT_SECRET Rotation Procedure

**CRITICAL: This will log out all users**

1. **Preparation**
   - Notify users of scheduled maintenance
   - Choose low-traffic time window
   - Have rollback plan ready

2. **Generate New Secret**
   ```bash
   node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
   ```

3. **Update Environment Variables**
   - Add new `JWT_SECRET` to deployment platform
   - Do NOT delete old secret yet

4. **Deploy Backend**
   - Trigger redeployment with new secret
   - Verify deployment succeeds

5. **Verify Functionality**
   - Test admin login
   - Test storefront customer login
   - Test API authentication

6. **Cleanup**
   - Remove old secret from environment variables
   - Document rotation in security log

### COOKIE_SECRET Rotation Procedure

**CRITICAL: This will invalidate all sessions**

1. **Follow same procedure as JWT_SECRET**
2. **Additional consideration:** Users will be logged out immediately

### Stripe API Key Rotation

1. **Create New Key**
   - Stripe Dashboard → Developers → API Keys
   - Click "Create secret key"
   - Name: `Production API Key (Rotated YYYY-MM-DD)`

2. **Update Environment Variables**
   - Add new `STRIPE_API_KEY`
   - Keep old key active during deployment

3. **Deploy Backend**
   - Verify deployment succeeds
   - Test payment flow

4. **Revoke Old Key**
   - Stripe Dashboard → API Keys
   - Click "..." → "Delete" on old key
   - Confirm deletion

### Database Password Rotation

1. **Create New User (Recommended)**
   ```sql
   -- Create new user
   CREATE USER medusa_prod_v2 WITH PASSWORD 'new_strong_password_here';

   -- Grant permissions
   GRANT ALL PRIVILEGES ON DATABASE medusa_4wd_tours_production TO medusa_prod_v2;
   GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO medusa_prod_v2;
   GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO medusa_prod_v2;
   ```

2. **Update DATABASE_URL**
   - Use new username and password
   - Test connection locally first

3. **Deploy Backend**
   - Verify database connectivity
   - Verify application functions correctly

4. **Remove Old User**
   ```sql
   DROP USER medusa_prod_v1;
   ```

### Emergency Secret Rotation (Compromise Detected)

**Act immediately if secret compromise is suspected**

1. **Isolate** - Revoke old secret immediately
2. **Generate** - Create new secret
3. **Deploy** - Update production ASAP
4. **Verify** - Test critical functionality
5. **Investigate** - Determine how compromise occurred
6. **Document** - Log incident and response
7. **Review** - Update security procedures

---

## Troubleshooting

### Common Issues

#### 1. CORS Errors

**Symptom:** Browser console shows CORS policy errors

**Solutions:**
```bash
# Check backend CORS configuration
echo $STORE_CORS  # Should include your storefront domain

# Verify no spaces in CORS list
# Bad: "https://site1.com, https://site2.com"
# Good: "https://site1.com,https://site2.com"

# Test CORS headers
curl -I -H "Origin: https://your-storefront.com" \
     https://your-api-domain.com/store/products
```

#### 2. Stripe Webhook Failures

**Symptom:** Payments succeed but orders not updating

**Solutions:**
1. Verify webhook endpoint URL is correct
2. Check webhook secret matches in backend .env
3. View webhook logs in Stripe Dashboard
4. Test webhook with Stripe CLI:
   ```bash
   stripe listen --forward-to https://your-api-domain.com/hooks/payment/stripe_stripe
   ```

#### 3. Database Connection Errors

**Symptom:** Backend fails to start, database connection errors

**Solutions:**
```bash
# Verify DATABASE_URL format
# Format: postgres://user:pass@host:port/dbname

# Test connection
psql $DATABASE_URL -c "SELECT version();"

# Check connection limits
# Increase max_connections if needed

# Use connection pooling
# Supabase: Use port 6543 instead of 5432
```

#### 4. Missing Environment Variables

**Symptom:** Application crashes on startup, "undefined" errors

**Solutions:**
1. Verify all required variables are set
2. Check for typos in variable names
3. Verify variables are in correct scope (production vs preview)
4. Redeploy after adding variables

#### 5. Build Failures

**Symptom:** Deployment fails during build

**Solutions:**
```bash
# Check build logs for specific errors

# Common fixes:
# - Install missing dependencies
# - Fix TypeScript errors
# - Increase build memory (Node.js)
NODE_OPTIONS=--max-old-space-size=4096 npm run build

# Clear build cache
rm -rf .next node_modules
npm install
npm run build
```

### Debug Mode

**Enable debug logging in production (temporarily):**

Backend:
```bash
# Add to .env
LOG_LEVEL=debug
DEBUG=medusa:*
```

Storefront:
```bash
# Add to .env
NEXT_PUBLIC_DEBUG=true
```

**IMPORTANT: Disable debug mode after troubleshooting**

### Support Resources

- **Medusa Discord:** https://discord.gg/medusajs
- **Medusa GitHub:** https://github.com/medusajs/medusa
- **Medusa Docs:** https://docs.medusajs.com
- **Stripe Support:** https://support.stripe.com
- **Next.js Discussions:** https://github.com/vercel/next.js/discussions

---

## Appendix

### A. Environment Variable Reference Sheet

**Quick reference for all environment variables**

See:
- `/docs/.env.production.backend.example` - Complete backend reference
- `/docs/.env.production.storefront.example` - Complete storefront reference

### B. Platform-Specific Guides

- **Vercel Deployment:** https://vercel.com/docs
- **Railway Deployment:** https://docs.railway.app
- **Render Deployment:** https://render.com/docs

### C. Security Incident Response Plan

1. Identify affected secrets
2. Rotate all potentially compromised secrets immediately
3. Review access logs for unauthorized access
4. Update security procedures
5. Document incident and response
6. Review and improve security posture

---

**Last Updated:** 2025-11-10
**Version:** 1.0.0
**Maintained by:** Development Team
