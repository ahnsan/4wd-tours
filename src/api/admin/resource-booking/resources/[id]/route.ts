import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { validateBody, UpdateResourceSchema } from "../../validators"

// Note: This will be uncommented once the backend module is created
// import ResourceBookingModuleService from "../../../../../modules/resource-booking/service"
// import { RESOURCE_BOOKING_MODULE } from "../../../../../modules/resource-booking"

/**
 * GET /admin/resource-booking/resources/:id
 *
 * Retrieve a specific resource by ID.
 *
 * Path Parameters:
 * - id: UUID of the resource
 *
 * Returns:
 * - 200: Resource details
 * - 401: Authentication required
 * - 403: Admin access required
 * - 404: Resource not found
 * - 500: Internal server error
 */
export async function GET(
  req: MedusaRequest,
  res: MedusaResponse
) {
  try {
    const { id } = req.params

    // TODO: Uncomment when backend service is ready
    // const resourceBookingService: ResourceBookingModuleService = req.scope.resolve(RESOURCE_BOOKING_MODULE)

    // const resource = await resourceBookingService.retrieveResource(id)
    // if (!resource) {
    //   return res.status(404).json({
    //     error: {
    //       type: "not_found",
    //       message: "Resource not found",
    //     },
    //   })
    // }

    // Temporary mock response - remove when backend is ready
    const resource = {
      id,
      type: "VEHICLE",
      name: "4WD Vehicle",
      description: "A sample 4WD vehicle",
      metadata: {},
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    return res.status(200).json({ resource })
  } catch (error) {
    console.error("[Resource Booking Admin API] Error retrieving resource:", error)
    return res.status(500).json({
      error: {
        type: "internal_error",
        message: "An error occurred while retrieving the resource",
      },
    })
  }
}

/**
 * PUT /admin/resource-booking/resources/:id
 *
 * Update a resource.
 *
 * Path Parameters:
 * - id: UUID of the resource
 *
 * Body:
 * - type: Resource type (optional)
 * - name: Resource name (optional)
 * - description: Description (optional)
 * - metadata: Metadata object (optional)
 * - is_active: Active status (optional)
 *
 * Returns:
 * - 200: Resource updated successfully
 * - 400: Validation error
 * - 401: Authentication required
 * - 403: Admin access required
 * - 404: Resource not found
 * - 500: Internal server error
 */
export async function PUT(
  req: MedusaRequest,
  res: MedusaResponse
) {
  try {
    const { id } = req.params

    // Validate request body
    const validation = validateBody(UpdateResourceSchema, req.body)
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

    // Check if resource exists
    // const existingResource = await resourceBookingService.retrieveResource(id)
    // if (!existingResource) {
    //   return res.status(404).json({
    //     error: {
    //       type: "not_found",
    //       message: "Resource not found",
    //     },
    //   })
    // }

    // const resource = await resourceBookingService.updateResources({ id }, data)

    // Temporary mock response - remove when backend is ready
    const resource = {
      id,
      type: "VEHICLE",
      name: "Updated 4WD Vehicle",
      description: "An updated 4WD vehicle",
      metadata: {},
      is_active: true,
      ...data,
      updated_at: new Date().toISOString(),
    }

    return res.status(200).json({ resource })
  } catch (error) {
    console.error("[Resource Booking Admin API] Error updating resource:", error)
    return res.status(500).json({
      error: {
        type: "internal_error",
        message: "An error occurred while updating the resource",
      },
    })
  }
}

/**
 * DELETE /admin/resource-booking/resources/:id
 *
 * Soft delete a resource.
 * This sets is_active to false instead of permanently removing the record.
 *
 * Path Parameters:
 * - id: UUID of the resource
 *
 * Returns:
 * - 200: Resource deleted successfully
 * - 401: Authentication required
 * - 403: Admin access required
 * - 404: Resource not found
 * - 409: Cannot delete resource with active bookings
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

    // Check for active bookings
    // const activeBookings = await resourceBookingService.hasActiveBookings(id)
    // if (activeBookings) {
    //   return res.status(409).json({
    //     error: {
    //       type: "conflict",
    //       message: "Cannot delete resource with active bookings",
    //     },
    //   })
    // }

    // Soft delete (set is_active to false)
    // await resourceBookingService.updateResources({ id }, { is_active: false })

    return res.status(200).json({
      message: "Resource deleted successfully",
      id,
    })
  } catch (error) {
    console.error("[Resource Booking Admin API] Error deleting resource:", error)
    return res.status(500).json({
      error: {
        type: "internal_error",
        message: "An error occurred while deleting the resource",
      },
    })
  }
}
