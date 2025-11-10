# Product Metadata Update Script

## Overview

The `update-product-metadata.ts` script updates existing product metadata in the Medusa database. It ensures all tours and add-ons have the correct metadata structure for filtering and display in the frontend.

## Location

```
/Users/Karim/med-usa-4wd/src/scripts/update-product-metadata.ts
```

## Purpose

This script was created to:
1. Add `is_tour: true` and `tour_type` metadata to all tour products
2. Add `applicable_tours` and `category` metadata to all add-on products
3. Enable proper filtering of add-ons based on selected tour

## Usage

### Run the script

```bash
npx medusa exec ./src/scripts/update-product-metadata.ts
```

### Verify the updates

```bash
npx medusa exec ./src/scripts/verify-metadata.ts
```

## Metadata Structure

### Tours

All tour products receive:

```typescript
metadata: {
  is_tour: true,
  tour_type: "day_tour" | "multi_day",
  // ... existing metadata preserved
}
```

**Tour Types:**
- `day_tour`: 1-day tours (1d-rainbow-beach, 1d-fraser-island)
- `multi_day`: Multi-day tours (2d-fraser-rainbow, 3d-fraser-rainbow, 4d-fraser-rainbow)

### Add-ons

All add-on products receive:

```typescript
metadata: {
  applicable_tours: string[],
  category: string,
  // ... existing metadata preserved
}
```

**Categories:**
- Food & Beverage
- Connectivity
- Photography
- Accommodation
- Activities

## Add-on Applicability Rules

### Universal Add-ons (applicable_tours: ["*"])

Available for **all tours**:

**Food & Beverage:**
- addon-gourmet-bbq
- addon-picnic-hamper
- addon-seafood-platter
- addon-bbq
- addon-picnic

**Connectivity:**
- addon-internet
- addon-starlink

**Photography:**
- addon-drone-photography
- addon-gopro
- addon-photo-album
- addon-camera

**Accommodation:**
- addon-beach-cabana

**Activities:**
- addon-fishing
- addon-bodyboarding
- addon-paddleboarding
- addon-kayaking

### Multi-day Add-ons

Available only for **2d, 3d, 4d tours**:

**Accommodation:**
- addon-glamping (applicable_tours: ["2d-fraser-rainbow", "3d-fraser-rainbow", "4d-fraser-rainbow"])
- addon-eco-lodge (applicable_tours: ["2d-fraser-rainbow", "3d-fraser-rainbow", "4d-fraser-rainbow"])

### Rainbow Beach Add-ons

Available for **tours that include Rainbow Beach**:

**Activities:**
- addon-sandboarding (applicable_tours: ["1d-rainbow-beach", "2d-fraser-rainbow", "3d-fraser-rainbow", "4d-fraser-rainbow"])

## Script Output

### Successful Execution Example

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔄 Starting product metadata update...
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📦 Fetching all products from database...
   Found 24 products

🚗 Updating tour products...
   ✓ Updated tour: 1d-rainbow-beach (type: day_tour)
   ✓ Updated tour: 1d-fraser-island (type: day_tour)
   ✓ Updated tour: 2d-fraser-rainbow (type: multi_day)
   ✓ Updated tour: 3d-fraser-rainbow (type: multi_day)
   ✓ Updated tour: 4d-fraser-rainbow (type: multi_day)

🎁 Updating add-on products...
   ✓ Updated addon: addon-internet (all tours, Connectivity)
   ✓ Updated addon: addon-glamping (3 tours, Accommodation)
   [... more add-ons ...]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ Product metadata update complete!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📊 Summary:
   • 5 tour products updated
   • 19 add-on products updated
   • 0 products skipped
   • 24 total products processed

🔍 Verification - Sample add-on metadata:
   Product: addon-internet
   Metadata: {
     "applicable_tours": ["*"],
     "category": "Connectivity",
     ...
   }
```

## Implementation Details

### Idempotent Design

The script is **safe to run multiple times**:
- Existing metadata is preserved using spread operator (`...product.metadata`)
- Only adds/updates specific fields (`is_tour`, `tour_type`, `applicable_tours`, `category`)
- All other metadata fields remain unchanged

### Error Handling

- Unknown add-on handles default to universal (all tours) with "Activities" category
- Warning messages are logged for unknown handles
- Errors are caught and re-thrown with context

## Frontend Integration

After running this script, the frontend can:

1. **Filter add-ons by selected tour:**
   ```typescript
   const applicableAddons = addons.filter(addon =>
     addon.metadata.applicable_tours[0] === "*" ||
     addon.metadata.applicable_tours.includes(selectedTourHandle)
   )
   ```

2. **Group add-ons by category:**
   ```typescript
   const grouped = groupBy(applicableAddons, 'metadata.category')
   ```

3. **Display tour type:**
   ```typescript
   const tourType = tour.metadata.tour_type === "day_tour"
     ? "Day Tour"
     : "Multi-Day Tour"
   ```

## Database Impact

**Products Updated:** 24
- 5 tour products
- 19 add-on products

**Metadata Fields Added:**
- Tours: `is_tour`, `tour_type`
- Add-ons: `applicable_tours`, `category`

**Existing Data:**
- All existing metadata fields are preserved
- No data is deleted or overwritten

## Verification

Run the verification script to check updates:

```bash
npx medusa exec ./src/scripts/verify-metadata.ts
```

This will display:
- All tour products with their metadata
- All add-ons grouped by category
- Applicable tours for each add-on
- Summary statistics
- Test examples for specific add-ons

## Next Steps

After running this script:

1. **Verify updates in database:**
   ```bash
   npx medusa exec ./src/scripts/verify-metadata.ts
   ```

2. **Test in frontend:**
   - Select a day tour → verify only universal add-ons appear
   - Select a multi-day tour → verify glamping/eco-lodge appear
   - Select Rainbow Beach tour → verify sandboarding appears

3. **Check API response:**
   - Ensure add-ons have `applicable_tours` field
   - Ensure tours have `is_tour` and `tour_type` fields

## Troubleshooting

### Warning: Unknown addon handle

If you see warnings like:
```
⚠️  Unknown addon handle: addon-xyz, defaulting to universal
```

**Solution:** Add the addon to the appropriate mapping in `getAddonMetadata()` function:
```typescript
const universalAddons = {
  "addon-xyz": { applicable_tours: ["*"], category: "Category Name" },
  // ...
}
```

### Script fails to connect to database

**Solution:** Ensure Medusa is configured and database is accessible:
```bash
# Check database connection
npx medusa db:check

# If needed, run migrations
npx medusa db:migrate
```

## Related Files

- `/Users/Karim/med-usa-4wd/src/scripts/update-product-metadata.ts` - Main update script
- `/Users/Karim/med-usa-4wd/src/scripts/verify-metadata.ts` - Verification script
- `/Users/Karim/med-usa-4wd/src/modules/seeding/tour-seed.ts` - Reference for metadata structure
- `/Users/Karim/med-usa-4wd/src/modules/seeding/addon-upsert.ts` - Upsert helper functions

## Author

Created: 2025-11-09
Purpose: Update existing products with metadata for tour/addon filtering
