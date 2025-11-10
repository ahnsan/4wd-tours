#!/usr/bin/env tsx
/**
 * Add-on Association Test Script
 *
 * Tests which tour products have add-ons properly associated.
 * Verifies the addon filtering logic and metadata configuration.
 *
 * Usage:
 *   npm run test:addons
 *   OR
 *   tsx scripts/test-addon-associations.ts
 */

import { ExecArgs } from "@medusajs/framework/types";
import {
  ContainerRegistrationKeys,
  Modules,
} from "@medusajs/framework/utils";

const TOURS = [
  '1d-rainbow-beach',
  '1d-fraser-island',
  '2d-fraser-rainbow',
  '3d-fraser-rainbow',
  '4d-fraser-rainbow'
];

const EXPECTED_COUNTS = {
  '1d-rainbow-beach': 15,
  '1d-fraser-island': 14,
  '2d-fraser-rainbow': 17,
  '3d-fraser-rainbow': 17,
  '4d-fraser-rainbow': 17,
};

/**
 * Check if an addon is applicable to a specific tour
 */
function isAddonApplicableToTour(addon: any, tourHandle: string): boolean {
  if (!addon.metadata?.applicable_tours) {
    return false;
  }

  const applicableTours = addon.metadata.applicable_tours;

  if (!Array.isArray(applicableTours) || applicableTours.length === 0) {
    return false;
  }

  if (applicableTours.includes('*')) {
    return true;
  }

  return applicableTours.includes(tourHandle);
}

/**
 * Filter addons for a specific tour
 */
function filterAddonsForTour(addons: any[], tourHandle: string): any[] {
  return addons.filter(addon => isAddonApplicableToTour(addon, tourHandle));
}

/**
 * Group addons by category
 */
function groupByCategory(addons: any[]): Record<string, any[]> {
  const grouped: Record<string, any[]> = {};

  addons.forEach(addon => {
    const category = addon.metadata?.category || 'Uncategorized';
    if (!grouped[category]) {
      grouped[category] = [];
    }
    grouped[category].push(addon);
  });

  return grouped;
}

/**
 * Main test function
 */
export default async function testAddonAssociations({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER);
  const productModuleService = container.resolve(Modules.PRODUCT);

  console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("🧪 Add-on Association Test");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

  try {
    // Fetch all products
    console.log("📦 Fetching products from database...\n");
    const allProducts = await productModuleService.listProducts({});

    // Separate tours and add-ons
    const tours = allProducts.filter(p => p.metadata?.is_tour === true);
    const addons = allProducts.filter(p => p.metadata?.addon === true);

    console.log(`✅ Found ${tours.length} tours`);
    console.log(`✅ Found ${addons.length} add-ons\n`);

    if (tours.length === 0) {
      console.log("⚠️  No tours found! Run 'npm run seed' first.\n");
      return;
    }

    if (addons.length === 0) {
      console.log("⚠️  No add-ons found! Run 'npm run seed' first.\n");
      return;
    }

    // Test 1: Verify all add-ons have applicable_tours metadata
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("Test 1: Metadata Validation");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

    const invalidAddons = addons.filter(addon =>
      !addon.metadata?.applicable_tours ||
      !Array.isArray(addon.metadata.applicable_tours) ||
      addon.metadata.applicable_tours.length === 0
    );

    if (invalidAddons.length > 0) {
      console.log(`❌ ${invalidAddons.length} add-ons missing applicable_tours:\n`);
      invalidAddons.forEach(addon => {
        console.log(`   ⚠️  ${addon.title} (${addon.handle})`);
        console.log(`      Metadata:`, addon.metadata);
      });
      console.log("");
    } else {
      console.log(`✅ All ${addons.length} add-ons have valid applicable_tours metadata\n`);
    }

    // Test 2: Check each tour's add-on associations
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("Test 2: Tour Add-on Associations");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

    for (const tour of tours) {
      const tourHandle = tour.handle;
      const filteredAddons = filterAddonsForTour(addons, tourHandle!);
      const grouped = groupByCategory(filteredAddons);
      const expectedCount = EXPECTED_COUNTS[tourHandle as keyof typeof EXPECTED_COUNTS];
      const isCorrect = filteredAddons.length === expectedCount;

      console.log(`${isCorrect ? '✅' : '❌'} ${tour.title} (${tourHandle})`);
      console.log(`   Found: ${filteredAddons.length} add-ons ${expectedCount ? `(Expected: ${expectedCount})` : ''}`);

      if (filteredAddons.length > 0) {
        console.log(`   Categories:`);
        Object.entries(grouped).forEach(([category, items]) => {
          console.log(`      • ${category}: ${items.length} items`);
        });
      } else {
        console.log(`   ⚠️  No add-ons available for this tour!`);
      }
      console.log("");
    }

    // Test 3: Add-on distribution analysis
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("Test 3: Add-on Distribution");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

    // Universal add-ons (applicable to all tours)
    const universalAddons = addons.filter(addon =>
      addon.metadata?.applicable_tours?.includes('*')
    );

    console.log(`🌍 Universal Add-ons (all tours): ${universalAddons.length}`);
    universalAddons.forEach(addon => {
      const category = addon.metadata?.category || 'Uncategorized';
      const unit = addon.metadata?.unit || 'per_booking';
      console.log(`   • ${addon.title} - ${category} (${unit})`);
    });
    console.log("");

    // Tour-specific add-ons
    const specificAddons = addons.filter(addon =>
      addon.metadata?.applicable_tours &&
      !addon.metadata.applicable_tours.includes('*')
    );

    if (specificAddons.length > 0) {
      console.log(`🎯 Tour-Specific Add-ons: ${specificAddons.length}`);
      specificAddons.forEach(addon => {
        const tours = addon.metadata?.applicable_tours || [];
        const category = addon.metadata?.category || 'Uncategorized';
        console.log(`   • ${addon.title} - ${category}`);
        console.log(`     Applicable to: ${tours.join(', ')}`);
      });
      console.log("");
    }

    // Test 4: Category breakdown
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("Test 4: Category Breakdown");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

    const allGrouped = groupByCategory(addons);
    Object.entries(allGrouped).forEach(([category, items]) => {
      console.log(`📦 ${category}: ${items.length} add-ons`);
      items.forEach(addon => {
        const price = addon.variants?.[0]?.prices?.[0]?.amount || 0;
        const unit = addon.metadata?.unit || 'per_booking';
        const priceDisplay = `$${(price / 100).toFixed(2)}`;
        console.log(`   • ${addon.title} - ${priceDisplay} ${unit}`);
      });
      console.log("");
    });

    // Test 5: Pricing analysis
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("Test 5: Pricing Summary");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

    const perBooking = addons.filter(a => a.metadata?.unit === 'per_booking');
    const perDay = addons.filter(a => a.metadata?.unit === 'per_day');
    const perPerson = addons.filter(a => a.metadata?.unit === 'per_person');

    console.log(`💰 Pricing Units:`);
    console.log(`   • Per Booking: ${perBooking.length} add-ons`);
    console.log(`   • Per Day: ${perDay.length} add-ons`);
    console.log(`   • Per Person: ${perPerson.length} add-ons`);
    console.log("");

    // Calculate price ranges
    const prices = addons
      .map(a => a.variants?.[0]?.prices?.[0]?.amount || 0)
      .filter(p => p > 0)
      .sort((a, b) => a - b);

    if (prices.length > 0) {
      console.log(`💵 Price Range:`);
      console.log(`   • Minimum: $${(prices[0] / 100).toFixed(2)}`);
      console.log(`   • Maximum: $${(prices[prices.length - 1] / 100).toFixed(2)}`);
      console.log(`   • Average: $${(prices.reduce((a, b) => a + b, 0) / prices.length / 100).toFixed(2)}`);
      console.log("");
    }

    // Final Summary
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("📊 Final Summary");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

    const allToursHaveAddons = tours.every(tour =>
      filterAddonsForTour(addons, tour.handle!).length > 0
    );

    console.log(`Tours: ${tours.length}`);
    console.log(`Add-ons: ${addons.length}`);
    console.log(`Categories: ${Object.keys(allGrouped).length}`);
    console.log(`Universal Add-ons: ${universalAddons.length}`);
    console.log(`Tour-Specific Add-ons: ${specificAddons.length}`);
    console.log(`Invalid Add-ons: ${invalidAddons.length}`);
    console.log("");

    if (allToursHaveAddons && invalidAddons.length === 0) {
      console.log("✅ All tours have add-ons properly configured!");
      console.log("✅ Add-ons flow should work correctly.\n");
    } else {
      console.log("⚠️  Issues detected:");
      if (!allToursHaveAddons) {
        console.log("   • Some tours have no add-ons available");
      }
      if (invalidAddons.length > 0) {
        console.log("   • Some add-ons have invalid metadata");
      }
      console.log("");
    }

  } catch (error) {
    logger.error("Test failed:", error);
    throw error;
  }
}
