# Medusa Admin Deployment - Action Plan

**Date**: November 11, 2025
**Project**: Sunshine Coast 4WD Tours
**Decision**: Deploy Server + Admin Together on Railway
**Timeline**: 2-4 hours implementation

---

## Executive Summary

Based on comprehensive analysis of official Medusa v2 documentation, we will deploy the Medusa server and admin together on Railway. This is the **official recommended approach** for Medusa v2.11.3.

**Key Benefits:**
- ✅ Lower cost: $25/month vs $45/month
- ✅ Simpler architecture: Single deployment
- ✅ Official Medusa v2 pattern
- ✅ No CORS complexity
- ✅ Faster implementation: 2-4 hours vs 8-12 hours

---

## Quick Reference

### Admin Access After Deployment
```
URL: https://api.sunshinecoast4wd.com.au/app
Login: Use Medusa admin credentials
```

### Architecture Overview
```
Railway Project: sunshine-coast-4wd
├── medusa-server (server mode + admin at /app)
├── medusa-worker (worker mode for background tasks)
├── postgresql (database)
└── redis (caching and pub/sub)
```

### Cost Breakdown
```
PostgreSQL: $5/month
Redis:      $5/month
Server:    $10/month (with admin)
Worker:     $5/month
────────────────────
Total:     $25/month
```

---

## Phase 1: Code Configuration (15 minutes)

### Task 1.1: Update `medusa-config.ts`

**File:** `/Users/Karim/med-usa-4wd/medusa-config.ts`

**Current Configuration:**
```typescript
admin: {
  disable: process.env.DISABLE_ADMIN === "true",
}
```

**Updated Configuration:**
```typescript
import { loadEnv, defineConfig } from '@medusajs/framework/utils'

loadEnv(process.env.NODE_ENV || 'development', process.cwd())

// SECURITY: Validate required secrets on startup
if (!process.env.JWT_SECRET || !process.env.COOKIE_SECRET) {
  throw new Error(
    'SECURITY ERROR: JWT_SECRET and COOKIE_SECRET environment variables are required.'
  )
}

// SECURITY: Reject weak secrets
const minSecretLength = 32
if (process.env.JWT_SECRET.length < minSecretLength || process.env.COOKIE_SECRET.length < minSecretLength) {
  throw new Error(
    `SECURITY ERROR: JWT_SECRET and COOKIE_SECRET must be at least ${minSecretLength} characters long.`
  )
}

module.exports = defineConfig({
  admin: {
    // Enable/disable admin based on worker mode
    disable: process.env.DISABLE_MEDUSA_ADMIN === "true",
    // Set backend URL for production
    backendUrl: process.env.MEDUSA_BACKEND_URL,
  },
  projectConfig: {
    databaseUrl: process.env.DATABASE_URL,
    redisUrl: process.env.REDIS_URL,
    // Configure worker mode (shared, server, or worker)
    workerMode: process.env.MEDUSA_WORKER_MODE as "shared" | "worker" | "server" || "shared",
    http: {
      storeCors: process.env.STORE_CORS!,
      adminCors: process.env.ADMIN_CORS!,
      authCors: process.env.AUTH_CORS!,
      jwtSecret: process.env.JWT_SECRET,
      cookieSecret: process.env.COOKIE_SECRET,
    }
  },
  modules: [
    {
      resolve: "@medusajs/medusa/payment",
      options: {
        providers: [
          {
            resolve: "@medusajs/medusa/payment-stripe",
            id: "stripe",
            options: {
              apiKey: process.env.STRIPE_API_KEY,
              webhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
              capture: false,
              automatic_payment_methods: true,
            },
          },
        ],
      },
    },
  ],
})
```

**Changes Made:**
1. ✅ Added `backendUrl` for admin configuration
2. ✅ Added `workerMode` for server/worker separation
3. ✅ Changed `DISABLE_ADMIN` to `DISABLE_MEDUSA_ADMIN` (clearer naming)
4. ✅ Kept existing security validations

**Status:** ⏸️ Pending Implementation

---

### Task 1.2: Verify `package.json` Scripts

**File:** `/Users/Karim/med-usa-4wd/package.json`

**Current Scripts:**
```json
{
  "scripts": {
    "build": "medusa build",
    "start": "medusa start",
    "dev": "medusa develop"
  }
}
```

**Verification:**
```bash
# Check if scripts are correct
cat package.json | grep -A 3 '"scripts"'
```

**Expected Output:**
- `build`: Should run `medusa build` (builds server + admin together)
- `start`: Should run `medusa start` (starts built application)

**Status:** ✅ Already Correct (No changes needed)

---

### Task 1.3: Create `.env.example` Update

**File:** `/Users/Karim/med-usa-4wd/.env.example`

**Add these new variables:**
```bash
# Worker Mode Configuration
MEDUSA_WORKER_MODE=shared  # Options: shared (dev), server (production), worker (production)
DISABLE_MEDUSA_ADMIN=false # Set to true for worker instance

# Backend URL (for admin in production)
MEDUSA_BACKEND_URL=https://api.sunshinecoast4wd.com.au

# Database and Redis (already exists)
DATABASE_URL=postgresql://...
REDIS_URL=redis://...

# CORS Configuration (already exists)
ADMIN_CORS=https://api.sunshinecoast4wd.com.au
STORE_CORS=https://sunshinecoast4wd.com.au
AUTH_CORS=https://api.sunshinecoast4wd.com.au,https://sunshinecoast4wd.com.au

# Security (already exists)
JWT_SECRET=your-64-character-random-string
COOKIE_SECRET=your-64-character-random-string

# Stripe (already exists)
STRIPE_API_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

**Status:** ⏸️ Pending Implementation

---

### Task 1.4: Commit Configuration Changes

```bash
cd /Users/Karim/med-usa-4wd

# Add changes
git add medusa-config.ts
git add .env.example
git add docs/medusa-admin-deployment-official.md
git add docs/admin-deployment-comparison.md
git add docs/admin-deployment-action-plan.md

# Commit
git commit -m "Configure Medusa admin deployment for Railway

- Update medusa-config.ts with worker mode support
- Add admin.backendUrl configuration
- Update environment variable naming (DISABLE_ADMIN → DISABLE_MEDUSA_ADMIN)
- Add comprehensive deployment documentation
- Based on official Medusa v2.11.3 documentation"

# Push (don't deploy yet - Railway not configured)
git push origin main
```

**Status:** ⏸️ Pending Implementation

---

## Phase 2: Railway Infrastructure Setup (30 minutes)

### Task 2.1: Create Railway Project

**Steps:**
1. Go to: https://railway.app
2. Click "New Project"
3. Name: "sunshine-coast-4wd"
4. Region: Select closest to Australia (Sydney if available)

**Status:** ⏸️ Pending Implementation

---

### Task 2.2: Add PostgreSQL Database

**Steps:**
1. In project, click "New Service"
2. Select "Database" → "PostgreSQL"
3. Wait for provisioning (2-3 minutes)
4. Copy connection string from "Connect" tab
5. Note: Railway provides `DATABASE_URL` variable

**Expected Output:**
```
postgresql://postgres:password@region.railway.app:5432/railway
```

**Status:** ⏸️ Pending Implementation

---

### Task 2.3: Add Redis Instance

**Steps:**
1. In project, click "New Service"
2. Select "Database" → "Redis"
3. Wait for provisioning (1-2 minutes)
4. Copy connection string from "Connect" tab
5. Note: Railway provides `REDIS_URL` variable

**Expected Output:**
```
redis://default:password@region.railway.app:6379
```

**Status:** ⏸️ Pending Implementation

---

### Task 2.4: Generate Security Secrets

**Run locally:**
```bash
# Generate JWT_SECRET
echo "JWT_SECRET=$(node -e "console.log(require('crypto').randomBytes(64).toString('hex'))")"

# Generate COOKIE_SECRET
echo "COOKIE_SECRET=$(node -e "console.log(require('crypto').randomBytes(64).toString('hex'))")"
```

**Save these values** - you'll need them for both server and worker instances.

**Status:** ⏸️ Pending Implementation

---

## Phase 3: Deploy Medusa Server (with Admin) (45 minutes)

### Task 3.1: Create Server Service

**Steps:**
1. In Railway project, click "New Service"
2. Select "GitHub Repo"
3. Authorize Railway to access GitHub
4. Select repository: `sunshine-coast-4wd-tours`
5. Branch: `main`
6. Root directory: `/` (project root)
7. Service name: "medusa-server"

**Status:** ⏸️ Pending Implementation

---

### Task 3.2: Configure Server Environment Variables

**In Railway service settings → Variables tab:**

```bash
# Worker Mode
MEDUSA_WORKER_MODE=server
DISABLE_MEDUSA_ADMIN=false

# Backend URL
MEDUSA_BACKEND_URL=https://${RAILWAY_PUBLIC_DOMAIN}
# Note: Railway will replace ${RAILWAY_PUBLIC_DOMAIN} with actual domain

# Database and Redis (reference other services)
DATABASE_URL=${{PostgreSQL.DATABASE_URL}}
REDIS_URL=${{Redis.REDIS_URL}}

# CORS Configuration
ADMIN_CORS=${RAILWAY_PUBLIC_DOMAIN}
STORE_CORS=https://sunshinecoast4wd.com.au
AUTH_CORS=${RAILWAY_PUBLIC_DOMAIN},https://sunshinecoast4wd.com.au

# Security (paste generated secrets from Task 2.4)
JWT_SECRET=<paste-your-generated-jwt-secret>
COOKIE_SECRET=<paste-your-generated-cookie-secret>

# Stripe (from your existing .env)
STRIPE_API_KEY=<your-stripe-key>
STRIPE_WEBHOOK_SECRET=<your-stripe-webhook-secret>

# Node Environment
NODE_ENV=production
```

**Status:** ⏸️ Pending Implementation

---

### Task 3.3: Configure Server Build Settings

**In Railway service settings → Settings tab:**

**Build Command:**
```bash
npm install && npm run build && cd .medusa/server && npm install
```

**Start Command:**
```bash
cd .medusa/server && npm start
```

**Watch Paths:**
```
.medusa/server/**
```

**Root Directory:**
```
/
```

**Status:** ⏸️ Pending Implementation

---

### Task 3.4: Deploy Server

**Steps:**
1. Click "Deploy" in Railway
2. Monitor build logs
3. Wait for build to complete (5-10 minutes first time)
4. Check deployment status

**Expected Build Output:**
```
✓ Building Medusa application...
✓ Admin built to .medusa/server/public/admin
✓ Server built to .medusa/server
✓ Installing production dependencies...
✓ Deployment successful
```

**Status:** ⏸️ Pending Implementation

---

### Task 3.5: Run Database Migrations

**After first deployment:**

1. Go to Railway service → "Settings" tab
2. Click "Console" or use Railway CLI
3. Run migrations:

```bash
cd .medusa/server && npx medusa db:migrate
```

**Expected Output:**
```
✓ Migrations executed successfully
✓ Database schema up to date
```

**Optional - Seed Initial Data:**
```bash
cd .medusa/server && npx medusa exec ./src/scripts/seed.ts
```

**Status:** ⏸️ Pending Implementation

---

### Task 3.6: Configure Custom Domain

**In Railway service → Settings → Networking:**

1. Click "Generate Domain" (temporary)
   - Note the URL: `something.up.railway.app`

2. Click "Add Custom Domain"
   - Domain: `api.sunshinecoast4wd.com.au`

3. Add DNS records (in your domain provider):
   ```
   Type: CNAME
   Name: api
   Value: something.up.railway.app
   TTL: 3600
   ```

4. Wait for DNS propagation (5-30 minutes)

5. Railway will automatically provision SSL certificate

**Status:** ⏸️ Pending Implementation

---

### Task 3.7: Update CORS After Domain Configuration

**Once custom domain is active, update environment variables:**

```bash
# Update these in Railway
ADMIN_CORS=https://api.sunshinecoast4wd.com.au
AUTH_CORS=https://api.sunshinecoast4wd.com.au,https://sunshinecoast4wd.com.au
MEDUSA_BACKEND_URL=https://api.sunshinecoast4wd.com.au
```

**Redeploy** after updating.

**Status:** ⏸️ Pending Implementation

---

## Phase 4: Deploy Medusa Worker (30 minutes)

### Task 4.1: Create Worker Service

**Steps:**
1. In Railway project, click "New Service"
2. Select "GitHub Repo"
3. Select same repository
4. Branch: `main`
5. Root directory: `/` (project root)
6. Service name: "medusa-worker"

**Status:** ⏸️ Pending Implementation

---

### Task 4.2: Configure Worker Environment Variables

**In Railway service settings → Variables tab:**

```bash
# Worker Mode
MEDUSA_WORKER_MODE=worker
DISABLE_MEDUSA_ADMIN=true

# Database and Redis (same as server)
DATABASE_URL=${{PostgreSQL.DATABASE_URL}}
REDIS_URL=${{Redis.REDIS_URL}}

# Security (SAME SECRETS as server)
JWT_SECRET=<same-jwt-secret-as-server>
COOKIE_SECRET=<same-cookie-secret-as-server>

# Stripe (same as server)
STRIPE_API_KEY=<your-stripe-key>
STRIPE_WEBHOOK_SECRET=<your-stripe-webhook-secret>

# Node Environment
NODE_ENV=production
```

**CRITICAL:** Use the SAME `JWT_SECRET` and `COOKIE_SECRET` as the server instance.

**Status:** ⏸️ Pending Implementation

---

### Task 4.3: Configure Worker Build Settings

**In Railway service settings → Settings tab:**

**Build Command:**
```bash
npm install && npm run build && cd .medusa/server && npm install
```

**Start Command:**
```bash
cd .medusa/server && npm start
```

**Watch Paths:**
```
.medusa/server/**
```

**Root Directory:**
```
/
```

**Note:** Same build as server, but runs in worker mode due to `MEDUSA_WORKER_MODE=worker`.

**Status:** ⏸️ Pending Implementation

---

### Task 4.4: Deploy Worker

**Steps:**
1. Click "Deploy" in Railway
2. Monitor build logs
3. Wait for build to complete (5-10 minutes)
4. Verify worker is running

**Expected Logs:**
```
✓ Worker mode started
✓ Connected to database
✓ Connected to Redis
✓ Subscribers registered
✓ Worker ready
```

**Status:** ⏸️ Pending Implementation

---

## Phase 5: Testing and Verification (30 minutes)

### Task 5.1: Health Check

**Test server health:**
```bash
curl https://api.sunshinecoast4wd.com.au/health
```

**Expected Response:**
```
OK
```

**Status:** ⏸️ Pending Implementation

---

### Task 5.2: Access Admin Dashboard

**Open in browser:**
```
https://api.sunshinecoast4wd.com.au/app
```

**Expected:**
- ✅ Admin login page loads
- ✅ No CORS errors in console
- ✅ No 404 errors

**If admin doesn't load:**
1. Check `DISABLE_MEDUSA_ADMIN=false` in server
2. Check admin was built: Look for `.medusa/server/public/admin` in build logs
3. Check `MEDUSA_WORKER_MODE=server` in server

**Status:** ⏸️ Pending Implementation

---

### Task 5.3: Test Admin Login

**Credentials:**
- Check if admin user exists from previous seeding
- Or create new admin user via API

**Create Admin User (if needed):**
```bash
# Use Railway console or API
curl -X POST https://api.sunshinecoast4wd.com.au/admin/users \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@sunshinecoast4wd.com.au",
    "password": "supersecurepassword123",
    "first_name": "Admin",
    "last_name": "User"
  }'
```

**Test Login:**
1. Enter credentials at `/app`
2. Click login
3. Verify successful authentication
4. Check dashboard loads

**Status:** ⏸️ Pending Implementation

---

### Task 5.4: Test Store API

**Test products endpoint:**
```bash
curl https://api.sunshinecoast4wd.com.au/store/products
```

**Expected Response:**
```json
{
  "products": [...],
  "count": 10,
  "offset": 0,
  "limit": 50
}
```

**Status:** ⏸️ Pending Implementation

---

### Task 5.5: Test Admin API from Admin UI

**In Admin Dashboard:**
1. Navigate to Products
2. Create a test product
3. Edit the product
4. Delete the product

**Verify:**
- ✅ No CORS errors
- ✅ All operations succeed
- ✅ Fast response times (< 1 second)

**Status:** ⏸️ Pending Implementation

---

### Task 5.6: Test Worker Functionality

**Test background job:**
```bash
# In Railway server console
cd .medusa/server && npx medusa exec ./src/scripts/test-worker.ts
```

**Or test subscriber:**
1. Create order in admin
2. Check worker logs for subscriber events

**Expected Worker Logs:**
```
[Worker] Processing job: order.placed
[Worker] Sending confirmation email
[Worker] Job completed successfully
```

**Status:** ⏸️ Pending Implementation

---

### Task 5.7: Monitor Resource Usage

**Check Railway Metrics:**

**Server Instance:**
- CPU: < 50% under normal load
- Memory: < 300MB under normal load
- Expected: 10-20 requests/minute

**Worker Instance:**
- CPU: < 20% under normal load
- Memory: < 200MB under normal load
- Expected: Spiky usage when jobs run

**Database:**
- Connections: < 5 active
- Storage: < 100MB initially

**Redis:**
- Memory: < 50MB
- Connections: 2 (server + worker)

**Status:** ⏸️ Pending Implementation

---

## Phase 6: Update Storefront Configuration (15 minutes)

### Task 6.1: Update Storefront Environment Variables

**File:** `/Users/Karim/med-usa-4wd/storefront/.env`

```bash
# Update NEXT_PUBLIC_MEDUSA_BACKEND_URL
NEXT_PUBLIC_MEDUSA_BACKEND_URL=https://api.sunshinecoast4wd.com.au
```

**Status:** ⏸️ Pending Implementation

---

### Task 6.2: Test Storefront Connection

**Run storefront locally:**
```bash
cd /Users/Karim/med-usa-4wd/storefront
npm run dev
```

**Open:** http://localhost:8000

**Verify:**
- ✅ Products load
- ✅ Cart works
- ✅ No API errors

**Status:** ⏸️ Pending Implementation

---

## Phase 7: Documentation and Handoff (15 minutes)

### Task 7.1: Create Admin Access Documentation

**Create file:** `/Users/Karim/med-usa-4wd/docs/admin-access.md`

```markdown
# Admin Dashboard Access

## Production Admin
- URL: https://api.sunshinecoast4wd.com.au/app
- Credentials: [Stored in password manager]

## Features
- Product management
- Order management
- Customer management
- Inventory management

## Support
- Documentation: /docs/medusa-admin-deployment-official.md
- Troubleshooting: Contact development team
```

**Status:** ⏸️ Pending Implementation

---

### Task 7.2: Update Railway Monitoring

**Set up alerts in Railway:**

1. Go to Project Settings → Notifications
2. Enable alerts for:
   - Service crashes
   - High CPU usage (> 80%)
   - High memory usage (> 90%)
   - Deployment failures

**Status:** ⏸️ Pending Implementation

---

### Task 7.3: Create Backup Strategy

**Railway automatically backs up PostgreSQL**

**Verify:**
1. Go to PostgreSQL service → Backups
2. Check backup schedule (usually daily)
3. Test restore process (optional)

**Manual backup command (optional):**
```bash
# Create backup
pg_dump $DATABASE_URL > backup-$(date +%Y%m%d).sql

# Store in secure location
```

**Status:** ⏸️ Pending Implementation

---

## Rollback Plan

### If Deployment Fails

**Scenario 1: Build Fails**
```bash
# Check build logs in Railway
# Common issues:
- Missing environment variables
- TypeScript errors
- Dependency issues

# Solution:
- Fix issues locally
- Test build: npm run build
- Commit and push fixes
```

**Scenario 2: Admin Not Loading**
```bash
# Check environment variables
DISABLE_MEDUSA_ADMIN=false  # Must be false
MEDUSA_WORKER_MODE=server   # Must be server

# Check build output
# Should see: .medusa/server/public/admin

# Solution:
- Verify environment variables
- Redeploy
- Check build logs for admin build
```

**Scenario 3: Database Connection Issues**
```bash
# Check DATABASE_URL format
postgresql://user:pass@host:port/database

# Test connection
psql $DATABASE_URL -c "SELECT version();"

# Solution:
- Verify DATABASE_URL is correct
- Check PostgreSQL service is running
- Check network connectivity
```

**Scenario 4: Worker Not Processing Jobs**
```bash
# Check worker environment variables
MEDUSA_WORKER_MODE=worker   # Must be worker
DISABLE_MEDUSA_ADMIN=true   # Must be true

# Check Redis connection
redis-cli -u $REDIS_URL ping  # Should return "PONG"

# Solution:
- Verify environment variables
- Check Redis service is running
- Check worker logs for errors
```

---

## Success Criteria

### Deployment is Successful When:

- [ ] Health endpoint returns "OK": https://api.sunshinecoast4wd.com.au/health
- [ ] Admin loads without errors: https://api.sunshinecoast4wd.com.au/app
- [ ] Admin login works successfully
- [ ] Products API returns data: https://api.sunshinecoast4wd.com.au/store/products
- [ ] Admin can create/edit/delete products
- [ ] Worker processes background jobs
- [ ] No CORS errors in browser console
- [ ] Server metrics look healthy (< 50% CPU, < 300MB RAM)
- [ ] Worker metrics look healthy (< 20% CPU, < 200MB RAM)
- [ ] Storefront connects successfully to backend
- [ ] Railway monitoring alerts are configured

### Performance Benchmarks:

- [ ] Admin page load: < 1 second
- [ ] API response time: < 200ms
- [ ] Health check: < 100ms
- [ ] Admin operations: < 500ms

---

## Post-Deployment Checklist

### Immediate (Day 1):
- [ ] Monitor Railway logs for errors
- [ ] Test all admin features
- [ ] Verify worker is processing jobs
- [ ] Check database connections
- [ ] Test storefront integration

### Week 1:
- [ ] Monitor resource usage
- [ ] Check for any errors or warnings
- [ ] Verify backup schedule
- [ ] Document any issues or optimizations needed

### Month 1:
- [ ] Review costs and usage
- [ ] Optimize if needed (scale up/down)
- [ ] Review performance metrics
- [ ] Plan for scaling if traffic increases

---

## Cost Monitoring

### Current Monthly Cost: $25

| Service | Cost |
|---------|------|
| PostgreSQL | $5 |
| Redis | $5 |
| Medusa Server | $10 |
| Medusa Worker | $5 |

### When to Scale:

**Scale Server if:**
- CPU usage consistently > 70%
- Memory usage consistently > 80%
- Response times > 1 second
- More than 100 requests/minute

**Scale Worker if:**
- Background jobs are delayed
- Worker CPU consistently > 70%
- Jobs timing out

**Scale Database if:**
- Slow query performance
- Connection pool exhausted
- Storage > 80% full

---

## Contact and Support

### Railway Support:
- Dashboard: https://railway.app
- Documentation: https://docs.railway.app
- Support: support@railway.app

### Medusa Support:
- Documentation: https://docs.medusajs.com
- Discord: https://discord.gg/medusajs
- GitHub: https://github.com/medusajs/medusa

### Project Documentation:
- Full Deployment Guide: `/docs/medusa-admin-deployment-official.md`
- Architecture Comparison: `/docs/admin-deployment-comparison.md`
- Local Medusa Docs: `/docs/medusa-llm/medusa-llms-full.txt`

---

## Timeline Summary

| Phase | Duration | Status |
|-------|----------|--------|
| 1. Code Configuration | 15 min | ⏸️ Pending |
| 2. Railway Infrastructure | 30 min | ⏸️ Pending |
| 3. Deploy Server + Admin | 45 min | ⏸️ Pending |
| 4. Deploy Worker | 30 min | ⏸️ Pending |
| 5. Testing | 30 min | ⏸️ Pending |
| 6. Storefront Update | 15 min | ⏸️ Pending |
| 7. Documentation | 15 min | ⏸️ Pending |
| **Total** | **3 hours** | ⏸️ |

**Note:** First-time deployment may take longer due to build times and DNS propagation.

---

## Next Steps

1. **Review this action plan** and the comprehensive documentation:
   - `/docs/medusa-admin-deployment-official.md` (Technical details)
   - `/docs/admin-deployment-comparison.md` (Decision rationale)

2. **Schedule deployment** when you have 3-4 hours available

3. **Prepare credentials:**
   - Railway account
   - GitHub repository access
   - Domain DNS access
   - Stripe keys

4. **Start with Phase 1** (Code Configuration)

5. **Follow phases sequentially** - Don't skip ahead

6. **Test thoroughly** at each phase

7. **Monitor after deployment**

---

**Document Prepared By**: Claude Code Agent
**Based On**: Official Medusa v2.11.3 Documentation
**Implementation Time**: 2-4 hours
**Confidence Level**: Very High
**Ready to Deploy**: Yes ✅
**Last Updated**: November 11, 2025
