/**
 * Direct database fix for addon product collections
 * Usage: DATABASE_URL="postgresql://..." npx tsx scripts/fix-addon-collections-direct.ts
 *
 * This script connects directly to the database to update addon products.
 * Use when `railway exec` times out.
 *
 * Get DATABASE_URL from: railway variables --service 4wd-tours | grep DATABASE_URL
 */

import { loadEnv } from '@medusajs/framework/utils';

loadEnv(process.env.NODE_ENV || 'production', process.cwd());

const ADDONS_COLLECTION_ID = 'pcol_01K9TESKK87XQKW7K5C2N3N6QY';

async function fixAddonCollections() {
  console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("🔧 FIX ADDON COLLECTIONS - DIRECT DATABASE");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

  if (!process.env.DATABASE_URL) {
    console.error("❌ DATABASE_URL environment variable not set!");
    console.error("\nGet it with:");
    console.error("  railway variables --service 4wd-tours | grep DATABASE_URL");
    console.error("\nThen run:");
    console.error('  DATABASE_URL="postgresql://..." npx tsx scripts/fix-addon-collections-direct.ts');
    process.exit(1);
  }

  // Dynamic import to avoid compilation issues
  const { Client } = await import('pg');
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false, // Railway requires SSL
    },
  });

  try {
    console.log("Connecting to database...");
    await client.connect();
    console.log("✓ Connected to database\n");

    // Step 1: Verify collection exists
    console.log("Step 1: Verifying 'add-ons' collection exists...");
    const collectionCheck = await client.query(`
      SELECT id, handle, title
      FROM product_collection
      WHERE id = $1
    `, [ADDONS_COLLECTION_ID]);

    if (collectionCheck.rows.length === 0) {
      throw new Error(`Collection not found with ID: ${ADDONS_COLLECTION_ID}`);
    }

    const collection = collectionCheck.rows[0];
    console.log(`✓ Found collection: ${collection.title} (${collection.handle})\n`);

    // Step 2: Find all addon products
    console.log("Step 2: Finding addon products...");
    const addonsQuery = await client.query(`
      SELECT id, handle, title, collection_id
      FROM product
      WHERE handle LIKE 'addon-%'
      AND deleted_at IS NULL
      ORDER BY handle
    `);

    console.log(`✓ Found ${addonsQuery.rows.length} addon products\n`);

    if (addonsQuery.rows.length === 0) {
      console.log("⚠️  No addon products found. Exiting.\n");
      return;
    }

    // Step 3: Categorize addons
    const needsCollection = addonsQuery.rows.filter((p: any) => !p.collection_id);
    const hasCorrectCollection = addonsQuery.rows.filter((p: any) =>
      p.collection_id === ADDONS_COLLECTION_ID
    );
    const hasWrongCollection = addonsQuery.rows.filter((p: any) =>
      p.collection_id && p.collection_id !== ADDONS_COLLECTION_ID
    );

    console.log("Step 3: Collection status:");
    console.log(`   ✅ Already correct: ${hasCorrectCollection.length}`);
    console.log(`   ⚠️  Missing collection: ${needsCollection.length}`);
    console.log(`   ⚠️  Wrong collection: ${hasWrongCollection.length}\n`);

    const needsFix = [...needsCollection, ...hasWrongCollection];

    if (needsFix.length === 0) {
      console.log("✅ All addon products already have correct collection!\n");
      return;
    }

    // Step 4: Show what will be fixed
    console.log("Step 4: Addons that will be updated:\n");
    needsFix.forEach((p: any, idx: number) => {
      console.log(`   ${idx + 1}. ${p.title} (${p.handle})`);
      console.log(`      ID: ${p.id}`);
      console.log(`      Current collection: ${p.collection_id || 'None'}`);
    });
    console.log("");

    // Step 5: Update addon collections
    console.log("Step 5: Updating addon collections in database...\n");

    let successCount = 0;
    let errorCount = 0;

    for (const product of needsFix) {
      try {
        console.log(`   Updating ${product.handle}...`);

        await client.query(`
          UPDATE product
          SET collection_id = $1,
              updated_at = NOW()
          WHERE id = $2
        `, [ADDONS_COLLECTION_ID, product.id]);

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

    console.log(`Total addon products:       ${addonsQuery.rows.length}`);
    console.log(`Already correct:            ${hasCorrectCollection.length}`);
    console.log(`Fixed successfully:         ${successCount}`);
    console.log(`Errors:                     ${errorCount}\n`);

    if (successCount > 0) {
      console.log("✅ Collection assignments completed!\n");

      console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
      console.log("🎯 VERIFICATION");
      console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

      console.log("1. Test Store API (should return all addons):");
      console.log(`   curl -s "https://4wd-tours-production.up.railway.app/store/products?collection_id=${ADDONS_COLLECTION_ID}&region_id=reg_01K9S1YB6T87JJW43F5ZAE8HWG" \\`);
      console.log(`     -H "x-publishable-api-key: pk_c1aea896aab279e937a2375566b06bfda34775b149b33353ca77eb3e8588a91b" | jq '.count'`);
      console.log(`\n   Expected count: ${successCount + hasCorrectCollection.length}\n`);

      console.log("2. Test Storefront API:");
      console.log(`   curl https://4wd-tours-913f.vercel.app/api/addons`);
      console.log(`\n   Should return all addon products without errors\n`);
    }

  } catch (error: any) {
    console.error("\n❌ CRITICAL ERROR:", error.message);
    process.exit(1);
  } finally {
    await client.end();
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
  }
}

fixAddonCollections();
