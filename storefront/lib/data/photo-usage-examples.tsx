/**
 * PHOTO USAGE EXAMPLES
 *
 * This file demonstrates how to use the 4WD tour photos with Next.js Image component
 * for optimal performance and Core Web Vitals scores.
 *
 * PERFORMANCE TARGETS (from CLAUDE.md):
 * - Desktop PageSpeed: 90+
 * - Mobile PageSpeed: 90+
 * - LCP: < 2.5 seconds
 * - CLS: < 0.1
 */

import Image from 'next/image';
import { TOUR_PHOTOS, PHOTO_DIMENSIONS, DISPLAY_SIZES } from './photo-map';

// ============================================================================
// EXAMPLE 1: Hero Section (Above the Fold)
// ============================================================================
// Use priority={true} for above-the-fold images to improve LCP

export function HeroSection() {
  return (
    <section className="relative h-screen w-full">
      <Image
        src={TOUR_PHOTOS.hero}
        alt="Aerial view of K'gari (Fraser Island) showing pristine beaches and rainforest"
        width={PHOTO_DIMENSIONS.hero.width}
        height={PHOTO_DIMENSIONS.hero.height}
        priority={true} // CRITICAL: Improves LCP for hero images
        quality={90}
        className="object-cover"
        sizes="100vw" // Full viewport width
        placeholder="blur"
        blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRg..." // Generate with plaiceholder
      />
    </section>
  );
}

// ============================================================================
// EXAMPLE 2: Feature Cards (Below the Fold)
// ============================================================================
// Use loading="lazy" for below-the-fold images to improve initial page load

export function FeatureCards() {
  const features = [
    {
      key: 'adventure' as const,
      title: '4WD Beach Adventures',
      description: 'Drive along pristine beaches in our 4WD vehicles',
    },
    {
      key: 'beach' as const,
      title: 'Rainbow Beach',
      description: 'Experience the colorful sands of Rainbow Beach',
    },
    {
      key: 'wildlife' as const,
      title: 'Wildlife Encounters',
      description: 'Spot dingoes and other native Australian wildlife',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {features.map((feature) => (
        <div key={feature.key} className="relative h-64 rounded-lg overflow-hidden">
          <Image
            src={TOUR_PHOTOS[feature.key]}
            alt={feature.description}
            width={DISPLAY_SIZES.card.desktop.width}
            height={DISPLAY_SIZES.card.desktop.height}
            loading="lazy" // Lazy load below-the-fold images
            quality={85}
            className="object-cover"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-4">
            <h3 className="text-white text-xl font-bold">{feature.title}</h3>
          </div>
        </div>
      ))}
    </div>
  );
}

// ============================================================================
// EXAMPLE 3: Photo Gallery with Responsive Sizes
// ============================================================================
// Use responsive sizes for optimal loading across devices

export function PhotoGallery() {
  const galleryPhotos = [
    { key: 'coastal' as const, alt: 'Double Island Point lighthouse and coastal views' },
    { key: 'coastalAlt' as const, alt: 'Double Island Point from different angle' },
    { key: 'landmarks' as const, alt: 'Historic Maheno shipwreck on 75 Mile Beach' },
    { key: 'beach' as const, alt: 'Rainbow Beach colored sands and coastline' },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {galleryPhotos.map((photo) => (
        <div key={photo.key} className="relative aspect-[4/3] rounded-lg overflow-hidden">
          <Image
            src={TOUR_PHOTOS[photo.key]}
            alt={photo.alt}
            fill
            loading="lazy"
            quality={85}
            className="object-cover hover:scale-105 transition-transform duration-300"
            sizes="(max-width: 768px) 50vw, 25vw"
          />
        </div>
      ))}
    </div>
  );
}

// ============================================================================
// EXAMPLE 4: Optimized Background Image
// ============================================================================
// For background images with content overlay

export function BackgroundSection() {
  return (
    <section className="relative h-96 w-full">
      <Image
        src={TOUR_PHOTOS.wildlife}
        alt="K'gari dingo in natural habitat"
        fill
        loading="lazy"
        quality={80} // Slightly lower quality for backgrounds
        className="object-cover"
        sizes="100vw"
        priority={false}
      />
      <div className="relative z-10 h-full flex items-center justify-center">
        <div className="bg-white/90 backdrop-blur-sm p-8 rounded-lg max-w-2xl">
          <h2 className="text-3xl font-bold mb-4">Wildlife Conservation</h2>
          <p className="text-lg">
            K'gari is home to the purest strain of dingo in Australia. Our tours emphasize
            responsible wildlife viewing and conservation awareness.
          </p>
        </div>
      </div>
    </section>
  );
}

// ============================================================================
// EXAMPLE 5: Product/Tour Card with Optimized Image
// ============================================================================
// For use in tour listings and product pages

export function TourCard({ tourId }: { tourId: string }) {
  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow">
      <div className="relative h-48">
        <Image
          src={TOUR_PHOTOS.adventure}
          alt="4WD vehicle driving on beach - K'gari adventure tour"
          fill
          loading="lazy"
          quality={85}
          className="object-cover"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />
      </div>
      <div className="p-4">
        <h3 className="text-xl font-bold mb-2">K'gari 4WD Adventure</h3>
        <p className="text-gray-600 mb-4">
          Full-day 4WD tour including beach driving, wildlife spotting, and iconic landmarks
        </p>
        <button className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors">
          Book Now
        </button>
      </div>
    </div>
  );
}

// ============================================================================
// PERFORMANCE TIPS
// ============================================================================
/*
1. ALWAYS use priority={true} for above-the-fold images (hero sections)
2. ALWAYS use loading="lazy" for below-the-fold images
3. ALWAYS specify width/height OR use fill for proper CLS
4. ALWAYS use appropriate quality (90 for hero, 85 for content, 80 for backgrounds)
5. ALWAYS use responsive sizes attribute for optimal loading
6. CONSIDER using placeholder="blur" with blurDataURL for better perceived performance
7. CONSIDER using next/image's built-in optimization over manual optimization
8. TEST with Lighthouse and PageSpeed Insights before deployment

SIZES ATTRIBUTE GUIDE:
- Full width: "100vw"
- Half width on desktop: "(max-width: 768px) 100vw, 50vw"
- Third width on desktop: "(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
- Fixed size: Just use width/height props

ORIENTATION GUIDE (from PHOTO_DIMENSIONS):
- Portrait (vertical): hero, adventure, landmarks
- Landscape (horizontal): beach, wildlife, coastal, coastalAlt
*/
