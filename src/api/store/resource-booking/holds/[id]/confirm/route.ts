import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { validateBody, ConfirmHoldSchema } from "../../../validators"

// Note: This will be uncommented once the backend module is created
// import ResourceBookingModuleService from "../../../../../../modules/resource-booking/service"
// import { RESOURCE_BOOKING_MODULE } from "../../../../../../modules/resource-booking"

/**
 * POST /store/resource-booking/holds/:id/confirm
 *
 * Confirm a hold and convert it to a confirmed allocation.
 * This is typically called during checkout after payment is confirmed.
 *
 * Path Parameters:
 * - id: UUID of the hold to confirm
 *
 * Body:
 * - order_id: UUID of the order
 * - line_item_id: UUID of the line item
 *
 * Returns:
 * - 200: Hold confirmed successfully
 * - 400: Validation error
 * - 401: Authentication required
 * - 403: Not authorized to confirm this hold
 * - 404: Hold not found
 * - 409: Hold expired or already confirmed
 * - 500: Internal server error
 */
export async function POST(
  req: MedusaRequest,
  res: MedusaResponse
) {
  try {
    const { id } = req.params
    const customerEmail = req.user?.email

    if (!customerEmail) {
      return res.status(401).json({
        error: {
          type: "authentication_required",
          message: "You must be logged in to confirm holds",
        },
      })
    }

    // Validate request body
    const validation = validateBody(ConfirmHoldSchema, req.body)
    if (!validation.success) {
      return res.status(400).json({
        error: {
          type: "validation_error",
          message: validation.error,
        },
      })
    }

    const { order_id, line_item_id } = validation.data!

    // TODO: Uncomment when backend service is ready
    // const resourceBookingService: ResourceBookingModuleService = req.scope.resolve(RESOURCE_BOOKING_MODULE)

    // Retrieve the hold
    // const hold = await resourceBookingService.retrieveHold(id)
    // if (!hold) {
    //   return res.status(404).json({
    //     error: {
    //       type: "not_found",
    //       message: "Hold not found",
    //     },
    //   })
    // }

    // Verify the hold belongs to the authenticated customer
    // if (hold.customer_email !== customerEmail) {
    //   return res.status(403).json({
    //     error: {
    //       type: "forbidden",
    //       message: "You are not authorized to confirm this hold",
    //     },
    //   })
    // }

    // Check if hold is expired
    // const now = new Date()
    // if (new Date(hold.expires_at) < now) {
    //   return res.status(409).json({
    //     error: {
    //       type: "hold_expired",
    //       message: "Hold has expired and cannot be confirmed",
    //     },
    //   })
    // }

    // Check if hold is already confirmed
    // if (hold.status === "CONFIRMED") {
    //   return res.status(409).json({
    //     error: {
    //       type: "already_confirmed",
    //       message: "Hold has already been confirmed",
    //     },
    //   })
    // }

    // Check if hold is not active
    // if (hold.status !== "ACTIVE") {
    //   return res.status(409).json({
    //     error: {
    //       type: "invalid_status",
    //       message: `Hold cannot be confirmed (current status: ${hold.status})`,
    //     },
    //   })
    // }

    // Confirm the hold and create allocation
    // const allocation = await resourceBookingService.confirmHold(id, {
    //   order_id,
    //   line_item_id,
    // })

    // Temporary mock response - remove when backend is ready
    const allocation = {
      id: `alloc_${id}`,
      hold_id: id,
      resource_id: "res_456",
      dates: ["2025-01-15", "2025-01-16"],
      quantity: 2,
      order_id,
      line_item_id,
      status: "CONFIRMED",
      confirmed_at: new Date().toISOString(),
    }

    return res.status(200).json({ allocation })
  } catch (error) {
    console.error("[Resource Booking API] Error confirming hold:", error)
    return res.status(500).json({
      error: {
        type: "internal_error",
        message: "An error occurred while confirming the hold",
      },
    })
  }
}
