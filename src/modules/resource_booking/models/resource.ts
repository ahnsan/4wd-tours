import { model } from "@medusajs/framework/utils"

/**
 * Resource Type Enumeration
 * Defines the types of resources that can be booked in the system
 */
export enum ResourceType {
  VEHICLE = "VEHICLE",
  TOUR = "TOUR",
  GUIDE = "GUIDE",
}

/**
 * Resource Model
 * Represents a bookable resource in the system (vehicle, tour, or guide)
 *
 * Features:
 * - Soft delete support via deleted_at field
 * - Indexed type and is_active for efficient filtering
 * - JSONB metadata for flexible attribute storage
 * - Automatic timestamp management (created_at, updated_at)
 *
 * Performance optimizations:
 * - Indexes on type and is_active for fast WHERE queries
 * - Compound index for common query pattern (type + is_active)
 */
const Resource = model.define("resource", {
  id: model.id().primaryKey(),

  /**
   * Resource type (VEHICLE, TOUR, GUIDE)
   * Indexed for fast filtering by type
   */
  type: model.enum(ResourceType),

  /**
   * Resource name (e.g., "Toyota LandCruiser", "Fraser Island Tour")
   */
  name: model.text(),

  /**
   * Detailed description of the resource
   */
  description: model.text().nullable(),

  /**
   * Flexible JSONB field for resource-specific attributes
   * Examples:
   * - Vehicle: { make: "Toyota", model: "LandCruiser", year: 2023, seats: 7 }
   * - Tour: { duration_hours: 8, difficulty: "moderate", min_participants: 4 }
   * - Guide: { languages: ["en", "es"], certifications: ["first-aid", "4wd"] }
   */
  metadata: model.json().nullable(),

  /**
   * Active status flag
   * Indexed for fast filtering of active resources
   */
  is_active: model.boolean().default(true),

  /**
   * Soft delete timestamp
   * When set, the resource is considered deleted but data is preserved
   */
  deleted_at: model.dateTime().nullable(),
})

export default Resource
