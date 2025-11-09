/**
 * API Integration tests for Admin Resource Booking endpoints
 * Tests /admin/resource-booking/* routes
 */

import { medusaIntegrationTestRunner } from "@medusajs/test-utils"
import {
  createTestResourceData,
  createTestBlackoutData,
  generateDateRange,
  getFutureDate,
  cleanupResourceBookingData,
} from "../../utils/resource-booking-helpers"

jest.setTimeout(60000)

medusaIntegrationTestRunner({
  inApp: true,
  env: {},
  testSuite: ({ api, getContainer }) => {
    describe("Admin API - Resource Booking", () => {
      let container: any
      let resourceService: any
      let capacityService: any

      beforeEach(async () => {
        container = getContainer()
        resourceService = container.resolve("resourceService")
        capacityService = container.resolve("capacityService")
      })

      afterEach(async () => {
        await cleanupResourceBookingData(container)
      })

      describe("Resource Management", () => {
        describe("POST /admin/resource-booking/resources", () => {
          it("should create resource", async () => {
            const data = createTestResourceData()

            const response = await api.post("/admin/resource-booking/resources", data, {
              headers: { authorization: "Bearer admin-token" },
            })

            expect(response.status).toBe(201)
            expect(response.data).toHaveProperty("resource")
            expect(response.data.resource.name).toBe(data.name)
            expect(response.data.resource.type).toBe(data.type)
          })

          it("should validate resource type", async () => {
            const response = await api
              .post(
                "/admin/resource-booking/resources",
                { ...createTestResourceData(), type: "INVALID_TYPE" },
                { headers: { authorization: "Bearer admin-token" } }
              )
              .catch((err) => err.response)

            expect(response.status).toBe(400)
          })

          it("should require authentication", async () => {
            const response = await api
              .post("/admin/resource-booking/resources", createTestResourceData())
              .catch((err) => err.response)

            expect(response.status).toBe(401)
          })
        })

        describe("GET /admin/resource-booking/resources", () => {
          beforeEach(async () => {
            // Create test resources
            await resourceService.createResources(
              createTestResourceData({ name: "Vehicle 1", type: "VEHICLE" })
            )
            await resourceService.createResources(
              createTestResourceData({ name: "Tour 1", type: "TOUR" })
            )
          })

          it("should list resources with pagination", async () => {
            const response = await api.get("/admin/resource-booking/resources", {
              params: { limit: 10, offset: 0 },
              headers: { authorization: "Bearer admin-token" },
            })

            expect(response.status).toBe(200)
            expect(response.data).toHaveProperty("resources")
            expect(response.data).toHaveProperty("count")
            expect(Array.isArray(response.data.resources)).toBe(true)
          })

          it("should filter by type", async () => {
            const response = await api.get("/admin/resource-booking/resources", {
              params: { type: "VEHICLE" },
              headers: { authorization: "Bearer admin-token" },
            })

            expect(response.status).toBe(200)
            expect(response.data.resources.every((r: any) => r.type === "VEHICLE")).toBe(true)
          })

          it("should filter by is_active", async () => {
            await resourceService.createResources(
              createTestResourceData({ is_active: false })
            )

            const response = await api.get("/admin/resource-booking/resources", {
              params: { is_active: true },
              headers: { authorization: "Bearer admin-token" },
            })

            expect(response.status).toBe(200)
            expect(response.data.resources.every((r: any) => r.is_active === true)).toBe(true)
          })
        })

        describe("GET /admin/resource-booking/resources/:id", () => {
          let testResource: any

          beforeEach(async () => {
            testResource = await resourceService.createResources(createTestResourceData())
          })

          it("should get resource details", async () => {
            const response = await api.get(
              `/admin/resource-booking/resources/${testResource.id}`,
              { headers: { authorization: "Bearer admin-token" } }
            )

            expect(response.status).toBe(200)
            expect(response.data.resource.id).toBe(testResource.id)
          })

          it("should return 404 for non-existent resource", async () => {
            const response = await api
              .get("/admin/resource-booking/resources/non-existent-id", {
                headers: { authorization: "Bearer admin-token" },
              })
              .catch((err) => err.response)

            expect(response.status).toBe(404)
          })
        })

        describe("PUT /admin/resource-booking/resources/:id", () => {
          let testResource: any

          beforeEach(async () => {
            testResource = await resourceService.createResources(createTestResourceData())
          })

          it("should update resource", async () => {
            const response = await api.put(
              `/admin/resource-booking/resources/${testResource.id}`,
              { name: "Updated Name", description: "Updated description" },
              { headers: { authorization: "Bearer admin-token" } }
            )

            expect(response.status).toBe(200)
            expect(response.data.resource.name).toBe("Updated Name")
          })

          it("should validate update data", async () => {
            const response = await api
              .put(
                `/admin/resource-booking/resources/${testResource.id}`,
                { type: "INVALID_TYPE" },
                { headers: { authorization: "Bearer admin-token" } }
              )
              .catch((err) => err.response)

            expect(response.status).toBe(400)
          })
        })

        describe("DELETE /admin/resource-booking/resources/:id", () => {
          let testResource: any

          beforeEach(async () => {
            testResource = await resourceService.createResources(createTestResourceData())
          })

          it("should soft delete resource", async () => {
            const response = await api.delete(
              `/admin/resource-booking/resources/${testResource.id}`,
              { headers: { authorization: "Bearer admin-token" } }
            )

            expect(response.status).toBe(200)

            // Verify soft delete
            const deleted = await resourceService.retrieveResource(testResource.id)
            expect(deleted.deleted_at).toBeDefined()
            expect(deleted.is_active).toBe(false)
          })

          it("should not return deleted resources in list", async () => {
            await api.delete(`/admin/resource-booking/resources/${testResource.id}`, {
              headers: { authorization: "Bearer admin-token" },
            })

            const response = await api.get("/admin/resource-booking/resources", {
              headers: { authorization: "Bearer admin-token" },
            })

            expect(
              response.data.resources.find((r: any) => r.id === testResource.id)
            ).toBeUndefined()
          })
        })
      })

      describe("Capacity Management", () => {
        let testResource: any

        beforeEach(async () => {
          testResource = await resourceService.createResources(createTestResourceData())
        })

        describe("POST /admin/resource-booking/resources/:id/capacity/initialize", () => {
          it("should initialize capacity for date range", async () => {
            const response = await api.post(
              `/admin/resource-booking/resources/${testResource.id}/capacity/initialize`,
              {
                start_date: getFutureDate(1),
                end_date: getFutureDate(10),
                daily_capacity: 5,
              },
              { headers: { authorization: "Bearer admin-token" } }
            )

            expect(response.status).toBe(200)
            expect(response.data).toHaveProperty("capacities")
            expect(response.data.capacities.length).toBe(10)
          })

          it("should not duplicate existing capacity", async () => {
            const dates = generateDateRange(getFutureDate(1), 5)

            // Initialize once
            await capacityService.initializeCapacity(testResource.id, dates, 5)

            // Try to initialize again
            const response = await api.post(
              `/admin/resource-booking/resources/${testResource.id}/capacity/initialize`,
              {
                start_date: getFutureDate(1),
                end_date: getFutureDate(5),
                daily_capacity: 5,
              },
              { headers: { authorization: "Bearer admin-token" } }
            )

            expect(response.status).toBe(200)

            // Verify no duplicates
            const all = await capacityService.listResourceCapacities({
              resource_id: testResource.id,
            })
            expect(all.length).toBe(5)
          })

          it("should return 400 for invalid date range", async () => {
            const response = await api
              .post(
                `/admin/resource-booking/resources/${testResource.id}/capacity/initialize`,
                {
                  start_date: getFutureDate(10),
                  end_date: getFutureDate(1), // End before start
                  daily_capacity: 5,
                },
                { headers: { authorization: "Bearer admin-token" } }
              )
              .catch((err) => err.response)

            expect(response.status).toBe(400)
          })
        })

        describe("GET /admin/resource-booking/resources/:id/capacity/report", () => {
          beforeEach(async () => {
            const dates = generateDateRange(getFutureDate(1), 10)
            await capacityService.initializeCapacity(testResource.id, dates, 10)
          })

          it("should get capacity report", async () => {
            const response = await api.get(
              `/admin/resource-booking/resources/${testResource.id}/capacity/report`,
              {
                params: {
                  start_date: getFutureDate(1),
                  end_date: getFutureDate(10),
                },
                headers: { authorization: "Bearer admin-token" },
              }
            )

            expect(response.status).toBe(200)
            expect(response.data).toHaveProperty("capacity_report")
            expect(Array.isArray(response.data.capacity_report)).toBe(true)
          })

          it("should include utilization metrics", async () => {
            const response = await api.get(
              `/admin/resource-booking/resources/${testResource.id}/capacity/report`,
              {
                params: {
                  start_date: getFutureDate(1),
                  end_date: getFutureDate(10),
                },
                headers: { authorization: "Bearer admin-token" },
              }
            )

            expect(response.status).toBe(200)

            const report = response.data.capacity_report[0]
            expect(report).toHaveProperty("date")
            expect(report).toHaveProperty("max_capacity")
            expect(report).toHaveProperty("available_capacity")
            expect(report).toHaveProperty("utilization_percent")
          })
        })
      })

      describe("Blackout Management", () => {
        let testResource: any

        beforeEach(async () => {
          testResource = await resourceService.createResources(createTestResourceData())
        })

        describe("POST /admin/resource-booking/blackouts", () => {
          it("should create blackout", async () => {
            const data = createTestBlackoutData(testResource.id)

            const response = await api.post("/admin/resource-booking/blackouts", data, {
              headers: { authorization: "Bearer admin-token" },
            })

            expect(response.status).toBe(201)
            expect(response.data).toHaveProperty("blackout")
            expect(response.data.blackout.resource_id).toBe(testResource.id)
          })

          it("should return 400 for end_date < start_date", async () => {
            const response = await api
              .post(
                "/admin/resource-booking/blackouts",
                {
                  resource_id: testResource.id,
                  start_date: getFutureDate(10),
                  end_date: getFutureDate(1),
                  reason: "Invalid",
                },
                { headers: { authorization: "Bearer admin-token" } }
              )
              .catch((err) => err.response)

            expect(response.status).toBe(400)
          })
        })

        describe("GET /admin/resource-booking/blackouts", () => {
          beforeEach(async () => {
            await capacityService.createResourceBlackouts(
              createTestBlackoutData(testResource.id, { reason: "Blackout 1" })
            )
            await capacityService.createResourceBlackouts(
              createTestBlackoutData(testResource.id, { reason: "Blackout 2" })
            )
          })

          it("should list blackouts for resource", async () => {
            const response = await api.get("/admin/resource-booking/blackouts", {
              params: { resource_id: testResource.id },
              headers: { authorization: "Bearer admin-token" },
            })

            expect(response.status).toBe(200)
            expect(response.data).toHaveProperty("blackouts")
            expect(response.data.blackouts.length).toBeGreaterThanOrEqual(2)
          })
        })

        describe("DELETE /admin/resource-booking/blackouts/:id", () => {
          let testBlackout: any

          beforeEach(async () => {
            testBlackout = await capacityService.createResourceBlackouts(
              createTestBlackoutData(testResource.id)
            )
          })

          it("should delete blackout", async () => {
            const response = await api.delete(
              `/admin/resource-booking/blackouts/${testBlackout.id}`,
              { headers: { authorization: "Bearer admin-token" } }
            )

            expect(response.status).toBe(200)

            // Verify deleted
            const blackouts = await capacityService.listResourceBlackouts({
              id: testBlackout.id,
            })
            expect(blackouts.length).toBe(0)
          })
        })

        describe("Blackout impact on holds", () => {
          beforeEach(async () => {
            const dates = generateDateRange(getFutureDate(1), 10)
            await capacityService.initializeCapacity(testResource.id, dates, 10)
          })

          it("should prevent holds during blackout", async () => {
            const blackoutDate = getFutureDate(5)

            await capacityService.createResourceBlackouts(
              createTestBlackoutData(testResource.id, {
                start_date: blackoutDate,
                end_date: blackoutDate,
                reason: "Maintenance",
              })
            )

            // Verify availability returns false
            const availability = await capacityService.checkAvailability(
              testResource.id,
              [blackoutDate],
              1
            )

            expect(availability[0].available).toBe(false)
            expect(availability[0].reason).toContain("Maintenance")
          })
        })
      })

      describe("Authentication & Authorization", () => {
        let testResource: any

        beforeEach(async () => {
          testResource = await resourceService.createResources(createTestResourceData())
        })

        it("should require admin authentication for all endpoints", async () => {
          const endpoints = [
            { method: "get", path: "/admin/resource-booking/resources" },
            {
              method: "post",
              path: "/admin/resource-booking/resources",
              data: createTestResourceData(),
            },
            { method: "get", path: `/admin/resource-booking/resources/${testResource.id}` },
            {
              method: "put",
              path: `/admin/resource-booking/resources/${testResource.id}`,
              data: {},
            },
            {
              method: "delete",
              path: `/admin/resource-booking/resources/${testResource.id}`,
            },
            {
              method: "post",
              path: "/admin/resource-booking/blackouts",
              data: createTestBlackoutData(testResource.id),
            },
          ]

          for (const endpoint of endpoints) {
            const response = await (api as any)[endpoint.method](
              endpoint.path,
              (endpoint as any).data
            ).catch((err: any) => err.response)

            expect(response.status).toBe(401)
          }
        })
      })
    })
  },
})
