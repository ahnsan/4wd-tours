/**
 * Category Slug Utilities
 *
 * Maps category names to URL-friendly slugs and vice versa
 * for category-specific add-on pages
 */

import type { CategoryName } from '../data/addon-flow-service';

/**
 * Category slug mapping
 */
export const CATEGORY_SLUGS: Record<CategoryName, string> = {
  'Food & Beverage': 'food-beverage',
  'Photography': 'photography',
  'Accommodation': 'accommodation',
  'Activities': 'activities',
  'Connectivity': 'connectivity',
};

/**
 * Reverse mapping: slug to category name
 */
export const SLUG_TO_CATEGORY: Record<string, CategoryName> = {
  'food-beverage': 'Food & Beverage',
  'photography': 'Photography',
  'accommodation': 'Accommodation',
  'activities': 'Activities',
  'connectivity': 'Connectivity',
};

/**
 * Convert category name to URL slug
 */
export function categoryToSlug(category: CategoryName): string {
  return CATEGORY_SLUGS[category] || category.toLowerCase().replace(/[^a-z0-9]+/g, '-');
}

/**
 * Convert URL slug to category name
 */
export function slugToCategory(slug: string): CategoryName | null {
  return SLUG_TO_CATEGORY[slug] || null;
}

/**
 * Get all valid category slugs
 */
export function getAllCategorySlugs(): string[] {
  return Object.values(CATEGORY_SLUGS);
}

/**
 * Check if a slug is valid
 */
export function isValidCategorySlug(slug: string): boolean {
  return slug in SLUG_TO_CATEGORY;
}

/**
 * Generate category URL
 */
export function getCategoryUrl(category: CategoryName): string {
  return `/checkout/add-ons/${categoryToSlug(category)}`;
}
