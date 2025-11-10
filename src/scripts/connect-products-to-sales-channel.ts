import { ExecArgs } from "@medusajs/framework/types"
import { Modules } from "@medusajs/framework/utils"

export default async function connectProductsToSalesChannel({
  container,
}: ExecArgs) {
  console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
  console.log("🔗 Connecting Products to Default Sales Channel")
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n")

  const productModuleService = container.resolve(Modules.PRODUCT)
  const salesChannelModuleService = container.resolve(Modules.SALES_CHANNEL)
  const remoteLink = container.resolve("remoteLink")

  try {
    // 1. Get all products
    console.log("📦 Fetching all products...")
    const products = await productModuleService.listProducts()
    console.log(`   Found ${products.length} products\n`)

    // 2. Get default sales channel
    console.log("🏪 Fetching default sales channel...")
    const salesChannels = await salesChannelModuleService.listSalesChannels()
    const defaultChannel = salesChannels.find((sc: any) => sc.is_default) || salesChannels[0]

    if (!defaultChannel) {
      throw new Error("No sales channel found!")
    }

    console.log(`   Using sales channel: ${defaultChannel.name} (ID: ${defaultChannel.id})\n`)

    // 3. Connect each product to the sales channel
    console.log("🔗 Connecting products to sales channel...\n")

    let connected = 0
    let alreadyConnected = 0
    let errors = 0

    for (const product of products) {
      try {
        // Use remoteLink.create with correct link definition
        await remoteLink.create([
          {
            [Modules.PRODUCT]: {
              product_id: product.id,
            },
            [Modules.SALES_CHANNEL]: {
              sales_channel_id: defaultChannel.id,
            },
          },
        ])

        console.log(`   ✓ Connected: ${product.handle}`)
        connected++
      } catch (error: any) {
        if (error.message?.includes("already exists") || error.message?.includes("duplicate") || error.message?.includes("unique constraint")) {
          console.log(`   ○ Already connected: ${product.handle}`)
          alreadyConnected++
        } else {
          console.log(`   ✗ Error connecting ${product.handle}: ${error.message}`)
          errors++
        }
      }
    }

    console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
    console.log("✅ Sales Channel Connection Complete!")
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n")

    console.log("📊 Summary:")
    console.log(`   • ${connected} products newly connected`)
    console.log(`   • ${alreadyConnected} products already connected`)
    console.log(`   • ${errors} errors`)
    console.log(`   • ${products.length} total products\n`)

    if (connected > 0 || alreadyConnected > 0) {
      console.log("✅ All products should now be visible in the Store API!")
    }

  } catch (error) {
    console.error("\n❌ Error:", error)
    throw error
  }
}
