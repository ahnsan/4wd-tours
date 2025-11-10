'use client';

import React, { useState } from 'react';
import type { AddOn } from '../../lib/types/checkout';
import type { CategoryConfig } from '../../lib/hooks/useAddOnMultiStepFlow';
import styles from './AddOnCategoryStep.module.css';

export interface AddOnCategoryStepProps {
  category: CategoryConfig;
  addons: AddOn[];
  selectedAddOns: Map<string, { addon: AddOn; quantity: number }>;
  onAddToBooking: (addon: AddOn) => void;
  onRemoveFromBooking: (addonId: string) => void;
  onUpdateQuantity: (addonId: string, quantity: number) => void;
  tourDays?: number;
  participants?: number;
}

/**
 * AddOnCategoryStep - Category-based screen for addon selection
 * Shows persuasive copy, benefits, and addon cards
 */
export default function AddOnCategoryStep({
  category,
  addons,
  selectedAddOns,
  onAddToBooking,
  onRemoveFromBooking,
  onUpdateQuantity,
  tourDays = 1,
  participants = 1,
}: AddOnCategoryStepProps) {
  const [expandedAddon, setExpandedAddon] = useState<string | null>(null);

  const isSelected = (addonId: string) => selectedAddOns.has(addonId);
  const getQuantity = (addonId: string) => selectedAddOns.get(addonId)?.quantity || 1;

  const calculateDisplayPrice = (addon: AddOn) => {
    switch (addon.pricing_type) {
      case 'per_day':
        return {
          price: addon.price * tourDays,
          unit: `${tourDays} day${tourDays > 1 ? 's' : ''}`,
        };
      case 'per_person':
        return {
          price: addon.price * participants,
          unit: `${participants} person${participants > 1 ? 's' : ''}`,
        };
      case 'per_booking':
      default:
        return {
          price: addon.price,
          unit: 'per booking',
        };
    }
  };

  const toggleExpanded = (addonId: string) => {
    setExpandedAddon(expandedAddon === addonId ? null : addonId);
  };

  return (
    <div className={styles.container}>
      {/* Category Header */}
      <header className={styles.header}>
        <div className={styles.iconWrapper}>
          <span className={styles.categoryIcon} role="img" aria-label={category.name}>
            {category.icon}
          </span>
        </div>
        <h2 className={styles.title}>{category.title}</h2>
        <p className={styles.description}>{category.description}</p>
      </header>

      {/* Persuasion Copy */}
      <div className={styles.persuasionSection}>
        <p className={styles.persuasionCopy}>{category.persuasionCopy}</p>

        {/* Benefits List */}
        {category.benefits && category.benefits.length > 0 && (
          <ul className={styles.benefitsList} role="list">
            {category.benefits.map((benefit, index) => (
              <li key={index} className={styles.benefitItem}>
                <span className={styles.checkIcon} aria-hidden="true">✓</span>
                <span>{benefit}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Addons Grid */}
      <div className={styles.addonsGrid} role="list" aria-label={`${category.name} add-ons`}>
        {addons.length === 0 ? (
          <div className={styles.emptyState}>
            <p>No add-ons available in this category at the moment.</p>
          </div>
        ) : (
          addons.map((addon) => {
            const selected = isSelected(addon.id);
            const quantity = getQuantity(addon.id);
            const { price: displayPrice, unit } = calculateDisplayPrice(addon);
            const totalPrice = displayPrice * quantity;
            const isExpanded = expandedAddon === addon.id;

            return (
              <article
                key={addon.id}
                className={`${styles.addonCard} ${selected ? styles.selected : ''} ${!addon.available ? styles.unavailable : ''}`}
                role="listitem"
              >
                {/* Card Header */}
                <div className={styles.cardHeader}>
                  <h3 className={styles.addonTitle}>{addon.title}</h3>
                  {selected && (
                    <span className={styles.selectedBadge} aria-label="Selected">
                      ✓ Added
                    </span>
                  )}
                </div>

                {/* Short Description */}
                <p className={styles.addonDescription}>
                  {isExpanded ? addon.description : `${addon.description.slice(0, 100)}${addon.description.length > 100 ? '...' : ''}`}
                </p>

                {/* Expand/Collapse Button */}
                {addon.description.length > 100 && (
                  <button
                    type="button"
                    onClick={() => toggleExpanded(addon.id)}
                    className={styles.expandButton}
                    aria-expanded={isExpanded}
                  >
                    {isExpanded ? 'Show less' : 'Read more'}
                  </button>
                )}

                {/* Pricing */}
                <div className={styles.pricingSection}>
                  <div className={styles.priceInfo}>
                    <span className={styles.price}>${displayPrice.toFixed(2)}</span>
                    <span className={styles.unit}>{unit}</span>
                  </div>

                  {/* Quantity Selector (if selected and not per_booking) */}
                  {selected && addon.pricing_type !== 'per_booking' && (
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
                </div>

                {/* Total Price (if selected) */}
                {selected && (
                  <div className={styles.totalPrice} aria-live="polite">
                    <strong>Total: ${totalPrice.toFixed(2)}</strong>
                  </div>
                )}

                {/* Action Buttons */}
                <div className={styles.actions}>
                  {selected ? (
                    <button
                      type="button"
                      onClick={() => onRemoveFromBooking(addon.id)}
                      className={`${styles.actionButton} ${styles.removeButton}`}
                      disabled={!addon.available}
                    >
                      Remove from Booking
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => onAddToBooking(addon)}
                      className={`${styles.actionButton} ${styles.addButton}`}
                      disabled={!addon.available}
                    >
                      Add to Booking
                    </button>
                  )}
                </div>

                {!addon.available && (
                  <div className={styles.unavailableLabel}>Currently Unavailable</div>
                )}
              </article>
            );
          })
        )}
      </div>

      {/* Trust Indicators */}
      <div className={styles.trustSection}>
        <div className={styles.trustBadge}>
          <span className={styles.trustIcon}>🛡️</span>
          <span className={styles.trustText}>30-Day Money-Back Guarantee</span>
        </div>
        <div className={styles.trustBadge}>
          <span className={styles.trustIcon}>💳</span>
          <span className={styles.trustText}>Secure Payment</span>
        </div>
        <div className={styles.trustBadge}>
          <span className={styles.trustIcon}>⭐</span>
          <span className={styles.trustText}>Rated 4.9/5 by 500+ Travelers</span>
        </div>
      </div>
    </div>
  );
}
