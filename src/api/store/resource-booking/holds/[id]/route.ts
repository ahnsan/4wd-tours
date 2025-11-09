import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

// Note: This will be uncommented once the backend module is created
// import ResourceBookingModuleService from "../../../../../modules/resource-booking/service"
// import { RESOURCE_BOOKING_MODULE } from "../../../../../modules/resource-booking"

/**
 * GET /store/resource-booking/holds/:id
 *
 * Retrieve a specific hold by ID.
 * Customers can only view their own holds.
 *
 * Path Parameters:
 * - id: UUID of the hold
 *
 * Returns:
 * - 200: Hold details
 * - 401: Authentication required
 * - 403: Not authorized to view this hold
 * - 404: Hold not found
 * - 500: Internal server error
 */
export async function GET(
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
          message: "You must be logged in to view holds",
        },
      })
    }

    // TODO: Uncomment when backend service is ready
    // const resourceBookingService: ResourceBookingModuleService = req.scope.resolve(RESOURCE_BOOKING_MODULE)

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
    //       message: "You are not authorized to view this hold",
    //     },
    //   })
    // }

    // Temporary mock response - remove when backend is ready
    const hold = {
      id,
      resource_id: "res_456",
      dates: ["2025-01-15", "2025-01-16"],
      quantity: 2,
      customer_email: customerEmail,
      expires_at: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
      status: "ACTIVE",
      created_at: new Date().toISOString(),
    }

    return res.status(200).json({ hold })
  } catch (error) {
    console.error("[Resource Booking API] Error retrieving hold:", error)
    return res.status(500).json({
      error: {
        type: "internal_error",
        message: "An error occurred while retrieving the hold",
      },
    })
  }
}

/**
 * DELETE /store/resource-booking/holds/:id
 *
 * Release a hold (same as /holds/:id/release).
 * This is a convenience endpoint that aliases the release endpoint.
 *
 * Path Parameters:
 * - id: UUID of the hold
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
    // if (hold.status !== "ACTIVE") {
    //   return res.status(409).json({
    //     error: {
    //       type: "invalid_status",
    //       message: `Hold is already ${hold.status.toLowerCase()}`,
    //     },
    //   })
    // }

    // Release the hold
    // await resourceBookingService.releaseHold(id)

    return res.status(200).json({
      message: "Hold released successfully",
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
