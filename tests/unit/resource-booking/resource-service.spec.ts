/**
 * Unit tests for ResourceService
 * Tests CRUD operations and soft delete functionality
 */

import { medusaIntegrationTestRunner } from "@medusajs/test-utils"
import { ModuleRegistrationName } from "@medusajs/framework/utils"
import {
  createTestResourceData,
  cleanupResourceBookingData,
} from "../../utils/resource-booking-helpers"

jest.setTimeout(30000)

medusaIntegrationTestRunner({
  testSuite: ({ getContainer }) => {
    describe("ResourceService", () => {
      let container: any
      let resourceService: any

      beforeEach(async () => {
        container = getContainer()
        resourceService = container.resolve("resourceService")
      })

      afterEach(async () => {
        await cleanupResourceBookingData(container)
      })

      describe("createResources", () => {
        it("should create a resource with valid data", async () => {
          const data = createTestResourceData()

          const resource = await resourceService.createResources(data)

          expect(resource).toBeDefined()
          expect(resource.id).toBeDefined()
          expect(resource.type).toBe("VEHICLE")
          expect(resource.name).toBe("Test Vehicle 1")
          expect(resource.is_active).toBe(true)
          expect(resource.deleted_at).toBeNull()
        })

        it("should create resource with metadata", async () => {
          const data = createTestResourceData({
            metadata: { license_plate: "ABC123", seats: 7 },
          })

          const resource = await resourceService.createResources(data)

          expect(resource.metadata).toEqual({ license_plate: "ABC123", seats: 7 })
        })

        it("should set default is_active to true", async () => {
          const data = createTestResourceData()
          delete data.is_active

          const resource = await resourceService.createResources(data)

          expect(resource.is_active).toBe(true)
        })
      })

      describe("updateResources", () => {
        it("should update resource fields", async () => {
          const resource = await resourceService.createResources(createTestResourceData())

          const updated = await resourceService.updateResources(
            { id: resource.id },
            { name: "Updated Vehicle", description: "Updated description" }
          )

          expect(updated.name).toBe("Updated Vehicle")
          expect(updated.description).toBe("Updated description")
        })

        it("should update resource metadata", async () => {
          const resource = await resourceService.createResources(createTestResourceData())

          const updated = await resourceService.updateResources(
            { id: resource.id },
            { metadata: { seats: 5, color: "blue" } }
          )

          expect(updated.metadata.seats).toBe(5)
          expect(updated.metadata.color).toBe("blue")
        })

        it("should mark resource as inactive", async () => {
          const resource = await resourceService.createResources(createTestResourceData())

          const updated = await resourceService.updateResources(
            { id: resource.id },
            { is_active: false }
          )

          expect(updated.is_active).toBe(false)
        })
      })

      describe("softDeleteResource", () => {
        it("should soft delete resource", async () => {
          const resource = await resourceService.createResources(createTestResourceData())

          await resourceService.softDeleteResource(resource.id)

          const deleted = await resourceService.retrieveResource(resource.id)
          expect(deleted.deleted_at).toBeDefined()
          expect(deleted.deleted_at).not.toBeNull()
          expect(deleted.is_active).toBe(false)
        })

        it("should not return soft deleted resources in active list", async () => {
          const resource = await resourceService.createResources(createTestResourceData())
          await resourceService.softDeleteResource(resource.id)

          const activeResources = await resourceService.getActiveResources()

          expect(activeResources).not.toContainEqual(
            expect.objectContaining({ id: resource.id })
          )
        })
      })

      describe("restoreResource", () => {
        it("should restore a soft-deleted resource", async () => {
          const resource = await resourceService.createResources(createTestResourceData())
          await resourceService.softDeleteResource(resource.id)

          const restored = await resourceService.restoreResource(resource.id)

          expect(restored.deleted_at).toBeNull()
          expect(restored.is_active).toBe(true)
        })
      })

      describe("listResources", () => {
        it("should return all resources", async () => {
          await resourceService.createResources(createTestResourceData({ name: "Vehicle 1" }))
          await resourceService.createResources(createTestResourceData({ name: "Vehicle 2" }))

          const resources = await resourceService.listResources({})

          expect(resources.length).toBeGreaterThanOrEqual(2)
        })

        it("should filter by type", async () => {
          await resourceService.createResources(createTestResourceData({ type: "VEHICLE" }))
          await resourceService.createResources(createTestResourceData({ type: "TOUR" }))

          const vehicles = await resourceService.listResources({ type: "VEHICLE" })

          expect(vehicles.every((r: any) => r.type === "VEHICLE")).toBe(true)
        })

        it("should filter by is_active", async () => {
          const active = await resourceService.createResources(
            createTestResourceData({ is_active: true })
          )
          const inactive = await resourceService.createResources(
            createTestResourceData({ is_active: false })
          )

          const activeResources = await resourceService.listResources({ is_active: true })

          expect(activeResources).toContainEqual(expect.objectContaining({ id: active.id }))
          expect(activeResources).not.toContainEqual(
            expect.objectContaining({ id: inactive.id })
          )
        })
      })

      describe("getActiveResources", () => {
        it("should return only active resources", async () => {
          await resourceService.createResources(createTestResourceData({ is_active: true }))
          await resourceService.createResources(createTestResourceData({ is_active: false }))

          const activeResources = await resourceService.getActiveResources()

          expect(activeResources.every((r: any) => r.is_active === true)).toBe(true)
        })

        it("should filter active resources by type", async () => {
          await resourceService.createResources(
            createTestResourceData({ type: "VEHICLE", is_active: true })
          )
          await resourceService.createResources(
            createTestResourceData({ type: "TOUR", is_active: true })
          )

          const vehicles = await resourceService.getActiveResources("VEHICLE")

          expect(vehicles.every((r: any) => r.type === "VEHICLE" && r.is_active)).toBe(true)
        })
      })

      describe("getResourcesByType", () => {
        it("should return resources of specific type", async () => {
          await resourceService.createResources(createTestResourceData({ type: "VEHICLE" }))
          await resourceService.createResources(createTestResourceData({ type: "TOUR" }))

          const vehicles = await resourceService.getResourcesByType("VEHICLE")

          expect(vehicles.every((r: any) => r.type === "VEHICLE")).toBe(true)
        })

        it("should exclude inactive resources by default", async () => {
          await resourceService.createResources(
            createTestResourceData({ type: "VEHICLE", is_active: false })
          )

          const vehicles = await resourceService.getResourcesByType("VEHICLE")

          expect(vehicles.length).toBe(0)
        })

        it("should include inactive resources when specified", async () => {
          await resourceService.createResources(
            createTestResourceData({ type: "VEHICLE", is_active: false })
          )

          const vehicles = await resourceService.getResourcesByType("VEHICLE", true)

          expect(vehicles.length).toBeGreaterThan(0)
        })
      })

      describe("isResourceAvailable", () => {
        it("should return true for active resource", async () => {
          const resource = await resourceService.createResources(
            createTestResourceData({ is_active: true })
          )

          const available = await resourceService.isResourceAvailable(resource.id)

          expect(available).toBe(true)
        })

        it("should return false for inactive resource", async () => {
          const resource = await resourceService.createResources(
            createTestResourceData({ is_active: false })
          )

          const available = await resourceService.isResourceAvailable(resource.id)

          expect(available).toBe(false)
        })

        it("should return false for deleted resource", async () => {
          const resource = await resourceService.createResources(createTestResourceData())
          await resourceService.softDeleteResource(resource.id)

          const available = await resourceService.isResourceAvailable(resource.id)

          expect(available).toBe(false)
        })

        it("should return false for non-existent resource", async () => {
          const available = await resourceService.isResourceAvailable("non-existent-id")

          expect(available).toBe(false)
        })
      })

      describe("getResourceOrFail", () => {
        it("should return resource if exists and active", async () => {
          const created = await resourceService.createResources(createTestResourceData())

          const resource = await resourceService.getResourceOrFail(created.id)

          expect(resource.id).toBe(created.id)
        })

        it("should throw error for non-existent resource", async () => {
          await expect(
            resourceService.getResourceOrFail("non-existent-id")
          ).rejects.toThrow()
        })

        it("should throw error for deleted resource", async () => {
          const resource = await resourceService.createResources(createTestResourceData())
          await resourceService.softDeleteResource(resource.id)

          await expect(resourceService.getResourceOrFail(resource.id)).rejects.toThrow(
            "has been deleted"
          )
        })
      })
    })
  },
})
