# Component Structure Changes

## Overview

This document details the component-level changes required to implement the optimized add-on flow design.

---

## 1. New Component: CompactCategoryHeader

**File Path**: `/Users/Karim/med-usa-4wd/storefront/components/Checkout/CompactCategoryHeader.tsx`

### Purpose
Replaces the existing category header section in `AddOnCategoryStep` with a compressed, horizontal layout that reduces height from ~350px to ~140px.

### Component Code

```tsx
'use client';

import React, { useState } from 'react';
import type { CategoryConfig } from '../../lib/hooks/useAddOnMultiStepFlow';
import styles from './CompactCategoryHeader.module.css';

export interface CompactCategoryHeaderProps {
  category: CategoryConfig;
  currentStep: number;
  totalSteps: number;
  selectedCount: number;
  totalPrice: number;
}

/**
 * CompactCategoryHeader - Optimized horizontal layout for category information
 * Reduces height by 60% while maintaining all essential information
 *
 * Features:
 * - Single-row main header with icon, title, step indicator, selection count, total price
 * - Collapsible description (defaults to truncated)
 * - Horizontal benefits pills (top 3 displayed)
 * - Expandable persuasion copy (hidden by default)
 *
 * Height breakdown:
 * - Main header: 48px
 * - Description: 32px (collapsed) / 60px (expanded)
 * - Benefits: 36px
 * - Persuasion: 24px (collapsed) / 60px (expanded)
 * - Total: ~140px (collapsed) / ~204px (fully expanded)
 */
export default function CompactCategoryHeader({
  category,
  currentStep,
  totalSteps,
  selectedCount,
  totalPrice,
}: CompactCategoryHeaderProps) {
  const [showFullDescription, setShowFullDescription] = useState(false);
  const [showPersuasion, setShowPersuasion] = useState(false);

  // Truncate description to 80 characters
  const briefDescription = category.description.length > 80
    ? `${category.description.slice(0, 80)}...`
    : category.description;

  // Format price for display
  const formattedPrice = totalPrice > 0 ? `$${totalPrice.toFixed(2)}` : '';

  return (
    <header className={styles.compactHeader} role="banner">
      {/* Main header row - 48px fixed height */}
      <div className={styles.headerMain}>
        {/* Left side: Icon + Title */}
        <div className={styles.headerLeft}>
          <span
            className={styles.compactIcon}
            role="img"
            aria-label={category.name}
          >
            {category.icon}
          </span>
          <h2 className={styles.compactTitle}>{category.title}</h2>
        </div>

        {/* Right side: Metadata badges */}
        <div className={styles.headerRight}>
          {/* Step indicator */}
          <span
            className={styles.stepIndicator}
            aria-label={`Step ${currentStep} of ${totalSteps}`}
            role="status"
          >
            Step {currentStep}/{totalSteps}
          </span>

          {/* Selection count badge */}
          {selectedCount > 0 && (
            <span
              className={styles.selectionBadge}
              aria-label={`${selectedCount} add-on${selectedCount !== 1 ? 's' : ''} selected`}
              aria-live="polite"
              role="status"
            >
              {selectedCount} selected
            </span>
          )}

          {/* Total price */}
          {formattedPrice && (
            <span
              className={styles.totalPrice}
              aria-label={`Total price: ${formattedPrice}`}
              role="status"
            >
              {formattedPrice}
            </span>
          )}
        </div>
      </div>

      {/* Collapsible description - 32px collapsed, 60px expanded */}
      {category.description && (
        <button
          type="button"
          className={styles.descriptionToggle}
          onClick={() => setShowFullDescription(!showFullDescription)}
          aria-expanded={showFullDescription}
          aria-controls="category-description"
          aria-label={showFullDescription ? 'Show less description' : 'Show full description'}
        >
          <p
            id="category-description"
            className={showFullDescription ? styles.fullDescription : styles.briefDescription}
          >
            {showFullDescription ? category.description : briefDescription}
          </p>
        </button>
      )}

      {/* Horizontal benefits pills - 36px */}
      {category.benefits && category.benefits.length > 0 && (
        <div className={styles.horizontalBenefits} role="list" aria-label="Category benefits">
          {category.benefits.slice(0, 3).map((benefit, index) => (
            <span
              key={index}
              className={styles.benefitPill}
              role="listitem"
            >
              <span className={styles.checkmark} aria-hidden="true">✓</span>
              <span>{benefit}</span>
            </span>
          ))}
          {category.benefits.length > 3 && (
            <span
              className={styles.benefitPill}
              aria-label={`${category.benefits.length - 3} additional benefits`}
            >
              +{category.benefits.length - 3} more
            </span>
          )}
        </div>
      )}

      {/* Collapsible persuasion copy - 24px collapsed, 60px expanded */}
      {category.persuasionCopy && (
        <details
          className={styles.persuasionDetails}
          open={showPersuasion}
          onToggle={(e) => setShowPersuasion((e.target as HTMLDetailsElement).open)}
        >
          <summary
            className={styles.persuasionSummary}
            aria-label="Expand to read why you should choose these add-ons"
          >
            Why choose these add-ons?
          </summary>
          <p
            className={styles.persuasionCopy}
            role="region"
            aria-live="polite"
          >
            {category.persuasionCopy}
          </p>
        </details>
      )}
    </header>
  );
}
```

---

## 2. Modified Component: AddOnCategoryStep

**File Path**: `/Users/Karim/med-usa-4wd/storefront/components/Checkout/AddOnCategoryStep.tsx`

### Changes Required

#### Before (lines 64-91):
```tsx
return (
  <div className={styles.container}>
    {/* Category Header */}
    <header className={styles.header}>
      <div className={styles.iconWrapper}>
        <span className={styles.categoryIcon} role="img" aria-label={category.name}>
          {category.icon}
        </span>
      </div>
      <h2 className={styles.title}>{category.title}</h2>
      <p className={styles.description}>{category.description}</p>
    </header>

    {/* Persuasion Copy */}
    <div className={styles.persuasionSection}>
      <p className={styles.persuasionCopy}>{category.persuasionCopy}</p>

      {/* Benefits List */}
      {category.benefits && category.benefits.length > 0 && (
        <ul className={styles.benefitsList} role="list">
          {category.benefits.map((benefit, index) => (
            <li key={index} className={styles.benefitItem}>
              <span className={styles.checkIcon} aria-hidden="true">✓</span>
              <span>{benefit}</span>
            </li>
          ))}
        </ul>
      )}
    </div>

    {/* ... rest of component ... */}
```

#### After:
```tsx
import CompactCategoryHeader from './CompactCategoryHeader';

// ... (add to component start)

// Calculate selected count and total price
const selectedCount = selectedAddOns.size;
const totalPrice = Array.from(selectedAddOns.values()).reduce((sum, { addon, quantity }) => {
  const { price: displayPrice } = calculateDisplayPrice(addon);
  return sum + (displayPrice * quantity);
}, 0);

return (
  <div className={styles.container}>
    {/* Compact Category Header - NEW */}
    <CompactCategoryHeader
      category={category}
      currentStep={currentStep}
      totalSteps={totalSteps}
      selectedCount={selectedCount}
      totalPrice={totalPrice}
    />

    {/* ... rest of component (grid, trust section) ... */}
```

### New Props Needed
Add these to `AddOnCategoryStepProps`:

```tsx
export interface AddOnCategoryStepProps {
  category: CategoryConfig;
  addons: AddOn[];
  selectedAddOns: Map<string, { addon: AddOn; quantity: number }>;
  onAddToBooking: (addon: AddOn) => void;
  onRemoveFromBooking: (addonId: string) => void;
  onUpdateQuantity: (addonId: string, quantity: number) => void;
  tourDays?: number;
  participants?: number;
  // NEW: Required for compact header
  currentStep: number;    // Current step number
  totalSteps: number;     // Total number of steps
}
```

---

## 3. Integration with AddOnMultiStepFlow

**File Path**: `/Users/Karim/med-usa-4wd/storefront/components/Checkout/AddOnMultiStepFlow.tsx`

### Changes Required

Update the `AddOnCategoryStep` call to pass new props:

```tsx
// Around line 173
<AddOnCategoryStep
  category={currentCategory}
  addons={currentCategoryAddons}
  selectedAddOns={selectedAddOns}
  onAddToBooking={handleAddToBooking}
  onRemoveFromBooking={handleRemoveFromBooking}
  onUpdateQuantity={handleUpdateQuantity}
  tourDays={tourDays}
  participants={participants}
  // NEW props
  currentStep={currentStep}
  totalSteps={totalSteps}
/>
```

---

## 4. CSS Module Files Structure

### File Organization

```
components/Checkout/
├── CompactCategoryHeader.tsx          (NEW)
├── CompactCategoryHeader.module.css   (NEW)
├── AddOnCategoryStep.tsx              (MODIFIED)
├── AddOnCategoryStep.module.css       (MODIFIED - remove old header styles)
├── AddOnCard.tsx                       (NO CHANGES to JSX)
├── AddOnCard.module.css               (MODIFIED - optimize dimensions)
├── AddOnMultiStepFlow.tsx             (MODIFIED - pass new props)
├── AddOnMultiStepFlow.module.css      (MODIFIED - reduce navigation)
├── FlowProgressIndicator.tsx          (NO CHANGES to JSX)
├── FlowProgressIndicator.module.css   (MODIFIED - compact layout)
└── ... (other files unchanged)
```

---

## 5. Data Flow Diagram

```
AddOnMultiStepFlow
  │
  ├─ State Management
  │   ├─ currentStep (number)
  │   ├─ totalSteps (number)
  │   ├─ selectedAddOns (Map)
  │   └─ categories (CategoryConfig[])
  │
  └─ Renders ↓
      │
      ├─ FlowProgressIndicator (compact stepper)
      │   Props: currentStep, totalSteps, categories, completedSteps
      │
      └─ AddOnCategoryStep
          │
          ├─ Props:
          │   ├─ category: CategoryConfig
          │   ├─ addons: AddOn[]
          │   ├─ selectedAddOns: Map
          │   ├─ currentStep: number (NEW)
          │   ├─ totalSteps: number (NEW)
          │   └─ handlers (onAdd, onRemove, onUpdate)
          │
          └─ Renders ↓
              │
              ├─ CompactCategoryHeader (NEW)
              │   │
              │   ├─ Props:
              │   │   ├─ category: CategoryConfig
              │   │   ├─ currentStep: number
              │   │   ├─ totalSteps: number
              │   │   ├─ selectedCount: number (calculated)
              │   │   └─ totalPrice: number (calculated)
              │   │
              │   └─ Renders:
              │       ├─ Main header (icon, title, badges)
              │       ├─ Collapsible description
              │       ├─ Horizontal benefits
              │       └─ Expandable persuasion
              │
              ├─ Addons Grid (optimized spacing)
              │   └─ AddOnCard[] (compact dimensions)
              │
              └─ Trust Section (reduced height)
```

---

## 6. State Management Changes

### Calculate Selected Count and Total Price

Add this helper function to `AddOnCategoryStep`:

```tsx
// Add near the top of the component, before return statement
const getSelectionSummary = () => {
  const selectedCount = selectedAddOns.size;

  const totalPrice = Array.from(selectedAddOns.values()).reduce((sum, { addon, quantity }) => {
    const { price: displayPrice } = calculateDisplayPrice(addon);
    return sum + (displayPrice * quantity);
  }, 0);

  return { selectedCount, totalPrice };
};

const { selectedCount, totalPrice } = getSelectionSummary();
```

### No Changes Required in Parent

The parent component (`AddOnMultiStepFlow`) already manages `currentStep`, `totalSteps`, and `selectedAddOns`. These just need to be passed through as props.

---

## 7. Type Definitions

Ensure these types are properly defined in `/Users/Karim/med-usa-4wd/storefront/lib/hooks/useAddOnMultiStepFlow.ts`:

```typescript
export interface CategoryConfig {
  id: string;
  name: string;
  title: string;
  description: string;
  icon: string; // Emoji or icon component
  persuasionCopy?: string;
  benefits?: string[];
}
```

No changes needed to existing types - just verify they match the component expectations.

---

## 8. Accessibility Enhancements

### Keyboard Navigation Flow

```
1. Category Header
   ├─ Description toggle button (Enter/Space)
   ├─ Persuasion details (Enter/Space to expand)
   └─ Tab to first add-on card

2. Add-on Cards
   ├─ Checkbox (Space to toggle)
   ├─ Quantity buttons (Enter/Space, Arrow keys)
   └─ Action button (Enter/Space)

3. Navigation
   ├─ Previous button
   ├─ Skip button
   └─ Next button
```

### ARIA Attributes Added

**CompactCategoryHeader:**
- `role="banner"` on header
- `aria-label` on all metadata badges
- `aria-live="polite"` on dynamic content (selection count, price)
- `aria-expanded` on collapsible elements
- `aria-controls` linking buttons to content regions
- `role="status"` on live regions

**AddOnCard:**
- No changes needed (already compliant)

---

## 9. Testing Requirements

### Unit Tests

Create new test file: `CompactCategoryHeader.test.tsx`

```tsx
import { render, screen, fireEvent } from '@testing-library/react';
import CompactCategoryHeader from './CompactCategoryHeader';

describe('CompactCategoryHeader', () => {
  const mockCategory = {
    id: 'camping',
    name: 'Camping Gear',
    title: 'Premium Camping Equipment',
    description: 'Essential camping gear for your wilderness adventure...',
    icon: '🏕️',
    persuasionCopy: 'Enhance your outdoor experience...',
    benefits: ['Professional equipment', 'Fully sanitized', 'Flexible rental'],
  };

  it('renders main header with all badges', () => {
    render(
      <CompactCategoryHeader
        category={mockCategory}
        currentStep={2}
        totalSteps={4}
        selectedCount={3}
        totalPrice={150.50}
      />
    );

    expect(screen.getByText('Premium Camping Equipment')).toBeInTheDocument();
    expect(screen.getByText('Step 2/4')).toBeInTheDocument();
    expect(screen.getByText('3 selected')).toBeInTheDocument();
    expect(screen.getByText('$150.50')).toBeInTheDocument();
  });

  it('toggles description on button click', () => {
    render(
      <CompactCategoryHeader
        category={mockCategory}
        currentStep={1}
        totalSteps={4}
        selectedCount={0}
        totalPrice={0}
      />
    );

    const toggleButton = screen.getByRole('button', { name: /show full description/i });

    // Initially shows brief description
    expect(screen.getByText(/Essential camping gear.../)).toBeInTheDocument();

    // Click to expand
    fireEvent.click(toggleButton);
    expect(screen.getByText(mockCategory.description)).toBeInTheDocument();
  });

  it('displays top 3 benefits as pills', () => {
    render(
      <CompactCategoryHeader
        category={mockCategory}
        currentStep={1}
        totalSteps={4}
        selectedCount={0}
        totalPrice={0}
      />
    );

    expect(screen.getByText('Professional equipment')).toBeInTheDocument();
    expect(screen.getByText('Fully sanitized')).toBeInTheDocument();
    expect(screen.getByText('Flexible rental')).toBeInTheDocument();
  });

  it('hides selection badge when selectedCount is 0', () => {
    render(
      <CompactCategoryHeader
        category={mockCategory}
        currentStep={1}
        totalSteps={4}
        selectedCount={0}
        totalPrice={0}
      />
    );

    expect(screen.queryByText(/selected/)).not.toBeInTheDocument();
  });

  it('expands persuasion copy when details is opened', () => {
    render(
      <CompactCategoryHeader
        category={mockCategory}
        currentStep={1}
        totalSteps={4}
        selectedCount={0}
        totalPrice={0}
      />
    );

    const summary = screen.getByText('Why choose these add-ons?');
    fireEvent.click(summary);

    expect(screen.getByText(mockCategory.persuasionCopy)).toBeInTheDocument();
  });

  it('meets accessibility requirements', () => {
    const { container } = render(
      <CompactCategoryHeader
        category={mockCategory}
        currentStep={1}
        totalSteps={4}
        selectedCount={2}
        totalPrice={75.00}
      />
    );

    // Check ARIA attributes
    const header = container.querySelector('header');
    expect(header).toHaveAttribute('role', 'banner');

    const stepIndicator = screen.getByText('Step 1/4');
    expect(stepIndicator).toHaveAttribute('role', 'status');

    const selectionBadge = screen.getByText('2 selected');
    expect(selectionBadge).toHaveAttribute('aria-live', 'polite');
  });
});
```

### Integration Tests

Update existing `AddOnCategoryStep.test.tsx`:

```tsx
// Add these test cases

it('passes step information to CompactCategoryHeader', () => {
  render(
    <AddOnCategoryStep
      category={mockCategory}
      addons={mockAddons}
      selectedAddOns={new Map()}
      onAddToBooking={jest.fn()}
      onRemoveFromBooking={jest.fn()}
      onUpdateQuantity={jest.fn()}
      currentStep={2}
      totalSteps={5}
    />
  );

  expect(screen.getByText('Step 2/5')).toBeInTheDocument();
});

it('calculates and displays total price correctly', () => {
  const selectedMap = new Map();
  selectedMap.set('addon-1', { addon: mockAddons[0], quantity: 2 });
  selectedMap.set('addon-2', { addon: mockAddons[1], quantity: 1 });

  render(
    <AddOnCategoryStep
      category={mockCategory}
      addons={mockAddons}
      selectedAddOns={selectedMap}
      onAddToBooking={jest.fn()}
      onRemoveFromBooking={jest.fn()}
      onUpdateQuantity={jest.fn()}
      currentStep={1}
      totalSteps={4}
    />
  );

  // Verify total price is displayed (calculation depends on mock data)
  const priceElement = screen.getByText(/\$\d+\.\d{2}/);
  expect(priceElement).toBeInTheDocument();
});
```

### Visual Regression Tests

Use tools like Percy, Chromatic, or Playwright for screenshot comparisons:

```typescript
// Example with Playwright
test('compact header matches design specs', async ({ page }) => {
  await page.goto('/checkout/add-ons/camping');

  // Wait for header to render
  await page.waitForSelector('[role="banner"]');

  // Take screenshot of header only
  const header = await page.locator('[role="banner"]');
  await expect(header).toHaveScreenshot('compact-category-header.png');

  // Verify height is within spec (140px ± 5px)
  const box = await header.boundingBox();
  expect(box?.height).toBeGreaterThanOrEqual(135);
  expect(box?.height).toBeLessThanOrEqual(145);
});
```

---

## 10. Migration Checklist

### Pre-Implementation
- [ ] Review design specifications document
- [ ] Confirm component API with team
- [ ] Set up feature flag for gradual rollout
- [ ] Create test environment

### Implementation Phase
- [ ] Create `CompactCategoryHeader` component
- [ ] Create `CompactCategoryHeader.module.css`
- [ ] Update `AddOnCategoryStep` to use new component
- [ ] Modify CSS files as specified
- [ ] Update TypeScript interfaces
- [ ] Write unit tests for new component
- [ ] Update integration tests

### Testing Phase
- [ ] Manual testing on all breakpoints
- [ ] Automated visual regression tests
- [ ] Accessibility audit (axe DevTools)
- [ ] Performance testing (Lighthouse)
- [ ] Cross-browser testing
- [ ] Screen reader testing

### Deployment Phase
- [ ] Deploy to staging environment
- [ ] A/B test with 20% of users
- [ ] Monitor analytics and user feedback
- [ ] Fix any issues identified
- [ ] Gradual rollout to 100%

### Post-Deployment
- [ ] Monitor Core Web Vitals
- [ ] Track conversion rate changes
- [ ] Collect user feedback
- [ ] Document learnings
- [ ] Plan follow-up optimizations

---

## 11. Rollback Plan

If issues are discovered after deployment:

### Immediate Rollback (< 5 minutes)
```bash
# Toggle feature flag
npm run feature-flag toggle compact-header off

# Or revert to previous deployment
npm run deploy:rollback
```

### Component-Level Rollback
```tsx
// In AddOnCategoryStep.tsx, use conditional rendering
const USE_COMPACT_HEADER = process.env.NEXT_PUBLIC_USE_COMPACT_HEADER === 'true';

return (
  <div className={styles.container}>
    {USE_COMPACT_HEADER ? (
      <CompactCategoryHeader {...compactProps} />
    ) : (
      // Old header code
      <header className={styles.header}>
        {/* ... original header ... */}
      </header>
    )}
    {/* ... rest of component ... */}
  </div>
);
```

---

## Summary

### Files to Create
1. `CompactCategoryHeader.tsx` (~150 lines)
2. `CompactCategoryHeader.module.css` (~200 lines)
3. `CompactCategoryHeader.test.tsx` (~100 lines)

### Files to Modify
1. `AddOnCategoryStep.tsx` (remove ~30 lines, add ~15 lines)
2. `AddOnCategoryStep.module.css` (remove ~150 lines, modify ~50 lines)
3. `AddOnCard.module.css` (modify ~40 lines)
4. `FlowProgressIndicator.module.css` (modify ~30 lines)
5. `AddOnMultiStepFlow.tsx` (add 2 props to component call)
6. `AddOnMultiStepFlow.module.css` (modify ~20 lines)

### Estimated Development Time
- Component creation: 4-6 hours
- CSS optimization: 3-4 hours
- Testing setup: 2-3 hours
- Integration: 2-3 hours
- **Total**: 11-16 hours (1.5-2 days)

### Risk Level: LOW
- Mostly CSS changes
- New component is isolated
- Easy to rollback
- No breaking API changes

---

**Version**: 1.0
**Last Updated**: 2025-11-10
**Status**: Ready for Implementation
