'use client';

import { useEffect, useRef, useState, ReactNode } from 'react';

/**
 * LazySection Component
 *
 * Implements Intersection Observer for lazy loading below-fold content.
 * Only renders children when the section becomes visible in the viewport.
 *
 * Performance benefits:
 * - Reduces initial bundle execution time
 * - Improves Time to Interactive (TTI)
 * - Reduces memory usage for off-screen components
 *
 * Usage:
 * ```tsx
 * <LazySection>
 *   <ExpensiveComponent />
 * </LazySection>
 * ```
 *
 * @param children - React components to lazy load
 * @param rootMargin - Margin around viewport for early loading (default: '100px')
 * @param threshold - Percentage of visibility required to trigger (default: 0.1)
 */
interface LazySectionProps {
  children: ReactNode;
  rootMargin?: string;
  threshold?: number;
  fallback?: ReactNode;
}

export function LazySection({
  children,
  rootMargin = '100px',
  threshold = 0.1,
  fallback = null
}: LazySectionProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      {
        rootMargin,
        threshold
      }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => {
      observer.disconnect();
    };
  }, [rootMargin, threshold]);

  return (
    <div ref={ref}>
      {isVisible ? children : fallback}
    </div>
  );
}

export default LazySection;
