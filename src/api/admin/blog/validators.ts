import { z } from "zod"

// Validation schema for creating a blog post
export const CreatePostSchema = z.object({
  title: z.string().min(1, "Title is required").max(255),
  slug: z
    .string()
    .min(1, "Slug is required")
    .max(255)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must be lowercase, alphanumeric with hyphens"),
  content: z.string().min(1, "Content is required"),
  excerpt: z.string().optional(),
  featured_image: z.string().optional(),
  author: z.string().min(1, "Author is required"),
  product_ids: z.array(z.string()).optional(),
  category: z.string().optional(),
  tags: z.array(z.string()).optional(),
  is_published: z.boolean().default(false),
})

// Validation schema for updating a blog post
export const UpdatePostSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  slug: z
    .string()
    .min(1)
    .max(255)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must be lowercase, alphanumeric with hyphens")
    .optional(),
  content: z.string().min(1).optional(),
  excerpt: z.string().optional(),
  featured_image: z.string().optional(),
  author: z.string().min(1).optional(),
  product_ids: z.array(z.string()).optional(),
  category: z.string().optional(),
  tags: z.array(z.string()).optional(),
  is_published: z.boolean().optional(),
})

// Validation schema for query parameters
export const ListPostsQuerySchema = z.object({
  limit: z.coerce.number().min(1).max(100).default(20),
  offset: z.coerce.number().min(0).default(0),
  is_published: z.coerce.boolean().optional(),
  category: z.string().optional(),
  q: z.string().optional(),
})

/**
 * Validation result type
 */
export interface ValidationResult<T> {
  success: boolean
  data?: T
  error?: string
}

// Helper function to validate request body
export function validateBody<T>(schema: z.ZodSchema<T>, body: unknown): ValidationResult<T> {
  try {
    const data = schema.parse(body)
    return { success: true, data }
  } catch (error) {
    if (error instanceof z.ZodError) {
      const messages = error.errors.map((err) => `${err.path.join(".")}: ${err.message}`).join(", ")
      return { success: false, error: messages }
    }
    return { success: false, error: "Validation failed" }
  }
}

// Helper function to validate query parameters
export function validateQuery<T>(schema: z.ZodSchema<T>, query: unknown): ValidationResult<T> {
  try {
    const data = schema.parse(query)
    return { success: true, data }
  } catch (error) {
    if (error instanceof z.ZodError) {
      const messages = error.errors.map((err) => `${err.path.join(".")}: ${err.message}`).join(", ")
      return { success: false, error: messages }
    }
    return { success: false, error: "Validation failed" }
  }
}
