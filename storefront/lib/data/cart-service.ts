/**
 * Cart Service - Medusa Backend Integration
 *
 * Handles all cart operations with the Medusa backend API.
 * Follows official Medusa Storefront API patterns.
 *
 * Official Documentation:
 * - Store API: https://docs.medusajs.com/api/store
 * - Cart Management: https://docs.medusajs.com/resources/storefront-development/cart
 * - Checkout Flow: https://docs.medusajs.com/resources/storefront-development/checkout
 *
 * VALIDATION: Uses Zod schemas to validate API responses
 * - Schemas defined in: storefront/lib/validation/medusa-schemas.ts
 * - Validation is graceful: logs errors but doesn't break the flow
 * - Critical responses validated: cart, order, payment collection
 */

// Import validation functions
import {
  validateCartResponse,
  validateOrderResponse,
  validateCartCompletionResponse,
  validatePaymentCollectionResponse,
} from '../validation/medusa-schemas';

// Import retry utilities for payment operations
import {
  retryPaymentCollectionCreation,
  retryPaymentSessionInitialization,
  retryCartCompletion
} from '../utils/retry';

// Environment configuration
const MEDUSA_BACKEND_URL = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || 'http://localhost:9000';
const STORE_API_URL = `${MEDUSA_BACKEND_URL}/store`;
const API_TIMEOUT = 10000; // 10 seconds for cart operations
const DEFAULT_REGION_ID = 'reg_01K9G4HA190556136E7RJQ4411'; // Australia region (Sunshine Coast)

// ============================================================================
// TypeScript Types & Interfaces
// ============================================================================

/**
 * Address structure for shipping and billing
 * Follows Medusa v2 address schema
 */
interface AddressPayload {
  first_name: string;
  last_name: string;
  address_1: string;
  address_2?: string;
  city: string;
  country_code: string; // ISO 2-letter country code (e.g., "au" for Australia)
  province?: string; // State/Province (e.g., "QLD" for Queensland)
  postal_code: string;
  phone?: string;
  company?: string;
  metadata?: Record<string, any>;
}

/**
 * Cart line item (product in cart)
 */
interface CartLineItem {
  id: string;
  cart_id: string;
  variant_id: string;
  quantity: number;
  title?: string;
  description?: string;
  thumbnail?: string;
  unit_price?: number;
  subtotal?: number;
  total?: number;
  metadata?: Record<string, any>;
}

/**
 * Medusa Cart object
 * Represents the current shopping cart state
 */
interface MedusaCart {
  id: string;
  email?: string;
  shipping_address?: AddressPayload;
  billing_address?: AddressPayload;
  items: CartLineItem[];
  region: any;
  region_id: string;
  shipping_methods: any[];
  payment_session?: any;
  payment_sessions?: any[];
  payment_collection?: any; // Added for Medusa v2 payment collection tracking
  completed_at?: string;
  subtotal?: number;
  total?: number;
  tax_total?: number;
  shipping_total?: number;
  discount_total?: number;
  metadata?: Record<string, any>;
}

/**
 * Medusa Order object
 * Represents a completed cart (placed order)
 */
interface MedusaOrder {
  id: string;
  display_id: number;
  email: string;
  shipping_address: AddressPayload;
  billing_address: AddressPayload;
  items: CartLineItem[];
  shipping_methods: any[];
  total: number;
  subtotal: number;
  tax_total: number;
  shipping_total: number;
  discount_total: number;
  status: string;
  created_at: string;
  metadata?: Record<string, any>;
}

/**
 * Cart completion response
 * Medusa v2 returns either { type: "order", order: {...} } or { type: "cart", cart: {...} }
 */
interface CartCompletionResponse {
  type: 'cart' | 'order';
  order?: MedusaOrder;
  cart?: MedusaCart;
  error?: string;
}

/**
 * Service response wrapper for better error handling
 */
interface ServiceResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Fetch with timeout and abort controller
 */
async function fetchWithTimeout(
  url: string,
  options: RequestInit,
  timeout: number = API_TIMEOUT
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('Request timeout - Medusa API not responding');
    }
    throw error;
  }
}

/**
 * Build request headers with publishable API key
 */
function buildHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  const apiKey = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY;
  if (apiKey) {
    headers['x-publishable-api-key'] = apiKey;
  }

  return headers;
}

/**
 * Handle API response and extract data with Zod validation
 *
 * VALIDATION APPROACH:
 * - Validate critical responses (cart, order, payment collection) with Zod schemas
 * - Graceful degradation: log validation errors but don't break the flow
 * - Return original data if validation fails to ensure backward compatibility
 */
async function handleResponse<T>(response: Response, operation: string): Promise<T> {
  // DEBUGGING: Log full request/response details
  console.log(`[Cart Service] ========================================`);
  console.log(`[Cart Service] RESPONSE DETAILS FOR: ${operation}`);
  console.log(`[Cart Service] HTTP Status: ${response.status} ${response.statusText}`);
  console.log(`[Cart Service] Response URL: ${response.url}`);
  console.log(`[Cart Service] Response OK: ${response.ok}`);
  console.log(`[Cart Service] ========================================`);

  // Validate HTTP status
  if (!response.ok) {
    let errorMessage = `${operation} failed with status ${response.status}`;
    let errorDetails = null;

    try {
      // Clone response to read body multiple times
      const responseClone = response.clone();
      const bodyText = await responseClone.text();

      console.error(`[Cart Service] ERROR RESPONSE BODY (raw):`, bodyText);

      // Try parsing as JSON
      try {
        errorDetails = JSON.parse(bodyText);
        console.error(`[Cart Service] ERROR RESPONSE BODY (parsed):`, JSON.stringify(errorDetails, null, 2));
      } catch {
        console.error(`[Cart Service] Response body is not JSON, using raw text`);
      }

      // Extract error message from parsed data
      if (errorDetails?.message) {
        errorMessage = `${operation} failed: ${errorDetails.message}`;
      } else if (errorDetails?.error) {
        errorMessage = `${operation} failed: ${errorDetails.error}`;
      } else if (errorDetails?.errors && Array.isArray(errorDetails.errors)) {
        errorMessage = `${operation} failed: ${errorDetails.errors.map((e: any) => e.message || e).join(', ')}`;
      } else if (bodyText) {
        errorMessage = `${operation} failed: ${bodyText.substring(0, 200)}`;
      }
    } catch (parseError) {
      // If response body reading fails, use status text
      console.error(`[Cart Service] Failed to read error response:`, parseError);
      errorMessage = `${operation} failed: ${response.statusText}`;
    }

    console.error(`[Cart Service] FINAL ERROR MESSAGE: ${errorMessage}`);
    throw new Error(errorMessage);
  }

  // Parse and validate JSON response
  try {
    const data = await response.json();

    // CRITICAL FIX: Basic response structure validation
    if (data === null || data === undefined) {
      throw new Error(`${operation} returned null or undefined`);
    }

    // Validate response is an object (not a primitive)
    if (typeof data !== 'object') {
      console.warn(`[Cart Service] ${operation} returned non-object data:`, typeof data);
    }

    // Log warning if response is empty object
    if (Object.keys(data).length === 0) {
      console.warn(`[Cart Service] ${operation} returned empty object`);
    }

    // VALIDATION: Apply Zod schema validation based on operation type
    // This ensures API responses match expected structure
    let validatedData = data;

    try {
      // Determine validation function based on operation type
      const operationLower = operation.toLowerCase();

      if (operationLower.includes('cart') && !operationLower.includes('complete')) {
        // Validate cart operations (create, get, update, add item, etc.)
        console.log(`[Cart Service] Validating cart response for: ${operation}`);
        validatedData = validateCartResponse(data);
      } else if (operationLower.includes('order') || operationLower.includes('get order')) {
        // Validate order operations
        console.log(`[Cart Service] Validating order response for: ${operation}`);
        validatedData = validateOrderResponse(data);
      } else if (operationLower.includes('complete')) {
        // Validate cart completion response (returns order or cart)
        console.log(`[Cart Service] Validating cart completion response for: ${operation}`);
        validatedData = validateCartCompletionResponse(data);
      } else if (operationLower.includes('payment collection')) {
        // Validate payment collection response
        console.log(`[Cart Service] Validating payment collection response for: ${operation}`);
        validatedData = validatePaymentCollectionResponse(data);
      }

      // If validation was applied and succeeded, log success
      if (validatedData !== data) {
        console.log(`[Cart Service] Response validation successful for: ${operation}`);
      }
    } catch (validationError) {
      // GRACEFUL DEGRADATION: Log validation error but use original data
      // This prevents validation from breaking existing functionality
      console.warn(
        `[Cart Service] Validation error for ${operation}, using raw data:`,
        validationError instanceof Error ? validationError.message : validationError
      );
      validatedData = data;
    }

    return validatedData;
  } catch (error) {
    console.error(`[Cart Service] Failed to parse ${operation} response:`, error);

    // Enhanced error message with more context
    const errorMsg = error instanceof Error ? error.message : 'Unknown parsing error';
    throw new Error(`Failed to parse ${operation} response: ${errorMsg}`);
  }
}

// ============================================================================
// Cart Service Functions
// ============================================================================

/**
 * Create a new cart
 *
 * Official Docs: https://docs.medusajs.com/resources/storefront-development/cart/create
 *
 * @param regionId - The ID of the region (defaults to Australia region)
 * @returns The created cart object
 *
 * @example
 * const cart = await createCart();
 * console.log('Cart created:', cart.id);
 * localStorage.setItem('cart_id', cart.id);
 */
export async function createCart(regionId: string = DEFAULT_REGION_ID): Promise<MedusaCart> {
  try {
    console.log(`[Cart Service] Creating cart for region: ${regionId}`);

    const response = await fetchWithTimeout(
      `${STORE_API_URL}/carts`,
      {
        method: 'POST',
        headers: buildHeaders(),
        body: JSON.stringify({
          region_id: regionId,
        }),
      }
    );

    const data = await handleResponse<{ cart: MedusaCart }>(response, 'Create cart');

    console.log(`[Cart Service] Cart created successfully: ${data.cart.id}`);
    return data.cart;
  } catch (error) {
    console.error('[Cart Service] Error creating cart:', error);
    throw error;
  }
}

/**
 * Get cart by ID
 *
 * Official Docs: https://docs.medusajs.com/resources/storefront-development/cart/retrieve
 *
 * @param cartId - The ID of the cart
 * @returns The cart object
 *
 * @example
 * const cart = await getCart('cart_01ABC123');
 * console.log('Cart items:', cart.items);
 */
export async function getCart(
  cartId: string,
  fields?: string[]
): Promise<MedusaCart> {
  try {
    console.log(`[Cart Service] ========================================`);
    console.log(`[Cart Service] RETRIEVING CART: ${cartId}`);

    // Build query string with fields parameter for complete cart data
    // CRITICAL FIX: Use Medusa v2 field expansion syntax
    // The '+' operator adds fields to defaults instead of replacing them
    // Format: '+relation.*' retrieves all properties of a relation
    // Reference: https://docs.medusajs.com/learn/advanced-development/api-routes/parameters
    const defaultFields = [
      '+items.*',              // Expand all item properties
      '+items.variant.*',      // Expand item variant details
      '+items.product.*',      // Expand product information
      '+shipping_methods.*',   // Expand shipping method details
      '+shipping_address.*',   // Expand shipping address
      '+billing_address.*',    // Expand billing address
      '+payment_collection.*', // Expand payment collection (Medusa v2 only - no payment_sessions)
      '+region.*',             // Expand region details
    ];

    const fieldsToFetch = fields || defaultFields;
    const queryParams = new URLSearchParams();

    if (fieldsToFetch.length > 0) {
      queryParams.append('fields', fieldsToFetch.join(','));
    }

    const queryString = queryParams.toString();
    const url = `${STORE_API_URL}/carts/${cartId}${queryString ? `?${queryString}` : ''}`;

    // DEBUGGING: Log request details
    console.log(`[Cart Service] REQUEST DETAILS:`);
    console.log(`[Cart Service] - Base URL: ${STORE_API_URL}`);
    console.log(`[Cart Service] - Cart ID: ${cartId}`);
    console.log(`[Cart Service] - Fields count: ${fieldsToFetch.length}`);
    console.log(`[Cart Service] - Query string length: ${queryString.length} chars`);
    console.log(`[Cart Service] - Full URL: ${url}`);
    console.log(`[Cart Service] - URL length: ${url.length} chars`);
    console.log(`[Cart Service] - Fields requested:`, fieldsToFetch);
    console.log(`[Cart Service] ========================================`);

    const response = await fetchWithTimeout(
      url,
      {
        method: 'GET',
        headers: buildHeaders(),
      }
    );

    // CRITICAL FIX: Check for 404 specifically to enable stale cart recovery
    if (!response.ok && response.status === 404) {
      const error = new Error(`Cart not found: ${cartId}`) as Error & { status: number; code: string };
      error.status = 404;
      error.code = 'CART_NOT_FOUND';
      console.warn(`[Cart Service] Cart ${cartId} not found (404) - may be completed, deleted, or expired`);
      throw error;
    }

    const data = await handleResponse<{ cart: MedusaCart }>(response, 'Get cart');

    console.log(`[Cart Service] Cart retrieved successfully: ${data.cart.id} with ${data.cart.items?.length || 0} items`);
    return data.cart;
  } catch (error) {
    console.error('[Cart Service] ========================================');
    console.error('[Cart Service] ERROR GETTING CART');
    console.error('[Cart Service] Cart ID:', cartId);
    console.error('[Cart Service] Error:', error);
    console.error('[Cart Service] ========================================');
    throw error;
  }
}

/**
 * Add line item to cart
 *
 * Official Docs: https://docs.medusajs.com/resources/storefront-development/cart/manage-items
 *
 * @param cartId - The ID of the cart
 * @param variantId - The ID of the product variant to add
 * @param quantity - The quantity to add (default: 1)
 * @param metadata - Optional metadata for the line item
 * @returns The updated cart object
 *
 * @example
 * const cart = await addLineItem('cart_01ABC123', 'variant_01XYZ789', 2);
 * console.log('Item added, cart total:', cart.total);
 */
export async function addLineItem(
  cartId: string,
  variantId: string,
  quantity: number = 1,
  metadata?: Record<string, any>
): Promise<MedusaCart> {
  try {
    // COMPREHENSIVE LOGGING FOR DEBUGGING
    console.log(`[Cart Service] Adding line item to cart ${cartId}:`, {
      variantId,
      variantIdType: typeof variantId,
      variantIdEmpty: !variantId,
      variantIdValue: variantId,
      quantity,
      hasMetadata: !!metadata,
      metadataType: metadata?.type
    });

    // VALIDATION: Ensure variant_id is provided
    if (!variantId || variantId === '' || variantId === 'undefined' || variantId === 'null') {
      const errorMsg = `Invalid variant_id: "${variantId}". Cannot add line item without valid variant_id.`;
      console.error('[Cart Service] ' + errorMsg);
      throw new Error(errorMsg);
    }

    const requestBody: any = {
      variant_id: variantId,
      quantity,
    };

    if (metadata) {
      requestBody.metadata = metadata;
    }

    console.log('[Cart Service] Request body:', JSON.stringify(requestBody, null, 2));

    const response = await fetchWithTimeout(
      `${STORE_API_URL}/carts/${cartId}/line-items`,
      {
        method: 'POST',
        headers: buildHeaders(),
        body: JSON.stringify(requestBody),
      }
    );

    const data = await handleResponse<{ cart: MedusaCart }>(response, 'Add line item');

    console.log(`[Cart Service] Line item added successfully. Cart now has ${data.cart.items?.length || 0} items`);
    return data.cart;
  } catch (error) {
    console.error('[Cart Service] Error adding line item:', error);
    throw error;
  }
}

/**
 * Update line item quantity
 *
 * Official Docs: https://docs.medusajs.com/resources/storefront-development/cart/manage-items
 *
 * @param cartId - The ID of the cart
 * @param lineItemId - The ID of the line item to update
 * @param quantity - The new quantity
 * @returns The updated cart object
 *
 * @example
 * const cart = await updateLineItem('cart_01ABC123', 'item_01DEF456', 3);
 * console.log('Item quantity updated');
 */
export async function updateLineItem(
  cartId: string,
  lineItemId: string,
  quantity: number
): Promise<MedusaCart> {
  try {
    console.log(`[Cart Service] Updating line item ${lineItemId} in cart ${cartId}: quantity=${quantity}`);

    const response = await fetchWithTimeout(
      `${STORE_API_URL}/carts/${cartId}/line-items/${lineItemId}`,
      {
        method: 'POST',
        headers: buildHeaders(),
        body: JSON.stringify({
          quantity,
        }),
      }
    );

    const data = await handleResponse<{ cart: MedusaCart }>(response, 'Update line item');

    console.log(`[Cart Service] Line item updated successfully`);
    return data.cart;
  } catch (error) {
    console.error('[Cart Service] Error updating line item:', error);
    throw error;
  }
}

/**
 * Remove line item from cart
 *
 * Official Docs: https://docs.medusajs.com/resources/storefront-development/cart/manage-items
 *
 * @param cartId - The ID of the cart
 * @param lineItemId - The ID of the line item to remove
 * @returns The updated cart object
 *
 * @example
 * const cart = await removeLineItem('cart_01ABC123', 'item_01DEF456');
 * console.log('Item removed from cart');
 */
export async function removeLineItem(
  cartId: string,
  lineItemId: string
): Promise<MedusaCart> {
  try {
    console.log(`[Cart Service] Removing line item ${lineItemId} from cart ${cartId}`);

    const response = await fetchWithTimeout(
      `${STORE_API_URL}/carts/${cartId}/line-items/${lineItemId}`,
      {
        method: 'DELETE',
        headers: buildHeaders(),
      }
    );

    const data = await handleResponse<{ cart: MedusaCart }>(response, 'Remove line item');

    console.log(`[Cart Service] Line item removed successfully`);
    return data.cart;
  } catch (error) {
    console.error('[Cart Service] Error removing line item:', error);
    throw error;
  }
}

/**
 * Set email on cart
 *
 * @param cartId - The ID of the cart
 * @param email - The customer's email address
 * @returns The updated cart object
 *
 * @example
 * const cart = await setCartEmail('cart_01ABC123', 'customer@example.com');
 */
export async function setCartEmail(cartId: string, email: string): Promise<MedusaCart> {
  try {
    console.log(`[Cart Service] Setting email for cart ${cartId}`);

    const response = await fetchWithTimeout(
      `${STORE_API_URL}/carts/${cartId}`,
      {
        method: 'POST',
        headers: buildHeaders(),
        body: JSON.stringify({
          email,
        }),
      }
    );

    const data = await handleResponse<{ cart: MedusaCart }>(response, 'Set email');

    console.log(`[Cart Service] Email set successfully`);
    return data.cart;
  } catch (error) {
    console.error('[Cart Service] Error setting email:', error);
    throw error;
  }
}

/**
 * Set shipping address on cart
 *
 * Official Docs: https://docs.medusajs.com/resources/storefront-development/checkout/address
 *
 * @param cartId - The ID of the cart
 * @param address - The shipping address
 * @returns The updated cart object
 *
 * @example
 * const cart = await setShippingAddress('cart_01ABC123', {
 *   first_name: 'John',
 *   last_name: 'Doe',
 *   address_1: '123 Main St',
 *   city: 'Sunshine Coast',
 *   province: 'QLD',
 *   postal_code: '4556',
 *   country_code: 'au',
 *   phone: '+61400000000'
 * });
 */
export async function setShippingAddress(
  cartId: string,
  address: AddressPayload
): Promise<MedusaCart> {
  try {
    console.log(`[Cart Service] Setting shipping address for cart ${cartId}`);

    const response = await fetchWithTimeout(
      `${STORE_API_URL}/carts/${cartId}`,
      {
        method: 'POST',
        headers: buildHeaders(),
        body: JSON.stringify({
          shipping_address: address,
        }),
      }
    );

    const data = await handleResponse<{ cart: MedusaCart }>(response, 'Set shipping address');

    console.log(`[Cart Service] Shipping address set successfully`);
    return data.cart;
  } catch (error) {
    console.error('[Cart Service] Error setting shipping address:', error);
    throw error;
  }
}

/**
 * Set billing address on cart
 *
 * Official Docs: https://docs.medusajs.com/resources/storefront-development/checkout/address
 *
 * @param cartId - The ID of the cart
 * @param address - The billing address
 * @returns The updated cart object
 *
 * @example
 * const cart = await setBillingAddress('cart_01ABC123', {
 *   first_name: 'John',
 *   last_name: 'Doe',
 *   address_1: '123 Main St',
 *   city: 'Sunshine Coast',
 *   province: 'QLD',
 *   postal_code: '4556',
 *   country_code: 'au'
 * });
 */
export async function setBillingAddress(
  cartId: string,
  address: AddressPayload
): Promise<MedusaCart> {
  try {
    console.log(`[Cart Service] Setting billing address for cart ${cartId}`);

    const response = await fetchWithTimeout(
      `${STORE_API_URL}/carts/${cartId}`,
      {
        method: 'POST',
        headers: buildHeaders(),
        body: JSON.stringify({
          billing_address: address,
        }),
      }
    );

    const data = await handleResponse<{ cart: MedusaCart }>(response, 'Set billing address');

    console.log(`[Cart Service] Billing address set successfully`);
    return data.cart;
  } catch (error) {
    console.error('[Cart Service] Error setting billing address:', error);
    throw error;
  }
}

/**
 * Update multiple cart fields in a single request
 *
 * This function prevents race conditions by updating email, shipping address,
 * and billing address in a single atomic operation.
 *
 * Official Docs: https://docs.medusajs.com/resources/storefront-development/checkout
 *
 * @param cartId - The ID of the cart
 * @param updates - Object containing fields to update
 * @returns The updated cart object
 *
 * @example
 * const cart = await updateCart('cart_01ABC123', {
 *   email: 'customer@example.com',
 *   shipping_address: { first_name: 'John', last_name: 'Doe', ... },
 *   billing_address: { first_name: 'John', last_name: 'Doe', ... }
 * });
 */
export async function updateCart(
  cartId: string,
  updates: {
    email?: string;
    shipping_address?: AddressPayload;
    billing_address?: AddressPayload;
    metadata?: Record<string, any>;
  }
): Promise<MedusaCart> {
  try {
    console.log(`[Cart Service] Updating cart ${cartId} with fields:`, Object.keys(updates).join(', '));

    const response = await fetchWithTimeout(
      `${STORE_API_URL}/carts/${cartId}`,
      {
        method: 'POST',
        headers: buildHeaders(),
        body: JSON.stringify(updates),
      }
    );

    const data = await handleResponse<{ cart: MedusaCart }>(response, 'Update cart');

    console.log(`[Cart Service] Cart updated successfully`);
    return data.cart;
  } catch (error) {
    console.error('[Cart Service] Error updating cart:', error);
    throw error;
  }
}

/**
 * Get available shipping options for cart
 *
 * @param cartId - The ID of the cart
 * @returns Array of shipping options
 *
 * @example
 * const options = await getShippingOptions('cart_01ABC123');
 * console.log('Available shipping methods:', options);
 */
export async function getShippingOptions(cartId: string): Promise<any[]> {
  try {
    console.log(`[Cart Service] Getting shipping options for cart ${cartId}`);

    const response = await fetchWithTimeout(
      `${STORE_API_URL}/shipping-options?cart_id=${cartId}`,
      {
        method: 'GET',
        headers: buildHeaders(),
      }
    );

    const data = await handleResponse<{ shipping_options: any[] }>(response, 'Get shipping options');

    console.log(`[Cart Service] Found ${data.shipping_options.length} shipping options`);
    return data.shipping_options || [];
  } catch (error) {
    console.error('[Cart Service] Error getting shipping options:', error);
    // Return empty array instead of throwing to allow graceful degradation
    return [];
  }
}

/**
 * Add shipping method to cart
 *
 * Official Docs: https://docs.medusajs.com/resources/storefront-development/checkout/shipping
 *
 * @param cartId - The ID of the cart
 * @param shippingOptionId - The ID of the shipping option to add
 * @returns The updated cart object
 *
 * @example
 * const cart = await addShippingMethod('cart_01ABC123', 'so_01GHI789');
 * console.log('Shipping method added');
 */
export async function addShippingMethod(
  cartId: string,
  shippingOptionId: string
): Promise<MedusaCart> {
  try {
    console.log(`[Cart Service] Adding shipping method to cart ${cartId}: option=${shippingOptionId}`);

    const response = await fetchWithTimeout(
      `${STORE_API_URL}/carts/${cartId}/shipping-methods`,
      {
        method: 'POST',
        headers: buildHeaders(),
        body: JSON.stringify({
          option_id: shippingOptionId,
        }),
      }
    );

    const data = await handleResponse<{ cart: MedusaCart }>(response, 'Add shipping method');

    console.log(`[Cart Service] Shipping method added successfully`);
    return data.cart;
  } catch (error) {
    console.error('[Cart Service] Error adding shipping method:', error);
    throw error;
  }
}

/**
 * Create payment collection for cart (Medusa v2)
 *
 * CRITICAL FOR MEDUSA V2: Payment collections are NOT automatically created.
 * You MUST explicitly create a payment collection via this function BEFORE
 * initializing payment sessions.
 *
 * Official Docs: https://docs.medusajs.com/resources/storefront-development/checkout/payment
 *
 * Prerequisites:
 * - Cart must have items
 * - Cart must have shipping address set
 * - Cart must have shipping method selected
 *
 * Workflow:
 * 1. Create payment collection for cart
 * 2. Initialize payment sessions on the payment collection
 * 3. Complete cart
 *
 * @param cartId - The ID of the cart
 * @returns The created payment collection object
 *
 * @example
 * // Step 1: Create payment collection
 * const paymentCollection = await createPaymentCollectionForCart('cart_01ABC123');
 * console.log('Payment collection created:', paymentCollection.id);
 *
 * // Step 2: Initialize payment sessions (done in initializePaymentSessions)
 * await initializePaymentSessions('cart_01ABC123');
 */
export async function createPaymentCollectionForCart(cartId: string): Promise<any> {
  // Wrap with retry logic for network resilience
  const result = await retryPaymentCollectionCreation(
    async () => {
      console.log(`[Cart Service] Creating payment collection for cart ${cartId}`);

      const response = await fetchWithTimeout(
        `${STORE_API_URL}/payment-collections`,
        {
          method: 'POST',
          headers: buildHeaders(),
          body: JSON.stringify({
            cart_id: cartId,
          }),
        }
      );

      const data = await handleResponse<{ payment_collection: any }>(
        response,
        'Create payment collection'
      );

      console.log(`[Cart Service] Payment collection created successfully: ${data.payment_collection.id}`);
      return data.payment_collection;
    },
    cartId
  );

  // Return the payment collection data (unwrap from retry result)
  return result.data;
}

/**
 * Initialize payment sessions (Medusa v2)
 *
 * CRITICAL FOR MEDUSA V2: This function now creates the payment collection if it
 * doesn't exist, then initializes payment sessions on that collection.
 *
 * IMPORTANT: Medusa v2 uses payment collections, not direct cart payment sessions.
 * Payment collections must be created explicitly before initializing sessions.
 *
 * Prerequisites:
 * - Cart must have items
 * - Cart must have shipping address set
 * - Cart must have shipping method selected
 *
 * New Flow (Medusa v2):
 * 1. Create payment collection for the cart
 * 2. Initialize payment session on the payment collection with provider
 * 3. Return updated cart
 *
 * @param cartId - The ID of the cart
 * @param providerId - The payment provider ID (default: 'pp_stripe_stripe')
 * @returns The updated cart object
 *
 * @example
 * const cart = await initializePaymentSessions('cart_01ABC123', 'pp_stripe_stripe');
 * console.log('Payment sessions initialized:', cart.payment_sessions);
 */
export async function initializePaymentSessions(
  cartId: string,
  providerId: string = 'pp_stripe_stripe'
): Promise<MedusaCart> {
  // Wrap with retry logic for network resilience
  const result = await retryPaymentSessionInitialization(
    async () => {
      console.log(`[Cart Service] ========================================`);
      console.log(`[Cart Service] INITIALIZING PAYMENT SESSION (MEDUSA V2)`);
      console.log(`[Cart Service] Cart ID: ${cartId}`);
      console.log(`[Cart Service] Provider: ${providerId}`);
      console.log(`[Cart Service] ========================================`);

      // STEP 0: Check if payment collection already exists (idempotency)
      console.log(`[Cart Service] Step 0: Checking for existing payment collection...`);
      const currentCart = await getCart(cartId);
      let paymentCollectionId: string;

      if (currentCart.payment_collection?.id) {
        // Payment collection already exists - reuse it
        paymentCollectionId = currentCart.payment_collection.id;
        console.log(`[Cart Service] Payment collection already exists: ${paymentCollectionId}`);
        console.log(`[Cart Service] Skipping creation (idempotent operation)`);
      } else {
        // STEP 1: Create payment collection for the cart
        // This is REQUIRED in Medusa v2 - payment collections are NOT auto-created
        console.log(`[Cart Service] Step 1: Creating payment collection...`);
        const paymentCollection = await createPaymentCollectionForCart(cartId);
        paymentCollectionId = paymentCollection.id;
        console.log(`[Cart Service] Payment collection created: ${paymentCollectionId}`);
      }

      // STEP 2: Initialize payment session on the payment collection
      console.log(`[Cart Service] Step 2: Initializing payment session with provider ${providerId}...`);
      const response = await fetchWithTimeout(
        `${STORE_API_URL}/payment-collections/${paymentCollectionId}/payment-sessions`,
        {
          method: 'POST',
          headers: buildHeaders(),
          body: JSON.stringify({
            provider_id: providerId,
          }),
        }
      );

      const data = await handleResponse<{ payment_collection: any }>(
        response,
        'Initialize payment session'
      );

      console.log(`[Cart Service] Payment session initialized successfully on payment collection ${paymentCollectionId}`);

      // STEP 3: Return updated cart
      console.log(`[Cart Service] Step 3: Retrieving updated cart...`);
      const updatedCart = await getCart(cartId);
      console.log(`[Cart Service] ========================================`);
      console.log(`[Cart Service] PAYMENT INITIALIZATION COMPLETE`);
      console.log(`[Cart Service] Cart ready for completion`);
      console.log(`[Cart Service] ========================================`);

      return updatedCart;
    },
    cartId
  );

  // Return the cart data (unwrap from retry result)
  return result.data;
}

/**
 * Set payment session (select payment provider) - Medusa v2
 *
 * NOTE: In Medusa v2, payment sessions are created with the provider already specified.
 * This function may be redundant if initializePaymentSessions already creates the session
 * with the desired provider. Kept for backward compatibility.
 *
 * @param cartId - The ID of the cart
 * @param providerId - The ID of the payment provider to use
 * @returns The updated cart object
 *
 * @example
 * const cart = await setPaymentSession('cart_01ABC123', 'pp_stripe_stripe');
 */
export async function setPaymentSession(
  cartId: string,
  providerId: string
): Promise<MedusaCart> {
  try {
    console.log(`[Cart Service] Setting payment session for cart ${cartId}: provider=${providerId}`);

    // Get cart to find payment collection
    const cart = await getCart(cartId);

    if (!(cart as any).payment_collection?.id) {
      throw new Error('No payment collection found on cart. Initialize payment first.');
    }

    // In v2, we select the payment session by making it active
    // The endpoint structure may be different - this might need adjustment
    const response = await fetchWithTimeout(
      `${STORE_API_URL}/carts/${cartId}/payment-session`,
      {
        method: 'POST',
        headers: buildHeaders(),
        body: JSON.stringify({
          provider_id: providerId,
        }),
      }
    );

    const data = await handleResponse<{ cart: MedusaCart }>(response, 'Set payment session');

    console.log(`[Cart Service] Payment session set successfully`);
    return data.cart;
  } catch (error) {
    console.error('[Cart Service] Error setting payment session:', error);
    // If this endpoint doesn't exist in v2, we can skip it since the session
    // is already created with the provider in initializePaymentSessions
    console.warn('[Cart Service] Set payment session may not be required in Medusa v2');
    // Return current cart instead of throwing
    return await getCart(cartId);
  }
}

/**
 * Complete cart and create order
 *
 * This is the final step in the checkout process.
 * Official Docs: https://docs.medusajs.com/resources/storefront-development/checkout/complete-cart
 *
 * @param cartId - The ID of the cart to complete
 * @returns The created order object
 *
 * @example
 * const order = await completeCart('cart_01ABC123');
 * console.log('Order created:', order.id);
 *
 * @throws {Error} If cart completion fails or returns a cart instead of order
 */
export async function completeCart(cartId: string): Promise<MedusaOrder> {
  // Wrap with retry logic for network resilience
  const result = await retryCartCompletion(
    async () => {
      console.log(`[Cart Service] ========================================`);
      console.log(`[Cart Service] COMPLETING CART`);
      console.log(`[Cart Service] Cart ID: ${cartId}`);
      console.log(`[Cart Service] ========================================`);

      // Log cart state before completion
      try {
        const cartBeforeCompletion = await getCart(cartId);
        console.log(`[Cart Service] Cart state before completion:`, {
          id: cartBeforeCompletion.id,
          email: cartBeforeCompletion.email,
          items: cartBeforeCompletion.items?.length || 0,
          hasShippingAddress: !!cartBeforeCompletion.shipping_address,
          hasBillingAddress: !!cartBeforeCompletion.billing_address,
          shippingMethods: cartBeforeCompletion.shipping_methods?.length || 0,
          paymentSessions: cartBeforeCompletion.payment_sessions?.length || 0,
          paymentSession: !!cartBeforeCompletion.payment_session,
          subtotal: cartBeforeCompletion.subtotal,
          total: cartBeforeCompletion.total,
          metadata: cartBeforeCompletion.metadata
        });
      } catch (stateError) {
        console.warn('[Cart Service] Could not retrieve cart state before completion:', stateError);
      }

      const response = await fetchWithTimeout(
        `${STORE_API_URL}/carts/${cartId}/complete`,
        {
          method: 'POST',
          headers: buildHeaders(),
        }
      );

      const data = await handleResponse<CartCompletionResponse>(response, 'Complete cart');

      console.log(`[Cart Service] Cart completion response:`, {
        type: data.type,
        hasOrder: !!data.order,
        hasCart: !!data.cart,
        hasError: !!data.error,
        orderIdIfPresent: data.order?.id || 'N/A',
        responseKeys: Object.keys(data)
      });

      // Medusa v2 returns { type: "order", order: {...} } on success
      if (data.type === 'order' && data.order) {
        console.log(`[Cart Service] ========================================`);
        console.log(`[Cart Service] CART COMPLETED SUCCESSFULLY`);
        console.log(`[Cart Service] Order ID: ${data.order.id}`);
        console.log(`[Cart Service] Order Status: ${data.order.status || 'N/A'}`);
        console.log(`[Cart Service] Order Total: ${data.order.total || 'N/A'}`);
        console.log(`[Cart Service] ========================================`);
        return data.order;
      }

      // Handle cart response (completion failed or still in progress)
      if (data.type === 'cart') {
        const errorMsg = data.error || 'Cart completion returned a cart instead of an order. This usually means payment authorization failed or the cart is not ready for completion.';
        console.error(`[Cart Service] ========================================`);
        console.error(`[Cart Service] CART COMPLETION FAILED - RETURNED CART`);
        console.error(`[Cart Service] Error: ${errorMsg}`);
        console.error(`[Cart Service] Cart ID: ${data.cart?.id || 'N/A'}`);
        console.error(`[Cart Service] ========================================`);
        throw new Error(`Cart completion failed: ${errorMsg}`);
      }

      // Handle unexpected response (no order object in success response)
      if (data.type === 'order' && !data.order) {
        const errorMsg = 'Cart completion response indicated success (type: "order") but no order object was returned';
        console.error(`[Cart Service] ========================================`);
        console.error(`[Cart Service] CART COMPLETION FAILED - MALFORMED RESPONSE`);
        console.error(`[Cart Service] Error: ${errorMsg}`);
        console.error(`[Cart Service] Response structure:`, JSON.stringify(data, null, 2));
        console.error(`[Cart Service] ========================================`);
        throw new Error(`Cart completion failed: ${errorMsg}`);
      }

      // Fallback error for any other unexpected response
      const errorMsg = data.error || 'Unknown error during cart completion';
      console.error(`[Cart Service] ========================================`);
      console.error(`[Cart Service] CART COMPLETION FAILED - UNEXPECTED RESPONSE`);
      console.error(`[Cart Service] Error: ${errorMsg}`);
      console.error(`[Cart Service] Response type: ${data.type}`);
      console.error(`[Cart Service] Full response:`, JSON.stringify(data, null, 2));
      console.error(`[Cart Service] ========================================`);
      throw new Error(`Cart completion failed: ${errorMsg}`);
    },
    cartId
  );

  // Return the order data (unwrap from retry result)
  return result.data;
}

/**
 * Get order by ID
 *
 * @param orderId - The ID of the order
 * @returns The order object
 *
 * @example
 * const order = await getOrder('order_01ABC123');
 * console.log('Order details:', order);
 */
export async function getOrder(orderId: string): Promise<MedusaOrder> {
  try {
    console.log(`[Cart Service] Retrieving order: ${orderId}`);

    const response = await fetchWithTimeout(
      `${STORE_API_URL}/orders/${orderId}`,
      {
        method: 'GET',
        headers: buildHeaders(),
      }
    );

    const data = await handleResponse<{ order: MedusaOrder }>(response, 'Get order');

    console.log(`[Cart Service] Order retrieved: ${data.order.id}`);
    return data.order;
  } catch (error) {
    console.error('[Cart Service] Error getting order:', error);
    throw error;
  }
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Calculate cart totals (helper for client-side display)
 *
 * @param cart - The cart object
 * @returns Object with calculated totals
 */
export function calculateCartTotals(cart: MedusaCart) {
  return {
    subtotal: cart.subtotal || 0,
    shipping: cart.shipping_total || 0,
    tax: cart.tax_total || 0,
    discount: cart.discount_total || 0,
    total: cart.total || 0,
    itemCount: cart.items?.reduce((sum, item) => sum + item.quantity, 0) || 0,
  };
}

/**
 * Format price for display (cents to dollars)
 *
 * @param amountInCents - Amount in cents
 * @param currencyCode - Currency code (default: AUD)
 * @returns Formatted price string
 */
export function formatPrice(amountInCents: number, currencyCode: string = 'AUD'): string {
  const amount = amountInCents / 100;
  return new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency: currencyCode,
  }).format(amount);
}

/**
 * Validate cart is ready for checkout
 *
 * @param cart - The cart object to validate
 * @returns Validation result with errors if any
 */
export function validateCartForCheckout(cart: MedusaCart): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!cart.items || cart.items.length === 0) {
    errors.push('Cart is empty');
  }

  if (!cart.email) {
    errors.push('Email is required');
  }

  if (!cart.shipping_address) {
    errors.push('Shipping address is required');
  }

  if (!cart.billing_address) {
    errors.push('Billing address is required');
  }

  if (!cart.shipping_methods || cart.shipping_methods.length === 0) {
    errors.push('Shipping method is required');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Update cart metadata
 *
 * @param cartId - The ID of the cart
 * @param metadata - Metadata to add/update
 * @returns The updated cart object
 */
export async function updateCartMetadata(
  cartId: string,
  metadata: Record<string, any>
): Promise<MedusaCart> {
  try {
    console.log(`[Cart Service] Updating metadata for cart ${cartId}`);

    const response = await fetchWithTimeout(
      `${STORE_API_URL}/carts/${cartId}`,
      {
        method: 'POST',
        headers: buildHeaders(),
        body: JSON.stringify({
          metadata,
        }),
      }
    );

    const data = await handleResponse<{ cart: MedusaCart }>(response, 'Update cart metadata');

    console.log(`[Cart Service] Cart metadata updated successfully`);
    return data.cart;
  } catch (error) {
    console.error('[Cart Service] Error updating cart metadata:', error);
    throw error;
  }
}

// ============================================================================
// Export Types
// ============================================================================

export type {
  AddressPayload,
  MedusaCart,
  MedusaOrder,
  CartLineItem,
  CartCompletionResponse,
  ServiceResponse
};
