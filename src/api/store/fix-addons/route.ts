/**
 * ONE-TIME FIX ENDPOINT - Fix addon collection assignments
 * POST /store/fix-addons?secret=<FIX_SECRET>
 *
 * This endpoint fixes the collection_id for all addon products.
 * Protected by FIX_SECRET environment variable.
 *
 * After running once, this endpoint can be deleted.
 */

import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { Modules } from "@medusajs/framework/utils"

const ADDONS_COLLECTION_ID = 'pcol_01K9TESKK87XQKW7K5C2N3N6QY';
const FIX_SECRET = process.env.FIX_SECRET || 'fix-addons-2025';

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

    const results = [];
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
