# Med USA 4WD - Production Deployment Runbook

## Table of Contents

1. [Overview](#overview)
2. [Pre-Deployment Checklist](#pre-deployment-checklist)
3. [Phase 1: Infrastructure Setup](#phase-1-infrastructure-setup)
4. [Phase 2: Database Deployment](#phase-2-database-deployment)
5. [Phase 3: Backend Deployment](#phase-3-backend-deployment)
6. [Phase 4: Storefront Deployment](#phase-4-storefront-deployment)
7. [Phase 5: Stripe Production Setup](#phase-5-stripe-production-setup)
8. [Phase 6: DNS and Domain Setup](#phase-6-dns-and-domain-setup)
9. [Phase 7: Final Verification](#phase-7-final-verification)
10. [Phase 8: Go-Live](#phase-8-go-live)
11. [Rollback Procedures](#rollback-procedures)
12. [Post-Deployment Monitoring](#post-deployment-monitoring)
13. [Troubleshooting Guide](#troubleshooting-guide)

---

## Overview

This runbook provides step-by-step instructions for deploying the Med USA 4WD storefront to production. It is designed to be executed by someone who didn't build the site and includes verification steps, rollback procedures, and troubleshooting guidance.

**Estimated Total Time**: 4-6 hours (plus DNS propagation: 24-48 hours)

**Required Access**:
- GitHub repository access
- Vercel account (or alternative hosting)
- Railway account (or alternative for backend/database)
- Domain registrar access
- Stripe account (owner or developer access)
- Google Search Console access

**Critical Success Factors**:
- All tests passing before deployment
- PageSpeed score 90+ (desktop and mobile)
- Complete end-to-end booking flow tested
- Rollback plan ready and tested

---

## Pre-Deployment Checklist

**Time Estimate**: 30-60 minutes

Before starting deployment, verify ALL items below:

### Code Quality

- [ ] **All code committed to git**
  ```bash
  cd /Users/Karim/med-usa-4wd
  git status
  # Should show: "nothing to commit, working tree clean"
  ```

- [ ] **All tests passing**
  ```bash
  # Backend tests
  cd /Users/Karim/med-usa-4wd
  npm test

  # Storefront tests
  cd /Users/Karim/med-usa-4wd/storefront
  npm run test:ci
  npm run test:e2e
  ```

- [ ] **TypeScript compilation passes**
  ```bash
  # Backend
  cd /Users/Karim/med-usa-4wd
  npx tsc --noEmit

  # Storefront
  cd /Users/Karim/med-usa-4wd/storefront
  npm run type-check
  ```

- [ ] **Linting passes**
  ```bash
  # Storefront
  cd /Users/Karim/med-usa-4wd/storefront
  npm run lint
  ```

### Performance Benchmarks

- [ ] **PageSpeed score 90+ on desktop**
  ```bash
  # Build production version first
  cd /Users/Karim/med-usa-4wd/storefront
  npm run build
  npm run start

  # Run Lighthouse (in separate terminal)
  npx lighthouse http://localhost:8000 --preset=desktop --view
  # Target: Performance score >= 90
  ```

- [ ] **PageSpeed score 90+ on mobile**
  ```bash
  npx lighthouse http://localhost:8000 --preset=mobile --view
  # Target: Performance score >= 90
  ```

- [ ] **Core Web Vitals in "Good" range**
  - LCP < 2.5s
  - FID < 100ms
  - CLS < 0.1
  - TTFB < 600ms

### SEO Audit

- [ ] **SEO audit complete**
  ```bash
  npx lighthouse http://localhost:8000 --only-categories=seo --view
  # Target: SEO score >= 95
  ```

- [ ] **All metadata present**
  - Title tags (50-60 characters)
  - Meta descriptions (150-160 characters)
  - Open Graph tags
  - Twitter Cards
  - Canonical URLs

- [ ] **Structured data implemented**
  - LocalBusiness schema
  - Organization schema
  - Product schemas
  - BreadcrumbList schema

### Database & Data

- [ ] **Database migration tested**
  ```bash
  # Test migrations in fresh database
  cd /Users/Karim/med-usa-4wd
  npm run build
  npx medusa db:migrate
  # Should complete without errors
  ```

- [ ] **Seeding script tested**
  ```bash
  npm run seed
  # Verify tours, addons, and pricing data created correctly
  ```

- [ ] **Pricing data verified (Medusa v2 format)**
  - All prices in dollars (not cents) in backend
  - Frontend correctly converts dollars to cents
  - Test: View tour prices on storefront
  - Expected: $200 tour displays correctly

### Environment & Configuration

- [ ] **Environment variables documented**
  - Review `/Users/Karim/med-usa-4wd/.env.example`
  - Review `/Users/Karim/med-usa-4wd/storefront/.env.example`
  - Create list of all required variables for production

- [ ] **Security secrets generated**
  ```bash
  # Generate JWT_SECRET
  node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

  # Generate COOKIE_SECRET
  node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

  # Store these securely - DO NOT commit to git
  ```

- [ ] **Stripe in test mode working**
  ```bash
  # Test complete checkout flow with test card
  # Card: 4242 4242 4242 4242
  # Exp: Any future date
  # CVC: Any 3 digits
  ```

### Backups & Safety

- [ ] **Backups created**
  ```bash
  # Backup current database (if exists)
  pg_dump -U postgres medusa-4wd-tours > backup_$(date +%Y%m%d_%H%M%S).sql

  # Backup code (create git tag)
  git tag -a pre-production-$(date +%Y%m%d) -m "Pre-production backup"
  git push origin --tags
  ```

- [ ] **Deployment plan reviewed**
  - Read this entire document
  - Identify team members for each phase
  - Schedule deployment time (recommend off-peak hours)

- [ ] **Rollback plan ready**
  - Review [Rollback Procedures](#rollback-procedures)
  - Test rollback commands in staging
  - Document rollback decision criteria

### Final Checks

- [ ] **Build succeeds locally**
  ```bash
  # Backend
  cd /Users/Karim/med-usa-4wd
  npm run build
  # Should complete with exit code 0

  # Storefront
  cd /Users/Karim/med-usa-4wd/storefront
  npm run build
  # Should complete with exit code 0
  ```

- [ ] **Production build tested locally**
  ```bash
  # Start backend
  cd /Users/Karim/med-usa-4wd
  npm run start

  # Start storefront (new terminal)
  cd /Users/Karim/med-usa-4wd/storefront
  npm run start

  # Test complete booking flow at http://localhost:8000
  ```

**CRITICAL**: Do NOT proceed to deployment until ALL checklist items are complete.

---

## Phase 1: Infrastructure Setup

**Time Estimate**: 60-90 minutes

### 1.1 Create Hosting Accounts

#### Vercel (Storefront Hosting - Recommended)

1. **Create Vercel account**
   - Visit https://vercel.com/signup
   - Sign up with GitHub account (recommended for easy deployment)
   - Verify email address

2. **Install Vercel CLI** (optional but recommended)
   ```bash
   npm install -g vercel
   vercel login
   ```

3. **Note Vercel team/username**
   - You'll need this for deployment configuration
   - Example: `your-team-name` or `your-username`

#### Railway (Backend & Database - Recommended)

1. **Create Railway account**
   - Visit https://railway.app
   - Sign up with GitHub account
   - Complete onboarding

2. **Install Railway CLI**
   ```bash
   npm install -g @railway/cli
   railway login
   ```

3. **Create new project**
   ```bash
   railway init
   # Name: med-usa-4wd-production
   ```

#### Alternative: Render.com

If not using Railway, Render.com is a good alternative:

1. **Create Render account**
   - Visit https://render.com
   - Sign up with GitHub

2. **Note**: Instructions below use Railway, but Render setup is similar

### 1.2 Set Up PostgreSQL Database

#### Using Railway

1. **Create PostgreSQL service**
   ```bash
   railway add
   # Select: PostgreSQL
   # Version: Latest stable (16+)
   ```

2. **Get database connection string**
   ```bash
   railway variables
   # Copy DATABASE_URL value
   # Format: postgresql://user:password@host:port/database
   ```

3. **Verify database connection**
   ```bash
   # Test connection using psql or any PostgreSQL client
   psql "postgresql://user:password@host:port/database"
   # Should connect successfully
   ```

4. **Configure database settings**
   - Max connections: 100 (adjust based on plan)
   - Connection pooling: Enabled
   - Backup schedule: Daily (Railway does this automatically)

**Important**: Save the DATABASE_URL in a secure location (password manager, secrets vault)

### 1.3 Configure DNS and Domain

#### Domain Purchase (if needed)

1. **Purchase domain** from registrar:
   - Recommended: Namecheap, Google Domains, Cloudflare
   - Suggested domain: `medusa4wd.com` or similar
   - Enable domain privacy protection

2. **Note nameservers**
   - You'll need to point these to Vercel later

#### DNS Records Planning

Plan these DNS records (will configure in Phase 6):

| Type | Name | Value | Purpose |
|------|------|-------|---------|
| A/CNAME | @ | Vercel IP/CNAME | Main site (medusa4wd.com) |
| CNAME | www | @ | WWW redirect |
| CNAME | api | Railway backend | Backend API (optional subdomain) |

### 1.4 Set Up SSL Certificates

**Good news**: Both Vercel and Railway provide automatic SSL certificates via Let's Encrypt.

- [ ] **Verify SSL will be auto-provisioned**
  - Vercel: Automatic once domain is configured
  - Railway: Automatic for custom domains

- [ ] **No manual action required** (certificates issued on first deployment)

### 1.5 Create Staging Environment (Recommended)

**Highly Recommended**: Deploy to staging first before production.

1. **Create staging project in Railway**
   ```bash
   railway init
   # Name: med-usa-4wd-staging
   ```

2. **Create staging project in Vercel**
   - Can be done via Vercel dashboard
   - Or deploy with `--prod=false` flag

3. **Benefits of staging**:
   - Test deployment process
   - Verify environment variables
   - Test with real payment methods (Stripe test mode)
   - Run final performance audits
   - Share with stakeholders for approval

**Time to complete Phase 1**: Record actual time: _____________

**Phase 1 Verification**:
- [ ] Vercel account created and accessible
- [ ] Railway account created and accessible
- [ ] PostgreSQL database provisioned
- [ ] DATABASE_URL obtained and stored securely
- [ ] Domain purchased/selected
- [ ] SSL certificates will auto-provision
- [ ] Staging environment created (optional)

---

## Phase 2: Database Deployment

**Time Estimate**: 20-30 minutes

### 2.1 Create Production Database

**Note**: If you completed Phase 1.2, your database is already created. This phase focuses on initializing it.

1. **Verify database is empty and ready**
   ```bash
   # Connect to database
   psql "YOUR_PRODUCTION_DATABASE_URL"

   # List tables (should be empty)
   \dt
   # Should show: "Did not find any relations"

   \q
   ```

2. **Set environment variable locally for testing**
   ```bash
   cd /Users/Karim/med-usa-4wd

   # Create .env.production (DO NOT commit)
   cat > .env.production << EOF
   DATABASE_URL=YOUR_PRODUCTION_DATABASE_URL
   NODE_ENV=production
   JWT_SECRET=your_generated_jwt_secret_here
   COOKIE_SECRET=your_generated_cookie_secret_here
   STORE_CORS=https://your-domain.com
   ADMIN_CORS=https://your-domain.com
   AUTH_CORS=https://your-domain.com
   STRIPE_API_KEY=sk_test_... (test key for now)
   EOF
   ```

### 2.2 Run Medusa Migrations

1. **Build Medusa backend**
   ```bash
   cd /Users/Karim/med-usa-4wd
   npm run build
   ```

2. **Run database migrations**
   ```bash
   # Load production environment
   export $(cat .env.production | xargs)

   # Run migrations
   npx medusa db:migrate
   ```

3. **Expected output**:
   ```
   info:    Migrations completed successfully
   info:    Database schema is up to date
   ```

4. **Verify migrations succeeded**
   ```bash
   psql "$DATABASE_URL"

   # List tables
   \dt
   # Should show multiple Medusa tables:
   # - store
   # - product
   # - product_variant
   # - cart
   # - order
   # - customer
   # - etc.

   \q
   ```

**Troubleshooting**:
- If migrations fail with "connection refused": Check DATABASE_URL
- If migrations fail with "permission denied": Check database user permissions
- If migrations fail with "already exists": Database may not be empty (see rollback)

### 2.3 Seed Production Data

1. **Review seed script**
   ```bash
   cat src/scripts/seed.ts
   # Verify data looks correct for production
   ```

2. **Run seed script**
   ```bash
   npm run seed
   ```

3. **Expected output**:
   ```
   Seeding database...
   Creating region...
   Creating shipping options...
   Creating tours...
   Creating addons...
   Seeding completed successfully!
   ```

4. **Verify seeding succeeded**
   ```bash
   psql "$DATABASE_URL"

   # Check products (tours)
   SELECT id, title FROM product;
   # Should show 5 tours:
   # - Great Fraser Island Adventure
   # - Noosa Hinterland Explorer
   # - Rainbow Beach Thrill Ride
   # - Sunshine Coast Custom Tour
   # - Multi-Day Fraser Island Expedition

   # Check product variants
   SELECT id, title, product_id FROM product_variant LIMIT 5;

   # Exit
   \q
   ```

### 2.4 Verify Pricing Data (Medusa v2 Format)

**CRITICAL**: Medusa v2 stores prices in dollars (not cents).

1. **Check price format**
   ```bash
   psql "$DATABASE_URL"

   # Query price list prices
   SELECT
     pv.title AS variant_title,
     p.amount AS price_amount,
     p.currency_code
   FROM price p
   JOIN product_variant pv ON p.variant_id = pv.id
   LIMIT 5;

   # Expected output:
   # Great Fraser Island Adventure | 200 | usd
   # (200 = $200.00, NOT 20000 cents)
   ```

2. **Verify pricing calculations**
   - Prices should be in dollars (e.g., 200 = $200)
   - Frontend will convert to cents for display
   - Do NOT modify prices to cents

3. **If prices are wrong**:
   ```bash
   # See Rollback Procedures to reset database
   # Fix seed script
   # Re-seed
   ```

### 2.5 Test Database Connectivity

1. **Test from backend application**
   ```bash
   cd /Users/Karim/med-usa-4wd

   # Start backend with production database
   npm run start

   # Should start without errors
   # Look for: "Server is ready on port 9000"
   ```

2. **Test API endpoint**
   ```bash
   # In new terminal
   curl http://localhost:9000/health
   # Expected: {"status":"ok"}

   curl http://localhost:9000/store/products
   # Should return list of products (tours)
   ```

3. **Stop local backend**
   ```bash
   # Press Ctrl+C in backend terminal
   ```

### 2.6 Configure Automated Backups

#### Using Railway

1. **Enable automated backups**
   ```bash
   railway open
   # Click on PostgreSQL service
   # Go to "Settings" tab
   # Backups are automatic on Railway
   # Verify "Backup" section shows enabled
   ```

2. **Test manual backup**
   ```bash
   # Railway backups via dashboard
   # Click "Create Backup" button
   # Verify backup completes successfully
   ```

#### Using Render

1. **Backups are automatic** on paid plans
2. **For manual backups**:
   ```bash
   pg_dump "$DATABASE_URL" > backup_$(date +%Y%m%d_%H%M%S).sql
   # Store in secure location (S3, Google Drive, etc.)
   ```

**Time to complete Phase 2**: Record actual time: _____________

**Phase 2 Verification**:
- [ ] Database created and accessible
- [ ] Migrations completed successfully
- [ ] Seed data loaded correctly
- [ ] Pricing data verified (dollars format)
- [ ] Database connectivity tested
- [ ] Automated backups configured
- [ ] Manual backup tested and stored

**Database Record Count** (for verification):
```sql
SELECT 'products' as table_name, COUNT(*) FROM product
UNION ALL
SELECT 'product_variants', COUNT(*) FROM product_variant
UNION ALL
SELECT 'prices', COUNT(*) FROM price;
```

Expected:
- products: 5
- product_variants: ~15 (3 per tour)
- prices: ~15 (one per variant)

---

## Phase 3: Backend Deployment (Medusa)

**Time Estimate**: 30-45 minutes

### 3.1 Connect Repository to Hosting Platform

#### Using Railway

1. **Link GitHub repository**
   ```bash
   cd /Users/Karim/med-usa-4wd
   railway link
   # Select: Create new project
   # Name: med-usa-4wd-production
   ```

2. **Or via Railway dashboard**:
   - Go to https://railway.app/dashboard
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Choose repository: `Karim/med-usa-4wd` (your actual repo)
   - Select root directory (not /storefront)

3. **Verify connection**
   ```bash
   railway status
   # Should show connected project
   ```

### 3.2 Configure Build Settings

1. **Create railway.json** (if not exists)
   ```bash
   cd /Users/Karim/med-usa-4wd
   cat > railway.json << 'EOF'
   {
     "$schema": "https://railway.app/railway.schema.json",
     "build": {
       "builder": "NIXPACKS",
       "buildCommand": "npm install && npm run build"
     },
     "deploy": {
       "startCommand": "npm run start",
       "restartPolicyType": "ON_FAILURE",
       "restartPolicyMaxRetries": 10
     }
   }
   EOF
   ```

2. **Commit and push**
   ```bash
   git add railway.json
   git commit -m "Add Railway configuration for deployment"
   git push origin main
   ```

3. **Verify build command in Railway dashboard**:
   - Go to project settings
   - Build section should show:
     - Build command: `npm install && npm run build`
     - Start command: `npm run start`

### 3.3 Set Environment Variables

1. **Required environment variables**:
   ```bash
   # In Railway dashboard or CLI
   railway variables set DATABASE_URL="postgresql://..."
   railway variables set NODE_ENV="production"
   railway variables set JWT_SECRET="your_generated_jwt_secret"
   railway variables set COOKIE_SECRET="your_generated_cookie_secret"
   railway variables set STORE_CORS="https://your-domain.com,https://www.your-domain.com"
   railway variables set ADMIN_CORS="https://your-domain.com,https://www.your-domain.com"
   railway variables set AUTH_CORS="https://your-domain.com,https://www.your-domain.com"
   ```

2. **Stripe configuration** (test mode for now):
   ```bash
   railway variables set STRIPE_API_KEY="sk_test_..."
   railway variables set STRIPE_WEBHOOK_SECRET="whsec_test_..."
   ```

3. **Optional: Redis** (recommended for production):
   ```bash
   # Add Redis service in Railway
   railway add
   # Select: Redis

   # Get Redis URL
   railway variables
   # Copy REDIS_URL

   railway variables set REDIS_URL="redis://..."
   ```

4. **Verify all variables set**:
   ```bash
   railway variables
   # Should list all variables (values hidden for security)
   ```

### 3.4 Configure Start Command

Already configured in railway.json:
```json
"startCommand": "npm run start"
```

This runs: `medusa start` which:
- Starts Medusa backend on port 9000
- Connects to PostgreSQL database
- Loads all modules (blog, resource_booking, payment)

### 3.5 Deploy Backend

1. **Trigger deployment**
   ```bash
   railway up
   ```

   Or push to trigger auto-deploy:
   ```bash
   git push origin main
   ```

2. **Monitor deployment logs**
   ```bash
   railway logs
   ```

3. **Expected log output**:
   ```
   [BUILD] Installing dependencies...
   [BUILD] Running build command...
   [BUILD] Build completed successfully
   [DEPLOY] Starting application...
   [DEPLOY] Server is ready on port 9000
   ```

4. **Wait for deployment to complete** (2-5 minutes)

### 3.6 Run Database Migrations (if not done)

If you skipped Phase 2 or need to run migrations on deployed backend:

1. **Run migrations via Railway CLI**
   ```bash
   railway run npm run build
   railway run npx medusa db:migrate
   ```

2. **Or via Railway dashboard**:
   - Go to project
   - Click "..." menu
   - Select "Run command"
   - Enter: `npx medusa db:migrate`
   - Click "Run"

3. **Verify migrations succeeded** in logs

### 3.7 Verify Health Endpoint

1. **Get backend URL**
   ```bash
   railway status
   # Note the URL, e.g., https://med-usa-4wd-production.railway.app
   ```

2. **Test health endpoint**
   ```bash
   curl https://your-backend-url.railway.app/health
   # Expected: {"status":"ok"}
   ```

3. **If health check fails**:
   - Check Railway logs: `railway logs`
   - Common issues:
     - Database connection failed (check DATABASE_URL)
     - Missing environment variables
     - Build failed (check build logs)
     - Port binding issue (Railway auto-configures)

### 3.8 Test API Endpoints

1. **Test store API**
   ```bash
   # Get products
   curl https://your-backend-url.railway.app/store/products
   # Should return JSON array of products (tours)

   # Get single product
   curl https://your-backend-url.railway.app/store/products/PRODUCT_ID
   # Replace PRODUCT_ID with actual ID from above
   ```

2. **Test regions**
   ```bash
   curl https://your-backend-url.railway.app/store/regions
   # Should return array with "United States" region
   ```

3. **Test cart creation**
   ```bash
   curl -X POST https://your-backend-url.railway.app/store/carts \
     -H "Content-Type: application/json" \
     -d '{"region_id": "REGION_ID"}'
   # Should return created cart
   ```

4. **Document backend URL**
   - Save for storefront configuration
   - Example: `https://med-usa-4wd-production.railway.app`

**Time to complete Phase 3**: Record actual time: _____________

**Phase 3 Verification**:
- [ ] Repository connected to Railway
- [ ] Build settings configured correctly
- [ ] All environment variables set
- [ ] Start command configured
- [ ] Deployment successful
- [ ] Health endpoint returns 200 OK
- [ ] Products API returns tours
- [ ] Regions API returns data
- [ ] Cart creation works

**Backend URL**: ____________________________________________

**Deployment ID/Version**: __________________________________

---

## Phase 4: Storefront Deployment (Next.js)

**Time Estimate**: 30-45 minutes

### 4.1 Connect Repository to Vercel

#### Via Vercel Dashboard

1. **Go to Vercel Dashboard**
   - Visit https://vercel.com/dashboard
   - Click "Add New" → "Project"

2. **Import Git Repository**
   - Select "Import Git Repository"
   - Choose GitHub
   - Search for: `med-usa-4wd` (or your repo name)
   - Click "Import"

3. **Configure project**
   - Framework Preset: **Next.js**
   - Root Directory: **`storefront`** (IMPORTANT!)
   - Build Command: Leave default (`next build`)
   - Output Directory: Leave default (`.next`)
   - Install Command: Leave default (`npm install`)

#### Via Vercel CLI

```bash
cd /Users/Karim/med-usa-4wd/storefront
vercel
# Follow prompts:
# - Link to existing project? No
# - Project name: med-usa-4wd-storefront
# - In which directory is your code? ./
# - Want to override settings? No
```

### 4.2 Configure Build Settings

Build settings should be auto-detected by Vercel:

- **Build Command**: `npm run build`
- **Output Directory**: `.next`
- **Install Command**: `npm install`
- **Development Command**: `npm run dev`

**Verify in Vercel dashboard**:
- Go to Project Settings → General
- Confirm build settings match above

### 4.3 Set Environment Variables

1. **In Vercel Dashboard**:
   - Go to Project → Settings → Environment Variables

2. **Add environment variables**:

   | Name | Value | Environment |
   |------|-------|-------------|
   | `NEXT_PUBLIC_MEDUSA_BACKEND_URL` | `https://your-backend-url.railway.app` | Production, Preview, Development |
   | `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | `pk_test_...` (test key for now) | Production, Preview, Development |
   | `NEXT_PUBLIC_SITE_URL` | `https://your-domain.com` | Production |
   | `NEXT_PUBLIC_SITE_URL` | `https://preview.vercel.app` | Preview |
   | `NEXT_PUBLIC_ANALYTICS_ENDPOINT` | `/api/analytics` | Production |
   | `NEXT_PUBLIC_DEV_ANALYTICS` | `false` | Production |

3. **Via Vercel CLI**:
   ```bash
   vercel env add NEXT_PUBLIC_MEDUSA_BACKEND_URL production
   # Paste: https://your-backend-url.railway.app

   vercel env add NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY production
   # Paste: pk_test_...

   vercel env add NEXT_PUBLIC_SITE_URL production
   # Paste: https://your-domain.com
   ```

4. **Verify all variables added**:
   ```bash
   vercel env ls
   ```

### 4.4 Point to Production Backend URL

Already done in step 4.3 via `NEXT_PUBLIC_MEDUSA_BACKEND_URL`.

**Verify**:
- Environment variable is set
- URL includes `https://`
- URL does NOT end with trailing slash
- URL is accessible (test with curl)

### 4.5 Deploy Storefront

#### Automatic Deployment (Recommended)

1. **Push to main branch**
   ```bash
   cd /Users/Karim/med-usa-4wd
   git add .
   git commit -m "Configure for production deployment"
   git push origin main
   ```

2. **Vercel auto-deploys** on push to main
   - Monitor at: https://vercel.com/dashboard

#### Manual Deployment

```bash
cd /Users/Karim/med-usa-4wd/storefront
vercel --prod
```

### 4.6 Verify Build Success

1. **Monitor build in Vercel dashboard**
   - Go to Deployments
   - Click on latest deployment
   - View build logs

2. **Expected build output**:
   ```
   Running "npm run build"

   > next build

   ✓ Linting and checking validity of types
   ✓ Compiled successfully
   ✓ Collecting page data
   ✓ Generating static pages (5/5)
   ✓ Finalizing page optimization

   Build completed successfully
   ```

3. **Check for errors**:
   - If build fails, check logs for:
     - TypeScript errors
     - Missing environment variables
     - Import errors
     - Next.js configuration issues

### 4.7 Test Site Loads

1. **Get deployment URL**
   - Check Vercel dashboard
   - Format: `https://med-usa-4wd-storefront-xxx.vercel.app`
   - Or custom domain if configured

2. **Visit site in browser**
   ```bash
   # Open in browser
   open https://your-deployment-url.vercel.app
   ```

3. **Verify pages load**:
   - [ ] Homepage loads
   - [ ] Tours page loads
   - [ ] Individual tour pages load
   - [ ] Contact page loads
   - [ ] About page loads

4. **Check browser console**:
   - Open DevTools (F12)
   - Console tab
   - Should have NO errors (warnings OK)

### 4.8 Test API Connectivity

1. **Test backend connection**
   - Open browser console on homepage
   - Check Network tab
   - Look for requests to backend API
   - Example: `GET /store/products`

2. **Verify data loading**:
   - Homepage should show tour cards
   - Tours should have correct titles, prices, images
   - If tours don't load:
     - Check console for CORS errors
     - Verify NEXT_PUBLIC_MEDUSA_BACKEND_URL is correct
     - Check backend STORE_CORS includes storefront URL

3. **Test pricing display**:
   - Verify tour prices show correctly
   - Example: Great Fraser Island Adventure should show $200
   - Prices should format with dollar sign and decimals

**Time to complete Phase 4**: Record actual time: _____________

**Phase 4 Verification**:
- [ ] Repository connected to Vercel
- [ ] Root directory set to `storefront`
- [ ] Build settings configured
- [ ] Environment variables set
- [ ] Backend URL configured
- [ ] Deployment successful
- [ ] Site loads without errors
- [ ] API connectivity working
- [ ] Tours display with correct pricing

**Storefront URL**: _________________________________________

**Deployment ID**: __________________________________________

---

## Phase 5: Stripe Production Setup

**Time Estimate**: 30-45 minutes

**WARNING**: This phase involves real money. Follow carefully and test with small amounts.

### 5.1 Switch from Test to Live Mode in Stripe

1. **Go to Stripe Dashboard**
   - Visit https://dashboard.stripe.com
   - Login with your Stripe account

2. **Activate live mode**:
   - Top right corner: Toggle from "Test mode" to "Live mode"
   - If prompted, complete business verification:
     - Business details
     - Bank account for payouts
     - Tax information
     - Identity verification

3. **Enable payment methods**:
   - Go to Settings → Payment methods
   - Enable:
     - [ ] Cards (Visa, Mastercard, Amex)
     - [ ] Apple Pay
     - [ ] Google Pay
   - Optional:
     - [ ] Afterpay/Clearpay (for installments)

4. **Complete business profile**:
   - Go to Settings → Business settings
   - Add:
     - Business name: "Med USA 4WD" (or legal entity name)
     - Business description
     - Contact email
     - Phone number
     - Support URL (your website)

### 5.2 Update Environment Variables with Live Keys

1. **Get live API keys**:
   - In Stripe Dashboard (Live mode)
   - Go to Developers → API keys
   - Copy:
     - **Publishable key** (starts with `pk_live_`)
     - **Secret key** (starts with `sk_live_`)

   **CRITICAL**: Keep secret key secure! Never commit to git.

2. **Update Railway backend variables**:
   ```bash
   railway variables set STRIPE_API_KEY="sk_live_..."
   # Paste your live secret key
   ```

3. **Update Vercel storefront variables**:
   ```bash
   vercel env add NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY production
   # Paste: pk_live_...
   ```

4. **Verify variables updated**:
   - Railway: `railway variables`
   - Vercel: Check dashboard → Settings → Environment Variables

5. **Redeploy applications**:
   ```bash
   # Trigger Railway redeploy
   railway up --detach

   # Trigger Vercel redeploy
   cd /Users/Karim/med-usa-4wd/storefront
   vercel --prod
   ```

### 5.3 Configure Webhooks for Production URLs

#### Why Webhooks Are Critical

Webhooks notify your backend when:
- Payment succeeds
- Payment fails
- Refund is processed
- Dispute is created

#### Get Webhook Signing Secret

1. **In Stripe Dashboard**:
   - Go to Developers → Webhooks
   - Click "Add endpoint"

2. **Configure endpoint**:
   - **Endpoint URL**: `https://your-backend-url.railway.app/hooks/stripe`
   - **Description**: "Med USA 4WD Production Webhook"
   - **Events to send**:
     - Select: `payment_intent.succeeded`
     - Select: `payment_intent.payment_failed`
     - Select: `charge.refunded`
     - Select: `charge.dispute.created`

3. **Save and get signing secret**:
   - Click "Add endpoint"
   - Copy webhook signing secret (starts with `whsec_`)
   - Save securely

4. **Update backend environment**:
   ```bash
   railway variables set STRIPE_WEBHOOK_SECRET="whsec_..."
   ```

5. **Redeploy backend**:
   ```bash
   railway up --detach
   ```

### 5.4 Test Webhook Delivery

1. **Send test webhook**:
   - In Stripe Dashboard → Webhooks
   - Click on your endpoint
   - Click "Send test webhook"
   - Select event: `payment_intent.succeeded`
   - Click "Send test webhook"

2. **Verify webhook received**:
   - Check Railway logs:
     ```bash
     railway logs
     ```
   - Look for: "Webhook received: payment_intent.succeeded"

3. **If webhook fails**:
   - Check endpoint URL is correct
   - Verify webhook secret matches
   - Check Railway logs for errors
   - Ensure backend is running

### 5.5 Perform Test Transaction in Live Mode

**IMPORTANT**: This will charge a real payment method. Use a small amount.

#### Create Test Order

1. **Visit your storefront**:
   ```
   https://your-domain.com
   ```

2. **Select tour**:
   - Choose "Great Fraser Island Adventure"
   - Select date (any future date)
   - Select number of passengers (1)
   - No addons
   - Click "Reserve Tour"

3. **Checkout flow**:
   - Fill contact information (use real email)
   - Fill billing information
   - Use real payment method (will be charged)
   - Amount should be minimum tour price

4. **Complete payment**:
   - Click "Complete Booking"
   - Payment should process
   - You should see confirmation page

#### Verify in Stripe Dashboard

1. **Check payment**:
   - Go to Stripe Dashboard → Payments
   - Should see recent payment
   - Status: "Succeeded"
   - Amount: Correct tour price

2. **Check customer**:
   - Go to Customers
   - Should see new customer created
   - Email matches what you entered

### 5.6 Verify Webhook Received

1. **Check Railway logs**:
   ```bash
   railway logs
   ```

2. **Look for webhook events**:
   ```
   [INFO] Webhook received: payment_intent.succeeded
   [INFO] Payment processed for order: order_...
   ```

3. **Verify in database**:
   ```bash
   psql "$DATABASE_URL"

   SELECT
     id,
     email,
     status,
     total,
     created_at
   FROM "order"
   ORDER BY created_at DESC
   LIMIT 1;
   ```

   Should show:
   - Recent order
   - Status: "completed"
   - Total matches payment

### 5.7 Refund Test Transaction

**IMPORTANT**: Always refund test transactions immediately.

1. **In Stripe Dashboard**:
   - Go to Payments
   - Click on test payment
   - Click "Refund payment"
   - Select "Full refund"
   - Reason: "Testing"
   - Click "Refund"

2. **Verify refund**:
   - Status changes to "Refunded"
   - Amount returned to payment method

3. **Check webhook fired**:
   ```bash
   railway logs
   ```
   Look for: `charge.refunded` webhook

4. **Verify in database**:
   ```sql
   SELECT
     id,
     refund_amount,
     refund_status
   FROM payment
   ORDER BY created_at DESC
   LIMIT 1;
   ```

**Time to complete Phase 5**: Record actual time: _____________

**Phase 5 Verification**:
- [ ] Stripe live mode activated
- [ ] Business details completed
- [ ] Payment methods enabled
- [ ] Live API keys obtained
- [ ] Backend environment updated with live keys
- [ ] Storefront environment updated with live keys
- [ ] Applications redeployed
- [ ] Webhook endpoint configured
- [ ] Webhook signing secret set
- [ ] Test webhook delivered successfully
- [ ] Test transaction completed in live mode
- [ ] Webhook received for payment
- [ ] Order created in database
- [ ] Test transaction refunded

**Stripe Webhook URL**: ______________________________________

**Test Payment Amount**: _____________________________________

**Test Payment ID**: _________________________________________

---

## Phase 6: DNS and Domain Setup

**Time Estimate**: 30 minutes (plus 24-48 hours for DNS propagation)

### 6.1 Point Domain to Hosting Platform

#### Configure Domain in Vercel

1. **Add domain to Vercel project**:
   - Go to Vercel Dashboard → Project → Settings → Domains
   - Click "Add"
   - Enter domain: `your-domain.com`
   - Click "Add"

2. **Choose DNS configuration method**:

   **Option A: Use Vercel nameservers (Recommended)**
   - Vercel provides: `ns1.vercel-dns.com`, `ns2.vercel-dns.com`
   - Benefits:
     - Automatic SSL
     - Automatic DNS updates
     - Faster propagation

   **Option B: Keep existing nameservers**
   - Configure DNS records manually (see below)
   - Update A/CNAME records to point to Vercel

#### If Using Vercel Nameservers

1. **Get Vercel nameservers**:
   - In Vercel Dashboard → Domains
   - Note nameservers shown

2. **Update domain registrar**:
   - Go to domain registrar (Namecheap, Google Domains, etc.)
   - Find "Nameservers" or "DNS" settings
   - Change from default to "Custom nameservers"
   - Enter Vercel nameservers:
     - `ns1.vercel-dns.com`
     - `ns2.vercel-dns.com`
   - Save changes

3. **Wait for propagation** (can take 24-48 hours)

#### If Using Custom DNS

1. **Get Vercel IPs**:
   - In Vercel Dashboard → Domains
   - Note IP addresses or CNAME target

2. **Configure DNS records**:

   | Type | Name | Value | TTL |
   |------|------|-------|-----|
   | A | @ | 76.76.21.21 | 300 |
   | CNAME | www | cname.vercel-dns.com | 300 |

   **Note**: Actual values from Vercel may differ. Use values shown in your dashboard.

### 6.2 Configure www Redirect

#### If Using Vercel

Vercel automatically handles www redirects. Choose preferred version:

1. **In Vercel Dashboard**:
   - Go to Project → Settings → Domains
   - Click on domain settings
   - Choose redirect:
     - `your-domain.com` → `www.your-domain.com` (redirect to www)
     - OR `www.your-domain.com` → `your-domain.com` (redirect to apex)

2. **Recommended**: Redirect www to apex (`your-domain.com`)
   - Shorter, cleaner URL
   - Better for SEO

### 6.3 Set Up API Subdomain (Optional)

If you want backend at `api.your-domain.com` instead of Railway default:

#### In Railway

1. **Add custom domain**:
   ```bash
   railway domain add api.your-domain.com
   ```

2. **Get DNS target**:
   - Railway provides CNAME target
   - Example: `xxx.railway.app`

#### In DNS Provider

1. **Add CNAME record**:

   | Type | Name | Value | TTL |
   |------|------|-------|-----|
   | CNAME | api | xxx.railway.app | 300 |

2. **Wait for DNS propagation**

3. **Update storefront environment**:
   ```bash
   vercel env add NEXT_PUBLIC_MEDUSA_BACKEND_URL production
   # Enter: https://api.your-domain.com

   # Redeploy
   vercel --prod
   ```

4. **Update backend CORS**:
   ```bash
   # Ensure STORE_CORS includes your-domain.com
   railway variables set STORE_CORS="https://your-domain.com,https://www.your-domain.com"

   railway up --detach
   ```

### 6.4 Wait for DNS Propagation

**Time Required**: 24-48 hours (typically 1-4 hours)

#### Check DNS Propagation

1. **Using dig command**:
   ```bash
   # Check A record
   dig your-domain.com A +short
   # Should show Vercel IPs

   # Check CNAME
   dig www.your-domain.com CNAME +short
   # Should show Vercel CNAME target
   ```

2. **Using online tools**:
   - Visit https://www.whatsmydns.net
   - Enter: `your-domain.com`
   - Select: A record
   - Check propagation globally

3. **Using nslookup**:
   ```bash
   nslookup your-domain.com
   # Should resolve to Vercel IPs
   ```

#### While Waiting

- DNS propagation happens gradually
- Different regions propagate at different speeds
- You may see old records for up to 48 hours
- Don't panic if site doesn't load immediately

### 6.5 Verify SSL Certificate Issued

Once DNS propagates, SSL certificates auto-issue.

#### In Vercel

1. **Check certificate status**:
   - Go to Project → Settings → Domains
   - Look for SSL status
   - Should show: "Certificate Valid"

2. **If certificate pending**:
   - DNS may still be propagating
   - Wait 5-10 minutes
   - Refresh page
   - If stuck > 1 hour:
     - Check DNS is correctly configured
     - Contact Vercel support

#### In Railway (if using custom domain)

1. **Check certificate**:
   - Go to project → Settings → Domains
   - SSL should show "Active"

### 6.6 Test HTTPS Access

Once SSL is issued:

1. **Visit site via HTTPS**:
   ```bash
   open https://your-domain.com
   ```

2. **Verify SSL certificate**:
   - Click padlock icon in browser
   - Certificate should be valid
   - Issued by: Let's Encrypt or similar
   - Valid for: your-domain.com

3. **Test HTTP redirect**:
   ```bash
   curl -I http://your-domain.com
   # Should return 301/308 redirect to https://
   ```

4. **Test all subdomains**:
   - [ ] `https://your-domain.com` - loads
   - [ ] `https://www.your-domain.com` - redirects or loads
   - [ ] `https://api.your-domain.com` - loads (if configured)

**Time to complete Phase 6**: Record actual time: _____________

**Phase 6 Verification**:
- [ ] Domain added to Vercel
- [ ] DNS records configured
- [ ] www redirect configured
- [ ] API subdomain configured (if applicable)
- [ ] DNS propagation complete
- [ ] SSL certificate issued
- [ ] HTTPS access working
- [ ] HTTP redirects to HTTPS
- [ ] All subdomains accessible

**Domain**: _________________________________________________

**DNS Propagation Completed**: ______________________________

**SSL Certificate Issuer**: _________________________________

---

## Phase 7: Final Verification

**Time Estimate**: 45-60 minutes

This phase is critical. Test everything before go-live.

### 7.1 Complete End-to-End Booking Flow

#### Test 1: Basic Tour Booking

1. **Visit homepage**:
   ```
   https://your-domain.com
   ```

2. **Select tour**:
   - Click "Great Fraser Island Adventure"
   - Verify page loads with correct information
   - Check hero image loads
   - Verify price displays: $200

3. **Book tour**:
   - Select date (tomorrow or future date)
   - Select passengers: 2
   - Click "Reserve Tour"

4. **Checkout page**:
   - Verify cart shows:
     - Great Fraser Island Adventure
     - 2 passengers
     - Date
     - Total: $400
   - Fill contact information:
     - Name
     - Email
     - Phone

5. **Payment**:
   - Use Stripe test card in production:
     - Card: 4242 4242 4242 4242
     - Exp: Any future date
     - CVC: Any 3 digits
     - ZIP: Any 5 digits
   - Click "Complete Booking"

6. **Confirmation**:
   - Should redirect to confirmation page
   - Verify shows:
     - Booking confirmation number
     - Tour details
     - Date
     - Passenger count
     - Total amount paid

7. **Check email**:
   - Confirmation email should arrive
   - Contains booking details

#### Test 2: Tour with Addons

1. **Select tour**: Noosa Hinterland Explorer ($150)
2. **Select date and passengers**: 1
3. **Add addon**: Select "Gourmet Picnic Lunch" (+$25)
4. **Verify cart total**: $175
5. **Complete checkout** using test card
6. **Verify confirmation** shows tour + addon

#### Test 3: Multiple Passengers

1. **Select tour**: Rainbow Beach Thrill Ride ($180)
2. **Select passengers**: 4
3. **Verify cart total**: $720 (4 x $180)
4. **Complete checkout**
5. **Verify confirmation**

### 7.2 Verify Pricing Displays Correctly

Check pricing throughout site:

- [ ] **Homepage**:
  - Tour cards show correct prices
  - Format: $XXX (with dollar sign)

- [ ] **Tours page**:
  - All tours have prices
  - Prices match expected values

- [ ] **Tour detail page**:
  - Main price prominent
  - Addon prices shown
  - Total updates when selecting addons

- [ ] **Cart page**:
  - Line items have correct prices
  - Subtotal calculates correctly
  - Tax calculated (if applicable)
  - Total is accurate

- [ ] **Confirmation page**:
  - Final amount matches what was charged

**Pricing Verification Table**:

| Tour | Expected Price | Display Price | Status |
|------|---------------|---------------|--------|
| Great Fraser Island Adventure | $200 | _____ | ☐ |
| Noosa Hinterland Explorer | $150 | _____ | ☐ |
| Rainbow Beach Thrill Ride | $180 | _____ | ☐ |
| Sunshine Coast Custom Tour | $250 | _____ | ☐ |
| Multi-Day Fraser Island | $600 | _____ | ☐ |

### 7.3 Complete Real Payment (Refund Immediately)

**Purpose**: Verify live payment processing works end-to-end.

1. **Create new booking**:
   - Select any tour
   - Use REAL payment method (your credit card)
   - Use minimum number of passengers
   - Complete checkout

2. **Verify payment in Stripe**:
   - Go to Stripe Dashboard → Payments
   - Find payment
   - Status: Succeeded
   - Amount: Correct

3. **Verify order in database**:
   ```bash
   railway run psql $DATABASE_URL -c "
     SELECT id, email, status, total
     FROM \"order\"
     ORDER BY created_at DESC
     LIMIT 1;
   "
   ```

4. **IMMEDIATELY refund**:
   - In Stripe Dashboard
   - Click payment → Refund
   - Full refund
   - Verify refund completes

5. **Verify refund webhook**:
   ```bash
   railway logs | grep "charge.refunded"
   ```

### 7.4 Check Order Created in Backend

1. **Connect to database**:
   ```bash
   railway run psql $DATABASE_URL
   ```

2. **Query recent orders**:
   ```sql
   SELECT
     o.id,
     o.email,
     o.status,
     o.total,
     o.created_at,
     COUNT(oi.id) as item_count
   FROM "order" o
   LEFT JOIN order_item oi ON o.id = oi.order_id
   GROUP BY o.id
   ORDER BY o.created_at DESC
   LIMIT 5;
   ```

3. **Verify order data**:
   - [ ] Order exists
   - [ ] Email correct
   - [ ] Status: "completed"
   - [ ] Total matches payment
   - [ ] Items counted correctly
   - [ ] Created timestamp recent

### 7.5 Verify Confirmation Page

Test confirmation page shows all necessary information:

- [ ] Booking confirmation number/ID
- [ ] Tour name
- [ ] Tour date
- [ ] Number of passengers
- [ ] Addons (if any)
- [ ] Total amount paid
- [ ] Customer name and email
- [ ] Next steps / what to expect
- [ ] Contact information if questions
- [ ] Social sharing buttons (optional)

### 7.6 Run PageSpeed Insights

**CRITICAL**: Must meet performance requirements.

1. **Test desktop**:
   ```bash
   open "https://pagespeed.web.dev/report?url=https://your-domain.com"
   ```

   Wait for results. Verify:
   - [ ] Performance score: **90+** ✅
   - [ ] LCP < 2.5s
   - [ ] FID < 100ms
   - [ ] CLS < 0.1

   **Record scores**:
   - Performance: _____
   - LCP: _____
   - FID: _____
   - CLS: _____

2. **Test mobile**:
   - Same URL, select "Mobile" tab
   - Verify:
     - [ ] Performance score: **90+** ✅
     - [ ] LCP < 4.0s
     - [ ] FID < 100ms
     - [ ] CLS < 0.1

   **Record scores**:
   - Performance: _____
   - LCP: _____
   - FID: _____
   - CLS: _____

3. **If scores < 90**:
   - STOP deployment
   - Review `/Users/Karim/med-usa-4wd/storefront/docs/performance/optimization-checklist.md`
   - Fix performance issues
   - Re-test
   - Do NOT proceed until 90+

### 7.7 Run SEO Audit

1. **PageSpeed SEO audit**:
   - Same PageSpeed results
   - Check SEO score
   - Should be: **95+**

2. **Manual SEO checks**:

   - [ ] **Title tags present**:
     ```bash
     curl -s https://your-domain.com | grep -o '<title>.*</title>'
     # Should show page title
     ```

   - [ ] **Meta description present**:
     ```bash
     curl -s https://your-domain.com | grep 'meta name="description"'
     ```

   - [ ] **Open Graph tags**:
     ```bash
     curl -s https://your-domain.com | grep 'og:'
     # Should show multiple OG tags
     ```

   - [ ] **Structured data present**:
     ```bash
     curl -s https://your-domain.com | grep 'application/ld+json'
     # Should find JSON-LD structured data
     ```

3. **Validate structured data**:
   - Visit: https://search.google.com/test/rich-results
   - Enter: `https://your-domain.com`
   - Click "Test URL"
   - Verify:
     - [ ] LocalBusiness schema valid
     - [ ] Organization schema valid
     - [ ] No errors

### 7.8 Test on Multiple Devices

#### Desktop Testing

- [ ] **Chrome** (latest):
  - Site loads
  - Booking flow works
  - No console errors

- [ ] **Firefox** (latest):
  - Site loads
  - Booking flow works
  - No console errors

- [ ] **Safari** (latest):
  - Site loads
  - Booking flow works
  - No console errors

- [ ] **Edge** (latest):
  - Site loads
  - Booking flow works
  - No console errors

#### Mobile Testing

**Real devices recommended. Emulation acceptable for initial testing.**

- [ ] **iPhone (Safari)**:
  - Site responsive
  - Touch targets adequate
  - Booking flow works
  - Stripe payment works

- [ ] **Android (Chrome)**:
  - Site responsive
  - Touch targets adequate
  - Booking flow works
  - Stripe payment works

#### Tablet Testing (Optional)

- [ ] **iPad**:
  - Layout adapts correctly
  - Booking flow works

### 7.9 Check Error Monitoring Working

If you set up error monitoring (Sentry, LogRocket, etc.):

1. **Trigger test error**:
   - Add `throw new Error("Test error")` to a page
   - Deploy
   - Visit page
   - Remove test error

2. **Verify error captured**:
   - Check error monitoring dashboard
   - Error should appear
   - Shows stack trace
   - Shows user context

### 7.10 Verify Analytics Tracking

If you set up analytics (Google Analytics, etc.):

1. **Visit site**:
   ```
   https://your-domain.com
   ```

2. **Check Real-Time reports**:
   - Go to Google Analytics
   - Check Real-Time → Overview
   - Should show 1 active user (you)

3. **Verify events tracked**:
   - Page views
   - Button clicks
   - Form submissions
   - Purchases (if configured)

4. **Check Web Vitals tracking**:
   - Console should show Web Vitals logs
   - Data should be sent to analytics endpoint
   - Verify in backend logs:
     ```bash
     railway logs | grep "web-vitals"
     ```

**Time to complete Phase 7**: Record actual time: _____________

**Phase 7 Verification**:
- [ ] End-to-end booking flow works
- [ ] Pricing displays correctly everywhere
- [ ] Real payment processed successfully
- [ ] Payment immediately refunded
- [ ] Order created in backend database
- [ ] Confirmation page shows all info
- [ ] PageSpeed desktop score 90+
- [ ] PageSpeed mobile score 90+
- [ ] SEO audit score 95+
- [ ] Structured data validated
- [ ] Tested on multiple browsers
- [ ] Tested on mobile devices
- [ ] Error monitoring capturing events
- [ ] Analytics tracking working

**Final PageSpeed Scores**:
- Desktop: _____
- Mobile: _____

**SEO Score**: _____

---

## Phase 8: Go-Live

**Time Estimate**: 30-45 minutes

### 8.1 Remove "Under Construction" Messages

1. **Search for placeholder text**:
   ```bash
   cd /Users/Karim/med-usa-4wd/storefront
   grep -r "under construction" app/ components/
   grep -r "coming soon" app/ components/
   grep -r "TODO" app/ components/
   ```

2. **Remove or replace**:
   - Delete test messages
   - Replace with final copy
   - Commit changes

3. **Final content review**:
   - [ ] Homepage copy finalized
   - [ ] Tour descriptions complete
   - [ ] About page content ready
   - [ ] Contact information correct
   - [ ] Legal pages present:
     - [ ] Terms of Service
     - [ ] Privacy Policy
     - [ ] Refund Policy

### 8.2 Submit Sitemap to Google Search Console

#### Create sitemap.xml

1. **Verify sitemap exists**:
   ```
   https://your-domain.com/sitemap.xml
   ```

2. **If doesn't exist, create**:
   ```typescript
   // app/sitemap.ts
   import { MetadataRoute } from 'next'

   export default function sitemap(): MetadataRoute.Sitemap {
     return [
       {
         url: 'https://your-domain.com',
         lastModified: new Date(),
         changeFrequency: 'weekly',
         priority: 1,
       },
       {
         url: 'https://your-domain.com/tours',
         lastModified: new Date(),
         changeFrequency: 'weekly',
         priority: 0.8,
       },
       {
         url: 'https://your-domain.com/about',
         lastModified: new Date(),
         changeFrequency: 'monthly',
         priority: 0.5,
       },
       {
         url: 'https://your-domain.com/contact',
         lastModified: new Date(),
         changeFrequency: 'monthly',
         priority: 0.5,
       },
     ]
   }
   ```

#### Submit to Google Search Console

1. **Go to Google Search Console**:
   - Visit: https://search.google.com/search-console
   - Add property: `your-domain.com`

2. **Verify ownership**:
   - Method: DNS verification (recommended)
   - Add TXT record to DNS:
     ```
     TXT @ google-site-verification=xxxxx
     ```
   - Click "Verify"

3. **Submit sitemap**:
   - Go to Sitemaps section
   - Enter: `https://your-domain.com/sitemap.xml`
   - Click "Submit"

4. **Verify submission**:
   - Status should change to "Success"
   - May take 24-48 hours to process

### 8.3 Update Google Business Profile

1. **Go to Google Business Profile**:
   - Visit: https://business.google.com
   - Sign in to your business account

2. **Update website URL**:
   - Click on business
   - Edit info
   - Website: `https://your-domain.com`
   - Save

3. **Add booking link** (if supported):
   - Some categories allow direct booking links
   - Add: `https://your-domain.com/tours`

4. **Update other info**:
   - Verify address correct
   - Verify phone correct
   - Verify hours correct
   - Add photos if not present

### 8.4 Announce on Social Media (If Applicable)

#### Prepare announcement

**Example template**:

```
We're thrilled to announce that Med USA 4WD Tours is now live! 🎉

Book your next adventure on the Sunshine Coast:
🚙 4WD Fraser Island tours
🌴 Hinterland explorations
🏖️ Rainbow Beach experiences

Book online today: https://your-domain.com

#SunshineCoast #FraserIsland #4WDTours #Adventure
```

#### Post on platforms

- [ ] **Facebook**:
  - Business page
  - Include booking link
  - Pin post

- [ ] **Instagram**:
  - Feed post with tour photos
  - Story with swipe-up link
  - Highlights collection

- [ ] **Twitter/X**:
  - Tweet announcement
  - Include link
  - Use relevant hashtags

- [ ] **LinkedIn** (if applicable):
  - Business update
  - Professional tone

### 8.5 Monitor Error Logs

**Critical for first few hours after launch.**

1. **Set up log monitoring**:
   ```bash
   # Terminal 1: Backend logs
   railway logs --follow

   # Terminal 2: Vercel logs
   vercel logs --follow
   ```

2. **Watch for errors**:
   - 500 errors
   - Payment failures
   - Database connection issues
   - CORS errors
   - API timeouts

3. **Set up alerts**:
   - Railway: Settings → Notifications
   - Vercel: Settings → Notifications
   - Email alerts for critical errors

### 8.6 Monitor Analytics

1. **Google Analytics Real-Time**:
   - Watch active users
   - Monitor page views
   - Track events

2. **Stripe Dashboard**:
   - Monitor payments
   - Watch for failed payments
   - Check for disputes

3. **Performance monitoring**:
   - Web Vitals dashboard
   - PageSpeed scores
   - Error rates

### 8.7 Be Ready for Issues

#### Create war room

- [ ] **Communication channel ready**:
  - Slack channel or similar
  - All team members joined

- [ ] **Contact list prepared**:
  - Technical lead
  - Backend developer
  - Frontend developer
  - DevOps/infrastructure
  - Customer support

- [ ] **Escalation procedure defined**:
  1. Issue reported
  2. Severity assessed
  3. Team notified
  4. Fix deployed OR rollback initiated
  5. Customers notified if needed

#### Common issues to watch for

- [ ] **High traffic**:
  - Site slow
  - Database connections maxed
  - Action: Scale up resources

- [ ] **Payment failures**:
  - Stripe webhook issues
  - CORS errors
  - Action: Check logs, verify webhook secret

- [ ] **Order creation failures**:
  - Database errors
  - Validation errors
  - Action: Check backend logs

- [ ] **Email delivery failures**:
  - SMTP issues
  - Email service down
  - Action: Check email provider status

**Time to complete Phase 8**: Record actual time: _____________

**Phase 8 Verification**:
- [ ] All placeholder text removed
- [ ] Content finalized
- [ ] Sitemap created and accessible
- [ ] Google Search Console verified
- [ ] Sitemap submitted to Google
- [ ] Google Business Profile updated
- [ ] Social media announcements posted
- [ ] Error monitoring active
- [ ] Analytics monitoring active
- [ ] Team on standby for issues
- [ ] Escalation procedure documented

**Go-Live Date and Time**: ____________________________________

**Team Members on Call**: ____________________________________

---

## Rollback Procedures

**When to Rollback**:
- Critical bugs affecting checkout
- Payment processing completely broken
- Site down for > 15 minutes
- Data corruption detected
- Security vulnerability discovered

**Decision Maker**: ___________________________________________

### Rollback 1: Frontend Deployment

**Time to Complete**: 5-10 minutes

#### Via Vercel Dashboard

1. **Go to Vercel**:
   - Dashboard → Project → Deployments

2. **Find previous working deployment**:
   - Should be marked with green checkmark
   - Note deployment before current

3. **Promote to production**:
   - Click "..." on previous deployment
   - Click "Promote to Production"
   - Confirm

4. **Verify rollback**:
   - Visit `https://your-domain.com`
   - Should show previous version
   - Test critical functionality

#### Via Vercel CLI

```bash
cd /Users/Karim/med-usa-4wd/storefront

# List recent deployments
vercel ls

# Promote specific deployment
vercel promote [deployment-url]

# Verify
curl -I https://your-domain.com
```

**Rollback Time**: ____________________________________________

### Rollback 2: Backend Deployment

**Time to Complete**: 5-10 minutes

#### Via Railway Dashboard

1. **Go to Railway**:
   - Project → Deployments

2. **Find previous deployment**:
   - List shows recent deployments
   - Note last working version

3. **Redeploy previous version**:
   - Click on previous deployment
   - Click "Redeploy"
   - Confirm

4. **Verify rollback**:
   ```bash
   curl https://your-backend-url.railway.app/health
   # Should return: {"status":"ok"}
   ```

#### Via Railway CLI

```bash
# List deployments
railway status

# Redeploy specific commit
railway up --detach [commit-hash]

# Verify
railway logs
```

#### Via Git

```bash
cd /Users/Karim/med-usa-4wd

# Find last working commit
git log --oneline

# Revert to previous commit
git revert HEAD
git push origin main

# Railway auto-deploys
# Monitor logs
railway logs --follow
```

**Rollback Time**: ____________________________________________

### Rollback 3: Database from Backup

**Time to Complete**: 15-30 minutes

**WARNING**: This will lose data created after backup.

#### Using Railway Backup

1. **Go to Railway**:
   - Project → PostgreSQL service
   - Click "Backups" tab

2. **Select backup to restore**:
   - Choose most recent working backup
   - Note backup time
   - Click "Restore"

3. **Confirm restoration**:
   - Type confirmation text
   - Click "Restore Backup"

4. **Wait for restoration** (5-15 minutes)

5. **Verify data**:
   ```bash
   railway run psql $DATABASE_URL -c "
     SELECT COUNT(*) FROM product;
   "
   # Should show expected count
   ```

#### Manual Restoration

If you have manual backup:

1. **Stop backend** (prevent writes):
   ```bash
   railway down
   ```

2. **Restore from SQL dump**:
   ```bash
   # Get backup file
   # Example: backup_20250110_120000.sql

   # Restore
   psql "$DATABASE_URL" < backup_20250110_120000.sql
   ```

3. **Verify restoration**:
   ```bash
   psql "$DATABASE_URL" -c "\dt"
   # Check tables exist
   ```

4. **Restart backend**:
   ```bash
   railway up --detach
   ```

**Rollback Time**: ____________________________________________

**Data Lost** (timestamp range): ______________________________

### Rollback 4: DNS (If Needed)

**Time to Complete**: 5 minutes (propagation: 24-48 hours)

Only needed if DNS changes caused issues.

1. **Go to DNS provider**

2. **Revert DNS changes**:
   - Restore previous A records
   - Restore previous CNAME records
   - Save changes

3. **Verify old records**:
   ```bash
   dig your-domain.com A +short
   # Should show old IP
   ```

4. **Wait for propagation**

**Note**: DNS rollback is rare. Usually not needed.

### Communication Plan

#### If Rollback Needed

1. **Notify team immediately**:
   ```
   🚨 ROLLBACK IN PROGRESS 🚨

   Issue: [description]
   Severity: [critical/high/medium]
   Action: Rolling back [frontend/backend/database]
   ETA: [time]
   Team member executing: [name]
   ```

2. **Post-rollback message**:
   ```
   ✅ ROLLBACK COMPLETE

   Status: [service] restored to previous version
   Verification: [passed/pending]
   Next steps: [investigation/fix]
   ```

#### If Customers Affected

**Email template**:

```
Subject: Brief Service Interruption - Med USA 4WD Tours

Dear [Customer],

We experienced a brief technical issue with our booking system today between [time] and [time].

If you made a booking during this time, please verify your confirmation email. If you did not receive confirmation, your booking may not have been completed.

Please contact us at [email/phone] and we'll assist you immediately.

We apologize for any inconvenience.

Best regards,
Med USA 4WD Tours Team
```

**Social media template**:

```
We experienced a brief technical issue that has now been resolved. All systems are operating normally. If you experienced any problems booking, please contact us at [email/phone]. Thank you for your patience.
```

### Recovery Time Estimates

| Scenario | Time to Rollback | Time to Fix | Total Downtime |
|----------|-----------------|-------------|----------------|
| Frontend bug | 5 mins | 30 mins | 35 mins |
| Backend bug | 5 mins | 60 mins | 65 mins |
| Database issue | 20 mins | 120 mins | 140 mins |
| DNS issue | 5 mins | 2-48 hours | 2-48 hours |
| Payment issue | 10 mins | 45 mins | 55 mins |

### Post-Rollback Actions

After successful rollback:

1. **Investigate root cause**:
   - Review logs
   - Identify bug
   - Document findings

2. **Create fix**:
   - Develop solution
   - Test thoroughly in staging
   - Code review

3. **Test fix**:
   - Deploy to staging
   - Full regression testing
   - Performance testing

4. **Re-deploy to production**:
   - Schedule deployment
   - Monitor closely
   - Have rollback ready again

5. **Post-mortem**:
   - Document incident
   - Timeline of events
   - Lessons learned
   - Prevention measures

---

## Post-Deployment Monitoring

### First 24 Hours Monitoring

**Critical monitoring period. Team should be on standby.**

#### Error Rate Monitoring

**Target**: < 0.1% error rate

1. **Monitor backend errors**:
   ```bash
   railway logs --follow | grep -i error
   ```

   Watch for:
   - Database connection errors
   - Payment processing errors
   - API errors
   - Timeout errors

2. **Monitor frontend errors**:
   ```bash
   vercel logs --follow
   ```

   Watch for:
   - Build errors
   - Runtime errors
   - API connection errors

3. **Set up error thresholds**:
   - Alert if error rate > 1%
   - Critical alert if error rate > 5%

#### Performance Metrics Monitoring

**Targets**:
- Response time < 200ms
- LCP < 2.5s
- FID < 100ms
- CLS < 0.1

1. **Monitor response times**:
   ```bash
   # Check API response times
   curl -w "@curl-format.txt" -o /dev/null -s https://your-backend-url.railway.app/store/products
   ```

   Create `curl-format.txt`:
   ```
   time_namelookup:  %{time_namelookup}\n
   time_connect:  %{time_connect}\n
   time_starttransfer:  %{time_starttransfer}\n
   time_total:  %{time_total}\n
   ```

2. **Monitor Core Web Vitals**:
   - Check Web Vitals dashboard
   - Review real user metrics
   - Compare to baseline

3. **Set up performance alerts**:
   - Alert if LCP > 3s
   - Alert if response time > 500ms

#### Payment Success Rate Monitoring

**Target**: > 95% success rate

1. **Monitor Stripe Dashboard**:
   - Go to Payments
   - Filter: Last 24 hours
   - Check success vs. failed ratio

2. **Check for patterns**:
   - Specific card types failing?
   - Specific amounts failing?
   - Webhook delays?

3. **Set up payment alerts**:
   - Alert if success rate < 90%
   - Alert on any charge dispute

#### User Activity Monitoring

1. **Monitor analytics**:
   - Google Analytics Real-Time
   - Active users
   - Page views per hour
   - Bounce rate

2. **Check user behavior**:
   - Are users completing bookings?
   - Where are they dropping off?
   - Average time on site

3. **Monitor traffic sources**:
   - Direct traffic
   - Social media referrals
   - Search engine traffic

#### Check for Broken Links

1. **Automated link checking**:
   ```bash
   # Install link checker
   npm install -g broken-link-checker

   # Check site
   blc https://your-domain.com -ro
   ```

2. **Manual checks**:
   - [ ] All navigation links work
   - [ ] Tour detail pages load
   - [ ] Checkout flow links work
   - [ ] Footer links work

3. **Fix broken links immediately**:
   - Update links in code
   - Deploy fix
   - Re-check

#### Review Analytics

1. **Daily metrics to track**:
   - Total visitors
   - Total page views
   - New vs. returning visitors
   - Conversion rate (visits → bookings)
   - Average booking value
   - Most viewed tours
   - Device breakdown (mobile vs. desktop)
   - Geographic distribution

2. **Create monitoring dashboard**:
   - Google Analytics dashboard
   - Stripe dashboard
   - Custom dashboard (if built)

3. **Set baseline metrics**:
   - Record first day numbers
   - Use as comparison for future

### First Week Monitoring

**Shift from critical to operational monitoring.**

#### Daily Performance Checks

**Schedule**: Every morning at same time

1. **Run PageSpeed audit**:
   ```bash
   npx lighthouse https://your-domain.com --preset=mobile --output=json > lighthouse_$(date +%Y%m%d).json
   ```

2. **Check scores**:
   - Performance: Should maintain 90+
   - SEO: Should maintain 95+
   - Accessibility: Should maintain 90+

3. **Track trends**:
   - Create spreadsheet with daily scores
   - Identify performance degradation
   - Address issues before they worsen

#### Review User Feedback

1. **Check email**:
   - Customer inquiries
   - Bug reports
   - Feature requests
   - Confusion points

2. **Social media**:
   - Comments on posts
   - Direct messages
   - Mentions
   - Reviews

3. **Analyze feedback**:
   - Common questions → Update FAQ
   - Usability issues → Create improvement tickets
   - Feature requests → Add to backlog

#### Monitor Conversion Rate

**Target**: Establish baseline first week

1. **Calculate conversion rate**:
   ```
   Conversion Rate = (Bookings / Total Visitors) × 100
   ```

2. **Track daily**:
   - Date
   - Visitors
   - Bookings
   - Conversion %

3. **Identify patterns**:
   - Best performing days
   - Worst performing days
   - Traffic source impact on conversion

4. **Optimize based on data**:
   - High traffic, low conversion → Improve UX
   - Low traffic, high conversion → Increase marketing
   - Certain tours not converting → Review pricing/description

#### Check SEO Indexing Status

1. **Google Search Console**:
   - Go to Coverage report
   - Check indexed pages
   - Fix any errors

2. **Check search results**:
   ```
   site:your-domain.com
   ```
   - Should show all main pages
   - May take 1-2 weeks to fully index

3. **Monitor search queries**:
   - What keywords bring traffic?
   - Ranking position
   - Click-through rate

4. **Optimize based on data**:
   - Low-ranking keywords → Improve content
   - High impressions, low clicks → Improve meta descriptions
   - Missed opportunities → Create new content

### Monitoring Tools

#### Essential Tools

1. **Google Analytics**:
   - Traffic monitoring
   - User behavior
   - Conversions

2. **Google Search Console**:
   - SEO monitoring
   - Index status
   - Search queries

3. **Stripe Dashboard**:
   - Payment monitoring
   - Revenue tracking
   - Failed payments

4. **PageSpeed Insights**:
   - Performance monitoring
   - Core Web Vitals
   - Optimization suggestions

#### Recommended Tools

1. **Uptime monitoring**:
   - UptimeRobot (free)
   - Pingdom
   - StatusCake

2. **Error tracking**:
   - Sentry
   - LogRocket
   - Rollbar

3. **Heat mapping**:
   - Hotjar
   - Crazy Egg
   - Microsoft Clarity

4. **A/B testing**:
   - Google Optimize
   - VWO
   - Optimizely

### Metrics to Track

**Daily** (First Week):
- [ ] Uptime %
- [ ] Error rate
- [ ] Response time
- [ ] Active users
- [ ] Total bookings
- [ ] Revenue
- [ ] Failed payments
- [ ] PageSpeed score

**Weekly** (Ongoing):
- [ ] Total visitors
- [ ] Conversion rate
- [ ] Average booking value
- [ ] Top tours
- [ ] Traffic sources
- [ ] Device breakdown
- [ ] New vs. returning visitors
- [ ] SEO rankings

**Monthly**:
- [ ] Revenue trends
- [ ] User growth
- [ ] Conversion rate trends
- [ ] Performance trends
- [ ] SEO progress
- [ ] Infrastructure costs
- [ ] Customer satisfaction

### Escalation Procedures

#### Severity Levels

**Critical** (Immediate action):
- Site completely down
- Payments not processing at all
- Data breach
- Security vulnerability

**High** (Action within 1 hour):
- Major feature broken
- High error rate (> 10%)
- Payment success rate < 50%
- Performance degradation (scores < 70)

**Medium** (Action within 4 hours):
- Minor feature broken
- Moderate error rate (1-10%)
- Payment success rate 50-90%
- Performance degradation (scores 70-89)

**Low** (Action within 24 hours):
- Cosmetic issues
- Low error rate (< 1%)
- Performance degradation (scores 90-94)

#### Escalation Chain

1. **On-call developer** (first responder)
2. **Technical lead** (if issue not resolved in 30 mins)
3. **DevOps/Infrastructure** (if infrastructure issue)
4. **Management** (if customer impact significant)

#### Contact Information

| Role | Name | Email | Phone | Availability |
|------|------|-------|-------|--------------|
| On-call Dev | _____ | _____ | _____ | 24/7 |
| Technical Lead | _____ | _____ | _____ | 9am-9pm |
| DevOps | _____ | _____ | _____ | On-call |
| Manager | _____ | _____ | _____ | 9am-6pm |

---

## Troubleshooting Guide

### Issue: Site Not Loading

**Symptoms**:
- Browser shows "Cannot connect"
- DNS error
- Timeout

**Diagnosis**:

1. **Check if it's just you**:
   ```bash
   # Check from different network
   curl -I https://your-domain.com

   # Or use online tool
   open "https://downforeveryoneorjustme.com/your-domain.com"
   ```

2. **Check DNS**:
   ```bash
   dig your-domain.com A +short
   # Should return IP address
   ```

3. **Check hosting status**:
   - Vercel: https://vercel-status.com
   - Railway: https://status.railway.app

**Solutions**:

- **DNS not resolving**:
  - Check DNS records in registrar
  - Wait for propagation (if recent change)
  - Contact DNS provider support

- **Hosting platform down**:
  - Check status page
  - Wait for resolution
  - Consider temporary redirect

- **SSL certificate expired**:
  - Check certificate:
    ```bash
    openssl s_client -connect your-domain.com:443 -servername your-domain.com
    ```
  - Renew certificate in Vercel settings

### Issue: Pages Load But No Tours Showing

**Symptoms**:
- Homepage loads but tour cards empty
- Tours page shows no results
- Console errors about API

**Diagnosis**:

1. **Check backend health**:
   ```bash
   curl https://your-backend-url.railway.app/health
   # Should return: {"status":"ok"}
   ```

2. **Check API endpoint**:
   ```bash
   curl https://your-backend-url.railway.app/store/products
   # Should return JSON with products
   ```

3. **Check browser console**:
   - Open DevTools (F12)
   - Console tab
   - Look for error messages

**Common Errors**:

- **CORS Error**:
  ```
  Access to fetch at '...' has been blocked by CORS policy
  ```

  **Solution**:
  ```bash
  # Update backend STORE_CORS
  railway variables set STORE_CORS="https://your-domain.com,https://www.your-domain.com"
  railway up --detach
  ```

- **API URL Wrong**:
  ```
  Failed to fetch
  ```

  **Solution**:
  ```bash
  # Check environment variable
  vercel env ls

  # Update if needed
  vercel env add NEXT_PUBLIC_MEDUSA_BACKEND_URL production
  # Enter correct URL

  # Redeploy
  vercel --prod
  ```

- **Backend Down**:
  ```bash
  # Check Railway logs
  railway logs

  # Restart if needed
  railway up --detach
  ```

### Issue: Prices Showing Incorrectly

**Symptoms**:
- Prices show as $0
- Prices show as $0.02 instead of $200
- Prices show as $20,000 instead of $200

**Diagnosis**:

1. **Check database prices**:
   ```bash
   railway run psql $DATABASE_URL -c "
     SELECT
       pv.title,
       p.amount,
       p.currency_code
     FROM price p
     JOIN product_variant pv ON p.variant_id = pv.id
     LIMIT 5;
   "
   ```

2. **Check expected format**:
   - Medusa v2: Prices in dollars (200 = $200)
   - Frontend: Converts to cents internally (200 → 20000 cents)

**Solutions**:

- **Prices in cents in database**:
  ```bash
  # Fix: Divide all prices by 100
  railway run psql $DATABASE_URL -c "
    UPDATE price SET amount = amount / 100;
  "

  # Restart backend
  railway up --detach
  ```

- **Prices not converting on frontend**:
  - Check `/Users/Karim/med-usa-4wd/storefront/lib/utils/pricing.ts`
  - Verify conversion functions used
  - Check component using price:
    ```typescript
    import { formatPrice, getProductPrice } from '@/lib/utils/pricing'

    // Usage
    const priceInCents = getProductPrice(product) // Converts dollars → cents
    const displayPrice = formatPrice(priceInCents) // Formats for display
    ```

### Issue: Checkout Fails

**Symptoms**:
- "Payment failed" error
- Stuck on checkout page
- Error after clicking "Complete Booking"

**Diagnosis**:

1. **Check Stripe status**:
   - Visit https://status.stripe.com
   - Check for outages

2. **Check browser console**:
   - Look for Stripe errors
   - Check network tab for failed requests

3. **Check backend logs**:
   ```bash
   railway logs | grep -i stripe
   # Look for errors
   ```

**Common Issues**:

- **Stripe Keys Wrong**:
  ```bash
  # Verify keys match (test/live)
  railway variables | grep STRIPE
  vercel env ls | grep STRIPE

  # Should both be pk_live_ and sk_live_
  # OR both be pk_test_ and sk_test_
  ```

- **Webhook Not Configured**:
  - Check Stripe Dashboard → Webhooks
  - Verify endpoint: `https://your-backend-url.railway.app/hooks/stripe`
  - Verify webhook secret matches environment variable

- **Amount Mismatch**:
  - Stripe expects amounts in cents (for USD)
  - Backend sends amount × 100
  - Check backend log for amount sent

### Issue: Orders Not Created in Database

**Symptoms**:
- Payment succeeds in Stripe
- No order in database
- No confirmation email

**Diagnosis**:

1. **Check Stripe webhook delivery**:
   - Go to Stripe Dashboard → Webhooks
   - Click on endpoint
   - Check "Recent deliveries"
   - Look for failed deliveries

2. **Check backend logs**:
   ```bash
   railway logs | grep -i webhook
   ```

3. **Check database**:
   ```bash
   railway run psql $DATABASE_URL -c "
     SELECT COUNT(*) FROM \"order\";
   "
   ```

**Solutions**:

- **Webhook not firing**:
  - Check webhook URL is correct
  - Verify endpoint is accessible:
    ```bash
    curl -X POST https://your-backend-url.railway.app/hooks/stripe \
      -H "Content-Type: application/json" \
      -d '{"type":"ping"}'
    ```

- **Webhook failing**:
  - Check webhook secret matches
  - Check backend error logs
  - Verify database connection

- **Race condition**:
  - User redirected before webhook processed
  - This is normal
  - Order should appear within 5 seconds
  - If not, issue with webhook

### Issue: Slow Performance

**Symptoms**:
- Pages load slowly
- PageSpeed score dropped
- Users complaining about speed

**Diagnosis**:

1. **Run PageSpeed Insights**:
   ```bash
   open "https://pagespeed.web.dev/report?url=https://your-domain.com"
   ```

2. **Check specific metrics**:
   - LCP > 2.5s?
   - FID > 100ms?
   - CLS > 0.1?

3. **Check backend response time**:
   ```bash
   curl -w "@curl-format.txt" -o /dev/null -s https://your-backend-url.railway.app/store/products
   ```

**Common Causes**:

- **Large images**:
  - Check image sizes
  - Optimize with:
    ```bash
    cd /Users/Karim/med-usa-4wd/storefront
    bash scripts/optimize-images.sh
    ```

- **Backend slow**:
  - Check database query performance
  - Check Railway metrics
  - Consider scaling up

- **Too much JavaScript**:
  - Run bundle analyzer:
    ```bash
    cd /Users/Karim/med-usa-4wd/storefront
    ANALYZE=true npm run build
    ```
  - Identify large bundles
  - Implement code splitting

- **Missing optimizations**:
  - Review `/Users/Karim/med-usa-4wd/storefront/docs/performance/optimization-checklist.md`
  - Re-implement required optimizations

### Issue: Emails Not Sending

**Symptoms**:
- No confirmation emails
- No notification emails

**Diagnosis**:

1. **Check email configuration**:
   - Verify email service credentials
   - Check environment variables

2. **Check backend logs**:
   ```bash
   railway logs | grep -i email
   ```

3. **Test email service**:
   - Send test email manually
   - Verify service is operational

**Solutions**:

- **Credentials expired**:
  - Regenerate credentials
  - Update environment variables
  - Redeploy

- **Rate limiting**:
  - Check email service dashboard
  - Upgrade plan if needed

- **Email service down**:
  - Check service status page
  - Wait for resolution
  - Consider backup service

### Issue: Database Connection Errors

**Symptoms**:
- "Connection refused" errors
- "Too many connections" errors
- Intermittent failures

**Diagnosis**:

1. **Check database status**:
   ```bash
   railway status
   # Check PostgreSQL service status
   ```

2. **Test connection**:
   ```bash
   psql "$DATABASE_URL"
   # Should connect
   ```

3. **Check connection count**:
   ```sql
   SELECT count(*) FROM pg_stat_activity;
   ```

**Solutions**:

- **Max connections reached**:
  - Scale up database
  - Implement connection pooling
  - Check for connection leaks

- **Database credentials changed**:
  - Get new DATABASE_URL from Railway
  - Update environment variable
  - Redeploy backend

- **Database down**:
  - Check Railway status
  - Contact Railway support
  - Consider failover if critical

### Getting Help

#### Railway Support

- Dashboard: "Help" button
- Discord: https://discord.gg/railway
- Email: team@railway.app

#### Vercel Support

- Dashboard: "Help" button
- Discord: https://vercel.com/discord
- Email: support@vercel.com

#### Stripe Support

- Dashboard: "Support" button
- Phone: Listed in dashboard
- Email: support@stripe.com

#### Medusa Support

- Discord: https://discord.gg/medusajs
- GitHub: https://github.com/medusajs/medusa/discussions
- Docs: https://docs.medusajs.com

---

## Deployment Checklist Summary

Print and check off during deployment:

### Pre-Deployment
- [ ] All tests passing
- [ ] PageSpeed 90+ (desktop & mobile)
- [ ] SEO audit 95+
- [ ] Database migrations tested
- [ ] Environment variables documented
- [ ] Backups created
- [ ] Rollback plan ready

### Infrastructure
- [ ] Hosting accounts created
- [ ] PostgreSQL database provisioned
- [ ] Domain purchased/configured
- [ ] SSL certificates will auto-provision
- [ ] Staging environment created

### Database
- [ ] Database created
- [ ] Migrations run successfully
- [ ] Seed data loaded
- [ ] Pricing data verified (dollars format)
- [ ] Connectivity tested
- [ ] Backups configured

### Backend
- [ ] Repository connected
- [ ] Build settings configured
- [ ] Environment variables set
- [ ] Deployment successful
- [ ] Health check passing
- [ ] API endpoints tested

### Storefront
- [ ] Repository connected
- [ ] Root directory set correctly
- [ ] Environment variables set
- [ ] Backend URL configured
- [ ] Deployment successful
- [ ] Site loads without errors

### Stripe
- [ ] Live mode activated
- [ ] Live API keys obtained
- [ ] Environment variables updated
- [ ] Webhooks configured
- [ ] Test transaction completed
- [ ] Test transaction refunded

### DNS
- [ ] Domain pointed to Vercel
- [ ] www redirect configured
- [ ] DNS propagation complete
- [ ] SSL certificates issued
- [ ] HTTPS working

### Final Verification
- [ ] End-to-end booking tested
- [ ] Pricing displays correctly
- [ ] Real payment processed & refunded
- [ ] PageSpeed 90+ confirmed
- [ ] SEO 95+ confirmed
- [ ] Multi-browser tested
- [ ] Mobile tested

### Go-Live
- [ ] Placeholder text removed
- [ ] Sitemap submitted
- [ ] Google Business updated
- [ ] Social media announced
- [ ] Monitoring active
- [ ] Team on standby

---

## Time Tracking

Record actual time for future reference:

| Phase | Estimated | Actual | Notes |
|-------|-----------|--------|-------|
| Pre-Deployment | 30-60 min | _____ | _____ |
| Infrastructure Setup | 60-90 min | _____ | _____ |
| Database Deployment | 20-30 min | _____ | _____ |
| Backend Deployment | 30-45 min | _____ | _____ |
| Storefront Deployment | 30-45 min | _____ | _____ |
| Stripe Setup | 30-45 min | _____ | _____ |
| DNS Setup | 30 min + 24-48 hrs | _____ | _____ |
| Final Verification | 45-60 min | _____ | _____ |
| Go-Live | 30-45 min | _____ | _____ |
| **Total** | **4-6 hours** | **_____** | _____ |

---

## Sign-Off

**Deployment Completed By**:

| Name | Role | Signature | Date |
|------|------|-----------|------|
| _____ | Technical Lead | _____ | _____ |
| _____ | Backend Developer | _____ | _____ |
| _____ | Frontend Developer | _____ | _____ |
| _____ | QA Engineer | _____ | _____ |
| _____ | Project Manager | _____ | _____ |

**Production URLs**:
- Storefront: _____________________________________________
- Backend API: ____________________________________________
- Admin Panel: ____________________________________________

**Deployment Notes**:
_________________________________________________________________
_________________________________________________________________
_________________________________________________________________

**Issues Encountered**:
_________________________________________________________________
_________________________________________________________________
_________________________________________________________________

**Lessons Learned**:
_________________________________________________________________
_________________________________________________________________
_________________________________________________________________

---

**Document Version**: 1.0
**Last Updated**: 2025-11-10
**Next Review**: Before next major deployment
