// Tour card component for displaying tour information
'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import PriceDisplay from './PriceDisplay';
import styles from './TourCard.module.css';
import type { TourProduct } from '../../lib/types/tour';
import { getLowestPrice, formatPrice } from '../../lib/utils/pricing';

interface TourCardProps {
  tour: TourProduct;
}

export default function TourCard({ tour }: TourCardProps) {
  // Get the lowest price using the utility function
  const price = getLowestPrice(tour);
  const lowestPrice = price ? price.amount : null;
  const duration = tour.metadata?.duration || 'Contact for duration';

  // Truncate description to 120 characters
  const truncateDescription = (text: string | null | undefined, maxLength: number = 120) => {
    if (!text) return 'Experience the beauty of Sunshine Coast with this amazing 4WD adventure.';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength).trim() + '...';
  };

  return (
    <article className={styles.tourCard}>
      <Link href={`/tours/${tour.handle}`} className={styles.cardLink}>
        <div className={styles.imageContainer}>
          <Image
            src={tour.thumbnail || 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop'}
            alt={tour.title}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className={styles.tourImage}
            style={{ objectFit: 'cover' }}
            priority={false}
            loading="lazy"
            quality={85}
          />
          {tour.metadata?.featured && (
            <span className={styles.featuredBadge} aria-label="Featured tour">
              Featured
            </span>
          )}
        </div>

        <div className={styles.cardContent}>
          <h3 className={styles.tourTitle}>{tour.title}</h3>

          <div className={styles.tourMeta}>
            <span className={styles.duration} aria-label={`Duration: ${duration}`}>
              <svg
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden="true"
              >
                <path
                  d="M8 14.5C11.5899 14.5 14.5 11.5899 14.5 8C14.5 4.41015 11.5899 1.5 8 1.5C4.41015 1.5 1.5 4.41015 1.5 8C1.5 11.5899 4.41015 14.5 8 14.5Z"
                  stroke="currentColor"
                  strokeWidth="1.5"
                />
                <path
                  d="M8 4.5V8H11.5"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
              </svg>
              {duration}
            </span>

            {lowestPrice && (
              <div className={styles.price}>
                <span className={styles.priceLabel}>From</span>
                <PriceDisplay amount={lowestPrice} className={styles.priceAmount} />
              </div>
            )}
          </div>

          <p className={styles.description}>
            {truncateDescription(tour.description)}
          </p>

          <button className={styles.viewDetailsBtn} aria-label={`View details for ${tour.title}`}>
            View Details
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
          </button>
        </div>
      </Link>
    </article>
  );
}
