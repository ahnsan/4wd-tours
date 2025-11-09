import { MedusaService } from "@medusajs/framework/utils"
import Post from "./models/post"
import Category from "./models/category"
import { Post as PostType, PostFilters, PostListConfig } from "../../lib/types/blog"

/**
 * BlogModuleService provides comprehensive blog management functionality.
 *
 * MedusaService automatically generates CRUD methods for each model:
 *
 * For Post model:
 * - listPosts(filters, config)
 * - listAndCountPosts(filters, config)
 * - retrievePost(id, config)
 * - createPosts(data)
 * - updatePosts(id, data)
 * - deletePosts(id)
 *
 * For Category model:
 * - listCategories(filters, config)
 * - listAndCountCategories(filters, config)
 * - retrieveCategory(id, config)
 * - createCategories(data)
 * - updateCategories(id, data)
 * - deleteCategories(id)
 */
class BlogModuleService extends MedusaService({
  Post,
  Category,
}) {
  /**
   * List all published posts
   */
  async listPublishedPosts() {
    return await this.listPosts({
      is_published: true,
    }, {
      order: {
        published_at: "DESC",
      },
    })
  }

  /**
   * Get a post by slug
   */
  async getPostBySlug(slug: string) {
    const posts = await this.listPosts({
      slug,
    })
    return posts[0]
  }

  /**
   * Get posts by product ID (optimized)
   * Returns all posts that reference a specific product
   *
   * Performance optimization: Database-level filtering instead of in-memory filtering
   * - Before: Fetches all published posts, then filters in application (O(n))
   * - After: Uses JSONB contains operator for database-level filtering
   * - Expected gain: -400-600ms API response time
   */
  async getPostsByProductId(productId: string, config?: { skip?: number; take?: number }) {
    // Use Medusa's JSONB query operators for database-level filtering
    return await this.listPosts({
      is_published: true,
      product_ids: {
        $contains: productId, // JSONB contains operator - database-level filtering
      }
    }, {
      skip: config?.skip || 0,
      take: config?.take || 20,
      order: {
        published_at: "DESC",
      },
    })
  }

  /**
   * Link products to a post
   */
  async linkProductsToPost(postId: string, productIds: string[]) {
    return await this.updatePosts({
      id: postId,
    }, {
      product_ids: productIds,
    })
  }

  /**
   * Add products to a post (append to existing)
   */
  async addProductsToPost(postId: string, productIds: string[]) {
    const post = await this.retrievePost(postId)
    const existingIds = post.product_ids || []
    const newIds = [...new Set([...existingIds, ...productIds])]

    return await this.updatePosts({
      id: postId,
    }, {
      product_ids: newIds,
    })
  }

  /**
   * Remove products from a post
   */
  async removeProductsFromPost(postId: string, productIds: string[]): Promise<PostType> {
    const post = await this.retrievePost(postId)
    const existingIds = post.product_ids || []
    const newIds = existingIds.filter((id: string) => !productIds.includes(id))

    return await this.updatePosts({
      id: postId,
    }, {
      product_ids: newIds,
    })
  }

  // Category Methods

  /**
   * Get a category by slug
   */
  async getCategoryBySlug(slug: string) {
    const categories = await this.listCategories({
      slug,
    })
    return categories[0]
  }

  /**
   * Get posts by category ID
   */
  async getPostsByCategory(categoryId: string, publishedOnly: boolean = true): Promise<PostType[]> {
    const filters: PostFilters = {
      category_id: categoryId,
    }

    if (publishedOnly) {
      filters.is_published = true
    }

    const config: PostListConfig = {
      order: {
        published_at: "DESC",
      },
    }

    return await this.listPosts(filters, config)
  }

  /**
   * Get posts by author ID
   */
  async getPostsByAuthor(authorId: string, publishedOnly: boolean = true): Promise<PostType[]> {
    const filters: PostFilters = {
      author_id: authorId,
    }

    if (publishedOnly) {
      filters.is_published = true
    }

    const config: PostListConfig = {
      order: {
        published_at: "DESC",
      },
    }

    return await this.listPosts(filters, config)
  }

  /**
   * Publish a post
   */
  async publishPost(postId: string) {
    return await this.updatePosts({
      id: postId,
    }, {
      is_published: true,
      published_at: new Date(),
    })
  }

  /**
   * Unpublish a post
   */
  async unpublishPost(postId: string) {
    return await this.updatePosts({
      id: postId,
    }, {
      is_published: false,
      published_at: null,
    })
  }
}

export default BlogModuleService
