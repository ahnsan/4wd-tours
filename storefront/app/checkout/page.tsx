'use client';

import React, { useState, useEffect } from 'react';

// Force dynamic rendering since this page requires cart state
export const dynamicParams = true;
export const revalidate = 0;
import { useRouter } from 'next/navigation';
import styles from './checkout.module.css';
import CustomerForm, { type CustomerData } from '../../components/Checkout/CustomerForm';
import PaymentForm, { type PaymentData } from '../../components/Checkout/PaymentForm';
import PriceSummary, { type Tour } from '../../components/Checkout/PriceSummary';
import { type AddOn } from '../../lib/utils/pricing';
import { useCart } from '../../lib/hooks/useCart';
import {
  createCart,
  setShippingAddress,
  setBillingAddress,
  setCartEmail,
  addShippingMethod,
  getShippingOptions,
  initializePaymentSessions,
  setPaymentSession,
  completeCart,
  type AddressPayload,
} from '../../lib/data/cart-service';

interface BookingData {
  tour: Tour;
  addOns: AddOn[];
  customer: CustomerData;
  payment: PaymentData;
}

export default function CheckoutPage() {
  const router = useRouter();
  const { cart } = useCart();
  const [isLoading, setIsLoading] = useState(false);
  const [customerValid, setCustomerValid] = useState(false);
  const [paymentValid, setPaymentValid] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [shippingOptions, setShippingOptions] = useState<any[]>([]);
  const [selectedShippingOption, setSelectedShippingOption] = useState<string>('');

  // Check if cart has items, redirect if empty
  useEffect(() => {
    if (!cart.tour) {
      console.warn('[Checkout] No tour in cart, redirecting to tours page');
      router.push('/tours');
    }
  }, [cart.tour, router]);

  // Initialize Medusa cart if not already created
  useEffect(() => {
    const initializeMedusaCart = async () => {
      if (!cart.medusa_cart_id && cart.tour) {
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
  }, [cart.medusa_cart_id, cart.tour]);

  // Fetch shipping options when cart has shipping address
  useEffect(() => {
    const fetchShippingOptions = async () => {
      if (cart.medusa_cart_id && customerValid) {
        try {
          console.log('[Checkout] Fetching shipping options...');
          const options = await getShippingOptions(cart.medusa_cart_id);
          setShippingOptions(options);

          // Auto-select first option if available
          if (options.length > 0 && !selectedShippingOption) {
            setSelectedShippingOption(options[0].id);
          }
        } catch (error) {
          console.error('[Checkout] Error fetching shipping options:', error);
          // Don't set error - shipping options might not be available yet
        }
      }
    };

    fetchShippingOptions();
  }, [cart.medusa_cart_id, customerValid, selectedShippingOption]);

  // Transform cart data to match PriceSummary component interface
  const tourData: Tour | null = cart.tour ? {
    id: cart.tour.id,
    name: cart.tour.title,
    date: cart.tour_start_date || new Date().toISOString(),
    participants: cart.participants,
    basePrice: cart.tour.base_price,
  } : null;

  // Transform cart add-ons to match PriceSummary component interface
  const addOnsData: AddOn[] = cart.selected_addons.map((addon) => ({
    id: addon.id,
    name: addon.title,
    price: addon.total_price / addon.quantity, // Get unit price
    quantity: addon.quantity,
  }));

  const [customerData, setCustomerData] = useState<CustomerData>({
    fullName: '',
    email: '',
    phone: '',
    emergencyContact: '',
    emergencyPhone: '',
    dietaryRequirements: '',
    specialRequests: '',
  });

  const [paymentData, setPaymentData] = useState<PaymentData>({
    method: 'card',
    cardNumber: '',
    cardName: '',
    cardExpiry: '',
    cardCVV: '',
    termsAccepted: false,
  });

  // Load data from localStorage on mount (for demo purposes)
  useEffect(() => {
    const savedCustomerData = localStorage.getItem('checkout_customer');
    if (savedCustomerData) {
      try {
        setCustomerData(JSON.parse(savedCustomerData));
      } catch (error) {
        console.error('Failed to load saved customer data:', error);
      }
    }
  }, []);

  const handleCustomerDataChange = (data: CustomerData, isValid: boolean) => {
    setCustomerData(data);
    setCustomerValid(isValid);
    // Save to localStorage for demo
    localStorage.setItem('checkout_customer', JSON.stringify(data));
  };

  const handlePaymentDataChange = (data: PaymentData, isValid: boolean) => {
    setPaymentData(data);
    setPaymentValid(isValid);
  };

  const handleCompleteBooking = async () => {
    if (!customerValid || !paymentValid) {
      setError('Please complete all required fields before proceeding.');
      return;
    }

    if (!cart.medusa_cart_id) {
      setError('Cart not initialized. Please refresh the page.');
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

      // OPTIMIZATION: Parallelize independent API calls (Phase 1)
      // These calls don't depend on each other, so run them in parallel
      console.log('[Checkout] Setting email and addresses (parallel)...');
      await Promise.all([
        setCartEmail(cart.medusa_cart_id, customerData.email),
        setShippingAddress(cart.medusa_cart_id, addressPayload),
        setBillingAddress(cart.medusa_cart_id, addressPayload),
      ]);
      console.log('[Checkout] Email and addresses set successfully');

      // OPTIMIZATION: Run shipping method if needed (Phase 2)
      if (selectedShippingOption) {
        console.log('[Checkout] Adding shipping method...');
        await addShippingMethod(cart.medusa_cart_id, selectedShippingOption);
      }

      // OPTIMIZATION: Parallelize payment initialization (Phase 3)
      // Initialize and set payment session can potentially be combined
      console.log('[Checkout] Initializing payment...');
      await initializePaymentSessions(cart.medusa_cart_id);

      console.log('[Checkout] Setting payment session...');
      await setPaymentSession(cart.medusa_cart_id, 'manual');

      // Final step: Complete cart and create order (must be last)
      console.log('[Checkout] Completing cart...');
      const order = await completeCart(cart.medusa_cart_id);

      console.log('[Checkout] Order created successfully:', order.id);

      // Clear checkout data from localStorage
      localStorage.removeItem('checkout_customer');

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

  // Show loading state while checking cart
  if (!cart.tour) {
    return (
      <div className={styles.checkoutPage}>
        <div className={styles.container}>
          <div className={styles.emptyState}>
            <p>Redirecting to tours page...</p>
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
            {tourData && <PriceSummary tour={tourData} addOns={addOnsData} />}
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
