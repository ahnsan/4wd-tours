#!/usr/bin/env tsx
/**
 * Backup Prices Script
 *
 * Creates a JSON backup of all prices before migration.
 * Backup file: /Users/Karim/med-usa-4wd/backend/price_backup_[timestamp].json
 */

import { ExecArgs } from "@medusajs/framework/types";
import {
  ContainerRegistrationKeys,
  Modules,
} from "@medusajs/framework/utils";
import * as fs from "fs";
import * as path from "path";

export default async function backupPrices({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER);
  const pricingModuleService = container.resolve(Modules.PRICING);

  console.log("\n╔═══════════════════════════════════════════════════════════════╗");
  console.log("║                   PRICE BACKUP SCRIPT                         ║");
  console.log("╚═══════════════════════════════════════════════════════════════╝\n");

  try {
    // Get all prices
    console.log("Fetching all prices from database...");
    const allPrices = await pricingModuleService.listPrices({});
    console.log(`Found ${allPrices.length} prices to backup\n`);

    if (allPrices.length === 0) {
      console.log("⚠️  No prices found. Nothing to backup.\n");
      return;
    }

    // Create backup directory if it doesn't exist
    const backupDir = "/Users/Karim/med-usa-4wd/backend";
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
      console.log(`Created backup directory: ${backupDir}\n`);
    }

    // Create backup filename with timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
    const timeStr = new Date().toTimeString().split(' ')[0].replace(/:/g, '-');
    const backupFilename = `price_backup_${timestamp}_${timeStr}.json`;
    const backupPath = path.join(backupDir, backupFilename);

    // Prepare backup data
    const backupData = {
      backup_date: new Date().toISOString(),
      total_prices: allPrices.length,
      prices: allPrices.map((price: any) => ({
        id: price.id,
        price_set_id: price.price_set_id,
        amount: price.amount,
        currency_code: price.currency_code,
        min_quantity: price.min_quantity,
        max_quantity: price.max_quantity,
        rules_count: price.rules_count,
      })),
    };

    // Write backup to file
    console.log(`Writing backup to: ${backupPath}`);
    fs.writeFileSync(backupPath, JSON.stringify(backupData, null, 2), 'utf-8');

    console.log("\n✅ Backup completed successfully!\n");
    console.log("Backup Details:");
    console.log(`  File: ${backupPath}`);
    console.log(`  Total Prices: ${allPrices.length}`);
    console.log(`  Backup Date: ${backupData.backup_date}`);
    console.log(`  File Size: ${(fs.statSync(backupPath).size / 1024).toFixed(2)} KB\n`);

    // Show sample of backed up prices
    console.log("Sample of backed up prices:");
    const sampleSize = Math.min(5, allPrices.length);
    for (let i = 0; i < sampleSize; i++) {
      const price = allPrices[i];
      console.log(`  ${i + 1}. ID: ${price.id} | Amount: ${price.amount} ${price.currency_code}`);
    }

    if (allPrices.length > sampleSize) {
      console.log(`  ... and ${allPrices.length - sampleSize} more\n`);
    }

    console.log("Next step: Run migration script");
    console.log("  npx medusa exec ./scripts/migrate-prices-to-v2.ts\n");

  } catch (error) {
    logger.error("Backup failed:", error);
    throw error;
  }
}
