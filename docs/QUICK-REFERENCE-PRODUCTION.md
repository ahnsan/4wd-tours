# Production Environment - Quick Reference

**Quick access guide for production deployment configuration**

---

## Essential Commands

### Generate Secrets
```bash
# Generate JWT_SECRET (copy output to .env)
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Generate COOKIE_SECRET (copy output to .env)
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### Test Build
```bash
# Backend
cd /Users/Karim/med-usa-4wd
npm run build

# Storefront
cd /Users/Karim/med-usa-4wd/storefront
npm run build
```

### Test CORS
```bash
# From browser console on storefront
fetch('https://your-api-domain.com/store/products')
  .then(r => console.log('CORS OK:', r.ok))
  .catch(e => console.error('CORS Error:', e))
```

---

## Critical Environment Variables

### Backend (Medusa) - Must Have

```bash
NODE_ENV=production
JWT_SECRET=<64+ chars, cryptographically random>
COOKIE_SECRET=<64+ chars, cryptographically random>
DATABASE_URL=postgres://user:pass@host:port/dbname
REDIS_URL=redis://user:pass@host:port
STRIPE_API_KEY=sk_live_REPLACE_WITH_YOUR_LIVE_KEYxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxx
STORE_CORS=https://yourdomain.com,https://www.yourdomain.com
ADMIN_CORS=https://admin.yourdomain.com
AUTH_CORS=https://admin.yourdomain.com
```

### Storefront (Next.js) - Must Have

```bash
NEXT_PUBLIC_MEDUSA_BACKEND_URL=https://api.yourdomain.com
NEXT_PUBLIC_API_URL=https://api.yourdomain.com
NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY=pk_xxxxx (from Medusa Admin)
NEXT_PUBLIC_DEFAULT_REGION_ID=reg_xxxxx
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_xxxxx
```

---

## Stripe Quick Setup

1. **Activate Account:** https://dashboard.stripe.com/settings/account
2. **Switch to Live Mode:** Toggle in top-left corner
3. **Get API Keys:** https://dashboard.stripe.com/apikeys
   - Copy `sk_live_REPLACE_WITH_YOUR_LIVE_KEYxx` → Backend STRIPE_API_KEY
   - Copy `pk_live_xxxxx` → Storefront NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
4. **Create Webhook:** https://dashboard.stripe.com/webhooks
   - URL: `https://your-api.com/hooks/payment/stripe_stripe`
   - Events: `payment_intent.succeeded`, `payment_intent.payment_failed`, `charge.succeeded`
   - Copy `whsec_xxxxx` → Backend STRIPE_WEBHOOK_SECRET
5. **Test Payment:** Use real card with $1-5, then refund immediately

---

## CORS Quick Fix

### Rules
- ✅ HTTPS only: `https://domain.com`
- ✅ No spaces: `domain1.com,domain2.com`
- ✅ No trailing slash: `https://domain.com` (not `https://domain.com/`)
- ❌ No localhost in production
- ❌ No wildcard `*`

### Example
```bash
# Development
STORE_CORS=http://localhost:8000

# Production
STORE_CORS=https://shop.yourdomain.com,https://www.yourdomain.com
```

---

## Security Checklist (Quick)

- [ ] JWT_SECRET: 64+ chars, different from dev
- [ ] COOKIE_SECRET: 64+ chars, different from dev
- [ ] Stripe: sk_live_ and pk_live_ (not sk_test_)
- [ ] CORS: HTTPS only, no localhost
- [ ] .env files NOT in git
- [ ] Secrets in platform secret manager

---

## Deployment Steps (30-Second Version)

1. **Generate secrets** (crypto command above)
2. **Get Stripe live keys** (dashboard.stripe.com)
3. **Create webhook** (dashboard.stripe.com/webhooks)
4. **Add env vars to platform** (Railway/Vercel)
5. **Update CORS** (production domains, HTTPS)
6. **Deploy**
7. **Test payment** ($1, then refund)
8. **Verify webhooks** (check logs)

---

## Troubleshooting (Quick)

### "JWT_SECRET is required"
→ Add to platform env vars, redeploy

### CORS error
→ Check STORE_CORS has storefront domain, no spaces, HTTPS

### Webhook failed
→ Verify URL, check STRIPE_WEBHOOK_SECRET matches Stripe Dashboard

### Payment works but order not updating
→ Check webhook events received (backend logs)

---

## File Locations

- **Templates:** `/Users/Karim/med-usa-4wd/docs/.env.production.*.example`
- **Full Guide:** `/Users/Karim/med-usa-4wd/docs/PRODUCTION-DEPLOYMENT-GUIDE.md`
- **Security:** `/Users/Karim/med-usa-4wd/docs/SECURITY-CHECKLIST.md`
- **CORS Guide:** `/Users/Karim/med-usa-4wd/docs/CORS-CONFIGURATION-GUIDE.md`
- **Stripe Guide:** `/Users/Karim/med-usa-4wd/docs/STRIPE-PRODUCTION-SETUP.md`

---

## Platform Quick Links

- **Stripe Dashboard:** https://dashboard.stripe.com
- **Stripe API Keys:** https://dashboard.stripe.com/apikeys
- **Stripe Webhooks:** https://dashboard.stripe.com/webhooks
- **Railway:** https://railway.app/dashboard
- **Vercel:** https://vercel.com/dashboard

---

## Emergency Contacts

- **Medusa Discord:** https://discord.gg/medusajs
- **Stripe Support:** https://support.stripe.com
- **Documentation:** See files above

---

**Keep this file accessible during deployment!**
