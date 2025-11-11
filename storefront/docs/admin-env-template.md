# Admin Environment Variables Template

**Purpose**: Reference template for Medusa admin environment variables
**Last Updated**: 2025-11-11

---

## Railway Backend - Admin Configuration

### Critical Variables (REQUIRED)

```bash
# Database Connection (Provided by Railway Postgres plugin)
DATABASE_URL=postgresql://postgres:[password]@[host]:[port]/railway

# Redis Connection (Provided by Railway Redis plugin - RECOMMENDED)
REDIS_URL=redis://[host]:[port]

# Authentication Secrets (CRITICAL - Generate using instructions below)
# Minimum 64 characters, cryptographically random
JWT_SECRET=[generate-using-command-below]
COOKIE_SECRET=[generate-using-command-below]

# CORS Configuration - Admin Access
# Allow admin UI to make API requests to backend
ADMIN_CORS=https://4wd-tours-production.up.railway.app
AUTH_CORS=https://4wd-tours-production.up.railway.app

# CORS Configuration - Storefront Access
# Allow storefront to make Store API requests
STORE_CORS=https://4wd-tours-913f.vercel.app,https://4wd-tours-913f-4320n76kh-ahnsans-projects.vercel.app,https://*.vercel.app

# Payment Provider - Stripe
STRIPE_API_KEY=sk_live_[your-stripe-secret-key]
STRIPE_PUBLISHABLE_KEY=pk_live_[your-stripe-publishable-key]
STRIPE_WEBHOOK_SECRET=whsec_[your-webhook-secret]

# Environment
NODE_ENV=production
```

### Optional Variables

```bash
# Admin Configuration
# Default: false (admin enabled)
# Set to "true" only if you want to disable the built-in admin UI
DISABLE_ADMIN=false

# Logging
LOG_LEVEL=info  # Options: debug, info, warn, error

# Performance
# Worker threads for background jobs
WORKER_THREADS=4

# Session Configuration
SESSION_TIMEOUT=86400  # 24 hours in seconds
```

---

## Generating Secure Secrets

### Method 1: Node.js (Recommended)

```bash
# Generate JWT_SECRET (64+ characters)
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Generate COOKIE_SECRET (64+ characters)
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Example output:
# b4233caa79233fa2e22339abce8c801a933fa916651446395587590404d685e547d659b4dcf5be269f29ca28ca9d8831d4fd11106cb3b36fe1b083059614ac7f
```

### Method 2: OpenSSL

```bash
# Generate JWT_SECRET
openssl rand -hex 64

# Generate COOKIE_SECRET
openssl rand -hex 64
```

### Method 3: Online Tools (Use with Caution)

**WARNING**: Only use trusted tools, and regenerate secrets immediately if unsure

- [RandomKeygen](https://randomkeygen.com/) - Select "CodeIgniter Encryption Keys"
- [1Password](https://1password.com/password-generator/) - Generate 64-character password

---

## Setting Variables in Railway

### Method 1: Railway Dashboard (Recommended)

1. Go to [Railway Dashboard](https://railway.app/dashboard)
2. Select your backend service
3. Click "Variables" tab
4. Click "New Variable"
5. Enter variable name and value
6. Click "Add"
7. Service will automatically redeploy with new variables

### Method 2: Railway CLI

```bash
# Install Railway CLI (if not already installed)
npm install -g @railway/cli

# Login to Railway
railway login

# Link to your project
railway link

# Set individual variable
railway variables set JWT_SECRET="[your-secret-here]"

# Set multiple variables from file
railway variables set -f .env.production

# View all variables
railway variables
```

### Method 3: Railway Environment File Upload

```bash
# Create .env.production file locally (never commit to git!)
cat > .env.production << 'EOF'
JWT_SECRET=[your-jwt-secret]
COOKIE_SECRET=[your-cookie-secret]
STRIPE_API_KEY=[your-stripe-key]
EOF

# Upload to Railway
railway variables set -f .env.production

# Delete local file (security)
rm .env.production
```

---

## CORS Configuration Guide

### Understanding CORS

**CORS (Cross-Origin Resource Sharing)** allows web applications on different domains to make API requests to your backend.

### CORS Configuration by Service

**Admin UI** (served from Railway):
```bash
# Allow admin UI to call admin API
ADMIN_CORS=https://4wd-tours-production.up.railway.app

# If using custom domain for admin
ADMIN_CORS=https://4wd-tours-production.up.railway.app,https://admin.4wdtours.com.au
```

**Authentication** (login/logout):
```bash
# Allow authentication from admin UI
AUTH_CORS=https://4wd-tours-production.up.railway.app

# If using custom domain
AUTH_CORS=https://4wd-tours-production.up.railway.app,https://admin.4wdtours.com.au
```

**Store API** (customer-facing):
```bash
# Allow storefront to call Store API
STORE_CORS=https://4wd-tours-913f.vercel.app,https://4wd-tours-913f-4320n76kh-ahnsans-projects.vercel.app,https://*.vercel.app

# Add development/staging environments
STORE_CORS=https://4wd-tours-913f.vercel.app,https://*.vercel.app,http://localhost:8000,https://staging.4wdtours.com.au
```

### CORS Best Practices

1. **Specific Domains**: List specific domains instead of using `*` wildcard
2. **HTTPS Only**: Only allow HTTPS origins in production
3. **No Trailing Slashes**: URLs should not end with `/`
4. **Comma Separation**: Multiple domains separated by commas (no spaces)
5. **Include Subdomains**: Use `https://*.vercel.app` for all Vercel preview deployments

---

## Stripe Configuration

### Development (Test Mode)

```bash
# Stripe Test Keys (get from Stripe Dashboard → API Keys)
STRIPE_API_KEY=sk_test_your_stripe_test_key_here
STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key_here

# Webhook Secret (get from Stripe Dashboard or CLI)
# Stripe Dashboard → Developers → Webhooks → Add endpoint
# Endpoint URL: https://4wd-tours-production.up.railway.app/hooks/payment/stripe_stripe
STRIPE_WEBHOOK_SECRET=whsec_[test-webhook-secret]
```

### Production (Live Mode)

```bash
# Stripe Live Keys (NEVER commit these)
STRIPE_API_KEY=sk_live_[your-live-secret-key]
STRIPE_PUBLISHABLE_KEY=pk_live_[your-live-publishable-key]

# Live Webhook Secret
# Create webhook endpoint in Stripe Dashboard (Live mode)
# Endpoint URL: https://4wd-tours-production.up.railway.app/hooks/payment/stripe_stripe
# Events to listen: payment_intent.succeeded, payment_intent.payment_failed, charge.refunded
STRIPE_WEBHOOK_SECRET=whsec_[live-webhook-secret]
```

### Getting Stripe Keys

1. **Login to Stripe Dashboard**: [https://dashboard.stripe.com](https://dashboard.stripe.com)

2. **Get API Keys**:
   - Click "Developers" in left sidebar
   - Click "API keys"
   - Copy "Secret key" (sk_test_... or sk_live_...)
   - Copy "Publishable key" (pk_test_... or pk_live_...)

3. **Create Webhook**:
   - Click "Developers" → "Webhooks"
   - Click "Add endpoint"
   - Endpoint URL: `https://4wd-tours-production.up.railway.app/hooks/payment/stripe_stripe`
   - Description: "Medusa Payment Webhooks"
   - Events to send:
     - `payment_intent.succeeded`
     - `payment_intent.payment_failed`
     - `payment_intent.canceled`
     - `charge.refunded`
   - Click "Add endpoint"
   - Copy "Signing secret" (whsec_...)

---

## Database Configuration

### Railway Postgres (Recommended)

**Railway automatically provides DATABASE_URL** when you add the Postgres plugin.

**Format**:
```
postgresql://postgres:[password]@[host].railway.internal:[port]/railway
```

**No manual configuration needed** - Railway injects this variable automatically.

### External PostgreSQL Database

If using external database (e.g., AWS RDS, Digital Ocean):

```bash
DATABASE_URL=postgresql://[username]:[password]@[host]:[port]/[database]?schema=public

# Example:
DATABASE_URL=postgresql://medusa_user:secure_password@db.example.com:5432/medusa_production?schema=public
```

**Connection Pool Settings** (optional):
```bash
DATABASE_URL=postgresql://user:pass@host:5432/db?schema=public&connection_limit=10&pool_timeout=20
```

### Database Migrations

**Migrations run automatically** on Railway via `railway-start.sh`:

```bash
#!/bin/bash
npx medusa db:migrate
exec medusa start
```

**Manual Migration** (if needed):

```bash
# Run migrations via Railway CLI
railway run npx medusa db:migrate

# Or SSH into Railway service
railway shell
npx medusa db:migrate
exit
```

---

## Redis Configuration

### Railway Redis (Recommended)

**Railway automatically provides REDIS_URL** when you add the Redis plugin.

**Format**:
```
redis://[host].railway.internal:[port]
```

**No manual configuration needed** - Railway injects this variable automatically.

### External Redis

If using external Redis (e.g., Redis Cloud, AWS ElastiCache):

```bash
# Basic Redis URL
REDIS_URL=redis://[host]:[port]

# Redis with authentication
REDIS_URL=redis://:[password]@[host]:[port]

# Redis with TLS
REDIS_URL=rediss://:[password]@[host]:[port]

# Example (Redis Cloud):
REDIS_URL=redis://:secure_password@redis-12345.c1.us-east-1-1.ec2.cloud.redislabs.com:12345
```

### Redis Configuration Options

```bash
# Redis TLS (secure connection)
REDIS_TLS=true

# Redis Connection Pool
REDIS_POOL_MIN=2
REDIS_POOL_MAX=10

# Redis Timeout
REDIS_TIMEOUT=5000  # 5 seconds
```

---

## Environment-Specific Configurations

### Development (.env)

```bash
# Local development environment
DATABASE_URL=postgres://localhost/medusa-4wd-tours
REDIS_URL=redis://localhost:6379
ADMIN_CORS=http://localhost:5173,http://localhost:9000
STORE_CORS=http://localhost:8000
AUTH_CORS=http://localhost:5173,http://localhost:9000
NODE_ENV=development
LOG_LEVEL=debug
```

### Staging (Railway Staging Service)

```bash
# Staging environment (Railway)
DATABASE_URL=[railway-staging-postgres-url]
REDIS_URL=[railway-staging-redis-url]
ADMIN_CORS=https://staging-backend.railway.app
STORE_CORS=https://staging-storefront.vercel.app
AUTH_CORS=https://staging-backend.railway.app
NODE_ENV=production
LOG_LEVEL=info
STRIPE_API_KEY=sk_test_[test-key]
```

### Production (Railway Production Service)

```bash
# Production environment (Railway)
DATABASE_URL=[railway-production-postgres-url]
REDIS_URL=[railway-production-redis-url]
ADMIN_CORS=https://4wd-tours-production.up.railway.app
STORE_CORS=https://4wd-tours-913f.vercel.app,https://*.vercel.app
AUTH_CORS=https://4wd-tours-production.up.railway.app
NODE_ENV=production
LOG_LEVEL=warn
STRIPE_API_KEY=sk_live_[live-key]
```

---

## Verification Checklist

### After Setting Environment Variables

- [ ] **Backend Deploys Successfully**: Check Railway logs for errors
- [ ] **Database Connection**: Backend can connect to PostgreSQL
- [ ] **Redis Connection**: Backend can connect to Redis (if configured)
- [ ] **Admin UI Accessible**: Visit `/app` and see login page
- [ ] **Store API Works**: Test `/store/products` endpoint
- [ ] **CORS Configured**: No CORS errors in browser console
- [ ] **Stripe Integration**: Payment flow works correctly
- [ ] **Secrets Secure**: No secrets committed to git

### Test Commands

```bash
# Test backend health
curl https://4wd-tours-production.up.railway.app/health

# Test Store API
curl "https://4wd-tours-production.up.railway.app/store/products?limit=1" \
  -H "x-publishable-api-key: [your-publishable-key]"

# Test admin UI (should return HTML)
curl https://4wd-tours-production.up.railway.app/app

# Check Railway logs
railway logs

# Check Railway variables
railway variables
```

---

## Security Best Practices

### DO ✅

- ✅ Generate secrets using cryptographic random functions
- ✅ Use minimum 64-character secrets for JWT and Cookie secrets
- ✅ Store secrets in Railway Variables (never in code)
- ✅ Use different secrets for dev, staging, production
- ✅ Rotate secrets every 90 days
- ✅ Use HTTPS for all CORS origins (production)
- ✅ Use strong database passwords (Railway generates these)
- ✅ Enable 2FA on Railway account
- ✅ Limit admin user access (least privilege)
- ✅ Monitor Railway logs for suspicious activity

### DON'T ❌

- ❌ Commit secrets to git (add .env to .gitignore)
- ❌ Share secrets via email or chat
- ❌ Use weak secrets (e.g., "secret123")
- ❌ Reuse secrets across environments
- ❌ Use `*` wildcard for CORS in production
- ❌ Hardcode secrets in application code
- ❌ Store secrets in frontend (use NEXT_PUBLIC_ only for non-sensitive data)
- ❌ Use HTTP for CORS origins in production
- ❌ Disable HTTPS/TLS for database or Redis
- ❌ Leave default passwords unchanged

---

## Troubleshooting

### Issue: Backend Fails to Start

**Symptom**: Railway deployment fails, service restarts repeatedly

**Check**:

```bash
# View Railway logs
railway logs

# Common errors:
# - "JWT_SECRET is required" → Missing JWT_SECRET variable
# - "Database connection failed" → Invalid DATABASE_URL
# - "CORS origin not allowed" → CORS misconfiguration
```

**Solution**:

```bash
# Verify all required variables are set
railway variables

# Set missing variables
railway variables set JWT_SECRET=[your-secret]
railway variables set COOKIE_SECRET=[your-secret]

# Redeploy
railway up --detach
```

### Issue: Admin UI Shows CORS Error

**Symptom**: Browser console shows CORS policy error

**Check**:

```
Access to XMLHttpRequest at 'https://backend.com/admin/auth'
from origin 'https://admin.com' has been blocked by CORS policy
```

**Solution**:

```bash
# Update ADMIN_CORS and AUTH_CORS
railway variables set ADMIN_CORS=https://4wd-tours-production.up.railway.app
railway variables set AUTH_CORS=https://4wd-tours-production.up.railway.app

# Clear browser cache and retry
```

### Issue: Stripe Webhook Errors

**Symptom**: Payments succeed but orders not created in Medusa

**Check**:

```bash
# View Railway logs for webhook errors
railway logs | grep stripe

# Common errors:
# - "Invalid webhook signature" → Wrong STRIPE_WEBHOOK_SECRET
# - "Webhook endpoint not found" → Incorrect endpoint URL
```

**Solution**:

1. Verify webhook endpoint URL in Stripe Dashboard
2. Copy new webhook secret
3. Update Railway variable:

```bash
railway variables set STRIPE_WEBHOOK_SECRET=whsec_[new-secret]
```

---

## Quick Reference

### Generate Secrets

```bash
# JWT_SECRET
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# COOKIE_SECRET
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### Set Railway Variables

```bash
# Single variable
railway variables set KEY=value

# Multiple variables from file
railway variables set -f .env.production

# View all variables
railway variables
```

### Test Backend

```bash
# Health check
curl https://4wd-tours-production.up.railway.app/health

# Store API
curl "https://4wd-tours-production.up.railway.app/store/products" \
  -H "x-publishable-api-key: [key]"

# Admin UI (should return HTML)
curl https://4wd-tours-production.up.railway.app/app
```

---

## Appendix: Complete Example Configuration

### Railway Backend - Complete .env Example

```bash
# ========================================
# RAILWAY BACKEND - PRODUCTION
# ========================================

# Database (Provided by Railway Postgres)
DATABASE_URL=postgresql://postgres:secure_password_here@monorail.proxy.rlwy.net:12345/railway

# Redis (Provided by Railway Redis)
REDIS_URL=redis://monorail.proxy.rlwy.net:23456

# Authentication Secrets (CRITICAL)
JWT_SECRET=b4233caa79233fa2e22339abce8c801a933fa916651446395587590404d685e547d659b4dcf5be269f29ca28ca9d8831d4fd11106cb3b36fe1b083059614ac7f
COOKIE_SECRET=a7854def90345ab3d44451bdf9d902b1a044cb027762557506698701515e796e58e770c5edf6cf370e40db39db0e9942e5fe22217dc4c47gf2c194160725bd8g

# CORS Configuration
ADMIN_CORS=https://4wd-tours-production.up.railway.app
AUTH_CORS=https://4wd-tours-production.up.railway.app
STORE_CORS=https://4wd-tours-913f.vercel.app,https://4wd-tours-913f-4320n76kh-ahnsans-projects.vercel.app,https://*.vercel.app

# Stripe Payment Provider (PRODUCTION - Use Live Keys)
STRIPE_API_KEY=sk_live_[your-stripe-live-secret-key]
STRIPE_PUBLISHABLE_KEY=pk_live_[your-stripe-live-publishable-key]
STRIPE_WEBHOOK_SECRET=whsec_[your-live-webhook-secret]

# Environment
NODE_ENV=production

# Admin Configuration (Optional)
DISABLE_ADMIN=false

# Logging
LOG_LEVEL=info
```

**WARNING**: This is an example only. Never use these exact values in production.

---

**Document Version**: 1.0.0
**Last Updated**: 2025-11-11
**Maintained By**: Development Team
