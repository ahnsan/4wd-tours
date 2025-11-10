/**
 * Check specific product metadata
 */
import { ExecArgs } from "@medusajs/framework/types"
import { Modules } from "@medusajs/framework/utils"

export default async function checkProductMetadata({ container }: ExecArgs) {
  const productService = container.resolve(Modules.PRODUCT)

  // Default to the problematic product
  const productId = "prod_01K9HKNPYM42CW1TPTTFWCZ8HV"

  console.log(`\n=== Checking Product: ${productId} ===\n`)

  try {
    const product = await productService.retrieveProduct(productId)

    console.log(`Handle: ${product.handle}`)
    console.log(`Title: ${product.title}`)
    console.log(`Status: ${product.status}`)
    console.log(`Collection ID: ${product.collection_id || 'none'}`)
    console.log(`\nMetadata:`)
    console.log(JSON.stringify(product.metadata, null, 2))

    // Check if this is an addon
    if (product.handle?.startsWith('addon-')) {
      console.log('\n=== ADDON ANALYSIS ===')
      console.log(`Is Addon: ${product.metadata?.addon === true}`)
      console.log(`Category: ${product.metadata?.category || 'NOT SET'}`)
      console.log(`Applicable Tours: ${product.metadata?.applicable_tours ? JSON.stringify(product.metadata.applicable_tours) : 'NOT SET'}`)
    }

  } catch (error) {
    console.error(`Error fetching product:`, error)
  }
}
