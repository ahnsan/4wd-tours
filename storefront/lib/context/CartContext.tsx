/**
 * Cart Context with Real Medusa Backend Integration
 *
 * Manages cart state with:
 * - Real Medusa API integration
 * - Optimistic UI updates
 * - Cart persistence across sessions
 * - Error handling and recovery
 * - Automatic cart sync
 */

'use client';

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import type {
  CartState,
  CartContextValue,
  Tour,
  Addon,
  CartAddon,
  TourBooking,
  AddTourParams,
  AddAddonParams,
  CartSummary,
  TourLineItemMetadata,
  AddonLineItemMetadata,
} from '@/lib/types/cart';
import {
  CART_STORAGE_KEYS,
  DEFAULT_CART_CONFIG,
} from '@/lib/types/cart';
import type { MedusaCart, CartLineItem } from '@/lib/data/cart-service';
import {
  createCart,
  getCart,
  addLineItem,
  updateLineItem,
  removeLineItem,
  updateCartMetadata,
} from '@/lib/data/cart-service';
import {
  calculateTourPrice,
  calculateEndDate,
  calculateAddonPrice,
  calculateAddonsTotal,
  calculateSubtotal,
  calculateTax,
  calculateGrandTotal,
  validateParticipants,
  validateQuantity,
} from '@/lib/utils/priceCalculations';

// ============================================================================
// Initial State
// ============================================================================

const initialState: CartState = {
  cart_id: null,
  tour_booking: null,
  addons: [],
  tour_total_cents: 0,
  addons_total_cents: 0,
  subtotal_cents: 0,
  tax_cents: 0,
  total_cents: 0,
  isLoading: false,
  error: null,
  last_synced_at: null,
};

// ============================================================================
// Context Creation
// ============================================================================

const CartContext = createContext<CartContextValue | undefined>(undefined);

// ============================================================================
// Cart Provider Component
// ============================================================================

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<CartState>(initialState);
  const syncIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isInitializedRef = useRef(false);

  // ============================================================================
  // Helper Functions
  // ============================================================================

  /**
   * Update cart totals
   */
  const updateCartTotals = useCallback((state: CartState): CartState => {
    const tourTotal = state.tour_booking?.total_price_cents || 0;
    const addonsTotal = calculateAddonsTotal(state.addons);
    const subtotal = calculateSubtotal(tourTotal, addonsTotal);
    const tax = calculateTax(subtotal, DEFAULT_CART_CONFIG.tax_rate);
    const total = calculateGrandTotal(subtotal, tax);

    return {
      ...state,
      tour_total_cents: tourTotal,
      addons_total_cents: addonsTotal,
      subtotal_cents: subtotal,
      tax_cents: tax,
      total_cents: total,
    };
  }, []);

  /**
   * Save cart ID to localStorage
   */
  const saveCartIdToStorage = useCallback((cartId: string) => {
    try {
      localStorage.setItem(CART_STORAGE_KEYS.CART_ID, cartId);
      localStorage.setItem(
        CART_STORAGE_KEYS.LAST_SYNCED,
        new Date().toISOString()
      );
    } catch (error) {
      console.error('[CartContext] Failed to save cart ID to localStorage:', error);
    }
  }, []);

  /**
   * Load cart ID from localStorage
   */
  const loadCartIdFromStorage = useCallback((): string | null => {
    try {
      return localStorage.getItem(CART_STORAGE_KEYS.CART_ID);
    } catch (error) {
      console.error('[CartContext] Failed to load cart ID from localStorage:', error);
      return null;
    }
  }, []);

  /**
   * Clear cart ID from localStorage
   */
  const clearCartIdFromStorage = useCallback(() => {
    try {
      localStorage.removeItem(CART_STORAGE_KEYS.CART_ID);
      localStorage.removeItem(CART_STORAGE_KEYS.LAST_SYNCED);
    } catch (error) {
      console.error('[CartContext] Failed to clear cart ID from localStorage:', error);
    }
  }, []);

  /**
   * Create or get existing Medusa cart
   */
  const ensureCart = useCallback(async (): Promise<string> => {
    let cartId = cart.cart_id || loadCartIdFromStorage();

    // Try to retrieve existing cart
    if (cartId) {
      try {
        const existingCart = await getCart(cartId);
        if (existingCart && !existingCart.completed_at) {
          return cartId;
        }
      } catch (error) {
        console.warn('[CartContext] Existing cart not found or invalid, creating new cart');
        clearCartIdFromStorage();
        cartId = null;
      }
    }

    // Create new cart
    const newCart = await createCart();
    saveCartIdToStorage(newCart.id);
    setCart((prev) => ({ ...prev, cart_id: newCart.id }));
    return newCart.id;
  }, [cart.cart_id, loadCartIdFromStorage, saveCartIdToStorage, clearCartIdFromStorage]);

  /**
   * Sync cart state from Medusa backend
   */
  const syncCartFromBackend = useCallback(async (cartId: string) => {
    try {
      console.log('[CartContext] Syncing cart from backend, cart_id:', cartId);
      const medusaCart = await getCart(cartId);
      console.log('[CartContext] Retrieved cart with', medusaCart.items.length, 'items');

      // Parse cart and rebuild state
      const tourLineItem = medusaCart.items.find(
        (item) => (item.metadata as TourLineItemMetadata)?.type === 'tour'
      );
      const addonLineItems = medusaCart.items.filter(
        (item) => (item.metadata as AddonLineItemMetadata)?.type === 'addon'
      );

      let tourBooking: TourBooking | null = null;
      const addons: CartAddon[] = [];

      console.log('[CartContext] Found tour line item:', !!tourLineItem, 'addon items:', addonLineItems.length);

      // Reconstruct tour booking
      if (tourLineItem) {
        const metadata = tourLineItem.metadata as TourLineItemMetadata;
        tourBooking = {
          tour: {
            id: metadata.tour_id,
            variant_id: tourLineItem.variant_id,
            handle: metadata.tour_handle,
            title: tourLineItem.title || '',
            description: tourLineItem.description || '',
            base_price_cents: metadata.base_price_cents,
            duration_days: metadata.duration_days,
            thumbnail: tourLineItem.thumbnail,
          },
          participants: metadata.participants,
          start_date: metadata.start_date,
          end_date: metadata.end_date,
          total_price_cents: tourLineItem.total || 0,
          line_item_id: tourLineItem.id,
        };
      }

      // Reconstruct addons
      for (const item of addonLineItems) {
        const metadata = item.metadata as AddonLineItemMetadata;
        addons.push({
          addon: {
            id: metadata.addon_id,
            variant_id: item.variant_id,
            title: item.title || '',
            description: item.description || '',
            price_cents: metadata.base_price_cents,
            pricing_type: metadata.pricing_type,
            category: '', // Category not stored in metadata
            available: true,
            thumbnail: item.thumbnail,
          },
          quantity: item.quantity,
          calculated_price_cents: metadata.calculated_price_cents,
          line_item_id: item.id,
        });
      }

      setCart((prev) => {
        const updatedState = updateCartTotals({
          ...prev,
          cart_id: cartId,
          tour_booking: tourBooking,
          addons,
          last_synced_at: new Date().toISOString(),
          error: null,
        });

        console.log('[CartContext] Cart sync complete. Tour booking:', !!updatedState.tour_booking);
        return updatedState;
      });
    } catch (error) {
      console.error('[CartContext] Failed to sync cart from backend:', error);

      // CRITICAL FIX: Handle 404 errors (stale cart IDs)
      if ((error as any).status === 404 || (error as any).code === 'CART_NOT_FOUND') {
        console.warn('[CartContext] Cart not found (404), clearing stale cart ID');
        clearCartIdFromStorage();
        setCart((prev) => ({ ...initialState, isLoading: false }));
        return; // Don't throw - gracefully recover
      }

      throw error;
    }
  }, [updateCartTotals, clearCartIdFromStorage]);

  // ============================================================================
  // Cart Operations
  // ============================================================================

  /**
   * Add tour to cart
   */
  const addTourToCart = useCallback(
    async ({ tour, participants, start_date }: AddTourParams) => {
      try {
        setCart((prev) => ({ ...prev, isLoading: true, error: null }));

        // Validate inputs
        validateParticipants(
          participants,
          tour.metadata?.min_participants,
          tour.metadata?.max_participants
        );

        // Calculate tour pricing
        const totalPrice = calculateTourPrice(tour, participants);
        const endDate = calculateEndDate(start_date, tour.duration_days);

        // Ensure cart exists
        const cartId = await ensureCart();

        // Remove existing tour if any
        if (cart.tour_booking?.line_item_id) {
          await removeLineItem(cartId, cart.tour_booking.line_item_id);
        }

        // Add tour as line item to Medusa
        const metadata: TourLineItemMetadata = {
          type: 'tour',
          tour_id: tour.id,
          tour_handle: tour.handle,
          participants,
          start_date,
          end_date: endDate,
          duration_days: tour.duration_days,
          base_price_cents: tour.base_price_cents,
        };

        const updatedCart = await addLineItem(
          cartId,
          tour.variant_id,
          1, // Tours are always quantity 1
          metadata
        );

        // Update cart metadata with tour info
        await updateCartMetadata(cartId, {
          tour_booking: {
            tour_id: tour.id,
            tour_handle: tour.handle,
            participants,
            start_date,
            end_date: endDate,
            duration_days: tour.duration_days,
          },
          addon_pricing_context: {
            duration_days: tour.duration_days,
            participants,
          },
        });

        // Sync cart state
        await syncCartFromBackend(cartId);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to add tour to cart';
        console.error('[CartContext] Add tour error:', error);
        setCart((prev) => ({ ...prev, error: errorMessage, isLoading: false }));
        throw error;
      } finally {
        setCart((prev) => ({ ...prev, isLoading: false }));
      }
    },
    [cart.tour_booking, ensureCart, syncCartFromBackend]
  );

  /**
   * Update tour participants
   */
  const updateTourParticipants = useCallback(
    async (participants: number) => {
      if (!cart.tour_booking) {
        throw new Error('No tour in cart');
      }

      await addTourToCart({
        tour: cart.tour_booking.tour,
        participants,
        start_date: cart.tour_booking.start_date,
      });
    },
    [cart.tour_booking, addTourToCart]
  );

  /**
   * Update tour dates
   */
  const updateTourDates = useCallback(
    async (start_date: string) => {
      if (!cart.tour_booking) {
        throw new Error('No tour in cart');
      }

      await addTourToCart({
        tour: cart.tour_booking.tour,
        participants: cart.tour_booking.participants,
        start_date,
      });
    },
    [cart.tour_booking, addTourToCart]
  );

  /**
   * Remove tour from cart
   */
  const removeTour = useCallback(async () => {
    if (!cart.tour_booking?.line_item_id || !cart.cart_id) {
      return;
    }

    try {
      setCart((prev) => ({ ...prev, isLoading: true, error: null }));

      await removeLineItem(cart.cart_id, cart.tour_booking.line_item_id);
      await syncCartFromBackend(cart.cart_id);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to remove tour';
      console.error('[CartContext] Remove tour error:', error);
      setCart((prev) => ({ ...prev, error: errorMessage, isLoading: false }));
      throw error;
    } finally {
      setCart((prev) => ({ ...prev, isLoading: false }));
    }
  }, [cart.cart_id, cart.tour_booking, syncCartFromBackend]);

  /**
   * Add addon to cart
   */
  const addAddonToCart = useCallback(
    async ({ addon, quantity = 1 }: AddAddonParams) => {
      console.log('[CartContext] addAddonToCart called with:', {
        addon_id: addon?.id,
        addon_title: addon?.title,
        addon_has_variant_id: !!addon?.variant_id,
        addon_variant_id: addon?.variant_id,
        addon_price_cents: addon?.price_cents,
        quantity,
        has_tour_booking: !!cart.tour_booking,
        cart_id: cart.cart_id
      });

      if (!cart.tour_booking) {
        throw new Error('Must add tour before adding addons');
      }

      // Validate addon parameter
      if (!addon) {
        throw new Error('Addon is required');
      }

      // CRITICAL: Validate variant_id exists
      if (!addon.variant_id) {
        const errorMsg = `Addon "${addon.title}" (id: ${addon.id}) is missing variant_id. Cannot add to cart.`;
        console.error('[CartContext] ' + errorMsg);
        throw new Error(errorMsg);
      }

      try {
        setCart((prev) => ({ ...prev, isLoading: true, error: null }));

        // Validate quantity with proper null/undefined checks
        const maxQuantity = addon.metadata?.max_quantity;
        validateQuantity(quantity, maxQuantity);

        // Calculate addon price
        const calculatedPrice = calculateAddonPrice(addon, quantity, {
          tour_duration_days: cart.tour_booking.tour.duration_days,
          participants: cart.tour_booking.participants,
        });

        console.log('[CartContext] Calculated addon price:', calculatedPrice);

        const cartId = await ensureCart();

        // Check if addon already exists
        const existingAddon = cart.addons.find((a) => a.addon.id === addon.id);

        if (existingAddon?.line_item_id) {
          console.log('[CartContext] Updating existing addon line item:', existingAddon.line_item_id);
          // Update existing addon
          await updateLineItem(cartId, existingAddon.line_item_id, quantity);
        } else {
          console.log('[CartContext] Adding NEW addon to cart with variant_id:', addon.variant_id);
          // Add new addon
          const metadata: AddonLineItemMetadata = {
            type: 'addon',
            addon_id: addon.id,
            pricing_type: addon.pricing_type,
            base_price_cents: addon.price_cents,
            calculation_context: {
              duration_days: cart.tour_booking.tour.duration_days,
              participants: cart.tour_booking.participants,
            },
            calculated_price_cents: calculatedPrice,
          };

          await addLineItem(cartId, addon.variant_id, quantity, metadata);
        }

        await syncCartFromBackend(cartId);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to add addon';
        console.error('[CartContext] Add addon error:', error);
        setCart((prev) => ({ ...prev, error: errorMessage, isLoading: false }));
        throw error;
      } finally {
        setCart((prev) => ({ ...prev, isLoading: false }));
      }
    },
    [cart.tour_booking, cart.addons, ensureCart, syncCartFromBackend]
  );

  /**
   * Remove addon from cart
   */
  const removeAddonFromCart = useCallback(
    async (addonId: string) => {
      const addon = cart.addons.find((a) => a.addon.id === addonId);
      if (!addon?.line_item_id || !cart.cart_id) {
        return;
      }

      try {
        setCart((prev) => ({ ...prev, isLoading: true, error: null }));

        await removeLineItem(cart.cart_id, addon.line_item_id);
        await syncCartFromBackend(cart.cart_id);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to remove addon';
        console.error('[CartContext] Remove addon error:', error);
        setCart((prev) => ({ ...prev, error: errorMessage, isLoading: false }));
        throw error;
      } finally {
        setCart((prev) => ({ ...prev, isLoading: false }));
      }
    },
    [cart.cart_id, cart.addons, syncCartFromBackend]
  );

  /**
   * Update addon quantity
   */
  const updateAddonQuantity = useCallback(
    async (addonId: string, quantity: number) => {
      const addon = cart.addons.find((a) => a.addon.id === addonId);
      if (!addon) {
        throw new Error('Addon not found in cart');
      }

      if (quantity === 0) {
        await removeAddonFromCart(addonId);
        return;
      }

      await addAddonToCart({ addon: addon.addon, quantity });
    },
    [cart.addons, addAddonToCart, removeAddonFromCart]
  );

  /**
   * Clear entire cart
   */
  const clearCart = useCallback(async () => {
    try {
      setCart((prev) => ({ ...prev, isLoading: true, error: null }));

      clearCartIdFromStorage();
      setCart(initialState);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to clear cart';
      console.error('[CartContext] Clear cart error:', error);
      setCart((prev) => ({ ...prev, error: errorMessage, isLoading: false }));
      throw error;
    } finally {
      setCart((prev) => ({ ...prev, isLoading: false }));
    }
  }, [clearCartIdFromStorage]);

  /**
   * Refresh cart from backend
   */
  const refreshCart = useCallback(async () => {
    const cartId = cart.cart_id || loadCartIdFromStorage();
    if (!cartId) return;

    try {
      await syncCartFromBackend(cartId);
    } catch (error) {
      console.error('[CartContext] Failed to refresh cart:', error);
    }
  }, [cart.cart_id, loadCartIdFromStorage, syncCartFromBackend]);

  // ============================================================================
  // Cart Summary Functions
  // ============================================================================

  /**
   * Get cart total
   */
  const getCartTotal = useCallback((): number => {
    return cart.total_cents;
  }, [cart.total_cents]);

  /**
   * Get cart ID
   */
  const getCartId = useCallback((): string | null => {
    return cart.cart_id;
  }, [cart.cart_id]);

  /**
   * Get addons grouped by category
   */
  const getAddonsByCategory = useCallback((): Record<string, CartAddon[]> => {
    return cart.addons.reduce((acc, addon) => {
      const category = addon.addon.category || 'Other';
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(addon);
      return acc;
    }, {} as Record<string, CartAddon[]>);
  }, [cart.addons]);

  /**
   * Get complete cart summary
   */
  const getCartSummary = useCallback((): CartSummary => {
    return {
      tour_booking: cart.tour_booking,
      addons: cart.addons,
      addons_by_category: getAddonsByCategory(),
      tour_total_cents: cart.tour_total_cents,
      addons_total_cents: cart.addons_total_cents,
      subtotal_cents: cart.subtotal_cents,
      tax_cents: cart.tax_cents,
      total_cents: cart.total_cents,
      item_count: (cart.tour_booking ? 1 : 0) + cart.addons.length,
    };
  }, [cart, getAddonsByCategory]);

  // ============================================================================
  // Initialization and Persistence
  // ============================================================================

  useEffect(() => {
    if (isInitializedRef.current) return;
    isInitializedRef.current = true;

    console.log('[CartContext] Initializing cart context...');

    // Load cart from localStorage on mount
    const cartId = loadCartIdFromStorage();
    if (cartId) {
      console.log('[CartContext] Found cart_id in localStorage:', cartId);
      // Set loading state while syncing cart
      setCart((prev) => ({ ...prev, isLoading: true, cart_id: cartId }));

      syncCartFromBackend(cartId)
        .catch((error) => {
          console.error('[CartContext] Failed to load cart on mount:', error);
          clearCartIdFromStorage();
          // Reset to initial state on error
          setCart((prev) => ({ ...initialState }));
        })
        .finally(() => {
          // Clear loading state after sync completes
          console.log('[CartContext] Cart initialization complete');
          setCart((prev) => ({ ...prev, isLoading: false }));
        });
    } else {
      console.log('[CartContext] No cart_id in localStorage, starting with empty cart');
      // No cart ID in storage - ensure loading is false
      setCart((prev) => ({ ...prev, isLoading: false }));
    }

    // Set up auto-sync interval
    syncIntervalRef.current = setInterval(() => {
      const currentCartId = loadCartIdFromStorage();
      if (currentCartId) {
        syncCartFromBackend(currentCartId).catch((error) => {
          console.error('[CartContext] Auto-sync failed:', error);

          // CRITICAL FIX: Clear stale cart ID on 404 errors during auto-sync
          if ((error as any).status === 404 || (error as any).code === 'CART_NOT_FOUND') {
            console.warn('[CartContext] Cart not found during auto-sync, clearing stale cart ID');
            clearCartIdFromStorage();
            setCart((prev) => ({ ...initialState, isLoading: false }));
          }
        });
      }
    }, DEFAULT_CART_CONFIG.auto_sync_interval_ms);

    return () => {
      if (syncIntervalRef.current) {
        clearInterval(syncIntervalRef.current);
      }
    };
  }, [loadCartIdFromStorage, syncCartFromBackend, clearCartIdFromStorage]);

  // ============================================================================
  // Context Value
  // ============================================================================

  const contextValue: CartContextValue = {
    cart,
    getCartId,
    addTourToCart,
    updateTourParticipants,
    updateTourDates,
    removeTour,
    addAddonToCart,
    removeAddonFromCart,
    updateAddonQuantity,
    clearCart,
    refreshCart,
    getCartTotal,
    getCartSummary,
    getAddonsByCategory,
  };

  return <CartContext.Provider value={contextValue}>{children}</CartContext.Provider>;
}

// ============================================================================
// Hook to use Cart Context
// ============================================================================

export function useCartContext(): CartContextValue {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCartContext must be used within CartProvider');
  }
  return context;
}
