/**
 * Verification script for addon metadata
 * Checks that all addons have the applicable_tours field
 */

import { ExecArgs } from "@medusajs/framework/types"

export default async function ({ container }: ExecArgs) {
  console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
  console.log("🔍 ADDON METADATA VERIFICATION")
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n")

  const query = container.resolve("query")
  const { data: products } = await query.graph({
    entity: "products",
    fields: ["id", "title", "handle", "metadata"],
    filters: {
      handle: [
        // Food & Beverage (Universal)
        "addon-gourmet-bbq",
        "addon-picnic-hamper",
        "addon-seafood-platter",
        // Connectivity (Universal)
        "addon-internet",
        "addon-starlink",
        // Photography (Universal)
        "addon-drone-photography",
        "addon-gopro",
        "addon-photo-album",
        // Accommodation
        "addon-glamping",      // Multi-day only
        "addon-beach-cabana",  // Universal
        "addon-eco-lodge",     // Multi-day only
        // Activities
        "addon-fishing",       // Universal
        "addon-sandboarding",  // Rainbow Beach only
        "addon-bodyboarding",  // Universal
        "addon-paddleboarding",// Universal
        "addon-kayaking",      // Universal
      ]
    }
  })

  console.log(`Found ${products.length} addon products\n`)

  // Debug: Print first product's metadata structure
  if (products.length > 0) {
    console.log("DEBUG - Sample metadata structure:")
    console.log(JSON.stringify(products[0].metadata, null, 2))
    console.log("\n")
  }

  // Categorize addons
  const universal: any[] = []
  const multiDay: any[] = []
  const rainbowBeach: any[] = []
  const missing: any[] = []

  products.forEach(product => {
    const applicableTours = product.metadata?.applicable_tours

    if (!applicableTours) {
      missing.push(product)
      return
    }

    if (Array.isArray(applicableTours)) {
      if (applicableTours.includes("*")) {
        universal.push(product)
      } else if (
        applicableTours.includes("2d-fraser-rainbow") &&
        applicableTours.includes("3d-fraser-rainbow") &&
        applicableTours.includes("4d-fraser-rainbow") &&
        applicableTours.length === 3
      ) {
        multiDay.push(product)
      } else if (
        applicableTours.includes("1d-rainbow-beach") &&
        applicableTours.includes("2d-fraser-rainbow") &&
        applicableTours.includes("3d-fraser-rainbow") &&
        applicableTours.includes("4d-fraser-rainbow") &&
        applicableTours.length === 4
      ) {
        rainbowBeach.push(product)
      }
    }
  })

  console.log("📊 RESULTS BY CATEGORY:\n")

  console.log(`✅ Universal Addons (${universal.length}/13 expected):`)
  universal.forEach(p => {
    console.log(`   • ${p.title} (${p.handle})`)
    console.log(`     Category: ${p.metadata?.category}`)
    console.log(`     Unit: ${p.metadata?.unit}`)
  })

  console.log(`\n✅ Multi-day Only Addons (${multiDay.length}/2 expected):`)
  multiDay.forEach(p => {
    console.log(`   • ${p.title} (${p.handle})`)
    console.log(`     Category: ${p.metadata?.category}`)
    console.log(`     Tours: ${p.metadata?.applicable_tours.join(", ")}`)
  })

  console.log(`\n✅ Rainbow Beach Tours Addons (${rainbowBeach.length}/1 expected):`)
  rainbowBeach.forEach(p => {
    console.log(`   • ${p.title} (${p.handle})`)
    console.log(`     Category: ${p.metadata?.category}`)
    console.log(`     Tours: ${p.metadata?.applicable_tours.join(", ")}`)
  })

  if (missing.length > 0) {
    console.log(`\n❌ Addons Missing applicable_tours (${missing.length}):`)
    missing.forEach(p => {
      console.log(`   • ${p.title} (${p.handle})`)
    })
  }

  console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")

  const totalExpected = 13 + 2 + 1 // 16 addons total
  const totalFound = universal.length + multiDay.length + rainbowBeach.length

  if (totalFound === totalExpected && missing.length === 0) {
    console.log("✅ VALIDATION SUCCESSFUL!")
    console.log(`All ${totalExpected} addons have correct applicable_tours metadata`)
  } else {
    console.log("❌ VALIDATION FAILED!")
    console.log(`Expected: ${totalExpected}, Found: ${totalFound}, Missing: ${missing.length}`)
  }

  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n")
}
