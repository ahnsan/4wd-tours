#!/usr/bin/env node

/**
 * Script to investigate product pricing structure
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

    // 1. Get product variants with pricing
    console.log('=== 1. Product Variants and Pricing ===');
    const variants = await client.query(`
      SELECT
        pv.id,
        pv.product_id,
        pv.title,
        pv.sku,
        p.title as product_title,
        p.handle as product_handle,
        pc.title as collection_title
      FROM product_variant pv
      LEFT JOIN product p ON pv.product_id = p.id
      LEFT JOIN product_collection pc ON p.collection_id = pc.id
      WHERE p.deleted_at IS NULL
      ORDER BY pc.title, p.title
      LIMIT 50;
    `);

    console.log(`Total variants: ${variants.rows.length}`);
    console.table(variants.rows.map(row => ({
      product: row.product_title,
      collection: row.collection_title,
      variant: row.title,
      sku: row.sku
    })));
    console.log();

    // 2. Get price information from price_set tables
    console.log('=== 2. Price Set Structure ===');

    // Check what price-related tables exist
    const priceTables = await client.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_name LIKE '%price%'
      ORDER BY table_name;
    `);

    console.log('Price-related tables:');
    priceTables.rows.forEach(row => console.log(`  - ${row.table_name}`));
    console.log();

    // 3. Get actual prices from price table if it exists
    const priceTableExists = priceTables.rows.some(row => row.table_name === 'price');

    if (priceTableExists) {
      console.log('=== 3. Product Prices ===');
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
        LEFT JOIN product_variant_price_set pvps ON pr.price_set_id = pvps.price_set_id
        LEFT JOIN product_variant pv ON pvps.product_variant_id = pv.id
        LEFT JOIN product p ON pv.product_id = p.id
        LEFT JOIN product_collection pc ON p.collection_id = pc.id
        WHERE pr.currency_code = 'usd'
        ORDER BY pc.title, p.title
        LIMIT 100;
      `);

      console.log(`\nPrices found: ${prices.rows.length}`);
      if (prices.rows.length > 0) {
        console.table(prices.rows.map(row => ({
          collection: row.collection_title,
          product: row.product_title,
          variant: row.variant_title,
          amount_dollars: (row.amount || 0),
          currency: row.currency_code
        })));
      }
    }
    console.log();

    // 4. Sample pricing by collection
    if (priceTableExists) {
      console.log('=== 4. Pricing Summary by Collection ===');
      const pricingSummary = await client.query(`
        SELECT
          pc.title as collection_title,
          pc.handle as collection_handle,
          COUNT(DISTINCT p.id) as product_count,
          MIN(pr.amount) as min_price,
          MAX(pr.amount) as max_price,
          AVG(pr.amount)::numeric(10,2) as avg_price
        FROM product_collection pc
        LEFT JOIN product p ON p.collection_id = pc.id AND p.deleted_at IS NULL
        LEFT JOIN product_variant pv ON pv.product_id = p.id
        LEFT JOIN product_variant_price_set pvps ON pvps.product_variant_id = pv.id
        LEFT JOIN price pr ON pr.price_set_id = pvps.price_set_id AND pr.currency_code = 'usd'
        GROUP BY pc.id, pc.title, pc.handle
        ORDER BY pc.title;
      `);

      console.table(pricingSummary.rows.map(row => ({
        collection: row.collection_title,
        products: row.product_count,
        min_price_usd: row.min_price || 0,
        max_price_usd: row.max_price || 0,
        avg_price_usd: parseFloat(row.avg_price) || 0
      })));
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await client.end();
    console.log('\n✓ Database connection closed');
  }
}

investigate();
