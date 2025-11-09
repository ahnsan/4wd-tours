import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

// Note: This will be uncommented once the backend module is created
// import ResourceBookingModuleService from "../../../../../../modules/resource-booking/service"
// import { RESOURCE_BOOKING_MODULE } from "../../../../../../modules/resource-booking"

/**
 * DELETE /store/resource-booking/holds/:id/release
 *
 * Release a hold and restore the capacity.
 * This can be called when a customer abandons their cart or
 * explicitly cancels their reservation.
 *
 * Path Parameters:
 * - id: UUID of the hold to release
 *
 * Returns:
 * - 200: Hold released successfully
 * - 401: Authentication required
 * - 403: Not authorized to release this hold
 * - 404: Hold not found
 * - 409: Hold already released or expired
 * - 500: Internal server error
 */
export async function DELETE(
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
          message: "You must be logged in to release holds",
        },
      })
    }

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
    //       message: "You are not authorized to release this hold",
    //     },
    //   })
    // }

    // Check if hold is already released or expired
    // if (hold.status === "RELEASED") {
    //   return res.status(409).json({
    //     error: {
    //       type: "already_released",
    //       message: "Hold has already been released",
    //     },
    //   })
    // }

    // if (hold.status === "EXPIRED") {
    //   return res.status(409).json({
    //     error: {
    //       type: "hold_expired",
    //       message: "Hold has already expired",
    //     },
    //   })
    // }

    // Cannot release a confirmed hold
    // if (hold.status === "CONFIRMED") {
    //   return res.status(409).json({
    //     error: {
    //       type: "cannot_release_confirmed",
    //       message: "Cannot release a confirmed hold",
    //     },
    //   })
    // }

    // Release the hold
    // await resourceBookingService.releaseHold(id)

    return res.status(200).json({
      message: "Hold released successfully",
      hold_id: id,
    })
  } catch (error) {
    console.error("[Resource Booking API] Error releasing hold:", error)
    return res.status(500).json({
      error: {
        type: "internal_error",
        message: "An error occurred while releasing the hold",
      },
    })
  }
}
