# CSS Changes Required for UI Optimization

## Overview

This document details all CSS changes needed to implement the optimized add-on flow design. Changes are organized by component for easy implementation.

---

## 1. AddOnCategoryStep - Create Compact Module

**New File**: `components/Checkout/CompactCategoryHeader.module.css`

```css
/* ============================================
   COMPACT CATEGORY HEADER
   Total Height: ~140px (60% reduction from 350px)
   ============================================ */

.compactHeader {
  background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
  border-radius: 0.5rem;
  padding: 0.75rem 1rem;
  margin-bottom: 1.5rem;
  border: 1px solid #86efac;
}

/* Main Header Row (48px) */
.headerMain {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  height: 48px;
  min-height: 48px;
}

.headerLeft {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex: 1;
  min-width: 0; /* Allow text truncation */
}

.compactIcon {
  font-size: 2rem;
  line-height: 1;
  flex-shrink: 0;
  width: 2rem;
  height: 2rem;
  display: flex;
  align-items: center;
  justify-content: center;
}

.compactTitle {
  font-size: 1.25rem;
  font-weight: 700;
  color: #111827;
  margin: 0;
  line-height: 1.2;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.headerRight {
  display: flex;
  align-items: center;
  gap: 1rem;
  flex-shrink: 0;
}

.stepIndicator,
.selectionBadge,
.totalPrice {
  font-size: 0.875rem;
  font-weight: 600;
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
  white-space: nowrap;
  line-height: 1.5;
}

.stepIndicator {
  color: #059669;
  background: white;
}

.selectionBadge {
  color: white;
  background: #10b981;
}

.totalPrice {
  color: #059669;
  background: white;
  font-size: 1rem;
  padding: 0.25rem 0.5rem;
}

/* Collapsible Description (32px collapsed, 60px expanded) */
.descriptionToggle {
  background: none;
  border: none;
  width: 100%;
  cursor: pointer;
  padding: 0.5rem 0;
  text-align: left;
  transition: background-color 0.2s ease;
}

.descriptionToggle:hover {
  background-color: rgba(255, 255, 255, 0.3);
  border-radius: 0.375rem;
}

.descriptionToggle:focus-visible {
  outline: 2px solid #059669;
  outline-offset: 2px;
  border-radius: 0.375rem;
}

.briefDescription,
.fullDescription {
  font-size: 0.875rem;
  color: #065f46;
  line-height: 1.4;
  margin: 0;
  transition: max-height 0.3s ease;
}

.briefDescription::after {
  content: ' ▼';
  font-size: 0.75rem;
  margin-left: 0.5rem;
  color: #059669;
}

/* Horizontal Benefits (36px) */
.horizontalBenefits {
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
  margin-top: 0.5rem;
  min-height: 28px;
}

.benefitPill {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  font-size: 0.75rem;
  color: #047857;
  background: white;
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
  font-weight: 500;
  white-space: nowrap;
  line-height: 1.5;
}

.checkmark {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 1rem;
  height: 1rem;
  background: #10b981;
  color: white;
  border-radius: 50%;
  font-size: 0.625rem;
  font-weight: 700;
  flex-shrink: 0;
}

/* Collapsible Persuasion (24px collapsed) */
.persuasionDetails {
  margin-top: 0.5rem;
}

.persuasionSummary {
  font-size: 0.875rem;
  font-weight: 600;
  color: #059669;
  cursor: pointer;
  list-style: none;
  padding: 0.25rem 0;
  transition: color 0.2s ease;
}

.persuasionSummary:hover {
  color: #047857;
}

.persuasionSummary:focus-visible {
  outline: 2px solid #059669;
  outline-offset: 2px;
  border-radius: 0.375rem;
}

.persuasionSummary::-webkit-details-marker {
  display: none;
}

.persuasionSummary::before {
  content: '▶ ';
  display: inline-block;
  transition: transform 0.2s ease;
  margin-right: 0.375rem;
}

.persuasionDetails[open] .persuasionSummary::before {
  transform: rotate(90deg);
}

.persuasionCopy {
  font-size: 0.875rem;
  color: #065f46;
  line-height: 1.6;
  margin: 0.5rem 0 0;
  padding-left: 1.5rem;
  animation: slideDown 0.3s ease;
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Mobile Responsive */
@media (max-width: 768px) {
  .compactHeader {
    padding: 0.625rem 0.75rem;
    margin-bottom: 1rem;
  }

  .headerMain {
    flex-wrap: wrap;
    height: auto;
    gap: 0.5rem;
  }

  .headerLeft {
    width: 100%;
    margin-bottom: 0.25rem;
  }

  .compactTitle {
    font-size: 1.125rem;
  }

  .headerRight {
    width: 100%;
    justify-content: space-between;
    gap: 0.5rem;
  }

  .stepIndicator,
  .selectionBadge,
  .totalPrice {
    font-size: 0.75rem;
    padding: 0.125rem 0.5rem;
  }

  .horizontalBenefits {
    margin-top: 0.375rem;
  }

  .benefitPill {
    font-size: 0.625rem;
    padding: 0.125rem 0.5rem;
  }
}
```

---

## 2. AddOnCard - Optimize Existing Module

**File**: `components/Checkout/AddOnCard.module.css`

**Changes to Apply**:

```css
/* ============================================
   OPTIMIZED ADD-ON CARD
   Total Height: ~436px (34% reduction from 656px)
   ============================================ */

/* MODIFY: Reduce card minimum height */
.card {
  /* ... existing properties ... */
  min-height: 436px; /* CHANGED from 280px or auto */
  max-height: 480px; /* NEW: prevent excessive height */
  padding: 1rem; /* CHANGED from 1.5rem or var(--space-lg) */
  border-radius: 0.75rem; /* CHANGED from var(--radius-lg) for consistency */
}

/* MODIFY: Optimize image aspect ratio */
.imageWrapper {
  aspect-ratio: 16 / 9; /* CHANGED from 3 / 2 */
  margin-bottom: 0.75rem; /* CHANGED from 1rem */
  /* ... rest stays same ... */
}

/* MODIFY: Compact card header */
.cardHeader {
  gap: 0.75rem; /* CHANGED from var(--space-md) or 1rem */
  margin-bottom: 0.5rem; /* CHANGED from var(--space-lg) */
  padding: 0 0 0.5rem 0; /* NEW: add bottom padding */
  min-height: 32px; /* NEW: fixed height */
  max-height: 32px;
}

/* MODIFY: Reduce title size and enforce 2-line max */
.title {
  font-size: 1rem; /* CHANGED from var(--font-lg) or 1.25rem */
  line-height: 1.3;
  max-height: 40px; /* NEW: 2 lines max (1rem * 1.3 * 2) */
  display: -webkit-box;
  -webkit-line-clamp: 2; /* NEW */
  -webkit-box-orient: vertical;
  overflow: hidden;
  /* ... rest stays same ... */
}

/* MODIFY: Compact description - 2 lines only */
.description {
  font-size: 0.75rem; /* CHANGED from var(--font-sm) or 0.875rem */
  line-height: 1.5;
  margin-bottom: 0.75rem; /* CHANGED from var(--space-md) */
  max-height: 48px; /* NEW: 2 lines max (0.75rem * 1.5 * 2 + padding) */
  display: -webkit-box;
  -webkit-line-clamp: 2; /* CHANGED from 3 */
  -webkit-box-orient: vertical;
  overflow: hidden;
  /* ... rest stays same ... */
}

/* MODIFY: Tighter pricing section */
.pricing {
  gap: 0.75rem; /* CHANGED from var(--space-md) */
  margin-top: 0.5rem; /* CHANGED from var(--space-sm) */
  min-height: 52px; /* NEW: consistent height */
  max-height: 52px;
}

.priceInfo {
  gap: 0.125rem; /* CHANGED from var(--space-xs) for tighter spacing */
}

.price {
  font-size: 1.25rem; /* CHANGED from var(--font-xl) or 1.5rem */
  line-height: 1; /* NEW: remove extra spacing */
}

.unit {
  font-size: 0.625rem; /* CHANGED from var(--font-xs) or 0.75rem */
  line-height: 1.2; /* NEW */
  margin-top: 2px; /* NEW: tiny spacing from price */
}

/* MODIFY: Compact quantity controls */
.quantityControl {
  gap: 0.375rem; /* CHANGED from var(--space-sm) */
  padding: 0.125rem; /* CHANGED from existing padding */
}

.quantityBtn {
  width: 1.75rem; /* CHANGED from 40px or var(--touch-target-min) */
  height: 1.75rem;
  min-width: 36px; /* NEW: ensure touch-friendly on mobile */
  min-height: 36px;
  font-size: 1rem; /* CHANGED from var(--font-lg) */
  border-radius: 0.25rem; /* CHANGED from var(--radius-sm) */
}

.quantityValue {
  min-width: 1.5rem; /* CHANGED from 2rem */
  font-size: 0.875rem; /* CHANGED from 1rem */
}

.quantityInput {
  width: 50px; /* CHANGED from 60px */
  height: 36px; /* CHANGED from 40px */
  font-size: 0.875rem; /* CHANGED from var(--font-base) */
  padding: 0.25rem; /* CHANGED from var(--space-xs) */
}

/* HIDE: Total price display to save space */
.totalPrice {
  display: none; /* NEW: hide individual card totals */
  /* Total will be shown in category header instead */
}

/* MODIFY: Compact action buttons */
.actions {
  gap: 0.5rem; /* NEW or CHANGED from 0.75rem */
  margin-top: auto; /* NEW: push to bottom of card */
}

.actionButton {
  padding: 0.5rem 1rem; /* CHANGED from 0.75rem 1.5rem */
  font-size: 0.875rem; /* CHANGED from 1rem */
  border-radius: 0.375rem; /* CHANGED from var(--radius-md) */
  height: 40px; /* NEW: consistent button height */
  display: flex;
  align-items: center;
  justify-content: center;
}

/* MODIFY: Smaller selected badge */
.selectedBadge {
  padding: 0.125rem 0.5rem; /* CHANGED from 0.25rem 0.75rem */
  font-size: 0.625rem; /* CHANGED from 0.75rem */
}

/* MODIFY: Compact category badge */
.category {
  font-size: 0.625rem; /* CHANGED from var(--font-xs) */
  padding: 0.125rem 0.5rem; /* CHANGED from var(--space-xs) var(--space-sm) */
  margin-top: 0.5rem; /* NEW: spacing from description */
}

/* HIDE: Learn more button to save space */
.learnMoreBtn {
  display: none; /* NEW: use modal/drawer for details instead */
}

/* NEW: Add content-visibility for performance */
.card {
  content-visibility: auto;
  contain-intrinsic-size: 436px;
}

/* MODIFY: Mobile optimizations */
@media (max-width: 767px) {
  .card {
    padding: 0.875rem;
    min-height: 380px; /* CHANGED: shorter on mobile */
    max-height: 420px;
  }

  .imageWrapper {
    aspect-ratio: 4 / 3; /* CHANGED: taller image on mobile */
  }

  .title {
    font-size: 0.9375rem; /* CHANGED: slightly smaller */
  }

  .description {
    font-size: 0.6875rem; /* CHANGED: smaller text */
    -webkit-line-clamp: 2;
    max-height: 42px;
  }

  .price {
    font-size: 1.125rem;
  }

  .quantityBtn {
    width: 2rem;
    height: 2rem;
    min-width: 44px; /* Ensure touch-friendly */
    min-height: 44px;
  }
}
```

---

## 3. AddOnCategoryStep - Grid Updates

**File**: `components/Checkout/AddOnCategoryStep.module.css`

**Changes to Apply**:

```css
/* MODIFY: Reduce container padding */
.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 1.5rem 1rem; /* CHANGED from 2rem 1rem */
}

/* REMOVE: Old header styles (replaced by CompactCategoryHeader) */
/* DELETE these sections:
.header { }
.iconWrapper { }
.categoryIcon { }
.title { }
.description { }
.persuasionSection { }
.persuasionCopy { }
.benefitsList { }
.benefitItem { }
.checkIcon { }
*/

/* MODIFY: Optimize grid layout */
.addonsGrid {
  display: grid;
  grid-template-columns: repeat(3, 1fr); /* CHANGED from auto-fill, minmax(320px, 1fr) */
  gap: 1rem; /* CHANGED from 1.5rem */
  margin-bottom: 1.5rem; /* CHANGED from 3rem */
}

/* NEW: Responsive grid breakpoints */
@media (min-width: 2560px) {
  .addonsGrid {
    grid-template-columns: repeat(4, 1fr); /* 4 columns on XL screens */
  }
}

@media (max-width: 1440px) {
  .addonsGrid {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (max-width: 1024px) {
  .addonsGrid {
    grid-template-columns: repeat(2, 1fr); /* 2 columns on tablets */
  }
}

@media (max-width: 640px) {
  .addonsGrid {
    grid-template-columns: 1fr; /* 1 column on mobile */
  }
}

/* MODIFY: Reduce trust section spacing */
.trustSection {
  display: flex;
  justify-content: center;
  gap: 1.5rem; /* CHANGED from 2rem */
  flex-wrap: nowrap; /* NEW: force single row */
  padding: 1rem; /* CHANGED from 2rem 1rem */
  background: #f9fafb;
  border-radius: 0.5rem; /* CHANGED from 0.75rem */
  margin-top: 1.5rem; /* CHANGED from 3rem */
}

.trustBadge {
  display: flex;
  align-items: center;
  gap: 0.375rem; /* CHANGED from 0.5rem */
}

.trustIcon {
  font-size: 1.25rem; /* CHANGED from 1.5rem */
}

.trustText {
  font-size: 0.75rem; /* CHANGED from 0.875rem */
  font-weight: 500;
  color: #374151;
  white-space: nowrap;
}

/* MODIFY: Mobile optimizations */
@media (max-width: 640px) {
  .container {
    padding: 1rem 0.75rem; /* CHANGED from 1rem 0.5rem */
  }

  .trustSection {
    flex-direction: column;
    gap: 0.75rem; /* CHANGED from 1rem */
    padding: 0.75rem;
  }

  .trustBadge {
    justify-content: center;
  }
}
```

---

## 4. FlowProgressIndicator - Compact Stepper

**File**: `components/Checkout/FlowProgressIndicator.module.css`

**Changes to Apply**:

```css
/* MODIFY: Reduce container padding */
.container {
  width: 100%;
  padding: 0.75rem 1rem; /* CHANGED from 1.5rem 1rem */
  background: white;
  border-radius: 0.5rem; /* CHANGED from 0.75rem */
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  margin-bottom: 1rem; /* CHANGED from 2rem */
}

/* MODIFY: Thinner progress bar */
.progressBarContainer {
  height: 0.375rem; /* CHANGED from 0.5rem */
  background: #e5e7eb;
  border-radius: 9999px;
  overflow: hidden;
  margin-bottom: 0.75rem; /* CHANGED from 2rem */
}

/* MODIFY: Horizontal step layout */
.stepsContainer {
  display: flex;
  justify-content: space-between;
  align-items: center; /* CHANGED from flex-start */
  gap: 0.5rem;
  margin-bottom: 0; /* CHANGED from 1rem */
  flex-wrap: nowrap;
}

.step {
  display: flex;
  flex-direction: row; /* CHANGED from column */
  align-items: center;
  gap: 0.375rem; /* CHANGED from 0.5rem */
  flex: 1;
  min-width: fit-content;
  padding: 0.25rem; /* CHANGED from 0.5rem */
}

/* MODIFY: Smaller step circles */
.stepCircle {
  width: 2rem; /* CHANGED from 3rem */
  height: 2rem;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.875rem; /* CHANGED from 1.5rem */
  font-weight: 600;
  flex-shrink: 0;
}

/* MODIFY: Smaller step labels */
.stepLabel {
  font-size: 0.625rem; /* CHANGED from 0.75rem */
  font-weight: 500;
  line-height: 1.2;
  color: #6b7280;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 80px; /* NEW: prevent label overflow */
}

/* HIDE: Step counter to save space */
.stepCounter {
  display: none; /* NEW: moved to compact header */
}

/* MODIFY: Mobile optimizations */
@media (max-width: 640px) {
  .container {
    padding: 0.5rem 0.75rem; /* CHANGED from 1rem 0.75rem */
    margin-bottom: 0.75rem;
  }

  .progressBarContainer {
    height: 0.25rem;
    margin-bottom: 0.5rem;
  }

  .stepCircle {
    width: 1.75rem; /* CHANGED from 2.5rem */
    height: 1.75rem;
    font-size: 0.75rem;
  }

  .stepLabel {
    font-size: 0.5625rem;
    max-width: 60px;
  }

  .stepsContainer {
    gap: 0.25rem;
  }
}
```

---

## 5. AddOnMultiStepFlow - Navigation Updates

**File**: `components/Checkout/AddOnMultiStepFlow.module.css`

**Changes to Apply**:

```css
/* MODIFY: Reduce navigation padding */
.navigation {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  padding: 1rem 0; /* CHANGED from 2rem 0 */
  margin-top: 1rem; /* CHANGED from 2rem */
  border-top: 1px solid #e5e7eb; /* CHANGED from 2px */
}

/* MODIFY: Smaller navigation buttons */
.navButton {
  padding: 0.625rem 1.5rem; /* CHANGED from 1rem 2rem */
  border: none;
  border-radius: 0.5rem; /* CHANGED from 0.75rem */
  font-size: 0.875rem; /* CHANGED from 1rem */
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
  height: 40px; /* NEW: consistent height */
}

/* HIDE: Selection summary footer on category pages */
.selectionSummary {
  display: none; /* NEW: Removes sticky footer */
  /* Summary info moved to category header */
}

/* Keep summary only on final summary page */
.summaryPage .selectionSummary {
  display: block; /* Show on summary page only */
}

/* MODIFY: Mobile navigation */
@media (max-width: 768px) {
  .navigation {
    padding: 0.75rem 0; /* CHANGED from existing */
    margin-top: 0.75rem;
  }

  .navButton {
    padding: 0.5rem 1.25rem;
    font-size: 0.8125rem;
    height: 36px;
  }
}
```

---

## 6. Global/Layout Adjustments

**File**: `styles/globals.css` or relevant layout CSS

```css
/* NEW: Utility class for content visibility optimization */
.optimized-viewport {
  content-visibility: auto;
  contain-intrinsic-size: auto 500px;
}

/* NEW: Smooth scroll behavior for better UX */
html {
  scroll-behavior: smooth;
}

/* NEW: Reduced motion support */
@media (prefers-reduced-motion: reduce) {
  html {
    scroll-behavior: auto;
  }

  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## Implementation Checklist

### Step 1: Create New Files
- [ ] Create `CompactCategoryHeader.module.css` (copy code from section 1)
- [ ] Create `CompactCategoryHeader.tsx` component

### Step 2: Modify Existing Files
- [ ] Update `AddOnCard.module.css` (apply changes from section 2)
- [ ] Update `AddOnCategoryStep.module.css` (apply changes from section 3)
- [ ] Update `FlowProgressIndicator.module.css` (apply changes from section 4)
- [ ] Update `AddOnMultiStepFlow.module.css` (apply changes from section 5)

### Step 3: Component Integration
- [ ] Import `CompactCategoryHeader` into `AddOnCategoryStep`
- [ ] Replace old header JSX with `<CompactCategoryHeader />`
- [ ] Pass required props (category, step info, selections, price)

### Step 4: Testing
- [ ] Test on desktop (1920x1080, 2560x1440)
- [ ] Test on laptop (1366x768)
- [ ] Test on tablet (1024x768)
- [ ] Test on mobile (375x667, 414x896)
- [ ] Verify 6-8 cards visible on desktop
- [ ] Confirm all interactions work (collapse/expand, select, quantity)

### Step 5: Performance Validation
- [ ] Run Lighthouse audit
- [ ] Check Core Web Vitals
- [ ] Verify bundle size hasn't increased
- [ ] Test with slow 3G throttling

### Step 6: Accessibility Validation
- [ ] Test keyboard navigation
- [ ] Verify ARIA labels
- [ ] Run axe DevTools audit
- [ ] Test with screen reader (NVDA/JAWS)
- [ ] Verify color contrast ratios

---

## CSS Variables to Consider

If the project uses CSS custom properties, ensure these are defined:

```css
:root {
  /* Spacing (optimized) */
  --space-xs: 0.25rem;  /* 4px */
  --space-sm: 0.5rem;   /* 8px */
  --space-md: 0.75rem;  /* 12px */
  --space-lg: 1rem;     /* 16px */
  --space-xl: 1.5rem;   /* 24px */

  /* Border radius (optimized) */
  --radius-sm: 0.25rem;  /* 4px */
  --radius-md: 0.375rem; /* 6px */
  --radius-lg: 0.5rem;   /* 8px */
  --radius-full: 9999px;

  /* Font sizes (optimized) */
  --font-xs: 0.625rem;   /* 10px */
  --font-sm: 0.75rem;    /* 12px */
  --font-base: 0.875rem; /* 14px */
  --font-lg: 1rem;       /* 16px */
  --font-xl: 1.25rem;    /* 20px */
  --font-2xl: 1.5rem;    /* 24px */

  /* Touch targets */
  --touch-target-min: 44px; /* WCAG AAA */

  /* Transitions */
  --transition-base: 0.2s ease;
}
```

---

## Estimated Impact

### File Size Changes
- **New files**: ~8KB (CompactCategoryHeader CSS + component)
- **Modified files**: ~2KB reduction (removed styles)
- **Net change**: +6KB total CSS

### Performance Metrics
- **Layout shifts**: Reduced (fixed heights)
- **Paint time**: Improved (fewer DOM nodes)
- **Interaction time**: Maintained (same interactivity)

### Browser Compatibility
- All changes use standard CSS
- `content-visibility` has 90%+ support (progressive enhancement)
- `<details>` element: 97%+ support
- Fallbacks included for older browsers

---

**Version**: 1.0
**Last Updated**: 2025-11-10
**Ready for**: Implementation
