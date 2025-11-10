'use client';

import React from 'react';
import { CartProvider } from '@/lib/context/CartContext';

/**
 * Client-side Providers Wrapper
 *
 * Wraps the application with client-side providers that need to be
 * available globally (like CartProvider).
 *
 * This component is 'use client' so it can be imported into the
 * Server Component root layout.
 */
export function ClientProviders({ children }: { children: React.ReactNode }) {
  return (
    <CartProvider>
      {children}
    </CartProvider>
  );
}
