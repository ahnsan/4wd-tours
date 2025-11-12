/**
 * Check all product pricing using Medusa v2 best practices
 * Usage: npx medusa exec ./scripts/check-all-pricing.ts
 *
 * MEDUSA V2 PRICING APPROACH:
 * - Products have variants
 * - Variants are linked to price_sets via module links (not direct foreign keys)
 * - Price_sets contain multiple prices with rules (region_id, currency_code, etc.)
 * - Use query.graph() to traverse these relationships efficiently
 * - Use calculatePrices() to get context-aware pricing
 */

import { ExecArgs } from "@medusajs/framework/types"
import { Modules, ContainerRegistrationKeys } from "@medusajs/framework/utils"

export default async function checkAllPricing({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const pricingModuleService = container.resolve(Modules.PRICING)

  logger.info("\n=== Product Pricing Check (Medusa v2) ===\n")

  // Use query.graph to retrieve variants with their linked price_sets
  // This is the Medusa v2 way - leveraging module links
  const { data: variants } = await query.graph({
    entity: "variant",
    fields: [
      "id",
      "title",
      "sku",
      "product.id",
      "product.handle",
      "product.title",
      "price_set.*",  // This traverses the module link to get price_set
    ],
  })

  logger.info(`Found ${variants.length} product variants\n`)

  // Group by product for better readability
  const productMap = new Map()
  for (const variant of variants) {
    const productHandle = variant.product?.handle || 'unknown'
    if (!productMap.has(productHandle)) {
      productMap.set(productHandle, {
        title: variant.product?.title || 'Unknown Product',
        id: variant.product?.id,
        variants: []
      })
    }
    productMap.get(productHandle).variants.push(variant)
  }

  // Display pricing information grouped by product
  for (const [handle, productInfo] of productMap) {
    logger.info(`Product: ${handle}`)
    logger.info(`  Title: ${productInfo.title}`)
    logger.info(`  ID: ${productInfo.id}`)
    logger.info(`  Variants: ${productInfo.variants.length}\n`)

    for (const variant of productInfo.variants) {
      logger.info(`    Variant: ${variant.title}`)
      logger.info(`      ID: ${variant.id}`)
      logger.info(`      SKU: ${variant.sku || 'N/A'}`)

      if (variant.price_set) {
        logger.info(`      Price Set ID: ${variant.price_set.id}`)

        // Get all prices in this price set
        const prices = await pricingModuleService.listPrices({
          price_set_id: variant.price_set.id,
        })

        if (prices && prices.length > 0) {
          logger.info(`      Prices (${prices.length}):`)
          prices.forEach((price: any) => {
            const rules = price.price_rules || []
            const ruleInfo = rules.map((r: any) => `${r.attribute}:${r.value}`).join(', ')
            // Medusa v2 stores prices in dollars (not cents), so no division needed
            logger.info(`        • $${price.amount.toFixed(2)} ${price.currency_code.toUpperCase()} ${ruleInfo ? `[${ruleInfo}]` : ''}`)
          })

          // Demonstrate calculatePrices for context-aware pricing
          // This shows what a customer would see in Australia (AUD)
          const calculatedPrices = await pricingModuleService.calculatePrices(
            { id: [variant.price_set.id] },
            {
              context: {
                currency_code: "aud",
                region_id: "reg_01K9G4HA190556136E7RJQ4411", // Australia region
              },
            }
          )

          if (calculatedPrices && calculatedPrices.length > 0) {
            const calc = calculatedPrices[0]
            logger.info(`      Calculated Price (AUD, Australia):`)
            // Medusa v2 calculatePrices returns amounts in dollars
            logger.info(`        Display: $${calc.calculated_amount.toFixed(2)} ${calc.currency_code?.toUpperCase() || 'N/A'}`)
            if (calc.original_amount && calc.original_amount !== calc.calculated_amount) {
              logger.info(`        Original: $${calc.original_amount.toFixed(2)} (${((1 - calc.calculated_amount / calc.original_amount) * 100).toFixed(0)}% off)`)
            }
          }
        } else {
          logger.info(`      ⚠ Price set exists but contains no prices`)
        }
      } else {
        logger.info(`      ⚠ No price set linked to this variant`)
      }

      logger.info('')
    }
  }

  // Summary statistics
  logger.info("\n=== Summary ===\n")
  const variantsWithPrices = variants.filter(v => v.price_set)
  const variantsWithoutPrices = variants.filter(v => !v.price_set)

  logger.info(`Total variants: ${variants.length}`)
  logger.info(`Variants with prices: ${variantsWithPrices.length}`)
  logger.info(`Variants without prices: ${variantsWithoutPrices.length}`)

  if (variantsWithoutPrices.length > 0) {
    logger.info(`\nVariants missing prices:`)
    variantsWithoutPrices.forEach(v => {
      logger.info(`  • ${v.product?.handle || 'unknown'} - ${v.title} (${v.id})`)
    })
  }

  logger.info("\n=== Check Complete ===\n")
}
