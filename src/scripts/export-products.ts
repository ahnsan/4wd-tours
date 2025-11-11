import { ExecArgs } from "@medusajs/framework/types"

export default async function exportProducts({ container }: ExecArgs) {
  console.log("📊 Exporting products from local database...\n")

  const query = container.resolve("query")

  try {
    // Get all products with their variants, categories, and metadata
    const { data: products } = await query.graph({
      entity: "product",
      fields: [
        "id",
        "title",
        "handle",
        "description",
        "status",
        "metadata",
        "categories.id",
        "categories.name",
        "categories.handle",
        "variants.id",
        "variants.title",
        "variants.sku",
        "variants.allow_backorder",
        "variants.manage_inventory",
        "variants.prices.amount",
        "variants.prices.currency_code",
        "variants.prices.min_quantity",
        "variants.prices.max_quantity",
      ],
    })

    console.log(`\n✅ Found ${products.length} products:\n`)

    products.forEach((product: any, index: number) => {
      console.log(`\n${"=".repeat(80)}`)
      console.log(`Product ${index + 1}: ${product.title}`)
      console.log(`${"=".repeat(80)}`)
      console.log(`ID: ${product.id}`)
      console.log(`Handle: ${product.handle}`)
      console.log(`Status: ${product.status}`)
      console.log(`Description: ${product.description?.substring(0, 100)}...`)

      console.log(`\nMetadata:`)
      console.log(JSON.stringify(product.metadata, null, 2))

      console.log(`\nCategories:`)
      product.categories?.forEach((cat: any) => {
        console.log(`  - ${cat.name} (${cat.handle})`)
      })

      console.log(`\nVariants (${product.variants?.length || 0}):`)
      product.variants?.forEach((variant: any) => {
        console.log(`  - ${variant.title} (SKU: ${variant.sku})`)
        console.log(`    Inventory: manage=${variant.manage_inventory}, backorder=${variant.allow_backorder}`)
        console.log(`    Prices:`)
        variant.prices?.forEach((price: any) => {
          const amount = price.amount / 100 // Convert cents to dollars
          console.log(`      ${price.currency_code.toUpperCase()}: $${amount}`)
        })
      })
    })

    console.log(`\n${"=".repeat(80)}`)
    console.log(`\n✅ Export complete! Found ${products.length} total products`)

    // Also get regions and currencies
    const { data: regions } = await query.graph({
      entity: "region",
      fields: [
        "id",
        "name",
        "currency_code",
        "countries.iso_2",
        "countries.name",
      ],
    })

    console.log(`\n\n${"=".repeat(80)}`)
    console.log(`REGIONS (${regions.length}):`)
    console.log(`${"=".repeat(80)}`)
    regions.forEach((region: any) => {
      console.log(`\n${region.name} (${region.currency_code.toUpperCase()})`)
      console.log(`Countries:`)
      region.countries?.forEach((country: any) => {
        console.log(`  - ${country.name} (${country.iso_2})`)
      })
    })

  } catch (error) {
    console.error("❌ Error exporting products:", error)
    throw error
  }
}
