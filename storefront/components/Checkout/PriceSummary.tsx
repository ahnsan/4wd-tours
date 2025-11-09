'use client';

import React, { useState } from 'react';
import styles from './PriceSummary.module.css';
import { calculatePriceBreakdown, formatCurrency, type AddOn } from '../../lib/utils/pricing';

export interface Tour {
  id: string;
  name: string;
  date: string;
  participants: number;
  basePrice: number;
}

interface PriceSummaryProps {
  tour: Tour;
  addOns?: AddOn[];
}

export default function PriceSummary({ tour, addOns = [] }: PriceSummaryProps) {
  const priceBreakdown = calculatePriceBreakdown(tour.basePrice, addOns);
  const [showAllAddons, setShowAllAddons] = useState(false);

  // Show max 5 add-ons initially if there are many
  const MAX_VISIBLE_ADDONS = 5;
  const visibleAddons = showAllAddons ? addOns : addOns.slice(0, MAX_VISIBLE_ADDONS);
  const hasMoreAddons = addOns.length > MAX_VISIBLE_ADDONS;

  const formatDate = (dateString: string): string => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-AU', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch {
      return dateString;
    }
  };

  const formatDateShort = (dateString: string): string => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-AU', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return dateString;
    }
  };

  return (
    <div className={styles.priceSummary}>
      {/* Header */}
      <div className={styles.summaryHeader}>
        <h2 className={styles.title}>Order Summary</h2>
      </div>

      {/* Tour Details Section */}
      <div className={styles.section}>
        <div className={styles.tourCard}>
          <div className={styles.tourHeader}>
            <h3 className={styles.tourTitle} title={tour.name}>
              {tour.name}
            </h3>
          </div>

          <div className={styles.tourDetails}>
            <div className={styles.tourDetailItem}>
              <svg
                className={styles.tourIcon}
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                aria-hidden="true"
              >
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
              <span className={styles.tourDetailText}>{formatDateShort(tour.date)}</span>
            </div>

            <div className={styles.tourDetailItem}>
              <svg
                className={styles.tourIcon}
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                aria-hidden="true"
              >
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
              <span className={styles.tourDetailText}>
                {tour.participants} {tour.participants === 1 ? 'Guest' : 'Guests'}
              </span>
            </div>
          </div>

          <div className={styles.tourPriceRow}>
            <span className={styles.tourPriceLabel}>Tour price</span>
            <span className={styles.tourPriceValue}>
              {formatCurrency(priceBreakdown.tourBasePrice)}
            </span>
          </div>
        </div>
      </div>

      {/* Add-ons Section */}
      {addOns.length > 0 && (
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>
            Add-ons
            {addOns.length > 1 && (
              <span className={styles.itemCount}>({addOns.length})</span>
            )}
          </h3>
          <div className={styles.addOnsList}>
            {visibleAddons.map((addon) => (
              <div key={addon.id} className={styles.addOnRow}>
                <div className={styles.addOnInfo}>
                  <span className={styles.addOnName} title={addon.name}>
                    {addon.name}
                  </span>
                  {addon.quantity && addon.quantity > 1 && (
                    <span className={styles.addOnQty}>Qty: {addon.quantity}</span>
                  )}
                </div>
                <span className={styles.addOnPrice}>
                  {formatCurrency(addon.price * (addon.quantity || 1))}
                </span>
              </div>
            ))}
          </div>

          {hasMoreAddons && !showAllAddons && (
            <button
              className={styles.showMoreButton}
              onClick={() => setShowAllAddons(true)}
              aria-label={`Show ${addOns.length - MAX_VISIBLE_ADDONS} more add-ons`}
            >
              Show {addOns.length - MAX_VISIBLE_ADDONS} more add-on{addOns.length - MAX_VISIBLE_ADDONS > 1 ? 's' : ''}
            </button>
          )}

          {showAllAddons && hasMoreAddons && (
            <button
              className={styles.showMoreButton}
              onClick={() => setShowAllAddons(false)}
              aria-label="Show less add-ons"
            >
              Show less
            </button>
          )}
        </div>
      )}

      {/* Price Breakdown */}
      <div className={styles.priceBreakdownSection}>
        <div className={styles.priceRow}>
          <span className={styles.priceLabel}>Subtotal</span>
          <span className={styles.priceValue}>
            {formatCurrency(priceBreakdown.subtotal)}
          </span>
        </div>

        <div className={styles.priceRow}>
          <span className={styles.priceLabel}>
            Tax (GST 10%)
          </span>
          <span className={styles.priceValue}>
            {formatCurrency(priceBreakdown.gst)}
          </span>
        </div>

        <div className={styles.totalRow}>
          <span className={styles.totalLabel}>Total</span>
          <span className={styles.totalValue}>
            {formatCurrency(priceBreakdown.grandTotal)}
          </span>
        </div>

        <div className={styles.totalCurrency}>
          All prices in AUD
        </div>
      </div>

      {/* Trust Signals */}
      <div className={styles.trustSection}>
        <div className={styles.trustBadges}>
          <div className={styles.trustBadge}>
            <svg
              className={styles.trustIcon}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              aria-hidden="true"
            >
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
            <span className={styles.trustText}>Secure payment</span>
          </div>

          <div className={styles.trustBadge}>
            <svg
              className={styles.trustIcon}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              aria-hidden="true"
            >
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
            <span className={styles.trustText}>Protected booking</span>
          </div>
        </div>

        <div className={styles.infoBox}>
          <svg
            className={styles.infoIcon}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            aria-hidden="true"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="16" x2="12" y2="12" />
            <line x1="12" y1="8" x2="12.01" y2="8" />
          </svg>
          <div className={styles.infoText}>
            <p>Confirmation sent upon payment. Free cancellation up to 24 hours before departure.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
