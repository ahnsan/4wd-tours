# Cart System - Quick Reference Card

## Installation

```tsx
// app/layout.tsx
import { CartProvider } from '@/lib/context/CartContext';

<CartProvider>{children}</CartProvider>
```

## Main Hook

```tsx
import { useCart } from '@/lib/hooks/useCart';

const {
  // State
  cart,              // CartState
  isEmpty,           // boolean
  hasTour,           // boolean
  hasAddons,         // boolean
  itemCount,         // number

  // Formatted values
  formattedTotal,    // "$123.45"
  formattedSubtotal, // "$100.00"
  formattedTax,      // "$10.00"

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

## Specialized Hooks

### Tour Operations
```tsx
import { useCartTour } from '@/lib/hooks/useCart';

const {
  tourBooking,        // TourBooking | null
  hasTour,            // boolean
  participants,       // number
  startDate,          // string | null
  updateParticipants, // (n: number) => Promise<void>
  updateDates,        // (date: string) => Promise<void>
  removeTour          // () => Promise<void>
} = useCartTour();
```

### Addon Operations
```tsx
import { useCartAddons } from '@/lib/hooks/useCart';

const {
  addons,            // CartAddon[]
  hasAddons,         // boolean
  addonsByCategory,  // Record<string, CartAddon[]>
  addAddon,          // (params) => Promise<void>
  removeAddon,       // (id: string) => Promise<void>
  updateQuantity     // (id: string, qty: number) => Promise<void>
} = useCartAddons();
```

### Cart Summary
```tsx
import { useCartSummary } from '@/lib/hooks/useCart';

const summary = useCartSummary();
// Returns: all totals + formatted strings + isEmpty
```

### Operations Only
```tsx
import { useCartOperations } from '@/lib/hooks/useCart';

const {
  addTour,
  addAddon,
  removeAddon,
  clearCart
} = useCartOperations();
```

## Common Operations

### Add Tour to Cart
```tsx
await addTourToCart({
  tour,              // Tour object
  participants: 2,   // number
  start_date: '2024-12-01' // ISO date string
});
```

### Add Addon to Cart
```tsx
await addAddonToCart({
  addon,           // Addon object
  quantity: 1      // optional, default: 1
});
```

### Update Addon Quantity
```tsx
await updateAddonQuantity(addonId, 3);
// Set to 0 to remove
```

### Remove Addon
```tsx
await removeAddonFromCart(addonId);
```

### Update Participants
```tsx
await updateTourParticipants(4);
```

### Clear Cart
```tsx
await clearCart();
```

## Type Definitions

### Tour
```typescript
interface Tour {
  id: string;
  variant_id: string;
  title: string;
  base_price_cents: number;
  duration_days: number;
}
```

### Addon
```typescript
interface Addon {
  id: string;
  variant_id: string;
  title: string;
  price_cents: number;
  pricing_type: 'per_booking' | 'per_day' | 'per_person';
  category: string;
}
```

### Cart State
```typescript
interface CartState {
  cart_id: string | null;
  tour_booking: TourBooking | null;
  addons: CartAddon[];
  total_cents: number;
  isLoading: boolean;
  error: string | null;
}
```

## Price Formulas

### Tour
```
Total = base_price × participants × duration_days
```

### Addon - Per Booking
```
Total = price × quantity
```

### Addon - Per Day
```
Total = price × quantity × tour_duration_days
```

### Addon - Per Person
```
Total = price × quantity × participants
```

### Tax & Total
```
Subtotal = tour_total + addons_total
Tax = subtotal × 0.10 (10% GST)
Total = subtotal + tax
```

## Price Formatting

```tsx
import { formatCentsToDisplay } from '@/lib/utils/priceCalculations';

formatCentsToDisplay(12345);  // "$123.45"
formatCentsToDisplay(10000);  // "$100.00"
```

## Error Handling

```tsx
const { cart, addTourToCart } = useCart();

// Check state error
if (cart.error) {
  return <ErrorMessage error={cart.error} />;
}

// Handle operation error
try {
  await addTourToCart({ ... });
} catch (error) {
  console.error(error);
  // Error also in cart.error
}
```

## Loading States

```tsx
const { cart } = useCart();

<button disabled={cart.isLoading}>
  {cart.isLoading ? 'Loading...' : 'Add to Cart'}
</button>
```

## Cart Persistence

Cart automatically persists using:
- localStorage: `medusa_cart_id`
- Medusa backend: complete cart state
- Auto-sync: every 30 seconds

## Configuration

Edit `/lib/types/cart.ts`:

```typescript
export const DEFAULT_CART_CONFIG = {
  tax_rate: 0.10,               // 10% GST
  auto_sync_interval_ms: 30000, // 30 seconds
  cart_expiry_days: 7,          // 7 days
  max_addons_per_cart: 50
};
```

## API Endpoints

```
POST   /store/carts                           - Create cart
GET    /store/carts/:id                       - Get cart
POST   /store/carts/:id                       - Update metadata
POST   /store/carts/:id/line-items            - Add item
POST   /store/carts/:id/line-items/:item_id   - Update item
DELETE /store/carts/:id/line-items/:item_id   - Remove item
```

## Environment Variables

```bash
NEXT_PUBLIC_MEDUSA_BACKEND_URL=http://localhost:9000
NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY=your_key
```

## Complete Example

```tsx
'use client';

import { useCart } from '@/lib/hooks/useCart';

function CartPage() {
  const {
    cart,
    isEmpty,
    formattedTotal,
    clearCart
  } = useCart();

  if (cart.isLoading) return <div>Loading...</div>;
  if (cart.error) return <div>Error: {cart.error}</div>;
  if (isEmpty) return <div>Cart is empty</div>;

  return (
    <div>
      {/* Tour */}
      {cart.tour_booking && (
        <div>
          <h2>{cart.tour_booking.tour.title}</h2>
          <p>{cart.tour_booking.participants} participants</p>
        </div>
      )}

      {/* Addons */}
      {cart.addons.map(item => (
        <div key={item.addon.id}>
          <span>{item.addon.title}</span>
          <span>×{item.quantity}</span>
        </div>
      ))}

      {/* Total */}
      <div>
        <strong>Total: {formattedTotal}</strong>
      </div>

      {/* Actions */}
      <button onClick={clearCart}>Clear Cart</button>
      <button onClick={() => window.location.href = '/checkout'}>
        Checkout
      </button>
    </div>
  );
}
```

## Testing in Console

```javascript
// Check cart ID
localStorage.getItem('medusa_cart_id')

// Check last sync
localStorage.getItem('cart_last_synced')

// Clear cart (for testing)
localStorage.removeItem('medusa_cart_id')
localStorage.removeItem('cart_last_synced')
```

## Best Practices

1. ✅ Always wrap app with `<CartProvider>`
2. ✅ Use specialized hooks when possible
3. ✅ Handle `cart.isLoading` in UI
4. ✅ Display `cart.error` to users
5. ✅ Check `hasTour` before allowing addons
6. ✅ Use `formatCentsToDisplay()` for prices
7. ✅ Validate inputs before cart operations

## Common Patterns

### Tour Selection
```tsx
const { addTourToCart } = useCart();
const [participants, setParticipants] = useState(2);

<button onClick={() => addTourToCart({
  tour,
  participants,
  start_date
})}>
  Book Tour
</button>
```

### Addon Toggle
```tsx
const { addons, addAddon, removeAddon } = useCartAddons();
const isSelected = addons.some(a => a.addon.id === addon.id);

<button onClick={() =>
  isSelected ? removeAddon(addon.id) : addAddon({ addon })
}>
  {isSelected ? 'Remove' : 'Add'}
</button>
```

### Cart Badge
```tsx
const { itemCount } = useCart();

<CartIcon badge={itemCount} />
```

### Price Display
```tsx
const { priceBreakdown } = useCart();

{priceBreakdown.addon_items.map(item => (
  <div key={item.addon_id}>
    {item.calculation_formula}
  </div>
))}
```

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Cart not persisting | Check localStorage and Medusa backend |
| Prices incorrect | Verify tour duration_days and pricing_type |
| Sync failing | Check network tab and environment variables |
| Cart empty on refresh | Check cart_id in localStorage |

## File Locations

- Types: `/lib/types/cart.ts`
- Context: `/lib/context/CartContext.tsx`
- Hooks: `/lib/hooks/useCart.ts`
- Utils: `/lib/utils/priceCalculations.ts`
- Docs: `/docs/cart/`

## Links

- Full Guide: `/docs/cart/CART_INTEGRATION.md`
- README: `/docs/cart/README.md`
- File Manifest: `/docs/cart/FILE_MANIFEST.md`
- Medusa Docs: https://docs.medusajs.com
