import { Modules } from "@medusajs/framework/utils"

export default async function ({ container }: any) {
  const pricingModuleService = container.resolve(Modules.PRICING)

  console.log('\n=== CHECKING ALL PRICE SETS IN DATABASE ===\n')

  const allPriceSets = await pricingModuleService.listPriceSets({}, {
    relations: ["prices"]
  })

  console.log(`Total price sets in database: ${allPriceSets.length}\n`)

  allPriceSets.forEach((priceSet: any, index: number) => {
    console.log(`Price Set ${index + 1}:`)
    console.log(`  ID: ${priceSet.id}`)
    console.log(`  Prices: ${priceSet.prices?.length || 0}`)

    if (priceSet.prices && priceSet.prices.length > 0) {
      priceSet.prices.forEach((price: any) => {
        console.log(`    - Amount: ${price.amount}, Currency: ${price.currency_code}`)
      })
    }
    console.log('')
  })

  console.log('\n=== CHECKING PRODUCT-PRICE LINKS ===\n')

  const productModuleService = container.resolve(Modules.PRODUCT)

  const allProducts = await productModuleService.listProducts({}, {
    relations: ["variants"]
  })

  const productsWithPrices = allProducts.filter((p: any) =>
    p.variants?.some((v: any) => v.price_set_id)
  )

  const productsWithoutPrices = allProducts.filter((p: any) =>
    !p.variants?.some((v: any) => v.price_set_id)
  )

  console.log(`Products WITH price_set_id: ${productsWithPrices.length}`)
  console.log(`Products WITHOUT price_set_id: ${productsWithoutPrices.length}\n`)

  if (productsWithoutPrices.length > 0) {
    console.log('Products missing price_set_id:')
    productsWithoutPrices.forEach((p: any) => {
      console.log(`  - ${p.handle} (${p.title})`)
      if (p.variants) {
        p.variants.forEach((v: any) => {
          console.log(`    Variant: ${v.id}, price_set_id: ${v.price_set_id || 'MISSING'}`)
        })
      }
    })
  }
}
