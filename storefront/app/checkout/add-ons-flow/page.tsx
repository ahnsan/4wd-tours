'use client';

import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import { useCartContext } from '@/lib/context/CartContext';
import {
  getAddonPersuasiveCopy,
  calculateProgress,
  getNextStepIndex,
  getPreviousStepIndex,
  isLastStep,
  isFirstStep,
  type CategoryStep
} from '../../../lib/data/addon-flow-service';
// NEW: Use server-side filtered service
import { getCategoryStepsV2 } from '../../../lib/data/addon-flow-helpers';
// CRITICAL FIX: Use Addon from cart.ts (has variant_id), not AddOn from checkout.ts
import type { Addon } from '../../../lib/types/cart';
import { ToastProvider, useToast } from '../../../components/Checkout/ToastContainer';
import { detectIncompatibleAddons } from '../../../lib/data/addon-filtering';
import BookingSummary from '../../../components/Checkout/BookingSummary';
import styles from './addons-flow.module.css';

// Lazy load components for better performance with optimized loading
const AddOnCard = dynamic(() => import('../../../components/Checkout/AddOnCard'), {
  ssr: true,
  loading: () => <div style={{ minHeight: '260px', background: '#f5f5f5', borderRadius: '12px' }} />,
});

/**
 * Multi-Step Add-ons Flow - Main Content Component
 * Optimized with React.memo and useMemo for performance
 */
const AddOnsFlowContent = React.memo(function AddOnsFlowContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { showToast } = useToast();
  const { cart, addAddonToCart, removeAddonFromCart, updateAddonQuantity } = useCartContext();

  // State
  const [steps, setSteps] = useState<CategoryStep[]>([]);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [selectedAddOns, setSelectedAddOns] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);

  // Get current step from URL query param
  useEffect(() => {
    const stepParam = searchParams.get('step');
    if (stepParam) {
      const stepIndex = parseInt(stepParam, 10);
      if (!isNaN(stepIndex) && stepIndex >= 0) {
        setCurrentStepIndex(stepIndex);
      }
    }
  }, [searchParams]);

  // Load category steps - filter by tour handle
  useEffect(() => {
    async function loadSteps() {
      try {
        setIsLoading(true);

        // OPTIMIZED: Get tour handle from URL parameter first (faster, no cart wait)
        // Fallback to cart context if URL param not available
        let tourHandle = searchParams.get('tour');

        if (!tourHandle) {
          // Only wait for cart if we don't have URL parameter
          if (cart.isLoading) {
            console.log('[Add-ons Flow] Cart is loading, waiting...');
            setIsLoading(false);
            return;
          }

          tourHandle = cart.tour_booking?.tour?.handle || null;
        }

        if (!tourHandle) {
          console.warn('[Add-ons Flow] No tour handle available for filtering');
          setSteps([]);
          return;
        }

        console.log('[Add-ons Flow] Using tour handle:', tourHandle);

        // Load steps filtered by tour using NEW service (server-side filtering)
        const startTime = performance.now();
        const categorySteps = await getCategoryStepsV2(tourHandle);
        const endTime = performance.now();

        console.log(`[Add-ons Flow] Loaded ${categorySteps.length} steps in ${(endTime - startTime).toFixed(2)}ms`);

        setSteps(categorySteps);

        // Show filter info
        const totalAddons = categorySteps.reduce((sum, step) => sum + step.addons.length, 0);
        const tourTitle = cart.tour_booking?.tour?.title || tourHandle;
        console.log(`[Add-ons Flow] Showing ${totalAddons} add-ons for tour "${tourTitle}"`);
      } catch (error) {
        console.error('[Add-ons Flow] Failed to load steps:', error);
        showToast('Failed to load add-ons. Please try again.', 'error');
      } finally {
        setIsLoading(false);
      }
    }

    loadSteps();
  }, [searchParams, cart.isLoading, cart.tour_booking?.tour?.handle, cart.tour_booking?.tour?.title, showToast]);

  // Initialize selected add-ons from cart
  useEffect(() => {
    const selected = new Set(cart.addons?.map((cartAddon) => cartAddon.addon.id));
    setSelectedAddOns(selected);
  }, [cart.addons]);

  // Analytics: Track step view
  useEffect(() => {
    if (steps.length > 0 && currentStepIndex < steps.length) {
      const currentStep = steps[currentStepIndex];
      if (!currentStep) return;

      // Lazy load analytics
      if (typeof window !== 'undefined') {
        import('../../../lib/analytics/lazy-analytics').then(({ trackEvent }) => {
          trackEvent('view_addon_category_step', {
            step_number: currentStep.stepNumber,
            category: currentStep.categoryName,
            total_steps: currentStep.totalSteps,
            cart_id: cart.tour_booking?.tour?.id,
            session_id: sessionStorage.getItem('session_id') || undefined
          } as any);
        });
      }
    }
  }, [currentStepIndex, steps, cart.tour_booking]);

  // Check if tour is selected - redirect if no tour
  useEffect(() => {
    // Don't redirect while cart is loading from backend
    if (cart.isLoading) return;

    // Don't redirect while local data is loading
    if (isLoading) return;

    // Only redirect if cart is loaded AND no tour
    if (!cart.isLoading && !isLoading && !cart.tour_booking) {
      console.warn('[Add-ons Flow] No tour selected, redirecting to tours');
      showToast('Please select a tour first', 'error');
      router.push('/tours');
    }
  }, [cart.tour_booking, cart.isLoading, router, isLoading, showToast]);

  // Tour change detection - remove incompatible addons
  useEffect(() => {
    if (cart.tour_booking?.tour?.handle && cart.addons?.length > 0) {
      // Convert CartAddon[] to Addon[] for compatibility check
      const addonsToCheck = cart.addons.map(cartAddon => cartAddon.addon);
      const incompatible = detectIncompatibleAddons(
        addonsToCheck as any, // Type assertion needed due to checkout.ts vs cart.ts mismatch
        cart.tour_booking.tour.handle
      );

      if (incompatible.length > 0) {
        // Remove incompatible addons
        incompatible.forEach(addon => {
          removeAddonFromCart(addon.id);
        });

        // Notify user
        const addonNames = incompatible.map(a => a.title).join(', ');
        showToast(
          `${incompatible.length} add-on${incompatible.length > 1 ? 's' : ''} removed (not available for this tour): ${addonNames}`,
          'info'
        );

        console.log(`[Add-ons Flow] Removed ${incompatible.length} incompatible addons for tour "${cart.tour_booking.tour.handle}"`);
      }
    }
  }, [cart.tour_booking?.tour?.handle, cart.addons, removeAddonFromCart, showToast]);

  const currentStep = useMemo(() => {
    if (steps.length === 0 || currentStepIndex >= steps.length) {
      return null;
    }
    return steps[currentStepIndex];
  }, [steps, currentStepIndex]);

  const progress = useMemo(() => {
    if (!currentStep) return 0;
    return calculateProgress(currentStep.stepNumber, currentStep.totalSteps);
  }, [currentStep]);

  // Get addon quantity
  const getAddonQuantity = useCallback((addonId: string): number => {
    const selected = cart.addons?.find((cartAddon) => cartAddon.addon.id === addonId);
    return selected?.quantity || 1;
  }, [cart.addons]);

  // Handle addon toggle
  const handleToggleAddOn = useCallback((addon: Addon) => {
    if (selectedAddOns.has(addon.id)) {
      removeAddonFromCart(addon.id);
      setSelectedAddOns((prev) => {
        const newSet = new Set(prev);
        newSet.delete(addon.id);
        return newSet;
      });
      showToast(`${addon.title} removed`, 'info');

      // Analytics
      import('../../../lib/analytics/lazy-analytics').then(({ trackDeselectAddon }) => {
        trackDeselectAddon({
          addon_id: addon.id,
          addon_title: addon.title,
          cart_id: cart.tour_booking?.tour?.id,
          session_id: sessionStorage.getItem('session_id') || undefined
        });
      });
    } else {
      // Now using correct Addon type from cart.ts which already has variant_id
      console.log('[Add-ons Flow] Adding addon:', {
        id: addon.id,
        title: addon.title,
        variant_id: addon.variant_id,
        price_cents: addon.price_cents
      });

      addAddonToCart({ addon, quantity: 1 });
      setSelectedAddOns((prev) => new Set(prev).add(addon.id));
      showToast(`${addon.title} added`, 'success');

      // Analytics
      import('../../../lib/analytics/lazy-analytics').then(({ trackSelectAddon }) => {
        trackSelectAddon({
          addon_id: addon.id,
          addon_title: addon.title,
          price_cents: addon.price_cents,
          unit: addon.pricing_type === 'per_day' ? 'per_day' : 'per_booking',
          quantity: 1,
          duration_days: cart.tour_booking?.tour?.duration_days,
          cart_id: cart.tour_booking?.tour?.id,
          session_id: sessionStorage.getItem('session_id') || undefined
        });
      });
    }
  }, [selectedAddOns, addAddonToCart, removeAddonFromCart, showToast, cart.tour_booking]);

  const handleQuantityChange = useCallback((addonId: string, quantity: number) => {
    updateAddonQuantity(addonId, quantity);
  }, [updateAddonQuantity]);

  // Navigation handlers
  const handleNext = useCallback(() => {
    if (!currentStep) return;

    const nextIndex = getNextStepIndex(currentStepIndex, steps.length);

    if (nextIndex !== null) {
      // Go to next category step
      setCurrentStepIndex(nextIndex);
      router.push(`/checkout/add-ons-flow?step=${nextIndex}`, { scroll: true });

      // Analytics: Track category completion
      import('../../../lib/analytics/lazy-analytics').then(({ trackEvent }) => {
        const categorySelections = currentStep.addons.filter(a => selectedAddOns.has(a.id));
        trackEvent('complete_addon_category', {
          category: currentStep.categoryName,
          step_number: currentStep.stepNumber,
          selections_count: categorySelections.length,
          skipped: categorySelections.length === 0,
          cart_id: cart.tour_booking?.tour?.id
        } as any);
      });
    } else {
      // Last step - go to summary/checkout
      router.push('/checkout');

      // Analytics: Track flow completion
      import('../../../lib/analytics/lazy-analytics').then(({ trackContinueFromAddons }) => {
        const totalValue = cart.addons?.reduce((sum, cartAddon) => sum + cartAddon.calculated_price_cents, 0);
        trackContinueFromAddons({
          selected_count: selectedAddOns.size,
          total_value_cents: totalValue,
          duration_days: cart.tour_booking?.tour?.duration_days,
          cart_id: cart.tour_booking?.tour?.id,
          session_id: sessionStorage.getItem('session_id') || undefined
        } as any);
      });
    }
  }, [currentStep, currentStepIndex, steps.length, selectedAddOns, router, cart]);

  const handlePrevious = useCallback(() => {
    const prevIndex = getPreviousStepIndex(currentStepIndex);
    if (prevIndex !== null) {
      setCurrentStepIndex(prevIndex);
      router.push(`/checkout/add-ons-flow?step=${prevIndex}`, { scroll: true });
    }
  }, [currentStepIndex, router]);

  const handleSkipCategory = useCallback(() => {
    handleNext(); // Same as next, but we could track differently
  }, [handleNext]);

  const handleSkipAll = useCallback(() => {
    // Skip all remaining steps and go to checkout
    router.push('/checkout');

    // Analytics
    import('../../../lib/analytics/lazy-analytics').then(({ trackSkipAddons }) => {
      trackSkipAddons({
        cart_id: cart.tour_booking?.tour?.id,
        session_id: sessionStorage.getItem('session_id') || undefined,
        duration_days: cart.tour_booking?.tour?.duration_days
      } as any);
    });
  }, [router, cart.tour_booking]);

  // Calculate total addons being shown
  // IMPORTANT: This useMemo must be called BEFORE any conditional returns
  // to comply with React's Rules of Hooks
  const totalFilteredAddons = useMemo(() => {
    return steps.reduce((sum, step) => sum + step.addons.length, 0);
  }, [steps]);

  if (isLoading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner}></div>
        <p>Loading add-ons...</p>
      </div>
    );
  }

  // Empty state - no addons for this tour
  if (!currentStep || steps.length === 0) {
    return (
      <div className={styles.errorContainer}>
        <h2>No Add-ons Available</h2>
        <p>
          {cart.tour_booking?.tour?.title
            ? `This tour doesn't have any add-ons available.`
            : 'Please select a tour to view available add-ons.'}
        </p>
        <button onClick={() => router.push('/checkout')} className={styles.button}>
          Continue to Checkout
        </button>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <main className={styles.container}>
        {/* Progress Bar */}
        <div className={styles.progressSection}>
          <div className={styles.progressBar}>
            <div
              className={styles.progressFill}
              style={{ width: `${progress}%` }}
              role="progressbar"
              aria-valuenow={progress}
              aria-valuemin={0}
              aria-valuemax={100}
            />
          </div>
          <p className={styles.progressText}>
            Step {currentStep.stepNumber} of {currentStep.totalSteps}
          </p>
        </div>

        {/* Filter Indicator Badge */}
        {cart.tour_booking && (
          <div className={styles.filterBadge}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className={styles.filterIcon}>
              <path d="M14 2H2L6.5 7.5V11.5L9.5 13V7.5L14 2Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span>
              Showing {totalFilteredAddons} add-on{totalFilteredAddons !== 1 ? 's' : ''} for {cart.tour_booking.tour.title}
            </span>
          </div>
        )}

        {/* Category Introduction */}
        <section className={styles.categoryIntro}>
          <div className={styles.iconWrapper}>
            <img src={currentStep.intro.icon} alt="" className={styles.categoryIcon} />
          </div>
          <h1 className={styles.categoryTitle}>{currentStep.intro.title}</h1>
          <p className={styles.categorySubtitle}>{currentStep.intro.subtitle}</p>
          <p className={styles.categoryDescription}>{currentStep.intro.description}</p>

          {currentStep.intro.benefits && currentStep.intro.benefits.length > 0 && (
            <ul className={styles.benefitsList}>
              {currentStep.intro.benefits.map((benefit, index) => (
                <li key={index} className={styles.benefitItem}>
                  <svg className={styles.checkIcon} width="20" height="20" viewBox="0 0 20 20" fill="none">
                    <path d="M7 10L9 12L13 8M19 10C19 14.9706 14.9706 19 10 19C5.02944 19 1 14.9706 1 10C1 5.02944 5.02944 1 10 1C14.9706 1 19 5.02944 19 10Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  {benefit}
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Add-ons Grid - Optimized rendering */}
        <div className={styles.contentGrid}>
          <section className={styles.addonsSection}>
            <div className={styles.grid}>
              {currentStep.addons.map((addon) => (
                <AddOnCard
                  key={addon.id}
                  addon={addon}
                  isSelected={selectedAddOns.has(addon.id)}
                  quantity={getAddonQuantity(addon.id)}
                  onToggle={handleToggleAddOn}
                  onQuantityChange={handleQuantityChange}
                  tourDays={cart.tour_booking?.tour?.duration_days || 1}
                  participants={cart.tour_booking?.participants || 1}
                />
              ))}
            </div>

            {/* Navigation Buttons */}
            <div className={styles.navigationButtons}>
              <button
                type="button"
                onClick={handlePrevious}
                className={styles.backButton}
                disabled={isFirstStep(currentStepIndex)}
              >
                ← Back
              </button>

              <button
                type="button"
                onClick={handleSkipCategory}
                className={styles.skipButton}
              >
                Skip Category
              </button>

              <button
                type="button"
                onClick={handleNext}
                className={styles.nextButton}
              >
                {isLastStep(currentStepIndex, steps.length) ? 'Review & Continue' : 'Next Category →'}
              </button>
            </div>

            <div className={styles.skipAllSection}>
              <button onClick={handleSkipAll} className={styles.skipAllLink}>
                Skip all add-ons and continue to checkout →
              </button>
            </div>
          </section>

          {/* Sticky Summary */}
          <aside className={styles.summaryColumn}>
            <BookingSummary
              cart={cart as any}
              showEditLinks={false}
              compact={true}
            />
          </aside>
        </div>
      </main>
    </div>
  );
});

/**
 * Multi-Step Add-ons Flow - Page Export
 */
export default function AddOnsFlowPage() {
  return (
    <ToastProvider>
      <AddOnsFlowContent />
    </ToastProvider>
  );
}
