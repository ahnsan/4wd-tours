/**
 * Link existing price sets to product variants
 * Usage: pnpm medusa exec ./scripts/link-price-sets-to-variants.ts
 */

import { ExecArgs } from "@medusajs/framework/types"
import { Modules, ContainerRegistrationKeys } from "@medusajs/framework/utils"

export default async function linkPriceSetsToVariants({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const productModuleService = container.resolve(Modules.PRODUCT)
  const pricingModuleService = container.resolve(Modules.PRICING)
  const remoteLink = container.resolve(ContainerRegistrationKeys.REMOTE_LINK)

  logger.info("\n=== Linking Price Sets to Variants ===\n")

  // Get all products
  const products = await productModuleService.listProducts({})
  logger.info(`Found ${products.length} products\n`)

  // Get all price sets with 200000 AUD (tours) and addon prices
  const allPriceSets = await pricingModuleService.listPriceSets({})
  logger.info(`Found ${allPriceSets.length} total price sets\n`)

  // Get the latest 8 price sets (matching our 8 products)
  const latestPriceSets = allPriceSets
    .sort((a: any, b: any) => b.id.localeCompare(a.id))
    .slice(0, 8)

  logger.info(`Using ${latestPriceSets.length} latest price sets\n`)

  let linked = 0
  let skipped = 0

  for (let i = 0; i < products.length; i++) {
    const product = products[i]
    const priceSet = latestPriceSets[i]

    if (!priceSet) {
      logger.warn(`No price set available for ${product.handle}`)
      skipped++
      continue
    }

    const variants = await productModuleService.listProductVariants({
      product_id: product.id,
    })

    if (!variants || variants.length === 0) {
      logger.warn(`No variants for ${product.handle}`)
      skipped++
      continue
    }

    const variant = variants[0]
    logger.info(`Product: ${product.handle}`)
    logger.info(`  Variant: ${variant.id}`)
    logger.info(`  Price Set: ${priceSet.id}`)

    // Get prices in this price set to show what we're linking
    const prices = await pricingModuleService.listPrices({
      price_set_id: priceSet.id,
    })

    if (prices && prices.length > 0) {
      logger.info(`  Price: ${prices[0].amount} ${prices[0].currency_code}`)
    }

    try {
      // Link the price set to the variant
      await remoteLink.create([{
        [Modules.PRODUCT]: {
          variant_id: variant.id,
        },
        [Modules.PRICING]: {
          price_set_id: priceSet.id,
        },
      }])

      logger.info(`  ✓ Linked successfully\n`)
      linked++
    } catch (error: any) {
      if (error.message && error.message.includes("already exists")) {
        logger.info(`  ✓ Already linked\n`)
        skipped++
      } else {
        logger.error(`  ✗ Failed to link: ${error.message}\n`)
        skipped++
      }
    }
  }

  logger.info("\n=== Linking Complete ===")
  logger.info(`  Linked: ${linked}`)
  logger.info(`  Skipped: ${skipped}`)
  logger.info(`  Total: ${products.length}\n`)
}
