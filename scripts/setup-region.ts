import { ExecArgs } from "@medusajs/framework/types"
import { Modules } from "@medusajs/framework/utils"

export default async function({ container }: ExecArgs) {
  const regionModuleService = container.resolve(Modules.REGION)

  console.log("\n=== Setting Up Australian Region ===\n")

  // Check if region exists
  const existingRegions = await regionModuleService.listRegions({
    name: "Australia",
  })

  if (existingRegions && existingRegions.length > 0) {
    console.log(`✓ Region "Australia" already exists (${existingRegions[0].id})`)
    console.log(`  Currency: ${existingRegions[0].currency_code}`)
    return
  }

  // Create Australian region
  console.log("Creating Australian region...")
  const regions = await regionModuleService.createRegions([{
    name: "Australia",
    currency_code: "AUD",
    countries: ["AU"],
  }])

  const region = regions[0]
  console.log(`✓ Created region "${region.name}" (${region.id})`)
  console.log(`  Currency: ${region.currency_code}`)
  console.log(`  Countries: ${region.countries?.join(", ") || "AU"}`)

  console.log("\n✓ Region setup complete\n")
}
