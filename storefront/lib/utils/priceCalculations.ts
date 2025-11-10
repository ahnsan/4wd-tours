/**
 * Price Calculation Utilities for 4WD Tours and Addons
 *
 * Handles accurate price calculations for:
 * - Tours (base_price × participants × duration_days)
 * - Addons with per_booking, per_day, and per_person pricing
 * - Tax calculations
 * - Price breakdowns
 */

import type {
  Addon,
  AddonPricingType,
  Tour,
  CartAddon,
  PriceCalculationContext,
  PriceBreakdown,
  TourBooking,
  DEFAULT_CART_CONFIG,
} from '@/lib/types/cart';

// ============================================================================
// Tour Price Calculations
// ============================================================================

/**
 * Calculate total price for a tour booking
 *
 * Formula: base_price × participants × duration_days
 *
 * @param tour - Tour product
 * @param participants - Number of participants
 * @returns Total price in cents
 *
 * @example
 * calculateTourPrice(tour, 2)
 * // If tour.base_price_cents = 50000, duration_days = 3
 * // Returns: 50000 × 2 × 3 = 300000 cents ($3000.00)
 */
export function calculateTourPrice(tour: Tour, participants: number): number {
  if (participants < 1) {
    throw new Error('Participants must be at least 1');
  }

  return tour.base_price_cents * participants * tour.duration_days;
}

/**
 * Calculate end date from start date and duration
 *
 * @param start_date - ISO date string
 * @param duration_days - Number of days
 * @returns ISO date string for end date
 */
export function calculateEndDate(start_date: string, duration_days: number): string {
  const startDate = new Date(start_date);
  const endDate = new Date(startDate);
  endDate.setDate(startDate.getDate() + duration_days);
  const isoString = endDate.toISOString().split('T')[0];
  return isoString || '';
}

// ============================================================================
// Addon Price Calculations
// ============================================================================

/**
 * Calculate price for a single addon based on pricing type
 *
 * Pricing formulas:
 * - per_booking: price × quantity
 * - per_day: price × quantity × duration_days
 * - per_person: price × quantity × participants
 *
 * @param addon - Addon product
 * @param quantity - Quantity selected
 * @param context - Pricing context (duration and participants)
 * @returns Calculated price in cents
 *
 * @example
 * // Per booking addon
 * calculateAddonPrice(
 *   { price_cents: 5000, pricing_type: 'per_booking' },
 *   2,
 *   { tour_duration_days: 3, participants: 2 }
 * )
 * // Returns: 5000 × 2 = 10000 cents ($100.00)
 *
 * @example
 * // Per day addon
 * calculateAddonPrice(
 *   { price_cents: 2000, pricing_type: 'per_day' },
 *   1,
 *   { tour_duration_days: 3, participants: 2 }
 * )
 * // Returns: 2000 × 1 × 3 = 6000 cents ($60.00)
 *
 * @example
 * // Per person addon
 * calculateAddonPrice(
 *   { price_cents: 3000, pricing_type: 'per_person' },
 *   1,
 *   { tour_duration_days: 3, participants: 2 }
 * )
 * // Returns: 3000 × 1 × 2 = 6000 cents ($60.00)
 */
export function calculateAddonPrice(
  addon: Addon,
  quantity: number,
  context: PriceCalculationContext
): number {
  if (quantity < 0) {
    throw new Error('Quantity cannot be negative');
  }

  if (quantity === 0) {
    return 0;
  }

  const basePrice = addon.price_cents;

  switch (addon.pricing_type) {
    case 'per_booking':
      // Price per booking: price × quantity
      return basePrice * quantity;

    case 'per_day':
      // Price per day: price × quantity × duration_days
      return basePrice * quantity * context.tour_duration_days;

    case 'per_person':
      // Price per person: price × quantity × participants
      return basePrice * quantity * context.participants;

    default:
      throw new Error(`Unknown pricing type: ${addon.pricing_type}`);
  }
}

/**
 * Get human-readable calculation formula for an addon
 *
 * @param addon - Addon product
 * @param quantity - Quantity selected
 * @param context - Pricing context
 * @returns Human-readable formula string
 */
export function getAddonPriceFormula(
  addon: Addon,
  quantity: number,
  context: PriceCalculationContext
): string {
  const price = formatCentsToDisplay(addon.price_cents);

  switch (addon.pricing_type) {
    case 'per_booking':
      return `${price} × ${quantity} = ${formatCentsToDisplay(calculateAddonPrice(addon, quantity, context))}`;

    case 'per_day':
      return `${price} × ${quantity} × ${context.tour_duration_days} days = ${formatCentsToDisplay(
        calculateAddonPrice(addon, quantity, context)
      )}`;

    case 'per_person':
      return `${price} × ${quantity} × ${context.participants} people = ${formatCentsToDisplay(
        calculateAddonPrice(addon, quantity, context)
      )}`;

    default:
      return 'Unknown pricing type';
  }
}

// ============================================================================
// Cart Totals Calculations
// ============================================================================

/**
 * Calculate total for all addons in cart
 *
 * @param addons - Array of cart addons
 * @returns Total price in cents
 */
export function calculateAddonsTotal(addons: CartAddon[]): number {
  return addons.reduce((total, cartAddon) => {
    return total + cartAddon.calculated_price_cents;
  }, 0);
}

/**
 * Calculate subtotal (tour + addons, before tax)
 *
 * @param tourTotal - Tour total price in cents
 * @param addonsTotal - Addons total price in cents
 * @returns Subtotal in cents
 */
export function calculateSubtotal(tourTotal: number, addonsTotal: number): number {
  return tourTotal + addonsTotal;
}

/**
 * Calculate tax (GST) amount
 *
 * @param subtotal - Subtotal in cents
 * @param taxRate - Tax rate (e.g., 0.10 for 10%)
 * @returns Tax amount in cents
 */
export function calculateTax(subtotal: number, taxRate: number = 0.10): number {
  return Math.round(subtotal * taxRate);
}

/**
 * Calculate grand total (subtotal + tax)
 *
 * @param subtotal - Subtotal in cents
 * @param tax - Tax amount in cents
 * @returns Grand total in cents
 */
export function calculateGrandTotal(subtotal: number, tax: number): number {
  return subtotal + tax;
}

// ============================================================================
// Price Breakdown
// ============================================================================

/**
 * Generate complete price breakdown for transparency
 *
 * @param tourBooking - Tour booking details
 * @param addons - Cart addons
 * @param taxRate - Tax rate (default: 0.10 for 10% GST)
 * @returns Complete price breakdown
 */
export function generatePriceBreakdown(
  tourBooking: TourBooking | null,
  addons: CartAddon[],
  taxRate: number = 0.10
): PriceBreakdown {
  const tourTotal = tourBooking?.total_price_cents || 0;
  const addonsTotal = calculateAddonsTotal(addons);
  const subtotal = calculateSubtotal(tourTotal, addonsTotal);
  const tax = calculateTax(subtotal, taxRate);
  const total = calculateGrandTotal(subtotal, tax);

  const context: PriceCalculationContext = {
    tour_duration_days: tourBooking?.tour.duration_days || 1,
    participants: tourBooking?.participants || 1,
  };

  return {
    // Tour pricing
    tour_base_price_cents: tourBooking?.tour.base_price_cents || 0,
    tour_participants: tourBooking?.participants || 0,
    tour_duration_days: tourBooking?.tour.duration_days || 0,
    tour_total_cents: tourTotal,

    // Addon pricing
    addon_items: addons.map((cartAddon) => ({
      addon_id: cartAddon.addon.id,
      title: cartAddon.addon.title,
      base_price_cents: cartAddon.addon.price_cents,
      pricing_type: cartAddon.addon.pricing_type,
      quantity: cartAddon.quantity,
      calculated_price_cents: cartAddon.calculated_price_cents,
      calculation_formula: getAddonPriceFormula(cartAddon.addon, cartAddon.quantity, context),
    })),
    addons_total_cents: addonsTotal,

    // Totals
    subtotal_cents: subtotal,
    tax_rate: taxRate,
    tax_cents: tax,
    total_cents: total,
  };
}

// ============================================================================
// Price Formatting Utilities
// ============================================================================

/**
 * Format cents to currency string
 *
 * @param cents - Amount in cents
 * @param currencyCode - Currency code (default: AUD)
 * @returns Formatted currency string
 *
 * @example
 * formatCentsToDisplay(12345) // "$123.45"
 * formatCentsToDisplay(10000, 'USD') // "$100.00"
 */
export function formatCentsToDisplay(cents: number, currencyCode: string = 'AUD'): string {
  const dollars = cents / 100;
  return new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency: currencyCode,
  }).format(dollars);
}

/**
 * Format cents to simple number string
 *
 * @param cents - Amount in cents
 * @returns Formatted number string
 *
 * @example
 * formatCentsToNumber(12345) // "123.45"
 */
export function formatCentsToNumber(cents: number): string {
  return (cents / 100).toFixed(2);
}

/**
 * Convert dollars to cents
 *
 * @param dollars - Amount in dollars
 * @returns Amount in cents
 */
export function dollarsToCents(dollars: number): number {
  return Math.round(dollars * 100);
}

/**
 * Convert cents to dollars
 *
 * @param cents - Amount in cents
 * @returns Amount in dollars
 */
export function centsToDollars(cents: number): number {
  return cents / 100;
}

// ============================================================================
// Price Validation
// ============================================================================

/**
 * Validate that price is a positive number
 *
 * @param price - Price to validate
 * @param fieldName - Field name for error message
 * @throws Error if price is invalid
 */
export function validatePrice(price: number, fieldName: string = 'Price'): void {
  if (typeof price !== 'number' || isNaN(price)) {
    throw new Error(`${fieldName} must be a valid number`);
  }

  if (price < 0) {
    throw new Error(`${fieldName} cannot be negative`);
  }
}

/**
 * Validate quantity
 *
 * @param quantity - Quantity to validate
 * @param max - Maximum allowed quantity
 * @throws Error if quantity is invalid
 */
export function validateQuantity(quantity: number, max?: number): void {
  if (!Number.isInteger(quantity) || quantity < 0) {
    throw new Error('Quantity must be a non-negative integer');
  }

  if (max && quantity > max) {
    throw new Error(`Quantity cannot exceed ${max}`);
  }
}

/**
 * Validate participants count
 *
 * @param participants - Number of participants
 * @param min - Minimum participants
 * @param max - Maximum participants
 * @throws Error if participants is invalid
 */
export function validateParticipants(participants: number, min: number = 1, max?: number): void {
  if (!Number.isInteger(participants) || participants < min) {
    throw new Error(`Participants must be at least ${min}`);
  }

  if (max && participants > max) {
    throw new Error(`Participants cannot exceed ${max}`);
  }
}

// ============================================================================
// Price Comparison
// ============================================================================

/**
 * Compare two prices with tolerance for floating point errors
 *
 * @param price1 - First price in cents
 * @param price2 - Second price in cents
 * @param tolerance - Tolerance in cents (default: 1 cent)
 * @returns true if prices are equal within tolerance
 */
export function arePricesEqual(price1: number, price2: number, tolerance: number = 1): boolean {
  return Math.abs(price1 - price2) <= tolerance;
}

/**
 * Reconcile client-side and server-side prices
 *
 * @param clientTotal - Client-calculated total
 * @param serverTotal - Server-provided total
 * @returns Reconciliation result
 */
export function reconcilePrices(clientTotal: number, serverTotal: number) {
  const discrepancy = Math.abs(clientTotal - serverTotal);
  const isValid = discrepancy <= 1; // Allow 1 cent difference for rounding

  return {
    isValid,
    clientTotal,
    serverTotal,
    discrepancy,
    discrepancyPercent: serverTotal > 0 ? (discrepancy / serverTotal) * 100 : 0,
  };
}
