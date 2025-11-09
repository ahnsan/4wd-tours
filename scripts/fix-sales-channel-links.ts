import { ExecArgs } from "@medusajs/framework/types"
import { Modules, ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { linkSalesChannelsToApiKeyWorkflow } from "@medusajs/medusa/core-flows"

export default async function({ container }: ExecArgs) {
  console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
  console.log("🔗 Sales Channel Fix Script")
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n")

  const productModuleService = container.resolve(Modules.PRODUCT)
  const salesChannelModuleService = container.resolve(Modules.SALES_CHANNEL)
  const apiKeyModuleService = container.resolve(Modules.API_KEY)
  const remoteLink = container.resolve(ContainerRegistrationKeys.REMOTE_LINK)

  try {
    // Step 1: Get or create default sales channel
    console.log("📋 Step 1: Ensuring default sales channel exists...")
    let salesChannels = await salesChannelModuleService.listSalesChannels({
      name: "Default Sales Channel",
    })

    let salesChannel
    if (!salesChannels || salesChannels.length === 0) {
      console.log("  Creating new default sales channel...")
      const newChannels = await salesChannelModuleService.createSalesChannels([{
        name: "Default Sales Channel",
        description: "Default sales channel for store",
        is_disabled: false,
      }])
      salesChannel = newChannels[0]
      console.log(`  ✓ Created sales channel: ${salesChannel.name} (${salesChannel.id})`)
    } else {
      salesChannel = salesChannels[0]
      console.log(`  ✓ Found existing sales channel: ${salesChannel.name} (${salesChannel.id})`)
    }

    // Step 2: Get all products
    console.log("\n📦 Step 2: Fetching all products...")
    const products = await productModuleService.listProducts({})

    if (!products || products.length === 0) {
      console.log("  ❌ No products found in database")
      console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
      console.log("Status: FAILED - No products to link")
      console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n")
      return
    }

    console.log(`  ✓ Found ${products.length} products`)

    // Step 3: Link all products to sales channel
    console.log("\n🔗 Step 3: Linking products to sales channel...")
    let linkedCount = 0
    const errors: string[] = []

    for (const product of products) {
      try {
        await remoteLink.create([{
          [Modules.PRODUCT]: {
            product_id: product.id,
          },
          [Modules.SALES_CHANNEL]: {
            sales_channel_id: salesChannel.id,
          },
        }])
        console.log(`  ✓ Linked: ${product.handle} (${product.id})`)
        linkedCount++
      } catch (error: any) {
        // Ignore "already exists" errors as they indicate the link is already there
        if (error.message && error.message.includes("already exists")) {
          console.log(`  ℹ Already linked: ${product.handle} (${product.id})`)
          linkedCount++
        } else {
          console.error(`  ✗ Failed to link: ${product.handle} - ${error.message}`)
          errors.push(`${product.handle}: ${error.message}`)
        }
      }
    }

    // Step 4: Get or create publishable API key
    console.log("\n🔑 Step 4: Ensuring publishable API key exists...")
    let apiKeys = await apiKeyModuleService.listApiKeys({ type: "publishable" })
    let apiKey

    if (!apiKeys || apiKeys.length === 0) {
      console.log("  Creating new publishable API key...")
      const newKeys = await apiKeyModuleService.createApiKeys([{
        title: "Store API Key",
        type: "publishable",
        created_by: "fix-sales-channel-script",
      }])
      apiKey = newKeys[0]
      console.log(`  ✓ Created API key: ${apiKey.token}`)
    } else {
      apiKey = apiKeys[0]
      console.log(`  ✓ Found existing API key: ${apiKey.token}`)
    }

    // Step 5: Link API key to sales channel
    console.log("\n🔗 Step 5: Linking API key to sales channel...")
    try {
      await linkSalesChannelsToApiKeyWorkflow(container).run({
        input: {
          id: apiKey.id,
          add: [salesChannel.id],
        },
      })
      console.log("  ✓ API key linked to sales channel successfully")
    } catch (error: any) {
      if (error.message && error.message.includes("already exists")) {
        console.log("  ℹ API key already linked to sales channel")
      } else {
        console.error(`  ✗ Failed to link API key: ${error.message}`)
        errors.push(`API Key Link: ${error.message}`)
      }
    }

    // Final Summary
    console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
    console.log("📊 SUMMARY")
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
    console.log(`Products linked: ${linkedCount}/${products.length}`)
    console.log(`Sales channel ID: ${salesChannel.id}`)
    console.log(`API key: ${apiKey.token}`)

    if (errors.length > 0) {
      console.log(`\n⚠️  Errors encountered: ${errors.length}`)
      errors.forEach((err, idx) => {
        console.log(`  ${idx + 1}. ${err}`)
      })
      console.log("\nStatus: PARTIAL SUCCESS")
    } else {
      console.log("\nStatus: SUCCESS")
    }

    console.log("\n📝 Next step: Verify products are accessible:")
    console.log(`  curl -s "http://localhost:9000/store/products" -H "x-publishable-api-key: ${apiKey.token}" | python3 -c "import sys, json; d = json.load(sys.stdin); print(f'Products: {len(d.get(\\"products\\", []))}')"`)
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n")

  } catch (error: any) {
    console.error("\n❌ Fatal error:", error.message)
    console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
    console.log("Status: FAILED")
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n")
    throw error
  }
}
