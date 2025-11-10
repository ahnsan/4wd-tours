/**
 * Addon Adapter - Type Conversion Layer
 *
 * Converts HttpTypes.StoreProduct (from new service) to Addon type (legacy format)
 * This adapter allows gradual migration without breaking existing components.
 *
 * MEDUSA BEST PRACTICE: Temporary adapter for backward compatibility during migration.
 * Once all components updated, this file can be removed.
 */

import type { HttpTypes } from '@medusajs/types'
import type { Addon } from '../types/cart'

/**
 * Convert Medusa StoreProduct to legacy Addon format
 *
 * This adapter ensures backward compatibility with existing components
 * that expect the custom Addon type.
 *
 * @param product - Medusa StoreProduct from new service
 * @returns Addon in legacy format
 *
 * @example
 * const products = await fetchAddonsForTour('2d-fraser-rainbow', regionId)
 * const addons = products.map(productToAddon)
 */
export function productToAddon(product: HttpTypes.StoreProduct): Addon {
  const variant = product.variants?.[0]

  if (!variant) {
    throw new Error(`Product ${product.handle} has no variants`)
  }

  const calculatedPrice = variant.calculated_price

  if (!calculatedPrice || typeof calculatedPrice.calculated_amount !== 'number') {
    throw new Error(
      `Product ${product.handle} variant ${variant.id} has no calculated price. ` +
      `Ensure region pricing is configured.`
    )
  }

  // CRITICAL: Validate price is not zero or negative
  if (calculatedPrice.calculated_amount <= 0) {
    throw new Error(
      `Invalid price for product ${product.handle}: ${calculatedPrice.calculated_amount} cents. ` +
      `Price must be greater than zero.`
    )
  }

  // Extract metadata fields
  const metadata = product.metadata || {}
  const category = (metadata.category as string) || 'General'
  const pricingUnit = (metadata.unit as string) || 'per_booking'

  // Defensive check: warn if product appears to have unexpected structure
  if (process.env.NODE_ENV === 'development') {
    if (!product.id || !product.variants?.length) {
      console.warn(`[Addon Adapter] Product may have incomplete data:`, {
        id: product.id,
        handle: product.handle,
        hasVariants: !!product.variants?.length,
        variantCount: product.variants?.length || 0,
      });
    }
  }

  return {
    // Core fields
    id: product.id,
    handle: product.handle || '',
    title: product.title || '',
    description: product.description || '',

    // Variant information
    variant_id: variant.id,

    // Pricing - CRITICAL FIX: Medusa v2 returns prices in dollars (major units), not cents
    // Frontend expects cents, so we multiply by 100 to convert dollars → cents
    // Reference: https://docs.medusajs.com/resources/commerce-modules/product/price
    price_cents: Math.round(calculatedPrice.calculated_amount * 100),
    currency_code: calculatedPrice.currency_code || 'aud',

    // Availability - CRITICAL: Store API only returns published products
    // Medusa v2 Store API automatically filters to published products only
    // Draft/archived products are never sent to storefront, so all products are available
    available: true,

    // Category and type - CRITICAL: Field name must be pricing_type (not pricingType)
    category,
    pricing_type: pricingUnit as 'per_booking' | 'per_day' | 'per_person',

    // Metadata
    metadata: {
      ...metadata,
      // Ensure these fields exist for components that expect them
      category,
      unit: pricingUnit,
      addon: true,
    },
  }
}

/**
 * Convert array of products to addons
 *
 * @param products - Array of Medusa StoreProducts
 * @returns Array of Addons in legacy format
 *
 * @example
 * const products = await fetchAddonsForTour('2d-fraser-rainbow', regionId)
 * const addons = productsToAddons(products)
 */
export function productsToAddons(products: HttpTypes.StoreProduct[]): Addon[] {
  return products.map(productToAddon)
}

/**
 * Group addons by category (helper for multi-step flow)
 *
 * @param addons - Array of addons
 * @returns Object mapping category names to addon arrays
 *
 * @example
 * const grouped = groupAddonsByCategory(addons)
 * // { "Food & Beverage": [...], "Accommodation": [...] }
 */
export function groupAddonsByCategory(addons: Addon[]): Record<string, Addon[]> {
  return addons.reduce((groups, addon) => {
    const category = addon.category || 'Other'
    if (!groups[category]) {
      groups[category] = []
    }
    groups[category].push(addon)
    return groups
  }, {} as Record<string, Addon[]>)
}
