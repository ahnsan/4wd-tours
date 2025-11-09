# Image Component Fixes - Complete

**Date:** November 8, 2025
**Issue:** Next.js Image components failing with null thumbnail values

---

## Problem

Tours in the database have `null` thumbnails, causing Next.js Image component errors:
```
TypeError: Cannot read properties of null (reading 'default')
```

This error occurs in Next.js's image optimization when `src` is null or points to a non-existent file.

---

## Solution

Replace all null/missing image sources with Unsplash placeholder images and add the `unoptimized` flag for external images.

---

## Files Fixed

### 1. TourCard Component ✅
**File:** `/storefront/components/Tours/TourCard.tsx`
**Line:** 33-41

**Changes:**
```typescript
// Before:
<Image
  src={tour.thumbnail || '/images/tour-placeholder.jpg'}
  alt={tour.title}
  fill
  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
  className={styles.tourImage}
  style={{ objectFit: 'cover' }}
/>

// After:
<Image
  src={tour.thumbnail || 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop'}
  alt={tour.title}
  fill
  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
  className={styles.tourImage}
  style={{ objectFit: 'cover' }}
  unoptimized={!tour.thumbnail}
/>
```

---

### 2. Tour Detail Page - Related Tours ✅
**File:** `/storefront/app/tours/[handle]/page.tsx`
**Line:** 407-414

**Changes:**
```typescript
// Before:
<Image
  src={relatedTour.thumbnail}
  alt={relatedTour.title}
  width={400}
  height={300}
  className={styles.relatedImg}
/>

// After:
<Image
  src={relatedTour.thumbnail || 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop'}
  alt={relatedTour.title}
  width={400}
  height={300}
  className={styles.relatedImg}
  unoptimized={!relatedTour.thumbnail}
/>
```

---

### 3. Tour Detail Page - Gallery ✅
**File:** `/storefront/app/tours/[handle]/page.tsx`
**Line:** 247-254

**Changes:**
```typescript
// Before:
<TourGallery
  images={tour.images || [{ id: '1', url: tour.thumbnail, alt: tour.title }]}
  title={tour.title}
/>

// After:
<TourGallery
  images={tour.images || [{
    id: '1',
    url: tour.thumbnail || 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200&h=800&fit=crop',
    alt: tour.title
  }]}
  title={tour.title}
/>
```

---

### 4. TourGallery Component ✅
**File:** `/storefront/components/Tours/TourGallery.tsx`
**Line:** 21-32

**Changes:**
```typescript
// Added unoptimized flag for external URLs:
<Image
  src={selectedImage.url}
  alt={selectedImage.alt || `${title} - Image ${selectedImageIndex + 1}`}
  width={800}
  height={600}
  quality={90}
  priority={selectedImageIndex === 0}
  loading={selectedImageIndex === 0 ? 'eager' : 'lazy'}
  className={styles.mainImage}
  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 60vw, 800px"
  unoptimized={selectedImage.url.startsWith('http')}  // ← Added this
/>
```

---

## Placeholder Image Used

**Unsplash Image:**
```
https://images.unsplash.com/photo-1506905925346-21bda4d32df4
```

**Variations:**
- Tour cards: `?w=800&h=600&fit=crop`
- Related tours: `?w=800&h=600&fit=crop`
- Gallery: `?w=1200&h=800&fit=crop`

**Image Description:** Beautiful mountain landscape (suitable for 4WD tours)

---

## Testing

✅ **Tour List Page** - http://localhost:8000/tours
- All tour cards display placeholder images
- No Image component errors

✅ **Tour Detail Pages** - http://localhost:8000/tours/[handle]
- Main gallery shows placeholder image
- Related tours show placeholder images
- No runtime errors

---

## Next.js Image Configuration

When using external images, Next.js requires either:
1. **Option A:** Add domain to `next.config.js` remotePatterns
2. **Option B:** Use `unoptimized={true}` flag (our choice)

We used Option B to avoid configuration changes and ensure immediate functionality.

---

## Adding Real Images (Future)

### Option 1: Via Medusa Admin
1. Visit http://localhost:9000/app
2. Go to Products → Select tour
3. Upload images in the Media section
4. Set one as thumbnail

### Option 2: Via Script
Create `/scripts/add-tour-images.ts`:
```typescript
import { ExecArgs } from "@medusajs/framework/types"
import { Modules } from "@medusajs/framework/utils"

const TOUR_IMAGES = {
  '1d-fraser-island': '/images/tours/fraser-island.jpg',
  '1d-rainbow-beach': '/images/tours/rainbow-beach.jpg',
  // etc.
}

export default async function addImages({ container }: ExecArgs) {
  const productService = container.resolve(Modules.PRODUCT)

  const products = await productService.listProducts({})

  for (const product of products) {
    const thumbnail = TOUR_IMAGES[product.handle]
    if (thumbnail) {
      await productService.updateProducts(product.id, {
        thumbnail,
        images: [{ url: thumbnail }]
      })
      console.log(`✓ Updated ${product.handle}`)
    }
  }
}
```

Run with:
```bash
pnpm medusa exec ./scripts/add-tour-images.ts
```

---

## Performance Impact

**External Images (Unsplash):**
- ✅ No initial setup required
- ✅ Free to use
- ✅ High quality images
- ⚠️ Requires external HTTP requests
- ⚠️ No Next.js optimization (when using `unoptimized`)

**Local Images (Recommended for Production):**
- ✅ Faster load times
- ✅ Next.js automatic optimization
- ✅ Responsive image variants
- ✅ WebP/AVIF conversion
- ⚠️ Requires initial setup

---

## Status

**All Image Component errors fixed** ✅

Tours pages now load successfully with placeholder images. When real images are added to products, they will automatically replace the placeholders without code changes.

---

## Affected URLs

All working with placeholder images:
- http://localhost:8000/tours
- http://localhost:8000/tours/1d-fraser-island
- http://localhost:8000/tours/1d-rainbow-beach
- http://localhost:8000/tours/2d-fraser-rainbow
- http://localhost:8000/tours/3d-fraser-rainbow
- http://localhost:8000/tours/4d-fraser-rainbow
