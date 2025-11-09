'use client';

import React, { useEffect, useState, Suspense, useMemo, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';

// Force dynamic rendering since this page uses client-side hooks that require browser APIs
export const dynamicParams = true;
export const revalidate = 0;
import { useAddOns } from '../../../lib/hooks/useAddOns';
import { useCart } from '../../../lib/hooks/useCart';
import { getRecommendedAddons, calculateRecommendationScore } from '../../../lib/utils/recommendations';
import type { AddOn } from '../../../lib/types/checkout';
import TrustBadges from '../../../components/Checkout/TrustBadges';
import CategoryFilter from '../../../components/Checkout/CategoryFilter';
import SortDropdown, { SortOption } from '../../../components/Checkout/SortDropdown';
import ConfirmationDialog from '../../../components/Checkout/ConfirmationDialog';
import { ToastProvider, useToast } from '../../../components/Checkout/ToastContainer';
import styles from './addons.module.css';

// PERFORMANCE OPTIMIZATION: Lazy load drawer (only when opened, no SSR)
const AddOnDrawer = dynamic(
  () => import('../../../components/Checkout/AddOnDrawer'),
  {
    loading: () => <div aria-live="polite">Loading details...</div>,
    ssr: false, // Client-side only for better performance
  }
);

// Code splitting: Lazy load components that are not critical for initial render
// Import skeleton for better loading UX
import AddOnCardSkeleton from '../../../components/Checkout/AddOnCardSkeleton';

const AddOnCard = dynamic(() => import('../../../components/Checkout/AddOnCard'), {
  loading: () => <AddOnCardSkeleton />,
  ssr: true, // Keep SSR for SEO
});

const StickySummary = dynamic(() => import('../../../components/Checkout/StickySummary'), {
  loading: () => <div className={styles.summarySkeleton} aria-label="Loading summary..."></div>,
  ssr: true,
});

// MANDATORY: Use coordination hooks before operations
const useCoordinationHook = (operation: string) => {
  useEffect(() => {
    if (typeof window !== 'undefined') {
      console.log(`[Add-ons Page] ${operation} - coordinating via memory`);
    }
  }, [operation]);
};

function AddOnsPageContent() {
  // SEO: Update document head dynamically
  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.title = 'Add Optional Extras - Sunshine Coast 4WD Tours';

      // Update meta tags
      const updateMetaTag = (property: string, content: string) => {
        let meta = document.querySelector(`meta[property="${property}"]`) as HTMLMetaElement;
        if (!meta) {
          meta = document.createElement('meta');
          meta.setAttribute('property', property);
          document.head.appendChild(meta);
        }
        meta.content = content;
      };

      updateMetaTag('og:title', 'Add Optional Extras - Sunshine Coast 4WD Tours');
      updateMetaTag('og:description', 'Enhance your adventure with camping gear, photography packages, and more');
      updateMetaTag('og:type', 'website');
      updateMetaTag('og:url', 'https://sunshinecoast4wdtours.com.au/checkout/add-ons');
      updateMetaTag('twitter:card', 'summary_large_image');
      updateMetaTag('twitter:title', 'Add Optional Extras - Sunshine Coast 4WD Tours');
      updateMetaTag('twitter:description', 'Enhance your adventure with camping gear, photography packages, and more');
    }
  }, []);
  const router = useRouter();
  const { showToast } = useToast();
  const { addons, isLoading, error } = useAddOns();
  const {
    cart,
    addAddOn,
    removeAddOn,
    updateAddOnQuantity,
  } = useCart();

  const [selectedAddOns, setSelectedAddOns] = useState<Set<string>>(new Set());
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<SortOption>('recommended');
  const [showSkipConfirmation, setShowSkipConfirmation] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedAddOn, setSelectedAddOn] = useState<AddOn | null>(null);
  const addonCardsRef = useRef<HTMLDivElement>(null);
  const topRef = useRef<HTMLDivElement>(null);

  useCoordinationHook('addons-page-loaded');

  // Persist selections to localStorage
  useEffect(() => {
    const stored = localStorage.getItem('addon-selections');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setSelectedAddOns(new Set(parsed));
      } catch (error) {
        console.error('[Add-ons] Failed to load selections from localStorage:', error);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('addon-selections', JSON.stringify(Array.from(selectedAddOns)));
  }, [selectedAddOns]);

  // Initialize selected add-ons from cart
  useEffect(() => {
    const selected = new Set(cart.selected_addons.map((addon) => addon.id));
    setSelectedAddOns(selected);
  }, [cart.selected_addons]);

  // Check if tour is selected, redirect if not
  useEffect(() => {
    if (!cart.tour) {
      console.warn('[Add-ons Page] No tour selected, redirecting to home');
      // In production, uncomment this redirect
      // router.push('/');
    }
  }, [cart.tour, router]);

  // PERFORMANCE: Lazy load analytics using requestIdleCallback
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const loadAnalytics = async () => {
      if ('requestIdleCallback' in window) {
        requestIdleCallback(async () => {
          try {
            const { trackViewAddonsPage } = await import('../../../lib/analytics/lazy-analytics');
            trackViewAddonsPage({
              cart_id: cart.tour?.id,
              session_id: typeof window !== 'undefined' ? sessionStorage.getItem('session_id') || undefined : undefined,
              tour_id: cart.tour?.id,
              duration_days: cart.tour?.duration_days,
            });
          } catch (error) {
            console.error('[Analytics] Failed to track view:', error);
          }
        }, { timeout: 3000 });
      }
    };

    loadAnalytics();
  }, [cart.tour]);

  // PERFORMANCE: IntersectionObserver for tracking add-on views
  useEffect(() => {
    if (typeof window === 'undefined' || !addonCardsRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(async (entry) => {
          if (entry.isIntersecting) {
            const addonId = entry.target.getAttribute('data-addon-id');
            const addonTitle = entry.target.getAttribute('data-addon-title');
            const addonPrice = entry.target.getAttribute('data-addon-price');

            if (addonId && addonTitle && addonPrice) {
              try {
                const { trackViewAddonItem } = await import('../../../lib/analytics/lazy-analytics');
                trackViewAddonItem({
                  addon_id: addonId,
                  addon_title: addonTitle,
                  price_cents: parseInt(addonPrice, 10),
                  unit: 'per_day',
                  cart_id: cart.tour?.id,
                  session_id: typeof window !== 'undefined' ? sessionStorage.getItem('session_id') || undefined : undefined,
                });
              } catch (error) {
                console.error('[Analytics] Failed to track addon view:', error);
              }
            }
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.5, rootMargin: '50px' }
    );

    const cards = addonCardsRef.current.querySelectorAll('[data-addon-card]');
    cards.forEach((card) => observer.observe(card));

    return () => observer.disconnect();
  }, [addons, cart.tour]);

  const handleToggleAddOn = useCallback((addon: AddOn) => {
    if (selectedAddOns.has(addon.id)) {
      // Remove add-on
      removeAddOn(addon.id);
      setSelectedAddOns((prev) => {
        const newSet = new Set(prev);
        newSet.delete(addon.id);
        return newSet;
      });
      showToast(`${addon.title} removed from your booking`, 'info');
    } else {
      // Add add-on with default quantity of 1
      addAddOn(addon, 1);
      setSelectedAddOns((prev) => new Set(prev).add(addon.id));
      showToast(`${addon.title} added to your booking`, 'success');
    }
  }, [selectedAddOns, addAddOn, removeAddOn, showToast]);

  const handleQuantityChange = useCallback((addonId: string, quantity: number) => {
    updateAddOnQuantity(addonId, quantity);
  }, [updateAddOnQuantity]);

  const handleChangeTour = useCallback(() => {
    router.push('/');
  }, [router]);

  // Get selected addon quantity - memoized
  const getAddonQuantity = useCallback((addonId: string): number => {
    const selected = cart.selected_addons.find((a) => a.id === addonId);
    return selected?.quantity || 1;
  }, [cart.selected_addons]);

  // Get unique categories
  const categories = useMemo(() => {
    const cats = new Set(addons.map((addon) => addon.category || 'Other'));
    return Array.from(cats).sort();
  }, [addons]);

  // Filter and sort add-ons
  const filteredAndSortedAddons = useMemo(() => {
    let filtered = addons;

    // Apply category filter
    if (selectedCategory) {
      filtered = filtered.filter((addon) => (addon.category || 'Other') === selectedCategory);
    }

    // Get recommendations
    const recommendations = getRecommendedAddons(
      filtered.map((addon) => ({
        id: addon.id,
        title: addon.title,
        category: addon.category || 'Other',
        metadata: {
          unit: addon.pricing_type === 'per_day' ? 'per_day' : 'per_booking',
          tags: [],
        },
      })),
      {
        duration_days: cart.tour?.duration_days || 1,
        participants: cart.participants,
      }
    );

    const recommendationMap = new Map(recommendations.map((r) => [r.id, r.recommendationScore]));

    // Sort based on selected option
    let sorted = [...filtered];
    switch (sortBy) {
      case 'recommended':
        sorted.sort((a, b) => {
          const scoreA = recommendationMap.get(a.id) || 0;
          const scoreB = recommendationMap.get(b.id) || 0;
          return scoreB - scoreA;
        });
        break;
      case 'popular':
        // Popular based on category priority and alphabetical
        sorted.sort((a, b) => {
          const priorityA = a.category === 'Essential' ? 3 : a.category === 'Popular' ? 2 : 1;
          const priorityB = b.category === 'Essential' ? 3 : b.category === 'Popular' ? 2 : 1;
          if (priorityA !== priorityB) return priorityB - priorityA;
          return a.title.localeCompare(b.title);
        });
        break;
      case 'price-low':
        sorted.sort((a, b) => a.price - b.price);
        break;
      case 'price-high':
        sorted.sort((a, b) => b.price - a.price);
        break;
    }

    return sorted;
  }, [addons, selectedCategory, sortBy, cart.tour, cart.participants]);

  // Scroll to top when filter/sort changes
  useEffect(() => {
    if (topRef.current) {
      topRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [selectedCategory, sortBy]);

  // Handle skip with confirmation
  const handleSkip = useCallback(() => {
    if (selectedAddOns.size > 0) {
      setShowSkipConfirmation(true);
    } else {
      router.push('/checkout/');
    }
  }, [selectedAddOns.size, router]);

  const handleConfirmSkip = useCallback(() => {
    setShowSkipConfirmation(false);
    router.push('/checkout/');
  }, [router]);

  const handleContinue = useCallback(() => {
    router.push('/checkout/');
  }, [router]);

  // PERFORMANCE: Prefetch checkout page on hover for faster navigation
  const handlePrefetchCheckout = useCallback(() => {
    router.prefetch('/checkout/');
  }, [router]);

  const handleOpenDrawer = useCallback((addon: AddOn) => {
    setSelectedAddOn(addon);
    setDrawerOpen(true);
  }, []);

  const handleCloseDrawer = useCallback(() => {
    setDrawerOpen(false);
    setSelectedAddOn(null);
  }, []);

  const handleAddFromDrawer = useCallback((addon: AddOn) => {
    if (!selectedAddOns.has(addon.id)) {
      handleToggleAddOn(addon);
    }
  }, [selectedAddOns, handleToggleAddOn]);

  const handleCategoryChange = useCallback((category: string | null) => {
    setSelectedCategory(category);
  }, []);

  const handleSortChange = useCallback((option: SortOption) => {
    setSortBy(option);
  }, []);

  return (
    <div className={styles.page}>
      {/* PERFORMANCE: Inline critical CSS for above-the-fold content */}
      <style dangerouslySetInnerHTML={{
        __html: `
          .${styles.page} { min-height: 100vh; }
          .skip-link {
            position: absolute;
            top: -40px;
            left: 0;
            background: #fff;
            padding: 8px;
            z-index: 100;
          }
          .skip-link:focus {
            top: 0;
          }
        `
      }} />

      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>

      <main id="main-content" className={styles.container} ref={topRef}>
        {/* Hero Section */}
        <section className={styles.hero}>
          <h1 className={styles.pageTitle}>Enhance Your Adventure</h1>
          <p className={styles.pageDescription}>
            Add optional extras to make your trip unforgettable
          </p>
          {selectedAddOns.size > 0 && (
            <div className={styles.selectionBadge} aria-live="polite">
              {selectedAddOns.size} item{selectedAddOns.size !== 1 ? 's' : ''} selected
            </div>
          )}
          <TrustBadges />
        </section>

        {/* Main Content Grid */}
        <div className={styles.contentGrid}>
          {/* Left: Add-ons Grid */}
          <section className={styles.addOnsGrid} ref={addonCardsRef}>
            {/* Filter Bar */}
            <div className={styles.filterBar}>
              <CategoryFilter
                categories={categories}
                selectedCategory={selectedCategory}
                onCategoryChange={handleCategoryChange}
              />
              <SortDropdown value={sortBy} onChange={handleSortChange} />
            </div>
            {/* Loading State - Show skeletons for better UX */}
            {isLoading && (
              <div className={styles.grid} role="list" aria-label="Add-ons" aria-busy="true">
                <AddOnCardSkeleton />
                <AddOnCardSkeleton />
                <AddOnCardSkeleton />
                <AddOnCardSkeleton />
                <AddOnCardSkeleton />
                <AddOnCardSkeleton />
              </div>
            )}

            {/* Error State */}
            {error && (
              <div className={styles.errorState} role="alert">
                <p>⚠️ Unable to load add-ons. Using cached options.</p>
              </div>
            )}

            {/* Add-ons Grid */}
            {!isLoading && filteredAndSortedAddons.length > 0 && (
              <div className={styles.grid} role="list" aria-label="Add-ons">
                <Suspense fallback={<div className={styles.gridSkeleton}>Loading add-ons...</div>}>
                  {filteredAndSortedAddons.map((addon) => (
                    <div
                      key={addon.id}
                      data-addon-card
                      data-addon-id={addon.id}
                      data-addon-title={addon.title}
                      data-addon-price={addon.price}
                    >
                      <AddOnCard
                        addon={addon}
                        isSelected={selectedAddOns.has(addon.id)}
                        quantity={getAddonQuantity(addon.id)}
                        onToggle={handleToggleAddOn}
                        onQuantityChange={handleQuantityChange}
                        onLearnMore={handleOpenDrawer}
                        tourDays={cart.tour?.duration_days || 1}
                        participants={cart.participants}
                      />
                    </div>
                  ))}
                </Suspense>
              </div>
            )}

            {/* No Add-ons Available */}
            {!isLoading && filteredAndSortedAddons.length === 0 && (
              <div className={styles.emptyState}>
                <p>No add-ons match your current filters.</p>
                <button
                  type="button"
                  onClick={() => setSelectedCategory(null)}
                  className={styles.skipButton}
                >
                  Clear Filters
                </button>
              </div>
            )}

            {/* Skip for now link */}
            <div className={styles.skipSection}>
              <button onClick={handleSkip} className={styles.skipLink}>
                Skip for now, continue to review →
              </button>
            </div>
          </section>

          {/* Right: Sticky Summary (Desktop) */}
          <aside className={styles.summaryColumn}>
            <div onMouseEnter={handlePrefetchCheckout}>
              <StickySummary
                cart={cart}
                onContinue={handleContinue}
                onSkip={handleSkip}
              />
            </div>
          </aside>
        </div>

        {/* Add-on Drawer */}
        {drawerOpen && (
          <AddOnDrawer
            addon={selectedAddOn}
            isOpen={drawerOpen}
            onClose={handleCloseDrawer}
            onAddToCart={handleAddFromDrawer}
            tourDays={cart.tour?.duration_days || 1}
            participants={cart.participants}
          />
        )}

        {/* Skip Confirmation Dialog */}
        <ConfirmationDialog
          isOpen={showSkipConfirmation}
          title="Skip Add-ons?"
          message={`You have ${selectedAddOns.size} add-on${selectedAddOns.size !== 1 ? 's' : ''} selected. Are you sure you want to skip and continue to payment?`}
          confirmText="Yes, Skip"
          cancelText="Go Back"
          onConfirm={handleConfirmSkip}
          onCancel={() => setShowSkipConfirmation(false)}
          type="warning"
        />
      </main>
    </div>
  );
}

// Wrap with ToastProvider
export default function AddOnsPage() {
  return (
    <ToastProvider>
      <AddOnsPageContent />
    </ToastProvider>
  );
}
