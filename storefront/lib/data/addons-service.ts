/**
 * Add-ons Data Service - Backend-Only Integration
 *
 * This service fetches data from Medusa API only.
 * No mock data fallbacks - fails fast if backend is unavailable.
 */

import type { AddOn } from '../types/checkout';

// Environment configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:9000';
const API_TIMEOUT = 5000; // 5 seconds
const DEFAULT_REGION_ID = 'reg_01K9G4HA190556136E7RJQ4411'; // Australia region

// Data source tracking
type DataSource = 'api' | 'cache';

export interface AddOnsResponse {
  addons: AddOn[];
  source: DataSource;
  count: number;
}

export interface AddOnResponse {
  addon: AddOn | null;
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
 * Convert Medusa product to AddOn format
 */
function convertProductToAddOn(product: any): AddOn {
  // Determine category based on handle or title
  let category = 'General';
  const handle = product.handle || '';

  if (handle.includes('glamping') || handle.includes('camping')) {
    category = 'Equipment';
  } else if (handle.includes('internet') || handle.includes('wifi')) {
    category = 'Equipment';
  } else if (handle.includes('bbq') || handle.includes('meal') || handle.includes('food')) {
    category = 'Food & Beverage';
  } else if (handle.includes('photo')) {
    category = 'Photography';
  } else if (handle.includes('transport') || handle.includes('pickup')) {
    category = 'Transport';
  } else if (handle.includes('insurance')) {
    category = 'Insurance';
  }

  // Determine pricing type from metadata or default
  let pricingType: 'per_booking' | 'per_day' | 'per_person' = 'per_booking';
  if (product.metadata?.unit === 'per_day') {
    pricingType = 'per_day';
  } else if (product.metadata?.unit === 'per_person') {
    pricingType = 'per_person';
  }

  // Extract price from calculated_price (requires currency_code in API call)
  let price = 0;
  if (product.variants && product.variants.length > 0) {
    const variant = product.variants[0];

    if (variant.calculated_price && variant.calculated_price.calculated_amount) {
      price = variant.calculated_price.calculated_amount;
    } else {
      console.error(`[Add-ons Service] FATAL: No price found for ${product.handle}. Backend pricing not configured.`);
      throw new Error(`Add-on ${product.handle} has no price. Backend configuration required.`);
    }
  }

  return {
    id: product.id,
    title: product.title,
    description: product.description || '',
    price,
    pricing_type: pricingType,
    icon: getCategoryIcon(category),
    category: category,
    available: true,
  };
}

/**
 * Get icon name based on category
 */
function getCategoryIcon(category: string): string {
  const iconMap: Record<string, string> = {
    'Equipment': 'tent',
    'Food & Beverage': 'utensils',
    'Photography': 'camera',
    'Transport': 'car',
    'Insurance': 'shield',
    'General': 'star',
  };
  return iconMap[category] || 'star';
}

/**
 * Fetch all add-ons from API - NO MOCK FALLBACK
 */
export async function fetchAllAddOns(): Promise<AddOnsResponse> {
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

    // Filter add-ons (products with handles starting with "addon-")
    const addons = (data.products || [])
      .filter((p: any) => p.handle?.startsWith('addon-'))
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
 */
export async function fetchAddOnById(id: string): Promise<AddOnResponse> {
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
      `${API_BASE_URL}/store/products/${id}?region_id=${DEFAULT_REGION_ID}`,
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
 */
export async function fetchAddOnsByCategory(category: string): Promise<AddOnsResponse> {
  const allAddOnsResponse = await fetchAllAddOns();

  const filteredAddons = allAddOnsResponse.addons.filter(
    (addon) => addon.category === category
  );

  return {
    ...allAddOnsResponse,
    addons: filteredAddons,
    count: filteredAddons.length,
  };
}
