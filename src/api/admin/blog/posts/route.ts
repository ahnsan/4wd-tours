import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import BlogModuleService from "../../../../modules/blog/service"
import { BLOG_MODULE } from "../../../../modules/blog"
import { ListPostsQuerySchema, CreatePostSchema, validateQuery, validateBody } from "../validators"
import { PostFilters, PostListConfig, PostListResponse } from "../../../../lib/types/blog"
import { handleAPIError } from "../../../../lib/errors/error-handler"
import { logger } from "../../../../lib/logger"

// GET /admin/blog/posts - List all posts with pagination
export async function GET(
  req: MedusaRequest,
  res: MedusaResponse
) {
  const blogModuleService: BlogModuleService = req.scope.resolve(BLOG_MODULE)

  // Validate query parameters to prevent injection attacks
  const validation = validateQuery(ListPostsQuerySchema, req.query)

  if (!validation.success) {
    return res.status(400).json({
      message: "Invalid query parameters",
      errors: validation.error,
    })
  }

  const {
    limit,
    offset,
    is_published,
    category,
    q: searchQuery
  } = validation.data!

  const filters: PostFilters = {}

  // Filter by published status
  if (is_published !== undefined) {
    filters.is_published = is_published
  }

  // Filter by category
  if (category) {
    filters.category = category
  }

  // Search functionality with sanitization
  if (searchQuery) {
    // Sanitize search query to prevent SQL injection
    // Escape special characters used in LIKE queries
    const sanitizedQuery = searchQuery
      .replace(/[%_\\]/g, '\\$&')
      .trim()

    // Limit search query length
    if (sanitizedQuery.length > 100) {
      return res.status(400).json({
        message: "Search query too long (max 100 characters)"
      })
    }

    filters.$or = [
      { title: { $ilike: `%${sanitizedQuery}%` } },
      { content: { $ilike: `%${sanitizedQuery}%` } },
      { author: { $ilike: `%${sanitizedQuery}%` } },
      { excerpt: { $ilike: `%${sanitizedQuery}%` } },
    ]
  }

  const config: PostListConfig = {
    skip: offset,
    take: limit,
    order: { created_at: "DESC" },
  }

  try {
    logger.debug('Fetching posts', { filters, config })

    const [posts, count] = await blogModuleService.listAndCountPosts(filters, config)

    logger.info('Posts retrieved successfully', { count, limit, offset })

    res.json({
      posts,
      count,
      limit,
      offset,
    })
  } catch (error) {
    logger.error('Failed to retrieve posts', error instanceof Error ? error : undefined)
    handleAPIError(error, res)
  }
}

// POST /admin/blog/posts - Create a new post
export async function POST(
  req: MedusaRequest,
  res: MedusaResponse
) {
  const blogModuleService: BlogModuleService = req.scope.resolve(BLOG_MODULE)

  // Validate request body using Zod schema
  const validation = validateBody(CreatePostSchema, req.body)

  if (!validation.success) {
    return res.status(400).json({
      message: "Validation failed",
      errors: validation.error,
    })
  }

  const validatedData = validation.data!

  try {
    logger.debug('Creating post', { slug: validatedData.slug })

    const post = await blogModuleService.createPosts({
      ...validatedData,
      published_at: validatedData.is_published ? new Date() : null,
    })

    logger.info('Post created successfully', { postId: post.id, slug: post.slug })

    res.status(201).json({
      post,
    })
  } catch (error) {
    logger.error('Failed to create post', error instanceof Error ? error : undefined)
    handleAPIError(error, res)
  }
}
