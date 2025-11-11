# Medusa Admin Deployment - Verification Checklist

Use this checklist to verify your admin deployment is complete and working correctly.

## Pre-Deployment Verification

### Environment Check
- [ ] Node.js version 18+ installed
  ```bash
  node --version
  # Should show v18.x.x or higher
  ```

- [ ] Vercel CLI available
  ```bash
  npx vercel --version
  # Should show version number
  ```

- [ ] Railway CLI available (optional)
  ```bash
  railway --version
  # Should show version number
  ```

### Project Files Check
- [ ] Admin directory exists: `/Users/Karim/med-usa-4wd/admin/`
- [ ] Build script executable: `build-and-deploy.sh`
- [ ] Deploy script executable: `deploy-only.sh`
- [ ] Configuration files present:
  - [ ] `vercel.json`
  - [ ] `package.json`
  - [ ] `.env.example`
  - [ ] `.gitignore`
  - [ ] `.vercelignore`

### Documentation Check
- [ ] INDEX.md exists
- [ ] QUICKSTART.md exists
- [ ] README.md exists
- [ ] RAILWAY-CORS-SETUP.md exists
- [ ] ENV-VARIABLES.md exists

### Backend Status Check
- [ ] Railway backend is running
  ```bash
  curl https://4wd-tours-production.up.railway.app/health
  # Should return {"status":"ok"}
  ```

- [ ] Admin user exists on backend
  ```bash
  # If not, create one:
  railway run npx medusa user --email admin@4wdtours.com.au --password [password]
  ```

---

## Deployment Verification

### Build Verification
- [ ] Admin built successfully
  ```bash
  cd /Users/Karim/med-usa-4wd
  npx medusa build --admin-only
  # Should complete without errors
  ```

- [ ] Build output exists
  ```bash
  ls -la .medusa/admin/
  # Should show index.html and assets/
  ```

- [ ] Build size reasonable
  ```bash
  du -sh .medusa/admin/
  # Should be around 8-10MB
  ```

### Vercel Deployment Verification
- [ ] Logged into Vercel
  ```bash
  npx vercel whoami
  # Should show your username
  ```

- [ ] Deployment command works
  ```bash
  cd /Users/Karim/med-usa-4wd/admin
  bash build-and-deploy.sh
  # Should complete successfully
  ```

- [ ] Deployment URL obtained
  - Copy URL from terminal output
  - Example: `https://medusa-admin-4wd-tours-abc123.vercel.app`

- [ ] Admin loads in browser
  - Visit deployment URL
  - Should show Medusa admin login page
  - No JavaScript errors in console (F12)

### Railway CORS Verification
- [ ] ADMIN_CORS updated with Vercel URL
  ```bash
  railway variables get ADMIN_CORS
  # Should include your Vercel URL
  ```

- [ ] AUTH_CORS updated with Vercel URL
  ```bash
  railway variables get AUTH_CORS
  # Should include your Vercel URL
  ```

- [ ] Railway backend redeployed
  - Check Railway dashboard
  - Latest deployment should be after CORS update

---

## Functionality Verification

### Login Test
- [ ] Login page loads without errors
- [ ] Can see email and password fields
- [ ] "Sign in" button visible
- [ ] No CORS errors in console

### Authentication Test
- [ ] Enter admin credentials
- [ ] Click "Sign in"
- [ ] No CORS errors during login
- [ ] Successfully redirected to dashboard
- [ ] Dashboard loads completely

### Dashboard Test
- [ ] Navigation menu visible
- [ ] Can click different menu items
- [ ] No console errors when navigating
- [ ] All sections load correctly

### API Connection Test
- [ ] Products list loads
  ```
  Go to Products → Should see product list
  ```

- [ ] Can view product details
  ```
  Click a product → Should load details page
  ```

- [ ] Can edit product (test)
  ```
  Edit a product field → Save → Should succeed
  ```

- [ ] Orders section loads (if orders exist)
- [ ] Customers section loads (if customers exist)

### Custom Widgets Test
- [ ] Tour addon selector widget loads (if on tour product page)
- [ ] Blog post products widget loads (if on blog page)
- [ ] Product price manager loads correctly
- [ ] Tour content editor displays (if on tour page)

---

## Console Verification

### Browser Console (F12)

#### No CORS Errors
```
Look for errors like:
"Access to XMLHttpRequest blocked by CORS policy"

If present:
- CORS not configured correctly
- See RAILWAY-CORS-SETUP.md
```

#### No 404 Errors
```
Look for:
"GET /assets/... 404"

If present:
- Asset paths incorrect
- Rebuild admin
```

#### No Authentication Errors
```
Look for:
"401 Unauthorized"

If present during login:
- Check admin user exists
- Verify password correct
```

#### API Calls Succeed
```
Look in Network tab:
- /admin/auth should return 200 or 302
- /admin/products should return 200
- /admin/users should return 200
```

---

## Performance Verification

### Load Time
- [ ] Admin page loads in < 3 seconds
- [ ] Dashboard loads in < 2 seconds
- [ ] Product list loads in < 2 seconds

### Asset Loading
- [ ] All CSS files load successfully
- [ ] All JavaScript files load successfully
- [ ] No broken images
- [ ] No missing fonts

### Caching
- [ ] Static assets cached properly
  ```
  Check Network tab:
  - Assets show "(disk cache)" on reload
  - Cache-Control headers present
  ```

---

## Security Verification

### HTTPS
- [ ] Admin URL uses HTTPS
- [ ] No mixed content warnings
- [ ] SSL certificate valid (green padlock)

### Security Headers
```bash
# Check security headers
curl -I https://[your-admin].vercel.app

# Should see:
# X-Content-Type-Options: nosniff
# X-Frame-Options: DENY
# X-XSS-Protection: 1; mode=block
```

### Authentication
- [ ] Cannot access dashboard without login
- [ ] Logout works correctly
- [ ] Session persists on refresh
- [ ] Session expires after logout

---

## Post-Deployment Checklist

### Documentation
- [ ] Admin URL documented
- [ ] Admin credentials saved in password manager
- [ ] Deployment date recorded
- [ ] Team notified of new admin URL

### Monitoring
- [ ] Vercel Analytics enabled (optional)
- [ ] Uptime monitoring configured (optional)
- [ ] Error tracking set up (optional)

### Backup
- [ ] Backup admin user created
- [ ] Test backup user login
- [ ] Admin user credentials backed up securely

---

## Common Issues and Quick Fixes

### Issue: CORS Error
```
Error: "Access to XMLHttpRequest blocked by CORS policy"

Fix:
1. Check Railway ADMIN_CORS and AUTH_CORS
2. Ensure Vercel URL is in both variables
3. Verify no typos in URL
4. Wait for Railway redeploy
5. Clear browser cache and retry
```

### Issue: Blank Page
```
Symptom: White screen, no content

Fix:
1. Check browser console for errors
2. Verify MEDUSA_ADMIN_BACKEND_URL is set
3. Rebuild admin: npx medusa build --admin-only
4. Redeploy: npx vercel --prod
```

### Issue: Login Fails
```
Symptom: "Invalid credentials" error

Fix:
1. Verify admin user exists on Railway
2. Try resetting password
3. Check Railway logs for errors
4. Ensure CORS is configured correctly
```

### Issue: Assets Not Loading
```
Symptom: 404 errors for CSS/JS files

Fix:
1. Check asset paths in index.html
2. Verify vercel.json outputDirectory is "."
3. Rebuild and redeploy
```

---

## Success Criteria

Deployment is fully successful when ALL of these are checked:

- [ ] Admin accessible at Vercel URL
- [ ] Login works without errors
- [ ] Dashboard displays correctly
- [ ] Products list loads
- [ ] Can view/edit products
- [ ] Orders section works (if applicable)
- [ ] Customers section works (if applicable)
- [ ] Custom widgets display
- [ ] No CORS errors in console
- [ ] No 404 errors in console
- [ ] No authentication errors
- [ ] Logout works correctly
- [ ] Admin credentials documented
- [ ] Team has access (if applicable)

---

## Troubleshooting Resources

If any verification fails, see:

1. **QUICKSTART.md** - Basic troubleshooting
2. **README.md** - Detailed troubleshooting section
3. **RAILWAY-CORS-SETUP.md** - CORS-specific issues
4. **ENV-VARIABLES.md** - Environment variable issues

---

## Verification Complete

If all checkboxes are marked, your Medusa Admin is successfully deployed and fully functional!

**Date Verified:** _______________
**Verified By:** _______________
**Admin URL:** _______________
**Status:** _______________

---

**Document Version:** 1.0.0
**Created:** 2025-11-11
