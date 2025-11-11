# Environment Variables Reference

Complete guide to environment variables for Medusa Admin deployment.

## Vercel Environment Variables

### Required Variables

#### MEDUSA_ADMIN_BACKEND_URL
- **Description**: URL of your Railway backend API
- **Value**: `https://4wd-tours-production.up.railway.app`
- **When to set**: During Vercel deployment
- **How to set**:
  ```bash
  npx vercel env add MEDUSA_ADMIN_BACKEND_URL
  # Enter: https://4wd-tours-production.up.railway.app
  # Select: Production
  ```

### Optional Variables

#### NODE_ENV
- **Description**: Node environment
- **Value**: `production`
- **Default**: Automatically set by Vercel
- **Rarely needs manual configuration**

---

## Railway Environment Variables

### Critical for Admin Access

#### ADMIN_CORS
- **Description**: Allowed origins for Admin API
- **Format**: Comma-separated URLs
- **Example**:
  ```
  ADMIN_CORS=http://localhost:5173,http://localhost:9000,https://medusa-admin-4wd-tours-abc123.vercel.app
  ```
- **When to update**: After every Vercel deployment
- **Important**: Must include your Vercel admin URL

#### AUTH_CORS
- **Description**: Allowed origins for authentication
- **Format**: Comma-separated URLs
- **Example**:
  ```
  AUTH_CORS=http://localhost:5173,http://localhost:9000,https://medusa-admin-4wd-tours-abc123.vercel.app
  ```
- **When to update**: Same time as ADMIN_CORS
- **Important**: Keep in sync with ADMIN_CORS

#### STORE_CORS
- **Description**: Allowed origins for Store API (storefront)
- **Format**: Comma-separated URLs
- **Example**:
  ```
  STORE_CORS=http://localhost:8000,https://4wd-tours-913f.vercel.app
  ```
- **When to update**: When storefront URL changes
- **Note**: Not directly related to admin, but good to know

### Required Backend Variables

#### DATABASE_URL
- **Description**: PostgreSQL connection string
- **Example**: `postgresql://user:password@host:port/database`
- **Provided by**: Railway Postgres plugin
- **Auto-configured**: Yes

#### REDIS_URL (Optional but Recommended)
- **Description**: Redis connection string for caching
- **Example**: `redis://host:port`
- **Provided by**: Railway Redis plugin
- **Auto-configured**: Yes

#### JWT_SECRET
- **Description**: Secret for signing authentication tokens
- **Format**: 64+ character random string
- **Generate**:
  ```bash
  node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
  ```
- **Security**: NEVER commit to git, rotate every 90 days

#### COOKIE_SECRET
- **Description**: Secret for signing session cookies
- **Format**: 64+ character random string
- **Generate**: Same as JWT_SECRET
- **Security**: NEVER commit to git, rotate every 90 days

#### STRIPE_API_KEY (If using Stripe)
- **Description**: Stripe secret key for payments
- **Example**: `sk_live_xxx` or `sk_test_xxx`
- **Get from**: Stripe dashboard
- **Security**: NEVER commit to git

#### STRIPE_WEBHOOK_SECRET (If using Stripe)
- **Description**: Stripe webhook signing secret
- **Example**: `whsec_xxx`
- **Get from**: Stripe dashboard → Webhooks
- **Security**: NEVER commit to git

---

## Setting Variables

### Vercel CLI

```bash
# Add new variable
npx vercel env add VARIABLE_NAME
# Enter value when prompted
# Select scope: Production, Preview, Development

# List all variables
npx vercel env ls

# Pull variables to local .env
npx vercel env pull .env.local

# Remove variable
npx vercel env rm VARIABLE_NAME
```

### Vercel Dashboard

1. Go to https://vercel.com/dashboard
2. Select your admin project
3. Click "Settings" → "Environment Variables"
4. Add variable:
   - **Key**: Variable name
   - **Value**: Variable value
   - **Scope**: Production, Preview, Development
5. Redeploy for changes to take effect

### Railway CLI

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Link to project
railway link

# Add/update variable
railway variables set VARIABLE_NAME="value"

# Get variable
railway variables get VARIABLE_NAME

# List all variables
railway variables

# Delete variable
railway variables delete VARIABLE_NAME
```

### Railway Dashboard

1. Go to https://railway.app
2. Select your project
3. Select backend service
4. Click "Variables" tab
5. Add or edit variables
6. Changes trigger automatic redeploy

---

## Environment Variable Checklist

### Before Deployment

Vercel:
- [ ] Have Vercel account ready
- [ ] Know Railway backend URL

Railway:
- [ ] DATABASE_URL configured
- [ ] JWT_SECRET set (64+ chars)
- [ ] COOKIE_SECRET set (64+ chars)
- [ ] ADMIN_CORS has localhost URLs
- [ ] AUTH_CORS has localhost URLs
- [ ] STORE_CORS configured for storefront

### After Deployment

Vercel:
- [ ] MEDUSA_ADMIN_BACKEND_URL set to Railway URL

Railway:
- [ ] ADMIN_CORS includes Vercel URL
- [ ] AUTH_CORS includes Vercel URL
- [ ] Backend redeployed with new CORS

---

## Variable Templates

### Copy-Paste Templates

#### Vercel (.env.local for local testing)
```bash
MEDUSA_ADMIN_BACKEND_URL=https://4wd-tours-production.up.railway.app
NODE_ENV=production
```

#### Railway (Complete set)
```bash
# Database & Cache
DATABASE_URL=postgresql://user:password@host:port/database
REDIS_URL=redis://host:port

# Security Secrets (Generate unique values!)
JWT_SECRET=your-64-character-random-string-here
COOKIE_SECRET=your-64-character-random-string-here

# CORS Configuration (Update with your URLs)
ADMIN_CORS=http://localhost:5173,http://localhost:9000,https://your-admin.vercel.app
AUTH_CORS=http://localhost:5173,http://localhost:9000,https://your-admin.vercel.app
STORE_CORS=http://localhost:8000,https://your-storefront.vercel.app

# Payment Processing (If using Stripe)
STRIPE_API_KEY=sk_live_or_test_your_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here

# Environment
NODE_ENV=production
```

---

## Security Best Practices

### Secrets Management

1. **Never commit secrets to git**
   - Use `.env.example` for templates
   - Add `.env` to `.gitignore`
   - Store production secrets in Railway/Vercel dashboards

2. **Use strong secrets**
   - Minimum 64 characters for JWT_SECRET and COOKIE_SECRET
   - Use cryptographically random values
   - Don't use dictionary words or patterns

3. **Rotate secrets regularly**
   - Every 90 days recommended
   - After any suspected compromise
   - Keep old secrets for 24h during rotation

4. **Use different secrets per environment**
   - Development secrets ≠ Production secrets
   - Test environment should have separate secrets
   - Never reuse secrets across projects

### CORS Security

1. **Be specific with domains**
   - List exact domains, avoid wildcards in production
   - Remove unused domains regularly
   - Use HTTPS for production URLs

2. **Review quarterly**
   - Check all CORS variables
   - Remove old/unused domains
   - Verify no wildcards in production

3. **Separate environments**
   - Development Railway → Development Vercel
   - Production Railway → Production Vercel
   - Don't mix environment URLs

---

## Troubleshooting

### Variable Not Taking Effect

```bash
# Vercel: Trigger redeploy
npx vercel --prod

# Railway: Check if redeploy triggered
railway logs --follow
```

### Can't See Variable Value

```bash
# Vercel: Pull to local
npx vercel env pull .env.local
cat .env.local

# Railway: Get specific variable
railway variables get VARIABLE_NAME
```

### Wrong Variable Value

```bash
# Vercel: Update and redeploy
npx vercel env add VARIABLE_NAME
npx vercel --prod

# Railway: Update and wait for redeploy
railway variables set VARIABLE_NAME="new-value"
```

---

## Quick Reference

### Generate Secrets

```bash
# JWT_SECRET and COOKIE_SECRET
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Or multiple at once
for i in {1..2}; do node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"; done
```

### Check Current Values

```bash
# Vercel
npx vercel env ls

# Railway
railway variables | grep -E "CORS|SECRET|DATABASE"
```

### Update CORS (Most Common)

```bash
# Railway - Add new admin URL to existing CORS
railway variables set ADMIN_CORS="$(railway variables get ADMIN_CORS),https://new-admin.vercel.app"
railway variables set AUTH_CORS="$(railway variables get AUTH_CORS),https://new-admin.vercel.app"
```

---

**Document Version**: 1.0.0
**Last Updated**: 2025-11-11
**Related Docs**: README.md, RAILWAY-CORS-SETUP.md
