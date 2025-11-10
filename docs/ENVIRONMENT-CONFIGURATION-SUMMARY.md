# Environment Configuration & Secrets Management - Summary Report

**Project:** Medusa 4WD Tours
**Date:** 2025-11-10
**Status:** Complete - Production Ready

---

## Executive Summary

This document provides a comprehensive overview of all environment configuration and secrets management requirements for deploying Medusa 4WD Tours to production. All sensitive credentials have been documented with security best practices, and production-ready templates have been created.

---

## Documentation Delivered

### 1. Environment Variable Templates

| File | Location | Purpose |
|------|----------|---------|
| **Backend Production Template** | `/Users/Karim/med-usa-4wd/docs/.env.production.backend.example` | Complete backend environment variables with placeholders |
| **Storefront Production Template** | `/Users/Karim/med-usa-4wd/docs/.env.production.storefront.example` | Complete storefront environment variables with placeholders |

### 2. Comprehensive Guides

| Guide | Location | Coverage |
|-------|----------|----------|
| **Production Deployment Guide** | `/Users/Karim/med-usa-4wd/docs/PRODUCTION-DEPLOYMENT-GUIDE.md` | Complete deployment process, security, testing |
| **Security Checklist** | `/Users/Karim/med-usa-4wd/docs/SECURITY-CHECKLIST.md` | Pre-deployment security review checklist |
| **CORS Configuration Guide** | `/Users/Karim/med-usa-4wd/docs/CORS-CONFIGURATION-GUIDE.md` | Detailed CORS setup and troubleshooting |
| **Stripe Production Setup** | `/Users/Karim/med-usa-4wd/docs/STRIPE-PRODUCTION-SETUP.md` | Complete Stripe live mode configuration |

---

## Environment Variables Inventory

### Backend (Medusa) - Required Variables

| Variable | Type | Source | Purpose |
|----------|------|--------|---------|
| `JWT_SECRET` | Secret | Generate via crypto | Signs authentication tokens (min 64 chars) |
| `COOKIE_SECRET` | Secret | Generate via crypto | Signs session cookies (min 64 chars) |
| `DATABASE_URL` | Connection String | PostgreSQL provider | Database connection |
| `REDIS_URL` | Connection String | Redis provider | Caching and sessions |
| `STRIPE_API_KEY` | Secret | Stripe Dashboard (LIVE) | Payment processing (sk_live_) |
| `STRIPE_WEBHOOK_SECRET` | Secret | Stripe Webhooks | Webhook verification |
| `STORE_CORS` | Config | Manual | Allowed storefront domains |
| `ADMIN_CORS` | Config | Manual | Allowed admin domains |
| `AUTH_CORS` | Config | Manual | Allowed auth domains |
| `NODE_ENV` | Config | Manual | Must be 'production' |

**Current Development Values:**
```bash
# From: /Users/Karim/med-usa-4wd/.env
STORE_CORS=http://localhost:8000,https://docs.medusajs.com
ADMIN_CORS=http://localhost:5173,http://localhost:9000,https://docs.medusajs.com
AUTH_CORS=http://localhost:5173,http://localhost:9000,https://docs.medusajs.com
REDIS_URL=redis://localhost:6379
DATABASE_URL=postgres://localhost/medusa-4wd-tours
STRIPE_API_KEY=sk_test_... (TEST MODE)
STRIPE_WEBHOOK_SECRET=(not configured yet)
```

### Storefront (Next.js) - Required Variables

| Variable | Type | Source | Purpose |
|----------|------|--------|---------|
| `NEXT_PUBLIC_MEDUSA_BACKEND_URL` | Public | Manual | Backend API URL (HTTPS) |
| `NEXT_PUBLIC_API_URL` | Public | Manual | Backend API URL (legacy) |
| `NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY` | Public | Medusa Admin | API access key |
| `NEXT_PUBLIC_DEFAULT_REGION_ID` | Public | Medusa Admin | Default region (reg_xxx) |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Public | Stripe Dashboard (LIVE) | Stripe client key (pk_live_) |

**Current Development Values:**
```bash
# From: /Users/Karim/med-usa-4wd/storefront/.env.local
NEXT_PUBLIC_MEDUSA_BACKEND_URL=http://localhost:9000
NEXT_PUBLIC_API_URL=http://localhost:9000
NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY=pk_34de56e6f305b46e6d22bb1d2d3304bd9eea498066ca7749bd667318dca31ffc (DEV)
NEXT_PUBLIC_DEFAULT_REGION_ID=reg_01K9G4HA190556136E7RJQ4411
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_... (TEST MODE)
```

### Optional Variables (Analytics, etc.)

| Variable | Type | Purpose |
|----------|------|---------|
| `NEXT_PUBLIC_GA_MEASUREMENT_ID` | Public | Google Analytics 4 tracking |
| `NEXT_PUBLIC_GTM_ID` | Public | Google Tag Manager |
| `SENTRY_DSN` | Public/Secret | Error tracking |
| `AWS_ACCESS_KEY_ID` | Secret | S3 file storage (if using) |
| `AWS_SECRET_ACCESS_KEY` | Secret | S3 file storage (if using) |
| `SENDGRID_API_KEY` | Secret | Email service (if using) |

---

## Current Security Status

### Verified Security Measures

✅ **Secrets Not in Git:**
- `.env` is in `.gitignore` (backend)
- `.env*.local` is in `.gitignore` (storefront)
- No secrets found in git history (verified)

✅ **Strong Secrets Generated:**
- Current `JWT_SECRET` is 128 characters (cryptographically strong)
- Current `COOKIE_SECRET` is 128 characters (cryptographically strong)
- Both secrets are different from each other

✅ **Secret Validation:**
- `medusa-config.ts` validates secrets on startup
- Requires minimum 32 character length
- Throws error if secrets missing or too short

✅ **Test Mode Stripe:**
- Currently using test keys (safe for development)
- Keys clearly labeled as `sk_test_` and `pk_test_`

### Required Actions for Production

❌ **Generate Production Secrets:**
```bash
# Generate new JWT_SECRET for production
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Generate new COOKIE_SECRET for production
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

❌ **Switch to Stripe Live Mode:**
- Activate Stripe account
- Get live API keys (sk_live_, pk_live_)
- Configure webhook endpoint
- Get webhook secret (whsec_)

❌ **Update CORS for Production:**
```bash
# Replace localhost with production domains
STORE_CORS=https://medusa-4wd-tours.com,https://www.medusa-4wd-tours.com
ADMIN_CORS=https://admin.medusa-4wd-tours.com
AUTH_CORS=https://admin.medusa-4wd-tours.com
```

❌ **Set Up Production Database:**
- Create production PostgreSQL instance
- Update `DATABASE_URL` with production connection string
- Enable SSL/TLS connection
- Configure automated backups

❌ **Set Up Production Redis:**
- Create production Redis instance
- Update `REDIS_URL` with production connection string
- Enable authentication

---

## Security Best Practices Implemented

### 1. Secret Generation

**Method:** Cryptographically secure random generation
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

**Requirements:**
- Minimum 64 characters for JWT_SECRET and COOKIE_SECRET
- Different secrets for dev/staging/production
- Validated on application startup

### 2. Secret Storage

**Development:**
- Local `.env` files (NOT committed to git)
- Listed in `.gitignore`

**Production:**
- Platform secret managers:
  - Vercel: Environment Variables
  - Railway: Variables tab
  - Render: Environment section
- Never in code or version control

### 3. Secret Rotation

**Schedule:**
| Secret | Rotation Frequency | Last Rotated |
|--------|-------------------|--------------|
| JWT_SECRET | Every 90 days | Not in production yet |
| COOKIE_SECRET | Every 90 days | Not in production yet |
| STRIPE_API_KEY | Annually | Not in production yet |
| DATABASE_URL | Every 180 days | Not in production yet |

### 4. Access Control

**Principles:**
- Minimum required permissions
- Separate credentials per environment
- Restricted API keys where possible
- Team-based access control on platforms

---

## Stripe Configuration

### Current Status (Development)

**Mode:** TEST MODE ✅
- Secret Key: `sk_test_51SRbgoRAcUUTBTrP...` (masked)
- Publishable Key: `pk_test_51SRbgoRAcUUTBTrP...` (masked)
- Webhook Secret: Not configured

### Production Requirements

**Mode:** LIVE MODE (switch required)

**Steps to Complete:**
1. Activate Stripe account (business verification)
2. Switch to live mode in Stripe Dashboard
3. Get live API keys (sk_live_, pk_live_)
4. Create webhook endpoint: `https://api.domain.com/hooks/payment/stripe_stripe`
5. Configure webhook events:
   - payment_intent.succeeded
   - payment_intent.payment_failed
   - payment_intent.amount_capturable_updated
   - charge.succeeded
6. Get webhook signing secret (whsec_)
7. Update environment variables
8. Test with small real payment
9. Refund test payment

**Payment Methods Enabled (Default):**
- Visa, Mastercard, American Express
- Apple Pay (automatic)
- Google Pay (automatic)

**Fraud Prevention:**
- Stripe Radar (automatic, included)
- 3D Secure / SCA (automatic for EU)

---

## CORS Configuration

### Current Configuration (Development)

```bash
STORE_CORS=http://localhost:8000,https://docs.medusajs.com
ADMIN_CORS=http://localhost:5173,http://localhost:9000,https://docs.medusajs.com
AUTH_CORS=http://localhost:5173,http://localhost:9000,https://docs.medusajs.com
```

### Production Configuration (Required)

**Strategy: Separate Subdomains (Recommended)**

```bash
STORE_CORS=https://medusa-4wd-tours.com,https://www.medusa-4wd-tours.com
ADMIN_CORS=https://admin.medusa-4wd-tours.com
AUTH_CORS=https://admin.medusa-4wd-tours.com
```

**Rules:**
- ✅ HTTPS only (no HTTP)
- ✅ No localhost
- ✅ Comma-separated (no spaces)
- ✅ No trailing slashes
- ❌ No wildcards (avoid)

---

## Deployment Platforms Recommended

### Backend (Medusa)

**Recommended: Railway**
- Built-in PostgreSQL plugin
- Built-in Redis plugin
- Automatic DATABASE_URL and REDIS_URL injection
- Simple deployment from GitHub
- US/EU regions available

**Alternative: Render**
- Free tier (75 hours/month)
- Managed PostgreSQL
- GitHub auto-deploy
- Simple interface

### Storefront (Next.js)

**Recommended: Vercel**
- Optimized for Next.js
- Automatic optimizations
- Global CDN
- Preview deployments
- Generous free tier

**Alternative: Netlify**
- Similar to Vercel
- Good Next.js support

---

## Pre-Deployment Checklist

### Secrets & Credentials

- [ ] New JWT_SECRET generated (64+ chars, different from dev)
- [ ] New COOKIE_SECRET generated (64+ chars, different from dev)
- [ ] Stripe account activated
- [ ] Stripe live API keys obtained (sk_live_, pk_live_)
- [ ] Stripe webhook endpoint created and secret obtained
- [ ] Database password is strong (20+ chars)
- [ ] All secrets stored in platform secret manager

### Configuration

- [ ] NODE_ENV=production
- [ ] CORS updated with production domains (no localhost)
- [ ] Backend URL uses HTTPS
- [ ] Database URL points to production database
- [ ] Redis URL points to production Redis
- [ ] Medusa publishable key generated for production
- [ ] Default region ID verified

### Testing

- [ ] Build succeeds locally
- [ ] Database migrations run successfully
- [ ] Admin login works
- [ ] Storefront loads
- [ ] Test payment completes (small amount in live mode)
- [ ] Test payment refunded
- [ ] Webhooks received and logged

### Security

- [ ] No secrets in git
- [ ] .gitignore configured correctly
- [ ] SSL/TLS certificates configured
- [ ] Monitoring and alerts set up
- [ ] Backup strategy in place

---

## How to Generate Secure Secrets

### Method 1: Node.js crypto (Recommended)

```bash
# Generate 64-byte (128 character) secret
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Example output:
# b4233caa79233fa2e22339abce8c801a933fa916651446395587590404d685e547d659b4dcf5be269f29ca28ca9d8831d4fd11106cb3b36fe1b083059614ac7f
```

### Method 2: OpenSSL

```bash
# Generate 64-byte secret
openssl rand -hex 64
```

### Method 3: Online Generator (Use with Caution)

- Only use for non-critical secrets
- Never use for production JWT/COOKIE secrets
- Example: https://randomkeygen.com/ (but prefer crypto method)

### What NOT to Use

❌ Dictionary words
❌ Personal information
❌ Short strings (< 32 chars)
❌ Predictable patterns
❌ Reused secrets from other projects

---

## Secret Rotation Procedures

### JWT_SECRET Rotation

**Impact:** All users will be logged out

**Steps:**
1. Generate new secret
2. Update platform environment variables
3. Redeploy backend
4. Verify functionality
5. Remove old secret

### COOKIE_SECRET Rotation

**Impact:** All sessions invalidated

**Steps:**
1. Generate new secret
2. Update platform environment variables
3. Redeploy backend
4. Verify functionality
5. Remove old secret

### Stripe API Key Rotation

**Steps:**
1. Create new secret key in Stripe Dashboard
2. Update backend environment variable
3. Redeploy backend
4. Test payment flow
5. Revoke old key in Stripe Dashboard

---

## Environment Variable Naming Conventions

### Public vs Private

**Private Variables (Backend Only):**
- Never exposed to browser
- Examples: JWT_SECRET, COOKIE_SECRET, STRIPE_API_KEY, DATABASE_URL

**Public Variables (Frontend, Browser-Accessible):**
- Prefixed with `NEXT_PUBLIC_`
- Safe to expose in browser bundle
- Examples: NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY, NEXT_PUBLIC_MEDUSA_BACKEND_URL

**CRITICAL:** Never use `NEXT_PUBLIC_` prefix for secrets!

### Naming Pattern

```
COMPONENT_TYPE_PURPOSE

Examples:
- DATABASE_URL (component: DATABASE, purpose: URL)
- STRIPE_API_KEY (component: STRIPE, type: API, purpose: KEY)
- NEXT_PUBLIC_MEDUSA_BACKEND_URL (public, component: MEDUSA, type: BACKEND, purpose: URL)
```

---

## Platform-Specific Configuration

### Vercel (Storefront)

**Add Environment Variables:**
1. Project Settings → Environment Variables
2. Add each NEXT_PUBLIC_* variable
3. Set scope: Production
4. Redeploy: `vercel --prod`

**Example:**
```
NEXT_PUBLIC_MEDUSA_BACKEND_URL=https://api.medusa-4wd-tours.com
NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY=pk_xxx
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_xxx
NEXT_PUBLIC_DEFAULT_REGION_ID=reg_xxx
```

### Railway (Backend)

**Add Environment Variables:**
1. Project → Variables tab
2. Add each variable
3. Deployment auto-restarts

**Auto-Injected Variables:**
- DATABASE_URL (from PostgreSQL plugin)
- REDIS_URL (from Redis plugin)

**Manual Variables:**
```
JWT_SECRET=xxx
COOKIE_SECRET=xxx
STRIPE_API_KEY=sk_live_REPLACE_WITH_YOUR_LIVE_KEY
STRIPE_WEBHOOK_SECRET=whsec_xxx
STORE_CORS=https://...
ADMIN_CORS=https://...
AUTH_CORS=https://...
NODE_ENV=production
```

### Render (Backend Alternative)

**Add Environment Variables:**
1. Dashboard → Service → Environment
2. Add variables
3. Click "Save Changes" (triggers redeploy)

**Note:** DATABASE_URL must be added manually (copy from PostgreSQL service)

---

## Troubleshooting Common Issues

### "JWT_SECRET is required"

**Cause:** Environment variable not set or too short

**Solution:**
1. Verify variable exists on platform
2. Verify minimum 32 characters
3. Redeploy after adding variable

### "CORS policy: No 'Access-Control-Allow-Origin' header"

**Cause:** Storefront domain not in STORE_CORS

**Solution:**
1. Update STORE_CORS with storefront domain
2. Remove spaces in CORS list
3. Verify HTTPS (not HTTP) in production
4. Redeploy backend

### "Stripe webhook signature verification failed"

**Cause:** STRIPE_WEBHOOK_SECRET mismatch or not set

**Solution:**
1. Copy webhook secret from Stripe Dashboard → Webhooks
2. Update STRIPE_WEBHOOK_SECRET environment variable
3. Redeploy backend
4. Test webhook delivery in Stripe Dashboard

### "Database connection failed"

**Cause:** DATABASE_URL incorrect or database not accessible

**Solution:**
1. Verify DATABASE_URL format: `postgres://user:pass@host:port/db`
2. Test connection: `psql $DATABASE_URL -c "SELECT version();"`
3. Verify database is running
4. Check firewall/security group allows connections

---

## Next Steps

### Immediate Actions

1. **Review documentation** in `/Users/Karim/med-usa-4wd/docs/`:
   - Read `PRODUCTION-DEPLOYMENT-GUIDE.md` thoroughly
   - Review `SECURITY-CHECKLIST.md` before deployment
   - Study `STRIPE-PRODUCTION-SETUP.md` for payment configuration

2. **Prepare for production:**
   - Activate Stripe account
   - Choose hosting platforms (Railway + Vercel recommended)
   - Purchase/configure domain names
   - Set up DNS records

3. **Generate production secrets:**
   ```bash
   node -e "console.log(require('crypto').randomBytes(64).toString('hex'))" # JWT_SECRET
   node -e "console.log(require('crypto').randomBytes(64).toString('hex'))" # COOKIE_SECRET
   ```

4. **Configure Stripe:**
   - Complete business verification
   - Switch to live mode
   - Get live API keys
   - Create webhook endpoint

### Before First Deployment

- [ ] Complete security checklist
- [ ] Test payment flow in TEST mode
- [ ] Verify all environment variables
- [ ] Test build locally
- [ ] Set up monitoring and alerts

### After Deployment

- [ ] Test payment flow in LIVE mode (small amount)
- [ ] Verify webhooks working
- [ ] Monitor logs for errors
- [ ] Set up automated backups
- [ ] Document deployment date and credentials location

---

## Support & Resources

### Documentation

- **Medusa Docs:** https://docs.medusajs.com
- **Stripe Docs:** https://stripe.com/docs
- **Next.js Docs:** https://nextjs.org/docs

### Project-Specific

- **Environment Templates:** `/Users/Karim/med-usa-4wd/docs/.env.production.*.example`
- **Configuration Files:**
  - Backend: `/Users/Karim/med-usa-4wd/medusa-config.ts`
  - Storefront: `/Users/Karim/med-usa-4wd/storefront/next.config.js`

### Contact

- **Medusa Discord:** https://discord.gg/medusajs
- **Stripe Support:** https://support.stripe.com

---

## Summary

All environment configuration and secrets management documentation has been created and is production-ready. The project includes:

✅ Complete environment variable templates
✅ Security best practices and checklists
✅ Stripe production setup guide
✅ CORS configuration documentation
✅ Secret rotation procedures
✅ Platform-specific deployment guides
✅ Troubleshooting references

**Current Development Environment:** Secure and properly configured
**Production Readiness:** Documentation complete, awaiting production setup

**CRITICAL NEXT STEP:** Follow `/Users/Karim/med-usa-4wd/docs/PRODUCTION-DEPLOYMENT-GUIDE.md` when ready to deploy.

---

**Report Generated:** 2025-11-10
**Version:** 1.0.0
**Status:** Complete
