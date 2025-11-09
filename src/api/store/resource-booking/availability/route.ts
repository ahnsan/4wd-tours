import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { validateQuery, CheckAvailabilitySchema } from "../validators"

// Note: This will be uncommented once the backend module is created
// import ResourceBookingModuleService from "../../../../modules/resource-booking/service"
// import { RESOURCE_BOOKING_MODULE } from "../../../../modules/resource-booking"

/**
 * GET /store/resource-booking/availability
 *
 * Check resource availability for a date range.
 *
 * Query Parameters:
 * - resource_id: UUID of the resource to check
 * - start_date: Start date in YYYY-MM-DD format
 * - end_date: End date in YYYY-MM-DD format
 * - quantity: Number of units needed (default: 1)
 *
 * Returns:
 * - 200: Array of available dates with remaining capacity
 * - 400: Validation error
 * - 404: Resource not found
 * - 500: Internal server error
 */
export async function GET(
  req: MedusaRequest,
  res: MedusaResponse
) {
  try {
    // Validate query parameters
    const validation = validateQuery(CheckAvailabilitySchema, req.query)
    if (!validation.success) {
      return res.status(400).json({
        error: {
          type: "validation_error",
          message: validation.error,
        },
      })
    }

    const { resource_id, start_date, end_date, quantity } = validation.data!

    // TODO: Uncomment when backend service is ready
    // const resourceBookingService: ResourceBookingModuleService = req.scope.resolve(RESOURCE_BOOKING_MODULE)

    // Check if resource exists
    // const resource = await resourceBookingService.retrieveResource(resource_id)
    // if (!resource || !resource.is_active) {
    //   return res.status(404).json({
    //     error: {
    //       type: "not_found",
    //       message: "Resource not found or inactive",
    //     },
    //   })
    // }

    // Get availability for date range
    // const availability = await resourceBookingService.checkAvailability(
    //   resource_id,
    //   start_date,
    //   end_date,
    //   quantity
    // )

    // Temporary mock response - remove when backend is ready
    const availability = {
      available_dates: [
        { date: start_date, available_capacity: 5 },
        { date: end_date, available_capacity: 3 },
      ],
    }

    return res.status(200).json(availability)
  } catch (error) {
    console.error("[Resource Booking API] Error checking availability:", error)
    return res.status(500).json({
      error: {
        type: "internal_error",
        message: "An error occurred while checking availability",
      },
    })
  }
}
