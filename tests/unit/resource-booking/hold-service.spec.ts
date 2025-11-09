/**
 * Unit tests for HoldService
 * Tests hold creation, confirmation, release, and expiration logic
 */

import { medusaIntegrationTestRunner } from "@medusajs/test-utils"
import { ModuleRegistrationName } from "@medusajs/framework/utils"
import {
  createTestResourceData,
  createTestHoldData,
  createExpiredHoldData,
  createMockOrderData,
  generateDateRange,
  getFutureDate,
  waitForExpiration,
  cleanupResourceBookingData,
  generateIdempotencyToken,
} from "../../utils/resource-booking-helpers"

jest.setTimeout(30000)

medusaIntegrationTestRunner({
  testSuite: ({ getContainer }) => {
    describe("HoldService", () => {
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

        // Create test resource with capacity
        testResource = await resourceService.createResources(createTestResourceData())

        const dates = generateDateRange(getFutureDate(1), 30)
        await capacityService.initializeCapacity(testResource.id, dates, 10)
      })

      afterEach(async () => {
        await cleanupResourceBookingData(container)
      })

      describe("createHold", () => {
        it("should create hold with valid data", async () => {
          const dates = [getFutureDate(1), getFutureDate(2)]
          const data = createTestHoldData(testResource.id, dates)

          const hold = await holdService.createHold(data)

          expect(hold).toBeDefined()
          expect(hold.id).toBeDefined()
          expect(hold.status).toBe("ACTIVE")
          expect(hold.resource_id).toBe(testResource.id)
          expect(hold.quantity).toBe(1)
          expect(hold.expires_at).toBeDefined()
        })

        it("should set expiration 30 minutes from now", async () => {
          const dates = [getFutureDate(1)]
          const data = createTestHoldData(testResource.id, dates)

          const hold = await holdService.createHold(data)

          const now = new Date()
          const expiresAt = new Date(hold.expires_at)
          const diffMinutes = (expiresAt.getTime() - now.getTime()) / (1000 * 60)

          // Should be approximately 30 minutes (allow for test execution time)
          expect(diffMinutes).toBeGreaterThan(29)
          expect(diffMinutes).toBeLessThan(31)
        })

        it("should decrease available capacity", async () => {
          const date = getFutureDate(1)
          const data = createTestHoldData(testResource.id, [date], { quantity: 3 })

          await holdService.createHold(data)

          const capacities = await capacityService.listResourceCapacities({
            resource_id: testResource.id,
            date,
          })

          expect(capacities[0].available_capacity).toBe(7) // 10 - 3
        })

        it("should respect idempotency token", async () => {
          const dates = [getFutureDate(1)]
          const token = generateIdempotencyToken()
          const data = createTestHoldData(testResource.id, dates, {
            idempotencyToken: token,
          })

          // Create first hold
          const hold1 = await holdService.createHold(data)

          // Try to create again with same token
          const hold2 = await holdService.createHold(data)

          expect(hold1.id).toBe(hold2.id)

          // Capacity should only be decreased once
          const capacities = await capacityService.listResourceCapacities({
            resource_id: testResource.id,
            date: dates[0],
          })
          expect(capacities[0].available_capacity).toBe(9) // 10 - 1
        })

        it("should return existing hold for duplicate idempotency token", async () => {
          const dates = [getFutureDate(1)]
          const token = generateIdempotencyToken()

          const hold1 = await holdService.createHold(
            createTestHoldData(testResource.id, dates, { idempotencyToken: token })
          )

          const hold2 = await holdService.createHold(
            createTestHoldData(testResource.id, dates, { idempotencyToken: token })
          )

          expect(hold1.id).toBe(hold2.id)
        })

        it("should throw error for insufficient capacity", async () => {
          const date = getFutureDate(1)

          // Reduce capacity to 2
          await capacityService.adjustCapacity(testResource.id, date, -8)

          // Try to hold 5 (more than available)
          await expect(
            holdService.createHold(
              createTestHoldData(testResource.id, [date], { quantity: 5 })
            )
          ).rejects.toThrow("dates unavailable")
        })

        it("should throw error for blackout dates", async () => {
          const blackoutDate = getFutureDate(5)

          // Create blackout
          await capacityService.createResourceBlackouts({
            resource_id: testResource.id,
            start_date: blackoutDate,
            end_date: blackoutDate,
            reason: "Maintenance",
          })

          await expect(
            holdService.createHold(
              createTestHoldData(testResource.id, [blackoutDate])
            )
          ).rejects.toThrow("dates unavailable")
        })

        it("should handle multiple dates", async () => {
          const dates = [getFutureDate(1), getFutureDate(2), getFutureDate(3)]
          const data = createTestHoldData(testResource.id, dates, { quantity: 2 })

          await holdService.createHold(data)

          // Check each date has capacity decreased
          for (const date of dates) {
            const capacities = await capacityService.listResourceCapacities({
              resource_id: testResource.id,
              date,
            })
            expect(capacities[0].available_capacity).toBe(8) // 10 - 2
          }
        })

        it("should throw error for quantity <= 0", async () => {
          await expect(
            holdService.createHold(
              createTestHoldData(testResource.id, [getFutureDate(1)], { quantity: 0 })
            )
          ).rejects.toThrow("Quantity must be greater than 0")
        })

        it("should create hold without customer email", async () => {
          const data = createTestHoldData(testResource.id, [getFutureDate(1)], {
            customerEmail: undefined,
          })

          const hold = await holdService.createHold(data)

          expect(hold.customer_email).toBeNull()
        })
      })

      describe("confirmHold", () => {
        let testHold: any

        beforeEach(async () => {
          testHold = await holdService.createHold(
            createTestHoldData(testResource.id, [getFutureDate(1)])
          )
        })

        it("should convert hold to allocation", async () => {
          const orderData = createMockOrderData()

          const allocation = await holdService.confirmHold(testHold.id, orderData)

          expect(allocation).toBeDefined()
          expect(allocation.resource_id).toBe(testResource.id)
          expect(allocation.order_id).toBe(orderData.order_id)
          expect(allocation.line_item_id).toBe(orderData.line_item_id)
        })

        it("should set status to CONFIRMED", async () => {
          const orderData = createMockOrderData()

          await holdService.confirmHold(testHold.id, orderData)

          const updated = await holdService.retrieveResourceHold(testHold.id)
          expect(updated.status).toBe("CONFIRMED")
        })

        it("should create allocation record", async () => {
          const orderData = createMockOrderData()

          await holdService.confirmHold(testHold.id, orderData)

          const allocations = await holdService.getAllocationsByOrder(orderData.order_id)

          expect(allocations.length).toBeGreaterThan(0)
          expect(allocations[0].order_id).toBe(orderData.order_id)
        })

        it("should throw error for expired hold", async () => {
          // Create expired hold
          const expiredHold = await holdService.createResourceHolds(
            createExpiredHoldData(testResource.id, getFutureDate(2))
          )

          await expect(
            holdService.confirmHold(expiredHold.id, createMockOrderData())
          ).rejects.toThrow("expired")
        })

        it("should throw error for non-existent hold", async () => {
          await expect(
            holdService.confirmHold("non-existent-id", createMockOrderData())
          ).rejects.toThrow("not found")
        })

        it("should throw error for already confirmed hold", async () => {
          const orderData = createMockOrderData()

          // Confirm once
          await holdService.confirmHold(testHold.id, orderData)

          // Try to confirm again
          await expect(
            holdService.confirmHold(testHold.id, createMockOrderData())
          ).rejects.toThrow("Cannot confirm hold with status CONFIRMED")
        })

        it("should be idempotent with same order data", async () => {
          const orderData = createMockOrderData()

          await holdService.confirmHold(testHold.id, orderData)

          // Confirming again should fail (already confirmed)
          await expect(
            holdService.confirmHold(testHold.id, orderData)
          ).rejects.toThrow("Cannot confirm hold")
        })
      })

      describe("releaseHold", () => {
        let testHold: any
        let testDate: string

        beforeEach(async () => {
          testDate = getFutureDate(1)
          testHold = await holdService.createHold(
            createTestHoldData(testResource.id, [testDate], { quantity: 3 })
          )
        })

        it("should set status to RELEASED", async () => {
          await holdService.releaseHold(testHold.id)

          const updated = await holdService.retrieveResourceHold(testHold.id)
          expect(updated.status).toBe("RELEASED")
        })

        it("should restore capacity", async () => {
          await holdService.releaseHold(testHold.id)

          const capacities = await capacityService.listResourceCapacities({
            resource_id: testResource.id,
            date: testDate,
          })

          expect(capacities[0].available_capacity).toBe(10) // Restored to original
        })

        it("should handle multiple dates", async () => {
          const dates = [getFutureDate(2), getFutureDate(3)]
          const multiHold = await holdService.createHold(
            createTestHoldData(testResource.id, dates, { quantity: 2 })
          )

          await holdService.releaseHold(multiHold.id)

          // Check capacity restored for all dates
          for (const date of dates) {
            const capacities = await capacityService.listResourceCapacities({
              resource_id: testResource.id,
              date,
            })
            expect(capacities[0].available_capacity).toBe(10)
          }
        })

        it("should throw error for already confirmed hold", async () => {
          // Confirm the hold first
          await holdService.confirmHold(testHold.id, createMockOrderData())

          // Try to release
          await expect(holdService.releaseHold(testHold.id)).rejects.toThrow(
            "Cannot release hold with status CONFIRMED"
          )
        })

        it("should throw error for non-existent hold", async () => {
          await expect(holdService.releaseHold("non-existent-id")).rejects.toThrow(
            "not found"
          )
        })
      })

      describe("cleanupExpiredHolds", () => {
        it("should expire holds past expiration time", async () => {
          // Create expired hold
          const expiredHold = await holdService.createResourceHolds(
            createExpiredHoldData(testResource.id, getFutureDate(1))
          )

          const cleaned = await holdService.cleanupExpiredHolds()

          expect(cleaned).toBeGreaterThan(0)

          const updated = await holdService.retrieveResourceHold(expiredHold.id)
          expect(updated.status).toBe("EXPIRED")
        })

        it("should restore capacity for expired holds", async () => {
          const date = getFutureDate(1)

          // Create expired hold with quantity 5
          await holdService.createResourceHolds(
            createExpiredHoldData(testResource.id, date)
          )

          // Manually decrease capacity to simulate the hold
          await capacityService.adjustCapacity(testResource.id, date, -1)

          await holdService.cleanupExpiredHolds()

          const capacities = await capacityService.listResourceCapacities({
            resource_id: testResource.id,
            date,
          })

          expect(capacities[0].available_capacity).toBe(10) // Restored
        })

        it("should not affect active holds", async () => {
          const activeHold = await holdService.createHold(
            createTestHoldData(testResource.id, [getFutureDate(1)])
          )

          await holdService.cleanupExpiredHolds()

          const updated = await holdService.retrieveResourceHold(activeHold.id)
          expect(updated.status).toBe("ACTIVE")
        })

        it("should not affect confirmed holds", async () => {
          const confirmedHold = await holdService.createHold(
            createTestHoldData(testResource.id, [getFutureDate(1)])
          )

          await holdService.confirmHold(confirmedHold.id, createMockOrderData())

          await holdService.cleanupExpiredHolds()

          const updated = await holdService.retrieveResourceHold(confirmedHold.id)
          expect(updated.status).toBe("CONFIRMED")
        })

        it("should handle multiple expired holds in batch", async () => {
          // Create 5 expired holds
          for (let i = 0; i < 5; i++) {
            await holdService.createResourceHolds(
              createExpiredHoldData(testResource.id, getFutureDate(i + 1))
            )
          }

          const cleaned = await holdService.cleanupExpiredHolds()

          expect(cleaned).toBeGreaterThanOrEqual(5)
        })
      })

      describe("extendHold", () => {
        let testHold: any

        beforeEach(async () => {
          testHold = await holdService.createHold(
            createTestHoldData(testResource.id, [getFutureDate(1)])
          )
        })

        it("should extend expiration time", async () => {
          const originalExpiration = new Date(testHold.expires_at)

          await holdService.extendHold(testHold.id, 15)

          const updated = await holdService.retrieveResourceHold(testHold.id)
          const newExpiration = new Date(updated.expires_at)

          const diffMinutes =
            (newExpiration.getTime() - originalExpiration.getTime()) / (1000 * 60)

          expect(diffMinutes).toBeGreaterThan(14)
          expect(diffMinutes).toBeLessThan(16)
        })

        it("should throw error for expired hold", async () => {
          const expiredHold = await holdService.createResourceHolds(
            createExpiredHoldData(testResource.id, getFutureDate(1))
          )

          await expect(holdService.extendHold(expiredHold.id, 15)).rejects.toThrow(
            "Cannot extend hold with status ACTIVE"
          )
        })

        it("should throw error for confirmed hold", async () => {
          await holdService.confirmHold(testHold.id, createMockOrderData())

          await expect(holdService.extendHold(testHold.id, 15)).rejects.toThrow(
            "Cannot extend hold with status CONFIRMED"
          )
        })

        it("should use default 30 minutes if not specified", async () => {
          const originalExpiration = new Date(testHold.expires_at)

          await holdService.extendHold(testHold.id)

          const updated = await holdService.retrieveResourceHold(testHold.id)
          const newExpiration = new Date(updated.expires_at)

          const diffMinutes =
            (newExpiration.getTime() - originalExpiration.getTime()) / (1000 * 60)

          expect(diffMinutes).toBeGreaterThan(29)
          expect(diffMinutes).toBeLessThan(31)
        })
      })

      describe("getActiveHolds", () => {
        it("should return active holds for resource and date", async () => {
          const date = getFutureDate(1)

          await holdService.createHold(
            createTestHoldData(testResource.id, [date], { quantity: 1 })
          )

          await holdService.createHold(
            createTestHoldData(testResource.id, [date], { quantity: 2 })
          )

          const activeHolds = await holdService.getActiveHolds(testResource.id, date)

          expect(activeHolds.length).toBeGreaterThanOrEqual(2)
          expect(activeHolds.every((h: any) => h.status === "ACTIVE")).toBe(true)
        })

        it("should not return holds from other dates", async () => {
          const date1 = getFutureDate(1)
          const date2 = getFutureDate(2)

          await holdService.createHold(createTestHoldData(testResource.id, [date1]))

          const holds = await holdService.getActiveHolds(testResource.id, date2)

          expect(holds.length).toBe(0)
        })
      })

      describe("getAllocationsByOrder", () => {
        it("should return allocations for order", async () => {
          const hold = await holdService.createHold(
            createTestHoldData(testResource.id, [getFutureDate(1)])
          )

          const orderData = createMockOrderData()
          await holdService.confirmHold(hold.id, orderData)

          const allocations = await holdService.getAllocationsByOrder(orderData.order_id)

          expect(allocations.length).toBeGreaterThan(0)
          expect(allocations[0].order_id).toBe(orderData.order_id)
        })

        it("should return empty array for order with no allocations", async () => {
          const allocations = await holdService.getAllocationsByOrder("non-existent-order")

          expect(allocations.length).toBe(0)
        })
      })

      describe("getAllocations", () => {
        it("should return allocations for resource and date", async () => {
          const date = getFutureDate(1)
          const hold = await holdService.createHold(
            createTestHoldData(testResource.id, [date])
          )

          await holdService.confirmHold(hold.id, createMockOrderData())

          const allocations = await holdService.getAllocations(testResource.id, date)

          expect(allocations.length).toBeGreaterThan(0)
          expect(allocations[0].resource_id).toBe(testResource.id)
        })

        it("should return empty array for date with no allocations", async () => {
          const allocations = await holdService.getAllocations(
            testResource.id,
            getFutureDate(100)
          )

          expect(allocations.length).toBe(0)
        })
      })
    })
  },
})
