'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import type { CartState } from '../../lib/types/cart';
import { formatCurrency, type PricingContext } from '../../lib/utils/pricing';
import styles from './BookingSummary.module.css';

interface BookingSummaryProps {
  cart: CartState;
  showEditLinks?: boolean;
  compact?: boolean;
  currentStep?: 'tour-selection' | 'addons' | 'checkout' | 'confirmation';
  onEditTour?: () => void;
  onEditAddons?: () => void;
}

export default function BookingSummary({
  cart,
  showEditLinks = true,
  compact = false,
  currentStep = 'checkout',
  onEditTour,
  onEditAddons,
}: BookingSummaryProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile viewport
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
      // Auto-collapse on mobile
      if (window.innerWidth < 768 && currentStep !== 'checkout') {
        setIsCollapsed(true);
      }
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, [currentStep]);

  // Calculate pricing context for addons
  const pricingContext: PricingContext = {
    duration_days: cart.tour_booking?.tour.duration_days || 1,
    participants: cart.tour_booking?.participants || 1,
    tour_base_price_cents: cart.tour_booking?.tour.base_price_cents || 0,
  };

  // Calculate tour total (convert from cents to dollars)
  const tourTotal = cart.tour_booking
    ? (cart.tour_booking.tour.base_price_cents / 100) * cart.tour_booking.participants
    : 0;

  // Calculate addons total (using real pricing logic from cart, convert from cents to dollars)
  const addonsTotal = cart.addons?.reduce((sum, addon) => {
    return sum + (addon.calculated_price_cents / 100);
  }, 0) || 0;

  // Subtotal (before tax)
  const subtotal = tourTotal + addonsTotal;

  // Calculate GST (10% in Australia)
  const gst = Math.round(subtotal * 0.1);

  // Grand total
  const grandTotal = subtotal + gst;

  // Format date for display
  const formatTourDate = (dateString: string | null) => {
    if (!dateString) return 'Date not selected';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-AU', {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return dateString;
    }
  };

  // Handle empty cart
  if (!cart.tour_booking) {
    return (
      <aside
        className={`${styles.summary} ${compact ? styles.compact : ''}`}
        role="complementary"
        aria-label="Booking summary"
      >
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
          </div>
          <h3 className={styles.emptyTitle}>No Tour Selected</h3>
          <p className={styles.emptyText}>
            Start by selecting a tour to begin your booking
          </p>
          <Link href="/tours" className={styles.browseTours}>
            Browse Tours
          </Link>
        </div>
      </aside>
    );
  }

  // Progress steps
  const progressSteps = [
    { id: 'tour-selection', label: 'Select Tour', completed: !!cart.tour_booking },
    { id: 'addons', label: 'Add-ons', completed: currentStep !== 'tour-selection' },
    { id: 'checkout', label: 'Checkout', completed: currentStep === 'confirmation' },
  ];

  const currentStepIndex = progressSteps.findIndex(s => s.id === currentStep);

  return (
    <aside
      className={`${styles.summary} ${compact ? styles.compact : ''} ${isCollapsed ? styles.collapsed : ''}`}
      role="complementary"
      aria-label="Booking summary"
    >
      {/* Mobile Header */}
      {isMobile && (
        <button
          type="button"
          className={styles.mobileHeader}
          onClick={() => setIsCollapsed(!isCollapsed)}
          aria-expanded={!isCollapsed}
          aria-controls="booking-summary-content"
        >
          <div className={styles.mobileHeaderContent}>
            <h2 className={styles.mobileTitle}>
              Booking Summary
              {cart.addons?.length > 0 && (
                <span className={styles.addonBadge}>{cart.addons?.length}</span>
              )}
            </h2>
            <div className={styles.mobileTotal}>
              {formatCurrency(grandTotal)}
            </div>
          </div>
          <svg
            className={styles.collapseIcon}
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      )}

      {/* Summary Content */}
      <div id="booking-summary-content" className={styles.content}>
        {/* Progress Indicator */}
        {!compact && currentStep !== 'confirmation' && (
          <div className={styles.progress}>
            <h3 className={styles.progressTitle}>Booking Progress</h3>
            <div className={styles.progressSteps}>
              {progressSteps.map((step, index) => (
                <div
                  key={step.id}
                  className={`${styles.progressStep} ${
                    index <= currentStepIndex ? styles.active : ''
                  } ${step.completed ? styles.completed : ''}`}
                >
                  <div className={styles.stepIndicator}>
                    {step.completed ? (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      <span>{index + 1}</span>
                    )}
                  </div>
                  <span className={styles.stepLabel}>{step.label}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tour Details */}
        <section className={styles.section} aria-labelledby="tour-details-heading">
          <div className={styles.sectionHeader}>
            <h3 id="tour-details-heading" className={styles.sectionTitle}>
              Tour Package
            </h3>
            {showEditLinks && onEditTour && (
              <button
                type="button"
                onClick={onEditTour}
                className={styles.editLink}
                aria-label="Edit tour selection"
              >
                Edit
              </button>
            )}
          </div>

          <div className={styles.tourCard}>
            <div className={styles.tourHeader}>
              <h4 className={styles.tourTitle}>{cart.tour_booking.tour.title}</h4>
              <div className={styles.tourPrice}>
                {formatCurrency(tourTotal)}
              </div>
            </div>

            <dl className={styles.tourDetails}>
              <div className={styles.tourDetail}>
                <dt>Duration:</dt>
                <dd>{cart.tour_booking.tour.duration_days} day{cart.tour_booking.tour.duration_days > 1 ? 's' : ''}</dd>
              </div>
              <div className={styles.tourDetail}>
                <dt>Participants:</dt>
                <dd>{cart.tour_booking.participants} {cart.tour_booking.participants > 1 ? 'people' : 'person'}</dd>
              </div>
              {cart.tour_booking.start_date && (
                <div className={styles.tourDetail}>
                  <dt>Start Date:</dt>
                  <dd>{formatTourDate(cart.tour_booking.start_date)}</dd>
                </div>
              )}
              <div className={styles.tourDetail}>
                <dt>Price per person:</dt>
                <dd>{formatCurrency(cart.tour_booking.tour.base_price_cents / 100)}</dd>
              </div>
            </dl>
          </div>
        </section>

        {/* Add-ons */}
        {cart.addons?.length > 0 && (
          <section className={styles.section} aria-labelledby="addons-heading">
            <div className={styles.sectionHeader}>
              <h3 id="addons-heading" className={styles.sectionTitle}>
                Add-ons ({cart.addons?.length})
              </h3>
              {showEditLinks && onEditAddons && (
                <button
                  type="button"
                  onClick={onEditAddons}
                  className={styles.editLink}
                  aria-label="Edit add-ons"
                >
                  Edit
                </button>
              )}
            </div>

            <ul className={styles.addonsList} role="list">
              {cart.addons?.map((cartAddon) => (
                <li key={cartAddon.addon.id} className={styles.addonItem}>
                  <div className={styles.addonInfo}>
                    <span className={styles.addonName}>{cartAddon.addon.title}</span>
                    <span className={styles.addonMeta}>
                      {cartAddon.addon.pricing_type === 'per_day' &&
                        `${formatCurrency(cartAddon.addon.price_cents / 100)}/day × ${cart.tour_booking?.tour.duration_days || 1} days`}
                      {cartAddon.addon.pricing_type === 'per_person' &&
                        `${formatCurrency(cartAddon.addon.price_cents / 100)}/person × ${cart.tour_booking?.participants || 1} people`}
                      {cartAddon.addon.pricing_type === 'per_booking' &&
                        'Per booking'}
                      {cartAddon.quantity > 1 && ` × ${cartAddon.quantity}`}
                    </span>
                  </div>
                  <div className={styles.addonPrice}>
                    {formatCurrency(cartAddon.calculated_price_cents / 100)}
                  </div>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Price Breakdown */}
        <section className={styles.section} aria-labelledby="price-breakdown-heading">
          <h3 id="price-breakdown-heading" className={styles.sectionTitle}>
            Price Breakdown
          </h3>

          <dl className={styles.priceBreakdown}>
            {/* Tour Subtotal */}
            <div className={styles.priceRow}>
              <dt>Tour Package:</dt>
              <dd>{formatCurrency(tourTotal)}</dd>
            </div>

            {/* Addons Subtotal */}
            {cart.addons?.length > 0 && (
              <div className={styles.priceRow}>
                <dt>Add-ons Total:</dt>
                <dd>{formatCurrency(addonsTotal)}</dd>
              </div>
            )}

            {/* Subtotal */}
            <div className={`${styles.priceRow} ${styles.subtotalRow}`}>
              <dt>Subtotal:</dt>
              <dd>{formatCurrency(subtotal)}</dd>
            </div>

            {/* GST */}
            <div className={styles.priceRow}>
              <dt>GST (10%):</dt>
              <dd>{formatCurrency(gst)}</dd>
            </div>

            {/* Grand Total */}
            <div className={`${styles.priceRow} ${styles.totalRow}`}>
              <dt>Total (AUD):</dt>
              <dd aria-live="polite" aria-atomic="true">
                {formatCurrency(grandTotal)}
              </dd>
            </div>
          </dl>
        </section>

        {/* Trust Badges */}
        {!compact && (
          <div className={styles.trustBadges}>
            <div className={styles.badge}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" strokeWidth={2} />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" strokeWidth={2} />
              </svg>
              <span>Secure Checkout</span>
            </div>
            <div className={styles.badge}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>Money-back Guarantee</span>
            </div>
            <div className={styles.badge}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>Best Price Guarantee</span>
            </div>
          </div>
        )}

        {/* Support Note */}
        {!compact && currentStep === 'checkout' && (
          <div className={styles.supportNote}>
            <p>
              Questions? Call us at <strong>(07) 5555 1234</strong> or email{' '}
              <strong>info@sunshinecoast4wd.com.au</strong>
            </p>
          </div>
        )}
      </div>
    </aside>
  );
}
