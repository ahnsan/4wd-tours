# Medusa Admin - Quick Start Guide

Deploy your Medusa admin to Vercel in 5 minutes.

## Prerequisites

- Vercel account (free tier is fine)
- Railway backend running at `https://4wd-tours-production.up.railway.app`
- Admin user created on backend

## Three Steps to Deploy

### Step 1: Deploy to Vercel (2 minutes)

```bash
cd /Users/Karim/med-usa-4wd/admin
bash build-and-deploy.sh
```

When prompted:
- **Login to Vercel**: Follow email verification
- **Project name**: Accept default or enter custom name
- **Deploy**: Confirm production deployment

**Save your deployment URL** - you'll need it for Step 2.

Example: `https://medusa-admin-4wd-tours-abc123.vercel.app`

### Step 2: Update Railway CORS (2 minutes)

```bash
# Replace with YOUR actual Vercel URL from Step 1
railway variables set ADMIN_CORS="http://localhost:5173,http://localhost:9000,https://medusa-admin-4wd-tours-abc123.vercel.app"

railway variables set AUTH_CORS="http://localhost:5173,http://localhost:9000,https://medusa-admin-4wd-tours-abc123.vercel.app"
```

Wait 2-3 minutes for Railway to redeploy.

### Step 3: Test Admin Login (1 minute)

1. Open your admin URL in browser
2. Login with admin credentials
3. Verify dashboard loads
4. Check products list works

**Done!** Your admin is now live.

---

## No Railway CLI? Use Dashboard

### Update CORS via Railway Dashboard

1. Go to https://railway.app
2. Select your project
3. Click "Variables"
4. Edit `ADMIN_CORS`:
   - Add `,https://your-vercel-url.vercel.app` to the end
5. Edit `AUTH_CORS`:
   - Add `,https://your-vercel-url.vercel.app` to the end
6. Wait for automatic redeploy

---

## Troubleshooting

### CORS Errors on Login

**Fix:** Check Railway CORS variables include your exact Vercel URL (with `https://`)

### Admin Shows Blank Page

**Fix:** Check browser console for errors, verify backend URL in environment variables

### Can't Login

**Fix:** Create admin user on Railway:
```bash
railway run npx medusa user --email admin@4wdtours.com.au --password YourPassword123!
```

---

## Full Documentation

See complete guides:
- **README.md** - Full deployment guide
- **RAILWAY-CORS-SETUP.md** - Detailed CORS configuration
- **package.json** - NPM scripts reference

---

## Quick Commands

```bash
# Deploy
cd /Users/Karim/med-usa-4wd/admin
bash build-and-deploy.sh

# Check deployment status
npx vercel list

# View logs
npx vercel logs

# Update CORS (replace URL with yours)
railway variables set ADMIN_CORS="...,https://your-admin.vercel.app"
railway variables set AUTH_CORS="...,https://your-admin.vercel.app"
```

---

**Ready to Deploy?** Run `bash build-and-deploy.sh` now!
