/**
 * Fix Addon Products via Admin API
 *
 * Uses Medusa Admin API to fix addon products remotely without database connection.
 * This is a fallback approach when railway exec times out.
 *
 * Fixes:
 * 1. Missing collection assignments (should be "add-ons" collection)
 * 2. Verifies prices exist for Australia region
 *
 * Usage: npx tsx ./scripts/fix-addon-data-admin-api.ts
 */

const RAILWAY_API_URL = "https://4wd-tours-production.up.railway.app";
const PUBLISHABLE_KEY = "pk_c1aea896aab279e937a2375566b06bfda34775b149b33353ca77eb3e8588a91b";
const AUSTRALIA_REGION_ID = "reg_01K9S1YB6T87JJW43F5ZAE8HWG";
const ADDONS_COLLECTION_ID = "pcol_01K9TESKK87XQKW7K5C2N3N6QY";

// Admin credentials - need to get from Railway
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "admin@sunshinecoast4wd.com.au";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

async function fetchStoreAPI(endpoint: string): Promise<any> {
  const response = await fetch(`${RAILWAY_API_URL}/store${endpoint}`, {
    headers: {
      "x-publishable-api-key": PUBLISHABLE_KEY,
    },
  });

  if (!response.ok) {
    throw new Error(`Store API error: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

async function login(): Promise<string> {
  if (!ADMIN_PASSWORD) {
    throw new Error("ADMIN_PASSWORD environment variable not set");
  }

  const response = await fetch(`${RAILWAY_API_URL}/auth/user/emailpass`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Login failed: ${response.status} ${response.statusText}\n${error}`);
  }

  const data = await response.json();
  return data.token;
}

async function updateProductCollection(token: string, productId: string, collectionId: string): Promise<void> {
  const response = await fetch(`${RAILWAY_API_URL}/admin/products/${productId}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`,
    },
    body: JSON.stringify({
      collection_id: collectionId,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Update failed: ${response.status} ${response.statusText}\n${error}`);
  }
}

async function main() {
  console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("🔧 FIX ADDON COLLECTION - ADMIN API METHOD");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

  try {
    // Step 1: Get all products and filter addons
    console.log("Step 1: Fetching all products from Store API...");
    const productsData = await fetchStoreAPI(`/products?limit=100&region_id=${AUSTRALIA_REGION_ID}`);
    const allProducts = productsData.products;

    const addonProducts = allProducts.filter((p: any) =>
      p.handle && p.handle.startsWith("addon-")
    );

    console.log(`✓ Found ${allProducts.length} total products`);
    console.log(`✓ Found ${addonProducts.length} addon products\n`);

    // Step 2: Check which addons need collection assignment
    const needsCollection = addonProducts.filter((p: any) => !p.collection_id);
    const hasCollection = addonProducts.filter((p: any) =>
      p.collection_id === ADDONS_COLLECTION_ID
    );
    const wrongCollection = addonProducts.filter((p: any) =>
      p.collection_id && p.collection_id !== ADDONS_COLLECTION_ID
    );

    console.log("Step 2: Collection status:");
    console.log(`   ✅ Already in correct collection: ${hasCollection.length}`);
    console.log(`   ⚠️  Missing collection: ${needsCollection.length}`);
    console.log(`   ⚠️  Wrong collection: ${wrongCollection.length}\n`);

    if (needsCollection.length === 0 && wrongCollection.length === 0) {
      console.log("✅ All addons are already in the correct collection!\n");
      return;
    }

    // Step 3: List addons that need fixing
    const needsFix = [...needsCollection, ...wrongCollection];
    console.log("Step 3: Addons that need collection assignment:\n");

    needsFix.forEach((p: any, idx: number) => {
      console.log(`   ${idx + 1}. ${p.title} (${p.handle})`);
      console.log(`      ID: ${p.id}`);
      console.log(`      Current collection: ${p.collection?.title || 'None'}`);
      console.log(`      Has price: ${p.variants?.[0]?.calculated_price ? 'Yes' : 'No'}`);
      if (p.variants?.[0]?.calculated_price) {
        console.log(`      Price: $${p.variants[0].calculated_price.calculated_amount} AUD`);
      }
      console.log("");
    });

    // Step 4: Login to Admin API
    console.log("Step 4: Authenticating with Admin API...");
    const token = await login();
    console.log("✓ Authenticated successfully\n");

    // Step 5: Update each addon
    console.log("Step 5: Updating addon collections...\n");

    let successCount = 0;
    let errorCount = 0;

    for (const product of needsFix) {
      try {
        console.log(`   Updating ${product.handle}...`);
        await updateProductCollection(token, product.id, ADDONS_COLLECTION_ID);
        console.log(`   ✓ ${product.handle} updated successfully`);
        successCount++;
      } catch (error: any) {
        console.error(`   ✗ Failed to update ${product.handle}:`, error.message);
        errorCount++;
      }
    }

    // Final Summary
    console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("📊 FIX SUMMARY");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

    console.log(`Total addons:               ${addonProducts.length}`);
    console.log(`Already correct:            ${hasCollection.length}`);
    console.log(`Fixed successfully:         ${successCount}`);
    console.log(`Failed:                     ${errorCount}\n`);

    if (successCount > 0) {
      console.log("✅ Collection assignments completed!\n");

      console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
      console.log("🎯 VERIFICATION");
      console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

      console.log("Test that addons now appear in collection:");
      console.log(`curl -s "${RAILWAY_API_URL}/store/products?collection_id=${ADDONS_COLLECTION_ID}&region_id=${AUSTRALIA_REGION_ID}" \\`);
      console.log(`  -H "x-publishable-api-key: ${PUBLISHABLE_KEY}" | jq '.count'`);
      console.log("\nShould return:", successCount + hasCollection.length);
      console.log("");
    }

  } catch (error: any) {
    console.error("\n❌ CRITICAL ERROR:", error.message);
    process.exit(1);
  }
}

main();
