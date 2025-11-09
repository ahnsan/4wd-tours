import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import BlogModuleService from "../../../../../modules/blog/service"
import { BLOG_MODULE } from "../../../../../modules/blog"
import { NotFoundError, handleAPIError } from "../../../../../lib/errors/error-handler"
import { logger } from "../../../../../lib/logger"

// GET /store/blog/posts/:slug - Get a single published post by slug
export async function GET(
  req: MedusaRequest,
  res: MedusaResponse
) {
  const requestLogger = logger.child({ endpoint: 'GET /store/blog/posts/:slug' })
  const { slug } = req.params

  try {
    const blogModuleService: BlogModuleService = req.scope.resolve(BLOG_MODULE)

    requestLogger.debug('Fetching post by slug', { slug })

    const post = await blogModuleService.getPostBySlug(slug)

    if (!post || !post.is_published) {
      throw new NotFoundError('Post', slug)
    }

    requestLogger.info('Post retrieved successfully', { postId: post.id, slug })

    res.json({
      post,
    })
  } catch (error) {
    requestLogger.error('Failed to retrieve post', error instanceof Error ? error : undefined)
    handleAPIError(error, res)
  }
}
