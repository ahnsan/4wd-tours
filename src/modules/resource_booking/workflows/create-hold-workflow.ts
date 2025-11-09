import { createWorkflow, createStep, StepResponse, WorkflowResponse } from "@medusajs/workflows-sdk"
import { MedusaError } from "@medusajs/framework/utils"

/**
 * Input for creating a hold
 */
export interface CreateHoldWorkflowInput {
  resourceId: string
  dates: string[]
  quantity: number
  customerEmail?: string
  idempotencyToken: string
}

/**
 * Step: Check availability for requested dates
 * Validates capacity before attempting to create holds
 */
const checkAvailabilityStep = createStep(
  "check-availability-step",
  async (input: CreateHoldWorkflowInput, { container }) => {
    const capacityService = container.resolve("capacityService")

    // Check availability for all dates
    const availability = await capacityService.checkAvailability(
      input.resourceId,
      input.dates,
      input.quantity
    )

    // Validate all dates are available
    const unavailable = availability.filter((a: any) => !a.available)
    if (unavailable.length > 0) {
      const reasons = unavailable
        .map((a: any) => `${a.date}: ${a.reason}`)
        .join(", ")
      throw new MedusaError(
        MedusaError.Types.NOT_ALLOWED,
        `Cannot create hold - dates unavailable: ${reasons}`
      )
    }

    return new StepResponse({ available: true, dates: input.dates })
  }
)

/**
 * Step: Reserve capacity for dates
 * Atomically decreases available capacity
 * Compensation: Restore capacity on rollback
 */
const reserveCapacityStep = createStep(
  "reserve-capacity-step",
  async (
    input: { resourceId: string; dates: string[]; quantity: number },
    { container }
  ) => {
    const capacityService = container.resolve("capacityService")

    // Reserve capacity for each date
    const adjustments = []
    for (const date of input.dates) {
      await capacityService.adjustCapacity(input.resourceId, date, -input.quantity)
      adjustments.push({ resourceId: input.resourceId, date, quantity: input.quantity })
    }

    return new StepResponse(
      { reserved: true, adjustments },
      { adjustments } // Compensation data
    )
  },
  async (compensationData, { container }) => {
    // Rollback: Restore capacity
    if (!compensationData?.adjustments) return

    const capacityService = container.resolve("capacityService")

    for (const adjustment of compensationData.adjustments) {
      try {
        await capacityService.adjustCapacity(
          adjustment.resourceId,
          adjustment.date,
          adjustment.quantity
        )
      } catch (error) {
        console.error(`Failed to restore capacity during rollback:`, error)
      }
    }
  }
)

/**
 * Step: Create hold records
 * Creates database records for holds with TTL
 * Compensation: Delete created holds on rollback
 */
const createHoldRecordsStep = createStep(
  "create-hold-records-step",
  async (
    input: {
      resourceId: string
      dates: string[]
      quantity: number
      customerEmail?: string
      idempotencyToken: string
    },
    { container }
  ) => {
    const holdService = container.resolve("holdService")

    // Check for existing hold with same idempotency token
    const existing = await holdService.listResourceHolds({
      idempotency_token: input.idempotencyToken,
    })

    if (existing.length > 0) {
      // Return existing hold (idempotent)
      return new StepResponse(
        { hold: existing[0], isNew: false },
        { holdIds: [], isNew: false }
      )
    }

    // Calculate expiration (30 minutes from now)
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000)

    // Create holds for each date
    const holds = []
    for (const date of input.dates) {
      const hold = await holdService.createResourceHolds({
        resource_id: input.resourceId,
        date,
        quantity: input.quantity,
        customer_email: input.customerEmail || null,
        expires_at: expiresAt,
        idempotency_token: `${input.idempotencyToken}:${date}`,
        status: "ACTIVE",
      })
      holds.push(hold)
    }

    return new StepResponse(
      { hold: holds[0], isNew: true },
      { holdIds: holds.map((h) => h.id), isNew: true } // Compensation data
    )
  },
  async (compensationData, { container }) => {
    // Rollback: Delete created holds
    if (!compensationData?.isNew || !compensationData?.holdIds) return

    const holdService = container.resolve("holdService")

    for (const holdId of compensationData.holdIds) {
      try {
        await holdService.deleteResourceHolds({ id: holdId })
      } catch (error) {
        console.error(`Failed to delete hold during rollback:`, error)
      }
    }
  }
)

/**
 * Create Hold Workflow
 *
 * Business Flow:
 * 1. Check availability for all requested dates
 * 2. Reserve capacity (atomic, with rollback)
 * 3. Create hold records (with TTL and idempotency)
 *
 * Rollback Strategy:
 * - If any step fails, automatically restores capacity
 * - Deletes any created hold records
 * - Ensures atomic "all or nothing" behavior
 *
 * @example
 * const { result } = await createHoldWorkflow(container).run({
 *   input: {
 *     resourceId: "res_123",
 *     dates: ["2025-01-15", "2025-01-16"],
 *     quantity: 2,
 *     customerEmail: "customer@example.com",
 *     idempotencyToken: "unique-token-123"
 *   }
 * })
 */
export const createHoldWorkflow = createWorkflow(
  "create-hold-workflow",
  function (input: CreateHoldWorkflowInput) {
    // Step 1: Check availability
    const availabilityCheck = checkAvailabilityStep(input)

    // Step 2: Reserve capacity (with compensation)
    const capacityReservation = reserveCapacityStep({
      resourceId: input.resourceId,
      dates: input.dates,
      quantity: input.quantity,
    })

    // Step 3: Create hold records (with compensation)
    const holdCreation = createHoldRecordsStep({
      resourceId: input.resourceId,
      dates: input.dates,
      quantity: input.quantity,
      customerEmail: input.customerEmail,
      idempotencyToken: input.idempotencyToken,
    })

    return new WorkflowResponse(holdCreation.hold)
  }
)
