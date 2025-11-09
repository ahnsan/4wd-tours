/**
 * useAddOnSelection Hook
 *
 * React hook for managing add-on selection state with optimistic updates
 * Handles quantity management, total calculation, and price reconciliation
 */
'use client';

import { useState, useCallback, useEffect, useMemo } from 'react';
import {
  calculateAddonPrice,
  calculateAddonsTotal,
  calculatePriceImpact,
  type AddOnPricing,
  type PricingContext,
} from '../utils/pricing';
import { trackSelectAddon, trackDeselectAddon } from '../analytics/ga4';

/**
 * Extended add-on type with UI state
 */
export interface SelectableAddOn extends AddOnPricing {
  title: string;
  description?: string;
  available: boolean;
  category?: string;
  icon?: string;
}

/**
 * Selection state for a single add-on
 */
export interface AddOnSelectionState {
  addon: SelectableAddOn;
  quantity: number;
  calculatedPrice: number;
}

/**
 * Return type for the hook
 */
export interface UseAddOnSelectionReturn {
  // State
  selectedAddons: Map<string, AddOnSelectionState>;
  total: number;
  count: number;

  // Actions
  toggle: (addon: SelectableAddOn) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearSelection: () => void;
  isSelected: (id: string) => boolean;
  getQuantity: (id: string) => number;
  getAddonPrice: (addon: SelectableAddOn) => number;

  // Utilities
  calculateTotal: () => number;
  getSelectedArray: () => AddOnSelectionState[];
}

/**
 * Hook for managing add-on selection state
 *
 * @param initialAddons - Optional initial selected add-ons
 * @param context - Pricing context (duration, participants, tour price)
 * @param onChange - Optional callback when selection changes
 */
export function useAddOnSelection(
  initialAddons: SelectableAddOn[] = [],
  context: PricingContext,
  onChange?: (selected: Map<string, AddOnSelectionState>, total: number) => void
): UseAddOnSelectionReturn {
  // Initialize selection map
  const [selectedAddons, setSelectedAddons] = useState<Map<string, AddOnSelectionState>>(() => {
    const initialMap = new Map<string, AddOnSelectionState>();
    initialAddons.forEach(addon => {
      if (addon.quantity && addon.quantity > 0) {
        initialMap.set(addon.id, {
          addon,
          quantity: addon.quantity,
          calculatedPrice: calculateAddonPrice(addon, context),
        });
      }
    });
    return initialMap;
  });

  // Calculate total whenever selection changes
  const total = useMemo(() => {
    const addons = Array.from(selectedAddons.values()).map(state => ({
      ...state.addon,
      quantity: state.quantity,
    }));
    return calculateAddonsTotal(addons, context);
  }, [selectedAddons, context]);

  // Count of selected add-ons
  const count = selectedAddons.size;

  /**
   * Calculate price for a specific add-on
   */
  const getAddonPrice = useCallback((addon: SelectableAddOn): number => {
    return calculateAddonPrice(addon, context);
  }, [context]);

  /**
   * Toggle add-on selection (add if not selected, remove if selected)
   */
  const toggle = useCallback((addon: SelectableAddOn) => {
    setSelectedAddons(prev => {
      const newMap = new Map(prev);
      const isCurrentlySelected = newMap.has(addon.id);

      if (isCurrentlySelected) {
        // Deselect
        newMap.delete(addon.id);

        // Track deselection
        trackDeselectAddon({
          addon_id: addon.id,
          addon_title: addon.title,
        });
      } else {
        // Select with quantity 1
        const calculatedPrice = getAddonPrice(addon);
        newMap.set(addon.id, {
          addon,
          quantity: 1,
          calculatedPrice,
        });

        // Track selection
        trackSelectAddon({
          addon_id: addon.id,
          addon_title: addon.title,
          price_cents: addon.price_cents,
          unit: addon.pricing_type,
          quantity: 1,
          duration_days: context.duration_days,
        });
      }

      return newMap;
    });
  }, [getAddonPrice, context.duration_days]);

  /**
   * Update quantity for a selected add-on
   */
  const updateQuantity = useCallback((id: string, quantity: number) => {
    if (quantity < 0) return; // Prevent negative quantities

    setSelectedAddons(prev => {
      const newMap = new Map(prev);
      const state = newMap.get(id);

      if (!state) {
        console.warn(`[useAddOnSelection] Cannot update quantity for non-selected add-on: ${id}`);
        return prev;
      }

      if (quantity === 0) {
        // Remove if quantity is 0
        newMap.delete(id);
        trackDeselectAddon({
          addon_id: id,
          addon_title: state.addon.title,
        });
      } else {
        // Update quantity and recalculate price
        const updatedAddon = { ...state.addon, quantity };
        newMap.set(id, {
          addon: state.addon,
          quantity,
          calculatedPrice: calculateAddonPrice(updatedAddon, context),
        });

        // Track update
        trackSelectAddon({
          addon_id: id,
          addon_title: state.addon.title,
          price_cents: state.addon.price_cents,
          unit: state.addon.pricing_type,
          quantity,
          duration_days: context.duration_days,
        });
      }

      return newMap;
    });
  }, [context]);

  /**
   * Clear all selections
   */
  const clearSelection = useCallback(() => {
    setSelectedAddons(new Map());
  }, []);

  /**
   * Check if an add-on is selected
   */
  const isSelected = useCallback((id: string): boolean => {
    return selectedAddons.has(id);
  }, [selectedAddons]);

  /**
   * Get quantity for a specific add-on
   */
  const getQuantity = useCallback((id: string): number => {
    return selectedAddons.get(id)?.quantity || 0;
  }, [selectedAddons]);

  /**
   * Calculate total (also available as memoized value)
   */
  const calculateTotal = useCallback((): number => {
    const addons = Array.from(selectedAddons.values()).map(state => ({
      ...state.addon,
      quantity: state.quantity,
    }));
    return calculateAddonsTotal(addons, context);
  }, [selectedAddons, context]);

  /**
   * Get selected add-ons as array
   */
  const getSelectedArray = useCallback((): AddOnSelectionState[] => {
    return Array.from(selectedAddons.values());
  }, [selectedAddons]);

  // Notify parent component of changes
  useEffect(() => {
    if (onChange) {
      onChange(selectedAddons, total);
    }
  }, [selectedAddons, total, onChange]);

  return {
    selectedAddons,
    total,
    count,
    toggle,
    updateQuantity,
    clearSelection,
    isSelected,
    getQuantity,
    getAddonPrice,
    calculateTotal,
    getSelectedArray,
  };
}

/**
 * Helper hook for persisting selection to localStorage
 */
export function usePersistedAddOnSelection(
  key: string,
  initialAddons: SelectableAddOn[] = [],
  context: PricingContext
): UseAddOnSelectionReturn {
  // Load from localStorage on mount
  const [loadedInitial, setLoadedInitial] = useState<SelectableAddOn[]>(() => {
    if (typeof window === 'undefined') return initialAddons;

    try {
      const stored = localStorage.getItem(key);
      if (stored) {
        const parsed = JSON.parse(stored);
        return Array.isArray(parsed) ? parsed : initialAddons;
      }
    } catch (error) {
      console.error('[usePersistedAddOnSelection] Error loading from localStorage:', error);
    }

    return initialAddons;
  });

  const selection = useAddOnSelection(loadedInitial, context);

  // Save to localStorage on change
  useEffect(() => {
    if (typeof window === 'undefined') return;

    try {
      const selected = selection.getSelectedArray().map(state => ({
        ...state.addon,
        quantity: state.quantity,
      }));
      localStorage.setItem(key, JSON.stringify(selected));
    } catch (error) {
      console.error('[usePersistedAddOnSelection] Error saving to localStorage:', error);
    }
  }, [key, selection]);

  return selection;
}
