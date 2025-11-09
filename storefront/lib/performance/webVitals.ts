/**
 * Enhanced Core Web Vitals Monitoring
 *
 * Captures and reports Core Web Vitals metrics for the add-ons page
 * Implements BMAD performance targets:
 * - TTI < 2s
 * - CLS < 0.1
 * - LCP < 2.5s
 * - FID < 100ms
 * - FCP < 1.8s
 * - TBT < 300ms
 */

import type { Metric } from 'web-vitals';
import { reportMetric } from '../analytics';

// Performance targets (BMAD requirements)
const PERFORMANCE_TARGETS = {
  // Time to Interactive - measures when page becomes fully interactive
  TTI: 2000, // < 2s

  // Cumulative Layout Shift - measures visual stability
  CLS: 0.1, // < 0.1

  // Largest Contentful Paint - measures loading performance
  LCP: 2500, // < 2.5s

  // First Input Delay - measures interactivity
  FID: 100, // < 100ms

  // First Contentful Paint - measures initial load
  FCP: 1800, // < 1.8s

  // Total Blocking Time - measures main thread blocking
  TBT: 300, // < 300ms

  // Interaction to Next Paint - measures responsiveness
  INP: 200, // < 200ms

  // Time to First Byte - measures server response time
  TTFB: 600, // < 600ms
} as const;

/**
 * Performance metric ratings based on BMAD targets
 */
export function getMetricRating(name: string, value: number): 'good' | 'needs-improvement' | 'poor' {
  const target = PERFORMANCE_TARGETS[name as keyof typeof PERFORMANCE_TARGETS];

  if (!target) return 'good';

  // For CLS, smaller is better (different scale)
  if (name === 'CLS') {
    if (value < target) return 'good';
    if (value < target * 2.5) return 'needs-improvement';
    return 'poor';
  }

  // For time-based metrics
  if (value < target) return 'good';
  if (value < target * 1.5) return 'needs-improvement';
  return 'poor';
}

/**
 * Enhanced metric reporting with custom thresholds
 */
export function reportWebVital(metric: Metric) {
  // Get custom rating based on BMAD targets
  const customRating = getMetricRating(metric.name, metric.value);

  const enhancedMetric = {
    ...metric,
    customRating,
    target: PERFORMANCE_TARGETS[metric.name as keyof typeof PERFORMANCE_TARGETS],
    page: 'addons',
  };

  // Log in development with color coding
  if (process.env.NODE_ENV === 'development') {
    const color = customRating === 'good' ? '#0CCE6A' :
                  customRating === 'needs-improvement' ? '#FFA400' : '#FF4E42';

    console.log(
      `%c[Web Vitals] ${metric.name}`,
      `color: ${color}; font-weight: bold; font-size: 12px;`,
      {
        value: metric.name === 'CLS' ? metric.value.toFixed(3) : `${Math.round(metric.value)}ms`,
        rating: customRating,
        target: PERFORMANCE_TARGETS[metric.name as keyof typeof PERFORMANCE_TARGETS],
        delta: metric.name === 'CLS' ? metric.delta.toFixed(3) : `${Math.round(metric.delta)}ms`,
      }
    );
  }

  // Report to analytics
  reportMetric(metric);
}

/**
 * Initialize Core Web Vitals monitoring with enhanced tracking
 */
export function initWebVitals() {
  if (typeof window === 'undefined') return;

  // Dynamically import web-vitals to avoid initial bundle bloat
  import('web-vitals').then(({ onCLS, onFID, onFCP, onLCP, onTTFB, onINP }) => {
    // Cumulative Layout Shift
    onCLS(reportWebVital, { reportAllChanges: false });

    // First Input Delay
    onFID(reportWebVital);

    // First Contentful Paint
    onFCP(reportWebVital);

    // Largest Contentful Paint
    onLCP(reportWebVital, { reportAllChanges: false });

    // Time to First Byte
    onTTFB(reportWebVital);

    // Interaction to Next Paint (new metric replacing FID)
    onINP(reportWebVital, { reportAllChanges: false });
  }).catch((error) => {
    console.error('Failed to load web-vitals:', error);
  });
}

/**
 * Get current performance snapshot
 */
export function getPerformanceSnapshot() {
  if (typeof window === 'undefined' || !window.performance) {
    return null;
  }

  const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
  const paint = performance.getEntriesByType('paint');
  const resources = performance.getEntriesByType('resource');

  // Calculate key metrics
  const ttfb = navigation ? navigation.responseStart - navigation.requestStart : 0;
  const fcp = paint.find((entry) => entry.name === 'first-contentful-paint')?.startTime || 0;
  const domInteractive = navigation?.domInteractive || 0;
  const domComplete = navigation?.domComplete || 0;

  // Resource timing
  const totalResources = resources.length;
  const jsResources = resources.filter((r) => r.name.includes('.js')).length;
  const cssResources = resources.filter((r) => r.name.includes('.css')).length;
  const imageResources = resources.filter((r) => r.name.match(/\.(jpg|jpeg|png|gif|svg|webp|avif)/)).length;

  // Total transfer size (if available)
  const totalTransferSize = resources.reduce((sum, r) => {
    return sum + (('transferSize' in r) ? (r as any).transferSize : 0);
  }, 0);

  return {
    // Navigation timing
    ttfb: Math.round(ttfb),
    fcp: Math.round(fcp),
    domInteractive: Math.round(domInteractive),
    domComplete: Math.round(domComplete),

    // Resource counts
    totalResources,
    jsResources,
    cssResources,
    imageResources,

    // Size metrics
    totalTransferSize: Math.round(totalTransferSize / 1024), // KB

    // Ratings
    ttfbRating: getMetricRating('TTFB', ttfb),
    fcpRating: getMetricRating('FCP', fcp),
  };
}

/**
 * Export performance report for debugging
 */
export function exportPerformanceReport() {
  const snapshot = getPerformanceSnapshot();

  const report = {
    timestamp: new Date().toISOString(),
    page: 'addons',
    url: window.location.href,
    userAgent: navigator.userAgent,
    snapshot,
    targets: PERFORMANCE_TARGETS,
  };

  console.log('Performance Report:', report);

  // Download as JSON
  const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `performance-report-${Date.now()}.json`;
  a.click();
  URL.revokeObjectURL(url);

  return report;
}

/**
 * Monitor performance continuously and alert on threshold violations
 */
export function startPerformanceMonitoring(options?: {
  interval?: number;
  onViolation?: (metric: string, value: number, target: number) => void;
}) {
  const interval = options?.interval || 10000; // 10 seconds
  const onViolation = options?.onViolation;

  const checkPerformance = () => {
    const snapshot = getPerformanceSnapshot();
    if (!snapshot) return;

    // Check TTFB
    if (snapshot.ttfb > PERFORMANCE_TARGETS.TTFB) {
      onViolation?.('TTFB', snapshot.ttfb, PERFORMANCE_TARGETS.TTFB);
    }

    // Check FCP
    if (snapshot.fcp > PERFORMANCE_TARGETS.FCP) {
      onViolation?.('FCP', snapshot.fcp, PERFORMANCE_TARGETS.FCP);
    }
  };

  // Initial check
  checkPerformance();

  // Periodic checks
  const intervalId = setInterval(checkPerformance, interval);

  // Return cleanup function
  return () => clearInterval(intervalId);
}

/**
 * Performance budget checker
 */
export function checkPerformanceBudget(): {
  passed: boolean;
  violations: Array<{ metric: string; value: number; target: number }>;
} {
  const snapshot = getPerformanceSnapshot();
  if (!snapshot) {
    return { passed: true, violations: [] };
  }

  const violations: Array<{ metric: string; value: number; target: number }> = [];

  // Check TTFB
  if (snapshot.ttfb > PERFORMANCE_TARGETS.TTFB) {
    violations.push({ metric: 'TTFB', value: snapshot.ttfb, target: PERFORMANCE_TARGETS.TTFB });
  }

  // Check FCP
  if (snapshot.fcp > PERFORMANCE_TARGETS.FCP) {
    violations.push({ metric: 'FCP', value: snapshot.fcp, target: PERFORMANCE_TARGETS.FCP });
  }

  return {
    passed: violations.length === 0,
    violations,
  };
}
