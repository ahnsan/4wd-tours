import { createWorkflow, createStep, StepResponse, WorkflowResponse } from "@medusajs/workflows-sdk"
import { MedusaError } from "@medusajs/framework/utils"

/**
 * Input for releasing a hold
 */
export interface ReleaseHoldWorkflowInput {
  holdId: string
}

/**
 * Step: Validate hold for release
 * Ensures hold exists and can be released
 */
const validateHoldForReleaseStep = createStep(
  "validate-hold-for-release-step",
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

    // Validate hold status - can only release ACTIVE holds
    if (hold.status !== "ACTIVE") {
      throw new MedusaError(
        MedusaError.Types.NOT_ALLOWED,
        `Cannot release hold with status ${hold.status}`
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
 * Step: Restore capacity
 * Returns reserved capacity back to available pool
 * Compensation: Re-reserve capacity on rollback
 */
const restoreCapacityStep = createStep(
  "restore-capacity-step",
  async (
    input: { resourceId: string; date: string; quantity: number },
    { container }
  ) => {
    const capacityService = container.resolve("capacityService")

    // Restore capacity
    await capacityService.adjustCapacity(
      input.resourceId,
      input.date,
      input.quantity
    )

    return new StepResponse(
      { restored: true },
      { resourceId: input.resourceId, date: input.date, quantity: input.quantity } // Compensation data
    )
  },
  async (compensationData, { container }) => {
    // Rollback: Re-reserve capacity
    if (!compensationData) return

    const capacityService = container.resolve("capacityService")

    try {
      await capacityService.adjustCapacity(
        compensationData.resourceId,
        compensationData.date,
        -compensationData.quantity
      )
    } catch (error) {
      console.error(`Failed to re-reserve capacity during rollback:`, error)
    }
  }
)

/**
 * Step: Update hold status to RELEASED
 * Marks hold as released
 * Compensation: Revert hold back to ACTIVE
 */
const updateHoldToReleasedStep = createStep(
  "update-hold-to-released-step",
  async (input: { holdId: string }, { container }) => {
    const holdService = container.resolve("holdService")

    // Update hold status
    const updated = await holdService.updateResourceHolds(
      { id: input.holdId },
      { status: "RELEASED" }
    )

    return new StepResponse(
      { hold: updated },
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
 * Release Hold Workflow
 *
 * Business Flow:
 * 1. Validate hold (exists, is ACTIVE)
 * 2. Restore capacity to available pool
 * 3. Update hold status to RELEASED
 *
 * Use Cases:
 * - Customer abandons cart before checkout
 * - Customer explicitly cancels reservation
 * - Admin manually releases hold
 *
 * Key Features:
 * - Atomic capacity restoration
 * - Full rollback support
 * - Prevents releasing already confirmed/released holds
 *
 * Rollback Strategy:
 * - Re-reserves capacity if restoration was completed
 * - Reverts hold status back to ACTIVE
 * - Ensures transactional integrity
 *
 * @example
 * const { result } = await releaseHoldWorkflow(container).run({
 *   input: {
 *     holdId: "hold_123"
 *   }
 * })
 */
export const releaseHoldWorkflow = createWorkflow(
  "release-hold-workflow",
  function (input: ReleaseHoldWorkflowInput) {
    // Step 1: Validate hold
    const validation = validateHoldForReleaseStep({
      holdId: input.holdId,
    })

    // Step 2: Restore capacity (with compensation)
    const capacityRestoration = restoreCapacityStep({
      resourceId: validation.resourceId,
      date: validation.date,
      quantity: validation.quantity,
    })

    // Step 3: Update hold status (with compensation)
    const statusUpdate = updateHoldToReleasedStep({
      holdId: input.holdId,
    })

    return new WorkflowResponse(statusUpdate.hold)
  }
)
