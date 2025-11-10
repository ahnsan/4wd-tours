'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { TourGalleryProps } from '../../lib/types/tour';
import styles from './TourGallery.module.css';

export default function TourGallery({ images, title }: TourGalleryProps) {
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  if (!images || images.length === 0) {
    return null;
  }

  const selectedImage = images[selectedImageIndex];

  if (!selectedImage) return null;

  return (
    <div className={styles.galleryContainer}>
      {/* Main Image Display */}
      <div className={styles.mainImageWrapper}>
        <Image
          src={selectedImage.url}
          alt={selectedImage.alt || `${title} - Image ${selectedImageIndex + 1}`}
          width={800}
          height={600}
          quality={90}
          priority={selectedImageIndex === 0}
          loading={selectedImageIndex === 0 ? 'eager' : 'lazy'}
          className={styles.mainImage}
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 60vw, 800px"
        />

        {/* Image Counter */}
        <div className={styles.imageCounter} aria-live="polite">
          {selectedImageIndex + 1} / {images.length}
        </div>

        {/* Navigation Arrows */}
        {images.length > 1 && (
          <>
            <button
              className={`${styles.navButton} ${styles.navButtonPrev}`}
              onClick={() => setSelectedImageIndex((prev) =>
                prev === 0 ? images.length - 1 : prev - 1
              )}
              aria-label="Previous image"
            >
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>
            <button
              className={`${styles.navButton} ${styles.navButtonNext}`}
              onClick={() => setSelectedImageIndex((prev) =>
                prev === images.length - 1 ? 0 : prev + 1
              )}
              aria-label="Next image"
            >
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
          </>
        )}
      </div>

      {/* Thumbnail Strip */}
      {images.length > 1 && (
        <div className={styles.thumbnailStrip} role="list" aria-label="Image thumbnails">
          {images.map((image, index) => (
            <button
              key={image.id || index}
              className={`${styles.thumbnail} ${
                index === selectedImageIndex ? styles.thumbnailActive : ''
              }`}
              onClick={() => setSelectedImageIndex(index)}
              aria-label={`View image ${index + 1}`}
              aria-current={index === selectedImageIndex ? 'true' : 'false'}
              role="listitem"
            >
              <Image
                src={image.url}
                alt={image.alt || `${title} thumbnail ${index + 1}`}
                width={100}
                height={75}
                quality={60}
                className={styles.thumbnailImage}
                sizes="100px"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
