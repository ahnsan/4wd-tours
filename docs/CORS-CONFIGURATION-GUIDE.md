# CORS Configuration Guide

## Understanding CORS

Cross-Origin Resource Sharing (CORS) is a security mechanism that controls which domains can access your API. Proper CORS configuration is critical for both security and functionality.

---

## Quick Reference

### Current Development Setup

**Backend (.env):**
```bash
STORE_CORS=http://localhost:8000,https://docs.medusajs.com
ADMIN_CORS=http://localhost:5173,http://localhost:9000,https://docs.medusajs.com
AUTH_CORS=http://localhost:5173,http://localhost:9000,https://docs.medusajs.com
```

### Production Setup Example

**Backend (.env):**
```bash
STORE_CORS=https://medusa-4wd-tours.com,https://www.medusa-4wd-tours.com
ADMIN_CORS=https://admin.medusa-4wd-tours.com
AUTH_CORS=https://admin.medusa-4wd-tours.com
```

---

## CORS Variables Explained

### STORE_CORS

**Purpose:** Controls which domains can access the store API endpoints

**Used by:**
- Customer-facing storefront
- Public product browsing
- Shopping cart operations
- Customer authentication
- Order placement

**Example endpoints:**
- `/store/products`
- `/store/carts`
- `/store/orders`
- `/store/customers`

**Configuration:**
```bash
# Single domain
STORE_CORS=https://shop.yourdomain.com

# Multiple domains (no spaces!)
STORE_CORS=https://shop.yourdomain.com,https://www.yourdomain.com

# Development + Production
STORE_CORS=http://localhost:8000,https://shop.yourdomain.com
```

### ADMIN_CORS

**Purpose:** Controls which domains can access the admin API endpoints

**Used by:**
- Admin dashboard
- Admin authentication
- Product management
- Order management
- Settings management

**Example endpoints:**
- `/admin/products`
- `/admin/orders`
- `/admin/users`
- `/admin/settings`

**Configuration:**
```bash
# Single admin domain
ADMIN_CORS=https://admin.yourdomain.com

# Multiple admin domains
ADMIN_CORS=https://admin.yourdomain.com,https://admin-staging.yourdomain.com

# Development + Production
ADMIN_CORS=http://localhost:5173,http://localhost:9000,https://admin.yourdomain.com
```

### AUTH_CORS

**Purpose:** Controls which domains can access authentication endpoints

**Used by:**
- Admin login
- Admin authentication
- Token refresh
- Session management

**Configuration:**
```bash
# Usually same as ADMIN_CORS
AUTH_CORS=https://admin.yourdomain.com
```

---

## Production CORS Strategies

### Strategy 1: Separate Subdomains (Recommended)

**Best for:** Professional deployments, clear separation of concerns

**Structure:**
- **API:** `api.medusa-4wd-tours.com`
- **Storefront:** `shop.medusa-4wd-tours.com` and `www.medusa-4wd-tours.com`
- **Admin:** `admin.medusa-4wd-tours.com`

**Configuration:**
```bash
# Backend .env
STORE_CORS=https://shop.medusa-4wd-tours.com,https://www.medusa-4wd-tours.com
ADMIN_CORS=https://admin.medusa-4wd-tours.com
AUTH_CORS=https://admin.medusa-4wd-tours.com
```

**Pros:**
- Clear separation
- Easy to secure (different subdomains)
- Scalable (can deploy each service independently)
- Professional appearance

**Cons:**
- Requires DNS configuration for multiple subdomains
- Slightly more complex setup

### Strategy 2: Single Domain with Paths

**Best for:** Simple deployments, shared hosting

**Structure:**
- **API:** `medusa-4wd-tours.com/api`
- **Storefront:** `medusa-4wd-tours.com`
- **Admin:** `medusa-4wd-tours.com/admin`

**Configuration:**
```bash
# Backend .env
STORE_CORS=https://medusa-4wd-tours.com
ADMIN_CORS=https://medusa-4wd-tours.com
AUTH_CORS=https://medusa-4wd-tours.com
```

**Pros:**
- Simpler DNS configuration
- Single SSL certificate
- Easier for small teams

**Cons:**
- Less separation between services
- Can't deploy services to different platforms easily
- More complex reverse proxy configuration

### Strategy 3: Separate Root Domains

**Best for:** Multi-brand deployments, distinct storefronts

**Structure:**
- **API:** `api.medusa-4wd-tours.com`
- **Storefront:** `tours.com.au`
- **Admin:** `admin.medusa-4wd-tours.com`

**Configuration:**
```bash
# Backend .env
STORE_CORS=https://tours.com.au,https://www.tours.com.au
ADMIN_CORS=https://admin.medusa-4wd-tours.com
AUTH_CORS=https://admin.medusa-4wd-tours.com
```

**Pros:**
- Brand-focused domain for storefront
- Clear distinction between backend and frontend

**Cons:**
- Multiple domain purchases required
- More complex DNS management

---

## CORS Rules & Best Practices

### Security Rules

| Rule | Example | Reason |
|------|---------|--------|
| **HTTPS only in production** | `https://shop.com` | Prevents man-in-the-middle attacks |
| **No wildcards** | ❌ `*` | Too permissive, allows any domain |
| **No localhost in production** | ❌ `http://localhost:8000` | Security risk |
| **Specific subdomains only** | `https://shop.domain.com` | Principle of least privilege |
| **No trailing slashes** | ❌ `https://shop.com/` | Can cause matching issues |
| **No spaces in lists** | ❌ `domain1.com, domain2.com` | Parser error |

### Good CORS Examples

```bash
# ✅ Single domain, HTTPS
STORE_CORS=https://shop.example.com

# ✅ Multiple specific domains, no spaces
STORE_CORS=https://shop.example.com,https://www.example.com

# ✅ Subdomain wildcard (use cautiously)
STORE_CORS=https://*.example.com

# ✅ Development + staging + production
STORE_CORS=http://localhost:8000,https://staging.example.com,https://example.com
```

### Bad CORS Examples

```bash
# ❌ Wildcard (too permissive)
STORE_CORS=*

# ❌ HTTP in production
STORE_CORS=http://shop.example.com

# ❌ Spaces in list
STORE_CORS=https://shop.example.com, https://www.example.com

# ❌ Trailing slash
STORE_CORS=https://shop.example.com/

# ❌ Mixed localhost and production without environment separation
STORE_CORS=http://localhost:8000,https://production.com
```

---

## Environment-Specific CORS

### Development Environment

**File:** `.env` (local development)

```bash
STORE_CORS=http://localhost:8000,http://localhost:3000
ADMIN_CORS=http://localhost:5173,http://localhost:9000
AUTH_CORS=http://localhost:5173,http://localhost:9000
```

**Characteristics:**
- HTTP is acceptable (local network)
- localhost domains
- Multiple ports for different dev setups

### Staging Environment

**File:** Platform environment variables (Railway, Vercel, etc.)

```bash
STORE_CORS=https://staging-storefront.medusa-4wd-tours.com
ADMIN_CORS=https://staging-admin.medusa-4wd-tours.com
AUTH_CORS=https://staging-admin.medusa-4wd-tours.com
```

**Characteristics:**
- HTTPS required
- Separate staging subdomains
- Mirrors production structure

### Production Environment

**File:** Platform environment variables (Railway, Vercel, etc.)

```bash
STORE_CORS=https://medusa-4wd-tours.com,https://www.medusa-4wd-tours.com
ADMIN_CORS=https://admin.medusa-4wd-tours.com
AUTH_CORS=https://admin.medusa-4wd-tours.com
```

**Characteristics:**
- HTTPS only
- Production domains
- No localhost
- No development domains

---

## Testing CORS Configuration

### Browser Console Test

```javascript
// Test from browser console on your storefront domain
fetch('https://your-api-domain.com/store/products', {
  method: 'GET',
  headers: {
    'Content-Type': 'application/json'
  }
})
.then(response => {
  console.log('CORS OK:', response.ok);
  return response.json();
})
.then(data => console.log('Data:', data))
.catch(error => console.error('CORS Error:', error));
```

### cURL Test

```bash
# Test CORS preflight
curl -I \
  -H "Origin: https://your-storefront-domain.com" \
  -H "Access-Control-Request-Method: GET" \
  -H "Access-Control-Request-Headers: Content-Type" \
  -X OPTIONS \
  https://your-api-domain.com/store/products

# Expected response headers:
# Access-Control-Allow-Origin: https://your-storefront-domain.com
# Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS
# Access-Control-Allow-Headers: Content-Type, Authorization
```

### Test Script

```bash
#!/bin/bash
# test-cors.sh

API_URL="https://your-api-domain.com"
STORE_URL="https://your-storefront-domain.com"

echo "Testing CORS configuration..."
echo "API: $API_URL"
echo "Store: $STORE_URL"
echo ""

# Test store endpoint
echo "Testing /store/products..."
curl -s -I \
  -H "Origin: $STORE_URL" \
  -H "Access-Control-Request-Method: GET" \
  -X OPTIONS \
  "$API_URL/store/products" | grep -i "access-control"

echo ""
echo "Testing /store/products (GET)..."
curl -s \
  -H "Origin: $STORE_URL" \
  "$API_URL/store/products" | head -c 100

echo ""
echo "Done!"
```

---

## Troubleshooting CORS Issues

### Issue 1: "CORS policy: No 'Access-Control-Allow-Origin' header"

**Symptom:** Browser console error, API request fails

**Causes:**
- CORS not configured
- Domain not in CORS list
- Typo in CORS domain
- Spaces in CORS list

**Solutions:**
```bash
# Check backend CORS configuration
echo $STORE_CORS

# Verify exact domain match (no trailing slash, correct protocol)
# Bad: https://shop.com/
# Good: https://shop.com

# Remove spaces
# Bad: "https://a.com, https://b.com"
# Good: "https://a.com,https://b.com"

# Restart backend after changing CORS
```

### Issue 2: "CORS policy: Response to preflight request doesn't pass"

**Symptom:** OPTIONS request fails before actual request

**Causes:**
- Server not responding to OPTIONS requests
- Missing CORS headers
- Incorrect CORS headers

**Solutions:**
```bash
# Test OPTIONS request manually
curl -I -X OPTIONS \
  -H "Origin: https://your-domain.com" \
  https://your-api-domain.com/store/products

# Should return 204 No Content with CORS headers
```

### Issue 3: "CORS policy: Credentials flag is true, but 'Access-Control-Allow-Credentials' is false"

**Symptom:** Requests with credentials (cookies) fail

**Cause:** Medusa CORS configuration doesn't allow credentials

**Solution:**
- This is handled automatically by Medusa
- Ensure you're using latest Medusa version
- Check medusa-config.ts for custom CORS configuration

### Issue 4: CORS works in development but not production

**Causes:**
- Production domain not in CORS list
- Using HTTP instead of HTTPS in production
- Environment variables not set on production platform

**Solutions:**
```bash
# Verify production environment variables are set
# On Railway: Check Project → Variables
# On Vercel: Check Project Settings → Environment Variables
# On Render: Check Dashboard → Environment

# Verify HTTPS
# Bad: http://shop.com
# Good: https://shop.com

# Check for localhost in production CORS (remove it)
```

### Issue 5: Multiple domains, one works but others don't

**Causes:**
- Spaces in CORS list
- Typo in domain
- Missing protocol (https://)

**Solutions:**
```bash
# Verify no spaces
STORE_CORS=https://a.com,https://b.com  # Good
STORE_CORS=https://a.com, https://b.com  # Bad (space after comma)

# Verify all domains have protocol
STORE_CORS=https://a.com,b.com  # Bad (missing protocol on b.com)
STORE_CORS=https://a.com,https://b.com  # Good
```

---

## Advanced CORS Configuration

### Subdomain Wildcards

**Use cautiously** - allows any subdomain

```bash
# Allow all subdomains of yourdomain.com
STORE_CORS=https://*.yourdomain.com

# More specific
ADMIN_CORS=https://admin.yourdomain.com,https://admin-*.yourdomain.com
```

**Security Note:** Only use wildcards if you control all possible subdomains

### Multiple Environments in Single Variable

**For development convenience:**

```bash
# Include dev, staging, and production
STORE_CORS=http://localhost:8000,https://staging.shop.com,https://shop.com
```

**Best Practice:** Use separate `.env` files per environment instead

### Custom CORS Headers (Advanced)

**File:** `medusa-config.ts`

```typescript
// Custom CORS configuration (if needed)
module.exports = defineConfig({
  projectConfig: {
    http: {
      storeCors: process.env.STORE_CORS!,
      adminCors: process.env.ADMIN_CORS!,
      authCors: process.env.AUTH_CORS!,
      // Custom CORS options (rarely needed)
      // corsOptions: {
      //   credentials: true,
      //   optionsSuccessStatus: 200
      // }
    }
  }
})
```

---

## CORS Security Checklist

Before deploying to production:

- [ ] No wildcard `*` CORS (unless absolutely necessary and understood)
- [ ] All CORS origins use HTTPS (no HTTP)
- [ ] No localhost in production CORS
- [ ] No development domains in production CORS
- [ ] No spaces in CORS lists
- [ ] All domains in CORS list are owned/controlled by you
- [ ] CORS configuration tested from browser
- [ ] CORS configuration tested with cURL
- [ ] Preflight (OPTIONS) requests work
- [ ] Credentials (cookies) work if needed

---

## DNS Configuration for CORS

### DNS Records Needed

**For subdomains strategy:**

| Type | Name | Value | Purpose |
|------|------|-------|---------|
| A/CNAME | api | (API server IP/domain) | Backend API |
| CNAME | shop | (Storefront deployment) | Storefront |
| CNAME | www | (Storefront deployment) | Storefront (www) |
| CNAME | admin | (Admin deployment) | Admin dashboard |

**Example (using Vercel for storefront, Railway for backend):**

```
# Backend API (Railway)
api.medusa-4wd-tours.com → CNAME → medusa-backend-production.up.railway.app

# Storefront (Vercel)
shop.medusa-4wd-tours.com → CNAME → cname.vercel-dns.com
www.medusa-4wd-tours.com → CNAME → cname.vercel-dns.com

# Admin (Vercel or separate deployment)
admin.medusa-4wd-tours.com → CNAME → cname.vercel-dns.com
```

---

## CORS Configuration Examples by Platform

### Vercel (Storefront)

**Not needed** - Vercel handles CORS automatically for frontend

**If needed for API routes:**

```javascript
// pages/api/example.js
export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', 'https://your-domain.com');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.json({ message: 'OK' });
}
```

### Railway (Backend)

**Environment Variables:**

```bash
STORE_CORS=https://shop.medusa-4wd-tours.com,https://www.medusa-4wd-tours.com
ADMIN_CORS=https://admin.medusa-4wd-tours.com
AUTH_CORS=https://admin.medusa-4wd-tours.com
```

**No additional configuration needed** - Medusa handles CORS

### Render (Backend)

**Same as Railway** - Configure via environment variables

---

## Quick Reference Card

```
┌─────────────────────────────────────────────────────────────┐
│                    CORS Quick Reference                     │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Development:                                               │
│    STORE_CORS=http://localhost:8000                         │
│    ADMIN_CORS=http://localhost:9000                         │
│                                                             │
│  Production:                                                │
│    STORE_CORS=https://shop.yourdomain.com                   │
│    ADMIN_CORS=https://admin.yourdomain.com                  │
│                                                             │
│  Rules:                                                     │
│    ✅ HTTPS only (production)                               │
│    ✅ No spaces in list                                     │
│    ✅ Comma-separated                                       │
│    ✅ No trailing slash                                     │
│    ❌ No wildcard *                                         │
│    ❌ No localhost (production)                             │
│                                                             │
│  Testing:                                                   │
│    curl -I -H "Origin: https://your-domain.com" \           │
│         -X OPTIONS https://api.com/store/products           │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

**Last Updated:** 2025-11-10
**Version:** 1.0.0
