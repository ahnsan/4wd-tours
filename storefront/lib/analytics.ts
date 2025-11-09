/**
 * Web Analytics & Performance Monitoring
 *
 * This module handles tracking of Core Web Vitals and custom analytics events.
 * Core Web Vitals are key metrics that Google uses for ranking and user experience.
 */

import type { Metric } from 'web-vitals';

// Analytics endpoint - replace with your actual analytics service
const ANALYTICS_ENDPOINT = process.env.NEXT_PUBLIC_ANALYTICS_ENDPOINT || '/api/analytics';

/**
 * Send metric data to analytics endpoint
 */
async function sendToAnalytics(metric: Metric) {
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

  // Use `navigator.sendBeacon()` if available, falling back to `fetch()`
  if (navigator.sendBeacon) {
    navigator.sendBeacon(ANALYTICS_ENDPOINT, body);
  } else {
    try {
      await fetch(ANALYTICS_ENDPOINT, {
        method: 'POST',
        body,
        headers: { 'Content-Type': 'application/json' },
        keepalive: true,
      });
    } catch (error) {
      console.error('Failed to send analytics:', error);
    }
  }
}

/**
 * Log metric to console in development
 */
function logMetric(metric: Metric) {
  if (process.env.NODE_ENV === 'development') {
    const { name, value, rating, delta, id } = metric;
    console.log(
      `%c[Web Vitals] ${name}`,
      `color: ${rating === 'good' ? '#0CCE6A' : rating === 'needs-improvement' ? '#FFA400' : '#FF4E42'}; font-weight: bold`,
      {
        value: `${Math.round(value)}ms`,
        rating,
        delta: `${Math.round(delta)}ms`,
        id,
      }
    );
  }
}

/**
 * Main function to handle web vitals reporting
 * Called by reportWebVitals() with each metric
 */
export function reportMetric(metric: Metric) {
  // Log in development
  logMetric(metric);

  // Send to analytics in production
  if (process.env.NODE_ENV === 'production') {
    sendToAnalytics(metric);
  }
}

/**
 * Custom event tracking
 */
export function trackEvent(eventName: string, data?: Record<string, any>) {
  if (process.env.NODE_ENV === 'development') {
    console.log('[Analytics Event]', eventName, data);
  }

  if (process.env.NODE_ENV === 'production') {
    const body = JSON.stringify({
      event: eventName,
      data,
      url: window.location.href,
      timestamp: Date.now(),
    });

    if (navigator.sendBeacon) {
      navigator.sendBeacon(ANALYTICS_ENDPOINT, body);
    } else {
      fetch(ANALYTICS_ENDPOINT, {
        method: 'POST',
        body,
        headers: { 'Content-Type': 'application/json' },
        keepalive: true,
      }).catch((error) => console.error('Failed to track event:', error));
    }
  }
}

/**
 * Page view tracking
 */
export function trackPageView(url: string) {
  trackEvent('pageview', { url });
}

/**
 * Error tracking
 */
export function trackError(error: Error, errorInfo?: Record<string, any>) {
  trackEvent('error', {
    message: error.message,
    stack: error.stack,
    ...errorInfo,
  });
}

// ============================================================
// GA4 Add-ons Page Analytics
// ============================================================

export interface AddOnEventData {
  addon_id: string;
  addon_title: string;
  addon_price: number;
  addon_category?: string;
  cart_id?: string;
  session_id?: string;
}

export interface AddOnsPageEventData {
  cart_id?: string;
  session_id?: string;
  tour_id?: string;
  duration_days?: number;
}

/**
 * Track add-ons page view
 */
export function trackViewAddonsPage(data: AddOnsPageEventData) {
  trackEvent('view_addons_page', {
    event_category: 'ecommerce',
    event_label: 'add-ons_page_view',
    ...data,
  });
}

/**
 * Track individual add-on item visibility
 * Called when add-on becomes visible via Intersection Observer
 */
export function trackViewAddonItem(data: AddOnEventData) {
  trackEvent('view_addon_item', {
    event_category: 'ecommerce',
    event_label: 'addon_impression',
    ...data,
  });
}

/**
 * Track add-on selection
 */
export function trackSelectAddon(data: AddOnEventData & { quantity?: number }) {
  trackEvent('select_addon', {
    event_category: 'ecommerce',
    event_label: 'addon_selected',
    ...data,
  });
}

/**
 * Track add-on deselection
 */
export function trackDeselectAddon(data: AddOnEventData) {
  trackEvent('deselect_addon', {
    event_category: 'ecommerce',
    event_label: 'addon_deselected',
    ...data,
  });
}

/**
 * Track add-on detail view (drawer opened)
 */
export function trackViewAddonDetail(data: AddOnEventData) {
  trackEvent('view_addon_detail', {
    event_category: 'ecommerce',
    event_label: 'addon_detail_view',
    ...data,
  });
}

/**
 * Track continue from add-ons page
 */
export function trackContinueFromAddons(data: {
  cart_id?: string;
  session_id?: string;
  selected_count: number;
  total_value_cents: number;
}) {
  trackEvent('continue_from_addons', {
    event_category: 'ecommerce',
    event_label: 'addons_continue',
    ...data,
  });
}

/**
 * Track skip add-ons
 */
export function trackSkipAddons(data: { cart_id?: string; session_id?: string }) {
  trackEvent('skip_addons', {
    event_category: 'ecommerce',
    event_label: 'addons_skipped',
    ...data,
  });
}
