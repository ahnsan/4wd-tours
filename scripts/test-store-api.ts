import { ExecArgs } from "@medusajs/framework/types"
import { Modules } from "@medusajs/framework/utils"

export default async function({ container }: ExecArgs) {
  const regionModuleService = container.resolve(Modules.REGION)
  const productModuleService = container.resolve(Modules.PRODUCT)
  const pricingModuleService = container.resolve(Modules.PRICING)

  console.log("\n=== Testing Store API Setup ===\n")

  // Check regions
  console.log("1. Checking regions...")
  const regions = await regionModuleService.listRegions({})
  console.log(`Found ${regions.length} regions:`)
  regions.forEach(r => {
    console.log(`  - ${r.name} (${r.id}): currency ${r.currency_code}`)
  })

  // Check a product with pricing
  console.log("\n2. Checking product with pricing...")
  const products = await productModuleService.listProducts({
    handle: "1d-fraser-island",
  })

  if (products && products.length > 0) {
    const product = products[0]
    console.log(`Product: ${product.title} (${product.id})`)
    console.log(`Variants: ${product.variants?.length || 0}`)

    if (product.variants && product.variants.length > 0) {
      const variant = product.variants[0]
      console.log(`  Variant: ${variant.title} (${variant.id})`)

      // Try to get price sets for this variant
      try {
        const priceSets = await pricingModuleService.listPriceSets({})
        console.log(`\nFound ${priceSets.length} total price sets`)
      } catch (error) {
        console.log("Error listing price sets:", error)
      }
    }
  }

  console.log("\n=== Test Complete ===\n")
}
