# Medusa Admin - Standalone Deployment on Vercel

Complete guide for deploying the Medusa Admin dashboard as a standalone application on Vercel, connecting to the Railway backend.

## Table of Contents

1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Quick Start](#quick-start)
4. [Detailed Setup](#detailed-setup)
5. [Deployment Methods](#deployment-methods)
6. [Environment Variables](#environment-variables)
7. [Railway Backend Configuration](#railway-backend-configuration)
8. [Custom Domain Setup](#custom-domain-setup)
9. [Troubleshooting](#troubleshooting)
10. [Maintenance](#maintenance)

---

## Overview

### Architecture

```
┌─────────────────────────────────────────────────────────┐
│                   Vercel Admin                          │
│        https://[your-admin].vercel.app                  │
│                                                          │
│  ┌────────────────────────────────────────────┐        │
│  │    Static Admin Dashboard                   │        │
│  │    (React SPA)                              │        │
│  └────────────────────────────────────────────┘        │
└─────────────────────────────────────────────────────────┘
                       ↓ API Calls
┌─────────────────────────────────────────────────────────┐
│                 Railway Backend                          │
│   https://4wd-tours-production.up.railway.app           │
│                                                          │
│  ┌──────────────┐    ┌──────────────┐                  │
│  │ Store API    │    │ Admin API    │                  │
│  │ /store/*     │    │ /admin/*     │                  │
│  └──────────────┘    └──────────────┘                  │
│                                                          │
│  ┌────────────────────────────────────────────┐        │
│  │         PostgreSQL Database                 │        │
│  └────────────────────────────────────────────┘        │
└─────────────────────────────────────────────────────────┘
```

### Key Features

- **Standalone Deployment**: Admin deployed separately from backend
- **Static Hosting**: Fast, global CDN delivery via Vercel
- **Secure**: No backend secrets in admin, authentication via Railway API
- **Cost-Effective**: Free Vercel hosting for hobby projects
- **Easy Updates**: Simple rebuild and redeploy process

---

## Prerequisites

### Required Accounts

- **Vercel Account**: Sign up at https://vercel.com (free tier available)
- **Railway Backend**: Backend must be deployed and running
- **Admin Credentials**: Create admin user on backend before deployment

### Required Tools

```bash
# Node.js 18+ (check version)
node --version  # Should be >= 18.0.0

# Vercel CLI (optional, can use npx)
npm install -g vercel

# Git (for version control)
git --version
```

### Backend Requirements

Your Railway backend MUST have:
- PostgreSQL database configured
- Admin API endpoints enabled
- CORS properly configured (we'll set this up)
- At least one admin user created

---

## Quick Start

### Option 1: Automated Deployment (Recommended)

```bash
# Navigate to admin directory
cd /Users/Karim/med-usa-4wd/admin

# Run automated build and deploy script
bash build-and-deploy.sh
```

This script will:
1. Build admin from parent Medusa project
2. Verify build output
3. Copy files to admin directory
4. Deploy to Vercel
5. Show you next steps

### Option 2: Manual Deployment

```bash
# 1. Build admin (from project root)
cd /Users/Karim/med-usa-4wd
npx medusa build --admin-only

# 2. Navigate to admin directory
cd admin

# 3. Copy build files
cp -r ../.medusa/admin/* .

# 4. Login to Vercel (first time only)
npx vercel login

# 5. Deploy to production
npx vercel --prod
```

---

## Detailed Setup

### Step 1: Build the Admin

The Medusa v2 admin can be built as a standalone application using the `--admin-only` flag.

```bash
# Navigate to project root
cd /Users/Karim/med-usa-4wd

# Build admin only
npx medusa build --admin-only
```

**Build Output:**
- Location: `.medusa/admin/`
- Size: ~8-10MB
- Contains: Static HTML, CSS, JavaScript, and assets

**Build Requirements:**
- All custom admin widgets must be in `src/admin/widgets/`
- No TypeScript errors in admin code
- Medusa CLI installed (@medusajs/cli)

### Step 2: Verify Build

```bash
# Check build directory exists
ls -la .medusa/admin/

# Should contain:
# - index.html
# - assets/
# - vercel.json (if previously configured)
```

### Step 3: Configure Vercel

The `vercel.json` in the admin directory is pre-configured with:

```json
{
  "name": "medusa-admin-4wd-tours",
  "framework": null,
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ],
  "env": {
    "MEDUSA_ADMIN_BACKEND_URL": "https://4wd-tours-production.up.railway.app"
  }
}
```

**Configuration Highlights:**
- **rewrites**: SPA routing - all routes serve index.html
- **env**: Backend URL for API calls
- **headers**: Security and caching headers
- **regions**: Sydney region for better performance in Australia

### Step 4: Deploy to Vercel

#### Using Vercel CLI (Recommended)

```bash
cd /Users/Karim/med-usa-4wd/admin

# First time: Login
npx vercel login
# Follow email verification

# Deploy to production
npx vercel --prod

# For preview deployment
npx vercel
```

#### Using Vercel Dashboard

1. **Create Git Repository (if not already done)**

```bash
cd /Users/Karim/med-usa-4wd/admin
git init
git add .
git commit -m "Initial admin setup"
```

2. **Push to GitHub**

```bash
# Create repo on GitHub first
git remote add origin https://github.com/your-org/medusa-admin-4wd.git
git branch -M main
git push -u origin main
```

3. **Import to Vercel**
   - Go to https://vercel.com/new
   - Import your repository
   - Configure:
     - **Framework**: Other
     - **Root Directory**: `./`
     - **Build Command**: `echo "Pre-built"`
     - **Output Directory**: `.`
   - Add environment variable:
     - Key: `MEDUSA_ADMIN_BACKEND_URL`
     - Value: `https://4wd-tours-production.up.railway.app`
   - Click "Deploy"

---

## Deployment Methods

### Method 1: Automated Script (Easiest)

```bash
cd /Users/Karim/med-usa-4wd/admin
bash build-and-deploy.sh
```

**Advantages:**
- One command does everything
- Automatic build verification
- Clear progress output
- Post-deployment instructions

### Method 2: Deploy Only (Build Already Done)

```bash
cd /Users/Karim/med-usa-4wd/admin
bash deploy-only.sh
```

Use this when:
- Admin is already built
- You just want to redeploy
- Faster than full build

### Method 3: Manual Deployment

```bash
# 1. Build
cd /Users/Karim/med-usa-4wd
npx medusa build --admin-only

# 2. Copy files
cd admin
rsync -av ../.medusa/admin/ .

# 3. Deploy
npx vercel --prod
```

### Method 4: Git-Based Continuous Deployment

Set up automatic deployment on every git push:

1. **Push admin directory to GitHub**
2. **Connect GitHub repo to Vercel**
3. **Configure Vercel to auto-deploy on push**

**Advantage:** Automatic deployments on every commit

---

## Environment Variables

### Vercel Environment Variables

#### Required Variables

```bash
MEDUSA_ADMIN_BACKEND_URL=https://4wd-tours-production.up.railway.app
```

#### Setting Variables via CLI

```bash
# Add variable to production
npx vercel env add MEDUSA_ADMIN_BACKEND_URL
# Enter value when prompted: https://4wd-tours-production.up.railway.app
# Select scope: Production

# List all variables
npx vercel env ls

# Pull variables to local .env
npx vercel env pull .env.local
```

#### Setting Variables via Dashboard

1. Go to https://vercel.com/dashboard
2. Select your project
3. Go to "Settings" → "Environment Variables"
4. Add:
   - **Key**: `MEDUSA_ADMIN_BACKEND_URL`
   - **Value**: `https://4wd-tours-production.up.railway.app`
   - **Scope**: Production, Preview, Development
5. Redeploy for changes to take effect

### Local Testing Variables

Create `.env.local` for local testing:

```bash
MEDUSA_ADMIN_BACKEND_URL=https://4wd-tours-production.up.railway.app
NODE_ENV=production
```

**Note:** Admin is a static build, so local testing requires a local server:

```bash
# Install a simple HTTP server
npm install -g serve

# Serve admin locally
cd /Users/Karim/med-usa-4wd/admin
serve -s . -l 3000
```

---

## Railway Backend Configuration

### Critical: Update CORS Settings

After deploying admin to Vercel, you MUST update Railway CORS to allow admin domain.

#### Step 1: Get Your Admin URL

After Vercel deployment, you'll see:

```
✅ Deployed to https://medusa-admin-4wd-tours-abc123.vercel.app
```

Copy this URL.

#### Step 2: Update Railway Variables

1. **Go to Railway Dashboard**
   - Visit: https://railway.app
   - Select your backend project
   - Click "Variables" tab

2. **Update ADMIN_CORS**

```bash
# Current value (example)
ADMIN_CORS=http://localhost:5173,http://localhost:9000

# New value (add your Vercel URL)
ADMIN_CORS=http://localhost:5173,http://localhost:9000,https://medusa-admin-4wd-tours-abc123.vercel.app
```

3. **Update AUTH_CORS**

```bash
# Current value (example)
AUTH_CORS=http://localhost:5173,http://localhost:9000

# New value (add your Vercel URL)
AUTH_CORS=http://localhost:5173,http://localhost:9000,https://medusa-admin-4wd-tours-abc123.vercel.app
```

4. **Save and Redeploy**
   - Railway automatically redeploys when variables change
   - Wait for redeployment to complete (~2-3 minutes)

#### Step 3: Verify CORS Configuration

```bash
# Test CORS from browser console (when on admin page)
fetch('https://4wd-tours-production.up.railway.app/admin/auth', {
  method: 'GET',
  credentials: 'include'
})
.then(r => console.log('CORS OK:', r.status))
.catch(e => console.error('CORS Error:', e))
```

If you see CORS errors, double-check:
- Railway variables are saved
- Backend has redeployed
- URLs in CORS match exactly (including https://)
- No trailing slashes in URLs

### Create Admin User

Before you can login, create an admin user on Railway:

```bash
# Option 1: Using Railway CLI
railway run npx medusa user --email admin@4wdtours.com.au --password YourSecurePassword123!

# Option 2: Using Railway Shell
railway shell
npx medusa user --email admin@4wdtours.com.au --password YourSecurePassword123!
exit

# Option 3: Using Medusa Admin API (after login via another admin)
curl -X POST https://4wd-tours-production.up.railway.app/admin/users \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "email": "newadmin@4wdtours.com.au",
    "password": "SecurePassword123!"
  }'
```

**Security Best Practices:**
- Use strong passwords (16+ characters)
- Mix uppercase, lowercase, numbers, symbols
- Store credentials in password manager
- Rotate passwords every 90 days

---

## Custom Domain Setup

### Option 1: Vercel Custom Domain

#### Step 1: Add Domain in Vercel

1. Go to Vercel Dashboard → Your Project
2. Click "Settings" → "Domains"
3. Add domain: `admin.4wdtours.com.au`
4. Vercel will show DNS records to add

#### Step 2: Configure DNS

Add these records to your DNS provider:

```
Type: CNAME
Name: admin
Value: cname.vercel-dns.com
TTL: 3600
```

Or for root domain:

```
Type: A
Name: @
Value: 76.76.21.21
```

#### Step 3: Wait for DNS Propagation

- Usually takes 5-30 minutes
- Vercel auto-provisions SSL certificate
- Check status in Vercel dashboard

#### Step 4: Update Railway CORS Again

```bash
# Add custom domain to CORS
ADMIN_CORS=http://localhost:5173,https://medusa-admin-4wd-tours-abc123.vercel.app,https://admin.4wdtours.com.au

AUTH_CORS=http://localhost:5173,https://medusa-admin-4wd-tours-abc123.vercel.app,https://admin.4wdtours.com.au
```

### Option 2: Railway Custom Domain (Backend)

If you want admin served from Railway (not recommended for v2):

```bash
# This would serve admin from Railway backend
# Not covered in this guide as we're using standalone deployment
```

---

## Troubleshooting

### Issue 1: Admin Shows Blank Page

**Symptoms:**
- White screen after deployment
- "Cannot read properties of undefined" in console

**Possible Causes:**
1. Asset paths incorrect
2. Environment variable not set
3. Backend not accessible

**Solutions:**

```bash
# Check console for errors
# Open browser DevTools (F12) → Console

# Verify environment variable
npx vercel env ls

# Check backend is accessible
curl https://4wd-tours-production.up.railway.app/health

# Rebuild and redeploy
cd /Users/Karim/med-usa-4wd
npx medusa build --admin-only
cd admin
npx vercel --prod
```

### Issue 2: CORS Errors on Login

**Symptoms:**
```
Access to XMLHttpRequest blocked by CORS policy
```

**Solutions:**

```bash
# 1. Verify Railway CORS includes your Vercel URL
railway variables | grep CORS

# 2. Check ADMIN_CORS and AUTH_CORS both have your URL
# Should look like:
# ADMIN_CORS=...,https://your-admin.vercel.app
# AUTH_CORS=...,https://your-admin.vercel.app

# 3. Update if needed
railway variables set ADMIN_CORS="...,https://your-admin.vercel.app"
railway variables set AUTH_CORS="...,https://your-admin.vercel.app"

# 4. Wait for Railway redeploy

# 5. Clear browser cache and try again
# Or use incognito mode
```

### Issue 3: Login Fails with "Invalid credentials"

**Possible Causes:**
1. Admin user doesn't exist
2. Wrong password
3. Backend database issue

**Solutions:**

```bash
# Create or reset admin user
railway run npx medusa user --email admin@4wdtours.com.au --password NewPassword123!

# Check Railway logs for errors
railway logs

# Test backend API directly
curl -X POST https://4wd-tours-production.up.railway.app/admin/auth \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@4wdtours.com.au",
    "password": "YourPassword"
  }'
```

### Issue 4: Deployment Fails

**Common Errors:**

**"Not authenticated"**
```bash
# Login to Vercel
npx vercel login
```

**"Project limit reached"**
- Upgrade Vercel plan
- Delete unused projects

**"Build failed"**
```bash
# Check build locally first
cd /Users/Karim/med-usa-4wd
npx medusa build --admin-only

# Fix any TypeScript errors
# Check src/admin/ directory
```

### Issue 5: Admin Shows Old Version

**Symptoms:**
- Changes not appearing
- Old admin widgets showing

**Solutions:**

```bash
# 1. Rebuild admin
cd /Users/Karim/med-usa-4wd
rm -rf .medusa/admin
npx medusa build --admin-only

# 2. Redeploy
cd admin
npx vercel --prod

# 3. Clear browser cache
# Hard refresh: Cmd+Shift+R (Mac) or Ctrl+Shift+R (Windows)

# 4. Verify new deployment
npx vercel list
```

---

## Maintenance

### Updating Admin After Code Changes

When you make changes to admin widgets or configuration:

```bash
# 1. Make changes to src/admin/ files
# Example: Edit src/admin/widgets/product-widget.tsx

# 2. Rebuild admin
cd /Users/Karim/med-usa-4wd
npx medusa build --admin-only

# 3. Use automated deployment
cd admin
bash build-and-deploy.sh

# Or manual deployment
npx vercel --prod
```

### Monitoring

#### Vercel Analytics

```bash
# Enable Vercel Analytics
# Go to Vercel Dashboard → Project → Analytics
# Toggle "Enable Analytics"
```

#### Check Deployment Logs

```bash
# View recent deployments
npx vercel list

# View logs for specific deployment
npx vercel logs [deployment-url]

# View real-time logs
npx vercel logs --follow
```

#### Monitor Backend Health

```bash
# Check backend status
curl https://4wd-tours-production.up.railway.app/health

# Check Railway logs
railway logs --follow
```

### Rollback Deployment

```bash
# List deployments
npx vercel list

# Promote a previous deployment to production
npx vercel promote [deployment-url]
```

### Security Maintenance

#### Rotate Admin Passwords

```bash
# Every 90 days, update admin passwords
railway run npx medusa user --email admin@4wdtours.com.au --reset-password
```

#### Review Access Logs

Check Vercel Analytics for:
- Unusual access patterns
- Failed login attempts
- Geographic distribution of access

#### Update Dependencies

```bash
# Update Vercel CLI
npm update -g vercel

# Update Medusa (parent project)
cd /Users/Karim/med-usa-4wd
npm update @medusajs/medusa
npm update @medusajs/admin-sdk

# Rebuild after updates
npx medusa build --admin-only
```

---

## Quick Reference

### Important URLs

| Service | URL |
|---------|-----|
| **Admin (Vercel)** | `https://[your-deployment].vercel.app` |
| **Backend API (Railway)** | `https://4wd-tours-production.up.railway.app` |
| **Store API** | `https://4wd-tours-production.up.railway.app/store` |
| **Admin API** | `https://4wd-tours-production.up.railway.app/admin` |
| **Storefront** | `https://4wd-tours-913f.vercel.app` |

### Essential Commands

```bash
# Build admin
cd /Users/Karim/med-usa-4wd && npx medusa build --admin-only

# Deploy to Vercel (automated)
cd /Users/Karim/med-usa-4wd/admin && bash build-and-deploy.sh

# Deploy to Vercel (manual)
cd /Users/Karim/med-usa-4wd/admin && npx vercel --prod

# View deployments
npx vercel list

# View logs
npx vercel logs [deployment-url]

# Create admin user
railway run npx medusa user --email admin@4wdtours.com.au --password [password]

# Update Railway CORS
railway variables set ADMIN_CORS="...,https://your-admin.vercel.app"
railway variables set AUTH_CORS="...,https://your-admin.vercel.app"
```

### File Locations

| File | Path |
|------|------|
| **Admin Directory** | `/Users/Karim/med-usa-4wd/admin/` |
| **Build Output** | `/Users/Karim/med-usa-4wd/.medusa/admin/` |
| **Admin Widgets** | `/Users/Karim/med-usa-4wd/src/admin/widgets/` |
| **Vercel Config** | `/Users/Karim/med-usa-4wd/admin/vercel.json` |
| **Package Config** | `/Users/Karim/med-usa-4wd/admin/package.json` |

---

## Support and Resources

### Documentation

- **Medusa v2 Docs**: https://docs.medusajs.com
- **Vercel Docs**: https://vercel.com/docs
- **Railway Docs**: https://docs.railway.app

### Local Documentation

- **Full Medusa Docs**: `/Users/Karim/med-usa-4wd/docs/medusa-llm/medusa-llms-full.txt`
- **Admin Deployment Guide**: `/Users/Karim/med-usa-4wd/docs/ADMIN-DEPLOYMENT-GUIDE.md`
- **Project README**: `/Users/Karim/med-usa-4wd/README.md`

### Getting Help

1. Check troubleshooting section above
2. Review Vercel deployment logs
3. Check Railway backend logs
4. Search Medusa Discord community
5. Review GitHub issues: https://github.com/medusajs/medusa

---

## Success Checklist

Before considering deployment complete:

- [ ] Admin built successfully with `npx medusa build --admin-only`
- [ ] Deployed to Vercel via CLI or dashboard
- [ ] Deployment URL obtained and saved
- [ ] Railway ADMIN_CORS updated with Vercel URL
- [ ] Railway AUTH_CORS updated with Vercel URL
- [ ] Railway backend redeployed
- [ ] Admin user created on Railway backend
- [ ] Can access admin URL in browser
- [ ] Login page loads without errors
- [ ] Can login with admin credentials
- [ ] Dashboard displays correctly
- [ ] Products list loads
- [ ] Can view/edit products
- [ ] No CORS errors in browser console
- [ ] Custom widgets load correctly
- [ ] Admin credentials saved in password manager

---

**Deployment Status**: Ready for Production
**Last Updated**: 2025-11-11
**Maintained By**: 4WD Tours Development Team
**Version**: 1.0.0
