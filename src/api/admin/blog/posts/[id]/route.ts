import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import BlogModuleService from "../../../../../modules/blog/service"
import { BLOG_MODULE } from "../../../../../modules/blog"
import { UpdatePostSchema, validateBody } from "../../validators"
import { PostUpdateData } from "../../../../../lib/types/blog"
import { handleAPIError, NotFoundError } from "../../../../../lib/errors/error-handler"
import { logger } from "../../../../../lib/logger"

// GET /admin/blog/posts/:id - Get a single post by ID
export async function GET(
  req: MedusaRequest,
  res: MedusaResponse
) {
  const blogModuleService: BlogModuleService = req.scope.resolve(BLOG_MODULE)
  const { id } = req.params

  try {
    logger.debug('Retrieving post', { postId: id })

    const post = await blogModuleService.retrievePost(id)

    if (!post) {
      throw new NotFoundError('Post', id)
    }

    logger.info('Post retrieved successfully', { postId: id })

    res.json({
      post,
    })
  } catch (error) {
    logger.error('Failed to retrieve post', error instanceof Error ? error : undefined)
    handleAPIError(error, res)
  }
}

// PUT /admin/blog/posts/:id - Update a post
export async function PUT(
  req: MedusaRequest,
  res: MedusaResponse
) {
  const blogModuleService: BlogModuleService = req.scope.resolve(BLOG_MODULE)
  const { id } = req.params

  // Validate request body using Zod schema
  const validation = validateBody(UpdatePostSchema, req.body)

  if (!validation.success) {
    return res.status(400).json({
      message: "Validation failed",
      errors: validation.error,
    })
  }

  const validatedData = validation.data!

  try {
    // Check if post exists
    const existingPost = await blogModuleService.retrievePost(id)

    if (!existingPost) {
      throw new NotFoundError('Post', id)
    }

    const updateData: PostUpdateData = { ...validatedData }

    // Handle publish status change
    if (validatedData.is_published !== undefined) {
      // Set published_at when publishing for the first time
      if (validatedData.is_published && !existingPost.published_at) {
        updateData.published_at = new Date()
      }

      // Clear published_at when unpublishing
      if (!validatedData.is_published && existingPost.published_at) {
        updateData.published_at = null
      }
    }

    logger.debug('Updating post', { postId: id, updates: Object.keys(updateData) })

    const post = await blogModuleService.updatePosts(id, updateData)

    logger.info('Post updated successfully', { postId: id })

    res.json({
      post,
    })
  } catch (error) {
    logger.error('Failed to update post', error instanceof Error ? error : undefined)
    handleAPIError(error, res)
  }
}

// DELETE /admin/blog/posts/:id - Delete a post
export async function DELETE(
  req: MedusaRequest,
  res: MedusaResponse
) {
  const blogModuleService: BlogModuleService = req.scope.resolve(BLOG_MODULE)
  const { id } = req.params

  try {
    // Check if post exists
    const existingPost = await blogModuleService.retrievePost(id)

    if (!existingPost) {
      throw new NotFoundError('Post', id)
    }

    logger.debug('Deleting post', { postId: id })

    await blogModuleService.deletePosts(id)

    logger.info('Post deleted successfully', { postId: id })

    res.json({
      id,
      deleted: true,
    })
  } catch (error) {
    logger.error('Failed to delete post', error instanceof Error ? error : undefined)
    handleAPIError(error, res)
  }
}
