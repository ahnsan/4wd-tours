# Cart State Management - Integration Guide

## Overview

The cart system provides robust state management for 4WD tours and addons with real Medusa backend integration. It features:

- Real-time synchronization with Medusa backend
- Optimistic UI updates for instant feedback
- Cart persistence across page refreshes
- Automatic price calculations
- Error handling and recovery
- Type-safe TypeScript interfaces

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                  CartProvider                        │
│  (Context with Medusa backend integration)          │
└───────────────────┬─────────────────────────────────┘
                    │
        ┌───────────┴──────────┐
        │                      │
┌───────▼─────────┐   ┌───────▼──────────┐
│   useCart()     │   │  Direct Context  │
│  Main Hook      │   │  useCartContext()│
└─────────────────┘   └──────────────────┘
        │
        ├─ useCartTour()
        ├─ useCartAddons()
        ├─ useCartSummary()
        ├─ useCartOperations()
        └─ useCartId()
```

## Quick Start

### 1. Wrap Your App with CartProvider

```tsx
// app/layout.tsx
import { CartProvider } from '@/lib/context/CartContext';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <CartProvider>
          {children}
        </CartProvider>
      </body>
    </html>
  );
}
```

### 2. Use the Cart in Components

```tsx
// components/TourBookingButton.tsx
'use client';

import { useCart } from '@/lib/hooks/useCart';
import type { Tour } from '@/lib/types/cart';

export function TourBookingButton({ tour }: { tour: Tour }) {
  const { addTourToCart, cart } = useCart();
  const [participants, setParticipants] = useState(2);
  const [startDate, setStartDate] = useState('2024-12-01');

  const handleBook = async () => {
    try {
      await addTourToCart({
        tour,
        participants,
        start_date: startDate,
      });

      // Navigate to cart or show success message
      alert('Tour added to cart!');
    } catch (error) {
      console.error('Failed to add tour:', error);
    }
  };

  return (
    <div>
      <h2>{tour.title}</h2>
      <input
        type="number"
        value={participants}
        onChange={(e) => setParticipants(Number(e.target.value))}
        min="1"
      />
      <input
        type="date"
        value={startDate}
        onChange={(e) => setStartDate(e.target.value)}
      />
      <button onClick={handleBook} disabled={cart.isLoading}>
        {cart.isLoading ? 'Adding...' : 'Book Tour'}
      </button>
    </div>
  );
}
```

## API Endpoints Used

The cart system integrates with these Medusa Store API endpoints:

### Cart Operations
- **POST** `/store/carts` - Create new cart
- **GET** `/store/carts/:id` - Retrieve cart
- **POST** `/store/carts/:id` - Update cart metadata

### Line Items
- **POST** `/store/carts/:id/line-items` - Add item to cart
- **POST** `/store/carts/:id/line-items/:item_id` - Update item quantity
- **DELETE** `/store/carts/:id/line-items/:item_id` - Remove item

## Type Definitions

### Tour
```typescript
interface Tour {
  id: string;              // Medusa product ID
  variant_id: string;      // Medusa variant ID
  title: string;
  base_price_cents: number; // Price in cents
  duration_days: number;
  // ... more fields
}
```

### Addon
```typescript
interface Addon {
  id: string;              // Medusa product ID
  variant_id: string;      // Medusa variant ID
  title: string;
  price_cents: number;     // Base price in cents
  pricing_type: 'per_booking' | 'per_day' | 'per_person';
  // ... more fields
}
```

### Cart State
```typescript
interface CartState {
  cart_id: string | null;          // Medusa cart ID
  tour_booking: TourBooking | null;
  addons: CartAddon[];
  tour_total_cents: number;
  addons_total_cents: number;
  subtotal_cents: number;
  tax_cents: number;
  total_cents: number;
  isLoading: boolean;
  error: string | null;
}
```

## Price Calculations

### Tour Pricing
```
Tour Total = base_price × participants × duration_days
```

**Example:**
- Base price: $500/person/day
- Participants: 2
- Duration: 3 days
- **Total: $500 × 2 × 3 = $3,000**

### Addon Pricing

#### Per Booking
```
Addon Total = price × quantity
```
**Example:** Camping gear rental @ $100
- Quantity: 2 sets
- **Total: $100 × 2 = $200**

#### Per Day
```
Addon Total = price × quantity × tour_duration_days
```
**Example:** Kayak rental @ $50/day
- Quantity: 1
- Tour duration: 3 days
- **Total: $50 × 1 × 3 = $150**

#### Per Person
```
Addon Total = price × quantity × participants
```
**Example:** Lunch package @ $30/person
- Quantity: 1
- Participants: 2
- **Total: $30 × 1 × 2 = $60**

### Tax Calculation
```
Tax = subtotal × tax_rate (10% GST for Australia)
Grand Total = subtotal + tax
```

## Hook Reference

### `useCart()` - Main Hook

Returns the complete cart state and all operations.

```tsx
const {
  // State
  cart,
  isEmpty,
  hasTour,
  hasAddons,
  itemCount,

  // Formatted values
  formattedTotal,
  formattedSubtotal,
  formattedTax,

  // Operations
  addTourToCart,
  addAddonToCart,
  removeAddonFromCart,
  updateAddonQuantity,
  clearCart,

  // Summary
  getCartSummary,
  priceBreakdown
} = useCart();
```

### `useCartTour()` - Tour-Specific Hook

```tsx
const {
  tourBooking,
  hasTour,
  participants,
  startDate,
  endDate,
  durationDays,
  tourTotal,
  formattedTourTotal,
  updateParticipants,
  updateDates,
  removeTour
} = useCartTour();
```

### `useCartAddons()` - Addon-Specific Hook

```tsx
const {
  addons,
  hasAddons,
  addonCount,
  addonsTotal,
  formattedAddonsTotal,
  addonsByCategory,
  addAddon,
  removeAddon,
  updateQuantity
} = useCartAddons();
```

### `useCartSummary()` - Summary Hook

```tsx
const {
  tour_booking,
  addons,
  addons_by_category,
  tour_total_cents,
  addons_total_cents,
  subtotal_cents,
  tax_cents,
  total_cents,
  item_count,
  formattedTotal,
  isEmpty
} = useCartSummary();
```

### `useCartOperations()` - Operations Only

Useful when you only need cart actions (no state):

```tsx
const {
  addTour,
  updateTourParticipants,
  addAddon,
  removeAddon,
  clearCart
} = useCartOperations();
```

### `useCartId()` - Cart ID Hook

```tsx
const { cartId, hasCart } = useCartId();
```

## Complete Examples

### Example 1: Tour Booking Page

```tsx
'use client';

import { useState } from 'react';
import { useCart } from '@/lib/hooks/useCart';
import type { Tour } from '@/lib/types/cart';

export function TourBookingPage({ tour }: { tour: Tour }) {
  const { addTourToCart, cart, isEmpty, formattedTotal } = useCart();
  const [participants, setParticipants] = useState(2);
  const [startDate, setStartDate] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!startDate) {
      alert('Please select a start date');
      return;
    }

    try {
      await addTourToCart({
        tour,
        participants,
        start_date: startDate,
      });

      // Redirect to cart page
      window.location.href = '/cart';
    } catch (error) {
      alert('Failed to add tour to cart');
    }
  };

  return (
    <div className="tour-booking">
      <h1>{tour.title}</h1>
      <p>{tour.description}</p>

      <form onSubmit={handleSubmit}>
        <div>
          <label>Participants</label>
          <input
            type="number"
            value={participants}
            onChange={(e) => setParticipants(Number(e.target.value))}
            min={tour.metadata?.min_participants || 1}
            max={tour.metadata?.max_participants || 10}
          />
        </div>

        <div>
          <label>Start Date</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            min={new Date().toISOString().split('T')[0]}
          />
        </div>

        <div className="price-summary">
          <p>Base Price: ${(tour.base_price_cents / 100).toFixed(2)}/person/day</p>
          <p>Duration: {tour.duration_days} days</p>
          <p>Total: {formattedTotal}</p>
        </div>

        <button type="submit" disabled={cart.isLoading}>
          {cart.isLoading ? 'Adding...' : 'Add to Cart'}
        </button>
      </form>
    </div>
  );
}
```

### Example 2: Addon Selection

```tsx
'use client';

import { useCartAddons, useCartTour } from '@/lib/hooks/useCart';
import type { Addon } from '@/lib/types/cart';

export function AddonSelector({ addons }: { addons: Addon[] }) {
  const { hasTour } = useCartTour();
  const {
    addons: selectedAddons,
    addonsByCategory,
    addAddon,
    removeAddon,
    updateQuantity
  } = useCartAddons();

  if (!hasTour) {
    return <p>Please select a tour first</p>;
  }

  const isSelected = (addonId: string) => {
    return selectedAddons.some(a => a.addon.id === addonId);
  };

  const getSelectedAddon = (addonId: string) => {
    return selectedAddons.find(a => a.addon.id === addonId);
  };

  return (
    <div className="addon-selector">
      <h2>Add-Ons</h2>

      {addons.map(addon => {
        const selected = isSelected(addon.id);
        const selectedAddon = getSelectedAddon(addon.id);

        return (
          <div key={addon.id} className="addon-card">
            <h3>{addon.title}</h3>
            <p>{addon.description}</p>
            <p className="price">
              ${(addon.price_cents / 100).toFixed(2)}
              {addon.pricing_type === 'per_day' && ' per day'}
              {addon.pricing_type === 'per_person' && ' per person'}
            </p>

            {selected ? (
              <div className="addon-controls">
                <input
                  type="number"
                  value={selectedAddon?.quantity || 1}
                  onChange={(e) => updateQuantity(addon.id, Number(e.target.value))}
                  min="0"
                />
                <button onClick={() => removeAddon(addon.id)}>
                  Remove
                </button>
              </div>
            ) : (
              <button onClick={() => addAddon({ addon })}>
                Add to Cart
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}
```

### Example 3: Cart Summary

```tsx
'use client';

import { useCartSummary } from '@/lib/hooks/useCart';
import { formatCentsToDisplay } from '@/lib/utils/priceCalculations';

export function CartSummaryPanel() {
  const summary = useCartSummary();

  if (summary.isEmpty) {
    return <p>Your cart is empty</p>;
  }

  return (
    <div className="cart-summary">
      {/* Tour Section */}
      {summary.tour_booking && (
        <div className="tour-section">
          <h3>Tour</h3>
          <div className="tour-details">
            <p>{summary.tour_booking.tour.title}</p>
            <p>{summary.tour_booking.participants} participants</p>
            <p>{summary.tour_booking.tour.duration_days} days</p>
            <p className="price">{summary.formattedTourTotal}</p>
          </div>
        </div>
      )}

      {/* Addons Section */}
      {summary.hasAddons && (
        <div className="addons-section">
          <h3>Add-ons</h3>
          {Object.entries(summary.addons_by_category).map(([category, items]) => (
            <div key={category} className="addon-category">
              <h4>{category}</h4>
              {items.map(item => (
                <div key={item.addon.id} className="addon-item">
                  <span>{item.addon.title} (×{item.quantity})</span>
                  <span>{formatCentsToDisplay(item.calculated_price_cents)}</span>
                </div>
              ))}
            </div>
          ))}
          <p className="addons-total">{summary.formattedAddonsTotal}</p>
        </div>
      )}

      {/* Totals */}
      <div className="totals">
        <div className="subtotal">
          <span>Subtotal</span>
          <span>{summary.formattedSubtotal}</span>
        </div>
        <div className="tax">
          <span>Tax (10% GST)</span>
          <span>{summary.formattedTax}</span>
        </div>
        <div className="total">
          <span>Total</span>
          <span>{summary.formattedTotal}</span>
        </div>
      </div>
    </div>
  );
}
```

### Example 4: Price Breakdown

```tsx
'use client';

import { useCart } from '@/lib/hooks/useCart';

export function PriceBreakdown() {
  const { priceBreakdown } = useCart();

  return (
    <div className="price-breakdown">
      <h3>Price Breakdown</h3>

      {/* Tour Breakdown */}
      <div className="tour-breakdown">
        <h4>Tour</h4>
        <p>
          ${(priceBreakdown.tour_base_price_cents / 100).toFixed(2)} ×
          {priceBreakdown.tour_participants} people ×
          {priceBreakdown.tour_duration_days} days =
          ${(priceBreakdown.tour_total_cents / 100).toFixed(2)}
        </p>
      </div>

      {/* Addons Breakdown */}
      {priceBreakdown.addon_items.length > 0 && (
        <div className="addons-breakdown">
          <h4>Add-ons</h4>
          {priceBreakdown.addon_items.map(item => (
            <div key={item.addon_id} className="addon-breakdown">
              <p>{item.title}</p>
              <p className="formula">{item.calculation_formula}</p>
            </div>
          ))}
        </div>
      )}

      {/* Final Totals */}
      <div className="final-totals">
        <div>
          <span>Subtotal:</span>
          <span>${(priceBreakdown.subtotal_cents / 100).toFixed(2)}</span>
        </div>
        <div>
          <span>Tax ({(priceBreakdown.tax_rate * 100).toFixed(0)}%):</span>
          <span>${(priceBreakdown.tax_cents / 100).toFixed(2)}</span>
        </div>
        <div className="total">
          <span>Total:</span>
          <span>${(priceBreakdown.total_cents / 100).toFixed(2)}</span>
        </div>
      </div>
    </div>
  );
}
```

## Cart Persistence

The cart automatically persists across page refreshes using:

1. **localStorage** - Stores `cart_id`
2. **Medusa Backend** - Stores complete cart state
3. **Auto-sync** - Syncs every 30 seconds (configurable)

### Cart Lifecycle

```
1. User adds tour → Create Medusa cart → Save cart_id to localStorage
2. User refreshes page → Load cart_id from localStorage → Fetch cart from Medusa
3. User adds addons → Update Medusa cart → Auto-sync in background
4. User completes checkout → Cart marked as completed
5. Cart expires after 7 days (configurable)
```

## Error Handling

The cart system handles errors gracefully:

```tsx
const { cart, addTourToCart } = useCart();

// Check for errors
if (cart.error) {
  return <ErrorMessage error={cart.error} />;
}

// Handle operation errors
try {
  await addTourToCart({ tour, participants, start_date });
} catch (error) {
  // Error is also stored in cart.error
  console.error('Failed to add tour:', error);
}
```

## Configuration

Modify cart configuration in `/lib/types/cart.ts`:

```typescript
export const DEFAULT_CART_CONFIG: CartConfig = {
  tax_rate: 0.10,                  // 10% GST
  auto_sync_interval_ms: 30000,    // 30 seconds
  cart_expiry_days: 7,             // 7 days
  max_addons_per_cart: 50,         // Maximum addons
};
```

## Testing Cart Persistence

```typescript
// Test in browser console
localStorage.getItem('medusa_cart_id'); // Check cart ID
localStorage.getItem('cart_last_synced'); // Check last sync time

// Clear cart for testing
localStorage.removeItem('medusa_cart_id');
localStorage.removeItem('cart_last_synced');
```

## Best Practices

1. **Always check `hasTour` before allowing addon selection**
2. **Use optimistic updates** - Cart updates UI immediately, syncs in background
3. **Handle loading states** - Show spinners during `cart.isLoading`
4. **Display error messages** - Show `cart.error` to users
5. **Use specific hooks** - Use `useCartTour()`, `useCartAddons()` etc. for better performance
6. **Format prices consistently** - Use `formatCentsToDisplay()` utility

## Troubleshooting

### Cart not persisting
- Check localStorage for `medusa_cart_id`
- Verify Medusa backend is running
- Check browser console for errors

### Prices not calculating correctly
- Verify tour has `duration_days`
- Check addon `pricing_type`
- Ensure participants is set

### Cart not syncing
- Check network tab for API calls
- Verify `NEXT_PUBLIC_MEDUSA_BACKEND_URL`
- Check Medusa backend logs

## Next Steps

1. Integrate with checkout flow
2. Add discount code support
3. Implement abandoned cart recovery
4. Add cart analytics tracking
5. Support multiple currencies
