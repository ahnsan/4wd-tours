#!/usr/bin/env node

/**
 * Script to investigate product_collection table structure and data
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

    // 1. Check if product_collection table exists
    console.log('=== 1. Checking if product_collection table exists ===');
    const tableExists = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = 'product_collection'
      );
    `);
    console.log('Table exists:', tableExists.rows[0].exists);
    console.log();

    if (!tableExists.rows[0].exists) {
      console.log('❌ product_collection table does not exist!');
      await client.end();
      return;
    }

    // 2. Get table structure
    console.log('=== 2. Table Structure ===');
    const structure = await client.query(`
      SELECT
        column_name,
        data_type,
        character_maximum_length,
        is_nullable,
        column_default
      FROM information_schema.columns
      WHERE table_schema = 'public'
      AND table_name = 'product_collection'
      ORDER BY ordinal_position;
    `);
    console.table(structure.rows);
    console.log();

    // 3. Count records
    console.log('=== 3. Record Count ===');
    const count = await client.query('SELECT COUNT(*) FROM product_collection');
    console.log('Total records:', count.rows[0].count);
    console.log();

    // 4. Get all collections with details
    console.log('=== 4. All Collections ===');
    const collections = await client.query(`
      SELECT
        id,
        title,
        handle,
        created_at,
        updated_at,
        deleted_at,
        metadata
      FROM product_collection
      ORDER BY created_at DESC;
    `);

    if (collections.rows.length > 0) {
      console.table(collections.rows.map(row => ({
        id: row.id,
        title: row.title,
        handle: row.handle,
        created_at: row.created_at?.toISOString().split('T')[0],
        metadata: JSON.stringify(row.metadata)
      })));
    } else {
      console.log('No collections found.');
    }
    console.log();

    // 5. Check for product-collection relationships
    console.log('=== 5. Product-Collection Relationships ===');

    // Check if product_collection_product table exists
    const linkTableExists = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = 'product_collection_product'
      );
    `);

    if (linkTableExists.rows[0].exists) {
      console.log('✓ product_collection_product link table exists');

      const linkCount = await client.query('SELECT COUNT(*) FROM product_collection_product');
      console.log('Total product-collection links:', linkCount.rows[0].count);

      if (parseInt(linkCount.rows[0].count) > 0) {
        console.log();
        console.log('=== Product-Collection Links (sample) ===');
        const links = await client.query(`
          SELECT
            pcp.product_collection_id,
            pcp.product_id,
            pc.title as collection_title,
            pc.handle as collection_handle,
            p.title as product_title,
            p.handle as product_handle,
            p.metadata as product_metadata
          FROM product_collection_product pcp
          LEFT JOIN product_collection pc ON pcp.product_collection_id = pc.id
          LEFT JOIN product p ON pcp.product_id = p.id
          ORDER BY pc.title, p.title
          LIMIT 50;
        `);

        if (links.rows.length > 0) {
          console.table(links.rows.map(row => ({
            collection: row.collection_handle || row.collection_title,
            product: row.product_handle || row.product_title,
            product_metadata: JSON.stringify(row.product_metadata)
          })));
        }
      }
    } else {
      console.log('⚠️  product_collection_product link table does NOT exist');
      console.log('Checking for alternative relationship tables...');

      // Check for other possible relationship tables
      const altTables = await client.query(`
        SELECT table_name
        FROM information_schema.tables
        WHERE table_schema = 'public'
        AND (table_name LIKE '%collection%' OR table_name LIKE '%product%')
        ORDER BY table_name;
      `);
      console.log('\nRelated tables found:');
      altTables.rows.forEach(row => console.log(`  - ${row.table_name}`));
    }
    console.log();

    // 6. Analyze collections by type (tours vs add-ons)
    console.log('=== 6. Collection Analysis (Tours vs Add-ons) ===');
    if (collections.rows.length > 0) {
      const toursCollections = collections.rows.filter(c =>
        c.handle?.includes('tour') || c.title?.toLowerCase().includes('tour')
      );
      const addonsCollections = collections.rows.filter(c =>
        c.handle?.includes('addon') || c.title?.toLowerCase().includes('add') || c.title?.toLowerCase().includes('extra')
      );

      console.log(`Tours-related collections: ${toursCollections.length}`);
      if (toursCollections.length > 0) {
        toursCollections.forEach(c => console.log(`  - ${c.title} (${c.handle})`));
      }

      console.log(`\nAdd-ons-related collections: ${addonsCollections.length}`);
      if (addonsCollections.length > 0) {
        addonsCollections.forEach(c => console.log(`  - ${c.title} (${c.handle})`));
      }

      const otherCollections = collections.rows.filter(c =>
        !toursCollections.includes(c) && !addonsCollections.includes(c)
      );
      console.log(`\nOther collections: ${otherCollections.length}`);
      if (otherCollections.length > 0) {
        otherCollections.forEach(c => console.log(`  - ${c.title} (${c.handle})`));
      }
    }
    console.log();

    // 7. Export SQL queries used
    console.log('=== 7. SQL Queries Used ===');
    console.log('-- Check table existence:');
    console.log(`SELECT EXISTS (
  SELECT FROM information_schema.tables
  WHERE table_schema = 'public' AND table_name = 'product_collection'
);`);
    console.log();

    console.log('-- Get table structure:');
    console.log(`SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'product_collection'
ORDER BY ordinal_position;`);
    console.log();

    console.log('-- Count records:');
    console.log('SELECT COUNT(*) FROM product_collection;');
    console.log();

    console.log('-- Get all collections:');
    console.log(`SELECT id, title, handle, created_at, metadata
FROM product_collection
ORDER BY created_at DESC;`);
    console.log();

    console.log('-- Get product-collection relationships:');
    console.log(`SELECT
  pcp.product_collection_id,
  pcp.product_id,
  pc.title as collection_title,
  p.title as product_title
FROM product_collection_product pcp
LEFT JOIN product_collection pc ON pcp.product_collection_id = pc.id
LEFT JOIN product p ON pcp.product_id = p.id
ORDER BY pc.title, p.title;`);
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
