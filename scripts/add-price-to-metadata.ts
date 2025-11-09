import { ExecArgs } from "@medusajs/framework/types"
import { Modules } from "@medusajs/framework/utils"

export default async function({ container }: ExecArgs) {
  const productModuleService = container.resolve(Modules.PRODUCT)

  console.log("\n=== Adding Price Info to Product Metadata ===\n")

  const tourPrices: Record<string, number> = {
    "1d-rainbow-beach": 200000,
    "1d-fraser-island": 200000,
    "2d-fraser-rainbow": 400000,
    "3d-fraser-rainbow": 600000,
    "4d-fraser-rainbow": 800000,
    "addon-internet": 5000,
    "addon-glamping": 25000,
    "addon-bbq": 18000,
  }

  for (const [handle, price] of Object.entries(tourPrices)) {
    const products = await productModuleService.listProducts({ handle })

    if (products && products.length > 0) {
      const product = products[0]

      await productModuleService.updateProducts([{
        id: product.id,
        metadata: {
          ...(product.metadata || {}),
          price_aud: price,
          currency: "AUD",
        },
      }])

      console.log(`✓ Updated ${handle}: ${price/100} AUD`)
    }
  }

  console.log("\n✓ All products updated with price metadata\n")
}
