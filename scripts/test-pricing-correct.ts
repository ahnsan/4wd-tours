/**
 * Test Pricing with Correct Medusa v2 Methods
 *
 * This script demonstrates the CORRECT way to query product pricing in Medusa v2
 * using Query with remote links between Product and Pricing modules.
 *
 * Usage: pnpm medusa exec ./scripts/test-pricing-correct.ts
 */

import { ExecArgs } from "@medusajs/framework/types"
import { Modules, ContainerRegistrationKeys, QueryContext } from "@medusajs/framework/utils"

export default async function testPricingCorrect({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const query = container.resolve(ContainerRegistrationKeys.QUERY)

  logger.info("\n" + "=".repeat(70))
  logger.info("  MEDUSA V2 PRICING INVESTIGATION - CORRECT APPROACH")
  logger.info("=".repeat(70) + "\n")

  const testProductId = "prod_01K9H8KY10KSHDDY4TH6ZQYY99"

  try {
    // ==========================================================================
    // METHOD 1: Query with variants.prices (All prices)
    // ==========================================================================
    logger.info("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
    logger.info("METHOD 1: Retrieve All Variant Prices via Query")
    logger.info("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n")

    const { data: productsWithPrices } = await query.graph({
      entity: "product",
      fields: [
        "id",
        "title",
        "handle",
        "variants.*",
        "variants.prices.*",
      ],
      filters: {
        id: testProductId,
      },
    })

    logger.info(`Product: ${productsWithPrices[0]?.title || "Not found"}`)
    logger.info(`ID: ${productsWithPrices[0]?.id || "N/A"}`)
    logger.info(`Handle: ${productsWithPrices[0]?.handle || "N/A"}`)
    logger.info(`Variants found: ${productsWithPrices[0]?.variants?.length || 0}\n`)

    if (productsWithPrices[0]?.variants) {
      productsWithPrices[0].variants.forEach((variant: any, idx: number) => {
        logger.info(`  Variant ${idx + 1}: ${variant.title || "Default"}`)
        logger.info(`    ID: ${variant.id}`)

        if (variant.prices && variant.prices.length > 0) {
          logger.info(`    Prices found: ${variant.prices.length}`)
          variant.prices.forEach((price: any) => {
            logger.info(`      ├─ ${price.currency_code?.toUpperCase()}: ${price.amount} (Price ID: ${price.id})`)
            logger.info(`      │  Price Set: ${price.price_set_id}`)
            if (price.min_quantity) logger.info(`      │  Min Quantity: ${price.min_quantity}`)
            if (price.max_quantity) logger.info(`      │  Max Quantity: ${price.max_quantity}`)
          })
        } else {
          logger.info(`    ⚠️  NO PRICES FOUND`)
        }
        logger.info("")
      })
    }

    // ==========================================================================
    // METHOD 2: Query with calculated_price (Context-aware)
    // ==========================================================================
    logger.info("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
    logger.info("METHOD 2: Retrieve Calculated Prices with Query Context")
    logger.info("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n")

    const { data: productsWithCalculatedPrice } = await query.graph({
      entity: "product",
      fields: [
        "id",
        "title",
        "handle",
        "variants.*",
        "variants.calculated_price.*",
      ],
      filters: {
        id: testProductId,
      },
      context: {
        variants: {
          calculated_price: QueryContext({
            currency_code: "aud",
          }),
        },
      },
    })

    logger.info(`Product: ${productsWithCalculatedPrice[0]?.title || "Not found"}`)
    logger.info(`Query Context: currency_code = "aud"\n`)

    if (productsWithCalculatedPrice[0]?.variants) {
      productsWithCalculatedPrice[0].variants.forEach((variant: any, idx: number) => {
        logger.info(`  Variant ${idx + 1}: ${variant.title || "Default"}`)
        logger.info(`    ID: ${variant.id}`)

        if (variant.calculated_price) {
          logger.info(`    ✅ Calculated Price Found:`)
          logger.info(`      ├─ Amount: ${variant.calculated_price.calculated_amount}`)
          logger.info(`      ├─ Currency: ${variant.calculated_price.currency_code}`)
          logger.info(`      ├─ Original Amount: ${variant.calculated_price.original_amount || "N/A"}`)
          logger.info(`      ├─ Tax Inclusive: ${variant.calculated_price.is_calculated_price_tax_inclusive}`)
          logger.info(`      └─ Price List ID: ${variant.calculated_price.price_list_id || "None (default price)"}`)
        } else {
          logger.info(`    ⚠️  NO CALCULATED PRICE FOUND`)
        }
        logger.info("")
      })
    }

    // ==========================================================================
    // METHOD 3: Query price_set directly to understand the link
    // ==========================================================================
    logger.info("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
    logger.info("METHOD 3: Query Price Sets with Variant Link")
    logger.info("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n")

    try {
      const { data: priceSets } = await query.graph({
        entity: "price_set",
        fields: [
          "id",
          "prices.*",
          "variant.*",
        ],
      })

      logger.info(`Total Price Sets: ${priceSets.length}\n`)

      if (priceSets.length > 0) {
        // Show first 5 price sets as examples
        const samplePriceSets = priceSets.slice(0, 5)

        samplePriceSets.forEach((priceSet: any, idx: number) => {
          logger.info(`  Price Set ${idx + 1}:`)
          logger.info(`    ID: ${priceSet.id}`)

          if (priceSet.variant) {
            logger.info(`    ✅ Linked to Variant: ${priceSet.variant.id}`)
            logger.info(`       Product: ${priceSet.variant.product_id || "N/A"}`)
          } else {
            logger.info(`    ⚠️  Not linked to any variant`)
          }

          if (priceSet.prices && priceSet.prices.length > 0) {
            logger.info(`    Prices (${priceSet.prices.length}):`)
            priceSet.prices.forEach((price: any) => {
              logger.info(`      ├─ ${price.currency_code?.toUpperCase()}: ${price.amount}`)
            })
          } else {
            logger.info(`    ⚠️  No prices in this set`)
          }
          logger.info("")
        })

        if (priceSets.length > 5) {
          logger.info(`  ... and ${priceSets.length - 5} more price sets\n`)
        }
      }
    } catch (error: any) {
      logger.error(`Error querying price sets: ${error.message}`)
    }

    // ==========================================================================
    // METHOD 4: Using Pricing Module directly (the OLD way - less recommended)
    // ==========================================================================
    logger.info("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
    logger.info("METHOD 4: Direct Pricing Module Query (Legacy Approach)")
    logger.info("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n")

    const pricingModuleService = container.resolve(Modules.PRICING)

    const allPriceSets = await pricingModuleService.listPriceSets({}, {
      relations: ["prices"],
      take: 5,
    })

    logger.info(`Price Sets from Pricing Module: ${allPriceSets.length}\n`)

    allPriceSets.forEach((priceSet: any, idx: number) => {
      logger.info(`  Price Set ${idx + 1}: ${priceSet.id}`)

      if (priceSet.prices && priceSet.prices.length > 0) {
        priceSet.prices.forEach((price: any) => {
          logger.info(`    ├─ ${price.currency_code?.toUpperCase()}: ${price.amount}`)
        })
      } else {
        logger.info(`    ⚠️  No prices`)
      }
      logger.info("")
    })

    logger.info("⚠️  NOTE: This method doesn't show the variant link!")
    logger.info("   Use Query (Methods 1-3) to see the full relationship.\n")

    // ==========================================================================
    // SUMMARY & RECOMMENDATIONS
    // ==========================================================================
    logger.info("\n" + "=".repeat(70))
    logger.info("  SUMMARY & RECOMMENDATIONS")
    logger.info("=".repeat(70) + "\n")

    logger.info("✅ RECOMMENDED APPROACH:")
    logger.info("   Use Query with 'variants.calculated_price.*' (Method 2)")
    logger.info("   This leverages Medusa v2's remote links between modules\n")

    logger.info("📊 KEY FINDINGS:")
    logger.info("   • Prices are linked to variants via Price Sets")
    logger.info("   • Each variant has ONE price_set_id (one-to-one link)")
    logger.info("   • Price Sets contain multiple prices (different currencies/rules)")
    logger.info("   • Use QueryContext to get the best price for a context\n")

    logger.info("❌ COMMON MISTAKES:")
    logger.info("   • Querying Pricing Module directly without the variant link")
    logger.info("   • Filtering prices by substring matching on price_set_id")
    logger.info("   • Not using QueryContext for calculated prices\n")

    logger.info("=".repeat(70) + "\n")

  } catch (error: any) {
    logger.error("Error during pricing investigation:", error)
    throw error
  }
}
