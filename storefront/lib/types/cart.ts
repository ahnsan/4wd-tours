/**
 * Cart Type Definitions for 4WD Medusa Tours
 *
 * Complete type system for managing tours, addons, and cart state
 * with real Medusa backend integration.
 */

import type { MedusaCart, CartLineItem } from '@/lib/data/cart-service';

// ============================================================================
// Tour Types
// ============================================================================

/**
 * Tour product with Medusa integration
 */
export interface Tour {
  id: string; // Medusa product ID
  variant_id: string; // Medusa variant ID for booking
  handle: string;
  title: string;
  description: string;
  base_price_cents: number; // Price in cents
  duration_days: number;
  image_url?: string;
  image?: string; // Image URL (alias for image_url)
  thumbnail?: string; // Thumbnail image URL
  images?: any[]; // Array of Medusa product images
  variants?: any[]; // Array of Medusa product variants
  options?: any[]; // Array of Medusa product options
  category?: string; // Tour category (can also be in metadata)
  difficulty?: string; // Tour difficulty (can also be in metadata)
  metadata?: {
    difficulty?: string;
    min_participants?: number;
    max_participants?: number;
    category?: string;
    duration_days?: number;
    [key: string]: any;
  };
}

/**
 * Tour booking details
 */
export interface TourBooking {
  tour: Tour;
  participants: number;
  start_date: string; // ISO date string
  end_date: string; // ISO date string (calculated from duration)
  total_price_cents: number; // Calculated: base_price × participants × duration_days
  line_item_id?: string; // Medusa cart line item ID
}

// ============================================================================
// Addon Types
// ============================================================================

/**
 * Addon pricing types
 */
export type AddonPricingType = 'per_booking' | 'per_day' | 'per_person';

/**
 * Addon product with Medusa integration
 */
export interface Addon {
  id: string; // Medusa product ID
  variant_id: string; // Medusa variant ID
  handle?: string; // Product handle (URL-friendly identifier)
  title: string;
  description: string;
  price_cents: number; // Base price in cents
  pricing_type: AddonPricingType;
  category: string;
  available: boolean;
  currency_code?: string; // Currency code (e.g., 'aud')
  icon?: string;
  thumbnail?: string; // Product thumbnail image URL
  metadata?: {
    quantity_allowed?: boolean;
    max_quantity?: number;
    recommended_for?: string[];
    tags?: string[];
    [key: string]: any;
  };
}

/**
 * Selected addon in cart with calculated pricing
 */
export interface CartAddon {
  addon: Addon;
  quantity: number;
  calculated_price_cents: number; // Calculated based on pricing_type, quantity, and tour context
  line_item_id?: string; // Medusa cart line item ID
}

// ============================================================================
// Cart State Types
// ============================================================================

/**
 * Complete cart state with Medusa integration
 */
export interface CartState {
  // Cart identification
  cart_id: string | null; // Medusa cart ID

  // Tour booking
  tour_booking: TourBooking | null;

  // Addons
  addons: CartAddon[];

  // Cart totals (in cents)
  tour_total_cents: number;
  addons_total_cents: number;
  subtotal_cents: number;
  tax_cents: number;
  total_cents: number;

  // Loading and error states
  isLoading: boolean;
  error: string | null;

  // Last sync timestamp
  last_synced_at: string | null;
}

/**
 * Cart summary for display
 */
export interface CartSummary {
  tour_booking: TourBooking | null;
  addons: CartAddon[];
  addons_by_category: Record<string, CartAddon[]>;
  tour_total_cents: number;
  addons_total_cents: number;
  subtotal_cents: number;
  tax_cents: number;
  total_cents: number;
  item_count: number;
}

// ============================================================================
// Cart Action Types
// ============================================================================

/**
 * Add tour to cart parameters
 */
export interface AddTourParams {
  tour: Tour;
  participants: number;
  start_date: string; // ISO date string
}

/**
 * Add addon to cart parameters
 */
export interface AddAddonParams {
  addon: Addon;
  quantity?: number; // Default: 1
}

/**
 * Cart context value with state and methods
 */
export interface CartContextValue {
  // State
  cart: CartState;

  // Cart identification
  getCartId: () => string | null;

  // Tour operations
  addTourToCart: (params: AddTourParams) => Promise<void>;
  updateTourParticipants: (participants: number) => Promise<void>;
  updateTourDates: (start_date: string) => Promise<void>;
  removeTour: () => Promise<void>;

  // Addon operations
  addAddonToCart: (params: AddAddonParams) => Promise<void>;
  removeAddonFromCart: (addonId: string) => Promise<void>;
  updateAddonQuantity: (addonId: string, quantity: number) => Promise<void>;

  // Cart operations
  clearCart: () => Promise<void>;
  refreshCart: () => Promise<void>;

  // Cart summary
  getCartTotal: () => number;
  getCartSummary: () => CartSummary;
  getAddonsByCategory: () => Record<string, CartAddon[]>;
}

// ============================================================================
// Price Calculation Types
// ============================================================================

/**
 * Price calculation context
 */
export interface PriceCalculationContext {
  tour_duration_days: number;
  participants: number;
}

/**
 * Price breakdown for transparency
 */
export interface PriceBreakdown {
  // Tour pricing
  tour_base_price_cents: number;
  tour_participants: number;
  tour_duration_days: number;
  tour_total_cents: number;

  // Addon pricing
  addon_items: {
    addon_id: string;
    title: string;
    base_price_cents: number;
    pricing_type: AddonPricingType;
    quantity: number;
    calculated_price_cents: number;
    calculation_formula: string;
  }[];
  addons_total_cents: number;

  // Totals
  subtotal_cents: number;
  tax_rate: number;
  tax_cents: number;
  total_cents: number;
}

// ============================================================================
// Medusa Integration Types
// ============================================================================

/**
 * Medusa cart metadata structure
 */
export interface MedusaCartMetadata {
  tour_booking?: {
    tour_id: string;
    tour_handle: string;
    participants: number;
    start_date: string;
    end_date: string;
    duration_days: number;
  };
  addon_pricing_context?: {
    duration_days: number;
    participants: number;
  };
}

/**
 * Medusa line item metadata for tours
 */
export interface TourLineItemMetadata {
  type: 'tour';
  tour_id: string;
  tour_handle: string;
  participants: number;
  start_date: string;
  end_date: string;
  duration_days: number;
  base_price_cents: number;
}

/**
 * Medusa line item metadata for addons
 */
export interface AddonLineItemMetadata {
  type: 'addon';
  addon_id: string;
  pricing_type: AddonPricingType;
  base_price_cents: number;
  calculation_context: {
    duration_days: number;
    participants: number;
  };
  calculated_price_cents: number;
}

// ============================================================================
// Utility Types
// ============================================================================

/**
 * Local storage keys
 */
export const CART_STORAGE_KEYS = {
  CART_ID: 'medusa_cart_id',
  LAST_SYNCED: 'cart_last_synced',
} as const;

/**
 * Cart configuration
 */
export interface CartConfig {
  tax_rate: number; // e.g., 0.10 for 10% GST
  auto_sync_interval_ms: number; // Auto-sync interval
  cart_expiry_days: number; // Cart expiration
  max_addons_per_cart: number;
}

/**
 * Default cart configuration
 */
export const DEFAULT_CART_CONFIG: CartConfig = {
  tax_rate: 0.10, // 10% GST for Australia
  auto_sync_interval_ms: 30000, // 30 seconds
  cart_expiry_days: 7,
  max_addons_per_cart: 50,
};

// ============================================================================
// Type Guards
// ============================================================================

/**
 * Check if object is a valid Tour
 */
export function isTour(obj: any): obj is Tour {
  return (
    obj &&
    typeof obj === 'object' &&
    typeof obj.id === 'string' &&
    typeof obj.variant_id === 'string' &&
    typeof obj.title === 'string' &&
    typeof obj.base_price_cents === 'number' &&
    typeof obj.duration_days === 'number'
  );
}

/**
 * Check if object is a valid Addon
 */
export function isAddon(obj: any): obj is Addon {
  return (
    obj &&
    typeof obj === 'object' &&
    typeof obj.id === 'string' &&
    typeof obj.variant_id === 'string' &&
    typeof obj.title === 'string' &&
    typeof obj.price_cents === 'number' &&
    ['per_booking', 'per_day', 'per_person'].includes(obj.pricing_type)
  );
}

/**
 * Check if cart has tour booking
 */
export function hasActiveTourBooking(cart: CartState): boolean {
  return cart.tour_booking !== null;
}

/**
 * Check if cart is empty
 */
export function isCartEmpty(cart: CartState): boolean {
  return cart.tour_booking === null && cart.addons.length === 0;
}
