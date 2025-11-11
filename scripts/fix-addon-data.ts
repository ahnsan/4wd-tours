/**
 * Fix Addon Products - Railway Production Database
 *
 * Fixes two critical issues with addon products:
 * 1. Missing prices for Australia region (reg_01K9S1YB6T87JJW43F5ZAE8HWG)
 * 2. Missing collection assignments (should be "add-ons" collection)
 *
 * This breaks the storefront /api/addons endpoint when addons lack:
 * - calculated_price (requires region-specific prices)
 * - collection_id (for filtering addon products)
 *
 * Usage: railway run --service=4wd-tours -- npx medusa exec ./scripts/fix-addon-data.ts
 */

import { ExecArgs } from "@medusajs/framework/types";
import { Modules, ContainerRegistrationKeys } from "@medusajs/framework/utils";

// Production Australia region ID
const AUSTRALIA_REGION_ID = 'reg_01K9S1YB6T87JJW43F5ZAE8HWG';

// Addon pricing guidelines (in cents as per Medusa v2 format)
const ADDON_PRICING: Record<string, number> = {
  "addon-glamping": 8000,        // $80.00 AUD
  "addon-internet": 5000,        // $50.00 AUD
  "addon-bbq": 6500,             // $65.00 AUD
  "addon-camera": 7500,          // $75.00 AUD
  "addon-picnic": 8500,          // $85.00 AUD
  "addon-fishing": 6500,         // $65.00 AUD
  "addon-drone": 20000,          // $200.00 AUD
  "addon-gopro": 7500,           // $75.00 AUD
  "addon-starlink": 3000,        // $30.00 AUD
  "addon-photo-package": 15000,  // $150.00 AUD
  "addon-premium-photo": 20000,  // $200.00 AUD
  "addon-food-basic": 6500,      // $65.00 AUD
  "addon-food-premium": 18000,   // $180.00 AUD
  "addon-accommodation-upgrade": 18000, // $180.00 AUD
  "addon-deluxe-accommodation": 30000,  // $300.00 AUD
  "addon-activity-gear": 3500,   // $35.00 AUD
  "addon-premium-gear": 7500,    // $75.00 AUD
};

// Default price for unknown addons
const DEFAULT_ADDON_PRICE = 5000; // $50.00 AUD

export default async function fixAddonData({ container }: ExecArgs) {
  console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("🔧 ADDON PRODUCTS FIX - RAILWAY PRODUCTION");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

  const logger = container.resolve(ContainerRegistrationKeys.LOGGER);
  const productModuleService = container.resolve(Modules.PRODUCT);
  const pricingModuleService = container.resolve(Modules.PRICING);
  const regionModuleService = container.resolve(Modules.REGION);
  const remoteLink = container.resolve(ContainerRegistrationKeys.REMOTE_LINK);

  try {
    // Step 1: Verify Australia region exists
    console.log("Step 1: Verifying Australia region...");
    const regions = await regionModuleService.listRegions({
      id: AUSTRALIA_REGION_ID,
    });

    if (!regions || regions.length === 0) {
      throw new Error(`Australia region not found with ID: ${AUSTRALIA_REGION_ID}`);
    }

    const australiaRegion = regions[0];
    console.log(`✓ Found region: ${australiaRegion.name} (${australiaRegion.id})\n`);

    // Step 2: Find or create "add-ons" collection
    console.log("Step 2: Finding/creating 'add-ons' collection...");
    let addonsCollection;
    const existingCollections = await productModuleService.listProductCollections({
      handle: "add-ons",
    });

    if (existingCollections && existingCollections.length > 0) {
      addonsCollection = existingCollections[0];
      console.log(`✓ Found existing collection: ${addonsCollection.title} (${addonsCollection.id})\n`);
    } else {
      const newCollections = await productModuleService.createProductCollections([{
        handle: "add-ons",
        title: "Tour Add-ons",
      }]);
      addonsCollection = newCollections[0];
      console.log(`✓ Created new collection: ${addonsCollection.title} (${addonsCollection.id})\n`);
    }

    // Step 3: Find all addon products (handle starts with "addon-")
    console.log("Step 3: Finding all addon products...");
    const allProducts = await productModuleService.listProducts({}, {
      relations: ["variants", "variants.prices", "collection"],
    });

    const addonProducts = allProducts.filter((p: any) =>
      p.handle && p.handle.startsWith("addon-")
    );

    console.log(`✓ Found ${addonProducts.length} addon products\n`);

    if (addonProducts.length === 0) {
      console.log("⚠️  No addon products found. Exiting.\n");
      return;
    }

    // Step 4: Fix each addon product
    console.log("Step 4: Fixing addon products...\n");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

    let stats = {
      totalAddons: addonProducts.length,
      collectionsAssigned: 0,
      pricesAdded: 0,
      pricesUpdated: 0,
      errors: 0,
    };

    for (const product of addonProducts) {
      console.log(`\n📦 Processing: ${product.title} (${product.handle})`);
      console.log(`   Product ID: ${product.id}`);

      try {
        // Fix collection assignment
        if (!product.collection_id || product.collection_id !== addonsCollection.id) {
          await productModuleService.updateProducts(product.id, {
            collection_id: addonsCollection.id,
          });
          console.log(`   ✓ Assigned to "${addonsCollection.title}" collection`);
          stats.collectionsAssigned++;
        } else {
          console.log(`   ✓ Already in correct collection`);
        }

        // Fix pricing for each variant
        if (!product.variants || product.variants.length === 0) {
          console.log(`   ⚠️  No variants found - skipping pricing`);
          continue;
        }

        const priceAmount = ADDON_PRICING[product.handle] || DEFAULT_ADDON_PRICE;
        console.log(`   Target price: $${(priceAmount / 100).toFixed(2)} AUD`);

        for (const variant of product.variants) {
          console.log(`   \n   📌 Variant: ${variant.title} (${variant.id})`);

          // Get existing price set links
          const priceSetLinks = await remoteLink.query({
            [Modules.PRODUCT]: {
              variant_id: variant.id,
            },
            [Modules.PRICING]: {
              fields: ["price_set_id"],
            },
          });

          let priceSet;

          if (priceSetLinks && priceSetLinks.length > 0) {
            // Variant has a price set - check if it has Australia region price
            const priceSetId = priceSetLinks[0][Modules.PRICING].price_set_id;
            console.log(`      • Found existing price set: ${priceSetId}`);

            const priceSets = await pricingModuleService.listPriceSets({
              id: [priceSetId],
            }, {
              relations: ["prices", "prices.price_rules"],
            });

            if (priceSets && priceSets.length > 0) {
              priceSet = priceSets[0];

              // Check if Australia region price exists
              const australiaPrice = priceSet.prices?.find((price: any) => {
                return price.price_rules?.some((rule: any) =>
                  rule.attribute === "region_id" && rule.value === AUSTRALIA_REGION_ID
                );
              });

              if (australiaPrice) {
                // Price exists - check if amount needs updating
                if (australiaPrice.amount !== priceAmount) {
                  await pricingModuleService.updatePrices({
                    id: australiaPrice.id,
                    amount: priceAmount,
                  });
                  console.log(`      ✓ Updated price: $${(australiaPrice.amount / 100).toFixed(2)} → $${(priceAmount / 100).toFixed(2)}`);
                  stats.pricesUpdated++;
                } else {
                  console.log(`      ✓ Price already correct: $${(priceAmount / 100).toFixed(2)}`);
                }
              } else {
                // No Australia price - add it
                await pricingModuleService.createPrices({
                  price_set_id: priceSet.id,
                  amount: priceAmount,
                  currency_code: "aud",
                  rules: {
                    region_id: AUSTRALIA_REGION_ID,
                  },
                });
                console.log(`      ✓ Added Australia region price: $${(priceAmount / 100).toFixed(2)}`);
                stats.pricesAdded++;
              }
            }
          } else {
            // No price set - create one
            console.log(`      • No price set found - creating new one`);

            const newPriceSets = await pricingModuleService.createPriceSets({
              prices: [{
                amount: priceAmount,
                currency_code: "aud",
                rules: {
                  region_id: AUSTRALIA_REGION_ID,
                },
              }],
            });

            priceSet = newPriceSets[0];

            // Link price set to variant
            await remoteLink.create([{
              [Modules.PRODUCT]: {
                variant_id: variant.id,
              },
              [Modules.PRICING]: {
                price_set_id: priceSet.id,
              },
            }]);

            console.log(`      ✓ Created price set and linked to variant: $${(priceAmount / 100).toFixed(2)}`);
            stats.pricesAdded++;
          }
        }

        console.log(`   ✅ ${product.handle} fixed successfully`);

      } catch (error: any) {
        console.error(`   ❌ Error fixing ${product.handle}:`, error.message);
        stats.errors++;
      }
    }

    // Final Summary
    console.log("\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("📊 FIX SUMMARY");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

    console.log(`Total addons processed:     ${stats.totalAddons}`);
    console.log(`Collections assigned:       ${stats.collectionsAssigned}`);
    console.log(`Prices added:               ${stats.pricesAdded}`);
    console.log(`Prices updated:             ${stats.pricesUpdated}`);
    console.log(`Errors encountered:         ${stats.errors}`);

    const totalPricingFixes = stats.pricesAdded + stats.pricesUpdated;
    console.log(`\n✅ Total pricing fixes:      ${totalPricingFixes}`);
    console.log(`✅ Total collection fixes:  ${stats.collectionsAssigned}\n`);

    if (stats.errors > 0) {
      console.log(`⚠️  ${stats.errors} products had errors - review logs above\n`);
    }

    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("🎯 VERIFICATION STEPS");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

    console.log("1. Test Store API:");
    console.log(`   curl -H "x-publishable-api-key: pk_c1aea896aab279e937a2375566b06bfda34775b149b33353ca77eb3e8588a91b" \\`);
    console.log(`     "https://4wd-tours-production.up.railway.app/store/products?collection_id=${addonsCollection.id}&region_id=${AUSTRALIA_REGION_ID}"`);
    console.log(`\n   Should return all addon products with calculated_price field\n`);

    console.log("2. Test Storefront API:");
    console.log(`   curl https://4wd-tours-913f.vercel.app/api/addons`);
    console.log(`\n   Should return addon products without errors\n`);

    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

  } catch (error: any) {
    logger.error("❌ Addon fix failed:", error);
    console.error("\n❌ CRITICAL ERROR:", error.message);
    throw error;
  }
}
