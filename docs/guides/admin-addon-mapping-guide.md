# Admin Guide: Addon-to-Tour Mapping

**For**: Store administrators and content managers
**Purpose**: How to control which addons appear for specific tours
**Last Updated**: November 8, 2025

---

## Table of Contents

1. [Overview](#overview)
2. [Quick Start](#quick-start)
3. [Mapping Addons to Tours](#mapping-addons-to-tours)
4. [Using Bulk Operations](#using-bulk-operations)
5. [Best Practices](#best-practices)
6. [Common Scenarios](#common-scenarios)
7. [Troubleshooting](#troubleshooting)

---

## Overview

### What is Addon-to-Tour Mapping?

Addon-to-tour mapping controls which addons (additional services/products) customers see when booking specific tours. This ensures customers only see relevant options:

- **Day trip tours**: Show only addons suitable for single-day experiences
- **Multi-day tours**: Show all addons including accommodation options
- **Location-specific tours**: Show addons relevant to that destination

### Why It Matters

✅ **Better customer experience**: Customers see only relevant options
✅ **Higher conversion**: Fewer irrelevant choices = easier decisions
✅ **Reduced support**: Fewer questions about addon availability
✅ **Professional appearance**: Shows you understand customer needs

---

## Quick Start

### 5-Minute Setup

1. **Log in to Medusa Admin**
   - URL: `http://localhost:9000/app` (development)
   - Or your production admin URL

2. **Navigate to Products**
   - Click "Products" in left sidebar
   - Filter for addons (products with handles starting with `addon-`)

3. **Edit an Addon**
   - Click any addon product
   - Scroll to "Metadata" section
   - Find `applicable_tours` field

4. **Set Tour Compatibility**
   ```json
   {
     "applicable_tours": ["*"]
   }
   ```
   - `["*"]` = Available for ALL tours (universal)
   - `["1d-rainbow-beach", "3d-fraser-rainbow"]` = Specific tours only

5. **Save Changes**
   - Click "Save" button
   - Changes take effect immediately

---

## Mapping Addons to Tours

### Understanding Tour Handles

Each tour has a unique handle (identifier):

| Tour Name | Handle | Duration |
|-----------|--------|----------|
| 1 Day Rainbow Beach | `1d-rainbow-beach` | 1 day |
| 1 Day Fraser Island | `1d-fraser-island` | 1 day |
| 2 Day Fraser Rainbow | `2d-fraser-rainbow` | 2 days |
| 3 Day Fraser Rainbow | `3d-fraser-rainbow` | 3 days |
| 4 Day Fraser Rainbow | `4d-fraser-rainbow` | 4 days |

### Mapping Options

#### Option 1: Universal Addon (Recommended for most)

**Use when**: Addon applies to ALL tours

```json
{
  "applicable_tours": ["*"]
}
```

**Examples**:
- Food & beverage (BBQ, picnic hampers, seafood platters)
- Connectivity (WiFi, Starlink)
- Photography services (drone, GoPro, photo albums)
- Most activities (fishing, kayaking, paddleboarding)

#### Option 2: Multi-Day Tours Only

**Use when**: Addon requires overnight stay

```json
{
  "applicable_tours": [
    "2d-fraser-rainbow",
    "3d-fraser-rainbow",
    "4d-fraser-rainbow"
  ]
}
```

**Examples**:
- Glamping setup
- Eco-lodge accommodation
- Multi-day equipment rentals

#### Option 3: Specific Tours

**Use when**: Addon is location or tour specific

```json
{
  "applicable_tours": [
    "1d-rainbow-beach",
    "2d-fraser-rainbow",
    "3d-fraser-rainbow"
  ]
}
```

**Examples**:
- Sandboarding (Rainbow Beach tours only)
- Fraser Island specific experiences
- Tour-exclusive activities

#### Option 4: Single Tour Only

**Use when**: Addon is unique to one tour

```json
{
  "applicable_tours": ["3d-fraser-rainbow"]
}
```

**Examples**:
- Premium packages for specific tour tiers
- Limited availability experiences

---

## Using Bulk Operations

### Bulk Update Multiple Addons

**Method 1: Admin UI Bulk Edit** (Coming Soon)

1. Select multiple addon products
2. Click "Bulk Edit Metadata"
3. Set `applicable_tours` for all selected
4. Click "Apply to All"

**Method 2: Database Seed Script** (Current)

Edit `/src/modules/seeding/tour-seed.ts`:

```typescript
// Update multiple addons at once
const FOOD_ADDONS = [
  'addon-gourmet-bbq',
  'addon-picnic-hamper',
  'addon-seafood-platter'
];

FOOD_ADDONS.forEach(handle => {
  // Set to universal
  metadata.applicable_tours = ['*'];
});
```

### Common Bulk Scenarios

#### Make All Food Addons Universal

```typescript
// In tour-seed.ts
const foodAddons = ADDONS.filter(a => a.metadata.category === 'Food & Beverage');
foodAddons.forEach(addon => {
  addon.metadata.applicable_tours = ['*'];
});
```

#### Set All Accommodation to Multi-Day Only

```typescript
const accommodationAddons = ADDONS.filter(a =>
  a.metadata.category === 'Accommodation'
);
accommodationAddons.forEach(addon => {
  addon.metadata.applicable_tours = [
    '2d-fraser-rainbow',
    '3d-fraser-rainbow',
    '4d-fraser-rainbow'
  ];
});
```

---

## Best Practices

### DO ✅

1. **Start with Universal Addons**
   - Make most addons universal (`["*"]`)
   - Only restrict when there's a clear reason

2. **Use Descriptive Categories**
   - Group related addons together
   - Makes bulk operations easier

3. **Test After Changes**
   - Open storefront in incognito mode
   - Select different tours
   - Verify correct addons appear

4. **Document Your Mappings**
   - Keep a spreadsheet of addon → tour mappings
   - Note the business reason for restrictions

5. **Review Quarterly**
   - Check if restrictions still make sense
   - Customer demand may change

### DON'T ❌

1. **Over-Restrict**
   - Don't limit addons unnecessarily
   - More options = higher revenue potential

2. **Use Empty Arrays**
   ```json
   {
     "applicable_tours": []  // ❌ INVALID - Addon won't show anywhere
   }
   ```

3. **Forget to Test**
   - Always verify changes in the storefront
   - Check all affected tours

4. **Use Invalid Tour Handles**
   ```json
   {
     "applicable_tours": ["invalid-tour"]  // ❌ Won't match any tour
   }
   ```

5. **Change Without Backup**
   - Export product data before bulk changes
   - Use version control on seed scripts

---

## Common Scenarios

### Scenario 1: New Addon - Where Should It Appear?

**Question**: We're adding a new "Sunset Cruise" addon. Which tours?

**Analysis**:
- Available on multi-day tours only? → Multi-day mapping
- Available anywhere? → Universal mapping
- Rainbow Beach only? → Rainbow Beach tours

**Recommendation**:
```json
{
  "title": "Sunset Cruise Add-on",
  "handle": "addon-sunset-cruise",
  "metadata": {
    "applicable_tours": [
      "2d-fraser-rainbow",
      "3d-fraser-rainbow",
      "4d-fraser-rainbow"
    ]
  }
}
```

### Scenario 2: Addon Not Showing Up

**Problem**: "Glamping Setup" isn't appearing for 3-day tour

**Debugging Steps**:

1. Check addon metadata:
   ```bash
   # In Medusa Admin
   Products → Glamping Setup → Metadata
   ```

2. Verify `applicable_tours` includes `3d-fraser-rainbow`:
   ```json
   {
     "applicable_tours": ["2d-fraser-rainbow", "3d-fraser-rainbow", "4d-fraser-rainbow"]
   }
   ```

3. If not, add the tour handle and save

4. Clear browser cache and test

### Scenario 3: Remove Addon from Specific Tour

**Problem**: Don't want "Sandboarding" on 4-day tour (too long)

**Solution**:

Before:
```json
{
  "applicable_tours": [
    "1d-rainbow-beach",
    "2d-fraser-rainbow",
    "3d-fraser-rainbow",
    "4d-fraser-rainbow"
  ]
}
```

After:
```json
{
  "applicable_tours": [
    "1d-rainbow-beach",
    "2d-fraser-rainbow",
    "3d-fraser-rainbow"
  ]
}
```

### Scenario 4: Make Seasonal Addon Available

**Problem**: "Christmas Beach BBQ" should appear December only

**Current Limitation**: No date-based filtering yet

**Workaround**:
1. Start of December: Add to `applicable_tours`
2. End of December: Set to empty or specific off-season tours

**Future**: Date-based filtering coming in v2

---

## Troubleshooting

### Addon Not Appearing

**Symptom**: Addon exists but doesn't show for any tour

**Checklist**:
- [ ] `applicable_tours` is defined in metadata
- [ ] `applicable_tours` is not empty array
- [ ] Tour handle is spelled correctly
- [ ] Addon is marked as available (`available: true`)
- [ ] Addon price is set
- [ ] Browser cache cleared

### Addon Showing for Wrong Tour

**Symptom**: Glamping showing on day trip

**Fix**:
1. Check `applicable_tours` array
2. Ensure day trip handle NOT in array
3. Verify changes saved in admin

### All Addons Showing for All Tours

**Symptom**: Filtering not working

**Possible Causes**:
- All addons set to `["*"]`
- Frontend filtering disabled
- Caching issue

**Debugging**:
```bash
# Check backend data
curl http://localhost:9000/store/products?handle=addon-glamping | jq '.product.metadata.applicable_tours'

# Should return: ["2d-fraser-rainbow", "3d-fraser-rainbow", "4d-fraser-rainbow"]
# NOT: ["*"]
```

### Performance Issues

**Symptom**: Addon page loads slowly

**Optimization**:
- Reduce total number of addons (keep under 30)
- Use CDN for addon images
- Enable Redis caching

**Check**:
```bash
# Monitor filtering performance
# Should be < 50ms
# See browser console: "[Addon Filtering] Filtered 16 addons to 13 in 2.45ms"
```

---

## Screenshots

### Editing Addon Metadata

![Admin Metadata Editor](../images/admin-addon-metadata.png)

### Bulk Operations

![Bulk Edit Interface](../images/admin-bulk-edit.png)

### Verifying in Storefront

![Storefront Filtering](../images/storefront-filtered-addons.png)

---

## Quick Reference Card

### Universal Addon
```json
{ "applicable_tours": ["*"] }
```

### Multi-Day Only
```json
{
  "applicable_tours": [
    "2d-fraser-rainbow",
    "3d-fraser-rainbow",
    "4d-fraser-rainbow"
  ]
}
```

### Rainbow Beach Tours
```json
{
  "applicable_tours": [
    "1d-rainbow-beach",
    "2d-fraser-rainbow",
    "3d-fraser-rainbow"
  ]
}
```

### Day Trips Only
```json
{
  "applicable_tours": [
    "1d-rainbow-beach",
    "1d-fraser-island"
  ]
}
```

---

## Need Help?

**Developer Documentation**: `/docs/api/addon-filtering-api.md`
**Technical Specs**: `/docs/addon-tour-mapping-technical-specs.md`
**Support**: Contact development team

---

**Version**: 1.0
**Last Updated**: November 8, 2025
**Maintained By**: Development Team
