/**
 * Web Vitals Reporting
 *
 * This module initializes and reports Core Web Vitals metrics:
 * - CLS (Cumulative Layout Shift): Visual stability
 * - FID (First Input Delay): Interactivity
 * - FCP (First Contentful Paint): Loading performance
 * - LCP (Largest Contentful Paint): Loading performance
 * - TTFB (Time to First Byte): Server response time
 * - INP (Interaction to Next Paint): Responsiveness (new metric replacing FID)
 */

import { reportMetric } from './analytics';

/**
 * Initialize web vitals reporting
 * This should be called once when the app loads
 */
export function reportWebVitals() {
  if (typeof window !== 'undefined') {
    // Dynamically import web-vitals to avoid including it in the initial bundle
    import('web-vitals').then(({ onCLS, onFID, onFCP, onLCP, onTTFB, onINP }) => {
      // Cumulative Layout Shift - measures visual stability
      // Good: < 0.1, Needs Improvement: 0.1-0.25, Poor: > 0.25
      onCLS(reportMetric);

      // First Input Delay - measures interactivity
      // Good: < 100ms, Needs Improvement: 100-300ms, Poor: > 300ms
      onFID(reportMetric);

      // First Contentful Paint - measures loading
      // Good: < 1.8s, Needs Improvement: 1.8-3s, Poor: > 3s
      onFCP(reportMetric);

      // Largest Contentful Paint - measures loading performance
      // Good: < 2.5s, Needs Improvement: 2.5-4s, Poor: > 4s
      onLCP(reportMetric);

      // Time to First Byte - measures server response time
      // Good: < 800ms, Needs Improvement: 800-1800ms, Poor: > 1800ms
      onTTFB(reportMetric);

      // Interaction to Next Paint - measures responsiveness (replacing FID)
      // Good: < 200ms, Needs Improvement: 200-500ms, Poor: > 500ms
      onINP(reportMetric);
    }).catch((error) => {
      console.error('Failed to load web-vitals:', error);
    });
  }
}

/**
 * Initialize web vitals reporting with custom configuration
 */
export function initWebVitals(config?: {
  reportAllChanges?: boolean;
  durationThreshold?: number;
}) {
  if (typeof window !== 'undefined') {
    import('web-vitals').then(({ onCLS, onFID, onFCP, onLCP, onTTFB, onINP }) => {
      const options = {
        reportAllChanges: config?.reportAllChanges ?? false,
        durationThreshold: config?.durationThreshold,
      };

      onCLS(reportMetric, options);
      onFID(reportMetric);
      onFCP(reportMetric);
      onLCP(reportMetric, options);
      onTTFB(reportMetric);
      onINP(reportMetric, options);
    }).catch((error) => {
      console.error('Failed to load web-vitals:', error);
    });
  }
}

/**
 * Get performance entries for custom analysis
 */
export function getPerformanceMetrics() {
  if (typeof window === 'undefined' || !window.performance) {
    return null;
  }

  const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
  const paint = performance.getEntriesByType('paint');

  return {
    // Navigation timing
    dns: navigation?.domainLookupEnd - navigation?.domainLookupStart,
    tcp: navigation?.connectEnd - navigation?.connectStart,
    ttfb: navigation?.responseStart - navigation?.requestStart,
    download: navigation?.responseEnd - navigation?.responseStart,
    domInteractive: navigation?.domInteractive,
    domComplete: navigation?.domComplete,

    // Paint timing
    fcp: paint.find((entry) => entry.name === 'first-contentful-paint')?.startTime,

    // Resource timing
    resources: performance.getEntriesByType('resource').length,
  };
}

/**
 * Export performance report as JSON
 */
export function exportPerformanceReport() {
  const metrics = getPerformanceMetrics();
  const report = {
    timestamp: new Date().toISOString(),
    url: window.location.href,
    userAgent: navigator.userAgent,
    metrics,
  };

  console.log('Performance Report:', report);
  return report;
}
