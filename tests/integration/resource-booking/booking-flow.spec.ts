/**
 * Integration tests for complete booking flows
 * Tests end-to-end scenarios from availability check to confirmed booking
 */

import { medusaIntegrationTestRunner } from "@medusajs/test-utils"
import {
  createTestResourceData,
  createTestHoldData,
  createMockOrderData,
  createExpiredHoldData,
  generateDateRange,
  getFutureDate,
  cleanupResourceBookingData,
  generateIdempotencyToken,
  waitForExpiration,
} from "../../utils/resource-booking-helpers"

jest.setTimeout(120000) // 2 minutes for integration tests

medusaIntegrationTestRunner({
  testSuite: ({ getContainer }) => {
    describe("Booking Flow Integration", () => {
      let container: any
      let resourceService: any
      let capacityService: any
      let holdService: any
      let testResource: any

      beforeEach(async () => {
        container = getContainer()
        resourceService = container.resolve("resourceService")
        capacityService = container.resolve("capacityService")
        holdService = container.resolve("holdService")

        // Create test resource
        testResource = await resourceService.createResources(
          createTestResourceData({
            name: "Fraser Island 4WD - Vehicle 1",
            type: "VEHICLE",
          })
        )

        // Initialize capacity for 30 days
        const dates = generateDateRange(getFutureDate(1), 30)
        await capacityService.initializeCapacity(testResource.id, dates, 10)
      })

      afterEach(async () => {
        await cleanupResourceBookingData(container)
      })

      describe("Complete successful booking flow", () => {
        it("should complete full booking cycle from availability to confirmation", async () => {
          const bookingDates = [getFutureDate(5), getFutureDate(6), getFutureDate(7)]
          const quantity = 2

          // STEP 1: Check availability
          const availability = await capacityService.checkAvailability(
            testResource.id,
            bookingDates,
            quantity
          )

          expect(availability.length).toBe(3)
          expect(availability.every((a) => a.available === true)).toBe(true)

          // Get initial capacity
          const initialCapacity = await capacityService.listResourceCapacities({
            resource_id: testResource.id,
            date: bookingDates[0],
          })
          const originalCapacity = initialCapacity[0].available_capacity

          // STEP 2: Create hold
          const hold = await holdService.createHold({
            resourceId: testResource.id,
            dates: bookingDates,
            quantity,
            customerEmail: "customer@test.com",
            idempotencyToken: generateIdempotencyToken(),
          })

          expect(hold.status).toBe("ACTIVE")
          expect(hold.resource_id).toBe(testResource.id)
          expect(hold.quantity).toBe(quantity)

          // STEP 3: Verify capacity decreased for all dates
          for (const date of bookingDates) {
            const capacityAfterHold = await capacityService.listResourceCapacities({
              resource_id: testResource.id,
              date,
            })

            expect(capacityAfterHold[0].available_capacity).toBe(originalCapacity - quantity)
          }

          // STEP 4: Confirm hold (simulating successful checkout)
          const orderData = createMockOrderData()
          const allocation = await holdService.confirmHold(hold.id, orderData)

          expect(allocation.resource_id).toBe(testResource.id)
          expect(allocation.order_id).toBe(orderData.order_id)
          expect(allocation.quantity).toBe(quantity)

          // STEP 5: Verify hold status changed to CONFIRMED
          const confirmedHold = await holdService.retrieveResourceHold(hold.id)
          expect(confirmedHold.status).toBe("CONFIRMED")

          // STEP 6: Verify allocations created for all dates
          for (const date of bookingDates) {
            const allocations = await holdService.getAllocations(testResource.id, date)

            expect(allocations.length).toBeGreaterThan(0)
            expect(allocations[0].order_id).toBe(orderData.order_id)
            expect(allocations[0].quantity).toBe(quantity)
          }

          // STEP 7: Verify capacity remains decreased (permanent allocation)
          for (const date of bookingDates) {
            const finalCapacity = await capacityService.listResourceCapacities({
              resource_id: testResource.id,
              date,
            })

            expect(finalCapacity[0].available_capacity).toBe(originalCapacity - quantity)
          }

          console.log("✅ Complete booking flow successful")
        })

        it("should handle multiple bookings for same resource", async () => {
          const date = getFutureDate(10)

          // Create 3 separate bookings
          const bookings = await Promise.all([
            holdService.createHold({
              resourceId: testResource.id,
              dates: [date],
              quantity: 2,
              customerEmail: "customer1@test.com",
              idempotencyToken: `${generateIdempotencyToken()}-1`,
            }),
            holdService.createHold({
              resourceId: testResource.id,
              dates: [date],
              quantity: 3,
              customerEmail: "customer2@test.com",
              idempotencyToken: `${generateIdempotencyToken()}-2`,
            }),
            holdService.createHold({
              resourceId: testResource.id,
              dates: [date],
              quantity: 1,
              customerEmail: "customer3@test.com",
              idempotencyToken: `${generateIdempotencyToken()}-3`,
            }),
          ])

          // Confirm all bookings
          await Promise.all(
            bookings.map((booking) =>
              holdService.confirmHold(booking.id, createMockOrderData())
            )
          )

          // Verify capacity: 10 - (2 + 3 + 1) = 4
          const finalCapacity = await capacityService.listResourceCapacities({
            resource_id: testResource.id,
            date,
          })

          expect(finalCapacity[0].available_capacity).toBe(4)

          // Verify 3 allocations exist
          const allocations = await holdService.getAllocations(testResource.id, date)
          expect(allocations.length).toBe(3)

          console.log("✅ Multiple bookings handled correctly")
        })
      })

      describe("Hold expiration and cleanup flow", () => {
        it("should handle hold expiration and capacity restoration", async () => {
          const date = getFutureDate(15)

          // Create expired hold directly in database
          const expiredHold = await holdService.createResourceHolds(
            createExpiredHoldData(testResource.id, date)
          )

          // Manually decrease capacity to simulate the hold
          await capacityService.adjustCapacity(testResource.id, date, -1)

          // Get capacity before cleanup
          const beforeCleanup = await capacityService.listResourceCapacities({
            resource_id: testResource.id,
            date,
          })
          expect(beforeCleanup[0].available_capacity).toBe(9) // 10 - 1

          // Run cleanup
          const cleanedCount = await holdService.cleanupExpiredHolds()

          expect(cleanedCount).toBeGreaterThan(0)

          // Verify hold status changed to EXPIRED
          const expiredHoldAfter = await holdService.retrieveResourceHold(expiredHold.id)
          expect(expiredHoldAfter.status).toBe("EXPIRED")

          // Verify capacity restored
          const afterCleanup = await capacityService.listResourceCapacities({
            resource_id: testResource.id,
            date,
          })
          expect(afterCleanup[0].available_capacity).toBe(10) // Restored

          console.log("✅ Hold expiration handled correctly")
        })

        it("should process batch expiration efficiently", async () => {
          const dates = generateDateRange(getFutureDate(20), 10)

          // Create 10 expired holds
          const expiredHolds = await Promise.all(
            dates.map(async (date) => {
              // Decrease capacity
              await capacityService.adjustCapacity(testResource.id, date, -2)

              return await holdService.createResourceHolds({
                resource_id: testResource.id,
                date,
                quantity: 2,
                customer_email: "expired@test.com",
                expires_at: new Date(Date.now() - 60000),
                idempotency_token: `expired-${date}`,
                status: "ACTIVE",
              })
            })
          )

          // Run cleanup
          const startTime = Date.now()
          const cleanedCount = await holdService.cleanupExpiredHolds()
          const endTime = Date.now()

          expect(cleanedCount).toBe(10)

          // Cleanup should be fast (< 5 seconds for 10 holds)
          const duration = endTime - startTime
          expect(duration).toBeLessThan(5000)

          // Verify all capacities restored
          for (const date of dates) {
            const capacity = await capacityService.listResourceCapacities({
              resource_id: testResource.id,
              date,
            })
            expect(capacity[0].available_capacity).toBe(10)
          }

          console.log(`✅ Batch cleanup completed in ${duration}ms`)
        })
      })

      describe("Booking cancellation flow", () => {
        it("should handle hold release and capacity restoration", async () => {
          const dates = [getFutureDate(25), getFutureDate(26)]

          // Create hold
          const hold = await holdService.createHold({
            resourceId: testResource.id,
            dates,
            quantity: 5,
            customerEmail: "customer@test.com",
            idempotencyToken: generateIdempotencyToken(),
          })

          // Verify capacity decreased
          for (const date of dates) {
            const capacity = await capacityService.listResourceCapacities({
              resource_id: testResource.id,
              date,
            })
            expect(capacity[0].available_capacity).toBe(5) // 10 - 5
          }

          // Release hold (customer cancels)
          await holdService.releaseHold(hold.id)

          // Verify capacity restored
          for (const date of dates) {
            const capacity = await capacityService.listResourceCapacities({
              resource_id: testResource.id,
              date,
            })
            expect(capacity[0].available_capacity).toBe(10) // Restored
          }

          // Verify hold status
          const releasedHold = await holdService.retrieveResourceHold(hold.id)
          expect(releasedHold.status).toBe("RELEASED")

          console.log("✅ Hold release handled correctly")
        })
      })

      describe("Blackout period interaction", () => {
        it("should prevent bookings during blackout and allow after", async () => {
          const blackoutStart = getFutureDate(3)
          const blackoutEnd = getFutureDate(5)
          const beforeBlackout = getFutureDate(2)
          const afterBlackout = getFutureDate(6)

          // Create blackout period
          await capacityService.createResourceBlackouts({
            resource_id: testResource.id,
            start_date: blackoutStart,
            end_date: blackoutEnd,
            reason: "Maintenance",
          })

          // Try to book during blackout - should fail
          await expect(
            holdService.createHold({
              resourceId: testResource.id,
              dates: [blackoutStart],
              quantity: 1,
              customerEmail: "customer@test.com",
              idempotencyToken: generateIdempotencyToken(),
            })
          ).rejects.toThrow("dates unavailable")

          // Book before blackout - should succeed
          const holdBefore = await holdService.createHold({
            resourceId: testResource.id,
            dates: [beforeBlackout],
            quantity: 1,
            customerEmail: "customer@test.com",
            idempotencyToken: generateIdempotencyToken(),
          })

          expect(holdBefore.status).toBe("ACTIVE")

          // Book after blackout - should succeed
          const holdAfter = await holdService.createHold({
            resourceId: testResource.id,
            dates: [afterBlackout],
            quantity: 1,
            customerEmail: "customer@test.com",
            idempotencyToken: generateIdempotencyToken(),
          })

          expect(holdAfter.status).toBe("ACTIVE")

          console.log("✅ Blackout period enforcement working correctly")
        })
      })

      describe("Multi-resource booking", () => {
        it("should handle bookings across multiple resources", async () => {
          // Create second resource
          const resource2 = await resourceService.createResources(
            createTestResourceData({ name: "Vehicle 2" })
          )

          const dates = generateDateRange(getFutureDate(1), 5)
          await capacityService.initializeCapacity(resource2.id, dates, 10)

          const date = getFutureDate(2)

          // Book both resources for same date
          const hold1 = await holdService.createHold({
            resourceId: testResource.id,
            dates: [date],
            quantity: 3,
            customerEmail: "customer@test.com",
            idempotencyToken: `${generateIdempotencyToken()}-r1`,
          })

          const hold2 = await holdService.createHold({
            resourceId: resource2.id,
            dates: [date],
            quantity: 2,
            customerEmail: "customer@test.com",
            idempotencyToken: `${generateIdempotencyToken()}-r2`,
          })

          // Confirm both
          const orderData = createMockOrderData()
          await holdService.confirmHold(hold1.id, orderData)
          await holdService.confirmHold(hold2.id, orderData)

          // Verify allocations for both resources
          const allocations = await holdService.getAllocationsByOrder(orderData.order_id)

          expect(allocations.length).toBe(2)
          expect(allocations.some((a) => a.resource_id === testResource.id)).toBe(true)
          expect(allocations.some((a) => a.resource_id === resource2.id)).toBe(true)

          console.log("✅ Multi-resource booking handled correctly")
        })
      })

      describe("Error recovery scenarios", () => {
        it("should handle partial hold creation failures gracefully", async () => {
          const dates = [getFutureDate(1), getFutureDate(2), getFutureDate(3)]

          // Set capacity to 0 on middle date
          const capacities = await capacityService.listResourceCapacities({
            resource_id: testResource.id,
            date: dates[1],
          })
          await capacityService.updateResourceCapacities(
            { id: capacities[0].id },
            { available_capacity: 0 }
          )

          // Try to create hold for all 3 dates - should fail
          await expect(
            holdService.createHold({
              resourceId: testResource.id,
              dates,
              quantity: 1,
              customerEmail: "customer@test.com",
              idempotencyToken: generateIdempotencyToken(),
            })
          ).rejects.toThrow("dates unavailable")

          // Verify no holds were created (all or nothing)
          const holds = await holdService.listResourceHolds({
            resource_id: testResource.id,
          })

          // If any holds exist, they should not be for these dates
          const relevantHolds = holds.filter((h) =>
            dates.includes(h.date as any as string)
          )
          expect(relevantHolds.length).toBe(0)

          console.log("✅ Partial failure handled correctly")
        })
      })
    })
  },
})
