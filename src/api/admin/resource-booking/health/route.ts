import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

/**
 * GET /admin/resource-booking/health
 *
 * Health check endpoint for resource booking system
 *
 * Returns:
 * - System status
 * - Hold statistics (active, expired, confirmed, released)
 * - Capacity metrics
 * - Cleanup job status
 *
 * Authentication: Admin API key required
 */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    // Resolve services
    const holdService = req.scope.resolve("holdService")
    const capacityService = req.scope.resolve("capacityService")
    const resourceService = req.scope.resolve("resourceService")

    if (!holdService || !capacityService || !resourceService) {
      return res.status(503).json({
        status: "unhealthy",
        error: "Required services not available",
        timestamp: new Date().toISOString(),
      })
    }

    // Get hold statistics
    const [activeHolds] = await holdService.listAndCountResourceHolds({
      status: "ACTIVE",
    })

    const [expiredHolds] = await holdService.listAndCountResourceHolds({
      status: "EXPIRED",
    })

    const [confirmedHolds] = await holdService.listAndCountResourceHolds({
      status: "CONFIRMED",
    })

    const [releasedHolds] = await holdService.listAndCountResourceHolds({
      status: "RELEASED",
    })

    // Get resource count
    const [resources] = await resourceService.listAndCountResources({
      is_active: true,
    })

    // Check for expired holds that should be cleaned up
    const now = new Date()
    const [overdueHolds] = await holdService.listAndCountResourceHolds({
      status: "ACTIVE",
      expires_at: { $lt: now },
    })

    // Calculate total capacity across all resources
    const [capacities] = await capacityService.listAndCountResourceCapacities()
    const totalMaxCapacity = capacities.reduce(
      (sum, cap) => sum + cap.max_capacity,
      0
    )
    const totalAvailableCapacity = capacities.reduce(
      (sum, cap) => sum + cap.available_capacity,
      0
    )

    // Determine overall health status
    const isHealthy =
      overdueHolds.length === 0 && // No overdue holds
      activeHolds.length >= 0 && // Service is working
      resources.length > 0 // At least one resource exists

    const healthStatus = {
      status: isHealthy ? "healthy" : "degraded",
      timestamp: new Date().toISOString(),

      // Hold metrics
      holds: {
        active: activeHolds.length,
        expired: expiredHolds.length,
        confirmed: confirmedHolds.length,
        released: releasedHolds.length,
        total:
          activeHolds.length +
          expiredHolds.length +
          confirmedHolds.length +
          releasedHolds.length,
      },

      // Cleanup job metrics
      cleanup_job: {
        overdue_holds: overdueHolds.length,
        status: overdueHolds.length === 0 ? "ok" : "warning",
        message:
          overdueHolds.length > 0
            ? `${overdueHolds.length} holds are past expiration and awaiting cleanup`
            : "No overdue holds",
        next_run: "Runs every 5 minutes",
      },

      // Resource metrics
      resources: {
        active_count: resources.length,
        total_capacity_records: capacities.length,
      },

      // Capacity metrics
      capacity: {
        total_max: totalMaxCapacity,
        total_available: totalAvailableCapacity,
        total_reserved: totalMaxCapacity - totalAvailableCapacity,
        utilization_percent:
          totalMaxCapacity > 0
            ? Math.round(
                ((totalMaxCapacity - totalAvailableCapacity) /
                  totalMaxCapacity) *
                  100
              )
            : 0,
      },

      // Service availability
      services: {
        hold_service: "available",
        capacity_service: "available",
        resource_service: "available",
      },
    }

    // Add warnings if any
    const warnings = []
    if (overdueHolds.length > 0) {
      warnings.push(
        `${overdueHolds.length} holds are past expiration and should be cleaned up`
      )
    }
    if (overdueHolds.length > 50) {
      warnings.push(
        "Large number of overdue holds detected - cleanup job may be failing"
      )
    }
    if (resources.length === 0) {
      warnings.push("No active resources configured")
    }

    if (warnings.length > 0) {
      healthStatus["warnings"] = warnings
    }

    return res.status(200).json(healthStatus)
  } catch (error) {
    console.error("[Health Check] Error:", error)

    return res.status(503).json({
      status: "unhealthy",
      error: error instanceof Error ? error.message : "Unknown error",
      timestamp: new Date().toISOString(),
      services: {
        hold_service: "unknown",
        capacity_service: "unknown",
        resource_service: "unknown",
      },
    })
  }
}
