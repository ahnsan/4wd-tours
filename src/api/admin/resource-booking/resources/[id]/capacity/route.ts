import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { validateBody, InitializeCapacitySchema } from "../../../validators"

// Note: This will be uncommented once the backend module is created
// import ResourceBookingModuleService from "../../../../../../modules/resource-booking/service"
// import { RESOURCE_BOOKING_MODULE } from "../../../../../../modules/resource-booking"

/**
 * POST /admin/resource-booking/resources/:id/capacity
 *
 * Initialize capacity for a resource across a date range.
 * Creates capacity records for each date in the range.
 *
 * Path Parameters:
 * - id: UUID of the resource
 *
 * Body:
 * - start_date: Start date in YYYY-MM-DD format
 * - end_date: End date in YYYY-MM-DD format
 * - max_capacity: Maximum capacity per day
 *
 * Returns:
 * - 201: Capacity records created successfully
 * - 400: Validation error
 * - 401: Authentication required
 * - 403: Admin access required
 * - 404: Resource not found
 * - 409: Capacity already exists for some dates
 * - 500: Internal server error
 */
export async function POST(
  req: MedusaRequest,
  res: MedusaResponse
) {
  try {
    const { id } = req.params

    // Validate request body
    const validation = validateBody(InitializeCapacitySchema, req.body)
    if (!validation.success) {
      return res.status(400).json({
        error: {
          type: "validation_error",
          message: validation.error,
        },
      })
    }

    const { start_date, end_date, max_capacity } = validation.data!

    // TODO: Uncomment when backend service is ready
    // const resourceBookingService: ResourceBookingModuleService = req.scope.resolve(RESOURCE_BOOKING_MODULE)

    // Check if resource exists
    // const resource = await resourceBookingService.retrieveResource(id)
    // if (!resource) {
    //   return res.status(404).json({
    //     error: {
    //       type: "not_found",
    //       message: "Resource not found",
    //     },
    //   })
    // }

    // Check for existing capacity records
    // const existingCapacity = await resourceBookingService.getCapacityForDateRange(
    //   id,
    //   start_date,
    //   end_date
    // )
    // if (existingCapacity.length > 0) {
    //   return res.status(409).json({
    //     error: {
    //       type: "conflict",
    //       message: "Capacity already exists for some dates in this range",
    //       details: {
    //         existing_dates: existingCapacity.map(c => c.date),
    //       },
    //     },
    //   })
    // }

    // Generate date range
    // const dates: string[] = []
    // const currentDate = new Date(start_date)
    // const endDateObj = new Date(end_date)

    // while (currentDate <= endDateObj) {
    //   dates.push(currentDate.toISOString().split('T')[0])
    //   currentDate.setDate(currentDate.getDate() + 1)
    // }

    // Create capacity records
    // const capacityRecords = await resourceBookingService.initializeCapacity({
    //   resource_id: id,
    //   dates,
    //   max_capacity,
    // })

    // Temporary mock response - remove when backend is ready
    const dates: string[] = []
    const currentDate = new Date(start_date)
    const endDateObj = new Date(end_date)

    while (currentDate <= endDateObj) {
      dates.push(currentDate.toISOString().split('T')[0])
      currentDate.setDate(currentDate.getDate() + 1)
    }

    const capacityRecords = dates.map(date => ({
      id: `cap_${Math.random().toString(36).substr(2, 9)}`,
      resource_id: id,
      date,
      max_capacity,
      allocated: 0,
      available: max_capacity,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }))

    return res.status(201).json({
      message: "Capacity initialized successfully",
      capacity_records: capacityRecords,
      count: capacityRecords.length,
    })
  } catch (error) {
    console.error("[Resource Booking Admin API] Error initializing capacity:", error)
    return res.status(500).json({
      error: {
        type: "internal_error",
        message: "An error occurred while initializing capacity",
      },
    })
  }
}
