'use client';

import React, { createContext, useContext, ReactNode } from 'react';
import { useCart as useCartHook } from '../../lib/hooks/useCart';
import type { CartState } from '../../lib/types/checkout';
import type { Tour, AddOn } from '../../lib/types/checkout';

interface CartContextValue {
  cart: CartState;
  setTour: (tour: Tour) => Promise<void>;
  setParticipants: (count: number) => Promise<void>;
  setTourStartDate: (date: string) => void;
  addAddOn: (addon: AddOn, quantity?: number) => Promise<void>;
  removeAddOn: (addonId: string) => Promise<void>;
  updateAddOnQuantity: (addonId: string, quantity: number) => Promise<void>;
  clearCart: () => void;
  getCartSummary: () => CartState;
  getMedusaCartId: () => string | null;
}

const CartContext = createContext<CartContextValue | undefined>(undefined);

interface CartProviderProps {
  children: ReactNode;
}

export function CartProvider({ children }: CartProviderProps) {
  const cartHook = useCartHook();

  // Type assertion needed due to cart.ts vs checkout.ts type differences
  return (
    <CartContext.Provider value={cartHook as any}>
      {children}
    </CartContext.Provider>
  );
}

export function useCartContext() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCartContext must be used within a CartProvider');
  }
  return context;
}
