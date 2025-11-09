# Security Testing Checklist - 4WD Tours Platform

**Date Created:** November 8, 2025
**Purpose:** Systematic testing of security fixes applied
**Reference:** `/docs/security/SECURITY_FIXES_APPLIED.md`

---

## Pre-Testing Setup

### 1. Environment Preparation
```bash
# Backend setup
cd /Users/Karim/med-usa-4wd
npm install

# Frontend setup (install DOMPurify)
cd storefront
npm install

# Verify secrets are configured
cat .env | grep -E "JWT_SECRET|COOKIE_SECRET"
# Should show long random strings, NOT default values

# Start backend server
npm run dev

# In another terminal, start frontend
cd storefront
npm run dev
```

### 2. Test User Setup
- [ ] Create admin user via Medusa admin panel
- [ ] Create regular user for permission testing
- [ ] Document test credentials (in secure location, NOT in repo)

---

## Critical Security Tests

### Test 1: Admin Authentication (CVE-2025-001)

**Objective:** Verify admin routes are protected

#### Test 1.1: Unauthorized Access
```bash
# Should return 401 Unauthorized
curl -X POST http://localhost:9000/admin/blog/posts \
  -H "Content-Type: application/json" \
  -d '{"title":"Test","slug":"test","content":"Test","author":"Hacker"}'
```
**Expected:** `401 Unauthorized` with message "Authentication required"
**Result:** [ ] PASS [ ] FAIL

#### Test 1.2: Non-Admin User Access
```bash
# Login as regular user, get token
# Use token to access admin route
curl -X POST http://localhost:9000/admin/blog/posts \
  -H "Authorization: Bearer <regular-user-token>" \
  -H "Content-Type: application/json" \
  -d '{"title":"Test","slug":"test","content":"Test","author":"Regular"}'
```
**Expected:** `403 Forbidden` with message "Admin access required"
**Result:** [ ] PASS [ ] FAIL

#### Test 1.3: Valid Admin Access
```bash
# Login as admin user, get token
curl -X POST http://localhost:9000/admin/blog/posts \
  -H "Authorization: Bearer <admin-token>" \
  -H "Content-Type: application/json" \
  -d '{"title":"Test Post","slug":"test-post","content":"Test content","author":"Admin"}'
```
**Expected:** `201 Created` with post data
**Result:** [ ] PASS [ ] FAIL

---

### Test 2: CORS Configuration (CVE-2025-002)

**Objective:** Verify CORS whitelist enforcement

#### Test 2.1: Allowed Origin
```bash
curl -X GET http://localhost:9000/store/blog/posts \
  -H "Origin: http://localhost:8000"
```
**Expected:** Response includes `Access-Control-Allow-Origin: http://localhost:8000`
**Result:** [ ] PASS [ ] FAIL

#### Test 2.2: Disallowed Origin
```bash
curl -X GET http://localhost:9000/store/blog/posts \
  -H "Origin: https://evil.com"
```
**Expected:** No `Access-Control-Allow-Origin` header OR header NOT set to `*`
**Result:** [ ] PASS [ ] FAIL

#### Test 2.3: Credentials Flag
```bash
curl -X GET http://localhost:9000/store/blog/posts \
  -H "Origin: http://localhost:8000" \
  -v 2>&1 | grep -i "access-control-allow-credentials"
```
**Expected:** `Access-Control-Allow-Credentials: true` for allowed origins
**Result:** [ ] PASS [ ] FAIL

---

### Test 3: XSS Protection (CVE-2025-003)

**Objective:** Verify DOMPurify sanitization

#### Test 3.1: Script Tag Injection
1. Login to admin panel
2. Create blog post with content:
   ```html
   <p>Normal content</p>
   <script>alert('XSS Attack!')</script>
   <p>More content</p>
   ```
3. View post on storefront

**Expected:** Script tag is removed, alert does NOT execute
**Result:** [ ] PASS [ ] FAIL

#### Test 3.2: Event Handler Injection
1. Create blog post with content:
   ```html
   <img src="x" onerror="alert('XSS via onerror')">
   <a href="javascript:alert('XSS via href')">Click me</a>
   ```
2. View post on storefront

**Expected:** Event handlers removed, no alerts execute
**Result:** [ ] PASS [ ] FAIL

#### Test 3.3: Data Attribute Injection
1. Create blog post with content:
   ```html
   <div data-steal="user-cookies">Content</div>
   ```
2. View post and inspect HTML

**Expected:** `data-steal` attribute is removed
**Result:** [ ] PASS [ ] FAIL

#### Test 3.4: Allowed Tags Work
1. Create blog post with content:
   ```html
   <h2>Heading</h2>
   <p><strong>Bold</strong> and <em>italic</em></p>
   <ul>
     <li>List item</li>
   </ul>
   <a href="https://example.com">Link</a>
   ```
2. View post on storefront

**Expected:** All tags render correctly and styled
**Result:** [ ] PASS [ ] FAIL

---

### Test 4: Payment Data Protection (CVE-2025-004)

**Objective:** Verify NO payment data in localStorage

#### Test 4.1: Checkout Flow
1. Open browser DevTools → Application → Local Storage
2. Navigate to checkout page
3. Fill in payment details:
   - Card Number: 4242 4242 4242 4242
   - CVV: 123
   - Expiry: 12/25
4. Complete booking
5. Inspect localStorage entries

**Expected:**
- NO `cardNumber`, `cardCVV`, `cardExpiry` anywhere
- Only `paymentMethod` and `paymentReference` stored
**Result:** [ ] PASS [ ] FAIL

#### Test 4.2: Session Storage Check
1. Complete checkout flow
2. Inspect sessionStorage

**Expected:** NO payment data in sessionStorage either
**Result:** [ ] PASS [ ] FAIL

#### Test 4.3: Cookie Check
```bash
# In browser DevTools → Application → Cookies
# Check all cookies
```
**Expected:** NO payment data in cookies
**Result:** [ ] PASS [ ] FAIL

---

### Test 5: Strong Secrets Enforcement (CVE-2025-005)

**Objective:** Verify secret validation on startup

#### Test 5.1: Missing Secrets
```bash
# Temporarily rename .env
mv .env .env.backup
npm run dev
```
**Expected:** Server refuses to start with error "JWT_SECRET and COOKIE_SECRET are required"
**Result:** [ ] PASS [ ] FAIL

#### Test 5.2: Short Secrets
```bash
# Create .env with weak secrets
echo "JWT_SECRET=short" > .env
echo "COOKIE_SECRET=weak" >> .env
npm run dev
```
**Expected:** Server refuses to start with error about minimum length
**Result:** [ ] PASS [ ] FAIL

#### Test 5.3: Strong Secrets
```bash
# Restore proper .env
mv .env.backup .env
npm run dev
```
**Expected:** Server starts successfully
**Result:** [ ] PASS [ ] FAIL

**Cleanup:**
```bash
# Ensure .env is restored
mv .env.backup .env
```

---

## High-Risk Security Tests

### Test 6: Input Validation (CVE-2025-006)

**Objective:** Verify Zod schema validation

#### Test 6.1: Invalid Slug Format
```bash
curl -X POST http://localhost:9000/admin/blog/posts \
  -H "Authorization: Bearer <admin-token>" \
  -H "Content-Type: application/json" \
  -d '{"title":"Test","slug":"Invalid Slug!","content":"Test","author":"Admin"}'
```
**Expected:** `400 Bad Request` with validation error about slug format
**Result:** [ ] PASS [ ] FAIL

#### Test 6.2: Missing Required Fields
```bash
curl -X POST http://localhost:9000/admin/blog/posts \
  -H "Authorization: Bearer <admin-token>" \
  -H "Content-Type: application/json" \
  -d '{"title":"Test"}'
```
**Expected:** `400 Bad Request` with errors listing missing fields
**Result:** [ ] PASS [ ] FAIL

#### Test 6.3: Title Too Long
```bash
curl -X POST http://localhost:9000/admin/blog/posts \
  -H "Authorization: Bearer <admin-token>" \
  -H "Content-Type: application/json" \
  -d "{\"title\":\"$(python3 -c 'print("A"*300)')\",\"slug\":\"test\",\"content\":\"Test\",\"author\":\"Admin\"}"
```
**Expected:** `400 Bad Request` with validation error about title length
**Result:** [ ] PASS [ ] FAIL

#### Test 6.4: Valid Data
```bash
curl -X POST http://localhost:9000/admin/blog/posts \
  -H "Authorization: Bearer <admin-token>" \
  -H "Content-Type: application/json" \
  -d '{"title":"Valid Post","slug":"valid-post","content":"Valid content","author":"Admin","category":"adventure","tags":["hiking","tours"]}'
```
**Expected:** `201 Created` with post data
**Result:** [ ] PASS [ ] FAIL

---

### Test 7: SQL Injection Prevention (CVE-2025-007)

**Objective:** Verify query sanitization

#### Test 7.1: SQL Injection Attempt
```bash
curl -X GET "http://localhost:9000/admin/blog/posts?q=%27%3B%20DROP%20TABLE%20posts%3B%20--" \
  -H "Authorization: Bearer <admin-token>"
```
**Expected:** Special characters escaped, query returns safely (likely no results)
**Result:** [ ] PASS [ ] FAIL

#### Test 7.2: LIKE Wildcard Injection
```bash
curl -X GET "http://localhost:9000/admin/blog/posts?q=%%_%" \
  -H "Authorization: Bearer <admin-token>"
```
**Expected:** Wildcards escaped, query returns safely
**Result:** [ ] PASS [ ] FAIL

#### Test 7.3: Query Too Long
```bash
curl -X GET "http://localhost:9000/admin/blog/posts?q=$(python3 -c 'print("A"*200)')" \
  -H "Authorization: Bearer <admin-token>"
```
**Expected:** `400 Bad Request` with "Search query too long" message
**Result:** [ ] PASS [ ] FAIL

#### Test 7.4: Legitimate Search
```bash
curl -X GET "http://localhost:9000/admin/blog/posts?q=adventure" \
  -H "Authorization: Bearer <admin-token>"
```
**Expected:** `200 OK` with relevant search results
**Result:** [ ] PASS [ ] FAIL

---

### Test 8: Error Handling (CVE-2025-008)

**Objective:** Verify production error sanitization

#### Test 8.1: Development Mode Errors
```bash
# Ensure NODE_ENV=development
export NODE_ENV=development
npm run dev

# Trigger error (duplicate slug)
curl -X POST http://localhost:9000/admin/blog/posts \
  -H "Authorization: Bearer <admin-token>" \
  -H "Content-Type: application/json" \
  -d '{"title":"Test","slug":"existing-slug","content":"Test","author":"Admin"}'
```
**Expected:** Detailed error message with error.message included
**Result:** [ ] PASS [ ] FAIL

#### Test 8.2: Production Mode Errors
```bash
# Set NODE_ENV=production
export NODE_ENV=production
npm run dev

# Trigger same error
curl -X POST http://localhost:9000/admin/blog/posts \
  -H "Authorization: Bearer <admin-token>" \
  -H "Content-Type: application/json" \
  -d '{"title":"Test","slug":"existing-slug","content":"Test","author":"Admin"}'
```
**Expected:** Generic error message like "An error occurred while creating the post" with error code
**Result:** [ ] PASS [ ] FAIL

**Cleanup:**
```bash
export NODE_ENV=development
```

---

## Automated Security Scanning

### Dependency Vulnerabilities

```bash
# Backend dependencies
cd /Users/Karim/med-usa-4wd
npm audit

# Frontend dependencies
cd storefront
npm audit
```
**Expected:** 0 high/critical vulnerabilities
**Backend Result:** [ ] PASS [ ] FAIL
**Frontend Result:** [ ] PASS [ ] FAIL

### Optional: Advanced Scanning

```bash
# Install Snyk (optional)
npm install -g snyk

# Authenticate
snyk auth

# Scan backend
cd /Users/Karim/med-usa-4wd
snyk test

# Scan frontend
cd storefront
snyk test
```

---

## Manual Security Review

### Code Review Checklist

#### Authentication & Authorization
- [ ] All admin routes use `authenticateAdmin` middleware
- [ ] No routes bypass authentication
- [ ] Role checks are in place (admin vs regular user)
- [ ] Session timeout is configured appropriately

#### Input Validation
- [ ] All POST/PUT routes use Zod validation
- [ ] Query parameters are validated
- [ ] File uploads (if any) have size and type restrictions
- [ ] Special characters are properly escaped

#### Data Protection
- [ ] No PCI data stored client-side
- [ ] Secrets are not hardcoded anywhere
- [ ] Sensitive data is encrypted at rest (if applicable)
- [ ] TLS/HTTPS enforced in production

#### Error Handling
- [ ] Production errors don't expose internals
- [ ] Errors are logged server-side
- [ ] User-friendly messages shown to clients
- [ ] Stack traces hidden in production

#### CORS & Headers
- [ ] CORS uses whitelist (not wildcard)
- [ ] Security headers configured (CSP, X-Frame-Options, etc.)
- [ ] HSTS enabled for production
- [ ] Cookies have secure and httpOnly flags

---

## Test Results Summary

**Date Tested:** _______________
**Tester:** _______________
**Environment:** [ ] Development [ ] Staging [ ] Production

### Critical Tests (Must All Pass)
- [ ] Test 1: Admin Authentication - PASS/FAIL
- [ ] Test 2: CORS Configuration - PASS/FAIL
- [ ] Test 3: XSS Protection - PASS/FAIL
- [ ] Test 4: Payment Data Protection - PASS/FAIL
- [ ] Test 5: Strong Secrets - PASS/FAIL

### High-Risk Tests (Must All Pass)
- [ ] Test 6: Input Validation - PASS/FAIL
- [ ] Test 7: SQL Injection Prevention - PASS/FAIL
- [ ] Test 8: Error Handling - PASS/FAIL

### Overall Security Status
- [ ] ALL TESTS PASSED - Ready for deployment
- [ ] SOME TESTS FAILED - Review and fix failures
- [ ] MANY TESTS FAILED - Major security review needed

### Notes and Observations
```
[Record any issues, edge cases, or additional findings here]




```

---

## Post-Testing Actions

If all tests pass:
- [ ] Document test results
- [ ] Update security documentation
- [ ] Schedule next security review (30 days)
- [ ] Proceed to staging/production deployment

If any tests fail:
- [ ] Document failure details
- [ ] Assign fix to development team
- [ ] Re-run full test suite after fixes
- [ ] DO NOT deploy to production

---

## Emergency Contacts

**Security Issues:**
- Primary: [Your Security Team Email]
- Secondary: [Backup Contact]

**Incident Response:**
- Refer to: `/docs/security/incident-response.md` (when created)

---

**Document Version:** 1.0
**Last Updated:** November 8, 2025
**Next Review:** December 8, 2025
