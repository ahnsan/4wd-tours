import { MedusaService } from "@medusajs/framework/utils"
import { MedusaError } from "@medusajs/framework/utils"
import ResourceHold, { HoldStatus } from "../models/resource-hold"
import ResourceAllocation from "../models/resource-allocation"
import CapacityService from "./capacity-service"
import { DateTime } from "luxon"

/**
 * Hold TTL in minutes
 * Business requirement: 30 minutes
 */
const HOLD_TTL_MINUTES = 30

/**
 * Hold creation data
 */
export interface CreateHoldData {
  resourceId: string
  dates: (Date | string)[]
  quantity: number
  customerEmail?: string
  idempotencyToken: string
}

/**
 * Hold confirmation data
 */
export interface ConfirmHoldData {
  orderId: string
  lineItemId: string
}

/**
 * HoldService
 * Manages temporary resource reservations (holds) with TTL and idempotency
 *
 * Business Rules:
 * - Holds reserve capacity for 30 minutes
 * - After 30 minutes, holds auto-expire and capacity is restored
 * - Idempotency tokens prevent duplicate holds from concurrent requests
 * - Confirmed holds become permanent allocations
 *
 * Concurrency Strategy:
 * - Uses CapacityService.adjustCapacity() for atomic capacity updates
 * - Idempotency tokens prevent race conditions on hold creation
 * - Status transitions are atomic (ACTIVE -> CONFIRMED/RELEASED/EXPIRED)
 *
 * Integration Points:
 * - Works with CapacityService for capacity management
 * - Creates ResourceAllocations when holds are confirmed
 * - Links to Medusa Order and LineItem entities
 */
class HoldService extends MedusaService({
  ResourceHold,
  ResourceAllocation,
}) {
  private capacityService: CapacityService

  constructor(container: any) {
    super(container)
    // Inject CapacityService
    this.capacityService = container.capacityService
  }

  /**
   * Convert a Date to Australia/Brisbane date-only string
   *
   * @param date - Input date (any timezone)
   * @returns Date string in YYYY-MM-DD format (Brisbane timezone)
   */
  private toBrisbaneDate(date: Date | string): string {
    return DateTime.fromJSDate(typeof date === "string" ? new Date(date) : date)
      .setZone("Australia/Brisbane")
      .toISODate()!
  }

  /**
   * Calculate expiration timestamp (30 minutes from now)
   *
   * @returns Expiration timestamp
   */
  private calculateExpiration(): Date {
    return DateTime.now()
      .setZone("Australia/Brisbane")
      .plus({ minutes: HOLD_TTL_MINUTES })
      .toJSDate()
  }

  /**
   * Create a hold with idempotency support
   * Reserves capacity for specified dates
   *
   * @param data - Hold creation data
   * @returns Created or existing hold (if idempotency token matches)
   *
   * @throws Error if capacity unavailable or validation fails
   *
   * @example
   * const hold = await holdService.createHold({
   *   resourceId: "res_123",
   *   dates: [new Date("2025-01-15"), new Date("2025-01-16")],
   *   quantity: 2,
   *   customerEmail: "customer@example.com",
   *   idempotencyToken: "unique-token-123"
   * })
   */
  async createHold(data: CreateHoldData) {
    const { resourceId, dates, quantity, customerEmail, idempotencyToken } = data

    // Validate quantity
    if (quantity <= 0) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "Quantity must be greater than 0"
      )
    }

    // Check for existing hold with same idempotency token
    const existing = await this.listResourceHolds({
      idempotency_token: idempotencyToken,
    })

    if (existing.length > 0) {
      // Return existing hold (idempotent response)
      return existing[0]
    }

    // Convert dates to Brisbane timezone
    const brisbaneDates = dates.map((d) => this.toBrisbaneDate(d))

    // Check availability for all dates
    const availability = await this.capacityService.checkAvailability(
      resourceId,
      brisbaneDates,
      quantity
    )

    // Validate all dates are available
    const unavailable = availability.filter((a) => !a.available)
    if (unavailable.length > 0) {
      const reasons = unavailable
        .map((a) => `${a.date}: ${a.reason}`)
        .join(", ")
      throw new MedusaError(
        MedusaError.Types.NOT_ALLOWED,
        `Cannot create hold - dates unavailable: ${reasons}`
      )
    }

    // Calculate expiration
    const expiresAt = this.calculateExpiration()

    // Create holds for each date
    const holds = await Promise.all(
      brisbaneDates.map(async (date) => {
        // Reserve capacity
        await this.capacityService.adjustCapacity(resourceId, date, -quantity)

        // Create hold record
        return await this.createResourceHolds({
          resource_id: resourceId,
          date,
          quantity,
          customer_email: customerEmail || null,
          expires_at: expiresAt,
          idempotency_token: `${idempotencyToken}:${date}`, // Unique per date
          status: HoldStatus.ACTIVE,
        })
      })
    )

    // Return the first hold (all have same idempotency token base)
    return holds[0]
  }

  /**
   * Confirm a hold and convert to allocation
   * Links hold to order and creates permanent allocation
   *
   * @param holdId - Hold ID to confirm
   * @param data - Order and line item IDs
   * @returns Created allocation
   *
   * @throws Error if hold not found, expired, or already confirmed
   *
   * @example
   * const allocation = await holdService.confirmHold("hold_123", {
   *   orderId: "order_456",
   *   lineItemId: "li_789"
   * })
   */
  async confirmHold(holdId: string, data: ConfirmHoldData) {
    const { orderId, lineItemId } = data

    // Get hold
    const hold = await this.retrieveResourceHold(holdId)

    if (!hold) {
      throw new MedusaError(
        MedusaError.Types.NOT_FOUND,
        `Hold ${holdId} not found`
      )
    }

    // Validate hold status
    if (hold.status !== HoldStatus.ACTIVE) {
      throw new MedusaError(
        MedusaError.Types.NOT_ALLOWED,
        `Cannot confirm hold with status ${hold.status}`
      )
    }

    // Check if expired
    const now = new Date()
    if (hold.expires_at < now) {
      throw new MedusaError(
        MedusaError.Types.NOT_ALLOWED,
        "Hold has expired"
      )
    }

    // Create allocation
    const allocation = await this.createResourceAllocations({
      resource_id: hold.resource_id,
      date: hold.date,
      quantity: hold.quantity,
      order_id: orderId,
      line_item_id: lineItemId,
    })

    // Update hold status to CONFIRMED
    await this.updateResourceHolds(
      { id: holdId },
      { status: HoldStatus.CONFIRMED }
    )

    return allocation
  }

  /**
   * Release a hold and restore capacity
   * Used when customer cancels or abandons cart
   *
   * @param holdId - Hold ID to release
   * @returns Updated hold
   *
   * @throws Error if hold not found or already released
   *
   * @example
   * await holdService.releaseHold("hold_123")
   */
  async releaseHold(holdId: string) {
    // Get hold
    const hold = await this.retrieveResourceHold(holdId)

    if (!hold) {
      throw new MedusaError(
        MedusaError.Types.NOT_FOUND,
        `Hold ${holdId} not found`
      )
    }

    // Validate hold status
    if (hold.status !== HoldStatus.ACTIVE) {
      throw new MedusaError(
        MedusaError.Types.NOT_ALLOWED,
        `Cannot release hold with status ${hold.status}`
      )
    }

    // Restore capacity
    await this.capacityService.adjustCapacity(
      hold.resource_id,
      hold.date,
      hold.quantity
    )

    // Update hold status
    return await this.updateResourceHolds(
      { id: holdId },
      { status: HoldStatus.RELEASED }
    )
  }

  /**
   * Cleanup expired holds (cron job method)
   * Finds all expired ACTIVE holds and restores their capacity
   *
   * @returns Number of holds cleaned up
   *
   * @example
   * // In cron job:
   * const cleaned = await holdService.cleanupExpiredHolds()
   * console.log(`Cleaned up ${cleaned} expired holds`)
   */
  async cleanupExpiredHolds(): Promise<number> {
    const now = new Date()

    // Find all expired ACTIVE holds
    const expiredHolds = await this.listResourceHolds({
      status: HoldStatus.ACTIVE,
      expires_at: { $lt: now },
    })

    // Process each expired hold
    for (const hold of expiredHolds) {
      try {
        // Restore capacity
        await this.capacityService.adjustCapacity(
          hold.resource_id,
          hold.date,
          hold.quantity
        )

        // Mark as expired
        await this.updateResourceHolds(
          { id: hold.id },
          { status: HoldStatus.EXPIRED }
        )
      } catch (error) {
        // Log error but continue processing other holds
        console.error(`Failed to cleanup hold ${hold.id}:`, error)
      }
    }

    return expiredHolds.length
  }

  /**
   * Extend hold expiration time
   * Useful if customer needs more time to complete checkout
   *
   * @param holdId - Hold ID to extend
   * @param additionalMinutes - Minutes to add to expiration (default: 30)
   * @returns Updated hold
   *
   * @throws Error if hold not found or not active
   *
   * @example
   * await holdService.extendHold("hold_123", 15) // Add 15 more minutes
   */
  async extendHold(holdId: string, additionalMinutes: number = 30) {
    // Get hold
    const hold = await this.retrieveResourceHold(holdId)

    if (!hold) {
      throw new MedusaError(
        MedusaError.Types.NOT_FOUND,
        `Hold ${holdId} not found`
      )
    }

    // Validate hold status
    if (hold.status !== HoldStatus.ACTIVE) {
      throw new MedusaError(
        MedusaError.Types.NOT_ALLOWED,
        `Cannot extend hold with status ${hold.status}`
      )
    }

    // Calculate new expiration
    const newExpiration = DateTime.fromJSDate(hold.expires_at)
      .plus({ minutes: additionalMinutes })
      .toJSDate()

    // Update expiration
    return await this.updateResourceHolds(
      { id: holdId },
      { expires_at: newExpiration }
    )
  }

  /**
   * Get all active holds for a resource on a date
   *
   * @param resourceId - Resource ID
   * @param date - Date to check
   * @returns Array of active holds
   *
   * @example
   * const holds = await holdService.getActiveHolds("res_123", new Date("2025-01-15"))
   */
  async getActiveHolds(resourceId: string, date: Date | string) {
    const brisbaneDate = this.toBrisbaneDate(date)

    return await this.listResourceHolds({
      resource_id: resourceId,
      date: brisbaneDate,
      status: HoldStatus.ACTIVE,
    })
  }

  /**
   * Get allocations for an order
   *
   * @param orderId - Order ID
   * @returns Array of allocations
   *
   * @example
   * const allocations = await holdService.getAllocationsByOrder("order_123")
   */
  async getAllocationsByOrder(orderId: string) {
    return await this.listResourceAllocations({
      order_id: orderId,
    })
  }

  /**
   * Get allocations for a resource on a date
   *
   * @param resourceId - Resource ID
   * @param date - Date to check
   * @returns Array of allocations
   *
   * @example
   * const allocations = await holdService.getAllocations("res_123", new Date("2025-01-15"))
   */
  async getAllocations(resourceId: string, date: Date | string) {
    const brisbaneDate = this.toBrisbaneDate(date)

    return await this.listResourceAllocations({
      resource_id: resourceId,
      date: brisbaneDate,
    })
  }
}

export default HoldService
