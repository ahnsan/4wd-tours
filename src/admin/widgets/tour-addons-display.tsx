import { defineWidgetConfig } from "@medusajs/admin-sdk"
import {
  Container,
  Heading,
  Text,
  Badge,
  Label
} from "@medusajs/ui"
import { useState, useEffect } from "react"
import { DetailWidgetProps, AdminProduct } from "@medusajs/framework/types"

/**
 * Tour Addons Display Widget for Medusa Admin
 *
 * Displays a read-only list of addons that are available for the current tour.
 * This widget appears on the tour product edit page and provides:
 * - Count of available addons
 * - Addons grouped by category
 * - Addon pricing and details
 * - Clear indication of universal addons
 *
 * USAGE:
 * - Navigate to Products → Select a Tour Product
 * - Scroll to "Available Addons" section
 * - View all addons that apply to this tour
 *
 * DATA SOURCE:
 * - Fetches all addon products from the add-ons collection
 * - Filters based on product.metadata.applicable_tours
 * - Groups by product.metadata.category
 *
 * @see https://docs.medusajs.com/resources/references/admin-widget-injection-zones
 */

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
    description?: string
    [key: string]: any
  }
}

interface GroupedAddons {
  [category: string]: Addon[]
}

const TourAddonsDisplay = ({ data }: DetailWidgetProps<AdminProduct>) => {
  // 1. Add early null check
  if (!data || !data.id) {
    return null
  }

  // 2. Check if widget should render for this product type
  const isTourProduct = data.metadata?.is_tour === true
  if (!isTourProduct) {
    return null
  }

  const product = data
  const [loading, setLoading] = useState(true)
  const [addons, setAddons] = useState<Addon[]>([])
  const [groupedAddons, setGroupedAddons] = useState<GroupedAddons>({})
  const [error, setError] = useState<string | null>(null)

  // Load applicable addons on mount
  useEffect(() => {
    loadAddons()
  }, [product.id])

  const loadAddons = async () => {
    try {
      setLoading(true)
      setError(null)

      // Step 1: Get collection by handle
      const collectionResponse = await fetch('/admin/collections?handle=add-ons', {
        credentials: 'include',
      })

      if (!collectionResponse.ok) {
        console.error('Widget API error: Failed to fetch add-ons collection')
        throw new Error('Failed to fetch add-ons collection')
      }

      const collectionData = await collectionResponse.json()
      const collectionId = collectionData.collections?.[0]?.id

      if (!collectionId) {
        console.warn('Widget API warning: add-ons collection not found')
        setAddons([])
        setGroupedAddons({})
        setLoading(false)
        return
      }

      // Step 2: Fetch products by actual collection ID
      const response = await fetch(
        `/admin/products?collection_id[]=${collectionId}&limit=100&fields=+metadata,+variants.prices`,
        { credentials: 'include' }
      )

      if (!response.ok) {
        console.error('Widget API error: Failed to fetch addons')
        throw new Error('Failed to fetch addons')
      }

      const data = await response.json()

      // Filter addons that are applicable to this tour with null checks
      const applicableAddons = data?.products?.filter((addon: Addon) => {
        const applicableTours = addon?.metadata?.applicable_tours
        if (!applicableTours || !Array.isArray(applicableTours)) {
          return false
        }

        // Check if universal (*)
        if (applicableTours.includes('*')) {
          return true
        }

        // Check if this tour's handle is in the list
        return applicableTours.includes(product.handle)
      }) || []

      setAddons(applicableAddons)

      // Group addons by category
      const grouped: GroupedAddons = {}
      applicableAddons.forEach((addon: Addon) => {
        const category = addon?.metadata?.category || 'Other'
        if (!grouped[category]) {
          grouped[category] = []
        }
        grouped[category].push(addon)
      })

      setGroupedAddons(grouped)
    } catch (error) {
      console.error('Widget API error:', error)
      setError('Failed to load addon data')
    } finally {
      setLoading(false)
    }
  }

  const formatPrice = (amount: number, currencyCode: string = 'aud') => {
    return new Intl.NumberFormat('en-AU', {
      style: 'currency',
      currency: currencyCode.toUpperCase(),
    }).format(amount / 100)
  }

  const getAddonPrice = (addon: Addon): { amount: number; currency: string } | null => {
    // Add null checks for price data
    if (!addon?.variants || !Array.isArray(addon.variants) || addon.variants.length === 0) {
      return null
    }

    const firstVariant = addon.variants[0]
    if (!firstVariant?.prices || !Array.isArray(firstVariant.prices) || firstVariant.prices.length === 0) {
      return null
    }

    const price = firstVariant.prices[0]
    if (!price) {
      return null
    }

    return {
      amount: price.amount || 0,
      currency: price.currency_code || 'aud'
    }
  }

  const getUnitLabel = (unit?: string): string => {
    switch (unit) {
      case 'per_person':
        return 'per person'
      case 'per_day':
        return 'per day'
      case 'per_booking':
        return 'per booking'
      default:
        return ''
    }
  }

  const isUniversalAddon = (addon: Addon): boolean => {
    const applicableTours = addon.metadata?.applicable_tours
    return applicableTours?.includes('*') || false
  }

  // 4. Handle error state
  if (error && !loading) {
    return (
      <Container>
        <div className="p-6">
          <Heading level="h2">Available Addons</Heading>
          <Text className="text-red-600 mt-2">Unable to load widget data: {error}</Text>
          <button
            onClick={loadAddons}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded"
          >
            Retry
          </button>
        </div>
      </Container>
    )
  }

  // 5. Handle loading state
  if (loading) {
    return (
      <Container>
        <div className="p-6">
          <Text>Loading available addons...</Text>
        </div>
      </Container>
    )
  }

  const addonCount = addons.length
  const categoryCount = Object.keys(groupedAddons).length

  return (
    <Container className="divide-y p-0">
      {/* Header */}
      <div className="px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <Heading level="h2">Available Addons</Heading>
            <Text size="small" className="text-gray-600 mt-1">
              Addons that customers can add when booking this tour
            </Text>
          </div>
          <Badge color={addonCount > 0 ? "green" : "orange"} size="large">
            {addonCount} {addonCount === 1 ? 'addon' : 'addons'}
          </Badge>
        </div>
      </div>

      {/* Summary */}
      <div className="px-6 py-4 bg-blue-50">
        <Text size="small" className="text-gray-700">
          <strong>{addonCount} add-on{addonCount !== 1 ? 's' : ''}</strong> available for this tour
          {categoryCount > 0 && ` across ${categoryCount} ${categoryCount === 1 ? 'category' : 'categories'}`}
        </Text>
      </div>

      {/* No addons message */}
      {addonCount === 0 && (
        <div className="px-6 py-4">
          <Text className="text-gray-500 italic">
            No addons are currently mapped to this tour. Addons need to include this tour's handle
            in their <code className="bg-gray-200 px-1 rounded">applicable_tours</code> metadata field.
          </Text>
        </div>
      )}

      {/* Grouped Addons */}
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
                  className="border rounded-lg p-4 hover:border-gray-400 transition-colors bg-white"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Text className="font-medium">{addon.title}</Text>
                        {isUniversal && (
                          <Badge color="blue" size="small">
                            Universal
                          </Badge>
                        )}
                      </div>
                      <Text size="small" className="text-gray-600">
                        {addon.handle}
                      </Text>
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

                  {addon.metadata?.description && (
                    <div className="mt-2 pt-2 border-t">
                      <Text size="small" className="text-gray-700">
                        {addon.metadata.description}
                      </Text>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      ))}

      {/* Help text */}
      <div className="px-6 py-4 bg-gray-50">
        <Text size="small" className="text-gray-600">
          <strong>Note:</strong> This is a read-only view showing which addons are available for this tour.
          To modify addon mappings, edit the individual addon products and update their{' '}
          <code className="bg-gray-200 px-1 rounded">applicable_tours</code> field using the "Tour Mapping" widget.
        </Text>
      </div>
    </Container>
  )
}

// Widget configuration - inject into product details page
export const config = defineWidgetConfig({
  zone: "product.details.after",
})

export default TourAddonsDisplay
