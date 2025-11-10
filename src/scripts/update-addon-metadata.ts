/**
 * Script to update existing addon products with applicable_tours metadata
 */

import { Modules } from "@medusajs/framework/utils"

export default async function ({ container }: any) {
  const productModuleService = container.resolve(Modules.PRODUCT)

  console.log('\n🔄 Updating addon metadata with applicable_tours...\n')

  // Fetch all products
  const allProducts = await productModuleService.listProducts({
    status: "published"
  })

  // Filter for addons
  const addons = allProducts.filter((p: any) => p.metadata?.addon === true)

  console.log(`Found ${addons.length} addon products to update\n`)

  let updated = 0
  let skipped = 0

  for (const addon of addons) {
    // Check if already has applicable_tours
    if (addon.metadata?.applicable_tours && addon.metadata.applicable_tours.length > 0) {
      console.log(`✓ ${addon.handle} - already has applicable_tours`)
      skipped++
      continue
    }

    // Determine applicable_tours based on addon type
    let applicableTours: string[]

    if (addon.handle === 'addon-glamping' || addon.handle === 'addon-eco-lodge') {
      // Multi-day only addons
      applicableTours = ["2d-fraser-rainbow", "3d-fraser-rainbow", "4d-fraser-rainbow"]
    } else if (addon.handle === 'addon-sandboarding') {
      // Rainbow Beach specific
      applicableTours = ["1d-rainbow-beach", "2d-fraser-rainbow", "3d-fraser-rainbow", "4d-fraser-rainbow"]
    } else {
      // Universal addon - applies to all tours
      applicableTours = ["*"]
    }

    // Update the addon
    await productModuleService.updateProducts([{
      id: addon.id,
      metadata: {
        ...addon.metadata,
        applicable_tours: applicableTours
      }
    }])

    console.log(`✅ ${addon.handle} - updated with applicable_tours: ${applicableTours.join(', ')}`)
    updated++
  }

  console.log(`\n✨ Update complete!`)
  console.log(`   Updated: ${updated}`)
  console.log(`   Skipped: ${skipped}`)
  console.log(`   Total: ${addons.length}\n`)
}
