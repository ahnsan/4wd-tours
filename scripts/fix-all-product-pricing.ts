/**
 * Fix pricing for all products - adds price sets to products missing them
 * Usage: pnpm medusa exec ./scripts/fix-all-product-pricing.ts
 */

import { ExecArgs } from "@medusajs/framework/types";
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils";

export default async function fixAllProductPricing({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER);
  const productModuleService = container.resolve(Modules.PRODUCT);
  const regionModuleService = container.resolve(Modules.REGION);
  const pricingModuleService = container.resolve(Modules.PRICING);

  logger.info("Starting product pricing fix...");

  // Get Australia region
  const regions = await regionModuleService.listRegions({
    name: "Australia",
  });

  if (!regions.length) {
    logger.error("Australia region not found!");
    return;
  }

  const australiaRegion = regions[0];
  logger.info(`Found region: ${australiaRegion.name} (${australiaRegion.id})`);

  // Get all products
  const products = await productModuleService.listProducts({}, {
    relations: ["variants"],
  });

  logger.info(`Found ${products.length} products to check`);

  // Default pricing by product type
  const tourPricing: Record<string, number> = {
    "1d-fraser-island": 24900, // $249
    "2d-fraser-rainbow": 54900, // $549
    "3d-fraser-combo": 79900, // $799
    "4d-fraser-combo": 99900, // $999
    "fraser-island-camping": 39900, // $399
    "fraser-rainforest-hiking": 17900, // $179
    "sunset-beach-safari": 19900, // $199
  };

  const addonPricing: Record<string, number> = {
    "addon-glamping": 8000, // $80
    "addon-internet": 3000, // $30
    "addon-bbq": 6500, // $65
  };

  let productsFixed = 0;
  let variantsFixed = 0;

  for (const product of products) {
    if (!product.variants || product.variants.length === 0) {
      logger.warn(`Product ${product.title} has no variants`);
      continue;
    }

    const handle = product.handle || "";
    let basePrice = 2500; // Default $25

    // Determine price based on handle
    if (tourPricing[handle]) {
      basePrice = tourPricing[handle];
    } else if (addonPricing[handle]) {
      basePrice = addonPricing[handle];
    }

    logger.info(`Processing: ${product.title} (${handle}) - Base: $${(basePrice / 100).toFixed(2)}`);

    for (const variant of product.variants) {
      try {
        // Check if variant already has a price set
        const existingPriceSets = await pricingModuleService.listPriceSets({
          id: variant.id,
        });

        if (existingPriceSets.length > 0) {
          logger.info(`  ✓ Variant ${variant.title} already has price set`);
          continue;
        }

        // Create price set for variant
        const priceSet = await pricingModuleService.createPriceSets({
          prices: [
            {
              amount: basePrice,
              currency_code: "aud",
              rules: {
                region_id: australiaRegion.id,
              },
            },
          ],
        });

        // Link price set to variant
        await pricingModuleService.addPrices({
          priceSetId: priceSet[0].id,
          prices: [
            {
              amount: basePrice,
              currency_code: "aud",
              rules: {
                region_id: australiaRegion.id,
              },
            },
          ],
        });

        logger.info(`  ✓ Added price set to variant: ${variant.title} - $${(basePrice / 100).toFixed(2)} AUD`);
        variantsFixed++;
      } catch (error) {
        logger.error(`  ✗ Failed to add price to variant ${variant.title}:`, error);
      }
    }

    productsFixed++;
  }

  logger.info("\n=== PRICING FIX COMPLETE ===");
  logger.info(`Products processed: ${productsFixed}`);
  logger.info(`Variants fixed: ${variantsFixed}`);
  logger.info("\nVerify with: curl -s 'http://localhost:9000/store/products?region_id=reg_01K9G4HA190556136E7RJQ4411' -H 'x-publishable-api-key: pk_...'");
}
