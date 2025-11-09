# Quick Photo Reference Guide

## Photo Paths

```typescript
import { TOUR_PHOTOS } from '@/lib/data/photo-map';

TOUR_PHOTOS.hero        // kgari-aerial.jpg (3024x4032 portrait)
TOUR_PHOTOS.beach       // rainbow-beach.jpg (4000x3000 landscape)
TOUR_PHOTOS.adventure   // 4wd-on-beach.jpg (4000x6000 portrait)
TOUR_PHOTOS.wildlife    // kgari-dingo.jpg (6000x4000 landscape)
TOUR_PHOTOS.landmarks   // kgari-wreck.jpg (3004x5351 portrait)
TOUR_PHOTOS.coastal     // double-island-point.jpg (4000x3000 landscape)
TOUR_PHOTOS.coastalAlt  // Double-island-2.jpg (4000x3000 landscape)
```

## Quick Usage

```tsx
import Image from 'next/image';
import { TOUR_PHOTOS, PHOTO_DIMENSIONS } from '@/lib/data/photo-map';

// Hero (Above Fold)
<Image
  src={TOUR_PHOTOS.hero}
  alt="K'gari aerial view"
  width={PHOTO_DIMENSIONS.hero.width}
  height={PHOTO_DIMENSIONS.hero.height}
  priority={true}
  quality={90}
/>

// Below Fold
<Image
  src={TOUR_PHOTOS.adventure}
  alt="4WD on beach"
  width={PHOTO_DIMENSIONS.adventure.width}
  height={PHOTO_DIMENSIONS.adventure.height}
  loading="lazy"
  quality={85}
/>
```

## Photo Categories

**Portrait (Vertical):**
- hero (kgari-aerial.jpg)
- adventure (4wd-on-beach.jpg)
- landmarks (kgari-wreck.jpg)

**Landscape (Horizontal):**
- beach (rainbow-beach.jpg)
- wildlife (kgari-dingo.jpg)
- coastal (double-island-point.jpg)
- coastalAlt (Double-island-2.jpg)

## Recommended Usage

| Page Section | Photo | Priority | Quality |
|--------------|-------|----------|---------|
| Homepage Hero | hero | true | 90 |
| Feature Cards | adventure, beach, wildlife | false | 85 |
| Tour Gallery | coastal, coastalAlt, landmarks | false | 85 |
| Backgrounds | wildlife, beach | false | 80 |
| Tour Cards | adventure | false | 85 |

## Performance Checklist

- [ ] Above-fold images use priority={true}
- [ ] Below-fold images use loading="lazy"
- [ ] All images have width/height
- [ ] Responsive sizes attribute used
- [ ] Alt text for SEO
- [ ] Test with Lighthouse

For complete examples, see: `/Users/Karim/med-usa-4wd/storefront/lib/data/photo-usage-examples.tsx`
