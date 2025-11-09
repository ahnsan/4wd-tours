import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import BlogModuleService from "../../../../modules/blog/service"
import { BLOG_MODULE } from "../../../../modules/blog"
import { PostFilters, PostListConfig, PostListResponse } from "../../../../lib/types/blog"
import { handleAPIError } from "../../../../lib/errors/error-handler"
import { logger } from "../../../../lib/logger"

// GET /store/blog/posts - Public listing of published posts
export async function GET(
  req: MedusaRequest,
  res: MedusaResponse<PostListResponse>
) {
  const requestLogger = logger.child({ endpoint: 'GET /store/blog/posts' })

  try {
    const blogModuleService: BlogModuleService = req.scope.resolve(BLOG_MODULE)

    const {
      limit = 20,
      offset = 0,
      q: searchQuery,
      tag,
      category,
      product_id,
    } = req.query

    // Only show published posts in store
    const filters: PostFilters = {
      is_published: true,
    }

    // Search functionality
    if (searchQuery && typeof searchQuery === 'string') {
      const sanitizedQuery = searchQuery.replace(/[%_\\]/g, '\\$&').trim()
      if (sanitizedQuery.length > 100) {
        return res.status(400).json({
          error: "Search query too long (max 100 characters)"
        } as any)
      }

      filters.$or = [
        { title: { $ilike: `%${sanitizedQuery}%` } },
        { content: { $ilike: `%${sanitizedQuery}%` } },
        { excerpt: { $ilike: `%${sanitizedQuery}%` } },
      ]
    }

    // Filter by category
    if (category && typeof category === 'string') {
      filters.category = category
    }

    // Filter by tag
    if (tag && typeof tag === 'string') {
      filters.tags = {
        $contains: tag,
      }
    }

    const limitNum = Number(limit)
    const offsetNum = Number(offset)

    let posts, count

    // Special handling for product_id filter
    if (product_id && typeof product_id === 'string') {
      requestLogger.debug('Fetching posts by product ID', { productId: product_id })
      const allPosts = await blogModuleService.getPostsByProductId(product_id)
      posts = allPosts.slice(offsetNum, offsetNum + limitNum)
      count = allPosts.length
    } else {
      const config: PostListConfig = {
        skip: offsetNum,
        take: limitNum,
        order: { published_at: "DESC" },
      }

      requestLogger.debug('Fetching published posts', { filters, config })
      ;[posts, count] = await blogModuleService.listAndCountPosts(filters, config)
    }

    requestLogger.info('Posts retrieved successfully', { count, limit: limitNum, offset: offsetNum })

    res.json({
      posts,
      count,
      limit: limitNum,
      offset: offsetNum,
    })
  } catch (error) {
    requestLogger.error('Failed to retrieve posts', error instanceof Error ? error : undefined)
    handleAPIError(error, res)
  }
}
