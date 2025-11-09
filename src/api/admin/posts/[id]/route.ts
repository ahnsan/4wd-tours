import { MedusaRequest, MedusaResponse } from "@medusajs/framework"
import BlogModuleService from "../../../../modules/blog/service"
import { BLOG_MODULE } from "../../../../modules/blog"

/**
 * Admin API: Get a single blog post
 * GET /admin/posts/:id
 */
export async function GET(
  req: MedusaRequest,
  res: MedusaResponse
): Promise<void> {
  const { id } = req.params
  const blogModuleService: BlogModuleService = req.scope.resolve(BLOG_MODULE)

  const post = await blogModuleService.retrievePost(id)

  res.json({
    post,
  })
}

/**
 * Admin API: Update a blog post
 * POST /admin/posts/:id
 */
export async function POST(
  req: MedusaRequest,
  res: MedusaResponse
): Promise<void> {
  const { id } = req.params
  const blogModuleService: BlogModuleService = req.scope.resolve(BLOG_MODULE)

  const updatedPost = await blogModuleService.updatePosts(
    { id },
    req.body
  )

  res.json({
    post: updatedPost[0],
  })
}

/**
 * Admin API: Delete a blog post
 * DELETE /admin/posts/:id
 */
export async function DELETE(
  req: MedusaRequest,
  res: MedusaResponse
): Promise<void> {
  const { id } = req.params
  const blogModuleService: BlogModuleService = req.scope.resolve(BLOG_MODULE)

  await blogModuleService.deletePosts(id)

  res.json({
    id,
    deleted: true,
  })
}
