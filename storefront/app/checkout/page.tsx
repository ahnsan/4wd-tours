'use client';

import React, { useState, useEffect } from 'react';

// NOTE: Route segment config (dynamicParams, revalidate) removed because they only work in Server Components.
// Client Components cannot export Next.js route config. This page requires client-side features (useState, useEffect, etc.)
// so it must remain a Client Component. Dynamic rendering happens automatically since we use hooks and browser APIs.
import { useRouter } from 'next/navigation';
import styles from './checkout.module.css';
import CustomerForm, { type CustomerData } from '../../components/Checkout/CustomerForm';
import PaymentForm, { type PaymentData } from '../../components/Checkout/PaymentForm';
import BookingSummary from '../../components/Checkout/BookingSummary';
import { useCartContext } from '@/lib/context/CartContext';
import {
  createCart,
  getCart,
  updateCart,
  addShippingMethod,
  getShippingOptions,
  initializePaymentSessions,
  setPaymentSession,
  completeCart,
  addLineItem,
  validateCartForCheckout,
  type AddressPayload,
} from '../../lib/data/cart-service';
import {
  saveFormData,
  loadFormData,
  clearAllCheckoutData,
} from '../../lib/utils/form-persistence';

interface BookingData {
  customer: CustomerData;
  payment: PaymentData;
}

export default function CheckoutPage() {
  const router = useRouter();
  const { cart } = useCartContext();
  const [isLoading, setIsLoading] = useState(false);
  const [customerValid, setCustomerValid] = useState(false);
  const [paymentValid, setPaymentValid] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [shippingOptions, setShippingOptions] = useState<any[]>([]);
  const [selectedShippingOption, setSelectedShippingOption] = useState<string>('');
  const [itemsSynced, setItemsSynced] = useState(false);

  // Check if cart has items, redirect if empty
  useEffect(() => {
    console.log('[Checkout] Cart state check - isLoading:', cart.isLoading, 'tour_booking:', !!cart.tour_booking, 'cart_id:', cart.cart_id);

    // Don't redirect while cart is loading
    if (cart.isLoading) {
      console.log('[Checkout] Cart is still loading, waiting...');
      return;
    }

    // Only redirect if cart is loaded AND no tour
    if (!cart.isLoading && !cart.tour_booking) {
      console.warn('[Checkout] No tour in cart after loading complete, redirecting to tours page');
      router.push('/tours');
    } else if (!cart.isLoading && cart.tour_booking) {
      console.log('[Checkout] Cart loaded successfully with tour:', cart.tour_booking.tour.title);
    }
  }, [cart.tour_booking, cart.isLoading, cart.cart_id, router]);

  // Initialize Medusa cart if not already created
  useEffect(() => {
    const initializeMedusaCart = async () => {
      if (!cart.cart_id && cart.tour_booking) {
        try {
          console.log('[Checkout] Creating Medusa cart...');
          const medusaCart = await createCart();
          // Cart ID is managed internally by useCart hook
          console.log('[Checkout] Medusa cart created:', medusaCart.id);
        } catch (error) {
          console.error('[Checkout] Error creating Medusa cart:', error);
          setError('Failed to initialize checkout. Please try again.');
        }
      }
    };

    initializeMedusaCart();
  }, [cart.cart_id, cart.tour_booking]);

  // Sync tour and add-ons from React state to Medusa cart as line items
  // CRITICAL: This must happen BEFORE payment initialization to avoid "cart has no items" error
  useEffect(() => {
    const syncItemsToCart = async () => {
      // Skip if already synced or no cart ID
      if (itemsSynced || !cart.cart_id) {
        return;
      }

      // Skip if no tour booking (nothing to sync)
      if (!cart.tour_booking) {
        console.log('[Checkout] No tour booking to sync');
        return;
      }

      // Skip if cart already has a line item ID (already synced to Medusa)
      if (cart.tour_booking.line_item_id) {
        console.log('[Checkout] Tour already synced to Medusa cart (has line_item_id)');
        setItemsSynced(true);
        return;
      }

      try {
        console.log('[Checkout] Starting cart items sync...');
        console.log('[Checkout] Tour booking:', cart.tour_booking);
        console.log('[Checkout] Addons:', cart.addons);

        // Sync tour as line item
        const tourVariantId = cart.tour_booking.tour.variant_id;

        if (!tourVariantId) {
          console.warn('[Checkout] Tour has no variant_id. Cannot add to cart.');
        } else {
          console.log('[Checkout] Adding tour to cart:', {
            cart_id: cart.cart_id,
            variant_id: tourVariantId,
            participants: cart.tour_booking.participants,
            start_date: cart.tour_booking.start_date,
          });

          await addLineItem(
            cart.cart_id,
            tourVariantId,
            cart.tour_booking.participants,
            {
              type: 'tour',
              start_date: cart.tour_booking.start_date,
            }
          );

          console.log('[Checkout] Tour added to cart successfully');
        }

        // Sync add-ons as line items
        if (cart.addons && cart.addons.length > 0) {
          console.log('[Checkout] Adding addons to cart:', cart.addons.length);

          for (const cartAddon of cart.addons) {
            const addonVariantId = cartAddon.addon.variant_id;

            if (!addonVariantId) {
              console.warn('[Checkout] Addon has no variant_id:', cartAddon.addon.title);
              continue;
            }

            console.log('[Checkout] Adding addon:', {
              title: cartAddon.addon.title,
              variant_id: addonVariantId,
              quantity: cartAddon.quantity,
            });

            await addLineItem(
              cart.cart_id,
              addonVariantId,
              cartAddon.quantity,
              {
                type: 'addon',
              }
            );
          }

          console.log('[Checkout] All addons added to cart successfully');
        } else {
          console.log('[Checkout] No addons to sync');
        }

        // Mark as synced
        setItemsSynced(true);
        console.log('[Checkout] Cart items sync complete');
      } catch (error) {
        console.error('[Checkout] Error syncing items to cart:', error);

        // CRITICAL FIX: Show error to user instead of silent failure
        const errorMessage = error instanceof Error ? error.message : 'Failed to add items to cart';
        setError(`Unable to add booking items to cart: ${errorMessage}. Please try refreshing the page or start over.`);
        setItemsSynced(false);

        console.error('[Checkout] Cart sync failed - blocking checkout to prevent empty cart submission');
      }
    };

    syncItemsToCart();
  }, [cart.cart_id, cart.tour_booking, cart.addons, itemsSynced]);

  // Fetch shipping options when cart has shipping address
  useEffect(() => {
    const fetchShippingOptions = async () => {
      if (cart.cart_id && customerValid) {
        try {
          console.log('[Checkout] Fetching shipping options...');
          const options = await getShippingOptions(cart.cart_id);
          setShippingOptions(options);

          // Auto-select first option if available (with bounds check)
          if (options.length > 0 && options[0]?.id && !selectedShippingOption) {
            console.log('[Checkout] Auto-selecting first shipping option:', options[0].id);
            setSelectedShippingOption(options[0].id);
          } else if (options.length > 0 && !options[0]?.id) {
            console.error('[Checkout] Shipping option missing ID:', options[0]);
          }
        } catch (error) {
          console.error('[Checkout] Error fetching shipping options:', error);
          // Don't set error - shipping options might not be available yet
        }
      }
    };

    fetchShippingOptions();
  }, [cart.cart_id, customerValid, selectedShippingOption]);

  // Initialize customer data with persistence restore
  const [customerData, setCustomerData] = useState<CustomerData>(() => {
    const restored = loadFormData<CustomerData>('customer-info');
    return restored || {
      fullName: '',
      email: '',
      phone: '',
      emergencyContact: '',
      emergencyPhone: '',
      dietaryRequirements: '',
      specialRequests: '',
    };
  });

  // Initialize payment data with persistence restore (sensitive fields excluded automatically)
  const [paymentData, setPaymentData] = useState<PaymentData>(() => {
    const restored = loadFormData<PaymentData>('payment-info');
    return restored || {
      method: 'card',
      cardNumber: '',
      cardName: '',
      cardExpiry: '',
      cardCVV: '',
      termsAccepted: false,
    };
  });

  // Restore selected shipping option from persistence
  useEffect(() => {
    const restoredShippingOption = loadFormData<{ selectedShippingOption: string }>('shipping-option');
    if (restoredShippingOption?.selectedShippingOption) {
      setSelectedShippingOption(restoredShippingOption.selectedShippingOption);
      console.log('[Checkout] Restored shipping option:', restoredShippingOption.selectedShippingOption);
    }
  }, []);

  // Persist selected shipping option when it changes
  useEffect(() => {
    if (selectedShippingOption) {
      saveFormData('shipping-option', { selectedShippingOption });
    }
  }, [selectedShippingOption]);

  const handleCustomerDataChange = (data: CustomerData, isValid: boolean) => {
    setCustomerData(data);
    setCustomerValid(isValid);
    // Save to sessionStorage with debouncing (500ms default)
    saveFormData('customer-info', data);
  };

  const handlePaymentDataChange = (data: PaymentData, isValid: boolean) => {
    setPaymentData(data);
    setPaymentValid(isValid);
    // Save to sessionStorage with debouncing (sensitive fields auto-filtered)
    saveFormData('payment-info', data);
  };

  const handleCompleteBooking = async () => {
    if (!customerValid || !paymentValid) {
      setError('Please complete all required fields before proceeding.');
      return;
    }

    if (!cart.cart_id) {
      setError('Cart not initialized. Please refresh the page.');
      return;
    }

    // CRITICAL FIX: Prevent checkout if items failed to sync
    if (!itemsSynced) {
      setError('Cart items are still being added. Please wait a moment and try again.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      console.log('[Checkout] Starting checkout process...');

      // Parse customer name into first and last name
      const nameParts = customerData.fullName.trim().split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || firstName;

      // Prepare address payload
      const addressPayload: AddressPayload = {
        first_name: firstName,
        last_name: lastName,
        address_1: 'Sunshine Coast', // Placeholder - update CustomerForm to collect
        city: 'Sunshine Coast',
        postal_code: '4000',
        country_code: 'au',
        phone: customerData.phone,
        metadata: {
          emergency_contact: customerData.emergencyContact,
          emergency_phone: customerData.emergencyPhone,
          dietary_requirements: customerData.dietaryRequirements,
          special_requests: customerData.specialRequests,
        },
      };

      // CRITICAL FIX: Update cart fields in single request to prevent race conditions
      // Previous implementation used Promise.all() which caused parallel updates to same resource
      console.log('[Checkout] Updating cart with email and addresses (single atomic operation)...');
      await updateCart(cart.cart_id, {
        email: customerData.email,
        shipping_address: addressPayload,
        billing_address: addressPayload,
      });
      console.log('[Checkout] Cart updated successfully');

      // VALIDATION: Ensure shipping method is selected (REQUIRED for Medusa v2)
      if (!selectedShippingOption) {
        throw new Error('Please select a shipping method before proceeding to payment.');
      }

      console.log('[Checkout] Adding shipping method (REQUIRED)...');
      await addShippingMethod(cart.cart_id, selectedShippingOption);

      // VALIDATION: Verify cart is ready for payment (Phase 2)
      console.log('[Checkout] Validating cart before payment initialization...');
      console.log('[Checkout] - Items synced:', itemsSynced);
      console.log('[Checkout] - Cart ID:', cart.cart_id);
      console.log('[Checkout] - Email:', customerData.email);
      console.log('[Checkout] - Shipping method:', selectedShippingOption);

      // Get fresh cart state to validate
      const cartBeforePayment = await getCart(cart.cart_id);
      const validation = validateCartForCheckout(cartBeforePayment);

      if (!validation.valid) {
        console.error('[Checkout] Cart validation failed:', validation.errors);
        throw new Error(`Cart is not ready for payment: ${validation.errors.join(', ')}`);
      }

      console.log('[Checkout] Cart validation passed. Cart state:');
      console.log('[Checkout] - Items:', cartBeforePayment.items?.length || 0);
      console.log('[Checkout] - Has email:', !!cartBeforePayment.email);
      console.log('[Checkout] - Has shipping address:', !!cartBeforePayment.shipping_address);
      console.log('[Checkout] - Has billing address:', !!cartBeforePayment.billing_address);
      console.log('[Checkout] - Shipping methods:', cartBeforePayment.shipping_methods?.length || 0);

      // Verify items are synced before payment
      if (!itemsSynced) {
        console.warn('[Checkout] Items not synced yet. Waiting for sync to complete...');
        throw new Error('Please wait for cart items to sync before completing checkout.');
      }

      // CRITICAL: Initialize payment with provider (Medusa v2)
      // This now creates payment collection AND initializes payment sessions
      //
      // TODO: FOR PRODUCTION - Implement Stripe Elements integration
      // Current: Using system provider for testing/development
      // Future: Switch to 'pp_stripe_stripe' and implement Stripe Elements in PaymentForm
      // Reference: https://docs.medusajs.com/resources/storefront-development/checkout/payment
      // Required: NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY environment variable
      console.log('[Checkout] ========================================');
      console.log('[Checkout] INITIALIZING PAYMENT (MEDUSA V2)');
      console.log('[Checkout] Using system provider for testing');
      console.log('[Checkout] ========================================');
      await initializePaymentSessions(cart.cart_id, 'pp_system_default');

      // Note: setPaymentSession may be redundant in Medusa v2 since the payment
      // session is already created with the provider. It's been updated to handle
      // v2 gracefully and will fall back to returning the cart if the endpoint doesn't exist.

      // Final step: Complete cart and create order (must be last)
      console.log('[Checkout] Completing cart...');
      const order = await completeCart(cart.cart_id);

      console.log('[Checkout] Order created successfully:', order.id);

      // Clear all persisted checkout data from sessionStorage
      clearAllCheckoutData();
      console.log('[Checkout] Cleared all persisted form data');

      // Redirect to confirmation page with REAL order ID
      router.push(`/checkout/confirmation?bookingId=${order.id}`);

    } catch (error) {
      console.error('[Checkout] Error during checkout:', error);
      setError(
        error instanceof Error
          ? `Checkout failed: ${error.message}`
          : 'Checkout failed. Please try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const isFormComplete = customerValid && paymentValid;

  // Show loading state while cart is loading
  if (cart.isLoading) {
    return (
      <div className={styles.checkoutPage}>
        <div className={styles.container}>
          <div className={styles.emptyState}>
            <p>Loading your cart...</p>
          </div>
        </div>
      </div>
    );
  }

  // Show empty state if no tour after loading
  if (!cart.tour_booking) {
    return (
      <div className={styles.checkoutPage}>
        <div className={styles.container}>
          <div className={styles.emptyState}>
            <h1>No Tour Selected</h1>
            <p>Please select a tour before proceeding to checkout.</p>
            <a href="/tours" style={{ marginTop: '1rem', display: 'inline-block', padding: '0.5rem 1rem', backgroundColor: '#667eea', color: 'white', borderRadius: '0.375rem', textDecoration: 'none' }}>
              Browse Tours
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.checkoutPage}>
      {/* Header */}
      <header className={styles.header}>
        <div className={styles.headerContent}>
          <h1 className={styles.pageTitle}>Complete Your Booking</h1>
          <p className={styles.pageDescription}>
            You're just a few steps away from your Sunshine Coast adventure!
          </p>
        </div>
      </header>

      {/* Main Content */}
      <div className={styles.container}>
        <div className={styles.checkoutGrid}>
          {/* Left Column - Forms */}
          <div className={styles.formsColumn}>
            <CustomerForm
              onDataChange={handleCustomerDataChange}
              initialData={customerData}
            />

            <div className={styles.formSpacer} />

            <PaymentForm
              onDataChange={handlePaymentDataChange}
              initialData={paymentData}
            />

            {/* Complete Booking Button */}
            <div className={styles.actionSection}>
              {error && (
                <div className={styles.errorMessage} role="alert">
                  <svg
                    className={styles.errorIcon}
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                  {error}
                </div>
              )}

              <button
                onClick={handleCompleteBooking}
                disabled={!isFormComplete || isLoading}
                className={`${styles.completeButton} ${!isFormComplete ? styles.buttonDisabled : ''}`}
                aria-label="Complete booking and proceed to payment"
              >
                {isLoading ? (
                  <>
                    <span className={styles.spinner} />
                    Processing...
                  </>
                ) : (
                  'Complete Booking'
                )}
              </button>

              {!isFormComplete && !error && (
                <p className={styles.helperText}>
                  Please complete all required fields to continue
                </p>
              )}
            </div>
          </div>

          {/* Right Column - Summary */}
          <div className={styles.summaryColumn}>
            <BookingSummary
              cart={cart}
              showEditLinks={true}
              currentStep="checkout"
              onEditTour={() => router.push('/tours')}
              onEditAddons={() => router.push('/checkout/add-ons-flow')}
            />
          </div>
        </div>
      </div>

      {/* Security Badge */}
      <div className={styles.securityBadge}>
        <svg
          className={styles.securityIcon}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
          <path d="M7 11V7a5 5 0 0 1 10 0v4" />
        </svg>
        <span>Secure SSL Encrypted Payment</span>
      </div>
    </div>
  );
}
