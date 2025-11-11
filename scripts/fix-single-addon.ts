/**
 * Fix single addon product - collection assignment
 * Usage: railway run --service=4wd-tours -- npx medusa exec ./scripts/fix-single-addon.ts
 *
 * This is a minimal script to test if railway exec works at all
 */

import { ExecArgs } from "@medusajs/framework/types";
import { Modules } from "@medusajs/framework/utils";

const ADDONS_COLLECTION_ID = 'pcol_01K9TESKK87XQKW7K5C2N3N6QY';

export default async function fixSingleAddon({ container }: ExecArgs) {
  console.log("🔧 Quick Fix - Updating addon-glamping collection\n");

  try {
    const productModuleService = container.resolve(Modules.PRODUCT);

    // Update just one product to test
    const products = await productModuleService.listProducts({
      handle: "addon-glamping"
    });

    if (!products || products.length === 0) {
      console.log("❌ addon-glamping not found");
      return;
    }

    const product = products[0];
    console.log(`Found: ${product.title} (${product.id})`);
    console.log(`Current collection: ${product.collection_id || 'None'}`);

    if (product.collection_id === ADDONS_COLLECTION_ID) {
      console.log("✓ Already has correct collection");
      return;
    }

    await productModuleService.updateProducts(product.id, {
      collection_id: ADDONS_COLLECTION_ID,
    });

    console.log("✓ Updated successfully!");

  } catch (error: any) {
    console.error("❌ Error:", error.message);
    throw error;
  }
}
