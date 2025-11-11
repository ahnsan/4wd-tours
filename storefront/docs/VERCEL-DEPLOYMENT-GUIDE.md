# Vercel Deployment Guide - Next.js Storefront

Complete step-by-step guide for deploying the Sunshine Coast 4WD Tours storefront to Vercel.

## Prerequisites

- GitHub repository: https://github.com/ahnsan/4wd-tours.git
- Backend deployed at: https://4wd-tours-production.up.railway.app
- Publishable API Key: `pk_c1aea896aab279e937a2375566b06bfda34775b149b33353ca77eb3e8588a91b`
- Node.js 20.x or higher installed locally
- Git configured with access to the repository

---

## Part 1: Pre-Deployment Verification

### Step 1: Verify Backend is Running

Test that your backend is accessible and responding:

```bash
# Test health endpoint
curl https://4wd-tours-production.up.railway.app/health

# Expected response:
# {"status":"ok"}
```

### Step 2: Verify Backend API Endpoints

```bash
# Test products endpoint
curl https://4wd-tours-production.up.railway.app/store/products

# Test regions endpoint
curl https://4wd-tours-production.up.railway.app/store/regions

# All endpoints should return valid JSON responses (not 404 or 500 errors)
```

### Step 3: Navigate to Storefront Directory

```bash
cd /Users/Karim/med-usa-4wd/storefront
```

### Step 4: Verify Local Build Works

```bash
# Install dependencies (if not already installed)
npm install

# Run production build locally
npm run build

# Expected output should end with:
# ✓ Compiled successfully
```

---

## Part 2: Vercel CLI Installation (Optional)

You can deploy via Vercel CLI or through the Vercel dashboard. CLI deployment is recommended for more control.

### Step 1: Install Vercel CLI Globally

```bash
npm install -g vercel
```

### Step 2: Verify Installation

```bash
vercel --version

# Expected output: Vercel CLI 33.x.x or higher
```

### Step 3: Login to Vercel

```bash
vercel login

# This will open your browser for authentication
# Choose your preferred login method (GitHub, GitLab, Bitbucket, or Email)
```

---

## Part 3: Deploy via Vercel Dashboard (Recommended for First Deployment)

### Step 1: Push Latest Changes to GitHub

```bash
# Ensure you're in the root of the repository
cd /Users/Karim/med-usa-4wd

# Check git status
git status

# Add and commit any pending changes
git add .
git commit -m "Prepare storefront for Vercel deployment"

# Push to GitHub
git push origin main
```

### Step 2: Import Project to Vercel

1. Go to https://vercel.com/new
2. Click "Import Git Repository"
3. Connect your GitHub account if not already connected
4. Select the repository: `ahnsan/4wd-tours`
5. Click "Import"

### Step 3: Configure Project Settings

**Framework Preset:**
- Auto-detected: Next.js

**Root Directory:**
- Click "Edit" next to Root Directory
- Enter: `storefront`
- Click "Continue"

**Build Settings (Auto-detected):**
- Build Command: `npm run build`
- Output Directory: `.next`
- Install Command: `npm install`
- Development Command: `npm run dev`

**Leave these settings as-is unless you have specific requirements**

### Step 4: Configure Environment Variables

Click "Environment Variables" and add the following:

| Variable Name | Value | Environments |
|--------------|-------|--------------|
| `NEXT_PUBLIC_MEDUSA_BACKEND_URL` | `https://4wd-tours-production.up.railway.app` | Production, Preview, Development |
| `NEXT_PUBLIC_API_URL` | `https://4wd-tours-production.up.railway.app` | Production, Preview, Development |
| `NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY` | `pk_c1aea896aab279e937a2375566b06bfda34775b149b33353ca77eb3e8588a91b` | Production, Preview, Development |
| `NEXT_PUBLIC_DEFAULT_REGION_ID` | `reg_01K9G4HA190556136E7RJQ4411` | Production, Preview, Development |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | `pk_test_51SRbgoRAcUUTBTrPbVEAI7o7K7x4B7tD6J0hpW0o0358868Xn1CuHux99GaeTGVv2LBlThpYLcpDUxHFmVnSDR4F00hmJK5WzS` | Production, Preview, Development |

**Important Notes:**
- Ensure all variables are prefixed with `NEXT_PUBLIC_` (these are exposed to the browser)
- Select all three environments (Production, Preview, Development) for each variable
- Double-check the backend URL has no trailing slash

### Step 5: Deploy

1. Click "Deploy"
2. Wait for the build to complete (typically 2-5 minutes)
3. Monitor the build logs for any errors

**Build Process:**
- Installing dependencies
- Running `npm run build`
- Generating optimized production build
- Uploading build artifacts
- Assigning production domain

### Step 6: Deployment Success

Once deployment completes, you'll see:
- Deployment URL (e.g., `https://your-project.vercel.app`)
- Production domain (if configured)
- Deployment status: Ready

---

## Part 4: Deploy via Vercel CLI (Alternative Method)

### Step 1: Navigate to Storefront Directory

```bash
cd /Users/Karim/med-usa-4wd/storefront
```

### Step 2: Initialize Vercel Project

```bash
vercel

# Answer the prompts:
# Set up and deploy? [Y/n] Y
# Which scope? Select your team/account
# Link to existing project? [y/N] N
# What's your project's name? sunshine-coast-4wd-tours
# In which directory is your code located? ./ (current directory)
```

This will:
- Create a new Vercel project
- Deploy a preview version
- Link the local directory to the Vercel project

### Step 3: Configure Environment Variables via CLI

```bash
# Set backend URL
vercel env add NEXT_PUBLIC_MEDUSA_BACKEND_URL production
# Paste: https://4wd-tours-production.up.railway.app

# Set API URL (same as backend)
vercel env add NEXT_PUBLIC_API_URL production
# Paste: https://4wd-tours-production.up.railway.app

# Set publishable key
vercel env add NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY production
# Paste: pk_c1aea896aab279e937a2375566b06bfda34775b149b33353ca77eb3e8588a91b

# Set default region ID
vercel env add NEXT_PUBLIC_DEFAULT_REGION_ID production
# Paste: reg_01K9G4HA190556136E7RJQ4411

# Set Stripe publishable key
vercel env add NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY production
# Paste: pk_test_51SRbgoRAcUUTBTrPbVEAI7o7K7x4B7tD6J0hpW0o0358868Xn1CuHux99GaeTGVv2LBlThpYLcpDUxHFmVnSDR4F00hmJK5WzS
```

**Repeat for Preview and Development environments:**

```bash
# For each variable, add to preview environment
vercel env add NEXT_PUBLIC_MEDUSA_BACKEND_URL preview
# Paste the same value

vercel env add NEXT_PUBLIC_API_URL preview
# Paste the same value

# ... repeat for all variables ...

# For each variable, add to development environment
vercel env add NEXT_PUBLIC_MEDUSA_BACKEND_URL development
# Paste the same value

# ... repeat for all variables ...
```

### Step 4: Deploy to Production

```bash
vercel --prod

# This will:
# 1. Build your project
# 2. Upload build artifacts
# 3. Deploy to production
# 4. Output the production URL
```

**Deployment Output:**
```
Vercel CLI 33.x.x
🔍  Inspect: https://vercel.com/your-team/project/deployment-id
✅  Production: https://your-project.vercel.app [2s]
```

---

## Part 5: Post-Deployment Verification

### Step 1: Test Production Deployment

```bash
# Replace YOUR_VERCEL_URL with your actual Vercel deployment URL
VERCEL_URL="https://your-project.vercel.app"

# Test homepage loads
curl -I $VERCEL_URL

# Expected: HTTP/2 200
```

### Step 2: Verify Environment Variables in Browser

1. Open your Vercel deployment URL in a browser
2. Open browser DevTools (F12)
3. Go to Console tab
4. Run:

```javascript
console.log('Backend URL:', process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL);
console.log('API URL:', process.env.NEXT_PUBLIC_API_URL);
console.log('Publishable Key:', process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY);
```

**Expected Output:**
```
Backend URL: https://4wd-tours-production.up.railway.app
API URL: https://4wd-tours-production.up.railway.app
Publishable Key: pk_c1aea896aab279e937a2375566b06bfda34775b149b33353ca77eb3e8588a91b
```

### Step 3: Test Key User Flows

**Test 1: Homepage Loads**
- Visit: `https://your-project.vercel.app`
- Verify: Page loads without errors
- Check: Hero section displays correctly

**Test 2: Tours Page**
- Visit: `https://your-project.vercel.app/tours`
- Verify: Tour products load from backend
- Check: Images display correctly
- Check: Prices display in correct currency (AUD)

**Test 3: Individual Tour Page**
- Click on any tour
- Verify: Tour details load
- Check: Add-ons section displays
- Check: Date picker works

**Test 4: Cart Functionality**
- Add a tour to cart
- Verify: Cart updates
- Check: Cart badge shows correct count
- Visit cart page
- Verify: Cart items display correctly

**Test 5: Checkout Flow**
- Proceed to checkout
- Verify: Checkout form loads
- Check: Stripe payment form initializes
- Test: Form validation works

### Step 4: Monitor Vercel Deployment Logs

1. Go to https://vercel.com/dashboard
2. Select your project
3. Click on the latest deployment
4. Click "Functions" or "Runtime Logs"
5. Monitor for any runtime errors

### Step 5: Check Performance Metrics

1. In Vercel dashboard, go to "Analytics"
2. Check:
   - Real Experience Score (should be 90+)
   - Core Web Vitals
   - Response times

### Step 6: Test Mobile Responsiveness

1. Open deployment in mobile browser or use DevTools device emulation
2. Test navigation
3. Test tour browsing
4. Test cart and checkout flow
5. Verify: All interactions work smoothly

---

## Part 6: Configure Custom Domain (Optional)

### Step 1: Add Domain in Vercel

1. Go to Project Settings > Domains
2. Click "Add Domain"
3. Enter your domain (e.g., `tours.sunshinecoast4wd.com.au`)
4. Click "Add"

### Step 2: Configure DNS

Vercel will provide DNS records. Add these to your DNS provider:

**For subdomain (e.g., tours.sunshinecoast4wd.com.au):**
- Type: `CNAME`
- Name: `tours`
- Value: `cname.vercel-dns.com`
- TTL: `300`

**For apex domain (e.g., sunshinecoast4wd.com.au):**
- Type: `A`
- Name: `@`
- Value: `76.76.21.21`
- TTL: `300`

### Step 3: Verify Domain

1. Wait for DNS propagation (typically 5-30 minutes)
2. Vercel will automatically verify and issue SSL certificate
3. Once verified, your site will be accessible via custom domain

---

## Part 7: Set Up Automatic Deployments

### Step 1: Configure Git Integration

This is automatically set up if you deployed via Vercel Dashboard.

**Automatic Deployment Rules:**
- Push to `main` branch → Production deployment
- Push to other branches → Preview deployment
- Pull requests → Preview deployment with unique URL

### Step 2: Configure Deployment Protection (Optional)

1. Go to Project Settings > Git
2. Enable "Deployment Protection"
3. Configure branch protection rules

### Step 3: Set Up Notifications

1. Go to Project Settings > Notifications
2. Add notification channels:
   - Email
   - Slack
   - GitHub comments

---

## Part 8: Environment-Specific Configuration

### Production Environment Variables

Already configured in Part 3, Step 4.

### Preview Environment Variables

Preview deployments (from PRs or non-main branches) automatically use preview environment variables. These should point to the same production backend unless you have a staging backend.

### Development Environment Variables

Development variables are used when running `vercel dev` locally. These typically point to `localhost:9000`.

To update environment variables:

**Via Dashboard:**
1. Go to Project Settings > Environment Variables
2. Click on variable to edit
3. Update value
4. Redeploy

**Via CLI:**
```bash
# Pull latest environment variables
vercel env pull .env.local

# Edit .env.local
# Then push changes
vercel env add VARIABLE_NAME production
```

---

## Part 9: Troubleshooting Common Issues

### Issue 1: Build Fails with "Module not found"

**Solution:**
```bash
# Ensure all dependencies are in package.json
cd /Users/Karim/med-usa-4wd/storefront
npm install
npm run build

# If build works locally but fails on Vercel:
# 1. Check Node.js version compatibility
# 2. Clear Vercel build cache (Project Settings > General > Clear Cache)
# 3. Redeploy
```

### Issue 2: Environment Variables Not Working

**Solution:**
1. Verify variables are prefixed with `NEXT_PUBLIC_`
2. Check variables are set for all environments
3. Redeploy after adding variables (environment changes require redeployment)
4. Check browser console for actual values

### Issue 3: API Calls Failing (CORS Errors)

**Solution:**
1. Verify backend URL in environment variables (no trailing slash)
2. Check backend CORS configuration allows Vercel domain
3. In Railway backend, ensure `CORS_ORIGIN` includes Vercel URL:
   ```
   CORS_ORIGIN=https://your-project.vercel.app,https://tours.yourdomain.com
   ```

### Issue 4: Images Not Loading

**Solution:**
1. Check `next.config.js` has correct `remotePatterns` for your backend
2. Add Railway domain to image configuration:

```javascript
// In storefront/next.config.js
images: {
  remotePatterns: [
    // ... existing patterns ...
    {
      protocol: 'https',
      hostname: '4wd-tours-production.up.railway.app',
      pathname: '/uploads/**',
    },
    {
      protocol: 'https',
      hostname: '**.railway.app',
      pathname: '/**',
    },
  ],
}
```

3. Redeploy after updating config

### Issue 5: Slow Build Times

**Solution:**
1. Check build logs for bottlenecks
2. Reduce bundle size:
   ```bash
   # Analyze bundle
   ANALYZE=true npm run build
   ```
3. Optimize images before committing
4. Enable SWC minification (already enabled in config)

### Issue 6: Stripe Payments Not Working

**Solution:**
1. Verify Stripe publishable key is for production (starts with `pk_live_`)
2. Check Stripe Dashboard > Webhooks for webhook failures
3. Ensure Stripe webhook endpoint is configured:
   - URL: `https://4wd-tours-production.up.railway.app/hooks/stripe`
   - Events: `payment_intent.*`, `checkout.session.*`

### Issue 7: Products Not Loading

**Solution:**
1. Test backend directly:
   ```bash
   curl https://4wd-tours-production.up.railway.app/store/products
   ```
2. Check browser console for errors
3. Verify publishable key is correct
4. Check Network tab in DevTools for API responses

---

## Part 10: Performance Optimization

### Step 1: Enable Analytics

```bash
vercel

# Then go to Project Settings > Analytics
# Enable "Web Analytics" and "Web Vitals"
```

### Step 2: Configure Caching

Caching is already configured in `vercel.json`:
- Static assets: 1 year cache
- Images: 1 year cache
- API routes: No cache (dynamic)

### Step 3: Monitor Core Web Vitals

1. Go to Vercel Analytics
2. Monitor:
   - LCP (Largest Contentful Paint) - Target: < 2.5s
   - FID (First Input Delay) - Target: < 100ms
   - CLS (Cumulative Layout Shift) - Target: < 0.1

### Step 4: Optimize Images

Images are already optimized via Next.js Image component and `next.config.js`:
- AVIF and WebP formats
- Responsive sizes
- Lazy loading

### Step 5: Run Lighthouse Audit

```bash
# Install Lighthouse
npm install -g lighthouse

# Run audit on production
lighthouse https://your-project.vercel.app --view

# Target scores:
# Performance: 90+
# Accessibility: 90+
# Best Practices: 90+
# SEO: 90+
```

---

## Part 11: Monitoring and Maintenance

### Step 1: Set Up Real-Time Monitoring

1. **Vercel Analytics**: Automatic, no setup required
2. **Error Tracking**: Consider adding Sentry
3. **Uptime Monitoring**: Consider using UptimeRobot or Pingdom

### Step 2: Regular Health Checks

Create a cron job or GitHub Action to test your deployment:

```bash
#!/bin/bash
# health-check.sh

DEPLOYMENT_URL="https://your-project.vercel.app"
BACKEND_URL="https://4wd-tours-production.up.railway.app"

# Test frontend
echo "Testing frontend..."
FRONTEND_STATUS=$(curl -s -o /dev/null -w "%{http_code}" $DEPLOYMENT_URL)
if [ $FRONTEND_STATUS -eq 200 ]; then
  echo "✅ Frontend is healthy"
else
  echo "❌ Frontend is down (Status: $FRONTEND_STATUS)"
fi

# Test backend
echo "Testing backend..."
BACKEND_STATUS=$(curl -s -o /dev/null -w "%{http_code}" $BACKEND_URL/health)
if [ $BACKEND_STATUS -eq 200 ]; then
  echo "✅ Backend is healthy"
else
  echo "❌ Backend is down (Status: $BACKEND_STATUS)"
fi
```

### Step 3: Review Deployment Logs

Regularly check Vercel logs for:
- Runtime errors
- API failures
- Performance degradation
- Unusual traffic patterns

### Step 4: Update Dependencies

```bash
# Every 2-4 weeks
cd /Users/Karim/med-usa-4wd/storefront

# Check for outdated packages
npm outdated

# Update packages (be careful with major version updates)
npm update

# Test locally
npm run build
npm run test

# Commit and push (triggers automatic deployment)
git add package.json package-lock.json
git commit -m "chore: update dependencies"
git push origin main
```

---

## Part 12: Rollback Procedure

### If Deployment Has Issues

**Via Dashboard:**
1. Go to Vercel Dashboard > Deployments
2. Find the last working deployment
3. Click on the three dots (...)
4. Click "Promote to Production"

**Via CLI:**
```bash
# List recent deployments
vercel ls

# Rollback to specific deployment
vercel rollback [deployment-url]
```

**Immediate Rollback:**
```bash
# Rollback to previous deployment
vercel rollback
```

---

## Part 13: Security Checklist

- [ ] All environment variables are set correctly
- [ ] No secrets in git repository
- [ ] HTTPS is enabled (automatic with Vercel)
- [ ] Security headers are configured (in `vercel.json`)
- [ ] CORS is properly configured on backend
- [ ] Stripe webhook secret is secure
- [ ] API keys are for production environment
- [ ] Authentication is working correctly
- [ ] Rate limiting is configured (if applicable)
- [ ] Content Security Policy headers (optional)

---

## Part 14: Quick Reference Commands

### Deployment Commands

```bash
# Deploy to preview
vercel

# Deploy to production
vercel --prod

# Check deployment status
vercel ls

# View logs
vercel logs [deployment-url]

# Pull environment variables
vercel env pull

# Add environment variable
vercel env add VARIABLE_NAME production
```

### Testing Commands

```bash
# Test local build
npm run build && npm start

# Run tests
npm test

# Type checking
npm run type-check

# Lint
npm run lint
```

### Health Check Commands

```bash
# Test frontend
curl -I https://your-project.vercel.app

# Test backend
curl https://4wd-tours-production.up.railway.app/health

# Test API connection from frontend
curl https://your-project.vercel.app/api/health
```

---

## Summary

**Deployment Checklist:**
- [x] Backend verified and running
- [x] Local build successful
- [x] Vercel project created and configured
- [x] Root directory set to `storefront`
- [x] Environment variables configured
- [x] Deployment successful
- [x] Production URL accessible
- [x] All user flows tested
- [x] Performance metrics reviewed
- [x] Custom domain configured (optional)
- [x] Automatic deployments enabled
- [x] Monitoring set up

**Key URLs:**
- **Production Deployment**: `https://your-project.vercel.app`
- **Vercel Dashboard**: https://vercel.com/dashboard
- **Backend API**: https://4wd-tours-production.up.railway.app
- **GitHub Repository**: https://github.com/ahnsan/4wd-tours.git

**Support Resources:**
- Vercel Documentation: https://vercel.com/docs
- Next.js Documentation: https://nextjs.org/docs
- Medusa Documentation: https://docs.medusajs.com

---

**Need Help?**

- Vercel Support: https://vercel.com/support
- Check deployment logs in Vercel Dashboard
- Review troubleshooting section above
- Test backend endpoints directly

---

**Last Updated:** 2025-11-11
