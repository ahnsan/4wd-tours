'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import type { CartState } from '../../lib/types/checkout';
import styles from './BookingSummary.module.css';

interface BookingSummaryProps {
  cart: CartState;
  onChangeTour?: () => void;
}

export default function BookingSummary({ cart, onChangeTour }: BookingSummaryProps) {
  const router = useRouter();

  const handleContinueToPayment = () => {
    if (!cart.tour) {
      alert('Please select a tour first');
      return;
    }
    // Navigate to payment page (to be implemented)
    router.push('/checkout/payment');
  };

  const handleChangeTour = () => {
    if (onChangeTour) {
      onChangeTour();
    } else {
      router.push('/');
    }
  };

  return (
    <aside className={styles.summary} role="complementary" aria-label="Booking summary">
      <div className={styles.summaryContent}>
        <h2 className={styles.title}>Booking Summary</h2>

        {/* Selected Tour */}
        {cart.tour ? (
          <section className={styles.section} aria-labelledby="tour-summary-heading">
            <h3 id="tour-summary-heading" className={styles.sectionTitle}>
              Selected Tour
            </h3>
            <div className={styles.tourInfo}>
              <div className={styles.tourDetails}>
                <strong className={styles.tourTitle}>{cart.tour.title}</strong>
                <p className={styles.tourMeta}>
                  {cart.tour.duration_days} day{cart.tour.duration_days > 1 ? 's' : ''}
                  {' • '}
                  {cart.participants} participant{cart.participants > 1 ? 's' : ''}
                </p>
              </div>
              <div className={styles.tourPrice}>
                ${(cart.tour.base_price * cart.participants).toFixed(2)}
              </div>
            </div>
            <button
              type="button"
              onClick={handleChangeTour}
              className={styles.changeTourBtn}
              aria-label="Change selected tour"
            >
              Change Tour
            </button>
          </section>
        ) : (
          <div className={styles.noTour}>
            <p>No tour selected</p>
            <button
              type="button"
              onClick={handleChangeTour}
              className={styles.selectTourBtn}
            >
              Select a Tour
            </button>
          </div>
        )}

        {/* Selected Add-ons */}
        {cart.selected_addons.length > 0 && (
          <section className={styles.section} aria-labelledby="addons-summary-heading">
            <h3 id="addons-summary-heading" className={styles.sectionTitle}>
              Selected Add-ons ({cart.selected_addons.length})
            </h3>
            <ul className={styles.addonsList} role="list">
              {cart.selected_addons.map((addon) => (
                <li key={addon.id} className={styles.addonItem}>
                  <div className={styles.addonInfo}>
                    <span className={styles.addonTitle}>{addon.title}</span>
                    {addon.quantity > 1 && (
                      <span className={styles.addonQuantity}>x{addon.quantity}</span>
                    )}
                  </div>
                  <div className={styles.addonPrice}>
                    ${addon.total_price.toFixed(2)}
                  </div>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Price Breakdown */}
        <section className={styles.section} aria-labelledby="price-breakdown-heading" aria-live="polite" aria-atomic="false">
          <h3 id="price-breakdown-heading" className={styles.sectionTitle}>
            Price Breakdown
          </h3>
          <dl className={styles.priceList}>
            {cart.tour && (
              <div className={styles.priceRow}>
                <dt>Tour Base Price</dt>
                <dd aria-label={`Tour base price: ${(cart.tour.base_price * cart.participants).toFixed(2)} dollars`}>
                  ${(cart.tour.base_price * cart.participants).toFixed(2)}
                </dd>
              </div>
            )}
            {cart.selected_addons.length > 0 && (
              <div className={styles.priceRow}>
                <dt>Add-ons Total</dt>
                <dd aria-label={`Add-ons total: ${cart.selected_addons.reduce((sum, addon) => sum + addon.total_price, 0).toFixed(2)} dollars`}>
                  $
                  {cart.selected_addons
                    .reduce((sum, addon) => sum + addon.total_price, 0)
                    .toFixed(2)}
                </dd>
              </div>
            )}
            <div className={`${styles.priceRow} ${styles.subtotalRow}`}>
              <dt>Subtotal</dt>
              <dd aria-label={`Subtotal: ${cart.subtotal.toFixed(2)} dollars`}>
                ${cart.subtotal.toFixed(2)}
              </dd>
            </div>
            <div className={`${styles.priceRow} ${styles.totalRow}`}>
              <dt>Total</dt>
              <dd aria-label={`Total booking cost: ${cart.total.toFixed(2)} dollars`} aria-live="assertive">
                ${cart.total.toFixed(2)}
              </dd>
            </div>
          </dl>
        </section>

        {/* Continue Button */}
        <div className={styles.actions}>
          <button
            type="button"
            onClick={handleContinueToPayment}
            disabled={!cart.tour}
            className={styles.continueBtn}
            aria-label="Continue to payment"
          >
            Continue to Payment
          </button>
          <p className={styles.secureNote}>
            🔒 Secure checkout powered by Stripe
          </p>
        </div>
      </div>
    </aside>
  );
}
