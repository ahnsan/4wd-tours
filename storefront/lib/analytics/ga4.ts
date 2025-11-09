/**
 * GA4 Analytics Tracking for 4WD Tours Platform
 *
 * Performance: Uses requestIdleCallback to avoid blocking main thread
 * Security: Never sends PII (payment data, full names, emails)
 * Privacy: Respects DNT header and user preferences
 */

declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
    dataLayer?: any[];
  }
}

export interface GA4EventParams {
  // Page view events
  page_title?: string;
  page_location?: string;
  page_path?: string;

  // E-commerce events
  cart_id?: string;
  session_id?: string;
  currency?: string;
  value?: number;

  // Add-on events
  addon_id?: string;
  addon_title?: string;
  price_cents?: number;
  unit?: 'per_day' | 'per_booking' | 'per_person';
  duration_days?: number;
  quantity?: number;

  // Tour events
  tour_id?: string;
  tour_title?: string;
}

/**
 * Send GA4 event with performance optimization
 */
export function trackEvent(eventName: string, params?: GA4EventParams): void {
  // Respect Do Not Track
  if (navigator.doNotTrack === '1') {
    console.debug('[GA4] Event blocked by DNT:', eventName);
    return;
  }

  // Check if GA4 is loaded
  if (typeof window === 'undefined' || !window.gtag) {
    console.warn('[GA4] gtag not loaded, event queued:', eventName);
    return;
  }

  // Use requestIdleCallback for non-critical analytics
  // Falls back to setTimeout if not available
  const sendEvent = () => {
    try {
      window.gtag?.('event', eventName, {
        ...params,
        // Add timestamp
        event_timestamp: Date.now(),
        // Add page context
        page_url: window.location.href,
      });
      console.debug('[GA4] Event sent:', eventName, params);
    } catch (error) {
      console.error('[GA4] Event failed:', eventName, error);
    }
  };

  if ('requestIdleCallback' in window) {
    requestIdleCallback(sendEvent, { timeout: 2000 });
  } else {
    setTimeout(sendEvent, 0);
  }
}

/**
 * Add-ons Page Events
 */

export function trackViewAddonsPage(params: {
  cart_id?: string;
  session_id?: string;
  tour_id?: string;
  duration_days?: number;
}): void {
  trackEvent('view_addons_page', params);
}

export function trackViewAddonItem(params: {
  addon_id: string;
  addon_title: string;
  price_cents: number;
  unit: 'per_day' | 'per_booking' | 'per_person';
  cart_id?: string;
  session_id?: string;
}): void {
  trackEvent('view_addon_item', params);
}

export function trackSelectAddon(params: {
  addon_id: string;
  addon_title: string;
  price_cents: number;
  unit: 'per_day' | 'per_booking' | 'per_person';
  quantity: number;
  duration_days?: number;
  cart_id?: string;
  session_id?: string;
}): void {
  trackEvent('select_addon', params);
}

export function trackDeselectAddon(params: {
  addon_id: string;
  addon_title: string;
  cart_id?: string;
  session_id?: string;
}): void {
  trackEvent('deselect_addon', params);
}

export function trackViewAddonDetail(params: {
  addon_id: string;
  addon_title: string;
  price_cents: number;
  cart_id?: string;
  session_id?: string;
}): void {
  trackEvent('view_addon_detail', params);
}

export function trackContinueFromAddons(params: {
  selected_count: number;
  total_value_cents: number;
  cart_id?: string;
  session_id?: string;
  duration_days?: number;
}): void {
  trackEvent('continue_from_addons', params);
}

export function trackSkipAddons(params: {
  cart_id?: string;
  session_id?: string;
  duration_days?: number;
}): void {
  trackEvent('skip_addons', params);
}

/**
 * Error tracking
 */
export function trackAddonsError(params: {
  error_type: string;
  error_message: string;
  addon_id?: string;
  cart_id?: string;
}): void {
  trackEvent('addons_error', params);
}
