import { createWorkflow, createStep, StepResponse, WorkflowResponse } from "@medusajs/workflows-sdk"
import { MedusaError } from "@medusajs/framework/utils"

/**
 * Input for confirming a hold
 */
export interface ConfirmHoldWorkflowInput {
  holdId: string
  orderId: string
  lineItemId: string
}

/**
 * Step: Validate hold status
 * Ensures hold exists, is active, and not expired
 */
const validateHoldStep = createStep(
  "validate-hold-step",
  async (input: { holdId: string }, { container }) => {
    const holdService = container.resolve("holdService")

    // Get hold
    const hold = await holdService.retrieveResourceHold(input.holdId)

    if (!hold) {
      throw new MedusaError(
        MedusaError.Types.NOT_FOUND,
        `Hold ${input.holdId} not found`
      )
    }

    // Validate hold status
    if (hold.status !== "ACTIVE") {
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

    return new StepResponse({
      hold,
      resourceId: hold.resource_id,
      date: hold.date,
      quantity: hold.quantity,
    })
  }
)

/**
 * Step: Create allocation record
 * Creates permanent allocation linked to order
 * Compensation: Delete allocation on rollback
 */
const createAllocationStep = createStep(
  "create-allocation-step",
  async (
    input: {
      resourceId: string
      date: string
      quantity: number
      orderId: string
      lineItemId: string
    },
    { container }
  ) => {
    const holdService = container.resolve("holdService")

    // Create allocation
    const allocation = await holdService.createResourceAllocations({
      resource_id: input.resourceId,
      date: input.date,
      quantity: input.quantity,
      order_id: input.orderId,
      line_item_id: input.lineItemId,
    })

    return new StepResponse(
      { allocation },
      { allocationId: allocation.id } // Compensation data
    )
  },
  async (compensationData, { container }) => {
    // Rollback: Delete allocation
    if (!compensationData?.allocationId) return

    const holdService = container.resolve("holdService")

    try {
      await holdService.deleteResourceAllocations({
        id: compensationData.allocationId,
      })
    } catch (error) {
      console.error(`Failed to delete allocation during rollback:`, error)
    }
  }
)

/**
 * Step: Update hold status to CONFIRMED
 * Marks hold as confirmed (no capacity change needed)
 * Compensation: Revert hold back to ACTIVE
 */
const updateHoldStatusStep = createStep(
  "update-hold-status-step",
  async (input: { holdId: string }, { container }) => {
    const holdService = container.resolve("holdService")

    // Update hold status
    await holdService.updateResourceHolds(
      { id: input.holdId },
      { status: "CONFIRMED" }
    )

    return new StepResponse(
      { confirmed: true },
      { holdId: input.holdId } // Compensation data
    )
  },
  async (compensationData, { container }) => {
    // Rollback: Revert hold to ACTIVE
    if (!compensationData?.holdId) return

    const holdService = container.resolve("holdService")

    try {
      await holdService.updateResourceHolds(
        { id: compensationData.holdId },
        { status: "ACTIVE" }
      )
    } catch (error) {
      console.error(`Failed to revert hold status during rollback:`, error)
    }
  }
)

/**
 * Confirm Hold Workflow
 *
 * Business Flow:
 * 1. Validate hold (exists, active, not expired)
 * 2. Create permanent allocation (linked to order)
 * 3. Update hold status to CONFIRMED
 *
 * Key Features:
 * - No capacity change (capacity already reserved by hold)
 * - Atomic transaction with rollback
 * - Links booking to order for fulfillment tracking
 *
 * Rollback Strategy:
 * - Deletes allocation if created
 * - Reverts hold status back to ACTIVE
 * - Ensures transactional integrity
 *
 * @example
 * const { result } = await confirmHoldWorkflow(container).run({
 *   input: {
 *     holdId: "hold_123",
 *     orderId: "order_456",
 *     lineItemId: "li_789"
 *   }
 * })
 */
export const confirmHoldWorkflow = createWorkflow(
  "confirm-hold-workflow",
  function (input: ConfirmHoldWorkflowInput) {
    // Step 1: Validate hold
    const validation = validateHoldStep({
      holdId: input.holdId,
    })

    // Step 2: Create allocation (with compensation)
    const allocation = createAllocationStep({
      resourceId: validation.resourceId,
      date: validation.date,
      quantity: validation.quantity,
      orderId: input.orderId,
      lineItemId: input.lineItemId,
    })

    // Step 3: Update hold status (with compensation)
    const statusUpdate = updateHoldStatusStep({
      holdId: input.holdId,
    })

    return new WorkflowResponse(allocation.allocation)
  }
)
