import { ExecArgs } from "@medusajs/framework/types"
import { Modules } from "@medusajs/framework/utils"

export default async function({ container }: ExecArgs) {
  const apiKeyModuleService = container.resolve(Modules.API_KEY)

  // List existing API keys
  const apiKeys = await apiKeyModuleService.listApiKeys({ type: "publishable" })

  console.log("\n=== Publishable API Keys ===")
  if (apiKeys && Array.isArray(apiKeys) && apiKeys.length > 0) {
    apiKeys.forEach((key, index) => {
      console.log(`\n${index + 1}. ${key.title || 'Unnamed'}`)
      console.log(`   Token: ${key.token}`)
      console.log(`   Created: ${key.created_at}`)
    })
  } else {
    console.log("No publishable API keys found")
    console.log("\nCreating a new publishable API key...")

    // Create a new API key
    const newKeys = await apiKeyModuleService.createApiKeys([{
      title: "Store API Key",
      type: "publishable",
      created_by: "seed-script",
    }])

    if (newKeys && newKeys.length > 0) {
      console.log(`\nCreated new API key:`)
      console.log(`   Token: ${newKeys[0].token}`)
    }
  }
}
