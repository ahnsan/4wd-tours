# Official Medusa Admin Deployment Documentation Analysis

**Date**: November 11, 2025
**Project**: Sunshine Coast 4WD Tours
**Medusa Version**: v2.11.3 (Medusa Framework)
**Documentation Sources**: Local Medusa LLM docs (`/docs/medusa-llm/medusa-llms-full.txt`)

---

## Executive Summary

Based on official Medusa v2 documentation, **the recommended deployment architecture is to deploy the Medusa server and admin TOGETHER**, not separately. The admin dashboard is served directly by the Medusa server at `/app` path.

### Key Finding
**Medusa v2 has fundamentally changed admin deployment compared to v1:**
- **v1**: Admin could be deployed separately on platforms like Vercel
- **v2**: Admin is now integrated into the server and served together by default
- **Separate deployment is ONLY for edge cases**, not the recommended approach

---

## Project Current Status

### Medusa Version Detection
```json
// /Users/Karim/med-usa-4wd/package.json
{
  "dependencies": {
    "@medusajs/admin-sdk": "2.11.3",
    "@medusajs/cli": "2.11.3",
    "@medusajs/framework": "2.11.3",
    "@medusajs/medusa": "2.11.3"
  }
}
```

**Project is using Medusa v2.11.3** - Latest stable version of Medusa Framework v2.

### Current Configuration
```typescript
// /Users/Karim/med-usa-4wd/medusa-config.ts
module.exports = defineConfig({
  admin: {
    // Currently disabled in production
    disable: process.env.DISABLE_ADMIN === "true",
  },
  projectConfig: {
    databaseUrl: process.env.DATABASE_URL,
    redisUrl: process.env.REDIS_URL,
    http: {
      adminCors: process.env.ADMIN_CORS!,
      // ... other CORS settings
    }
  }
})
```

---

## Official Medusa v2 Deployment Architecture

### Standard Deployment Components

According to official documentation, a Medusa v2 deployment consists of:

1. **PostgreSQL Database** (required)
2. **Redis Instance** (required for distributed caching and pub/sub)
3. **Medusa Application in Server Mode** (handles HTTP requests + serves admin at `/app`)
4. **Medusa Application in Worker Mode** (handles background tasks)
5. **Storefront** (separate deployment - Next.js or custom)

```
┌─────────────────────────────────────────────────────────┐
│                    DEPLOYMENT DIAGRAM                    │
└─────────────────────────────────────────────────────────┘

┌───────────────┐
│  PostgreSQL   │
│   Database    │
└───────┬───────┘
        │
        │ Connection
        ├──────────────────┬──────────────────┐
        │                  │                  │
┌───────▼──────────┐  ┌───▼──────────┐  ┌───▼──────────┐
│  Medusa Server   │  │ Medusa Worker│  │    Redis     │
│   (Mode: server) │◄─┤ (Mode: worker)├─►│   Instance   │
│                  │  │              │  │              │
│ - API Endpoints  │  │ - Background │  │ - Cache      │
│ - Admin at /app  │  │   Jobs       │  │ - Pub/Sub    │
│ - Port 9000      │  │ - Subscribers│  │              │
└────────┬─────────┘  └──────────────┘  └──────────────┘
         │
         │ CORS
         │
┌────────▼─────────┐
│   Storefront     │
│   (Next.js)      │
│   Port 8000      │
└──────────────────┘
```

### Key Architectural Principles (Official)

1. **Server + Admin Together**: The admin is built into `.medusa/server/public/admin` and served by the server instance
2. **Worker Mode Separation**: Background tasks run in a separate worker instance
3. **Single Database**: Both server and worker connect to the same PostgreSQL database
4. **Shared Redis**: Both instances use the same Redis for coordination
5. **Admin Access**: Admin is available at `https://<server-url>/app`

---

## Medusa v2 Admin Build Process

### Default Build (Recommended)

```bash
npx medusa build
```

**Output Structure:**
```
.medusa/
  server/
    public/
      admin/           # Admin dashboard built here
        index.html
        assets/
        ...
    index.js           # Server entry point
    package.json
```

**What happens:**
- Admin is built with Vite (modern bundler)
- Admin assets are placed in `.medusa/server/public/admin`
- Server automatically serves admin from `/app` endpoint
- Single deployment contains both server and admin

### Separate Admin Build (Edge Case Only)

```bash
npx medusa build --admin-only
```

**Output Structure:**
```
.medusa/
  admin/               # Standalone admin build
    index.html
    assets/
    ...
```

**Official Documentation Quote:**
> "The `build` command accepts a `--admin-only` option that outputs the admin to the `.medusa/admin` directory. This is useful when deploying the admin dashboard separately, such as on Vercel"

**IMPORTANT NOTE**: This is mentioned as an OPTION, not the RECOMMENDED approach. The documentation emphasizes this is for "edge cases" where you need to host admin separately.

---

## Worker Mode Configuration

### Required Configuration

```typescript
// medusa-config.ts
module.exports = defineConfig({
  projectConfig: {
    workerMode: process.env.MEDUSA_WORKER_MODE as "shared" | "worker" | "server",
  },
  admin: {
    disable: process.env.DISABLE_MEDUSA_ADMIN === "true",
  }
})
```

### Worker Mode Values

| Mode | Description | Use Case | Admin Enabled |
|------|-------------|----------|---------------|
| `shared` | Single process (dev) | Local development only | Yes |
| `server` | HTTP server only | Production server instance | Yes |
| `worker` | Background tasks only | Production worker instance | No (must disable) |

### Environment Variables for Deployment

**Server Instance:**
```bash
MEDUSA_WORKER_MODE=server
DISABLE_MEDUSA_ADMIN=false  # Admin enabled
DATABASE_URL=postgresql://...
REDIS_URL=redis://...
ADMIN_CORS=https://admin.yourdomain.com
STORE_CORS=https://storefront.yourdomain.com
AUTH_CORS=https://storefront.yourdomain.com,https://admin.yourdomain.com
```

**Worker Instance:**
```bash
MEDUSA_WORKER_MODE=worker
DISABLE_MEDUSA_ADMIN=true   # Admin disabled
DATABASE_URL=postgresql://...  # Same database
REDIS_URL=redis://...          # Same Redis
```

---

## CORS Configuration

### Official CORS Setup

```typescript
// medusa-config.ts
module.exports = defineConfig({
  projectConfig: {
    http: {
      // Admin CORS - Who can access /admin/* endpoints
      adminCors: process.env.ADMIN_CORS,

      // Store CORS - Who can access /store/* endpoints
      storeCors: process.env.STORE_CORS,

      // Auth CORS - Who can authenticate
      authCors: process.env.AUTH_CORS,
    }
  }
})
```

### Example CORS Patterns

**For Vercel Deployments (if admin was separate):**
```bash
# Allow any vercel.app subdomain
ADMIN_CORS=/vercel\.app$/

# Allow specific admin URL
ADMIN_CORS=https://admin.yourdomain.com

# Allow multiple origins (comma-separated)
ADMIN_CORS=https://admin.yourdomain.com,https://staging-admin.yourdomain.com
```

**Production Setup:**
```bash
ADMIN_CORS=https://api.sunshinecoast4wd.com.au
STORE_CORS=https://sunshinecoast4wd.com.au
AUTH_CORS=https://api.sunshinecoast4wd.com.au,https://sunshinecoast4wd.com.au
```

---

## Deployment Options Comparison

### Option 1: Server + Admin Together (RECOMMENDED)

**Architecture:**
```
Railway (Medusa Server + Admin) + Railway (Medusa Worker) + Railway (PostgreSQL + Redis)
```

**Pros:**
- ✅ Official Medusa v2 pattern
- ✅ Simpler deployment (one build)
- ✅ No CORS complexity between admin and server
- ✅ Faster admin performance (no network latency)
- ✅ Single domain for admin access
- ✅ Built-in authentication flow
- ✅ Easier to maintain and debug

**Cons:**
- ⚠️ Admin and server share same instance resources
- ⚠️ Must scale entire server to handle admin traffic

**Cost (Railway):**
- Server instance: $5-20/month (depending on traffic)
- Worker instance: $5-10/month
- PostgreSQL: $5-15/month
- Redis: $5-10/month
- **Total: $20-55/month**

**Admin Access:**
```
https://api.sunshinecoast4wd.com.au/app
```

---

### Option 2: Separate Admin on Vercel (NOT RECOMMENDED for v2)

**Architecture:**
```
Vercel (Admin) + Railway (Medusa Server) + Railway (Medusa Worker) + Railway (PostgreSQL + Redis)
```

**Pros:**
- ✅ Admin has independent scaling
- ✅ Admin benefits from Vercel's CDN
- ✅ Admin has separate resources

**Cons:**
- ❌ NOT the official Medusa v2 pattern
- ❌ Requires separate build process
- ❌ Complex CORS configuration
- ❌ Additional deployment complexity
- ❌ Network latency between admin and API
- ❌ Potential authentication issues
- ❌ More points of failure
- ❌ Harder to debug
- ❌ Medusa v2 admin may not be optimized for this

**Cost:**
- Vercel (Admin): $0-20/month
- Railway (Server): $5-20/month
- Railway (Worker): $5-10/month
- PostgreSQL: $5-15/month
- Redis: $5-10/month
- **Total: $20-75/month**

**Why Not Recommended:**
The official Medusa v2 documentation moved away from separate admin deployment. While `--admin-only` option exists, it's mentioned as an edge case, not the standard approach.

---

## Step-by-Step Deployment Guide (Recommended Approach)

### Prerequisites
- Railway account
- Domain name configured
- GitHub repository

### Step 1: Configure Application for Production

**1.1 Update `medusa-config.ts`:**
```typescript
import { loadEnv, defineConfig } from '@medusajs/framework/utils'

loadEnv(process.env.NODE_ENV || 'development', process.cwd())

module.exports = defineConfig({
  admin: {
    disable: process.env.DISABLE_MEDUSA_ADMIN === "true",
    backendUrl: process.env.MEDUSA_BACKEND_URL, // Set for production
  },
  projectConfig: {
    databaseUrl: process.env.DATABASE_URL,
    redisUrl: process.env.REDIS_URL,
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
            },
          },
        ],
      },
    },
  ],
})
```

**1.2 Update `package.json` scripts:**
```json
{
  "scripts": {
    "build": "medusa build",
    "start": "medusa start",
    "dev": "medusa develop"
  }
}
```

### Step 2: Set Up Railway Infrastructure

**2.1 Create PostgreSQL Database:**
```bash
# In Railway dashboard:
1. Click "New Project"
2. Click "Add Service" → "Database" → "PostgreSQL"
3. Note the connection string
```

**2.2 Create Redis Instance:**
```bash
# In Railway dashboard:
1. Click "Add Service" → "Database" → "Redis"
2. Note the connection string
```

### Step 3: Deploy Medusa Server (with Admin)

**3.1 Create Server Service:**
```bash
# In Railway dashboard:
1. Click "Add Service" → "GitHub Repo"
2. Select your repository
3. Set service name: "medusa-server"
```

**3.2 Configure Server Environment Variables:**
```bash
# Server Mode
MEDUSA_WORKER_MODE=server
DISABLE_MEDUSA_ADMIN=false

# Backend URL
MEDUSA_BACKEND_URL=https://api.sunshinecoast4wd.com.au

# Database & Redis
DATABASE_URL=${{PostgreSQL.DATABASE_URL}}
REDIS_URL=${{Redis.REDIS_URL}}

# CORS Configuration
ADMIN_CORS=https://api.sunshinecoast4wd.com.au
STORE_CORS=https://sunshinecoast4wd.com.au
AUTH_CORS=https://api.sunshinecoast4wd.com.au,https://sunshinecoast4wd.com.au

# Security
JWT_SECRET=<generate-64-char-random-string>
COOKIE_SECRET=<generate-64-char-random-string>

# Stripe
STRIPE_API_KEY=<your-stripe-key>
STRIPE_WEBHOOK_SECRET=<your-stripe-webhook-secret>

# Node Environment
NODE_ENV=production
```

**3.3 Configure Build Settings:**
```bash
# Build Command
npm install && npm run build && cd .medusa/server && npm install

# Start Command
cd .medusa/server && npm start

# Watch Paths
.medusa/server/**
```

### Step 4: Deploy Medusa Worker

**4.1 Create Worker Service:**
```bash
# In Railway dashboard:
1. Click "Add Service" → "GitHub Repo"
2. Select same repository
3. Set service name: "medusa-worker"
```

**4.2 Configure Worker Environment Variables:**
```bash
# Worker Mode
MEDUSA_WORKER_MODE=worker
DISABLE_MEDUSA_ADMIN=true

# Database & Redis (same as server)
DATABASE_URL=${{PostgreSQL.DATABASE_URL}}
REDIS_URL=${{Redis.REDIS_URL}}

# Security (same secrets as server)
JWT_SECRET=<same-as-server>
COOKIE_SECRET=<same-as-server>

# Node Environment
NODE_ENV=production
```

**4.3 Configure Build Settings:**
```bash
# Build Command
npm install && npm run build && cd .medusa/server && npm install

# Start Command
cd .medusa/server && npm start

# Watch Paths
.medusa/server/**
```

### Step 5: Configure Domains

**5.1 Server Domain:**
```bash
# In Railway server service settings:
Custom Domain: api.sunshinecoast4wd.com.au
```

**5.2 DNS Configuration:**
```
Type: CNAME
Name: api
Value: <railway-provided-domain>.railway.app
```

### Step 6: Run Database Migrations

**6.1 In Railway Console (Server Service):**
```bash
cd .medusa/server && npx medusa db:migrate
```

**6.2 Seed Initial Data (if needed):**
```bash
cd .medusa/server && npx medusa seed
```

### Step 7: Test Deployment

**7.1 Health Check:**
```bash
curl https://api.sunshinecoast4wd.com.au/health
# Expected: OK
```

**7.2 Access Admin:**
```
https://api.sunshinecoast4wd.com.au/app
```

**7.3 Test Store API:**
```bash
curl https://api.sunshinecoast4wd.com.au/store/products
```

### Step 8: Monitor and Scale

**8.1 Railway Monitoring:**
- Check CPU usage
- Check memory usage
- Check response times
- Set up alerts

**8.2 Scaling Strategy:**
```bash
# If admin traffic is high:
- Increase server instance size

# If background tasks are slow:
- Increase worker instance size

# If database is slow:
- Upgrade PostgreSQL plan
```

---

## Version Differences: v1 vs v2

### Medusa v1 Admin Deployment
```
❌ DEPRECATED APPROACH

Admin was a separate React application
Could be built and deployed independently
Common pattern: Admin on Vercel, Server on Railway
Required complex CORS configuration
Admin communicated with server via REST API
```

### Medusa v2 Admin Deployment
```
✅ CURRENT OFFICIAL APPROACH

Admin is integrated into Medusa Framework
Built with Vite as part of server build
Served by server at /app endpoint
Simplified CORS (admin on same domain)
Admin is part of server application
```

**Key Quote from Official Docs:**
> "The deployment process in Medusa v2 is similar to v1, but with some changes. For example, the Medusa server is now deployed with Medusa Admin."

---

## Environment Variables Reference

### Required Variables

| Variable | Description | Example | Server | Worker |
|----------|-------------|---------|--------|--------|
| `MEDUSA_WORKER_MODE` | Instance mode | `server` or `worker` | server | worker |
| `DISABLE_MEDUSA_ADMIN` | Disable admin | `false` or `true` | false | true |
| `DATABASE_URL` | PostgreSQL connection | `postgresql://...` | ✓ | ✓ |
| `REDIS_URL` | Redis connection | `redis://...` | ✓ | ✓ |
| `JWT_SECRET` | JWT signing secret | `<64-char-string>` | ✓ | ✓ |
| `COOKIE_SECRET` | Cookie encryption | `<64-char-string>` | ✓ | ✓ |
| `ADMIN_CORS` | Admin CORS origins | `https://api.domain.com` | ✓ | - |
| `STORE_CORS` | Store CORS origins | `https://domain.com` | ✓ | - |
| `AUTH_CORS` | Auth CORS origins | `https://domain.com` | ✓ | - |
| `NODE_ENV` | Environment | `production` | ✓ | ✓ |

### Optional Variables

| Variable | Description | Example | Server | Worker |
|----------|-------------|---------|--------|--------|
| `MEDUSA_BACKEND_URL` | Backend URL for admin | `https://api.domain.com` | ✓ | - |
| `STRIPE_API_KEY` | Stripe API key | `sk_live_...` | ✓ | ✓ |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook | `whsec_...` | ✓ | - |
| `PORT` | Server port | `9000` | ✓ | - |

### Security Best Practices

**Generate Strong Secrets:**
```bash
# Generate JWT_SECRET
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Generate COOKIE_SECRET
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

**Never Commit Secrets:**
```bash
# Add to .gitignore
.env
.env.local
.env.production
```

---

## Troubleshooting Common Issues

### Issue 1: Admin Not Loading

**Symptoms:**
- Accessing `/app` returns 404
- Admin dashboard shows blank page

**Solutions:**
```bash
# 1. Verify admin is built
ls .medusa/server/public/admin

# 2. Check DISABLE_MEDUSA_ADMIN
echo $DISABLE_MEDUSA_ADMIN  # Should be "false" or empty

# 3. Check MEDUSA_WORKER_MODE
echo $MEDUSA_WORKER_MODE  # Should be "server"

# 4. Rebuild application
npm run build
```

### Issue 2: CORS Errors

**Symptoms:**
- Browser console shows CORS errors
- Admin can't connect to API

**Solutions:**
```bash
# 1. Check ADMIN_CORS configuration
# Must include the domain where admin is accessed

# 2. For server+admin together:
ADMIN_CORS=https://api.sunshinecoast4wd.com.au

# 3. Verify AUTH_CORS includes admin URL
AUTH_CORS=https://api.sunshinecoast4wd.com.au,https://sunshinecoast4wd.com.au

# 4. Check browser network tab for actual origin
```

### Issue 3: Worker Not Processing Jobs

**Symptoms:**
- Background tasks not executing
- Scheduled jobs not running

**Solutions:**
```bash
# 1. Verify worker mode
echo $MEDUSA_WORKER_MODE  # Should be "worker"

# 2. Check Redis connection
redis-cli -u $REDIS_URL ping  # Should return "PONG"

# 3. Check worker logs in Railway
# Look for "Worker started" message

# 4. Verify same DATABASE_URL and REDIS_URL in both instances
```

### Issue 4: Database Migration Errors

**Symptoms:**
- "Migrations not run" error
- Database schema mismatch

**Solutions:**
```bash
# 1. Run migrations manually
cd .medusa/server && npx medusa db:migrate

# 2. Check database connection
psql $DATABASE_URL -c "SELECT version();"

# 3. Verify migrations table exists
psql $DATABASE_URL -c "\dt migrations"

# 4. Reset database (development only!)
cd .medusa/server && npx medusa db:migrate --force
```

### Issue 5: Build Failures

**Symptoms:**
- Railway build fails
- "Module not found" errors

**Solutions:**
```bash
# 1. Clear node_modules and rebuild
rm -rf node_modules .medusa
npm install
npm run build

# 2. Check package.json engines
{
  "engines": {
    "node": ">=20"
  }
}

# 3. Verify build script in Railway matches:
npm install && npm run build && cd .medusa/server && npm install

# 4. Check for TypeScript errors
npm run build --verbose
```

---

## Performance Optimization

### Server Instance Optimization

**1. Configure Build Caching:**
```bash
# In Railway settings:
Enable "Build Cache"
Cache node_modules between builds
```

**2. Optimize Node.js Settings:**
```bash
# Environment variables
NODE_OPTIONS="--max-old-space-size=2048"
```

**3. Enable Compression:**
```typescript
// medusa-config.ts
module.exports = defineConfig({
  projectConfig: {
    http: {
      compression: {
        enabled: true,
        level: 6,
      }
    }
  }
})
```

### Database Optimization

**1. Connection Pooling:**
```bash
# Add to DATABASE_URL
?connection_limit=10
```

**2. Index Critical Tables:**
```sql
-- Run after seeding
CREATE INDEX idx_products_handle ON products(handle);
CREATE INDEX idx_products_created_at ON products(created_at);
CREATE INDEX idx_orders_created_at ON orders(created_at);
```

### Redis Optimization

**1. Configure Eviction Policy:**
```bash
# For Railway Redis:
maxmemory-policy: allkeys-lru
```

**2. Monitor Redis Usage:**
```bash
redis-cli -u $REDIS_URL INFO memory
```

---

## Cost Analysis

### Railway Deployment (Recommended)

**Monthly Costs (Estimated):**

| Resource | Tier | Specs | Cost/Month |
|----------|------|-------|------------|
| PostgreSQL | Hobby | 1GB RAM, 1GB Storage | $5 |
| Redis | Hobby | 256MB | $5 |
| Server (with Admin) | Hobby | 512MB RAM, 1 CPU | $10 |
| Worker | Hobby | 512MB RAM, 1 CPU | $5 |
| **Total** | | | **$25/month** |

**With Growth:**

| Resource | Tier | Specs | Cost/Month |
|----------|------|-------|------------|
| PostgreSQL | Pro | 2GB RAM, 10GB Storage | $15 |
| Redis | Pro | 512MB | $10 |
| Server (with Admin) | Pro | 2GB RAM, 2 CPU | $30 |
| Worker | Pro | 2GB RAM, 2 CPU | $15 |
| **Total** | | | **$70/month** |

### Alternative: Vercel Admin (Not Recommended)

**Monthly Costs (Estimated):**

| Resource | Tier | Cost/Month |
|----------|------|------------|
| Vercel (Admin) | Pro | $20 |
| Railway Server | Hobby | $10 |
| Railway Worker | Hobby | $5 |
| PostgreSQL | Hobby | $5 |
| Redis | Hobby | $5 |
| **Total** | | **$45/month** |

**Cost Comparison Conclusion:**
The recommended approach (server + admin together) is actually MORE cost-effective ($25/month vs $45/month) while being simpler and more maintainable.

---

## Recommended Deployment Strategy

### For This Project (Sunshine Coast 4WD Tours)

**RECOMMENDATION: Deploy Server + Admin Together on Railway**

**Reasoning:**
1. ✅ Follows official Medusa v2 patterns
2. ✅ Lower cost ($25/month starting)
3. ✅ Simpler architecture (fewer moving parts)
4. ✅ Better performance (no network latency)
5. ✅ Easier to maintain and debug
6. ✅ No CORS complexity
7. ✅ Proven production pattern

**Architecture:**
```
┌─────────────────────────────────────────────────┐
│              RECOMMENDED SETUP                   │
└─────────────────────────────────────────────────┘

Railway Project: "sunshine-coast-4wd"
├── Service: medusa-server (server mode + admin)
│   └── URL: api.sunshinecoast4wd.com.au
│       ├── API: api.sunshinecoast4wd.com.au/store
│       └── Admin: api.sunshinecoast4wd.com.au/app
├── Service: medusa-worker (worker mode)
├── Service: postgresql
└── Service: redis

Separate Project: "sunshine-coast-storefront"
└── Service: next-storefront
    └── URL: sunshinecoast4wd.com.au
```

**Implementation Steps:**
1. Follow Step-by-Step Deployment Guide (Section above)
2. Configure DNS as specified
3. Test admin at `https://api.sunshinecoast4wd.com.au/app`
4. Monitor Railway metrics
5. Scale as needed

---

## Alternative Architectures (Edge Cases)

### When to Consider Separate Admin Deployment

Only consider separate admin deployment if:

1. **High Admin Traffic**: You have many staff members using admin constantly
2. **Geographic Distribution**: Admin users are in different regions than API
3. **Strict Security Requirements**: Need to isolate admin from public API
4. **Custom Admin Requirements**: Heavy admin customizations that need separate scaling

**Even then**, it's recommended to stick with the official pattern unless you have specific requirements that justify the added complexity.

---

## Migration Path from Current Setup

### Current State Analysis

**Current Configuration:**
```typescript
// medusa-config.ts
admin: {
  disable: process.env.DISABLE_ADMIN === "true",
}
```

**Issues:**
- Admin currently disabled in production
- No worker mode configuration
- Missing MEDUSA_BACKEND_URL configuration

### Migration Steps

**Step 1: Update Configuration**
```typescript
// medusa-config.ts
module.exports = defineConfig({
  admin: {
    disable: process.env.DISABLE_MEDUSA_ADMIN === "true",
    backendUrl: process.env.MEDUSA_BACKEND_URL,
  },
  projectConfig: {
    workerMode: process.env.MEDUSA_WORKER_MODE as "shared" | "worker" | "server" || "shared",
    // ... rest of config
  }
})
```

**Step 2: Update Environment Variables**
```bash
# Rename DISABLE_ADMIN to DISABLE_MEDUSA_ADMIN
DISABLE_MEDUSA_ADMIN=false

# Add worker mode
MEDUSA_WORKER_MODE=server

# Add backend URL
MEDUSA_BACKEND_URL=https://api.sunshinecoast4wd.com.au
```

**Step 3: Deploy Changes**
```bash
git add medusa-config.ts
git commit -m "Configure admin and worker mode for production"
git push
```

**Step 4: Verify Admin Access**
```bash
# Wait for Railway deployment
# Access admin at:
https://api.sunshinecoast4wd.com.au/app
```

**Step 5: Create Worker Instance**
- Follow Step 4 from Step-by-Step Deployment Guide
- Create separate Railway service with worker mode

---

## Security Considerations

### Admin Security Best Practices

**1. HTTPS Only:**
```bash
# Always use HTTPS in production
MEDUSA_BACKEND_URL=https://api.sunshinecoast4wd.com.au
```

**2. Strong Authentication:**
```bash
# Use strong secrets (64+ characters)
JWT_SECRET=$(openssl rand -hex 64)
COOKIE_SECRET=$(openssl rand -hex 64)
```

**3. CORS Restrictions:**
```bash
# Be specific with CORS origins
ADMIN_CORS=https://api.sunshinecoast4wd.com.au
# DON'T use wildcards in production: ADMIN_CORS=*
```

**4. Rate Limiting:**
```typescript
// Implement rate limiting on admin routes
// (Medusa v2 may have built-in options)
```

**5. IP Whitelisting (Optional):**
```bash
# If using Railway:
# Configure IP whitelist in service settings
# Only allow specific office IPs to access /admin/* and /app
```

### Database Security

**1. Encrypted Connections:**
```bash
DATABASE_URL=postgresql://...?sslmode=require
```

**2. Separate User Credentials:**
```bash
# Don't use superuser for application
# Create dedicated application user with limited privileges
```

**3. Regular Backups:**
```bash
# Railway automatically backs up PostgreSQL
# Verify backup schedule in settings
```

---

## Monitoring and Logging

### Railway Monitoring

**1. Built-in Metrics:**
- CPU usage
- Memory usage
- Request count
- Response times

**2. Logs:**
```bash
# Access logs in Railway dashboard
# Service → Logs tab

# Filter by service:
- medusa-server
- medusa-worker
```

**3. Alerts:**
```bash
# Set up alerts for:
- High CPU usage (> 80%)
- High memory usage (> 90%)
- Service crashes
- Failed deployments
```

### Application Logging

**1. Structured Logging:**
```typescript
// Use Medusa's built-in logger
import { Logger } from '@medusajs/framework/types'

class MyService {
  constructor({ logger }: { logger: Logger }) {
    this.logger = logger
  }

  async doSomething() {
    this.logger.info('Doing something')
    this.logger.error('Something went wrong', { error })
  }
}
```

**2. Log Levels:**
```bash
# Set log level via environment
LOG_LEVEL=info  # debug, info, warn, error
```

---

## Conclusion

### Key Takeaways

1. **Medusa v2 Changed Admin Deployment**:
   - Admin is now integrated into server
   - Separate deployment is an edge case, not recommended

2. **Recommended Architecture**:
   - Deploy server + admin together on Railway
   - Separate worker instance for background tasks
   - Use official patterns from Medusa documentation

3. **Cost and Complexity**:
   - Server + admin together: $25/month, simpler
   - Separate admin: $45/month, more complex
   - Official approach is both cheaper and better

4. **Current Project Status**:
   - Using Medusa v2.11.3
   - Admin currently disabled
   - Need to enable admin and add worker configuration

### Next Steps for Implementation

1. ✅ Update `medusa-config.ts` with worker mode and admin settings
2. ✅ Set up Railway infrastructure (PostgreSQL, Redis)
3. ✅ Deploy server instance with admin enabled
4. ✅ Deploy worker instance for background tasks
5. ✅ Configure domains and DNS
6. ✅ Test admin access at `/app`
7. ✅ Monitor and optimize as needed

### Documentation References

**Local Documentation:**
- `/Users/Karim/med-usa-4wd/docs/medusa-llm/medusa-llms-full.txt`

**Key Sections:**
- Line 129: Separate Admin Build
- Line 6917: General Deployment Guide
- Line 6940: Server and Worker Mode
- Line 7107: Deploy Server Mode
- Line 7188: Deploy Worker Mode

**Official Online Docs:**
- https://docs.medusajs.com/resources/deployment
- https://docs.medusajs.com/learn/production/worker-mode

---

**Document Prepared By**: Claude Code Agent
**Based On**: Official Medusa v2 Documentation
**Last Updated**: November 11, 2025
