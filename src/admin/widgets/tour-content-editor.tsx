import { defineWidgetConfig } from "@medusajs/admin-sdk"
import {
  Container,
  Heading,
  Button,
  Input,
  Label,
  Text,
  Textarea,
  Badge,
  IconButton,
  Toaster,
  toast
} from "@medusajs/ui"
import { useState, useEffect } from "react"
import { DetailWidgetProps, AdminProduct } from "@medusajs/framework/types"
import { Plus, Trash, XMark } from "@medusajs/icons"

/**
 * Tour Content Editor Widget for Medusa Admin
 *
 * Provides comprehensive interface for editing tour-specific content including:
 * - Tour Itinerary (structured day-by-day schedule)
 * - About This Tour (rich text description)
 * - What to Expect (bullet point list)
 *
 * USAGE:
 * - Navigate to Products → Select Tour Product
 * - Scroll to "Tour Content Editor" section
 * - Edit itinerary, about section, and expectations
 * - Click "Save Tour Content" to persist changes
 *
 * STORAGE:
 * - Data is stored in product.metadata
 * - metadata.tour_itinerary: JSON array of itinerary items
 * - metadata.about_tour: string with rich text
 * - metadata.what_to_expect: JSON array of bullet points
 *
 * @see https://docs.medusajs.com/resources/references/admin-widget-injection-zones
 */

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

const TourContentEditor = ({ data }: DetailWidgetProps<AdminProduct>) => {
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
  const [editMode, setEditMode] = useState(false)
  const [saving, setSaving] = useState(false)

  // Tour content state
  const [itinerary, setItinerary] = useState<ItineraryItem[]>([])
  const [aboutTour, setAboutTour] = useState("")
  const [whatToExpect, setWhatToExpect] = useState<string[]>([])

  // Validation errors
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [error, setError] = useState<string | null>(null)

  // Load tour content on mount
  useEffect(() => {
    loadTourContent()
  }, [product.id])

  /**
   * Normalize itinerary item to ensure all required fields exist
   * This prevents crashes when loading data from older versions or incomplete metadata
   */
  const normalizeItineraryItem = (item: any): ItineraryItem => {
    return {
      day: typeof item?.day === 'number' ? item.day : 1,
      title: typeof item?.title === 'string' ? item.title : '',
      description: typeof item?.description === 'string' ? item.description : '',
      activities: Array.isArray(item?.activities) ? item.activities : [],
      meals: typeof item?.meals === 'string' ? item.meals : undefined,
      accommodation: typeof item?.accommodation === 'string' ? item.accommodation : undefined,
    }
  }

  const loadTourContent = async () => {
    try {
      setLoading(true)
      setError(null)

      // Parse tour content from product metadata with null checks
      const metadata = product?.metadata || {}

      // Load itinerary with null checks and normalization
      if (metadata?.tour_itinerary) {
        try {
          const parsedItinerary = typeof metadata.tour_itinerary === 'string'
            ? JSON.parse(metadata.tour_itinerary as string)
            : metadata.tour_itinerary

          // Normalize each itinerary item to ensure all required fields exist
          const normalizedItinerary = Array.isArray(parsedItinerary)
            ? parsedItinerary.map(normalizeItineraryItem)
            : []

          setItinerary(normalizedItinerary)
        } catch (e) {
          console.error('Widget API error: Error parsing tour_itinerary:', e)
          setItinerary([])
        }
      } else {
        setItinerary([])
      }

      // Load about tour with null check
      setAboutTour((metadata?.about_tour as string) || "")

      // Load what to expect with null checks
      if (metadata?.what_to_expect) {
        try {
          const parsedExpectations = typeof metadata.what_to_expect === 'string'
            ? JSON.parse(metadata.what_to_expect as string)
            : metadata.what_to_expect
          setWhatToExpect(Array.isArray(parsedExpectations) ? parsedExpectations : [])
        } catch (e) {
          console.error('Widget API error: Error parsing what_to_expect:', e)
          setWhatToExpect([])
        }
      } else {
        setWhatToExpect([])
      }
    } catch (error) {
      console.error('Widget API error:', error)
      setError('Failed to load tour content')
      toast.error("Failed to load tour content", {
        description: "Please refresh the page and try again."
      })
    } finally {
      setLoading(false)
    }
  }

  const validateContent = (): boolean => {
    const newErrors: Record<string, string> = {}

    // Validate about tour
    if (editMode && aboutTour.trim().length === 0) {
      newErrors.about_tour = "About This Tour is required"
    }

    // Validate itinerary
    if (editMode && itinerary.length === 0) {
      newErrors.itinerary = "At least one itinerary item is required"
    }

    itinerary.forEach((item, index) => {
      if (!item.title.trim()) {
        newErrors[`itinerary_${index}_title`] = "Title is required"
      }
      if (!item.description.trim()) {
        newErrors[`itinerary_${index}_description`] = "Description is required"
      }
    })

    // Validate what to expect
    if (editMode && whatToExpect.length === 0) {
      newErrors.what_to_expect = "At least one expectation is required"
    }

    whatToExpect.forEach((item, index) => {
      if (!item.trim()) {
        newErrors[`expect_${index}`] = "Expectation cannot be empty"
      }
    })

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSave = async () => {
    if (!validateContent()) {
      toast.error("Validation failed", {
        description: "Please fix the errors before saving."
      })
      return
    }

    try {
      setSaving(true)
      setError(null)

      // Prepare metadata update
      const updatedMetadata = {
        ...product.metadata,
        tour_itinerary: JSON.stringify(itinerary),
        about_tour: aboutTour,
        what_to_expect: JSON.stringify(whatToExpect),
      }

      // 3. Wrap API calls in try-catch
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
        console.error('Widget API error: Failed to update tour content')
        throw new Error('Failed to update tour content')
      }

      setEditMode(false)
      setErrors({})

      toast.success("Tour content saved successfully!", {
        description: "Your changes have been saved to the product."
      })
    } catch (error) {
      console.error('Widget API error:', error)
      setError('Failed to save tour content')
      toast.error("Failed to save tour content", {
        description: "Please try again or contact support."
      })
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    loadTourContent()
    setEditMode(false)
    setErrors({})
  }

  // Itinerary management
  const addItineraryItem = () => {
    const newDay = itinerary.length + 1
    setItinerary([
      ...itinerary,
      {
        day: newDay,
        title: "",
        description: "",
        activities: [],
        meals: "",
        accommodation: "",
      },
    ])
  }

  const removeItineraryItem = (index: number) => {
    const updated = itinerary.filter((_, i) => i !== index)
    // Renumber days
    const renumbered = updated.map((item, i) => ({ ...item, day: i + 1 }))
    setItinerary(renumbered)
  }

  const updateItineraryItem = (index: number, field: keyof ItineraryItem, value: any) => {
    const updated = [...itinerary]
    updated[index] = { ...updated[index], [field]: value }
    setItinerary(updated)
  }

  const addActivity = (itineraryIndex: number) => {
    const updated = [...itinerary]
    // Ensure activities array exists before spreading
    const currentActivities = updated[itineraryIndex].activities || []
    updated[itineraryIndex].activities = [...currentActivities, ""]
    setItinerary(updated)
  }

  const updateActivity = (itineraryIndex: number, activityIndex: number, value: string) => {
    const updated = [...itinerary]
    // Ensure activities array exists
    if (!updated[itineraryIndex].activities) {
      updated[itineraryIndex].activities = []
    }
    updated[itineraryIndex].activities[activityIndex] = value
    setItinerary(updated)
  }

  const removeActivity = (itineraryIndex: number, activityIndex: number) => {
    const updated = [...itinerary]
    // Ensure activities array exists before filtering
    const currentActivities = updated[itineraryIndex].activities || []
    updated[itineraryIndex].activities = currentActivities.filter(
      (_, i) => i !== activityIndex
    )
    setItinerary(updated)
  }

  // What to Expect management
  const addExpectation = () => {
    setWhatToExpect([...whatToExpect, ""])
  }

  const updateExpectation = (index: number, value: string) => {
    const updated = [...whatToExpect]
    updated[index] = value
    setWhatToExpect(updated)
  }

  const removeExpectation = (index: number) => {
    setWhatToExpect(whatToExpect.filter((_, i) => i !== index))
  }

  // 4. Handle error state
  if (error && !loading) {
    return (
      <Container>
        <div className="p-6">
          <Heading level="h2">Tour Content Editor</Heading>
          <Text className="text-red-600 mt-2">Unable to load widget data: {error}</Text>
          <button
            onClick={loadTourContent}
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
          <Text>Loading tour content...</Text>
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
            <Heading level="h2">Tour Content Editor</Heading>
            <Text size="small" className="text-gray-600 mt-1">
              Manage itinerary, description, and expectations for this tour
            </Text>
          </div>
          <div className="flex gap-2">
            {!editMode ? (
              <Button variant="secondary" onClick={() => setEditMode(true)}>
                Edit Tour Content
              </Button>
            ) : (
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
                  {saving ? 'Saving...' : 'Save Tour Content'}
                </Button>
              </>
            )}
          </div>
        </div>

        {/* About This Tour Section */}
        <div className="px-6 py-4">
          <div className="flex items-center justify-between mb-3">
            <Label className="text-base font-semibold">About This Tour</Label>
            <Badge color="blue">Rich Text</Badge>
          </div>
          {editMode ? (
            <div>
              <Textarea
                value={aboutTour}
                onChange={(e) => setAboutTour(e.target.value)}
                placeholder="Describe this tour in detail..."
                rows={6}
                className={errors.about_tour ? "border-red-500" : ""}
              />
              {errors.about_tour && (
                <Text size="small" className="text-red-600 mt-1">
                  {errors.about_tour}
                </Text>
              )}
              <Text size="small" className="text-gray-600 mt-2">
                Provide a comprehensive description of the tour, highlighting key features and what makes it special.
              </Text>
            </div>
          ) : (
            <div className="bg-gray-50 p-4 rounded-lg">
              {aboutTour ? (
                <Text className="whitespace-pre-wrap">{aboutTour}</Text>
              ) : (
                <Text className="text-gray-500 italic">No description provided</Text>
              )}
            </div>
          )}
        </div>

        {/* Tour Itinerary Section */}
        <div className="px-6 py-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <Label className="text-base font-semibold">Tour Itinerary</Label>
              <Text size="small" className="text-gray-600 mt-1">
                Day-by-day schedule with activities, meals, and accommodations
              </Text>
            </div>
            {editMode && (
              <Button variant="secondary" size="small" onClick={addItineraryItem}>
                <Plus className="mr-1" /> Add Day
              </Button>
            )}
          </div>

          {errors.itinerary && (
            <Text size="small" className="text-red-600 mb-3">
              {errors.itinerary}
            </Text>
          )}

          <div className="space-y-4">
            {itinerary.length === 0 && !editMode && (
              <Text className="text-gray-500 italic">No itinerary items configured</Text>
            )}

            {itinerary.map((item, index) => (
              <div
                key={index}
                className="border rounded-lg p-4 hover:border-gray-400 transition-colors"
              >
                <div className="flex items-start justify-between mb-3">
                  <Badge color="purple">Day {item.day}</Badge>
                  {editMode && (
                    <IconButton
                      variant="transparent"
                      onClick={() => removeItineraryItem(index)}
                    >
                      <Trash className="text-red-600" />
                    </IconButton>
                  )}
                </div>

                <div className="space-y-3">
                  {/* Title */}
                  <div>
                    <Label className="text-sm font-medium">Title</Label>
                    {editMode ? (
                      <div>
                        <Input
                          value={item.title}
                          onChange={(e) =>
                            updateItineraryItem(index, "title", e.target.value)
                          }
                          placeholder="e.g., Arrive in Cairns"
                          className={errors[`itinerary_${index}_title`] ? "border-red-500" : ""}
                        />
                        {errors[`itinerary_${index}_title`] && (
                          <Text size="small" className="text-red-600 mt-1">
                            {errors[`itinerary_${index}_title`]}
                          </Text>
                        )}
                      </div>
                    ) : (
                      <Text className="mt-1 font-medium">{item.title || "-"}</Text>
                    )}
                  </div>

                  {/* Description */}
                  <div>
                    <Label className="text-sm font-medium">Description</Label>
                    {editMode ? (
                      <div>
                        <Textarea
                          value={item.description}
                          onChange={(e) =>
                            updateItineraryItem(index, "description", e.target.value)
                          }
                          placeholder="Describe the day's activities..."
                          rows={3}
                          className={errors[`itinerary_${index}_description`] ? "border-red-500" : ""}
                        />
                        {errors[`itinerary_${index}_description`] && (
                          <Text size="small" className="text-red-600 mt-1">
                            {errors[`itinerary_${index}_description`]}
                          </Text>
                        )}
                      </div>
                    ) : (
                      <Text className="mt-1 text-gray-700 whitespace-pre-wrap">
                        {item.description || "-"}
                      </Text>
                    )}
                  </div>

                  {/* Activities */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <Label className="text-sm font-medium">Activities</Label>
                      {editMode && (
                        <Button
                          variant="transparent"
                          size="small"
                          onClick={() => addActivity(index)}
                        >
                          <Plus className="mr-1" /> Add Activity
                        </Button>
                      )}
                    </div>
                    {(!item.activities || item.activities.length === 0) && !editMode && (
                      <Text className="text-gray-500 italic text-sm">No activities</Text>
                    )}
                    <div className="space-y-2">
                      {(item.activities || []).map((activity, actIndex) => (
                        <div key={actIndex} className="flex items-center gap-2">
                          {editMode ? (
                            <>
                              <Input
                                value={activity}
                                onChange={(e) =>
                                  updateActivity(index, actIndex, e.target.value)
                                }
                                placeholder="Activity description"
                                className="flex-1"
                              />
                              <IconButton
                                variant="transparent"
                                onClick={() => removeActivity(index, actIndex)}
                              >
                                <XMark className="text-gray-500" />
                              </IconButton>
                            </>
                          ) : (
                            <Text className="text-sm">• {activity}</Text>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Meals */}
                  <div>
                    <Label className="text-sm font-medium">Meals Included</Label>
                    {editMode ? (
                      <Input
                        value={item.meals || ""}
                        onChange={(e) =>
                          updateItineraryItem(index, "meals", e.target.value)
                        }
                        placeholder="e.g., Breakfast, Lunch, Dinner"
                      />
                    ) : (
                      <Text className="mt-1 text-sm text-gray-700">
                        {item.meals || "Not specified"}
                      </Text>
                    )}
                  </div>

                  {/* Accommodation */}
                  <div>
                    <Label className="text-sm font-medium">Accommodation</Label>
                    {editMode ? (
                      <Input
                        value={item.accommodation || ""}
                        onChange={(e) =>
                          updateItineraryItem(index, "accommodation", e.target.value)
                        }
                        placeholder="e.g., 4-star hotel in Cairns"
                      />
                    ) : (
                      <Text className="mt-1 text-sm text-gray-700">
                        {item.accommodation || "Not specified"}
                      </Text>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* What to Expect Section */}
        <div className="px-6 py-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <Label className="text-base font-semibold">What to Expect</Label>
              <Text size="small" className="text-gray-600 mt-1">
                Key points about what guests should expect on this tour
              </Text>
            </div>
            {editMode && (
              <Button variant="secondary" size="small" onClick={addExpectation}>
                <Plus className="mr-1" /> Add Point
              </Button>
            )}
          </div>

          {errors.what_to_expect && (
            <Text size="small" className="text-red-600 mb-3">
              {errors.what_to_expect}
            </Text>
          )}

          <div className="space-y-2">
            {whatToExpect.length === 0 && !editMode && (
              <Text className="text-gray-500 italic">No expectations configured</Text>
            )}

            {whatToExpect.map((item, index) => (
              <div key={index} className="flex items-start gap-2">
                {editMode ? (
                  <>
                    <Input
                      value={item}
                      onChange={(e) => updateExpectation(index, e.target.value)}
                      placeholder="What guests should expect..."
                      className={`flex-1 ${errors[`expect_${index}`] ? "border-red-500" : ""}`}
                    />
                    <IconButton
                      variant="transparent"
                      onClick={() => removeExpectation(index)}
                    >
                      <Trash className="text-red-600" />
                    </IconButton>
                  </>
                ) : (
                  <div className="flex items-start gap-2">
                    <Text className="text-gray-500 mt-1">•</Text>
                    <Text>{item}</Text>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Help text */}
        <div className="px-6 py-4 bg-gray-50">
          <Text size="small" className="text-gray-600">
            <strong>Note:</strong> Tour content is stored in product metadata and can be
            accessed via the API at <code className="bg-gray-200 px-1 rounded">
            product.metadata.tour_itinerary</code>, <code className="bg-gray-200 px-1 rounded">
            product.metadata.about_tour</code>, and <code className="bg-gray-200 px-1 rounded">
            product.metadata.what_to_expect</code>.
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

export default TourContentEditor
