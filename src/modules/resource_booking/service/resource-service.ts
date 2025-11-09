import { MedusaService } from "@medusajs/framework/utils"
import Resource from "../models/resource"
import { ResourceType } from "../models/resource"

/**
 * Resource filters for querying
 */
export interface ResourceFilters {
  id?: string
  type?: ResourceType
  is_active?: boolean
  deleted_at?: null | Date
}

/**
 * Resource list configuration
 */
export interface ResourceListConfig {
  skip?: number
  take?: number
  order?: {
    [key: string]: "ASC" | "DESC"
  }
}

/**
 * ResourceService
 * Manages CRUD operations for bookable resources
 *
 * Automatically generated methods by MedusaService:
 * - listResources(filters, config)
 * - listAndCountResources(filters, config)
 * - retrieveResource(id, config)
 * - createResources(data)
 * - updateResources(id, data)
 * - deleteResources(id)
 *
 * Custom methods:
 * - getActiveResources(type?)
 * - softDeleteResource(id)
 * - restoreResource(id)
 * - getResourcesByType(type)
 */
class ResourceService extends MedusaService({ Resource }) {
  /**
   * Get all active resources, optionally filtered by type
   *
   * @param type - Optional resource type filter
   * @returns Array of active resources
   *
   * @example
   * const vehicles = await resourceService.getActiveResources(ResourceType.VEHICLE)
   * const allActive = await resourceService.getActiveResources()
   */
  async getActiveResources(type?: ResourceType) {
    const filters: ResourceFilters = {
      is_active: true,
      deleted_at: null,
    }

    if (type) {
      filters.type = type
    }

    return await this.listResources(filters, {
      order: { name: "ASC" },
    })
  }

  /**
   * Soft delete a resource
   * Sets deleted_at timestamp and marks as inactive
   *
   * @param id - Resource ID to soft delete
   * @returns Updated resource
   *
   * @example
   * await resourceService.softDeleteResource("res_123")
   */
  async softDeleteResource(id: string) {
    return await this.updateResources(
      { id },
      {
        deleted_at: new Date(),
        is_active: false,
      }
    )
  }

  /**
   * Restore a soft-deleted resource
   * Clears deleted_at timestamp and marks as active
   *
   * @param id - Resource ID to restore
   * @returns Updated resource
   *
   * @example
   * await resourceService.restoreResource("res_123")
   */
  async restoreResource(id: string) {
    return await this.updateResources(
      { id },
      {
        deleted_at: null,
        is_active: true,
      }
    )
  }

  /**
   * Get all resources of a specific type
   *
   * @param type - Resource type to filter by
   * @param includeInactive - Whether to include inactive resources
   * @returns Array of resources
   *
   * @example
   * const vehicles = await resourceService.getResourcesByType(ResourceType.VEHICLE)
   * const allTours = await resourceService.getResourcesByType(ResourceType.TOUR, true)
   */
  async getResourcesByType(type: ResourceType, includeInactive: boolean = false) {
    const filters: ResourceFilters = {
      type,
      deleted_at: null,
    }

    if (!includeInactive) {
      filters.is_active = true
    }

    return await this.listResources(filters, {
      order: { name: "ASC" },
    })
  }

  /**
   * Check if a resource exists and is active
   *
   * @param id - Resource ID to check
   * @returns True if resource exists and is active
   *
   * @example
   * const exists = await resourceService.isResourceAvailable("res_123")
   */
  async isResourceAvailable(id: string): Promise<boolean> {
    try {
      const resource = await this.retrieveResource(id)
      return resource.is_active && !resource.deleted_at
    } catch (error) {
      return false
    }
  }

  /**
   * Get resource by ID with existence validation
   *
   * @param id - Resource ID
   * @throws Error if resource not found or deleted
   * @returns Resource object
   *
   * @example
   * const resource = await resourceService.getResourceOrFail("res_123")
   */
  async getResourceOrFail(id: string) {
    const resource = await this.retrieveResource(id)

    if (!resource) {
      throw new Error(`Resource with ID ${id} not found`)
    }

    if (resource.deleted_at) {
      throw new Error(`Resource with ID ${id} has been deleted`)
    }

    return resource
  }
}

export default ResourceService
