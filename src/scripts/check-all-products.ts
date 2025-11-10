import { ExecArgs } from "@medusajs/framework/types"
import { Modules } from "@medusajs/framework/utils"

export default async function checkAllProducts({ container }: ExecArgs) {
  console.log("\n=== Checking ALL Products in Database ===\n")

  const productService = container.resolve(Modules.PRODUCT)

  // Get ALL products regardless of status
  const { products } = await productService.listProducts(
    {}, // filters
    { take: 100 } // config with pagination
  )

  console.log(`Total products found: ${products.length}\n`)

  // Group by status
  const tours = products.filter(p => p.handle?.includes('fraser') || p.handle?.includes('rainbow'))
  const addons = products.filter(p => p.handle?.startsWith('addon-'))
  const other = products.filter(p => !tours.includes(p) && !addons.includes(p))

  console.log("=== TOURS ===")
  tours.forEach(p => {
    console.log(`  ${p.handle} - ${p.status || 'no status'} - ${p.title}`)
  })

  console.log("\n=== ADD-ONS ===")
  addons.forEach(p => {
    console.log(`  ${p.handle} - ${p.status || 'no status'} - ${p.title}`)
  })

  if (other.length > 0) {
    console.log("\n=== OTHER PRODUCTS ===")
    other.forEach(p => {
      console.log(`  ${p.handle} - ${p.status || 'no status'} - ${p.title}`)
    })
  }

  console.log(`\n=== SUMMARY ===`)
  console.log(`Tours: ${tours.length}`)
  console.log(`Add-ons: ${addons.length}`)
  console.log(`Other: ${other.length}`)
  console.log(`Total: ${products.length}`)

  // Check statuses
  const byStatus = products.reduce((acc, p) => {
    const status = p.status || 'no_status'
    acc[status] = (acc[status] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  console.log(`\n=== BY STATUS ===`)
  Object.entries(byStatus).forEach(([status, count]) => {
    console.log(`  ${status}: ${count}`)
  })
}
