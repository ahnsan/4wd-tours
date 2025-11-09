/**
 * Add-Ons Type Definitions
 * Central type definitions for the add-ons system
 */

/**
 * Pricing Unit Types
 */
export type PricingUnit = 'per_booking' | 'per_day' | 'per_person';

/**
 * Lodging and Drive Mode Types
 */
export type LodgingType = 'glamping' | 'camping' | 'hotel' | 'none';
export type DriveMode = 'self-drive' | 'guided';

/**
 * Core Add-On Interface
 */
export interface AddOn {
  id: string;
  title: string;
  description?: string;
  price_cents: number;
  pricing_type: PricingUnit;
  category: string;
  available: boolean;
  icon?: string;
  quantity?: number;
  metadata?: AddOnMetadata;
}

/**
 * Add-On Metadata
 */
export interface AddOnMetadata {
  unit?: PricingUnit;
  quantity_allowed?: boolean;
  recommended_for?: string[];
  tags?: string[];
  max_quantity?: number;
  restrictions?: string[];
  seasonal_relevance?: number; // 0-100
  popularity_score?: number; // 0-100
}

/**
 * Pricing Context
 */
export interface PricingContext {
  duration_days: number;
  participants: number;
  tour_base_price_cents?: number;
}

/**
 * Booking Context (extends PricingContext)
 */
export interface BookingContext extends PricingContext {
  tour_id?: string;
  tour_handle?: string;
  lodging?: LodgingType;
  drive_mode?: DriveMode;
  booking_date?: Date;
  season?: 'summer' | 'winter' | 'spring' | 'autumn';
}

/**
 * Add-On Selection State
 */
export interface AddOnSelection {
  addon: AddOn;
  quantity: number;
  calculatedPrice: number;
  timestamp?: number;
}

/**
 * Price Breakdown
 */
export interface PriceBreakdown {
  tourBasePrice: number;
  addOnsTotal: number;
  subtotal: number;
  gst: number;
  grandTotal: number;
  addOnDetails?: AddOnPriceDetail[];
}

/**
 * Individual Add-On Price Detail
 */
export interface AddOnPriceDetail {
  id: string;
  title: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  pricingType: PricingUnit;
}

/**
 * Recommendation Weights
 */
export interface RecommendationWeights {
  popularity: number; // 0-100, default 40
  seasonalRelevance: number; // 0-100, default 30
  bookingCompatibility: number; // 0-100, default 20
  previousChoices: number; // 0-100, default 10
}

/**
 * Recommended Add-On (extends AddOn)
 */
export interface RecommendedAddOn extends AddOn {
  recommendationReason: string;
  recommendationScore: number; // 0-100
  weights?: RecommendationWeights;
}

/**
 * Analytics Event Parameters
 */
export interface AddOnAnalyticsEvent {
  addon_id: string;
  addon_title: string;
  price_cents?: number;
  unit?: PricingUnit;
  quantity?: number;
  duration_days?: number;
  cart_id?: string;
  session_id?: string;
  tour_id?: string;
  timestamp?: number;
}

/**
 * Price Reconciliation Result
 */
export interface PriceReconciliation {
  isValid: boolean;
  clientTotal: number;
  serverTotal: number;
  discrepancy: number;
  errors: string[];
}

/**
 * Pricing Rule (for future dynamic pricing)
 */
export interface PricingRule {
  id: string;
  name: string;
  type: 'percentage_discount' | 'fixed_discount' | 'dynamic_price';
  value: number;
  conditions: PricingRuleCondition[];
  priority: number;
  active: boolean;
}

/**
 * Pricing Rule Condition
 */
export interface PricingRuleCondition {
  field: string;
  operator: 'eq' | 'gt' | 'lt' | 'gte' | 'lte' | 'in';
  value: any;
}

/**
 * Discount/Promotion
 */
export interface Promotion {
  id: string;
  code?: string;
  name: string;
  description?: string;
  discount_type: 'percentage' | 'fixed_amount';
  discount_value: number;
  applies_to: 'all' | 'specific_addons' | 'category';
  addon_ids?: string[];
  category?: string;
  min_purchase_amount?: number;
  max_discount_amount?: number;
  valid_from: Date;
  valid_until: Date;
  active: boolean;
}

/**
 * Filter Options
 */
export interface AddOnFilterOptions {
  category?: string;
  priceRange?: { min: number; max: number };
  pricingType?: PricingUnit;
  availability?: boolean;
  tags?: string[];
  recommended?: boolean;
}

/**
 * Sort Options
 */
export type AddOnSortOption =
  | 'recommended'
  | 'price_asc'
  | 'price_desc'
  | 'popularity'
  | 'title_asc'
  | 'title_desc';

/**
 * Storage Keys (for localStorage)
 */
export const STORAGE_KEYS = {
  ADDON_SELECTION: 'addon_selection',
  ADDON_PREFERENCES: 'addon_preferences',
  LAST_VIEWED_ADDONS: 'last_viewed_addons',
} as const;

/**
 * Error Types
 */
export interface AddOnError {
  type: 'validation' | 'calculation' | 'network' | 'storage' | 'unknown';
  message: string;
  details?: any;
  timestamp: number;
}

/**
 * Type Guards
 */
export function isAddOn(obj: any): obj is AddOn {
  return (
    obj &&
    typeof obj === 'object' &&
    typeof obj.id === 'string' &&
    typeof obj.title === 'string' &&
    typeof obj.price_cents === 'number' &&
    typeof obj.pricing_type === 'string' &&
    ['per_booking', 'per_day', 'per_person'].includes(obj.pricing_type)
  );
}

export function isPricingContext(obj: any): obj is PricingContext {
  return (
    obj &&
    typeof obj === 'object' &&
    typeof obj.duration_days === 'number' &&
    typeof obj.participants === 'number' &&
    obj.duration_days > 0 &&
    obj.participants > 0
  );
}

export function isBookingContext(obj: any): obj is BookingContext {
  return isPricingContext(obj);
}
