/**
 * Tours Data Service - Backend-Only Integration
 *
 * This service fetches data from Medusa API only.
 * No mock data fallbacks - fails fast if backend is unavailable.
 */

import type { Tour } from '../../contexts/CartContext';

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

    // Medusa v2 calculated_price (when currency_code provided in API call)
    if (variant.calculated_price && variant.calculated_price.calculated_amount) {
      price = variant.calculated_price.calculated_amount;
    }
    // If no calculated price, use 0 (backend pricing not configured yet)
    else {
      console.warn(`[Tours Service] WARNING: No price found for ${product.handle}. Using price = 0. Backend pricing needs configuration.`);
      price = 0;
    }
  }

  // Extract duration from metadata or handle
  let duration = '1 day';
  if (product.metadata?.duration_days) {
    const days = product.metadata.duration_days;
    duration = days === 1 ? '1 Day' : `${days} Days`;
  } else if (product.handle) {
    // Parse duration from handle (e.g., "2d-fraser-rainbow" -> "2 Days")
    const match = product.handle.match(/^(\d+)d-/);
    if (match) {
      const days = parseInt(match[1]);
      duration = days === 1 ? '1 Day' : `${days} Days`;
    }
  }

  return {
    id: product.id,
    title: product.title,
    description: product.description || '',
    price, // Price in cents
    duration,
    image: product.thumbnail || '/images/tour_options.png',
    category: product.metadata?.category || 'Tour',
    difficulty: product.metadata?.difficulty || 'Moderate',
    maxParticipants: product.metadata?.max_participants || 20,
    handle: product.handle || product.id,
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
    const response = await fetchWithTimeout(
      `${API_BASE_URL}/store/products?region_id=${DEFAULT_REGION_ID}`,
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
    const response = await fetchWithTimeout(
      `${API_BASE_URL}/store/products?handle=${handle}&region_id=${DEFAULT_REGION_ID}`,
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

    const tour = convertProductToTour(product);
    console.log(`[Tours Service] Fetched tour "${tour.title}" from API`);

    return {
      tour,
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
 */
export function convertTourToProduct(tour: Tour): any {
  // Extract duration_days as a number from the duration string
  let durationDays = 1;
  const durationMatch = tour.duration.match(/(\d+)/);
  if (durationMatch && durationMatch[1]) {
    durationDays = parseInt(durationMatch[1], 10);
  }

  return {
    id: tour.id,
    title: tour.title,
    description: tour.description,
    thumbnail: tour.image,
    handle: tour.handle,
    images: [
      {
        id: '1',
        url: tour.image,
        alt: tour.title,
      },
    ],
    variants: [
      {
        id: `${tour.id}-variant-1`,
        title: 'Standard',
        prices: [
          {
            amount: tour.price,
            currency_code: 'aud',
          },
        ],
        // Add calculated_price for compatibility with getProductPrice()
        calculated_price: {
          calculated_amount: tour.price,
          currency_code: 'aud',
        },
        inventory_quantity: 100,
      },
    ],
    metadata: {
      duration: tour.duration,
      duration_days: durationDays, // Add as number for pricing calculations
      category: tour.category,
      difficulty: tour.difficulty,
      max_participants: tour.maxParticipants,
      min_participants: 1,
      departure_times: ['8:00 AM'],
      inclusions: [
        'Professional 4WD guide',
        'All national park fees',
        'Safety equipment',
        'Complimentary water and snacks',
      ],
      exclusions: [
        'Personal travel insurance',
        'Meals (unless specified)',
        'Alcoholic beverages',
      ],
    },
  };
}
