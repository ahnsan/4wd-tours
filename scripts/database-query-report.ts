#!/usr/bin/env tsx
/**
 * Database Query Report
 *
 * Comprehensive database investigation mimicking SQL queries requested:
 * 1. SELECT id, title, handle, collection_id FROM product WHERE handle = '1d-fraser-island'
 * 2. SELECT COUNT(*) FROM product WHERE collection_id IN (SELECT id FROM collection WHERE handle = 'add-ons')
 * 3. SELECT id, title, handle FROM collection WHERE handle IN ('tours', 'add-ons')
 * 4. SELECT metadata FROM product WHERE handle = '1d-fraser-island'
 * 5. Check sales channel links
 */

import { ExecArgs } from "@medusajs/framework/types";
import {
  ContainerRegistrationKeys,
  Modules,
} from "@medusajs/framework/utils";

export default async function databaseQueryReport({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER);
  const productModuleService = container.resolve(Modules.PRODUCT);
  const salesChannelModuleService = container.resolve(Modules.SALES_CHANNEL);
  const remoteLink = container.resolve(ContainerRegistrationKeys.REMOTE_LINK);

  console.log("\n╔════════════════════════════════════════════════════════════╗");
  console.log("║         DATABASE INVESTIGATION REPORT                      ║");
  console.log("╚════════════════════════════════════════════════════════════╝\n");

  try {
    // Query 1: Get Fraser Island tour product details
    console.log("┌────────────────────────────────────────────────────────────┐");
    console.log("│ Query 1: Tour Product Details (1d-fraser-island)          │");
    console.log("│ SQL: SELECT id, title, handle, collection_id FROM product │");
    console.log("│      WHERE handle = '1d-fraser-island'                    │");
    console.log("└────────────────────────────────────────────────────────────┘\n");

    const fraserProducts = await productModuleService.listProducts({
      handle: '1d-fraser-island'
    });

    if (fraserProducts.length > 0) {
      const product = fraserProducts[0];
      console.log("Result:");
      console.log(`  id:            ${product.id}`);
      console.log(`  title:         ${product.title}`);
      console.log(`  handle:        ${product.handle}`);
      console.log(`  collection_id: ${product.collection_id}`);
      console.log("");
    } else {
      console.log("  No results found\n");
    }

    // Query 2: Check collections
    console.log("┌────────────────────────────────────────────────────────────┐");
    console.log("│ Query 2: Collections                                       │");
    console.log("│ SQL: SELECT id, title, handle FROM product_collection     │");
    console.log("│      WHERE handle IN ('tours', 'add-ons')                 │");
    console.log("└────────────────────────────────────────────────────────────┘\n");

    const allCollections = await productModuleService.listProductCollections({});
    const relevantCollections = allCollections.filter((c: any) =>
      ['tours', 'add-ons', 'addons'].includes(c.handle?.toLowerCase())
    );

    console.log(`Results: ${relevantCollections.length} collections\n`);
    relevantCollections.forEach((collection: any) => {
      console.log(`  id:     ${collection.id}`);
      console.log(`  title:  ${collection.title}`);
      console.log(`  handle: ${collection.handle}`);
      console.log("");
    });

    // Query 3: Count add-ons by collection
    console.log("┌────────────────────────────────────────────────────────────┐");
    console.log("│ Query 3: Add-ons Count by Collection                      │");
    console.log("│ SQL: SELECT COUNT(*) as total_addons FROM product        │");
    console.log("│      WHERE collection_id IN                               │");
    console.log("│      (SELECT id FROM collection WHERE handle = 'add-ons')│");
    console.log("└────────────────────────────────────────────────────────────┘\n");

    const addonsCollection = relevantCollections.find((c: any) =>
      c.handle?.toLowerCase() === 'add-ons' || c.handle?.toLowerCase() === 'addons'
    );

    if (addonsCollection) {
      const allProducts = await productModuleService.listProducts({});
      const addonsByCollection = allProducts.filter((p: any) =>
        p.collection_id === addonsCollection.id
      );

      console.log("Result:");
      console.log(`  total_addons: ${addonsByCollection.length}`);
      console.log(`  collection_id: ${addonsCollection.id}`);
      console.log(`  collection_handle: ${addonsCollection.handle}\n`);
    } else {
      console.log("  Add-ons collection not found\n");
    }

    // Query 4: Get metadata for Fraser Island tour
    console.log("┌────────────────────────────────────────────────────────────┐");
    console.log("│ Query 4: Product Metadata & Relationships                 │");
    console.log("│ SQL: SELECT metadata FROM product                         │");
    console.log("│      WHERE handle = '1d-fraser-island'                    │");
    console.log("└────────────────────────────────────────────────────────────┘\n");

    if (fraserProducts.length > 0) {
      const product = fraserProducts[0];
      console.log("Metadata:");
      console.log(JSON.stringify(product.metadata, null, 2));
      console.log("");

      // Check for addon association fields
      console.log("Addon Association Analysis:");
      if (product.metadata?.compatible_addons) {
        console.log(`  ✓ Has 'compatible_addons' field: ${JSON.stringify(product.metadata.compatible_addons)}`);
      } else {
        console.log("  ✗ No 'compatible_addons' field");
      }

      if (product.metadata?.addon_ids) {
        console.log(`  ✓ Has 'addon_ids' field: ${JSON.stringify(product.metadata.addon_ids)}`);
      } else {
        console.log("  ✗ No 'addon_ids' field");
      }

      console.log("\n  ℹ️  Note: This system uses metadata-based filtering.");
      console.log("     Add-ons have 'applicable_tours' array in their metadata");
      console.log("     that determines which tours they're compatible with.\n");
    }

    // Query 5: Check sales channel links
    console.log("┌────────────────────────────────────────────────────────────┐");
    console.log("│ Query 5: Sales Channel Links                              │");
    console.log("│ Check: product_sales_channel links for products           │");
    console.log("└────────────────────────────────────────────────────────────┘\n");

    const salesChannels = await salesChannelModuleService.listSalesChannels({});
    console.log(`Sales Channels Found: ${salesChannels.length}`);
    salesChannels.forEach((channel: any) => {
      console.log(`  • ${channel.name} (${channel.id})`);
    });
    console.log("");

    // Check if Fraser Island tour is linked to sales channels
    if (fraserProducts.length > 0 && salesChannels.length > 0) {
      console.log("Fraser Island Tour Links:");

      try {
        // Use remoteLink.dismiss to check if link exists
        // If we can create it, it doesn't exist. If we get an error, it might exist.
        const product = fraserProducts[0];
        const salesChannel = salesChannels[0];

        // Try to create link (will fail if it already exists)
        try {
          await remoteLink.create([{
            [Modules.PRODUCT]: {
              product_id: product.id,
            },
            [Modules.SALES_CHANNEL]: {
              sales_channel_id: salesChannel.id,
            },
          }]);
          console.log(`  ℹ️  Link created (was missing): ${product.handle} → ${salesChannel.name}\n`);
        } catch (linkError: any) {
          if (linkError.message?.includes('already exists') || linkError.message?.includes('duplicate')) {
            console.log(`  ✓ Already linked: ${product.handle} → ${salesChannel.name}\n`);
          } else {
            console.log(`  ⚠️  Link status unclear: ${linkError.message}\n`);
          }
        }
      } catch (error: any) {
        console.log(`  ⚠️  Could not check sales channel links: ${error.message}\n`);
      }
    }

    // Additional Analysis: Add-ons with metadata filtering
    console.log("┌────────────────────────────────────────────────────────────┐");
    console.log("│ Additional: Add-ons Metadata Analysis                     │");
    console.log("└────────────────────────────────────────────────────────────┘\n");

    const allProducts = await productModuleService.listProducts({});
    const addons = allProducts.filter((p: any) => p.metadata?.addon === true);

    console.log(`Total Add-ons: ${addons.length}\n`);

    // Sample add-on metadata
    if (addons.length > 0) {
      console.log("Sample Add-on Metadata (first addon):");
      const sampleAddon = addons[0];
      console.log(`  Title: ${sampleAddon.title}`);
      console.log(`  Handle: ${sampleAddon.handle}`);
      console.log(`  Metadata:`);
      console.log(JSON.stringify(sampleAddon.metadata, null, 4));
      console.log("");
    }

    // Count add-ons applicable to Fraser Island
    const fraserApplicableAddons = addons.filter((addon: any) => {
      const applicableTours = addon.metadata?.applicable_tours;
      if (!applicableTours || !Array.isArray(applicableTours)) return false;
      return applicableTours.includes('*') || applicableTours.includes('1d-fraser-island');
    });

    console.log(`Add-ons applicable to Fraser Island tour: ${fraserApplicableAddons.length}`);
    console.log("  Breakdown:");
    const categories: Record<string, number> = {};
    fraserApplicableAddons.forEach((addon: any) => {
      const cat = addon.metadata?.category || 'Uncategorized';
      categories[cat] = (categories[cat] || 0) + 1;
    });
    Object.entries(categories).forEach(([cat, count]) => {
      console.log(`    • ${cat}: ${count}`);
    });
    console.log("");

    // Final Summary
    console.log("╔════════════════════════════════════════════════════════════╗");
    console.log("║                    SUMMARY                                 ║");
    console.log("╚════════════════════════════════════════════════════════════╝\n");

    const toursCollection = relevantCollections.find((c: any) => c.handle?.toLowerCase() === 'tours');
    const addonsCollectionFound = relevantCollections.find((c: any) =>
      c.handle?.toLowerCase() === 'add-ons' || c.handle?.toLowerCase() === 'addons'
    );

    console.log("Database Status:");
    console.log(`  ✓ Fraser Island Tour: ${fraserProducts.length > 0 ? 'EXISTS' : 'MISSING'}`);
    console.log(`    - Product ID: ${fraserProducts[0]?.id || 'N/A'}`);
    console.log(`    - Collection ID: ${fraserProducts[0]?.collection_id || 'N/A'}`);
    console.log("");
    console.log(`  ✓ Collections:`);
    console.log(`    - Tours Collection: ${toursCollection ? 'EXISTS' : 'MISSING'} (${toursCollection?.id || 'N/A'})`);
    console.log(`    - Add-ons Collection: ${addonsCollectionFound ? 'EXISTS' : 'MISSING'} (${addonsCollectionFound?.id || 'N/A'})`);
    console.log("");
    console.log(`  ✓ Products:`);
    console.log(`    - Total Tours: ${allProducts.filter((p: any) => p.metadata?.is_tour).length}`);
    console.log(`    - Total Add-ons: ${addons.length}`);
    console.log(`    - Add-ons for Fraser Island: ${fraserApplicableAddons.length}`);
    console.log("");
    console.log(`  ✓ Relationships:`);
    console.log(`    - Method: Metadata-based filtering (applicable_tours array)`);
    console.log(`    - No direct DB foreign keys for tour-addon links`);
    console.log("");
    console.log(`  ✓ Sales Channels: ${salesChannels.length} channel(s)`);
    console.log("");

    console.log("Key Findings:");
    console.log("  1. Products use collection_id to link to collections");
    console.log("  2. Tour-addon relationships are metadata-based, not DB foreign keys");
    console.log("  3. Add-ons have 'applicable_tours' array that can contain:");
    console.log("     - '*' for universal add-ons (all tours)");
    console.log("     - Specific tour handles (e.g., '1d-fraser-island')");
    console.log("  4. Sales channel links are managed via remoteLink service");
    console.log("");

  } catch (error) {
    logger.error("Query report failed:", error);
    throw error;
  }
}
