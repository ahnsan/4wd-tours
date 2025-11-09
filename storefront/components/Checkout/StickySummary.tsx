'use client';

import React, { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import type { CartState } from '../../lib/types/checkout';
import styles from './StickySummary.module.css';

interface StickySummaryProps {
  cart: CartState;
  onContinue: () => void;
  onSkip: () => void;
  isLoading?: boolean;
}

export default function StickySummary({
  cart,
  onContinue,
  onSkip,
  isLoading = false,
}: StickySummaryProps) {
  const router = useRouter();
  const previousTotalRef = useRef<number>(0);

  // Calculate add-ons total
  const addonsTotal = cart.selected_addons.reduce(
    (sum, addon) => sum + addon.total_price,
    0
  );

  // Calculate base tour total
  const baseTourTotal = cart.tour ? cart.tour.base_price * cart.participants : 0;

  // Grand total
  const grandTotal = baseTourTotal + addonsTotal;

  // Announce total changes to screen readers
  useEffect(() => {
    if (previousTotalRef.current !== grandTotal && previousTotalRef.current !== 0) {
      // Announce the change
      const announcement = document.createElement('div');
      announcement.setAttribute('role', 'status');
      announcement.setAttribute('aria-live', 'polite');
      announcement.setAttribute('aria-atomic', 'true');
      announcement.className = 'sr-only';
      announcement.textContent = `Total updated to $${grandTotal.toFixed(2)}`;
      document.body.appendChild(announcement);

      // Remove after announcement
      setTimeout(() => {
        document.body.removeChild(announcement);
      }, 1000);
    }
    previousTotalRef.current = grandTotal;
  }, [grandTotal]);

  return (
    <aside className={styles.sticky} role="complementary" aria-label="Order summary">
      <div className={styles.summaryCard}>
        {/* Header */}
        <div className={styles.header}>
          <h2 className={styles.title}>Order Summary</h2>
          <span className={styles.itemCount}>
            {cart.selected_addons.length} add-on{cart.selected_addons.length !== 1 ? 's' : ''}
          </span>
        </div>

        {/* Tour Base */}
        {cart.tour && (
          <section className={styles.section} aria-labelledby="tour-base-heading">
            <h3 id="tour-base-heading" className={styles.sectionTitle}>
              Tour Package
            </h3>
            <div className={styles.lineItem}>
              <div className={styles.itemDetails}>
                <span className={styles.itemName}>{cart.tour.title}</span>
                <span className={styles.itemMeta}>
                  {cart.participants} × ${cart.tour.base_price.toFixed(2)}
                </span>
              </div>
              <span className={styles.itemPrice}>
                ${baseTourTotal.toFixed(2)}
              </span>
            </div>
          </section>
        )}

        {/* Selected Add-ons */}
        {cart.selected_addons.length > 0 && (
          <section className={styles.section} aria-labelledby="addons-heading">
            <h3 id="addons-heading" className={styles.sectionTitle}>
              Add-ons
            </h3>
            <ul className={styles.addonsList} role="list">
              {cart.selected_addons.map((addon) => (
                <li key={addon.id} className={styles.lineItem}>
                  <div className={styles.itemDetails}>
                    <span className={styles.itemName}>{addon.title}</span>
                    <span className={styles.itemMeta}>
                      {addon.pricing_type === 'per_day' && `${cart.tour?.duration_days || 1} day${(cart.tour?.duration_days || 1) > 1 ? 's' : ''}`}
                      {addon.pricing_type === 'per_person' && `${cart.participants} person${cart.participants > 1 ? 's' : ''}`}
                      {addon.pricing_type === 'per_booking' && 'Per booking'}
                      {addon.quantity > 1 && ` × ${addon.quantity}`}
                    </span>
                  </div>
                  <span className={styles.itemPrice}>
                    ${addon.total_price.toFixed(2)}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Price Breakdown */}
        <div className={styles.breakdown}>
          <div className={styles.breakdownRow}>
            <span className={styles.breakdownLabel}>Subtotal</span>
            <span className={styles.breakdownValue}>
              ${grandTotal.toFixed(2)}
            </span>
          </div>
          <div className={styles.breakdownRow}>
            <span className={styles.breakdownLabel}>Taxes & Fees</span>
            <span className={styles.breakdownValue}>
              Calculated at checkout
            </span>
          </div>
        </div>

        {/* Total */}
        <div className={styles.total} aria-live="polite" aria-atomic="true">
          <span className={styles.totalLabel}>Total</span>
          <span className={styles.totalValue}>
            ${grandTotal.toFixed(2)}
          </span>
          <span className="sr-only">
            Order total: ${grandTotal.toFixed(2)}
          </span>
        </div>

        {/* Actions */}
        <div className={styles.actions}>
          <button
            type="button"
            onClick={onContinue}
            disabled={!cart.tour || isLoading}
            className={styles.primaryButton}
            aria-label="Continue to payment"
          >
            {isLoading ? 'Processing...' : 'Continue to Payment'}
          </button>
          <button
            type="button"
            onClick={onSkip}
            disabled={isLoading}
            className={styles.secondaryButton}
            aria-label="Skip add-ons and continue"
          >
            Skip for Now
          </button>
        </div>

        {/* Trust Badges */}
        <div className={styles.trustBadges}>
          <div className={styles.badge}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            <span>Secure Checkout</span>
          </div>
          <div className={styles.badge}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>Money-back Guarantee</span>
          </div>
        </div>
      </div>
    </aside>
  );
}
