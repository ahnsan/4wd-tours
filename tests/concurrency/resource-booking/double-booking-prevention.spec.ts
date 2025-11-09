/**
 * Concurrency tests for Resource Booking
 * Tests double-booking prevention and race condition handling
 */

import { medusaIntegrationTestRunner } from "@medusajs/test-utils"
import {
  createTestResourceData,
  createTestHoldData,
  createMockOrderData,
  generateDateRange,
  getFutureDate,
  cleanupResourceBookingData,
  runConcurrent,
  countResults,
  generateIdempotencyToken,
} from "../../utils/resource-booking-helpers"

jest.setTimeout(120000) // 2 minutes for concurrency tests

medusaIntegrationTestRunner({
  testSuite: ({ getContainer }) => {
    describe("Concurrency - Double Booking Prevention", () => {
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
        testResource = await resourceService.createResources(createTestResourceData())

        // Initialize capacity for testing
        const dates = generateDateRange(getFutureDate(1), 30)
        await capacityService.initializeCapacity(testResource.id, dates, 10)
      })

      afterEach(async () => {
        await cleanupResourceBookingData(container)
      })

      describe("Concurrent hold creation", () => {
        it("should prevent double-booking with 10 concurrent hold requests for capacity of 1", async () => {
          const date = getFutureDate(5)

          // Set capacity to 1
          const capacities = await capacityService.listResourceCapacities({
            resource_id: testResource.id,
            date,
          })
          await capacityService.updateResourceCapacities(
            { id: capacities[0].id },
            { max_capacity: 1, available_capacity: 1 }
          )

          // Create 10 concurrent hold requests
          const operations = Array.from({ length: 10 }, (_, i) =>
            async () => {
              return await holdService.createHold({
                resourceId: testResource.id,
                dates: [date],
                quantity: 1,
                customerEmail: `customer${i}@test.com`,
                idempotencyToken: `token-concurrent-${i}-${Date.now()}`,
              })
            }
          )

          const results = await runConcurrent(operations)
          const { successful, failed } = countResults(results)

          // Only 1 should succeed, 9 should fail
          expect(successful).toBe(1)
          expect(failed).toBe(9)

          // Verify capacity is correctly decremented to 0
          const finalCapacity = await capacityService.listResourceCapacities({
            resource_id: testResource.id,
            date,
          })
          expect(finalCapacity[0].available_capacity).toBe(0)
        })

        it("should handle 50 concurrent requests with capacity of 10", async () => {
          const date = getFutureDate(6)

          // Create 50 concurrent hold requests for 1 unit each
          const operations = Array.from({ length: 50 }, (_, i) =>
            async () => {
              return await holdService.createHold({
                resourceId: testResource.id,
                dates: [date],
                quantity: 1,
                customerEmail: `customer${i}@test.com`,
                idempotencyToken: `token-50-${i}-${Date.now()}`,
              })
            }
          )

          const results = await runConcurrent(operations)
          const { successful, failed } = countResults(results)

          // Exactly 10 should succeed (matching capacity)
          expect(successful).toBe(10)
          expect(failed).toBe(40)

          // Verify capacity is fully consumed
          const finalCapacity = await capacityService.listResourceCapacities({
            resource_id: testResource.id,
            date,
          })
          expect(finalCapacity[0].available_capacity).toBe(0)
        })

        it("should handle concurrent requests for different quantities", async () => {
          const date = getFutureDate(7)

          // Create concurrent requests: 5x qty=2, 5x qty=1
          // Total demand: 15, Capacity: 10
          // Expected: Some will succeed until capacity exhausted
          const operations = [
            ...Array.from({ length: 5 }, (_, i) =>
              async () => {
                return await holdService.createHold({
                  resourceId: testResource.id,
                  dates: [date],
                  quantity: 2,
                  customerEmail: `customer-2-${i}@test.com`,
                  idempotencyToken: `token-qty2-${i}-${Date.now()}`,
                })
              }
            ),
            ...Array.from({ length: 5 }, (_, i) =>
              async () => {
                return await holdService.createHold({
                  resourceId: testResource.id,
                  dates: [date],
                  quantity: 1,
                  customerEmail: `customer-1-${i}@test.com`,
                  idempotencyToken: `token-qty1-${i}-${Date.now()}`,
                })
              }
            ),
          ]

          const results = await runConcurrent(operations)
          const { successful } = countResults(results)

          // Some should succeed, but not all
          expect(successful).toBeGreaterThan(0)
          expect(successful).toBeLessThan(10)

          // Verify capacity is at or near 0
          const finalCapacity = await capacityService.listResourceCapacities({
            resource_id: testResource.id,
            date,
          })
          expect(finalCapacity[0].available_capacity).toBeLessThanOrEqual(2)
        })
      })

      describe("Concurrent confirm and release operations", () => {
        it("should handle concurrent confirm and release correctly", async () => {
          const date = getFutureDate(8)

          // Create 5 holds
          const holds = await Promise.all(
            Array.from({ length: 5 }, async (_, i) => {
              return await holdService.createHold({
                resourceId: testResource.id,
                dates: [date],
                quantity: 1,
                customerEmail: `customer${i}@test.com`,
                idempotencyToken: `token-confirm-${i}-${Date.now()}`,
              })
            })
          )

          // Concurrently: Confirm 3 holds, Release 2 holds
          const operations = [
            ...holds.slice(0, 3).map((hold) => async () => {
              return await holdService.confirmHold(hold.id, createMockOrderData())
            }),
            ...holds.slice(3, 5).map((hold) => async () => {
              return await holdService.releaseHold(hold.id)
            }),
          ]

          const results = await runConcurrent(operations)
          const { successful } = countResults(results)

          // All 5 operations should succeed
          expect(successful).toBe(5)

          // Verify capacity: started at 10, 5 holds created (5 remaining)
          // 3 confirmed (stay reserved), 2 released (back to pool)
          // Final: 5 + 2 = 7
          const finalCapacity = await capacityService.listResourceCapacities({
            resource_id: testResource.id,
            date,
          })
          expect(finalCapacity[0].available_capacity).toBe(7)
        })

        it("should prevent double-confirmation of same hold", async () => {
          const date = getFutureDate(9)

          const hold = await holdService.createHold({
            resourceId: testResource.id,
            dates: [date],
            quantity: 1,
            customerEmail: "customer@test.com",
            idempotencyToken: generateIdempotencyToken(),
          })

          // Try to confirm the same hold concurrently 5 times
          const operations = Array.from({ length: 5 }, () => async () => {
            return await holdService.confirmHold(hold.id, createMockOrderData())
          })

          const results = await runConcurrent(operations)
          const { successful, failed } = countResults(results)

          // Only 1 should succeed
          expect(successful).toBe(1)
          expect(failed).toBe(4)
        })
      })

      describe("Concurrent capacity adjustments", () => {
        it("should handle concurrent adjustCapacity calls correctly", async () => {
          const date = getFutureDate(10)

          // Make 20 concurrent decrements of -1
          const operations = Array.from({ length: 20 }, () => async () => {
            return await capacityService.adjustCapacity(testResource.id, date, -1)
          })

          const results = await runConcurrent(operations)

          // First 10 should succeed (capacity available)
          // Last 10 should fail (insufficient capacity)
          const { successful, failed } = countResults(results)

          expect(successful).toBe(10)
          expect(failed).toBe(10)

          // Verify final capacity is 0
          const finalCapacity = await capacityService.listResourceCapacities({
            resource_id: testResource.id,
            date,
          })
          expect(finalCapacity[0].available_capacity).toBe(0)
        })

        it("should handle mixed increase/decrease operations", async () => {
          const date = getFutureDate(11)

          // Start with capacity 10
          // Concurrently: 15x decrease by 1, 5x increase by 1
          // Expected: 10 - 15 + 5 = 0 (but some decreases will fail)
          const operations = [
            ...Array.from({ length: 15 }, () => async () => {
              return await capacityService.adjustCapacity(testResource.id, date, -1)
            }),
            ...Array.from({ length: 5 }, () => async () => {
              return await capacityService.adjustCapacity(testResource.id, date, 1)
            }),
          ]

          const results = await runConcurrent(operations)
          const { successful } = countResults(results)

          // Some operations will succeed
          expect(successful).toBeGreaterThan(0)

          // Final capacity should be valid (>= 0, <= 10)
          const finalCapacity = await capacityService.listResourceCapacities({
            resource_id: testResource.id,
            date,
          })
          expect(finalCapacity[0].available_capacity).toBeGreaterThanOrEqual(0)
          expect(finalCapacity[0].available_capacity).toBeLessThanOrEqual(10)
        })
      })

      describe("Advisory lock effectiveness", () => {
        it("should use PostgreSQL advisory locks for capacity adjustments", async () => {
          const date = getFutureDate(12)

          // This test verifies that advisory locks are working
          // by ensuring no race conditions occur during high concurrency

          // Create 100 concurrent hold requests for capacity of 10
          const operations = Array.from({ length: 100 }, (_, i) =>
            async () => {
              return await holdService.createHold({
                resourceId: testResource.id,
                dates: [date],
                quantity: 1,
                customerEmail: `stress-${i}@test.com`,
                idempotencyToken: `stress-token-${i}-${Date.now()}`,
              })
            }
          )

          const startTime = Date.now()
          const results = await runConcurrent(operations)
          const endTime = Date.now()

          const { successful, failed } = countResults(results)

          // Exactly 10 should succeed (no overbooking!)
          expect(successful).toBe(10)
          expect(failed).toBe(90)

          // Verify capacity is exactly 0
          const finalCapacity = await capacityService.listResourceCapacities({
            resource_id: testResource.id,
            date,
          })
          expect(finalCapacity[0].available_capacity).toBe(0)

          // Performance: Should complete in reasonable time (< 10 seconds)
          const duration = endTime - startTime
          expect(duration).toBeLessThan(10000)

          console.log(`Concurrency test completed in ${duration}ms`)
          console.log(`Success rate: ${successful}/${results.length}`)
        })

        it("should maintain data integrity under extreme load", async () => {
          const date = getFutureDate(13)

          // Extreme test: 200 concurrent requests for capacity of 5
          const capacities = await capacityService.listResourceCapacities({
            resource_id: testResource.id,
            date,
          })
          await capacityService.updateResourceCapacities(
            { id: capacities[0].id },
            { max_capacity: 5, available_capacity: 5 }
          )

          const operations = Array.from({ length: 200 }, (_, i) =>
            async () => {
              return await holdService.createHold({
                resourceId: testResource.id,
                dates: [date],
                quantity: 1,
                customerEmail: `extreme-${i}@test.com`,
                idempotencyToken: `extreme-${i}-${Date.now()}`,
              })
            }
          )

          const results = await runConcurrent(operations)
          const { successful } = countResults(results)

          // Exactly 5 should succeed - NO EXCEPTIONS
          expect(successful).toBe(5)

          // Verify capacity is exactly 0 - NO OVERBOOKING
          const finalCapacity = await capacityService.listResourceCapacities({
            resource_id: testResource.id,
            date,
          })
          expect(finalCapacity[0].available_capacity).toBe(0)

          console.log("✅ NO OVERBOOKING DETECTED - Advisory locks working correctly")
        })
      })

      describe("Performance under load", () => {
        it("should maintain p95 latency < 300ms under concurrent load", async () => {
          const date = getFutureDate(14)

          const operations = Array.from({ length: 50 }, (_, i) =>
            async () => {
              const start = Date.now()
              try {
                await holdService.createHold({
                  resourceId: testResource.id,
                  dates: [date],
                  quantity: 1,
                  customerEmail: `perf-${i}@test.com`,
                  idempotencyToken: `perf-${i}-${Date.now()}`,
                })
              } catch (error) {
                // Expected for some requests
              }
              const end = Date.now()
              return end - start
            }
          )

          const results = await runConcurrent(operations)
          const latencies = results
            .filter((r) => r.status === "fulfilled")
            .map((r: any) => r.value)
            .sort((a, b) => a - b)

          const p95Index = Math.floor(latencies.length * 0.95)
          const p95Latency = latencies[p95Index]

          console.log(`p95 latency: ${p95Latency}ms`)
          console.log(`Max latency: ${latencies[latencies.length - 1]}ms`)

          expect(p95Latency).toBeLessThan(300)
        })
      })
    })
  },
})
