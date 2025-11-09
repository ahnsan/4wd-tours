'use client';

/**
 * WebVitals Client Component
 *
 * This component tracks Core Web Vitals metrics using Next.js built-in hook.
 * It reports metrics for performance monitoring and optimization.
 */

import { useReportWebVitals } from 'next/web-vitals';

export function WebVitals() {
  useReportWebVitals((metric) => {
    // Enhanced logging for development with color coding
    if (process.env.NODE_ENV === 'development') {
      const { name, value, rating, delta, id } = metric;
      const color = rating === 'good' ? '#0CCE6A' : rating === 'needs-improvement' ? '#FFA400' : '#FF4E42';

      console.log(
        `%c[Web Vitals] ${name}`,
        `color: ${color}; font-weight: bold; font-size: 12px;`,
        {
          value: name === 'CLS' ? value.toFixed(3) : `${Math.round(value)}ms`,
          rating,
          delta: name === 'CLS' ? delta.toFixed(3) : `${Math.round(delta)}ms`,
          id,
        }
      );
    }

    // Send to analytics in production
    if (process.env.NODE_ENV === 'production') {
      const body = JSON.stringify({
        name: metric.name,
        value: metric.value,
        rating: metric.rating,
        delta: metric.delta,
        id: metric.id,
        navigationType: metric.navigationType,
        // Additional context
        url: window.location.href,
        userAgent: navigator.userAgent,
        timestamp: Date.now(),
      });

      const url = process.env.NEXT_PUBLIC_ANALYTICS_ENDPOINT || '/api/analytics';

      // Use `navigator.sendBeacon()` if available, falling back to `fetch()`
      if (navigator.sendBeacon) {
        navigator.sendBeacon(url, body);
      } else {
        fetch(url, {
          method: 'POST',
          body,
          headers: { 'Content-Type': 'application/json' },
          keepalive: true,
        }).catch((error) => {
          console.error('Failed to send analytics:', error);
        });
      }
    }
  });

  return null;
}
