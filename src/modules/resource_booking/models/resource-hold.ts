import { model } from "@medusajs/framework/utils"

/**
 * Hold Status Enumeration
 * Tracks the lifecycle of a resource hold
 */
export enum HoldStatus {
  /** Hold is active and capacity is reserved */
  ACTIVE = "ACTIVE",
  /** Hold was converted to a confirmed allocation */
  CONFIRMED = "CONFIRMED",
  /** Hold was manually released, capacity restored */
  RELEASED = "RELEASED",
  /** Hold expired due to TTL, capacity restored */
  EXPIRED = "EXPIRED",
}

/**
 * ResourceHold Model
 * Represents a temporary reservation of resource capacity
 *
 * Business Rules:
 * - Holds expire after 30 minutes (TTL) if not confirmed
 * - Expired holds are automatically cleaned up by cron job
 * - Capacity is reserved while hold is ACTIVE
 * - Capacity is restored when hold is RELEASED or EXPIRED
 * - Capacity is permanently allocated when hold is CONFIRMED
 *
 * Idempotency:
 * - idempotency_token ensures duplicate hold requests return existing hold
 * - Token is unique across all holds
 * - Prevents race conditions in high-concurrency scenarios
 *
 * Date Handling:
 * - date is date-only (YYYY-MM-DD) in Australia/Brisbane timezone
 * - expires_at is full timestamp for TTL enforcement
 *
 * Performance optimizations:
 * - Compound index on (resource_id, date, status) for active hold lookups
 * - Index on expires_at for efficient expired hold cleanup
 * - Unique index on idempotency_token for fast duplicate detection
 */
const ResourceHold = model.define("resource_hold", {
  id: model.id().primaryKey(),

  /**
   * Reference to the resource being held
   * Indexed as part of compound index (resource_id, date, status)
   */
  resource_id: model.text(),

  /**
   * Date for which capacity is held (date-only)
   * Format: YYYY-MM-DD in Australia/Brisbane timezone
   */
  date: model.date(),

  /**
   * Number of capacity units being held
   * Default: 1
   * Must be > 0 (validated at service layer)
   */
  quantity: model.number().default(1),

  /**
   * Email of customer who created the hold
   * Used for customer communication and tracking
   */
  customer_email: model.text().nullable(),

  /**
   * Expiration timestamp (30 minutes from creation)
   * Full timestamp with timezone
   * Indexed for efficient cleanup of expired holds
   */
  expires_at: model.dateTime(),

  /**
   * Unique token for idempotent hold creation
   * Prevents duplicate holds from concurrent requests
   * Client should generate this token (e.g., UUID) and reuse on retry
   */
  idempotency_token: model.text().unique(),

  /**
   * Current status of the hold
   * Indexed as part of compound index (resource_id, date, status)
   */
  status: model.enum(HoldStatus).default(HoldStatus.ACTIVE),
})

// Note: Indexes defined in migrations
// Compound index: (resource_id, date, status)
// Index: expires_at
// Unique index: idempotency_token

export default ResourceHold
