/**
 * Resource Booking Workflows
 *
 * Medusa v2 workflows for managing resource reservations with:
 * - Automatic rollback on failures
 * - Atomic operations
 * - Compensation functions
 * - Transaction safety
 */

export { createHoldWorkflow } from "./create-hold-workflow"
export { confirmHoldWorkflow } from "./confirm-hold-workflow"
export { releaseHoldWorkflow } from "./release-hold-workflow"

export type { CreateHoldWorkflowInput } from "./create-hold-workflow"
export type { ConfirmHoldWorkflowInput } from "./confirm-hold-workflow"
export type { ReleaseHoldWorkflowInput } from "./release-hold-workflow"
