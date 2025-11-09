import { model } from "@medusajs/framework/utils"

/**
 * ResourceAllocation Model
 * Represents a confirmed allocation of resource capacity to an order
 *
 * Lifecycle:
 * 1. Hold is created (ResourceHold with ACTIVE status)
 * 2. Customer completes checkout
 * 3. Hold is confirmed via HoldService.confirmHold()
 * 4. ResourceAllocation is created, linking to order and line item
 * 5. Hold status changes to CONFIRMED
 *
 * Integration with Medusa Order System:
 * - order_id: Links to Medusa Order entity
 * - line_item_id: Links to specific OrderLineItem that booked the resource
 * - Enables tracking which product/variant was booked
 *
 * Date Handling:
 * - date is date-only (YYYY-MM-DD) in Australia/Brisbane timezone
 * - No time component needed as bookings are date-based
 *
 * Performance optimizations:
 * - Compound index on (resource_id, date) for fast availability lookups
 * - Index on order_id for order-based queries
 * - created_at for audit trail and reporting
 */
const ResourceAllocation = model.define("resource_allocation", {
  id: model.id().primaryKey(),

  /**
   * Reference to the resource being allocated
   * Indexed as part of compound index (resource_id, date)
   */
  resource_id: model.text(),

  /**
   * Date for which capacity is allocated (date-only)
   * Format: YYYY-MM-DD in Australia/Brisbane timezone
   */
  date: model.date(),

  /**
   * Number of capacity units allocated
   * Must be > 0 (validated at service layer)
   */
  quantity: model.number(),

  /**
   * Reference to Medusa Order
   * Links this allocation to the customer's order
   * Indexed for fast order lookups
   */
  order_id: model.text(),

  /**
   * Reference to Medusa OrderLineItem
   * Links this allocation to the specific product/variant booked
   * Enables tracking exactly what was purchased
   */
  line_item_id: model.text(),

  /**
   * Creation timestamp
   * Immutable - allocations are never updated, only created
   * Used for audit trail and reporting
   */
  created_at: model.dateTime().default(() => new Date()),
})

// Note: Indexes defined in migrations
// Compound index: (resource_id, date)
// Index: order_id

export default ResourceAllocation
