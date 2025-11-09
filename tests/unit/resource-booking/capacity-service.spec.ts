/**
 * Unit tests for CapacityService
 * Tests availability checking, capacity adjustments, and concurrency control
 */

import { medusaIntegrationTestRunner } from "@medusajs/test-utils"
import { ModuleRegistrationName } from "@medusajs/framework/utils"
import {
  createTestResourceData,
  createTestCapacityData,
  createTestBlackoutData,
  generateDateRange,
  getFutureDate,
  cleanupResourceBookingData,
} from "../../utils/resource-booking-helpers"

jest.setTimeout(30000)

medusaIntegrationTestRunner({
  testSuite: ({ getContainer }) => {
    describe("CapacityService", () => {
      let container: any
      let resourceService: any
      let capacityService: any
      let testResource: any

      beforeEach(async () => {
        container = getContainer()
        resourceService = container.resolve("resourceService")
        capacityService = container.resolve("capacityService")

        // Create test resource
        testResource = await resourceService.createResources(createTestResourceData())
      })

      afterEach(async () => {
        await cleanupResourceBookingData(container)
      })

      describe("initializeCapacity", () => {
        it("should create capacity records for date range", async () => {
          const dates = [getFutureDate(1), getFutureDate(2), getFutureDate(3)]

          const capacities = await capacityService.initializeCapacity(
            testResource.id,
            dates,
            10
          )

          expect(capacities.length).toBe(3)
          expect(capacities.every((c: any) => c.max_capacity === 10)).toBe(true)
          expect(capacities.every((c: any) => c.available_capacity === 10)).toBe(true)
        })

        it("should not duplicate existing capacity records", async () => {
          const dates = [getFutureDate(1), getFutureDate(2)]

          // Initialize once
          await capacityService.initializeCapacity(testResource.id, dates, 10)

          // Initialize again
          const secondInit = await capacityService.initializeCapacity(
            testResource.id,
            dates,
            10
          )

          expect(secondInit.length).toBe(2)

          // Verify no duplicates in database
          const all = await capacityService.listResourceCapacities({
            resource_id: testResource.id,
          })
          expect(all.length).toBe(2)
        })

        it("should throw error for negative max capacity", async () => {
          await expect(
            capacityService.initializeCapacity(testResource.id, [getFutureDate(1)], -5)
          ).rejects.toThrow("Max capacity must be >= 0")
        })

        it("should accept zero capacity (resource unavailable)", async () => {
          const capacities = await capacityService.initializeCapacity(
            testResource.id,
            [getFutureDate(1)],
            0
          )

          expect(capacities[0].max_capacity).toBe(0)
          expect(capacities[0].available_capacity).toBe(0)
        })
      })

      describe("checkAvailability", () => {
        beforeEach(async () => {
          // Set up capacity for testing
          const dates = generateDateRange(getFutureDate(1), 5)
          await capacityService.initializeCapacity(testResource.id, dates, 10)
        })

        it("should return true when capacity is available", async () => {
          const results = await capacityService.checkAvailability(
            testResource.id,
            [getFutureDate(1)],
            5
          )

          expect(results[0].available).toBe(true)
          expect(results[0].available_capacity).toBe(10)
        })

        it("should return false when insufficient capacity", async () => {
          const date = getFutureDate(1)

          // Reduce capacity to 3
          await capacityService.adjustCapacity(testResource.id, date, -7)

          const results = await capacityService.checkAvailability(
            testResource.id,
            [date],
            5
          )

          expect(results[0].available).toBe(false)
          expect(results[0].available_capacity).toBe(3)
          expect(results[0].reason).toBe("Insufficient capacity")
        })

        it("should check multiple dates", async () => {
          const dates = [getFutureDate(1), getFutureDate(2), getFutureDate(3)]

          const results = await capacityService.checkAvailability(
            testResource.id,
            dates,
            3
          )

          expect(results.length).toBe(3)
          expect(results.every((r) => r.available === true)).toBe(true)
        })

        it("should respect blackout dates", async () => {
          const blackoutDate = getFutureDate(2)

          // Create blackout
          await capacityService.createResourceBlackouts(
            createTestBlackoutData(testResource.id, {
              start_date: blackoutDate,
              end_date: blackoutDate,
              reason: "Maintenance",
            })
          )

          const results = await capacityService.checkAvailability(
            testResource.id,
            [blackoutDate],
            1
          )

          expect(results[0].available).toBe(false)
          expect(results[0].reason).toBe("Maintenance")
        })

        it("should return false when no capacity record exists", async () => {
          const futureDate = getFutureDate(100) // Far future date with no capacity

          const results = await capacityService.checkAvailability(
            testResource.id,
            [futureDate],
            1
          )

          expect(results[0].available).toBe(false)
          expect(results[0].reason).toBe("No capacity configured for this date")
        })

        it("should throw error for quantity <= 0", async () => {
          await expect(
            capacityService.checkAvailability(testResource.id, [getFutureDate(1)], 0)
          ).rejects.toThrow("Quantity must be greater than 0")
        })
      })

      describe("getAvailableDates", () => {
        beforeEach(async () => {
          const dates = generateDateRange(getFutureDate(1), 10)
          await capacityService.initializeCapacity(testResource.id, dates, 5)
        })

        it("should return all dates with available capacity", async () => {
          const available = await capacityService.getAvailableDates(
            testResource.id,
            getFutureDate(1),
            getFutureDate(10),
            1
          )

          expect(available.length).toBe(10)
          expect(available.every((d) => d.available_capacity >= 1)).toBe(true)
        })

        it("should exclude blackout dates", async () => {
          const blackoutStart = getFutureDate(3)
          const blackoutEnd = getFutureDate(5)

          await capacityService.createResourceBlackouts(
            createTestBlackoutData(testResource.id, {
              start_date: blackoutStart,
              end_date: blackoutEnd,
            })
          )

          const available = await capacityService.getAvailableDates(
            testResource.id,
            getFutureDate(1),
            getFutureDate(10),
            1
          )

          // Should have 10 total - 3 blackout = 7 available
          expect(available.length).toBe(7)
        })

        it("should filter by minimum quantity", async () => {
          const date1 = getFutureDate(2)

          // Reduce capacity on one date to 2
          await capacityService.adjustCapacity(testResource.id, date1, -3)

          const available = await capacityService.getAvailableDates(
            testResource.id,
            getFutureDate(1),
            getFutureDate(10),
            3 // Need at least 3
          )

          // Should exclude the date with only 2 capacity
          expect(available.every((d) => d.available_capacity >= 3)).toBe(true)
        })

        it("should return empty array when no dates available", async () => {
          // Create blackout for entire range
          await capacityService.createResourceBlackouts(
            createTestBlackoutData(testResource.id, {
              start_date: getFutureDate(1),
              end_date: getFutureDate(10),
            })
          )

          const available = await capacityService.getAvailableDates(
            testResource.id,
            getFutureDate(1),
            getFutureDate(10),
            1
          )

          expect(available.length).toBe(0)
        })
      })

      describe("adjustCapacity", () => {
        let testDate: string

        beforeEach(async () => {
          testDate = getFutureDate(1)
          await capacityService.initializeCapacity(testResource.id, [testDate], 10)
        })

        it("should decrease available capacity", async () => {
          await capacityService.adjustCapacity(testResource.id, testDate, -3)

          const capacities = await capacityService.listResourceCapacities({
            resource_id: testResource.id,
            date: testDate,
          })

          expect(capacities[0].available_capacity).toBe(7)
        })

        it("should increase available capacity", async () => {
          // First decrease
          await capacityService.adjustCapacity(testResource.id, testDate, -3)

          // Then increase
          await capacityService.adjustCapacity(testResource.id, testDate, 2)

          const capacities = await capacityService.listResourceCapacities({
            resource_id: testResource.id,
            date: testDate,
          })

          expect(capacities[0].available_capacity).toBe(9)
        })

        it("should throw error when capacity would go negative", async () => {
          await expect(
            capacityService.adjustCapacity(testResource.id, testDate, -15)
          ).rejects.toThrow("Insufficient capacity")
        })

        it("should throw error when capacity would exceed max", async () => {
          await expect(
            capacityService.adjustCapacity(testResource.id, testDate, 5)
          ).rejects.toThrow("exceed max capacity")
        })

        it("should throw error for non-existent capacity record", async () => {
          const nonExistentDate = getFutureDate(100)

          await expect(
            capacityService.adjustCapacity(testResource.id, nonExistentDate, -1)
          ).rejects.toThrow("No capacity record found")
        })

        it("should handle concurrent adjustments correctly", async () => {
          // This is a basic test - full concurrency tests are in concurrency suite
          const adjustments = [
            capacityService.adjustCapacity(testResource.id, testDate, -1),
            capacityService.adjustCapacity(testResource.id, testDate, -1),
            capacityService.adjustCapacity(testResource.id, testDate, -1),
          ]

          await Promise.all(adjustments)

          const capacities = await capacityService.listResourceCapacities({
            resource_id: testResource.id,
            date: testDate,
          })

          expect(capacities[0].available_capacity).toBe(7)
        })
      })

      describe("blackout management", () => {
        it("should create blackout period", async () => {
          const blackout = await capacityService.createResourceBlackouts(
            createTestBlackoutData(testResource.id)
          )

          expect(blackout).toBeDefined()
          expect(blackout.resource_id).toBe(testResource.id)
          expect(blackout.reason).toBe("Test blackout period")
        })

        it("should list blackouts for resource", async () => {
          await capacityService.createResourceBlackouts(
            createTestBlackoutData(testResource.id, { reason: "Blackout 1" })
          )
          await capacityService.createResourceBlackouts(
            createTestBlackoutData(testResource.id, { reason: "Blackout 2" })
          )

          const blackouts = await capacityService.listResourceBlackouts({
            resource_id: testResource.id,
          })

          expect(blackouts.length).toBeGreaterThanOrEqual(2)
        })

        it("should delete blackout", async () => {
          const blackout = await capacityService.createResourceBlackouts(
            createTestBlackoutData(testResource.id)
          )

          await capacityService.deleteResourceBlackouts({ id: blackout.id })

          const blackouts = await capacityService.listResourceBlackouts({
            id: blackout.id,
          })

          expect(blackouts.length).toBe(0)
        })

        it("should block holds during blackout period", async () => {
          const dates = generateDateRange(getFutureDate(1), 5)
          await capacityService.initializeCapacity(testResource.id, dates, 10)

          // Create blackout for middle dates
          await capacityService.createResourceBlackouts(
            createTestBlackoutData(testResource.id, {
              start_date: getFutureDate(2),
              end_date: getFutureDate(3),
            })
          )

          const results = await capacityService.checkAvailability(
            testResource.id,
            [getFutureDate(1), getFutureDate(2), getFutureDate(3), getFutureDate(4)],
            1
          )

          expect(results[0].available).toBe(true) // Before blackout
          expect(results[1].available).toBe(false) // During blackout
          expect(results[2].available).toBe(false) // During blackout
          expect(results[3].available).toBe(true) // After blackout
        })
      })

      describe("timezone handling", () => {
        it("should convert dates to Brisbane timezone", async () => {
          // Use a UTC date that would be different day in Brisbane
          const utcDate = new Date("2025-01-15T14:00:00Z") // 2025-01-16 in Brisbane

          await capacityService.initializeCapacity(
            testResource.id,
            [utcDate],
            10
          )

          const capacities = await capacityService.listResourceCapacities({
            resource_id: testResource.id,
          })

          // Should be stored as Brisbane date (2025-01-16)
          expect(capacities[0].date).toContain("2025-01-16")
        })
      })
    })
  },
})
