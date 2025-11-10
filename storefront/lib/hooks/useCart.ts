/**
 * useCart Hook - Convenient Cart Access
 *
 * Exposes cart context with helpful utilities and computed values.
 * This hook provides a clean interface to the cart system.
 */

'use client';

import { useCartContext } from '@/lib/context/CartContext';
import type { CartContextValue, CartSummary } from '@/lib/types/cart';
import { formatCentsToDisplay, generatePriceBreakdown } from '@/lib/utils/priceCalculations';
import { useMemo } from 'react';

/**
 * Extended cart hook with helper functions
 */
export interface UseCartReturn extends CartContextValue {
  // Computed values
  isEmpty: boolean;
  hasTour: boolean;
  hasAddons: boolean;
  itemCount: number;

  // Formatted values
  formattedTotal: string;
  formattedSubtotal: string;
  formattedTax: string;
  formattedTourTotal: string;
  formattedAddonsTotal: string;

  // Price breakdown
  priceBreakdown: ReturnType<typeof generatePriceBreakdown>;
}

/**
 * Main useCart hook
 *
 * Provides access to cart state and operations with helpful utilities.
 *
 * @returns Cart context with computed values and helpers
 *
 * @example
 * function CartComponent() {
 *   const {
 *     cart,
 *     addTourToCart,
 *     addAddonToCart,
 *     isEmpty,
 *     formattedTotal,
 *     priceBreakdown
 *   } = useCart();
 *
 *   if (isEmpty) {
 *     return <EmptyCart />;
 *   }
 *
 *   return (
 *     <div>
 *       <h2>Total: {formattedTotal}</h2>
 *       {cart.tour_booking && (
 *         <TourCard booking={cart.tour_booking} />
 *       )}
 *       {cart.addons.map(addon => (
 *         <AddonCard key={addon.addon.id} addon={addon} />
 *       ))}
 *     </div>
 *   );
 * }
 */
export function useCart(): UseCartReturn {
  const context = useCartContext();

  // Computed values
  const isEmpty = useMemo(
    () => !context.cart.tour_booking && context.cart.addons.length === 0,
    [context.cart.tour_booking, context.cart.addons]
  );

  const hasTour = useMemo(() => context.cart.tour_booking !== null, [context.cart.tour_booking]);

  const hasAddons = useMemo(() => context.cart.addons.length > 0, [context.cart.addons]);

  const itemCount = useMemo(
    () => (context.cart.tour_booking ? 1 : 0) + context.cart.addons.length,
    [context.cart.tour_booking, context.cart.addons]
  );

  // Formatted currency values
  const formattedTotal = useMemo(
    () => formatCentsToDisplay(context.cart.total_cents),
    [context.cart.total_cents]
  );

  const formattedSubtotal = useMemo(
    () => formatCentsToDisplay(context.cart.subtotal_cents),
    [context.cart.subtotal_cents]
  );

  const formattedTax = useMemo(
    () => formatCentsToDisplay(context.cart.tax_cents),
    [context.cart.tax_cents]
  );

  const formattedTourTotal = useMemo(
    () => formatCentsToDisplay(context.cart.tour_total_cents),
    [context.cart.tour_total_cents]
  );

  const formattedAddonsTotal = useMemo(
    () => formatCentsToDisplay(context.cart.addons_total_cents),
    [context.cart.addons_total_cents]
  );

  // Price breakdown
  const priceBreakdown = useMemo(
    () => generatePriceBreakdown(context.cart.tour_booking, context.cart.addons),
    [context.cart.tour_booking, context.cart.addons]
  );

  return {
    ...context,
    isEmpty,
    hasTour,
    hasAddons,
    itemCount,
    formattedTotal,
    formattedSubtotal,
    formattedTax,
    formattedTourTotal,
    formattedAddonsTotal,
    priceBreakdown,
  };
}

/**
 * Hook for cart loading state
 *
 * Useful for showing loading spinners in UI
 *
 * @example
 * function CartButton() {
 *   const { isLoading } = useCartLoading();
 *
 *   return (
 *     <button disabled={isLoading}>
 *       {isLoading ? 'Loading...' : 'Add to Cart'}
 *     </button>
 *   );
 * }
 */
export function useCartLoading() {
  const { cart } = useCartContext();
  return {
    isLoading: cart.isLoading,
    error: cart.error,
  };
}

/**
 * Hook for cart tour booking
 *
 * Provides quick access to tour booking details
 *
 * @example
 * function TourSection() {
 *   const {
 *     tourBooking,
 *     hasTour,
 *     participants,
 *     startDate,
 *     updateParticipants
 *   } = useCartTour();
 *
 *   if (!hasTour) {
 *     return <SelectTourPrompt />;
 *   }
 *
 *   return (
 *     <div>
 *       <h3>{tourBooking.tour.title}</h3>
 *       <ParticipantSelector
 *         value={participants}
 *         onChange={updateParticipants}
 *       />
 *     </div>
 *   );
 * }
 */
export function useCartTour() {
  const { cart, updateTourParticipants, updateTourDates, removeTour } = useCartContext();

  return {
    tourBooking: cart.tour_booking,
    hasTour: cart.tour_booking !== null,
    participants: cart.tour_booking?.participants || 0,
    startDate: cart.tour_booking?.start_date || null,
    endDate: cart.tour_booking?.end_date || null,
    durationDays: cart.tour_booking?.tour.duration_days || 0,
    tourTotal: cart.tour_total_cents,
    formattedTourTotal: formatCentsToDisplay(cart.tour_total_cents),
    updateParticipants: updateTourParticipants,
    updateDates: updateTourDates,
    removeTour,
  };
}

/**
 * Hook for cart addons
 *
 * Provides quick access to addon operations and grouping
 *
 * @example
 * function AddonsSection() {
 *   const {
 *     addons,
 *     hasAddons,
 *     addonsByCategory,
 *     addAddon,
 *     removeAddon,
 *     updateQuantity
 *   } = useCartAddons();
 *
 *   return (
 *     <div>
 *       {Object.entries(addonsByCategory).map(([category, items]) => (
 *         <AddonCategory
 *           key={category}
 *           name={category}
 *           items={items}
 *           onRemove={removeAddon}
 *           onQuantityChange={updateQuantity}
 *         />
 *       ))}
 *     </div>
 *   );
 * }
 */
export function useCartAddons() {
  const {
    cart,
    addAddonToCart,
    removeAddonFromCart,
    updateAddonQuantity,
    getAddonsByCategory,
  } = useCartContext();

  const addonsByCategory = useMemo(() => getAddonsByCategory(), [getAddonsByCategory]);

  return {
    addons: cart.addons,
    hasAddons: cart.addons.length > 0,
    addonCount: cart.addons.length,
    addonsTotal: cart.addons_total_cents,
    formattedAddonsTotal: formatCentsToDisplay(cart.addons_total_cents),
    addonsByCategory,
    addAddon: addAddonToCart,
    removeAddon: removeAddonFromCart,
    updateQuantity: updateAddonQuantity,
  };
}

/**
 * Hook for cart summary
 *
 * Provides formatted cart summary for display
 *
 * @example
 * function CartSummary() {
 *   const summary = useCartSummary();
 *
 *   return (
 *     <div className="cart-summary">
 *       <div>
 *         <span>Tour Total:</span>
 *         <span>{summary.formattedTourTotal}</span>
 *       </div>
 *       <div>
 *         <span>Add-ons Total:</span>
 *         <span>{summary.formattedAddonsTotal}</span>
 *       </div>
 *       <div>
 *         <span>Subtotal:</span>
 *         <span>{summary.formattedSubtotal}</span>
 *       </div>
 *       <div>
 *         <span>Tax (10% GST):</span>
 *         <span>{summary.formattedTax}</span>
 *       </div>
 *       <div className="total">
 *         <span>Total:</span>
 *         <span>{summary.formattedTotal}</span>
 *       </div>
 *     </div>
 *   );
 * }
 */
export function useCartSummary() {
  const { getCartSummary } = useCartContext();

  const summary = useMemo(() => getCartSummary(), [getCartSummary]);

  return {
    ...summary,
    formattedTourTotal: formatCentsToDisplay(summary.tour_total_cents),
    formattedAddonsTotal: formatCentsToDisplay(summary.addons_total_cents),
    formattedSubtotal: formatCentsToDisplay(summary.subtotal_cents),
    formattedTax: formatCentsToDisplay(summary.tax_cents),
    formattedTotal: formatCentsToDisplay(summary.total_cents),
    isEmpty: summary.item_count === 0,
  };
}

/**
 * Hook for cart operations
 *
 * Provides only the cart operation methods (useful for components that only need actions)
 *
 * @example
 * function AddToCartButton({ tour, participants, startDate }) {
 *   const { addTour } = useCartOperations();
 *
 *   const handleClick = () => {
 *     addTour({ tour, participants, start_date: startDate });
 *   };
 *
 *   return <button onClick={handleClick}>Add to Cart</button>;
 * }
 */
export function useCartOperations() {
  const {
    addTourToCart,
    updateTourParticipants,
    updateTourDates,
    removeTour,
    addAddonToCart,
    removeAddonFromCart,
    updateAddonQuantity,
    clearCart,
    refreshCart,
  } = useCartContext();

  return {
    addTour: addTourToCart,
    updateTourParticipants,
    updateTourDates,
    removeTour,
    addAddon: addAddonToCart,
    removeAddon: removeAddonFromCart,
    updateAddonQuantity,
    clearCart,
    refreshCart,
  };
}

/**
 * Hook for cart ID
 *
 * Useful for tracking analytics or debugging
 *
 * @example
 * function DebugPanel() {
 *   const { cartId, hasCart } = useCartId();
 *
 *   return (
 *     <div>
 *       {hasCart ? `Cart ID: ${cartId}` : 'No cart'}
 *     </div>
 *   );
 * }
 */
export function useCartId() {
  const { getCartId } = useCartContext();

  const cartId = getCartId();

  return {
    cartId,
    hasCart: cartId !== null,
  };
}

// Export default hook
export default useCart;
