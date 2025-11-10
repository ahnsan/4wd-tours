# Phase 2: Addon-Tour Mapping - Medusa Admin Widgets

## Overview

Phase 2 implements Medusa Admin UI widgets that allow administrators to easily map addons to tours through an intuitive interface. This eliminates the need to manually edit JSON metadata and provides a user-friendly way to manage addon availability.

## Implementation Complete

### Files Created

1. **`/Users/Karim/med-usa-4wd/src/admin/widgets/addon-tour-selector.tsx`**
   - Primary widget for addon products
   - Allows admins to select which tours an addon applies to
   - Full-featured checkbox interface with presets and search

2. **`/Users/Karim/med-usa-4wd/src/admin/widgets/tour-addons-display.tsx`**
   - Secondary widget for tour products
   - Read-only display of addons available for a tour
   - Grouped by category with pricing information

## Widget 1: Addon Tour Selector

### Location
Appears on: **Product Edit Page (Addon Products Only)**
Widget Zone: `product.details.after`

### Features

#### 1. Tour Selection Interface
- **Checkbox list** of all available tours
- Each tour shows:
  - Tour title
  - Tour handle (slug)
  - Duration badge (1 day, 2 days, etc.)
  - Multi-day tours use purple badge
  - Day trips use blue badge

#### 2. Quick Action Buttons
- **Make Universal**: Toggle addon as available for all tours (uses `["*"]`)
- **Select All**: Select all tours at once
- **Clear All**: Deselect all tours
- **Multi-Day Only**: Select only tours with 2+ days duration
- **Day Trips Only**: Select only 1-day tours

#### 3. Search/Filter
- Real-time search across tour titles and handles
- Shows filtered count (e.g., "Showing 2 of 5 tours")

#### 4. Status Indicators
- Badge showing selection count or "Universal Addon"
- Visual feedback with color-coded badges:
  - Green: Tours selected
  - Orange: No tours selected
  - Blue: Universal addon

#### 5. Save Functionality
- "Save Tour Mapping" button
- Toast notifications on success/error
- Updates `product.metadata.applicable_tours` array

### Usage Example

1. Navigate to **Products → Add-ons Collection**
2. Select an addon product (e.g., "Gourmet Beach BBQ")
3. Scroll to **"Tour Mapping"** section
4. Select tours using checkboxes or quick action buttons:
   - For universal addons: Click "Make Universal"
   - For day trips only: Click "Day Trips Only (2)"
   - For specific tours: Check individual boxes
5. Click **"Save Tour Mapping"**
6. Success toast confirms the save

### Data Structure

The widget saves data to `product.metadata.applicable_tours`:

```typescript
// Universal addon (available for all tours)
{
  metadata: {
    addon: true,
    applicable_tours: ["*"]
  }
}

// Specific tours
{
  metadata: {
    addon: true,
    applicable_tours: [
      "1d-rainbow-beach",
      "1d-fraser-island",
      "2d-fraser-rainbow"
    ]
  }
}
```

## Widget 2: Tour Addons Display

### Location
Appears on: **Product Edit Page (Tour Products Only)**
Widget Zone: `product.details.after`

### Features

#### 1. Addon Summary
- Count of available addons
- Number of categories represented
- Color-coded badge:
  - Green: Addons available
  - Orange: No addons

#### 2. Grouped Display
- Addons organized by category:
  - Food & Beverage
  - Connectivity
  - Photography
  - Accommodation
  - Activities
- Each category shows addon count badge

#### 3. Addon Cards
Each addon displays:
- **Title**: Addon product name
- **Handle**: Product slug
- **Universal Badge**: If addon applies to all tours
- **Price**: Formatted currency with unit label
  - "per person"
  - "per day"
  - "per booking"
- **Description**: Short description from metadata

#### 4. Read-Only Interface
- No editing capability (edit via addon products)
- Clear instructions on how to modify mappings
- Help text explaining the relationship

### Usage Example

1. Navigate to **Products → Tours Collection**
2. Select a tour product (e.g., "1 Day Rainbow Beach Tour")
3. Scroll to **"Available Addons"** section
4. View all addons grouped by category:
   - **Food & Beverage (3)**
     - Gourmet Beach BBQ: $180.00 per booking
     - Picnic Hamper: $85.00 per booking
     - Seafood Platter: $150.00 per booking
   - **Photography (2)**
     - Aerial Photography Package: $200.00 per booking
     - GoPro Package: $75.00 per booking
   - etc.

### API Integration

Both widgets use the Medusa Admin API:

#### Fetching Tours
```typescript
GET /admin/products?is_tour=true&limit=100&fields=+metadata
```

#### Fetching Addons
```typescript
GET /admin/products?collection_id[]=add-ons&limit=100&fields=+metadata,+variants.prices
```

#### Updating Addon Mapping
```typescript
POST /admin/products/:id
{
  "metadata": {
    "applicable_tours": ["tour-handle-1", "tour-handle-2"]
  }
}
```

## UI Components Used

Both widgets use official Medusa UI components from `@medusajs/ui`:

- `Container` - Main widget container
- `Heading` - Section headings
- `Text` - Body text and descriptions
- `Label` - Form labels
- `Button` - Action buttons
- `Checkbox` - Tour selection
- `Input` - Search field
- `Badge` - Status indicators and counts
- `Toaster` & `toast` - Success/error notifications

## Technical Details

### Widget Configuration

Both widgets use `defineWidgetConfig` from `@medusajs/admin-sdk`:

```typescript
export const config = defineWidgetConfig({
  zone: "product.details.after",
})
```

### Conditional Rendering

Widgets only appear on relevant product types:

**Addon Tour Selector:**
```typescript
const isAddon = product.metadata?.addon === true
if (!isAddon) return null
```

**Tour Addons Display:**
```typescript
const isTourProduct = product.metadata?.is_tour === true
if (!isTourProduct) return null
```

### State Management

Both widgets use React hooks for state:

```typescript
const [loading, setLoading] = useState(true)
const [saving, setSaving] = useState(false)
const [tours, setTours] = useState<Tour[]>([])
const [selectedTours, setSelectedTours] = useState<Set<string>>(new Set())
```

### Error Handling

- Try-catch blocks around API calls
- Toast notifications for errors
- Loading states during data fetching
- Graceful fallbacks for missing data

## How to Test

### Prerequisites
1. Medusa backend running: `npm run dev`
2. Seeded data: Tours and addons must exist in database
3. Admin user logged in

### Testing Addon Tour Selector

1. **Navigate to Addon Product:**
   - Go to Products
   - Filter by "Add-ons" collection
   - Click on any addon (e.g., "Gourmet Beach BBQ")

2. **Test Features:**
   - Verify checkbox list appears with all tours
   - Click "Select All" - all checkboxes should check
   - Click "Clear All" - all checkboxes should uncheck
   - Click "Multi-Day Only" - only tours with 2+ days selected
   - Click "Day Trips Only" - only 1-day tours selected
   - Click "Make Universal" - all tours selected and disabled
   - Use search - filter tours by name
   - Save and verify toast notification

3. **Verify Data:**
   ```bash
   # Check metadata was updated
   curl http://localhost:9000/admin/products/:addon-id \
     -H "Authorization: Bearer YOUR_TOKEN"
   ```

### Testing Tour Addons Display

1. **Navigate to Tour Product:**
   - Go to Products
   - Filter by "Tours" collection
   - Click on any tour (e.g., "1 Day Rainbow Beach Tour")

2. **Test Features:**
   - Verify "Available Addons" section appears
   - Check addon count badge
   - Verify addons are grouped by category
   - Check pricing displays correctly
   - Verify universal addons show "Universal" badge
   - Check help text at bottom

3. **Verify Accuracy:**
   - Only addons with this tour in `applicable_tours` should appear
   - Universal addons (`["*"]`) should appear for all tours
   - Categories should match addon metadata

## Troubleshooting

### Widget Not Appearing

**Problem:** Widget doesn't show up on product page

**Solution:**
1. Verify widget file is in `/src/admin/widgets/`
2. Check product metadata:
   - Addon products need `metadata.addon = true`
   - Tour products need `metadata.is_tour = true`
3. Rebuild admin: `npm run build`
4. Clear browser cache and refresh

### Tours Not Loading

**Problem:** "No tours match your search" or empty list

**Solution:**
1. Verify tours exist in database
2. Check tours have `metadata.is_tour = true`
3. Check API endpoint: `GET /admin/products?is_tour=true`
4. Check browser console for API errors

### Save Not Working

**Problem:** "Failed to save tour mapping" error

**Solution:**
1. Check authentication token is valid
2. Verify API endpoint: `POST /admin/products/:id`
3. Check request payload format
4. Review server logs for errors

### Addons Not Showing on Tour

**Problem:** Tour shows "No addons available"

**Solution:**
1. Check addon's `applicable_tours` includes tour handle
2. Verify addon has `metadata.addon = true`
3. Check collection_id is "add-ons"
4. Use Addon Tour Selector to map addon to tour

## Future Enhancements

Potential improvements for future phases:

1. **Bulk Operations:**
   - Select multiple addons and assign to tours in batch
   - Import/export tour mappings via CSV

2. **Validation:**
   - Warn if addon has incompatible pricing for tour duration
   - Check for circular dependencies

3. **Advanced Filtering:**
   - Filter by addon category
   - Filter by price range
   - Filter by unit type

4. **Analytics:**
   - Show which addons are most popular per tour
   - Revenue impact of addon mappings

5. **Preview:**
   - Preview storefront addon display before saving
   - Test addon checkout flow

## Related Documentation

- [Medusa Admin SDK](https://docs.medusajs.com/admin-development)
- [Widget Injection Zones](https://docs.medusajs.com/resources/references/admin-widget-injection-zones)
- [Medusa UI Components](https://docs.medusajs.com/ui)
- [Product Metadata](https://docs.medusajs.com/resources/commerce-modules/product#metadata)

## Support

For issues or questions:
1. Check Medusa documentation
2. Review browser console for errors
3. Check server logs: `npm run dev`
4. Verify database state

## Conclusion

Phase 2 successfully implements admin UI widgets for addon-tour mapping, providing:
- Intuitive checkbox interface for addon mapping
- Read-only display of tour addons
- Search and preset functionality
- Toast notifications and error handling
- Mobile-responsive design using Medusa UI components

Admins can now easily manage addon availability without manually editing JSON metadata.
