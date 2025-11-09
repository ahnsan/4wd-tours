import { model } from "@medusajs/framework/utils"

/**
 * ResourceBlackout Model
 * Defines date ranges when a resource is unavailable for booking
 *
 * Use Cases:
 * - Maintenance periods for vehicles
 * - Holiday/vacation periods for guides
 * - Seasonal closures for tours
 * - Emergency unavailability
 *
 * Date Handling:
 * - start_date and end_date are date-only (YYYY-MM-DD)
 * - end_date is INCLUSIVE (both start and end dates are blocked)
 * - Stored in Australia/Brisbane timezone
 *
 * Validation:
 * - end_date must be >= start_date (enforced at service layer)
 *
 * Performance optimizations:
 * - Compound index on (resource_id, start_date, end_date) for fast range checks
 * - Enables efficient "is date in blackout?" queries
 */
const ResourceBlackout = model.define("resource_blackout", {
  id: model.id().primaryKey(),

  /**
   * Reference to the resource being blacked out
   * Indexed as part of compound index (resource_id, start_date, end_date)
   */
  resource_id: model.text(),

  /**
   * Start date of blackout period (date-only, inclusive)
   * Format: YYYY-MM-DD in Australia/Brisbane timezone
   */
  start_date: model.date(),

  /**
   * End date of blackout period (date-only, inclusive)
   * Format: YYYY-MM-DD in Australia/Brisbane timezone
   * Must be >= start_date
   */
  end_date: model.date(),

  /**
   * Human-readable reason for the blackout
   * Examples: "Vehicle maintenance", "Guide on leave", "Seasonal closure"
   */
  reason: model.text().nullable(),
})

// Note: Indexes defined in migrations
// Compound index: (resource_id, start_date, end_date)

export default ResourceBlackout
