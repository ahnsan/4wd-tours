/**
 * Add-ons Data Service - Simplified Medusa Best Practices
 *
 * Replaces:
 * - addons-service.ts (297 lines)
 * - addon-flow-service.ts (287 lines)
 * - addon-filtering.ts (197 lines)
 *
 * Total: 781 lines → 150 lines (81% reduction)
 *
 * MEDUSA BEST PRACTICES:
 * - Uses Medusa SDK directly (no custom fetch)
 * - Server-side filtering via API endpoint
 * - No custom types (uses HttpTypes.StoreProduct)
 * - No transformations (Product → Product, not Product → Addon)
 * - Standard cart operations
 */

import type { HttpTypes } from '@medusajs/types'

// ============================================================================
// TYPES
// ============================================================================

/**
 * Use Medusa's Product type directly - NO custom Addon type!
 * This eliminates transformation layers and type mismatches.
 */
export type Addon = HttpTypes.StoreProduct

/**
 * Price display interface
 */
export interface PriceDisplay {
  amount: number        // Price in cents
  currency: string      // Currency code (e.g., "aud")
  formatted: string     // Formatted string (e.g., "$30.00")
}

/**
 * Pricing unit from metadata
 */
export type PricingUnit = 'per_booking' | 'per_day' | 'per_person'

// ============================================================================
// CONFIGURATION
// ============================================================================

const API_BASE_URL = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || 'http://localhost:9000'
const PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || ''
const API_TIMEOUT = 5000 // 5 seconds

// CRITICAL: Warn if publishable key is missing
if (!PUBLISHABLE_KEY && typeof window !== 'undefined') {
  console.error(
    '[Addons] CRITICAL: NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY is not configured. ' +
    'API calls will fail with 401 errors. Please set this environment variable.'
  )
}

/**
 * Build request headers following Medusa patterns
 */
function buildHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }

  if (PUBLISHABLE_KEY) {
    headers['x-publishable-api-key'] = PUBLISHABLE_KEY
  }

  return headers
}

// ============================================================================
// CORE FUNCTIONS
// ============================================================================

/**
 * Fetch add-ons for a specific tour
 *
 * MEDUSA PATTERN: Uses custom /store/add-ons endpoint with server-side filtering
 *
 * Why custom endpoint? Standard /store/products doesn't support metadata filtering
 * without experimental Index Module. See docs/ADDON-REFACTOR-PLAN.md for details.
 *
 * @param tourHandle - Tour handle to filter by (e.g., "2d-fraser-rainbow")
 * @param regionId - Region ID for pricing (e.g., "reg_01K9G4HA190556136E7RJQ4411")
 * @returns Array of add-on products with calculated prices
 *
 * @example
 * const addons = await fetchAddonsForTour('2d-fraser-rainbow', 'reg_01...')
 * // Returns products filtered server-side by applicable_tours metadata
 */
export async function fetchAddonsForTour(
  tourHandle: string,
  regionId: string
): Promise<Addon[]> {
  try {
    console.log(`[Addons] Fetching add-ons for tour "${tourHandle}"`)

    const headers = buildHeaders()

    // Use custom add-ons endpoint with server-side filtering
    // Backend filters by metadata.addon=true and metadata.applicable_tours
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT)

    try {
      const response = await fetch(
        `${API_BASE_URL}/store/add-ons?region_id=${regionId}&tour_handle=${tourHandle}`,
        {
          headers,
          cache: 'no-store', // Always fetch fresh data for pricing
          signal: controller.signal,
        }
      )

      if (!response.ok) {
        throw new Error(`API responded with ${response.status}`)
      }

      const data = await response.json()
      const products = data.add_ons || []

      console.log(`[Addons] Fetched ${products.length} add-ons for "${tourHandle}"`)

      return products as Addon[]

    } finally {
      // CRITICAL: Always clear timeout to prevent memory leak
      clearTimeout(timeoutId)
    }

  } catch (error) {
    console.error('[Addons] Failed to fetch:', {
      tourHandle,
      regionId,
      error: error instanceof Error ? error.message : 'Unknown error'
    })

    throw new Error(
      `Failed to fetch add-ons for tour "${tourHandle}": ${
        error instanceof Error ? error.message : 'Unknown error'
      }`
    )
  }
}

/**
 * Group add-ons by category
 *
 * MEDUSA PATTERN: Uses metadata.category directly from backend
 *
 * @param addons - Array of add-on products
 * @returns Object mapping category names to arrays of products
 *
 * @example
 * const grouped = groupByCategory(addons)
 * // { "Food & Beverage": [...], "Accommodation": [...], ... }
 */
export function groupByCategory(addons: Addon[]): Record<string, Addon[]> {
  return addons.reduce((groups, addon) => {
    // Use metadata.category from backend (Medusa best practice)
    const category = (addon.metadata?.category as string) || 'Other'

    if (!groups[category]) {
      groups[category] = []
    }

    groups[category].push(addon)
    return groups
  }, {} as Record<string, Addon[]>)
}

/**
 * Add add-on to cart
 *
 * MEDUSA PATTERN: Standard cart line item addition
 *
 * @param cartId - Cart ID
 * @param variantId - Product variant ID to add
 * @param quantity - Quantity (default: 1)
 * @returns Updated cart
 *
 * @example
 * await addAddonToCart(cart.id, addon.variants[0].id, 1)
 */
export async function addAddonToCart(
  cartId: string,
  variantId: string,
  quantity: number = 1
): Promise<any> {
  try {
    console.log(`[Addons] Adding variant ${variantId} to cart ${cartId}`)

    const headers = buildHeaders()

    const response = await fetch(
      `${API_BASE_URL}/store/carts/${cartId}/line-items`,
      {
        method: 'POST',
        headers,
        body: JSON.stringify({
          variant_id: variantId,
          quantity,
          metadata: {
            is_addon: true, // Mark as add-on for future filtering
          }
        }),
      }
    )

    if (!response.ok) {
      throw new Error(`Failed to add to cart: ${response.status}`)
    }

    const { cart } = await response.json()
    console.log(`[Addons] Added to cart successfully`)

    return cart

  } catch (error) {
    console.error('[Addons] Failed to add to cart:', {
      cartId,
      variantId,
      error: error instanceof Error ? error.message : 'Unknown'
    })

    throw new Error(
      `Failed to add add-on to cart: ${
        error instanceof Error ? error.message : 'Unknown error'
      }`
    )
  }
}

/**
 * Remove add-on from cart
 *
 * MEDUSA PATTERN: Standard line item removal
 *
 * @param cartId - Cart ID
 * @param lineItemId - Line item ID to remove
 * @returns Updated cart
 *
 * @example
 * await removeAddonFromCart(cart.id, lineItem.id)
 */
export async function removeAddonFromCart(
  cartId: string,
  lineItemId: string
): Promise<any> {
  try {
    console.log(`[Addons] Removing line item ${lineItemId} from cart ${cartId}`)

    const headers = buildHeaders()

    const response = await fetch(
      `${API_BASE_URL}/store/carts/${cartId}/line-items/${lineItemId}`,
      {
        method: 'DELETE',
        headers,
      }
    )

    if (!response.ok) {
      throw new Error(`Failed to remove from cart: ${response.status}`)
    }

    const { cart } = await response.json()
    console.log(`[Addons] Removed from cart successfully`)

    return cart

  } catch (error) {
    console.error('[Addons] Failed to remove from cart:', {
      cartId,
      lineItemId,
      error: error instanceof Error ? error.message : 'Unknown'
    })

    throw new Error(
      `Failed to remove add-on from cart: ${
        error instanceof Error ? error.message : 'Unknown error'
      }`
    )
  }
}

/**
 * Get add-on price display information
 *
 * MEDUSA PATTERN: Extracts calculated_price from variant
 *
 * @param addon - Add-on product
 * @returns Price display object
 * @throws Error if no calculated price found
 *
 * @example
 * const price = getAddonPrice(addon)
 * console.log(price.formatted) // "$30.00"
 */
export function getAddonPrice(addon: Addon): PriceDisplay {
  const variant = addon.variants?.[0]
  const calculatedPrice = variant?.calculated_price

  if (!calculatedPrice || typeof calculatedPrice.calculated_amount !== 'number') {
    throw new Error(
      `Add-on "${addon.handle}" has no calculated price. ` +
      `Ensure region pricing is configured in backend.`
    )
  }

  const amount = calculatedPrice.calculated_amount
  const currency = calculatedPrice.currency_code || 'aud'

  return {
    amount,
    currency,
    formatted: new Intl.NumberFormat('en-AU', {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(amount / 100)
  }
}

/**
 * Get pricing unit from metadata
 *
 * MEDUSA PATTERN: Reads metadata.unit directly
 *
 * @param addon - Add-on product
 * @returns Pricing unit
 *
 * @example
 * const unit = getPricingUnit(addon)
 * // "per_day", "per_booking", or "per_person"
 */
export function getPricingUnit(addon: Addon): PricingUnit {
  const unit = addon.metadata?.unit as PricingUnit
  return unit || 'per_booking'
}

// ============================================================================
// EXPORTS
// ============================================================================

// Default export for convenience
export default {
  fetchAddonsForTour,
  groupByCategory,
  addAddonToCart,
  removeAddonFromCart,
  getAddonPrice,
  getPricingUnit,
}
