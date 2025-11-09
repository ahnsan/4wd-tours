import { Module } from "@medusajs/framework/utils"
import ResourceService from "./service/resource-service"
import CapacityService from "./service/capacity-service"
import HoldService from "./service/hold-service"

// Models
import Resource from "./models/resource"
import ResourceCapacity from "./models/resource-capacity"
import ResourceBlackout from "./models/resource-blackout"
import ResourceHold from "./models/resource-hold"
import ResourceAllocation from "./models/resource-allocation"

// Export module identifier
export const RESOURCE_BOOKING_MODULE = "resourceBooking"

/**
 * Resource Booking Module
 *
 * Provides date-based resource booking with capacity management,
 * temporary holds, and concurrency control.
 *
 * Features:
 * - Multi-resource support (vehicles, tours, guides)
 * - Date-based capacity management
 * - Blackout period support
 * - 30-minute hold TTL with auto-expiration
 * - Idempotent hold creation
 * - PostgreSQL advisory locks for concurrency control
 * - Australia/Brisbane timezone handling
 *
 * Services:
 * - ResourceService: CRUD operations for resources
 * - CapacityService: Availability and capacity management
 * - HoldService: Temporary reservations with TTL
 *
 * Models:
 * - Resource: Bookable resources (vehicles, tours, guides)
 * - ResourceCapacity: Daily capacity tracking
 * - ResourceBlackout: Unavailability periods
 * - ResourceHold: Temporary reservations
 * - ResourceAllocation: Confirmed bookings
 *
 * Performance Targets:
 * - p95 Store API < 300ms
 * - Overbooking probability < 0.001%
 *
 * @example
 * // In a Medusa service or API route:
 * const resourceBookingService = container.resolve("resourceBooking")
 * const resourceService = resourceBookingService.resourceService
 * const capacityService = resourceBookingService.capacityService
 * const holdService = resourceBookingService.holdService
 */
export default Module(RESOURCE_BOOKING_MODULE, {
  service: [ResourceService, CapacityService, HoldService],
})

// Export models for migrations
export {
  Resource,
  ResourceCapacity,
  ResourceBlackout,
  ResourceHold,
  ResourceAllocation,
}

// Export services for type checking
export { ResourceService, CapacityService, HoldService }

// Export enums
export { ResourceType } from "./models/resource"
export { HoldStatus } from "./models/resource-hold"
