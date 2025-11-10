# Phase 2: Quick Reference Card

## Widget Files

```
/Users/Karim/med-usa-4wd/src/admin/widgets/
├── addon-tour-selector.tsx    (414 lines) - Maps addons to tours
└── tour-addons-display.tsx    (299 lines) - Shows addons for tours
```

## How Widgets Work

### Addon Tour Selector
- **Appears On:** Addon product pages (products with `metadata.addon = true`)
- **Purpose:** Select which tours an addon applies to
- **Updates:** `product.metadata.applicable_tours` array
- **Zone:** `product.details.after`

### Tour Addons Display
- **Appears On:** Tour product pages (products with `metadata.is_tour = true`)
- **Purpose:** View addons available for this tour
- **Reads:** Filters addons by `metadata.applicable_tours`
- **Zone:** `product.details.after`

## Quick Actions Reference

### Addon Tour Selector Buttons

| Button | Action | Result |
|--------|--------|--------|
| Make Universal | Toggle | Sets `applicable_tours: ["*"]` |
| Select All | Click | Selects all visible tours |
| Clear All | Click | Deselects all tours |
| Multi-Day Only | Click | Selects tours with 2+ days |
| Day Trips Only | Click | Selects 1-day tours only |
| Save Tour Mapping | Click | Updates product metadata |

## Data Flow

```
Admin Action (UI)
    ↓
Widget State Update
    ↓
POST /admin/products/:id
    ↓
Update product.metadata.applicable_tours
    ↓
Toast Notification (Success/Error)
```

## Metadata Structure

### Addon Product
```json
{
  "metadata": {
    "addon": true,
    "category": "Food & Beverage",
    "unit": "per_booking",
    "applicable_tours": ["1d-rainbow-beach", "2d-fraser-rainbow"]
  }
}
```

### Universal Addon
```json
{
  "metadata": {
    "addon": true,
    "applicable_tours": ["*"]
  }
}
```

### Tour Product
```json
{
  "metadata": {
    "is_tour": true,
    "duration_days": 2
  }
}
```

## API Endpoints

```bash
# Fetch all tours
GET /admin/products?is_tour=true&limit=100&fields=+metadata

# Fetch all addons
GET /admin/products?collection_id[]=add-ons&limit=100&fields=+metadata,+variants.prices

# Update addon mapping
POST /admin/products/:addon-id
Content-Type: application/json
{
  "metadata": {
    "applicable_tours": ["tour-handle-1", "tour-handle-2"]
  }
}
```

## Common Use Cases

### Case 1: Universal Food Addon
**Scenario:** Gourmet BBQ available for all tours

**Steps:**
1. Open addon "Gourmet Beach BBQ"
2. Click "Make Universal"
3. Click "Save Tour Mapping"

**Result:** `applicable_tours: ["*"]`

### Case 2: Multi-Day Photography Package
**Scenario:** Aerial photography only for multi-day tours

**Steps:**
1. Open addon "Aerial Photography Package"
2. Click "Multi-Day Only (3)"
3. Click "Save Tour Mapping"

**Result:** `applicable_tours: ["2d-fraser-rainbow", "3d-fraser-rainbow", "4d-fraser-rainbow"]`

### Case 3: Specific Tour Addon
**Scenario:** Special add-on for Fraser Island only

**Steps:**
1. Open addon
2. Search "fraser"
3. Check "1 Day Fraser Island Tour"
4. Click "Save Tour Mapping"

**Result:** `applicable_tours: ["1d-fraser-island"]`

## Troubleshooting

### Widget Not Showing
**Problem:** Widget doesn't appear
**Check:**
- Product has correct metadata (`addon: true` or `is_tour: true`)
- Widgets are in `/src/admin/widgets/`
- Admin rebuilt: `npm run build`

### Tours Not Loading
**Problem:** Empty tour list
**Check:**
- Tours exist in database
- Tours have `metadata.is_tour = true`
- API endpoint working: `GET /admin/products?is_tour=true`

### Save Fails
**Problem:** "Failed to save" error
**Check:**
- Valid authentication
- Network connectivity
- Product ID correct
- Server logs for errors

### Wrong Addons Showing
**Problem:** Incorrect addons on tour page
**Check:**
- Addon `applicable_tours` includes tour handle
- Addon has `metadata.addon = true`
- Addon in "add-ons" collection

## Testing Checklist

### Addon Tour Selector
- [ ] Widget appears on addon products
- [ ] Tour list loads
- [ ] Checkboxes work
- [ ] Select All works
- [ ] Clear All works
- [ ] Multi-Day filter works (2+ days)
- [ ] Day Trips filter works (1 day)
- [ ] Universal toggle works
- [ ] Search filters
- [ ] Save updates data
- [ ] Toast shows

### Tour Addons Display
- [ ] Widget appears on tour products
- [ ] Addon count correct
- [ ] Categories grouped
- [ ] Prices show
- [ ] Universal badge shows
- [ ] Correct addons only

## File Locations

### Source Code
- `/Users/Karim/med-usa-4wd/src/admin/widgets/addon-tour-selector.tsx`
- `/Users/Karim/med-usa-4wd/src/admin/widgets/tour-addons-display.tsx`

### Documentation
- `/Users/Karim/med-usa-4wd/docs/admin-widgets/addon-tour-mapping.md`
- `/Users/Karim/med-usa-4wd/docs/admin-widgets/IMPLEMENTATION_SUMMARY.md`
- `/Users/Karim/med-usa-4wd/docs/admin-widgets/CODE_EXAMPLES.md`
- `/Users/Karim/med-usa-4wd/docs/admin-widgets/QUICK_REFERENCE.md`

## Key Concepts

### Universal Addon (`["*"]`)
- Available for ALL tours (past, present, future)
- Automatically applies to new tours
- Use for: food, basic photography, common items

### Specific Mapping (`["tour-1", "tour-2"]`)
- Available only for listed tours
- Must update when adding new tours
- Use for: specialized equipment, specific experiences

### Widget Zone (`product.details.after`)
- Appears after product details section
- Standard Medusa injection zone
- Same zone for both widgets (they appear on different product types)

## Component Library

All UI from `@medusajs/ui`:
- Container, Heading, Text, Label
- Button, Checkbox, Input
- Badge, Toaster, toast

## Performance Notes

- Fetches tours/addons once on mount
- Client-side filtering (search)
- Minimal API calls (save only)
- Uses React hooks for state
- Memoized filtering for performance

## Future Enhancements

Potential improvements:
1. Bulk operations (multiple addons at once)
2. Import/export via CSV
3. Validation rules
4. Analytics (most popular addons)
5. Preview storefront display

## Support Resources

- [Medusa Admin SDK Docs](https://docs.medusajs.com/admin-development)
- [Widget Injection Zones](https://docs.medusajs.com/resources/references/admin-widget-injection-zones)
- [Medusa UI Components](https://docs.medusajs.com/ui)
- [Product Metadata Guide](https://docs.medusajs.com/resources/commerce-modules/product#metadata)

## Summary

✅ **Addon Tour Selector**: Interactive mapping interface on addon pages
✅ **Tour Addons Display**: Read-only addon list on tour pages
✅ **Full Documentation**: 3 comprehensive guides + quick reference
✅ **Production Ready**: Error handling, loading states, toast notifications
✅ **Mobile Responsive**: Works on all devices
✅ **Type Safe**: Full TypeScript support

**Implementation Status: COMPLETE**
