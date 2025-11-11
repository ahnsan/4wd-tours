import { ExecArgs } from "@medusajs/framework/types"
import { Modules } from "@medusajs/framework/utils"

export default async function getApiKey({ container }: ExecArgs) {
  const apiKeyModule = container.resolve(Modules.API_KEY)
  const keys = await apiKeyModule.listApiKeys({ type: "publishable" })

  console.log("\n🔑 Publishable API Keys:\n")
  keys.forEach((key: any) => {
    console.log(`Title: ${key.title}`)
    console.log(`Token: ${key.token}`)
    console.log("---")
  })
}
