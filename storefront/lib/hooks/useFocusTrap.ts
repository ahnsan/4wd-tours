import { useEffect, useCallback, RefObject } from 'react';

const FOCUSABLE_ELEMENTS = [
  'a[href]',
  'button:not([disabled])',
  'textarea:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
];

export interface FocusTrapOptions {
  enabled?: boolean;
  initialFocus?: RefObject<HTMLElement>;
  returnFocus?: RefObject<HTMLElement>;
  onEscape?: () => void;
}

/**
 * Custom hook for trapping focus within a container
 * Essential for modal dialogs and drawers
 */
export function useFocusTrap(
  containerRef: RefObject<HTMLElement>,
  options: FocusTrapOptions = {}
) {
  const {
    enabled = true,
    initialFocus,
    returnFocus,
    onEscape,
  } = options;

  const getFocusableElements = useCallback(() => {
    if (!containerRef.current) return [];

    const elements = containerRef.current.querySelectorAll<HTMLElement>(
      FOCUSABLE_ELEMENTS.join(',')
    );

    return Array.from(elements).filter(
      (element) => !element.hasAttribute('disabled') && element.offsetParent !== null
    );
  }, [containerRef]);

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!enabled || !containerRef.current) return;

      // Handle Escape key
      if (event.key === 'Escape' && onEscape) {
        event.preventDefault();
        onEscape();
        return;
      }

      // Handle Tab key for focus trapping
      if (event.key === 'Tab') {
        const focusableElements = getFocusableElements();

        if (focusableElements.length === 0) {
          event.preventDefault();
          return;
        }

        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];
        const activeElement = document.activeElement as HTMLElement;

        // Shift + Tab
        if (event.shiftKey) {
          if (activeElement === firstElement || !containerRef.current.contains(activeElement)) {
            event.preventDefault();
            lastElement?.focus();
          }
        }
        // Tab
        else {
          if (activeElement === lastElement || !containerRef.current.contains(activeElement)) {
            event.preventDefault();
            firstElement?.focus();
          }
        }
      }
    },
    [enabled, containerRef, getFocusableElements, onEscape]
  );

  // Set initial focus when enabled
  useEffect(() => {
    if (!enabled || !containerRef.current) return;

    let previouslyFocusedElement: HTMLElement | null = null;

    // Store the previously focused element
    if (returnFocus?.current) {
      previouslyFocusedElement = returnFocus.current;
    } else {
      previouslyFocusedElement = document.activeElement as HTMLElement;
    }

    // Set initial focus
    if (initialFocus?.current) {
      initialFocus.current.focus();
    } else {
      const focusableElements = getFocusableElements();
      if (focusableElements.length > 0) {
        focusableElements[0]?.focus();
      }
    }

    // Add event listener
    document.addEventListener('keydown', handleKeyDown);

    // Cleanup: return focus and remove listener
    return () => {
      document.removeEventListener('keydown', handleKeyDown);

      if (previouslyFocusedElement && document.body.contains(previouslyFocusedElement)) {
        previouslyFocusedElement.focus();
      }
    };
  }, [enabled, containerRef, initialFocus, returnFocus, getFocusableElements, handleKeyDown]);

  return {
    getFocusableElements,
  };
}

/**
 * Hook to disable body scroll when modal/drawer is open
 * Prevents background scrolling
 */
export function useBodyScrollLock(enabled: boolean) {
  useEffect(() => {
    if (!enabled) return;

    const originalStyle = window.getComputedStyle(document.body).overflow;
    const originalPaddingRight = window.getComputedStyle(document.body).paddingRight;

    // Calculate scrollbar width
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;

    // Lock scroll
    document.body.style.overflow = 'hidden';
    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    }

    // Cleanup
    return () => {
      document.body.style.overflow = originalStyle;
      document.body.style.paddingRight = originalPaddingRight;
    };
  }, [enabled]);
}

/**
 * Hook to manage inert attribute for background content
 * Makes background content non-interactive when modal is open
 */
export function useInertBackground(
  modalRef: RefObject<HTMLElement>,
  enabled: boolean
) {
  useEffect(() => {
    if (!enabled || !modalRef.current) return;

    const siblingElements: Element[] = [];
    const parent = modalRef.current.parentElement;

    if (parent) {
      Array.from(parent.children).forEach((child) => {
        if (child !== modalRef.current) {
          siblingElements.push(child);
          child.setAttribute('inert', '');
          child.setAttribute('aria-hidden', 'true');
        }
      });
    }

    return () => {
      siblingElements.forEach((element) => {
        element.removeAttribute('inert');
        element.removeAttribute('aria-hidden');
      });
    };
  }, [modalRef, enabled]);
}
