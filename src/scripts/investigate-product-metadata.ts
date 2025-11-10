import { ExecArgs } from "@medusajs/framework/types"
import { Modules } from "@medusajs/framework/utils"

/**
 * Database State Investigation Script
 * Queries the database to see the actual state of product metadata
 * Specifically checking for applicable_tours field
 */
export default async function investigateProductMetadata({ container }: ExecArgs) {
  console.log("\n=== 🔍 DATABASE STATE INVESTIGATION ===\n")

  const productService = container.resolve(Modules.PRODUCT)

  // Target product ID
  const targetProductId = "prod_01K9HKNPYM42CW1TPTTFWCZ8HV"

  console.log("📋 Task 1: Querying target product...")
  console.log(`   Product ID: ${targetProductId}\n`)

  try {
    // Get the specific product with all details
    const targetProduct = await productService.retrieveProduct(targetProductId, {
      relations: ["collection", "variants", "options", "tags", "type", "categories"]
    })

    console.log("=== TARGET PRODUCT DETAILS ===")
    console.log(`ID: ${targetProduct.id}`)
    console.log(`Handle: ${targetProduct.handle}`)
    console.log(`Title: ${targetProduct.title}`)
    console.log(`Status: ${targetProduct.status}`)
    console.log(`Collection: ${targetProduct.collection?.title || 'None'}`)
    console.log(`Collection ID: ${targetProduct.collection?.id || 'None'}`)
    console.log(`\nRAW METADATA:`)
    console.log(JSON.stringify(targetProduct.metadata, null, 2))

    if (targetProduct.metadata) {
      console.log(`\n✅ Metadata exists`)
      console.log(`   Keys: ${Object.keys(targetProduct.metadata).join(', ')}`)

      if ('applicable_tours' in targetProduct.metadata) {
        console.log(`   ✅ applicable_tours: ${JSON.stringify(targetProduct.metadata.applicable_tours)}`)
      } else {
        console.log(`   ❌ applicable_tours: NOT FOUND`)
      }
    } else {
      console.log(`\n❌ No metadata found on product`)
    }

  } catch (error) {
    console.error(`❌ Error retrieving target product:`, error)
  }

  console.log("\n" + "=".repeat(60) + "\n")
  console.log("📋 Task 2: Checking all addon products...")

  // Get all addon products
  const productsResult = await productService.listProducts(
    {},
    { take: 100, relations: ["collection"] }
  )

  // Handle both array and object response formats
  const allProducts = Array.isArray(productsResult) ? productsResult : productsResult.products || []

  const addons = allProducts.filter(p =>
    p.handle?.startsWith('addon-') ||
    p.collection?.handle === 'add-ons'
  )

  console.log(`\nFound ${addons.length} addon products\n`)

  console.log("=== METADATA FIELD PRESENCE ===")

  const withApplicableTours: any[] = []
  const withoutApplicableTours: any[] = []

  addons.forEach(product => {
    if (product.metadata && 'applicable_tours' in product.metadata) {
      withApplicableTours.push({
        id: product.id,
        handle: product.handle,
        title: product.title,
        applicable_tours: product.metadata.applicable_tours,
        metadata: product.metadata
      })
    } else {
      withoutApplicableTours.push({
        id: product.id,
        handle: product.handle,
        title: product.title,
        metadata: product.metadata
      })
    }
  })

  console.log(`Products WITH applicable_tours: ${withApplicableTours.length}`)
  console.log(`Products WITHOUT applicable_tours: ${withoutApplicableTours.length}`)

  if (withApplicableTours.length > 0) {
    console.log(`\n=== WORKING PRODUCTS (with applicable_tours) ===`)
    withApplicableTours.forEach(p => {
      console.log(`\n  ${p.handle}`)
      console.log(`    ID: ${p.id}`)
      console.log(`    applicable_tours: ${JSON.stringify(p.applicable_tours)}`)
      console.log(`    Full metadata: ${JSON.stringify(p.metadata, null, 4)}`)
    })
  }

  if (withoutApplicableTours.length > 0) {
    console.log(`\n=== BROKEN PRODUCTS (without applicable_tours) ===`)
    withoutApplicableTours.forEach(p => {
      console.log(`\n  ${p.handle}`)
      console.log(`    ID: ${p.id}`)
      console.log(`    Metadata: ${JSON.stringify(p.metadata, null, 4)}`)
    })
  }

  console.log("\n" + "=".repeat(60) + "\n")
  console.log("📋 Task 3: Checking data migration status...")

  // Check for migration files
  console.log("\nMigration files location: src/modules/*/migrations/")
  console.log("(Check these files manually for applicable_tours related migrations)")

  console.log("\n" + "=".repeat(60) + "\n")
  console.log("📋 Task 4: Schema comparison...")

  if (withApplicableTours.length > 0 && withoutApplicableTours.length > 0) {
    const workingExample = withApplicableTours[0]
    const brokenExample = withoutApplicableTours.find(p => p.id === targetProductId) || withoutApplicableTours[0]

    console.log("\n=== COMPARISON: Working vs Broken ===")
    console.log("\n--- WORKING PRODUCT ---")
    console.log(`Handle: ${workingExample.handle}`)
    console.log(`Metadata keys: ${Object.keys(workingExample.metadata || {}).join(', ')}`)
    console.log(`Full metadata:`)
    console.log(JSON.stringify(workingExample.metadata, null, 2))

    console.log("\n--- BROKEN PRODUCT ---")
    console.log(`Handle: ${brokenExample.handle}`)
    console.log(`Metadata keys: ${Object.keys(brokenExample.metadata || {}).join(', ')}`)
    console.log(`Full metadata:`)
    console.log(JSON.stringify(brokenExample.metadata, null, 2))
  }

  console.log("\n" + "=".repeat(60) + "\n")
  console.log("=== ROOT CAUSE INDICATOR ===\n")

  if (withoutApplicableTours.some(p => p.id === targetProductId)) {
    console.log("🔴 TARGET PRODUCT IS MISSING applicable_tours")
    console.log("\nPossible causes:")
    console.log("1. Product was created before applicable_tours field was implemented")
    console.log("2. Metadata was not properly set during product creation")
    console.log("3. Data migration script did not update this product")
    console.log("4. Product metadata was manually modified and field was removed")

    console.log("\n💡 RECOMMENDED FIX:")
    console.log("Run the update-product-metadata.ts script to add missing applicable_tours field")
    console.log(`   medusa exec ./src/scripts/update-product-metadata.ts`)
  } else if (withApplicableTours.some(p => p.id === targetProductId)) {
    console.log("✅ TARGET PRODUCT HAS applicable_tours")
    console.log("\nThe issue may be in the frontend or API response handling")
    console.log("Check storefront code for proper metadata access")
  }

  console.log("\n" + "=".repeat(60))
  console.log("\n✅ Investigation complete!\n")
}
