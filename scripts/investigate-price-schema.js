#!/usr/bin/env node

/**
 * Script to investigate price schema structure in Medusa v2
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

    // 1. Check product_variant_price_set structure
    console.log('=== 1. product_variant_price_set Table Structure ===');
    const pvpsStructure = await client.query(`
      SELECT
        column_name,
        data_type,
        is_nullable
      FROM information_schema.columns
      WHERE table_schema = 'public'
      AND table_name = 'product_variant_price_set'
      ORDER BY ordinal_position;
    `);
    console.table(pvpsStructure.rows);
    console.log();

    // 2. Check price table structure
    console.log('=== 2. price Table Structure ===');
    const priceStructure = await client.query(`
      SELECT
        column_name,
        data_type,
        is_nullable
      FROM information_schema.columns
      WHERE table_schema = 'public'
      AND table_name = 'price'
      ORDER BY ordinal_position;
    `);
    console.table(priceStructure.rows);
    console.log();

    // 3. Sample data from product_variant_price_set
    console.log('=== 3. Sample product_variant_price_set Data ===');
    const pvpsData = await client.query(`
      SELECT * FROM product_variant_price_set LIMIT 5;
    `);
    console.table(pvpsData.rows);
    console.log();

    // 4. Sample data from price table
    console.log('=== 4. Sample price Data ===');
    const priceData = await client.query(`
      SELECT * FROM price LIMIT 10;
    `);
    console.table(priceData.rows);
    console.log();

    // 5. Try to join correctly based on actual schema
    console.log('=== 5. Product Prices (Corrected Query) ===');
    const prices = await client.query(`
      SELECT
        pr.id,
        pr.amount,
        pr.currency_code,
        pr.price_set_id,
        pv.title as variant_title,
        p.title as product_title,
        p.handle as product_handle,
        pc.title as collection_title
      FROM price pr
      LEFT JOIN product_variant_price_set pvps ON pr.price_set_id = pvps.id
      LEFT JOIN product_variant pv ON pvps.variant_id = pv.id
      LEFT JOIN product p ON pv.product_id = p.id
      LEFT JOIN product_collection pc ON p.collection_id = pc.id
      WHERE pr.currency_code = 'usd'
      ORDER BY pc.title, p.title;
    `);

    console.log(`Total prices: ${prices.rows.length}`);
    if (prices.rows.length > 0) {
      console.table(prices.rows.map(row => ({
        collection: row.collection_title,
        product: row.product_title,
        variant: row.variant_title,
        amount_usd: row.amount,
        currency: row.currency_code
      })));
    }
    console.log();

    // 6. Pricing summary
    console.log('=== 6. Pricing Summary by Collection ===');
    const summary = await client.query(`
      SELECT
        pc.title as collection_title,
        pc.handle as collection_handle,
        COUNT(DISTINCT p.id) as product_count,
        MIN(pr.amount) as min_price,
        MAX(pr.amount) as max_price,
        ROUND(AVG(pr.amount)::numeric, 2) as avg_price
      FROM product_collection pc
      LEFT JOIN product p ON p.collection_id = pc.id AND p.deleted_at IS NULL
      LEFT JOIN product_variant pv ON pv.product_id = p.id
      LEFT JOIN product_variant_price_set pvps ON pvps.variant_id = pv.id
      LEFT JOIN price pr ON pr.price_set_id = pvps.id AND pr.currency_code = 'usd'
      GROUP BY pc.id, pc.title, pc.handle
      ORDER BY pc.title;
    `);

    console.table(summary.rows.map(row => ({
      collection: row.collection_title,
      handle: row.collection_handle,
      product_count: row.product_count,
      min_price_usd: row.min_price || 0,
      max_price_usd: row.max_price || 0,
      avg_price_usd: parseFloat(row.avg_price) || 0
    })));
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
