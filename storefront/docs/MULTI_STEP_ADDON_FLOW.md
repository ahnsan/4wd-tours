# Multi-Step Add-on Flow UI Documentation

## Overview

The Multi-Step Add-on Flow provides a guided, step-by-step experience for customers to select add-ons for their 4WD tours. This approach reduces cognitive load by presenting one category at a time with persuasive copy and clear benefits.

## Features

- **Step-by-Step Navigation**: One category per screen
- **Progress Tracking**: Visual progress bar showing current step
- **Category Introductions**: Persuasive copy with benefits for each category
- **Flexible Selection**: Add/Remove buttons with quantity management
- **Summary Screen**: Final review of all selections
- **Mobile-First Design**: Fully responsive with Tailwind CSS
- **Performance Optimized**: Under 200KB images, lazy loading
- **Accessibility**: WCAG 2.1 AA compliant

## Architecture

### Component Structure

```
components/Checkout/
├── AddOnMultiStepFlow.tsx          # Main orchestrator component
├── AddOnMultiStepFlow.module.css
├── FlowProgressIndicator.tsx       # Progress bar component
├── FlowProgressIndicator.module.css
├── AddOnCategoryStep.tsx           # Category step display
├── AddOnCategoryStep.module.css
├── AddOnSummary.tsx                # Final summary screen
└── AddOnSummary.module.css

lib/hooks/
└── useAddOnMultiStepFlow.ts        # State management hook
```

### State Management

The `useAddOnMultiStepFlow` hook manages:
- Current step tracking
- Completed/skipped steps
- Selected add-ons with quantities
- Navigation between steps
- LocalStorage persistence

### Navigation Flow

```
Step 1: Equipment Category
    ↓
Step 2: Food & Beverage Category
    ↓
Step 3: Photography Category
    ↓
Step 4: Transport Category
    ↓
Step 5: Insurance Category
    ↓
Step 6: Summary Screen
    ↓
Checkout Page
```

## Category Configuration

Categories are defined in `useAddOnMultiStepFlow.ts`:

```typescript
export const DEFAULT_CATEGORIES: CategoryConfig[] = [
  {
    id: 'equipment',
    name: 'Equipment',
    icon: '⛺',
    title: 'Essential Camping Equipment',
    description: 'Upgrade your adventure with premium camping gear',
    persuasionCopy: 'Make your 4WD journey comfortable...',
    benefits: [
      'High-quality, well-maintained equipment',
      'Skip the hassle of packing bulky gear',
      'Perfect for first-timers and experienced campers alike',
    ],
    order: 1,
  },
  // ... more categories
];
```

### Customizing Categories

1. **Add New Category**:
```typescript
{
  id: 'your-category-id',
  name: 'Display Name',
  icon: '🎯', // Emoji or image path
  title: 'Persuasive Title',
  description: 'Short description',
  persuasionCopy: 'Longer persuasive text...',
  benefits: ['Benefit 1', 'Benefit 2', 'Benefit 3'],
  order: 6, // Display order
}
```

2. **Modify Existing Category**:
Edit the category configuration in `DEFAULT_CATEGORIES`

3. **Reorder Categories**:
Change the `order` property (lower numbers appear first)

## Integration

### Option 1: Use AddOnMultiStepFlow Component Directly

```typescript
import AddOnMultiStepFlow from '@/components/Checkout/AddOnMultiStepFlow';

export default function YourPage() {
  const { addons } = useAddOns();
  const { cart } = useCart();

  return (
    <AddOnMultiStepFlow
      addons={addons}
      tourDays={cart.tour?.duration_days || 1}
      participants={cart.participants}
      onComplete={() => router.push('/checkout/')}
    />
  );
}
```

### Option 2: Use Existing Flow Page

Navigate users to `/checkout/add-ons-flow` which has the complete implementation.

### Option 3: Replace Existing Add-ons Page

Update `/app/checkout/add-ons/page.tsx`:

```typescript
// Replace the entire page content with:
import AddOnMultiStepFlow from '../../../components/Checkout/AddOnMultiStepFlow';
// ... rest of implementation
```

## Component APIs

### AddOnMultiStepFlow

Main orchestrator component.

**Props**:
```typescript
interface AddOnMultiStepFlowProps {
  addons: AddOn[];              // Array of available add-ons
  tourDays?: number;            // Tour duration in days
  participants?: number;        // Number of participants
  onComplete?: () => void;      // Callback when flow completes
}
```

### FlowProgressIndicator

Visual progress bar showing current step.

**Props**:
```typescript
interface FlowProgressIndicatorProps {
  currentStep: number;                                      // Current step index
  totalSteps: number;                                       // Total number of steps
  completedSteps: Set<number>;                              // Set of completed step indices
  categories: Array<{ id: string; name: string; icon: string }>; // Category configs
  onStepClick?: (step: number) => void;                     // Optional navigation callback
}
```

### AddOnCategoryStep

Category display with add-ons and persuasive copy.

**Props**:
```typescript
interface AddOnCategoryStepProps {
  category: CategoryConfig;                                      // Category configuration
  addons: AddOn[];                                               // Add-ons in this category
  selectedAddOns: Map<string, { addon: AddOn; quantity: number }>; // Selected add-ons
  onAddToBooking: (addon: AddOn) => void;                        // Add callback
  onRemoveFromBooking: (addonId: string) => void;                // Remove callback
  onUpdateQuantity: (addonId: string, quantity: number) => void; // Quantity update callback
  tourDays?: number;                                             // Tour duration
  participants?: number;                                         // Number of participants
}
```

### AddOnSummary

Final summary screen with all selections.

**Props**:
```typescript
interface AddOnSummaryProps {
  selectedAddOns: Map<string, { addon: AddOn; quantity: number }>; // Selected add-ons
  onRemove: (addonId: string) => void;                              // Remove callback
  onUpdateQuantity: (addonId: string, quantity: number) => void;    // Quantity update callback
  onContinueToCheckout: () => void;                                 // Continue callback
  onGoBack?: () => void;                                            // Go back callback
  tourDays?: number;                                                // Tour duration
  participants?: number;                                            // Number of participants
}
```

### useAddOnMultiStepFlow Hook

State management hook for the flow.

**Usage**:
```typescript
const {
  // State
  currentStep,         // Current step index
  completedSteps,      // Set of completed steps
  skippedSteps,        // Set of skipped steps
  categories,          // Array of category configs
  selectedAddOns,      // Map of selected add-ons
  isComplete,          // Boolean: is flow complete?

  // Actions
  nextStep,            // Go to next step
  previousStep,        // Go to previous step
  skipStep,            // Skip current step
  goToStep,            // Jump to specific step
  markStepComplete,    // Mark step as complete
  selectAddOn,         // Select an add-on
  removeAddOn,         // Remove an add-on
  updateAddOnQuantity, // Update add-on quantity
  reset,               // Reset flow state

  // Helpers
  getCurrentCategory,  // Get current category config
  getTotalSteps,       // Get total number of steps
  getProgress,         // Get progress percentage
  isLastStep,          // Check if on last step
  isFirstStep,         // Check if on first step
} = useAddOnMultiStepFlow();
```

## Design Principles

### 1. One Category Per Screen
- Reduces cognitive overload
- Allows focused decision-making
- Easier to understand benefits

### 2. Clear Progress Indication
- Visual progress bar
- Step counter (e.g., "Step 2 of 6")
- Clickable completed steps for navigation

### 3. Easy Skip Option
- "Skip for now" button always visible
- No pressure to select everything
- Can review and add later

### 4. Persuasive But Not Pushy
- Benefits-focused copy
- Trust indicators (money-back guarantee, ratings)
- Clear value proposition

### 5. Fast Performance
- Images under 200KB
- Lazy loading for non-critical components
- Optimized CSS with Tailwind
- LocalStorage for state persistence

## User Experience Flow

### Step 1-5: Category Steps

1. **Category Introduction**
   - Large category icon
   - Compelling title
   - Persuasive description
   - Key benefits list

2. **Add-on Cards**
   - Clear title and description
   - Visual pricing with breakdown
   - "Add to Booking" / "Remove from Booking" buttons
   - Quantity selector (where applicable)

3. **Navigation**
   - Previous button (if not first step)
   - Skip button
   - Next button

4. **Selection Summary**
   - Sticky footer showing number of selections
   - "View Summary" quick link

### Step 6: Summary Screen

1. **Header**
   - Success icon
   - Count of selected items

2. **Selected Items List**
   - Each item with details
   - Quantity controls
   - Remove option
   - Individual and total pricing

3. **Total Calculation**
   - Subtotal
   - Tax note
   - Grand total

4. **Trust Indicators**
   - Money-back guarantee
   - Secure checkout
   - Rating badges

5. **Action Buttons**
   - Go Back (to previous step)
   - Continue to Checkout

## Styling

All components use CSS Modules with Tailwind-inspired styles:

- **Colors**: Green accent (#10b981) for CTAs
- **Animations**: Subtle fade-in, pulse, slide effects
- **Responsive**: Mobile-first with breakpoints at 640px, 768px
- **Accessibility**: Focus states, ARIA labels, keyboard navigation

### Key CSS Classes

```css
/* Progress indicator */
.progressBar { /* Animated width transition */ }
.step.current { /* Active step with pulse animation */ }
.step.completed { /* Checkmark with green background */ }

/* Category step */
.persuasionSection { /* Green gradient background */ }
.addonCard { /* Hover lift effect */ }
.addonCard.selected { /* Green border and background */ }

/* Summary */
.summaryIcon { /* Success pulse animation */ }
.totalSection { /* Clear pricing breakdown */ }
```

## Accessibility

- **ARIA Labels**: All interactive elements have descriptive labels
- **Keyboard Navigation**: Tab through all controls
- **Screen Reader Support**: Live regions for dynamic updates
- **Focus Management**: Clear focus indicators
- **Color Contrast**: WCAG AA compliant
- **Semantic HTML**: Proper heading hierarchy

## Analytics Integration

Track key events:

```typescript
// Step view
trackEvent('view_addon_category_step', {
  step_number,
  category,
  total_steps,
});

// Add-on selection
trackSelectAddon({
  addon_id,
  addon_title,
  price_cents,
  quantity,
});

// Category completion
trackEvent('complete_addon_category', {
  category,
  selections_count,
  skipped,
});

// Flow completion
trackContinueFromAddons({
  selected_count,
  total_value_cents,
});
```

## Performance Optimization

1. **Code Splitting**: Lazy load non-critical components
2. **Image Optimization**: All images under 200KB, WebP format
3. **State Persistence**: LocalStorage to prevent data loss
4. **Memoization**: React.memo and useMemo for expensive operations
5. **CSS**: Minimal, scoped CSS Modules

## Testing

### Unit Tests
```bash
# Test individual components
npm test components/Checkout/AddOnCategoryStep.test.tsx
npm test lib/hooks/useAddOnMultiStepFlow.test.ts
```

### Integration Tests
```bash
# Test full flow
npm test app/checkout/add-ons-flow/page.test.tsx
```

### E2E Tests
```bash
# Playwright tests
npm run test:e2e
```

## Troubleshooting

### Issue: Categories not displaying
- **Check**: Add-ons have correct `category` field matching category IDs
- **Fix**: Update addon data to match category configuration

### Issue: Progress not saving
- **Check**: LocalStorage is enabled and not full
- **Fix**: Clear localStorage or increase quota

### Issue: Styling broken
- **Check**: CSS modules are properly imported
- **Fix**: Verify file names match imports exactly

### Issue: Navigation not working
- **Check**: Router is properly configured
- **Fix**: Ensure Next.js app router is set up correctly

## Migration Guide

### From Old Add-ons Page to Multi-Step Flow

1. **Backup current page**: `cp app/checkout/add-ons/page.tsx app/checkout/add-ons/page.tsx.backup`

2. **Update route**: Redirect old route to new flow page

3. **Test thoroughly**: Ensure cart integration works

4. **Monitor analytics**: Compare conversion rates

5. **Gather feedback**: User testing and surveys

## Future Enhancements

- [ ] A/B testing framework for different category orders
- [ ] Dynamic category generation based on tour type
- [ ] Smart recommendations within categories
- [ ] Save and resume flow across sessions
- [ ] Social proof (e.g., "12 people added this today")
- [ ] Upsell suggestions in summary
- [ ] Mobile app support with native components
- [ ] Multi-language support

## Support

For questions or issues:
- Review this documentation
- Check component prop types
- Inspect browser console for errors
- Review existing implementation in `/app/checkout/add-ons-flow/page.tsx`

## Related Documentation

- [Add-ons Service](/lib/data/addons-service.ts)
- [Cart Hook](/lib/hooks/useCart.ts)
- [Checkout Flow](/app/checkout/page.tsx)
- [Performance Guidelines](/docs/performance/page-speed-guidelines.md)
- [SEO Best Practices](/docs/seo/seo-best-practices.md)
