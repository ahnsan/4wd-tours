import { useEffect, useCallback, RefObject } from 'react';

export interface KeyboardNavOptions {
  onArrowUp?: () => void;
  onArrowDown?: () => void;
  onArrowLeft?: () => void;
  onArrowRight?: () => void;
  onEscape?: () => void;
  onEnter?: () => void;
  onTab?: (e: KeyboardEvent) => void;
  enabled?: boolean;
}

/**
 * Custom hook for keyboard navigation
 * Provides arrow key handlers, escape key, enter key, and tab navigation
 */
export function useKeyboardNav(
  ref: RefObject<HTMLElement>,
  options: KeyboardNavOptions = {}
) {
  const {
    onArrowUp,
    onArrowDown,
    onArrowLeft,
    onArrowRight,
    onEscape,
    onEnter,
    onTab,
    enabled = true,
  } = options;

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!enabled) return;

      switch (event.key) {
        case 'ArrowUp':
          if (onArrowUp) {
            event.preventDefault();
            onArrowUp();
          }
          break;
        case 'ArrowDown':
          if (onArrowDown) {
            event.preventDefault();
            onArrowDown();
          }
          break;
        case 'ArrowLeft':
          if (onArrowLeft) {
            event.preventDefault();
            onArrowLeft();
          }
          break;
        case 'ArrowRight':
          if (onArrowRight) {
            event.preventDefault();
            onArrowRight();
          }
          break;
        case 'Escape':
          if (onEscape) {
            event.preventDefault();
            onEscape();
          }
          break;
        case 'Enter':
          if (onEnter) {
            event.preventDefault();
            onEnter();
          }
          break;
        case 'Tab':
          if (onTab) {
            onTab(event);
          }
          break;
      }
    },
    [enabled, onArrowUp, onArrowDown, onArrowLeft, onArrowRight, onEscape, onEnter, onTab]
  );

  useEffect(() => {
    const element = ref.current;
    if (!element || !enabled) return;

    element.addEventListener('keydown', handleKeyDown as EventListener);

    return () => {
      element.removeEventListener('keydown', handleKeyDown as EventListener);
    };
  }, [ref, handleKeyDown, enabled]);

  return {
    handleKeyDown,
  };
}

/**
 * Hook for quantity spinbutton keyboard navigation
 * Supports arrow up/down and page up/down for increment/decrement
 */
export function useQuantityKeyboard(
  value: number,
  onChange: (value: number) => void,
  min: number = 0,
  max: number = 10,
  step: number = 1
) {
  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      let newValue = value;

      switch (event.key) {
        case 'ArrowUp':
        case 'ArrowRight':
          event.preventDefault();
          newValue = Math.min(max, value + step);
          break;
        case 'ArrowDown':
        case 'ArrowLeft':
          event.preventDefault();
          newValue = Math.max(min, value - step);
          break;
        case 'PageUp':
          event.preventDefault();
          newValue = Math.min(max, value + step * 5);
          break;
        case 'PageDown':
          event.preventDefault();
          newValue = Math.max(min, value - step * 5);
          break;
        case 'Home':
          event.preventDefault();
          newValue = min;
          break;
        case 'End':
          event.preventDefault();
          newValue = max;
          break;
        default:
          return;
      }

      if (newValue !== value) {
        onChange(newValue);
      }
    },
    [value, onChange, min, max, step]
  );

  return {
    handleKeyDown,
    'aria-valuemin': min,
    'aria-valuemax': max,
    'aria-valuenow': value,
  };
}

/**
 * Hook for managing focus within a roving tabindex pattern
 * Useful for lists and grids
 */
export function useRovingTabIndex(
  itemsCount: number,
  currentIndex: number,
  onIndexChange: (index: number) => void,
  orientation: 'horizontal' | 'vertical' | 'both' = 'vertical'
) {
  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      let newIndex = currentIndex;

      const nextKey = orientation === 'horizontal' ? 'ArrowRight' : 'ArrowDown';
      const prevKey = orientation === 'horizontal' ? 'ArrowLeft' : 'ArrowUp';

      switch (event.key) {
        case nextKey:
        case (orientation === 'both' && 'ArrowRight'):
        case (orientation === 'both' && 'ArrowDown'):
          event.preventDefault();
          newIndex = (currentIndex + 1) % itemsCount;
          break;
        case prevKey:
        case (orientation === 'both' && 'ArrowLeft'):
        case (orientation === 'both' && 'ArrowUp'):
          event.preventDefault();
          newIndex = (currentIndex - 1 + itemsCount) % itemsCount;
          break;
        case 'Home':
          event.preventDefault();
          newIndex = 0;
          break;
        case 'End':
          event.preventDefault();
          newIndex = itemsCount - 1;
          break;
        default:
          return;
      }

      if (newIndex !== currentIndex) {
        onIndexChange(newIndex);
      }
    },
    [currentIndex, itemsCount, onIndexChange, orientation]
  );

  const getTabIndex = useCallback(
    (index: number) => (index === currentIndex ? 0 : -1),
    [currentIndex]
  );

  return {
    handleKeyDown,
    getTabIndex,
  };
}
