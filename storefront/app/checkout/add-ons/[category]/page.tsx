'use client';

import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import { useCartContext } from '@/lib/context/CartContext';
import {
  getCategorySteps,
  getAddonPersuasiveCopy,
  calculateProgress,
  type CategoryStep
} from '../../../../lib/data/addon-flow-service';
import { slugToCategory, categoryToSlug, getCategoryUrl } from '../../../../lib/utils/category-slugs';
import type { Addon } from '../../../../lib/types/cart';
import { ToastProvider, useToast } from '../../../../components/Checkout/ToastContainer';
import { detectIncompatibleAddons } from '../../../../lib/data/addon-filtering';
import BookingSummary from '../../../../components/Checkout/BookingSummary';
import styles from '../../add-ons-flow/addons-flow.module.css';

// Lazy load components for better performance
const AddOnCard = dynamic(() => import('../../../../components/Checkout/AddOnCard'), {
  ssr: true,
});

/**
 * Category-Specific Add-ons Page Content
 */
function CategoryAddonsContent() {
  const router = useRouter();
  const params = useParams();
  const { showToast } = useToast();
  const { cart, addAddonToCart, removeAddonFromCart, updateAddonQuantity } = useCartContext();

  // Get category from URL params
  const categorySlug = params.category as string;
  const categoryName = slugToCategory(categorySlug);

  // State
  const [steps, setSteps] = useState<CategoryStep[]>([]);
  const [currentStep, setCurrentStep] = useState<CategoryStep | null>(null);
  const [selectedAddOns, setSelectedAddOns] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);

  // Load category steps - filter by tour handle
  useEffect(() => {
    async function loadSteps() {
      try {
        setIsLoading(true);

        // Get tour handle for filtering
        const tourHandle = cart.tour_booking?.tour?.handle;

        if (!tourHandle) {
          console.warn('[Category Add-ons] No tour handle available for filtering');
          setSteps([]);
          return;
        }

        // Load steps filtered by tour
        const categorySteps = await getCategorySteps(tourHandle);
        setSteps(categorySteps);

        // Find current category step
        const step = categorySteps.find(s => s.categoryName === categoryName);
        setCurrentStep(step || null);

        if (!step) {
          console.warn(`[Category Add-ons] Category "${categoryName}" not found or has no add-ons for this tour`);
          // Redirect to first available category
          if (categorySteps.length > 0 && categorySteps[0]) {
            const firstCategoryUrl = getCategoryUrl(categorySteps[0].categoryName);
            router.replace(firstCategoryUrl);
          } else {
            // No categories available - go to checkout
            router.push('/checkout');
          }
        }
      } catch (error) {
        console.error('[Category Add-ons] Failed to load steps:', error);
        showToast('Failed to load add-ons. Please try again.', 'error');
      } finally {
        setIsLoading(false);
      }
    }

    if (categoryName) {
      loadSteps();
    } else {
      console.error(`[Category Add-ons] Invalid category slug: ${categorySlug}`);
      router.push('/checkout/add-ons-flow');
    }
  }, [categoryName, categorySlug, cart.tour_booking?.tour?.handle, router, showToast]);

  // Initialize selected add-ons from cart
  useEffect(() => {
    const selected = new Set(cart.addons?.map((cartAddon) => cartAddon.addon.id));
    setSelectedAddOns(selected);
  }, [cart.addons]);

  // Analytics: Track category view
  useEffect(() => {
    if (currentStep) {
      // Lazy load analytics
      if (typeof window !== 'undefined') {
        import('../../../../lib/analytics/lazy-analytics').then(({ trackEvent }) => {
          trackEvent('view_addon_category', {
            category: currentStep.categoryName,
            step_number: currentStep.stepNumber,
            total_steps: currentStep.totalSteps,
            url_type: 'direct_category_url',
            cart_id: cart.tour_booking?.tour?.id,
            session_id: typeof window !== 'undefined' ? (sessionStorage.getItem('session_id') || undefined) : undefined
          } as any);
        });
      }
    }
  }, [currentStep, cart.tour_booking]);

  // Check if tour is selected - redirect if no tour
  useEffect(() => {
    if (cart.isLoading || isLoading) return;

    if (!cart.tour_booking) {
      console.warn('[Category Add-ons] No tour selected, redirecting to tours');
      showToast('Please select a tour first', 'error');
      router.push('/tours');
    }
  }, [cart.tour_booking, cart.isLoading, router, isLoading, showToast]);

  // Tour change detection - remove incompatible addons
  useEffect(() => {
    if (cart.tour_booking?.tour?.handle && cart.addons?.length > 0) {
      const addonsToCheck = cart.addons.map(cartAddon => cartAddon.addon);
      const incompatible = detectIncompatibleAddons(
        addonsToCheck as any,
        cart.tour_booking.tour.handle
      );

      if (incompatible.length > 0) {
        incompatible.forEach(addon => {
          removeAddonFromCart(addon.id);
        });

        const addonNames = incompatible.map(a => a.title).join(', ');
        showToast(
          `${incompatible.length} add-on${incompatible.length > 1 ? 's' : ''} removed (not available for this tour): ${addonNames}`,
          'info'
        );
      }
    }
  }, [cart.tour_booking?.tour?.handle, cart.addons, removeAddonFromCart, showToast]);

  const progress = useMemo(() => {
    if (!currentStep) return 0;
    return calculateProgress(currentStep.stepNumber, currentStep.totalSteps);
  }, [currentStep]);

  // Get current step index
  const currentStepIndex = useMemo(() => {
    if (!currentStep || steps.length === 0) return 0;
    return steps.findIndex(s => s.categoryName === currentStep.categoryName);
  }, [currentStep, steps]);

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
    } else {
      addAddonToCart({ addon, quantity: 1 });
      setSelectedAddOns((prev) => new Set(prev).add(addon.id));
      showToast(`${addon.title} added`, 'success');
    }
  }, [selectedAddOns, addAddonToCart, removeAddonFromCart, showToast]);

  const handleQuantityChange = useCallback((addonId: string, quantity: number) => {
    updateAddonQuantity(addonId, quantity);
  }, [updateAddonQuantity]);

  // Navigation handlers
  const handleNext = useCallback(() => {
    if (!currentStep) return;

    const nextIndex = currentStepIndex + 1;

    if (nextIndex < steps.length && steps[nextIndex]) {
      // Go to next category
      const nextCategory = steps[nextIndex].categoryName;
      const nextUrl = getCategoryUrl(nextCategory);
      router.push(nextUrl);

      // Analytics: Track category completion
      import('../../../../lib/analytics/lazy-analytics').then(({ trackEvent }) => {
        const categorySelections = currentStep.addons.filter(a => selectedAddOns.has(a.id));
        trackEvent('complete_addon_category', {
          category: currentStep.categoryName,
          step_number: currentStep.stepNumber,
          selections_count: categorySelections.length,
          skipped: categorySelections.length === 0,
          navigation_type: 'category_url',
          cart_id: cart.tour_booking?.tour?.id
        } as any);
      });
    } else {
      // Last step - go to checkout
      router.push('/checkout');

      // Analytics: Track flow completion
      import('../../../../lib/analytics/lazy-analytics').then(({ trackContinueFromAddons }) => {
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
  }, [currentStep, currentStepIndex, steps, selectedAddOns, router, cart]);

  const handlePrevious = useCallback(() => {
    const prevIndex = currentStepIndex - 1;
    if (prevIndex >= 0 && steps[prevIndex]) {
      const prevCategory = steps[prevIndex].categoryName;
      const prevUrl = getCategoryUrl(prevCategory);
      router.push(prevUrl);
    }
  }, [currentStepIndex, steps, router]);

  const handleSkipCategory = useCallback(() => {
    handleNext();
  }, [handleNext]);

  const handleSkipAll = useCallback(() => {
    router.push('/checkout');

    // Analytics
    import('../../../../lib/analytics/lazy-analytics').then(({ trackSkipAddons }) => {
      trackSkipAddons({
        cart_id: cart.tour_booking?.tour?.id,
        session_id: sessionStorage.getItem('session_id') || undefined,
        duration_days: cart.tour_booking?.tour?.duration_days
      } as any);
    });
  }, [router, cart.tour_booking]);

  if (isLoading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner}></div>
        <p>Loading add-ons...</p>
      </div>
    );
  }

  // Empty state - category not found or no addons
  if (!currentStep) {
    return (
      <div className={styles.errorContainer}>
        <h2>Category Not Available</h2>
        <p>This category has no add-ons available for your selected tour.</p>
        <button onClick={() => router.push('/checkout')} className={styles.button}>
          Continue to Checkout
        </button>
      </div>
    );
  }

  const isFirstCategory = currentStepIndex === 0;
  const isLastCategory = currentStepIndex === steps.length - 1;

  // Calculate total addons being shown
  const totalFilteredAddons = useMemo(() => {
    return steps.reduce((sum, step) => sum + step.addons.length, 0);
  }, [steps]);

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
            Step {currentStep.stepNumber} of {currentStep.totalSteps}: {currentStep.categoryName}
          </p>
        </div>

        {/* Enhanced Category Breadcrumbs */}
        <nav className={styles.categoryBreadcrumbs} aria-label="Category navigation">
          <ol>
            {steps.map((step, index) => (
              <li key={step.categoryName} className={index === currentStepIndex ? styles.active : ''}>
                <button
                  type="button"
                  onClick={() => {
                    const url = getCategoryUrl(step.categoryName);
                    router.push(url);
                  }}
                  disabled={index === currentStepIndex}
                  className={styles.breadcrumbButton}
                >
                  {step.categoryName}
                </button>
              </li>
            ))}
          </ol>
        </nav>

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

        {/* Add-ons Grid */}
        <div className={styles.contentGrid}>
          <section className={styles.addonsSection}>
            <div className={styles.grid}>
              {currentStep.addons.map((addon) => {
                const persuasiveCopy = getAddonPersuasiveCopy(addon);

                return (
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
                );
              })}
            </div>

            {/* Navigation Buttons */}
            <div className={styles.navigationButtons}>
              <button
                type="button"
                onClick={handlePrevious}
                className={styles.backButton}
                disabled={isFirstCategory}
              >
                ← Previous Category
              </button>

              <button
                type="button"
                onClick={handleSkipCategory}
                className={styles.skipButton}
              >
                Skip {currentStep.categoryName}
              </button>

              <button
                type="button"
                onClick={handleNext}
                className={styles.nextButton}
              >
                {isLastCategory ? 'Review & Continue to Checkout' : 'Next Category →'}
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
              cart={cart}
              showEditLinks={false}
              compact={true}
            />
          </aside>
        </div>
      </main>
    </div>
  );
}

/**
 * Category-Specific Add-ons Page Export
 *
 * NOTE: This is a client component ('use client' at top), so we cannot use generateStaticParams().
 * The page will be dynamically rendered on-demand, which is appropriate for this interactive flow.
 */
export default function CategoryAddonsPage() {
  return (
    <ToastProvider>
      <CategoryAddonsContent />
    </ToastProvider>
  );
}
