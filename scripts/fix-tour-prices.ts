/**
 * Fix missing prices for tour products
 * Usage: pnpm medusa exec ./scripts/fix-tour-prices.ts
 */

import { ExecArgs } from "@medusajs/framework/types"
import { Modules, ContainerRegistrationKeys } from "@medusajs/framework/utils"

const TOURS_WITH_PRICES = [
  {
    handle: "1d-rainbow-beach",
    price: 200000, // AUD cents ($2000)
  },
  {
    handle: "1d-fraser-island",
    price: 200000,
  },
  {
    handle: "2d-fraser-rainbow",
    price: 400000,
  },
  {
    handle: "3d-fraser-rainbow",
    price: 600000,
  },
  {
    handle: "4d-fraser-rainbow",
    price: 800000,
  },
]

const ADDONS_WITH_PRICES = [
  {
    handle: "addon-internet",
    price: 5000,
  },
  {
    handle: "addon-glamping",
    price: 25000,
  },
  {
    handle: "addon-bbq",
    price: 18000,
  },
]

export default async function fixTourPrices({ container }: ExecArgs) {
  console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
  console.log("💰 Fixing Tour Product Prices")
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n")

  const productModuleService = container.resolve(Modules.PRODUCT)
  const pricingModuleService = container.resolve(Modules.PRICING)
  const remoteLink = container.resolve(ContainerRegistrationKeys.REMOTE_LINK)

  const allProducts = [...TOURS_WITH_PRICES, ...ADDONS_WITH_PRICES]

  try {
    for (const productDef of allProducts) {
      console.log(`\n🔍 Processing ${productDef.handle}...`)

      // Find the product
      const products = await productModuleService.listProducts({
        handle: productDef.handle,
      })

      if (!products || products.length === 0) {
        console.log(`  ⚠️  Product not found, skipping`)
        continue
      }

      const product = products[0]
      console.log(`  ✓ Found product: ${product.id}`)

      // Get the variant
      const variants = await productModuleService.listProductVariants({
        product_id: product.id,
      })

      if (!variants || variants.length === 0) {
        console.log(`  ⚠️  No variants found, skipping`)
        continue
      }

      const variant = variants[0]
      console.log(`  ✓ Found variant: ${variant.id}`)

      // Always create price set and link it (simpler approach)
      console.log(`  🔧 Creating price set...`)

      try {
        const priceSets = await pricingModuleService.createPriceSets([
          {
            prices: [
              {
                amount: productDef.price,
                currency_code: "aud",
              },
            ],
          },
        ])

        const priceSet = priceSets[0]
        console.log(`  ✓ Created price set: ${priceSet.id}`)

        // Link variant to price set
        await remoteLink.create([
          {
            [Modules.PRODUCT]: {
              variant_id: variant.id,
            },
            [Modules.PRICING]: {
              price_set_id: priceSet.id,
            },
          },
        ])

        console.log(`  ✓ Linked variant to price set`)
        console.log(`  ✓ Price: AUD ${productDef.price / 100} ($${productDef.price} cents)`)
      } catch (linkError: any) {
        if (linkError.message && linkError.message.includes("already exists")) {
          console.log(`  ℹ️  Price set link already exists for this variant`)
        } else {
          console.warn(`  ⚠️  Error creating price set:`, linkError.message || linkError)
        }
      }
    }

    console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
    console.log("✅ Price fixing completed successfully!")
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n")

    console.log("📊 Summary:")
    console.log(`  • Processed ${allProducts.length} products`)
    console.log(`  • All prices in AUD cents`)
    console.log(`  • Currency: AUD\n`)
  } catch (error) {
    console.error("\n❌ Price fixing failed:", error)
    throw error
  }
}
