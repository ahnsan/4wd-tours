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
 * Tour Addon Selector Widget for Medusa Admin
 *
 * Allows admins to manage addons for tour products with edit mode functionality.
 * This widget appears on tour product edit pages and provides:
 * - Toggle between read-only and edit mode
 * - Checkbox list of all available addon products grouped by category
 * - "Select All" / "Clear All" buttons per category
 * - Search/filter functionality
 * - Batch update functionality that modifies addon.metadata.applicable_tours
 * - Save button with toast notifications
 * - Loading and saving states
 * - Selected addon count display
 *
 * USAGE:
 * - Navigate to Products → Select a Tour Product
 * - Scroll to "Tour Addons" section
 * - Click "Edit Addons" to enter edit mode
 * - Select/deselect addons by category
 * - Click "Save Changes" to persist selections
 *
 * BATCH UPDATE LOGIC:
 * - When selections change, the widget calculates which addons to add/remove
 * - On save, it batch updates all affected addon products
 * - Adds tour handle to addon.metadata.applicable_tours for selected addons
 * - Removes tour handle from addon.metadata.applicable_tours for deselected addons
 *
 * @see https://docs.medusajs.com/resources/references/admin-widget-injection-zones
 */

interface Addon {
  id: string
  handle: string
  title: string
  metadata?: {
    addon?: boolean
    category?: string
    applicable_tours?: string[]
    [key: string]: any
  }
}

/**
 * Initialize selections - determine which addons are already selected
 * by checking if tour handle exists in addon.metadata.applicable_tours
 */
const initializeSelections = (addons: Addon[], tourHandle: string): Set<string> => {
  const selected = new Set<string>()
  addons.forEach(addon => {
    const applicableTours = addon.metadata?.applicable_tours || []
    if (applicableTours.includes('*') || applicableTours.includes(tourHandle)) {
      selected.add(addon.id)
    }
  })
  return selected
}

/**
 * Calculate changes - diff between initial and current selections
 * Returns arrays of addon IDs to add and remove
 */
const calculateChanges = (initial: Set<string>, current: Set<string>) => {
  const toAdd = Array.from(current).filter(id => !initial.has(id))
  const toRemove = Array.from(initial).filter(id => !current.has(id))
  return { toAdd, toRemove }
}

/**
 * Batch update addons - update multiple addon products' applicable_tours metadata
 * Adds tour handle to selected addons, removes from deselected addons
 */
const updateAddonMappings = async (
  tourHandle: string,
  addonsToAdd: string[],
  addonsToRemove: string[],
  allAddons: Addon[]
) => {
  const updates: Promise<any>[] = []

  // Add tour handle to addons
  for (const addonId of addonsToAdd) {
    const addon = allAddons.find(a => a.id === addonId)
    if (!addon) continue

    const currentTours = addon.metadata?.applicable_tours || []
    // Avoid duplicates
    const updatedTours = [...new Set([...currentTours, tourHandle])]

    updates.push(
      fetch(`/admin/products/${addonId}`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          metadata: {
            ...addon.metadata,
            applicable_tours: updatedTours
          }
        })
      })
    )
  }

  // Remove tour handle from addons
  for (const addonId of addonsToRemove) {
    const addon = allAddons.find(a => a.id === addonId)
    if (!addon) continue

    const currentTours = addon.metadata?.applicable_tours || []
    const updatedTours = currentTours.filter((t: string) => t !== tourHandle)

    updates.push(
      fetch(`/admin/products/${addonId}`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          metadata: {
            ...addon.metadata,
            applicable_tours: updatedTours
          }
        })
      })
    )
  }

  // Execute all updates in parallel
  const results = await Promise.allSettled(updates)

  return {
    successful: results.filter(r => r.status === 'fulfilled').length,
    failed: results.filter(r => r.status === 'rejected').length,
    errors: results
      .filter((r): r is PromiseRejectedResult => r.status === 'rejected')
      .map(r => r.reason)
  }
}

const TourAddonSelector = ({ data }: DetailWidgetProps<AdminProduct>) => {
  // Early null check
  if (!data || !data.id) {
    return null
  }

  // Check if widget should render for this product type
  const isTourProduct = data.metadata?.is_tour === true
  if (!isTourProduct) {
    return null
  }

  const product = data
  const [editMode, setEditMode] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [addons, setAddons] = useState<Addon[]>([])
  const [selectedAddons, setSelectedAddons] = useState<Set<string>>(new Set())
  const [initialSelections, setInitialSelections] = useState<Set<string>>(new Set())
  const [searchQuery, setSearchQuery] = useState("")

  // Load addons and current selections on mount
  useEffect(() => {
    loadData()
  }, [product.id])

  const loadData = async () => {
    try {
      setLoading(true)

      // Step 1: Get add-ons collection
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
        setLoading(false)
        return
      }

      // Step 2: Fetch addon products with metadata
      const response = await fetch(
        `/admin/products?collection_id[]=${collectionId}&limit=100&fields=+metadata`,
        { credentials: 'include' }
      )

      if (!response.ok) {
        console.error('Widget API error: Failed to fetch addons')
        throw new Error('Failed to fetch addons')
      }

      const responseData = await response.json()
      const addonProducts = responseData?.products || []

      setAddons(addonProducts)

      // Initialize selections based on current addon metadata
      const initialSelected = initializeSelections(addonProducts, product.handle)
      setInitialSelections(initialSelected)
      setSelectedAddons(initialSelected)

    } catch (error) {
      console.error('Widget API error:', error)
      toast.error("Failed to load addons", {
        description: "Please refresh the page and try again."
      })
    } finally {
      setLoading(false)
    }
  }

  // Filter addons based on search query
  const filteredAddons = useMemo(() => {
    if (!searchQuery.trim()) {
      return addons
    }
    const query = searchQuery.toLowerCase()
    return addons.filter(addon =>
      addon.title.toLowerCase().includes(query) ||
      addon.handle.toLowerCase().includes(query) ||
      addon.metadata?.category?.toLowerCase().includes(query)
    )
  }, [addons, searchQuery])

  // Group addons by category
  const groupedAddons = useMemo(() => {
    const grouped: { [category: string]: Addon[] } = {}
    filteredAddons.forEach(addon => {
      const category = addon.metadata?.category || 'Other'
      if (!grouped[category]) {
        grouped[category] = []
      }
      grouped[category].push(addon)
    })
    return grouped
  }, [filteredAddons])

  // Handle individual checkbox toggle
  const handleAddonToggle = (addonId: string) => {
    const newSelected = new Set(selectedAddons)
    if (newSelected.has(addonId)) {
      newSelected.delete(addonId)
    } else {
      newSelected.add(addonId)
    }
    setSelectedAddons(newSelected)
  }

  // Handle Select All
  const handleSelectAll = () => {
    setSelectedAddons(new Set(addons.map(a => a.id)))
  }

  // Handle Clear All
  const handleClearAll = () => {
    setSelectedAddons(new Set())
  }

  // Calculate if there are unsaved changes
  const hasChanges = useMemo(() => {
    if (selectedAddons.size !== initialSelections.size) return true
    return Array.from(selectedAddons).some(id => !initialSelections.has(id))
  }, [selectedAddons, initialSelections])

  // Save addon mapping with batch updates
  const handleSave = async () => {
    try {
      setSaving(true)

      // Calculate changes
      const { toAdd, toRemove } = calculateChanges(initialSelections, selectedAddons)

      // If no changes, show info message
      if (toAdd.length === 0 && toRemove.length === 0) {
        toast.info("No changes to save", {
          description: "Addon selections have not changed."
        })
        setEditMode(false)
        return
      }

      // Batch update addon products
      const result = await updateAddonMappings(
        product.handle,
        toAdd,
        toRemove,
        addons
      )

      if (result.failed > 0) {
        toast.warning("Partially saved", {
          description: `${result.successful} addon(s) updated successfully, ${result.failed} failed. Please try again.`
        })
        console.error('Failed updates:', result.errors)
      } else {
        toast.success("Addon mapping saved successfully!", {
          description: `Updated ${result.successful} addon(s). ${toAdd.length} added, ${toRemove.length} removed.`
        })

        // Update initial selections to match current
        setInitialSelections(new Set(selectedAddons))

        // Exit edit mode
        setEditMode(false)
      }

    } catch (error) {
      console.error('Error saving addon mapping:', error)
      toast.error("Failed to save addon mapping", {
        description: "Please try again or contact support."
      })
    } finally {
      setSaving(false)
    }
  }

  // Handle cancel - reset to initial selections
  const handleCancel = () => {
    setSelectedAddons(new Set(initialSelections))
    setSearchQuery("")
    setEditMode(false)
  }

  // Handle loading state
  if (loading) {
    return (
      <Container>
        <div className="p-6">
          <Text>Loading addon mapping...</Text>
        </div>
      </Container>
    )
  }

  return (
    <>
      <Toaster />
      <Container className="divide-y p-0">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4">
          <div>
            <Heading level="h2">Tour Addons</Heading>
            <Text size="small" className="text-gray-600 mt-1">
              {editMode
                ? "Select which addons should be available for this tour"
                : "Addons available for this tour"
              }
            </Text>
          </div>
          <div className="flex items-center gap-2">
            {editMode ? (
              <>
                <Button
                  variant="secondary"
                  onClick={handleCancel}
                  disabled={saving}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  onClick={handleSave}
                  disabled={saving}
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </Button>
              </>
            ) : (
              <Button
                variant="secondary"
                onClick={() => setEditMode(true)}
              >
                Edit Addons
              </Button>
            )}
          </div>
        </div>

        {/* Current status */}
        <div className="px-6 py-4 bg-blue-50">
          <div className="flex items-center gap-2">
            <Badge color={selectedAddons.size > 0 ? "green" : "orange"} size="large">
              {selectedAddons.size} of {addons.length} addons selected
            </Badge>
            {Object.keys(groupedAddons).length > 0 && (
              <Text size="small" className="text-gray-600">
                across {Object.keys(groupedAddons).length} {Object.keys(groupedAddons).length === 1 ? 'category' : 'categories'}
              </Text>
            )}
          </div>
        </div>

        {/* Quick Actions - only in edit mode */}
        {editMode && (
          <div className="px-6 py-4">
            <Label className="text-sm font-medium mb-3">Quick Actions</Label>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="secondary"
                size="small"
                onClick={handleSelectAll}
              >
                Select All ({addons.length})
              </Button>
              <Button
                variant="secondary"
                size="small"
                onClick={handleClearAll}
              >
                Clear All
              </Button>
            </div>
          </div>
        )}

        {/* Search - only in edit mode */}
        {editMode && (
          <div className="px-6 py-4">
            <Label className="text-sm font-medium mb-2">Search Addons</Label>
            <Input
              type="text"
              placeholder="Search by name, handle, or category..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full"
            />
            {searchQuery && (
              <Text size="small" className="text-gray-600 mt-2">
                Showing {filteredAddons.length} of {addons.length} addons
              </Text>
            )}
          </div>
        )}

        {/* Grouped Addon List */}
        <div className="px-6 py-4">
          <Label className="text-sm font-medium mb-3">Available Addons</Label>

          {filteredAddons.length === 0 && searchQuery && (
            <Text className="text-gray-500 italic">No addons match your search</Text>
          )}

          {addons.length === 0 && !searchQuery && (
            <Text className="text-gray-500 italic">
              No addon products found. Create addon products and add them to the "add-ons" collection.
            </Text>
          )}

          <div className="space-y-6">
            {Object.entries(groupedAddons).map(([category, categoryAddons]) => {
              const selectedInCategory = categoryAddons.filter(a => selectedAddons.has(a.id)).length
              const allSelected = selectedInCategory === categoryAddons.length
              const noneSelected = selectedInCategory === 0

              return (
                <div key={category}>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Label className="text-base font-semibold">{category}</Label>
                      <Badge color="purple" size="small">
                        {selectedInCategory}/{categoryAddons.length}
                      </Badge>
                    </div>
                    {editMode && (
                      <div className="flex gap-2">
                        <Button
                          variant="secondary"
                          size="small"
                          onClick={() => {
                            const newSelected = new Set(selectedAddons)
                            categoryAddons.forEach(a => newSelected.add(a.id))
                            setSelectedAddons(newSelected)
                          }}
                          disabled={allSelected}
                        >
                          Select All
                        </Button>
                        <Button
                          variant="secondary"
                          size="small"
                          onClick={() => {
                            const newSelected = new Set(selectedAddons)
                            categoryAddons.forEach(a => newSelected.delete(a.id))
                            setSelectedAddons(newSelected)
                          }}
                          disabled={noneSelected}
                        >
                          Deselect All
                        </Button>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2 ml-2">
                    {categoryAddons.map((addon) => {
                      const isSelected = selectedAddons.has(addon.id)
                      const isUniversal = addon.metadata?.applicable_tours?.includes('*')

                      return (
                        <div
                          key={addon.id}
                          className={`flex items-start gap-3 p-3 border rounded-lg transition-colors ${
                            editMode ? 'hover:border-gray-400 cursor-pointer' : ''
                          } ${isSelected ? 'bg-blue-50 border-blue-300' : 'bg-white'}`}
                          onClick={() => editMode && handleAddonToggle(addon.id)}
                        >
                          {editMode && (
                            <Checkbox
                              id={`addon-${addon.id}`}
                              checked={isSelected}
                              onCheckedChange={() => handleAddonToggle(addon.id)}
                              onClick={(e) => e.stopPropagation()}
                            />
                          )}
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <Text className="font-medium">{addon.title}</Text>
                              {isUniversal && (
                                <Badge color="blue" size="small">
                                  Universal
                                </Badge>
                              )}
                              {!editMode && isSelected && (
                                <Badge color="green" size="small">
                                  Selected
                                </Badge>
                              )}
                            </div>
                            <Text size="small" className="text-gray-600">
                              {addon.handle}
                            </Text>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Help text */}
        <div className="px-6 py-4 bg-gray-50">
          <Text size="small" className="text-gray-600">
            <strong>Note:</strong> {editMode
              ? "Changes will batch update the applicable_tours metadata on all affected addon products. Click Save Changes to persist your selections."
              : "Click Edit Addons to modify which addons are available for this tour. Changes are stored in each addon's metadata.applicable_tours field."
            }
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

export default TourAddonSelector
