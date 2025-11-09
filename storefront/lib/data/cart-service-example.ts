/**
 * Cart Service Usage Examples
 *
 * This file demonstrates how to use the cart service for various scenarios.
 * DO NOT import this file in production - it's for reference only.
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
  type MedusaCart,
  type MedusaOrder,
  type AddressPayload,
} from './cart-service';

// ============================================================================
// Example 1: Simple Cart Creation and Product Addition
// ============================================================================

async function example1_CreateAndAddProducts() {
  try {
    // Create a new cart
    const cart = await createCart();
    console.log('Cart created:', cart.id);

    // Store cart ID for later use
    if (typeof window !== 'undefined') {
      localStorage.setItem('cart_id', cart.id);
    }

    // Add a tour to the cart (using variant ID)
    const tourVariantId = 'variant_01TOUR123';
    const updatedCart = await addLineItem(cart.id, tourVariantId, 2, {
      tour_date: '2025-12-25',
      participants: 2,
    });

    console.log('Tour added to cart:', updatedCart.items);

    // Add an add-on to the cart
    const addonVariantId = 'variant_01ADDON456';
    const finalCart = await addLineItem(updatedCart.id, addonVariantId, 1);

    console.log('Cart now has', finalCart.items.length, 'items');

    return finalCart;
  } catch (error) {
    console.error('Error in example 1:', error);
    throw error;
  }
}

// ============================================================================
// Example 2: Update Cart Items
// ============================================================================

async function example2_UpdateCartItems() {
  try {
    const cartId = localStorage.getItem('cart_id');
    if (!cartId) throw new Error('No cart ID found');

    // Get current cart
    const cart = await getCart(cartId);

    // Update quantity of first item
    if (cart.items.length > 0) {
      const firstItem = cart.items[0];
      if (firstItem) {
        const updatedCart = await updateLineItem(cart.id, firstItem.id, 5);
        console.log('Updated item quantity to 5');

        // Remove second item if exists
        if (cart.items.length > 1) {
          const secondItem = cart.items[1];
          if (secondItem) {
            const finalCart = await removeLineItem(updatedCart.id, secondItem.id);
            console.log('Removed item from cart');
            return finalCart;
          }
        }

        return updatedCart;
      }
    }

    return cart;
  } catch (error) {
    console.error('Error in example 2:', error);
    throw error;
  }
}

// ============================================================================
// Example 3: Complete Checkout Flow
// ============================================================================

async function example3_CompleteCheckout() {
  try {
    // Step 1: Create cart and add products
    const cart = await createCart();
    await addLineItem(cart.id, 'variant_01TOUR123', 2);

    // Step 2: Set customer email
    await setCartEmail(cart.id, 'customer@example.com');

    // Step 3: Set shipping address
    const shippingAddress: AddressPayload = {
      first_name: 'John',
      last_name: 'Doe',
      address_1: '123 Sunshine Boulevard',
      address_2: 'Apt 4',
      city: 'Noosa',
      province: 'QLD',
      postal_code: '4567',
      country_code: 'au',
      phone: '+61412345678',
    };
    await setShippingAddress(cart.id, shippingAddress);

    // Step 4: Set billing address (same as shipping in this example)
    await setBillingAddress(cart.id, shippingAddress);

    // Step 5: Get available shipping options
    const shippingOptions = await getShippingOptions(cart.id);
    console.log('Available shipping options:', shippingOptions.length);

    // Select first shipping option
    if (shippingOptions.length > 0) {
      await addShippingMethod(cart.id, shippingOptions[0].id);
    }

    // Step 6: Initialize payment
    await initializePaymentSessions(cart.id);
    await setPaymentSession(cart.id, 'manual');

    // Step 7: Validate cart
    const latestCart = await getCart(cart.id);
    const validation = validateCartForCheckout(latestCart);

    if (!validation.valid) {
      console.error('Cart validation failed:', validation.errors);
      throw new Error('Cart is not ready for checkout');
    }

    // Step 8: Display cart totals
    const totals = calculateCartTotals(latestCart);
    console.log('Cart Totals:');
    console.log('  Subtotal:', formatPrice(totals.subtotal));
    console.log('  Shipping:', formatPrice(totals.shipping));
    console.log('  Tax:', formatPrice(totals.tax));
    console.log('  Total:', formatPrice(totals.total));

    // Step 9: Complete the cart
    const order = await completeCart(cart.id);
    console.log('Order created successfully!');
    console.log('Order ID:', order.id);
    console.log('Display ID:', order.display_id);

    // Step 10: Clean up
    localStorage.removeItem('cart_id');

    return order;
  } catch (error) {
    console.error('Error in checkout flow:', error);
    throw error;
  }
}

// ============================================================================
// Example 4: Cart Persistence with Local Storage
// ============================================================================

async function example4_CartPersistence() {
  try {
    // Check if cart exists in localStorage
    let cartId = localStorage.getItem('cart_id');

    if (cartId) {
      // Try to retrieve existing cart
      try {
        const existingCart = await getCart(cartId);
        console.log('Retrieved existing cart:', existingCart.id);
        return existingCart;
      } catch (error) {
        // Cart not found or invalid, create new one
        console.log('Existing cart not found, creating new cart');
        localStorage.removeItem('cart_id');
        cartId = null;
      }
    }

    // Create new cart if none exists
    const newCart = await createCart();
    localStorage.setItem('cart_id', newCart.id);
    console.log('Created new cart:', newCart.id);

    return newCart;
  } catch (error) {
    console.error('Error in cart persistence:', error);
    throw error;
  }
}

// ============================================================================
// Example 5: Add Custom Metadata to Cart
// ============================================================================

async function example5_CustomMetadata() {
  try {
    const cart = await createCart();

    // Add custom metadata to cart
    const updatedCart = await updateCartMetadata(cart.id, {
      tour_preferences: {
        difficulty_level: 'moderate',
        preferred_guide: 'Sarah',
        dietary_requirements: ['vegetarian', 'gluten-free'],
      },
      special_requests: 'Would like early morning departure',
      referral_code: 'FRIEND2024',
    });

    console.log('Cart metadata updated:', updatedCart.metadata);

    return updatedCart;
  } catch (error) {
    console.error('Error updating metadata:', error);
    throw error;
  }
}

// ============================================================================
// Example 6: Error Handling
// ============================================================================

async function example6_ErrorHandling() {
  try {
    // Attempt to get cart with invalid ID
    const invalidCartId = 'cart_invalid';

    try {
      await getCart(invalidCartId);
    } catch (error) {
      console.log('Expected error caught:', error instanceof Error ? error.message : error);
    }

    // Attempt to add item with invalid variant ID
    const cart = await createCart();

    try {
      await addLineItem(cart.id, 'variant_invalid', 1);
    } catch (error) {
      console.log('Expected error caught:', error instanceof Error ? error.message : error);
    }

    // Attempt to complete cart without required fields
    try {
      await completeCart(cart.id);
    } catch (error) {
      console.log('Expected error caught:', error instanceof Error ? error.message : error);
    }

    console.log('Error handling example completed');
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

// ============================================================================
// Example 7: Calculate and Display Cart Summary
// ============================================================================

async function example7_CartSummary() {
  try {
    const cartId = localStorage.getItem('cart_id');
    if (!cartId) throw new Error('No cart found');

    const cart = await getCart(cartId);

    // Calculate totals
    const totals = calculateCartTotals(cart);

    // Display cart summary
    console.log('=== CART SUMMARY ===');
    console.log('Cart ID:', cart.id);
    console.log('Customer Email:', cart.email || 'Not set');
    console.log('\nItems:');

    cart.items.forEach((item, index) => {
      console.log(`  ${index + 1}. ${item.title || 'Product'}`);
      console.log(`     Quantity: ${item.quantity}`);
      console.log(`     Price: ${formatPrice(item.unit_price || 0)}`);
      console.log(`     Subtotal: ${formatPrice(item.subtotal || 0)}`);
    });

    console.log('\n=== TOTALS ===');
    console.log('Items:', totals.itemCount);
    console.log('Subtotal:', formatPrice(totals.subtotal));
    console.log('Shipping:', formatPrice(totals.shipping));
    console.log('Tax:', formatPrice(totals.tax));
    console.log('Discount:', formatPrice(totals.discount));
    console.log('TOTAL:', formatPrice(totals.total));

    return cart;
  } catch (error) {
    console.error('Error displaying cart summary:', error);
    throw error;
  }
}

// ============================================================================
// Example 8: Retrieve Order After Completion
// ============================================================================

async function example8_RetrieveOrder(orderId: string) {
  try {
    const order = await getOrder(orderId);

    console.log('=== ORDER DETAILS ===');
    console.log('Order ID:', order.id);
    console.log('Display ID:', order.display_id);
    console.log('Status:', order.status);
    console.log('Customer:', order.email);
    console.log('Created:', new Date(order.created_at).toLocaleString());
    console.log('\nShipping Address:');
    console.log(`  ${order.shipping_address.first_name} ${order.shipping_address.last_name}`);
    console.log(`  ${order.shipping_address.address_1}`);
    if (order.shipping_address.address_2) {
      console.log(`  ${order.shipping_address.address_2}`);
    }
    console.log(
      `  ${order.shipping_address.city}, ${order.shipping_address.province} ${order.shipping_address.postal_code}`
    );
    console.log(`  ${order.shipping_address.country_code.toUpperCase()}`);

    console.log('\nOrder Total:', formatPrice(order.total));

    return order;
  } catch (error) {
    console.error('Error retrieving order:', error);
    throw error;
  }
}

// ============================================================================
// Export Examples for Testing
// ============================================================================

export {
  example1_CreateAndAddProducts,
  example2_UpdateCartItems,
  example3_CompleteCheckout,
  example4_CartPersistence,
  example5_CustomMetadata,
  example6_ErrorHandling,
  example7_CartSummary,
  example8_RetrieveOrder,
};
