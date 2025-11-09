import { MedusaRequest, MedusaResponse } from "@medusajs/framework"
import BlogModuleService from "../../../../../modules/blog/service"
import { BLOG_MODULE } from "../../../../../modules/blog"

/**
 * Admin API: Link products to a post
 * POST /admin/posts/:id/products
 * Body: { product_ids: string[], action: 'set' | 'add' | 'remove' }
 */
export async function POST(
  req: MedusaRequest,
  res: MedusaResponse
): Promise<void> {
  const { id } = req.params
  const { product_ids, action = 'set' } = req.body
  const blogModuleService: BlogModuleService = req.scope.resolve(BLOG_MODULE)

  let updatedPost

  switch (action) {
    case 'add':
      updatedPost = await blogModuleService.addProductsToPost(id, product_ids)
      break
    case 'remove':
      updatedPost = await blogModuleService.removeProductsFromPost(id, product_ids)
      break
    case 'set':
    default:
      updatedPost = await blogModuleService.linkProductsToPost(id, product_ids)
      break
  }

  res.json({
    post: updatedPost[0],
  })
}
