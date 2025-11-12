# Medusa Cloud Deployment Guide

## Overview

Medusa Cloud simplifies deployment by handling infrastructure, scaling, and maintenance automatically. This guide provides the required environment variables and deployment steps.

## Required Environment Variables for Medusa Cloud

### 1. Security & Authentication

```bash
# JWT Secret (Required)
# Generate with: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
JWT_SECRET=your_jwt_secret_here

# Cookie Secret (Required)
# Generate with: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
COOKIE_SECRET=your_cookie_secret_here
```

### 2. CORS Configuration

```bash
# Store CORS - Your storefront domain(s)
# Separate multiple domains with commas
STORE_CORS=https://your-storefront.vercel.app,https://*.vercel.app

# Admin CORS - Your admin dashboard domain(s)
# Separate multiple domains with commas
ADMIN_CORS=https://your-admin.vercel.app,https://*.vercel.app

# Auth CORS - Same as Admin CORS
AUTH_CORS=https://your-admin.vercel.app,https://*.vercel.app
```

### 3. Backend Configuration

```bash
# Backend URL - Will be provided by Medusa Cloud
# Format: https://your-project.medusacloud.com
BACKEND_URL=https://your-project.medusacloud.com

# Admin Disabled - Set to true for Medusa Cloud (admin served separately)
DISABLE_ADMIN=true

# Node Environment - Set to production
NODE_ENV=production
```

### 4. Stripe Payment Integration

```bash
# Stripe API Key (Required for payments)
STRIPE_API_KEY=sk_live_your_stripe_key_here

# Stripe Publishable Key (For frontend)
STRIPE_PUBLISHABLE_KEY=pk_live_your_stripe_publishable_key_here

# Stripe Webhook Secret (Required)
# Get from: Stripe Dashboard > Developers > Webhooks
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here
```

### 5. Database & Redis (Auto-provided by Medusa Cloud)

These are typically auto-configured by Medusa Cloud:

```bash
# Database URL - Auto-configured
DATABASE_URL=<provided-by-medusa-cloud>

# Redis URL - Auto-configured
REDIS_URL=<provided-by-medusa-cloud>
```

---

## Current Values from Local .env

Based on your local `.env` file, here are the values to set in Medusa Cloud:

```bash
# Security (Generate NEW secrets for production!)
JWT_SECRET=85b5049ad11d0e8ed0f80e8bdb4f1a8511df0cceac8a0220937253ef2a73917216600c4a4b897fda85f2411d69242b4ba874f935af4af3cb00dfdcb620c48cf6
COOKIE_SECRET=c13e5ef0769fc413b43a4a34970a63830e85017105737f20bb225d81209464d07114d4f863ed43637842075e2e7649b1efee58b97e46b48583ebe44b7d2fe212

# Stripe (UPDATE with LIVE keys for production!)
STRIPE_API_KEY=sk_live_your_stripe_secret_key_here
STRIPE_PUBLISHABLE_KEY=pk_live_your_stripe_publishable_key_here
STRIPE_WEBHOOK_SECRET=<get-from-stripe-dashboard>

# Backend Config (Will be updated after Medusa Cloud deployment)
DISABLE_ADMIN=true
BACKEND_URL=<will-be-provided-by-medusa-cloud>

# CORS (Update with your actual Vercel domains)
STORE_CORS=https://your-storefront.vercel.app,https://*.vercel.app
ADMIN_CORS=https://your-admin.vercel.app,https://*.vercel.app
AUTH_CORS=https://your-admin.vercel.app,https://*.vercel.app

# Environment
NODE_ENV=production
```

---

## Deployment Steps

### 1. Sign Up for Medusa Cloud

1. Go to [Medusa Cloud](https://medusajs.com/cloud)
2. Create an account or log in
3. Create a new project

### 2. Connect GitHub Repository

1. In Medusa Cloud dashboard, select "Connect GitHub"
2. Authorize Medusa Cloud to access your repository
3. Select the repository: `ahnsan/4wd-tours`
4. Select branch: `master`

### 3. Configure Environment Variables

In the Medusa Cloud dashboard, add all the environment variables listed above.

**IMPORTANT:**
- Generate NEW `JWT_SECRET` and `COOKIE_SECRET` for production
- Use Stripe LIVE keys (not test keys) for production
- Update CORS domains with your actual Vercel URLs

### 4. Deploy

1. Click "Deploy" in Medusa Cloud dashboard
2. Wait for build and deployment to complete
3. Copy the provided `BACKEND_URL` (e.g., `https://your-project.medusacloud.com`)

### 5. Update Environment Variables

After deployment, update these variables in Medusa Cloud:

```bash
BACKEND_URL=<your-medusa-cloud-url>
```

### 6. Seed Production Database

After deployment, you'll need to seed your production database:

1. Use Medusa Cloud CLI or API to run seed scripts
2. Or use the admin dashboard to manually create products

---

## Storefront Environment Variables (Vercel)

After Medusa Cloud deployment, configure your storefront on Vercel:

```bash
# Backend Connection
NEXT_PUBLIC_MEDUSA_BACKEND_URL=https://your-project.medusacloud.com
NEXT_PUBLIC_API_URL=https://your-project.medusacloud.com

# Publishable API Key (Get from Medusa Admin)
NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY=pk_xxxxx

# Default Region (Australia)
NEXT_PUBLIC_DEFAULT_REGION_ID=reg_01K9G4HA190556136E7RJQ4411

# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_your_live_key_here
```

---

## Admin Dashboard Deployment (Vercel)

If deploying admin separately to Vercel:

1. Build admin with production backend URL:
   ```bash
   export BACKEND_URL=https://your-project.medusacloud.com
   npx medusa build --admin-only
   ```

2. Deploy `.medusa/admin` to Vercel

3. Update `ADMIN_CORS` in Medusa Cloud with the Vercel admin URL

---

## Post-Deployment Checklist

- [ ] Medusa Cloud backend is running
- [ ] All environment variables set correctly
- [ ] Database seeded with products
- [ ] Storefront deployed to Vercel
- [ ] Admin dashboard accessible
- [ ] CORS configured correctly
- [ ] Stripe webhook configured
- [ ] Test complete user journey (browse → checkout → order)

---

## Troubleshooting

### CORS Errors
- Verify `STORE_CORS` and `ADMIN_CORS` include your Vercel domains
- Include wildcard: `https://*.vercel.app`

### Admin Can't Connect
- Check `BACKEND_URL` in admin build
- Verify `ADMIN_CORS` includes admin domain

### Payments Failing
- Ensure using Stripe LIVE keys (not test keys)
- Verify webhook secret is configured
- Check Stripe Dashboard for webhook events

---

## Medusa Cloud vs Self-Hosting

**Medusa Cloud Advantages:**
- ✅ Automated infrastructure management
- ✅ Auto-scaling
- ✅ Managed PostgreSQL and Redis
- ✅ Built-in monitoring and logging
- ✅ Zero-downtime deployments
- ✅ Automatic SSL certificates
- ✅ CDN for static assets

**Self-Hosting (Railway) Requirements:**
- Manual infrastructure setup
- Manual scaling configuration
- Database and Redis management
- Custom monitoring setup
- Manual SSL configuration
- Custom deployment pipeline

---

## Next Steps

1. Create Medusa Cloud account
2. Connect GitHub repository
3. Set environment variables (listed above)
4. Deploy to Medusa Cloud
5. Get `BACKEND_URL` from Medusa Cloud
6. Deploy storefront to Vercel with Cloud backend URL
7. Test complete integration

---

## Support & Resources

- [Medusa Cloud Documentation](https://docs.medusajs.com/cloud)
- [Medusa Discord](https://discord.gg/medusajs)
- [Medusa GitHub](https://github.com/medusajs/medusa)
