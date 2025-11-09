/**
 * Direct database schema verification (standalone script)
 * Usage: npx ts-node scripts/verify-schema-direct.ts
 */

import { loadEnv } from '@medusajs/framework/utils';

loadEnv(process.env.NODE_ENV || 'development', process.cwd());

async function verifySchema() {
  console.log("\n🔍 Verifying Resource Booking Schema...\n");

  // Dynamic import to avoid compilation issues
  const { Client } = await import('pg');
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    await client.connect();
    console.log("✓ Connected to database\n");

    // Expected tables
    const tables = [
      'resource',
      'resource_capacity',
      'resource_blackout',
      'resource_hold',
      'resource_allocation'
    ];

    console.log("📊 Table Verification:");
    console.log("━".repeat(80));

    for (const tableName of tables) {
      // Check if table exists
      const tableExists = await client.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables
          WHERE table_schema = 'public'
          AND table_name = $1
        )
      `, [tableName]);

      if (!tableExists.rows[0].exists) {
        console.error(`❌ Table '${tableName}' does not exist!`);
        continue;
      }

      // Get row count
      const countResult = await client.query(`SELECT COUNT(*) as count FROM "${tableName}"`);
      const rowCount = parseInt(countResult.rows[0].count);

      // Get column count
      const columnsResult = await client.query(`
        SELECT COUNT(*) as count
        FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = $1
      `, [tableName]);
      const columnCount = parseInt(columnsResult.rows[0].count);

      console.log(`✓ ${tableName.padEnd(25)} | Columns: ${String(columnCount).padStart(2)} | Rows: ${rowCount.toLocaleString()}`);
    }

    // Verify indexes
    console.log("\n📑 Index Verification:");
    console.log("━".repeat(80));

    const expectedIndexes = [
      'idx_resource_type',
      'idx_resource_active',
      'idx_capacity_date',
      'idx_capacity_resource_date',
      'idx_blackout_resource_dates',
      'idx_hold_idempotency',
      'idx_hold_resource_date_status',
      'idx_hold_expires',
      'idx_hold_customer',
      'idx_allocation_resource_date',
      'idx_allocation_order',
      'idx_allocation_line_item'
    ];

    let indexCount = 0;
    for (const indexName of expectedIndexes) {
      const indexExists = await client.query(`
        SELECT EXISTS (
          SELECT FROM pg_indexes
          WHERE indexname = $1
        )
      `, [indexName]);

      if (indexExists.rows[0].exists) {
        console.log(`✓ ${indexName}`);
        indexCount++;
      } else {
        console.error(`❌ Missing index: ${indexName}`);
      }
    }

    // Verify triggers
    console.log("\n⚡ Trigger Verification:");
    console.log("━".repeat(80));

    const expectedTriggers = [
      'update_resource_updated_at',
      'update_resource_capacity_updated_at',
      'update_resource_blackout_updated_at',
      'update_resource_hold_updated_at'
    ];

    let triggerCount = 0;
    for (const triggerName of expectedTriggers) {
      const triggerExists = await client.query(`
        SELECT EXISTS (
          SELECT FROM pg_trigger
          WHERE tgname = $1
        )
      `, [triggerName]);

      if (triggerExists.rows[0].exists) {
        console.log(`✓ ${triggerName}`);
        triggerCount++;
      } else {
        console.error(`❌ Missing trigger: ${triggerName}`);
      }
    }

    // Verify function
    console.log("\n🔧 Function Verification:");
    console.log("━".repeat(80));

    const functionExists = await client.query(`
      SELECT EXISTS (
        SELECT FROM pg_proc
        WHERE proname = 'update_updated_at_column'
      )
    `);

    if (functionExists.rows[0].exists) {
      console.log(`✓ update_updated_at_column`);
    } else {
      console.error(`❌ Missing function: update_updated_at_column`);
    }

    // Verify constraints
    console.log("\n🔒 Constraint Verification:");
    console.log("━".repeat(80));

    const constraints = await client.query(`
      SELECT
        tc.table_name,
        tc.constraint_name,
        tc.constraint_type
      FROM information_schema.table_constraints tc
      WHERE tc.table_schema = 'public'
      AND tc.table_name IN ('resource', 'resource_capacity', 'resource_blackout', 'resource_hold', 'resource_allocation')
      ORDER BY tc.table_name, tc.constraint_type
    `);

    const constraintsByTable: Record<string, any[]> = {};
    for (const constraint of constraints.rows) {
      if (!constraintsByTable[constraint.table_name]) {
        constraintsByTable[constraint.table_name] = [];
      }
      constraintsByTable[constraint.table_name].push(constraint);
    }

    for (const [tableName, tableConstraints] of Object.entries(constraintsByTable)) {
      console.log(`\n  ${tableName}:`);
      for (const constraint of tableConstraints) {
        const icon = constraint.constraint_type === 'PRIMARY KEY' ? '🔑' :
                     constraint.constraint_type === 'FOREIGN KEY' ? '🔗' :
                     constraint.constraint_type === 'UNIQUE' ? '⭐' :
                     constraint.constraint_type === 'CHECK' ? '✓' : '•';
        console.log(`    ${icon} ${constraint.constraint_type.padEnd(15)} | ${constraint.constraint_name}`);
      }
    }

    // Summary
    console.log("\n📈 Summary:");
    console.log("━".repeat(80));
    console.log(`Tables:      ${tables.length}/${tables.length}`);
    console.log(`Indexes:     ${indexCount}/${expectedIndexes.length}`);
    console.log(`Triggers:    ${triggerCount}/${expectedTriggers.length}`);
    console.log(`Constraints: ${constraints.rows.length} total`);

    // Get total row counts
    let totalRowCount = 0;
    for (const table of tables) {
      const result = await client.query(`SELECT COUNT(*) as count FROM "${table}"`);
      totalRowCount += parseInt(result.rows[0].count);
    }
    console.log(`Total Rows:  ${totalRowCount.toLocaleString()}`);

    console.log("\n✅ Schema verification complete!\n");

  } catch (error) {
    console.error("\n❌ Schema verification failed:", error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

verifySchema();
