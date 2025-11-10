import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import BlogModuleService from "../../../../modules/blog/service"
import { BLOG_MODULE } from "../../../../modules/blog"
import { handleAPIError } from "../../../../lib/errors/error-handler"
import { logger } from "../../../../lib/logger"

// GET /store/blog/categories - Public listing of all categories
export async function GET(
  req: MedusaRequest,
  res: MedusaResponse
) {
  const requestLogger = logger.child({ endpoint: 'GET /store/blog/categories' })

  try {
    const blogModuleService: BlogModuleService = req.scope.resolve(BLOG_MODULE)

    const {
      limit = 100,
      offset = 0,
    } = req.query

    const limitNum = Number(limit)
    const offsetNum = Number(offset)

    const config = {
      skip: offsetNum,
      take: limitNum,
      order: { name: "ASC" as const },
    }

    requestLogger.debug('Fetching categories', { config })

    const [categories, count] = await blogModuleService.listAndCountCategories({}, config)

    requestLogger.info('Categories retrieved successfully', { count, limit: limitNum, offset: offsetNum })

    res.json({
      categories,
      count,
      limit: limitNum,
      offset: offsetNum,
    })
  } catch (error) {
    requestLogger.error('Failed to retrieve categories', error instanceof Error ? error : undefined)
    handleAPIError(error, res)
  }
}
