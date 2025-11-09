/**
 * Check all product pricing
 * Usage: pnpm medusa exec ./scripts/check-all-pricing.ts
 */

import { ExecArgs } from "@medusajs/framework/types"
import { Modules, ContainerRegistrationKeys } from "@medusajs/framework/utils"

export default async function checkAllPricing({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const productModuleService = container.resolve(Modules.PRODUCT)
  const pricingModuleService = container.resolve(Modules.PRICING)

  logger.info("\n=== Product Pricing Check ===\n")

  // Get all products
  const products = await productModuleService.listProducts({})

  logger.info(`Found ${products.length} products\n`)

  for (const product of products) {
    logger.info(`Product: ${product.handle}`)
    logger.info(`  Title: ${product.title}`)

    // Get variants
    const variants = await productModuleService.listProductVariants({
      product_id: product.id,
    })

    logger.info(`  Variants: ${variants.length}`)

    if (variants && variants.length > 0) {
      for (const variant of variants) {
        logger.info(`    Variant: ${variant.title} (${variant.id})`)

        // Try to get prices for this variant
        const allPrices = await pricingModuleService.listPrices({})
        const variantPrices = allPrices.filter((p: any) =>
          p.price_set_id && p.price_set_id.includes(variant.id.substring(0, 10))
        )

        if (variantPrices.length > 0) {
          variantPrices.forEach((price: any) => {
            logger.info(`      Price: ${price.amount} ${price.currency_code} (price_set: ${price.price_set_id})`)
          })
        } else {
          logger.info(`      ⚠ No prices found`)
        }
      }
    }

    logger.info('')
  }

  // List all price sets
  logger.info("\n=== All Price Sets ===\n")
  const priceSets = await pricingModuleService.listPriceSets({})
  logger.info(`Total price sets: ${priceSets.length}\n`)

  for (const priceSet of priceSets) {
    logger.info(`Price Set: ${priceSet.id}`)

    const prices = await pricingModuleService.listPrices({
      price_set_id: priceSet.id,
    })

    prices.forEach((price: any) => {
      logger.info(`  ${price.amount} ${price.currency_code}`)
    })
  }

  logger.info("\n=== Check Complete ===\n")
}
