# Medusa Admin Deployment - Quick Start Guide

**TL;DR**: Deploy backend + admin together on Railway. It's the official recommended approach for Medusa v2.

---

## The Decision

**OPTIMAL APPROACH**: Railway (Backend + Admin Together)

```
✅ DEPLOY: Backend + Admin on Railway (Server + Worker Mode)
✅ ALREADY DEPLOYED: Next.js Storefront on Vercel
❌ DON'T: Deploy admin separately on Vercel (more complex, not recommended)
```

---

## Why Railway (Backend + Admin Together)?

1. **Official Medusa Recommendation**: "When you deploy your Medusa application, you also deploy the Medusa Admin"
2. **Simpler Setup**: Single deployment, single domain, single build
3. **Better Security**: Same-origin cookies, no complex CORS
4. **Meets Requirements**: 2GB+ RAM available (Medusa requirement)
5. **Cost-Effective**: $20/month includes backend, admin, PostgreSQL, Redis

---

## Quick Setup (5 Steps)

### 1. Update Your medusa-config.ts (Already Done!)

```typescript
module.exports = defineConfig({
  admin: {
    disable: process.env.DISABLE_MEDUSA_ADMIN === "true",
    backendUrl: process.env.MEDUSA_BACKEND_URL,
  },
  projectConfig: {
    workerMode: process.env.MEDUSA_WORKER_MODE as "shared" | "worker" | "server",
    redisUrl: process.env.REDIS_URL,
    // ...
  },
})
```

### 2. Create Railway Project

1. Sign up at https://railway.app
2. Create new project from your GitHub repo
3. Add PostgreSQL database
4. Add Redis database

### 3. Deploy Server Instance

**Environment Variables:**
```bash
MEDUSA_WORKER_MODE=server
DISABLE_MEDUSA_ADMIN=false
DATABASE_URL=${{Postgres.DATABASE_URL}}
REDIS_URL=${{Redis.REDIS_URL}}
COOKIE_SECRET=<generate-secure-secret>
JWT_SECRET=<generate-secure-secret>
STORE_CORS=https://yourstore.vercel.app
ADMIN_CORS=https://yourapp.up.railway.app
AUTH_CORS=https://yourstore.vercel.app,https://yourapp.up.railway.app
MEDUSA_BACKEND_URL=https://yourapp.up.railway.app
```

**Start Command:**
```bash
cd .medusa/server && npm install && npm run predeploy && npm run start
```

### 4. Deploy Worker Instance

**Environment Variables:**
```bash
MEDUSA_WORKER_MODE=worker
DISABLE_MEDUSA_ADMIN=true
DATABASE_URL=${{Postgres.DATABASE_URL}}
REDIS_URL=${{Redis.REDIS_URL}}
COOKIE_SECRET=<same-as-server>
JWT_SECRET=<same-as-server>
```

**Start Command:**
```bash
cd .medusa/server && npm install && npm run start
```

### 5. Create Admin User

Open Railway shell in server instance:
```bash
npx medusa user -e admin@yourdomain.com -p your-secure-password
```

---

## Access Your Admin

```
Admin URL: https://yourapp.up.railway.app/app
Health Check: https://yourapp.up.railway.app/health
API: https://yourapp.up.railway.app/store/products
```

---

## Cost

- **Railway Hobby Plan**: $20/month (2GB RAM, PostgreSQL, Redis included)
- **Railway Pro Plan**: $40/month (8GB RAM, better performance)

**Recommended**: Start with Hobby Plan ($20/month), upgrade to Pro if needed.

---

## Decision Matrix (Why Not Vercel for Admin?)

| Factor | Railway (Both) | Railway + Vercel | Winner |
|--------|---------------|------------------|---------|
| Official Recommendation | ✅ Yes | ⚠️ Alternative | Railway |
| Setup Complexity | Low | High | Railway |
| Maintenance | Simple | Complex | Railway |
| CORS Configuration | Simple | Complex | Railway |
| Cookie Security | Better | Harder | Railway |
| Build Time | Faster | Slower | Railway |

---

## Next Steps

1. Read full guide: `/docs/OPTIMAL-ADMIN-DEPLOYMENT.md`
2. Follow implementation plan (Phase 1-7)
3. Deploy server instance with admin
4. Deploy worker instance for background tasks
5. Test admin access

---

## Need Help?

- **Full Documentation**: `/docs/OPTIMAL-ADMIN-DEPLOYMENT.md`
- **Official Medusa Docs**: https://docs.medusajs.com/learn/deployment
- **Railway Docs**: https://docs.railway.app
- **Local Medusa Docs**: `/docs/medusa-llm/medusa-llms-full.txt`

---

**Status**: ✅ READY TO DEPLOY
