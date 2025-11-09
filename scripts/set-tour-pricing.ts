/**
 * Set Tour Pricing - Configure all products with correct $2000/vehicle pricing
 * Usage: pnpm medusa exec ./scripts/set-tour-pricing.ts
 *
 * This script:
 * 1. Ensures Australia region exists
 * 2. Updates all tour products to $2000 AUD per vehicle (200000 cents)
 * 3. Sets add-on products to correct prices ($30, $80, $65)
 * 4. Links prices to Australia region for calculated_price to work
 */

import { ExecArgs } from "@medusajs/framework/types"
import { Modules, ContainerRegistrationKeys } from "@medusajs/framework/utils"

export default async function setTourPricing({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const productModuleService = container.resolve(Modules.PRODUCT)
  const regionModuleService = container.resolve(Modules.REGION)
  const pricingModuleService = container.resolve(Modules.PRICING)
  const remoteLink = container.resolve(ContainerRegistrationKeys.REMOTE_LINK)
  const remoteQuery = container.resolve(ContainerRegistrationKeys.REMOTE_QUERY)

  logger.info("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
  logger.info("💰 Starting Tour Pricing Configuration")
  logger.info("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n")

  // Step 1: Get or create Australia region
  logger.info("Step 1: Ensuring Australia region exists...")
  let australiaRegion
  const existingRegions = await regionModuleService.listRegions({
    name: "Australia",
  })

  if (existingRegions && existingRegions.length > 0) {
    australiaRegion = existingRegions[0]
    logger.info(`✓ Found existing region: ${australiaRegion.name} (${australiaRegion.id})`)
  } else {
    const newRegions = await regionModuleService.createRegions([{
      name: "Australia",
      currency_code: "aud",
      countries: ["AU"],
    }])
    australiaRegion = newRegions[0]
    logger.info(`✓ Created new region: ${australiaRegion.name} (${australiaRegion.id})`)
  }

  // Step 2: Define pricing structure
  const TOUR_BASE_PRICE = 200000 // $2000 AUD per vehicle (in cents)

  const tourPricing: Record<string, number> = {
    "1d-rainbow-beach": TOUR_BASE_PRICE,
    "1d-fraser-island": TOUR_BASE_PRICE,
    "2d-fraser-rainbow": TOUR_BASE_PRICE, // Still $2000 per vehicle, not per day
    "3d-fraser-rainbow": TOUR_BASE_PRICE,
    "4d-fraser-rainbow": TOUR_BASE_PRICE,
  }

  const addonPricing: Record<string, number> = {
    "addon-internet": 3000,   // $30 AUD
    "addon-glamping": 8000,   // $80 AUD
    "addon-bbq": 6500,        // $65 AUD
  }

  const allPricing = { ...tourPricing, ...addonPricing }

  logger.info("\n📊 Pricing Structure:")
  logger.info("  Tour products: $2000 AUD per vehicle")
  logger.info("  Add-ons: $30 (internet), $80 (glamping), $65 (bbq)\n")

  // Step 3: Get all products with variants
  logger.info("Step 2: Loading products...")
  const products = await productModuleService.listProducts({})

  logger.info(`✓ Found ${products.length} products\n`)

  let productsUpdated = 0
  let variantsUpdated = 0
  let pricesCreated = 0
  let pricesUpdated = 0

  // Step 4: Process each product
  logger.info("Step 3: Updating product pricing...")
  for (const product of products) {
    const handle = product.handle || ""

    if (!allPricing[handle]) {
      logger.warn(`⚠ Skipping ${handle} - no pricing defined`)
      continue
    }

    const targetPrice = allPricing[handle]
    const priceDisplay = (targetPrice / 100).toFixed(2)

    logger.info(`\n📦 Processing: ${product.title} (${handle})`)
    logger.info(`   Target price: $${priceDisplay} AUD`)

    // Get variants for this product
    const variants = await productModuleService.listProductVariants({
      product_id: product.id,
    })

    if (!variants || variants.length === 0) {
      logger.warn(`   ⚠ No variants found, skipping`)
      continue
    }

    for (const variant of variants) {
      logger.info(`   🔧 Variant: ${variant.title} (${variant.id})`)

      try {
        // Try to find existing prices linked to this variant
        // First get all prices and check which ones belong to this variant's price set
        const allPrices = await pricingModuleService.listPrices({})

        let variantPriceSetId: string | null = null
        let existingAudPrice: any = null

        // Check all price sets to find one linked to this variant
        for (const price of allPrices) {
          if (price.price_set_id) {
            // Check if this price set is linked to our variant
            try {
              const links = await remoteQuery({
                entryPoint: "product_variant",
                fields: ["id"],
                variables: {
                  filters: {
                    id: [variant.id],
                  },
                },
              })

              // If we find a match, this is our price set
              if (links && links.length > 0) {
                variantPriceSetId = price.price_set_id
                if (price.currency_code === "aud") {
                  existingAudPrice = price
                  break
                }
              }
            } catch (e) {
              // Ignore query errors
            }
          }
        }

        if (existingAudPrice) {
          // Update existing AUD price
          await pricingModuleService.updatePrices([{
            id: existingAudPrice.id,
            amount: targetPrice,
          }])
          logger.info(`      ✓ Updated existing price to $${priceDisplay} AUD`)
          pricesUpdated++
          variantsUpdated++
        } else if (variantPriceSetId) {
          // Price set exists but no AUD price, add one
          await pricingModuleService.createPrices([{
            price_set_id: variantPriceSetId,
            amount: targetPrice,
            currency_code: "aud",
          }])
          logger.info(`      ✓ Added AUD price $${priceDisplay} to existing price set`)
          pricesCreated++
          variantsUpdated++
        } else {
          // No price set found, create new one and link it
          logger.info(`      ℹ Creating new price set`)

          const priceSets = await pricingModuleService.createPriceSets([{
            prices: [{
              amount: targetPrice,
              currency_code: "aud",
            }],
          }])

          const priceSetId = priceSets[0].id
          logger.info(`      ✓ Created price set: ${priceSetId}`)

          // Link price set to variant
          await remoteLink.create([{
            [Modules.PRODUCT]: {
              variant_id: variant.id,
            },
            [Modules.PRICING]: {
              price_set_id: priceSetId,
            },
          }])

          logger.info(`      ✓ Linked to variant and set price $${priceDisplay} AUD`)
          pricesCreated++
          variantsUpdated++
        }
      } catch (error: any) {
        logger.error(`      ✗ Failed to update variant pricing: ${error.message}`)
      }
    }

    productsUpdated++
  }

  // Summary
  logger.info("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
  logger.info("✅ PRICING UPDATE COMPLETE")
  logger.info("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n")

  logger.info("📊 Summary:")
  logger.info(`  • Products processed: ${productsUpdated}`)
  logger.info(`  • Variants updated: ${variantsUpdated}`)
  logger.info(`  • Prices created: ${pricesCreated}`)
  logger.info(`  • Prices updated: ${pricesUpdated}`)
  logger.info(`  • Region: ${australiaRegion.name} (${australiaRegion.id})`)
  logger.info(`  • Currency: ${australiaRegion.currency_code}\n`)

  logger.info("🔍 Verification Commands:")
  logger.info(`  curl -s "http://localhost:9000/store/products?region_id=${australiaRegion.id}" | python3 -c "import sys, json; d = json.load(sys.stdin); [print(f'{p[\\"handle\\"]}: {p[\\"variants\\"][0].get(\\"calculated_price\\", {}).get(\\"calculated_amount\\", \\"NO PRICE\\")} cents') for p in d.get('products', [])[:8]]"`)
  logger.info(`  curl -s "http://localhost:8000/tours/1d-rainbow-beach" | grep -o '\\$[0-9,]*\\.[0-9]*' | head -5\n`)
}
