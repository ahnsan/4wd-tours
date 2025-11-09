/**
 * Direct database seeding script for resource booking system
 * Usage: npx ts-node scripts/seed-resources-direct.ts
 *
 * This is a standalone script that doesn't require Medusa services.
 * It will be replaced by seed-resources.ts once Backend Agent implements services.
 */

import { loadEnv } from '@medusajs/framework/utils';

loadEnv(process.env.NODE_ENV || 'development', process.cwd());

async function seedResources() {
  console.log("\n🌱 Starting resource booking seeding...\n");

  // Dynamic import to avoid compilation issues
  const { Client } = await import('pg');
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    await client.connect();
    console.log("✓ Connected to database\n");

    // Create vehicles
    const vehicles = [
      {
        type: 'VEHICLE',
        name: '4WD Cruiser #1',
        description: '4WD Cruiser #1 - Seats 4 passengers',
        max_capacity: 4
      },
      {
        type: 'VEHICLE',
        name: '4WD Cruiser #2',
        description: '4WD Cruiser #2 - Seats 4 passengers',
        max_capacity: 4
      },
      {
        type: 'VEHICLE',
        name: '4WD Cruiser #3',
        description: '4WD Cruiser #3 - Seats 6 passengers',
        max_capacity: 6
      },
    ];

    const createdResources = [];

    for (const vehicle of vehicles) {
      // Check if resource already exists
      const existingCheck = await client.query(`
        SELECT id, name FROM resource WHERE name = $1
      `, [vehicle.name]);

      let resource;
      if (existingCheck.rows.length > 0) {
        resource = existingCheck.rows[0];
        console.log(`⚠ Resource already exists: ${resource.name} (ID: ${resource.id})`);
        createdResources.push(resource);
        continue;
      }

      // Insert resource
      const resourceResult = await client.query(`
        INSERT INTO resource (type, name, description, metadata, is_active, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
        RETURNING id, name
      `, [
        vehicle.type,
        vehicle.name,
        vehicle.description,
        JSON.stringify({ seats: vehicle.max_capacity }),
        true
      ]);

      resource = resourceResult.rows[0];
      createdResources.push(resource);

      console.log(`✓ Created ${resource.name} (ID: ${resource.id})`);

      // Initialize capacity for next 90 days
      const startDate = new Date();
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + 90);

      const dates = generateDateRange(startDate, endDate);
      let capacityCount = 0;
      let skippedCount = 0;

      for (const date of dates) {
        const result = await client.query(`
          INSERT INTO resource_capacity (resource_id, date, max_capacity, available_capacity, created_at, updated_at)
          VALUES ($1, $2, $3, $4, NOW(), NOW())
          ON CONFLICT (resource_id, date) DO NOTHING
          RETURNING id
        `, [resource.id, date, 1, 1]); // Each vehicle is 1 unit

        if (result.rows.length > 0) {
          capacityCount++;
        } else {
          skippedCount++;
        }
      }

      console.log(`  ↳ Initialized ${capacityCount} days of capacity (${skippedCount} already existed)`);
    }

    console.log(`\n✅ Resource seeding complete!`);
    console.log(`   Processed ${createdResources.length} resources`);
    console.log(`   Initialized 90 days of capacity for each resource\n`);

    // Show summary
    const summaryResult = await client.query(`
      SELECT
        r.name,
        r.type,
        COUNT(rc.id) as capacity_days,
        SUM(rc.available_capacity) as total_available
      FROM resource r
      LEFT JOIN resource_capacity rc ON rc.resource_id = r.id
      WHERE r.type = 'VEHICLE'
      GROUP BY r.id, r.name, r.type
      ORDER BY r.name
    `);

    console.log("📊 Current Resource Summary:");
    console.log("━".repeat(80));
    for (const row of summaryResult.rows) {
      console.log(`${row.name.padEnd(20)} | Days: ${String(row.capacity_days).padStart(3)} | Available: ${row.total_available}`);
    }
    console.log("━".repeat(80));
    console.log("");

  } catch (error) {
    console.error("\n❌ Resource seeding failed:", error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

/**
 * Generate array of date strings between start and end dates
 */
function generateDateRange(start: Date, end: Date): string[] {
  const dates: string[] = [];
  const current = new Date(start);

  // Normalize to start of day
  current.setHours(0, 0, 0, 0);
  const endNormalized = new Date(end);
  endNormalized.setHours(0, 0, 0, 0);

  while (current <= endNormalized) {
    dates.push(current.toISOString().split('T')[0]);
    current.setDate(current.getDate() + 1);
  }

  return dates;
}

seedResources();
