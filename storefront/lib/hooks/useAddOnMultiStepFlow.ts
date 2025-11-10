'use client';

import { useState, useCallback, useMemo, useEffect } from 'react';
import type { AddOn } from '../types/checkout';

// Category configuration with persuasive copy
export interface CategoryConfig {
  id: string;
  name: string;
  icon: string;
  title: string;
  description: string;
  persuasionCopy: string;
  benefits: string[];
  order: number;
}

// Default category configurations
export const DEFAULT_CATEGORIES: CategoryConfig[] = [
  {
    id: 'equipment',
    name: 'Equipment',
    icon: '⛺',
    title: 'Essential Camping Equipment',
    description: 'Upgrade your adventure with premium camping gear',
    persuasionCopy: 'Make your 4WD journey comfortable and hassle-free with our premium camping equipment. No need to bring your own gear - we\'ve got everything you need for an unforgettable outdoor experience.',
    benefits: [
      'High-quality, well-maintained equipment',
      'Skip the hassle of packing bulky gear',
      'Perfect for first-timers and experienced campers alike',
    ],
    order: 1,
  },
  {
    id: 'food-beverage',
    name: 'Food & Beverage',
    icon: '🍽️',
    title: 'Gourmet Dining Experiences',
    description: 'Savor delicious meals in stunning locations',
    persuasionCopy: 'Elevate your adventure with chef-prepared meals and beachside BBQs. Experience the best of Sunshine Coast cuisine without the meal planning stress.',
    benefits: [
      'Fresh, locally-sourced ingredients',
      'Memorable dining experiences in nature',
      'No cooking or cleanup required',
    ],
    order: 2,
  },
  {
    id: 'photography',
    name: 'Photography',
    icon: '📷',
    title: 'Professional Photography Packages',
    description: 'Capture memories that last a lifetime',
    persuasionCopy: 'Don\'t miss a single moment of your adventure. Our professional photographers will capture stunning images you\'ll treasure forever, while you focus on enjoying the experience.',
    benefits: [
      'Professional-grade photos of your journey',
      'Edited and delivered digitally',
      'Perfect for sharing your adventure',
    ],
    order: 3,
  },
  {
    id: 'transport',
    name: 'Transport',
    icon: '🚗',
    title: 'Convenient Transport Options',
    description: 'Stress-free travel from start to finish',
    persuasionCopy: 'Start your adventure the moment you arrive. Skip the car rental and parking hassles with our convenient pickup and drop-off service.',
    benefits: [
      'Door-to-door convenience',
      'Experienced local drivers',
      'More time to relax and enjoy',
    ],
    order: 4,
  },
  {
    id: 'insurance',
    name: 'Insurance',
    icon: '🛡️',
    title: 'Travel Protection & Peace of Mind',
    description: 'Adventure with confidence',
    persuasionCopy: 'Protect your investment and travel with complete peace of mind. Our comprehensive coverage means you can focus on the adventure, not the what-ifs.',
    benefits: [
      'Comprehensive coverage for unforeseen events',
      'Easy claims process',
      'Adventure with zero worries',
    ],
    order: 5,
  },
];

export interface MultiStepFlowState {
  currentStep: number;
  completedSteps: Set<number>;
  skippedSteps: Set<number>;
  categories: CategoryConfig[];
  selectedAddOns: Map<string, { addon: AddOn; quantity: number }>;
  isComplete: boolean;
}

export interface MultiStepFlowActions {
  nextStep: () => void;
  previousStep: () => void;
  skipStep: () => void;
  goToStep: (step: number) => void;
  markStepComplete: (step: number) => void;
  selectAddOn: (addon: AddOn, quantity?: number) => void;
  removeAddOn: (addonId: string) => void;
  updateAddOnQuantity: (addonId: string, quantity: number) => void;
  reset: () => void;
  getCurrentCategory: () => CategoryConfig | null;
  getTotalSteps: () => number;
  getProgress: () => number;
  isLastStep: () => boolean;
  isFirstStep: () => boolean;
}

/**
 * Custom hook for managing multi-step add-on flow
 * Handles step navigation, category management, and addon selection
 */
export function useAddOnMultiStepFlow(
  categories: CategoryConfig[] = DEFAULT_CATEGORIES,
  initialStep: number = 0
): MultiStepFlowState & MultiStepFlowActions {
  // Sort categories by order
  const sortedCategories = useMemo(() => {
    return [...categories].sort((a, b) => a.order - b.order);
  }, [categories]);

  const totalSteps = sortedCategories.length + 1; // Categories + Summary step

  const [currentStep, setCurrentStep] = useState(initialStep);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const [skippedSteps, setSkippedSteps] = useState<Set<number>>(new Set());
  const [selectedAddOns, setSelectedAddOns] = useState<Map<string, { addon: AddOn; quantity: number }>>(
    new Map()
  );

  // Load from localStorage on mount
  useEffect(() => {
    if (typeof window === 'undefined') return;

    try {
      const saved = localStorage.getItem('addon-multi-step-flow');
      if (saved) {
        const parsed = JSON.parse(saved);
        setCurrentStep(parsed.currentStep || 0);
        setCompletedSteps(new Set(parsed.completedSteps || []));
        setSkippedSteps(new Set(parsed.skippedSteps || []));

        // Restore selected addons
        const addonsMap = new Map();
        if (parsed.selectedAddOns && Array.isArray(parsed.selectedAddOns)) {
          parsed.selectedAddOns.forEach((item: any) => {
            addonsMap.set(item.addon.id, { addon: item.addon, quantity: item.quantity });
          });
        }
        setSelectedAddOns(addonsMap);
      }
    } catch (error) {
      console.error('[useAddOnMultiStepFlow] Error loading from localStorage:', error);
    }
  }, []);

  // Save to localStorage on change
  useEffect(() => {
    if (typeof window === 'undefined') return;

    try {
      const state = {
        currentStep,
        completedSteps: Array.from(completedSteps),
        skippedSteps: Array.from(skippedSteps),
        selectedAddOns: Array.from(selectedAddOns.values()),
      };
      localStorage.setItem('addon-multi-step-flow', JSON.stringify(state));
    } catch (error) {
      console.error('[useAddOnMultiStepFlow] Error saving to localStorage:', error);
    }
  }, [currentStep, completedSteps, skippedSteps, selectedAddOns]);

  const nextStep = useCallback(() => {
    if (currentStep < totalSteps - 1) {
      setCurrentStep((prev) => prev + 1);
    }
  }, [currentStep, totalSteps]);

  const previousStep = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  }, [currentStep]);

  const skipStep = useCallback(() => {
    setSkippedSteps((prev) => new Set(prev).add(currentStep));
    nextStep();
  }, [currentStep, nextStep]);

  const goToStep = useCallback((step: number) => {
    if (step >= 0 && step < totalSteps) {
      setCurrentStep(step);
    }
  }, [totalSteps]);

  const markStepComplete = useCallback((step: number) => {
    setCompletedSteps((prev) => new Set(prev).add(step));
  }, []);

  const selectAddOn = useCallback((addon: AddOn, quantity: number = 1) => {
    setSelectedAddOns((prev) => {
      const newMap = new Map(prev);
      const existing = newMap.get(addon.id);

      if (existing) {
        newMap.set(addon.id, {
          addon,
          quantity: existing.quantity + quantity,
        });
      } else {
        newMap.set(addon.id, { addon, quantity });
      }

      return newMap;
    });
  }, []);

  const removeAddOn = useCallback((addonId: string) => {
    setSelectedAddOns((prev) => {
      const newMap = new Map(prev);
      newMap.delete(addonId);
      return newMap;
    });
  }, []);

  const updateAddOnQuantity = useCallback((addonId: string, quantity: number) => {
    if (quantity <= 0) {
      removeAddOn(addonId);
      return;
    }

    setSelectedAddOns((prev) => {
      const newMap = new Map(prev);
      const existing = newMap.get(addonId);

      if (existing) {
        newMap.set(addonId, {
          ...existing,
          quantity,
        });
      }

      return newMap;
    });
  }, [removeAddOn]);

  const reset = useCallback(() => {
    setCurrentStep(0);
    setCompletedSteps(new Set());
    setSkippedSteps(new Set());
    setSelectedAddOns(new Map());

    if (typeof window !== 'undefined') {
      localStorage.removeItem('addon-multi-step-flow');
    }
  }, []);

  const getCurrentCategory = useCallback((): CategoryConfig | null => {
    if (currentStep >= sortedCategories.length) {
      return null; // Summary step
    }
    return sortedCategories[currentStep] || null;
  }, [currentStep, sortedCategories]);

  const getTotalSteps = useCallback(() => totalSteps, [totalSteps]);

  const getProgress = useCallback(() => {
    return ((currentStep + 1) / totalSteps) * 100;
  }, [currentStep, totalSteps]);

  const isLastStep = useCallback(() => {
    return currentStep === totalSteps - 1;
  }, [currentStep, totalSteps]);

  const isFirstStep = useCallback(() => {
    return currentStep === 0;
  }, [currentStep]);

  const isComplete = useMemo(() => {
    return currentStep === totalSteps - 1;
  }, [currentStep, totalSteps]);

  return {
    // State
    currentStep,
    completedSteps,
    skippedSteps,
    categories: sortedCategories,
    selectedAddOns,
    isComplete,

    // Actions
    nextStep,
    previousStep,
    skipStep,
    goToStep,
    markStepComplete,
    selectAddOn,
    removeAddOn,
    updateAddOnQuantity,
    reset,
    getCurrentCategory,
    getTotalSteps,
    getProgress,
    isLastStep,
    isFirstStep,
  };
}
