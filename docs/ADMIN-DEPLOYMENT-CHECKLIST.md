# Medusa Admin Deployment Checklist

## Pre-Deployment ✅

- [x] Admin built successfully (`npx medusa build --admin-only`)
- [x] Build output verified (`.medusa/admin/` - 8.2MB, 321 assets)
- [x] Vercel configuration created (`vercel.json`)
- [x] `.vercelignore` file created
- [x] Vercel CLI available (v48.9.0)
- [x] Backend URL identified (Railway)

## Deployment Steps 📋

### Step 1: Deploy to Vercel
- [ ] Navigate to admin directory: `cd /Users/Karim/med-usa-4wd/.medusa/admin`
- [ ] Login to Vercel: `npx vercel login`
- [ ] Deploy: `npx vercel --prod`
- [ ] Note deployed URL: `___________________________________`

### Step 2: Configure Backend CORS
- [ ] Go to Railway dashboard
- [ ] Update `ADMIN_CORS` environment variable
  - Add: `https://[your-admin-url].vercel.app`
- [ ] Update `AUTH_CORS` environment variable
  - Add: `https://[your-admin-url].vercel.app`
- [ ] Redeploy Railway backend
- [ ] Wait for backend to restart (~2 minutes)

### Step 3: Verify Deployment
- [ ] Visit admin URL
- [ ] Check browser console for errors (should be none)
- [ ] Verify assets load correctly (Network tab)
- [ ] Check admin login page displays

### Step 4: Test Admin Login
- [ ] Create admin user (if not exists): `npx medusa user -e admin@4wd-tours.com -p [password]`
- [ ] Login with admin credentials
- [ ] Verify successful authentication
- [ ] Check dashboard loads

### Step 5: Test Backend Connection
- [ ] Navigate to Products section
- [ ] Verify products list loads
- [ ] Navigate to Orders section
- [ ] Check no CORS errors in console
- [ ] Test product creation (optional)

## Post-Deployment 📝

### Documentation
- [ ] Document admin URL in password manager
- [ ] Save admin credentials securely
- [ ] Update team documentation with admin URL
- [ ] Note any custom domain plans

### Optional: Custom Domain
- [ ] Add custom domain in Vercel (e.g., `admin.4wd-tours.com`)
- [ ] Configure DNS records
- [ ] Update Railway CORS with custom domain
- [ ] Wait for SSL certificate provisioning
- [ ] Test custom domain access

## Success Criteria ✅

**Deployment is successful when:**
- ✅ Admin loads at Vercel URL without errors
- ✅ Login works with admin credentials
- ✅ Dashboard displays all sections
- ✅ Products list loads from backend
- ✅ No CORS errors in console
- ✅ Can create/edit products
- ✅ Backend connection confirmed

## Rollback Plan 🔄

If deployment fails:
1. Check Vercel deployment logs: `npx vercel logs`
2. Verify backend is running on Railway
3. Test backend directly: `curl https://medusaecomm-production.up.railway.app/health`
4. Review CORS configuration
5. Rebuild admin if needed: `npx medusa build --admin-only`

## Support 🆘

- **Full Guide**: `/Users/Karim/med-usa-4wd/docs/ADMIN-DEPLOYMENT-GUIDE.md`
- **Vercel Docs**: https://vercel.com/docs
- **Medusa Docs**: https://docs.medusajs.com/resources/deployment

---

**Date**: 2025-11-11
**Status**: READY TO DEPLOY
**Next Action**: Run `npx vercel --prod` from `.medusa/admin` directory
