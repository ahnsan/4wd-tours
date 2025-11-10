/**
 * LazyAddOnCard - Performance Optimized Wrapper
 *
 * Uses IntersectionObserver to only render cards when visible
 * Reduces initial render time and improves TTI for pages with many add-ons
 */

'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import { useIntersectionObserver } from '../../lib/hooks/useIntersectionObserver';
import type { AddOn } from '../../lib/types/checkout';
import styles from './AddOnCard.module.css';

const AddOnCard = dynamic(() => import('./AddOnCard'), {
  loading: () => (
    <div
      className={styles.cardSkeleton}
      style={{ minHeight: '250px' }}
      aria-label="Loading add-on..."
    />
  ),
});

interface LazyAddOnCardProps {
  addon: AddOn;
  isSelected: boolean;
  quantity: number;
  onToggle: (addon: AddOn) => void;
  onQuantityChange: (addonId: string, quantity: number) => void;
  tourDays?: number;
  participants?: number;
}

export default function LazyAddOnCard(props: LazyAddOnCardProps) {
  const [ref, isIntersecting] = useIntersectionObserver<HTMLDivElement>({
    threshold: 0.1,
    rootMargin: '100px', // Start loading 100px before entering viewport
    triggerOnce: true,
  });

  return (
    <div ref={ref} style={{ minHeight: isIntersecting ? 'auto' : '250px' }}>
      {isIntersecting ? (
        <AddOnCard {...props as any} />
      ) : (
        <div
          className={styles.cardSkeleton}
          style={{ minHeight: '250px' }}
          aria-label="Add-on card placeholder"
        />
      )}
    </div>
  );
}
