#!/usr/bin/env tsx
/**
 * List All Prices Direct
 *
 * Directly query all prices in the pricing module to see what we have.
 */

import { ExecArgs } from "@medusajs/framework/types";
import {
  ContainerRegistrationKeys,
  Modules,
} from "@medusajs/framework/utils";

export default async function listAllPricesDirect({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER);
  const pricingModuleService = container.resolve(Modules.PRICING);
  const productModuleService = container.resolve(Modules.PRODUCT);

  console.log("\n╔═══════════════════════════════════════════════════════════════╗");
  console.log("║              DIRECT PRICE TABLE QUERY                         ║");
  console.log("╚═══════════════════════════════════════════════════════════════╝\n");

  try {
    // Get ALL prices
    console.log("Querying all prices from pricing module...\n");
    const allPrices = await pricingModuleService.listPrices({});

    console.log(`Total Prices Found: ${allPrices.length}\n`);

    if (allPrices.length === 0) {
      console.log("⚠️  NO PRICES FOUND IN DATABASE!");
      console.log("   This indicates that prices have not been set for any products.");
      console.log("   You need to run a price seeding script first.\n");
      return;
    }

    console.log("┌───────────────────────────────────────────────────────────────┐");
    console.log("│ ALL PRICES IN DATABASE                                        │");
    console.log("└───────────────────────────────────────────────────────────────┘\n");

    // Group prices by currency
    const pricesByCurrency: Record<string, any[]> = {};

    allPrices.forEach((price: any) => {
      const currency = price.currency_code || 'UNKNOWN';
      if (!pricesByCurrency[currency]) {
        pricesByCurrency[currency] = [];
      }
      pricesByCurrency[currency].push(price);
    });

    for (const [currency, prices] of Object.entries(pricesByCurrency)) {
      console.log(`\n💰 ${currency} Prices (${prices.length} total):\n`);

      prices.forEach((price: any, idx: number) => {
        const amountRaw = price.amount;
        const amountInDollars = amountRaw / 100;

        console.log(`${idx + 1}. Price ID: ${price.id}`);
        console.log(`   Price Set ID: ${price.price_set_id || 'N/A'}`);
        console.log(`   Amount (raw): ${amountRaw}`);
        console.log(`   If cents → dollars: $${amountInDollars.toFixed(2)}`);
        console.log(`   If already dollars: $${amountRaw.toFixed(2)}`);

        // Determine format
        if (amountRaw >= 1000) {
          console.log(`   ⚠️  LIKELY IN CENTS (Medusa v1 format) - Should be $${amountInDollars.toFixed(2)}`);
        } else if (amountRaw >= 10 && amountRaw < 1000) {
          console.log(`   ✅ LIKELY IN DOLLARS (Medusa v2 format)`);
        } else {
          console.log(`   ⚠️  UNUSUAL VALUE`);
        }

        console.log(`   Min Quantity: ${price.min_quantity || 'N/A'}`);
        console.log(`   Max Quantity: ${price.max_quantity || 'N/A'}`);
        console.log(`   Rules Count: ${price.rules_count || 0}`);
        console.log("");
      });
    }

    // Get all price sets
    console.log("\n┌───────────────────────────────────────────────────────────────┐");
    console.log("│ ALL PRICE SETS                                                │");
    console.log("└───────────────────────────────────────────────────────────────┘\n");

    const priceSets = await pricingModuleService.listPriceSets({});
    console.log(`Total Price Sets: ${priceSets.length}\n`);

    for (const priceSet of priceSets) {
      console.log(`Price Set: ${priceSet.id}`);

      const prices = await pricingModuleService.listPrices({
        price_set_id: priceSet.id,
      });

      if (prices.length > 0) {
        prices.forEach((price: any) => {
          console.log(`  • ${price.amount} ${price.currency_code} (Price ID: ${price.id})`);
        });
      } else {
        console.log(`  (No prices)`);
      }
      console.log("");
    }

    // Try to match prices to products
    console.log("\n┌───────────────────────────────────────────────────────────────┐");
    console.log("│ MATCHING PRICES TO PRODUCTS                                   │");
    console.log("└───────────────────────────────────────────────────────────────┘\n");

    const allProducts = await productModuleService.listProducts({});
    console.log(`Total Products: ${allProducts.length}\n`);

    for (const product of allProducts) {
      const variants = await productModuleService.listProductVariants({
        product_id: product.id,
      });

      console.log(`📦 ${product.title} (${product.handle})`);
      console.log(`   Product ID: ${product.id}`);
      console.log(`   Variants: ${variants.length}`);

      if (variants.length > 0) {
        for (const variant of variants) {
          console.log(`\n   Variant: ${variant.title || 'Default'} (${variant.id})`);

          // Try to find prices for this variant by checking all prices
          const matchingPrices = allPrices.filter((p: any) => {
            // Try multiple matching strategies
            return (
              p.price_set_id?.includes(variant.id) ||
              p.price_set_id?.includes(variant.id.substring(0, 10)) ||
              p.variant_id === variant.id
            );
          });

          if (matchingPrices.length > 0) {
            matchingPrices.forEach((price: any) => {
              console.log(`      💰 ${price.amount} ${price.currency_code} (ID: ${price.id})`);
            });
          } else {
            console.log(`      ⚠️  No matching prices found`);
          }
        }
      }
      console.log("");
    }

    // Summary
    console.log("╔═══════════════════════════════════════════════════════════════╗");
    console.log("║                         SUMMARY                               ║");
    console.log("╚═══════════════════════════════════════════════════════════════╝\n");

    let centsCount = 0;
    let dollarsCount = 0;
    let unusualCount = 0;

    allPrices.forEach((price: any) => {
      const amount = price.amount;
      if (amount >= 1000) {
        centsCount++;
      } else if (amount >= 10 && amount < 1000) {
        dollarsCount++;
      } else {
        unusualCount++;
      }
    });

    console.log("Price Format Statistics:");
    console.log(`  Total prices: ${allPrices.length}`);
    console.log(`  • Likely CENTS (v1): ${centsCount}`);
    console.log(`  • Likely DOLLARS (v2): ${dollarsCount}`);
    console.log(`  • Unusual values: ${unusualCount}`);
    console.log("");

    if (centsCount > 0) {
      console.log("⚠️  MIGRATION NEEDED!");
      console.log(`   Found ${centsCount} price(s) in cents format (Medusa v1).`);
      console.log("   Medusa v2 expects prices in dollars.\n");
    } else if (dollarsCount > 0) {
      console.log("✅ Prices appear to be in correct format (dollars).\n");
    }

  } catch (error) {
    logger.error("Direct price query failed:", error);
    throw error;
  }
}
