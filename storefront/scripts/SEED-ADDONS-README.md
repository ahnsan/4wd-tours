# Add-ons Production Seeding Guide

## Overview

This guide explains how to seed add-on products to the Medusa backend for production deployment using the `seed-addons-production.ts` script.

## Script Location

**File:** `/Users/Karim/med-usa-4wd/storefront/scripts/seed-addons-production.ts`

## Key Features

### ✅ Production-Ready
- **Idempotent:** Won't duplicate products if run multiple times
- **Error handling:** Comprehensive logging and error recovery
- **Dry run mode:** Test without making changes
- **Verbose mode:** Detailed logging for debugging

### 💰 Pricing Compliance
- **Medusa v2 format:** Uses dollars (not cents) for backend
- **Correct conversion:** Backend stores in dollars, frontend converts to cents
- **Reference:** See `/Users/Karim/med-usa-4wd/docs/MEDUSA-V2-PRICING-MIGRATION.md`

### 🖼️ Image Configuration
- **Production URLs:** Uses Vercel public folder images
- **19 optimized images:** All add-on images pre-optimized (<200KB each)
- **Automatic paths:** Constructs full URLs from VERCEL_URL or PUBLIC_URL

### 📦 Complete Data
- **19 add-ons total:**
  - 5 Food & Beverage items
  - 2 Connectivity items
  - 4 Photography items
  - 3 Accommodation & Comfort items
  - 5 Activities & Equipment items
- **Full metadata:** Categories, pricing types, tags, recommendations
- **Descriptions:** SEO-optimized product descriptions

## Prerequisites

### 1. Environment Variables

The following environment variables must be set (in `.env.production` or Railway):

```bash
# Backend URL (Railway production)
NEXT_PUBLIC_MEDUSA_BACKEND_URL=https://4wd-tours-production.up.railway.app

# Publishable API Key
NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY=pk_c1aea896aab279e937a2375566b06bfda34775b149b33353ca77eb3e8588a91b

# Region ID (Australia)
NEXT_PUBLIC_DEFAULT_REGION_ID=reg_01K9S1YB6T87JJW43F5ZAE8HWG

# Admin Token (for product creation)
MEDUSA_ADMIN_TOKEN=<your-admin-token>

# Image base URL (Vercel deployment URL)
VERCEL_URL=sunshine-coast-4wd-tours.vercel.app
# OR
PUBLIC_URL=https://sunshine-coast-4wd-tours.vercel.app
```

### 2. Backend Requirements

- Medusa backend must be running and accessible
- Australia region must exist (`reg_01K9S1YB6T87JJW43F5ZAE8HWG`)
- Admin authentication must be configured
- Store API must be accessible

### 3. Image Requirements

- All 19 add-on images must be deployed to Vercel's public folder
- Images should be in `/public/images/addons/` directory
- Images are optimized (<200KB each)
- See `/Users/Karim/med-usa-4wd/storefront/public/addon-images-manifest.json` for full list

## Execution Methods

### Method 1: Via Railway CLI (Recommended for Production)

```bash
# Install Railway CLI if not already installed
npm install -g @railway/cli

# Login to Railway
railway login

# Link to your project
railway link

# Run the seeding script
railway run npm run seed:addons

# Or with dry run (test without changes)
railway run npm run seed:addons:dry

# Or with verbose logging
railway run npm run seed:addons:verbose
```

### Method 2: Locally with Production Env

```bash
# Ensure you have tsx installed
npm install -D tsx

# Load production environment
source .env.production

# Run the script
npm run seed:addons

# Dry run mode (test without creating products)
npm run seed:addons:dry

# Verbose mode (detailed logging)
npm run seed:addons:verbose
```

### Method 3: Direct TypeScript Execution

```bash
# With tsx
tsx scripts/seed-addons-production.ts

# With ts-node
ts-node scripts/seed-addons-production.ts

# Dry run
DRY_RUN=true tsx scripts/seed-addons-production.ts

# Verbose
VERBOSE=true tsx scripts/seed-addons-production.ts
```

## Script Behavior

### Idempotency

The script checks if each product already exists before creating it:

```typescript
// Checks for existing product by handle
const exists = await productExists(addon.handle);

if (exists) {
  log(`⏭️ Skipped: Product already exists`, 'warn');
  continue;
}
```

**This means:**
- ✅ Safe to run multiple times
- ✅ Won't create duplicates
- ✅ Only creates missing add-ons
- ✅ Useful for incremental updates

### Error Handling

The script continues processing even if individual products fail:

```typescript
try {
  // Create product
} catch (error) {
  log(`❌ Failed to create ${addon.handle}: ${error}`, 'error');
  results.failed++;
  results.errors.push(errorMsg);
  // Script continues to next product
}
```

**Benefits:**
- Partial success is possible
- Detailed error logging
- Summary report at the end
- Non-zero exit code if errors occurred

### Output Example

```
[2025-11-11T14:00:00.000Z] 📝 Starting add-ons seeding script
[2025-11-11T14:00:00.100Z] 📝 Backend URL: https://4wd-tours-production.up.railway.app
[2025-11-11T14:00:00.200Z] 📝 Image Base URL: https://sunshine-coast-4wd-tours.vercel.app
[2025-11-11T14:00:00.300Z] 📝 Total add-ons to seed: 19
[2025-11-11T14:00:00.400Z] 📝 Dry run mode: false

[2025-11-11T14:00:01.000Z] 📝 Processing: Gourmet Beach BBQ (addon-gourmet-bbq)
[2025-11-11T14:00:02.000Z] ✅   Created: prod_01HZABC123DEF456
[2025-11-11T14:00:02.500Z] 📝 Processing: Picnic Hamper (addon-picnic-hamper)
[2025-11-11T14:00:03.500Z] ⏭️   Skipped: Product already exists
...

[2025-11-11T14:00:30.000Z] 📝 📊 Seeding Summary:
[2025-11-11T14:00:30.100Z] 📝   Total add-ons: 19
[2025-11-11T14:00:30.200Z] ✅   Created: 15
[2025-11-11T14:00:30.300Z] ⚠️   Skipped (already exist): 4
[2025-11-11T14:00:30.400Z] 📝   Failed: 0

[2025-11-11T14:00:30.500Z] ✅ 🎉 Add-ons seeding completed successfully!
```

## Add-on Products List

### Food & Beverage (5 products)
1. **Gourmet Beach BBQ** (`addon-gourmet-bbq`) - $180/day
2. **Picnic Hamper** (`addon-picnic-hamper`) - $85/booking
3. **Seafood Platter** (`addon-seafood-platter`) - $150/day
4. **BBQ on the Beach** (`addon-bbq`) - $120/day
5. **Gourmet Picnic Package** (`addon-picnic`) - $95/booking

### Connectivity (2 products)
6. **Always-on High-Speed Internet** (`addon-internet`) - $30/day
7. **Starlink Satellite Internet** (`addon-starlink`) - $50/day

### Photography (4 products)
8. **Aerial Photography Package** (`addon-drone-photography`) - $200/booking
9. **GoPro Package** (`addon-gopro`) - $75/booking
10. **Professional Photo Album** (`addon-photo-album`) - $150/booking
11. **Professional Camera Rental** (`addon-camera`) - $100/booking

### Accommodation & Comfort (3 products)
12. **Glamping Setup** (`addon-glamping`) - $250/day
13. **Beach Cabana** (`addon-beach-cabana`) - $180/day
14. **Eco-Lodge Upgrade** (`addon-eco-lodge`) - $300/day

### Activities & Equipment (5 products)
15. **Fishing Equipment** (`addon-fishing`) - $65/day
16. **Sandboarding Gear** (`addon-sandboarding`) - $45/booking
17. **Bodyboarding Set** (`addon-bodyboarding`) - $35/booking
18. **Paddleboarding Package** (`addon-paddleboarding`) - $55/day
19. **Kayaking Adventure** (`addon-kayaking`) - $75/day

## Troubleshooting

### Issue: "API responded with 401"

**Cause:** Missing or invalid admin token

**Solution:**
```bash
# Set the admin token environment variable
export MEDUSA_ADMIN_TOKEN=<your-token>

# Or add to .env.production
echo "MEDUSA_ADMIN_TOKEN=<your-token>" >> .env.production
```

### Issue: "Product not found in API"

**Cause:** Region doesn't exist or pricing not configured

**Solution:**
```bash
# Verify region exists in Medusa admin
# Check: Admin → Settings → Regions → Australia

# Ensure region ID matches
NEXT_PUBLIC_DEFAULT_REGION_ID=reg_01K9S1YB6T87JJW43F5ZAE8HWG
```

### Issue: "Failed to fetch images"

**Cause:** Images not deployed to Vercel or incorrect base URL

**Solution:**
```bash
# Verify images are in public folder
ls -la /Users/Karim/med-usa-4wd/storefront/public/images/addons/

# Check VERCEL_URL is set correctly
echo $VERCEL_URL

# Verify image accessibility
curl https://sunshine-coast-4wd-tours.vercel.app/images/addons/addon-glamping.jpg
```

### Issue: "Backend connection timeout"

**Cause:** Backend not running or network issues

**Solution:**
```bash
# Test backend connectivity
curl https://4wd-tours-production.up.railway.app/health

# Check Railway deployment status
railway status

# Restart backend if needed
railway up
```

## Post-Seeding Verification

After running the seed script, verify the results:

### 1. Check Medusa Admin

```
1. Login to Medusa Admin: https://4wd-tours-production.up.railway.app/admin
2. Navigate to Products
3. Filter by category: "Add-ons" or search by handle prefix "addon-"
4. Verify 19 products are present
5. Check each product has:
   - Title
   - Description
   - Image (thumbnail visible)
   - Price in AUD
   - Metadata (category, pricing_type)
```

### 2. Test Store API

```bash
# Fetch all add-ons
curl "https://4wd-tours-production.up.railway.app/store/add-ons?region_id=reg_01K9S1YB6T87JJW43F5ZAE8HWG" \
  -H "x-publishable-api-key: pk_c1aea896aab279e937a2375566b06bfda34775b149b33353ca77eb3e8588a91b"

# Expected response: { "add_ons": [...19 products...] }
```

### 3. Test Frontend Integration

```bash
# Visit add-ons page
open https://sunshine-coast-4wd-tours.vercel.app/addons

# Check:
# - All 19 add-ons display
# - Images load correctly
# - Prices show correctly (e.g., "$180.00" not "18000")
# - Categories filter works
# - Add to cart functionality works
```

## Maintenance

### Adding New Add-ons

1. Add product data to `ADDON_PRODUCTS` array in script
2. Add optimized image to `/public/images/addons/`
3. Update image manifest: `/public/addon-images-manifest.json`
4. Run script: `npm run seed:addons`

### Updating Existing Add-ons

The script is **idempotent** and will skip existing products. To update:

1. Manually update via Medusa Admin, OR
2. Delete products in Admin and re-run script, OR
3. Modify script to include update logic

### Removing Add-ons

**Not handled by script.** To remove:

1. Use Medusa Admin UI, OR
2. Use Medusa Admin API:
   ```bash
   curl -X DELETE "https://4wd-tours-production.up.railway.app/admin/products/{product_id}" \
     -H "Authorization: Bearer ${MEDUSA_ADMIN_TOKEN}"
   ```

## Related Documentation

- **Pricing Migration:** `/Users/Karim/med-usa-4wd/docs/MEDUSA-V2-PRICING-MIGRATION.md`
- **Developer Pricing Guide:** `/Users/Karim/med-usa-4wd/docs/DEVELOPER-PRICING-GUIDE.md`
- **Add-on Image Manifest:** `/Users/Karim/med-usa-4wd/storefront/public/addon-images-manifest.json`
- **Add-on Service:** `/Users/Karim/med-usa-4wd/storefront/lib/data/addons-service.ts`
- **Medusa Docs:** https://docs.medusajs.com/resources/commerce-modules/product

## Support

For issues or questions:

1. Check logs from script execution
2. Verify all prerequisites are met
3. Test backend connectivity
4. Check Medusa Admin for partial success
5. Review error messages in script output

## Memory Storage

This plan has been stored in memory at: `swarm/addon-migration/seed-script`
