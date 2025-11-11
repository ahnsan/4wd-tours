# Medusa Admin Deployment Guide - Vercel

**Date**: 2025-11-11
**Status**: READY FOR DEPLOYMENT
**Admin Build Location**: `/Users/Karim/med-usa-4wd/.medusa/admin/`

---

## Executive Summary

This guide provides complete instructions for deploying the Medusa Admin dashboard to Vercel as a separate static application. The admin has been successfully built and configured with all necessary files.

**Deployment Status:**
- ✅ Admin built successfully (8.2MB)
- ✅ Vercel configuration created
- ✅ Environment variables prepared
- ⏳ Awaiting Vercel authentication and deployment

---

## Pre-Deployment Checklist

### Completed ✅
- [x] Admin dashboard built with `npx medusa build --admin-only`
- [x] Build output verified in `.medusa/admin/` directory
- [x] Vercel configuration file created (`vercel.json`)
- [x] `.vercelignore` file created
- [x] Backend URL identified (Railway)
- [x] Vercel CLI verified (v48.9.0 available via npx)

### Required Before Deployment 📋
- [ ] Verify Railway backend is running and accessible
- [ ] Ensure Railway CORS includes the Vercel admin domain
- [ ] Have Vercel account credentials ready
- [ ] Decide on production domain name for admin

---

## Backend Configuration

### Current Backend Setup

**Backend Location**: Railway
**Expected URL**: `https://medusaecomm-production.up.railway.app`

**Required Environment Variables on Backend (Railway):**
```bash
# CORS Configuration - Must include admin domain
ADMIN_CORS=http://localhost:5173,https://[your-admin-domain].vercel.app
AUTH_CORS=http://localhost:5173,https://[your-admin-domain].vercel.app

# Store API CORS
STORE_CORS=http://localhost:8000,https://4wd-tours-913f.vercel.app,https://*.vercel.app

# Database & Redis
DATABASE_URL=[your-railway-postgres-url]
REDIS_URL=[your-railway-redis-url]

# Security Secrets
JWT_SECRET=[your-jwt-secret]
COOKIE_SECRET=[your-cookie-secret]

# Stripe (if using payments)
STRIPE_API_KEY=[your-stripe-key]
STRIPE_WEBHOOK_SECRET=[your-stripe-webhook-secret]
```

**⚠️ CRITICAL**: After deploying admin, you MUST update `ADMIN_CORS` and `AUTH_CORS` on Railway to include the deployed Vercel URL.

---

## Deployment Instructions

### Method 1: Vercel CLI (Recommended)

**Step 1: Navigate to Admin Directory**
```bash
cd /Users/Karim/med-usa-4wd/.medusa/admin
```

**Step 2: Login to Vercel**
```bash
npx vercel login
```
- Follow the authentication prompts
- Verify email if first time

**Step 3: Deploy to Vercel**

**For Initial Deployment (Preview):**
```bash
npx vercel
```

**For Production Deployment:**
```bash
npx vercel --prod
```

**Step 4: Configure Environment Variables**

During deployment, Vercel will ask questions:
- **Set up and deploy**: Yes
- **Which scope**: Choose your Vercel account/team
- **Link to existing project**: No (first deployment)
- **Project name**: `medusa-admin-4wd-tours` (or your choice)
- **Directory**: `.` (current directory)
- **Override settings**: No (use vercel.json)

**Step 5: Add Environment Variable via CLI (if needed)**
```bash
npx vercel env add MEDUSA_ADMIN_BACKEND_URL
```
Enter value: `https://medusaecomm-production.up.railway.app`

Choose scope: Production, Preview, Development (select Production)

---

### Method 2: Vercel Dashboard (Alternative)

**Step 1: Create Git Repository (if not exists)**
```bash
cd /Users/Karim/med-usa-4wd/.medusa/admin
git init
git add .
git commit -m "Initial admin build for Vercel deployment"
```

**Step 2: Push to GitHub**
```bash
# Create a new repository on GitHub first
git remote add origin https://github.com/[your-username]/medusa-admin-4wd.git
git branch -M main
git push -u origin main
```

**Step 3: Import to Vercel**
1. Go to https://vercel.com/new
2. Import your GitHub repository
3. Configure:
   - **Framework Preset**: Other
   - **Root Directory**: `./` (if using admin-only repo)
   - **Build Command**: `echo "Already built"`
   - **Output Directory**: `.`
4. Add Environment Variable:
   - `MEDUSA_ADMIN_BACKEND_URL` = `https://medusaecomm-production.up.railway.app`
5. Click **Deploy**

---

## Post-Deployment Steps

### 1. Verify Deployment

**Check Admin URL:**
```bash
# Your admin will be available at:
https://[project-name]-[random-hash].vercel.app
# or your custom domain
```

**Test Access:**
1. Visit the admin URL
2. Check browser console for errors
3. Verify assets load (check Network tab)

### 2. Update Backend CORS

**On Railway:**
1. Go to your Railway project
2. Navigate to Variables
3. Update `ADMIN_CORS`:
   ```
   ADMIN_CORS=http://localhost:5173,https://[your-deployed-admin].vercel.app
   ```
4. Update `AUTH_CORS`:
   ```
   AUTH_CORS=http://localhost:5173,https://[your-deployed-admin].vercel.app
   ```
5. Redeploy Railway service

### 3. Test Admin Login

**Create Admin User (if not exists):**
```bash
# On your local backend or via Railway CLI
npx medusa user -e admin@4wd-tours.com -p [secure-password]
```

**Test Login:**
1. Go to deployed admin URL
2. Click "Sign in"
3. Enter admin credentials
4. Verify successful login
5. Check dashboard loads correctly

### 4. Verify Backend Connection

**Test Checklist:**
- [ ] Admin login successful
- [ ] Products list loads
- [ ] Orders list loads (if any orders exist)
- [ ] Customers list loads
- [ ] Can create/edit products
- [ ] No CORS errors in console
- [ ] No authentication errors

---

## Configuration Files

### vercel.json
Location: `/Users/Karim/med-usa-4wd/.medusa/admin/vercel.json`

```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "version": 2,
  "name": "medusa-admin-4wd-tours",
  "buildCommand": "echo 'Admin already built'",
  "outputDirectory": ".",
  "framework": null,
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ],
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=3600, must-revalidate"
        }
      ]
    },
    {
      "source": "/assets/(.*)",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=31536000, immutable"
        }
      ]
    }
  ],
  "env": {
    "MEDUSA_ADMIN_BACKEND_URL": "https://medusaecomm-production.up.railway.app"
  }
}
```

### .vercelignore
```
node_modules
.git
.DS_Store
*.log
```

---

## Build Information

### Build Command Used
```bash
npx medusa build --admin-only
```

### Build Output
- **Location**: `/Users/Karim/med-usa-4wd/.medusa/admin/`
- **Size**: 8.2MB
- **Files**: 321 assets + index.html
- **Status**: ✅ Build successful with minor warnings

### Build Warnings (Non-Critical)
```
[@medusajs/admin-vite-plugin] 'zone' property is not a valid injection zone.
[@medusajs/admin-vite-plugin] 'zone' property is missing from the widget config.
```
*These warnings are related to custom admin widgets and don't affect deployment.*

---

## Custom Domain Setup (Optional)

### Configure Custom Domain on Vercel

**Step 1: Add Domain in Vercel Dashboard**
1. Go to Project Settings → Domains
2. Add domain: `admin.4wd-tours.com`
3. Copy the DNS records Vercel provides

**Step 2: Configure DNS**
Add these records to your DNS provider:
```
Type: CNAME
Name: admin
Value: cname.vercel-dns.com
```

**Step 3: Update Backend CORS**
Update Railway environment variables:
```bash
ADMIN_CORS=http://localhost:5173,https://admin.4wd-tours.com
AUTH_CORS=http://localhost:5173,https://admin.4wd-tours.com
```

**Step 4: Wait for DNS Propagation**
- Usually takes 5-30 minutes
- Check status in Vercel dashboard
- SSL certificate will be auto-provisioned

---

## Troubleshooting

### Issue: 404 Error on Admin Routes

**Symptom**: Admin loads but clicking routes gives 404

**Solution**: Verify `rewrites` in vercel.json are configured (already done)

### Issue: CORS Errors

**Symptom**: Console shows CORS errors, can't login

**Solution**:
1. Check Railway `ADMIN_CORS` includes your Vercel URL
2. Ensure `AUTH_CORS` also includes your Vercel URL
3. Restart Railway service after updating

### Issue: Assets Not Loading

**Symptom**: Blank page, assets fail to load

**Solution**:
1. Check asset paths in index.html
2. Verify `outputDirectory: "."` in vercel.json
3. Check Vercel build logs for errors

### Issue: Backend Connection Failed

**Symptom**: "Cannot connect to backend" error

**Solution**:
1. Verify Railway backend is running
2. Test backend URL directly: `https://medusaecomm-production.up.railway.app/health`
3. Check `MEDUSA_ADMIN_BACKEND_URL` environment variable in Vercel
4. Verify backend is not blocking Vercel IPs

### Issue: Admin Won't Build

**Symptom**: `medusa build --admin-only` fails

**Solution**:
1. Check Node.js version (requires Node 18+)
2. Clear `.medusa` directory: `rm -rf .medusa`
3. Rebuild: `npx medusa build --admin-only`
4. Check for TypeScript errors in `src/admin/`

---

## Security Considerations

### Admin Access
- **Change default admin password** immediately after first login
- Use strong passwords (16+ characters, mixed case, numbers, symbols)
- Enable 2FA if available in future Medusa versions
- Restrict admin access to trusted networks (use Vercel's IP allowlist if needed)

### Environment Variables
- **Never commit** `.env` files with secrets
- **Always use** Vercel's environment variable management
- **Rotate secrets** regularly (JWT_SECRET, COOKIE_SECRET)
- **Use different secrets** for production vs development

### CORS Configuration
- **Be specific** with CORS domains (avoid wildcards in production)
- **Always use HTTPS** for production admin
- **Review CORS** settings after any domain changes

---

## Maintenance

### Updating Admin

When you update Medusa or admin code:

**Step 1: Rebuild Admin**
```bash
cd /Users/Karim/med-usa-4wd
npx medusa build --admin-only
```

**Step 2: Redeploy to Vercel**
```bash
cd .medusa/admin
npx vercel --prod
```

Or use Vercel's Git integration for automatic deployments.

### Monitoring

**Check Admin Health:**
- Monitor Vercel Analytics for usage
- Check browser console for JavaScript errors
- Monitor backend logs for admin API errors
- Set up Vercel alerts for downtime

---

## Success Criteria

**Deployment is successful when:**
- ✅ Admin loads without errors at Vercel URL
- ✅ Admin login works with correct credentials
- ✅ Dashboard displays all sections (Products, Orders, Customers)
- ✅ Can view product list
- ✅ Can create/edit products
- ✅ No CORS errors in browser console
- ✅ Backend connection confirmed (API calls succeed)
- ✅ All admin widgets load correctly

---

## Quick Command Reference

```bash
# Build admin
cd /Users/Karim/med-usa-4wd
npx medusa build --admin-only

# Deploy to Vercel (production)
cd .medusa/admin
npx vercel --prod

# Check Vercel deployment status
npx vercel list

# View deployment logs
npx vercel logs [deployment-url]

# Add environment variable
npx vercel env add MEDUSA_ADMIN_BACKEND_URL

# Create admin user (on backend)
npx medusa user -e admin@4wd-tours.com -p [password]
```

---

## Next Steps

1. **Deploy Admin to Vercel**
   - Run: `cd .medusa/admin && npx vercel --prod`
   - Authenticate with Vercel
   - Note deployed URL

2. **Update Backend CORS on Railway**
   - Add deployed admin URL to `ADMIN_CORS`
   - Add deployed admin URL to `AUTH_CORS`
   - Redeploy Railway service

3. **Test Admin Functionality**
   - Login to deployed admin
   - Verify all features work
   - Test product management
   - Check for console errors

4. **Configure Custom Domain (Optional)**
   - Set up `admin.4wd-tours.com`
   - Update DNS records
   - Update CORS again with custom domain

5. **Document Credentials**
   - Save admin URL in password manager
   - Store admin credentials securely
   - Share with team if needed

---

## Support Resources

- **Medusa Documentation**: https://docs.medusajs.com
- **Vercel Documentation**: https://vercel.com/docs
- **Railway Documentation**: https://docs.railway.app
- **Project README**: `/Users/Karim/med-usa-4wd/README.md`

---

**Generated**: 2025-11-11
**Status**: READY FOR DEPLOYMENT
**Action Required**: Run `npx vercel --prod` from `.medusa/admin` directory
