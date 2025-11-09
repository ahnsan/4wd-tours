import { z } from "zod"

/**
 * Date format validation (YYYY-MM-DD)
 */
const dateRegex = /^\d{4}-\d{2}-\d{2}$/

/**
 * UUID format validation
 */
const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/**
 * Resource type enum
 */
export const ResourceTypeEnum = z.enum(["VEHICLE", "EQUIPMENT", "SERVICE", "OTHER"])

/**
 * Validation schema for creating a resource
 */
export const CreateResourceSchema = z.object({
  type: ResourceTypeEnum,
  name: z.string().min(1, "Name is required").max(255),
  description: z.string().optional(),
  metadata: z.record(z.any()).optional(),
  is_active: z.boolean().default(true),
})

/**
 * Validation schema for updating a resource
 */
export const UpdateResourceSchema = z.object({
  type: ResourceTypeEnum.optional(),
  name: z.string().min(1).max(255).optional(),
  description: z.string().optional(),
  metadata: z.record(z.any()).optional(),
  is_active: z.boolean().optional(),
})

/**
 * Validation schema for listing resources
 */
export const ListResourcesQuerySchema = z.object({
  type: ResourceTypeEnum.optional(),
  is_active: z.coerce.boolean().optional(),
  limit: z.coerce.number().min(1).max(100).default(20),
  offset: z.coerce.number().min(0).default(0),
})

/**
 * Validation schema for initializing capacity
 */
export const InitializeCapacitySchema = z.object({
  start_date: z.string().regex(dateRegex, "Date must be in YYYY-MM-DD format"),
  end_date: z.string().regex(dateRegex, "Date must be in YYYY-MM-DD format"),
  max_capacity: z.number().min(1, "Max capacity must be at least 1"),
}).refine(
  (data) => {
    const start = new Date(data.start_date)
    const end = new Date(data.end_date)
    return start <= end
  },
  {
    message: "start_date must be before or equal to end_date",
    path: ["start_date"],
  }
).refine(
  (data) => {
    const start = new Date(data.start_date)
    const end = new Date(data.end_date)
    const diffTime = Math.abs(end.getTime() - start.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays <= 365
  },
  {
    message: "Date range cannot exceed 365 days",
    path: ["end_date"],
  }
)

/**
 * Validation schema for creating a blackout
 */
export const CreateBlackoutSchema = z.object({
  resource_id: z.string().regex(uuidRegex, "Invalid resource ID format"),
  start_date: z.string().regex(dateRegex, "Date must be in YYYY-MM-DD format"),
  end_date: z.string().regex(dateRegex, "Date must be in YYYY-MM-DD format"),
  reason: z.string().min(1, "Reason is required").max(500),
}).refine(
  (data) => {
    const start = new Date(data.start_date)
    const end = new Date(data.end_date)
    return start <= end
  },
  {
    message: "start_date must be before or equal to end_date",
    path: ["start_date"],
  }
)

/**
 * Validation schema for listing blackouts
 */
export const ListBlackoutsQuerySchema = z.object({
  resource_id: z.string().regex(uuidRegex, "Invalid resource ID format").optional(),
  start_date: z.string().regex(dateRegex, "Date must be in YYYY-MM-DD format").optional(),
  end_date: z.string().regex(dateRegex, "Date must be in YYYY-MM-DD format").optional(),
  limit: z.coerce.number().min(1).max(100).default(20),
  offset: z.coerce.number().min(0).default(0),
})

/**
 * Validation result type
 */
export interface ValidationResult<T> {
  success: boolean
  data?: T
  error?: string
}

/**
 * Helper function to validate request body
 */
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

/**
 * Helper function to validate query parameters
 */
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
