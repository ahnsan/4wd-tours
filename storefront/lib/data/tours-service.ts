/**
 * Tours Data Service - Backend-Only Integration
 *
 * This service fetches data from Medusa API only.
 * No mock data fallbacks - fails fast if backend is unavailable.
 */

import type { Tour } from '../types/cart';

// Environment configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:9000';
const API_TIMEOUT = 5000; // 5 seconds
const DEFAULT_REGION_ID = 'reg_01K9G4HA190556136E7RJQ4411'; // Australia region

// Data source tracking
type DataSource = 'api' | 'cache';

export interface ToursResponse {
  tours: Tour[];
  source: DataSource;
  count: number;
}

export interface TourResponse {
  tour: Tour | null;
  source: DataSource;
}

/**
 * Fetch with timeout
 */
async function fetchWithTimeout(url: string, options: RequestInit, timeout: number) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}

/**
 * Get tour image with fallback strategy
 * 1. Use product thumbnail if available
 * 2. Use first image from images array if available
 * 3. Fallback to default tour image
 */
function getTourImage(product: any): string {
  // 1. Use product thumbnail
  if (product.thumbnail) {
    return product.thumbnail;
  }

  // 2. Use first image if available
  if (product.images && product.images.length > 0) {
    return product.images[0].url;
  }

  // 3. Fallback to default
  return '/images/tour_options.png';
}

/**
 * Convert Medusa product to Tour format
 *
 * In Medusa v2, prices are returned via calculated_price on variants
 * when a region context is provided in the API call.
 */
function convertProductToTour(product: any): Tour {
  // Extract price from calculated_price (requires region_id in API call)
  let price = 0;

  if (product.variants && product.variants.length > 0) {
    const variant = product.variants[0];

    // ⚠️ MEDUSA v2 PRICING FORMAT (Post-Migration):
    // After DB migration, Medusa v2 API returns prices in DOLLARS (major currency units)
    // Frontend stores prices internally in CENTS for precision
    // Conversion: API dollars → Frontend cents (multiply by 100)
    // Display: formatPrice() converts cents → dollars (divide by 100)
    if (variant.calculated_price && variant.calculated_price.calculated_amount) {
      price = Math.round(variant.calculated_price.calculated_amount * 100);
    }
    // If no calculated price, use 0 (backend pricing not configured yet)
    else {
      console.warn(`[Tours Service] WARNING: No price found for ${product.handle}. Using price = 0. Backend pricing needs configuration.`);
      price = 0;
    }
  }

  // Extract duration_days from metadata or handle
  let duration_days = 1;
  if (product.metadata?.duration_days) {
    duration_days = product.metadata.duration_days;
  } else if (product.handle) {
    // Parse duration from handle (e.g., "2d-fraser-rainbow" -> 2)
    const match = product.handle.match(/^(\d+)d-/);
    if (match) {
      duration_days = parseInt(match[1]);
    }
  }

  const imageUrl = getTourImage(product);

  // Get variant_id from first variant
  const variant_id = product.variants?.[0]?.id || '';

  return {
    id: product.id,
    variant_id,
    handle: product.handle || product.id,
    title: product.title,
    description: product.description || '',
    base_price_cents: price, // Price in cents
    duration_days,
    image_url: imageUrl,
    image: imageUrl,
    thumbnail: imageUrl,
    images: product.images || [],
    variants: product.variants || [],
    options: product.options || [],
    category: product.metadata?.category || 'Tour',
    difficulty: product.metadata?.difficulty || 'Moderate',
    metadata: product.metadata || {},
  };
}

/**
 * Fetch all tours from API - NO MOCK FALLBACK
 */
export async function fetchAllTours(): Promise<ToursResponse> {
  try {
    // Build headers
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    const apiKey = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY;
    if (apiKey) {
      headers['x-publishable-api-key'] = apiKey;
    }

    // Fetch from API with region_id to get calculated prices
    // Include images and variants in the response
    const response = await fetchWithTimeout(
      `${API_BASE_URL}/store/products?region_id=${DEFAULT_REGION_ID}&fields=*images,*variants`,
      { headers, cache: 'no-store' },
      API_TIMEOUT
    );

    if (!response.ok) {
      throw new Error(`API responded with ${response.status}`);
    }

    const data = await response.json();

    // Filter out add-ons (products with handles starting with "addon-")
    const tours = (data.products || [])
      .filter((p: any) => !p.handle?.startsWith('addon-'))
      .map(convertProductToTour);

    console.log(`[Tours Service] Fetched ${tours.length} tours from API`);

    return {
      tours,
      source: 'api',
      count: tours.length,
    };
  } catch (error) {
    // NO MOCK FALLBACK - fail fast
    console.error('[Tours Service] FATAL: API fetch failed:', error);
    throw new Error(`Failed to fetch tours from backend: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Fetch single tour by handle from API - NO MOCK FALLBACK
 */
export async function fetchTourByHandle(handle: string): Promise<TourResponse> {
  try {
    // Build headers
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    const apiKey = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY;
    if (apiKey) {
      headers['x-publishable-api-key'] = apiKey;
    }

    // Fetch from API with region_id to get calculated prices
    // Include images and variants in the response
    const response = await fetchWithTimeout(
      `${API_BASE_URL}/store/products?handle=${handle}&region_id=${DEFAULT_REGION_ID}&fields=*images,*variants`,
      { headers, cache: 'no-store' },
      API_TIMEOUT
    );

    if (!response.ok) {
      throw new Error(`API responded with ${response.status}`);
    }

    const data = await response.json();
    const product = data.products?.[0];

    if (!product) {
      throw new Error('Product not found in API');
    }

    // Return the Medusa product directly to preserve variant IDs
    // No need to convert to Tour format and back - wastes data
    console.log(`[Tours Service] Fetched tour "${product.title}" from API with ${product.variants?.length || 0} variants`);

    return {
      tour: product,  // Return product directly instead of converting
      source: 'api',
    };
  } catch (error) {
    // NO MOCK FALLBACK - fail fast
    console.error(`[Tours Service] FATAL: API fetch failed for handle ${handle}:`, error);
    throw new Error(`Failed to fetch tour "${handle}" from backend: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Convert Tour to format expected by tour detail page (with variants, images, etc.)
 * Note: This is a compatibility function for the old Tour interface
 * Medusa products already have the correct structure
 */
export function convertTourToProduct(tour: Tour): any {
  // Tour already has duration_days as a number
  const durationDays = tour.duration_days || tour.metadata?.duration_days || 1;

  return {
    id: tour.id,
    title: tour.title,
    description: tour.description,
    thumbnail: tour.thumbnail || tour.image || tour.image_url,
    handle: tour.handle,
    images: tour.images || [
      {
        id: '1',
        url: tour.thumbnail || tour.image || tour.image_url || '',
        alt: tour.title,
      },
    ],
    variants: tour.variants || [
      {
        id: tour.variant_id || `${tour.id}-variant-1`,
        title: 'Standard',
        prices: [
          {
            amount: tour.base_price_cents,
            currency_code: 'aud',
          },
        ],
        // Add calculated_price for compatibility with getProductPrice()
        calculated_price: {
          calculated_amount: tour.base_price_cents,
          currency_code: 'aud',
        },
        inventory_quantity: 100,
      },
    ],
    metadata: {
      ...tour.metadata,
      duration_days: durationDays,
      category: tour.category || tour.metadata?.category,
      difficulty: tour.difficulty || tour.metadata?.difficulty,
      max_participants: tour.metadata?.max_participants || 20,
      min_participants: tour.metadata?.min_participants || 1,
      departure_times: tour.metadata?.departure_times || ['8:00 AM'],
      inclusions: tour.metadata?.inclusions || [
        'Professional 4WD guide',
        'All national park fees',
        'Safety equipment',
        'Complimentary water and snacks',
      ],
      exclusions: tour.metadata?.exclusions || [
        'Personal travel insurance',
        'Meals (unless specified)',
        'Alcoholic beverages',
      ],
    },
  };
}
