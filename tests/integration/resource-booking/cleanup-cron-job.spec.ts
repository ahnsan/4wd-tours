/**
 * Integration tests for expired holds cleanup cron job
 *
 * Tests the scheduled job that runs every 5 minutes to:
 * - Find ACTIVE holds past 30-minute TTL
 * - Transition status: ACTIVE → EXPIRED
 * - Restore available_capacity for each expired hold
 *
 * Performance target: Process 100+ holds in < 5 seconds
 */

import { medusaIntegrationTestRunner } from "@medusajs/test-utils"
import { MedusaContainer } from "@medusajs/framework/types"
import cleanupExpiredHoldsJob from "../../../src/jobs/cleanup-expired-holds"
import { DateTime } from "luxon"

jest.setTimeout(60 * 1000) // 1 minute for integration tests

medusaIntegrationTestRunner({
  inApp: true,
  env: {},
  testSuite: ({ getContainer }) => {
    let container: MedusaContainer
    let holdService: any
    let capacityService: any
    let resourceService: any

    // Test data
    let testResourceId: string

    beforeAll(async () => {
      container = getContainer()

      // Resolve services from container
      // Note: These may need adjustment based on actual module registration
      holdService = container.resolve("holdService")
      capacityService = container.resolve("capacityService")
      resourceService = container.resolve("resourceService")

      // Create a test resource
      const resource = await resourceService.createResource({
        name: "Test 4WD Vehicle",
        type: "vehicle",
        metadata: {
          test: true,
        },
      })
      testResourceId = resource.id

      // Initialize capacity for test dates
      const testDates = [
        DateTime.now().setZone("Australia/Brisbane").toJSDate(),
        DateTime.now()
          .setZone("Australia/Brisbane")
          .plus({ days: 1 })
          .toJSDate(),
      ]

      await capacityService.initializeCapacity(testResourceId, testDates, 10)
    })

    describe("Expired Holds Cleanup Cron Job", () => {
      describe("Basic cleanup functionality", () => {
        it("should expire holds past 30 minutes", async () => {
          // Create a hold with past expiration
          const expiredDate = DateTime.now()
            .setZone("Australia/Brisbane")
            .minus({ minutes: 31 })
            .toJSDate()

          const hold = await holdService.createHold({
            resourceId: testResourceId,
            dates: [DateTime.now().setZone("Australia/Brisbane").toJSDate()],
            quantity: 2,
            customerEmail: "test@example.com",
            idempotencyToken: `test-expired-${Date.now()}`,
          })

          // Manually update expiration to past (simulating expired hold)
          await holdService.updateResourceHolds(
            { id: hold.id },
            { expires_at: expiredDate }
          )

          // Get capacity before cleanup
          const testDate = DateTime.now()
            .setZone("Australia/Brisbane")
            .toISODate()
          const capacityBefore = await capacityService.listResourceCapacities({
            resource_id: testResourceId,
            date: testDate,
          })

          // Run cleanup job
          await cleanupExpiredHoldsJob(container)

          // Note: The job itself logs metrics but doesn't return a value

          // Verify hold status changed to EXPIRED
          const updatedHold = await holdService.retrieveResourceHold(hold.id)
          expect(updatedHold.status).toBe("EXPIRED")

          // Verify capacity was restored
          const capacityAfter = await capacityService.listResourceCapacities({
            resource_id: testResourceId,
            date: testDate,
          })

          expect(capacityAfter[0].available_capacity).toBe(
            capacityBefore[0].available_capacity + hold.quantity
          )
        })

        it("should not expire active holds within 30 minutes", async () => {
          // Create a fresh hold (not expired)
          const hold = await holdService.createHold({
            resourceId: testResourceId,
            dates: [DateTime.now().setZone("Australia/Brisbane").toJSDate()],
            quantity: 1,
            customerEmail: "test@example.com",
            idempotencyToken: `test-active-${Date.now()}`,
          })

          // Run cleanup
          await cleanupExpiredHoldsJob(container)

          // Verify hold is still ACTIVE
          const updatedHold = await holdService.retrieveResourceHold(hold.id)
          expect(updatedHold.status).toBe("ACTIVE")
        })

        it("should skip already expired holds", async () => {
          // Create hold and manually expire it
          const hold = await holdService.createHold({
            resourceId: testResourceId,
            dates: [DateTime.now().setZone("Australia/Brisbane").toJSDate()],
            quantity: 1,
            customerEmail: "test@example.com",
            idempotencyToken: `test-already-expired-${Date.now()}`,
          })

          await holdService.updateResourceHolds(
            { id: hold.id },
            { status: "EXPIRED" }
          )

          // Run cleanup
          await cleanupExpiredHoldsJob(container)

          // Verify hold remains EXPIRED (not processed again)
          const updatedHold = await holdService.retrieveResourceHold(hold.id)
          expect(updatedHold.status).toBe("EXPIRED")
        })

        it("should skip confirmed holds even if past expiration", async () => {
          // Create hold, confirm it, then simulate past expiration
          const hold = await holdService.createHold({
            resourceId: testResourceId,
            dates: [DateTime.now().setZone("Australia/Brisbane").toJSDate()],
            quantity: 1,
            customerEmail: "test@example.com",
            idempotencyToken: `test-confirmed-${Date.now()}`,
          })

          // Confirm the hold
          await holdService.confirmHold(hold.id, {
            orderId: "order_test",
            lineItemId: "li_test",
          })

          // Simulate past expiration
          const expiredDate = DateTime.now()
            .setZone("Australia/Brisbane")
            .minus({ minutes: 31 })
            .toJSDate()

          await holdService.updateResourceHolds(
            { id: hold.id },
            { expires_at: expiredDate }
          )

          // Run cleanup
          await cleanupExpiredHoldsJob(container)

          // Verify hold remains CONFIRMED (not expired)
          const updatedHold = await holdService.retrieveResourceHold(hold.id)
          expect(updatedHold.status).toBe("CONFIRMED")
        })
      })

      describe("Batch cleanup efficiency", () => {
        it("should handle batch cleanup efficiently", async () => {
          // Create 50 expired holds
          const expiredDate = DateTime.now()
            .setZone("Australia/Brisbane")
            .minus({ minutes: 31 })
            .toJSDate()

          const holds = await Promise.all(
            Array(50)
              .fill(null)
              .map(async (_, i) => {
                const hold = await holdService.createHold({
                  resourceId: testResourceId,
                  dates: [
                    DateTime.now().setZone("Australia/Brisbane").toJSDate(),
                  ],
                  quantity: 1,
                  customerEmail: `customer${i}@test.com`,
                  idempotencyToken: `batch-test-${Date.now()}-${i}`,
                })

                // Mark as expired
                await holdService.updateResourceHolds(
                  { id: hold.id },
                  { expires_at: expiredDate }
                )

                return hold
              })
          )

          const startTime = Date.now()
          await cleanupExpiredHoldsJob(container)
          const duration = Date.now() - startTime

          // Should complete in < 5 seconds
          expect(duration).toBeLessThan(5000)

          // Verify all holds expired
          for (const hold of holds) {
            const updated = await holdService.retrieveResourceHold(hold.id)
            expect(updated.status).toBe("EXPIRED")
          }
        }, 10000) // 10 second timeout for this test
      })

      describe("Error handling", () => {
        it("should handle job execution without throwing", async () => {
          // Job should not throw errors even if no expired holds
          await expect(cleanupExpiredHoldsJob(container)).resolves.not.toThrow()
        })

        it("should continue processing if individual hold fails", async () => {
          // Create valid expired hold
          const validHold = await holdService.createHold({
            resourceId: testResourceId,
            dates: [DateTime.now().setZone("Australia/Brisbane").toJSDate()],
            quantity: 1,
            customerEmail: "valid@test.com",
            idempotencyToken: `valid-hold-${Date.now()}`,
          })

          const expiredDate = DateTime.now()
            .setZone("Australia/Brisbane")
            .minus({ minutes: 31 })
            .toJSDate()

          await holdService.updateResourceHolds(
            { id: validHold.id },
            { expires_at: expiredDate }
          )

          // Create invalid hold (with non-existent resource)
          const invalidHold = await holdService.createHold({
            resourceId: testResourceId,
            dates: [DateTime.now().setZone("Australia/Brisbane").toJSDate()],
            quantity: 1,
            customerEmail: "invalid@test.com",
            idempotencyToken: `invalid-hold-${Date.now()}`,
          })

          // Update to have invalid resource_id
          await holdService.updateResourceHolds(
            { id: invalidHold.id },
            {
              resource_id: "invalid-resource-id",
              expires_at: expiredDate,
            }
          )

          // Run cleanup (should handle error gracefully)
          await cleanupExpiredHoldsJob(container)

          // Valid hold should still be expired
          const validUpdated = await holdService.retrieveResourceHold(
            validHold.id
          )
          expect(validUpdated.status).toBe("EXPIRED")
        })
      })

      describe("Capacity restoration", () => {
        it("should restore full capacity for multiple expired holds", async () => {
          const testDate = DateTime.now()
            .setZone("Australia/Brisbane")
            .toISODate()

          // Get initial capacity
          const capacityBefore = await capacityService.listResourceCapacities({
            resource_id: testResourceId,
            date: testDate,
          })
          const initialAvailable = capacityBefore[0].available_capacity

          // Create 3 holds with 2 units each
          const holds = await Promise.all(
            [1, 2, 3].map(async (i) => {
              const hold = await holdService.createHold({
                resourceId: testResourceId,
                dates: [DateTime.now().setZone("Australia/Brisbane").toJSDate()],
                quantity: 2,
                customerEmail: `customer${i}@test.com`,
                idempotencyToken: `capacity-test-${Date.now()}-${i}`,
              })

              // Mark as expired
              await holdService.updateResourceHolds(
                { id: hold.id },
                {
                  expires_at: DateTime.now()
                    .setZone("Australia/Brisbane")
                    .minus({ minutes: 31 })
                    .toJSDate(),
                }
              )

              return hold
            })
          )

          // Capacity should be reduced by 6 (3 holds × 2 quantity)
          const capacityDuring = await capacityService.listResourceCapacities({
            resource_id: testResourceId,
            date: testDate,
          })
          // Note: Holds already reserved capacity when created

          // Run cleanup
          await cleanupExpiredHoldsJob(container)

          // Capacity should be restored
          const capacityAfter = await capacityService.listResourceCapacities({
            resource_id: testResourceId,
            date: testDate,
          })

          // Should have restored 6 units total
          expect(capacityAfter[0].available_capacity).toBe(
            capacityDuring[0].available_capacity + 6
          )
        })
      })

      describe("Idempotency", () => {
        it("should be safe to run multiple times", async () => {
          // Create expired hold
          const hold = await holdService.createHold({
            resourceId: testResourceId,
            dates: [DateTime.now().setZone("Australia/Brisbane").toJSDate()],
            quantity: 1,
            customerEmail: "idempotent@test.com",
            idempotencyToken: `idempotent-${Date.now()}`,
          })

          await holdService.updateResourceHolds(
            { id: hold.id },
            {
              expires_at: DateTime.now()
                .setZone("Australia/Brisbane")
                .minus({ minutes: 31 })
                .toJSDate(),
            }
          )

          // Run cleanup multiple times
          await cleanupExpiredHoldsJob(container)
          await cleanupExpiredHoldsJob(container)
          await cleanupExpiredHoldsJob(container)

          // Hold should only be expired once
          const updated = await holdService.retrieveResourceHold(hold.id)
          expect(updated.status).toBe("EXPIRED")
        })
      })
    })
  },
})
