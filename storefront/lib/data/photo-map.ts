/**
 * Photo mapping for 4WD tour images
 * All images are optimized for web use and should be used with Next.js Image component
 *
 * PERFORMANCE REQUIREMENTS:
 * - Use Next.js Image component with priority={true} for above-the-fold images
 * - Add proper width/height to prevent CLS (Cumulative Layout Shift)
 * - Target PageSpeed score 90+ on mobile and desktop
 *
 * SEO REQUIREMENTS:
 * - Descriptive alt text for all images
 * - Proper image sizing for social media (OG images)
 * - Schema.org ImageObject markup where applicable
 */

export const TOUR_PHOTOS = {
  // Hero image - Double Island Point coastal scenery
  // Recommended for: Hero sections, landing page banners
  // Use with priority={true} for above-the-fold placement
  hero: '/images/tours/double-island-point.jpg',

  // Beach scenes - Rainbow Beach
  // Recommended for: Beach tour sections, coastal experiences
  beach: '/images/tours/rainbow-beach.jpg',

  // Adventure/Action - 4WD on beach
  // Recommended for: Tour activity highlights, adventure sections
  adventure: '/images/tours/4wd-on-beach.jpg',

  // Wildlife - K'gari Dingo
  // Recommended for: Wildlife sections, eco-tour highlights
  wildlife: '/images/tours/kgari-dingo.jpg',

  // Landmarks - Maheno Shipwreck
  // Recommended for: Points of interest, historical highlights
  landmarks: '/images/tours/kgari-wreck.jpg',

  // Coastal views - Double Island Point
  // Recommended for: Scenic sections, coastal tour highlights
  coastal: '/images/tours/double-island-point.jpg',

  // Additional coastal view - Double Island alternate
  // Recommended for: Gallery, additional scenic content
  coastalAlt: '/images/tours/Double-island-2.jpg',
} as const;

/**
 * Photo metadata for optimization
 * Use these values with Next.js Image component for better performance
 * NOTE: These are the actual dimensions from source files
 */
export const PHOTO_DIMENSIONS = {
  hero: { width: 4000, height: 3000, priority: true }, // Landscape - Double Island Point
  beach: { width: 4000, height: 3000, priority: false }, // Landscape - Rainbow Beach
  adventure: { width: 4000, height: 6000, priority: false }, // Portrait - 4WD on beach
  wildlife: { width: 6000, height: 4000, priority: false }, // Landscape - K'gari dingo
  landmarks: { width: 3004, height: 5351, priority: false }, // Portrait - Maheno wreck
  coastal: { width: 4000, height: 3000, priority: false }, // Landscape - Double Island Point
  coastalAlt: { width: 4000, height: 3000, priority: false }, // Landscape - Double Island 2
} as const;

/**
 * Recommended display sizes for different use cases
 * Use these for responsive image optimization
 */
export const DISPLAY_SIZES = {
  hero: {
    mobile: { width: 768, height: 576 },
    tablet: { width: 1024, height: 768 },
    desktop: { width: 1512, height: 1134 },
  },
  card: {
    mobile: { width: 320, height: 240 },
    tablet: { width: 512, height: 384 },
    desktop: { width: 640, height: 480 },
  },
  gallery: {
    mobile: { width: 480, height: 360 },
    tablet: { width: 768, height: 576 },
    desktop: { width: 1024, height: 768 },
  },
} as const;

/**
 * Usage recommendations by page type
 */
export const PHOTO_USAGE = {
  homePage: {
    hero: 'hero', // Main hero section
    features: ['adventure', 'beach', 'wildlife'], // Feature cards
  },
  tourPages: {
    hero: 'hero', // Tour page hero
    gallery: ['coastal', 'coastalAlt', 'landmarks', 'beach'], // Photo gallery
  },
  aboutPage: {
    highlight: 'adventure', // About section highlight
    wildlife: 'wildlife', // Eco-tourism section
  },
} as const;

export type TourPhotoKey = keyof typeof TOUR_PHOTOS;

/**
 * SEO-optimized alt text for each photo
 */
export const PHOTO_ALT_TEXT: Record<TourPhotoKey, string> = {
  hero: "Double Island Point coastal scenery and 4WD track - Sunshine Coast 4WD Tours adventure destination",
  beach: 'Rainbow Beach colored cliffs with golden sand and ocean views - Sunshine Coast 4WD Tours',
  adventure: '4WD vehicle driving on pristine beach - Sunshine Coast 4WD Tours adventure experience',
  wildlife: "K'gari dingo in natural habitat - Fraser Island wildlife experience on Sunshine Coast 4WD Tours",
  landmarks: "Historic Maheno Shipwreck on 75 Mile Beach, K'gari - iconic Fraser Island landmark",
  coastal: 'Double Island Point coastal scenery and 4WD track - Sunshine Coast adventure destination',
  coastalAlt: 'Double Island Point beach and rocky headland panoramic view - Sunshine Coast 4WD Tours',
};

/**
 * Helper function to get photo with metadata
 */
export function getPhotoWithMetadata(key: TourPhotoKey) {
  return {
    src: TOUR_PHOTOS[key],
    alt: PHOTO_ALT_TEXT[key],
    ...PHOTO_DIMENSIONS[key],
  };
}

/**
 * Get tour gallery images based on tour category or handle
 */
export function getTourGalleryImages(tourCategory?: string) {
  const defaultGallery = [
    getPhotoWithMetadata('hero'),
    getPhotoWithMetadata('adventure'),
    getPhotoWithMetadata('beach'),
    getPhotoWithMetadata('landmarks'),
    getPhotoWithMetadata('coastal'),
  ];

  // Can customize based on category in the future
  return defaultGallery;
}
