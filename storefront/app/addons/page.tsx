'use client';

import React, { useState, useCallback, useMemo, memo, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import dynamic from 'next/dynamic';
import { addOnsData, addOnCategories } from '../../lib/tours-data';
import { useCartContext } from '@/lib/context/CartContext';
import type { Addon } from '@/lib/types/cart';
import { useAnnouncer, useQuantityKeyboard } from '../../lib/hooks';
import { getAddonImageByHandle, getAddonImageById, getFallbackAddonImage } from '../../lib/utils/addon-images';
import styles from './addons.module.css';

// Performance: Dynamic import for heavy components (lazy loading)
const AddOnDrawer = dynamic(() => import('../../components/Checkout/AddOnDrawer'), {
  loading: () => null,
  ssr: false,
});

// Memoized components to prevent unnecessary re-renders
const CategoryButton = memo(({
  category,
  isActive,
  onClick
}: {
  category: string;
  isActive: boolean;
  onClick: () => void;
}) => (
  <button
    onClick={onClick}
    className={`${styles.categoryBtn} ${isActive ? styles.active : ''}`}
    aria-pressed={isActive}
    aria-label={`Filter by ${category}`}
  >
    {category}
  </button>
));
CategoryButton.displayName = 'CategoryButton';

// Accessible Quantity Control Component
const QuantityControl = memo(({
  value,
  onChange,
  onRemove,
  addonName,
  addonId,
}: {
  value: number;
  onChange: (value: number) => void;
  onRemove: () => void;
  addonName: string;
  addonId: string;
}) => {
  const { handleKeyDown, ...ariaProps } = useQuantityKeyboard(value, onChange, 0, 10);
  const { announceQuantityChange } = useAnnouncer();

  const handleIncrement = () => {
    const newValue = Math.min(10, value + 1);
    onChange(newValue);
    announceQuantityChange(addonName, newValue);
  };

  const handleDecrement = () => {
    const newValue = Math.max(0, value - 1);
    if (newValue === 0) {
      onRemove();
    } else {
      onChange(newValue);
      announceQuantityChange(addonName, newValue);
    }
  };

  return (
    <div className={styles.quantityControl}>
      <button
        onClick={handleDecrement}
        className={styles.quantityBtn}
        aria-label={`Decrease quantity of ${addonName}`}
        type="button"
      >
        -
      </button>
      <div
        role="spinbutton"
        tabIndex={0}
        className={styles.quantity}
        onKeyDown={handleKeyDown}
        {...ariaProps}
        aria-label={`Quantity of ${addonName}`}
      >
        {value}
      </div>
      <button
        onClick={handleIncrement}
        className={styles.quantityBtn}
        aria-label={`Increase quantity of ${addonName}`}
        type="button"
      >
        +
      </button>
      <button
        onClick={onRemove}
        className={styles.removeBtn}
        aria-label={`Remove ${addonName} from cart`}
        type="button"
      >
        Remove
      </button>
    </div>
  );
});
QuantityControl.displayName = 'QuantityControl';

const AddOnCard = memo(({
  addon,
  quantity,
  onAdd,
  onRemove,
  onQuantityChange,
  index
}: any) => {
  const isAdded = quantity > 0;
  const priceId = `price-${addon.id}`;
  const descId = `desc-${addon.id}`;

  // Get image data from manifest
  const imageData = getAddonImageByHandle(addon.id) || getAddonImageById(addon.id, addon.name) || getFallbackAddonImage();

  return (
    <article
      key={addon.id}
      className={styles.addonCard}
      role="article"
      aria-labelledby={`addon-${addon.id}`}
      aria-describedby={descId}
    >
      {/* Add-on Image */}
      <div className={styles.addonImageWrapper}>
        <Image
          src={imageData.image_path}
          alt={imageData.alt_text}
          width={1200}
          height={800}
          loading={index < 4 ? "eager" : "lazy"}
          priority={index < 4}
          quality={85}
          className={styles.addonImage}
          sizes="(max-width: 768px) 100vw, (max-width: 1024px) 90vw, 800px"
        />
      </div>

      <div className={styles.addonHeader}>
        <div>
          <h3 id={`addon-${addon.id}`} className={styles.addonName}>{addon.name}</h3>
          <span className={styles.addonCategory} aria-label={`Category: ${addon.category}`}>
            {addon.category}
          </span>
        </div>
        <div
          className={styles.priceTag}
          id={priceId}
          aria-label={`Price: ${addon.price} Australian dollars`}
        >
          <span className={styles.price} aria-hidden="true">AUD ${addon.price}</span>
        </div>
      </div>

      <p id={descId} className={styles.addonDescription}>{addon.description}</p>

      <div className={styles.addonActions}>
        {!isAdded ? (
          <button
            onClick={onAdd}
            className={styles.addBtn}
            aria-label={`Add ${addon.name} to cart for $${addon.price}`}
            type="button"
          >
            Add to Cart
          </button>
        ) : (
          <QuantityControl
            value={quantity}
            onChange={(newQuantity) => onQuantityChange(addon.id, newQuantity)}
            onRemove={onRemove}
            addonName={addon.name}
            addonId={addon.id}
          />
        )}
      </div>
    </article>
  );
}, (prevProps, nextProps) => {
  // Custom comparison - only re-render if these props change
  return (
    prevProps.addon.id === nextProps.addon.id &&
    prevProps.quantity === nextProps.quantity &&
    prevProps.addon.price === nextProps.addon.price
  );
});
AddOnCard.displayName = 'AddOnCard';

export default function AddOnsPage() {
  const router = useRouter();
  const { cart, addAddonToCart, removeAddonFromCart, updateAddonQuantity } = useCartContext();
  const [selectedCategory, setSelectedCategory] = useState('All Add-ons');
  const { announceAddToCart, announceRemoveFromCart, announceTotalChange } = useAnnouncer();
  const previousTotal = useRef(cart.total_cents);

  // Performance: Memoize filtered add-ons to prevent recalculation on every render
  const filteredAddOns = useMemo(() => {
    return selectedCategory === 'All Add-ons'
      ? addOnsData
      : addOnsData.filter((addon) => addon.category === selectedCategory);
  }, [selectedCategory]);

  // Performance: Memoize callbacks to prevent re-creating functions on every render
  const getAddOnQuantity = useCallback((addOnId: string): number => {
    const cartAddon = cart.addons.find((item) => item.addon.id === addOnId);
    return cartAddon ? cartAddon.quantity : 0;
  }, [cart.addons]);

  const handleAddOn = useCallback(async (addOn: typeof addOnsData[0]) => {
    try {
      // Convert old addon format to new Addon type
      const addon: Addon = {
        id: addOn.id,
        variant_id: '', // Will be set by the backend
        title: addOn.name,
        description: addOn.description,
        price_cents: Math.round(addOn.price * 100), // Convert dollars to cents
        pricing_type: 'per_booking',
        category: addOn.category,
        available: true,
      };
      await addAddonToCart({ addon, quantity: 1 });
      announceAddToCart(addOn.name, 1);
    } catch (error) {
      console.error('Error adding addon:', error);
    }
  }, [addAddonToCart, announceAddToCart]);

  const handleRemoveAddOn = useCallback(async (addOnId: string) => {
    const addon = addOnsData.find((a) => a.id === addOnId);
    try {
      await removeAddonFromCart(addOnId);
      if (addon) {
        announceRemoveFromCart(addon.name);
      }
    } catch (error) {
      console.error('Error removing addon:', error);
    }
  }, [removeAddonFromCart, announceRemoveFromCart]);

  const handleQuantityChange = useCallback(async (addOnId: string, quantity: number) => {
    try {
      if (quantity <= 0) {
        await removeAddonFromCart(addOnId);
      } else {
        await updateAddonQuantity(addOnId, quantity);
      }
    } catch (error) {
      console.error('Error updating addon quantity:', error);
    }
  }, [removeAddonFromCart, updateAddonQuantity]);

  const handleContinue = useCallback(() => {
    router.push('/checkout');
  }, [router]);

  const handleSkip = useCallback(() => {
    router.push('/checkout');
  }, [router]);

  const handleCategoryChange = useCallback((category: string) => {
    setSelectedCategory(category);
  }, []);

  // Announce total changes
  useEffect(() => {
    if (previousTotal.current !== cart.total_cents && previousTotal.current !== 0) {
      announceTotalChange(cart.total_cents / 100); // Convert cents to dollars for announcement
    }
    previousTotal.current = cart.total_cents;
  }, [cart.total_cents, announceTotalChange]);

  // Show loading state while cart is loading
  if (cart.isLoading) {
    return (
      <main className={styles.noTour}>
        <p>Loading cart...</p>
      </main>
    );
  }

  // Check if user has selected a tour
  if (!cart.tour_booking) {
    return (
      <main className={styles.noTour}>
        <h1>No Tour Selected</h1>
        <p>Please select a tour first before choosing add-ons.</p>
        <Link href="/tours" className={styles.backBtn}>
          Browse Tours
        </Link>
      </main>
    );
  }

  return (
    <main className={styles.addonsPage}>
      {/* Skip link for screen readers */}
      <a href="#main-content" className={styles.skipLink}>
        Skip to main content
      </a>

      {/* Breadcrumb */}
      <nav className={styles.breadcrumb} aria-label="Breadcrumb">
        <ol>
          <li><Link href="/">Home</Link></li>
          <li><Link href="/tours">Tours</Link></li>
          <li><Link href={`/tours/${cart.tour_booking.tour.handle}`}>{cart.tour_booking.tour.title}</Link></li>
          <li aria-current="page">Add-ons</li>
        </ol>
      </nav>

      <div className={styles.addonsContent}>
        {/* Left Column - Add-ons Selection */}
        <div className={styles.leftColumn} id="main-content">
          <header className={styles.header}>
            <h1>Enhance Your Experience</h1>
            <p>Choose from our selection of premium add-ons to make your adventure even more memorable.</p>
          </header>

          {/* Category Filter */}
          <section className={styles.filterSection} aria-label="Category filters">
            <div className={styles.categories} role="group">
              {addOnCategories.map((category) => (
                <CategoryButton
                  key={category}
                  category={category}
                  isActive={selectedCategory === category}
                  onClick={() => handleCategoryChange(category)}
                />
              ))}
            </div>
          </section>

          {/* Add-ons Grid */}
          <section className={styles.addonsGrid} aria-label="Available add-ons" role="region">
            {filteredAddOns.map((addon, index) => {
              const quantity = getAddOnQuantity(addon.id);

              return (
                <AddOnCard
                  key={addon.id}
                  addon={addon}
                  quantity={quantity}
                  index={index}
                  onAdd={() => handleAddOn(addon)}
                  onRemove={() => handleRemoveAddOn(addon.id)}
                  onQuantityChange={handleQuantityChange}
                />
              );
            })}
          </section>
        </div>

        {/* Right Column - Cart Summary */}
        <aside className={styles.cartSummary} role="region" aria-label="Booking summary">
          <h2>Your Booking</h2>

          {/* Tour Details */}
          <div className={styles.tourSummary}>
            <h3>Tour</h3>
            <div className={styles.tourInfo}>
              <div>
                <p className={styles.tourName}>{cart.tour_booking.tour.title}</p>
                <p className={styles.tourMeta}>
                  <time dateTime={cart.tour_booking.start_date}>
                    {new Date(cart.tour_booking.start_date).toLocaleDateString('en-AU', {
                      weekday: 'short',
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </time>
                </p>
                <p className={styles.tourMeta}>
                  {cart.tour_booking.participants} participant{cart.tour_booking.participants !== 1 ? 's' : ''}
                </p>
              </div>
              <p className={styles.itemPrice} aria-label={`Tour price: ${(cart.tour_booking.total_price_cents / 100).toFixed(2)} Australian dollars`}>
                <span aria-hidden="true">AUD ${(cart.tour_booking.total_price_cents / 100).toFixed(2)}</span>
              </p>
            </div>
          </div>

          {/* Add-ons Details */}
          {cart.addons.length > 0 && (
            <div className={styles.addonsSummary}>
              <h3>Add-ons</h3>
              <ul className={styles.addonsList} role="list">
                {cart.addons.map((item) => (
                  <li key={item.addon.id} className={styles.addonItem}>
                    <div>
                      <p className={styles.addonItemName}>{item.addon.title}</p>
                      <p className={styles.addonItemMeta}>Quantity: {item.quantity}</p>
                    </div>
                    <p className={styles.itemPrice} aria-label={`Subtotal: ${(item.calculated_price_cents / 100).toFixed(2)} Australian dollars`}>
                      <span aria-hidden="true">AUD ${(item.calculated_price_cents / 100).toFixed(2)}</span>
                    </p>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Total */}
          <div className={styles.totalSection} role="status" aria-live="polite" aria-atomic="true">
            <div className={styles.totalRow}>
              <span>Total</span>
              <span className={styles.totalAmount} aria-label={`Total: ${(cart.total_cents / 100).toFixed(2)} Australian dollars`}>
                <span aria-hidden="true">AUD ${(cart.total_cents / 100).toFixed(2)}</span>
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className={styles.actionButtons}>
            <button
              onClick={handleContinue}
              className={styles.continueBtn}
              aria-label="Continue to checkout"
              type="button"
            >
              Continue to Checkout
            </button>
            <button
              onClick={handleSkip}
              className={styles.skipBtn}
              aria-label="Skip add-ons and go to checkout"
              type="button"
            >
              Skip Add-ons
            </button>
          </div>

          {/* Trust Badges */}
          <div className={styles.trustBadges} role="list" aria-label="Trust badges">
            <div className={styles.badge} role="listitem">
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="currentColor"
                aria-hidden="true"
                focusable="false"
              >
                <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z"/>
              </svg>
              <span>Secure Booking</span>
            </div>
            <div className={styles.badge} role="listitem">
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="currentColor"
                aria-hidden="true"
                focusable="false"
              >
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
              </svg>
              <span>Free Cancellation</span>
            </div>
          </div>
        </aside>
      </div>
    </main>
  );
}
