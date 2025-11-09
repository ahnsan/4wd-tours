import { model } from "@medusajs/framework/utils"

/**
 * ResourceCapacity Model
 * Tracks available capacity for resources on specific dates
 *
 * This is the core model for preventing double-booking:
 * - max_capacity: Total slots available for a resource on a date
 * - available_capacity: Remaining slots after holds and allocations
 *
 * Concurrency Control:
 * - Updates to available_capacity MUST use PostgreSQL advisory locks
 * - Enforced at service layer via CapacityService.adjustCapacity()
 *
 * Date Handling:
 * - Dates stored as date-only (YYYY-MM-DD) in Australia/Brisbane timezone
 * - No time component to prevent timezone confusion
 *
 * Performance optimizations:
 * - Unique constraint on (resource_id, date) ensures one row per resource per day
 * - Index on date for fast date range queries
 * - Index on resource_id for fast resource lookups
 */
const ResourceCapacity = model.define("resource_capacity", {
  id: model.id().primaryKey(),

  /**
   * Reference to the resource
   * Indexed as part of unique constraint (resource_id, date)
   */
  resource_id: model.text(),

  /**
   * Date for this capacity record (date-only, no time)
   * Format: YYYY-MM-DD in Australia/Brisbane timezone
   * Indexed for date range queries and uniqueness
   */
  date: model.date(),

  /**
   * Maximum capacity available for this resource on this date
   * Must be >= 0
   * Validation enforced at service layer
   */
  max_capacity: model.number(),

  /**
   * Available capacity remaining after holds and allocations
   * Must be >= 0 and <= max_capacity
   * Validation enforced at service layer
   *
   * CRITICAL: Updates must use concurrency control (advisory locks)
   */
  available_capacity: model.number(),
})

// Note: Unique constraint and indexes are defined in migrations
// Unique: (resource_id, date)
// Index: date
// Index: resource_id

export default ResourceCapacity
