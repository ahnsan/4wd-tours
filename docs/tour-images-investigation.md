# Tour Images Investigation Report

**Date:** 2025-11-08
**Project:** Medusa 4WD Tours - Sunshine Coast
**Objective:** Investigate current image handling and document Medusa product image upload process

---

## Executive Summary

This investigation reveals that:
1. **Current State**: All 5 tour products in Medusa have NO images (`thumbnail: null`, `images: []`)
2. **Available Photos**: 7 high-quality photos exist in `/storefront/public/images/tours/`
3. **Frontend Implementation**: Uses fallback to default image when `product.thumbnail` is null
4. **Action Required**: Upload photos to Medusa via Admin UI or API

---

## 1. Current State Analysis

### 1.1 How Images Work Now

**Tours Page Flow:**
1. `/storefront/app/tours/page.tsx` calls `fetchAllTours()` from tours-service
2. `tours-service.ts` fetches products from Medusa API at `http://localhost:9000/store/products`
3. `convertProductToTour()` function maps `product.thumbnail` to `tour.image`
4. **Fallback behavior:** Line 93 in tours-service.ts:
   ```typescript
   image: product.thumbnail || '/images/tour_options.png'
   ```

**TourCard Component:**
1. `/storefront/components/Tours/TourCard.tsx` displays tour cards
2. Uses Next.js Image component with `tour.thumbnail`
3. **Fallback behavior:** Line 34 in TourCard.tsx:
   ```typescript
   src={tour.thumbnail || 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop'}
   ```

**Current Behavior:**
- All tours display the Unsplash fallback image
- No actual tour-specific images are shown
- Local photos in `/storefront/public/images/tours/` are NOT being used

### 1.2 Products in Medusa (Current State)

**API Query Results:**
```bash
curl "http://localhost:9000/store/products?region_id=reg_01K9G4HA190556136E7RJQ4411" \
  -H "x-publishable-api-key: pk_34de56e6f305b46e6d22bb1d2d3304bd9eea498066ca7749bd667318dca31ffc"
```

**All 5 Tour Products:**

| Handle | Title | Thumbnail | Images |
|--------|-------|-----------|--------|
| `1d-rainbow-beach` | 1 Day Rainbow Beach Tour | `null` | `[]` |
| `1d-fraser-island` | 1 Day Fraser Island Tour | `null` | `[]` |
| `2d-fraser-rainbow` | 2 Day Fraser + Rainbow Combo | `null` | `[]` |
| `3d-fraser-rainbow` | 3 Day Fraser & Rainbow Combo | `null` | `[]` |
| `4d-fraser-rainbow` | 4 Day Fraser & Rainbow Combo | `null` | `[]` |

**3 Add-on Products:**
- `addon-internet` - Always-on High-Speed Internet
- `addon-glamping` - Glamping Setup
- `addon-bbq` - BBQ on the Beach

**Status:** NO products have images uploaded to Medusa

---

## 2. Available Photos

### 2.1 Photo Inventory

**Location:** `/Users/Karim/med-usa-4wd/storefront/public/images/tours/`

| Filename | Dimensions | File Size | Description |
|----------|-----------|-----------|-------------|
| `4wd-on-beach.jpg` | 4000x6000 | 1.03 MB | 4WD vehicle on beach (portrait) |
| `Double-island-2.jpg` | 4000x3000 | 1.64 MB | Double Island Point alternate view |
| `double-island-point.jpg` | 4000x3000 | 1.69 MB | Double Island Point coastal scene |
| `kgari-aerial.jpg` | 3024x4032 | 1.83 MB | K'gari aerial view |
| `kgari-dingo.jpg` | 6000x4000 | 1.71 MB | K'gari dingo in natural habitat |
| `kgari-wreck.jpg` | 3004x5351 | 1.28 MB | Maheno Shipwreck (portrait) |
| `rainbow-beach.jpg` | 4000x3000 | 1.28 MB | Rainbow Beach colored cliffs |

**Total:** 7 high-quality JPEG images
**Quality:** All progressive JPEGs, 72 DPI, suitable for web use
**Source:** Originally in `/Users/Karim/Downloads/4wd-photos/` (still available)

### 2.2 Photo Mapping (photo-map.ts)

**File:** `/Users/Karim/med-usa-4wd/storefront/lib/data/photo-map.ts`

This TypeScript file provides:
- Named constants for all photo paths
- Photo dimensions and metadata
- SEO-optimized alt text for each image
- Display size recommendations
- Helper functions for photo selection

**Key exports:**
```typescript
export const TOUR_PHOTOS = {
  hero: '/images/tours/double-island-point.jpg',
  beach: '/images/tours/rainbow-beach.jpg',
  adventure: '/images/tours/4wd-on-beach.jpg',
  wildlife: '/images/tours/kgari-dingo.jpg',
  landmarks: '/images/tours/kgari-wreck.jpg',
  coastal: '/images/tours/double-island-point.jpg',
  coastalAlt: '/images/tours/Double-island-2.jpg',
}
```

**Note:** This mapping is for frontend display only and is NOT currently connected to Medusa products.

---

## 3. Medusa Image API Documentation

### 3.1 Image Storage Architecture

**Medusa v2 File Module:**
- **Local Development:** Uses built-in Local File Module Provider
- **Storage Location:** `/uploads` directory (created automatically)
- **Production:** Should use S3 File Module Provider
- **Default Behavior:** Local File Module is registered by default in development

**Configuration:**
- File: `/Users/Karim/med-usa-4wd/medusa-config.ts`
- No explicit file service configuration needed for local development
- Module system handles file uploads automatically

### 3.2 Product Image Structure

**Medusa v2 Product Schema:**
```typescript
{
  id: string,
  handle: string,
  title: string,
  thumbnail: string | null,  // Main product image URL
  images: [                   // Array of product images
    {
      id: string,
      url: string,
      metadata: object
    }
  ]
}
```

**Key Points:**
- `thumbnail` is the primary product image shown in listings
- `images` array can contain multiple product images
- First image in `images` array is typically used as thumbnail
- Images are stored as URLs pointing to uploaded files

### 3.3 Upload Methods

#### Method 1: Medusa Admin UI (Recommended for Initial Setup)

**Access:** http://localhost:9000/app (when Medusa dev server is running)

**Steps:**
1. Navigate to Products section
2. Click on product to edit
3. Click "Media" section
4. Upload images via drag-drop or file picker
5. Select one image and click "Make thumbnail"
6. Save product

**Advantages:**
- Visual interface
- Easy image preview
- Drag-and-drop support
- No authentication hassle
- Can set thumbnail immediately

#### Method 2: Admin API (Programmatic Upload)

**Endpoint:** `POST /admin/uploads`

**Authentication Required:**
- Must have admin API token
- Token obtained via `POST /admin/auth/token` with admin credentials

**Upload Process:**
1. Authenticate to get admin token
2. Upload file(s) to `/admin/uploads`
3. Receive file URLs in response
4. Update product with image URLs via `POST /admin/products/{id}`

**Example (Conceptual):**
```bash
# Step 1: Authenticate (admin credentials required)
curl -X POST http://localhost:9000/admin/auth/token \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@medusa.com", "password": "supersecret"}'

# Step 2: Upload image
curl -X POST http://localhost:9000/admin/uploads \
  -H "Authorization: Bearer {admin_token}" \
  -F "files=@/path/to/image.jpg"

# Step 3: Update product with image URL
curl -X POST http://localhost:9000/admin/products/{product_id} \
  -H "Authorization: Bearer {admin_token}" \
  -H "Content-Type: application/json" \
  -d '{"thumbnail": "http://localhost:9000/uploads/image.jpg"}'
```

**Challenges:**
- Requires admin authentication setup
- More complex than UI method
- Need to handle multipart form data
- Must link uploaded files to products manually

### 3.4 Known Issues (From Research)

**Issue 1: Localhost URLs in Production**
- Some users report `thumbnail` URLs showing `localhost:9000` even in deployed environments
- Solution: Configure proper backend URL in environment variables

**Issue 2: Uploads Directory**
- `/uploads` directory created automatically on first upload
- Currently does NOT exist in this project (no uploads yet)

**Issue 3: File Service Configuration**
- Medusa v2 uses Local File Module by default
- Should switch to S3/MinIO for production
- Current config has NO file service specified (uses defaults)

---

## 4. Recommended Photo Mappings

### 4.1 Tour-to-Photo Assignments

Based on tour names, descriptions, and available photos:

| Tour Handle | Tour Title | Recommended Photo | Rationale |
|-------------|-----------|-------------------|-----------|
| `1d-fraser-island` | 1 Day Fraser Island Tour | `kgari-aerial.jpg` | Shows iconic Fraser Island (K'gari) landscape from aerial view |
| `1d-rainbow-beach` | 1 Day Rainbow Beach Tour | `rainbow-beach.jpg` | Perfect match - shows Rainbow Beach colored cliffs |
| `2d-fraser-rainbow` | 2 Day Fraser + Rainbow Combo | `double-island-point.jpg` | Shows coastal scenery between both locations |
| `3d-fraser-rainbow` | 3 Day Fraser & Rainbow Combo | `kgari-wreck.jpg` | Iconic Maheno Shipwreck - major Fraser Island landmark |
| `4d-fraser-rainbow` | 4 Day Fraser & Rainbow Combo | `4wd-on-beach.jpg` | Action shot showing 4WD adventure experience |

**Alternative Options:**
- `1d-fraser-island` could also use `kgari-dingo.jpg` (wildlife highlight)
- `2d-fraser-rainbow` could use `Double-island-2.jpg` (alternate coastal view)

**Add-on Products:**
- `addon-internet` - No specific photo needed (icon/symbol better)
- `addon-glamping` - Could use `kgari-aerial.jpg` (camping location context)
- `addon-bbq` - Could use `double-island-point.jpg` (beach BBQ setting)

### 4.2 Gallery Images

**For Tour Detail Pages:**
Each tour should have a gallery of 3-5 images showing different aspects:

**1 Day Fraser Island Tour Gallery:**
1. `kgari-aerial.jpg` (primary/thumbnail)
2. `kgari-dingo.jpg` (wildlife)
3. `kgari-wreck.jpg` (landmarks)

**1 Day Rainbow Beach Tour Gallery:**
1. `rainbow-beach.jpg` (primary/thumbnail)
2. `double-island-point.jpg` (coastal scenery)
3. `4wd-on-beach.jpg` (activity)

**Multi-day Tours Gallery:**
1. Primary photo (thumbnail)
2. `4wd-on-beach.jpg` (adventure/activity)
3. `Double-island-2.jpg` or other scenic shots

---

## 5. Upload Process - Step-by-Step

### 5.1 Prerequisites

**Before Starting:**
1. Ensure Medusa dev server is running: `npm run dev`
2. Verify server is accessible at `http://localhost:9000`
3. Confirm photos exist at `/Users/Karim/med-usa-4wd/storefront/public/images/tours/`
4. Access Medusa Admin UI at `http://localhost:9000/app`

### 5.2 Upload via Medusa Admin UI (RECOMMENDED)

**For Each Tour Product:**

1. **Navigate to Product:**
   - Go to http://localhost:9000/app
   - Click "Products" in sidebar
   - Find product (e.g., "1 Day Fraser Island Tour")
   - Click product to open details

2. **Upload Image:**
   - Scroll to "Media" section
   - Click "Upload" or drag-and-drop image
   - Select file from `/Users/Karim/med-usa-4wd/storefront/public/images/tours/`
   - Wait for upload to complete

3. **Set as Thumbnail:**
   - Click on uploaded image
   - Select "Make thumbnail" from dropdown
   - Verify thumbnail badge appears

4. **Save Product:**
   - Click "Save" button at top right
   - Confirm changes are saved

5. **Verify Upload:**
   - Check product list shows thumbnail
   - Test API endpoint:
     ```bash
     curl "http://localhost:9000/store/products?handle={product_handle}&region_id=reg_01K9G4HA190556136E7RJQ4411" \
       -H "x-publishable-api-key: pk_34de56e6f305b46e6d22bb1d2d3304bd9eea498066ca7749bd667318dca31ffc"
     ```
   - Verify `thumbnail` field is no longer `null`

**Repeat for all 5 tour products.**

### 5.3 Verification Checklist

After uploading all images:

- [ ] `/uploads` directory exists in project root
- [ ] All 5 tour products have `thumbnail` value (not null)
- [ ] All 5 tour products have at least 1 item in `images` array
- [ ] Storefront tours page shows actual tour images (not fallbacks)
- [ ] Images display correctly in tour cards
- [ ] Images are optimized and load quickly

### 5.4 Troubleshooting

**Issue:** Images not showing on storefront after upload

**Solutions:**
1. Clear Next.js cache: `rm -rf storefront/.next`
2. Restart Next.js dev server: `cd storefront && npm run dev`
3. Check browser console for errors
4. Verify API returns correct thumbnail URL
5. Check CORS settings in `medusa-config.ts`

**Issue:** Upload fails in Admin UI

**Solutions:**
1. Check Medusa server logs for errors
2. Verify file permissions on project directory
3. Ensure image file size is reasonable (< 5MB recommended)
4. Try smaller/compressed version of image

**Issue:** Thumbnail URL shows localhost in production

**Solutions:**
1. Set proper `BACKEND_URL` environment variable
2. Configure file service with production domain
3. Use S3/CDN for production images

---

## 6. Image Optimization Recommendations

### 6.1 Current Photo Sizes

**Issues:**
- All photos are 1-2 MB (large for web)
- Dimensions are very high (4000-6000px)
- Not optimized for different screen sizes

**Impact:**
- Slower page load times
- Poor mobile experience
- Higher bandwidth usage
- Lower PageSpeed scores

### 6.2 Optimization Strategy

**For Medusa Uploads:**
1. Create optimized versions BEFORE uploading:
   ```bash
   # Use imagemagick or similar
   convert original.jpg -resize 1920x1080 -quality 85 optimized.jpg
   ```

2. **Recommended Sizes:**
   - **Thumbnail/Card Images:** 800x600px (landscape) or 600x800px (portrait)
   - **Hero Images:** 1920x1080px
   - **Gallery Images:** 1200x900px

3. **Compression:**
   - Use 80-85% JPEG quality
   - Consider WebP format for better compression
   - Enable progressive rendering

**For Next.js Display:**
- Continue using Next.js Image component (already implemented)
- Set proper `sizes` attribute for responsive loading
- Use `priority={true}` for above-fold images
- Enable lazy loading for gallery images

### 6.3 Performance Targets

**Goals (from CLAUDE.md):**
- PageSpeed Desktop: 90+
- PageSpeed Mobile: 90+
- LCP (Largest Contentful Paint): < 2.5s
- CLS (Cumulative Layout Shift): < 0.1

**Image Requirements:**
- Alt text on all images (already in photo-map.ts)
- Proper width/height to prevent CLS
- Responsive image sizes
- WebP/AVIF formats where supported

---

## 7. Next Steps

### 7.1 Immediate Actions

1. **Upload Images to Medusa:**
   - Use Medusa Admin UI method (Section 5.2)
   - Upload all 5 tour product images
   - Set thumbnails for each product
   - Verify via API

2. **Test Storefront:**
   - Clear Next.js cache
   - Restart storefront dev server
   - Visit `/tours` page
   - Verify images display correctly

3. **Document Results:**
   - Take screenshots of tours page with images
   - Note any issues or errors
   - Update this document with findings

### 7.2 Future Enhancements

1. **Image Optimization:**
   - Create script to auto-optimize images before upload
   - Generate multiple sizes for responsive display
   - Convert to WebP/AVIF formats

2. **Gallery Implementation:**
   - Upload multiple images per product
   - Implement image gallery on tour detail pages
   - Add lightbox/zoom functionality

3. **Production Setup:**
   - Configure S3 or CDN for image storage
   - Set up image optimization pipeline
   - Enable CDN caching

4. **SEO Improvements:**
   - Ensure all images have descriptive alt text
   - Add Schema.org ImageObject markup
   - Optimize for social media sharing (OG images)

---

## 8. Technical Reference

### 8.1 Key Files

**Backend (Medusa):**
- `/Users/Karim/med-usa-4wd/medusa-config.ts` - Medusa configuration
- `/Users/Karim/med-usa-4wd/.env` - Environment variables
- `/Users/Karim/med-usa-4wd/uploads/` - File upload directory (created on first upload)

**Frontend (Storefront):**
- `/Users/Karim/med-usa-4wd/storefront/lib/data/tours-service.ts` - Tour data fetching
- `/Users/Karim/med-usa-4wd/storefront/lib/data/photo-map.ts` - Photo mapping constants
- `/Users/Karim/med-usa-4wd/storefront/components/Tours/TourCard.tsx` - Tour card component
- `/Users/Karim/med-usa-4wd/storefront/app/tours/page.tsx` - Tours listing page
- `/Users/Karim/med-usa-4wd/storefront/public/images/tours/` - Local photo storage

### 8.2 API Endpoints

**Store API (Public):**
- `GET /store/products` - List all products
- `GET /store/products?handle={handle}` - Get product by handle
- `GET /store/products?region_id={id}` - Get products with regional pricing

**Admin API (Authenticated):**
- `POST /admin/auth/token` - Authenticate admin user
- `POST /admin/uploads` - Upload files
- `POST /admin/products/{id}` - Update product
- `GET /admin/products` - List products (admin view)

### 8.3 Environment Variables

**Current Configuration:**
```env
STORE_CORS=http://localhost:8000,https://docs.medusajs.com
ADMIN_CORS=http://localhost:5173,http://localhost:9000,https://docs.medusajs.com
DATABASE_URL=postgres://localhost/medusa-4wd-tours
JWT_SECRET=<configured>
COOKIE_SECRET=<configured>
```

**Storefront Configuration:**
```env
NEXT_PUBLIC_API_URL=http://localhost:9000
NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY=pk_34de56e6f305b46e6d22bb1d2d3304bd9eea498066ca7749bd667318dca31ffc
```

### 8.4 Resources

**Official Documentation:**
- Medusa v2 Docs: https://docs.medusajs.com
- File Module: https://docs.medusajs.com/resources/infrastructure-modules/file
- Local File Provider: https://docs.medusajs.com/resources/architectural-modules/file/local
- Admin User Guide: https://docs.medusajs.com/user-guide/products/create

**Related Issues:**
- Product variant images: https://github.com/medusajs/medusa/releases/tag/v2.11.2
- Thumbnail issues: https://github.com/medusajs/medusa/issues/11682

---

## Appendix A: Quick Reference Commands

### Check Product Images
```bash
curl -s "http://localhost:9000/store/products?region_id=reg_01K9G4HA190556136E7RJQ4411" \
  -H "x-publishable-api-key: pk_34de56e6f305b46e6d22bb1d2d3304bd9eea498066ca7749bd667318dca31ffc" \
  | jq '.products[] | {handle, title, thumbnail, images}'
```

### List Available Photos
```bash
ls -lh /Users/Karim/med-usa-4wd/storefront/public/images/tours/
```

### Start Medusa Server
```bash
cd /Users/Karim/med-usa-4wd
npm run dev
```

### Access Medusa Admin
```
http://localhost:9000/app
```

### Clear Next.js Cache
```bash
cd /Users/Karim/med-usa-4wd/storefront
rm -rf .next
npm run dev
```

---

## Appendix B: Photo-to-Tour Mapping Summary

| Photo File | Tour Handle | Priority |
|-----------|-------------|----------|
| `kgari-aerial.jpg` | `1d-fraser-island` | Primary |
| `rainbow-beach.jpg` | `1d-rainbow-beach` | Primary |
| `double-island-point.jpg` | `2d-fraser-rainbow` | Primary |
| `kgari-wreck.jpg` | `3d-fraser-rainbow` | Primary |
| `4wd-on-beach.jpg` | `4d-fraser-rainbow` | Primary |
| `kgari-dingo.jpg` | All Fraser tours | Gallery |
| `Double-island-2.jpg` | All tours | Gallery |

---

**Report Generated:** 2025-11-08
**Status:** Ready for implementation
**Next Action:** Upload images via Medusa Admin UI (Section 5.2)
