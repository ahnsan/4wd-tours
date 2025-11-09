/**
 * Medusa JS SDK Client Configuration
 *
 * This module initializes and exports the Medusa SDK client instance
 * for use throughout the storefront application.
 *
 * Official Documentation: https://docs.medusajs.com/resources/js-sdk
 * Storefront Development: https://docs.medusajs.com/resources/storefront-development
 *
 * Configuration:
 * - baseUrl: Medusa backend API URL (from NEXT_PUBLIC_MEDUSA_BACKEND_URL)
 * - publishableKey: Publishable API key for storefront requests (from NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY)
 * - debug: Enable debug logging in development mode
 *
 * Usage:
 * ```typescript
 * import { sdk } from '@/lib/data/medusa-client'
 *
 * // Fetch products
 * const products = await sdk.store.product.list()
 *
 * // Retrieve a cart
 * const cart = await sdk.store.cart.retrieve(cartId)
 * ```
 */

import Medusa from "@medusajs/js-sdk"

// Get backend URL from environment variables
// This follows the official Medusa pattern for Next.js storefronts
let MEDUSA_BACKEND_URL = "http://localhost:9000"

if (process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL) {
  MEDUSA_BACKEND_URL = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL
}

/**
 * Medusa SDK Client Instance
 *
 * Initialized following official Medusa documentation patterns.
 * The SDK automatically includes the publishable API key in request headers.
 *
 * Features:
 * - Store API for customer-facing operations (products, carts, orders, etc.)
 * - Automatic authentication header management
 * - Type-safe API methods
 * - Debug logging in development mode
 */
export const sdk = new Medusa({
  baseUrl: MEDUSA_BACKEND_URL,
  debug: process.env.NODE_ENV === "development",
  publishableKey: process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY,
})

/**
 * Export the SDK instance as default for convenience
 */
export default sdk
