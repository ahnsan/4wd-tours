import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { validateBody, validateQuery, CreateBlackoutSchema, ListBlackoutsQuerySchema } from "../validators"

// Note: This will be uncommented once the backend module is created
// import ResourceBookingModuleService from "../../../../modules/resource-booking/service"
// import { RESOURCE_BOOKING_MODULE } from "../../../../modules/resource-booking"

/**
 * GET /admin/resource-booking/blackouts
 *
 * List blackout periods with optional filtering.
 *
 * Query Parameters:
 * - resource_id: Filter by resource ID
 * - start_date: Filter blackouts that overlap with this start date
 * - end_date: Filter blackouts that overlap with this end date
 * - limit: Number of results to return (default: 20, max: 100)
 * - offset: Number of results to skip (default: 0)
 *
 * Returns:
 * - 200: Paginated list of blackouts
 * - 400: Validation error
 * - 401: Authentication required
 * - 403: Admin access required
 * - 500: Internal server error
 */
export async function GET(
  req: MedusaRequest,
  res: MedusaResponse
) {
  try {
    // Validate query parameters
    const validation = validateQuery(ListBlackoutsQuerySchema, req.query)
    if (!validation.success) {
      return res.status(400).json({
        error: {
          type: "validation_error",
          message: validation.error,
        },
      })
    }

    const { resource_id, start_date, end_date, limit, offset } = validation.data!

    // TODO: Uncomment when backend service is ready
    // const resourceBookingService: ResourceBookingModuleService = req.scope.resolve(RESOURCE_BOOKING_MODULE)

    // Build filters
    // const filters: any = {}
    // if (resource_id) filters.resource_id = resource_id
    // if (start_date && end_date) {
    //   // Find blackouts that overlap with the date range
    //   filters.$or = [
    //     { start_date: { $lte: end_date }, end_date: { $gte: start_date } },
    //   ]
    // }

    // const [blackouts, count] = await resourceBookingService.listAndCountBlackouts(filters, {
    //   skip: offset,
    //   take: limit,
    //   order: { start_date: "ASC" },
    // })

    // Temporary mock response - remove when backend is ready
    const blackouts = []
    const count = 0

    return res.status(200).json({
      blackouts,
      count,
      limit,
      offset,
    })
  } catch (error) {
    console.error("[Resource Booking Admin API] Error listing blackouts:", error)
    return res.status(500).json({
      error: {
        type: "internal_error",
        message: "An error occurred while listing blackouts",
      },
    })
  }
}

/**
 * POST /admin/resource-booking/blackouts
 *
 * Create a blackout period for a resource.
 * Blackouts prevent bookings during specified date ranges.
 *
 * Body:
 * - resource_id: UUID of the resource
 * - start_date: Start date in YYYY-MM-DD format
 * - end_date: End date in YYYY-MM-DD format
 * - reason: Reason for the blackout
 *
 * Returns:
 * - 201: Blackout created successfully
 * - 400: Validation error
 * - 401: Authentication required
 * - 403: Admin access required
 * - 404: Resource not found
 * - 409: Conflict with existing bookings
 * - 500: Internal server error
 */
export async function POST(
  req: MedusaRequest,
  res: MedusaResponse
) {
  try {
    // Validate request body
    const validation = validateBody(CreateBlackoutSchema, req.body)
    if (!validation.success) {
      return res.status(400).json({
        error: {
          type: "validation_error",
          message: validation.error,
        },
      })
    }

    const { resource_id, start_date, end_date, reason } = validation.data!

    // TODO: Uncomment when backend service is ready
    // const resourceBookingService: ResourceBookingModuleService = req.scope.resolve(RESOURCE_BOOKING_MODULE)

    // Check if resource exists
    // const resource = await resourceBookingService.retrieveResource(resource_id)
    // if (!resource) {
    //   return res.status(404).json({
    //     error: {
    //       type: "not_found",
    //       message: "Resource not found",
    //     },
    //   })
    // }

    // Check for existing bookings in this date range
    // const existingBookings = await resourceBookingService.getBookingsInDateRange(
    //   resource_id,
    //   start_date,
    //   end_date
    // )
    // if (existingBookings.length > 0) {
    //   return res.status(409).json({
    //     error: {
    //       type: "conflict",
    //       message: "Cannot create blackout - existing bookings found in date range",
    //       details: {
    //         booking_count: existingBookings.length,
    //         booking_dates: existingBookings.map(b => b.dates).flat(),
    //       },
    //     },
    //   })
    // }

    // Create the blackout
    // const blackout = await resourceBookingService.createBlackouts({
    //   resource_id,
    //   start_date,
    //   end_date,
    //   reason,
    // })

    // Temporary mock response - remove when backend is ready
    const blackout = {
      id: `blackout_${Math.random().toString(36).substr(2, 9)}`,
      resource_id,
      start_date,
      end_date,
      reason,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    return res.status(201).json({ blackout })
  } catch (error) {
    console.error("[Resource Booking Admin API] Error creating blackout:", error)
    return res.status(500).json({
      error: {
        type: "internal_error",
        message: "An error occurred while creating the blackout",
      },
    })
  }
}
