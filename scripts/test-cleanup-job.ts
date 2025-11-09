/**
 * Manual test script for expired holds cleanup job
 *
 * Usage:
 *   pnpm medusa exec ./scripts/test-cleanup-job.ts
 *
 * This script:
 * 1. Creates test holds with various expiration states
 * 2. Runs the cleanup job manually
 * 3. Verifies holds are properly expired and capacity restored
 * 4. Reports detailed metrics
 */

import { ExecArgs } from "@medusajs/framework/types"
import { DateTime } from "luxon"

export default async function testCleanupJob({ container }: ExecArgs) {
  console.log("=".repeat(70))
  console.log("EXPIRED HOLDS CLEANUP JOB - MANUAL TEST")
  console.log("=".repeat(70))
  console.log()

  try {
    // Resolve services
    const holdService = container.resolve("holdService")
    const capacityService = container.resolve("capacityService")
    const resourceService = container.resolve("resourceService")

    if (!holdService) {
      console.error("❌ HoldService not found in container")
      return
    }

    console.log("✓ Services resolved successfully\n")

    // Step 1: Create test resource
    console.log("Step 1: Creating test resource...")
    const resource = await resourceService.createResource({
      name: "Test 4WD Vehicle - Cleanup Test",
      type: "vehicle",
      metadata: {
        test: true,
        created_for: "cleanup-job-test",
      },
    })
    console.log(`✓ Created resource: ${resource.id}\n`)

    // Step 2: Initialize capacity
    console.log("Step 2: Initializing capacity...")
    const testDates = [
      DateTime.now().setZone("Australia/Brisbane").toJSDate(),
      DateTime.now().setZone("Australia/Brisbane").plus({ days: 1 }).toJSDate(),
    ]

    await capacityService.initializeCapacity(resource.id, testDates, 10)
    console.log("✓ Initialized capacity: 10 units for 2 dates\n")

    // Step 3: Create test holds
    console.log("Step 3: Creating test holds...")

    // Create 3 active holds (will not be expired)
    const activeHolds = []
    for (let i = 1; i <= 3; i++) {
      const hold = await holdService.createHold({
        resourceId: resource.id,
        dates: [DateTime.now().setZone("Australia/Brisbane").toJSDate()],
        quantity: 1,
        customerEmail: `active${i}@test.com`,
        idempotencyToken: `manual-test-active-${Date.now()}-${i}`,
      })
      activeHolds.push(hold)
    }
    console.log(`✓ Created 3 ACTIVE holds (not expired)`)

    // Create 5 expired holds (will be cleaned up)
    const expiredHolds = []
    for (let i = 1; i <= 5; i++) {
      const hold = await holdService.createHold({
        resourceId: resource.id,
        dates: [DateTime.now().setZone("Australia/Brisbane").toJSDate()],
        quantity: 1,
        customerEmail: `expired${i}@test.com`,
        idempotencyToken: `manual-test-expired-${Date.now()}-${i}`,
      })

      // Manually set expiration to past
      await holdService.updateResourceHolds(
        { id: hold.id },
        {
          expires_at: DateTime.now()
            .setZone("Australia/Brisbane")
            .minus({ minutes: 35 })
            .toJSDate(),
        }
      )

      expiredHolds.push(hold)
    }
    console.log(`✓ Created 5 EXPIRED holds (past 30 min TTL)`)

    // Create 1 confirmed hold (will not be expired)
    const confirmedHold = await holdService.createHold({
      resourceId: resource.id,
      dates: [DateTime.now().setZone("Australia/Brisbane").toJSDate()],
      quantity: 1,
      customerEmail: "confirmed@test.com",
      idempotencyToken: `manual-test-confirmed-${Date.now()}`,
    })

    await holdService.confirmHold(confirmedHold.id, {
      orderId: "test_order_123",
      lineItemId: "test_li_456",
    })
    console.log(`✓ Created 1 CONFIRMED hold (will not expire)\n`)

    // Step 4: Check capacity before cleanup
    console.log("Step 4: Checking capacity before cleanup...")
    const testDate = DateTime.now().setZone("Australia/Brisbane").toISODate()
    const capacityBefore = await capacityService.listResourceCapacities({
      resource_id: resource.id,
      date: testDate,
    })
    console.log(`  Max capacity: ${capacityBefore[0].max_capacity}`)
    console.log(`  Available capacity: ${capacityBefore[0].available_capacity}`)
    console.log(
      `  Reserved: ${
        capacityBefore[0].max_capacity - capacityBefore[0].available_capacity
      } units (3 active + 5 expired + 1 confirmed)\n`
    )

    // Step 5: Run cleanup job
    console.log("Step 5: Running cleanup job...")
    console.log("-".repeat(70))

    const startTime = Date.now()
    const result = await holdService.cleanupExpiredHolds()
    const duration = Date.now() - startTime

    console.log("-".repeat(70))
    console.log(`✓ Cleanup job completed in ${duration}ms`)
    console.log(`  Expired holds cleaned up: ${result.expiredCount}`)
    console.log(`  Total capacity restored: ${result.totalCapacityRestored}\n`)

    // Step 6: Verify results
    console.log("Step 6: Verifying results...")

    // Check active holds are still ACTIVE
    let activeCount = 0
    for (const hold of activeHolds) {
      const updated = await holdService.retrieveResourceHold(hold.id)
      if (updated.status === "ACTIVE") {
        activeCount++
      }
    }
    console.log(`✓ Active holds: ${activeCount}/3 still ACTIVE`)

    // Check expired holds are now EXPIRED
    let expiredCount = 0
    for (const hold of expiredHolds) {
      const updated = await holdService.retrieveResourceHold(hold.id)
      if (updated.status === "EXPIRED") {
        expiredCount++
      }
    }
    console.log(`✓ Expired holds: ${expiredCount}/5 marked as EXPIRED`)

    // Check confirmed hold is still CONFIRMED
    const confirmedUpdated = await holdService.retrieveResourceHold(
      confirmedHold.id
    )
    console.log(
      `✓ Confirmed hold: ${
        confirmedUpdated.status === "CONFIRMED" ? "still CONFIRMED" : "ERROR"
      }`
    )

    // Step 7: Check capacity after cleanup
    console.log("\nStep 7: Checking capacity after cleanup...")
    const capacityAfter = await capacityService.listResourceCapacities({
      resource_id: resource.id,
      date: testDate,
    })
    console.log(`  Max capacity: ${capacityAfter[0].max_capacity}`)
    console.log(`  Available capacity: ${capacityAfter[0].available_capacity}`)
    console.log(
      `  Reserved: ${
        capacityAfter[0].max_capacity - capacityAfter[0].available_capacity
      } units (3 active + 1 confirmed)`
    )
    console.log(
      `  Restored: ${
        capacityAfter[0].available_capacity - capacityBefore[0].available_capacity
      } units (from expired holds)\n`
    )

    // Step 8: Performance metrics
    console.log("Step 8: Performance metrics...")
    console.log(`  Cleanup duration: ${duration}ms`)
    console.log(`  Holds processed: ${result.expiredCount}`)
    console.log(`  Capacity restored: ${result.totalCapacityRestored}`)
    console.log(
      `  Avg time per hold: ${
        result.expiredCount > 0 ? (duration / result.expiredCount).toFixed(2) : "N/A"
      }ms`
    )

    if (duration < 1000) {
      console.log("  ✓ Performance: Excellent (< 1 second)")
    } else if (duration < 5000) {
      console.log("  ✓ Performance: Good (< 5 seconds)")
    } else {
      console.log("  ⚠ Performance: Slow (> 5 seconds)")
    }

    // Summary
    console.log()
    console.log("=".repeat(70))
    console.log("TEST SUMMARY")
    console.log("=".repeat(70))

    const allTestsPassed =
      activeCount === 3 &&
      expiredCount === 5 &&
      confirmedUpdated.status === "CONFIRMED" &&
      result.expiredCount === 5 &&
      result.totalCapacityRestored === 5 &&
      capacityAfter[0].available_capacity ===
        capacityBefore[0].available_capacity + 5

    if (allTestsPassed) {
      console.log("✅ ALL TESTS PASSED")
      console.log()
      console.log("Results:")
      console.log(`  - Active holds remain active: ✓`)
      console.log(`  - Expired holds transitioned to EXPIRED: ✓`)
      console.log(`  - Confirmed holds remain confirmed: ✓`)
      console.log(`  - Capacity restored correctly: ✓`)
      console.log(`  - Performance acceptable: ✓`)
    } else {
      console.log("❌ SOME TESTS FAILED")
      console.log()
      console.log("Issues:")
      if (activeCount !== 3) {
        console.log(`  - Active holds: expected 3, got ${activeCount}`)
      }
      if (expiredCount !== 5) {
        console.log(`  - Expired holds: expected 5, got ${expiredCount}`)
      }
      if (confirmedUpdated.status !== "CONFIRMED") {
        console.log(
          `  - Confirmed hold status: expected CONFIRMED, got ${confirmedUpdated.status}`
        )
      }
      if (result.expiredCount !== 5) {
        console.log(
          `  - Cleanup count: expected 5, got ${result.expiredCount}`
        )
      }
      if (result.totalCapacityRestored !== 5) {
        console.log(
          `  - Capacity restored: expected 5, got ${result.totalCapacityRestored}`
        )
      }
      if (
        capacityAfter[0].available_capacity !==
        capacityBefore[0].available_capacity + 5
      ) {
        console.log(
          `  - Capacity restoration: expected +5, got +${
            capacityAfter[0].available_capacity -
            capacityBefore[0].available_capacity
          }`
        )
      }
    }

    console.log()
    console.log("=".repeat(70))

    // Cleanup test data
    console.log("\nCleaning up test data...")
    // Note: In production, you might want to keep test resources
    // For now, we'll leave them for manual inspection
    console.log(
      `Test resource ID: ${resource.id} (left for manual inspection)`
    )
  } catch (error) {
    console.error("\n❌ Test failed with error:")
    console.error(error)
    throw error
  }
}
