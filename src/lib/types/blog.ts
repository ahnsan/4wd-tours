/**
 * Blog Type Definitions
 * Provides type safety for all blog-related operations
 */

export interface Post {
  id: string
  title: string
  slug: string
  content: string
  excerpt: string | null
  featured_image: string | null
  seo_title: string | null
  seo_description: string | null
  published_at: Date | null
  author_id: string | null
  product_ids: string[] | null
  category_id: string | null
  tags: string[] | null
  is_published: boolean
  created_at: Date
  updated_at: Date
}

export interface Category {
  id: string
  name: string
  slug: string
  description: string | null
  created_at: Date
  updated_at: Date
}

export interface PostFilters {
  is_published?: boolean
  category?: string
  category_id?: string
  author_id?: string
  $or?: Array<{
    title?: { $ilike: string }
    content?: { $ilike: string }
    author?: { $ilike: string }
    excerpt?: { $ilike: string }
  }>
}

export interface PostListConfig {
  skip?: number
  take?: number
  order?: {
    [key: string]: 'ASC' | 'DESC'
  }
}

export interface PostListResponse {
  posts: Post[]
  count: number
  limit: number
  offset: number
}

export interface PostCreateData {
  title: string
  slug: string
  content: string
  excerpt?: string
  featured_image?: string
  seo_title?: string
  seo_description?: string
  author_id?: string
  product_ids?: string[]
  category_id?: string
  tags?: string[]
  is_published?: boolean
  published_at?: Date | null
}

export interface PostUpdateData {
  title?: string
  slug?: string
  content?: string
  excerpt?: string
  featured_image?: string
  seo_title?: string
  seo_description?: string
  author_id?: string
  product_ids?: string[]
  category_id?: string
  tags?: string[]
  is_published?: boolean
  published_at?: Date | null
}
