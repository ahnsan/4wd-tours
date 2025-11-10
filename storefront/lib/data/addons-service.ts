/**
 * Add-ons Data Service - Backend-Only Integration
 *
 * This service fetches data from Medusa API only.
 * No mock data fallbacks - fails fast if backend is unavailable.
 */

import type { Addon } from '../types/cart';

// Environment configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:9000';
const API_TIMEOUT = 5000; // 5 seconds

/**
 * Get region ID dynamically from environment or cart context
 * This should be passed as a parameter from components that have access to cart context
 */
function getRegionId(regionId?: string): string {
  // Use provided regionId from cart context if available
  if (regionId) {
    return regionId;
  }

  // Fallback to environment variable if configured
  if (process.env.NEXT_PUBLIC_DEFAULT_REGION_ID) {
    return process.env.NEXT_PUBLIC_DEFAULT_REGION_ID;
  }

  // Last resort: throw error to ensure proper region handling
  throw new Error('Region ID must be provided from cart context or configured in NEXT_PUBLIC_DEFAULT_REGION_ID environment variable');
}

// Data source tracking
type DataSource = 'api' | 'cache';

export interface AddOnsResponse {
  addons: Addon[];
  source: DataSource;
  count: number;
}

export interface AddOnResponse {
  addon: Addon | null;
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
 * Handle mapping for backend add-ons
 * Backend uses handles like "addon-glamping", "addon-internet", "addon-bbq"
 * Frontend mock uses "addon-1", "addon-2", etc.
 */
const BACKEND_HANDLE_MAP: Record<string, string> = {
  'addon-glamping': 'Glamping Setup',
  'addon-internet': 'Always-on High-Speed Internet',
  'addon-bbq': 'BBQ on the Beach',
};

/**
 * Convert Medusa product to Addon format (Medusa-compatible)
 *
 * MEDUSA BEST PRACTICE: Use metadata fields directly from backend
 * Don't infer or transform data that's already in metadata
 */
function convertProductToAddOn(product: any): Addon {
  // Use category from metadata (Medusa best practice)
  // Backend has correct category in metadata.category field
  const category = product.metadata?.category || 'General';

  console.log(`[Add-ons Service] Converting ${product.handle}: category="${category}"`);

  // Determine pricing type from metadata or default
  let pricingType: 'per_booking' | 'per_day' | 'per_person' = 'per_booking';
  if (product.metadata?.unit === 'per_day') {
    pricingType = 'per_day';
  } else if (product.metadata?.unit === 'per_person') {
    pricingType = 'per_person';
  }

  // Extract price from calculated_price (requires currency_code in API call)
  let price_cents = 0;
  let variant_id = '';

  // Validate variants array exists and is not empty
  if (!product.variants || !Array.isArray(product.variants) || product.variants.length === 0) {
    console.error(`[Add-ons Service] FATAL: No variants array found for product ${product.handle || product.id}. Backend configuration required.`);
    throw new Error(`Add-on product ${product.handle || product.id} has no variants. Backend must configure at least one variant.`);
  }

  const variant = product.variants[0];

  // Validate variant has required id field
  if (!variant || !variant.id) {
    console.error(`[Add-ons Service] FATAL: Variant missing id for product ${product.handle || product.id}. Invalid backend data.`);
    throw new Error(`Add-on product ${product.handle || product.id} has invalid variant (missing id). Backend data integrity issue.`);
  }

  variant_id = variant.id;

  // Validate pricing information exists
  if (!variant.calculated_price || typeof variant.calculated_price.calculated_amount === 'undefined') {
    console.error(`[Add-ons Service] FATAL: No calculated price found for variant ${variant_id} of product ${product.handle || product.id}. Backend pricing not configured.`);
    throw new Error(`Add-on ${product.handle || product.id} (variant: ${variant_id}) has no calculated price. Ensure region pricing is configured in backend.`);
  }

  // Validate price is a valid number
  const calculatedAmount = variant.calculated_price.calculated_amount;
  if (typeof calculatedAmount !== 'number' || isNaN(calculatedAmount) || calculatedAmount < 0) {
    console.error(`[Add-ons Service] FATAL: Invalid price value for variant ${variant_id} of product ${product.handle || product.id}. Price: ${calculatedAmount}`);
    throw new Error(`Add-on ${product.handle || product.id} has invalid price: ${calculatedAmount}. Backend pricing configuration error.`);
  }

  price_cents = calculatedAmount;

  return {
    id: product.id,
    variant_id,
    title: product.title,
    description: product.description || '',
    price_cents,
    pricing_type: pricingType,
    icon: getCategoryIcon(category),
    category: category,
    available: true,
    metadata: {
      max_quantity: product.metadata?.max_quantity,
      quantity_allowed: product.metadata?.quantity_allowed,
      recommended_for: product.metadata?.recommended_for,
      tags: product.metadata?.tags,
    },
  };
}

/**
 * Get icon path based on category
 * Returns valid image path for Next.js Image component
 */
function getCategoryIcon(category: string): string {
  const iconMap: Record<string, string> = {
    'Equipment': '/images/icons/tent.svg',
    'Food & Beverage': '/images/icons/utensils.svg',
    'Photography': '/images/icons/camera.svg',
    'Transport': '/images/icons/car.svg',
    'Insurance': '/images/icons/shield.svg',
    'General': '/images/icons/star.svg',
  };
  return iconMap[category] || '/images/icons/star.svg';
}

/**
 * Fetch all add-ons from API - NO MOCK FALLBACK
 * @param regionId - Optional region ID from cart context. If not provided, uses environment variable or throws error.
 */
export async function fetchAllAddOns(regionId?: string): Promise<AddOnsResponse> {
  try {
    // Build headers
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    const apiKey = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY;
    if (apiKey) {
      headers['x-publishable-api-key'] = apiKey;
    }

    // Get dynamic region ID
    const dynamicRegionId = getRegionId(regionId);

    // Fetch from dedicated add-ons API endpoint
    const response = await fetchWithTimeout(
      `${API_BASE_URL}/store/add-ons?region_id=${dynamicRegionId}`,
      { headers, cache: 'no-store' },
      API_TIMEOUT
    );

    if (!response.ok) {
      throw new Error(`API responded with ${response.status}`);
    }

    const data = await response.json();

    // Backend returns data.add_ons (not data.products)
    const addons = (data.add_ons || [])
      .map(convertProductToAddOn);

    console.log(`[Add-ons Service] Fetched ${addons.length} add-ons from API`);

    return {
      addons,
      source: 'api',
      count: addons.length,
    };
  } catch (error) {
    // NO MOCK FALLBACK - fail fast
    console.error('[Add-ons Service] FATAL: API fetch failed:', error);
    throw new Error(`Failed to fetch add-ons from backend: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Fetch single add-on by ID from API - NO MOCK FALLBACK
 * @param id - Product ID to fetch
 * @param regionId - Optional region ID from cart context. If not provided, uses environment variable or throws error.
 */
export async function fetchAddOnById(id: string, regionId?: string): Promise<AddOnResponse> {
  try {
    // Build headers
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    const apiKey = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY;
    if (apiKey) {
      headers['x-publishable-api-key'] = apiKey;
    }

    // Get dynamic region ID
    const dynamicRegionId = getRegionId(regionId);

    // Fetch from API with region_id to get calculated prices
    const response = await fetchWithTimeout(
      `${API_BASE_URL}/store/products/${id}?region_id=${dynamicRegionId}`,
      { headers, cache: 'no-store' },
      API_TIMEOUT
    );

    if (!response.ok) {
      throw new Error(`API responded with ${response.status}`);
    }

    const data = await response.json();
    const product = data.product;

    if (!product) {
      throw new Error('Product not found in API');
    }

    const addon = convertProductToAddOn(product);
    console.log(`[Add-ons Service] Fetched add-on "${addon.title}" from API`);

    return {
      addon,
      source: 'api',
    };
  } catch (error) {
    // NO MOCK FALLBACK - fail fast
    console.error(`[Add-ons Service] FATAL: API fetch failed for ID ${id}:`, error);
    throw new Error(`Failed to fetch add-on "${id}" from backend: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Get add-ons by category
 * @param category - Category to filter by
 * @param regionId - Optional region ID from cart context. If not provided, uses environment variable or throws error.
 */
export async function fetchAddOnsByCategory(category: string, regionId?: string): Promise<AddOnsResponse> {
  const allAddOnsResponse = await fetchAllAddOns(regionId);

  const filteredAddons = allAddOnsResponse.addons.filter(
    (addon) => addon.category === category
  );

  return {
    ...allAddOnsResponse,
    addons: filteredAddons,
    count: filteredAddons.length,
  };
}
