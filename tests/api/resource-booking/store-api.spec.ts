/**
 * API Integration tests for Store Resource Booking endpoints
 * Tests /store/resource-booking/* routes
 */

import { medusaIntegrationTestRunner } from "@medusajs/test-utils"
import {
  createTestResourceData,
  createTestHoldData,
  createMockOrderData,
  generateDateRange,
  getFutureDate,
  cleanupResourceBookingData,
  generateIdempotencyToken,
} from "../../utils/resource-booking-helpers"

jest.setTimeout(60000)

medusaIntegrationTestRunner({
  inApp: true,
  env: {},
  testSuite: ({ api, getContainer }) => {
    describe("Store API - Resource Booking", () => {
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

        // Initialize capacity for 30 days
        const dates = generateDateRange(getFutureDate(1), 30)
        await capacityService.initializeCapacity(testResource.id, dates, 10)
      })

      afterEach(async () => {
        await cleanupResourceBookingData(container)
      })

      describe("GET /store/resource-booking/availability", () => {
        it("should return available dates", async () => {
          const response = await api.get("/store/resource-booking/availability", {
            params: {
              resource_id: testResource.id,
              start_date: getFutureDate(1),
              end_date: getFutureDate(10),
              quantity: 1,
            },
          })

          expect(response.status).toBe(200)
          expect(response.data).toHaveProperty("available_dates")
          expect(Array.isArray(response.data.available_dates)).toBe(true)
          expect(response.data.available_dates.length).toBeGreaterThan(0)
        })

        it("should filter by quantity", async () => {
          const date = getFutureDate(5)

          // Reduce capacity to 3 on one date
          await capacityService.adjustCapacity(testResource.id, date, -7)

          const response = await api.get("/store/resource-booking/availability", {
            params: {
              resource_id: testResource.id,
              start_date: getFutureDate(1),
              end_date: getFutureDate(10),
              quantity: 5,
            },
          })

          expect(response.status).toBe(200)

          // Date with only 3 capacity should be excluded
          const availableDates = response.data.available_dates.map((d: any) => d.date)
          expect(availableDates).not.toContain(date)
        })

        it("should exclude blackout dates", async () => {
          const blackoutDate = getFutureDate(3)

          await capacityService.createResourceBlackouts({
            resource_id: testResource.id,
            start_date: blackoutDate,
            end_date: blackoutDate,
            reason: "Maintenance",
          })

          const response = await api.get("/store/resource-booking/availability", {
            params: {
              resource_id: testResource.id,
              start_date: getFutureDate(1),
              end_date: getFutureDate(10),
              quantity: 1,
            },
          })

          expect(response.status).toBe(200)

          const availableDates = response.data.available_dates.map((d: any) => d.date)
          expect(availableDates).not.toContain(blackoutDate)
        })

        it("should return 400 for invalid date format", async () => {
          const response = await api
            .get("/store/resource-booking/availability", {
              params: {
                resource_id: testResource.id,
                start_date: "invalid-date",
                end_date: getFutureDate(10),
                quantity: 1,
              },
            })
            .catch((err) => err.response)

          expect(response.status).toBe(400)
          expect(response.data).toHaveProperty("error")
        })

        it("should return 400 for date range > 365 days", async () => {
          const response = await api
            .get("/store/resource-booking/availability", {
              params: {
                resource_id: testResource.id,
                start_date: getFutureDate(1),
                end_date: getFutureDate(400), // More than 365 days
                quantity: 1,
              },
            })
            .catch((err) => err.response)

          expect(response.status).toBe(400)
        })

        it("should include capacity details in response", async () => {
          const response = await api.get("/store/resource-booking/availability", {
            params: {
              resource_id: testResource.id,
              start_date: getFutureDate(1),
              end_date: getFutureDate(3),
              quantity: 1,
            },
          })

          expect(response.status).toBe(200)

          const dateInfo = response.data.available_dates[0]
          expect(dateInfo).toHaveProperty("date")
          expect(dateInfo).toHaveProperty("available_capacity")
          expect(dateInfo).toHaveProperty("max_capacity")
        })
      })

      describe("POST /store/resource-booking/holds", () => {
        it("should create hold with valid data", async () => {
          const dates = [getFutureDate(1), getFutureDate(2)]
          const data = createTestHoldData(testResource.id, dates)

          const response = await api.post("/store/resource-booking/holds", data)

          expect(response.status).toBe(201)
          expect(response.data).toHaveProperty("hold")
          expect(response.data.hold).toHaveProperty("id")
          expect(response.data.hold.status).toBe("ACTIVE")
          expect(response.data.hold).toHaveProperty("expires_at")
        })

        it("should return hold with expiration time", async () => {
          const dates = [getFutureDate(1)]
          const data = createTestHoldData(testResource.id, dates)

          const response = await api.post("/store/resource-booking/holds", data)

          expect(response.status).toBe(201)

          const expiresAt = new Date(response.data.hold.expires_at)
          const now = new Date()
          const diffMinutes = (expiresAt.getTime() - now.getTime()) / (1000 * 60)

          expect(diffMinutes).toBeGreaterThan(25) // ~30 minutes
          expect(diffMinutes).toBeLessThan(35)
        })

        it("should respect idempotency token", async () => {
          const dates = [getFutureDate(1)]
          const token = generateIdempotencyToken()
          const data = createTestHoldData(testResource.id, dates, {
            idempotencyToken: token,
          })

          // Create first hold
          const response1 = await api.post("/store/resource-booking/holds", data)
          expect(response1.status).toBe(201)

          // Try to create again with same token
          const response2 = await api.post("/store/resource-booking/holds", data)
          expect(response2.status).toBe(200) // Should return existing

          expect(response1.data.hold.id).toBe(response2.data.hold.id)
        })

        it("should return 409 for insufficient capacity", async () => {
          const date = getFutureDate(1)

          // Reduce capacity to 2
          await capacityService.adjustCapacity(testResource.id, date, -8)

          const response = await api
            .post("/store/resource-booking/holds", {
              resourceId: testResource.id,
              dates: [date],
              quantity: 5, // More than available
              customerEmail: "test@test.com",
              idempotencyToken: generateIdempotencyToken(),
            })
            .catch((err) => err.response)

          expect(response.status).toBe(409)
          expect(response.data.error.type).toBe("insufficient_capacity")
        })

        it("should return 422 for blackout dates", async () => {
          const blackoutDate = getFutureDate(5)

          await capacityService.createResourceBlackouts({
            resource_id: testResource.id,
            start_date: blackoutDate,
            end_date: blackoutDate,
            reason: "Maintenance",
          })

          const response = await api
            .post("/store/resource-booking/holds", {
              resourceId: testResource.id,
              dates: [blackoutDate],
              quantity: 1,
              customerEmail: "test@test.com",
              idempotencyToken: generateIdempotencyToken(),
            })
            .catch((err) => err.response)

          expect(response.status).toBe(422)
          expect(response.data.error.type).toBe("blackout_conflict")
        })

        it("should return 400 for invalid email", async () => {
          const response = await api
            .post("/store/resource-booking/holds", {
              resourceId: testResource.id,
              dates: [getFutureDate(1)],
              quantity: 1,
              customerEmail: "invalid-email",
              idempotencyToken: generateIdempotencyToken(),
            })
            .catch((err) => err.response)

          expect(response.status).toBe(400)
        })

        it("should return 400 for missing required fields", async () => {
          const response = await api
            .post("/store/resource-booking/holds", {
              // Missing resourceId, dates, quantity
              customerEmail: "test@test.com",
              idempotencyToken: generateIdempotencyToken(),
            })
            .catch((err) => err.response)

          expect(response.status).toBe(400)
          expect(response.data.error.type).toBe("validation_error")
        })

        it("should decrease available capacity after hold creation", async () => {
          const date = getFutureDate(1)

          const response = await api.post("/store/resource-booking/holds", {
            resourceId: testResource.id,
            dates: [date],
            quantity: 3,
            customerEmail: "test@test.com",
            idempotencyToken: generateIdempotencyToken(),
          })

          expect(response.status).toBe(201)

          // Check capacity decreased
          const capacities = await capacityService.listResourceCapacities({
            resource_id: testResource.id,
            date,
          })

          expect(capacities[0].available_capacity).toBe(7) // 10 - 3
        })
      })

      describe("POST /store/resource-booking/holds/:id/confirm", () => {
        let testHold: any

        beforeEach(async () => {
          const data = createTestHoldData(testResource.id, [getFutureDate(1)])
          const response = await api.post("/store/resource-booking/holds", data)
          testHold = response.data.hold
        })

        it("should confirm active hold", async () => {
          const orderData = createMockOrderData()

          const response = await api.post(
            `/store/resource-booking/holds/${testHold.id}/confirm`,
            orderData
          )

          expect(response.status).toBe(200)
          expect(response.data).toHaveProperty("allocation")
          expect(response.data.allocation.order_id).toBe(orderData.order_id)
        })

        it("should create allocations", async () => {
          const orderData = createMockOrderData()

          await api.post(`/store/resource-booking/holds/${testHold.id}/confirm`, orderData)

          const allocations = await holdService.getAllocationsByOrder(orderData.order_id)

          expect(allocations.length).toBeGreaterThan(0)
        })

        it("should return 404 for non-existent hold", async () => {
          const response = await api
            .post("/store/resource-booking/holds/non-existent-id/confirm", createMockOrderData())
            .catch((err) => err.response)

          expect(response.status).toBe(404)
        })

        it("should return 409 for expired hold", async () => {
          // Create expired hold
          const expiredHold = await holdService.createResourceHolds({
            resource_id: testResource.id,
            date: getFutureDate(1),
            quantity: 1,
            customer_email: "test@test.com",
            expires_at: new Date(Date.now() - 60000),
            idempotency_token: generateIdempotencyToken(),
            status: "ACTIVE",
          })

          const response = await api
            .post(
              `/store/resource-booking/holds/${expiredHold.id}/confirm`,
              createMockOrderData()
            )
            .catch((err) => err.response)

          expect(response.status).toBe(409)
        })

        it("should return 409 for already confirmed hold", async () => {
          const orderData = createMockOrderData()

          // Confirm once
          await api.post(`/store/resource-booking/holds/${testHold.id}/confirm`, orderData)

          // Try to confirm again
          const response = await api
            .post(
              `/store/resource-booking/holds/${testHold.id}/confirm`,
              createMockOrderData()
            )
            .catch((err) => err.response)

          expect(response.status).toBe(409)
        })
      })

      describe("DELETE /store/resource-booking/holds/:id", () => {
        let testHold: any

        beforeEach(async () => {
          const data = createTestHoldData(testResource.id, [getFutureDate(1)], {
            quantity: 3,
          })
          const response = await api.post("/store/resource-booking/holds", data)
          testHold = response.data.hold
        })

        it("should release active hold", async () => {
          const response = await api.delete(`/store/resource-booking/holds/${testHold.id}`)

          expect(response.status).toBe(200)
          expect(response.data.hold.status).toBe("RELEASED")
        })

        it("should restore capacity", async () => {
          const date = getFutureDate(1)

          await api.delete(`/store/resource-booking/holds/${testHold.id}`)

          const capacities = await capacityService.listResourceCapacities({
            resource_id: testResource.id,
            date,
          })

          expect(capacities[0].available_capacity).toBe(10) // Restored
        })

        it("should return 404 for non-existent hold", async () => {
          const response = await api
            .delete("/store/resource-booking/holds/non-existent-id")
            .catch((err) => err.response)

          expect(response.status).toBe(404)
        })

        it("should return 409 for already confirmed hold", async () => {
          // Confirm the hold
          await holdService.confirmHold(testHold.id, createMockOrderData())

          const response = await api
            .delete(`/store/resource-booking/holds/${testHold.id}`)
            .catch((err) => err.response)

          expect(response.status).toBe(409)
        })
      })

      describe("Performance", () => {
        it("should respond to availability check in < 300ms", async () => {
          const startTime = Date.now()

          await api.get("/store/resource-booking/availability", {
            params: {
              resource_id: testResource.id,
              start_date: getFutureDate(1),
              end_date: getFutureDate(30),
              quantity: 1,
            },
          })

          const endTime = Date.now()
          const duration = endTime - startTime

          expect(duration).toBeLessThan(300)
        })

        it("should respond to hold creation in < 300ms", async () => {
          const data = createTestHoldData(testResource.id, [getFutureDate(1)])

          const startTime = Date.now()
          await api.post("/store/resource-booking/holds", data)
          const endTime = Date.now()

          const duration = endTime - startTime

          expect(duration).toBeLessThan(300)
        })
      })
    })
  },
})
