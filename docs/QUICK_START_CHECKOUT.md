# Quick Start Guide - Checkout Testing

## Start Services

```bash
# Terminal 1 - Medusa Backend
cd /Users/Karim/med-usa-4wd
npx medusa develop

# Terminal 2 - Next.js Storefront
cd /Users/Karim/med-usa-4wd/storefront
npm run dev
```

## Test Checkout Flow

1. Go to http://localhost:3000/tours
2. Select a tour and fill details
3. Add optional add-ons
4. Fill customer information
5. Fill payment information (card details for UI only)
6. Click "Complete Booking"
7. Should redirect to confirmation page

## Expected Result

- ✅ Order created successfully
- ✅ Detailed console logs (no "[object Object]")
- ✅ Yellow banner in payment form explaining development mode
- ✅ Redirect to confirmation page

## Console Logs to Watch

```
[Cart Service] ========================================
[Cart Service] COMPLETING CART
[Cart Service] Cart ID: cart_01XXXXX
[Cart Service] ========================================

[Cart Service] Cart state before completion: {...}

[Cart Service] ========================================
[Cart Service] CART COMPLETED SUCCESSFULLY
[Cart Service] Order ID: order_01XXXXX
[Cart Service] ========================================
```

## Current Implementation

- **Payment Provider:** System Default (manual processing)
- **Status:** Testing/Development Mode
- **Production Ready:** No - Stripe Elements required

## Production Checklist

- [ ] Install Stripe packages
- [ ] Set NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
- [ ] Implement Stripe Elements in PaymentForm
- [ ] Change provider to 'pp_stripe_stripe' in checkout page
- [ ] Test with Stripe test cards
- [ ] Configure webhook handling

## Need Help?

See full documentation: `/Users/Karim/med-usa-4wd/docs/CART_COMPLETION_FIX.md`
