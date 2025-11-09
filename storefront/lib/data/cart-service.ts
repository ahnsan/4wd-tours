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
 */

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
 * Can be either a cart (on error) or an order (on success)
 */
interface CartCompletionResponse {
  type: 'cart' | 'order';
  data: MedusaCart | MedusaOrder;
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
 * Handle API response and extract data
 */
async function handleResponse<T>(response: Response, operation: string): Promise<T> {
  if (!response.ok) {
    let errorMessage = `${operation} failed with status ${response.status}`;

    try {
      const errorData = await response.json();
      if (errorData.message) {
        errorMessage = `${operation} failed: ${errorData.message}`;
      }
    } catch {
      // If response is not JSON, use status text
      errorMessage = `${operation} failed: ${response.statusText}`;
    }

    console.error(`[Cart Service] ${errorMessage}`);
    throw new Error(errorMessage);
  }

  try {
    return await response.json();
  } catch (error) {
    console.error(`[Cart Service] Failed to parse ${operation} response:`, error);
    throw new Error(`Failed to parse ${operation} response`);
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
export async function getCart(cartId: string): Promise<MedusaCart> {
  try {
    console.log(`[Cart Service] Retrieving cart: ${cartId}`);

    const response = await fetchWithTimeout(
      `${STORE_API_URL}/carts/${cartId}`,
      {
        method: 'GET',
        headers: buildHeaders(),
      }
    );

    const data = await handleResponse<{ cart: MedusaCart }>(response, 'Get cart');

    console.log(`[Cart Service] Cart retrieved: ${data.cart.id} with ${data.cart.items?.length || 0} items`);
    return data.cart;
  } catch (error) {
    console.error('[Cart Service] Error getting cart:', error);
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
    console.log(`[Cart Service] Adding line item to cart ${cartId}: variant=${variantId}, quantity=${quantity}`);

    const requestBody: any = {
      variant_id: variantId,
      quantity,
    };

    if (metadata) {
      requestBody.metadata = metadata;
    }

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
 * Initialize payment sessions (if using payment provider)
 *
 * Official Docs: https://docs.medusajs.com/resources/storefront-development/checkout/payment
 *
 * @param cartId - The ID of the cart
 * @returns The updated cart object with payment sessions
 *
 * @example
 * const cart = await initializePaymentSessions('cart_01ABC123');
 * console.log('Payment sessions:', cart.payment_sessions);
 */
export async function initializePaymentSessions(cartId: string): Promise<MedusaCart> {
  try {
    console.log(`[Cart Service] Initializing payment sessions for cart ${cartId}`);

    const response = await fetchWithTimeout(
      `${STORE_API_URL}/carts/${cartId}/payment-sessions`,
      {
        method: 'POST',
        headers: buildHeaders(),
      }
    );

    const data = await handleResponse<{ cart: MedusaCart }>(response, 'Initialize payment sessions');

    console.log(`[Cart Service] Payment sessions initialized successfully`);
    return data.cart;
  } catch (error) {
    console.error('[Cart Service] Error initializing payment sessions:', error);
    throw error;
  }
}

/**
 * Set payment session (select payment provider)
 *
 * Official Docs: https://docs.medusajs.com/resources/storefront-development/checkout/payment
 *
 * @param cartId - The ID of the cart
 * @param providerId - The ID of the payment provider to use
 * @returns The updated cart object
 *
 * @example
 * const cart = await setPaymentSession('cart_01ABC123', 'manual');
 * console.log('Payment provider selected');
 */
export async function setPaymentSession(
  cartId: string,
  providerId: string
): Promise<MedusaCart> {
  try {
    console.log(`[Cart Service] Setting payment session for cart ${cartId}: provider=${providerId}`);

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
    throw error;
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
  try {
    console.log(`[Cart Service] Completing cart ${cartId}`);

    const response = await fetchWithTimeout(
      `${STORE_API_URL}/carts/${cartId}/complete`,
      {
        method: 'POST',
        headers: buildHeaders(),
      }
    );

    const data = await handleResponse<CartCompletionResponse>(response, 'Complete cart');

    if (data.type === 'order') {
      console.log(`[Cart Service] Cart completed successfully. Order created: ${(data.data as MedusaOrder).id}`);
      return data.data as MedusaOrder;
    } else {
      const errorMsg = (data as any).error || 'Cart completion did not return an order';
      console.error(`[Cart Service] Cart completion failed: ${errorMsg}`);
      throw new Error(`Cart completion failed: ${errorMsg}`);
    }
  } catch (error) {
    console.error('[Cart Service] Error completing cart:', error);
    throw error;
  }
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
