# Cart Service - Medusa Store API Integration

## Overview

The Cart Service (`cart-service.ts`) is a comprehensive TypeScript service that integrates with the Medusa Store API to handle all cart and checkout operations for the Sunshine Coast 4WD Tours application.

## Features

- **Full Cart Lifecycle Management**: Create, retrieve, update, and complete carts
- **Line Item Operations**: Add, update, and remove products from cart
- **Address Management**: Set shipping and billing addresses
- **Shipping Options**: List and add shipping methods
- **Payment Integration**: Initialize and manage payment sessions
- **Order Management**: Complete carts and retrieve orders
- **Error Handling**: Comprehensive error handling with meaningful messages
- **TypeScript Types**: Fully typed interfaces for all operations
- **Timeout Protection**: Built-in request timeouts to prevent hanging
- **Utility Functions**: Helper functions for calculations and validation

## Official Documentation

This service follows official Medusa v2 patterns from:
- Store API: https://docs.medusajs.com/api/store
- Cart Management: https://docs.medusajs.com/resources/storefront-development/cart
- Checkout Flow: https://docs.medusajs.com/resources/storefront-development/checkout

## Configuration

### Environment Variables

```env
NEXT_PUBLIC_MEDUSA_BACKEND_URL=http://localhost:9000
NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY=your_publishable_key
```

### Constants

```typescript
const API_TIMEOUT = 10000; // 10 seconds
const DEFAULT_REGION_ID = 'reg_01K9G4HA190556136E7RJQ4411'; // Australia region
```

## Core Functions

### 1. Cart Management

#### createCart(regionId?: string)
Creates a new cart for the specified region.

```typescript
const cart = await createCart();
console.log('Cart created:', cart.id);
localStorage.setItem('cart_id', cart.id);
```

#### getCart(cartId: string)
Retrieves an existing cart by ID.

```typescript
const cart = await getCart('cart_01ABC123');
console.log('Cart items:', cart.items);
```

### 2. Line Item Operations

#### addLineItem(cartId, variantId, quantity, metadata?)
Adds a product variant to the cart.

```typescript
const cart = await addLineItem('cart_01ABC123', 'variant_01XYZ789', 2);
console.log('Item added, cart total:', cart.total);
```

#### updateLineItem(cartId, lineItemId, quantity)
Updates the quantity of an existing line item.

```typescript
const cart = await updateLineItem('cart_01ABC123', 'item_01DEF456', 3);
console.log('Item quantity updated');
```

#### removeLineItem(cartId, lineItemId)
Removes a line item from the cart.

```typescript
const cart = await removeLineItem('cart_01ABC123', 'item_01DEF456');
console.log('Item removed from cart');
```

### 3. Customer Information

#### setCartEmail(cartId, email)
Sets the customer's email on the cart.

```typescript
const cart = await setCartEmail('cart_01ABC123', 'customer@example.com');
```

#### setShippingAddress(cartId, address)
Sets the shipping address on the cart.

```typescript
const cart = await setShippingAddress('cart_01ABC123', {
  first_name: 'John',
  last_name: 'Doe',
  address_1: '123 Main St',
  city: 'Sunshine Coast',
  province: 'QLD',
  postal_code: '4556',
  country_code: 'au',
  phone: '+61400000000'
});
```

#### setBillingAddress(cartId, address)
Sets the billing address on the cart.

```typescript
const cart = await setBillingAddress('cart_01ABC123', {
  first_name: 'John',
  last_name: 'Doe',
  address_1: '123 Main St',
  city: 'Sunshine Coast',
  province: 'QLD',
  postal_code: '4556',
  country_code: 'au'
});
```

### 4. Shipping

#### getShippingOptions(cartId)
Lists available shipping options for the cart.

```typescript
const options = await getShippingOptions('cart_01ABC123');
console.log('Available shipping methods:', options);
```

#### addShippingMethod(cartId, shippingOptionId)
Adds a shipping method to the cart.

```typescript
const cart = await addShippingMethod('cart_01ABC123', 'so_01GHI789');
console.log('Shipping method added');
```

### 5. Payment

#### initializePaymentSessions(cartId)
Initializes payment sessions for available payment providers.

```typescript
const cart = await initializePaymentSessions('cart_01ABC123');
console.log('Payment sessions:', cart.payment_sessions);
```

#### setPaymentSession(cartId, providerId)
Selects a payment provider for the cart.

```typescript
const cart = await setPaymentSession('cart_01ABC123', 'manual');
console.log('Payment provider selected');
```

### 6. Cart Completion

#### completeCart(cartId)
Completes the cart and creates an order (final checkout step).

```typescript
const order = await completeCart('cart_01ABC123');
console.log('Order created:', order.id);
```

#### getOrder(orderId)
Retrieves an order by ID.

```typescript
const order = await getOrder('order_01ABC123');
console.log('Order details:', order);
```

### 7. Utility Functions

#### calculateCartTotals(cart)
Calculates cart totals for display.

```typescript
const totals = calculateCartTotals(cart);
console.log('Subtotal:', totals.subtotal);
console.log('Tax:', totals.tax);
console.log('Total:', totals.total);
```

#### formatPrice(amountInCents, currencyCode?)
Formats a price for display.

```typescript
const formatted = formatPrice(15000, 'AUD'); // $150.00
```

#### validateCartForCheckout(cart)
Validates that a cart is ready for checkout.

```typescript
const validation = validateCartForCheckout(cart);
if (!validation.valid) {
  console.error('Cart validation errors:', validation.errors);
}
```

#### updateCartMetadata(cartId, metadata)
Updates cart metadata.

```typescript
const cart = await updateCartMetadata('cart_01ABC123', {
  tour_date: '2025-12-25',
  special_requests: 'Vegetarian meals'
});
```

## TypeScript Types

### AddressPayload
```typescript
interface AddressPayload {
  first_name: string;
  last_name: string;
  address_1: string;
  address_2?: string;
  city: string;
  country_code: string; // ISO 2-letter code
  province?: string;
  postal_code: string;
  phone?: string;
  company?: string;
  metadata?: Record<string, any>;
}
```

### CartLineItem
```typescript
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
```

### MedusaCart
```typescript
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
```

### MedusaOrder
```typescript
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
```

## Complete Checkout Flow

Here's a typical checkout flow using the cart service:

```typescript
// 1. Create a cart
const cart = await createCart();
localStorage.setItem('cart_id', cart.id);

// 2. Add items to cart
await addLineItem(cart.id, 'variant_01ABC', 2);
await addLineItem(cart.id, 'variant_02XYZ', 1);

// 3. Set customer email
await setCartEmail(cart.id, 'customer@example.com');

// 4. Set shipping address
await setShippingAddress(cart.id, {
  first_name: 'John',
  last_name: 'Doe',
  address_1: '123 Main St',
  city: 'Sunshine Coast',
  province: 'QLD',
  postal_code: '4556',
  country_code: 'au',
  phone: '+61400000000'
});

// 5. Set billing address (can be same as shipping)
await setBillingAddress(cart.id, {
  first_name: 'John',
  last_name: 'Doe',
  address_1: '123 Main St',
  city: 'Sunshine Coast',
  province: 'QLD',
  postal_code: '4556',
  country_code: 'au'
});

// 6. Get and select shipping method
const shippingOptions = await getShippingOptions(cart.id);
await addShippingMethod(cart.id, shippingOptions[0].id);

// 7. Initialize payment
await initializePaymentSessions(cart.id);
await setPaymentSession(cart.id, 'manual');

// 8. Validate cart before completion
const validation = validateCartForCheckout(cart);
if (!validation.valid) {
  throw new Error(validation.errors.join(', '));
}

// 9. Complete cart and create order
const order = await completeCart(cart.id);
console.log('Order placed successfully:', order.id);

// 10. Clean up
localStorage.removeItem('cart_id');
```

## Error Handling

All functions include comprehensive error handling:

```typescript
try {
  const cart = await createCart();
  console.log('Success:', cart.id);
} catch (error) {
  console.error('Failed to create cart:', error);
  // Handle error appropriately
}
```

Errors include:
- Network errors
- API errors (with status codes)
- Timeout errors
- Validation errors

## Best Practices

1. **Store cart ID**: Always store the cart ID in localStorage for persistence
2. **Validate before completion**: Use `validateCartForCheckout()` before calling `completeCart()`
3. **Handle errors gracefully**: Wrap all calls in try-catch blocks
4. **Check cart state**: Always retrieve the latest cart state after operations
5. **Clean up**: Remove cart ID from storage after successful order creation

## Integration with Medusa Backend

This service requires:
- Medusa v2 backend running on `http://localhost:9000` (or custom URL)
- Publishable API key configured
- Australia region configured with ID `reg_01K9G4HA190556136E7RJQ4411`

## Performance

- Request timeout: 10 seconds
- All requests include abort controller for timeout protection
- Logging enabled for debugging
- TypeScript compilation: No errors

## Testing

Example test scenarios:
- Create and retrieve cart
- Add/update/remove items
- Set addresses
- Complete checkout flow
- Error handling

## Future Enhancements

Potential improvements:
- Retry logic for failed requests
- Optimistic updates
- Cart caching
- Offline support
- Analytics integration

## License

Part of Sunshine Coast 4WD Tours application.

---

**Last Updated**: 2025-11-08
**Version**: 1.0.0
**Medusa Version**: v2
