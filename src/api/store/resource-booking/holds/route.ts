import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { validateBody, CreateHoldSchema } from "../validators"

// Note: This will be uncommented once the backend module is created
// import ResourceBookingModuleService from "../../../../modules/resource-booking/service"
// import { RESOURCE_BOOKING_MODULE } from "../../../../modules/resource-booking"

/**
 * POST /store/resource-booking/holds
 *
 * Create a temporary hold on resource capacity.
 * This endpoint is idempotent - duplicate requests with the same idempotency_token
 * will return the existing hold instead of creating a new one.
 *
 * Body:
 * - resource_id: UUID of the resource
 * - dates: Array of dates in YYYY-MM-DD format
 * - quantity: Number of units to hold
 * - customer_email: Email address of the customer
 * - idempotency_token: Unique token to prevent duplicate holds
 *
 * Returns:
 * - 201: Hold created successfully
 * - 200: Existing hold returned (idempotent request)
 * - 400: Validation error
 * - 404: Resource not found
 * - 409: Insufficient capacity
 * - 422: Blackout conflict
 * - 500: Internal server error
 */
export async function POST(
  req: MedusaRequest,
  res: MedusaResponse
) {
  try {
    // Validate request body
    const validation = validateBody(CreateHoldSchema, req.body)
    if (!validation.success) {
      return res.status(400).json({
        error: {
          type: "validation_error",
          message: validation.error,
        },
      })
    }

    const { resource_id, dates, quantity, customer_email, idempotency_token } = validation.data!

    // TODO: Uncomment when backend service is ready
    // const resourceBookingService: ResourceBookingModuleService = req.scope.resolve(RESOURCE_BOOKING_MODULE)

    // Check for existing hold with same idempotency token (idempotency check)
    // const existingHold = await resourceBookingService.getHoldByIdempotencyToken(idempotency_token)
    // if (existingHold) {
    //   return res.status(200).json({ hold: existingHold })
    // }

    // Verify resource exists and is active
    // const resource = await resourceBookingService.retrieveResource(resource_id)
    // if (!resource || !resource.is_active) {
    //   return res.status(404).json({
    //     error: {
    //       type: "not_found",
    //       message: "Resource not found or inactive",
    //     },
    //   })
    // }

    // Check for blackouts
    // const hasBlackouts = await resourceBookingService.checkBlackouts(resource_id, dates)
    // if (hasBlackouts.length > 0) {
    //   return res.status(422).json({
    //     error: {
    //       type: "blackout_conflict",
    //       message: "One or more requested dates are blacked out",
    //       details: { blackout_dates: hasBlackouts },
    //     },
    //   })
    // }

    // Check capacity availability
    // const capacityCheck = await resourceBookingService.checkCapacityForDates(
    //   resource_id,
    //   dates,
    //   quantity
    // )
    // if (!capacityCheck.available) {
    //   return res.status(409).json({
    //     error: {
    //       type: "insufficient_capacity",
    //       message: "Not enough capacity available for the requested dates",
    //       details: {
    //         requested: quantity,
    //         available: capacityCheck.maxAvailable,
    //         date: capacityCheck.conflictDate,
    //       },
    //     },
    //   })
    // }

    // Create the hold
    // const hold = await resourceBookingService.createHold({
    //   resource_id,
    //   dates,
    //   quantity,
    //   customer_email,
    //   idempotency_token,
    //   status: "ACTIVE",
    // })

    // Temporary mock response - remove when backend is ready
    const hold = {
      id: "hold_123",
      resource_id,
      dates,
      quantity,
      customer_email,
      expires_at: new Date(Date.now() + 15 * 60 * 1000).toISOString(), // 15 minutes from now
      status: "ACTIVE",
      created_at: new Date().toISOString(),
    }

    return res.status(201).json({ hold })
  } catch (error) {
    console.error("[Resource Booking API] Error creating hold:", error)
    return res.status(500).json({
      error: {
        type: "internal_error",
        message: "An error occurred while creating the hold",
      },
    })
  }
}

/**
 * GET /store/resource-booking/holds
 *
 * List holds for the authenticated customer.
 *
 * Query Parameters:
 * - status: Filter by hold status (ACTIVE, CONFIRMED, RELEASED, EXPIRED)
 * - limit: Number of results to return (default: 20, max: 100)
 * - offset: Number of results to skip (default: 0)
 *
 * Returns:
 * - 200: List of holds
 * - 401: Authentication required
 * - 500: Internal server error
 */
export async function GET(
  req: MedusaRequest,
  res: MedusaResponse
) {
  try {
    // Get customer email from authenticated user
    const customerEmail = req.user?.email
    if (!customerEmail) {
      return res.status(401).json({
        error: {
          type: "authentication_required",
          message: "You must be logged in to view holds",
        },
      })
    }

    const { status, limit = 20, offset = 0 } = req.query

    // TODO: Uncomment when backend service is ready
    // const resourceBookingService: ResourceBookingModuleService = req.scope.resolve(RESOURCE_BOOKING_MODULE)

    // const filters: any = { customer_email: customerEmail }
    // if (status && typeof status === 'string') {
    //   filters.status = status
    // }

    // const [holds, count] = await resourceBookingService.listAndCountHolds(filters, {
    //   skip: Number(offset),
    //   take: Math.min(Number(limit), 100),
    //   order: { created_at: "DESC" },
    // })

    // Temporary mock response - remove when backend is ready
    const holds = []
    const count = 0

    return res.status(200).json({
      holds,
      count,
      limit: Math.min(Number(limit), 100),
      offset: Number(offset),
    })
  } catch (error) {
    console.error("[Resource Booking API] Error listing holds:", error)
    return res.status(500).json({
      error: {
        type: "internal_error",
        message: "An error occurred while listing holds",
      },
    })
  }
}
