# Admin Access Fix - Quick Start (5 Minutes)

**Issue**: Cannot GET /app (404 Error)
**Fix**: Remove DISABLE_ADMIN variable on Railway

---

## Copy-Paste These Commands (In Order)

```bash
# 1. Login to Railway (opens browser)
railway login

# 2. Link to project (select 4wd-tours backend)
railway link

# 3. Check if DISABLE_ADMIN exists
railway variables | grep DISABLE_ADMIN

# 4. Remove DISABLE_ADMIN (THE FIX)
railway variables delete DISABLE_ADMIN

# 5. Wait for deployment (1-2 minutes)
railway logs --follow
# Press Ctrl+C when you see "Server is ready"

# 6. Test admin is now working
curl -I https://4wd-tours-production.up.railway.app/app
# Expected: HTTP/2 200 OK

# 7. Open in browser
open https://4wd-tours-production.up.railway.app/app
# Expected: Admin login page loads
```

---

## If DISABLE_ADMIN Doesn't Exist

Then the issue is missing CORS or secrets:

```bash
# Set CORS variables
railway variables set ADMIN_CORS="https://4wd-tours-production.up.railway.app"
railway variables set AUTH_CORS="https://4wd-tours-production.up.railway.app"

# Check if JWT_SECRET and COOKIE_SECRET exist
railway variables | grep SECRET

# If missing, generate and set:
railway variables set JWT_SECRET="$(node -e "console.log(require('crypto').randomBytes(64).toString('hex'))")"
railway variables set COOKIE_SECRET="$(node -e "console.log(require('crypto').randomBytes(64).toString('hex'))")"
```

---

## Create Admin User (If Needed)

```bash
# Create admin user
railway run npx medusa user --email admin@4wdtours.com.au --password "StrongPassword123!"

# Or reset password if user exists
railway run npx medusa user --email admin@4wdtours.com.au --reset-password
```

---

## Success Checklist

- [ ] `curl -I https://4wd-tours-production.up.railway.app/app` returns HTTP 200
- [ ] Admin login page loads in browser
- [ ] No CORS errors in browser console (F12)
- [ ] Login with admin credentials works

---

## Rollback (If Needed)

```bash
# Re-enable DISABLE_ADMIN
railway variables set DISABLE_ADMIN=true
```

---

**For detailed troubleshooting, see**: `/Users/Karim/med-usa-4wd/storefront/docs/ADMIN-FIX-ACTION-PLAN.md`
