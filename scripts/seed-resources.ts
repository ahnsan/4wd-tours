/**
 * Seed script for resource booking system
 * Usage: npx medusa exec ./scripts/seed-resources.ts
 *
 * NOTE: This script creates initial resources and capacity.
 * It will be replaced/enhanced by the Backend Agent's service layer.
 */

import { ExecArgs } from "@medusajs/framework/types";
import { Modules } from "@medusajs/framework/utils";

export default async function seedResources({ container }: ExecArgs) {
  console.log("\n🌱 Starting resource booking seeding...\n");

  try {
    // Get database connection through product module
    const productModule = container.resolve(Modules.PRODUCT);
    const manager = (productModule as any).__container__.resolve("manager");

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
      // Insert resource
      const resourceResult = await manager.execute(`
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

      const resource = resourceResult.rows ? resourceResult.rows[0] : resourceResult[0];
      createdResources.push(resource);

      console.log(`✓ Created ${resource.name} (ID: ${resource.id})`);

      // Initialize capacity for next 90 days
      const startDate = new Date();
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + 90);

      const dates = generateDateRange(startDate, endDate);
      let capacityCount = 0;

      for (const date of dates) {
        await manager.execute(`
          INSERT INTO resource_capacity (resource_id, date, max_capacity, available_capacity, created_at, updated_at)
          VALUES ($1, $2, $3, $4, NOW(), NOW())
          ON CONFLICT (resource_id, date) DO NOTHING
        `, [resource.id, date, 1, 1]); // Each vehicle is 1 unit
        capacityCount++;
      }

      console.log(`  ↳ Initialized ${capacityCount} days of capacity`);
    }

    console.log(`\n✅ Resource seeding complete!`);
    console.log(`   Created ${createdResources.length} resources`);
    console.log(`   Initialized 90 days of capacity for each resource\n`);

  } catch (error) {
    console.error("\n❌ Resource seeding failed:", error);
    throw error;
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
