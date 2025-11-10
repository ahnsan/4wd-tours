# Admin Widgets - Code Examples

## Widget Structure

Both widgets follow the standard Medusa Admin widget pattern:

```typescript
import { defineWidgetConfig } from "@medusajs/admin-sdk"
import { DetailWidgetProps, AdminProduct } from "@medusajs/framework/types"

const MyWidget = ({ data }: DetailWidgetProps<AdminProduct>) => {
  const product = data

  // Widget implementation
  return <Container>...</Container>
}

export const config = defineWidgetConfig({
  zone: "product.details.after",
})

export default MyWidget
```

## Example 1: Fetching Tours with Metadata

```typescript
const loadTours = async () => {
  try {
    setLoading(true)

    // Fetch all tour products (is_tour=true in metadata)
    const response = await fetch(
      '/admin/products?is_tour=true&limit=100&fields=+metadata',
      { credentials: 'include' }
    )

    if (!response.ok) {
      throw new Error('Failed to fetch tours')
    }

    const data = await response.json()

    // Filter products that have is_tour metadata
    const tourProducts = data.products.filter(
      (p: any) => p.metadata?.is_tour === true
    )

    setTours(tourProducts)
  } catch (error) {
    console.error('Error loading data:', error)
    toast.error("Failed to load tours")
  } finally {
    setLoading(false)
  }
}
```

## Example 2: Saving Addon Tour Mapping

```typescript
const handleSave = async () => {
  try {
    setSaving(true)

    // Prepare applicable_tours array
    let applicableTours: string[]
    if (isUniversal) {
      applicableTours = ['*']  // Universal addon
    } else {
      applicableTours = Array.from(selectedTours)
    }

    // Update product metadata via Medusa API
    const response = await fetch(`/admin/products/${product.id}`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        metadata: {
          ...product.metadata,
          applicable_tours: applicableTours,
        },
      }),
    })

    if (!response.ok) {
      throw new Error('Failed to update tour mapping')
    }

    // Show success notification
    toast.success("Tour mapping saved successfully!", {
      description: `This addon is now available for ${applicableTours.length} tour(s)`
    })
  } catch (error) {
    console.error('Error saving:', error)
    toast.error("Failed to save tour mapping")
  } finally {
    setSaving(false)
  }
}
```

## Example 3: Filtering Tours by Duration

```typescript
// Multi-day tours (2+ days)
const handleMultiDayOnly = () => {
  const multiDayTours = tours.filter(
    t => (t.metadata?.duration_days || 1) > 1
  )
  setSelectedTours(new Set(multiDayTours.map(t => t.handle)))
  setIsUniversal(false)
}

// Day trips only (1 day)
const handleDayTripsOnly = () => {
  const dayTripTours = tours.filter(
    t => (t.metadata?.duration_days || 1) === 1
  )
  setSelectedTours(new Set(dayTripTours.map(t => t.handle)))
  setIsUniversal(false)
}
```

## Example 4: Real-time Search Filtering

```typescript
// Memoized filtered tours for performance
const filteredTours = useMemo(() => {
  if (!searchQuery.trim()) {
    return tours
  }

  const query = searchQuery.toLowerCase()
  return tours.filter(tour =>
    tour.title.toLowerCase().includes(query) ||
    tour.handle.toLowerCase().includes(query)
  )
}, [tours, searchQuery])

// In JSX
<Input
  type="text"
  placeholder="Search by tour name or handle..."
  value={searchQuery}
  onChange={(e) => setSearchQuery(e.target.value)}
/>
```

## Example 5: Grouping Addons by Category

```typescript
const loadAddons = async () => {
  try {
    // Fetch all addon products
    const response = await fetch(
      '/admin/products?collection_id[]=add-ons&limit=100&fields=+metadata,+variants.prices',
      { credentials: 'include' }
    )

    const data = await response.json()

    // Filter addons applicable to this tour
    const applicableAddons = data.products.filter((addon: Addon) => {
      const applicableTours = addon.metadata?.applicable_tours
      if (!applicableTours || !Array.isArray(applicableTours)) {
        return false
      }

      // Check if universal
      if (applicableTours.includes('*')) {
        return true
      }

      // Check if this tour's handle is in the list
      return applicableTours.includes(product.handle)
    })

    // Group addons by category
    const grouped: GroupedAddons = {}
    applicableAddons.forEach((addon: Addon) => {
      const category = addon.metadata?.category || 'Other'
      if (!grouped[category]) {
        grouped[category] = []
      }
      grouped[category].push(addon)
    })

    setGroupedAddons(grouped)
  } catch (error) {
    console.error('Error loading addons:', error)
  }
}
```

## Example 6: Rendering Grouped Addons

```typescript
{Object.entries(groupedAddons).map(([category, categoryAddons]) => (
  <div key={category} className="px-6 py-4">
    <div className="flex items-center gap-2 mb-4">
      <Label className="text-base font-semibold">{category}</Label>
      <Badge color="purple" size="small">
        {categoryAddons.length}
      </Badge>
    </div>

    <div className="space-y-3">
      {categoryAddons.map((addon) => {
        const price = getAddonPrice(addon)
        const unit = getUnitLabel(addon.metadata?.unit)
        const isUniversal = isUniversalAddon(addon)

        return (
          <div
            key={addon.id}
            className="border rounded-lg p-4 bg-white"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <Text className="font-medium">{addon.title}</Text>
                  {isUniversal && (
                    <Badge color="blue" size="small">Universal</Badge>
                  )}
                </div>
              </div>
              <div className="text-right">
                {price && (
                  <>
                    <Text className="font-semibold text-green-700">
                      {formatPrice(price.amount, price.currency)}
                    </Text>
                    {unit && (
                      <Text size="small" className="text-gray-600">
                        {unit}
                      </Text>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  </div>
))}
```

## Example 7: Currency Formatting Helper

```typescript
const formatPrice = (amount: number, currencyCode: string = 'aud') => {
  return new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency: currencyCode.toUpperCase(),
  }).format(amount / 100)  // Convert cents to dollars
}

// Usage:
formatPrice(20000, 'aud')  // Returns: "$200.00"
```

## Example 8: Conditional Widget Rendering

```typescript
// Addon Tour Selector - Only show on addon products
const AddonTourSelector = ({ data }: DetailWidgetProps<AdminProduct>) => {
  const product = data

  // Early return if not an addon
  const isAddon = product.metadata?.addon === true
  if (!isAddon) {
    return null
  }

  return (
    <Container>
      {/* Widget content */}
    </Container>
  )
}

// Tour Addons Display - Only show on tour products
const TourAddonsDisplay = ({ data }: DetailWidgetProps<AdminProduct>) => {
  const product = data

  // Early return if not a tour
  const isTourProduct = product.metadata?.is_tour === true
  if (!isTourProduct) {
    return null
  }

  return (
    <Container>
      {/* Widget content */}
    </Container>
  )
}
```

## Example 9: Toast Notifications

```typescript
import { Toaster, toast } from "@medusajs/ui"

// Success notification
toast.success("Tour mapping saved successfully!", {
  description: `This addon is now available for ${count} tour(s)`
})

// Error notification
toast.error("Failed to save tour mapping", {
  description: "Please try again or contact support."
})

// In JSX - Add Toaster component
return (
  <>
    <Toaster />
    <Container>
      {/* Widget content */}
    </Container>
  </>
)
```

## Example 10: Loading States

```typescript
const [loading, setLoading] = useState(true)

// In render
if (loading) {
  return (
    <Container>
      <div className="p-6">
        <Text>Loading tour mapping...</Text>
      </div>
    </Container>
  )
}

// Main content renders after loading
return (
  <Container>
    {/* Widget content */}
  </Container>
)
```

## Example 11: Checkbox Selection Management

```typescript
const [selectedTours, setSelectedTours] = useState<Set<string>>(new Set())

// Toggle individual tour
const handleTourToggle = (tourHandle: string) => {
  const newSelected = new Set(selectedTours)
  if (newSelected.has(tourHandle)) {
    newSelected.delete(tourHandle)
  } else {
    newSelected.add(tourHandle)
  }
  setSelectedTours(newSelected)
}

// In JSX
<Checkbox
  id={`tour-${tour.id}`}
  checked={selectedTours.has(tour.handle)}
  onCheckedChange={() => handleTourToggle(tour.handle)}
/>
```

## Example 12: Status Badges

```typescript
// Dynamic badge color based on state
<Badge color={selectedTours.size > 0 ? "green" : "orange"}>
  {isUniversal ? "Universal Addon" : `${selectedTours.size} Tour(s) Selected`}
</Badge>

// Duration-based badge color
<Badge color={isMultiDay ? "purple" : "blue"} size="small">
  {durationDays} {durationDays === 1 ? 'day' : 'days'}
</Badge>
```

## Example 13: Help Text with Code Styling

```typescript
<div className="px-6 py-4 bg-gray-50">
  <Text size="small" className="text-gray-600">
    <strong>Note:</strong> Tour mappings are stored in{' '}
    <code className="bg-gray-200 px-1 rounded">
      product.metadata.applicable_tours
    </code>.
    Select tours to make this addon available during checkout.
  </Text>
</div>
```

## Example 14: TypeScript Type Definitions

```typescript
interface Tour {
  id: string
  handle: string
  title: string
  metadata?: {
    duration_days?: number
    is_tour?: boolean
    [key: string]: any
  }
}

interface Addon {
  id: string
  handle: string
  title: string
  variants?: Array<{
    prices?: Array<{
      amount: number
      currency_code: string
    }>
  }>
  metadata?: {
    addon?: boolean
    category?: string
    unit?: string
    applicable_tours?: string[]
    [key: string]: any
  }
}

interface GroupedAddons {
  [category: string]: Addon[]
}
```

## Example 15: Complete Widget Export Pattern

```typescript
import { defineWidgetConfig } from "@medusajs/admin-sdk"

// Widget component
const MyWidget = ({ data }: DetailWidgetProps<AdminProduct>) => {
  // Implementation
  return <Container>...</Container>
}

// Widget configuration
export const config = defineWidgetConfig({
  zone: "product.details.after",
})

// Default export
export default MyWidget
```

## Testing Examples

### Test Addon Tour Selector in Browser Console

```javascript
// Check if tours are loaded
console.log('Tours:', tours)

// Check selected tours
console.log('Selected:', Array.from(selectedTours))

// Check if universal
console.log('Is Universal:', isUniversal)

// Test API endpoint
fetch('/admin/products?is_tour=true&limit=100&fields=+metadata', {
  credentials: 'include'
})
  .then(r => r.json())
  .then(d => console.log('Tours:', d.products))
```

### Test Tour Addons Display in Browser Console

```javascript
// Check loaded addons
console.log('Addons:', addons)

// Check grouping
console.log('Grouped:', groupedAddons)

// Test API endpoint
fetch('/admin/products?collection_id[]=add-ons&limit=100&fields=+metadata,+variants.prices', {
  credentials: 'include'
})
  .then(r => r.json())
  .then(d => console.log('Addons:', d.products))
```

## Common Patterns

### Pattern 1: Fetching with Error Handling

```typescript
try {
  setLoading(true)
  const response = await fetch(url, { credentials: 'include' })
  if (!response.ok) throw new Error('Failed')
  const data = await response.json()
  setData(data.products)
} catch (error) {
  console.error(error)
  toast.error("Failed to load data")
} finally {
  setLoading(false)
}
```

### Pattern 2: Updating with Optimistic UI

```typescript
try {
  setSaving(true)
  const response = await fetch(url, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ metadata: updatedMetadata })
  })
  if (!response.ok) throw new Error('Failed')
  toast.success("Saved successfully!")
} catch (error) {
  console.error(error)
  toast.error("Failed to save")
} finally {
  setSaving(false)
}
```

### Pattern 3: Memoized Filtering

```typescript
const filteredItems = useMemo(() => {
  return items.filter(item =>
    item.title.toLowerCase().includes(query.toLowerCase())
  )
}, [items, query])
```

## Integration with Existing Code

The widgets integrate with the existing seeding data:

```typescript
// From tour-seed.ts
export const ADDONS = [
  {
    title: "Gourmet Beach BBQ",
    handle: "addon-gourmet-bbq",
    price: 18000,
    metadata: {
      addon: true,
      unit: "per_booking",
      category: "Food & Beverage",
      applicable_tours: ["*"], // Universal - all tours
    }
  },
  {
    title: "Aerial Photography Package",
    handle: "addon-drone-photography",
    price: 20000,
    metadata: {
      addon: true,
      unit: "per_booking",
      category: "Photography",
      applicable_tours: [
        "1d-rainbow-beach",
        "2d-fraser-rainbow",
        "3d-fraser-rainbow"
      ],
    }
  }
]
```

The widgets read and update this `applicable_tours` field seamlessly.
