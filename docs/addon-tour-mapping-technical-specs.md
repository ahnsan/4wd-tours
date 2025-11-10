# Addon-Tour Mapping - Technical Specifications
## Implementation Reference for Developers

**Related:** `addon-tour-mapping-admin-ui-plan.md`
**Date:** 2025-11-08

---

## 1. DATA SCHEMA

### 1.1 Product Metadata Structure

#### Addon Product Metadata
```typescript
{
  id: "prod_addon_kayaking_123",
  handle: "addon-kayaking",
  title: "Kayaking Adventure",
  collection_id: "coll_addons",
  status: "published",

  metadata: {
    // Existing addon fields
    addon: true,
    category: "Activities",
    unit: "per_day",
    persuasive_title: "Explore Coastal Waterways",
    features: [...],

    // NEW: Tour mapping fields
    applicable_tours: [
      "prod_tour_3d_fraser_island",
      "prod_tour_5d_ultimate_adventure",
      "prod_tour_3d_noosa_hinterland"
    ],

    // OPTIONAL: Advanced mapping options
    applicable_to_all_tours: false,
    excluded_tours: [],  // Explicit exclusions if applicable_to_all_tours = true
    mapping_rules: {
      require_multi_day: true,  // Only for tours with duration_days > 1
      require_location: ["Fraser Island", "Rainbow Beach"],
      max_participants_limit: 7  // Only for tours with <= 7 participants
    },

    // Audit trail
    last_mapping_update: "2025-11-08T14:30:00Z",
    mapping_updated_by: "admin_user_abc123"
  }
}
```

#### Tour Product Metadata
```typescript
{
  id: "prod_tour_3d_fraser_island",
  handle: "3d-fraser-island-explorer",
  title: "3 Day Fraser Island Explorer",
  collection_id: "coll_tours",
  status: "published",

  metadata: {
    // Existing tour fields
    is_tour: true,
    duration_days: 3,
    location: "Fraser Island, Queensland",
    category: "4WD Beach Tour",
    difficulty: "Moderate",
    max_participants: 7,

    // NO NEW FIELDS NEEDED
    // Addon availability is derived from addon products
  }
}
```

### 1.2 Database Queries

#### Get all tours for an addon
```sql
-- PostgreSQL query to find tours mapped to an addon

SELECT
  p.id,
  p.handle,
  p.title,
  p.metadata->>'duration_days' as duration,
  p.metadata->>'location' as location
FROM product p
WHERE
  p.metadata->>'is_tour' = 'true'
  AND p.status = 'published'
  AND p.id = ANY(
    SELECT jsonb_array_elements_text(
      (SELECT metadata->'applicable_tours'
       FROM product
       WHERE id = 'prod_addon_kayaking_123')::jsonb
    )
  );
```

#### Get all addons for a tour
```sql
-- PostgreSQL query to find addons available for a tour

SELECT
  p.id,
  p.handle,
  p.title,
  p.metadata->>'category' as category,
  p.metadata->>'unit' as unit
FROM product p
WHERE
  p.metadata->>'addon' = 'true'
  AND p.status = 'published'
  AND (
    -- Either applicable to all tours
    p.metadata->>'applicable_to_all_tours' = 'true'
    OR
    -- Or explicitly includes this tour
    p.metadata->'applicable_tours' ? 'prod_tour_3d_fraser_island'
  );
```

---

## 2. API SPECIFICATIONS

### 2.1 RESTful Endpoints

#### GET /admin/addons/:id/applicable-tours
**Description:** Get all tours mapped to this addon

**Request:**
```http
GET /admin/addons/prod_addon_kayaking_123/applicable-tours
Authorization: Bearer {admin_token}
```

**Response:**
```json
{
  "addon": {
    "id": "prod_addon_kayaking_123",
    "title": "Kayaking Adventure",
    "category": "Activities"
  },
  "applicable_tours": [
    {
      "id": "prod_tour_3d_fraser_island",
      "title": "3 Day Fraser Island Explorer",
      "duration_days": 3,
      "location": "Fraser Island",
      "thumbnail": "https://..."
    },
    {
      "id": "prod_tour_5d_ultimate_adventure",
      "title": "5 Day Ultimate Adventure",
      "duration_days": 5,
      "location": "Cape York",
      "thumbnail": "https://..."
    }
  ],
  "count": 2,
  "applicable_to_all": false
}
```

#### POST /admin/addons/:id/applicable-tours
**Description:** Update tour mappings for addon

**Request:**
```http
POST /admin/addons/prod_addon_kayaking_123/applicable-tours
Authorization: Bearer {admin_token}
Content-Type: application/json

{
  "tour_ids": [
    "prod_tour_3d_fraser_island",
    "prod_tour_5d_ultimate_adventure",
    "prod_tour_3d_noosa_hinterland"
  ],
  "replace": true  // true = replace all, false = append
}
```

**Response:**
```json
{
  "success": true,
  "addon_id": "prod_addon_kayaking_123",
  "updated_mappings": {
    "previous_count": 2,
    "new_count": 3,
    "added": ["prod_tour_3d_noosa_hinterland"],
    "removed": [],
    "unchanged": [
      "prod_tour_3d_fraser_island",
      "prod_tour_5d_ultimate_adventure"
    ]
  },
  "timestamp": "2025-11-08T14:30:00Z"
}
```

#### GET /admin/tours/:id/available-addons
**Description:** Get all addons available for this tour

**Request:**
```http
GET /admin/tours/prod_tour_3d_fraser_island/available-addons
Authorization: Bearer {admin_token}
```

**Response:**
```json
{
  "tour": {
    "id": "prod_tour_3d_fraser_island",
    "title": "3 Day Fraser Island Explorer",
    "duration_days": 3
  },
  "available_addons": [
    {
      "id": "prod_addon_gourmet_bbq",
      "title": "Gourmet Beach BBQ",
      "category": "Food & Beverage",
      "price": 18000,
      "unit": "per_booking"
    },
    {
      "id": "prod_addon_kayaking_123",
      "title": "Kayaking Adventure",
      "category": "Activities",
      "price": 7500,
      "unit": "per_day"
    }
  ],
  "count": 8,
  "grouped_by_category": {
    "Food & Beverage": 2,
    "Activities": 3,
    "Photography": 2,
    "Connectivity": 1
  }
}
```

#### POST /admin/tours/:id/quick-add-addon
**Description:** Quick add addon to tour from tour page

**Request:**
```http
POST /admin/tours/prod_tour_3d_fraser_island/quick-add-addon
Authorization: Bearer {admin_token}
Content-Type: application/json

{
  "addon_id": "prod_addon_glamping_789"
}
```

**Response:**
```json
{
  "success": true,
  "tour_id": "prod_tour_3d_fraser_island",
  "addon_id": "prod_addon_glamping_789",
  "message": "Glamping Setup added to 3 Day Fraser Island Explorer"
}
```

**Note:** This endpoint updates the addon's `applicable_tours` array behind the scenes.

---

## 3. TYPESCRIPT TYPES

### 3.1 Core Types

```typescript
// src/lib/types/addon-mapping.ts

/**
 * Product metadata for addons
 */
export interface AddonMetadata {
  addon: true
  category: AddonCategory
  unit: "per_booking" | "per_day" | "per_person"

  // Mapping fields
  applicable_tours: string[]  // Array of tour product IDs
  applicable_to_all_tours?: boolean
  excluded_tours?: string[]  // If applicable_to_all_tours = true
  mapping_rules?: MappingRules

  // Audit
  last_mapping_update?: string  // ISO 8601 timestamp
  mapping_updated_by?: string   // Admin user ID
}

/**
 * Product metadata for tours
 */
export interface TourMetadata {
  is_tour: true
  duration_days: number
  location: string
  category: string
  difficulty: "Easy" | "Moderate" | "Challenging"
  max_participants: number
}

/**
 * Addon categories
 */
export type AddonCategory =
  | "Food & Beverage"
  | "Connectivity"
  | "Photography"
  | "Accommodation"
  | "Activities"

/**
 * Mapping rules for advanced filtering
 */
export interface MappingRules {
  require_multi_day?: boolean
  require_location?: string[]
  max_participants_limit?: number
  min_participants_limit?: number
  seasonal_availability?: {
    start_month: number  // 1-12
    end_month: number    // 1-12
  }
}

/**
 * Tour product with metadata
 */
export interface TourProduct {
  id: string
  handle: string
  title: string
  subtitle?: string
  description?: string
  thumbnail?: string
  status: "draft" | "published"
  collection_id: string
  metadata: TourMetadata
  created_at: Date
  updated_at: Date
}

/**
 * Addon product with metadata
 */
export interface AddonProduct {
  id: string
  handle: string
  title: string
  description?: string
  thumbnail?: string
  status: "draft" | "published"
  collection_id: string
  metadata: AddonMetadata
  variants: ProductVariant[]
  created_at: Date
  updated_at: Date
}

/**
 * Mapping validation result
 */
export interface MappingValidationResult {
  isValid: boolean
  errors: ValidationError[]
  warnings: ValidationWarning[]
  suggestions: TourSuggestion[]
}

export interface ValidationError {
  field: string
  message: string
  severity: "error"
}

export interface ValidationWarning {
  field: string
  message: string
  severity: "warning"
  dismissible: boolean
}

export interface TourSuggestion {
  tour: TourProduct
  reason: string
  confidence: number  // 0-1
}

/**
 * Mapping update result
 */
export interface MappingUpdateResult {
  success: boolean
  addon_id: string
  previous_count: number
  new_count: number
  added: string[]
  removed: string[]
  unchanged: string[]
  timestamp: string
}
```

### 3.2 React Component Types

```typescript
// Widget prop types
export interface AddonTourMappingWidgetProps {
  data: DetailWidgetProps<AdminProduct>
}

// State types
export interface AddonMappingState {
  loading: boolean
  editMode: boolean
  saving: boolean
  allTours: TourProduct[]
  selectedTourIds: string[]
  searchQuery: string
  filterCategory: string | null
  filterDuration: "all" | "single" | "multi"
  hasUnsavedChanges: boolean
  validationResult: MappingValidationResult | null
}

// Action types for state management
export type AddonMappingAction =
  | { type: "SET_LOADING"; payload: boolean }
  | { type: "SET_EDIT_MODE"; payload: boolean }
  | { type: "SET_SAVING"; payload: boolean }
  | { type: "SET_TOURS"; payload: TourProduct[] }
  | { type: "SET_SELECTED_TOURS"; payload: string[] }
  | { type: "TOGGLE_TOUR"; payload: string }
  | { type: "SELECT_ALL" }
  | { type: "CLEAR_ALL" }
  | { type: "SET_SEARCH"; payload: string }
  | { type: "SET_FILTER_CATEGORY"; payload: string | null }
  | { type: "SET_FILTER_DURATION"; payload: "all" | "single" | "multi" }
  | { type: "SET_VALIDATION"; payload: MappingValidationResult }
```

---

## 4. UTILITY FUNCTIONS

### 4.1 Mapping Utilities

```typescript
// src/lib/utils/addon-mapping-utils.ts

import type {
  AddonProduct,
  TourProduct,
  MappingValidationResult,
  ValidationError,
  ValidationWarning,
  TourSuggestion
} from "@/lib/types/addon-mapping"

/**
 * Get tours applicable to an addon
 */
export async function getApplicableToursForAddon(
  addonProductId: string,
  productService: any
): Promise<TourProduct[]> {
  const addon = await productService.retrieve(addonProductId, {
    relations: ["metadata"]
  })

  if (!addon.metadata?.addon) {
    throw new Error("Product is not an addon")
  }

  // If applicable to all tours
  if (addon.metadata.applicable_to_all_tours) {
    const [allTours] = await productService.listProducts({
      metadata: { is_tour: true },
      status: "published"
    })

    // Apply exclusions if any
    if (addon.metadata.excluded_tours?.length > 0) {
      return allTours.filter(
        (tour: TourProduct) =>
          !addon.metadata.excluded_tours.includes(tour.id)
      )
    }

    return allTours
  }

  // Get specifically mapped tours
  const tourIds = addon.metadata.applicable_tours || []
  if (tourIds.length === 0) {
    return []
  }

  const tours = await productService.listProducts({
    id: tourIds,
    metadata: { is_tour: true },
    status: "published"
  })

  return tours[0] || []
}

/**
 * Get addons available for a tour
 */
export async function getAvailableAddonsForTour(
  tourProductId: string,
  productService: any
): Promise<AddonProduct[]> {
  const [allAddons] = await productService.listProducts({
    metadata: { addon: true },
    status: "published"
  }, {
    relations: ["variants", "variants.prices"]
  })

  return allAddons.filter((addon: AddonProduct) => {
    // Universal addons
    if (addon.metadata?.applicable_to_all_tours) {
      // Check exclusions
      if (addon.metadata.excluded_tours?.includes(tourProductId)) {
        return false
      }
      return true
    }

    // Explicitly mapped addons
    return addon.metadata?.applicable_tours?.includes(tourProductId)
  })
}

/**
 * Validate tour mappings
 */
export async function validateTourMappings(
  addonProduct: AddonProduct,
  selectedTourIds: string[],
  productService: any
): Promise<MappingValidationResult> {
  const errors: ValidationError[] = []
  const warnings: ValidationWarning[] = []
  const suggestions: TourSuggestion[] = []

  // Validate tour IDs exist
  const tours: TourProduct[] = []
  for (const tourId of selectedTourIds) {
    try {
      const tour = await productService.retrieve(tourId)
      if (!tour.metadata?.is_tour) {
        errors.push({
          field: "tour_id",
          message: `Product ${tourId} is not a tour`,
          severity: "error"
        })
      } else {
        tours.push(tour)
      }
    } catch (e) {
      errors.push({
        field: "tour_id",
        message: `Invalid tour ID: ${tourId}`,
        severity: "error"
      })
    }
  }

  // Category-based validation
  const category = addonProduct.metadata?.category

  if (category === "Accommodation") {
    const singleDayTours = tours.filter(t => t.metadata.duration_days === 1)
    if (singleDayTours.length > 0) {
      warnings.push({
        field: "category_mismatch",
        message: `Accommodation addon mapped to ${singleDayTours.length} single-day tour(s). ` +
                 `Consider removing: ${singleDayTours.map(t => t.title).join(", ")}`,
        severity: "warning",
        dismissible: true
      })
    }
  }

  if (category === "Activities") {
    const nonBeachTours = tours.filter(t =>
      !t.metadata.location?.toLowerCase().includes("beach") &&
      !t.metadata.location?.toLowerCase().includes("island")
    )
    if (nonBeachTours.length > 0) {
      warnings.push({
        field: "category_mismatch",
        message: `Activities addon mapped to non-beach/island tours. ` +
                 `Verify compatibility: ${nonBeachTours.map(t => t.title).join(", ")}`,
        severity: "warning",
        dismissible: true
      })
    }
  }

  // Empty mapping warning
  if (selectedTourIds.length === 0) {
    warnings.push({
      field: "empty_mapping",
      message: "This addon is not mapped to any tours and won't be available for booking.",
      severity: "warning",
      dismissible: false
    })
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    suggestions
  }
}

/**
 * Get suggested tours for an addon
 */
export async function getSuggestedTours(
  addonProduct: AddonProduct,
  currentlySelected: string[],
  productService: any
): Promise<TourSuggestion[]> {
  const category = addonProduct.metadata?.category

  const [allTours] = await productService.listProducts({
    metadata: { is_tour: true },
    status: "published"
  })

  // Filter already selected tours
  const unselectedTours = allTours.filter(
    (tour: TourProduct) => !currentlySelected.includes(tour.id)
  )

  const suggestions: TourSuggestion[] = []

  for (const tour of unselectedTours) {
    let confidence = 0.5  // Base confidence
    let reason = "Suggested based on tour type"

    // Category-based suggestions
    if (category === "Accommodation") {
      if (tour.metadata.duration_days > 1) {
        confidence = 0.9
        reason = "Multi-day tour suitable for accommodation addons"
      } else {
        confidence = 0.1
        reason = "Single-day tour (unlikely to need accommodation)"
      }
    }

    if (category === "Activities") {
      if (
        tour.metadata.location?.toLowerCase().includes("beach") ||
        tour.metadata.location?.toLowerCase().includes("island")
      ) {
        confidence = 0.85
        reason = "Beach/island tour suitable for water activities"
      }
    }

    if (category === "Food & Beverage") {
      confidence = 0.8
      reason = "Food & beverage addons typically apply to all tours"
    }

    if (category === "Photography") {
      confidence = 0.8
      reason = "Photography packages enhance all tour experiences"
    }

    // Add high-confidence suggestions only
    if (confidence >= 0.7) {
      suggestions.push({
        tour,
        reason,
        confidence
      })
    }
  }

  // Sort by confidence (highest first)
  return suggestions.sort((a, b) => b.confidence - a.confidence)
}

/**
 * Update addon tour mappings
 */
export async function updateAddonTourMappings(
  addonProductId: string,
  newTourIds: string[],
  replace: boolean,
  productService: any
): Promise<MappingUpdateResult> {
  const addon = await productService.retrieve(addonProductId)

  if (!addon.metadata?.addon) {
    throw new Error("Product is not an addon")
  }

  const previousTourIds = addon.metadata.applicable_tours || []

  let updatedTourIds: string[] = newTourIds

  if (!replace) {
    // Append mode: merge with existing
    updatedTourIds = [...new Set([...previousTourIds, ...newTourIds])]
  }

  // Calculate diff
  const added = updatedTourIds.filter(id => !previousTourIds.includes(id))
  const removed = previousTourIds.filter(id => !updatedTourIds.includes(id))
  const unchanged = updatedTourIds.filter(id => previousTourIds.includes(id))

  // Update product
  await productService.updateProducts(addonProductId, {
    metadata: {
      ...addon.metadata,
      applicable_tours: updatedTourIds,
      last_mapping_update: new Date().toISOString()
    }
  })

  return {
    success: true,
    addon_id: addonProductId,
    previous_count: previousTourIds.length,
    new_count: updatedTourIds.length,
    added,
    removed,
    unchanged,
    timestamp: new Date().toISOString()
  }
}

/**
 * Group tours by category
 */
export function groupToursByCategory(
  tours: TourProduct[]
): Record<string, TourProduct[]> {
  return tours.reduce((acc, tour) => {
    const category = tour.metadata.category || "Other"
    if (!acc[category]) {
      acc[category] = []
    }
    acc[category].push(tour)
    return acc
  }, {} as Record<string, TourProduct[]>)
}

/**
 * Group tours by duration
 */
export function groupToursByDuration(
  tours: TourProduct[]
): { singleDay: TourProduct[]; multiDay: TourProduct[] } {
  return {
    singleDay: tours.filter(t => t.metadata.duration_days === 1),
    multiDay: tours.filter(t => t.metadata.duration_days > 1)
  }
}

/**
 * Filter tours by search query
 */
export function filterToursBySearch(
  tours: TourProduct[],
  query: string
): TourProduct[] {
  if (!query.trim()) {
    return tours
  }

  const lowerQuery = query.toLowerCase()

  return tours.filter(tour =>
    tour.title.toLowerCase().includes(lowerQuery) ||
    tour.handle.toLowerCase().includes(lowerQuery) ||
    tour.metadata.location?.toLowerCase().includes(lowerQuery) ||
    tour.metadata.category?.toLowerCase().includes(lowerQuery)
  )
}

/**
 * Get tour preset selections
 */
export function applyTourPreset(
  preset: string,
  allTours: TourProduct[]
): string[] {
  switch (preset) {
    case "all":
      return allTours.map(t => t.id)

    case "multi-day":
      return allTours
        .filter(t => t.metadata.duration_days > 1)
        .map(t => t.id)

    case "single-day":
      return allTours
        .filter(t => t.metadata.duration_days === 1)
        .map(t => t.id)

    case "fraser-island":
      return allTours
        .filter(t =>
          t.metadata.location?.toLowerCase().includes("fraser island")
        )
        .map(t => t.id)

    case "beach-tours":
      return allTours
        .filter(t =>
          t.metadata.category?.toLowerCase().includes("beach")
        )
        .map(t => t.id)

    default:
      return []
  }
}
```

---

## 5. REACT HOOKS

### 5.1 Custom Hooks

```typescript
// src/admin/hooks/use-addon-tour-mapping.ts

import { useState, useEffect, useCallback } from "react"
import type {
  AddonProduct,
  TourProduct,
  MappingValidationResult,
  MappingUpdateResult
} from "@/lib/types/addon-mapping"
import {
  getApplicableToursForAddon,
  validateTourMappings,
  updateAddonTourMappings,
  getSuggestedTours,
  filterToursBySearch,
  applyTourPreset
} from "@/lib/utils/addon-mapping-utils"

export interface UseAddonTourMappingOptions {
  addonProductId: string
  productService: any
  onSaveSuccess?: (result: MappingUpdateResult) => void
  onSaveError?: (error: Error) => void
}

export function useAddonTourMapping({
  addonProductId,
  productService,
  onSaveSuccess,
  onSaveError
}: UseAddonTourMappingOptions) {
  // State
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [allTours, setAllTours] = useState<TourProduct[]>([])
  const [selectedTourIds, setSelectedTourIds] = useState<string[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [validationResult, setValidationResult] =
    useState<MappingValidationResult | null>(null)

  // Load tours
  const loadTours = useCallback(async () => {
    try {
      setLoading(true)

      // Fetch all tours
      const [tours] = await productService.listProducts({
        metadata: { is_tour: true },
        status: "published"
      })
      setAllTours(tours)

      // Load existing mappings
      const applicableTours = await getApplicableToursForAddon(
        addonProductId,
        productService
      )
      setSelectedTourIds(applicableTours.map(t => t.id))
    } catch (error) {
      console.error("Error loading tours:", error)
      throw error
    } finally {
      setLoading(false)
    }
  }, [addonProductId, productService])

  // Initial load
  useEffect(() => {
    loadTours()
  }, [loadTours])

  // Toggle tour selection
  const toggleTour = useCallback((tourId: string) => {
    setSelectedTourIds(prev => {
      if (prev.includes(tourId)) {
        return prev.filter(id => id !== tourId)
      } else {
        return [...prev, tourId]
      }
    })
  }, [])

  // Select all
  const selectAll = useCallback(() => {
    setSelectedTourIds(allTours.map(t => t.id))
  }, [allTours])

  // Clear all
  const clearAll = useCallback(() => {
    setSelectedTourIds([])
  }, [])

  // Apply preset
  const selectPreset = useCallback((preset: string) => {
    const tourIds = applyTourPreset(preset, allTours)
    setSelectedTourIds(tourIds)
  }, [allTours])

  // Validate
  const validate = useCallback(async () => {
    const addon = await productService.retrieve(addonProductId)
    const result = await validateTourMappings(
      addon,
      selectedTourIds,
      productService
    )
    setValidationResult(result)
    return result
  }, [addonProductId, selectedTourIds, productService])

  // Save
  const save = useCallback(async () => {
    try {
      setSaving(true)

      // Validate first
      const validationResult = await validate()
      if (!validationResult.isValid) {
        throw new Error("Validation failed")
      }

      // Save
      const result = await updateAddonTourMappings(
        addonProductId,
        selectedTourIds,
        true,  // replace mode
        productService
      )

      onSaveSuccess?.(result)
      return result
    } catch (error) {
      onSaveError?.(error as Error)
      throw error
    } finally {
      setSaving(false)
    }
  }, [
    addonProductId,
    selectedTourIds,
    productService,
    validate,
    onSaveSuccess,
    onSaveError
  ])

  // Filtered tours
  const filteredTours = filterToursBySearch(allTours, searchQuery)

  return {
    // State
    loading,
    saving,
    allTours,
    filteredTours,
    selectedTourIds,
    searchQuery,
    validationResult,

    // Actions
    setSearchQuery,
    toggleTour,
    selectAll,
    clearAll,
    selectPreset,
    validate,
    save,
    reload: loadTours
  }
}
```

---

## 6. TESTING

### 6.1 Unit Test Examples

```typescript
// src/lib/utils/__tests__/addon-mapping-utils.test.ts

import { describe, test, expect, jest } from "@jest/globals"
import {
  validateTourMappings,
  getSuggestedTours,
  applyTourPreset
} from "../addon-mapping-utils"

describe("validateTourMappings", () => {
  test("returns valid for correct mappings", async () => {
    const addon = {
      metadata: {
        addon: true,
        category: "Food & Beverage",
        applicable_tours: []
      }
    }

    const mockProductService = {
      retrieve: jest.fn().mockResolvedValue({
        metadata: { is_tour: true, duration_days: 3 }
      })
    }

    const result = await validateTourMappings(
      addon as any,
      ["tour_1", "tour_2"],
      mockProductService
    )

    expect(result.isValid).toBe(true)
    expect(result.errors).toHaveLength(0)
  })

  test("warns for accommodation addon on single-day tours", async () => {
    const addon = {
      metadata: {
        addon: true,
        category: "Accommodation",
        applicable_tours: []
      }
    }

    const mockProductService = {
      retrieve: jest.fn().mockResolvedValue({
        metadata: { is_tour: true, duration_days: 1 },
        title: "1 Day Tour"
      })
    }

    const result = await validateTourMappings(
      addon as any,
      ["tour_1"],
      mockProductService
    )

    expect(result.isValid).toBe(true)
    expect(result.warnings.length).toBeGreaterThan(0)
    expect(result.warnings[0].message).toContain("single-day")
  })

  test("errors for invalid tour IDs", async () => {
    const addon = {
      metadata: {
        addon: true,
        category: "Food & Beverage",
        applicable_tours: []
      }
    }

    const mockProductService = {
      retrieve: jest.fn().mockRejectedValue(new Error("Not found"))
    }

    const result = await validateTourMappings(
      addon as any,
      ["invalid_tour_id"],
      mockProductService
    )

    expect(result.isValid).toBe(false)
    expect(result.errors).toHaveLength(1)
    expect(result.errors[0].message).toContain("Invalid tour ID")
  })
})

describe("applyTourPreset", () => {
  const mockTours = [
    {
      id: "tour_1",
      metadata: { duration_days: 1, location: "Rainbow Beach" }
    },
    {
      id: "tour_2",
      metadata: { duration_days: 3, location: "Fraser Island" }
    },
    {
      id: "tour_3",
      metadata: { duration_days: 5, location: "Cape York" }
    }
  ] as TourProduct[]

  test("selects all tours", () => {
    const result = applyTourPreset("all", mockTours)
    expect(result).toEqual(["tour_1", "tour_2", "tour_3"])
  })

  test("selects multi-day only", () => {
    const result = applyTourPreset("multi-day", mockTours)
    expect(result).toEqual(["tour_2", "tour_3"])
  })

  test("selects single-day only", () => {
    const result = applyTourPreset("single-day", mockTours)
    expect(result).toEqual(["tour_1"])
  })
})
```

---

## 7. PERFORMANCE OPTIMIZATION

### 7.1 Memoization

```typescript
import { useMemo } from "react"

// Memoize filtered tours
const filteredTours = useMemo(() => {
  return filterToursBySearch(allTours, searchQuery)
}, [allTours, searchQuery])

// Memoize grouped tours
const groupedTours = useMemo(() => {
  return groupToursByDuration(filteredTours)
}, [filteredTours])
```

### 7.2 Debouncing

```typescript
import { useDebounce } from "use-debounce"

const [searchQuery, setSearchQuery] = useState("")
const [debouncedSearch] = useDebounce(searchQuery, 300)

const filteredTours = useMemo(() => {
  return filterToursBySearch(allTours, debouncedSearch)
}, [allTours, debouncedSearch])
```

### 7.3 Virtual Scrolling (for 100+ tours)

```typescript
import { useVirtual } from "react-virtual"

const parentRef = useRef<HTMLDivElement>(null)

const rowVirtualizer = useVirtual({
  size: filteredTours.length,
  parentRef,
  estimateSize: useCallback(() => 80, [])
})

return (
  <div ref={parentRef} style={{ height: "400px", overflow: "auto" }}>
    <div style={{ height: `${rowVirtualizer.totalSize}px` }}>
      {rowVirtualizer.virtualItems.map(virtualRow => {
        const tour = filteredTours[virtualRow.index]
        return (
          <div
            key={tour.id}
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: `${virtualRow.size}px`,
              transform: `translateY(${virtualRow.start}px)`
            }}
          >
            <TourCheckboxItem tour={tour} />
          </div>
        )
      })}
    </div>
  </div>
)
```

---

## 8. ERROR HANDLING

### 8.1 Error Boundaries

```typescript
// src/admin/components/ErrorBoundary.tsx

import React, { Component, ErrorInfo, ReactNode } from "react"
import { Container, Heading, Text, Button } from "@medusajs/ui"

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export class AddonMappingErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Addon mapping widget error:", error, errorInfo)
  }

  public render() {
    if (this.state.hasError) {
      return (
        <Container>
          <div className="p-6">
            <Heading level="h2">Something went wrong</Heading>
            <Text className="mt-2 text-red-600">
              Failed to load addon-tour mapping widget
            </Text>
            <Text size="small" className="mt-2 text-gray-600">
              {this.state.error?.message}
            </Text>
            <Button
              className="mt-4"
              onClick={() => window.location.reload()}
            >
              Reload Page
            </Button>
          </div>
        </Container>
      )
    }

    return this.props.children
  }
}
```

### 8.2 API Error Handling

```typescript
// Retry logic
async function fetchWithRetry(
  url: string,
  options: RequestInit,
  retries = 3
): Promise<Response> {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url, options)
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }
      return response
    } catch (error) {
      if (i === retries - 1) throw error
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)))
    }
  }
  throw new Error("Max retries exceeded")
}
```

---

## 9. MIGRATION GUIDE

### 9.1 Adding Mapping to Existing Addons

**SQL Script:**
```sql
-- Add applicable_tours field to all existing addons
-- Default to empty array (no tours)

UPDATE product
SET metadata = metadata || '{"applicable_tours": []}'::jsonb
WHERE metadata->>'addon' = 'true'
  AND NOT (metadata ? 'applicable_tours');
```

**Migration Script:**
```typescript
// src/scripts/migrate-addon-mappings.ts

import { MedusaContainer } from "@medusajs/framework/types"
import { Modules } from "@medusajs/framework/utils"

export async function migrateAddonMappings(
  container: MedusaContainer
): Promise<void> {
  const productService = container.resolve(Modules.PRODUCT)

  console.log("Migrating addon mappings...")

  // Get all addon products
  const [addons] = await productService.listProducts({
    metadata: { addon: true }
  })

  for (const addon of addons) {
    // Skip if already has mapping
    if (addon.metadata?.applicable_tours) {
      console.log(`✓ ${addon.handle} already has mappings`)
      continue
    }

    // Add empty mapping array
    await productService.updateProducts(addon.id, {
      metadata: {
        ...addon.metadata,
        applicable_tours: [],
        last_mapping_update: new Date().toISOString()
      }
    })

    console.log(`✓ Migrated ${addon.handle}`)
  }

  console.log("Migration complete!")
}
```

---

**END OF TECHNICAL SPECIFICATIONS**
