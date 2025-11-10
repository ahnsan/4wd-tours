/**
 * Verification script to check product metadata updates
 *
 * Usage: npx medusa exec ./src/scripts/verify-metadata.ts
 */

import { ExecArgs } from "@medusajs/framework/types"
import { Modules } from "@medusajs/framework/utils"

export default async function verifyMetadata({
  container,
}: ExecArgs) {
  console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
  console.log("🔍 Verifying Product Metadata Updates")
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n")

  const productService = container.resolve(Modules.PRODUCT)

  try {
    // Get all products
    const products = await productService.listProducts()

    // Check tours
    console.log("🚗 TOUR PRODUCTS:")
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
    const tours = products.filter(p =>
      ["1d-rainbow-beach", "1d-fraser-island", "2d-fraser-rainbow", "3d-fraser-rainbow", "4d-fraser-rainbow"].includes(p.handle)
    )

    for (const tour of tours) {
      console.log(`\n📍 ${tour.handle}`)
      console.log(`   Title: ${tour.title}`)
      console.log(`   is_tour: ${tour.metadata?.is_tour}`)
      console.log(`   tour_type: ${tour.metadata?.tour_type}`)
      console.log(`   duration_days: ${tour.metadata?.duration_days}`)
    }

    // Check add-ons
    console.log("\n\n🎁 ADD-ON PRODUCTS:")
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
    const addons = products.filter(p => p.handle.startsWith("addon-"))

    // Group by category
    const categories = new Map<string, any[]>()
    for (const addon of addons) {
      const category = addon.metadata?.category || "Unknown"
      if (!categories.has(category)) {
        categories.set(category, [])
      }
      categories.get(category)!.push(addon)
    }

    for (const [category, categoryAddons] of categories.entries()) {
      console.log(`\n📦 Category: ${category}`)
      console.log("─────────────────────────────────────────────")

      for (const addon of categoryAddons) {
        const applicableTours = addon.metadata?.applicable_tours || []
        const tourDisplay = applicableTours[0] === "*"
          ? "All Tours"
          : `${applicableTours.length} Tours: ${applicableTours.join(", ")}`

        console.log(`   • ${addon.handle}`)
        console.log(`     Available for: ${tourDisplay}`)
      }
    }

    // Summary
    console.log("\n\n📊 SUMMARY:")
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
    console.log(`   Total Products: ${products.length}`)
    console.log(`   Tours: ${tours.length}`)
    console.log(`   Add-ons: ${addons.length}`)
    console.log(`   Categories: ${categories.size}`)

    const universalAddons = addons.filter(a => a.metadata?.applicable_tours?.[0] === "*")
    const multiDayAddons = addons.filter(a =>
      a.metadata?.applicable_tours?.length > 1 &&
      a.metadata?.applicable_tours?.[0] !== "*"
    )

    console.log(`\n   Universal Add-ons (all tours): ${universalAddons.length}`)
    console.log(`   Multi-day Add-ons: ${multiDayAddons.length}`)

    // Test specific examples
    console.log("\n\n🧪 TEST EXAMPLES:")
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")

    const internet = products.find(p => p.handle === "addon-internet")
    if (internet) {
      console.log("\n✅ addon-internet (Universal - Connectivity):")
      console.log(`   applicable_tours: ${JSON.stringify(internet.metadata?.applicable_tours)}`)
      console.log(`   category: ${internet.metadata?.category}`)
    }

    const glamping = products.find(p => p.handle === "addon-glamping")
    if (glamping) {
      console.log("\n✅ addon-glamping (Multi-day - Accommodation):")
      console.log(`   applicable_tours: ${JSON.stringify(glamping.metadata?.applicable_tours)}`)
      console.log(`   category: ${glamping.metadata?.category}`)
    }

    const sandboarding = products.find(p => p.handle === "addon-sandboarding")
    if (sandboarding) {
      console.log("\n✅ addon-sandboarding (Rainbow Beach - Activities):")
      console.log(`   applicable_tours: ${JSON.stringify(sandboarding.metadata?.applicable_tours)}`)
      console.log(`   category: ${sandboarding.metadata?.category}`)
    }

    console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
    console.log("✅ Verification Complete!")
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n")

  } catch (error) {
    console.error("\n❌ Verification failed:", error)
    throw error
  }
}
