#!/usr/bin/env tsx
/**
 * Analyze Current Prices Script
 *
 * This script analyzes the current price data in the database to determine
 * if prices are in cents (Medusa v1) or dollars (Medusa v2).
 *
 * Expected findings:
 * - Medusa v1 format: Tours ~200000 cents, Add-ons ~3000-8000 cents
 * - Medusa v2 format: Tours ~2000 dollars, Add-ons ~30-80 dollars
 */

import { ExecArgs } from "@medusajs/framework/types";
import {
  ContainerRegistrationKeys,
  Modules,
} from "@medusajs/framework/utils";

export default async function analyzeCurrentPrices({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER);
  const productModuleService = container.resolve(Modules.PRODUCT);
  const pricingModuleService = container.resolve(Modules.PRICING);

  console.log("\n╔═══════════════════════════════════════════════════════════════╗");
  console.log("║           PRICE FORMAT ANALYSIS - Medusa v1 vs v2            ║");
  console.log("╚═══════════════════════════════════════════════════════════════╝\n");

  try {
    // Get all products
    const allProducts = await productModuleService.listProducts({});

    // Separate tours and add-ons
    const tours = allProducts.filter((p: any) => p.metadata?.is_tour === true);
    const addons = allProducts.filter((p: any) => p.metadata?.addon === true);

    console.log("┌───────────────────────────────────────────────────────────────┐");
    console.log("│ Product Overview                                              │");
    console.log("└───────────────────────────────────────────────────────────────┘\n");
    console.log(`Total Products: ${allProducts.length}`);
    console.log(`  • Tours: ${tours.length}`);
    console.log(`  • Add-ons: ${addons.length}`);
    console.log(`  • Other: ${allProducts.length - tours.length - addons.length}\n`);

    // Analyze Tours Pricing
    console.log("┌───────────────────────────────────────────────────────────────┐");
    console.log("│ TOURS PRICING ANALYSIS                                        │");
    console.log("└───────────────────────────────────────────────────────────────┘\n");

    if (tours.length > 0) {
      console.log(`Analyzing ${tours.length} tour(s):\n`);

      for (const tour of tours) {
        console.log(`📍 ${tour.title}`);
        console.log(`   Handle: ${tour.handle}`);
        console.log(`   ID: ${tour.id}`);

        // Get variants for this product
        const variants = await productModuleService.listProductVariants({
          product_id: tour.id,
        });

        if (variants && variants.length > 0) {
          for (let idx = 0; idx < variants.length; idx++) {
            const variant = variants[idx];
            console.log(`\n   Variant ${idx + 1}: ${variant.title || 'Default'}`);
            console.log(`     Variant ID: ${variant.id}`);

            // Get all prices and filter for this variant
            const allPrices = await pricingModuleService.listPrices({});
            const variantPrices = allPrices.filter((p: any) =>
              p.price_set_id && p.price_set_id.includes(variant.id.substring(0, 10))
            );

            if (variantPrices.length > 0) {
              for (const price of variantPrices) {
                const amountInCents = price.amount;
                const amountInDollars = amountInCents / 100;

                console.log(`\n     💰 Price (${price.currency_code?.toUpperCase() || 'N/A'}):`);
                console.log(`        Price ID: ${price.id}`);
                console.log(`        Amount (raw): ${amountInCents}`);
                console.log(`        If cents → dollars: $${amountInDollars.toFixed(2)}`);
                console.log(`        If already dollars: $${amountInCents.toFixed(2)}`);

                // Determine format
                if (amountInCents >= 10000) {
                  console.log(`        ⚠️  LIKELY IN CENTS (Medusa v1 format)`);
                  console.log(`        ✅ Should be: $${amountInDollars.toFixed(2)}`);
                } else if (amountInCents < 10000 && amountInCents >= 100) {
                  console.log(`        ✅ LIKELY IN DOLLARS (Medusa v2 format)`);
                } else {
                  console.log(`        ⚠️  UNUSUAL VALUE - Please verify manually`);
                }
              }
            } else {
              console.log(`     ⚠️  No prices found for this variant`);
            }
          }
        } else {
          console.log(`   ⚠️  No variants found for this tour`);
        }
        console.log("\n" + "─".repeat(63) + "\n");
      }
    } else {
      console.log("⚠️  No tours found in database\n");
    }

    // Analyze Add-ons Pricing
    console.log("┌───────────────────────────────────────────────────────────────┐");
    console.log("│ ADD-ONS PRICING ANALYSIS                                      │");
    console.log("└───────────────────────────────────────────────────────────────┘\n");

    if (addons.length > 0) {
      console.log(`Analyzing ${addons.length} add-on(s):\n`);

      // Group by category
      const addonsByCategory: Record<string, any[]> = {};
      addons.forEach((addon: any) => {
        const category = addon.metadata?.category || 'Uncategorized';
        if (!addonsByCategory[category]) {
          addonsByCategory[category] = [];
        }
        addonsByCategory[category].push(addon);
      });

      for (const [category, categoryAddons] of Object.entries(addonsByCategory)) {
        console.log(`\n📦 ${category} (${categoryAddons.length} addon${categoryAddons.length > 1 ? 's' : ''}):\n`);

        for (const addon of categoryAddons) {
          console.log(`  • ${addon.title}`);
          console.log(`    Handle: ${addon.handle}`);
          console.log(`    ID: ${addon.id}`);

          // Get variants for this addon
          const variants = await productModuleService.listProductVariants({
            product_id: addon.id,
          });

          if (variants && variants.length > 0) {
            for (const variant of variants) {
              // Get all prices and filter for this variant
              const allPrices = await pricingModuleService.listPrices({});
              const variantPrices = allPrices.filter((p: any) =>
                p.price_set_id && p.price_set_id.includes(variant.id.substring(0, 10))
              );

              if (variantPrices.length > 0) {
                for (const price of variantPrices) {
                  const amountInCents = price.amount;
                  const amountInDollars = amountInCents / 100;

                  console.log(`\n    💰 Price (${price.currency_code?.toUpperCase() || 'N/A'}):`);
                  console.log(`       Price ID: ${price.id}`);
                  console.log(`       Amount (raw): ${amountInCents}`);
                  console.log(`       If cents → dollars: $${amountInDollars.toFixed(2)}`);
                  console.log(`       If already dollars: $${amountInCents.toFixed(2)}`);

                  // Determine format
                  if (amountInCents >= 1000) {
                    console.log(`       ⚠️  LIKELY IN CENTS (Medusa v1 format)`);
                    console.log(`       ✅ Should be: $${amountInDollars.toFixed(2)}`);
                  } else if (amountInCents < 1000 && amountInCents >= 10) {
                    console.log(`       ✅ LIKELY IN DOLLARS (Medusa v2 format)`);
                  } else {
                    console.log(`       ⚠️  UNUSUAL VALUE - Please verify manually`);
                  }
                }
              }
            }
          }
          console.log("");
        }
      }
    } else {
      console.log("⚠️  No add-ons found in database\n");
    }

    // Summary
    console.log("╔═══════════════════════════════════════════════════════════════╗");
    console.log("║                         SUMMARY                               ║");
    console.log("╚═══════════════════════════════════════════════════════════════╝\n");

    let totalPrices = 0;
    let centsFormatPrices = 0;
    let dollarsFormatPrices = 0;
    let unusualPrices = 0;

    // Count all prices
    for (const product of [...tours, ...addons]) {
      const variants = await productModuleService.listProductVariants({
        product_id: product.id,
      });

      for (const variant of variants) {
        const allPrices = await pricingModuleService.listPrices({});
        const variantPrices = allPrices.filter((p: any) =>
          p.price_set_id && p.price_set_id.includes(variant.id.substring(0, 10))
        );

        for (const price of variantPrices) {
          totalPrices++;
          const amount = price.amount;

          if (amount >= 1000) {
            centsFormatPrices++;
          } else if (amount >= 10 && amount < 1000) {
            dollarsFormatPrices++;
          } else {
            unusualPrices++;
          }
        }
      }
    }

    console.log("Price Format Analysis:");
    console.log(`  Total prices analyzed: ${totalPrices}`);
    console.log(`  • Likely in CENTS (v1 format): ${centsFormatPrices}`);
    console.log(`  • Likely in DOLLARS (v2 format): ${dollarsFormatPrices}`);
    console.log(`  • Unusual values: ${unusualPrices}`);
    console.log("");

    if (centsFormatPrices > 0) {
      console.log("⚠️  MIGRATION REQUIRED!");
      console.log("   Detected prices in cents (Medusa v1 format).");
      console.log("   Medusa v2 expects prices in dollars (major currency units).");
      console.log("   Run the migration script to convert prices: divide by 100");
      console.log("");
      console.log("   Next steps:");
      console.log("   1. Create backup: npx medusa exec ./scripts/backup-prices.ts");
      console.log("   2. Run migration: npx medusa exec ./scripts/migrate-prices-to-v2.ts");
      console.log("   3. Verify results: npx medusa exec ./scripts/analyze-current-prices.ts");
    } else if (dollarsFormatPrices > 0) {
      console.log("✅ PRICES ALREADY IN CORRECT FORMAT");
      console.log("   All prices appear to be in dollars (Medusa v2 format).");
      console.log("   No migration needed.");
    } else {
      console.log("⚠️  NO PRICES FOUND OR UNUSUAL VALUES");
      console.log("   Please check your database manually.");
    }
    console.log("");

  } catch (error) {
    logger.error("Price analysis failed:", error);
    throw error;
  }
}
