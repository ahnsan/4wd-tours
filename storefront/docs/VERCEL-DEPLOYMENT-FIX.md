# Vercel Deployment Error Fix

## Diagnosis Summary

The Vercel deployment errors were caused by **CORS misconfiguration** and **missing environment variables**. The deployed frontend at Vercel could not communicate with the Railway backend due to CORS restrictions.

### Root Causes Identified

1. **CORS Configuration Missing Vercel URLs**
   - Backend CORS only allowed `localhost:8000`
   - Vercel deployment URLs were not in the allowed origins list
   - Result: All API requests from Vercel frontend were blocked by CORS

2. **Missing Environment Variables in vercel.json**
   - Only backend URL was configured
   - Publishable API key, region ID, and Stripe key were missing
   - Result: Frontend couldn't authenticate with Medusa backend

3. **Missing Railway Backend in Next.js Image Configuration**
   - `next.config.js` only had localhost patterns for images
   - Railway backend URL not in `remotePatterns`
   - Result: Product images failed to load

## Errors Explained

### "Tours not loading"
- **Cause**: CORS blocking API requests from Vercel to Railway backend
- **HTTP Status**: 401 or 403 errors in browser console
- **Fix**: Added Vercel URLs to backend CORS configuration

### "Server Components render error"
- **Cause**: Missing `NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY` environment variable
- **Result**: Medusa SDK couldn't authenticate requests
- **Fix**: Added all required env vars to `vercel.json`

### "Vendor and common JS bundle errors"
- **Cause**: Webpack chunk loading failures due to API initialization errors
- **Result**: Cascade failure when Medusa SDK couldn't initialize
- **Fix**: Proper environment variable configuration

## Files Modified

### 1. Backend Configuration (Railway)

**File**: `/Users/Karim/med-usa-4wd/.env`

```env
# OLD
STORE_CORS=http://localhost:8000,https://docs.medusajs.com

# NEW
STORE_CORS=http://localhost:8000,https://docs.medusajs.com,https://4wd-tours-913f.vercel.app,https://4wd-tours-913f-4320n76kh-ahnsans-projects.vercel.app,https://*.vercel.app
```

### 2. Storefront Production Environment

**File**: `/Users/Karim/med-usa-4wd/storefront/.env.production`

```env
# OLD (pointed to localhost)
NEXT_PUBLIC_MEDUSA_BACKEND_URL=http://localhost:9000
NEXT_PUBLIC_API_URL=http://localhost:9000
NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY=pk_34de56e6f305b46e6d22bb1d2d3304bd9eea498066ca7749bd667318dca31ffc

# NEW (points to Railway backend)
NEXT_PUBLIC_MEDUSA_BACKEND_URL=https://4wd-tours-production.up.railway.app
NEXT_PUBLIC_API_URL=https://4wd-tours-production.up.railway.app
NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY=pk_c1aea896aab279e937a2375566b06bfda34775b149b33353ca77eb3e8588a91b
NEXT_PUBLIC_DEFAULT_REGION_ID=reg_01K9G4HA190556136E7RJQ4411
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_51SRbgoRAcUUTBTrPbVEAI7o7K7x4B7tD6J0hpW0o0358868Xn1CuHux99GaeTGVv2LBlThpYLcpDUxHFmVnSDR4F00hmJK5WzS
```

### 3. Next.js Configuration

**File**: `/Users/Karim/med-usa-4wd/storefront/next.config.js`

Added Railway backend to image remote patterns:

```javascript
remotePatterns: [
  // ... existing localhost patterns ...
  {
    protocol: 'https',
    hostname: '4wd-tours-production.up.railway.app',
    pathname: '/uploads/**',
  },
  {
    protocol: 'https',
    hostname: '4wd-tours-production.up.railway.app',
    pathname: '/static/**',
  },
  {
    protocol: 'https',
    hostname: '**.up.railway.app',
    pathname: '/uploads/**',
  },
  {
    protocol: 'https',
    hostname: '**.up.railway.app',
    pathname: '/static/**',
  },
  // ... other patterns ...
]
```

### 4. Vercel Configuration

**File**: `/Users/Karim/med-usa-4wd/storefront/vercel.json`

Added all required environment variables:

```json
{
  "env": {
    "NEXT_PUBLIC_MEDUSA_BACKEND_URL": "https://4wd-tours-production.up.railway.app",
    "NEXT_PUBLIC_API_URL": "https://4wd-tours-production.up.railway.app",
    "NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY": "pk_c1aea896aab279e937a2375566b06bfda34775b149b33353ca77eb3e8588a91b",
    "NEXT_PUBLIC_DEFAULT_REGION_ID": "reg_01K9G4HA190556136E7RJQ4411",
    "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY": "pk_test_51SRbgoRAcUUTBTrPbVEAI7o7K7x4B7tD6J0hpW0o0358868Xn1CuHux99GaeTGVv2LBlThpYLcpDUxHFmVnSDR4F00hmJK5WzS"
  },
  "build": {
    "env": {
      "NEXT_PUBLIC_MEDUSA_BACKEND_URL": "https://4wd-tours-production.up.railway.app",
      "NEXT_PUBLIC_API_URL": "https://4wd-tours-production.up.railway.app",
      "NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY": "pk_c1aea896aab279e937a2375566b06bfda34775b149b33353ca77eb3e8588a91b",
      "NEXT_PUBLIC_DEFAULT_REGION_ID": "reg_01K9G4HA190556136E7RJQ4411",
      "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY": "pk_test_51SRbgoRAcUUTBTrPbVEAI7o7K7x4B7tD6J0hpW0o0358868Xn1CuHux99GaeTGVv2LBlThpYLcpDUxHFmVnSDR4F00hmJK5WzS"
    }
  }
}
```

## Commands to Fix the Issues

### Step 1: Update Backend CORS on Railway

```bash
# SSH into Railway or use Railway CLI
railway link

# Update the environment variable
railway variables set STORE_CORS="http://localhost:8000,https://docs.medusajs.com,https://4wd-tours-913f.vercel.app,https://4wd-tours-913f-4320n76kh-ahnsans-projects.vercel.app,https://*.vercel.app"

# Restart the backend
railway restart
```

**OR manually update via Railway Dashboard:**

1. Go to https://railway.app
2. Select your project: `4wd-tours-production`
3. Go to Variables tab
4. Update `STORE_CORS` to include:
   ```
   http://localhost:8000,https://docs.medusajs.com,https://4wd-tours-913f.vercel.app,https://4wd-tours-913f-4320n76kh-ahnsans-projects.vercel.app,https://*.vercel.app
   ```
5. Click "Deploy" to restart with new variables

### Step 2: Update Vercel Environment Variables

**Via Vercel Dashboard** (RECOMMENDED):

1. Go to https://vercel.com
2. Select your project: `4wd-tours-913f`
3. Go to Settings → Environment Variables
4. Add/Update these variables for **Production**, **Preview**, and **Development**:

```
NEXT_PUBLIC_MEDUSA_BACKEND_URL=https://4wd-tours-production.up.railway.app
NEXT_PUBLIC_API_URL=https://4wd-tours-production.up.railway.app
NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY=pk_c1aea896aab279e937a2375566b06bfda34775b149b33353ca77eb3e8588a91b
NEXT_PUBLIC_DEFAULT_REGION_ID=reg_01K9G4HA190556136E7RJQ4411
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_51SRbgoRAcUUTBTrPbVEAI7o7K7x4B7tD6J0hpW0o0358868Xn1CuHux99GaeTGVv2LBlThpYLcpDUxHFmVnSDR4F00hmJK5WzS
```

**Via Vercel CLI**:

```bash
# Install Vercel CLI if needed
npm i -g vercel

# Login to Vercel
vercel login

# Link to project
vercel link

# Add environment variables
vercel env add NEXT_PUBLIC_MEDUSA_BACKEND_URL production
# Enter: https://4wd-tours-production.up.railway.app

vercel env add NEXT_PUBLIC_API_URL production
# Enter: https://4wd-tours-production.up.railway.app

vercel env add NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY production
# Enter: pk_c1aea896aab279e937a2375566b06bfda34775b149b33353ca77eb3e8588a91b

vercel env add NEXT_PUBLIC_DEFAULT_REGION_ID production
# Enter: reg_01K9G4HA190556136E7RJQ4411

vercel env add NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY production
# Enter: pk_test_51SRbgoRAcUUTBTrPbVEAI7o7K7x4B7tD6J0hpW0o0358868Xn1CuHux99GaeTGVv2LBlThpYLcpDUxHFmVnSDR4F00hmJK5WzS
```

### Step 3: Deploy Updated Code to Vercel

```bash
# From the storefront directory
cd /Users/Karim/med-usa-4wd/storefront

# Commit the configuration changes
git add .env.production vercel.json next.config.js
git commit -m "fix: Update deployment configuration for Vercel and Railway

- Add Vercel URLs to backend CORS configuration
- Update production environment variables with Railway backend
- Add Railway backend to Next.js image remote patterns
- Include all required env vars in vercel.json

Fixes:
- Tours not loading (CORS error)
- Server Components render error (missing env vars)
- Image loading from Railway backend"

# Push to trigger Vercel deployment
git push origin main
```

**OR trigger manual deployment**:

```bash
# Deploy directly using Vercel CLI
vercel --prod
```

### Step 4: Verify the Deployment

```bash
# Test the deployed frontend
curl -I https://4wd-tours-913f.vercel.app

# Test tours page
curl https://4wd-tours-913f.vercel.app/tours

# Test API connectivity from browser console
# Open https://4wd-tours-913f.vercel.app in browser
# Open DevTools Console and run:
# fetch('https://4wd-tours-production.up.railway.app/store/products?publishableApiKey=pk_c1aea896aab279e937a2375566b06bfda34775b149b33353ca77eb3e8588a91b').then(r => r.json()).then(console.log)
```

## Verification Checklist

After deployment, verify:

- [ ] **Backend CORS updated on Railway** - Vercel URLs added to `STORE_CORS`
- [ ] **Railway backend restarted** - New CORS settings active
- [ ] **Vercel env vars updated** - All 5 required variables set
- [ ] **Storefront code deployed** - Latest code with updated configs
- [ ] **Tours page loads** - https://4wd-tours-913f.vercel.app/tours shows products
- [ ] **No CORS errors** - Check browser console for errors
- [ ] **Images load correctly** - Product thumbnails display
- [ ] **API calls succeed** - Network tab shows 200 responses
- [ ] **Cart functionality works** - Can add items to cart
- [ ] **No Server Component errors** - Pages render without errors

## Testing the Fix

### 1. Check Backend API (Railway)

```bash
# Test health endpoint
curl https://4wd-tours-production.up.railway.app/health

# Test store products with publishable key
curl "https://4wd-tours-production.up.railway.app/store/products?publishableApiKey=pk_c1aea896aab279e937a2375566b06bfda34775b149b33353ca77eb3e8588a91b"
```

### 2. Check Frontend (Vercel)

Open browser DevTools and navigate to:
- https://4wd-tours-913f.vercel.app
- https://4wd-tours-913f.vercel.app/tours

**Check Console for:**
- No CORS errors
- No 401 authentication errors
- No undefined environment variables

**Check Network tab for:**
- API requests to Railway backend
- 200 status codes
- Proper JSON responses

### 3. Test User Flow

1. Open https://4wd-tours-913f.vercel.app
2. Navigate to Tours page
3. Verify tours are displayed
4. Click on a tour to view details
5. Try adding to cart
6. Verify cart updates

## Environment Variable Reference

### Required in Vercel Dashboard

| Variable | Value | Purpose |
|----------|-------|---------|
| `NEXT_PUBLIC_MEDUSA_BACKEND_URL` | `https://4wd-tours-production.up.railway.app` | Backend API base URL |
| `NEXT_PUBLIC_API_URL` | `https://4wd-tours-production.up.railway.app` | API URL (same as backend) |
| `NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY` | `pk_c1aea896aab279e937a2375566b06bfda34775b149b33353ca77eb3e8588a91b` | Medusa API authentication |
| `NEXT_PUBLIC_DEFAULT_REGION_ID` | `reg_01K9G4HA190556136E7RJQ4411` | Australia region ID |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | `pk_test_51SRbgoRAcUUTBTrPbVEAI7o...` | Stripe payment integration |

### Required in Railway Backend

| Variable | Value | Purpose |
|----------|-------|---------|
| `STORE_CORS` | `http://localhost:8000,https://docs.medusajs.com,https://4wd-tours-913f.vercel.app,https://4wd-tours-913f-4320n76kh-ahnsans-projects.vercel.app,https://*.vercel.app` | Allowed frontend origins |

## Troubleshooting

### If tours still don't load:

1. **Check browser console** - Look for specific error messages
2. **Verify Railway CORS** - Ensure backend has new CORS settings
3. **Check Vercel env vars** - Confirm all 5 variables are set
4. **Clear cache** - Try hard refresh (Ctrl+Shift+R / Cmd+Shift+R)
5. **Check Network tab** - Verify API requests are being made
6. **Verify backend is running** - Check Railway dashboard

### Common Issues:

**CORS error persists:**
- Railway backend may not have restarted
- CORS variable may not have saved correctly
- Check Railway logs for CORS messages

**401 Unauthorized:**
- Publishable API key is incorrect or missing
- Verify key matches between Vercel and Railway

**Tours show as empty:**
- Backend database may be empty
- Check if seed data was loaded on Railway
- Verify products exist in Medusa admin

**Images don't load:**
- Check `next.config.js` has Railway patterns
- Redeploy frontend after updating config
- Verify image URLs in API responses

## Next Steps

After fixing these issues:

1. **Monitor deployment** - Watch for any new errors
2. **Test all features** - Verify cart, checkout, etc.
3. **Set up monitoring** - Add error tracking (Sentry, etc.)
4. **Update documentation** - Document any additional issues
5. **Performance testing** - Run Lighthouse audits
6. **SEO verification** - Ensure metadata is correct

## Additional Resources

- [Vercel Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)
- [Railway Environment Variables](https://docs.railway.app/develop/variables)
- [Medusa CORS Configuration](https://docs.medusajs.com/learn/fundamentals/api-routes/cors)
- [Next.js Image Optimization](https://nextjs.org/docs/app/building-your-application/optimizing/images)

## Summary

All configuration files have been updated. To complete the fix:

1. **Deploy updated code to Vercel** (git push or vercel CLI)
2. **Update CORS on Railway backend** (Railway dashboard or CLI)
3. **Verify environment variables in Vercel** (dashboard Settings)
4. **Test the deployment** (open browser and check)

The root cause was CORS blocking API requests. With these changes, the Vercel frontend should successfully connect to the Railway backend.
