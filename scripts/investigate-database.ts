#!/usr/bin/env tsx
/**
 * Database Investigation Script
 *
 * Investigates tours and add-ons products and their relationships in the database.
 */

import { ExecArgs } from "@medusajs/framework/types";
import {
  ContainerRegistrationKeys,
  Modules,
} from "@medusajs/framework/utils";

export default async function investigateDatabase({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER);
  const productModuleService = container.resolve(Modules.PRODUCT);
  const salesChannelModuleService = container.resolve(Modules.SALES_CHANNEL);
  const remoteLink = container.resolve("remoteLink");

  console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("🔍 Database Investigation Report");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

  try {
    // 1. Check Tour Products
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("1️⃣  TOUR PRODUCTS");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

    // Get Fraser Island 1D tour specifically
    const fraserTour = await productModuleService.listProducts({
      handle: '1d-fraser-island'
    });

    if (fraserTour.length > 0) {
      const tour = fraserTour[0];
      console.log("✅ 1 Day Fraser Island Tour found:");
      console.log(`   ID: ${tour.id}`);
      console.log(`   Title: ${tour.title}`);
      console.log(`   Handle: ${tour.handle}`);
      console.log(`   Collection ID: ${tour.collection_id || 'N/A'}`);
      console.log(`   Collection: ${tour.collection?.title || 'N/A'}`);
      console.log(`   Metadata:`, JSON.stringify(tour.metadata, null, 2));
      console.log(`   Variants: ${tour.variants?.length || 0}`);
      if (tour.variants && tour.variants.length > 0) {
        tour.variants.forEach((variant: any, idx: number) => {
          console.log(`     Variant ${idx + 1}:`);
          console.log(`       ID: ${variant.id}`);
          console.log(`       Title: ${variant.title}`);
          console.log(`       Prices: ${variant.prices?.length || 0}`);
        });
      }
      console.log("");
    } else {
      console.log("❌ 1 Day Fraser Island Tour NOT found\n");
    }

    // Get all tours
    const allProducts = await productModuleService.listProducts({});
    const allTours = allProducts.filter((p: any) => p.metadata?.is_tour === true);

    console.log(`📊 Total Tours: ${allTours.length}`);
    allTours.forEach((tour: any) => {
      console.log(`   • ${tour.title} (${tour.handle})`);
      console.log(`     ID: ${tour.id}`);
      console.log(`     Collection: ${tour.collection?.title || 'N/A'} (${tour.collection_id})`);
    });
    console.log("");

    // 2. Check Add-ons Products
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("2️⃣  ADD-ONS PRODUCTS");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

    const allAddons = allProducts.filter((p: any) => p.metadata?.addon === true);

    console.log(`📊 Total Add-ons: ${allAddons.length}`);

    // Group by category
    const addonsByCategory: Record<string, any[]> = {};
    allAddons.forEach((addon: any) => {
      const category = addon.metadata?.category || 'Uncategorized';
      if (!addonsByCategory[category]) {
        addonsByCategory[category] = [];
      }
      addonsByCategory[category].push(addon);
    });

    Object.entries(addonsByCategory).forEach(([category, addons]) => {
      console.log(`\n   ${category} (${addons.length}):`);
      addons.forEach((addon: any) => {
        console.log(`      • ${addon.title} (${addon.handle})`);
        console.log(`        ID: ${addon.id}`);
        console.log(`        Collection: ${addon.collection?.title || 'N/A'} (${addon.collection_id})`);
        console.log(`        Applicable Tours: ${addon.metadata?.applicable_tours?.join(', ') || 'N/A'}`);
        console.log(`        Unit: ${addon.metadata?.unit || 'N/A'}`);
      });
    });
    console.log("");

    // 3. Check Collections
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("3️⃣  COLLECTIONS");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

    const allCollections = await productModuleService.listProductCollections({});

    console.log(`📊 Total Collections: ${allCollections.length}\n`);

    const relevantHandles = ['tours', 'add-ons', 'addons'];
    const relevantCollections = allCollections.filter((c: any) =>
      relevantHandles.includes(c.handle?.toLowerCase())
    );

    if (relevantCollections.length > 0) {
      relevantCollections.forEach((collection: any) => {
        console.log(`   ✅ ${collection.title}`);
        console.log(`      ID: ${collection.id}`);
        console.log(`      Handle: ${collection.handle}`);
        console.log(`      Products: ${collection.products?.length || 0}`);
        console.log(`      Metadata:`, JSON.stringify(collection.metadata, null, 2));
      });
    } else {
      console.log("   ⚠️  No 'tours' or 'add-ons' collections found!");
    }

    console.log("\n   All Collections:");
    allCollections.forEach((collection: any) => {
      console.log(`      • ${collection.title} (${collection.handle})`);
      console.log(`        ID: ${collection.id}`);
      console.log(`        Products: ${collection.products?.length || 0}`);
    });
    console.log("");

    // 4. Check Product Relationships/Metadata
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("4️⃣  METADATA & RELATIONSHIPS");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

    if (fraserTour.length > 0) {
      const tour = fraserTour[0];
      console.log("Fraser Island Tour Metadata:");
      console.log(JSON.stringify(tour.metadata, null, 2));
      console.log("");

      // Check if there are any fields for addon associations
      if (tour.metadata?.compatible_addons) {
        console.log("   ✅ Has compatible_addons field");
      } else if (tour.metadata?.addon_ids) {
        console.log("   ✅ Has addon_ids field");
      } else {
        console.log("   ℹ️  No direct addon association fields found");
        console.log("   ℹ️  Using metadata-based filtering (applicable_tours in add-ons)");
      }
      console.log("");
    }

    // 5. Check Sales Channel Links
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("5️⃣  SALES CHANNEL LINKS");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

    // Get all sales channels
    const salesChannels = await salesChannelModuleService.listSalesChannels({});
    console.log(`📊 Total Sales Channels: ${salesChannels.length}\n`);

    salesChannels.forEach((channel: any) => {
      console.log(`   • ${channel.name}`);
      console.log(`     ID: ${channel.id}`);
      console.log(`     Description: ${channel.description || 'N/A'}`);
    });
    console.log("");

    // Check product-sales channel links for Fraser Island tour
    if (fraserTour.length > 0 && salesChannels.length > 0) {
      const tour = fraserTour[0];

      try {
        // Get links for this product
        const productLinks = await (remoteLink as any).query({
          product: {
            fields: ["id"],
            filters: { id: [tour.id] }
          },
          sales_channel: {
            fields: ["id", "name"]
          }
        });

        console.log(`Fraser Island Tour Sales Channel Links:`);
        if (productLinks.length > 0) {
          productLinks.forEach((link: any) => {
            console.log(`   ✅ Linked to: ${link.sales_channel.name} (${link.sales_channel.id})`);
          });
        } else {
          console.log(`   ⚠️  Not linked to any sales channel!`);
        }
        console.log("");
      } catch (error) {
        console.log(`   ℹ️  Could not query product-sales channel links`);
        console.log("");
      }
    }

    // Check addon sales channel links
    if (allAddons.length > 0 && salesChannels.length > 0) {
      console.log(`Add-ons Sales Channel Links:`);

      try {
        const addonIds = allAddons.map((a: any) => a.id);
        const addonLinks = await (remoteLink as any).query({
          product: {
            fields: ["id", "title"],
            filters: { id: addonIds }
          },
          sales_channel: {
            fields: ["id", "name"]
          }
        });

        const linkedAddonIds = new Set(addonLinks.map((l: any) => l.product.id));
        const linkedCount = linkedAddonIds.size;
        const unlinkedCount = allAddons.length - linkedCount;

        console.log(`   ✅ Linked: ${linkedCount} add-ons`);
        console.log(`   ⚠️  Unlinked: ${unlinkedCount} add-ons`);

        if (unlinkedCount > 0) {
          console.log("\n   Unlinked add-ons:");
          allAddons.forEach((addon: any) => {
            if (!linkedAddonIds.has(addon.id)) {
              console.log(`      • ${addon.title} (${addon.handle})`);
            }
          });
        }
        console.log("");
      } catch (error) {
        console.log(`   ℹ️  Could not query add-on sales channel links`);
        console.log("");
      }
    }

    // Final Summary
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("📊 SUMMARY");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

    console.log(`Tours: ${allTours.length}`);
    console.log(`Add-ons: ${allAddons.length}`);
    console.log(`Collections: ${allCollections.length}`);
    console.log(`Sales Channels: ${salesChannels.length}`);
    console.log("");

    const hasToursCollection = allCollections.some((c: any) =>
      c.handle?.toLowerCase() === 'tours'
    );
    const hasAddonsCollection = allCollections.some((c: any) =>
      ['add-ons', 'addons'].includes(c.handle?.toLowerCase())
    );

    console.log("Status:");
    console.log(`   ${hasToursCollection ? '✅' : '❌'} Tours collection exists`);
    console.log(`   ${hasAddonsCollection ? '✅' : '❌'} Add-ons collection exists`);
    console.log(`   ${fraserTour.length > 0 ? '✅' : '❌'} Fraser Island tour exists`);
    console.log(`   ${allAddons.length > 0 ? '✅' : '❌'} Add-ons exist`);
    console.log("");

  } catch (error) {
    logger.error("Investigation failed:", error);
    throw error;
  }
}
