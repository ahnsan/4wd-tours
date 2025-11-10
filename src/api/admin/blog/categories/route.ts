import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import BlogModuleService from "../../../../modules/blog/service"
import { BLOG_MODULE } from "../../../../modules/blog"
import { handleAPIError } from "../../../../lib/errors/error-handler"
import { logger } from "../../../../lib/logger"

// GET /admin/blog/categories - List all categories
export async function GET(
  req: MedusaRequest,
  res: MedusaResponse
) {
  const requestLogger = logger.child({ endpoint: 'GET /admin/blog/categories' })

  try {
    const blogModuleService: BlogModuleService = req.scope.resolve(BLOG_MODULE)

    const {
      limit = 100,
      offset = 0,
      q: searchQuery,
    } = req.query

    const limitNum = Number(limit)
    const offsetNum = Number(offset)

    const filters: any = {}

    // Search functionality with sanitization
    if (searchQuery && typeof searchQuery === 'string') {
      const sanitizedQuery = searchQuery
        .replace(/[%_\\]/g, '\\$&')
        .trim()

      if (sanitizedQuery.length > 100) {
        return res.status(400).json({
          message: "Search query too long (max 100 characters)"
        })
      }

      filters.$or = [
        { name: { $ilike: `%${sanitizedQuery}%` } },
        { description: { $ilike: `%${sanitizedQuery}%` } },
      ]
    }

    const config = {
      skip: offsetNum,
      take: limitNum,
      order: { name: "ASC" as const },
    }

    requestLogger.debug('Fetching categories', { filters, config })

    const [categories, count] = await blogModuleService.listAndCountCategories(filters, config)

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

// POST /admin/blog/categories - Create a new category
export async function POST(
  req: MedusaRequest,
  res: MedusaResponse
) {
  const requestLogger = logger.child({ endpoint: 'POST /admin/blog/categories' })

  try {
    const blogModuleService: BlogModuleService = req.scope.resolve(BLOG_MODULE)

    const { name, slug, description } = req.body

    if (!name || !slug) {
      return res.status(400).json({
        message: "Name and slug are required"
      })
    }

    requestLogger.debug('Creating category', { slug })

    const category = await blogModuleService.createCategories({
      name,
      slug,
      description: description || null,
    })

    requestLogger.info('Category created successfully', { categoryId: category.id, slug: category.slug })

    res.status(201).json({
      category,
    })
  } catch (error) {
    requestLogger.error('Failed to create category', error instanceof Error ? error : undefined)
    handleAPIError(error, res)
  }
}
