import { defineWidgetConfig } from "@medusajs/admin-sdk"
import { Container, Heading, Button, Input, Label, Text, Badge } from "@medusajs/ui"
import { useState, useEffect } from "react"
import { DetailWidgetProps, AdminProduct } from "@medusajs/framework/types"

/**
 * Enhanced Price Management Widget for Medusa Admin
 *
 * Provides easy-to-use interface for editing product variant prices
 * Displays current pricing for all variants, regions, and currencies
 * Supports updating prices via Medusa Pricing Module API
 *
 * USAGE:
 * - Navigate to Products → Select Product
 * - Scroll to "Price Management" section
 * - View all variant prices by region/currency
 * - Click "Edit" to update prices
 *
 * @see https://docs.medusajs.com/resources/commerce-modules/pricing
 */
const ProductPriceManager = ({ data }: DetailWidgetProps<AdminProduct>) => {
  const product = data
  const [prices, setPrices] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [editMode, setEditMode] = useState(false)
  const [editedPrices, setEditedPrices] = useState<Record<string, number>>({})
  const [saving, setSaving] = useState(false)

  // Load variant prices on mount
  useEffect(() => {
    loadPrices()
  }, [product.id])

  const loadPrices = async () => {
    try {
      setLoading(true)

      // Fetch product with variants and prices
      const response = await fetch(`/admin/products/${product.id}?fields=+variants.calculated_price,+variants.prices`, {
        credentials: 'include',
      })

      if (!response.ok) {
        throw new Error('Failed to fetch prices')
      }

      const { product: productData } = await response.json()

      // Extract prices from all variants
      const allPrices: any[] = []
      productData.variants?.forEach((variant: any) => {
        if (variant.prices && variant.prices.length > 0) {
          variant.prices.forEach((price: any) => {
            allPrices.push({
              variantId: variant.id,
              variantTitle: variant.title || 'Default',
              variantSku: variant.sku,
              priceId: price.id,
              amount: price.amount,
              currencyCode: price.currency_code || 'aud',
              regionId: price.region_id,
              minQuantity: price.min_quantity,
              maxQuantity: price.max_quantity,
            })
          })
        }
      })

      setPrices(allPrices)
    } catch (error) {
      console.error('Error loading prices:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleEditPrice = (priceId: string, currentAmount: number) => {
    setEditedPrices({
      ...editedPrices,
      [priceId]: currentAmount / 100, // Convert cents to dollars for editing
    })
  }

  const handlePriceChange = (priceId: string, value: string) => {
    const numValue = parseFloat(value)
    if (!isNaN(numValue) && numValue >= 0) {
      setEditedPrices({
        ...editedPrices,
        [priceId]: numValue,
      })
    }
  }

  const handleSavePrices = async () => {
    try {
      setSaving(true)

      // Prepare price updates
      const updates = Object.entries(editedPrices).map(([priceId, amount]) => ({
        id: priceId,
        amount: Math.round(amount * 100), // Convert dollars to cents
      }))

      // Update prices via admin API
      for (const update of updates) {
        await fetch(`/admin/prices/${update.id}`, {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            amount: update.amount,
          }),
        })
      }

      // Reload prices to reflect changes
      await loadPrices()
      setEditMode(false)
      setEditedPrices({})

      alert('Prices updated successfully!')
    } catch (error) {
      console.error('Error saving prices:', error)
      alert('Error saving prices. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const formatPrice = (amount: number, currencyCode: string = 'aud') => {
    return new Intl.NumberFormat('en-AU', {
      style: 'currency',
      currency: currencyCode.toUpperCase(),
    }).format(amount / 100)
  }

  const getDurationDays = () => {
    return parseInt(product.metadata?.duration_days as string || '1')
  }

  const getPricePerDay = (totalAmount: number) => {
    const days = getDurationDays()
    return days > 0 ? totalAmount / days : totalAmount
  }

  if (loading) {
    return (
      <Container>
        <div className="p-6">
          <Text>Loading prices...</Text>
        </div>
      </Container>
    )
  }

  if (prices.length === 0) {
    return (
      <Container>
        <div className="p-6">
          <Heading level="h2" className="mb-4">Price Management</Heading>
          <Text className="text-gray-600">
            No prices configured for this product. Use the default Medusa admin to add prices.
          </Text>
        </div>
      </Container>
    )
  }

  return (
    <Container className="divide-y p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <div>
          <Heading level="h2">Price Management</Heading>
          <Text size="small" className="text-gray-600 mt-1">
            Manage pricing for all variants and regions
          </Text>
        </div>
        <div className="flex gap-2">
          {!editMode ? (
            <Button
              variant="secondary"
              onClick={() => setEditMode(true)}
            >
              Edit Prices
            </Button>
          ) : (
            <>
              <Button
                variant="secondary"
                onClick={() => {
                  setEditMode(false)
                  setEditedPrices({})
                }}
                disabled={saving}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleSavePrices}
                disabled={saving || Object.keys(editedPrices).length === 0}
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Duration-based pricing info for tours */}
      {product.metadata?.duration_days && (
        <div className="px-6 py-4 bg-blue-50">
          <div className="flex items-center gap-2 mb-2">
            <Badge color="blue">Tour Product</Badge>
            <Text size="small" weight="plus">
              Duration: {getDurationDays()} {getDurationDays() === 1 ? 'day' : 'days'}
            </Text>
          </div>
          <Text size="small" className="text-gray-600">
            Tour pricing is calculated as: <strong>$2,000 per day × {getDurationDays()} days</strong>
          </Text>
        </div>
      )}

      {/* Price table */}
      <div className="px-6 py-4">
        <div className="space-y-4">
          {prices.map((price, index) => {
            const isEditing = editMode && editedPrices[price.priceId] !== undefined
            const displayAmount = isEditing
              ? editedPrices[price.priceId]
              : price.amount / 100

            const pricePerDay = getPricePerDay(price.amount)

            return (
              <div
                key={`${price.priceId}-${index}`}
                className="border rounded-lg p-4 hover:border-gray-400 transition-colors"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Variant info */}
                  <div>
                    <Label className="text-sm font-medium text-gray-700">
                      Variant
                    </Label>
                    <Text className="mt-1">
                      {price.variantTitle}
                      {price.variantSku && (
                        <span className="text-gray-500 text-sm ml-2">
                          (SKU: {price.variantSku})
                        </span>
                      )}
                    </Text>
                  </div>

                  {/* Currency/Region */}
                  <div>
                    <Label className="text-sm font-medium text-gray-700">
                      Currency / Region
                    </Label>
                    <Text className="mt-1">
                      {price.currencyCode.toUpperCase()}
                      {price.regionId && (
                        <span className="text-gray-500 text-sm ml-2">
                          (Region: {price.regionId.slice(0, 8)}...)
                        </span>
                      )}
                    </Text>
                  </div>

                  {/* Price amount */}
                  <div>
                    <Label className="text-sm font-medium text-gray-700">
                      Price
                    </Label>
                    {editMode ? (
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-gray-600">$</span>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          value={displayAmount}
                          onChange={(e) => handlePriceChange(price.priceId, e.target.value)}
                          className="w-32"
                          placeholder="0.00"
                        />
                      </div>
                    ) : (
                      <Text className="mt-1 text-lg font-semibold text-green-700">
                        {formatPrice(price.amount, price.currencyCode)}
                      </Text>
                    )}
                  </div>

                  {/* Per day breakdown for tours */}
                  {product.metadata?.duration_days && getDurationDays() > 1 && (
                    <div>
                      <Label className="text-sm font-medium text-gray-700">
                        Price Per Day
                      </Label>
                      <Text className="mt-1 text-sm text-gray-600">
                        {formatPrice(pricePerDay, price.currencyCode)} / day
                      </Text>
                    </div>
                  )}

                  {/* Edit button for individual price */}
                  {!editMode && (
                    <div className="md:col-span-2">
                      <Button
                        variant="transparent"
                        size="small"
                        onClick={() => handleEditPrice(price.priceId, price.amount)}
                      >
                        Edit this price
                      </Button>
                    </div>
                  )}
                </div>

                {/* Quantity constraints */}
                {(price.minQuantity || price.maxQuantity) && (
                  <div className="mt-3 pt-3 border-t">
                    <Text size="small" className="text-gray-600">
                      Quantity constraints:
                      {price.minQuantity && ` Min: ${price.minQuantity}`}
                      {price.maxQuantity && ` Max: ${price.maxQuantity}`}
                    </Text>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Help text */}
      <div className="px-6 py-4 bg-gray-50">
        <Text size="small" className="text-gray-600">
          <strong>Note:</strong> This widget provides a simplified price editing interface.
          For advanced pricing features (price lists, tax rules, etc.), use the default
          Medusa admin: Products → [Product] → Variants → Edit Variant → Prices.
        </Text>
      </div>
    </Container>
  )
}

// Widget configuration
export const config = defineWidgetConfig({
  zone: "product.details.after",
})

export default ProductPriceManager
