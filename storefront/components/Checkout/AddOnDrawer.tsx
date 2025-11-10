'use client';

import React, { useEffect, useRef, useCallback, memo } from 'react';
import type { Addon } from '../../lib/types/cart';
import styles from './AddOnDrawer.module.css';

interface AddOnDrawerProps {
  addon: Addon | null;
  isOpen: boolean;
  onClose: () => void;
  onAddToCart?: (addon: Addon) => void;
  tourDays?: number;
  participants?: number;
}

// Performance: Memoize drawer to prevent re-renders when props haven't changed
const AddOnDrawer = memo(function AddOnDrawer({
  addon,
  isOpen,
  onClose,
  onAddToCart,
  tourDays = 1,
  participants = 1,
}: AddOnDrawerProps) {
  const drawerRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  // Focus trap implementation
  const getFocusableElements = useCallback(() => {
    if (!drawerRef.current) return [];
    const focusableSelectors = [
      'a[href]',
      'button:not([disabled])',
      'textarea:not([disabled])',
      'input:not([disabled])',
      'select:not([disabled])',
      '[tabindex]:not([tabindex="-1"])',
    ].join(', ');
    return Array.from(drawerRef.current.querySelectorAll<HTMLElement>(focusableSelectors));
  }, []);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
      return;
    }

    if (e.key === 'Tab') {
      const focusableElements = getFocusableElements();
      if (focusableElements.length === 0) return;

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      if (e.shiftKey) {
        // Shift + Tab (backwards)
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement?.focus();
        }
      } else {
        // Tab (forwards)
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement?.focus();
        }
      }
    }
  }, [getFocusableElements, onClose]);

  // Focus management and accessibility
  useEffect(() => {
    if (!isOpen) return;

    // Save current focus
    previousFocusRef.current = document.activeElement as HTMLElement;

    // Focus first element (close button)
    setTimeout(() => {
      closeButtonRef.current?.focus();
    }, 100);

    // Prevent body scroll
    document.body.style.overflow = 'hidden';

    // Add keyboard listener for focus trap
    document.addEventListener('keydown', handleKeyDown);

    // Announce drawer opened to screen readers
    const announcement = document.createElement('div');
    announcement.setAttribute('role', 'status');
    announcement.setAttribute('aria-live', 'polite');
    announcement.className = 'sr-only';
    announcement.textContent = `Add-on details dialog opened for ${addon?.title || 'item'}`;
    document.body.appendChild(announcement);

    return () => {
      // Restore body scroll
      document.body.style.overflow = 'unset';

      // Remove keyboard listener
      document.removeEventListener('keydown', handleKeyDown);

      // Return focus to previous element
      if (previousFocusRef.current) {
        previousFocusRef.current.focus();
      }

      // Remove announcement if it still exists
      if (announcement.parentNode) {
        document.body.removeChild(announcement);
      }
    };
  }, [isOpen, onClose, handleKeyDown, addon?.title]);

  // Handle backdrop click
  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!addon) return null;

  // Calculate display price (convert cents to dollars)
  const getDisplayPrice = () => {
    const basePriceDollars = addon.price_cents / 100;
    switch (addon.pricing_type) {
      case 'per_day':
        return {
          price: basePriceDollars * tourDays,
          unit: `per item (${tourDays} day${tourDays > 1 ? 's' : ''})`,
          breakdown: `$${basePriceDollars.toFixed(2)} × ${tourDays} day${tourDays > 1 ? 's' : ''}`,
        };
      case 'per_person':
        return {
          price: basePriceDollars * participants,
          unit: `per item (${participants} person${participants > 1 ? 's' : ''})`,
          breakdown: `$${basePriceDollars.toFixed(2)} × ${participants} person${participants > 1 ? 's' : ''}`,
        };
      case 'per_booking':
      default:
        return {
          price: basePriceDollars,
          unit: 'per booking',
          breakdown: 'One-time fee',
        };
    }
  };

  const { price, unit, breakdown } = getDisplayPrice();

  const handleAddToCart = () => {
    if (onAddToCart && addon.available) {
      onAddToCart(addon);
      onClose();
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className={`${styles.backdrop} ${isOpen ? styles.open : ''}`}
        onClick={handleBackdropClick}
        aria-hidden={!isOpen}
      />

      {/* Drawer */}
      <aside
        ref={drawerRef}
        className={`${styles.drawer} ${isOpen ? styles.open : ''}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="drawer-title"
        aria-describedby="drawer-description"
      >
        <div className={styles.drawerHeader}>
          <h2 id="drawer-title" className={styles.drawerTitle}>
            {addon.title}
          </h2>
          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            className={styles.closeButton}
            aria-label="Close dialog"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className={styles.drawerContent}>
          {/* Category Badge */}
          {addon.category && (
            <div className={styles.categoryBadge}>
              {addon.category}
            </div>
          )}

          {/* Description */}
          <div className={styles.descriptionSection}>
            <h3 className={styles.sectionTitle}>About this add-on</h3>
            <p id="drawer-description" className={styles.description}>
              {addon.description}
            </p>
          </div>

          {/* Pricing Details */}
          <div className={styles.pricingSection}>
            <h3 className={styles.sectionTitle}>Pricing</h3>
            <div className={styles.pricingDetails}>
              <div className={styles.priceRow}>
                <span className={styles.priceLabel}>Price:</span>
                <span className={styles.priceValue}>${price.toFixed(2)}</span>
              </div>
              <div className={styles.priceRow}>
                <span className={styles.priceLabel}>Type:</span>
                <span className={styles.priceUnit}>{unit}</span>
              </div>
              <div className={styles.priceRow}>
                <span className={styles.priceLabel}>Calculation:</span>
                <span className={styles.priceBreakdown}>{breakdown}</span>
              </div>
            </div>
          </div>

          {/* Features/Benefits */}
          <div className={styles.featuresSection}>
            <h3 className={styles.sectionTitle}>What's included</h3>
            <ul className={styles.featuresList}>
              <li>High-quality equipment</li>
              <li>Professional service</li>
              <li>Full support throughout your tour</li>
            </ul>
          </div>

          {/* Availability Status */}
          {!addon.available && (
            <div className={styles.unavailableNotice}>
              Currently unavailable
            </div>
          )}
        </div>

        {/* Drawer Footer */}
        <div className={styles.drawerFooter}>
          <div className={styles.footerPrice}>
            <span className={styles.footerPriceLabel}>Total:</span>
            <span className={styles.footerPriceValue}>${price.toFixed(2)}</span>
          </div>
          <button
            type="button"
            onClick={handleAddToCart}
            disabled={!addon.available}
            className={styles.addButton}
            aria-label={`Add ${addon.title} to cart`}
          >
            {addon.available ? 'Add to Cart' : 'Unavailable'}
          </button>
        </div>
      </aside>
    </>
  );
}, (prevProps, nextProps) => {
  // Custom comparison - only re-render if these props change
  return (
    prevProps.isOpen === nextProps.isOpen &&
    prevProps.addon?.id === nextProps.addon?.id &&
    prevProps.tourDays === nextProps.tourDays &&
    prevProps.participants === nextProps.participants
  );
});

export default AddOnDrawer;
