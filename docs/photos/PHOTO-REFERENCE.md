# Photo Reference Guide - Sunshine Coast 4WD Tours

Quick reference for which photos are used where in the application.

---

## 🏠 HOME PAGE

### Hero Section
- **Component:** `/storefront/components/Hero/Hero.tsx`
- **Photo:** `kgari-aerial.jpg`
- **Alt Text:** "Aerial view of K'gari (Fraser Island) pristine coastline - Sunshine Coast 4WD Tours adventure destination"
- **Size:** Full viewport
- **Loading:** `priority={true}`
- **Quality:** 90

### Tour Options Cards

#### 1. Tagalong Tours Card
- **Component:** `/storefront/components/TourOptions/TourOptions.tsx`
- **Photo:** `4wd-on-beach.jpg`
- **Alt Text:** "4WD vehicle driving on pristine beach - Sunshine Coast 4WD Tours tagalong adventure experience"
- **Size:** Card (400x300 display)
- **Loading:** Lazy
- **Quality:** 80

#### 2. 4WD Camping Card
- **Component:** `/storefront/components/TourOptions/TourOptions.tsx`
- **Photo:** `kgari-wreck.jpg`
- **Alt Text:** "Historic Maheno Shipwreck on 75 Mile Beach, K'gari - 4WD camping tour destination"
- **Size:** Card (400x300 display)
- **Loading:** Lazy
- **Quality:** 80

#### 3. Fraser Island Hiking Card
- **Component:** `/storefront/components/TourOptions/TourOptions.tsx`
- **Photo:** `rainbow-beach.jpg`
- **Alt Text:** "Rainbow Beach colored cliffs and golden sand - Fraser Island hiking tour starting point"
- **Size:** Card (400x300 display)
- **Loading:** Lazy
- **Quality:** 80

---

## 🎫 TOUR DETAIL PAGES

### Hero Image
- **Component:** `/storefront/app/tours/[handle]/tour-detail-client.tsx`
- **Photo:** First image from gallery (typically `kgari-aerial.jpg`)
- **Alt Text:** Dynamic based on tour title
- **Size:** Full width hero
- **Loading:** `priority={true}`
- **Quality:** Default

### Photo Gallery (5 images per tour)

#### Image 1
- **Photo:** `kgari-aerial.jpg`
- **Alt Text:** "[Tour Title] - Aerial view of K'gari (Fraser Island) pristine coastline with turquoise waters"
- **Loading:** Priority (used as hero)

#### Image 2
- **Photo:** `4wd-on-beach.jpg`
- **Alt Text:** "[Tour Title] - 4WD vehicle driving on pristine beach adventure"
- **Loading:** Lazy

#### Image 3
- **Photo:** `rainbow-beach.jpg`
- **Alt Text:** "[Tour Title] - Rainbow Beach colored cliffs with golden sand and ocean views"
- **Loading:** Lazy

#### Image 4
- **Photo:** `kgari-wreck.jpg`
- **Alt Text:** "[Tour Title] - Historic Maheno Shipwreck on 75 Mile Beach"
- **Loading:** Lazy

#### Image 5
- **Photo:** `double-island-point.jpg`
- **Alt Text:** "[Tour Title] - Double Island Point coastal scenery and 4WD track"
- **Loading:** Lazy

### Gallery Thumbnails
- **Size:** 120x80px
- **Loading:** Lazy
- **Quality:** 80
- **Interactive:** Click to change main hero image

---

## 📸 PHOTO LIBRARY

### Available Photos

| File Name | Dimensions | Size | Primary Use | Keywords |
|-----------|------------|------|-------------|----------|
| `kgari-aerial.jpg` | 3024x4032 | 1.8 MB | Hero sections | K'gari, aerial, coastline, pristine |
| `4wd-on-beach.jpg` | 4000x6000 | 1.0 MB | Action/Adventure | 4WD, beach, driving, adventure |
| `rainbow-beach.jpg` | 4000x3000 | 1.3 MB | Beach tours | Rainbow Beach, cliffs, golden sand |
| `kgari-wreck.jpg` | 3004x5351 | 1.3 MB | Landmarks | Maheno, shipwreck, 75 Mile Beach |
| `kgari-dingo.jpg` | 6000x4000 | 1.7 MB | Wildlife | Dingo, wildlife, eco-tourism |
| `double-island-point.jpg` | 4000x3000 | 1.7 MB | Coastal scenes | Double Island, coastal, scenery |
| `Double-island-2.jpg` | 4000x3000 | 1.6 MB | Gallery | Double Island, panoramic, rocky |

---

## 🎨 Photo Categories

### Hero/Banner Images (Priority Loading)
- `kgari-aerial.jpg` - Main hero image
- Best for: Above-the-fold, landing pages, main headers

### Action/Adventure Photos (Lazy Loading)
- `4wd-on-beach.jpg` - Dynamic 4WD action
- Best for: Activity highlights, adventure sections

### Landscape/Scenic Photos (Lazy Loading)
- `rainbow-beach.jpg` - Colorful coastal cliffs
- `double-island-point.jpg` - Coastal scenery
- `Double-island-2.jpg` - Panoramic views
- Best for: Background sections, scenic highlights

### Landmark Photos (Lazy Loading)
- `kgari-wreck.jpg` - Historic shipwreck
- Best for: Points of interest, historical content

### Wildlife Photos (Lazy Loading)
- `kgari-dingo.jpg` - Native wildlife
- Best for: Eco-tourism, wildlife sections

---

## 🔧 Usage Guide

### Importing Photos

```typescript
// Import from photo-map.ts
import { TOUR_PHOTOS, PHOTO_ALT_TEXT, getPhotoWithMetadata } from '@/lib/data/photo-map';

// Use in component
<Image
  src={TOUR_PHOTOS.hero}
  alt={PHOTO_ALT_TEXT.hero}
  fill
  priority
/>

// Or use helper function
const photoData = getPhotoWithMetadata('hero');
<Image
  src={photoData.src}
  alt={photoData.alt}
  width={photoData.width}
  height={photoData.height}
  priority={photoData.priority}
/>
```

### Adding New Photos

1. **Add photo to directory:**
   ```bash
   cp new-photo.jpg /Users/Karim/med-usa-4wd/storefront/public/images/tours/
   ```

2. **Update photo-map.ts:**
   ```typescript
   export const TOUR_PHOTOS = {
     // ... existing photos
     newPhoto: '/images/tours/new-photo.jpg',
   } as const;

   export const PHOTO_DIMENSIONS = {
     // ... existing dimensions
     newPhoto: { width: 1920, height: 1080, priority: false },
   } as const;

   export const PHOTO_ALT_TEXT = {
     // ... existing alt text
     newPhoto: 'Descriptive SEO-optimized alt text here',
   };
   ```

3. **Use in components:**
   ```typescript
   import { TOUR_PHOTOS } from '@/lib/data/photo-map';

   <Image src={TOUR_PHOTOS.newPhoto} alt="..." />
   ```

---

## 🎯 SEO Keywords by Photo

### kgari-aerial.jpg
- K'gari
- Fraser Island
- Aerial view
- Coastline
- Pristine
- Turquoise waters
- Sunshine Coast
- 4WD Tours

### 4wd-on-beach.jpg
- 4WD
- Four wheel drive
- Beach driving
- Adventure
- Sunshine Coast
- Tours
- Off-road
- Beach experience

### rainbow-beach.jpg
- Rainbow Beach
- Colored cliffs
- Golden sand
- Ocean views
- Sunshine Coast
- Coastal scenery
- Beach destination

### kgari-wreck.jpg
- Maheno Shipwreck
- 75 Mile Beach
- Fraser Island
- Historic landmark
- K'gari
- Iconic
- Wreck
- Landmark

### kgari-dingo.jpg
- K'gari dingo
- Fraser Island wildlife
- Native wildlife
- Eco-tourism
- Wildlife experience
- Natural habitat
- Conservation

### double-island-point.jpg
- Double Island Point
- Coastal scenery
- 4WD track
- Sunshine Coast
- Adventure destination
- Headland
- Beach access

---

## 📱 Responsive Sizes

### Desktop (> 1024px)
- Hero: 1512x2016px (or larger)
- Cards: 640x480px
- Gallery: 1024x768px

### Tablet (768px - 1024px)
- Hero: 1024x1365px
- Cards: 512x384px
- Gallery: 768x576px

### Mobile (< 768px)
- Hero: 768x1024px
- Cards: 320x240px
- Gallery: 480x360px

---

## ⚡ Performance Guidelines

### When to Use `priority={true}`
- ✅ Hero image on home page
- ✅ Main hero image on tour detail pages
- ❌ Below-fold images
- ❌ Gallery thumbnails
- ❌ Tour option cards

### Image Quality Settings
- **Hero images:** `quality={90}` (excellent quality)
- **Feature cards:** `quality={80}` (good quality)
- **Thumbnails:** `quality={75}` (optimized size)
- **Background images:** `quality={70}` (smallest size)

### Sizes Attribute Examples
```tsx
// Full width hero
sizes="100vw"

// Card in grid (3 columns)
sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"

// Sidebar image
sizes="(max-width: 768px) 100vw, 400px"

// Gallery thumbnail
sizes="120px"
```

---

## 🔍 Accessibility Notes

### Alt Text Best Practices
- ✅ Describe what's in the image
- ✅ Include relevant keywords naturally
- ✅ Mention location and activity
- ✅ Keep under 125 characters
- ❌ Don't start with "Image of" or "Picture of"
- ❌ Don't keyword stuff
- ❌ Don't use generic descriptions

### Screen Reader Considerations
- All images have descriptive alt text
- Gallery images have unique descriptions
- Interactive elements have ARIA labels
- Image buttons have aria-label attributes

---

## 📊 Photo Performance

### Expected Load Times
| Photo | Original Size | Optimized Size | Load Time (3G) | Load Time (4G) |
|-------|--------------|----------------|----------------|----------------|
| kgari-aerial.jpg | 1.8 MB | ~180 KB (WebP) | ~2.4s | ~0.6s |
| 4wd-on-beach.jpg | 1.0 MB | ~100 KB (WebP) | ~1.3s | ~0.3s |
| rainbow-beach.jpg | 1.3 MB | ~130 KB (WebP) | ~1.7s | ~0.4s |
| kgari-wreck.jpg | 1.3 MB | ~130 KB (WebP) | ~1.7s | ~0.4s |

*Note: Next.js automatically converts to WebP/AVIF for significant size reduction*

---

## 📝 Quick Reference

### Photo Map Location
```
/Users/Karim/med-usa-4wd/storefront/lib/data/photo-map.ts
```

### Photo Directory
```
/Users/Karim/med-usa-4wd/storefront/public/images/tours/
```

### Import Statement
```typescript
import { TOUR_PHOTOS, PHOTO_ALT_TEXT, getPhotoWithMetadata } from '@/lib/data/photo-map';
```

### Usage Examples
```tsx
// Simple usage
<Image src={TOUR_PHOTOS.hero} alt={PHOTO_ALT_TEXT.hero} fill priority />

// With helper function
const photo = getPhotoWithMetadata('hero');
<Image {...photo} />

// Tour gallery
const galleryImages = getTourGalleryImages(tourCategory);
```

---

**Last Updated:** November 8, 2025
**Maintained By:** Development Team
**Questions?** See `/docs/photos/photo-integration-report.md`
