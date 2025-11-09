import { ExecArgs } from "@medusajs/framework/types"
import { Modules } from "@medusajs/framework/utils"

export default async function({ container }: ExecArgs) {
  const productModuleService = container.resolve(Modules.PRODUCT)

  const products = await productModuleService.listProducts({})

  console.log("\n=== All Products ===")
  if (products && Array.isArray(products)) {
    products.forEach(p => {
      console.log(`- ${p.handle}: ${p.title} (${p.id})`)
    })
    console.log(`\nTotal: ${products.length} products`)
  } else {
    console.log("No products found or unexpected format")
  }
}
