import { MedusaRequest, MedusaResponse } from "@medusajs/framework"
import BlogModuleService from "../../../../modules/blog/service"
import { BLOG_MODULE } from "../../../../modules/blog"

/**
 * Store API: Get a single blog post by slug with product data
 * GET /store/posts/:slug
 */
export async function GET(
  req: MedusaRequest,
  res: MedusaResponse
): Promise<void> {
  const { slug } = req.params
  const blogModuleService: BlogModuleService = req.scope.resolve(BLOG_MODULE)
  const productModuleService = req.scope.resolve("productModuleService")

  const post = await blogModuleService.getPostBySlug(slug)

  if (!post) {
    res.status(404).json({
      message: "Post not found",
    })
    return
  }

  // Enrich post with full product data
  let linkedProducts = []
  if (post.product_ids && post.product_ids.length > 0) {
    try {
      const products = await productModuleService.listProducts({
        id: post.product_ids,
      })

      // Get pricing information for products
      const pricingService = req.scope.resolve("pricingModuleService")

      linkedProducts = await Promise.all(
        products.map(async (product: any) => {
          try {
            // Get price sets for product variants
            const variantsWithPrices = await Promise.all(
              (product.variants || []).map(async (variant: any) => {
                try {
                  const priceSet = await pricingService.retrievePriceSet(
                    variant.price_set_id
                  )
                  return {
                    ...variant,
                    price_set: priceSet,
                  }
                } catch (error) {
                  return variant
                }
              })
            )

            return {
              ...product,
              variants: variantsWithPrices,
            }
          } catch (error) {
            return product
          }
        })
      )
    } catch (error) {
      console.error(`Error fetching products for post ${post.id}:`, error)
    }
  }

  res.json({
    post: {
      ...post,
      linked_products: linkedProducts,
    },
  })
}
