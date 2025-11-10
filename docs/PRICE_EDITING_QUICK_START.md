# Price Editing Quick Start Guide

**TL;DR:** Medusa v2 has built-in price editing. Custom widget added for convenience.

---

## Quick Access

### Default Admin (Recommended)
```
http://localhost:9000/app
→ Products
→ [Select Product]
→ Variants
→ Edit Variant
→ Prices
→ Update & Save
```

### Custom Widget (Quick View)
```
http://localhost:9000/app
→ Products
→ [Select Product]
→ Scroll to "Price Management" widget
→ Edit Prices
→ Save Changes
```

---

## Common Tasks

### Edit Tour Price

**Example: Change "1 Day Fraser Island Tour" from $2,000 to $2,200**

1. Open admin: `http://localhost:9000/app`
2. Navigate: Products → "1 Day Fraser Island Tour"
3. Method A (Default):
   - Variants → Edit → Prices
   - Change `200000` to `220000` (cents)
   - Save
4. Method B (Widget):
   - Scroll to "Price Management"
   - Click "Edit Prices"
   - Change `2000` to `2200` (dollars)
   - Click "Save Changes"

### Edit Add-On Price

**Example: Change "Internet Access" from $30 to $35**

1. Products → "Internet Access"
2. Use default admin or widget
3. Change price
4. Save

### Verify Changes

**Storefront:**
```
http://localhost:8000/tours/1d-fraser-island
```

**API:**
```bash
curl -s "http://localhost:9000/store/products?region_id=reg_01K9G4HA190556136E7RJQ4411" \
  -H "x-publishable-api-key: pk_34de56e6f305b46e6d22bb1d2d3304bd9eea498066ca7749bd667318dca31ffc" \
  | jq '.products[] | select(.handle=="1d-fraser-island") | .variants[0].calculated_price'
```

---

## File Locations

**Custom Widget:**
```
/Users/Karim/med-usa-4wd/src/admin/widgets/product-price-manager.tsx
```

**Documentation:**
```
/Users/Karim/med-usa-4wd/docs/medusa-price-editing-guide.md
```

**Pricing Reports:**
```
/Users/Karim/med-usa-4wd/docs/pricing-update-report.md
/Users/Karim/med-usa-4wd/docs/pricing-ui-comparison.md
```

---

## Features

### Default Admin
✅ Multi-currency pricing
✅ Regional pricing
✅ Tax settings
✅ Price lists
✅ Bulk editing
✅ Quantity-based pricing

### Custom Widget
✅ Visual price overview
✅ Tour duration display
✅ Per-day pricing breakdown
✅ Quick edit mode
✅ Real-time updates

---

## Support

**Full Guide:** `/Users/Karim/med-usa-4wd/docs/medusa-price-editing-guide.md`

**Troubleshooting:**
- Widget not showing? Rebuild: `npm run build && npm run dev`
- Prices not updating? Clear cache: `Cmd+Shift+R`
- API errors? Check authentication and region configuration

---

**Status:** ✅ Complete
**Last Updated:** 2025-11-08
