import { ExecArgs } from "@medusajs/framework/types"
import { Modules, ContainerRegistrationKeys } from "@medusajs/framework/utils"

export default async function({ container }: ExecArgs) {
  const productModuleService = container.resolve(Modules.PRODUCT)
  const pricingModuleService = container.resolve(Modules.PRICING)
  const remoteQuery = container.resolve(ContainerRegistrationKeys.REMOTE_QUERY)

  console.log("\n=== Checking Pricing Configuration ===\n")

  // Get a product with variants
  const products = await productModuleService.listProducts({
    handle: "1d-fraser-island",
  }, {
    relations: ["variants"]
  })

  if (!products || products.length === 0) {
    console.log("❌ Product not found")
    return
  }

  const product = products[0]
  console.log(`Product: ${product.title} (${product.id})`)
  console.log(`Variants: ${product.variants?.length || 0}`)

  if (product.variants && product.variants.length > 0) {
    const variant = product.variants[0]
    console.log(`\nVariant: ${variant.title} (${variant.id})`)

    // Try to query price sets linked to this variant using remote query
    try {
      const variantPricing = await remoteQuery({
        entryPoint: "variant_price_set",
        fields: ["variant_id", "price_set_id", "price_set.*"],
        variables: {
          filters: {
            variant_id: [variant.id],
          },
        },
      })

      console.log("\nPrice Set Links:")
      console.log(JSON.stringify(variantPricing, null, 2))
    } catch (error: any) {
      console.log("Error querying variant price set:", error.message)
    }
  }

  // List all price sets
  console.log("\n--- All Price Sets ---")
  try {
    const priceSets = await pricingModuleService.listPriceSets({}, {
      relations: ["prices"],
      take: 5,
    })

    console.log(`Found ${priceSets.length} price sets:`)
    priceSets.forEach((ps: any) => {
      console.log(`  Price Set: ${ps.id}`)
      if (ps.prices) {
        ps.prices.forEach((price: any) => {
          console.log(`    - ${price.amount} ${price.currency_code}`)
        })
      }
    })
  } catch (error: any) {
    console.log("Error listing price sets:", error.message)
  }

  console.log("\n=== Check Complete ===\n")
}
