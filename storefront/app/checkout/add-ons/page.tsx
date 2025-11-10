'use client';

import React, { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCartContext } from '../../../lib/context/CartContext';
import { getCategorySteps } from '../../../lib/data/addon-flow-service';
import { getCategoryUrl } from '../../../lib/utils/category-slugs';

/**
 * Add-ons Page Redirect
 *
 * This page redirects users to the multi-step category-based add-ons flow
 * for an enhanced user experience with guided category selection.
 *
 * Flow: /checkout/add-ons → /checkout/add-ons/{first-category}
 */

function AddOnsPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { cart } = useCartContext();

  // Redirect to multi-step flow on mount
  useEffect(() => {
    async function redirectToFlow() {
      try {
        // OPTIMIZED: Get tour handle from URL parameter first (faster, no cart wait)
        // Fallback to cart context if URL param not available
        let tourHandle = searchParams.get('tour');

        if (!tourHandle) {
          // Wait for cart to finish loading only if we need it
          if (cart.isLoading) {
            console.log('[Add-ons Redirect] Cart is loading, waiting...');
            return;
          }

          tourHandle = cart.tour_booking?.tour?.handle || null;
        }

        if (!tourHandle) {
          console.warn('[Add-ons Redirect] No tour selected, redirecting to tours');
          router.replace('/tours');
          return;
        }

        console.log('[Add-ons Redirect] Using tour handle:', tourHandle);

        // Get available category steps for this tour
        const steps = await getCategorySteps(tourHandle);

        if (steps.length > 0 && steps[0]) {
          // Redirect to first category
          const firstCategoryUrl = getCategoryUrl(steps[0].categoryName);
          console.log(`[Add-ons Redirect] Redirecting to ${firstCategoryUrl}`);
          router.replace(firstCategoryUrl);
        } else {
          // No categories available - skip to checkout
          console.warn('[Add-ons Redirect] No add-ons available, skipping to checkout');
          router.replace('/checkout');
        }
      } catch (error) {
        console.error('[Add-ons Redirect] Error during redirect:', error);
        // Fallback to flow page
        router.replace('/checkout/add-ons-flow');
      }
    }

    redirectToFlow();
  }, [router, searchParams, cart.tour_booking?.tour?.handle, cart.isLoading]);

  // Show loading state while redirecting
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)'
    }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{
          width: '48px',
          height: '48px',
          border: '4px solid #e5e7eb',
          borderTop: '4px solid #667eea',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
          margin: '0 auto 1rem'
        }}></div>
        <p style={{ color: '#6b7280', fontSize: '1rem' }}>
          Loading add-ons...
        </p>
        <style dangerouslySetInnerHTML={{
          __html: `
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `
        }} />
      </div>
    </div>
  );
}

export default function AddOnsPage() {
  return <AddOnsPageContent />;
}
