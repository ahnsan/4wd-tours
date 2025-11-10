import { Modules } from "@medusajs/framework/utils"

export default async function ({ container }: any) {
  const pricingModuleService = container.resolve(Modules.PRICING)
  const productModuleService = container.resolve(Modules.PRODUCT)

  console.log('\n=== CHECKING DATABASE PRICES DIRECTLY ===\n')

  const targetRegionId = 'reg_01K9G4HA190556136E7RJQ4411'

  // Get all products
  const allProducts = await productModuleService.listProducts({}, {
    relations: ["variants"]
  })

  const addons = allProducts.filter((p: any) => p.metadata?.addon === true)
  console.log(`Found ${addons.length} addon products\n`)

  // Check first addon's prices in detail
  if (addons.length > 0) {
    const addon = addons[0]
    console.log(`Checking: ${addon.handle} (${addon.title})`)

    if (addon.variants && addon.variants.length > 0) {
      const variant = addon.variants[0]
      console.log(`Variant ID: ${variant.id}`)
      console.log(`Price Set ID: ${variant.price_set_id}\n`)

      if (variant.price_set_id) {
        // Get price set with all relations
        const priceSets = await pricingModuleService.listPriceSets({
          id: variant.price_set_id
        }, {
          relations: ["prices", "prices.price_rules"]
        })

        if (priceSets.length > 0) {
          const priceSet = priceSets[0]
          console.log(`Price Set Details:`)
          console.log(`  ID: ${priceSet.id}`)
          console.log(`  Prices count: ${priceSet.prices?.length || 0}\n`)

          if (priceSet.prices) {
            priceSet.prices.forEach((price: any, index: number) => {
              console.log(`  Price ${index + 1}:`)
              console.log(`    ID: ${price.id}`)
              console.log(`    Amount: ${price.amount}`)
              console.log(`    Currency: ${price.currency_code}`)
              console.log(`    Price Set ID: ${price.price_set_id}`)
              console.log(`    Rules count: ${price.price_rules?.length || 0}`)

              if (price.price_rules && price.price_rules.length > 0) {
                price.price_rules.forEach((rule: any, ruleIndex: number) => {
                  console.log(`      Rule ${ruleIndex + 1}:`)
                  console.log(`        ID: ${rule.id}`)
                  console.log(`        Attribute: ${rule.attribute}`)
                  console.log(`        Value: ${rule.value}`)
                })
              } else {
                console.log(`      ⚠ NO RULES!`)
              }
              console.log('')
            })
          }
        }

        // Also check by querying prices directly
        console.log('\n=== QUERYING PRICES WITH REGION FILTER ===\n')

        try {
          const allPrices = await pricingModuleService.listPrices({
            price_set_id: variant.price_set_id
          }, {
            relations: ["price_rules"]
          })

          console.log(`Found ${allPrices.length} prices for this variant\n`)

          allPrices.forEach((price: any, index: number) => {
            console.log(`Price ${index + 1}:`)
            console.log(`  Amount: ${price.amount}`)
            console.log(`  Currency: ${price.currency_code}`)
            console.log(`  Rules:`, price.price_rules || 'none')
          })
        } catch (error) {
          console.log(`Error querying prices: ${error.message}`)
        }
      }
    }
  }

  console.log('\n=== DIAGNOSTIC SUMMARY ===\n')
  console.log('Expected behavior:')
  console.log('  - Each addon should have 1 variant')
  console.log('  - Each variant should have a price_set_id')
  console.log('  - Each price set should have 1 price')
  console.log('  - Each price should have amount > 0')
  console.log('  - Each price should have rules with region_id')
  console.log('')
  console.log('If prices show amount: 0, the seed data was not properly applied.')
  console.log('If prices have no rules, region filtering will not work.')
}
