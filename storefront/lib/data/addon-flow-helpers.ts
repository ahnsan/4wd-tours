/**
 * Add-on Flow Helpers - Bridge Between New Service and Multi-Step Flow
 *
 * This module bridges the new simplified addons.ts service with the existing
 * multi-step flow UI. It provides the same interface as addon-flow-service.ts
 * but uses the new server-side filtered service under the hood.
 *
 * MIGRATION PATH: Once frontend is fully updated, this can replace addon-flow-service.ts
 */

import { fetchAddonsForTour } from './addons'
import { productsToAddons } from '../utils/addon-adapter'
import type { Addon } from '../types/cart'
import type { CategoryStep } from './addon-flow-service'

// Import category configuration from old service
import {
  CATEGORY_ORDER,
  getCategoryIntro,
  type CategoryName
} from './addon-flow-service'

/**
 * Get category steps using NEW service with server-side filtering
 *
 * This function provides the same interface as the old getCategorySteps()
 * but uses the new addons.ts service internally.
 *
 * @param tourHandle - Tour handle to filter add-ons
 * @returns Array of category steps for multi-step flow
 *
 * @example
 * const steps = await getCategoryStepsV2('2d-fraser-rainbow')
 */
export async function getCategoryStepsV2(tourHandle?: string): Promise<CategoryStep[]> {
  try {
    console.log(`[Flow Helpers] Fetching add-ons for tour: ${tourHandle || 'all'}`)

    // Get region ID from environment or cart context
    const regionId = process.env.NEXT_PUBLIC_DEFAULT_REGION_ID || 'reg_01K9G4HA190556136E7RJQ4411'

    if (!tourHandle) {
      console.warn('[Flow Helpers] No tour handle provided')
      return []
    }

    // Use NEW service - server-side filtered!
    const products = await fetchAddonsForTour(tourHandle, regionId)

    // Convert to legacy Addon format using adapter
    const addons = productsToAddons(products)

    console.log(`[Flow Helpers] Converted ${products.length} products to addons`)

    // Group by category
    const groupedAddons: Record<string, Addon[]> = {}

    addons.forEach((addon) => {
      const category = addon.category || 'Other'
      if (!groupedAddons[category]) {
        groupedAddons[category] = []
      }
      groupedAddons[category].push(addon)
    })

    // Create steps in category order
    const steps: CategoryStep[] = []

    CATEGORY_ORDER.forEach((categoryName) => {
      const categoryAddons = groupedAddons[categoryName] || []

      // Only include categories that have addons
      if (categoryAddons.length > 0) {
        const intro = getCategoryIntro(categoryName)
        if (intro) {
          steps.push({
            categoryName,
            stepNumber: steps.length + 1,
            totalSteps: CATEGORY_ORDER.length, // Updated after filtering
            intro: intro,
            addons: categoryAddons
          })
        }
      }
    })

    // Update totalSteps to reflect actual number of steps
    const actualTotal = steps.length
    steps.forEach(step => {
      step.totalSteps = actualTotal
    })

    console.log(`[Flow Helpers] Generated ${steps.length} category steps`)

    return steps

  } catch (error) {
    console.error('[Flow Helpers] Failed to get category steps:', error)
    throw error
  }
}

/**
 * Export as default for easy replacement
 */
export default {
  getCategoryStepsV2
}
