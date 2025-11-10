/**
 * Fix existing products in "add-ons" collection by adding missing metadata.addon = true flag
 *
 * Usage: npx medusa exec ./src/scripts/fix-addon-metadata.ts
 * Usage (dry-run): npx medusa exec ./src/scripts/fix-addon-metadata.ts -- --dry-run
 *
 * This script:
 * - Finds all products in the "add-ons" collection
 * - Identifies products missing metadata.addon = true
 * - Updates them with proper metadata while preserving existing metadata
 * - Preserves existing applicable_tours if present, sets default ["*"] if missing
 * - Is idempotent (safe to run multiple times)
 * - Includes dry-run mode for safety
 */

import { ExecArgs } from "@medusajs/framework/types";
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils";

interface ProductToFix {
  id: string;
  handle: string;
  title: string;
  metadata: Record<string, any>;
  needsAddonFlag: boolean;
  needsApplicableTours: boolean;
}

export default async function fixAddonMetadata({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER);
  const productModuleService = container.resolve(Modules.PRODUCT);

  // Check for dry-run flag from command line args
  const args = process.argv.slice(2);
  const isDryRun = args.includes("--dry-run") || args.includes("-d");

  logger.info("\n" + "=".repeat(60));
  logger.info("🔧 Fix Add-on Metadata Script");
  logger.info("=".repeat(60));

  if (isDryRun) {
    logger.warn("⚠️  DRY RUN MODE - No changes will be made");
  }

  try {
    // Step 1: Find the "add-ons" collection
    logger.info("\n📦 Step 1: Finding 'add-ons' collection...");

    const collections = await productModuleService.listProductCollections({
      handle: "add-ons",
    });

    if (!collections || collections.length === 0) {
      logger.error("❌ 'add-ons' collection not found!");
      logger.info("\nℹ️  Please run the seed script first: npm run seed");
      return;
    }

    const addonsCollection = collections[0];
    logger.info(`✓ Found collection: "${addonsCollection.title}" (${addonsCollection.id})`);

    // Step 2: Get all products in the add-ons collection
    logger.info("\n📋 Step 2: Fetching all products in 'add-ons' collection...");

    const products = await productModuleService.listProducts({
      collection_id: addonsCollection.id,
    }, {
      relations: ["variants"],
    });

    logger.info(`✓ Found ${products.length} products in add-ons collection`);

    if (products.length === 0) {
      logger.warn("⚠️  No products found in add-ons collection");
      return;
    }

    // Step 3: Analyze products to determine what needs fixing
    logger.info("\n🔍 Step 3: Analyzing products for missing metadata...");

    const productsToFix: ProductToFix[] = [];
    const productsAlreadyCorrect: string[] = [];

    for (const product of products) {
      const metadata = product.metadata || {};
      const needsAddonFlag = metadata.addon !== true;
      const needsApplicableTours = !metadata.applicable_tours ||
                                   !Array.isArray(metadata.applicable_tours) ||
                                   metadata.applicable_tours.length === 0;

      if (needsAddonFlag || needsApplicableTours) {
        productsToFix.push({
          id: product.id,
          handle: product.handle || "unknown",
          title: product.title,
          metadata,
          needsAddonFlag,
          needsApplicableTours,
        });
      } else {
        productsAlreadyCorrect.push(product.handle || product.title);
      }
    }

    // Display analysis results
    logger.info("\n" + "-".repeat(60));
    logger.info("📊 Analysis Results:");
    logger.info("-".repeat(60));
    logger.info(`Total products in collection:     ${products.length}`);
    logger.info(`Products needing fixes:           ${productsToFix.length}`);
    logger.info(`Products already correct:         ${productsAlreadyCorrect.length}`);
    logger.info("-".repeat(60));

    if (productsAlreadyCorrect.length > 0) {
      logger.info("\n✅ Products with correct metadata:");
      productsAlreadyCorrect.forEach(handle => {
        logger.info(`   ✓ ${handle}`);
      });
    }

    if (productsToFix.length === 0) {
      logger.info("\n🎉 All products already have correct metadata! No fixes needed.");
      return;
    }

    // Step 4: Display what will be fixed
    logger.info("\n🔧 Products to fix:");

    productsToFix.forEach((product, index) => {
      logger.info(`\n${index + 1}. ${product.title} (${product.handle})`);

      if (product.needsAddonFlag) {
        logger.info("   ⚠️  Missing: metadata.addon = true");
      }

      if (product.needsApplicableTours) {
        logger.info("   ⚠️  Missing: metadata.applicable_tours");
        logger.info("   → Will set: [\"*\"] (applies to all tours)");
      }

      if (Object.keys(product.metadata).length > 0) {
        logger.info(`   ℹ️  Existing metadata will be preserved: ${Object.keys(product.metadata).join(", ")}`);
      }
    });

    // Step 5: Apply fixes (or simulate in dry-run mode)
    if (isDryRun) {
      logger.info("\n" + "=".repeat(60));
      logger.warn("⚠️  DRY RUN COMPLETE - No changes were made");
      logger.info("=".repeat(60));
      logger.info("\nTo apply these changes, run without --dry-run flag:");
      logger.info("npx medusa exec ./src/scripts/fix-addon-metadata.ts");
      return;
    }

    logger.info("\n" + "=".repeat(60));
    logger.info("🚀 Step 4: Applying fixes...");
    logger.info("=".repeat(60));

    let successCount = 0;
    let errorCount = 0;

    for (const product of productsToFix) {
      try {
        // Prepare updated metadata
        const updatedMetadata = {
          ...product.metadata, // Preserve all existing metadata
          addon: true, // Add or update addon flag
        };

        // Set default applicable_tours if missing
        if (product.needsApplicableTours) {
          updatedMetadata.applicable_tours = ["*"]; // Default: applies to all tours
        }

        // Update the product
        await productModuleService.updateProducts([{
          id: product.id,
          metadata: updatedMetadata,
        }]);

        logger.info(`✅ ${product.handle} - Updated successfully`);

        if (product.needsAddonFlag) {
          logger.info("   → Added: metadata.addon = true");
        }

        if (product.needsApplicableTours) {
          logger.info("   → Added: metadata.applicable_tours = [\"*\"]");
        }

        successCount++;
      } catch (error) {
        logger.error(`❌ ${product.handle} - Failed to update:`);
        logger.error(error instanceof Error ? error.message : String(error));
        errorCount++;
      }
    }

    // Final summary
    logger.info("\n" + "=".repeat(60));
    logger.info("✨ Fix Complete!");
    logger.info("=".repeat(60));
    logger.info(`Successfully updated:    ${successCount} products`);
    logger.info(`Failed:                  ${errorCount} products`);
    logger.info(`Skipped (already OK):    ${productsAlreadyCorrect.length} products`);
    logger.info(`Total in collection:     ${products.length} products`);
    logger.info("=".repeat(60));

    if (errorCount > 0) {
      logger.warn("\n⚠️  Some products failed to update. Check the errors above.");
    } else {
      logger.info("\n🎉 All products in the add-ons collection now have correct metadata!");
    }

    logger.info("\nℹ️  To verify the changes:");
    logger.info("   Check the Store API:");
    logger.info("   curl http://localhost:9000/store/add-ons\n");

  } catch (error) {
    logger.error("\n❌ Script failed with error:");
    logger.error(error instanceof Error ? error.message : String(error));

    if (error instanceof Error && error.stack) {
      logger.debug("Stack trace:", error.stack);
    }

    throw error;
  }
}
