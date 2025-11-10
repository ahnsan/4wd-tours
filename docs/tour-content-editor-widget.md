# Tour Content Editor Widget

## Overview

The Tour Content Editor is a custom Medusa admin widget that provides a comprehensive interface for editing tour-specific content directly from the product details page.

## Location

**File:** `/Users/Karim/med-usa-4wd/src/admin/widgets/tour-content-editor.tsx`

## Features

### 1. About This Tour Editor
- Rich text area for comprehensive tour description
- Supports multi-paragraph content
- Validation to ensure content is provided

### 2. Tour Itinerary Editor
Structured day-by-day tour schedule including:
- **Day number** (automatically numbered)
- **Title** for each day (e.g., "Arrive in Cairns")
- **Description** of the day's activities
- **Activities list** (multiple activities per day)
- **Meals included** (e.g., "Breakfast, Lunch, Dinner")
- **Accommodation** details (e.g., "4-star hotel in Cairns")

### 3. What to Expect Editor
- Bullet-point list editor
- Key points about what guests should expect
- Add/remove expectations dynamically

## Data Storage

All tour content is stored in the product's metadata field:

```typescript
{
  metadata: {
    tour_itinerary: JSON.stringify([
      {
        day: 1,
        title: "Arrive in Cairns",
        description: "Welcome to Cairns...",
        activities: ["Airport transfer", "Hotel check-in"],
        meals: "Dinner",
        accommodation: "4-star hotel in Cairns"
      },
      // ... more days
    ]),
    about_tour: "This exciting 5-day tour...",
    what_to_expect: JSON.stringify([
      "Early morning starts",
      "Moderate fitness level required",
      "Professional tour guides"
    ])
  }
}
```

## Usage

### In Medusa Admin

1. Navigate to **Products** in the Medusa admin dashboard
2. Select a tour product (products with `metadata.duration_days` set)
3. Scroll down to the **Tour Content Editor** section (appears after product details)
4. Click **Edit Tour Content** to enter edit mode
5. Make changes to:
   - About This Tour section
   - Tour Itinerary (add/remove days, edit activities)
   - What to Expect points
6. Click **Save Tour Content** to persist changes
7. Click **Cancel** to discard changes and reload from database

### API Access

Access the tour content via the Medusa API:

```typescript
// GET /admin/products/:id
{
  product: {
    id: "prod_...",
    title: "5-Day Cairns Adventure",
    metadata: {
      tour_itinerary: "[{\"day\":1,\"title\":\"...\"}]",
      about_tour: "This exciting tour...",
      what_to_expect: "[\"Early starts\",\"...\"]"
    }
  }
}
```

To use in frontend:

```typescript
// Parse the JSON strings
const itinerary = JSON.parse(product.metadata.tour_itinerary)
const expectations = JSON.parse(product.metadata.what_to_expect)
const aboutTour = product.metadata.about_tour

// Display in UI
itinerary.forEach(day => {
  console.log(`Day ${day.day}: ${day.title}`)
  console.log(day.description)
  day.activities.forEach(activity => console.log(`- ${activity}`))
})
```

## Widget Configuration

The widget is configured to inject into the `product.details.after` zone:

```typescript
export const config = defineWidgetConfig({
  zone: "product.details.after",
})
```

### Injection Zones

For reference, available Medusa admin widget injection zones:
- `product.details.before`
- `product.details.after` ← *Currently using this*
- `product.list.before`
- `product.list.after`

See: https://docs.medusajs.com/resources/references/admin-widget-injection-zones

## TypeScript Types

```typescript
interface ItineraryItem {
  day: number
  title: string
  description: string
  activities: string[]
  meals?: string
  accommodation?: string
}

interface TourContent {
  tour_itinerary: ItineraryItem[]
  about_tour: string
  what_to_expect: string[]
}
```

## Validation

The widget includes comprehensive validation:

- **About Tour**: Required, cannot be empty
- **Itinerary**: At least one day required
- **Itinerary Title**: Required for each day
- **Itinerary Description**: Required for each day
- **What to Expect**: At least one point required
- **Expectation Points**: Cannot be empty

## UI Components

Uses Medusa UI components (@medusajs/ui):
- `Container` - Main container
- `Heading` - Section headings
- `Button` - Action buttons
- `Input` - Text inputs
- `Textarea` - Multi-line text
- `Label` - Form labels
- `Badge` - Status indicators
- `IconButton` - Icon-based buttons
- `Toast` - Success/error notifications
- `Text` - Typography

## State Management

Uses React hooks for state management:
- `useState` - Component state
- `useEffect` - Data loading on mount
- Local state for edit mode, loading, saving states
- Validation error tracking

## Error Handling

- Loading states during data fetch
- Saving states during updates
- Toast notifications for success/error
- Inline validation errors
- Network error handling

## Visibility

The widget only appears for tour products. A product is considered a tour if it has `metadata.duration_days` set.

```typescript
const isTourProduct = product.metadata?.duration_days !== undefined

if (!isTourProduct) {
  return null
}
```

## Best Practices

1. **Always validate** before saving to ensure data integrity
2. **Use structured data** (JSON arrays) for itinerary and expectations
3. **Provide clear descriptions** in the About Tour section
4. **Be specific** with activities and meal information
5. **Update all fields** to maintain consistency

## Troubleshooting

### Widget not appearing
- Ensure product has `metadata.duration_days` set
- Check browser console for errors
- Verify Medusa build completed successfully

### Save not working
- Check network tab for API errors
- Verify product ID is valid
- Check that metadata update permissions are granted

### Data not loading
- Ensure metadata contains valid JSON strings
- Check that product was fetched with metadata fields
- Verify API response includes metadata

## Development

To modify the widget:

1. Edit `/Users/Karim/med-usa-4wd/src/admin/widgets/tour-content-editor.tsx`
2. Run `npm run build` to compile
3. Restart Medusa server: `npm run dev`
4. Refresh admin dashboard to see changes

## Related Files

- Product Price Manager: `/Users/Karim/med-usa-4wd/src/admin/widgets/product-price-manager.tsx`
- Blog Post Products: `/Users/Karim/med-usa-4wd/src/admin/widgets/blog-post-products.tsx`

## Future Enhancements

Potential improvements:
- Rich text editor integration (e.g., TinyMCE, Quill)
- Image upload for itinerary days
- Drag-and-drop reordering of days
- Preview mode before saving
- Export to PDF functionality
- Multi-language support
- Template presets for common tour types
