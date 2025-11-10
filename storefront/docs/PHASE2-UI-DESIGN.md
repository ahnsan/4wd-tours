# Phase 2: Simplified Add-Ons Page - UI Design Specification

**Status**: DESIGN COMPLETE
**Date**: 2025-11-10
**Design Pattern**: Option A - Single Page with Category Tabs
**Based On**: Refactor plan (Option A), Standard e-commerce patterns, Current tour detail page

---

## Executive Summary

This document specifies the UI design for a simplified add-ons selection page that replaces the complex multi-step wizard with a clean, single-page experience using category tabs. The design follows standard e-commerce patterns (Amazon, Shopify) and reuses existing component patterns from the tour detail page.

**Key Principles**:
- Simplicity over complexity
- Standard e-commerce UX patterns
- Reuse existing components where possible
- Mobile-first responsive design
- Accessibility (WCAG 2.1 AA)
- Performance optimized

---

## 1. Component Hierarchy

```
AddOnsPage (Client Component)
├── PageHeader
│   ├── Title ("Enhance Your Adventure")
│   ├── Subtitle (Tour-specific context)
│   └── ProgressIndicator (Optional: "Step 2 of 3")
│
├── CategoryTabs (Horizontal scroll on mobile)
│   ├── TabButton (Food & Beverage) [Active]
│   ├── TabButton (Photography)
│   ├── TabButton (Accommodation)
│   ├── TabButton (Activities)
│   └── TabButton (Connectivity)
│
├── CategoryDescription (Persuasive copy)
│   ├── Icon
│   ├── Title
│   ├── Description
│   └── Benefits List (Optional, collapsible on mobile)
│
├── AddOnsGrid
│   ├── AddonCard (Reused from existing component)
│   ├── AddonCard
│   ├── AddonCard
│   └── AddonCard (×N)
│
├── StickyFooter
│   ├── CartSummary (Compact)
│   │   ├── Selected Count Badge
│   │   └── Total Price
│   ├── SkipButton ("Skip Add-ons")
│   └── ContinueButton ("Continue to Checkout")
│
└── EmptyState (If no add-ons for tour)
    ├── Icon
    ├── Message
    └── ContinueButton
```

---

## 2. Detailed Component Specifications

### 2.1 AddOnsPage (Main Container)

**File**: `/app/checkout/add-ons/page.tsx`

**Type**: Client Component (`'use client'`)

**Props**: None (uses URL params and cart context)

**State**:
```typescript
interface AddOnsPageState {
  addons: Addon[]                    // All add-ons for current tour
  selectedCategory: CategoryName | null
  loading: boolean
  error: string | null
  selectedAddonIds: Set<string>      // Track selections
}
```

**Hooks Used**:
- `useSearchParams()` - Get tour handle from URL
- `useCart()` - Access cart context
- `useRouter()` - Navigation
- `useState()` - Local state management
- `useEffect()` - Data fetching

**Key Behaviors**:
- Load add-ons on mount filtered by tour
- Auto-redirect to checkout if no add-ons available
- Preserve selections across category switches
- Sync with cart context in real-time
- Show loading skeleton during fetch
- Handle errors gracefully

**Sample Structure**:
```tsx
'use client'

import { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { useCartContext } from '@/lib/context/CartContext'
import { fetchAddonsForTour, groupByCategory } from '@/lib/data/addons'
import { AddonCard } from '@/components/Checkout/AddOnCard'
import { CategoryTabs } from '@/components/AddOns/CategoryTabs'
import styles from './addons.module.css'

export default function AddOnsPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { cart, addAddonToCart, removeAddonFromCart } = useCartContext()

  const tourHandle = searchParams.get('tour')
  const [addons, setAddons] = useState<Addon[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  // Data fetching effect
  useEffect(() => {
    async function loadAddons() {
      if (!tourHandle) {
        router.push('/tours')
        return
      }

      try {
        setLoading(true)
        const data = await fetchAddonsForTour(tourHandle, cart.region_id)
        setAddons(data)

        // Auto-skip if no add-ons
        if (data.length === 0) {
          router.push('/checkout')
          return
        }
      } catch (error) {
        console.error('[Add-ons] Load failed:', error)
      } finally {
        setLoading(false)
      }
    }

    loadAddons()
  }, [tourHandle, cart.region_id])

  if (loading) return <LoadingSkeleton />
  if (addons.length === 0) return null // Will redirect

  const grouped = groupByCategory(addons)
  const categories = Object.keys(grouped)
  const activeCategory = selectedCategory || categories[0]
  const categoryAddons = grouped[activeCategory] || []

  return (
    <div className={styles.page}>
      <PageHeader />

      <CategoryTabs
        categories={categories}
        activeCategory={activeCategory}
        onCategoryChange={setSelectedCategory}
      />

      <CategoryDescription category={activeCategory} />

      <div className={styles.grid}>
        {categoryAddons.map(addon => (
          <AddonCard
            key={addon.id}
            addon={addon}
            isSelected={isInCart(addon.id)}
            onToggle={() => handleToggle(addon)}
            tourDays={cart.tour_booking?.tour?.duration_days}
            participants={cart.tour_booking?.participants}
          />
        ))}
      </div>

      <StickyFooter />
    </div>
  )
}
```

---

### 2.2 PageHeader Component

**File**: Can be inline in page or `/components/AddOns/PageHeader.tsx`

**Props**:
```typescript
interface PageHeaderProps {
  tourTitle?: string
  showProgress?: boolean
  currentStep?: number
  totalSteps?: number
}
```

**Visual Design**:
```
┌─────────────────────────────────────────┐
│  Enhance Your [Tour Name] Adventure    │ <- H1, large, centered
│  Select optional upgrades below         │ <- Subtitle, gray
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │ <- Optional progress bar
│         Step 2 of 3: Add-ons            │ <- Small text, centered
└─────────────────────────────────────────┘
```

**Styling**:
- H1: 2.5rem (mobile: 1.875rem), font-weight: 800
- Subtitle: 1.125rem, color: #6b7280
- Max-width: 800px, centered
- Padding: 3rem 2rem (mobile: 2rem 1rem)
- Background: white with subtle shadow

---

### 2.3 CategoryTabs Component

**File**: `/components/AddOns/CategoryTabs.tsx`

**Props**:
```typescript
interface CategoryTabsProps {
  categories: string[]
  activeCategory: string
  onCategoryChange: (category: string) => void
}
```

**Visual Design**:
```
Desktop:
┌────────────────────────────────────────────────────────────┐
│ [Food & Beverage] [Photography] [Accommodation] [...] [...] │
│ ═══════════════                                             │
└────────────────────────────────────────────────────────────┘

Mobile (Horizontal Scroll):
┌──────────────────────────────┐
│ [Food & Beverage] [Photograp...→ │
│ ═══════════════               │
└──────────────────────────────┘
```

**Tab Button States**:
- **Inactive**:
  - Background: transparent
  - Text: #6b7280
  - Border-bottom: 2px solid transparent
  - Hover: background #f3f4f6

- **Active**:
  - Background: transparent
  - Text: #1f2937 (dark)
  - Border-bottom: 3px solid var(--primary-tan)
  - Font-weight: 600

**Accessibility**:
- Use `<button role="tab">` with ARIA attributes
- Keyboard navigation (arrow keys)
- Focus visible styles
- Touch target: min 44px height

**Sample Code**:
```tsx
export function CategoryTabs({ categories, activeCategory, onCategoryChange }: CategoryTabsProps) {
  return (
    <div className={styles.tabs} role="tablist" aria-label="Add-on categories">
      {categories.map((category, index) => (
        <button
          key={category}
          role="tab"
          aria-selected={category === activeCategory}
          aria-controls={`panel-${category}`}
          id={`tab-${category}`}
          onClick={() => onCategoryChange(category)}
          className={`${styles.tab} ${category === activeCategory ? styles.active : ''}`}
        >
          {category}
        </button>
      ))}
    </div>
  )
}
```

**CSS**:
```css
.tabs {
  display: flex;
  gap: 0.5rem;
  border-bottom: 1px solid #e5e7eb;
  overflow-x: auto;
  scroll-behavior: smooth;
  -webkit-overflow-scrolling: touch;
  padding: 0 1rem;
}

.tab {
  padding: 1rem 1.5rem;
  min-height: 44px;
  background: transparent;
  border: none;
  border-bottom: 3px solid transparent;
  color: #6b7280;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
  flex-shrink: 0;
}

.tab:hover {
  background: #f3f4f6;
  color: #374151;
}

.tab.active {
  color: #1f2937;
  font-weight: 600;
  border-bottom-color: var(--primary-tan);
}

.tab:focus-visible {
  outline: 3px solid var(--primary-tan);
  outline-offset: 2px;
}

@media (max-width: 768px) {
  .tabs {
    padding: 0 0.5rem;
  }

  .tab {
    padding: 0.875rem 1rem;
    font-size: 0.9375rem;
  }
}
```

---

### 2.4 CategoryDescription Component

**File**: `/components/AddOns/CategoryDescription.tsx`

**Props**:
```typescript
interface CategoryDescriptionProps {
  category: CategoryName
  collapsible?: boolean  // For mobile
}
```

**Data Source**: `CATEGORY_INTROS` from `lib/data/addon-flow-service.ts`

**Visual Design**:
```
┌─────────────────────────────────────────────────┐
│  [Icon]                                         │
│                                                  │
│  Elevate Your Dining Experience                 │ <- H2
│  From beachside BBQs to gourmet picnics         │ <- Subtitle
│                                                  │
│  Transform your adventure with culinary...      │ <- Description
│                                                  │
│  ✓ Premium locally-sourced Queensland ingred... │
│  ✓ Chef-prepared meals in breathtaking locat... │
│  ✓ No meal planning or prep required            │
│  ✓ Dietary requirements accommodated            │
└─────────────────────────────────────────────────┘
```

**Behavior**:
- Desktop: Always expanded
- Mobile: Collapsible with "Show more/less" toggle
- Smooth expand/collapse animation
- Benefits list with checkmark icons

**Sample Code**:
```tsx
import { getCategoryIntro } from '@/lib/data/addon-flow-service'
import styles from './CategoryDescription.module.css'

export function CategoryDescription({ category, collapsible = false }: CategoryDescriptionProps) {
  const [isExpanded, setIsExpanded] = useState(!collapsible)
  const intro = getCategoryIntro(category)

  if (!intro) return null

  return (
    <section className={styles.description} aria-labelledby="category-title">
      <div className={styles.iconWrapper}>
        <img src={intro.icon} alt="" className={styles.icon} />
      </div>

      <h2 id="category-title" className={styles.title}>
        {intro.title}
      </h2>

      <p className={styles.subtitle}>{intro.subtitle}</p>

      <div className={`${styles.content} ${!isExpanded ? styles.collapsed : ''}`}>
        <p className={styles.text}>{intro.description}</p>

        {intro.benefits && intro.benefits.length > 0 && (
          <ul className={styles.benefits}>
            {intro.benefits.map((benefit, i) => (
              <li key={i}>
                <CheckIcon />
                <span>{benefit}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {collapsible && (
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className={styles.toggleBtn}
        >
          {isExpanded ? 'Show less' : 'Show more'}
        </button>
      )}
    </section>
  )
}
```

---

### 2.5 AddOnsGrid Layout

**Container**:
```css
.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 1.5rem;
  padding: 2rem 1rem;
  max-width: 1400px;
  margin: 0 auto;
}

@media (max-width: 768px) {
  .grid {
    grid-template-columns: 1fr;
    gap: 1rem;
    padding: 1rem 0.5rem;
  }
}

@media (min-width: 1600px) {
  .grid {
    grid-template-columns: repeat(auto-fill, minmax(360px, 1fr));
  }
}
```

**Pattern**: Same as tour detail page uses for displaying products

**Reuse**: Existing `AddonCard` component (already implemented)

---

### 2.6 AddonCard Component (REUSED)

**File**: `/components/Checkout/AddOnCard.tsx` (EXISTING)

**No Changes Required** - Component already supports all necessary features:
- Checkbox selection
- Quantity controls (when applicable)
- Price display with units
- Category badges
- Hover states
- Accessibility
- Responsive design

**Props Already Supported**:
```typescript
interface AddOnCardProps {
  addon: Addon
  isSelected: boolean
  quantity: number
  onToggle: (addon: Addon) => void
  onQuantityChange: (addonId: string, quantity: number) => void
  onLearnMore?: (addon: Addon) => void
  tourDays?: number
  participants?: number
}
```

**Visual Reference**: See existing implementation in `/components/Checkout/AddOnCard.tsx`

---

### 2.7 StickyFooter Component

**File**: `/components/AddOns/StickyFooter.tsx`

**Props**:
```typescript
interface StickyFooterProps {
  selectedCount: number
  totalPrice: number
  currencyCode: string
  onSkip: () => void
  onContinue: () => void
  disabled?: boolean
}
```

**Visual Design**:

**Desktop**:
```
┌────────────────────────────────────────────────────────┐
│  3 Add-ons Selected • $450.00 AUD    [Skip] [Continue] │
└────────────────────────────────────────────────────────┘
```

**Mobile**:
```
┌──────────────────────────────┐
│  3 Add-ons • $450.00         │
│  [Skip Add-ons] [Continue →] │
└──────────────────────────────┘
```

**Behavior**:
- Sticky to bottom on scroll
- Shows selection count and total
- Skip button: Light style, navigates to checkout
- Continue button: Primary style, navigates to checkout
- Animate in/out based on scroll position
- Safe area padding for mobile notches

**Sample Code**:
```tsx
export function StickyFooter({
  selectedCount,
  totalPrice,
  currencyCode,
  onSkip,
  onContinue,
  disabled = false
}: StickyFooterProps) {
  const formattedPrice = new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency: currencyCode
  }).format(totalPrice / 100)

  return (
    <footer className={styles.stickyFooter}>
      <div className={styles.footerContent}>
        <div className={styles.summary}>
          {selectedCount > 0 ? (
            <>
              <span className={styles.badge}>{selectedCount}</span>
              <span className={styles.text}>
                {selectedCount} Add-on{selectedCount !== 1 ? 's' : ''} Selected
              </span>
              <span className={styles.divider}>•</span>
              <span className={styles.price}>{formattedPrice}</span>
            </>
          ) : (
            <span className={styles.text}>No add-ons selected</span>
          )}
        </div>

        <div className={styles.actions}>
          <button
            onClick={onSkip}
            className={styles.skipBtn}
            disabled={disabled}
          >
            Skip Add-ons
          </button>

          <button
            onClick={onContinue}
            className={styles.continueBtn}
            disabled={disabled}
          >
            Continue to Checkout →
          </button>
        </div>
      </div>
    </footer>
  )
}
```

**CSS**:
```css
.stickyFooter {
  position: sticky;
  bottom: 0;
  left: 0;
  right: 0;
  background: white;
  border-top: 1px solid #e5e7eb;
  box-shadow: 0 -4px 12px rgba(0, 0, 0, 0.08);
  z-index: 100;
  padding: 1rem;
  padding-bottom: calc(1rem + env(safe-area-inset-bottom));
}

.footerContent {
  max-width: 1400px;
  margin: 0 auto;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
}

.summary {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 1rem;
  color: #374151;
}

.badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 24px;
  height: 24px;
  padding: 0 0.5rem;
  background: var(--primary-tan);
  color: white;
  border-radius: 12px;
  font-size: 0.875rem;
  font-weight: 600;
}

.price {
  font-weight: 700;
  font-size: 1.125rem;
  color: var(--primary-tan);
}

.actions {
  display: flex;
  gap: 1rem;
}

.skipBtn {
  padding: 0.75rem 1.5rem;
  background: white;
  border: 2px solid #e5e7eb;
  color: #6b7280;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.skipBtn:hover:not(:disabled) {
  background: #f9fafb;
  border-color: #d1d5db;
}

.continueBtn {
  padding: 0.75rem 2rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.continueBtn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(102, 126, 234, 0.5);
}

.continueBtn:disabled,
.skipBtn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

@media (max-width: 768px) {
  .footerContent {
    flex-direction: column;
    align-items: stretch;
  }

  .summary {
    justify-content: center;
  }

  .actions {
    flex-direction: column;
  }

  .skipBtn,
  .continueBtn {
    width: 100%;
  }
}
```

---

### 2.8 EmptyState Component

**File**: Inline in page or `/components/AddOns/EmptyState.tsx`

**Visual Design**:
```
┌─────────────────────────────┐
│                              │
│          [Icon]              │
│                              │
│   No Add-ons Available       │
│                              │
│   This tour doesn't have     │
│   any optional upgrades.     │
│                              │
│   [Continue to Checkout]     │
│                              │
└─────────────────────────────┘
```

**Sample Code**:
```tsx
export function EmptyState({ onContinue }: { onContinue: () => void }) {
  return (
    <div className={styles.emptyState}>
      <svg className={styles.emptyIcon} width="80" height="80" viewBox="0 0 24 24">
        {/* Icon SVG */}
      </svg>

      <h2 className={styles.emptyTitle}>No Add-ons Available</h2>

      <p className={styles.emptyText}>
        This tour doesn't have any optional upgrades at this time.
      </p>

      <button onClick={onContinue} className={styles.continueBtn}>
        Continue to Checkout
      </button>
    </div>
  )
}
```

---

## 3. Sample JSX Structure (Complete Page)

```tsx
'use client'

import { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { useCartContext } from '@/lib/context/CartContext'
import { fetchAddonsForTour, groupByCategory, type Addon } from '@/lib/data/addons'
import { AddonCard } from '@/components/Checkout/AddOnCard'
import { CategoryTabs } from '@/components/AddOns/CategoryTabs'
import { CategoryDescription } from '@/components/AddOns/CategoryDescription'
import { StickyFooter } from '@/components/AddOns/StickyFooter'
import { EmptyState } from '@/components/AddOns/EmptyState'
import { LoadingSkeleton } from '@/components/AddOns/LoadingSkeleton'
import { ToastProvider } from '@/components/Checkout/ToastContainer'
import styles from './addons.module.css'

function AddOnsPageContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { cart, addAddonToCart, removeAddonFromCart, updateAddonQuantity } = useCartContext()

  const tourHandle = searchParams.get('tour')
  const [addons, setAddons] = useState<Addon[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Load add-ons on mount
  useEffect(() => {
    async function loadAddons() {
      if (!tourHandle) {
        router.push('/tours')
        return
      }

      if (!cart.region_id) {
        console.log('[Add-ons] Waiting for cart to load...')
        return
      }

      try {
        setLoading(true)
        setError(null)

        const data = await fetchAddonsForTour(tourHandle, cart.region_id)
        setAddons(data)

        // Auto-skip if no add-ons available
        if (data.length === 0) {
          console.log('[Add-ons] No add-ons for tour, skipping to checkout')
          router.push('/checkout')
          return
        }

        console.log(`[Add-ons] Loaded ${data.length} add-ons for ${tourHandle}`)
      } catch (err) {
        console.error('[Add-ons] Load failed:', err)
        setError('Failed to load add-ons. Please try again.')
      } finally {
        setLoading(false)
      }
    }

    loadAddons()
  }, [tourHandle, cart.region_id, router])

  // Handle add-on toggle
  const handleToggle = async (addon: Addon) => {
    const isCurrentlySelected = cart.addons?.some(a => a.addon.id === addon.id)

    if (isCurrentlySelected) {
      await removeAddonFromCart(addon.id)
    } else {
      await addAddonToCart({ addon, quantity: 1 })
    }
  }

  // Handle quantity change
  const handleQuantityChange = async (addonId: string, quantity: number) => {
    await updateAddonQuantity(addonId, quantity)
  }

  // Check if addon is in cart
  const isInCart = (addonId: string): boolean => {
    return cart.addons?.some(a => a.addon.id === addonId) || false
  }

  // Get addon quantity from cart
  const getQuantity = (addonId: string): number => {
    const cartAddon = cart.addons?.find(a => a.addon.id === addonId)
    return cartAddon?.quantity || 1
  }

  // Calculate totals
  const selectedCount = cart.addons?.length || 0
  const totalPrice = cart.addons?.reduce((sum, a) => sum + a.calculated_price_cents, 0) || 0

  // Navigate to checkout
  const handleContinue = () => {
    router.push('/checkout')
  }

  const handleSkip = () => {
    router.push('/checkout')
  }

  // Loading state
  if (loading) {
    return <LoadingSkeleton />
  }

  // Error state
  if (error) {
    return (
      <div className={styles.error}>
        <p>{error}</p>
        <button onClick={() => router.push('/checkout')}>
          Continue to Checkout
        </button>
      </div>
    )
  }

  // Empty state (will auto-redirect)
  if (addons.length === 0) {
    return <EmptyState onContinue={handleContinue} />
  }

  // Group add-ons by category
  const grouped = groupByCategory(addons)
  const categories = Object.keys(grouped)
  const activeCategory = selectedCategory || categories[0]
  const categoryAddons = grouped[activeCategory] || []

  return (
    <div className={styles.page}>
      {/* Header */}
      <header className={styles.header}>
        <h1 className={styles.title}>
          Enhance Your {cart.tour_booking?.tour?.title || 'Adventure'}
        </h1>
        <p className={styles.subtitle}>
          Select optional upgrades to make your tour even more memorable
        </p>
      </header>

      {/* Category Tabs */}
      <CategoryTabs
        categories={categories}
        activeCategory={activeCategory}
        onCategoryChange={setSelectedCategory}
      />

      {/* Category Description */}
      <CategoryDescription
        category={activeCategory as any}
        collapsible={true}
      />

      {/* Add-ons Grid */}
      <div className={styles.grid} role="list">
        {categoryAddons.map((addon) => (
          <AddonCard
            key={addon.id}
            addon={addon}
            isSelected={isInCart(addon.id)}
            quantity={getQuantity(addon.id)}
            onToggle={handleToggle}
            onQuantityChange={handleQuantityChange}
            tourDays={cart.tour_booking?.tour?.duration_days || 1}
            participants={cart.tour_booking?.participants || 1}
          />
        ))}
      </div>

      {/* Sticky Footer */}
      <StickyFooter
        selectedCount={selectedCount}
        totalPrice={totalPrice}
        currencyCode={cart.region?.currency_code || 'AUD'}
        onSkip={handleSkip}
        onContinue={handleContinue}
        disabled={loading}
      />
    </div>
  )
}

// Export with ToastProvider wrapper
export default function AddOnsPage() {
  return (
    <ToastProvider>
      <AddOnsPageContent />
    </ToastProvider>
  )
}
```

---

## 4. CSS/Styling Approach

### 4.1 File Structure
```
app/checkout/add-ons/
  page.tsx
  addons.module.css

components/AddOns/
  CategoryTabs.tsx
  CategoryTabs.module.css
  CategoryDescription.tsx
  CategoryDescription.module.css
  StickyFooter.tsx
  StickyFooter.module.css
  EmptyState.tsx
  EmptyState.module.css
  LoadingSkeleton.tsx
  LoadingSkeleton.module.css
```

### 4.2 Main Page Styles

**File**: `app/checkout/add-ons/addons.module.css`

```css
/* Add-ons Page - Simplified Single-Page Layout */

.page {
  min-height: 100vh;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  padding-bottom: 120px; /* Space for sticky footer */
}

/* Header */
.header {
  background: white;
  padding: 3rem 2rem;
  text-align: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.title {
  font-size: 2.5rem;
  font-weight: 800;
  color: #1f2937;
  margin: 0 0 0.5rem 0;
  line-height: 1.2;
}

.subtitle {
  font-size: 1.125rem;
  color: #6b7280;
  margin: 0;
  max-width: 600px;
  margin-left: auto;
  margin-right: auto;
}

/* Grid Layout */
.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 1.5rem;
  padding: 2rem 1rem;
  max-width: 1400px;
  margin: 0 auto;
}

/* Error State */
.error {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 60vh;
  padding: 2rem;
  text-align: center;
}

.error p {
  font-size: 1.125rem;
  color: #dc2626;
  margin-bottom: 1.5rem;
}

.error button {
  padding: 0.875rem 1.75rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

/* Responsive Design */
@media (max-width: 768px) {
  .header {
    padding: 2rem 1rem;
  }

  .title {
    font-size: 1.875rem;
  }

  .subtitle {
    font-size: 1rem;
  }

  .grid {
    grid-template-columns: 1fr;
    gap: 1rem;
    padding: 1rem 0.5rem;
  }

  .page {
    padding-bottom: 180px; /* More space on mobile */
  }
}

@media (max-width: 480px) {
  .title {
    font-size: 1.5rem;
  }
}

/* Large screens */
@media (min-width: 1600px) {
  .grid {
    grid-template-columns: repeat(auto-fill, minmax(360px, 1fr));
  }
}

/* Dark mode support */
@media (prefers-color-scheme: dark) {
  .page {
    background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);
  }

  .header {
    background: #2C2C2C;
  }

  .title {
    color: #E8E8E8;
  }

  .subtitle {
    color: #b0b0b0;
  }
}

/* Reduced motion */
@media (prefers-reduced-motion: reduce) {
  * {
    transition: none !important;
    animation: none !important;
  }
}
```

### 4.3 Design System Variables

**Reference**: Use existing CSS variables from tour detail page

```css
:root {
  /* Colors */
  --primary-tan: #C4B5A0;
  --light-cream: #F5F3F0;
  --text-dark: #2C2C2C;

  /* Spacing */
  --space-xs: 0.25rem;
  --space-sm: 0.5rem;
  --space-md: 1rem;
  --space-lg: 1.5rem;
  --space-xl: 2rem;

  /* Border Radius */
  --radius-sm: 4px;
  --radius-md: 8px;
  --radius-lg: 12px;
  --radius-full: 9999px;

  /* Typography */
  --font-xs: 0.75rem;
  --font-sm: 0.875rem;
  --font-base: 1rem;
  --font-lg: 1.125rem;
  --font-xl: 1.25rem;
  --font-2xl: 1.5rem;

  /* Touch targets */
  --touch-target-min: 44px;

  /* Transitions */
  --transition-base: 200ms ease-in-out;
}
```

---

## 5. Accessibility Considerations

### 5.1 WCAG 2.1 AA Compliance

**Keyboard Navigation**:
- Tab order follows visual order
- All interactive elements focusable
- Skip link to main content
- Arrow keys for tab navigation
- Escape key to close modals/dropdowns

**Focus Management**:
- Visible focus indicators (3px outline)
- Focus trap in modals
- Focus restoration after actions
- No focus on hidden elements

**Screen Reader Support**:
- Semantic HTML (`<main>`, `<nav>`, `<section>`)
- ARIA labels on all controls
- ARIA live regions for dynamic content
- Descriptive button labels
- Image alt text

**Color Contrast**:
- Text: 4.5:1 minimum (AA)
- UI components: 3:1 minimum
- Use browser tools to verify
- Test with high contrast mode

**Touch Targets**:
- Minimum 44×44px (iOS/Android)
- Adequate spacing between targets
- No overlapping tap areas

### 5.2 ARIA Attributes

```html
<!-- Category Tabs -->
<div role="tablist" aria-label="Add-on categories">
  <button
    role="tab"
    aria-selected="true"
    aria-controls="panel-food"
    id="tab-food"
  >
    Food & Beverage
  </button>
</div>

<div
  role="tabpanel"
  aria-labelledby="tab-food"
  id="panel-food"
  tabindex="0"
>
  {/* Content */}
</div>

<!-- Add-ons Grid -->
<div role="list">
  <article role="listitem" aria-labelledby="addon-title-123">
    {/* AddonCard content */}
  </article>
</div>

<!-- Live updates -->
<div aria-live="polite" aria-atomic="true">
  {selectedCount} add-ons selected
</div>
```

### 5.3 Keyboard Shortcuts

| Key | Action |
|-----|--------|
| Tab | Move to next element |
| Shift+Tab | Move to previous element |
| Arrow Left/Right | Switch category tabs |
| Space/Enter | Activate button/checkbox |
| Escape | Close modal/dropdown |

---

## 6. Mobile Responsiveness Plan

### 6.1 Breakpoints

```css
/* Mobile First Approach */

/* Base: Mobile (320px - 767px) */
.grid { grid-template-columns: 1fr; }

/* Tablet: (768px - 1023px) */
@media (min-width: 768px) {
  .grid { grid-template-columns: repeat(2, 1fr); }
}

/* Desktop: (1024px - 1439px) */
@media (min-width: 1024px) {
  .grid { grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); }
}

/* Large Desktop: (1440px+) */
@media (min-width: 1440px) {
  .grid { grid-template-columns: repeat(auto-fill, minmax(360px, 1fr)); }
}
```

### 6.2 Mobile-Specific Optimizations

**Category Tabs**:
- Horizontal scroll with momentum
- Snap to tab centers
- Active tab always visible
- Touch-friendly tap targets

**Category Description**:
- Collapsible on mobile (accordion)
- "Show more/less" toggle
- Smooth expand/collapse animation

**Add-on Cards**:
- Full width on small screens
- Larger touch targets
- Simplified layout (stack elements)

**Sticky Footer**:
- Fixed to bottom (not sticky)
- Safe area padding for notches
- Stack buttons vertically
- Full-width actions

**Performance**:
- Lazy load images
- Virtual scrolling for large lists
- Debounced quantity changes
- Optimistic UI updates

### 6.3 Touch Gestures

- **Swipe left/right**: Switch categories (optional)
- **Tap**: Select/deselect add-on
- **Double tap**: Quick add-on
- **Long press**: Show details (optional)

### 6.4 Safe Areas (iOS)

```css
.stickyFooter {
  padding-bottom: calc(1rem + env(safe-area-inset-bottom));
}

.page {
  padding-left: env(safe-area-inset-left);
  padding-right: env(safe-area-inset-right);
}
```

---

## 7. Performance Optimizations

### 7.1 Loading Strategy

**Initial Load**:
1. Show skeleton for tabs and grid
2. Load add-ons data (server-side filtered)
3. Render first category immediately
4. Lazy load other categories

**Code Splitting**:
```tsx
const CategoryDescription = dynamic(() => import('./CategoryDescription'), {
  loading: () => <DescriptionSkeleton />
})
```

**Image Optimization**:
```tsx
<Image
  src={addon.image}
  alt={addon.title}
  width={400}
  height={300}
  loading="lazy"
  quality={75}
  placeholder="blur"
/>
```

### 7.2 State Management

**Optimistic Updates**:
- Show selection immediately
- Update cart in background
- Rollback on error

**Debouncing**:
- Quantity changes: 300ms debounce
- Search/filter: 500ms debounce

**Memoization**:
```tsx
const grouped = useMemo(() => groupByCategory(addons), [addons])
const categoryAddons = useMemo(() => grouped[activeCategory] || [], [grouped, activeCategory])
```

### 7.3 Network Optimization

**Prefetch**:
- Prefetch checkout page on add-on selection
- Prefetch next category on hover

**Caching**:
- Cache add-ons data (5 minutes)
- Cache category descriptions
- Use SWR or React Query

**Bundle Size**:
- Code split by route
- Tree shake unused code
- Minimize dependencies

---

## 8. Analytics & Tracking

### 8.1 Events to Track

```typescript
// Page view
trackEvent('view_addons_page', {
  tour_handle: string
  tour_title: string
  addons_count: number
  categories_count: number
})

// Category switch
trackEvent('switch_addon_category', {
  from_category: string
  to_category: string
  time_on_category: number
})

// Add-on selection
trackEvent('select_addon', {
  addon_id: string
  addon_title: string
  category: string
  price: number
  quantity: number
})

// Add-on deselection
trackEvent('deselect_addon', {
  addon_id: string
  time_selected: number
})

// Skip add-ons
trackEvent('skip_addons', {
  tour_handle: string
  view_time: number
})

// Continue to checkout
trackEvent('continue_from_addons', {
  selected_count: number
  total_value: number
  categories_visited: string[]
  time_on_page: number
})
```

### 8.2 User Behavior Metrics

- Time on page
- Categories viewed
- Add-ons viewed per category
- Selection conversion rate
- Average selections per user
- Cart abandonment rate

---

## 9. Error Handling

### 9.1 Error States

**No Tour Handle**:
- Redirect to /tours
- Show toast: "Please select a tour first"

**Failed to Load Add-ons**:
- Show error message
- Retry button
- "Skip to Checkout" option

**Add to Cart Failed**:
- Show error toast
- Revert optimistic update
- Retry automatically (1-2 times)

**Network Offline**:
- Show offline indicator
- Queue actions for when online
- Show cached data if available

### 9.2 Sample Error Handling

```tsx
try {
  await addAddonToCart({ addon, quantity: 1 })
  showToast(`${addon.title} added`, 'success')
} catch (error) {
  console.error('[Add-ons] Add to cart failed:', error)
  showToast('Failed to add to cart. Please try again.', 'error')

  // Revert optimistic update
  setLocalSelected(prev => prev.filter(id => id !== addon.id))
}
```

---

## 10. Testing Strategy

### 10.1 Unit Tests

**Components**:
- CategoryTabs renders all categories
- CategoryTabs switches on click
- AddonCard shows correct price
- StickyFooter calculates total correctly

**Utilities**:
- groupByCategory returns correct structure
- Price formatting works for all currencies
- Quantity validation works

### 10.2 Integration Tests

**Flow Tests**:
1. Load page with tour handle
2. Verify add-ons load
3. Switch categories
4. Select add-ons
5. Verify cart updates
6. Continue to checkout

**Error Tests**:
1. Load without tour handle → redirects
2. Load with invalid tour → shows error
3. Add to cart fails → shows error + retries

### 10.3 E2E Tests (Playwright)

```typescript
test('Add-ons selection flow', async ({ page }) => {
  // Navigate from tour to add-ons
  await page.goto('/tours/rainbow-beach-adventure')
  await page.click('text=Book Now')

  // Should be on add-ons page
  await expect(page).toHaveURL(/\/checkout\/add-ons/)

  // Select category
  await page.click('text=Food & Beverage')

  // Select add-on
  await page.click('text=Gourmet Picnic Lunch')

  // Verify footer updates
  await expect(page.locator('.badge')).toHaveText('1')

  // Continue to checkout
  await page.click('text=Continue to Checkout')
  await expect(page).toHaveURL('/checkout')
})
```

---

## 11. Migration from Multi-Step Wizard

### 11.1 What to Preserve

**Keep**:
- AddonCard component (reuse as-is)
- Category data structure (CATEGORY_ORDER, CATEGORY_INTROS)
- Cart operations (addAddonToCart, removeAddonFromCart)
- Toast notifications
- Analytics tracking

**Adapt**:
- Page layout (wizard → single page)
- Navigation (steps → tabs)
- Progress tracking (remove or simplify)

**Remove**:
- Step progression logic
- Multi-step flow component
- Category step component
- Progress bar (unless simplified)

### 11.2 Data Migration

**No data migration needed** - Cart structure remains the same:
```typescript
// Before and After use same cart structure
cart.addons: Array<{
  addon: Addon
  quantity: number
  calculated_price_cents: number
}>
```

### 11.3 URL Structure

**Before**: `/checkout/add-ons-flow?step=0&tour=rainbow-beach`

**After**: `/checkout/add-ons?tour=rainbow-beach&category=food-beverage`

Optional category param for deep linking.

---

## 12. Future Enhancements (Post-MVP)

### 12.1 Search & Filter
- Search bar for add-on names
- Filter by price range
- Filter by popularity
- Sort options (price, popularity, rating)

### 12.2 Recommendations
- "Popular with this tour" badge
- "Frequently bought together"
- "Customers also added"
- AI-powered suggestions

### 12.3 Rich Media
- Image galleries for add-ons
- Video previews
- 360° views
- Customer photos

### 12.4 Social Proof
- Customer reviews
- Star ratings
- "X people added this today"
- Testimonials

### 12.5 Upselling
- Bundle discounts
- Limited-time offers
- Scarcity indicators ("Only 3 left!")
- Premium tier promotions

---

## 13. Design Deliverables Checklist

- [x] Component hierarchy tree
- [x] Detailed component specifications
- [x] Sample JSX structure
- [x] CSS styling approach
- [x] Accessibility considerations
- [x] Mobile responsiveness plan
- [x] Performance optimizations
- [x] Analytics tracking plan
- [x] Error handling strategy
- [x] Testing strategy
- [x] Migration plan from wizard

---

## 14. Implementation Priority

### Phase 1: Core Functionality (Week 1)
1. Create main AddOnsPage component
2. Implement CategoryTabs component
3. Reuse AddonCard component
4. Basic cart operations
5. Simple footer (no sticky)

### Phase 2: Enhanced UX (Week 2)
1. CategoryDescription component
2. StickyFooter component
3. Loading states
4. Error handling
5. Toast notifications

### Phase 3: Polish (Week 3)
1. Analytics integration
2. Accessibility audit
3. Performance optimization
4. Mobile testing
5. Cross-browser testing

### Phase 4: Advanced Features (Future)
1. Search & filter
2. Recommendations
3. Rich media
4. Social proof

---

## 15. Success Metrics

**Usability**:
- User can find add-ons: <5 seconds
- Selection process: <2 clicks
- Page load time: <2 seconds
- Mobile score: 90+ PageSpeed

**Business**:
- Add-on attachment rate: >30%
- Average add-ons per booking: 1.5+
- Conversion rate: >60% (who view page)
- Cart abandonment: <20%

**Technical**:
- Bundle size: <200KB
- First Contentful Paint: <1.5s
- Time to Interactive: <3s
- Accessibility score: 95+ Lighthouse

---

## Conclusion

This design specification provides a complete blueprint for implementing a simplified, single-page add-ons experience that:

1. **Follows e-commerce best practices** (tabs, grid, sticky footer)
2. **Reuses existing components** (AddonCard, cart operations)
3. **Simplifies UX** (no multi-step wizard complexity)
4. **Optimizes performance** (lazy loading, code splitting)
5. **Ensures accessibility** (WCAG 2.1 AA compliant)
6. **Mobile-first design** (responsive, touch-friendly)

The design can be implemented incrementally, starting with core functionality and adding enhancements over time. All components are well-defined with props, states, and behaviors clearly specified.

**Next Step**: Proceed to implementation (Phase 3 - Coding) following this specification.
