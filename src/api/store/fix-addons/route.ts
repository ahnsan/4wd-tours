/**
 * ONE-TIME FIX ENDPOINT - Fix addon collection assignments and pricing
 * POST /store/fix-addons?secret=<FIX_SECRET>  - Fix collections
 * GET /store/fix-addons?secret=<FIX_SECRET>   - Fix pricing
 *
 * This endpoint fixes the collection_id and regional pricing for all addon products.
 * Protected by FIX_SECRET environment variable.
 *
 * After running once, this endpoint can be deleted.
 */

import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { Modules, ContainerRegistrationKeys } from "@medusajs/framework/utils"

const ADDONS_COLLECTION_ID = 'pcol_01K9TESKK87XQKW7K5C2N3N6QY';
const FIX_SECRET = process.env.FIX_SECRET || 'fix-addons-2025';

// Production Australia region ID
const AUSTRALIA_REGION_ID = 'reg_01K9S1YB6T87JJW43F5ZAE8HWG';

// Addon pricing (Medusa v2 stores in dollars - e.g., 250 = $250.00 AUD)
const ADDON_PRICING: Record<string, number> = {
  "addon-glamping": 250,          // $250.00 AUD
  "addon-internet": 50,           // $50.00 AUD
  "addon-bbq": 180,               // $180.00 AUD
  "addon-camera": 75,             // $75.00 AUD
  "addon-picnic": 85,             // $85.00 AUD
  "addon-fishing": 65,            // $65.00 AUD
  "addon-drone": 200,             // $200.00 AUD
  "addon-gopro": 75,              // $75.00 AUD
  "addon-starlink": 30,           // $30.00 AUD
  "addon-photo-package": 150,    // $150.00 AUD
  "addon-premium-photo": 200,    // $200.00 AUD
  "addon-food-basic": 65,        // $65.00 AUD
  "addon-food-premium": 180,     // $180.00 AUD
  "addon-accommodation-upgrade": 180, // $180.00 AUD
  "addon-deluxe-accommodation": 300,  // $300.00 AUD
  "addon-activity-gear": 35,     // $35.00 AUD
  "addon-premium-gear": 75,      // $75.00 AUD
  "addon-drone-photography": 200, // $200.00 AUD
};

const DEFAULT_ADDON_PRICE = 50; // $50.00 AUD

export async function POST(
  req: MedusaRequest,
  res: MedusaResponse
): Promise<void> {
  // Security check
  const secret = req.query.secret as string;
  if (secret !== FIX_SECRET) {
    res.status(401).json({ error: "Unauthorized - invalid secret" });
    return;
  }

  console.log("\n🔧 FIX ENDPOINT: Starting addon collection fix...\n");

  try {
    const productModuleService = req.scope.resolve(Modules.PRODUCT);

    // Step 1: Verify collection exists
    console.log("Step 1: Verifying collection...");
    const collections = await productModuleService.listProductCollections({
      id: [ADDONS_COLLECTION_ID],
    });

    if (!collections || collections.length === 0) {
      throw new Error(`Collection not found: ${ADDONS_COLLECTION_ID}`);
    }

    console.log(`✓ Found collection: ${collections[0].title}\n`);

    // Step 2: Get all products
    console.log("Step 2: Finding addon products...");
    const allProducts = await productModuleService.listProducts({}, {
      relations: ["collection"],
    });

    const addonProducts = allProducts.filter((p: any) =>
      p.handle && p.handle.startsWith("addon-")
    );

    console.log(`✓ Found ${addonProducts.length} addon products\n`);

    // Step 3: Categorize
    const needsFix = addonProducts.filter((p: any) =>
      !p.collection_id || p.collection_id !== ADDONS_COLLECTION_ID
    );
    const alreadyCorrect = addonProducts.filter((p: any) =>
      p.collection_id === ADDONS_COLLECTION_ID
    );

    console.log("Step 3: Status:");
    console.log(`   Already correct: ${alreadyCorrect.length}`);
    console.log(`   Needs fix: ${needsFix.length}\n`);

    if (needsFix.length === 0) {
      res.json({
        success: true,
        message: "All addons already have correct collection",
        stats: {
          total: addonProducts.length,
          already_correct: alreadyCorrect.length,
          fixed: 0,
        },
      });
      return;
    }

    // Step 4: Fix each addon
    console.log("Step 4: Fixing addons...\n");

    const results: Array<{
      handle: string;
      id: string;
      status: string;
      error?: string;
    }> = [];
    let successCount = 0;
    let errorCount = 0;

    for (const product of needsFix) {
      try {
        console.log(`   Updating ${product.handle}...`);

        await productModuleService.updateProducts(product.id, {
          collection_id: ADDONS_COLLECTION_ID,
        });

        console.log(`   ✓ ${product.handle} fixed`);
        results.push({
          handle: product.handle,
          id: product.id,
          status: "success",
        });
        successCount++;
      } catch (error: any) {
        console.error(`   ✗ ${product.handle} failed:`, error.message);
        results.push({
          handle: product.handle,
          id: product.id,
          status: "error",
          error: error.message,
        });
        errorCount++;
      }
    }

    console.log("\n✅ Fix complete!");
    console.log(`   Success: ${successCount}`);
    console.log(`   Errors: ${errorCount}\n`);

    res.json({
      success: true,
      message: `Fixed ${successCount} addon products`,
      stats: {
        total: addonProducts.length,
        already_correct: alreadyCorrect.length,
        fixed: successCount,
        errors: errorCount,
      },
      results,
    });

  } catch (error: any) {
    console.error("\n❌ Fix failed:", error.message);

    res.status(500).json({
      success: false,
      error: "Fix failed",
      message: error.message,
    });
  }
}

/**
 * GET /store/fix-addons?secret=<FIX_SECRET>
 * Fixes regional pricing for all addon products
 */
export async function GET(
  req: MedusaRequest,
  res: MedusaResponse
): Promise<void> {
  // Security check
  const secret = req.query.secret as string;
  if (secret !== FIX_SECRET) {
    res.status(401).json({ error: "Unauthorized - invalid secret" });
    return;
  }

  console.log("\n🔧 FIX ENDPOINT: Starting addon pricing fix...\n");

  try {
    const productModuleService = req.scope.resolve(Modules.PRODUCT);
    const pricingModuleService = req.scope.resolve(Modules.PRICING);
    const regionModuleService = req.scope.resolve(Modules.REGION);
    const remoteLink = req.scope.resolve(ContainerRegistrationKeys.REMOTE_LINK);

    const results: Array<{
      handle: string;
      id: string;
      status: string;
      error?: string;
    }> = [];

    // Step 1: Verify Australia region exists
    console.log("Step 1: Verifying Australia region...");
    const regions = await regionModuleService.listRegions({
      id: AUSTRALIA_REGION_ID,
    });

    if (!regions || regions.length === 0) {
      res.status(404).json({
        success: false,
        error: `Australia region not found with ID: ${AUSTRALIA_REGION_ID}`,
      });
      return;
    }

    const australiaRegion = regions[0];
    console.log(`✓ Found region: ${australiaRegion.name} (${australiaRegion.id})\n`);

    // Step 2: Find all addon products
    console.log("Step 2: Finding addon products...");
    const allProducts = await productModuleService.listProducts({}, {
      relations: ["variants", "variants.prices"],
    });

    const addonProducts = allProducts.filter((p: any) =>
      p.handle && p.handle.startsWith("addon-")
    );

    console.log(`✓ Found ${addonProducts.length} addon products\n`);

    if (addonProducts.length === 0) {
      res.json({
        success: true,
        message: "No addon products found",
        results: [],
      });
      return;
    }

    // Step 3: Fix pricing for each addon
    console.log("Step 3: Fixing pricing...\n");
    for (const product of addonProducts) {
      try {
        console.log(`   Processing ${product.handle}...`);

        if (!product.variants || product.variants.length === 0) {
          results.push({
            handle: product.handle,
            id: product.id,
            status: 'skipped',
            error: 'No variants found',
          });
          continue;
        }

        // Medusa v2: Prices are in DOLLARS (major currency unit)
        const priceAmount = ADDON_PRICING[product.handle] || DEFAULT_ADDON_PRICE;

        for (const variant of product.variants) {
          // Get existing price set links
          const priceSetLinks = await remoteLink.query({
            [Modules.PRODUCT]: {
              variant_id: variant.id,
            },
            [Modules.PRICING]: {
              fields: ["price_set_id"],
            },
          });

          let priceSet;

          if (priceSetLinks && priceSetLinks.length > 0) {
            // Variant has a price set - check if it has Australia region price
            const priceSetId = priceSetLinks[0][Modules.PRICING].price_set_id;

            const priceSets = await pricingModuleService.listPriceSets({
              id: [priceSetId],
            }, {
              relations: ["prices", "prices.price_rules"],
            });

            if (priceSets && priceSets.length > 0) {
              priceSet = priceSets[0];

              // Check if Australia region price exists
              const australiaPrice = priceSet.prices?.find((price: any) => {
                return price.price_rules?.some((rule: any) =>
                  rule.attribute === "region_id" && rule.value === AUSTRALIA_REGION_ID
                );
              });

              if (australiaPrice) {
                // Price exists - check if amount needs updating
                if (australiaPrice.amount !== priceAmount) {
                  await pricingModuleService.updatePrices({
                    id: australiaPrice.id,
                    amount: priceAmount,
                  });
                  console.log(`   ✓ ${product.handle}: Updated $${australiaPrice.amount} → $${priceAmount}`);
                  results.push({
                    handle: product.handle,
                    id: product.id,
                    status: 'updated',
                  });
                } else {
                  console.log(`   ✓ ${product.handle}: Already correct ($${priceAmount})`);
                  results.push({
                    handle: product.handle,
                    id: product.id,
                    status: 'ok',
                  });
                }
              } else {
                // No Australia price - add it
                await pricingModuleService.createPrices({
                  price_set_id: priceSet.id,
                  amount: priceAmount,
                  currency_code: "aud",
                  rules: {
                    region_id: AUSTRALIA_REGION_ID,
                  },
                });
                console.log(`   ✓ ${product.handle}: Added price $${priceAmount}`);
                results.push({
                  handle: product.handle,
                  id: product.id,
                  status: 'added',
                });
              }
            }
          } else {
            // No price set - create one
            console.log(`   Creating price set for ${product.handle}...`);

            const newPriceSets = await pricingModuleService.createPriceSets({
              prices: [{
                amount: priceAmount,
                currency_code: "aud",
                rules: {
                  region_id: AUSTRALIA_REGION_ID,
                },
              }],
            });

            priceSet = newPriceSets[0];

            // Link price set to variant
            await remoteLink.create([{
              [Modules.PRODUCT]: {
                variant_id: variant.id,
              },
              [Modules.PRICING]: {
                price_set_id: priceSet.id,
              },
            }]);

            console.log(`   ✓ ${product.handle}: Created price set $${priceAmount}`);
            results.push({
              handle: product.handle,
              id: product.id,
              status: 'created',
            });
          }
        }
      } catch (error: any) {
        console.error(`   ✗ ${product.handle} failed:`, error.message);
        results.push({
          handle: product.handle,
          id: product.id,
          status: 'error',
          error: error.message,
        });
      }
    }

    console.log("\n✅ Pricing fix complete!\n");

    res.json({
      success: true,
      message: `Fixed pricing for ${addonProducts.length} addon products`,
      region: {
        id: australiaRegion.id,
        name: australiaRegion.name,
      },
      results,
      summary: {
        total: addonProducts.length,
        created: results.filter(r => r.status === 'created').length,
        added: results.filter(r => r.status === 'added').length,
        updated: results.filter(r => r.status === 'updated').length,
        ok: results.filter(r => r.status === 'ok').length,
        errors: results.filter(r => r.status === 'error').length,
        skipped: results.filter(r => r.status === 'skipped').length,
      },
    });

  } catch (error: any) {
    console.error("\n❌ Pricing fix failed:", error.message);

    res.status(500).json({
      success: false,
      error: "Pricing fix failed",
      message: error.message,
    });
  }
}
