'use client';

import React, { useState, useCallback, useRef, useEffect, memo } from 'react';
import Image from 'next/image';
import type { Addon } from '../../lib/types/cart';
import { getAddonImageByHandle, getAddonImageById, getFallbackAddonImage } from '../../lib/utils/addon-images';
import styles from './AddOnCard.module.css';

interface AddOnCardProps {
  addon: Addon;
  isSelected: boolean;
  quantity: number;
  onToggle: (addon: Addon) => void;
  onQuantityChange: (addonId: string, quantity: number) => void;
  onLearnMore?: (addon: Addon) => void;
  tourDays?: number;
  participants?: number;
}

// Icon mapping for add-ons
const IconMap: Record<string, string> = {
  shield: '🛡️',
  tent: '⛺',
  camera: '📷',
  map: '🗺️',
  utensils: '🍽️',
  book: '📖',
  default: '🎯',
};

// Debounce utility for quantity changes to avoid excessive re-renders
function useDebounce<T extends (...args: any[]) => void>(
  callback: T,
  delay: number
): (...args: Parameters<T>) => void {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return useCallback(
    (...args: Parameters<T>) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = setTimeout(() => {
        callback(...args);
      }, delay);
    },
    [callback, delay]
  );
}

const AddOnCard = memo(function AddOnCard({
  addon,
  isSelected,
  quantity,
  onToggle,
  onQuantityChange,
  onLearnMore,
  tourDays = 1,
  participants = 1,
}: AddOnCardProps) {
  const [localQuantity, setLocalQuantity] = useState(quantity);

  // Extract icon name from path (e.g., '/images/icons/tent.svg' -> 'tent')
  const getIconName = (iconPath: string | undefined): string => {
    if (!iconPath) return 'default';
    const match = iconPath.match(/\/([^/]+)\.(svg|png|jpg)$/);
    return match && match[1] ? match[1] : 'default';
  };

  const iconName = getIconName(addon.icon || addon.category);
  const icon = IconMap[iconName] || IconMap.default;

  // Get image data from manifest
  const imageData = getAddonImageByHandle(addon.id) || getAddonImageById(addon.id, addon.title) || getFallbackAddonImage();

  // Debounce quantity changes to reduce parent re-renders (300ms)
  const debouncedQuantityChange = useDebounce(onQuantityChange, 300);

  // Calculate display price based on pricing type (convert cents to dollars)
  const getDisplayPrice = () => {
    // CRITICAL: Validate ALL inputs before calculations
    // Validate price_cents exists and is a valid number (Medusa standard: prices in cents)
    const priceCents = typeof addon.price_cents === 'number' && !isNaN(addon.price_cents)
      ? addon.price_cents
      : 0;

    // Validate tourDays (handle undefined, null, NaN, and invalid values)
    const validTourDays = typeof tourDays === 'number' && tourDays > 0 && !isNaN(tourDays)
      ? tourDays
      : 1;

    // Validate participants (handle undefined, null, NaN, and invalid values)
    const validParticipants = typeof participants === 'number' && participants > 0 && !isNaN(participants)
      ? participants
      : 1;

    // Log error if invalid data detected (helps debugging)
    if (priceCents === 0 && addon.price_cents !== 0) {
      console.error('[AddOnCard] Invalid price_cents for addon:', {
        addon_id: addon.id,
        title: addon.title,
        price_cents: addon.price_cents,
        type: typeof addon.price_cents,
      });
    }

    if (validTourDays !== tourDays) {
      console.warn('[AddOnCard] Invalid tourDays, using fallback:', {
        addon_id: addon.id,
        tourDays,
        fallback: validTourDays,
      });
    }

    if (validParticipants !== participants) {
      console.warn('[AddOnCard] Invalid participants, using fallback:', {
        addon_id: addon.id,
        participants,
        fallback: validParticipants,
      });
    }

    const basePriceDollars = priceCents / 100;

    switch (addon.pricing_type) {
      case 'per_day':
        return {
          price: basePriceDollars * validTourDays,
          unit: `per item (${validTourDays} day${validTourDays > 1 ? 's' : ''})`,
        };
      case 'per_person':
        return {
          price: basePriceDollars * validParticipants,
          unit: `per item (${validParticipants} person${validParticipants > 1 ? 's' : ''})`,
        };
      case 'per_booking':
      default:
        return {
          price: basePriceDollars,
          unit: 'per booking',
        };
    }
  };

  const { price: displayPrice, unit } = getDisplayPrice();
  const totalPrice = displayPrice * (isSelected ? localQuantity : 0);

  const handleToggle = () => {
    if (!addon.available) return;
    onToggle(addon);
    if (!isSelected) {
      setLocalQuantity(1);
    }
  };

  const handleQuantityChange = useCallback((newQuantity: number) => {
    const validQuantity = Math.max(1, Math.min(99, newQuantity));
    setLocalQuantity(validQuantity);
    // Use debounced version to reduce re-renders
    debouncedQuantityChange(addon.id, validQuantity);
  }, [addon.id, debouncedQuantityChange]);

  const incrementQuantity = () => {
    handleQuantityChange(localQuantity + 1);
  };

  const decrementQuantity = () => {
    if (localQuantity > 1) {
      handleQuantityChange(localQuantity - 1);
    }
  };

  return (
    <article
      className={`${styles.card} ${isSelected ? styles.selected : ''} ${!addon.available ? styles.unavailable : ''}`}
      aria-labelledby={`addon-title-${addon.id}`}
      aria-describedby={`addon-desc-${addon.id} addon-price-${addon.id}`}
      role="listitem"
    >
      {/* Add-on Image */}
      <div className={styles.imageWrapper}>
        <Image
          src={imageData.image_path}
          alt={imageData.alt_text}
          width={1200}
          height={800}
          loading="lazy"
          quality={85}
          className={styles.addonImage}
          sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 400px"
        />
        {!addon.available && (
          <div className={styles.unavailableOverlay}>
            <span>Currently Unavailable</span>
          </div>
        )}
      </div>

      <div className={styles.cardHeader}>
        <input
          type="checkbox"
          id={`addon-checkbox-${addon.id}`}
          checked={isSelected}
          onChange={handleToggle}
          disabled={!addon.available}
          className={styles.checkbox}
          aria-label={`Select ${addon.title}, ${displayPrice.toFixed(2)} dollars ${unit}`}
          aria-describedby={`addon-desc-${addon.id} addon-price-${addon.id}`}
          aria-checked={isSelected}
        />
        <span className={styles.icon} role="img" aria-label={addon.icon || 'add-on icon'}>
          {icon}
        </span>
      </div>

      <div className={styles.cardContent}>
        <h3 id={`addon-title-${addon.id}`} className={styles.title}>
          {addon.title}
        </h3>
        <p id={`addon-desc-${addon.id}`} className={styles.description}>{addon.description}</p>

        {addon.category && (
          <span className={styles.category} aria-label="Category">
            {addon.category}
          </span>
        )}

        {onLearnMore && (
          <button
            type="button"
            onClick={() => onLearnMore(addon)}
            className={styles.learnMoreBtn}
            aria-label={`Learn more about ${addon.title}`}
            aria-describedby={`addon-desc-${addon.id}`}
          >
            Learn more
          </button>
        )}

        <div className={styles.pricing}>
          <div className={styles.priceInfo}>
            <span id={`addon-price-${addon.id}`} className={styles.price} aria-label={`Price: ${displayPrice.toFixed(2)} dollars`}>
              ${displayPrice.toFixed(2)}
            </span>
            <span className={styles.unit}>{unit}</span>
          </div>

          {isSelected && addon.pricing_type !== 'per_booking' && (
            <div className={styles.quantityControl} role="group" aria-label={`Quantity selector for ${addon.title}`}>
              <button
                type="button"
                onClick={decrementQuantity}
                disabled={localQuantity <= 1}
                className={styles.quantityBtn}
                aria-label={`Decrease quantity of ${addon.title}, currently ${localQuantity}`}
              >
                -
              </button>
              <input
                type="number"
                value={localQuantity}
                onChange={(e) => handleQuantityChange(parseInt(e.target.value) || 1)}
                min="1"
                max="99"
                className={styles.quantityInput}
                aria-label={`Quantity of ${addon.title}`}
                aria-valuemin={1}
                aria-valuemax={99}
                aria-valuenow={localQuantity}
              />
              <button
                type="button"
                onClick={incrementQuantity}
                disabled={localQuantity >= 99}
                className={styles.quantityBtn}
                aria-label={`Increase quantity of ${addon.title}, currently ${localQuantity}`}
              >
                +
              </button>
            </div>
          )}
        </div>

        {isSelected && totalPrice > 0 && (
          <div className={styles.totalPrice} aria-live="polite" aria-atomic="true">
            <strong>Total: ${totalPrice.toFixed(2)}</strong>
            <span className="sr-only">
              {addon.title} total cost is ${totalPrice.toFixed(2)} for {localQuantity} {localQuantity === 1 ? 'item' : 'items'}
            </span>
          </div>
        )}

        {!addon.available && (
          <div className={styles.unavailableLabel}>Currently Unavailable</div>
        )}
      </div>
    </article>
  );
}, (prevProps, nextProps) => {
  // Custom comparison function for React.memo
  // Only re-render if these specific props change
  return (
    prevProps.addon.id === nextProps.addon.id &&
    prevProps.isSelected === nextProps.isSelected &&
    prevProps.quantity === nextProps.quantity &&
    prevProps.addon.price_cents === nextProps.addon.price_cents &&
    prevProps.addon.available === nextProps.addon.available &&
    prevProps.tourDays === nextProps.tourDays &&
    prevProps.participants === nextProps.participants
  );
});

export default AddOnCard;
