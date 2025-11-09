'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';

// Types
export interface Tour {
  id: string;
  handle?: string; // URL-friendly slug for routing
  title: string;
  description: string;
  price: number;
  duration: string;
  image: string;
  category: string;
  difficulty: string;
  maxParticipants: number;
}

export interface AddOn {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
}

export interface CartTour {
  tour: Tour;
  date: string;
  participants: number;
  subtotal: number;
}

export interface CartAddOn {
  addOn: AddOn;
  quantity: number;
  subtotal: number;
}

export interface CartState {
  tour: CartTour | null;
  addOns: CartAddOn[];
  total: number;
}

interface CartContextType {
  cart: CartState;
  addTour: (tour: Tour, date: string, participants: number) => void;
  updateParticipants: (participants: number) => void;
  addAddOn: (addOn: AddOn, quantity: number) => void;
  removeAddOn: (addOnId: string) => void;
  updateAddOnQuantity: (addOnId: string, quantity: number) => void;
  clearCart: () => void;
  getItemCount: () => number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const CART_STORAGE_KEY = 'sunshine-coast-4wd-cart';

// PCI-DSS COMPLIANCE NOTE:
// This cart state NEVER stores payment card data (card numbers, CVV, etc.)
// Payment data should only be sent directly to payment processors via tokenization
// NEVER store sensitive payment information in localStorage, sessionStorage, or cookies

const initialCartState: CartState = {
  tour: null,
  addOns: [],
  total: 0,
};

export function CartProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<CartState>(initialCartState);
  const [isHydrated, setIsHydrated] = useState(false);

  // Load cart from localStorage on mount
  useEffect(() => {
    try {
      const savedCart = localStorage.getItem(CART_STORAGE_KEY);
      if (savedCart) {
        setCart(JSON.parse(savedCart));
      }
    } catch (error) {
      console.error('Error loading cart from localStorage:', error);
    }
    setIsHydrated(true);
  }, []);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    if (isHydrated) {
      try {
        localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
      } catch (error) {
        console.error('Error saving cart to localStorage:', error);
      }
    }
  }, [cart, isHydrated]);

  // Calculate total
  const calculateTotal = (tour: CartTour | null, addOns: CartAddOn[]): number => {
    const tourTotal = tour ? tour.subtotal : 0;
    const addOnsTotal = addOns.reduce((sum, item) => sum + item.subtotal, 0);
    return tourTotal + addOnsTotal;
  };

  const addTour = (tour: Tour, date: string, participants: number) => {
    const subtotal = tour.price * participants;
    const newTour: CartTour = {
      tour,
      date,
      participants,
      subtotal,
    };
    setCart((prev) => ({
      ...prev,
      tour: newTour,
      total: calculateTotal(newTour, prev.addOns),
    }));
  };

  const updateParticipants = (participants: number) => {
    setCart((prev) => {
      if (!prev.tour) return prev;
      const subtotal = prev.tour.tour.price * participants;
      const newTour: CartTour = {
        ...prev.tour,
        participants,
        subtotal,
      };
      return {
        ...prev,
        tour: newTour,
        total: calculateTotal(newTour, prev.addOns),
      };
    });
  };

  const addAddOn = (addOn: AddOn, quantity: number) => {
    setCart((prev) => {
      const existingIndex = prev.addOns.findIndex((item) => item.addOn.id === addOn.id);
      let newAddOns: CartAddOn[];

      if (existingIndex > -1) {
        // Update existing add-on
        newAddOns = [...prev.addOns];
        const existing = newAddOns[existingIndex];
        if (existing) {
          newAddOns[existingIndex] = {
            addOn,
            quantity: existing.quantity + quantity,
            subtotal: addOn.price * (existing.quantity + quantity),
          };
        }
      } else {
        // Add new add-on
        newAddOns = [
          ...prev.addOns,
          {
            addOn,
            quantity,
            subtotal: addOn.price * quantity,
          },
        ];
      }

      return {
        ...prev,
        addOns: newAddOns,
        total: calculateTotal(prev.tour, newAddOns),
      };
    });
  };

  const removeAddOn = (addOnId: string) => {
    setCart((prev) => {
      const newAddOns = prev.addOns.filter((item) => item.addOn.id !== addOnId);
      return {
        ...prev,
        addOns: newAddOns,
        total: calculateTotal(prev.tour, newAddOns),
      };
    });
  };

  const updateAddOnQuantity = (addOnId: string, quantity: number) => {
    setCart((prev) => {
      const newAddOns = prev.addOns
        .map((item) => {
          if (item.addOn.id === addOnId) {
            if (quantity <= 0) return null;
            return {
              ...item,
              quantity,
              subtotal: item.addOn.price * quantity,
            };
          }
          return item;
        })
        .filter((item): item is CartAddOn => item !== null);

      return {
        ...prev,
        addOns: newAddOns,
        total: calculateTotal(prev.tour, newAddOns),
      };
    });
  };

  const clearCart = () => {
    setCart(initialCartState);
  };

  const getItemCount = (): number => {
    const tourCount = cart.tour ? 1 : 0;
    const addOnsCount = cart.addOns.reduce((sum, item) => sum + item.quantity, 0);
    return tourCount + addOnsCount;
  };

  const value: CartContextType = {
    cart,
    addTour,
    updateParticipants,
    addAddOn,
    removeAddOn,
    updateAddOnQuantity,
    clearCart,
    getItemCount,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextType {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
