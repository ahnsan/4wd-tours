import { ExecArgs } from "@medusajs/framework/types"
import { Modules, ContainerRegistrationKeys } from "@medusajs/framework/utils"

export default async function({ container }: ExecArgs) {
  const productModuleService = container.resolve(Modules.PRODUCT)
  const salesChannelModuleService = container.resolve(Modules.SALES_CHANNEL)
  const remoteLink = container.resolve(ContainerRegistrationKeys.REMOTE_LINK)

  // Get default sales channel
  const salesChannels = await salesChannelModuleService.listSalesChannels({
    name: "Default Sales Channel",
  })

  if (!salesChannels || salesChannels.length === 0) {
    console.log("❌ No sales channel found")
    return
  }

  const salesChannel = salesChannels[0]
  console.log(`\nSales Channel: ${salesChannel.name} (${salesChannel.id})`)

  // Get all products
  const products = await productModuleService.listProducts({})

  if (!products || products.length === 0) {
    console.log("\n❌ No products found")
    return
  }

  console.log(`\nFound ${products.length} products`)
  console.log("\nLinking products to sales channel...")

  // Link each product to the sales channel
  for (const product of products) {
    await remoteLink.create([{
      [Modules.PRODUCT]: {
        product_id: product.id,
      },
      [Modules.SALES_CHANNEL]: {
        sales_channel_id: salesChannel.id,
      },
    }])
    console.log(`  ✓ Linked: ${product.handle}`)
  }

  console.log(`\n✓ All products linked to sales channel successfully`)
}
