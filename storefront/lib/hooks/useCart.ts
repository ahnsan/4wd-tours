// Cart state management hook with Medusa backend integration
// Maintains localStorage sync for offline resilience
'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import type { Tour, AddOn, SelectedAddOn, CartState } from '../types/checkout';
import { createCart, getCart, addLineItem, updateLineItem } from '../data/cart-service';

const CART_STORAGE_KEY = 'sunshine_coast_4wd_cart';
const DEFAULT_REGION_ID = 'reg_01K9G4HA190556136E7RJQ4411';

// MANDATORY: Use coordination hooks for cart operations
const useCoordinationHook = (operation: string) => {
  useEffect(() => {
    if (typeof window !== 'undefined') {
      console.log(`[Cart Hook] ${operation} - coordinating via memory`);
    }
  }, [operation]);
};

const getInitialCartState = (): CartState => {
  if (typeof window === 'undefined') {
    return {
      tour: null,
      participants: 1,
      tour_start_date: null,
      selected_addons: [],
      subtotal: 0,
      total: 0,
      medusa_cart_id: null,
    };
  }

  try {
    const stored = localStorage.getItem(CART_STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      // Ensure medusa_cart_id is properly typed
      return {
        ...parsed,
        medusa_cart_id: parsed.medusa_cart_id || null,
      };
    }
  } catch (error) {
    console.error('[useCart] Error loading cart from localStorage:', error);
  }

  return {
    tour: null,
    participants: 1,
    tour_start_date: null,
    selected_addons: [],
    subtotal: 0,
    total: 0,
    medusa_cart_id: null,
  };
};

export function useCart() {
  const [cart, setCart] = useState<CartState>(getInitialCartState);
  const isMounted = useRef(false);
  const syncInProgress = useRef(false);

  useCoordinationHook('cart-management');

  // Persist cart to localStorage whenever it changes
  useEffect(() => {
    if (typeof window !== 'undefined' && isMounted.current) {
      try {
        localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
      } catch (error) {
        console.error('[useCart] Error saving cart to localStorage:', error);
      }
    }
  }, [cart]);

  // Retrieve cart from Medusa on mount if cart ID exists
  useEffect(() => {
    isMounted.current = true;

    const retrieveCartFromMedusa = async () => {
      if (syncInProgress.current) return;

      const storedCartId = cart.medusa_cart_id;
      if (!storedCartId) {
        console.log('[useCart] No Medusa cart ID found on mount');
        return;
      }

      try {
        syncInProgress.current = true;
        console.log('[useCart] Retrieving cart from Medusa:', storedCartId);

        const medusaCart = await getCart(storedCartId);

        // TODO: Merge Medusa cart with local state if needed
        // For now, we trust localStorage as source of truth for product selections
        console.log('[useCart] Cart retrieved from Medusa:', medusaCart.id);
      } catch (error) {
        console.error('[useCart] Error retrieving cart from Medusa:', error);
        // Cart might be expired or invalid - clear the ID
        console.log('[useCart] Clearing invalid Medusa cart ID');
        setCart((prev) => ({ ...prev, medusa_cart_id: null }));
      } finally {
        syncInProgress.current = false;
      }
    };

    retrieveCartFromMedusa();
  }, []); // Run only once on mount

  // Calculate totals
  const calculateTotals = useCallback((
    tour: Tour | null,
    participants: number,
    addons: SelectedAddOn[]
  ) => {
    let subtotal = 0;

    // Add tour base price
    if (tour) {
      subtotal += tour.base_price * participants;
    }

    // Add add-ons total
    const addonsTotal = addons.reduce((sum, addon) => sum + addon.total_price, 0);
    subtotal += addonsTotal;

    return {
      subtotal,
      total: subtotal, // Can add taxes, fees here later
    };
  }, []);

  // Sync cart with Medusa backend (optimistic update pattern)
  const syncWithMedusa = useCallback(async (
    medusaCartId: string | null,
    tour: Tour | null,
    participants: number,
    addons: SelectedAddOn[]
  ): Promise<string | null> => {
    // Don't block on Medusa sync - handle asynchronously
    if (syncInProgress.current) return null;

    try {
      syncInProgress.current = true;

      // If no cart exists in Medusa yet, create one
      if (!medusaCartId && tour) {
        console.log('[useCart] Creating new Medusa cart');
        const newCart = await createCart(DEFAULT_REGION_ID);

        // Update state with new cart ID
        setCart((prev) => ({ ...prev, medusa_cart_id: newCart.id }));

        // TODO: Add tour as line item
        // Note: We need variant_id from Medusa products
        console.log('[useCart] New Medusa cart created:', newCart.id);
        return newCart.id;
      }

      // TODO: Sync line items with Medusa
      // This would involve:
      // 1. Comparing local addons with Medusa line items
      // 2. Adding missing items
      // 3. Updating quantities
      // 4. Removing items not in local state

      return null;
    } catch (error) {
      console.error('[useCart] Error syncing with Medusa:', error);
      // Don't throw - continue with localStorage only
      return null;
    } finally {
      syncInProgress.current = false;
    }
  }, []);

  const setTour = useCallback(async (tour: Tour) => {
    // Optimistic update: Update localStorage immediately
    setCart((prev) => {
      const totals = calculateTotals(tour, prev.participants, prev.selected_addons);
      return {
        ...prev,
        tour,
        ...totals,
      };
    });

    // Async: Create Medusa cart if needed
    try {
      if (!cart.medusa_cart_id) {
        console.log('[useCart] Creating Medusa cart for new tour selection');
        const medusaCart = await createCart(DEFAULT_REGION_ID);

        setCart((prev) => ({
          ...prev,
          medusa_cart_id: medusaCart.id,
        }));

        // TODO: Add tour as line item once we have variant mapping
        console.log('[useCart] Medusa cart created:', medusaCart.id);
      }
    } catch (error) {
      console.error('[useCart] Error creating Medusa cart (continuing with localStorage):', error);
      // Continue - localStorage is still updated
    }
  }, [cart.medusa_cart_id, calculateTotals]);

  const setParticipants = useCallback(async (count: number) => {
    const newCount = Math.max(1, count);

    // Optimistic update: Update localStorage immediately
    setCart((prev) => {
      const totals = calculateTotals(prev.tour, newCount, prev.selected_addons);
      return {
        ...prev,
        participants: newCount,
        ...totals,
      };
    });

    // Async: Update line item quantities in Medusa if cart exists
    try {
      if (cart.medusa_cart_id) {
        // TODO: Update tour line item quantity based on participant count
        // This requires mapping participants to line item quantity
        console.log('[useCart] Participant count changed, Medusa sync needed');
      }
    } catch (error) {
      console.error('[useCart] Error updating Medusa cart (continuing with localStorage):', error);
    }
  }, [cart.medusa_cart_id, calculateTotals]);

  const setTourStartDate = useCallback((date: string) => {
    setCart((prev) => ({
      ...prev,
      tour_start_date: date,
    }));

    // TODO: Update cart metadata in Medusa if needed
  }, []);

  const addAddOn = useCallback(async (addon: AddOn, quantity: number = 1) => {
    // Optimistic update: Update localStorage immediately
    setCart((prev) => {
      const existingIndex = prev.selected_addons.findIndex((a) => a.id === addon.id);
      let newAddons: SelectedAddOn[];

      if (existingIndex >= 0) {
        newAddons = [...prev.selected_addons];
        const existing = newAddons[existingIndex];
        if (existing) {
          const newQuantity = existing.quantity + quantity;
          const totalPrice = calculateAddOnPrice(addon, newQuantity, prev.tour, prev.participants);
          newAddons[existingIndex] = {
            ...addon,
            quantity: newQuantity,
            total_price: totalPrice,
          };
        }
      } else {
        const totalPrice = calculateAddOnPrice(addon, quantity, prev.tour, prev.participants);
        const selectedAddOn: SelectedAddOn = {
          ...addon,
          quantity,
          total_price: totalPrice,
        };
        newAddons = [...prev.selected_addons, selectedAddOn];
      }

      const totals = calculateTotals(prev.tour, prev.participants, newAddons);

      return {
        ...prev,
        selected_addons: newAddons,
        ...totals,
      };
    });

    // Async: Add line item to Medusa cart
    try {
      if (cart.medusa_cart_id) {
        // TODO: Map addon.id to Medusa variant_id
        // For now, we log the intent
        console.log('[useCart] Add-on added, Medusa line item sync needed:', addon.id);

        // Example when variant mapping is available:
        // const variantId = mapAddonToVariantId(addon.id);
        // await cartService.addLineItem(cart.medusa_cart_id, variantId, quantity);
      }
    } catch (error) {
      console.error('[useCart] Error adding line item to Medusa (continuing with localStorage):', error);
    }
  }, [cart.medusa_cart_id, calculateTotals]);

  const removeAddOn = useCallback(async (addonId: string) => {
    // Optimistic update: Update localStorage immediately
    setCart((prev) => {
      const newAddons = prev.selected_addons.filter((addon) => addon.id !== addonId);
      const totals = calculateTotals(prev.tour, prev.participants, newAddons);

      return {
        ...prev,
        selected_addons: newAddons,
        ...totals,
      };
    });

    // Async: Remove line item from Medusa cart
    try {
      if (cart.medusa_cart_id) {
        // TODO: Find line item ID for addon and remove it
        console.log('[useCart] Add-on removed, Medusa line item removal needed:', addonId);

        // Example when line item mapping is available:
        // const lineItemId = findLineItemIdForAddon(addonId);
        // await cartService.updateLineItem(cart.medusa_cart_id, lineItemId, 0);
      }
    } catch (error) {
      console.error('[useCart] Error removing line item from Medusa (continuing with localStorage):', error);
    }
  }, [cart.medusa_cart_id, calculateTotals]);

  const updateAddOnQuantity = useCallback(async (addonId: string, quantity: number) => {
    // Optimistic update: Update localStorage immediately
    setCart((prev) => {
      if (quantity <= 0) {
        const newAddons = prev.selected_addons.filter((addon) => addon.id !== addonId);
        const totals = calculateTotals(prev.tour, prev.participants, newAddons);
        return {
          ...prev,
          selected_addons: newAddons,
          ...totals,
        };
      }

      const newAddons = prev.selected_addons.map((addon) => {
        if (addon.id === addonId) {
          const totalPrice = calculateAddOnPrice(addon, quantity, prev.tour, prev.participants);
          return {
            ...addon,
            quantity,
            total_price: totalPrice,
          };
        }
        return addon;
      });

      const totals = calculateTotals(prev.tour, prev.participants, newAddons);

      return {
        ...prev,
        selected_addons: newAddons,
        ...totals,
      };
    });

    // Async: Update line item quantity in Medusa cart
    try {
      if (cart.medusa_cart_id) {
        // TODO: Find line item ID and update quantity
        console.log('[useCart] Add-on quantity updated, Medusa line item update needed:', addonId, quantity);

        // Example when line item mapping is available:
        // const lineItemId = findLineItemIdForAddon(addonId);
        // await cartService.updateLineItem(cart.medusa_cart_id, lineItemId, quantity);
      }
    } catch (error) {
      console.error('[useCart] Error updating line item in Medusa (continuing with localStorage):', error);
    }
  }, [cart.medusa_cart_id, calculateTotals]);

  const clearCart = useCallback(() => {
    const emptyCart: CartState = {
      tour: null,
      participants: 1,
      tour_start_date: null,
      selected_addons: [],
      subtotal: 0,
      total: 0,
      medusa_cart_id: null,
    };
    setCart(emptyCart);
    if (typeof window !== 'undefined') {
      localStorage.removeItem(CART_STORAGE_KEY);
    }

    // Note: We don't delete the Medusa cart here
    // It will expire naturally or can be completed later
  }, []);

  const getCartSummary = useCallback(() => cart, [cart]);

  const getMedusaCartId = useCallback(() => cart.medusa_cart_id, [cart.medusa_cart_id]);

  return {
    cart,
    setTour,
    setParticipants,
    setTourStartDate,
    addAddOn,
    removeAddOn,
    updateAddOnQuantity,
    clearCart,
    getCartSummary,
    getMedusaCartId,
  };
}

// Helper function to calculate add-on price based on pricing type
function calculateAddOnPrice(
  addon: AddOn,
  quantity: number,
  tour: Tour | null,
  participants: number
): number {
  switch (addon.pricing_type) {
    case 'per_booking':
      return addon.price * quantity;
    case 'per_day':
      const days = tour?.duration_days || 1;
      return addon.price * quantity * days;
    case 'per_person':
      return addon.price * quantity * participants;
    default:
      return addon.price * quantity;
  }
}
