/**
 * Product Type Definitions
 * Provides type safety for Medusa product operations
 */

export interface Product {
  id: string
  handle: string
  title: string
  subtitle?: string
  description?: string
  thumbnail?: string
  status: 'draft' | 'proposed' | 'published' | 'rejected'
  collection_id?: string
  metadata?: ProductMetadata
  variants?: ProductVariant[]
  images?: ProductImage[]
  created_at: Date
  updated_at: Date
}

export interface ProductMetadata {
  addon?: boolean
  duration?: string
  difficulty_level?: string
  min_participants?: number
  max_participants?: number
  departure_times?: string[]
  inclusions?: string[]
  exclusions?: string[]
  category?: string
  featured?: boolean
  [key: string]: unknown
}

export interface ProductVariant {
  id: string
  title: string
  sku?: string
  product_id: string
  prices?: ProductPrice[]
  inventory_quantity?: number
  allow_backorder?: boolean
  manage_inventory?: boolean
  options?: Record<string, string>
  created_at: Date
  updated_at: Date
}

export interface ProductPrice {
  id: string
  amount: number
  currency_code: string
  variant_id: string
  created_at: Date
  updated_at: Date
}

export interface ProductImage {
  id: string
  url: string
  metadata?: {
    alt?: string
    width?: number
    height?: number
  }
}

export interface ProductCollection {
  id: string
  handle: string
  title: string
  metadata?: Record<string, unknown>
}

export interface AddOnProduct {
  id: string
  handle: string
  title: string
  metadata: ProductMetadata
  variants: AddOnVariant[]
}

export interface AddOnVariant {
  id: string
  title: string
  sku?: string
  prices: AddOnPrice[]
}

export interface AddOnPrice {
  amount: number
  currency_code: string
}

export interface AddOnsResponse {
  add_ons: AddOnProduct[]
  count: number
  timing_ms: number
  performance?: string
}
