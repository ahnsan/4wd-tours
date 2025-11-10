/**
 * Add-on Flow Service - Multi-Step Category Flow
 *
 * This service provides data and utilities for the multi-step addon selection flow.
 * It groups addons by category, manages step progression, and fetches persuasive copy.
 *
 * Flow: Category 1 → Category 2 → Category 3 → Category 4 → Category 5 → Summary
 */

// CRITICAL FIX: Use Addon from cart.ts (has variant_id), not AddOn from checkout.ts
import type { Addon } from '../types/cart';
import { fetchAllAddOns, type AddOnsResponse } from './addons-service';
import { filterAddonsForTour } from './addon-filtering';

/**
 * Category order for multi-step flow
 * Based on conversion optimization: Start with high-value, end with essentials
 *
 * MEDUSA BEST PRACTICE: Match backend categories exactly
 * These categories are defined in backend seed data (src/scripts/seed-addons.ts)
 */
export const CATEGORY_ORDER = [
  'Food & Beverage',
  'Photography',
  'Accommodation',      // Backend category (glamping, eco-lodge)
  'Activities',
  'Connectivity',
] as const;

export type CategoryName = typeof CATEGORY_ORDER[number];

/**
 * Category introduction data for persuasive copy
 */
export interface CategoryIntro {
  title: string;
  subtitle: string;
  description: string;
  icon: string;
  benefits: string[];
}

/**
 * Category introductions with persuasive copy
 */
const CATEGORY_INTROS: Record<CategoryName, CategoryIntro> = {
  'Food & Beverage': {
    title: 'Elevate Your Dining Experience',
    subtitle: 'From beachside BBQs to gourmet picnics',
    description: 'Transform your adventure with culinary delights that rival five-star restaurants, all served in nature\'s most stunning settings.',
    icon: '/images/icons/utensils.svg',
    benefits: [
      'Premium locally-sourced Queensland ingredients',
      'Chef-prepared meals in breathtaking locations',
      'No meal planning or prep required',
      'Dietary requirements accommodated'
    ]
  },
  'Photography': {
    title: 'Capture Every Moment',
    subtitle: 'Professional photography equipment and services',
    description: 'Don\'t let your once-in-a-lifetime moments disappear. Capture stunning memories with professional gear or let our photographers do the work.',
    icon: '/images/icons/camera.svg',
    benefits: [
      'Professional-grade cameras and lenses',
      'Expert photographers who know the best angles',
      'High-resolution digital files included',
      'Drone footage available for aerial perspectives'
    ]
  },
  'Accommodation': {
    title: 'Upgrade Your Stay',
    subtitle: 'From glamping to eco-lodges',
    description: 'Transform your camping experience into luxury accommodation. Sleep comfortably under the stars with our premium glamping and eco-lodge options.',
    icon: '/images/icons/tent.svg',
    benefits: [
      'Luxury camping with hotel-quality amenities',
      'Comfortable beds and premium linens',
      'Setup and takedown included',
      'Perfect for couples and families'
    ]
  },
  'Activities': {
    title: 'Make It Unforgettable',
    subtitle: 'Unique experiences and guided activities',
    description: 'Add exclusive activities that transform your tour from great to extraordinary. Each activity is led by local experts.',
    icon: '/images/icons/star.svg',
    benefits: [
      'Expert local guides',
      'Access to exclusive locations',
      'Small group sizes for personalized attention',
      'All safety equipment provided'
    ]
  },
  'Connectivity': {
    title: 'Stay Connected in Paradise',
    subtitle: 'High-speed internet anywhere you go',
    description: 'Share your adventure in real-time. From portable wifi to satellite internet, stay connected even in the most remote locations.',
    icon: '/images/icons/wifi.svg',
    benefits: [
      'Reliable high-speed internet',
      'Connect multiple devices',
      'Unlimited data throughout your tour',
      'Work remotely from paradise'
    ]
  }
};

/**
 * Persuasive addon metadata (enhanced from backend)
 */
export interface AddonPersuasiveCopy {
  persuasive_title?: string;
  persuasive_description?: string;
  value_proposition?: string;
  urgency_text?: string;
  features?: string[];
  social_proof?: string;
  best_for?: string[];
}

/**
 * Step information for multi-step flow
 */
export interface CategoryStep {
  categoryName: CategoryName;
  stepNumber: number;
  totalSteps: number;
  intro: CategoryIntro;
  addons: Addon[]; // Use Addon from cart.ts (has variant_id)
}

/**
 * Get addons grouped by category
 * Optionally filter by tour handle
 *
 * @param tourHandle - Optional tour handle to filter addons
 */
export async function getAddonsByCategory(tourHandle?: string): Promise<Record<string, Addon[]>> {
  const response = await fetchAllAddOns();

  // Filter addons by tour if handle is provided
  let addons = response.addons;
  if (tourHandle) {
    addons = filterAddonsForTour(addons, tourHandle);
    console.log(`[Addon Flow Service] Filtered to ${addons.length} addons for tour "${tourHandle}"`);
  }

  const grouped: Record<string, Addon[]> = {};

  addons.forEach((addon) => {
    const category = addon.category || 'Other';
    if (!grouped[category]) {
      grouped[category] = [];
    }
    grouped[category].push(addon);
  });

  return grouped;
}

/**
 * Get category steps in order for multi-step flow
 * Optionally filter addons by tour handle
 *
 * @param tourHandle - Optional tour handle to filter addons
 */
export async function getCategorySteps(tourHandle?: string): Promise<CategoryStep[]> {
  const groupedAddons = await getAddonsByCategory(tourHandle);
  const steps: CategoryStep[] = [];

  CATEGORY_ORDER.forEach((categoryName, index) => {
    const addons = groupedAddons[categoryName] || [];

    // Only include categories that have addons (skip empty categories)
    if (addons.length > 0) {
      steps.push({
        categoryName,
        stepNumber: steps.length + 1,
        totalSteps: CATEGORY_ORDER.length, // We'll update this after filtering
        intro: CATEGORY_INTROS[categoryName],
        addons
      });
    }
  });

  // Update totalSteps to reflect actual number of steps
  const actualTotal = steps.length;
  steps.forEach(step => {
    step.totalSteps = actualTotal;
  });

  console.log(`[Addon Flow Service] Generated ${steps.length} category steps${tourHandle ? ` for tour "${tourHandle}"` : ''}`);

  return steps;
}

/**
 * Get a specific category step by index
 * Optionally filter by tour handle
 *
 * @param stepIndex - Step index to retrieve
 * @param tourHandle - Optional tour handle to filter addons
 */
export async function getCategoryStep(stepIndex: number, tourHandle?: string): Promise<CategoryStep | null> {
  const steps = await getCategorySteps(tourHandle);

  if (stepIndex < 0 || stepIndex >= steps.length) {
    return null;
  }

  return steps[stepIndex] || null;
}

/**
 * Get persuasive copy for an addon
 * This data comes from backend metadata (from seed-addons.ts)
 */
export function getAddonPersuasiveCopy(addon: Addon): AddonPersuasiveCopy {
  // Extract persuasive copy from addon metadata
  const metadata = (addon as any).metadata || {};

  return {
    persuasive_title: metadata.persuasive_title,
    persuasive_description: metadata.persuasive_description || addon.description,
    value_proposition: metadata.value_proposition,
    urgency_text: metadata.urgency_text,
    features: metadata.features || [],
    social_proof: metadata.social_proof,
    best_for: metadata.best_for || metadata.recommended_for || []
  };
}

/**
 * Get category introduction by category name
 */
export function getCategoryIntro(category: CategoryName): CategoryIntro | null {
  return CATEGORY_INTROS[category] || null;
}

/**
 * Get all categories with their introductions
 */
export function getAllCategoryIntros(): Record<CategoryName, CategoryIntro> {
  return CATEGORY_INTROS;
}

/**
 * Calculate progress percentage for multi-step flow
 */
export function calculateProgress(currentStep: number, totalSteps: number): number {
  if (totalSteps === 0) return 0;
  return Math.round((currentStep / totalSteps) * 100);
}

/**
 * Validate step index
 */
export function isValidStepIndex(stepIndex: number, totalSteps: number): boolean {
  return stepIndex >= 0 && stepIndex < totalSteps;
}

/**
 * Get next step index (null if on last step)
 */
export function getNextStepIndex(currentStep: number, totalSteps: number): number | null {
  const nextIndex = currentStep + 1;
  return nextIndex < totalSteps ? nextIndex : null;
}

/**
 * Get previous step index (null if on first step)
 */
export function getPreviousStepIndex(currentStep: number): number | null {
  return currentStep > 0 ? currentStep - 1 : null;
}

/**
 * Check if current step is the last step
 */
export function isLastStep(currentStep: number, totalSteps: number): boolean {
  return currentStep === totalSteps - 1;
}

/**
 * Check if current step is the first step
 */
export function isFirstStep(currentStep: number): boolean {
  return currentStep === 0;
}
