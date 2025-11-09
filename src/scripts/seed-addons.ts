import { ExecArgs } from "@medusajs/framework/types";
import { seedTours } from "../modules/seeding/tour-seed";

/**
 * Seed script specifically for adding comprehensive add-on products
 * This will create all 18 add-ons across 5 categories
 */
export default async function seedAddOns({ container }: ExecArgs) {
  console.log("🌱 Starting comprehensive add-ons seeding...\n");

  try {
    // Use the existing seedTours function which handles both tours and add-ons
    await seedTours(container);

    console.log("\n✅ Add-ons seeding completed successfully!");
  } catch (error) {
    console.error("\n❌ Add-ons seeding failed:", error);
    throw error;
  }
}
