import { defineWidgetConfig } from "@medusajs/admin-sdk"
import {
  Container,
  Heading,
  Button,
  Checkbox,
  Label,
  Text,
  Input,
  Badge,
  Toaster,
  toast
} from "@medusajs/ui"
import { useState, useEffect, useMemo } from "react"
import { DetailWidgetProps, AdminProduct } from "@medusajs/framework/types"

/**
 * Addon Tour Selector Widget for Medusa Admin
 *
 * Allows admins to easily map addon products to tours by selecting from a checkbox list.
 * This widget appears on the addon product edit page and provides:
 * - Checkbox list of all available tours
 * - "Select All" / "Clear All" buttons
 * - Preset buttons: "Multi-Day Only" (2+ days), "Day Trips Only" (1 day)
 * - Search/filter functionality
 * - Save button with toast notifications
 *
 * USAGE:
 * - Navigate to Products → Select an Addon Product
 * - Scroll to "Tour Mapping" section
 * - Select tours this addon should be available for
 * - Click "Save Tour Mapping"
 *
 * STORAGE:
 * - Data is stored in product.metadata.applicable_tours as an array of tour handles
 * - Universal addons use ["*"] to indicate they're available for all tours
 *
 * @see https://docs.medusajs.com/resources/references/admin-widget-injection-zones
 */

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

const AddonTourSelector = ({ data }: DetailWidgetProps<AdminProduct>) => {
  // 1. Add early null check
  if (!data || !data.id) {
    return null
  }

  // 2. Check if widget should render for this product type
  // Check BOTH collection membership AND metadata flag for backward compatibility
  // This ensures the widget works even if metadata.addon is not set
  const isAddonProduct =
    data.collection?.handle === 'add-ons' ||
    data.metadata?.addon === true
  if (!isAddonProduct) {
    return null
  }

  const product = data
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [tours, setTours] = useState<Tour[]>([])
  const [selectedTours, setSelectedTours] = useState<Set<string>>(new Set())
  const [searchQuery, setSearchQuery] = useState("")
  const [isUniversal, setIsUniversal] = useState(false)

  // Load tours and current selections on mount
  useEffect(() => {
    loadData()
  }, [product.id])

  const loadData = async () => {
    try {
      setLoading(true)

      // 3. Wrap API calls in try-catch
      const response = await fetch('/admin/products?is_tour=true&limit=100&fields=+metadata', {
        credentials: 'include',
      })

      if (!response.ok) {
        console.error('Widget API error: Failed to fetch tours')
        throw new Error('Failed to fetch tours')
      }

      const data = await response.json()

      // Filter products that have is_tour metadata with null checks
      const tourProducts = data?.products?.filter((p: any) => p?.metadata?.is_tour === true) || []
      setTours(tourProducts)

      // Load current selections from addon metadata with null checks
      const applicableTours = product?.metadata?.applicable_tours
      if (applicableTours) {
        if (Array.isArray(applicableTours)) {
          if (applicableTours.includes('*')) {
            setIsUniversal(true)
            // If universal, select all tours for display
            setSelectedTours(new Set(tourProducts.map((t: Tour) => t.handle)))
          } else {
            setSelectedTours(new Set(applicableTours))
          }
        }
      }
    } catch (error) {
      console.error('Widget API error:', error)
      toast.error("Failed to load tours", {
        description: "Please refresh the page and try again."
      })
    } finally {
      setLoading(false)
    }
  }

  // Filter tours based on search query
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

  // Handle individual checkbox toggle
  const handleTourToggle = (tourHandle: string) => {
    const newSelected = new Set(selectedTours)
    if (newSelected.has(tourHandle)) {
      newSelected.delete(tourHandle)
    } else {
      newSelected.add(tourHandle)
    }
    setSelectedTours(newSelected)
    setIsUniversal(false) // Clear universal flag if manually selecting
  }

  // Handle Select All
  const handleSelectAll = () => {
    setSelectedTours(new Set(tours.map(t => t.handle)))
    setIsUniversal(false)
  }

  // Handle Clear All
  const handleClearAll = () => {
    setSelectedTours(new Set())
    setIsUniversal(false)
  }

  // Handle Universal toggle
  const handleUniversalToggle = () => {
    if (isUniversal) {
      // Uncheck universal
      setIsUniversal(false)
      setSelectedTours(new Set())
    } else {
      // Check universal - select all tours
      setIsUniversal(true)
      setSelectedTours(new Set(tours.map(t => t.handle)))
    }
  }

  // Handle Multi-Day Only preset
  const handleMultiDayOnly = () => {
    const multiDayTours = tours.filter(t => (t.metadata?.duration_days || 1) > 1)
    setSelectedTours(new Set(multiDayTours.map(t => t.handle)))
    setIsUniversal(false)
  }

  // Handle Day Trips Only preset
  const handleDayTripsOnly = () => {
    const dayTripTours = tours.filter(t => (t.metadata?.duration_days || 1) === 1)
    setSelectedTours(new Set(dayTripTours.map(t => t.handle)))
    setIsUniversal(false)
  }

  // Save tour mapping
  const handleSave = async () => {
    try {
      setSaving(true)

      // Prepare applicable_tours array
      let applicableTours: string[]
      if (isUniversal) {
        applicableTours = ['*']
      } else {
        applicableTours = Array.from(selectedTours)
      }

      // Update product metadata
      // Always ensure addon flag is set for consistency
      const updatedMetadata = {
        ...product.metadata,
        applicable_tours: applicableTours,
        addon: true, // Ensure metadata flag is set for backward compatibility
      }

      const response = await fetch(`/admin/products/${product.id}`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          metadata: updatedMetadata,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to update tour mapping')
      }

      toast.success("Tour mapping saved successfully!", {
        description: isUniversal
          ? "This addon is now available for all tours"
          : `This addon is now available for ${applicableTours.length} tour(s)`
      })
    } catch (error) {
      console.error('Error saving tour mapping:', error)
      toast.error("Failed to save tour mapping", {
        description: "Please try again or contact support."
      })
    } finally {
      setSaving(false)
    }
  }

  // 5. Handle loading state
  if (loading) {
    return (
      <Container>
        <div className="p-6">
          <Text>Loading tour mapping...</Text>
        </div>
      </Container>
    )
  }

  // Get count of multi-day and day trips
  const multiDayCount = tours.filter(t => (t.metadata?.duration_days || 1) > 1).length
  const dayTripCount = tours.filter(t => (t.metadata?.duration_days || 1) === 1).length

  return (
    <>
      <Toaster />
      <Container className="divide-y p-0">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4">
          <div>
            <Heading level="h2">Tour Mapping</Heading>
            <Text size="small" className="text-gray-600 mt-1">
              Select which tours this addon should be available for
            </Text>
          </div>
          <Button
            variant="primary"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? 'Saving...' : 'Save Tour Mapping'}
          </Button>
        </div>

        {/* Current status */}
        <div className="px-6 py-4 bg-blue-50">
          <div className="flex items-center gap-2 mb-2">
            <Badge color={selectedTours.size > 0 ? "green" : "orange"}>
              {isUniversal ? "Universal Addon" : `${selectedTours.size} Tour(s) Selected`}
            </Badge>
            {selectedTours.size > 0 && !isUniversal && (
              <Text size="small" className="text-gray-600">
                {selectedTours.size} of {tours.length} tours
              </Text>
            )}
          </div>
          {isUniversal && (
            <Text size="small" className="text-gray-600">
              This addon is marked as universal and will be available for all tours, including future tours.
            </Text>
          )}
        </div>

        {/* Quick Actions */}
        <div className="px-6 py-4">
          <Label className="text-sm font-medium mb-3">Quick Actions</Label>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="secondary"
              size="small"
              onClick={handleUniversalToggle}
            >
              {isUniversal ? "Remove Universal" : "Make Universal"}
            </Button>
            <Button
              variant="secondary"
              size="small"
              onClick={handleSelectAll}
              disabled={isUniversal}
            >
              Select All ({tours.length})
            </Button>
            <Button
              variant="secondary"
              size="small"
              onClick={handleClearAll}
              disabled={isUniversal}
            >
              Clear All
            </Button>
            <Button
              variant="secondary"
              size="small"
              onClick={handleMultiDayOnly}
              disabled={isUniversal}
            >
              Multi-Day Only ({multiDayCount})
            </Button>
            <Button
              variant="secondary"
              size="small"
              onClick={handleDayTripsOnly}
              disabled={isUniversal}
            >
              Day Trips Only ({dayTripCount})
            </Button>
          </div>
        </div>

        {/* Search */}
        <div className="px-6 py-4">
          <Label className="text-sm font-medium mb-2">Search Tours</Label>
          <Input
            type="text"
            placeholder="Search by tour name or handle..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full"
          />
          {searchQuery && (
            <Text size="small" className="text-gray-600 mt-2">
              Showing {filteredTours.length} of {tours.length} tours
            </Text>
          )}
        </div>

        {/* Tour Checkboxes */}
        <div className="px-6 py-4">
          <Label className="text-sm font-medium mb-3">Available Tours</Label>

          {filteredTours.length === 0 && searchQuery && (
            <Text className="text-gray-500 italic">No tours match your search</Text>
          )}

          {filteredTours.length === 0 && !searchQuery && (
            <Text className="text-gray-500 italic">
              No tour products found. Create tour products first.
            </Text>
          )}

          <div className="space-y-3">
            {filteredTours.map((tour) => {
              const durationDays = tour.metadata?.duration_days || 1
              const isMultiDay = durationDays > 1

              return (
                <div
                  key={tour.id}
                  className="flex items-start gap-3 p-3 border rounded-lg hover:border-gray-400 transition-colors"
                >
                  <Checkbox
                    id={`tour-${tour.id}`}
                    checked={selectedTours.has(tour.handle)}
                    onCheckedChange={() => handleTourToggle(tour.handle)}
                    disabled={isUniversal}
                  />
                  <div className="flex-1">
                    <Label
                      htmlFor={`tour-${tour.id}`}
                      className="text-sm font-medium cursor-pointer"
                    >
                      {tour.title}
                    </Label>
                    <div className="flex items-center gap-2 mt-1">
                      <Text size="small" className="text-gray-600">
                        {tour.handle}
                      </Text>
                      <Badge color={isMultiDay ? "purple" : "blue"} size="small">
                        {durationDays} {durationDays === 1 ? 'day' : 'days'}
                      </Badge>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Help text */}
        <div className="px-6 py-4 bg-gray-50">
          <Text size="small" className="text-gray-600">
            <strong>Note:</strong> Tour mappings are stored in{' '}
            <code className="bg-gray-200 px-1 rounded">product.metadata.applicable_tours</code>.
            Select tours to make this addon available during checkout for those tours.
            Use "Make Universal" to make this addon available for all tours including future ones.
          </Text>
        </div>
      </Container>
    </>
  )
}

// Widget configuration - inject into product details page
export const config = defineWidgetConfig({
  zone: "product.details.after",
})

export default AddonTourSelector
