/**
 * Lazy-loaded Analytics Wrapper
 *
 * Performance optimization: Loads analytics code only when needed
 * Uses requestIdleCallback to avoid blocking main thread
 * Implements batching to reduce network overhead
 */

import type { GA4EventParams } from './ga4';

// Track if analytics module has been loaded
let analyticsModule: typeof import('./ga4') | null = null;
let isLoading = false;
const eventQueue: Array<{ eventName: string; params?: GA4EventParams }> = [];

/**
 * Lazy load the analytics module
 * Uses requestIdleCallback for non-blocking load
 */
async function loadAnalytics(): Promise<typeof import('./ga4')> {
  if (analyticsModule) {
    return analyticsModule;
  }

  if (isLoading) {
    // Wait for existing load to complete
    return new Promise((resolve) => {
      const checkInterval = setInterval(() => {
        if (analyticsModule) {
          clearInterval(checkInterval);
          resolve(analyticsModule);
        }
      }, 50);
    });
  }

  isLoading = true;

  try {
    // Use requestIdleCallback to load during idle time
    await new Promise<void>((resolve) => {
      if ('requestIdleCallback' in window) {
        requestIdleCallback(() => resolve(), { timeout: 2000 });
      } else {
        setTimeout(() => resolve(), 0);
      }
    });

    // Dynamic import for code splitting
    analyticsModule = await import('./ga4');

    // Process queued events
    if (eventQueue.length > 0) {
      eventQueue.forEach(({ eventName, params }) => {
        analyticsModule?.trackEvent(eventName, params);
      });
      eventQueue.length = 0;
    }

    return analyticsModule;
  } finally {
    isLoading = false;
  }
}

/**
 * Track event with lazy loading
 * Queues events if analytics not yet loaded
 */
export function trackEvent(eventName: string, params?: GA4EventParams): void {
  if (analyticsModule) {
    analyticsModule.trackEvent(eventName, params);
  } else {
    // Queue event if analytics not loaded yet
    eventQueue.push({ eventName, params });

    // Trigger load if not already loading
    if (!isLoading) {
      loadAnalytics().catch((error) => {
        console.error('[Analytics] Failed to load analytics module:', error);
      });
    }
  }
}

/**
 * Pre-load analytics module during idle time
 * Call this early in the app lifecycle for better UX
 */
export function preloadAnalytics(): void {
  if (!analyticsModule && !isLoading) {
    loadAnalytics().catch((error) => {
      console.error('[Analytics] Failed to preload analytics:', error);
    });
  }
}

/**
 * Add-ons Page Events - Lazy loaded versions
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
  unit: 'per_day' | 'per_booking';
  cart_id?: string;
  session_id?: string;
}): void {
  trackEvent('view_addon_item', params);
}

export function trackSelectAddon(params: {
  addon_id: string;
  addon_title: string;
  price_cents: number;
  unit: 'per_day' | 'per_booking';
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

export function trackAddonsError(params: {
  error_type: string;
  error_message: string;
  addon_id?: string;
  cart_id?: string;
}): void {
  trackEvent('addons_error', params);
}
