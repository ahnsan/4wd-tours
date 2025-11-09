/**
 * AddOnCardSkeleton - Loading placeholder for AddOnCard
 *
 * Provides visual feedback during data loading for better perceived performance.
 * Matches the dimensions and layout of the actual AddOnCard component.
 *
 * Performance Impact: Improves perceived load time by showing structure immediately
 */

import styles from './AddOnCardSkeleton.module.css';

export default function AddOnCardSkeleton() {
  return (
    <div className={styles.skeleton} role="status" aria-label="Loading add-on...">
      {/* Icon placeholder */}
      <div className={styles.iconSkeleton}></div>

      {/* Title placeholder */}
      <div className={styles.titleSkeleton}></div>

      {/* Description placeholders (2 lines) */}
      <div className={styles.descriptionSkeleton}>
        <div className={styles.line}></div>
        <div className={`${styles.line} ${styles.short}`}></div>
      </div>

      {/* Price placeholder */}
      <div className={styles.priceSkeleton}></div>

      {/* Button placeholder */}
      <div className={styles.buttonSkeleton}></div>

      <span className="sr-only">Loading add-on details...</span>
    </div>
  );
}

/**
 * Grid of skeletons for initial page load
 */
export function AddOnCardSkeletonGrid({ count = 6 }: { count?: number }) {
  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <AddOnCardSkeleton key={`skeleton-${index}`} />
      ))}
    </>
  );
}
