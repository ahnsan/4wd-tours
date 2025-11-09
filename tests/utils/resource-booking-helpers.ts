/**
 * Test utilities and helpers for resource booking tests
 */

import { medusaIntegrationTestRunner } from "@medusajs/test-utils"
import { ModuleRegistrationName } from "@medusajs/framework/utils"
import { DateTime } from "luxon"

/**
 * Test resource data factory
 */
export function createTestResourceData(overrides: any = {}) {
  return {
    type: "VEHICLE",
    name: "Test Vehicle 1",
    description: "Test vehicle for automated tests",
    metadata: { test: true },
    is_active: true,
    ...overrides,
  }
}

/**
 * Test capacity data factory
 */
export function createTestCapacityData(resourceId: string, date: string, overrides: any = {}) {
  return {
    resource_id: resourceId,
    date,
    max_capacity: 10,
    available_capacity: 10,
    ...overrides,
  }
}

/**
 * Test hold data factory
 */
export function createTestHoldData(resourceId: string, dates: string[], overrides: any = {}) {
  return {
    resourceId,
    dates,
    quantity: 1,
    customerEmail: "test@example.com",
    idempotencyToken: `test-token-${Date.now()}`,
    ...overrides,
  }
}

/**
 * Test blackout data factory
 */
export function createTestBlackoutData(resourceId: string, overrides: any = {}) {
  return {
    resource_id: resourceId,
    start_date: "2025-01-01",
    end_date: "2025-01-07",
    reason: "Test blackout period",
    ...overrides,
  }
}

/**
 * Generate date range for testing
 */
export function generateDateRange(startDate: string, days: number): string[] {
  const dates: string[] = []
  let current = DateTime.fromISO(startDate)

  for (let i = 0; i < days; i++) {
    dates.push(current.toISODate()!)
    current = current.plus({ days: 1 })
  }

  return dates
}

/**
 * Get future date in Brisbane timezone
 */
export function getFutureDate(daysFromNow: number): string {
  return DateTime.now()
    .setZone("Australia/Brisbane")
    .plus({ days: daysFromNow })
    .toISODate()!
}

/**
 * Get past date in Brisbane timezone
 */
export function getPastDate(daysAgo: number): string {
  return DateTime.now()
    .setZone("Australia/Brisbane")
    .minus({ days: daysAgo })
    .toISODate()!
}

/**
 * Wait for hold expiration (for testing)
 */
export async function waitForExpiration(milliseconds: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, milliseconds))
}

/**
 * Create expired hold for testing
 */
export function createExpiredHoldData(resourceId: string, date: string) {
  return {
    resource_id: resourceId,
    date,
    quantity: 1,
    customer_email: "test@example.com",
    expires_at: new Date(Date.now() - 60000), // Expired 1 minute ago
    idempotency_token: `expired-token-${Date.now()}`,
    status: "ACTIVE",
  }
}

/**
 * Generate unique idempotency token
 */
export function generateIdempotencyToken(): string {
  return `test-token-${Date.now()}-${Math.random().toString(36).substring(7)}`
}

/**
 * Create test database cleanup utility
 */
export async function cleanupResourceBookingData(container: any) {
  const resourceService = container.resolve("resourceService")
  const capacityService = container.resolve("capacityService")
  const holdService = container.resolve("holdService")

  try {
    // Clean up holds
    const holds = await holdService.listResourceHolds({})
    for (const hold of holds) {
      await holdService.deleteResourceHolds({ id: hold.id })
    }

    // Clean up allocations
    const allocations = await holdService.listResourceAllocations({})
    for (const allocation of allocations) {
      await holdService.deleteResourceAllocations({ id: allocation.id })
    }

    // Clean up capacities
    const capacities = await capacityService.listResourceCapacities({})
    for (const capacity of capacities) {
      await capacityService.deleteResourceCapacities({ id: capacity.id })
    }

    // Clean up blackouts
    const blackouts = await capacityService.listResourceBlackouts({})
    for (const blackout of blackouts) {
      await capacityService.deleteResourceBlackouts({ id: blackout.id })
    }

    // Clean up resources
    const resources = await resourceService.listResources({})
    for (const resource of resources) {
      await resourceService.deleteResources({ id: resource.id })
    }
  } catch (error) {
    console.error("Cleanup error:", error)
  }
}

/**
 * Batch create resources for testing
 */
export async function batchCreateResources(resourceService: any, count: number) {
  const resources = []
  for (let i = 0; i < count; i++) {
    const resource = await resourceService.createResources(
      createTestResourceData({ name: `Test Vehicle ${i + 1}` })
    )
    resources.push(resource)
  }
  return resources
}

/**
 * Batch create capacity records for testing
 */
export async function batchCreateCapacities(
  capacityService: any,
  resourceId: string,
  dates: string[],
  capacity: number = 10
) {
  const capacities = []
  for (const date of dates) {
    const cap = await capacityService.createResourceCapacities(
      createTestCapacityData(resourceId, date, { max_capacity: capacity, available_capacity: capacity })
    )
    capacities.push(cap)
  }
  return capacities
}

/**
 * Assert capacity equals expected value
 */
export async function assertCapacity(
  capacityService: any,
  resourceId: string,
  date: string,
  expectedAvailable: number
) {
  const capacities = await capacityService.listResourceCapacities({
    resource_id: resourceId,
    date,
  })

  if (capacities.length === 0) {
    throw new Error(`No capacity found for resource ${resourceId} on ${date}`)
  }

  const actual = capacities[0].available_capacity
  if (actual !== expectedAvailable) {
    throw new Error(
      `Expected capacity ${expectedAvailable}, got ${actual} for ${resourceId} on ${date}`
    )
  }

  return capacities[0]
}

/**
 * Create mock order data for testing
 */
export function createMockOrderData() {
  return {
    order_id: `order_test_${Date.now()}`,
    line_item_id: `li_test_${Date.now()}`,
  }
}

/**
 * Sleep utility for concurrency tests
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * Run concurrent operations and return results
 */
export async function runConcurrent<T>(operations: (() => Promise<T>)[]): Promise<PromiseSettledResult<T>[]> {
  return Promise.allSettled(operations.map((op) => op()))
}

/**
 * Count successful and failed promises
 */
export function countResults(results: PromiseSettledResult<any>[]) {
  const successful = results.filter((r) => r.status === "fulfilled").length
  const failed = results.filter((r) => r.status === "rejected").length
  return { successful, failed, total: results.length }
}

/**
 * Get Brisbane date string for today
 */
export function getTodayBrisbane(): string {
  return DateTime.now().setZone("Australia/Brisbane").toISODate()!
}

/**
 * Get Brisbane datetime string
 */
export function getNowBrisbane(): Date {
  return DateTime.now().setZone("Australia/Brisbane").toJSDate()
}
