# Deployment Quick Reference

**For detailed instructions, see**: [DEPLOYMENT-RUNBOOK.md](./DEPLOYMENT-RUNBOOK.md)

## Pre-Flight Checklist (5 minutes)

Quick verification before starting deployment:

```bash
# 1. All tests pass
cd /Users/Karim/med-usa-4wd/storefront
npm run test:ci && npm run test:e2e

# 2. Build succeeds
npm run build

# 3. Performance check
npm run start &
npx lighthouse http://localhost:8000 --preset=desktop --view

# 4. Code committed
git status  # Should be clean
```

**GO/NO-GO Decision**: If any of the above fail, DO NOT proceed.

---

## Critical Commands

### Backend Deployment (Railway)

```bash
# Connect to project
cd /Users/Karim/med-usa-4wd
railway link

# Set environment variables
railway variables set DATABASE_URL="postgresql://..."
railway variables set JWT_SECRET="..."
railway variables set COOKIE_SECRET="..."
railway variables set STORE_CORS="https://your-domain.com"
railway variables set STRIPE_API_KEY="sk_live_..."
railway variables set STRIPE_WEBHOOK_SECRET="whsec_..."

# Deploy
railway up

# Monitor logs
railway logs --follow

# Health check
curl https://your-backend-url.railway.app/health
```

### Storefront Deployment (Vercel)

```bash
# Deploy from storefront directory
cd /Users/Karim/med-usa-4wd/storefront
vercel --prod

# Set environment variables
vercel env add NEXT_PUBLIC_MEDUSA_BACKEND_URL production
# Enter: https://your-backend-url.railway.app

vercel env add NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY production
# Enter: pk_live_...

# Monitor deployment
vercel logs --follow

# Test site
open https://your-deployment-url.vercel.app
```

### Database Operations

```bash
# Connect to database
railway run psql $DATABASE_URL

# Run migrations
railway run npx medusa db:migrate

# Verify data
railway run psql $DATABASE_URL -c "SELECT COUNT(*) FROM product;"

# Backup
railway run psql $DATABASE_URL > backup_$(date +%Y%m%d).sql
```

---

## Emergency Rollback

### Rollback Storefront (5 minutes)

```bash
# Via CLI
cd /Users/Karim/med-usa-4wd/storefront
vercel ls  # List deployments
vercel promote [previous-deployment-url]

# Via Dashboard
# Vercel → Project → Deployments → Click previous → Promote to Production
```

### Rollback Backend (5 minutes)

```bash
# Via CLI
cd /Users/Karim/med-usa-4wd
git revert HEAD
git push origin main

# Via Dashboard
# Railway → Deployments → Click previous → Redeploy
```

### Rollback Database (20 minutes)

```bash
# Stop writes
railway down

# Restore backup
psql "$DATABASE_URL" < backup_20250110.sql

# Restart
railway up --detach
```

---

## Critical URLs

### Health Checks

- Backend: `https://your-backend-url.railway.app/health`
- Storefront: `https://your-domain.com`

### Admin Dashboards

- Vercel: https://vercel.com/dashboard
- Railway: https://railway.app/dashboard
- Stripe: https://dashboard.stripe.com
- Google Search Console: https://search.google.com/search-console

### Status Pages

- Vercel: https://vercel-status.com
- Railway: https://status.railway.app
- Stripe: https://status.stripe.com

---

## Verification Tests

### Quick Smoke Test (10 minutes)

```bash
# 1. Homepage loads
curl -I https://your-domain.com | head -1
# Expected: HTTP/2 200

# 2. Products API works
curl https://your-backend-url.railway.app/store/products | jq length
# Expected: 5 (number of tours)

# 3. Health check passes
curl https://your-backend-url.railway.app/health | jq .status
# Expected: "ok"

# 4. SSL valid
echo | openssl s_client -connect your-domain.com:443 -servername your-domain.com 2>/dev/null | grep "Verify return code"
# Expected: Verify return code: 0 (ok)
```

### Full E2E Test (15 minutes)

1. Visit `https://your-domain.com`
2. Click "Great Fraser Island Adventure"
3. Select date, passengers
4. Click "Reserve Tour"
5. Fill contact info
6. Use test card: 4242 4242 4242 4242
7. Complete booking
8. Verify confirmation page
9. Check Stripe Dashboard for payment
10. Refund immediately

---

## Environment Variables Reference

### Backend (Railway)

| Variable | Example | Required |
|----------|---------|----------|
| `DATABASE_URL` | `postgresql://user:pass@host/db` | Yes |
| `NODE_ENV` | `production` | Yes |
| `JWT_SECRET` | `64-char random string` | Yes |
| `COOKIE_SECRET` | `64-char random string` | Yes |
| `STORE_CORS` | `https://your-domain.com` | Yes |
| `ADMIN_CORS` | `https://your-domain.com` | Yes |
| `AUTH_CORS` | `https://your-domain.com` | Yes |
| `STRIPE_API_KEY` | `sk_live_...` | Yes |
| `STRIPE_WEBHOOK_SECRET` | `whsec_...` | Yes |
| `REDIS_URL` | `redis://...` | Optional |

### Storefront (Vercel)

| Variable | Example | Required |
|----------|---------|----------|
| `NEXT_PUBLIC_MEDUSA_BACKEND_URL` | `https://api.railway.app` | Yes |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | `pk_live_...` | Yes |
| `NEXT_PUBLIC_SITE_URL` | `https://your-domain.com` | Yes |
| `NEXT_PUBLIC_ANALYTICS_ENDPOINT` | `/api/analytics` | Optional |

---

## Common Issues & Quick Fixes

### Issue: Tours Not Loading

```bash
# Check CORS
railway variables | grep STORE_CORS
# Should include your domain

# Fix if wrong
railway variables set STORE_CORS="https://your-domain.com,https://www.your-domain.com"
railway up --detach
```

### Issue: Prices Wrong

```bash
# Check database (should be in dollars)
railway run psql $DATABASE_URL -c "SELECT amount FROM price LIMIT 1;"
# Expected: 200 (for $200), NOT 20000

# If in cents, fix
railway run psql $DATABASE_URL -c "UPDATE price SET amount = amount / 100;"
```

### Issue: Payments Failing

```bash
# Verify Stripe keys match
railway variables | grep STRIPE_API_KEY
# Should be sk_live_...

vercel env ls | grep STRIPE
# Should be pk_live_...

# Both should be "live" or both "test"
```

### Issue: Slow Performance

```bash
# Quick performance test
curl -w "@curl-format.txt" -o /dev/null -s https://your-domain.com

# If slow, check images
cd /Users/Karim/med-usa-4wd/storefront
bash scripts/optimize-images.sh
```

---

## Performance Targets

| Metric | Target | Critical |
|--------|--------|----------|
| PageSpeed (Desktop) | 90+ | 85+ |
| PageSpeed (Mobile) | 90+ | 85+ |
| LCP | < 2.5s | < 4.0s |
| FID | < 100ms | < 300ms |
| CLS | < 0.1 | < 0.25 |
| TTFB | < 600ms | < 1000ms |

**Test command**:
```bash
npx lighthouse https://your-domain.com --preset=mobile --output=json | jq '.categories.performance.score * 100'
```

---

## Contact Information

| Issue | Contact | Method |
|-------|---------|--------|
| Vercel Issues | Vercel Support | Dashboard → Help |
| Railway Issues | Railway Support | Discord / Dashboard |
| Stripe Issues | Stripe Support | Dashboard → Support |
| Medusa Questions | Medusa Discord | discord.gg/medusajs |
| Code Issues | Technical Lead | [email/phone] |

---

## Pre-Deployment Sign-Off

Before deployment, verify:

- [ ] Technical Lead approval
- [ ] QA testing complete
- [ ] Performance benchmarks met
- [ ] Rollback plan tested
- [ ] Team on standby
- [ ] Deployment window scheduled

**Deployment Time**: Off-peak hours recommended (e.g., 2am-6am local time)

---

## Post-Deployment Monitoring (First 24 Hours)

### Every Hour

```bash
# Check error rate
railway logs | grep -i error | tail -20

# Check performance
curl -w "%{time_total}\n" -o /dev/null -s https://your-domain.com

# Check Stripe
# Dashboard → Payments → Check success rate
```

### Every 4 Hours

```bash
# Run full smoke test
bash scripts/smoke-test.sh

# Check analytics
# Google Analytics → Real-Time

# Review logs
railway logs --since=4h > logs_$(date +%H).txt
```

---

## Success Metrics

| Metric | Day 1 Target |
|--------|-------------|
| Uptime | > 99.9% |
| Error Rate | < 0.1% |
| PageSpeed Score | 90+ |
| Payment Success Rate | > 95% |
| Average Response Time | < 200ms |

---

**Document Version**: 1.0
**See Full Runbook**: [DEPLOYMENT-RUNBOOK.md](./DEPLOYMENT-RUNBOOK.md)
**Last Updated**: 2025-11-10
