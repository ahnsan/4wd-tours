'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useAddOns } from '../../lib/hooks/useAddOns';
import { useCartAddons } from '../../lib/hooks/useCart';
import type { Addon } from '../../lib/types/cart';
import styles from './TourAddOns.module.css';

export default function TourAddOns() {
  const { addons, isLoading, error } = useAddOns();
  const { addAddon } = useCartAddons();

  // Don't render if loading or no add-ons available
  if (isLoading || error || addons.length === 0) {
    return null;
  }

  // Show only first 6 add-ons in the preview
  const previewAddons = addons.slice(0, 6);

  const handleAddToCart = (addon: Addon) => {
    addAddon({ addon, quantity: 1 });
  };

  const formatPrice = (price_cents: number, pricingType: string) => {
    // Validate price_cents is a valid number (defensive coding)
    const priceCents = typeof price_cents === 'number' && !isNaN(price_cents)
      ? price_cents
      : 0;

    // Convert cents to dollars for display (Medusa standard)
    const priceDollars = priceCents / 100;
    const formattedPrice = `$${priceDollars.toFixed(2)}`;

    switch (pricingType) {
      case 'per_day':
        return `${formattedPrice}/day`;
      case 'per_person':
        return `${formattedPrice}/person`;
      case 'per_booking':
      default:
        return formattedPrice;
    }
  };

  return (
    <section className={styles.addOnsSection} aria-labelledby="add-ons-heading">
      <div className={styles.header}>
        <h2 id="add-ons-heading" className={styles.title}>
          Available Add-Ons
        </h2>
        <p className={styles.subtitle}>
          Enhance your adventure with optional extras
        </p>
      </div>

      <div className={styles.scrollContainer}>
        <div className={styles.addOnsRow} role="list" aria-label="Available add-ons">
          {previewAddons.map((addon) => (
            <div
              key={addon.id}
              className={styles.addOnCard}
              role="listitem"
            >
              <div className={styles.imageContainer}>
                <Image
                  src={addon.icon || '/images/addons/default-addon.svg'}
                  alt={addon.title}
                  fill
                  sizes="(max-width: 768px) 280px, (max-width: 1200px) 240px, 260px"
                  className={styles.image}
                  style={{ objectFit: 'cover' }}
                  loading="lazy"
                  quality={85}
                />
                {addon.category && (
                  <span className={styles.categoryBadge} aria-label={`Category: ${addon.category}`}>
                    {addon.category}
                  </span>
                )}
              </div>

              <div className={styles.content}>
                <h3 className={styles.addOnTitle}>{addon.title}</h3>

                <p className={styles.description}>
                  {addon.description.length > 80
                    ? `${addon.description.substring(0, 80)}...`
                    : addon.description}
                </p>

                <div className={styles.footer}>
                  <div className={styles.priceContainer}>
                    <span className={styles.price}>
                      {formatPrice(addon.price_cents, addon.pricing_type)}
                    </span>
                  </div>

                  <button
                    className={styles.addButton}
                    onClick={() => handleAddToCart(addon)}
                    aria-label={`Add ${addon.title} to cart`}
                  >
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 16 16"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                      aria-hidden="true"
                    >
                      <path
                        d="M8 3.5V12.5M3.5 8H12.5"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                      />
                    </svg>
                    Add
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className={styles.viewAllContainer}>
        <Link
          href="/checkout/add-ons"
          className={styles.viewAllLink}
          aria-label="View all available add-ons"
        >
          View All Add-ons
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            <path
              d="M6 12L10 8L6 4"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </Link>
      </div>
    </section>
  );
}
