#!/usr/bin/env node

/**
 * Script to investigate how products are linked to collections in Medusa v2
 * Database: medusa-4wd-tours
 */

const { Client } = require('pg');

async function investigate() {
  const client = new Client({
    connectionString: 'postgres://localhost/medusa-4wd-tours'
  });

  try {
    await client.connect();
    console.log('✓ Connected to database: medusa-4wd-tours\n');

    // 1. Check product table for collection_id or similar
    console.log('=== 1. Product Table Structure ===');
    const productStructure = await client.query(`
      SELECT
        column_name,
        data_type,
        is_nullable
      FROM information_schema.columns
      WHERE table_schema = 'public'
      AND table_name = 'product'
      ORDER BY ordinal_position;
    `);
    console.table(productStructure.rows);
    console.log();

    // 2. Check if collection_id exists in product table
    const hasCollectionId = productStructure.rows.some(row => row.column_name.includes('collection'));
    console.log('Product table has collection-related column:', hasCollectionId);
    console.log();

    // 3. Get all products with collection info
    console.log('=== 2. Products with Collection Information ===');
    const products = await client.query(`
      SELECT
        id,
        title,
        handle,
        collection_id,
        metadata
      FROM product
      WHERE deleted_at IS NULL
      ORDER BY title;
    `);

    console.log(`Total products: ${products.rows.length}`);
    if (products.rows.length > 0) {
      console.log();
      console.table(products.rows.map(row => ({
        title: row.title,
        handle: row.handle,
        collection_id: row.collection_id,
        metadata: JSON.stringify(row.metadata)?.substring(0, 80)
      })));
    }
    console.log();

    // 4. Group products by collection
    console.log('=== 3. Products Grouped by Collection ===');
    const productsByCollection = await client.query(`
      SELECT
        pc.id as collection_id,
        pc.title as collection_title,
        pc.handle as collection_handle,
        COUNT(p.id) as product_count,
        array_agg(p.title ORDER BY p.title) as product_titles
      FROM product_collection pc
      LEFT JOIN product p ON p.collection_id = pc.id AND p.deleted_at IS NULL
      GROUP BY pc.id, pc.title, pc.handle
      ORDER BY pc.title;
    `);

    console.table(productsByCollection.rows.map(row => ({
      collection: row.collection_title,
      handle: row.collection_handle,
      product_count: row.product_count,
      products: row.product_titles?.join(', ') || 'No products'
    })));
    console.log();

    // 5. Analyze tours vs add-ons
    console.log('=== 4. Tours vs Add-ons Analysis ===');

    const toursCollection = await client.query(`
      SELECT
        p.id,
        p.title,
        p.handle,
        p.metadata
      FROM product p
      LEFT JOIN product_collection pc ON p.collection_id = pc.id
      WHERE pc.handle = 'tours' AND p.deleted_at IS NULL
      ORDER BY p.title;
    `);

    const addonsCollection = await client.query(`
      SELECT
        p.id,
        p.title,
        p.handle,
        p.metadata
      FROM product p
      LEFT JOIN product_collection pc ON p.collection_id = pc.id
      WHERE pc.handle = 'add-ons' AND p.deleted_at IS NULL
      ORDER BY p.title;
    `);

    console.log(`\nTours (${toursCollection.rows.length} products):`);
    if (toursCollection.rows.length > 0) {
      toursCollection.rows.forEach(p => {
        console.log(`  - ${p.title} (${p.handle})`);
      });
    } else {
      console.log('  No tours found');
    }

    console.log(`\nAdd-ons (${addonsCollection.rows.length} products):`);
    if (addonsCollection.rows.length > 0) {
      addonsCollection.rows.forEach(p => {
        console.log(`  - ${p.title} (${p.handle})`);
      });
    } else {
      console.log('  No add-ons found');
    }
    console.log();

    // 6. Check for products without collection
    console.log('=== 5. Products Without Collection ===');
    const orphanProducts = await client.query(`
      SELECT
        id,
        title,
        handle,
        metadata
      FROM product
      WHERE collection_id IS NULL AND deleted_at IS NULL
      ORDER BY title;
    `);

    console.log(`Products without collection: ${orphanProducts.rows.length}`);
    if (orphanProducts.rows.length > 0) {
      orphanProducts.rows.forEach(p => {
        console.log(`  - ${p.title} (${p.handle})`);
      });
    }
    console.log();

    // 7. Export data structure
    console.log('=== 6. Data Export ===');
    console.log('\n--- Collections ---');
    const allCollections = await client.query(`
      SELECT
        id,
        title,
        handle,
        metadata,
        created_at
      FROM product_collection
      ORDER BY title;
    `);
    console.log(JSON.stringify(allCollections.rows, null, 2));

    console.log('\n--- Products by Collection ---');
    const allProductsWithCollection = await client.query(`
      SELECT
        p.id,
        p.title,
        p.handle,
        p.collection_id,
        pc.title as collection_title,
        pc.handle as collection_handle,
        p.metadata
      FROM product p
      LEFT JOIN product_collection pc ON p.collection_id = pc.id
      WHERE p.deleted_at IS NULL
      ORDER BY pc.title, p.title;
    `);
    console.log(JSON.stringify(allProductsWithCollection.rows, null, 2));
    console.log();

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await client.end();
    console.log('✓ Database connection closed');
  }
}

investigate();
