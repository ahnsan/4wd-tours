/**
 * Cart Service Unit Tests
 *
 * Tests all cart service functions with comprehensive coverage:
 * - Success scenarios
 * - Error handling
 * - Edge cases
 * - API timeout handling
 * - Response validation
 */

import {
  createCart,
  getCart,
  addLineItem,
  updateLineItem,
  removeLineItem,
  setCartEmail,
  setShippingAddress,
  setBillingAddress,
  getShippingOptions,
  addShippingMethod,
  initializePaymentSessions,
  setPaymentSession,
  completeCart,
  getOrder,
  calculateCartTotals,
  formatPrice,
  validateCartForCheckout,
  updateCartMetadata,
} from '../cart-service';

import {
  mockFetchSuccess,
  mockFetchError,
  mockFetchNetworkError,
  mockFetchTimeout,
  createMockMedusaCart,
  createMockMedusaOrder,
  createMockAddress,
  getMockFetch,
} from '../../test-utils';

describe('Cart Service', () => {
  const MEDUSA_BACKEND_URL = 'http://localhost:9000';
  const STORE_API_URL = `${MEDUSA_BACKEND_URL}/store`;

  beforeEach(() => {
    jest.clearAllMocks();
    // Suppress console logs in tests
    jest.spyOn(console, 'log').mockImplementation();
    jest.spyOn(console, 'error').mockImplementation();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  // ==========================================================================
  // createCart()
  // ==========================================================================
  describe('createCart', () => {
    it('should create a new cart successfully', async () => {
      const mockCart = createMockMedusaCart();
      mockFetchSuccess({ cart: mockCart });

      const result = await createCart();

      expect(result).toEqual(mockCart);
      expect(fetch).toHaveBeenCalledWith(
        `${STORE_API_URL}/carts`,
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
          body: expect.stringContaining('region_id'),
        })
      );
    });

    it('should create cart with custom region ID', async () => {
      const customRegionId = 'reg_custom_123';
      const mockCart = createMockMedusaCart({ region_id: customRegionId });
      mockFetchSuccess({ cart: mockCart });

      await createCart(customRegionId);

      const mockFetch = getMockFetch();
      const callBody = JSON.parse(mockFetch.mock.calls[0][1]?.body as string);
      expect(callBody.region_id).toBe(customRegionId);
    });

    it('should handle API error response', async () => {
      mockFetchError(400, 'Invalid region ID');

      await expect(createCart()).rejects.toThrow('Create cart failed');
    });

    it('should handle network error', async () => {
      mockFetchNetworkError();

      await expect(createCart()).rejects.toThrow('Network error');
    });

    it('should handle timeout', async () => {
      mockFetchTimeout();

      await expect(createCart()).rejects.toThrow('Request timeout');
    });

    it('should include API key in headers when available', async () => {
      const originalApiKey = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY;
      process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY = 'pk_test_123';

      const mockCart = createMockMedusaCart();
      mockFetchSuccess({ cart: mockCart });

      await createCart();

      expect(fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            'x-publishable-api-key': 'pk_test_123',
          }),
        })
      );

      // Restore original
      process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY = originalApiKey;
    });
  });

  // ==========================================================================
  // getCart()
  // ==========================================================================
  describe('getCart', () => {
    const cartId = 'cart_01ABC123';

    it('should retrieve cart successfully', async () => {
      const mockCart = createMockMedusaCart({ id: cartId });
      mockFetchSuccess({ cart: mockCart });

      const result = await getCart(cartId);

      expect(result).toEqual(mockCart);
      expect(fetch).toHaveBeenCalledWith(
        `${STORE_API_URL}/carts/${cartId}`,
        expect.objectContaining({
          method: 'GET',
        })
      );
    });

    it('should handle cart not found (404)', async () => {
      mockFetchError(404, 'Cart not found');

      await expect(getCart(cartId)).rejects.toThrow('Get cart failed');
    });

    it('should handle invalid cart ID format', async () => {
      mockFetchError(400, 'Invalid cart ID');

      await expect(getCart('invalid_id')).rejects.toThrow();
    });

    it('should handle network error', async () => {
      mockFetchNetworkError('Connection refused');

      await expect(getCart(cartId)).rejects.toThrow('Connection refused');
    });
  });

  // ==========================================================================
  // addLineItem()
  // ==========================================================================
  describe('addLineItem', () => {
    const cartId = 'cart_01ABC123';
    const variantId = 'variant_01XYZ789';

    it('should add line item successfully', async () => {
      const mockCart = createMockMedusaCart({
        items: [
          {
            id: 'item_01',
            cart_id: cartId,
            variant_id: variantId,
            quantity: 2,
            unit_price: 15000,
            subtotal: 30000,
            total: 30000,
          },
        ],
      });
      mockFetchSuccess({ cart: mockCart });

      const result = await addLineItem(cartId, variantId, 2);

      expect(result).toEqual(mockCart);
      expect(fetch).toHaveBeenCalledWith(
        `${STORE_API_URL}/carts/${cartId}/line-items`,
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining(variantId),
        })
      );
    });

    it('should add line item with default quantity 1', async () => {
      const mockCart = createMockMedusaCart();
      mockFetchSuccess({ cart: mockCart });

      await addLineItem(cartId, variantId);

      const mockFetch = getMockFetch();
      const callBody = JSON.parse(mockFetch.mock.calls[0][1]?.body as string);
      expect(callBody.quantity).toBe(1);
    });

    it('should add line item with metadata', async () => {
      const metadata = { tour_date: '2025-12-15', participants: 4 };
      const mockCart = createMockMedusaCart();
      mockFetchSuccess({ cart: mockCart });

      await addLineItem(cartId, variantId, 1, metadata);

      const mockFetch = getMockFetch();
      const callBody = JSON.parse(mockFetch.mock.calls[0][1]?.body as string);
      expect(callBody.metadata).toEqual(metadata);
    });

    it('should handle invalid variant ID', async () => {
      mockFetchError(404, 'Variant not found');

      await expect(addLineItem(cartId, 'invalid_variant')).rejects.toThrow();
    });

    it('should handle out of stock variant', async () => {
      mockFetchError(400, 'Variant out of stock');

      await expect(addLineItem(cartId, variantId, 100)).rejects.toThrow();
    });
  });

  // ==========================================================================
  // updateLineItem()
  // ==========================================================================
  describe('updateLineItem', () => {
    const cartId = 'cart_01ABC123';
    const lineItemId = 'item_01';

    it('should update line item quantity successfully', async () => {
      const mockCart = createMockMedusaCart();
      mockFetchSuccess({ cart: mockCart });

      const result = await updateLineItem(cartId, lineItemId, 5);

      expect(result).toEqual(mockCart);
      expect(fetch).toHaveBeenCalledWith(
        `${STORE_API_URL}/carts/${cartId}/line-items/${lineItemId}`,
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('"quantity":5'),
        })
      );
    });

    it('should handle line item not found', async () => {
      mockFetchError(404, 'Line item not found');

      await expect(updateLineItem(cartId, 'invalid_item', 1)).rejects.toThrow();
    });

    it('should handle invalid quantity (0)', async () => {
      mockFetchError(400, 'Quantity must be greater than 0');

      await expect(updateLineItem(cartId, lineItemId, 0)).rejects.toThrow();
    });
  });

  // ==========================================================================
  // removeLineItem()
  // ==========================================================================
  describe('removeLineItem', () => {
    const cartId = 'cart_01ABC123';
    const lineItemId = 'item_01';

    it('should remove line item successfully', async () => {
      const mockCart = createMockMedusaCart({ items: [] });
      mockFetchSuccess({ cart: mockCart });

      const result = await removeLineItem(cartId, lineItemId);

      expect(result).toEqual(mockCart);
      expect(fetch).toHaveBeenCalledWith(
        `${STORE_API_URL}/carts/${cartId}/line-items/${lineItemId}`,
        expect.objectContaining({
          method: 'DELETE',
        })
      );
    });

    it('should handle line item not found', async () => {
      mockFetchError(404, 'Line item not found');

      await expect(removeLineItem(cartId, 'invalid_item')).rejects.toThrow();
    });
  });

  // ==========================================================================
  // setCartEmail()
  // ==========================================================================
  describe('setCartEmail', () => {
    const cartId = 'cart_01ABC123';
    const email = 'customer@example.com';

    it('should set email successfully', async () => {
      const mockCart = createMockMedusaCart({ email });
      mockFetchSuccess({ cart: mockCart });

      const result = await setCartEmail(cartId, email);

      expect(result.email).toBe(email);
      expect(fetch).toHaveBeenCalledWith(
        `${STORE_API_URL}/carts/${cartId}`,
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining(email),
        })
      );
    });

    it('should handle invalid email format', async () => {
      mockFetchError(400, 'Invalid email format');

      await expect(setCartEmail(cartId, 'invalid-email')).rejects.toThrow();
    });
  });

  // ==========================================================================
  // setShippingAddress()
  // ==========================================================================
  describe('setShippingAddress', () => {
    const cartId = 'cart_01ABC123';
    const address = createMockAddress();

    it('should set shipping address successfully', async () => {
      const mockCart = createMockMedusaCart({ shipping_address: address });
      mockFetchSuccess({ cart: mockCart });

      const result = await setShippingAddress(cartId, address);

      expect(result.shipping_address).toEqual(address);
      expect(fetch).toHaveBeenCalledWith(
        `${STORE_API_URL}/carts/${cartId}`,
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('shipping_address'),
        })
      );
    });

    it('should handle missing required fields', async () => {
      mockFetchError(400, 'Missing required address fields');
      const incompleteAddress = { ...address, first_name: '' };

      await expect(setShippingAddress(cartId, incompleteAddress)).rejects.toThrow();
    });

    it('should handle invalid country code', async () => {
      mockFetchError(400, 'Invalid country code');
      const invalidAddress = { ...address, country_code: 'invalid' };

      await expect(setShippingAddress(cartId, invalidAddress)).rejects.toThrow();
    });
  });

  // ==========================================================================
  // setBillingAddress()
  // ==========================================================================
  describe('setBillingAddress', () => {
    const cartId = 'cart_01ABC123';
    const address = createMockAddress();

    it('should set billing address successfully', async () => {
      const mockCart = createMockMedusaCart({ billing_address: address });
      mockFetchSuccess({ cart: mockCart });

      const result = await setBillingAddress(cartId, address);

      expect(result.billing_address).toEqual(address);
      expect(fetch).toHaveBeenCalledWith(
        `${STORE_API_URL}/carts/${cartId}`,
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('billing_address'),
        })
      );
    });
  });

  // ==========================================================================
  // getShippingOptions()
  // ==========================================================================
  describe('getShippingOptions', () => {
    const cartId = 'cart_01ABC123';

    it('should get shipping options successfully', async () => {
      const mockOptions = [
        { id: 'so_01', name: 'Standard Shipping', price: 1000 },
        { id: 'so_02', name: 'Express Shipping', price: 2000 },
      ];
      mockFetchSuccess({ shipping_options: mockOptions });

      const result = await getShippingOptions(cartId);

      expect(result).toEqual(mockOptions);
      expect(fetch).toHaveBeenCalledWith(
        `${STORE_API_URL}/shipping-options?cart_id=${cartId}`,
        expect.objectContaining({
          method: 'GET',
        })
      );
    });

    it('should return empty array on error (graceful degradation)', async () => {
      mockFetchError(500, 'Server error');

      const result = await getShippingOptions(cartId);

      expect(result).toEqual([]);
    });

    it('should handle no shipping options available', async () => {
      mockFetchSuccess({ shipping_options: [] });

      const result = await getShippingOptions(cartId);

      expect(result).toEqual([]);
    });
  });

  // ==========================================================================
  // addShippingMethod()
  // ==========================================================================
  describe('addShippingMethod', () => {
    const cartId = 'cart_01ABC123';
    const shippingOptionId = 'so_01';

    it('should add shipping method successfully', async () => {
      const mockCart = createMockMedusaCart({
        shipping_methods: [{ id: 'sm_01', option_id: shippingOptionId }],
      });
      mockFetchSuccess({ cart: mockCart });

      const result = await addShippingMethod(cartId, shippingOptionId);

      expect(result.shipping_methods).toHaveLength(1);
      expect(fetch).toHaveBeenCalledWith(
        `${STORE_API_URL}/carts/${cartId}/shipping-methods`,
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining(shippingOptionId),
        })
      );
    });

    it('should handle invalid shipping option ID', async () => {
      mockFetchError(404, 'Shipping option not found');

      await expect(addShippingMethod(cartId, 'invalid_option')).rejects.toThrow();
    });
  });

  // ==========================================================================
  // initializePaymentSessions()
  // ==========================================================================
  describe('initializePaymentSessions', () => {
    const cartId = 'cart_01ABC123';

    it('should initialize payment sessions successfully', async () => {
      const mockCart = createMockMedusaCart({
        payment_sessions: [{ id: 'ps_01', provider_id: 'manual' }],
      });
      mockFetchSuccess({ cart: mockCart });

      const result = await initializePaymentSessions(cartId);

      expect(result.payment_sessions).toHaveLength(1);
      expect(fetch).toHaveBeenCalledWith(
        `${STORE_API_URL}/carts/${cartId}/payment-sessions`,
        expect.objectContaining({
          method: 'POST',
        })
      );
    });

    it('should handle cart not ready for payment', async () => {
      mockFetchError(400, 'Cart missing required information');

      await expect(initializePaymentSessions(cartId)).rejects.toThrow();
    });
  });

  // ==========================================================================
  // setPaymentSession()
  // ==========================================================================
  describe('setPaymentSession', () => {
    const cartId = 'cart_01ABC123';
    const providerId = 'manual';

    it('should set payment session successfully', async () => {
      const mockCart = createMockMedusaCart({
        payment_session: { id: 'ps_01', provider_id: providerId },
      });
      mockFetchSuccess({ cart: mockCart });

      const result = await setPaymentSession(cartId, providerId);

      expect(result.payment_session?.provider_id).toBe(providerId);
      expect(fetch).toHaveBeenCalledWith(
        `${STORE_API_URL}/carts/${cartId}/payment-session`,
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining(providerId),
        })
      );
    });

    it('should handle invalid provider ID', async () => {
      mockFetchError(404, 'Payment provider not found');

      await expect(setPaymentSession(cartId, 'invalid_provider')).rejects.toThrow();
    });
  });

  // ==========================================================================
  // completeCart()
  // ==========================================================================
  describe('completeCart', () => {
    const cartId = 'cart_01ABC123';

    it('should complete cart and create order successfully', async () => {
      const mockOrder = createMockMedusaOrder();
      mockFetchSuccess({ type: 'order', data: mockOrder });

      const result = await completeCart(cartId);

      expect(result).toEqual(mockOrder);
      expect(result.id).toBe(mockOrder.id);
      expect(fetch).toHaveBeenCalledWith(
        `${STORE_API_URL}/carts/${cartId}/complete`,
        expect.objectContaining({
          method: 'POST',
        })
      );
    });

    it('should handle incomplete cart error', async () => {
      const mockCart = createMockMedusaCart();
      mockFetchSuccess({ type: 'cart', data: mockCart });

      await expect(completeCart(cartId)).rejects.toThrow('Cart completion failed');
    });

    it('should handle payment failure', async () => {
      mockFetchError(400, 'Payment failed');

      await expect(completeCart(cartId)).rejects.toThrow();
    });

    it('should handle cart completion with error message', async () => {
      mockFetchSuccess({
        type: 'cart',
        data: createMockMedusaCart(),
        error: 'Insufficient stock',
      });

      await expect(completeCart(cartId)).rejects.toThrow('Insufficient stock');
    });
  });

  // ==========================================================================
  // getOrder()
  // ==========================================================================
  describe('getOrder', () => {
    const orderId = 'order_01XYZ789';

    it('should retrieve order successfully', async () => {
      const mockOrder = createMockMedusaOrder({ id: orderId });
      mockFetchSuccess({ order: mockOrder });

      const result = await getOrder(orderId);

      expect(result).toEqual(mockOrder);
      expect(fetch).toHaveBeenCalledWith(
        `${STORE_API_URL}/orders/${orderId}`,
        expect.objectContaining({
          method: 'GET',
        })
      );
    });

    it('should handle order not found', async () => {
      mockFetchError(404, 'Order not found');

      await expect(getOrder(orderId)).rejects.toThrow();
    });
  });

  // ==========================================================================
  // updateCartMetadata()
  // ==========================================================================
  describe('updateCartMetadata', () => {
    const cartId = 'cart_01ABC123';
    const metadata = { custom_field: 'value', tour_preferences: ['hiking', 'beach'] };

    it('should update cart metadata successfully', async () => {
      const mockCart = createMockMedusaCart({ metadata });
      mockFetchSuccess({ cart: mockCart });

      const result = await updateCartMetadata(cartId, metadata);

      expect(result.metadata).toEqual(metadata);
      expect(fetch).toHaveBeenCalledWith(
        `${STORE_API_URL}/carts/${cartId}`,
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('metadata'),
        })
      );
    });
  });

  // ==========================================================================
  // Utility Functions
  // ==========================================================================
  describe('Utility Functions', () => {
    describe('calculateCartTotals', () => {
      it('should calculate totals correctly', () => {
        const cart = createMockMedusaCart({
          subtotal: 30000,
          shipping_total: 1000,
          tax_total: 3100,
          discount_total: 500,
          total: 33600,
          items: [
            { id: 'item_01', quantity: 2 } as any,
            { id: 'item_02', quantity: 1 } as any,
          ],
        });

        const totals = calculateCartTotals(cart);

        expect(totals).toEqual({
          subtotal: 30000,
          shipping: 1000,
          tax: 3100,
          discount: 500,
          total: 33600,
          itemCount: 3,
        });
      });

      it('should handle cart with no items', () => {
        const cart = createMockMedusaCart({ items: [] });

        const totals = calculateCartTotals(cart);

        expect(totals.itemCount).toBe(0);
      });
    });

    describe('formatPrice', () => {
      it('should format price in AUD by default', () => {
        const result = formatPrice(15000);
        expect(result).toContain('150');
      });

      it('should format price with custom currency', () => {
        const result = formatPrice(20000, 'USD');
        expect(result).toContain('200');
      });

      it('should handle zero price', () => {
        const result = formatPrice(0);
        expect(result).toContain('0');
      });
    });

    describe('validateCartForCheckout', () => {
      it('should validate complete cart as valid', () => {
        const cart = createMockMedusaCart({
          items: [{ id: 'item_01' } as any],
          email: 'test@example.com',
          shipping_address: createMockAddress(),
          billing_address: createMockAddress(),
          shipping_methods: [{ id: 'sm_01' } as any],
        });

        const validation = validateCartForCheckout(cart);

        expect(validation.valid).toBe(true);
        expect(validation.errors).toEqual([]);
      });

      it('should detect empty cart', () => {
        const cart = createMockMedusaCart({ items: [] });

        const validation = validateCartForCheckout(cart);

        expect(validation.valid).toBe(false);
        expect(validation.errors).toContain('Cart is empty');
      });

      it('should detect missing email', () => {
        const cart = createMockMedusaCart({ email: undefined });

        const validation = validateCartForCheckout(cart);

        expect(validation.valid).toBe(false);
        expect(validation.errors).toContain('Email is required');
      });

      it('should detect missing shipping address', () => {
        const cart = createMockMedusaCart({ shipping_address: undefined });

        const validation = validateCartForCheckout(cart);

        expect(validation.valid).toBe(false);
        expect(validation.errors).toContain('Shipping address is required');
      });

      it('should detect missing billing address', () => {
        const cart = createMockMedusaCart({ billing_address: undefined });

        const validation = validateCartForCheckout(cart);

        expect(validation.valid).toBe(false);
        expect(validation.errors).toContain('Billing address is required');
      });

      it('should detect missing shipping method', () => {
        const cart = createMockMedusaCart({ shipping_methods: [] });

        const validation = validateCartForCheckout(cart);

        expect(validation.valid).toBe(false);
        expect(validation.errors).toContain('Shipping method is required');
      });

      it('should collect multiple validation errors', () => {
        const cart = createMockMedusaCart({
          items: [],
          email: undefined,
          shipping_address: undefined,
        });

        const validation = validateCartForCheckout(cart);

        expect(validation.valid).toBe(false);
        expect(validation.errors.length).toBeGreaterThan(1);
      });
    });
  });
});
