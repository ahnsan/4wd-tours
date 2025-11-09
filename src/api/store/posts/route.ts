import { MedusaRequest, MedusaResponse } from "@medusajs/framework"
import BlogModuleService from "../../../modules/blog/service"
import { BLOG_MODULE } from "../../../modules/blog"

/**
 * Store API: List published blog posts
 * GET /store/posts
 */
export async function GET(
  req: MedusaRequest,
  res: MedusaResponse
): Promise<void> {
  const blogModuleService: BlogModuleService = req.scope.resolve(BLOG_MODULE)
  const productModuleService = req.scope.resolve("productModuleService")

  const posts = await blogModuleService.listPublishedPosts()

  // Enrich posts with product data
  const enrichedPosts = await Promise.all(
    posts.map(async (post: any) => {
      if (post.product_ids && post.product_ids.length > 0) {
        try {
          const products = await productModuleService.listProducts({
            id: post.product_ids,
          })

          return {
            ...post,
            linked_products: products,
          }
        } catch (error) {
          console.error(`Error fetching products for post ${post.id}:`, error)
          return {
            ...post,
            linked_products: [],
          }
        }
      }

      return {
        ...post,
        linked_products: [],
      }
    })
  )

  res.json({
    posts: enrichedPosts,
  })
}
