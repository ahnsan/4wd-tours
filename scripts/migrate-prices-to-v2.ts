#!/usr/bin/env tsx
/**
 * Migrate Prices to Medusa v2 Script
 *
 * Converts all prices from cents (Medusa v1) to dollars (Medusa v2).
 * This script:
 * 1. Queries all prices in the database
 * 2. Identifies prices in cents format (amount >= 1000)
 * 3. Divides by 100 to convert to dollars
 * 4. Updates the price table with new values
 * 5. Logs all changes for verification
 *
 * IMPORTANT: Run backup script first!
 *   npx medusa exec ./scripts/backup-prices.ts
 */

import { ExecArgs } from "@medusajs/framework/types";
import {
  ContainerRegistrationKeys,
  Modules,
} from "@medusajs/framework/utils";

export default async function migratePricesToV2({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER);
  const pricingModuleService = container.resolve(Modules.PRICING);

  console.log("\n╔═══════════════════════════════════════════════════════════════╗");
  console.log("║        PRICE MIGRATION: Medusa v1 (cents) → v2 (dollars)     ║");
  console.log("╚═══════════════════════════════════════════════════════════════╝\n");

  console.log("⚠️  IMPORTANT: Make sure you have run the backup script first!\n");
  console.log("Waiting 3 seconds before starting migration...\n");
  await new Promise(resolve => setTimeout(resolve, 3000));

  try {
    // Get all prices
    console.log("Step 1: Fetching all prices from database...");
    const allPrices = await pricingModuleService.listPrices({});
    console.log(`Found ${allPrices.length} prices\n`);

    if (allPrices.length === 0) {
      console.log("⚠️  No prices found. Nothing to migrate.\n");
      return;
    }

    // Analyze prices
    console.log("Step 2: Analyzing price format...");
    const pricesToMigrate: any[] = [];
    const alreadyMigrated: any[] = [];
    const unusual: any[] = [];

    allPrices.forEach((price: any) => {
      const amount = price.amount;

      if (amount >= 1000) {
        // Likely in cents (Medusa v1)
        pricesToMigrate.push(price);
      } else if (amount >= 10 && amount < 1000) {
        // Likely already in dollars (Medusa v2)
        alreadyMigrated.push(price);
      } else {
        // Unusual value
        unusual.push(price);
      }
    });

    console.log("\nAnalysis Results:");
    console.log(`  Total Prices: ${allPrices.length}`);
    console.log(`  • Need Migration (cents): ${pricesToMigrate.length}`);
    console.log(`  • Already Migrated (dollars): ${alreadyMigrated.length}`);
    console.log(`  • Unusual Values: ${unusual.length}\n`);

    if (pricesToMigrate.length === 0) {
      console.log("✅ All prices are already in dollar format (Medusa v2).");
      console.log("   No migration needed.\n");
      return;
    }

    // Show sample of prices to migrate
    console.log("Sample of prices to migrate:");
    const sampleSize = Math.min(10, pricesToMigrate.length);
    for (let i = 0; i < sampleSize; i++) {
      const price = pricesToMigrate[i];
      const oldAmount = price.amount;
      const newAmount = Math.round(oldAmount / 100);

      console.log(`  ${i + 1}. ${price.id}`);
      console.log(`     Current: ${oldAmount} cents → New: ${newAmount} dollars`);
    }

    if (pricesToMigrate.length > sampleSize) {
      console.log(`  ... and ${pricesToMigrate.length - sampleSize} more\n`);
    }

    // Confirm migration
    console.log("\nStep 3: Starting migration...");
    console.log(`Migrating ${pricesToMigrate.length} prices from cents to dollars\n`);

    let successCount = 0;
    let errorCount = 0;
    const migrationLog: any[] = [];

    for (const price of pricesToMigrate) {
      const oldAmount = price.amount;
      const newAmount = Math.round(oldAmount / 100);

      try {
        // Update the price
        await pricingModuleService.updatePrices({
          id: price.id,
          amount: newAmount,
        });

        successCount++;

        migrationLog.push({
          price_id: price.id,
          price_set_id: price.price_set_id,
          currency_code: price.currency_code,
          old_amount: oldAmount,
          new_amount: newAmount,
          status: 'success',
        });

        // Log progress every 10 prices
        if (successCount % 10 === 0) {
          console.log(`  ✓ Migrated ${successCount}/${pricesToMigrate.length} prices...`);
        }

      } catch (error: any) {
        errorCount++;
        logger.error(`Failed to update price ${price.id}:`, error);

        migrationLog.push({
          price_id: price.id,
          price_set_id: price.price_set_id,
          currency_code: price.currency_code,
          old_amount: oldAmount,
          new_amount: newAmount,
          status: 'error',
          error: error.message,
        });
      }
    }

    // Migration complete
    console.log("\n╔═══════════════════════════════════════════════════════════════╗");
    console.log("║                   MIGRATION COMPLETE                          ║");
    console.log("╚═══════════════════════════════════════════════════════════════╝\n");

    console.log("Migration Results:");
    console.log(`  ✅ Successfully migrated: ${successCount} prices`);
    console.log(`  ❌ Failed: ${errorCount} prices`);
    console.log(`  📊 Total processed: ${pricesToMigrate.length} prices\n`);

    // Show migration log
    console.log("Detailed Migration Log:");
    console.log("┌─────────────────────────────────────────────────────────────────┐");
    console.log("│ Price ID                  │ Old (cents) │ New (dollars) │ Status│");
    console.log("├─────────────────────────────────────────────────────────────────┤");

    migrationLog.forEach((log: any) => {
      const priceId = log.price_id.substring(0, 25).padEnd(25);
      const oldAmt = String(log.old_amount).padEnd(11);
      const newAmt = String(log.new_amount).padEnd(13);
      const status = log.status === 'success' ? '✅' : '❌';

      console.log(`│ ${priceId} │ ${oldAmt} │ ${newAmt} │ ${status}    │`);
    });

    console.log("└─────────────────────────────────────────────────────────────────┘\n");

    if (errorCount > 0) {
      console.log("⚠️  Some prices failed to migrate. Please check the log above.\n");
    }

    console.log("Next steps:");
    console.log("  1. Verify prices: npx medusa exec ./scripts/list-all-prices-direct.ts");
    console.log("  2. Test storefront to ensure prices display correctly");
    console.log("  3. If needed, restore from backup: check backend/ directory\n");

  } catch (error) {
    logger.error("Migration failed:", error);
    throw error;
  }
}
