import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { validateBody, validateQuery, CreateResourceSchema, ListResourcesQuerySchema } from "../validators"

// Note: This will be uncommented once the backend module is created
// import ResourceBookingModuleService from "../../../../modules/resource-booking/service"
// import { RESOURCE_BOOKING_MODULE } from "../../../../modules/resource-booking"

/**
 * GET /admin/resource-booking/resources
 *
 * List all resources with optional filtering.
 *
 * Query Parameters:
 * - type: Filter by resource type (VEHICLE, EQUIPMENT, SERVICE, OTHER)
 * - is_active: Filter by active status (true/false)
 * - limit: Number of results to return (default: 20, max: 100)
 * - offset: Number of results to skip (default: 0)
 *
 * Returns:
 * - 200: Paginated list of resources
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
    const validation = validateQuery(ListResourcesQuerySchema, req.query)
    if (!validation.success) {
      return res.status(400).json({
        error: {
          type: "validation_error",
          message: validation.error,
        },
      })
    }

    const { type, is_active, limit, offset } = validation.data!

    // TODO: Uncomment when backend service is ready
    // const resourceBookingService: ResourceBookingModuleService = req.scope.resolve(RESOURCE_BOOKING_MODULE)

    // Build filters
    // const filters: any = {}
    // if (type) filters.type = type
    // if (is_active !== undefined) filters.is_active = is_active

    // const [resources, count] = await resourceBookingService.listAndCountResources(filters, {
    //   skip: offset,
    //   take: limit,
    //   order: { created_at: "DESC" },
    // })

    // Temporary mock response - remove when backend is ready
    const resources = []
    const count = 0

    return res.status(200).json({
      resources,
      count,
      limit,
      offset,
    })
  } catch (error) {
    console.error("[Resource Booking Admin API] Error listing resources:", error)
    return res.status(500).json({
      error: {
        type: "internal_error",
        message: "An error occurred while listing resources",
      },
    })
  }
}

/**
 * POST /admin/resource-booking/resources
 *
 * Create a new bookable resource.
 *
 * Body:
 * - type: Resource type (VEHICLE, EQUIPMENT, SERVICE, OTHER)
 * - name: Resource name
 * - description: Optional description
 * - metadata: Optional metadata object
 * - is_active: Active status (default: true)
 *
 * Returns:
 * - 201: Resource created successfully
 * - 400: Validation error
 * - 401: Authentication required
 * - 403: Admin access required
 * - 500: Internal server error
 */
export async function POST(
  req: MedusaRequest,
  res: MedusaResponse
) {
  try {
    // Validate request body
    const validation = validateBody(CreateResourceSchema, req.body)
    if (!validation.success) {
      return res.status(400).json({
        error: {
          type: "validation_error",
          message: validation.error,
        },
      })
    }

    const data = validation.data!

    // TODO: Uncomment when backend service is ready
    // const resourceBookingService: ResourceBookingModuleService = req.scope.resolve(RESOURCE_BOOKING_MODULE)

    // const resource = await resourceBookingService.createResources(data)

    // Temporary mock response - remove when backend is ready
    const resource = {
      id: "res_123",
      ...data,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    return res.status(201).json({ resource })
  } catch (error) {
    console.error("[Resource Booking Admin API] Error creating resource:", error)
    return res.status(500).json({
      error: {
        type: "internal_error",
        message: "An error occurred while creating the resource",
      },
    })
  }
}
