/**
 * Medusa API Response Validation Schemas
 *
 * This file contains Zod schemas for validating Medusa v2 API responses.
 * Following Medusa best practices: https://docs.medusajs.com/learn/fundamentals/api-routes/validation
 *
 * CRITICAL: These schemas use .passthrough() to allow extra fields from API
 * This ensures backward compatibility as Medusa API evolves
 *
 * Validation approach:
 * - Validate critical fields required for business logic
 * - Allow extra fields to pass through (API may return more data)
 * - Log validation errors but don't break the flow (graceful degradation)
 */

import { z } from 'zod';

// ============================================================================
// Base Schemas
// ============================================================================

/**
 * Address schema - used for shipping and billing addresses
 * Follows Medusa v2 address structure
 *
 * CRITICAL: All fields are nullable because Medusa v2 returns null for unset address fields
 * This matches the actual API response structure from Medusa backend
 */
export const AddressSchema = z.object({
  first_name: z.string().nullable(),
  last_name: z.string().nullable(),
  address_1: z.string().nullable(),
  address_2: z.string().nullable().optional(),
  city: z.string().nullable(),
  country_code: z.string().nullable(),
  province: z.string().nullable().optional(),
  postal_code: z.string().nullable(),
  phone: z.string().nullable().optional(),
  company: z.string().nullable().optional(),
  metadata: z.record(z.string(), z.any()).optional(),
}).passthrough(); // Allow extra fields from API

/**
 * Cart line item schema
 * Represents a product in the cart
 */
export const CartLineItemSchema = z.object({
  id: z.string().min(1),
  cart_id: z.string().min(1),
  variant_id: z.string().min(1),
  quantity: z.number().int().positive(),
  title: z.string().optional(),
  description: z.string().optional(),
  thumbnail: z.string().optional(),
  unit_price: z.number().optional(),
  subtotal: z.number().optional(),
  total: z.number().optional(),
  metadata: z.record(z.string(), z.any()).optional(),
}).passthrough();

/**
 * Payment collection schema
 * Critical for Medusa v2 payment flow
 */
export const PaymentCollectionSchema = z.object({
  id: z.string().min(1),
  status: z.string().optional(),
  amount: z.number().optional(),
  currency_code: z.string().optional(),
  payment_sessions: z.array(z.any()).optional(),
  metadata: z.record(z.string(), z.any()).optional(),
}).passthrough();

/**
 * Medusa Cart schema
 * Core schema for cart validation
 *
 * CRITICAL: Fields marked nullable/optional match actual Medusa v2 API responses
 * - email: Can be null or undefined in initial cart state
 * - region_id: Can be null before region is set
 * - addresses: Use AddressSchema which allows null values for all fields
 */
export const MedusaCartSchema = z.object({
  id: z.string().min(1),
  email: z.string().email().nullable().optional(),
  shipping_address: AddressSchema.nullable().optional(),
  billing_address: AddressSchema.nullable().optional(),
  items: z.array(CartLineItemSchema).default([]),
  region: z.any(), // Region can be complex, allow any for now
  region_id: z.string().nullable().optional(),
  shipping_methods: z.array(z.any()).default([]),
  payment_session: z.any().optional(),
  payment_sessions: z.array(z.any()).optional(),
  payment_collection: PaymentCollectionSchema.optional(),
  completed_at: z.string().nullable().optional(),
  subtotal: z.number().optional(),
  total: z.number().optional(),
  tax_total: z.number().optional(),
  shipping_total: z.number().optional(),
  discount_total: z.number().optional(),
  metadata: z.record(z.string(), z.any()).optional(),
}).passthrough();

/**
 * Medusa Order schema
 * Represents a completed cart
 */
export const MedusaOrderSchema = z.object({
  id: z.string().min(1),
  display_id: z.number().int().positive(),
  email: z.string().email(),
  shipping_address: AddressSchema,
  billing_address: AddressSchema,
  items: z.array(CartLineItemSchema).min(1),
  shipping_methods: z.array(z.any()),
  total: z.number().nonnegative(),
  subtotal: z.number().nonnegative(),
  tax_total: z.number().nonnegative(),
  shipping_total: z.number().nonnegative(),
  discount_total: z.number().nonnegative(),
  status: z.string().min(1),
  created_at: z.string().min(1),
  metadata: z.record(z.string(), z.any()).optional(),
}).passthrough();

/**
 * Cart completion response schema
 * Medusa v2 returns either { type: "order", order: {...} } or { type: "cart", cart: {...} }
 */
export const CartCompletionResponseSchema = z.object({
  type: z.enum(['cart', 'order']),
  order: MedusaOrderSchema.optional(),
  cart: MedusaCartSchema.optional(),
  error: z.string().optional(),
}).passthrough();

// ============================================================================
// API Response Wrapper Schemas
// ============================================================================

/**
 * Generic API response wrapper for cart endpoints
 */
export const CartResponseSchema = z.object({
  cart: MedusaCartSchema,
}).passthrough();

/**
 * Generic API response wrapper for order endpoints
 */
export const OrderResponseSchema = z.object({
  order: MedusaOrderSchema,
}).passthrough();

/**
 * Payment collection creation response
 */
export const PaymentCollectionResponseSchema = z.object({
  payment_collection: PaymentCollectionSchema,
}).passthrough();

/**
 * Shipping options response
 */
export const ShippingOptionsResponseSchema = z.object({
  shipping_options: z.array(z.any()).default([]),
}).passthrough();

// ============================================================================
// Validation Helper Functions
// ============================================================================

/**
 * Validation result type
 */
export interface ValidationResult<T> {
  success: boolean;
  data?: T;
  error?: string;
  issues?: z.ZodIssue[];
}

/**
 * Safely validate data against a schema with detailed error reporting
 *
 * @param schema - Zod schema to validate against
 * @param data - Data to validate
 * @param context - Context string for logging (e.g., "Cart response")
 * @returns Validation result with data or error details
 */
export function validateSchema<T>(
  schema: z.ZodSchema<T>,
  data: unknown,
  context: string
): ValidationResult<T> {
  try {
    const result = schema.safeParse(data);

    if (result.success) {
      return {
        success: true,
        data: result.data,
      };
    } else {
      // Log validation errors for debugging
      const errors = result.error.issues;
      console.warn(`[Validation] ${context} validation failed:`, {
        errors: errors,
        data: JSON.stringify(data, null, 2).substring(0, 500) + '...', // Truncate for logging
      });

      return {
        success: false,
        error: `Validation failed: ${errors.map(e => e.message).join(', ')}`,
        issues: errors,
      };
    }
  } catch (error) {
    console.error(`[Validation] Unexpected error validating ${context}:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown validation error',
    };
  }
}

/**
 * Validate cart response data
 * Gracefully handles validation failures by logging errors but returning data
 *
 * @param data - Raw cart data from API
 * @returns Validated cart data (or original data if validation fails)
 */
export function validateCartResponse(data: unknown): any {
  const result = validateSchema(CartResponseSchema, data, 'Cart response');

  if (!result.success) {
    console.warn('[Validation] Cart validation failed, using raw data. Errors:', result.error);
    // Return original data to prevent breaking the flow
    return data;
  }

  return result.data;
}

/**
 * Validate order response data
 *
 * @param data - Raw order data from API
 * @returns Validated order data (or original data if validation fails)
 */
export function validateOrderResponse(data: unknown): any {
  const result = validateSchema(OrderResponseSchema, data, 'Order response');

  if (!result.success) {
    console.warn('[Validation] Order validation failed, using raw data. Errors:', result.error);
    return data;
  }

  return result.data;
}

/**
 * Validate cart completion response
 *
 * @param data - Raw cart completion data from API
 * @returns Validated completion data (or original data if validation fails)
 */
export function validateCartCompletionResponse(data: unknown): any {
  const result = validateSchema(CartCompletionResponseSchema, data, 'Cart completion response');

  if (!result.success) {
    console.warn('[Validation] Cart completion validation failed, using raw data. Errors:', result.error);
    return data;
  }

  return result.data;
}

/**
 * Validate payment collection response
 *
 * @param data - Raw payment collection data from API
 * @returns Validated payment collection data (or original data if validation fails)
 */
export function validatePaymentCollectionResponse(data: unknown): any {
  const result = validateSchema(PaymentCollectionResponseSchema, data, 'Payment collection response');

  if (!result.success) {
    console.warn('[Validation] Payment collection validation failed, using raw data. Errors:', result.error);
    return data;
  }

  return result.data;
}

// ============================================================================
// Type Exports
// ============================================================================

// Export inferred TypeScript types from Zod schemas
export type Address = z.infer<typeof AddressSchema>;
export type CartLineItem = z.infer<typeof CartLineItemSchema>;
export type PaymentCollection = z.infer<typeof PaymentCollectionSchema>;
export type MedusaCart = z.infer<typeof MedusaCartSchema>;
export type MedusaOrder = z.infer<typeof MedusaOrderSchema>;
export type CartCompletionResponse = z.infer<typeof CartCompletionResponseSchema>;
export type CartResponse = z.infer<typeof CartResponseSchema>;
export type OrderResponse = z.infer<typeof OrderResponseSchema>;
export type PaymentCollectionResponse = z.infer<typeof PaymentCollectionResponseSchema>;
