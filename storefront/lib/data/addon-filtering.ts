/**
 * Add-on Filtering Service
 *
 * Filters add-ons based on tour compatibility using metadata.applicable_tours field.
 * Ensures only relevant add-ons are shown for each tour in the checkout flow.
 *
 * Performance target: < 50ms for filtering operations
 */

import type { Addon } from '../types/cart';

/**
 * Check if an addon is applicable to a specific tour
 *
 * @param addon - The addon to check
 * @param tourHandle - The tour handle to check against
 * @returns true if addon is applicable to the tour
 *
 * Logic:
 * - If no applicable_tours metadata, addon is NOT applicable (fail-safe)
 * - If applicable_tours is empty array, addon is NOT applicable
 * - If applicable_tours includes "*", addon applies to ALL tours
 * - If applicable_tours includes the tourHandle, addon applies
 */
export function isAddonApplicableToTour(
  addon: Addon,
  tourHandle: string
): boolean {
  // Validate inputs
  if (!addon || !tourHandle || typeof tourHandle !== 'string' || tourHandle.trim() === '') {
    return false;
  }

  // Early return if no metadata
  if (!addon.metadata) {
    return false;
  }

  const applicableTours = addon.metadata.applicable_tours;

  // No applicable_tours defined = not applicable
  if (!applicableTours || applicableTours.length === 0) {
    return false;
  }

  // Wildcard "*" means applicable to all tours
  if (applicableTours.includes('*')) {
    return true;
  }

  // Check if tour handle is in the list
  return applicableTours.includes(tourHandle);
}

/**
 * Filter a list of addons for a specific tour
 *
 * @param addons - Array of addons to filter
 * @param tourHandle - The tour handle to filter for
 * @returns Filtered array of addons applicable to the tour
 *
 * Performance: O(n) where n is number of addons
 * Typical execution time: < 5ms for 20 addons
 */
export function filterAddonsForTour(
  addons: Addon[],
  tourHandle: string
): Addon[] {
  if (!addons || !Array.isArray(addons)) {
    return [];
  }

  // If no tour specified, return all addons
  if (!tourHandle) {
    return addons;
  }

  const startTime = performance.now();

  const filtered = addons.filter(addon =>
    isAddonApplicableToTour(addon, tourHandle)
  );

  const endTime = performance.now();
  const duration = endTime - startTime;

  // Log performance metrics in development
  if (process.env.NODE_ENV === 'development') {
    console.log(`[Addon Filtering] Filtered ${addons.length} addons to ${filtered.length} for tour "${tourHandle}" in ${duration.toFixed(2)}ms`);
  }

  return filtered;
}

/**
 * Group filtered addons by category
 *
 * @param addons - Array of addons (pre-filtered)
 * @returns Object mapping category names to arrays of addons
 */
export function groupAddonsByCategory(addons: Addon[]): Record<string, Addon[]> {
  const grouped: Record<string, Addon[]> = {};

  addons.forEach(addon => {
    const category = addon.category || 'Other';
    if (!grouped[category]) {
      grouped[category] = [];
    }
    grouped[category].push(addon);
  });

  return grouped;
}

/**
 * Get statistics about addon filtering
 *
 * @param allAddons - All available addons
 * @param filteredAddons - Filtered addons for specific tour
 * @returns Statistics object
 */
export function getFilteringStats(
  allAddons: Addon[],
  filteredAddons: Addon[]
): {
  total: number;
  filtered: number;
  removed: number;
  percentageShown: number;
} {
  const total = allAddons.length;
  const filtered = filteredAddons.length;
  const removed = total - filtered;
  const percentageShown = total > 0 ? Math.round((filtered / total) * 100) : 0;

  return {
    total,
    filtered,
    removed,
    percentageShown
  };
}

/**
 * Detect incompatible addons in a selection
 * Used for tour change detection to remove incompatible addons from cart
 *
 * @param selectedAddons - Currently selected addons
 * @param tourHandle - The new tour handle
 * @returns Array of incompatible addons that should be removed
 */
export function detectIncompatibleAddons(
  selectedAddons: Addon[],
  tourHandle: string
): Addon[] {
  return selectedAddons.filter(addon =>
    !isAddonApplicableToTour(addon, tourHandle)
  );
}

/**
 * Type guard to check if addon has applicable_tours metadata
 *
 * @param addon - Addon to check
 * @returns true if addon has applicable_tours metadata
 */
export function hasApplicableToursMetadata(addon: Addon): boolean {
  return !!(
    addon.metadata &&
    Array.isArray(addon.metadata.applicable_tours) &&
    addon.metadata.applicable_tours.length > 0
  );
}

/**
 * Get all unique tour handles from addons
 * Useful for debugging and admin interfaces
 *
 * @param addons - Array of addons
 * @returns Array of unique tour handles
 */
export function getAllTourHandlesFromAddons(addons: Addon[]): string[] {
  const handles = new Set<string>();

  addons.forEach(addon => {
    const applicableTours = addon.metadata?.applicable_tours;
    if (applicableTours) {
      applicableTours.forEach((handle: string) => {
        if (handle !== '*') {
          handles.add(handle);
        }
      });
    }
  });

  return Array.from(handles).sort();
}
