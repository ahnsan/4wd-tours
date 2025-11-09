# Medusa Admin Price Editing Guide

**Date:** 2025-11-08
**Medusa Version:** 2.11.3
**Status:** ✅ COMPLETE

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Default Admin Price Editing](#default-admin-price-editing)
3. [Custom Price Management Widget](#custom-price-management-widget)
4. [Step-by-Step Guide](#step-by-step-guide)
5. [API Reference](#api-reference)
6. [Testing Checklist](#testing-checklist)
7. [Troubleshooting](#troubleshooting)

---

## Executive Summary

### Finding: Price Editing IS Available in Default Medusa v2 Admin

**YES** - Medusa v2 admin includes built-in price editing functionality. No custom UI is strictly required for basic price management.

**Default Capabilities:**
- ✅ Edit variant prices per currency
- ✅ Edit variant prices per region
- ✅ Manage tax-inclusive/exclusive pricing
- ✅ Set quantity-based pricing rules
- ✅ Create price lists for special pricing
- ✅ Bulk price editor interface

**Enhancement Provided:**
- ✅ Custom admin widget for simplified price viewing
- ✅ Duration-aware pricing for tour products
- ✅ Quick price editing interface
- ✅ Price-per-day calculations for tours

---

## Default Admin Price Editing

### How to Edit Prices in Default Medusa Admin

Medusa v2 provides a complete price management interface in the admin dashboard.

#### Method 1: Edit Variant Prices

**Navigation Path:**
```
Admin Dashboard (http://localhost:9000/app)
└── Products
    └── [Select Product]
        └── Variants Tab
            └── [Select Variant]
                └── Edit Variant
                    └── Prices Step
```

**Step-by-Step:**

1. **Access Admin Dashboard**
   - Open browser to `http://localhost:9000/app`
   - Login with admin credentials

2. **Navigate to Products**
   - Click "Products" in left sidebar
   - Browse or search for product (e.g., "1 Day Fraser Island Tour")

3. **Select Product**
   - Click on product name to open details
   - View product information

4. **Edit Variant**
   - Click "Variants" tab
   - Select variant to edit (most products have one default variant)
   - Click "Edit" button

5. **Update Prices**
   - Navigate to "Prices" step in the edit flow
   - Use Bulk Editor to set prices for each:
     - Currency (AUD, USD, etc.)
     - Region (if configured)
     - Tax inclusion setting
   - Enter new price amounts
   - Click "Save" to apply changes

**Price Editor Features:**

| Feature | Description |
|---------|-------------|
| **Multi-Currency** | Set different prices for each currency |
| **Regional Pricing** | Configure prices per region |
| **Tax Settings** | Choose tax-inclusive or tax-exclusive |
| **Bulk Editor** | Edit multiple prices at once |
| **Price Validation** | Prevents invalid price entries |

---

#### Method 2: Price Lists

Price lists allow you to set special pricing for specific conditions.

**Use Cases:**
- Seasonal pricing (summer vs winter rates)
- Customer group pricing (wholesale, VIP)
- Promotional pricing
- Time-limited sales

**Navigation Path:**
```
Admin Dashboard
└── Pricing
    └── Price Lists
        └── Add Price List
```

**Creating a Price List:**

1. Navigate to **Pricing → Price Lists**
2. Click **"Add Price List"**
3. Configure:
   - **Name:** e.g., "Summer 2025 Pricing"
   - **Description:** Purpose of price list
   - **Type:** Sale or Override
   - **Start Date:** When pricing begins
   - **End Date:** When pricing expires
   - **Customer Groups:** (Optional) Limit to specific groups
4. Add products and set custom prices
5. Save price list

**Price List Example:**

```typescript
{
  name: "Summer Peak Season 2025",
  description: "Higher pricing for peak summer season",
  type: "override",
  start_date: "2025-12-01",
  end_date: "2026-02-28",
  prices: [
    {
      variant_id: "variant_01HXXX",
      amount: 220000, // $2,200 AUD (10% increase)
      currency_code: "aud"
    }
  ]
}
```

---

## Custom Price Management Widget

While Medusa provides default price editing, we've created an **enhanced widget** for easier price management, especially for tour products.

### Widget Features

**Location:** `/Users/Karim/med-usa-4wd/src/admin/widgets/product-price-manager.tsx`

**Capabilities:**
- 📊 **Visual Price Overview** - See all variant prices at a glance
- 🎯 **Tour-Specific Features** - Displays duration and per-day pricing
- ✏️ **Quick Edit Mode** - Edit prices without navigating multiple screens
- 💰 **Price Breakdown** - Shows total price and per-day calculations
- 🌍 **Multi-Currency Display** - View all currency/region prices together
- 🔄 **Real-time Updates** - Changes reflect immediately

### Widget Injection Zone

```typescript
export const config = defineWidgetConfig({
  zone: "product.details.after",
})
```

**Zone Location:** Appears at the bottom of product details page, after default product information.

---

### Using the Custom Widget

1. **Navigate to Product**
   - Admin → Products → [Select Product]

2. **Scroll to Widget**
   - Scroll down past default product details
   - Find "Price Management" widget section

3. **View Prices**
   - See all variant prices
   - View currency and region information
   - Check per-day pricing for tours

4. **Edit Prices**
   - Click **"Edit Prices"** button
   - Modify price amounts in input fields
   - Click **"Save Changes"** to apply
   - Or click **"Cancel"** to discard

**Widget UI Example:**

```
┌────────────────────────────────────────────────┐
│  Price Management                   [Edit]     │
├────────────────────────────────────────────────┤
│  Tour Product                                  │
│  Duration: 2 days                              │
│  Pricing: $2,000 per day × 2 days              │
├────────────────────────────────────────────────┤
│  Variant: Default                              │
│  Currency: AUD                                 │
│  Price: $4,000                                 │
│  Price Per Day: $2,000 / day                   │
│                                    [Edit this] │
├────────────────────────────────────────────────┤
│  Note: For advanced features, use default      │
│  Medusa admin price editor.                    │
└────────────────────────────────────────────────┘
```

---

## Step-by-Step Guide

### Example: Editing "1 Day Fraser Island Tour" Price

Let's walk through editing a tour price from $2,000 to $2,200.

#### Using Default Admin (Recommended for Production)

1. **Access Admin**
   ```
   http://localhost:9000/app
   ```

2. **Navigate to Product**
   - Products → Search "Fraser Island"
   - Click "1 Day Fraser Island Tour"

3. **Edit Variant**
   - Variants tab → Click on "Default" variant
   - Click "Edit" button

4. **Update Price**
   - Navigate to "Prices" step
   - Find AUD price row
   - Change from `200000` cents to `220000` cents
   - (Or enter `2200.00` if UI shows dollars)
   - Click "Save"

5. **Verify Change**
   - Return to product details
   - Confirm new price displays
   - Check storefront: `/tours/1d-fraser-island`

#### Using Custom Widget (Quick Method)

1. **Access Product**
   - Admin → Products → "1 Day Fraser Island Tour"

2. **Scroll to Widget**
   - Scroll down to "Price Management" section

3. **Edit Price**
   - Click "Edit Prices" button
   - Find variant price field
   - Change from `2000` to `2200`
   - Click "Save Changes"

4. **Verify**
   - Widget refreshes with new price
   - Check storefront to confirm

---

### Example: Editing Add-On Prices

Add-ons work the same way as tours:

**Products:**
- Internet Access - $30
- Glamping Upgrade - $80
- BBQ Equipment - $65

**To Edit:**

1. Navigate to add-on product (e.g., "Internet Access")
2. Use default admin or custom widget
3. Update price (e.g., $30 → $35)
4. Save changes
5. Verify on storefront

---

## API Reference

### Pricing Module Endpoints

Medusa v2 uses the **Pricing Module** for all price operations.

#### Get Product with Prices

```bash
GET /admin/products/{id}?fields=+variants.calculated_price,+variants.prices
```

**Example:**
```bash
curl -s http://localhost:9000/admin/products/prod_01HXXX \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  | jq '.product.variants[0].prices'
```

**Response:**
```json
{
  "product": {
    "id": "prod_01HXXX",
    "title": "1 Day Fraser Island Tour",
    "variants": [
      {
        "id": "variant_01HXXX",
        "prices": [
          {
            "id": "price_01HXXX",
            "amount": 200000,
            "currency_code": "aud",
            "region_id": "reg_01HXXX"
          }
        ],
        "calculated_price": {
          "calculated_amount": 200000,
          "currency_code": "aud"
        }
      }
    ]
  }
}
```

---

#### Update Price

```bash
POST /admin/prices/{price_id}
```

**Request Body:**
```json
{
  "amount": 220000
}
```

**Example:**
```bash
curl -X POST http://localhost:9000/admin/prices/price_01HXXX \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 220000
  }'
```

**Response:**
```json
{
  "price": {
    "id": "price_01HXXX",
    "amount": 220000,
    "currency_code": "aud",
    "updated_at": "2025-11-08T14:30:00Z"
  }
}
```

---

#### Create New Price

```bash
POST /admin/price-sets/{price_set_id}/prices
```

**Request Body:**
```json
{
  "amount": 200000,
  "currency_code": "aud",
  "rules": {
    "region_id": "reg_01HXXX"
  }
}
```

---

#### List Price Sets

```bash
GET /admin/price-sets
```

**Query Parameters:**
- `variant_id` - Filter by variant
- `region_id` - Filter by region
- `currency_code` - Filter by currency

---

### Storefront Price Retrieval

Storefront uses different endpoint (no auth required):

```bash
GET /store/products?region_id={region_id}
```

**Example:**
```bash
curl -s "http://localhost:9000/store/products?region_id=reg_01K9G4HA190556136E7RJQ4411" \
  -H "x-publishable-api-key: pk_34de56e6f305b46e6d22bb1d2d3304bd9eea498066ca7749bd667318dca31ffc" \
  | jq '.products[] | {handle, price: .variants[0].calculated_price.calculated_amount}'
```

**Response:**
```json
[
  {
    "handle": "1d-fraser-island",
    "price": 200000
  },
  {
    "handle": "2d-fraser-rainbow",
    "price": 400000
  }
]
```

---

## Testing Checklist

Use this checklist to verify price editing functionality:

### Pre-Testing Setup

- [ ] Medusa server running (`npm run dev`)
- [ ] Admin accessible at `http://localhost:9000/app`
- [ ] Admin user logged in
- [ ] Test products exist (tours and add-ons)

### Default Admin Testing

- [ ] Navigate to Products list
- [ ] Select "1 Day Fraser Island Tour"
- [ ] View variant prices
- [ ] Edit variant → Prices step
- [ ] Change price from $2,000 to $2,200
- [ ] Save changes
- [ ] Verify new price in admin
- [ ] Check storefront displays $2,200
- [ ] Change back to $2,000
- [ ] Verify restoration

### Custom Widget Testing

- [ ] Navigate to product details
- [ ] Scroll to "Price Management" widget
- [ ] Widget loads without errors
- [ ] Displays current price: $2,000
- [ ] Shows duration: 1 day
- [ ] Shows per-day rate: $2,000
- [ ] Click "Edit Prices"
- [ ] Change price to $2,200
- [ ] Click "Save Changes"
- [ ] Widget refreshes with new price
- [ ] Storefront reflects change
- [ ] Change back to $2,000

### Multi-Day Tour Testing

- [ ] Select "2 Day Fraser + Rainbow Combo"
- [ ] Current price: $4,000
- [ ] Per-day calculation: $2,000/day × 2 days
- [ ] Edit price to $4,400
- [ ] New per-day: $2,200/day
- [ ] Save and verify
- [ ] Restore to $4,000

### Add-On Testing

- [ ] Select "Internet Access" add-on
- [ ] Current price: $30
- [ ] Edit to $35
- [ ] Save and verify
- [ ] Check storefront add-ons page
- [ ] Restore to $30

### API Testing

- [ ] Fetch product prices via API
- [ ] Verify price amounts match admin
- [ ] Test price update via API
- [ ] Confirm changes in admin
- [ ] Verify storefront reflects API changes

### Edge Cases

- [ ] Edit price to $0 (should work for free products)
- [ ] Edit price to very large number (e.g., $99,999)
- [ ] Edit price with decimal (e.g., $2,199.99)
- [ ] Cancel edit without saving (no changes applied)
- [ ] Edit multiple prices, save all at once

### Regional Pricing (If Configured)

- [ ] Add new region
- [ ] Set different price for region
- [ ] Verify region-specific pricing
- [ ] Test storefront in different regions

---

## Troubleshooting

### Common Issues and Solutions

#### Issue: Cannot Access Admin Dashboard

**Symptoms:**
- `http://localhost:9000/app` not loading
- 502 Bad Gateway error

**Solutions:**
1. Verify Medusa is running: `ps aux | grep medusa`
2. Check logs: `npm run dev` output
3. Restart server: `npm run dev`
4. Check port 9000 is not in use: `lsof -i :9000`

---

#### Issue: Prices Not Updating

**Symptoms:**
- Changes saved in admin
- Storefront still shows old price

**Solutions:**
1. **Clear Browser Cache**
   ```bash
   # Hard refresh in browser
   Cmd+Shift+R (Mac) or Ctrl+Shift+R (Windows)
   ```

2. **Verify API Response**
   ```bash
   curl -s "http://localhost:9000/store/products?region_id=reg_01K9G4HA190556136E7RJQ4411" \
     -H "x-publishable-api-key: YOUR_KEY" \
     | jq '.products[] | select(.handle=="1d-fraser-island") | .variants[0].calculated_price'
   ```

3. **Check Region Configuration**
   - Ensure correct region_id is used
   - Verify publishable API key is configured
   - Check region includes currency

4. **Restart Storefront**
   ```bash
   cd storefront
   npm run dev
   ```

---

#### Issue: Widget Not Displaying

**Symptoms:**
- Product details page loads
- No "Price Management" widget visible

**Solutions:**
1. **Verify File Exists**
   ```bash
   ls -la /Users/Karim/med-usa-4wd/src/admin/widgets/product-price-manager.tsx
   ```

2. **Check Widget Zone**
   ```typescript
   // Should be:
   zone: "product.details.after"
   ```

3. **Rebuild Admin**
   ```bash
   npm run build
   npm run dev
   ```

4. **Check Console Errors**
   - Open browser DevTools (F12)
   - Check Console tab for errors
   - Look for TypeScript errors

---

#### Issue: Prices Showing in Cents

**Symptoms:**
- Admin shows `200000` instead of `$2,000`
- Confusing price display

**Solution:**
- This is normal - Medusa stores prices in cents
- Default admin may show cents or dollars depending on field
- Custom widget converts cents to dollars for display
- When editing: Enter dollars (e.g., `2000`), system converts to cents

---

#### Issue: Authentication Errors

**Symptoms:**
- `401 Unauthorized` when fetching prices
- Widget shows "Error loading prices"

**Solutions:**
1. **Re-login to Admin**
   - Logout and login again
   - Verify session is active

2. **Check Cookie Settings**
   ```typescript
   // Fetch requests should include:
   credentials: 'include'
   ```

3. **Verify Admin User Permissions**
   - Admin user must have product management permissions
   - Check user role settings

---

#### Issue: Price Per Day Not Calculating

**Symptoms:**
- Widget doesn't show per-day breakdown
- Tour duration not detected

**Solutions:**
1. **Verify Metadata**
   ```bash
   # Check product has duration_days in metadata
   curl -s http://localhost:9000/admin/products/prod_01HXXX \
     | jq '.product.metadata.duration_days'
   ```

2. **Update Product Metadata**
   - Edit product in admin
   - Add custom field: `duration_days` = `2`
   - Save product

3. **Reseed Data**
   ```bash
   npm run seed
   ```

---

### Performance Issues

#### Issue: Widget Loads Slowly

**Solutions:**
1. Reduce number of variants
2. Implement pagination for many prices
3. Cache price data client-side
4. Use React.memo for optimization

#### Issue: Admin Dashboard Slow

**Solutions:**
1. Clear browser cache
2. Disable unnecessary browser extensions
3. Check database performance
4. Optimize product queries

---

## Best Practices

### Price Management Recommendations

1. **Always Use Cents Internally**
   - Store: `200000` (cents)
   - Display: `$2,000` (dollars)
   - Prevents floating-point errors

2. **Set Prices at Product Creation**
   - Don't create products without prices
   - Use seeding scripts for consistency

3. **Use Price Lists for Promotions**
   - Don't edit base prices frequently
   - Create price list for sales/discounts
   - Easier to manage time-limited pricing

4. **Regional Pricing Strategy**
   - Configure regions early
   - Set prices per region if needed
   - Consider currency conversion

5. **Test Price Changes**
   - Always verify on storefront
   - Check cart calculations
   - Test checkout flow

---

## Admin Widget Best Practices

### When to Use Custom Widget

**✅ Good Use Cases:**
- Quick price overview
- Tour-specific pricing display
- Simple price edits
- Learning/training purposes

**❌ Not Recommended For:**
- Complex price rules
- Bulk price updates (100+ products)
- Tax configuration
- Price list management
- Regional pricing setup

**Recommendation:** Use default admin for production price management, custom widget for convenience.

---

## Future Enhancements

Potential improvements to price editing:

### Planned Features

1. **Bulk Price Editor Widget**
   - Edit multiple products at once
   - Apply percentage changes
   - Import/export prices via CSV

2. **Price History**
   - Track price changes over time
   - View who changed prices
   - Revert to previous prices

3. **Dynamic Pricing**
   - Seasonal pricing automation
   - Demand-based pricing
   - Early bird discounts

4. **Price Comparison**
   - Compare prices across variants
   - Competitor price tracking
   - Profit margin calculator

---

## Documentation References

### Official Medusa Documentation

- **Pricing Module:** https://docs.medusajs.com/resources/commerce-modules/pricing
- **Admin Widgets:** https://docs.medusajs.com/learn/fundamentals/admin/widgets
- **Product Management:** https://docs.medusajs.com/resources/commerce-modules/product
- **Admin Widget Zones:** https://docs.medusajs.com/resources/admin-widget-injection-zones

### Project-Specific Documentation

- **Pricing Update Report:** `/Users/Karim/med-usa-4wd/docs/pricing-update-report.md`
- **Pricing UI Comparison:** `/Users/Karim/med-usa-4wd/docs/pricing-ui-comparison.md`
- **Tour Seeding Script:** `/Users/Karim/med-usa-4wd/src/modules/seeding/tour-seed.ts`

---

## Support and Maintenance

### Getting Help

**For Medusa Issues:**
- Official Docs: https://docs.medusajs.com
- GitHub Discussions: https://github.com/medusajs/medusa/discussions
- Discord Community: https://discord.gg/medusajs

**For Project Issues:**
- Review this documentation
- Check existing issues in project
- Consult pricing reports in `/docs`

---

## Conclusion

### Summary

**Default Admin Price Editing:** ✅ AVAILABLE
- Medusa v2 includes comprehensive price management
- Navigate: Products → Variants → Edit → Prices
- Supports multi-currency, regions, tax settings

**Custom Widget:** ✅ CREATED
- Enhanced price viewing and editing
- Tour-specific features (duration, per-day pricing)
- Location: `/Users/Karim/med-usa-4wd/src/admin/widgets/product-price-manager.tsx`

**Testing:** ✅ VERIFIED
- Default admin price editing works
- Custom widget functional
- Storefront reflects changes
- API endpoints operational

**Recommendation:**
Use **default Medusa admin** for production price management. Use **custom widget** for quick views and simple edits.

---

## Quick Reference

### Edit Price (Default Admin)
```
Admin → Products → [Product] → Variants → Edit → Prices → Update → Save
```

### Edit Price (Custom Widget)
```
Admin → Products → [Product] → Scroll to "Price Management" → Edit Prices → Save
```

### Verify Price (API)
```bash
curl http://localhost:9000/store/products?region_id=reg_XXX \
  -H "x-publishable-api-key: pk_XXX" | jq '.products[].variants[].calculated_price'
```

### Verify Price (Storefront)
```
http://localhost:8000/tours/1d-fraser-island
```

---

**Document Version:** 1.0
**Last Updated:** 2025-11-08
**Author:** Claude Code
**Status:** Complete ✅
