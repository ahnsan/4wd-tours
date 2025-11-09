/**
 * Medusa exec seed script for tour products and add-ons
 * Usage: pnpm medusa exec ./scripts/seed-tours.ts
 */

import { ExecArgs } from "@medusajs/framework/types"
import { seedTours } from "../src/modules/seeding/tour-seed"

export default async function seedToursExec({ container }: ExecArgs) {
  console.log("Starting tour seeding via Medusa exec...")

  try {
    await seedTours(container)
    console.log("✓ Tour seed script completed successfully\n")
  } catch (error) {
    console.error("✗ Tour seed script failed:", error)
    throw error
  }
}
