import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

// Note: This will be uncommented once the backend module is created
// import ResourceBookingModuleService from "../../../../../modules/resource-booking/service"
// import { RESOURCE_BOOKING_MODULE } from "../../../../../modules/resource-booking"

/**
 * DELETE /admin/resource-booking/blackouts/:id
 *
 * Delete a blackout period.
 *
 * Path Parameters:
 * - id: UUID of the blackout
 *
 * Returns:
 * - 200: Blackout deleted successfully
 * - 401: Authentication required
 * - 403: Admin access required
 * - 404: Blackout not found
 * - 500: Internal server error
 */
export async function DELETE(
  req: MedusaRequest,
  res: MedusaResponse
) {
  try {
    const { id } = req.params

    // TODO: Uncomment when backend service is ready
    // const resourceBookingService: ResourceBookingModuleService = req.scope.resolve(RESOURCE_BOOKING_MODULE)

    // Check if blackout exists
    // const blackout = await resourceBookingService.retrieveBlackout(id)
    // if (!blackout) {
    //   return res.status(404).json({
    //     error: {
    //       type: "not_found",
    //       message: "Blackout not found",
    //     },
    //   })
    // }

    // Delete the blackout
    // await resourceBookingService.deleteBlackouts(id)

    return res.status(200).json({
      message: "Blackout deleted successfully",
      id,
    })
  } catch (error) {
    console.error("[Resource Booking Admin API] Error deleting blackout:", error)
    return res.status(500).json({
      error: {
        type: "internal_error",
        message: "An error occurred while deleting the blackout",
      },
    })
  }
}
