/**
 * Script to update existing product metadata in the Medusa database
 *
 * This script:
 * 1. Fetches all existing products from the database
 * 2. Updates tours with is_tour: true metadata and tour_type
 * 3. Updates add-ons with applicable_tours metadata based on their handle
 *
 * Usage: npm run medusa exec -- src/scripts/update-product-metadata.ts
 */

import { ExecArgs } from "@medusajs/framework/types"
import { Modules } from "@medusajs/framework/utils"

/**
 * Get metadata for add-on products based on their handle
 */
function getAddonMetadata(handle: string): Record<string, any> {
  // Universal add-ons (available for all tours)
  const universalAddons: Record<string, { applicable_tours: string[], category: string }> = {
    "addon-gourmet-bbq": { applicable_tours: ["*"], category: "Food & Beverage" },
    "addon-picnic-hamper": { applicable_tours: ["*"], category: "Food & Beverage" },
    "addon-seafood-platter": { applicable_tours: ["*"], category: "Food & Beverage" },
    "addon-bbq": { applicable_tours: ["*"], category: "Food & Beverage" },
    "addon-picnic": { applicable_tours: ["*"], category: "Food & Beverage" },
    "addon-internet": { applicable_tours: ["*"], category: "Connectivity" },
    "addon-starlink": { applicable_tours: ["*"], category: "Connectivity" },
    "addon-drone-photography": { applicable_tours: ["*"], category: "Photography" },
    "addon-gopro": { applicable_tours: ["*"], category: "Photography" },
    "addon-photo-album": { applicable_tours: ["*"], category: "Photography" },
    "addon-camera": { applicable_tours: ["*"], category: "Photography" },
    "addon-beach-cabana": { applicable_tours: ["*"], category: "Accommodation" },
    "addon-fishing": { applicable_tours: ["*"], category: "Activities" },
    "addon-bodyboarding": { applicable_tours: ["*"], category: "Activities" },
    "addon-paddleboarding": { applicable_tours: ["*"], category: "Activities" },
    "addon-kayaking": { applicable_tours: ["*"], category: "Activities" },
  }

  // Multi-day only add-ons (2d, 3d, 4d tours)
  const multiDayAddons: Record<string, { applicable_tours: string[], category: string }> = {
    "addon-glamping": {
      applicable_tours: ["2d-fraser-rainbow", "3d-fraser-rainbow", "4d-fraser-rainbow"],
      category: "Accommodation"
    },
    "addon-eco-lodge": {
      applicable_tours: ["2d-fraser-rainbow", "3d-fraser-rainbow", "4d-fraser-rainbow"],
      category: "Accommodation"
    },
  }

  // Rainbow Beach specific add-ons
  const rainbowBeachAddons: Record<string, { applicable_tours: string[], category: string }> = {
    "addon-sandboarding": {
      applicable_tours: ["1d-rainbow-beach", "2d-fraser-rainbow", "3d-fraser-rainbow", "4d-fraser-rainbow"],
      category: "Activities"
    },
  }

  // Check in order: rainbow beach, multi-day, universal
  if (rainbowBeachAddons[handle]) {
    return rainbowBeachAddons[handle]
  }

  if (multiDayAddons[handle]) {
    return multiDayAddons[handle]
  }

  if (universalAddons[handle]) {
    return universalAddons[handle]
  }

  // Default to universal if handle not found
  console.warn(`⚠️  Unknown addon handle: ${handle}, defaulting to universal`)
  return { applicable_tours: ["*"], category: "Activities" }
}

/**
 * Main update function
 */
export default async function updateProductMetadata({
  container,
}: ExecArgs) {
  console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
  console.log("🔄 Starting product metadata update...")
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n")

  const productService = container.resolve(Modules.PRODUCT)

  try {
    // 1. Get all products
    console.log("📦 Fetching all products from database...")
    const products = await productService.listProducts()
    console.log(`   Found ${products.length} products\n`)

    // Tour handles
    const tourHandles = [
      "1d-rainbow-beach",
      "1d-fraser-island",
      "2d-fraser-rainbow",
      "3d-fraser-rainbow",
      "4d-fraser-rainbow"
    ]

    let toursUpdated = 0
    let addonsUpdated = 0
    let skipped = 0

    // 2. Update tours
    console.log("🚗 Updating tour products...")
    for (const product of products) {
      if (tourHandles.includes(product.handle)) {
        const tourType = product.handle.startsWith("1d") ? "day_tour" : "multi_day"

        await productService.updateProducts(product.id, {
          metadata: {
            ...product.metadata,
            is_tour: true,
            tour_type: tourType
          }
        })

        console.log(`   ✓ Updated tour: ${product.handle} (type: ${tourType})`)
        toursUpdated++
      }
    }
    console.log("")

    // 3. Update add-ons
    console.log("🎁 Updating add-on products...")
    for (const product of products) {
      if (product.handle.startsWith("addon-")) {
        const addonMetadata = getAddonMetadata(product.handle)

        await productService.updateProducts(product.id, {
          metadata: {
            ...product.metadata,
            ...addonMetadata
          }
        })

        const tourDisplay = addonMetadata.applicable_tours[0] === "*"
          ? "all tours"
          : `${addonMetadata.applicable_tours.length} tours`

        console.log(`   ✓ Updated addon: ${product.handle} (${tourDisplay}, ${addonMetadata.category})`)
        addonsUpdated++
      }
    }
    console.log("")

    // Count skipped products
    skipped = products.length - toursUpdated - addonsUpdated

    // 4. Summary
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
    console.log("✅ Product metadata update complete!")
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n")

    console.log("📊 Summary:")
    console.log(`   • ${toursUpdated} tour products updated`)
    console.log(`   • ${addonsUpdated} add-on products updated`)
    console.log(`   • ${skipped} products skipped (not tours or add-ons)`)
    console.log(`   • ${products.length} total products processed\n`)

    // 5. Verification - show a sample product
    if (addonsUpdated > 0) {
      console.log("🔍 Verification - Sample add-on metadata:")
      const sampleAddon = products.find(p => p.handle === "addon-internet")
      if (sampleAddon) {
        const updatedProduct = await productService.retrieveProduct(sampleAddon.id)
        console.log(`   Product: ${updatedProduct.handle}`)
        console.log(`   Metadata:`, JSON.stringify(updatedProduct.metadata, null, 2))
        console.log("")
      }
    }

    console.log("✅ All products updated successfully!\n")
    console.log("Next steps:")
    console.log("   1. Verify updates: curl http://localhost:9000/store/products?handle=addon-internet")
    console.log("   2. Test add-ons in frontend flow")
    console.log("   3. Check that tour filtering works correctly\n")

  } catch (error) {
    console.error("\n❌ Product metadata update failed:", error)
    throw error
  }
}
