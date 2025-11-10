'use client';

import React from 'react';
import type { AddOn } from '../../lib/types/checkout';
import styles from './AddOnSummary.module.css';

export interface AddOnSummaryProps {
  selectedAddOns: Map<string, { addon: AddOn; quantity: number }>;
  onRemove: (addonId: string) => void;
  onUpdateQuantity: (addonId: string, quantity: number) => void;
  onContinueToCheckout: () => void;
  onGoBack?: () => void;
  tourDays?: number;
  participants?: number;
}

/**
 * AddOnSummary - Final summary screen showing all selected addons
 * Shows total price calculation, edit/remove options, and continue button
 */
export default function AddOnSummary({
  selectedAddOns,
  onRemove,
  onUpdateQuantity,
  onContinueToCheckout,
  onGoBack,
  tourDays = 1,
  participants = 1,
}: AddOnSummaryProps) {
  const selectedAddonsArray = Array.from(selectedAddOns.values());
  const hasSelections = selectedAddonsArray.length > 0;

  const calculateDisplayPrice = (addon: AddOn, quantity: number) => {
    let basePrice = addon.price;

    switch (addon.pricing_type) {
      case 'per_day':
        basePrice *= tourDays;
        break;
      case 'per_person':
        basePrice *= participants;
        break;
    }

    return basePrice * quantity;
  };

  const totalPrice = selectedAddonsArray.reduce((sum, { addon, quantity }) => {
    return sum + calculateDisplayPrice(addon, quantity);
  }, 0);

  const getPricingLabel = (addon: AddOn) => {
    switch (addon.pricing_type) {
      case 'per_day':
        return `$${addon.price.toFixed(2)} × ${tourDays} day${tourDays > 1 ? 's' : ''}`;
      case 'per_person':
        return `$${addon.price.toFixed(2)} × ${participants} person${participants > 1 ? 's' : ''}`;
      case 'per_booking':
      default:
        return `$${addon.price.toFixed(2)} per booking`;
    }
  };

  return (
    <div className={styles.container}>
      {/* Header */}
      <header className={styles.header}>
        <div className={styles.iconWrapper}>
          <span className={styles.summaryIcon} role="img" aria-label="Summary">
            ✓
          </span>
        </div>
        <h2 className={styles.title}>Your Adventure Extras</h2>
        <p className={styles.description}>
          {hasSelections
            ? `You've selected ${selectedAddonsArray.length} add-on${selectedAddonsArray.length !== 1 ? 's' : ''} to enhance your journey`
            : 'No add-ons selected yet'}
        </p>
      </header>

      {/* Selected Add-ons List */}
      {hasSelections ? (
        <>
          <div className={styles.addonsList} role="list" aria-label="Selected add-ons">
            {selectedAddonsArray.map(({ addon, quantity }) => {
              const itemTotal = calculateDisplayPrice(addon, quantity);

              return (
                <article key={addon.id} className={styles.addonItem} role="listitem">
                  <div className={styles.addonInfo}>
                    <h3 className={styles.addonTitle}>{addon.title}</h3>
                    <p className={styles.addonDetails}>
                      {getPricingLabel(addon)}
                      {quantity > 1 && ` × ${quantity}`}
                    </p>
                  </div>

                  {/* Quantity Control (if not per_booking) */}
                  {addon.pricing_type !== 'per_booking' && (
                    <div className={styles.quantityControl} role="group" aria-label={`Quantity for ${addon.title}`}>
                      <button
                        type="button"
                        onClick={() => onUpdateQuantity(addon.id, Math.max(1, quantity - 1))}
                        disabled={quantity <= 1}
                        className={styles.quantityButton}
                        aria-label="Decrease quantity"
                      >
                        -
                      </button>
                      <span className={styles.quantityValue} aria-live="polite">
                        {quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => onUpdateQuantity(addon.id, Math.min(99, quantity + 1))}
                        disabled={quantity >= 99}
                        className={styles.quantityButton}
                        aria-label="Increase quantity"
                      >
                        +
                      </button>
                    </div>
                  )}

                  <div className={styles.addonActions}>
                    <div className={styles.itemPrice}>${itemTotal.toFixed(2)}</div>
                    <button
                      type="button"
                      onClick={() => onRemove(addon.id)}
                      className={styles.removeButton}
                      aria-label={`Remove ${addon.title}`}
                    >
                      Remove
                    </button>
                  </div>
                </article>
              );
            })}
          </div>

          {/* Total Section */}
          <div className={styles.totalSection}>
            <div className={styles.totalRow}>
              <span className={styles.totalLabel}>Subtotal ({selectedAddonsArray.length} item{selectedAddonsArray.length !== 1 ? 's' : ''})</span>
              <span className={styles.totalAmount}>${totalPrice.toFixed(2)}</span>
            </div>
            <div className={styles.totalRow}>
              <span className={styles.totalLabel}>Tax</span>
              <span className={styles.totalAmount}>Calculated at checkout</span>
            </div>
            <div className={`${styles.totalRow} ${styles.grandTotal}`}>
              <span className={styles.totalLabel}>Total Add-ons</span>
              <span className={styles.totalAmount}>${totalPrice.toFixed(2)}</span>
            </div>
          </div>

          {/* Savings Badge (if applicable) */}
          {totalPrice > 500 && (
            <div className={styles.savingsBadge}>
              <span className={styles.savingsIcon}>💰</span>
              <span className={styles.savingsText}>
                Great choice! You're getting premium experiences worth every dollar.
              </span>
            </div>
          )}
        </>
      ) : (
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>📦</div>
          <p className={styles.emptyText}>You haven't selected any add-ons yet.</p>
          <p className={styles.emptySubtext}>Go back and explore our premium extras to enhance your adventure!</p>
        </div>
      )}

      {/* Action Buttons */}
      <div className={styles.actions}>
        {onGoBack && (
          <button
            type="button"
            onClick={onGoBack}
            className={`${styles.actionButton} ${styles.backButton}`}
          >
            ← Go Back
          </button>
        )}
        <button
          type="button"
          onClick={onContinueToCheckout}
          className={`${styles.actionButton} ${styles.continueButton}`}
        >
          {hasSelections ? 'Continue to Checkout' : 'Skip to Checkout'}
        </button>
      </div>

      {/* Trust Indicators */}
      <div className={styles.trustSection}>
        <div className={styles.trustBadge}>
          <span className={styles.trustIcon}>🛡️</span>
          <span className={styles.trustText}>30-Day Money-Back Guarantee</span>
        </div>
        <div className={styles.trustBadge}>
          <span className={styles.trustIcon}>🔒</span>
          <span className={styles.trustText}>Secure Checkout</span>
        </div>
        <div className={styles.trustBadge}>
          <span className={styles.trustIcon}>⭐</span>
          <span className={styles.trustText}>4.9/5 Average Rating</span>
        </div>
      </div>

      {/* Final Reassurance */}
      {hasSelections && (
        <div className={styles.reassurance}>
          <p>You can modify or cancel your add-ons up to 48 hours before your tour start date.</p>
        </div>
      )}
    </div>
  );
}
