import { Modules } from "@medusajs/framework/utils"

export default async function ({ container }: any) {
  const productModuleService = container.resolve(Modules.PRODUCT)
  const pricingModuleService = container.resolve(Modules.PRICING)
  const regionModuleService = container.resolve(Modules.REGION)

  console.log('\n=== CHECKING REGION CONFIGURATION ===\n')

  // Check if Australia region exists
  const targetRegionId = 'reg_01K9G4HA190556136E7RJQ4411'

  try {
    const region = await regionModuleService.retrieveRegion(targetRegionId)
    console.log('✓ Australia region found:')
    console.log(`  ID: ${region.id}`)
    console.log(`  Name: ${region.name}`)
    console.log(`  Currency: ${region.currency_code}`)
    console.log(`  Countries: ${region.countries?.map((c: any) => c.iso_2).join(', ') || 'N/A'}`)
  } catch (error) {
    console.log('✗ Australia region NOT found!')
    console.log(`  Looking for ID: ${targetRegionId}`)
    console.log(`  Error: ${error.message}`)

    // List all regions
    const allRegions = await regionModuleService.listRegions()
    console.log(`\n  Available regions (${allRegions.length}):`)
    allRegions.forEach((r: any) => {
      console.log(`    - ${r.name} (${r.id}) - ${r.currency_code}`)
    })
  }

  console.log('\n=== CHECKING ADDON PRICING ===\n')

  // Get all products first
  const allProducts = await productModuleService.listProducts({}, {
    relations: ["variants"]
  })

  console.log(`Found ${allProducts.length} total products\n`)

  // Filter for addons
  const addons = allProducts.filter((p: any) => p.metadata?.addon === true)
  console.log(`Found ${addons.length} addon products\n`)

  // Check each addon
  for (const addon of addons) {
    console.log(`Addon: ${addon.handle}`)
    console.log(`  Title: ${addon.title}`)
    console.log(`  Variants: ${addon.variants?.length || 0}`)

    if (addon.variants && addon.variants.length > 0) {
      for (const variant of addon.variants) {
        console.log(`  Variant ID: ${variant.id}`)

        // Get prices for this variant using pricing service
        try {
          const priceSets = await pricingModuleService.listPriceSets({
            id: variant.price_set_id
          }, {
            relations: ["prices"]
          })

          if (priceSets.length > 0) {
            const priceSet = priceSets[0]
            console.log(`    Prices: ${priceSet.prices?.length || 0}`)

            if (priceSet.prices && priceSet.prices.length > 0) {
              priceSet.prices.forEach((price: any) => {
                console.log(`      - Amount: ${price.amount}, Currency: ${price.currency_code || 'N/A'}`)
              })
            } else {
              console.log('      ⚠ NO PRICES CONFIGURED!')
            }
          } else {
            console.log('    ⚠ NO PRICE SET!')
          }
        } catch (error) {
          console.log(`    Error fetching prices: ${error.message}`)
        }
      }
    } else {
      console.log('  ⚠ NO VARIANTS!')
    }
    console.log('')
  }

  console.log('=== SUMMARY ===\n')

  // Check if addons have AUD pricing
  let hasAudPricing = false
  for (const addon of addons) {
    if (addon.variants) {
      for (const variant of addon.variants) {
        if (variant.price_set_id) {
          try {
            const priceSets = await pricingModuleService.listPriceSets({
              id: variant.price_set_id
            }, {
              relations: ["prices"]
            })

            if (priceSets.length > 0 && priceSets[0].prices) {
              const audPrice = priceSets[0].prices.find((p: any) =>
                p.currency_code === 'aud' || p.currency_code === 'AUD'
              )
              if (audPrice) {
                hasAudPricing = true
                break
              }
            }
          } catch (error) {
            // Continue checking
          }
        }
      }
    }
    if (hasAudPricing) break
  }

  if (hasAudPricing) {
    console.log('✓ Addons have AUD pricing')
  } else {
    console.log('✗ Addons missing AUD pricing!')
  }
}
