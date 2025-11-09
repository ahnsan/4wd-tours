import { ExecArgs } from "@medusajs/framework/types"
import { Modules } from "@medusajs/framework/utils"

export default async function({ container }: ExecArgs) {
  const productModuleService = container.resolve(Modules.PRODUCT)

  const products = await productModuleService.listProducts({
    handle: "1d-fraser-island",
  })

  if (products && products.length > 0) {
    const product = products[0]
    console.log("\nProduct:", product.title)
    console.log("Handle:", product.handle)
    console.log("Metadata:", JSON.stringify(product.metadata, null, 2))
  }
}
