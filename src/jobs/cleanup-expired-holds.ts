import { MedusaContainer } from "@medusajs/framework/types"
import { Logger } from "@medusajs/framework/logger"

/**
 * Cleanup Expired Holds Job
 *
 * Business Requirements:
 * - Runs every 5 minutes
 * - Finds all ACTIVE holds past 30-minute TTL
 * - Transitions status: ACTIVE → EXPIRED
 * - Restores available_capacity for each expired hold
 *
 * Performance Target:
 * - Process 100+ holds in < 5 seconds
 * - Fail gracefully and continue processing if individual holds error
 *
 * Monitoring:
 * - Logs metrics for each cleanup run
 * - Alerts if cleanup takes > 5 seconds
 * - Alerts if > 100 holds expired in single run
 */
export default async function cleanupExpiredHoldsJob(
  container: MedusaContainer
): Promise<void> {
  const logger = container.resolve<Logger>("logger")

  try {
    const startTime = Date.now()

    logger.info("[Cleanup Job] Starting expired holds cleanup...")

    // Resolve the HoldService from the resource_booking module
    // The module exports individual services, not a combined service
    const holdService = container.resolve("holdService")

    if (!holdService) {
      logger.error("[Cleanup Job] HoldService not found in container")
      throw new Error("HoldService not available")
    }

    // Run cleanup
    const result = await holdService.cleanupExpiredHolds()

    const duration = Date.now() - startTime

    // Log success metrics
    logger.info("[Cleanup Job] Expired holds cleanup complete", {
      expired_count: result.expiredCount,
      capacity_restored: result.totalCapacityRestored,
      duration_ms: duration,
      timestamp: new Date().toISOString(),
    })

    // Performance warning
    if (duration > 5000) {
      logger.warn("[Cleanup Job] Slow cleanup detected", {
        duration_ms: duration,
        threshold_ms: 5000,
        message: "Hold cleanup took longer than 5 seconds",
      })
    }

    // High expiration rate warning
    if (result.expiredCount > 100) {
      logger.warn("[Cleanup Job] High hold expiration rate", {
        expired_count: result.expiredCount,
        threshold: 100,
        message: "Unusually high number of expired holds",
        suggestion: "Consider investigating checkout flow or extending hold TTL",
      })
    }

    // Success message for zero expirations (normal case)
    if (result.expiredCount === 0) {
      logger.debug("[Cleanup Job] No expired holds found")
    }
  } catch (error) {
    logger.error("[Cleanup Job] Expired holds cleanup failed", {
      error: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString(),
    })

    // Re-throw to mark job as failed in Medusa's job scheduler
    // This allows monitoring systems to detect job failures
    throw error
  }
}

/**
 * Job Configuration
 *
 * Schedule: Every 5 minutes
 * Cron expression: star-slash-5 star star star star
 * - Minute: every 5 minutes
 * - Hour: every hour
 * - Day of month: every day
 * - Month: every month
 * - Day of week: every day of week
 */
export const config = {
  name: "cleanup-expired-holds",
  schedule: "*/5 * * * *", // Every 5 minutes
  data: {},
}
