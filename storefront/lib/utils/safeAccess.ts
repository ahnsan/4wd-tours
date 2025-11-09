/**
 * Safe Data Access Utilities
 *
 * Provides safe methods to access nested properties and avoid runtime errors
 * from null/undefined values. Essential for preventing 500 errors when
 * API data is missing or malformed.
 *
 * Usage:
 *   const price = safeGet(tour, 'variants.0.prices.0.amount', 0);
 *   const tourPrice = getTourPrice(tour); // Safe tour-specific access
 */

/**
 * Safely access nested properties using dot notation
 * Returns defaultValue if any part of the path is null/undefined
 *
 * @example
 * safeGet({ a: { b: { c: 123 } } }, 'a.b.c', 0) // returns 123
 * safeGet({ a: { b: null } }, 'a.b.c', 0) // returns 0
 * safeGet({ a: {} }, 'a.b.c', 'default') // returns 'default'
 */
export function safeGet<T>(
  obj: any,
  path: string,
  defaultValue: T
): T {
  if (!obj || typeof obj !== 'object') {
    return defaultValue;
  }

  const keys = path.split('.');
  let current = obj;

  for (const key of keys) {
    // Handle array access (e.g., 'variants.0.prices')
    if (/^\d+$/.test(key)) {
      const index = parseInt(key, 10);
      if (!Array.isArray(current) || index >= current.length || index < 0) {
        return defaultValue;
      }
      current = current[index];
    } else {
      if (current[key] === undefined || current[key] === null) {
        return defaultValue;
      }
      current = current[key];
    }
  }

  return current as T;
}

/**
 * Safely access array element with bounds checking
 * Returns defaultValue if array is invalid or index out of bounds
 */
export function safeArrayGet<T>(
  arr: any,
  index: number,
  defaultValue: T
): T {
  if (!Array.isArray(arr)) {
    return defaultValue;
  }

  if (index < 0 || index >= arr.length) {
    return defaultValue;
  }

  const value = arr[index];
  return value !== undefined && value !== null ? value : defaultValue;
}

/**
 * Safely get tour price from various data structures
 * Handles both Tour and Product (Medusa) formats
 */
export function getTourPrice(tour: any): number {
  // Try Tour format first (direct price property)
  if (tour?.price !== undefined && tour.price !== null) {
    return typeof tour.price === 'number' ? tour.price : 0;
  }

  // Try Product format (variants[0].prices[0].amount)
  const amount = safeGet(tour, 'variants.0.prices.0.amount', null);
  if (amount !== null) {
    return typeof amount === 'number' ? amount : 0;
  }

  return 0;
}

/**
 * Safely get price currency code
 */
export function getTourCurrency(tour: any): string {
  // Try Product format (variants[0].prices[0].currency_code)
  const currency = safeGet(tour, 'variants.0.prices.0.currency_code', 'AUD');
  return typeof currency === 'string' ? currency.toUpperCase() : 'AUD';
}

/**
 * Safely get tour variant ID
 */
export function getTourVariantId(tour: any): string | null {
  const variantId = safeGet(tour, 'variants.0.id', null);
  return typeof variantId === 'string' ? variantId : null;
}

/**
 * Safely get tour image URL
 */
export function getTourImage(tour: any): string {
  // Try Tour format first
  if (tour?.image && typeof tour.image === 'string') {
    return tour.image;
  }

  // Try Product format (thumbnail)
  const thumbnail = safeGet(tour, 'thumbnail', '');
  if (thumbnail && typeof thumbnail === 'string') {
    return thumbnail;
  }

  // Try first image in images array
  const firstImage = safeGet(tour, 'images.0.url', '');
  if (firstImage && typeof firstImage === 'string') {
    return firstImage;
  }

  // Default placeholder
  return '/images/tour_options.png';
}

/**
 * Safely get tour duration
 */
export function getTourDuration(tour: any): string {
  // Try Tour format first
  if (tour?.duration && typeof tour.duration === 'string') {
    return tour.duration;
  }

  // Try metadata
  const duration = safeGet(tour, 'metadata.duration', '1 day');
  return typeof duration === 'string' ? duration : '1 day';
}

/**
 * Safely get tour category
 */
export function getTourCategory(tour: any): string {
  // Try Tour format first
  if (tour?.category && typeof tour.category === 'string') {
    return tour.category;
  }

  // Try metadata
  const category = safeGet(tour, 'metadata.category', 'Tour');
  return typeof category === 'string' ? category : 'Tour';
}

/**
 * Safely get tour difficulty
 */
export function getTourDifficulty(tour: any): string {
  // Try Tour format first
  if (tour?.difficulty && typeof tour.difficulty === 'string') {
    return tour.difficulty;
  }

  // Try metadata
  const difficulty = safeGet(tour, 'metadata.difficulty', 'Moderate');
  return typeof difficulty === 'string' ? difficulty : 'Moderate';
}

/**
 * Safely get max participants
 */
export function getTourMaxParticipants(tour: any): number {
  // Try Tour format first
  if (tour?.maxParticipants && typeof tour.maxParticipants === 'number') {
    return tour.maxParticipants;
  }

  // Try metadata
  const max = safeGet(tour, 'metadata.max_participants', 20);
  return typeof max === 'number' && max > 0 ? max : 20;
}

/**
 * Safely get min participants
 */
export function getTourMinParticipants(tour: any): number {
  const min = safeGet(tour, 'metadata.min_participants', 1);
  return typeof min === 'number' && min > 0 ? min : 1;
}

/**
 * Safely get tour description
 */
export function getTourDescription(tour: any): string {
  const description = tour?.description || safeGet(tour, 'description', '');
  return typeof description === 'string' ? description : '';
}

/**
 * Safely get tour title
 */
export function getTourTitle(tour: any): string {
  const title = tour?.title || safeGet(tour, 'title', 'Tour');
  return typeof title === 'string' && title.trim() !== '' ? title : 'Tour';
}

/**
 * Safely get tour ID
 */
export function getTourId(tour: any): string | null {
  const id = tour?.id || safeGet(tour, 'id', null);
  return typeof id === 'string' ? id : null;
}

/**
 * Check if value exists and is not null/undefined
 */
export function exists(value: any): boolean {
  return value !== null && value !== undefined;
}

/**
 * Check if array exists and has items
 */
export function hasItems(arr: any): boolean {
  return Array.isArray(arr) && arr.length > 0;
}

/**
 * Safe string trimming
 */
export function safeTrim(str: any): string {
  return typeof str === 'string' ? str.trim() : '';
}

/**
 * Safe number parsing
 */
export function safeParseInt(value: any, defaultValue: number): number {
  const parsed = parseInt(value, 10);
  return !isNaN(parsed) ? parsed : defaultValue;
}

/**
 * Safe float parsing
 */
export function safeParseFloat(value: any, defaultValue: number): number {
  const parsed = parseFloat(value);
  return !isNaN(parsed) ? parsed : defaultValue;
}

/**
 * Safely convert price from cents to dollars
 */
export function safePriceFromCents(cents: any): number {
  const amount = safeParseFloat(cents, 0);
  return amount / 100;
}

/**
 * Safely convert price from dollars to cents
 */
export function safePriceToCents(dollars: any): number {
  const amount = safeParseFloat(dollars, 0);
  return Math.round(amount * 100);
}

/**
 * Create a safe accessor object for tour data
 * Provides all safe getters in a single object
 */
export function createTourAccessor(tour: any) {
  return {
    id: getTourId(tour),
    title: getTourTitle(tour),
    description: getTourDescription(tour),
    price: getTourPrice(tour),
    currency: getTourCurrency(tour),
    image: getTourImage(tour),
    duration: getTourDuration(tour),
    category: getTourCategory(tour),
    difficulty: getTourDifficulty(tour),
    maxParticipants: getTourMaxParticipants(tour),
    minParticipants: getTourMinParticipants(tour),
    variantId: getTourVariantId(tour),
    raw: tour, // Keep reference to original data
  };
}
