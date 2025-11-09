import { useEffect, useRef, useCallback } from 'react';

export type AnnouncementPriority = 'polite' | 'assertive';

/**
 * Custom hook for screen reader announcements
 * Creates live region for dynamic content updates
 */
export function useAnnouncer() {
  const politeRegionRef = useRef<HTMLDivElement | null>(null);
  const assertiveRegionRef = useRef<HTMLDivElement | null>(null);

  // Create live regions on mount
  useEffect(() => {
    // Create polite live region
    if (!politeRegionRef.current) {
      const politeRegion = document.createElement('div');
      politeRegion.setAttribute('role', 'status');
      politeRegion.setAttribute('aria-live', 'polite');
      politeRegion.setAttribute('aria-atomic', 'true');
      politeRegion.className = 'sr-only';
      document.body.appendChild(politeRegion);
      politeRegionRef.current = politeRegion;
    }

    // Create assertive live region
    if (!assertiveRegionRef.current) {
      const assertiveRegion = document.createElement('div');
      assertiveRegion.setAttribute('role', 'alert');
      assertiveRegion.setAttribute('aria-live', 'assertive');
      assertiveRegion.setAttribute('aria-atomic', 'true');
      assertiveRegion.className = 'sr-only';
      document.body.appendChild(assertiveRegion);
      assertiveRegionRef.current = assertiveRegion;
    }

    // Cleanup
    return () => {
      if (politeRegionRef.current && document.body.contains(politeRegionRef.current)) {
        document.body.removeChild(politeRegionRef.current);
      }
      if (assertiveRegionRef.current && document.body.contains(assertiveRegionRef.current)) {
        document.body.removeChild(assertiveRegionRef.current);
      }
    };
  }, []);

  /**
   * Announce a message to screen readers
   * @param message - The message to announce
   * @param priority - 'polite' (default) or 'assertive'
   * @param clearAfter - Clear message after delay (ms), default 1000ms
   */
  const announce = useCallback(
    (
      message: string,
      priority: AnnouncementPriority = 'polite',
      clearAfter: number = 1000
    ) => {
      const region = priority === 'assertive'
        ? assertiveRegionRef.current
        : politeRegionRef.current;

      if (!region) return;

      // Clear previous message
      region.textContent = '';

      // Small delay to ensure screen reader picks up the change
      setTimeout(() => {
        region.textContent = message;

        // Clear after specified time
        if (clearAfter > 0) {
          setTimeout(() => {
            region.textContent = '';
          }, clearAfter);
        }
      }, 100);
    },
    []
  );

  /**
   * Announce addition of item to cart
   */
  const announceAddToCart = useCallback(
    (itemName: string, quantity: number = 1) => {
      const message = `Added ${quantity} ${itemName}${quantity > 1 ? 's' : ''} to cart`;
      announce(message, 'polite');
    },
    [announce]
  );

  /**
   * Announce removal of item from cart
   */
  const announceRemoveFromCart = useCallback(
    (itemName: string) => {
      const message = `Removed ${itemName} from cart`;
      announce(message, 'polite');
    },
    [announce]
  );

  /**
   * Announce quantity change
   */
  const announceQuantityChange = useCallback(
    (itemName: string, newQuantity: number) => {
      const message = `${itemName} quantity updated to ${newQuantity}`;
      announce(message, 'polite');
    },
    [announce]
  );

  /**
   * Announce total change
   */
  const announceTotalChange = useCallback(
    (newTotal: number, currency: string = 'AUD') => {
      const message = `Total updated to ${currency} $${newTotal}`;
      announce(message, 'polite');
    },
    [announce]
  );

  /**
   * Announce error
   */
  const announceError = useCallback(
    (errorMessage: string) => {
      announce(errorMessage, 'assertive');
    },
    [announce]
  );

  /**
   * Announce loading state
   */
  const announceLoading = useCallback(
    (message: string = 'Loading') => {
      announce(message, 'polite');
    },
    [announce]
  );

  /**
   * Announce success
   */
  const announceSuccess = useCallback(
    (message: string) => {
      announce(message, 'polite');
    },
    [announce]
  );

  return {
    announce,
    announceAddToCart,
    announceRemoveFromCart,
    announceQuantityChange,
    announceTotalChange,
    announceError,
    announceLoading,
    announceSuccess,
  };
}
