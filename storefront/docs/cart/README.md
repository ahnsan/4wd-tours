# Cart State Management System

## Overview

A comprehensive cart state management solution for the 4WD Medusa Tours platform with real Medusa backend integration.

## Features

- Real Medusa API integration for tours and addons
- Optimistic UI updates with background sync
- Cart persistence across page refreshes (localStorage + Medusa backend)
- Accurate price calculations (per_booking, per_day, per_person)
- Type-safe TypeScript interfaces
- Comprehensive error handling
- Auto-sync every 30 seconds
- Tax calculations (10% GST for Australia)
- Multiple specialized hooks for different use cases

## Files Created

### Type Definitions
- `/lib/types/cart.ts` - Complete TypeScript type system for cart, tours, and addons

### Context & Provider
- `/lib/context/CartContext.tsx` - React Context with Medusa backend integration

### Hooks
- `/lib/hooks/useCart.ts` - Main cart hook with 7 specialized hooks:
  - `useCart()` - Main hook with all features
  - `useCartTour()` - Tour-specific operations
  - `useCartAddons()` - Addon-specific operations
  - `useCartSummary()` - Cart summary and totals
  - `useCartOperations()` - Operations only (no state)
  - `useCartLoading()` - Loading and error states
  - `useCartId()` - Cart ID tracking

### Utilities
- `/lib/utils/priceCalculations.ts` - Price calculation functions:
  - Tour price calculations
  - Addon price calculations (3 pricing types)
  - Tax calculations
  - Price formatting
  - Price validation
  - Price reconciliation

### Documentation
- `/docs/cart/CART_INTEGRATION.md` - Complete integration guide with examples
- `/docs/cart/README.md` - This file

## Quick Start

### 1. Install in Your App

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

### 2. Use in Components

```tsx
import { useCart } from '@/lib/hooks/useCart';

function MyComponent() {
  const {
    cart,
    addTourToCart,
    addAddonToCart,
    formattedTotal,
    isEmpty
  } = useCart();

  // Your component logic
}
```

## API Endpoints

### Medusa Store API Endpoints Used

**Cart Management:**
- `POST /store/carts` - Create cart
- `GET /store/carts/:id` - Retrieve cart
- `POST /store/carts/:id` - Update cart metadata

**Line Items:**
- `POST /store/carts/:id/line-items` - Add item
- `POST /store/carts/:id/line-items/:item_id` - Update quantity
- `DELETE /store/carts/:id/line-items/:item_id` - Remove item

## Price Calculation Formulas

### Tour Pricing
```
Total = base_price_cents × participants × duration_days
```

### Addon Pricing

**Per Booking:**
```
Total = price_cents × quantity
```

**Per Day:**
```
Total = price_cents × quantity × tour_duration_days
```

**Per Person:**
```
Total = price_cents × quantity × participants
```

### Tax & Grand Total
```
Subtotal = tour_total + addons_total
Tax = subtotal × 0.10 (10% GST)
Grand Total = subtotal + tax
```

## Type Definitions

All prices are stored in **cents** to avoid floating-point errors.

### Tour Type
```typescript
interface Tour {
  id: string;              // Medusa product ID
  variant_id: string;      // Medusa variant ID for booking
  title: string;
  base_price_cents: number; // Price in cents
  duration_days: number;
  // ... more fields
}
```

### Addon Type
```typescript
interface Addon {
  id: string;
  variant_id: string;
  title: string;
  price_cents: number;
  pricing_type: 'per_booking' | 'per_day' | 'per_person';
  category: string;
  available: boolean;
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
  last_synced_at: string | null;
}
```

## Example Usage

### Adding a Tour

```tsx
import { useCart } from '@/lib/hooks/useCart';

function TourBooking({ tour }) {
  const { addTourToCart } = useCart();

  const handleBook = async () => {
    await addTourToCart({
      tour,
      participants: 2,
      start_date: '2024-12-01',
    });
  };

  return <button onClick={handleBook}>Book Tour</button>;
}
```

### Adding an Addon

```tsx
import { useCartAddons } from '@/lib/hooks/useCart';

function AddonSelector({ addon }) {
  const { addAddon } = useCartAddons();

  const handleAdd = async () => {
    await addAddon({
      addon,
      quantity: 1,
    });
  };

  return <button onClick={handleAdd}>Add Addon</button>;
}
```

### Displaying Cart Summary

```tsx
import { useCartSummary } from '@/lib/hooks/useCart';

function CartSummary() {
  const summary = useCartSummary();

  if (summary.isEmpty) {
    return <p>Cart is empty</p>;
  }

  return (
    <div>
      <p>Items: {summary.item_count}</p>
      <p>Subtotal: {summary.formattedSubtotal}</p>
      <p>Tax: {summary.formattedTax}</p>
      <p>Total: {summary.formattedTotal}</p>
    </div>
  );
}
```

## Cart Persistence

The cart persists across page refreshes using:

1. **localStorage** - Stores Medusa `cart_id`
2. **Medusa Backend** - Stores complete cart state
3. **Auto-sync** - Syncs cart every 30 seconds

### Storage Keys
- `medusa_cart_id` - Medusa cart ID
- `cart_last_synced` - Last sync timestamp

## Configuration

Edit `/lib/types/cart.ts` to configure:

```typescript
export const DEFAULT_CART_CONFIG = {
  tax_rate: 0.10,                  // 10% GST
  auto_sync_interval_ms: 30000,    // 30 seconds
  cart_expiry_days: 7,             // 7 days
  max_addons_per_cart: 50,
};
```

## Error Handling

All cart operations include error handling:

```tsx
const { cart, addTourToCart } = useCart();

// Check for errors in state
if (cart.error) {
  return <ErrorMessage error={cart.error} />;
}

// Handle operation errors
try {
  await addTourToCart({ ... });
} catch (error) {
  console.error('Failed:', error);
  // Error also stored in cart.error
}
```

## Testing

### Manual Testing

```javascript
// Browser console
localStorage.getItem('medusa_cart_id')
localStorage.getItem('cart_last_synced')

// Clear cart
localStorage.removeItem('medusa_cart_id')
localStorage.removeItem('cart_last_synced')
```

### Test Scenarios

1. **Add tour** - Verify cart created in Medusa
2. **Add addons** - Verify line items added
3. **Refresh page** - Verify cart restored from Medusa
4. **Update quantities** - Verify line items updated
5. **Remove items** - Verify line items removed
6. **Clear cart** - Verify localStorage cleared

## Architecture

```
┌─────────────────────────────────────────────┐
│         CartProvider (Context)              │
│  - Manages state                            │
│  - Syncs with Medusa                        │
│  - Handles localStorage                     │
└──────────────┬──────────────────────────────┘
               │
               ├── useCart() ──────────────────┐
               │                               │
               ├── useCartTour() ──────────────┤
               │                               │
               ├── useCartAddons() ────────────┤── Specialized Hooks
               │                               │
               ├── useCartSummary() ───────────┤
               │                               │
               ├── useCartOperations() ────────┤
               │                               │
               └── useCartId() ────────────────┘
```

## Dependencies

Required packages (already installed):
- `@medusajs/js-sdk` - Medusa SDK
- `react` - React framework
- `next` - Next.js framework

## Environment Variables

Required in `.env.local`:

```bash
NEXT_PUBLIC_MEDUSA_BACKEND_URL=http://localhost:9000
NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY=your_publishable_key
```

## Best Practices

1. **Always wrap app with CartProvider**
2. **Use specialized hooks** for better performance
3. **Handle loading states** with `cart.isLoading`
4. **Display errors** from `cart.error`
5. **Check `hasTour`** before allowing addon selection
6. **Use formatCentsToDisplay()** for consistent currency formatting
7. **Validate inputs** before cart operations

## Troubleshooting

### Cart not persisting
- Check `medusa_cart_id` in localStorage
- Verify Medusa backend is running at correct URL
- Check browser console for errors

### Prices incorrect
- Verify tour has `duration_days` field
- Check addon `pricing_type` is correct
- Ensure `participants` is set

### Sync failures
- Check network tab for failed API calls
- Verify environment variables are set
- Check Medusa backend logs

## Future Enhancements

Potential improvements:
- Discount code support
- Multiple currency support
- Abandoned cart recovery
- Cart analytics tracking
- Guest checkout support
- Cart sharing functionality

## Support

For questions or issues:
1. Check `/docs/cart/CART_INTEGRATION.md` for detailed examples
2. Review type definitions in `/lib/types/cart.ts`
3. Examine price calculations in `/lib/utils/priceCalculations.ts`
4. Test with Medusa API documentation: https://docs.medusajs.com

## License

Part of the 4WD Medusa Tours storefront application.
