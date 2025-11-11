# Quick Fix Checklist - System Integration Issues

**Date**: November 11, 2025
**Estimated Time**: 40 minutes total

---

## CRITICAL: Backend is DOWN (502 Errors)

### Step 1: Restore Backend Service (15 minutes)

**Check Railway Logs**:
```bash
railway logs
```

**Look for**:
- Out of memory errors
- Database connection errors
- Uncaught exceptions
- Port binding issues

**Check Service Status**:
```bash
railway status
```

**Verify Critical Environment Variables**:
```bash
railway variables | grep -E "DATABASE_URL|REDIS_URL|JWT_SECRET|COOKIE_SECRET"
```

**Required Variables**:
- [ ] `DATABASE_URL` is set and points to Railway PostgreSQL
- [ ] `REDIS_URL` is set and points to Railway Redis
- [ ] `JWT_SECRET` is at least 64 characters
- [ ] `COOKIE_SECRET` is at least 64 characters

**Restart Service**:
```bash
railway restart
```

**Wait 30 seconds, then test**:
```bash
curl https://4wd-tours-production.up.railway.app/health
# Expected: "OK"
```

**If health check fails**:
```bash
# Check build logs
railway logs --build

# Try redeploying
railway up

# Check database migrations
railway run npx medusa db:migrate
```

---

### Step 2: Enable Admin Dashboard (10 minutes)

**Check DISABLE_ADMIN variable**:
```bash
railway variables | grep DISABLE_ADMIN
```

**If set to "true", change to "false"**:
```bash
railway variables set DISABLE_ADMIN=false
```

**If not set at all, that's fine (defaults to enabled)**

**Update ADMIN_CORS for production**:
```bash
railway variables set ADMIN_CORS="http://localhost:5173,http://localhost:9000,https://4wd-tours-production.up.railway.app"
```

**Restart backend**:
```bash
railway restart
```

**Wait 30 seconds, then test**:
```bash
curl -I https://4wd-tours-production.up.railway.app/app
# Expected: HTTP/2 200 (not 404)
```

**If admin still returns 404**:
```bash
# Check if admin was built
railway run ls -la .medusa/admin

# If missing, rebuild
railway up --detach

# Check build logs for admin build step
railway logs --build | grep -i "admin"
```

**Create admin user (if needed)**:
```bash
railway run npx medusa user -e admin@sunshinecoast4wdtours.com -p YourSecurePassword123!
```

---

### Step 3: Fix CORS Configuration (5 minutes)

**Update AUTH_CORS**:
```bash
railway variables set AUTH_CORS="http://localhost:5173,http://localhost:9000,https://4wd-tours-913f.vercel.app,https://4wd-tours-production.up.railway.app"
```

**Restart backend**:
```bash
railway restart
```

**No additional testing needed yet - will verify in Step 4**

---

### Step 4: Verify Integration (10 minutes)

**Test 1: Backend Health**:
```bash
curl https://4wd-tours-production.up.railway.app/health
# Expected: "OK"
```
- [ ] Passed

**Test 2: Products Endpoint**:
```bash
curl -H "x-publishable-api-key: pk_c1aea896aab279e937a2375566b06bfda34775b149b33353ca77eb3e8588a91b" \
  https://4wd-tours-production.up.railway.app/store/products?limit=2
# Expected: JSON with products array
```
- [ ] Passed

**Test 3: Regions Endpoint**:
```bash
curl -H "x-publishable-api-key: pk_c1aea896aab279e937a2375566b06bfda34775b149b33353ca77eb3e8588a91b" \
  https://4wd-tours-production.up.railway.app/store/regions
# Expected: JSON with regions array containing "Australia"
```
- [ ] Passed

**Test 4: Cart Creation**:
```bash
curl -X POST \
  -H "x-publishable-api-key: pk_c1aea896aab279e937a2375566b06bfda34775b149b33353ca77eb3e8588a91b" \
  -H "Content-Type: application/json" \
  -d '{"region_id":"reg_01K9S1YB6T87JJW43F5ZAE8HWG"}' \
  https://4wd-tours-production.up.railway.app/store/carts
# Expected: JSON with cart object and cart.id
```
- [ ] Passed

**Test 5: Admin Dashboard Access**:
```bash
# Open in browser
https://4wd-tours-production.up.railway.app/app
# Expected: Admin login page (not 404 error)
```
- [ ] Passed

**Test 6: Admin Login**:
```
1. Visit: https://4wd-tours-production.up.railway.app/app
2. Enter admin credentials
3. Verify dashboard loads
4. Check browser console for errors
```
- [ ] Passed
- [ ] No CORS errors in console
- [ ] Dashboard loads products
- [ ] Can navigate to different sections

**Test 7: Frontend to Backend**:
```
1. Visit: https://4wd-tours-913f.vercel.app
2. Open browser console
3. Click any "BOOK NOW" button
4. Verify no CORS errors
5. Check that booking flow starts
```
- [ ] Passed
- [ ] No CORS errors in console
- [ ] Booking modal/flow opens

---

## Troubleshooting

### If Backend Still Returns 502

**Possible Causes**:

1. **Out of Memory**:
   - Check Railway plan (need 2GB+ RAM)
   - Upgrade plan if on Hobby tier with < 2GB

2. **Database Connection Issues**:
   ```bash
   # Test database connection
   railway run psql $DATABASE_URL -c "SELECT 1;"
   ```

3. **Redis Connection Issues**:
   ```bash
   # Verify Redis URL
   railway variables | grep REDIS_URL
   ```

4. **Port Issues**:
   - Medusa uses port 9000 by default
   - Railway should auto-detect this
   - Check `railway.json` or `Procfile`

5. **Build Failed**:
   ```bash
   # Check build logs
   railway logs --build

   # Look for TypeScript errors
   # Look for dependency installation errors
   ```

### If Admin Returns 404

**Possible Causes**:

1. **Admin Not Built**:
   ```bash
   # Verify admin build command
   cat railway.json
   # Should have: "buildCommand": "yarn build"

   # Rebuild
   railway up
   ```

2. **DISABLE_ADMIN is true**:
   ```bash
   # Check and fix
   railway variables | grep DISABLE_ADMIN
   railway variables set DISABLE_ADMIN=false
   railway restart
   ```

3. **Build Script Missing Admin**:
   ```bash
   # Check package.json
   cat package.json | grep '"build"'
   # Should run: medusa build (which builds both API and admin)
   ```

### If CORS Errors Persist

**In Browser Console**:
```
Access to fetch at 'https://4wd-tours-production.up.railway.app/...'
from origin 'https://4wd-tours-913f.vercel.app' has been blocked by CORS policy
```

**Fix**:
```bash
# Verify STORE_CORS includes frontend URL
railway variables | grep STORE_CORS
# Should contain: https://4wd-tours-913f.vercel.app

# If not, update:
railway variables set STORE_CORS="https://4wd-tours-913f.vercel.app,https://*.vercel.app"

# Restart
railway restart
```

---

## Success Criteria

All checkboxes must be checked:

### Backend
- [ ] Health check returns "OK"
- [ ] Products endpoint returns data
- [ ] Regions endpoint returns data
- [ ] Cart creation works
- [ ] No 502 errors

### Admin
- [ ] /app returns 200 (not 404)
- [ ] Login page loads
- [ ] Can authenticate
- [ ] Dashboard shows data
- [ ] No console errors

### Frontend
- [ ] Homepage loads (already working)
- [ ] Add-ons API works (already working)
- [ ] No CORS errors
- [ ] Booking flow starts
- [ ] Can create cart

### Integration
- [ ] Frontend → Backend communication works
- [ ] Admin → Backend communication works
- [ ] Database queries execute
- [ ] Redis connectivity works
- [ ] Full booking flow completes

---

## After Restoration - Next Steps

### 1. Implement Add-ons Feature

**In Admin Dashboard**:
```
1. Products → Create Product
2. Name: "Camping Equipment" (example)
3. Set price in AUD
4. Category: "Add-ons"
5. Save

Repeat for:
- Meal packages
- Photography services
- Extra activities
```

### 2. Associate Add-ons with Tours

**In Admin Dashboard**:
```
1. Products → Select Tour Product
2. Related Products section
3. Add relevant add-ons
4. Save
```

### 3. Test Complete Flow

**Customer Journey**:
```
1. Visit storefront
2. Select tour
3. Click "BOOK NOW"
4. Verify add-ons appear
5. Select add-ons
6. Add to cart
7. Proceed to checkout
8. Complete test purchase
```

### 4. Set Up Monitoring

**Railway Monitoring**:
```
1. Enable Railway metrics
2. Set up health check alerts
3. Configure memory alerts
4. Set up log aggregation
```

**External Monitoring** (Optional):
```
1. UptimeRobot for uptime monitoring
2. Sentry for error tracking
3. LogRocket for session replay
4. Google Analytics for user tracking
```

---

## Quick Reference

**Railway Commands**:
```bash
railway login              # Login to Railway
railway link               # Link to project
railway status             # Check service status
railway logs               # View logs
railway logs --build       # View build logs
railway variables          # List all variables
railway restart            # Restart service
railway run <command>      # Run command in Railway environment
railway up                 # Deploy latest code
```

**Test Commands**:
```bash
# Health check
curl https://4wd-tours-production.up.railway.app/health

# Products
curl -H "x-publishable-api-key: pk_c1aea896aab279e937a2375566b06bfda34775b149b33353ca77eb3e8588a91b" \
  https://4wd-tours-production.up.railway.app/store/products

# Admin check
curl -I https://4wd-tours-production.up.railway.app/app
```

---

## Documentation

**Full Reports**:
- Comprehensive analysis: `/docs/SYSTEM-INTEGRATION-REPORT.md`
- Executive summary: `/docs/INTEGRATION-EXECUTIVE-SUMMARY.md`

**Deployment Guides**:
- Admin deployment: `/docs/DEPLOYMENT-QUICK-START.md`
- Full deployment docs: `/docs/DEPLOYMENT-DOCUMENTATION-REPORT.md`

**Medusa Documentation**:
- Local docs: `/docs/medusa-llm/medusa-llms-full.txt`
- Online docs: https://docs.medusajs.com

---

## Support

**Railway**:
- Dashboard: https://railway.app
- Docs: https://docs.railway.app
- Status: https://railway.statuspage.io

**Medusa**:
- Docs: https://docs.medusajs.com
- Discord: https://discord.gg/medusajs
- GitHub: https://github.com/medusajs/medusa

---

**Checklist Generated**: November 11, 2025
**Start Time**: ___________
**Completion Time**: ___________
**Time Taken**: ___________
