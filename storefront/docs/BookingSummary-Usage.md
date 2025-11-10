# BookingSummary Component - Usage Guide

## Overview

The **BookingSummary** component is a unified, reusable component that displays the current booking summary (tour + add-ons) with real backend data integration. It provides a consistent user experience across all checkout steps.

## Component Location

```
/Users/Karim/med-usa-4wd/storefront/components/Checkout/BookingSummary.tsx
```

## Features

### Core Features
- ✅ Real backend data integration via Medusa cart API
- ✅ Accurate price calculations (tours, add-ons, GST, totals)
- ✅ Sticky sidebar on desktop (follows user scroll)
- ✅ Collapsible mobile view
- ✅ Progress indicator showing checkout steps
- ✅ Trust badges (secure checkout, money-back guarantee, best price)
- ✅ Edit buttons with callbacks
- ✅ Empty cart state handling
- ✅ Loading state support
- ✅ Fully responsive (mobile, tablet, desktop)
- ✅ WCAG 2.1 AA accessibility compliant

### Pricing Calculations
The component handles all three addon pricing types:
- **per_booking**: `price × quantity`
- **per_day**: `price × quantity × tour_days`
- **per_person**: `price × quantity × participants`

Plus GST (10% in Australia) and grand total calculation.

## Props Interface

```typescript
interface BookingSummaryProps {
  cart: CartState;                    // Required: Cart state from useCart hook
  showEditLinks?: boolean;            // Optional: Show edit buttons (default: true)
  compact?: boolean;                  // Optional: Compact mode (default: false)
  currentStep?: 'tour-selection' |    // Optional: Current checkout step
                'addons' |
                'checkout' |
                'confirmation';
  onEditTour?: () => void;            // Optional: Callback for Edit Tour button
  onEditAddons?: () => void;          // Optional: Callback for Edit Add-ons button
}
```

## Usage Examples

### 1. Main Checkout Page
```tsx
// /app/checkout/page.tsx
import { useCart } from '@/lib/hooks/useCart';
import BookingSummary from '@/components/Checkout/BookingSummary';

export default function CheckoutPage() {
  const { cart } = useCart();

  return (
    <div className={styles.checkoutGrid}>
      <div className={styles.formsColumn}>
        {/* Customer forms, payment forms, etc. */}
      </div>

      <aside className={styles.summaryColumn}>
        <BookingSummary
          cart={cart}
          currentStep="checkout"
          showEditLinks={true}
          onEditTour={() => router.push('/tours')}
          onEditAddons={() => router.push('/checkout/add-ons-flow')}
        />
      </aside>
    </div>
  );
}
```

### 2. Add-ons Flow Page
```tsx
// /app/checkout/add-ons-flow/page.tsx
import { useCart } from '@/lib/hooks/useCart';
import BookingSummary from '@/components/Checkout/BookingSummary';

export default function AddOnsFlowPage() {
  const { cart } = useCart();
  const router = useRouter();

  return (
    <div className={styles.contentGrid}>
      <section className={styles.addonsSection}>
        {/* Add-on selection cards */}
      </section>

      <aside className={styles.summaryColumn}>
        <BookingSummary
          cart={cart}
          currentStep="addons"
          showEditLinks={true}
          compact={false}
          onEditTour={() => router.push('/tours')}
        />
      </aside>
    </div>
  );
}
```

### 3. Confirmation Page
```tsx
// /app/checkout/confirmation/page.tsx
import { useCart } from '@/lib/hooks/useCart';
import BookingSummary from '@/components/Checkout/BookingSummary';

export default function ConfirmationPage() {
  const { cart } = useCart();

  return (
    <div className={styles.confirmationGrid}>
      <div className={styles.detailsColumn}>
        {/* Order confirmation details */}
      </div>

      <aside className={styles.summaryColumn}>
        <BookingSummary
          cart={cart}
          currentStep="confirmation"
          showEditLinks={false}  // No editing after order placed
          compact={true}          // More compact on confirmation
        />
      </aside>
    </div>
  );
}
```

### 4. Tour Detail Page (Quick Preview)
```tsx
// /app/tours/[handle]/page.tsx
import { useCart } from '@/lib/hooks/useCart';
import BookingSummary from '@/components/Checkout/BookingSummary';

export default function TourDetailPage() {
  const { cart } = useCart();

  return (
    <div className={styles.tourGrid}>
      <div className={styles.tourInfo}>
        {/* Tour images, description, etc. */}
      </div>

      <aside className={styles.sidebar}>
        <BookingSummary
          cart={cart}
          currentStep="tour-selection"
          compact={true}
          showEditLinks={false}
        />
      </aside>
    </div>
  );
}
```

## Backend Integration

### Cart State (from useCart hook)

The component expects this cart structure:

```typescript
interface CartState {
  tour: Tour | null;
  participants: number;
  tour_start_date: string | null;
  selected_addons: SelectedAddOn[];
  subtotal: number;
  total: number;
  medusa_cart_id: string | null;
}

interface Tour {
  id: string;
  title: string;
  description: string;
  base_price: number;        // Price in cents
  duration_days: number;
  image_url?: string;
}

interface SelectedAddOn {
  id: string;
  title: string;
  description: string;
  price: number;             // Unit price in cents
  pricing_type: 'per_booking' | 'per_day' | 'per_person';
  quantity: number;
  total_price: number;       // Calculated total in cents
}
```

### Price Calculations

The component uses real pricing utilities from `@/lib/utils/pricing.ts`:

```typescript
import { formatCurrency, calculateAddonPrice } from '@/lib/utils/pricing';

// Tour total
const tourTotal = cart.tour ? cart.tour.base_price * cart.participants : 0;

// Add-ons total (already calculated in cart)
const addonsTotal = cart.selected_addons.reduce((sum, addon) => {
  return sum + addon.total_price;
}, 0);

// Subtotal
const subtotal = tourTotal + addonsTotal;

// GST (10%)
const gst = Math.round(subtotal * 0.1);

// Grand total
const grandTotal = subtotal + gst;
```

### Currency Formatting

All prices are displayed using the `formatCurrency` utility:

```typescript
// From: 200000 (cents)
// To: $2,000.00 (formatted AUD)
formatCurrency(200000) // → "$2,000.00"
```

## Visual Behavior

### Desktop (≥1024px)
- Sticky sidebar that follows scroll
- Full feature display (progress, trust badges, support note)
- Edit links visible when `showEditLinks={true}`

### Tablet (768px - 1023px)
- Relative positioning (no sticky)
- Full feature display
- All interactive elements remain

### Mobile (<768px)
- Collapsible section with header bar
- Tap header to expand/collapse
- Shows total price in collapsed state
- Progress steps in vertical layout
- Simplified layout for smaller screens

## Styling & Customization

### CSS Module
```
/Users/Karim/med-usa-4wd/storefront/components/Checkout/BookingSummary.module.css
```

### Key CSS Classes
- `.summary` - Main container (sticky on desktop)
- `.summary.compact` - Compact mode
- `.summary.collapsed` - Mobile collapsed state
- `.mobileHeader` - Mobile collapsible header
- `.progress` - Progress indicator section
- `.tourCard` - Tour details card
- `.addonsList` - Add-ons list
- `.priceBreakdown` - Price breakdown section
- `.trustBadges` - Trust badges container

### Custom Styling
You can override styles by wrapping in a custom container:

```tsx
<div className="custom-summary-wrapper">
  <BookingSummary cart={cart} />
</div>
```

```css
.custom-summary-wrapper .summary {
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0,0,0,0.15);
}
```

## Accessibility

The component follows WCAG 2.1 AA standards:

- ✅ Semantic HTML (aside, sections, headings)
- ✅ ARIA labels and roles
- ✅ Keyboard navigation support
- ✅ Focus indicators
- ✅ Screen reader announcements (aria-live for price updates)
- ✅ Sufficient color contrast (4.5:1 minimum)
- ✅ Touch targets (min 44×44px on mobile)

## State Management

### Empty Cart State
When no tour is selected:
```tsx
if (!cart.tour) {
  return (
    <aside className={styles.summary}>
      <div className={styles.emptyState}>
        <h3>No Tour Selected</h3>
        <p>Start by selecting a tour</p>
        <Link href="/tours">Browse Tours</Link>
      </div>
    </aside>
  );
}
```

### Loading State
Implement in parent component:

```tsx
{isLoading ? (
  <div className={styles.loadingSkeleton}>
    Loading...
  </div>
) : (
  <BookingSummary cart={cart} />
)}
```

## Progress Steps

The component shows booking progress:

1. **Tour Selection** - Completed when cart.tour exists
2. **Add-ons** - Completed when not on tour-selection step
3. **Checkout** - Completed when on confirmation step

```typescript
const progressSteps = [
  { id: 'tour-selection', label: 'Select Tour', completed: !!cart.tour },
  { id: 'addons', label: 'Add-ons', completed: currentStep !== 'tour-selection' },
  { id: 'checkout', label: 'Checkout', completed: currentStep === 'confirmation' },
];
```

## Trust Badges

Three trust badges displayed (can be hidden with `compact={true}`):

1. **Secure Checkout** - Padlock icon
2. **Money-back Guarantee** - Checkmark icon
3. **Best Price Guarantee** - Dollar sign icon

## Testing

### Unit Tests
```bash
npm test BookingSummary.test.tsx
```

### Integration Tests
```bash
npm test checkout.test.tsx
```

### Manual Testing Checklist
- [ ] Empty cart state displays correctly
- [ ] Tour details display with correct calculations
- [ ] Add-ons list shows all selected items
- [ ] Price breakdown calculates correctly (including GST)
- [ ] Edit buttons trigger callbacks
- [ ] Mobile collapse/expand works
- [ ] Sticky sidebar works on desktop
- [ ] Progress indicator updates correctly
- [ ] Trust badges display
- [ ] Accessibility (keyboard, screen reader)

## Common Issues & Solutions

### Issue: Prices not updating
**Solution**: Ensure cart state is properly connected and useCart hook is being used.

### Issue: Sticky behavior not working
**Solution**: Check parent container doesn't have `overflow: hidden`. The sidebar needs a scrollable ancestor.

### Issue: Mobile collapse not working
**Solution**: Verify window.innerWidth detection and ensure CSS for mobile is being applied.

### Issue: Edit buttons not working
**Solution**: Ensure callbacks are provided: `onEditTour` and `onEditAddons`.

## Performance Considerations

- ✅ Memoization of calculations (tour total, addons total)
- ✅ Efficient re-renders (only when cart changes)
- ✅ Lazy loading not needed (component is small)
- ✅ CSS animations use GPU-accelerated properties (transform, opacity)

## Future Enhancements

Potential improvements:
- [ ] Add discount codes support
- [ ] Add booking protection/insurance options
- [ ] Add estimated delivery/tour date
- [ ] Add print/download summary button
- [ ] Add share booking summary feature
- [ ] Add saved for later functionality

## Support

For questions or issues:
- Email: dev@sunshinecoast4wd.com.au
- Docs: /docs/components/BookingSummary.md
- Issues: GitHub repository issues section
