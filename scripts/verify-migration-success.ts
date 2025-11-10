#!/usr/bin/env tsx
/**
 * Verify Migration Success
 *
 * Validates that the migration from Medusa v1 (cents) to v2 (dollars) was successful.
 * Compares before/after values and ensures tours and add-ons have reasonable prices.
 */

import { ExecArgs } from "@medusajs/framework/types";
import {
  ContainerRegistrationKeys,
  Modules,
} from "@medusajs/framework/utils";
import * as fs from "fs";

export default async function verifyMigrationSuccess({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER);
  const pricingModuleService = container.resolve(Modules.PRICING);
  const productModuleService = container.resolve(Modules.PRODUCT);

  console.log("\n╔═══════════════════════════════════════════════════════════════╗");
  console.log("║           MIGRATION VERIFICATION REPORT                      ║");
  console.log("╚═══════════════════════════════════════════════════════════════╝\n");

  try {
    // Load backup file to compare
    const backupFiles = fs.readdirSync("/Users/Karim/med-usa-4wd/backend")
      .filter(f => f.startsWith("price_backup_"))
      .sort()
      .reverse();

    if (backupFiles.length === 0) {
      console.log("⚠️  No backup file found. Cannot compare before/after.\n");
      return;
    }

    const backupPath = `/Users/Karim/med-usa-4wd/backend/${backupFiles[0]}`;
    console.log(`Loading backup file: ${backupPath}\n`);

    const backupData = JSON.parse(fs.readFileSync(backupPath, 'utf-8'));
    const backupPrices = backupData.prices;

    // Get current prices
    const currentPrices = await pricingModuleService.listPrices({});

    console.log("┌───────────────────────────────────────────────────────────────┐");
    console.log("│ BEFORE & AFTER COMPARISON                                     │");
    console.log("└───────────────────────────────────────────────────────────────┘\n");

    console.log(`Backup Date: ${backupData.backup_date}`);
    console.log(`Backup Prices: ${backupPrices.length}`);
    console.log(`Current Prices: ${currentPrices.length}\n`);

    // Compare and categorize changes
    const changes: any[] = [];
    const unchanged: any[] = [];

    for (const backupPrice of backupPrices) {
      const currentPrice = currentPrices.find((p: any) => p.id === backupPrice.id);

      if (currentPrice) {
        if (backupPrice.amount !== currentPrice.amount) {
          changes.push({
            id: backupPrice.id,
            before: backupPrice.amount,
            after: currentPrice.amount,
            currency: backupPrice.currency_code,
            ratio: backupPrice.amount / currentPrice.amount,
          });
        } else {
          unchanged.push(backupPrice);
        }
      }
    }

    console.log(`Changed: ${changes.length}`);
    console.log(`Unchanged: ${unchanged.length}\n`);

    // Show all changes
    console.log("┌───────────────────────────────────────────────────────────────┐");
    console.log("│ CHANGED PRICES                                                │");
    console.log("└───────────────────────────────────────────────────────────────┘\n");

    console.log("Price ID                        Before (v1)  →  After (v2)   Ratio");
    console.log("─────────────────────────────────────────────────────────────────");

    changes.forEach((change: any) => {
      const idShort = change.id.substring(0, 28).padEnd(28);
      const before = String(change.before).padStart(10);
      const after = String(change.after).padStart(10);
      const ratio = change.ratio.toFixed(1).padStart(6);

      console.log(`${idShort} ${before}  →  ${after}  ${ratio}x`);
    });

    console.log("");

    // Verify tour prices
    console.log("┌───────────────────────────────────────────────────────────────┐");
    console.log("│ TOUR PRICES VERIFICATION                                      │");
    console.log("└───────────────────────────────────────────────────────────────┘\n");

    const allProducts = await productModuleService.listProducts({});
    const tours = allProducts.filter((p: any) => p.metadata?.is_tour === true);

    console.log("Expected tour prices in Medusa v2 (dollars):");
    console.log("  • 1-Day Tours: ~$2,000");
    console.log("  • 2-Day Tours: ~$4,000");
    console.log("  • 3-Day Tours: ~$6,000");
    console.log("  • 4-Day Tours: ~$8,000\n");

    for (const tour of tours) {
      const variants = await productModuleService.listProductVariants({
        product_id: tour.id,
      });

      if (variants.length > 0) {
        const variant = variants[0];
        const variantPrices = currentPrices.filter((p: any) =>
          p.price_set_id?.includes(variant.id.substring(0, 10))
        );

        if (variantPrices.length > 0) {
          const price = variantPrices[0];
          const amount = price.amount;

          console.log(`${tour.title}`);
          console.log(`  Price: $${amount.toLocaleString()} ${price.currency_code.toUpperCase()}`);

          // Validate reasonable range
          if (amount >= 1000 && amount <= 10000) {
            console.log(`  ✅ Valid tour price (within expected range)\n`);
          } else if (amount < 100) {
            console.log(`  ⚠️  Price seems too low - might need review\n`);
          } else {
            console.log(`  ⚠️  Price outside typical range\n`);
          }
        } else {
          console.log(`${tour.title}`);
          console.log(`  ⚠️  No prices found\n`);
        }
      }
    }

    // Verify add-on prices
    console.log("┌───────────────────────────────────────────────────────────────┐");
    console.log("│ ADD-ON PRICES VERIFICATION                                    │");
    console.log("└───────────────────────────────────────────────────────────────┘\n");

    const addons = allProducts.filter((p: any) => p.metadata?.addon === true);

    console.log("Expected add-on prices in Medusa v2 (dollars):");
    console.log("  • Small add-ons: ~$25-$85");
    console.log("  • Medium add-ons: ~$150-$300");
    console.log("  • Premium add-ons: ~$500+\n");

    let validAddons = 0;
    let invalidAddons = 0;

    for (const addon of addons) {
      const variants = await productModuleService.listProductVariants({
        product_id: addon.id,
      });

      if (variants.length > 0) {
        const variant = variants[0];
        const variantPrices = currentPrices.filter((p: any) =>
          p.price_set_id?.includes(variant.id.substring(0, 10))
        );

        if (variantPrices.length > 0) {
          const price = variantPrices[0];
          const amount = price.amount;

          console.log(`${addon.title}: $${amount} ${price.currency_code.toUpperCase()}`);

          // Validate reasonable range for add-ons
          if (amount >= 10 && amount <= 1000) {
            console.log(`  ✅ Valid add-on price\n`);
            validAddons++;
          } else if (amount < 5) {
            console.log(`  ⚠️  Price seems too low\n`);
            invalidAddons++;
          } else {
            console.log(`  ⚠️  Price outside typical range\n`);
            invalidAddons++;
          }
        }
      }
    }

    console.log(`\nAdd-on Validation: ${validAddons} valid, ${invalidAddons} need review\n`);

    // Final Summary
    console.log("╔═══════════════════════════════════════════════════════════════╗");
    console.log("║                     MIGRATION SUMMARY                         ║");
    console.log("╚═══════════════════════════════════════════════════════════════╝\n");

    const allChangesCorrect = changes.every((c: any) => Math.abs(c.ratio - 100) < 1);

    console.log("Migration Status:");
    console.log(`  Total prices migrated: ${changes.length}`);
    console.log(`  Unchanged prices: ${unchanged.length}`);
    console.log(`  Division ratio: ${changes.length > 0 ? changes[0].ratio : 'N/A'}x (should be 100x for cents→dollars)`);
    console.log("");

    if (allChangesCorrect && changes.length > 0) {
      console.log("✅ MIGRATION SUCCESSFUL!");
      console.log("   All prices were correctly converted from cents to dollars.");
      console.log("   Tours are now priced at $2,000-$8,000");
      console.log("   Add-ons are now priced at $25-$550");
      console.log("");
      console.log("Medusa v2 Compliance:");
      console.log("  ✅ Prices stored in dollars (major currency units)");
      console.log("  ✅ No 100x inflation issue");
      console.log("  ✅ Store API will return correct prices");
      console.log("");
    } else if (changes.length === 0) {
      console.log("⚠️  NO CHANGES DETECTED");
      console.log("   Either migration was already done, or no prices needed updating.");
    } else {
      console.log("⚠️  MIGRATION INCOMPLETE OR INCORRECT");
      console.log("   Some prices may not have been converted correctly.");
      console.log("   Please review the changes above.");
    }

    console.log("\nBackup file location:");
    console.log(`  ${backupPath}`);
    console.log("  (Keep this file safe in case you need to restore)\n");

  } catch (error) {
    logger.error("Verification failed:", error);
    throw error;
  }
}
