import { MedusaRequest, MedusaResponse } from "@medusajs/framework"
import BlogModuleService from "../../../modules/blog/service"
import { BLOG_MODULE } from "../../../modules/blog"

/**
 * Admin API: List all blog posts
 * GET /admin/posts
 */
export async function GET(
  req: MedusaRequest,
  res: MedusaResponse
): Promise<void> {
  const blogModuleService: BlogModuleService = req.scope.resolve(BLOG_MODULE)

  const posts = await blogModuleService.listPosts()

  res.json({
    posts,
  })
}

/**
 * Admin API: Create a new blog post
 * POST /admin/posts
 */
export async function POST(
  req: MedusaRequest,
  res: MedusaResponse
): Promise<void> {
  const blogModuleService: BlogModuleService = req.scope.resolve(BLOG_MODULE)

  const {
    title,
    slug,
    content,
    excerpt,
    author,
    featured_image,
    product_ids,
    category,
    tags,
    is_published,
    published_at,
  } = req.body

  const post = await blogModuleService.createPosts({
    title,
    slug,
    content,
    excerpt,
    author,
    featured_image,
    product_ids: product_ids || [],
    category,
    tags: tags || [],
    is_published: is_published || false,
    published_at: published_at || null,
  })

  res.json({
    post,
  })
}
