/**
 * Pricing Utilities for Tour Bookings
 * Handles all price calculations including GST, discounts, and totals
 */

export interface AddOn {
  id: string;
  name: string;
  price: number;
  quantity?: number;
}

export interface PriceBreakdown {
  tourBasePrice: number;
  addOnsTotal: number;
  subtotal: number;
  gst: number;
  grandTotal: number;
}

/**
 * Calculate GST (10% in Australia)
 */
export const calculateGST = (amount: number): number => {
  return Number((amount * 0.1).toFixed(2));
};

/**
 * Calculate total price for add-ons
 */
export const calculateAddOnsTotal = (addOns: AddOn[]): number => {
  return addOns.reduce((total, addon) => {
    const quantity = addon.quantity || 1;
    return total + addon.price * quantity;
  }, 0);
};

/**
 * Calculate complete price breakdown
 */
export const calculatePriceBreakdown = (
  tourBasePrice: number,
  addOns: AddOn[] = []
): PriceBreakdown => {
  const addOnsTotal = calculateAddOnsTotal(addOns);
  const subtotal = tourBasePrice + addOnsTotal;
  const gst = calculateGST(subtotal);
  const grandTotal = subtotal + gst;

  return {
    tourBasePrice: Number(tourBasePrice.toFixed(2)),
    addOnsTotal: Number(addOnsTotal.toFixed(2)),
    subtotal: Number(subtotal.toFixed(2)),
    gst: Number(gst.toFixed(2)),
    grandTotal: Number(grandTotal.toFixed(2)),
  };
};

/**
 * Format currency for display (AUD)
 */
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency: 'AUD',
  }).format(amount);
};

/**
 * Calculate price per person if applicable
 */
export const calculatePricePerPerson = (
  totalPrice: number,
  numberOfParticipants: number
): number => {
  if (numberOfParticipants <= 0) return totalPrice;
  return Number((totalPrice / numberOfParticipants).toFixed(2));
};

/**
 * Apply discount to a price
 */
export const applyDiscount = (
  price: number,
  discountPercent: number
): number => {
  const discountAmount = (price * discountPercent) / 100;
  return Number((price - discountAmount).toFixed(2));
};

/**
 * Validate price values
 */
export const isPriceValid = (price: number): boolean => {
  return !isNaN(price) && price >= 0 && isFinite(price);
};

/**
 * Product Price Interface
 */
export interface ProductPrice {
  amount: number; // in cents
  currency_code: string;
}

// Price mapping based on tour handles (from seed data)
// FALLBACK ONLY: Used when calculated_price is not available from Store API
// ALL TOURS: $2000 per day (prices reflect total based on duration)
const TOUR_PRICES: Record<string, number> = {
  "1d-rainbow-beach": 200000,  // $2000 AUD (1 day × $2000)
  "1d-fraser-island": 200000,   // $2000 AUD (1 day × $2000)
  "2d-fraser-rainbow": 400000,  // $4000 AUD (2 days × $2000)
  "3d-fraser-rainbow": 600000,  // $6000 AUD (3 days × $2000)
  "4d-fraser-rainbow": 800000,  // $8000 AUD (4 days × $2000)
  "addon-internet": 5000,       // $50 AUD
  "addon-glamping": 25000,      // $250 AUD
  "addon-bbq": 18000,           // $180 AUD
  "addon-camera": 7500,         // $75 AUD
  "addon-picnic": 8500,         // $85 AUD
  "addon-fishing": 6500,        // $65 AUD
};

/**
 * Get price for a product based on handle
 * Falls back to hardcoded prices if variant prices aren't available
 */
export function getProductPrice(product: any): ProductPrice | null {
  // Try to get price from variant's calculated_price first
  if (product.variants && product.variants.length > 0) {
    const variant = product.variants[0];

    if (variant.calculated_price && variant.calculated_price.calculated_amount) {
      // ✅ MEDUSA V2 PRICING - FULLY MIGRATED AND WORKING
      // Database stores: Legacy cents format (200000 = $2000 in old system)
      // Medusa v2 Auto-Conversion: Divides by 100 at API layer (200000 → 2000 dollars)
      // API returns: calculated_amount in DOLLARS (Medusa v2 format)
      //   - Tours: 2000 (dollars) = $2000.00
      //   - Addons: 30 (dollars) = $30.00
      // Frontend conversion: Multiply by 100 to convert dollars → cents for internal precision
      //   - 2000 × 100 = 200000 cents (internal storage)
      // Display: PriceDisplay component divides by 100 to show dollars
      //   - 200000 cents / 100 = $2000.00 ✓
      //
      // Reference: https://docs.medusajs.com/resources/commerce-modules/product/price
      return {
        amount: Math.round(variant.calculated_price.calculated_amount * 100),
        currency_code: variant.calculated_price.currency_code || 'AUD',
      };
    }

    // Try variant.prices array (legacy format)
    // Note: This is Medusa v1 format which already returns cents
    if (variant.prices && variant.prices.length > 0) {
      const audPrice = variant.prices.find((p: any) => p.currency_code === 'AUD');
      if (audPrice) {
        return {
          amount: audPrice.amount,
          currency_code: 'AUD',
        };
      }
    }
  }

  // Fallback to hardcoded prices based on handle
  // These are already in cents
  if (product.handle && TOUR_PRICES[product.handle] !== undefined) {
    const price = TOUR_PRICES[product.handle];
    if (price !== undefined) {
      return {
        amount: price,
        currency_code: 'AUD',
      };
    }
  }

  return null;
}

/**
 * Format price in AUD currency from cents
 *
 * @param cents - Price amount in cents
 * @param includeSymbol - Whether to include currency symbol (default: true)
 * @param currencyCode - Currency code (default: 'AUD')
 * @returns Formatted price string (e.g., "$123.45" or "123.45")
 */
export function formatPrice(
  cents: number,
  includeSymbol: boolean = true,
  currencyCode: string = 'AUD'
): string {
  const amount = cents / 100;

  if (!includeSymbol) {
    return new Intl.NumberFormat('en-AU', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  }

  return new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency: currencyCode,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Get lowest price from multiple variants
 * Note: getProductPrice() now handles Medusa v2 dollar→cent conversion
 */
export function getLowestPrice(product: any): ProductPrice | null {
  if (!product.variants || product.variants.length === 0) {
    return getProductPrice(product);
  }

  let lowestAmount = Infinity;
  let currencyCode = 'AUD';

  for (const variant of product.variants) {
    const price = getProductPrice({ ...product, variants: [variant] });
    if (price && price.amount < lowestAmount) {
      lowestAmount = price.amount;
      currencyCode = price.currency_code;
    }
  }

  if (lowestAmount === Infinity) {
    return getProductPrice(product);
  }

  return {
    amount: lowestAmount,
    currency_code: currencyCode,
  };
}

/**
 * Add-On Specific Pricing Types
 */
export type PricingUnit = 'per_booking' | 'per_day' | 'per_person';

export interface AddOnPricing {
  id: string;
  title: string;
  price_cents: number;
  pricing_type: PricingUnit;
  quantity?: number;
}

export interface PricingContext {
  duration_days: number;
  participants: number;
  tour_base_price_cents?: number;
}

/**
 * Calculate add-on price based on pricing type
 * Handles per_day, per_booking, and per_person logic
 *
 * @param addon - The add-on to calculate price for
 * @param context - Pricing context (duration, participants)
 * @param quantity - Optional quantity override (defaults to addon.quantity or 1)
 */
export function calculateAddonPrice(
  addon: AddOnPricing,
  context: PricingContext,
  quantity?: number
): number {
  const { price_cents, pricing_type } = addon;
  const { duration_days, participants } = context;
  const qty = quantity ?? addon.quantity ?? 1;

  let unitPrice = price_cents;

  // Apply pricing logic based on type
  if (pricing_type === 'per_day') {
    unitPrice = price_cents * duration_days;
  } else if (pricing_type === 'per_person') {
    unitPrice = price_cents * participants;
  }
  // per_booking uses price as-is

  return unitPrice * qty;
}

/**
 * Calculate price impact when toggling an add-on
 * Returns the delta (positive when adding, negative when removing)
 *
 * @param addon - The add-on to calculate impact for
 * @param context - Pricing context (duration, participants)
 * @param isAdding - Whether the add-on is being added (true) or removed (false)
 * @param quantity - Optional quantity override
 */
export function calculatePriceImpact(
  addon: AddOnPricing,
  context: PricingContext,
  isAdding: boolean,
  quantity?: number
): number {
  const addonTotal = calculateAddonPrice(addon, context, quantity);
  return isAdding ? addonTotal : -addonTotal;
}

/**
 * Calculate total for all selected add-ons
 */
export function calculateAddonsTotal(
  addons: AddOnPricing[],
  context: PricingContext
): number {
  return addons.reduce((total, addon) => {
    return total + calculateAddonPrice(addon, context);
  }, 0);
}

/**
 * Format unit price display (e.g., "$50.00/day", "$180.00 per booking")
 *
 * @param priceCents - Price in cents
 * @param unit - Pricing unit type
 * @param currencyCode - Currency code (default: 'AUD')
 */
export function formatUnitPrice(
  priceCents: number,
  unit: PricingUnit,
  currencyCode: string = 'AUD'
): string {
  const formattedPrice = formatPrice(priceCents, true, currencyCode);

  switch (unit) {
    case 'per_day':
      return `${formattedPrice}/day`;
    case 'per_person':
      return `${formattedPrice}/person`;
    case 'per_booking':
      return formattedPrice;
    default:
      return formattedPrice;
  }
}

/**
 * Format unit display with duration context
 * Examples: "per day (3 days)", "per booking", "per person"
 */
export function formatUnit(unit: PricingUnit, durationDays?: number): string {
  switch (unit) {
    case 'per_day':
      return durationDays ? `per day (${durationDays} days)` : 'per day';
    case 'per_person':
      return 'per person';
    case 'per_booking':
      return 'per booking';
    default:
      return '';
  }
}

/**
 * Validate add-on pricing data
 * Ensures all required fields are present and valid
 */
export function validatePricing(addon: AddOnPricing): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Check required fields
  if (!addon.id) {
    errors.push('Missing required field: id');
  }
  if (!addon.title) {
    errors.push('Missing required field: title');
  }
  if (typeof addon.price_cents !== 'number') {
    errors.push('Missing or invalid field: price_cents');
  }
  if (!addon.pricing_type) {
    errors.push('Missing required field: pricing_type');
  }

  // Validate price_cents
  if (typeof addon.price_cents === 'number') {
    if (addon.price_cents < 0) {
      errors.push('price_cents cannot be negative');
    }
    if (!Number.isInteger(addon.price_cents)) {
      errors.push('price_cents must be an integer (cents)');
    }
  }

  // Validate pricing_type
  if (addon.pricing_type && !['per_booking', 'per_day', 'per_person'].includes(addon.pricing_type)) {
    errors.push(`Invalid pricing_type: ${addon.pricing_type}. Must be per_booking, per_day, or per_person`);
  }

  // Validate quantity (if present)
  if (addon.quantity !== undefined) {
    if (typeof addon.quantity !== 'number' || addon.quantity < 0) {
      errors.push('quantity must be a non-negative number');
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Reconcile client-side prices with server validation
 * Used to ensure price calculations match backend
 */
export interface PriceReconciliation {
  isValid: boolean;
  clientTotal: number;
  serverTotal: number;
  discrepancy: number;
  errors: string[];
}

export function reconcilePrices(
  clientAddons: AddOnPricing[],
  serverAddons: AddOnPricing[],
  context: PricingContext
): PriceReconciliation {
  const errors: string[] = [];

  // Calculate client-side total
  const clientTotal = calculateAddonsTotal(clientAddons, context);

  // Calculate server-side total
  const serverTotal = calculateAddonsTotal(serverAddons, context);

  // Check discrepancy
  const discrepancy = Math.abs(clientTotal - serverTotal);
  const isValid = discrepancy < 1; // Allow 1 cent rounding difference

  if (!isValid) {
    errors.push(`Price mismatch: client=${clientTotal}, server=${serverTotal}`);
  }

  // Validate individual add-ons
  clientAddons.forEach(clientAddon => {
    const serverAddon = serverAddons.find(sa => sa.id === clientAddon.id);
    if (!serverAddon) {
      errors.push(`Add-on ${clientAddon.id} not found on server`);
    } else if (serverAddon.price_cents !== clientAddon.price_cents) {
      errors.push(
        `Price mismatch for ${clientAddon.id}: ` +
        `client=${clientAddon.price_cents}, server=${serverAddon.price_cents}`
      );
    }
  });

  return {
    isValid: errors.length === 0,
    clientTotal,
    serverTotal,
    discrepancy,
    errors,
  };
}
