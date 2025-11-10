'use client';

import React, { useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import type { AddOn } from '../../lib/types/checkout';
import { useAddOnMultiStepFlow, DEFAULT_CATEGORIES } from '../../lib/hooks/useAddOnMultiStepFlow';
import { useCart } from '../../lib/hooks/useCart';
import FlowProgressIndicator from './FlowProgressIndicator';
import AddOnCategoryStep from './AddOnCategoryStep';
import AddOnSummary from './AddOnSummary';
import { ToastProvider, useToast } from './ToastContainer';
import styles from './AddOnMultiStepFlow.module.css';

export interface AddOnMultiStepFlowProps {
  addons: AddOn[];
  tourDays?: number;
  participants?: number;
  onComplete?: () => void;
}

/**
 * AddOnMultiStepFlow - Main component for step-by-step addon selection
 * Features:
 * - Step-by-step navigation (one category per step)
 * - Progress indicator
 * - Category introduction screens
 * - Addon cards with persuasive copy
 * - Add to booking / Skip buttons
 * - Step validation
 * - Summary screen at the end
 */
function AddOnMultiStepFlowContent({
  addons,
  tourDays = 1,
  participants = 1,
  onComplete,
}: AddOnMultiStepFlowProps) {
  const router = useRouter();
  const { showToast } = useToast();
  const { cart, addAddonToCart, removeAddonFromCart, updateAddonQuantity } = useCart();

  const {
    currentStep,
    completedSteps,
    categories,
    selectedAddOns,
    nextStep,
    previousStep,
    skipStep,
    goToStep,
    markStepComplete,
    selectAddOn,
    removeAddOn: removeFromFlow,
    updateAddOnQuantity: updateFlowQuantity,
    getCurrentCategory,
    getTotalSteps,
    getProgress,
    isLastStep,
    isFirstStep,
  } = useAddOnMultiStepFlow(DEFAULT_CATEGORIES);

  const currentCategory = getCurrentCategory();
  const totalSteps = getTotalSteps();
  const progress = getProgress();

  // Group addons by category
  const addonsByCategory = useMemo(() => {
    const grouped = new Map<string, AddOn[]>();

    addons.forEach((addon) => {
      const categoryId = addon.category?.toLowerCase().replace(/\s+/g, '-') || 'general';
      if (!grouped.has(categoryId)) {
        grouped.set(categoryId, []);
      }
      grouped.get(categoryId)?.push(addon);
    });

    return grouped;
  }, [addons]);

  // Get addons for current category
  const currentCategoryAddons = useMemo(() => {
    if (!currentCategory) return [];
    return addonsByCategory.get(currentCategory.id) || [];
  }, [currentCategory, addonsByCategory]);

  // Sync selected addons with cart
  useEffect(() => {
    selectedAddOns.forEach(({ addon, quantity }) => {
      const inCart = cart.addons?.find((cartAddon) => cartAddon.addon.id === addon.id);
      if (!inCart) {
        // Type assertion needed - AddOn from checkout.ts vs Addon from cart.ts
        addAddonToCart({ addon: addon as any, quantity });
      } else if (inCart.quantity !== quantity) {
        updateAddonQuantity(addon.id, quantity);
      }
    });
  }, [selectedAddOns, cart.addons, addAddonToCart, updateAddonQuantity]);

  const handleAddToBooking = (addon: AddOn) => {
    selectAddOn(addon, 1);
    showToast(`${addon.title} added to your booking`, 'success');
  };

  const handleRemoveFromBooking = (addonId: string) => {
    const addon = selectedAddOns.get(addonId);
    removeFromFlow(addonId);
    removeAddonFromCart(addonId);
    if (addon) {
      showToast(`${addon.addon.title} removed from your booking`, 'info');
    }
  };

  const handleUpdateQuantity = (addonId: string, quantity: number) => {
    updateFlowQuantity(addonId, quantity);
    updateAddonQuantity(addonId, quantity);
  };

  const handleNext = () => {
    markStepComplete(currentStep);
    nextStep();

    // Smooth scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSkip = () => {
    if (currentCategoryAddons.length > 0) {
      showToast('Category skipped - you can add items later', 'info');
    }
    skipStep();

    // Smooth scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handlePrevious = () => {
    previousStep();

    // Smooth scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleContinueToCheckout = () => {
    if (onComplete) {
      onComplete();
    } else {
      router.push('/checkout/');
    }
  };

  const handleStepClick = (step: number) => {
    goToStep(step);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className={styles.container}>
      <div className={styles.wrapper}>
        {/* Progress Indicator */}
        <FlowProgressIndicator
          currentStep={currentStep}
          totalSteps={totalSteps}
          completedSteps={completedSteps}
          categories={categories}
          onStepClick={handleStepClick}
        />

        {/* Current Step Content */}
        <div className={styles.stepContent}>
          {currentCategory ? (
            // Category Step
            <AddOnCategoryStep
              category={currentCategory}
              addons={currentCategoryAddons}
              selectedAddOns={selectedAddOns}
              onAddToBooking={handleAddToBooking}
              onRemoveFromBooking={handleRemoveFromBooking}
              onUpdateQuantity={handleUpdateQuantity}
              tourDays={tourDays}
              participants={participants}
            />
          ) : (
            // Summary Step
            <AddOnSummary
              selectedAddOns={selectedAddOns}
              onRemove={handleRemoveFromBooking}
              onUpdateQuantity={handleUpdateQuantity}
              onContinueToCheckout={handleContinueToCheckout}
              onGoBack={handlePrevious}
              tourDays={tourDays}
              participants={participants}
            />
          )}
        </div>

        {/* Navigation Buttons */}
        {!isLastStep() && (
          <div className={styles.navigation}>
            {!isFirstStep() && (
              <button
                type="button"
                onClick={handlePrevious}
                className={`${styles.navButton} ${styles.previousButton}`}
              >
                ← Previous
              </button>
            )}

            <button
              type="button"
              onClick={handleSkip}
              className={`${styles.navButton} ${styles.skipButton}`}
            >
              Skip for now
            </button>

            <button
              type="button"
              onClick={handleNext}
              className={`${styles.navButton} ${styles.nextButton}`}
            >
              {currentStep === totalSteps - 2 ? 'Review Selections →' : 'Next →'}
            </button>
          </div>
        )}

        {/* Selection Summary Footer (visible on category steps) */}
        {!isLastStep() && selectedAddOns.size > 0 && (
          <div className={styles.selectionSummary} role="status" aria-live="polite">
            <div className={styles.summaryContent}>
              <span className={styles.summaryIcon}>✓</span>
              <span className={styles.summaryText}>
                {selectedAddOns.size} add-on{selectedAddOns.size !== 1 ? 's' : ''} selected
              </span>
              <button
                type="button"
                onClick={() => goToStep(totalSteps - 1)}
                className={styles.viewSummaryButton}
              >
                View Summary
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Wrap with ToastProvider
export default function AddOnMultiStepFlow(props: AddOnMultiStepFlowProps) {
  return (
    <ToastProvider>
      <AddOnMultiStepFlowContent {...props} />
    </ToastProvider>
  );
}
