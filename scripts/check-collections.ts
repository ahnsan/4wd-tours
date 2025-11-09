import { ExecArgs } from "@medusajs/framework/types"
import { Modules } from "@medusajs/framework/utils"

export default async function({ container }: ExecArgs) {
  const productModuleService = container.resolve(Modules.PRODUCT)

  console.log("Checking for 'tours' collection...")
  const [toursCollections] = await productModuleService.listProductCollections({
    handle: "tours",
  })

  console.log("Tours collections found:", toursCollections ? toursCollections.length : 0)
  if (toursCollections && toursCollections.length > 0) {
    console.log("  ID:", toursCollections[0].id)
    console.log("  Handle:", toursCollections[0].handle)
    console.log("  Title:", toursCollections[0].title)
  }

  console.log("\nChecking for 'add-ons' collection...")
  const [addonsCollections] = await productModuleService.listProductCollections({
    handle: "add-ons",
  })

  console.log("Add-ons collections found:", addonsCollections ? addonsCollections.length : 0)
  if (addonsCollections && addonsCollections.length > 0) {
    console.log("  ID:", addonsCollections[0].id)
    console.log("  Handle:", addonsCollections[0].handle)
    console.log("  Title:", addonsCollections[0].title)
  }

  console.log("\nChecking all products...")
  const [allProducts] = await productModuleService.listProducts({})
  console.log("Total products:", allProducts ? allProducts.length : 0)
}
