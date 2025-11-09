# Quick Start Guide - E2E Booking Flow

## Installation & Setup

### 1. Install Dependencies
```bash
cd /Users/Karim/med-usa-4wd/storefront
npm install
```

### 2. Start Development Server
```bash
npm run dev
# Opens at http://localhost:8000
```

### 3. Install Playwright (for testing)
```bash
npm install -D @playwright/test
npx playwright install
```

---

## Testing the Flow

### Manual Test (5 minutes)
1. Open http://localhost:8000
2. Click "Tours" in navigation
3. Select any tour
4. Choose a date (dropdown)
5. Set participants to 2 (+ button)
6. Click "Add to Cart & Continue"
7. Add 2-3 add-ons
8. Click "Continue to Checkout"
9. Fill form:
   - Name: John Doe
   - Email: john@test.com
   - Phone: 0412345678
   - Address: 123 Test St
   - City: Brisbane
   - Postcode: 4000
   - Check "agree to terms"
10. Click "Complete Booking"
11. Verify confirmation page with booking ref

### Run E2E Tests
```bash
# Run all tests
npx playwright test

# Run in UI mode (visual)
npx playwright test --ui

# Run specific test
npx playwright test booking-flow.spec.ts

# Show report
npx playwright show-report
```

---

## File Locations

### Key Files
```
storefront/
├── contexts/CartContext.tsx          # Global cart state
├── components/Navigation/            # Main nav with cart
├── lib/tours-data.ts                 # Sample data
├── app/
│   ├── tours/page.tsx               # Catalog
│   ├── tours/[id]/page.tsx          # Detail
│   ├── addons/page.tsx              # Add-ons
│   ├── checkout/page.tsx            # Checkout
│   └── confirmation/page.tsx         # Confirmation
├── tests/e2e/booking-flow.spec.ts   # E2E tests
└── docs/USER-JOURNEY.md             # Full docs
```

### Documentation
- **User Journey**: `/storefront/docs/USER-JOURNEY.md` (12,000 words)
- **Complete Summary**: `/swarm/e2e-flow/E2E_FLOW_COMPLETE.md` (8,000 words)
- **This Guide**: Quick reference

---

## Common Commands

```bash
# Development
npm run dev              # Start dev server

# Build
npm run build            # Production build
npm run start            # Run production build

# Testing
npx playwright test      # Run E2E tests
npx playwright test --ui # Visual test runner

# Code Quality
npm run lint             # Check linting
npm run typecheck        # TypeScript check
```

---

## Cart State Methods

```typescript
// Add tour to cart
addTour(tour, date, participants)

// Update participant count
updateParticipants(count)

// Add an add-on
addAddOn(addon, quantity)

// Remove an add-on
removeAddOn(addonId)

// Update add-on quantity
updateAddOnQuantity(addonId, quantity)

// Clear entire cart
clearCart()

// Get total item count
getItemCount()
```

---

## URLs

### Development
- Homepage: http://localhost:8000
- Tours: http://localhost:8000/tours
- Tour Detail: http://localhost:8000/tours/tour-1
- Add-ons: http://localhost:8000/addons
- Checkout: http://localhost:8000/checkout
- Confirmation: http://localhost:8000/confirmation?ref=XXX

---

## Sample Data

### Tours Available
1. `tour-1` - Rainbow Beach Tag-Along (AUD $249)
2. `tour-2` - K'gari Fraser Island Camping (AUD $399)
3. `tour-3` - Fraser Island Hiking (AUD $179)
4. `tour-4` - Sunset Beach Safari (AUD $199)
5. `tour-5` - Outback Discovery (AUD $299)
6. `tour-6` - Advanced 4WD Training (AUD $349)

### Add-ons Available
1. `addon-1` - Gourmet Lunch (AUD $35)
2. `addon-2` - Photography Package (AUD $150)
3. `addon-3` - GoPro Rental (AUD $45)
4. `addon-4` - Camping Equipment (AUD $80)
5. `addon-5` - Binoculars (AUD $25)
6. `addon-6` - Champagne Experience (AUD $65)
7. `addon-7` - Hotel Pickup (AUD $40)
8. `addon-8` - Travel Insurance (AUD $30)

---

## Form Validation Rules

### Checkout Form
- **First/Last Name**: Required, min 2 characters
- **Email**: Required, valid format
- **Phone**: Required, Australian format, min 10 digits
- **Address**: Required
- **City**: Required
- **Postcode**: Required, 4 digits
- **Terms**: Must be checked

---

## Troubleshooting

### Cart Not Persisting
- Check browser console for localStorage errors
- Clear localStorage: `localStorage.clear()`
- Refresh page

### Page Not Found
- Ensure dev server is running
- Check URL spelling
- Verify tour/addon IDs exist

### Tests Failing
- Ensure dev server is running on port 8000
- Check Playwright is installed
- Run `npx playwright install`

### Build Errors
- Clear `.next` folder: `rm -rf .next`
- Delete `node_modules` and reinstall
- Check Node version (requires 18+)

---

## Quick Reference

### Page Guards
- `/addons` - Redirects if no tour in cart
- `/checkout` - Redirects if no tour in cart
- `/confirmation` - Shows "not found" if no booking data

### Cart Persistence
- Stored in: `localStorage` with key `sunshine-coast-4wd-cart`
- Survives: Page refresh, tab close
- Cleared: On successful checkout, manual clear

### Mobile Navigation
- Hamburger menu: < 768px
- Desktop menu: >= 768px
- Cart icon: Always visible

---

## Next Steps After Testing

1. **If Everything Works**:
   - Deploy to staging
   - User testing
   - Prepare for Phase 2 (payments)

2. **If Issues Found**:
   - Document bugs
   - Fix issues
   - Re-test
   - Update tests

3. **Phase 2 Planning**:
   - Stripe integration
   - Backend API
   - Email notifications

---

## Support

### Questions?
- Check: `/storefront/docs/USER-JOURNEY.md`
- Check: `/swarm/e2e-flow/E2E_FLOW_COMPLETE.md`
- Email: dev@sunshinecoast4wdtours.com.au

---

**Last Updated**: November 7, 2025
**Status**: Production Ready (Frontend Only)
