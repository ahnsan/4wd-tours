import { ExecArgs } from "@medusajs/framework/types"
import { Modules } from "@medusajs/framework/utils"
import { linkSalesChannelsToApiKeyWorkflow } from "@medusajs/medusa/core-flows"

export default async function({ container }: ExecArgs) {
  const apiKeyModuleService = container.resolve(Modules.API_KEY)
  const salesChannelModuleService = container.resolve(Modules.SALES_CHANNEL)

  // Get or create API key
  let apiKeys = await apiKeyModuleService.listApiKeys({ type: "publishable" })
  let apiKey

  if (!apiKeys || apiKeys.length === 0) {
    console.log("Creating new publishable API key...")
    const newKeys = await apiKeyModuleService.createApiKeys([{
      title: "Store API Key",
      type: "publishable",
      created_by: "seed-script",
    }])
    apiKey = newKeys[0]
  } else {
    apiKey = apiKeys[0]
  }

  console.log(`\nAPI Key: ${apiKey.token}`)

  // Get default sales channel
  const salesChannels = await salesChannelModuleService.listSalesChannels({
    name: "Default Sales Channel",
  })

  if (!salesChannels || salesChannels.length === 0) {
    console.log("\n❌ No sales channel found")
    return
  }

  const salesChannel = salesChannels[0]
  console.log(`\nSales Channel: ${salesChannel.name} (${salesChannel.id})`)

  // Link API key to sales channel
  console.log("\nLinking API key to sales channel...")
  await linkSalesChannelsToApiKeyWorkflow(container).run({
    input: {
      id: apiKey.id,
      add: [salesChannel.id],
    },
  })

  console.log("✓ API key linked to sales channel successfully")
  console.log(`\nUse this API key in requests:`)
  console.log(`  curl -H "x-publishable-api-key: ${apiKey.token}" http://localhost:9000/store/products`)
}
