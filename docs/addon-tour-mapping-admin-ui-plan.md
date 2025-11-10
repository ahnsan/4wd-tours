# Addon-Tour Mapping Admin UI Design Plan
## Medusa Admin Widget for 4WD Tours Project

**Date:** 2025-11-08
**Objective:** Design intuitive Medusa Admin UI for mapping addons to tours
**Status:** Planning Phase

---

## 1. ADMIN WORKFLOW ANALYSIS

### 1.1 User Personas

**Primary Users:**
- **Product Managers** - Configure which addons apply to which tours (weekly/monthly)
- **Tour Managers** - Verify addon availability before tour launches (occasionally)
- **Content Managers** - Update seasonal addons and tour offerings (monthly)

**Secondary Users:**
- **Marketing Team** - Review addon-tour combinations for campaigns (ad-hoc)
- **Operations** - Audit addon inventory and tour configurations (quarterly)

### 1.2 Usage Frequency

| Task | Frequency | User Role |
|------|-----------|-----------|
| Map new addon to multiple tours | Weekly | Product Manager |
| Update addon availability for tour | Monthly | Tour Manager |
| Bulk update seasonal addons | Quarterly | Product Manager |
| Review addon-tour relationships | Ad-hoc | Marketing/Operations |

### 1.3 Workflow Location Decision

**RECOMMENDED APPROACH: Dual-Location Strategy**

#### Primary Location: Addon Product Page (Edit Mode)
**Why Primary:**
- Addons are created AFTER tours (16 addons → 21+ tours)
- When adding new addon, admin asks: "Which tours can use this?"
- More efficient to select multiple tours from one addon
- Natural workflow: Create addon → Configure applicable tours

#### Secondary Location: Tour Product Page (Read-Only + Quick Add)
**Why Secondary:**
- Useful for verification: "What addons work with this tour?"
- Quick-add for exceptional cases
- Audit trail for tour launch checklists
- Warning system if tour has zero addons

---

## 2. UI COMPONENT DESIGN

### 2.A. PRIMARY UI: Addon Product Page

**Location:** Product Details Page → "Applicable Tours" Widget
**Zone:** `product.details.after`
**File:** `/src/admin/widgets/addon-tour-mapping.tsx`

#### 2.A.1 Component Layout

```
┌────────────────────────────────────────────────────────┐
│ APPLICABLE TOURS                                    [i]│
│ Configure which tours can include this addon          │
├────────────────────────────────────────────────────────┤
│                                                         │
│ [Edit Applicable Tours]                                │
│                                                         │
│ ┌────────────────────────────────────────────────────┐│
│ │ Currently Applies To: 3 Tours                      ││
│ │                                                     ││
│ │ ✓ 1 Day Rainbow Beach Tour                        ││
│ │ ✓ 3 Day Fraser Island Explorer                    ││
│ │ ✓ 5 Day Ultimate Adventure                        ││
│ └────────────────────────────────────────────────────┘│
│                                                         │
└────────────────────────────────────────────────────────┘
```

#### 2.A.2 Edit Mode UI

```
┌────────────────────────────────────────────────────────┐
│ APPLICABLE TOURS                                    [i]│
│ Select tours where this addon will be available       │
├────────────────────────────────────────────────────────┤
│                                                         │
│ Quick Actions:                                         │
│ [Select All Tours] [Select Multi-Day Only] [Clear All]│
│                                                         │
│ ┌────────────────────────────────────────────────────┐│
│ │ 🔍 Filter tours...                          [Search]││
│ │                                                     ││
│ │ ☐ Select All (21 tours)                           ││
│ │                                                     ││
│ │ 1 DAY TOURS (4 tours)                              ││
│ │ ──────────────────────────────────────────         ││
│ │ ☑ 1 Day Rainbow Beach Tour        📷 [View]       ││
│ │ ☐ 1 Day Noosa Everglades           📷 [View]       ││
│ │ ☑ 1 Day Coolum Beach 4WD            📷 [View]       ││
│ │ ☐ 1 Day Sunshine Coast Explorer    📷 [View]       ││
│ │                                                     ││
│ │ MULTI-DAY TOURS (8 tours)                          ││
│ │ ──────────────────────────────────────────         ││
│ │ ☑ 3 Day Fraser Island Explorer     📷 [View]       ││
│ │ ☐ 3 Day Noosa Hinterland           📷 [View]       ││
│ │ ☑ 5 Day Ultimate Adventure          📷 [View]       ││
│ │ ... (show more)                                    ││
│ │                                                     ││
│ │ CUSTOM TOURS (9 tours)                             ││
│ │ ──────────────────────────────────────────         ││
│ │ ☐ Custom 2-Day Coastal Escape      📷 [View]       ││
│ │ ... (show more)                                    ││
│ └────────────────────────────────────────────────────┘│
│                                                         │
│ ⚠ Warning: This addon is not applicable to any tours  │
│                                                         │
│ [Cancel]                          [Save Tour Mappings] │
└────────────────────────────────────────────────────────┘
```

#### 2.A.3 Features & Interactions

**Visual Tour Cards:**
```tsx
┌──────────────────────────────────────────┐
│ ☑ 3 Day Fraser Island Explorer           │
│ ─────────────────────────────────────────│
│ [Thumbnail]   3 days • $6,000 AUD        │
│               Max 7 guests                │
│               📍 Fraser Island            │
└──────────────────────────────────────────┘
```

**Filter/Search:**
- Text search by tour name
- Filter by duration (1-day, multi-day, custom)
- Filter by location (Rainbow Beach, Fraser Island, Noosa, etc.)
- Filter by price range
- "Show only unmapped tours" toggle

**Bulk Actions:**
- "Select All Tours" - Maps addon to all 21 tours
- "Select Multi-Day Only" - Maps to tours with duration_days > 1
- "Select by Category" - Food addons → all tours, Glamping → multi-day only
- "Clear All" - Removes all mappings

**Smart Suggestions (Nice-to-Have):**
```
💡 Suggestion: Based on similar addons, consider adding to:
   • 5 Day Cape York Expedition
   • 3 Day Noosa Hinterland
   [Add Suggested] [Dismiss]
```

**Validation Rules:**
- ⚠ Warning if 0 tours selected (allows universal addons)
- ✓ Success message: "This addon applies to 8 tours"
- 🔔 Notification: "Addon now available on storefront for selected tours"

#### 2.A.4 Data Model

**Storage:** `product.metadata.applicable_tours`

```typescript
// Addon Product Metadata
{
  metadata: {
    addon: true,
    category: "Food & Beverage",
    unit: "per_booking",

    // NEW FIELD: Tour Mapping
    applicable_tours: [
      "prod_01H...", // 1 Day Rainbow Beach Tour ID
      "prod_01H...", // 3 Day Fraser Island Explorer ID
      "prod_01H..."  // 5 Day Ultimate Adventure ID
    ],

    // OPTIONAL: Mapping metadata
    applicable_to_all_tours: false, // If true, ignore array above
    last_mapping_update: "2025-11-08T10:30:00Z",
    mapping_updated_by: "admin_user_id"
  }
}
```

**Alternative Approach (If Medusa Links are preferred):**
Use Medusa's Link Module for relationships:
```typescript
// Create link between addon and tour products
await remoteLink.create([{
  [Modules.PRODUCT]: {
    product_id: addonProductId
  },
  "applicable_tours": {
    tour_id: tourProductId
  }
}])
```

---

### 2.B. SECONDARY UI: Tour Product Page

**Location:** Product Details Page → "Available Add-ons" Widget
**Zone:** `product.details.after`
**File:** `/src/admin/widgets/tour-available-addons.tsx`

#### 2.B.1 Component Layout (Read-Only + Quick Add)

```
┌────────────────────────────────────────────────────────┐
│ AVAILABLE ADD-ONS FOR THIS TOUR                     [i]│
│ View and manage addons available for this tour        │
├────────────────────────────────────────────────────────┤
│                                                         │
│ 8 addons available for this tour                      │
│                                                         │
│ Food & Beverage (2)                                    │
│ ────────────────────────────────────────────────       │
│ • Gourmet Beach BBQ - $180.00                          │
│ • Picnic Hamper - $85.00                               │
│                                                         │
│ Photography (2)                                        │
│ ────────────────────────────────────────────────       │
│ • Aerial Photography Package - $200.00                 │
│ • GoPro Package - $75.00                               │
│                                                         │
│ Connectivity (2)                                       │
│ ────────────────────────────────────────────────       │
│ • Portable Internet - $30.00/day                       │
│ • Starlink Satellite - $50.00/day                      │
│                                                         │
│ Activities (2)                                         │
│ ────────────────────────────────────────────────       │
│ • Fishing Equipment - $65.00/day                       │
│ • Sandboarding Gear - $45.00/day                       │
│                                                         │
│ ⚠ Warning: 0 addons available for this tour           │
│ → Configure addons from the addon product pages        │
│                                                         │
│ [+ Quick Add Addon]                                    │
└────────────────────────────────────────────────────────┘
```

#### 2.B.2 Quick Add Modal

```
┌──────────────────────────────────────────┐
│ Quick Add Addon to Tour               [×]│
├──────────────────────────────────────────┤
│                                           │
│ Select an addon to add to this tour:     │
│                                           │
│ 🔍 Search addons...                      │
│                                           │
│ ☐ Gourmet Beach BBQ - $180               │
│ ☐ Seafood Platter - $150                 │
│ ☐ Glamping Setup - $250/day              │
│ ☐ Beach Cabana - $180/day                │
│ ... (show more)                          │
│                                           │
│ [Cancel]                     [Add Addon] │
└──────────────────────────────────────────┘
```

**Purpose:**
- Quick verification before tour launch
- Emergency addition of addon to specific tour
- Audit view for operations team
- **Note:** For bulk operations, use addon page instead

---

## 3. MEDUSA ADMIN CUSTOMIZATION

### 3.1 Implementation Approach

**Option 1: Admin Widgets (RECOMMENDED)**
- Use Medusa Admin SDK widget system
- Define widget zones for product pages
- No core Medusa code changes required
- Clean separation of concerns

**File Structure:**
```
src/admin/widgets/
├── addon-tour-mapping.tsx          (Primary: Addon → Tours)
├── tour-available-addons.tsx       (Secondary: Tour → Addons)
└── shared/
    ├── tour-selector.tsx           (Reusable tour checkbox list)
    └── addon-display.tsx           (Reusable addon display card)
```

**Widget Configuration:**
```typescript
// addon-tour-mapping.tsx
import { defineWidgetConfig } from "@medusajs/admin-sdk"

export const config = defineWidgetConfig({
  zone: "product.details.after",
})

// Only show for addon products
const isAddonProduct = product.metadata?.addon === true

if (!isAddonProduct) {
  return null
}
```

### 3.2 Medusa Components to Use

**From `@medusajs/ui`:**
- `Container` - Widget wrapper
- `Heading` - Section titles
- `Button` - Actions
- `Checkbox` - Tour selection
- `Input` - Search/filter
- `Badge` - Tour categories, counts
- `Toast` - Success/error notifications
- `Tooltip` - Help text
- `IconButton` - Quick actions
- `Select` - Filter dropdowns

**Icons from `@medusajs/icons`:**
- `Plus` - Add addon
- `Trash` - Remove mapping
- `MagnifyingGlass` - Search
- `CheckCircle` - Success
- `ExclamationCircle` - Warning

### 3.3 API Requirements

**New Admin API Endpoints (Optional):**

```typescript
// GET /admin/products/:addonId/applicable-tours
// Returns list of tours this addon is mapped to

// POST /admin/products/:addonId/applicable-tours
// Updates tour mappings for addon
{
  tour_ids: ["prod_01...", "prod_02..."],
  replace: true // or false to append
}

// GET /admin/products/:tourId/available-addons
// Returns list of addons available for this tour
```

**Alternative: Use existing product update endpoint:**
```typescript
// POST /admin/products/:id
{
  metadata: {
    applicable_tours: ["prod_01...", "prod_02..."]
  }
}
```

### 3.4 Documentation Reference

**Medusa Admin Customization:**
- Medusa Admin SDK: `@medusajs/admin-sdk`
- Widget Zones: `product.details.before`, `product.details.after`
- Admin UI Components: `@medusajs/ui`
- Example: `/src/admin/widgets/tour-content-editor.tsx` (existing)

**Best Practices (from existing widgets):**
1. Use `defineWidgetConfig` for zone injection
2. Check product type before rendering (e.g., `metadata.addon`)
3. Use `DetailWidgetProps<AdminProduct>` for typing
4. Handle loading/saving states with `useState`
5. Use `toast` for user feedback
6. Validate before saving
7. Fetch dependencies on `useEffect`

---

## 4. DATA VALIDATION

### 4.1 Validation Rules

**On Save:**
```typescript
const validateTourMapping = (addonProduct, selectedTourIds) => {
  const errors = []

  // Optional: Allow 0 tours for "universal" addons
  if (selectedTourIds.length === 0) {
    warnings.push("This addon is not mapped to any tours")
  }

  // Validate tour IDs exist
  for (const tourId of selectedTourIds) {
    const tour = await productService.retrieve(tourId)
    if (!tour || !tour.metadata?.is_tour) {
      errors.push(`Invalid tour ID: ${tourId}`)
    }
  }

  // Check for logical consistency
  if (addonProduct.metadata?.category === "Accommodation") {
    const singleDayTours = selectedTourIds.filter(id => {
      const tour = tours.find(t => t.id === id)
      return tour?.metadata?.duration_days === 1
    })
    if (singleDayTours.length > 0) {
      warnings.push("Glamping addon mapped to 1-day tours (may not be applicable)")
    }
  }

  return { errors, warnings }
}
```

### 4.2 Business Logic Validation

**Category-Based Recommendations:**

| Addon Category | Recommended For | Warning If Mapped To |
|----------------|-----------------|---------------------|
| Food & Beverage | All tours | None |
| Connectivity | All tours | None |
| Photography | All tours | None |
| Accommodation | Multi-day tours (2+ days) | 1-day tours |
| Activities | Beach/water tours | City tours |

**Implementation:**
```typescript
const getCategoryRecommendations = (category: string, tours: Tour[]) => {
  switch(category) {
    case "Accommodation":
      return tours.filter(t => t.metadata.duration_days > 1)
    case "Activities":
      return tours.filter(t =>
        t.metadata.location?.includes("Beach") ||
        t.metadata.location?.includes("Island")
      )
    default:
      return tours // All tours
  }
}
```

### 4.3 Error Handling

**UI Error States:**
- ❌ **Critical Error:** Cannot save - invalid tour IDs
- ⚠️ **Warning:** Can save - but notify admin of potential issues
- ℹ️ **Info:** Helpful suggestions

**Toast Notifications:**
```typescript
// Success
toast.success("Tour mappings saved", {
  description: "This addon is now available on 8 tours"
})

// Warning
toast.warning("Accommodation addon mapped to 1-day tour", {
  description: "Consider removing 1-day tours for accommodation addons"
})

// Error
toast.error("Failed to save tour mappings", {
  description: "Invalid tour IDs detected. Please review selections."
})
```

---

## 5. USER EXPERIENCE DESIGN

### 5.1 Bulk Operations

**Scenario: New "Kayaking Adventure" addon**

Admin workflow:
1. Create addon product with details
2. Navigate to "Applicable Tours" widget
3. Click "Select Multi-Day Only" (8 tours selected)
4. Uncheck 2 tours that don't have water access
5. Click "Save Tour Mappings"
6. Toast: "✓ Kayaking Adventure is now available on 6 tours"

**Time saved:** 2 minutes vs. individually checking 21 tours

### 5.2 Templates & Presets

**Quick Select Buttons:**
```typescript
const TOUR_PRESETS = {
  "All Tours": (tours) => tours,
  "Multi-Day Only": (tours) => tours.filter(t => t.metadata.duration_days > 1),
  "Fraser Island Tours": (tours) => tours.filter(t =>
    t.metadata.location?.includes("Fraser Island")
  ),
  "Beach Tours": (tours) => tours.filter(t =>
    t.metadata.category === "4WD Beach Tour"
  ),
  "Adventure Tours": (tours) => tours.filter(t =>
    t.metadata.difficulty === "Moderate" ||
    t.metadata.difficulty === "Challenging"
  )
}
```

**UI Implementation:**
```tsx
<div className="preset-buttons">
  <Button onClick={() => selectPreset("All Tours")}>
    Select All Tours
  </Button>
  <Button onClick={() => selectPreset("Multi-Day Only")}>
    Multi-Day Only (8)
  </Button>
  <Button onClick={() => selectPreset("Fraser Island Tours")}>
    Fraser Island (5)
  </Button>
  <Button onClick={() => selectPreset("Beach Tours")}>
    Beach Tours (12)
  </Button>
</div>
```

### 5.3 Preview & Feedback

**Before Save - Live Preview:**
```
┌────────────────────────────────────────┐
│ Preview: Addon Availability            │
├────────────────────────────────────────┤
│ This addon will appear on:             │
│                                         │
│ 📊 8 tours selected                    │
│ 💰 Potential revenue: $1,600/day       │
│ 🏝️ Locations: Fraser Island (5),      │
│               Rainbow Beach (2),       │
│               Noosa (1)                │
│                                         │
│ Customers viewing these tours will     │
│ see this addon in the "Add-ons" step   │
│ during checkout.                       │
└────────────────────────────────────────┘
```

**After Save - Confirmation:**
```
✓ Tour mappings saved successfully!

This addon is now available on:
• 1 Day Rainbow Beach Tour
• 3 Day Fraser Island Explorer
• 5 Day Ultimate Adventure
... (5 more)

[View on Storefront] [Edit Mappings]
```

### 5.4 Auto-Save vs Manual Save

**RECOMMENDATION: Manual Save**

**Reasons:**
- Bulk operations require review before commit
- Prevents accidental mappings
- Allows cancel/undo
- Consistent with Medusa Admin patterns

**Implementation:**
```tsx
const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)

// Warn before leaving page
useEffect(() => {
  if (hasUnsavedChanges) {
    window.onbeforeunload = () =>
      "You have unsaved changes. Are you sure you want to leave?"
  }
  return () => { window.onbeforeunload = null }
}, [hasUnsavedChanges])
```

---

## 6. USER WORKFLOW DIAGRAM

```
┌─────────────────────────────────────────────────────────────┐
│                   ADDON-TOUR MAPPING WORKFLOW                │
└─────────────────────────────────────────────────────────────┘

PRIMARY WORKFLOW (Addon → Tours)
──────────────────────────────────

Admin: "I want to add a new kayaking addon"

1. Navigate to Products → Add-ons Collection
   ↓
2. Click "+ New Product"
   ↓
3. Fill in addon details:
   - Title: "Kayaking Adventure"
   - Price: $75/day
   - Category: "Activities"
   - Description: "Explore coastal waterways..."
   ↓
4. Scroll to "Applicable Tours" widget
   ↓
5. Click "Edit Applicable Tours"
   ↓
6. Use quick select: "Multi-Day Only" (8 tours)
   ↓
7. Review list, uncheck "3 Day Desert Tour" (no water)
   ↓
8. Preview: "This addon applies to 7 tours"
   ↓
9. Click "Save Tour Mappings"
   ↓
10. Toast: "✓ Kayaking Adventure available on 7 tours"
    ↓
11. Addon appears in storefront for those 7 tours


SECONDARY WORKFLOW (Tour → Addons)
────────────────────────────────────

Admin: "I'm launching a new tour, what addons are available?"

1. Navigate to Products → Tours Collection
   ↓
2. Select "3 Day Coastal Explorer" (new tour)
   ↓
3. Scroll to "Available Add-ons" widget
   ↓
4. See: "⚠ 0 addons available for this tour"
   ↓
5. Click "Quick Add Addon"
   ↓
6. Select from list:
   ☑ Gourmet Beach BBQ
   ☑ GoPro Package
   ☑ Portable Internet
   ↓
7. Click "Add Addons" → Updates addon products
   ↓
8. Widget refreshes: "3 addons available"
   ↓
9. Launch tour with addon support


BULK UPDATE WORKFLOW
──────────────────────

Admin: "Summer season - enable glamping for all multi-day tours"

1. Navigate to Addon: "Glamping Setup"
   ↓
2. Click "Edit Applicable Tours"
   ↓
3. Click "Select Multi-Day Only" preset
   ↓
4. System selects 8 tours automatically
   ↓
5. Review selections in grouped list view
   ↓
6. Click "Save Tour Mappings"
   ↓
7. Toast: "✓ Glamping Setup now on 8 tours"
   ↓
8. Repeat for other seasonal addons
```

---

## 7. REQUIRED MEDUSA CUSTOMIZATIONS

### 7.1 File Structure

```
src/admin/
├── widgets/
│   ├── addon-tour-mapping.tsx           (PRIMARY: Addon page widget)
│   ├── tour-available-addons.tsx        (SECONDARY: Tour page widget)
│   ├── tour-content-editor.tsx          (EXISTING)
│   ├── product-price-manager.tsx        (EXISTING)
│   └── blog-post-products.tsx           (EXISTING)
│
└── shared/
    └── components/
        ├── tour-selector.tsx            (Reusable tour list component)
        ├── tour-card.tsx                (Individual tour card)
        ├── addon-category-badge.tsx     (Category display)
        └── mapping-preview.tsx          (Save preview summary)
```

### 7.2 Type Definitions

```typescript
// src/lib/types/addon-mapping.ts

export interface AddonTourMapping {
  addon_product_id: string
  applicable_tours: string[]  // Array of tour product IDs
  applicable_to_all_tours: boolean
  last_updated: string
  updated_by: string
}

export interface TourProduct {
  id: string
  handle: string
  title: string
  metadata: {
    is_tour: true
    duration_days: number
    location: string
    category: string
    difficulty: string
    max_participants: number
  }
}

export interface AddonProduct {
  id: string
  handle: string
  title: string
  metadata: {
    addon: true
    category: string
    unit: "per_booking" | "per_day" | "per_person"
    applicable_tours: string[]
    applicable_to_all_tours?: boolean
  }
}

export interface MappingValidationResult {
  isValid: boolean
  errors: string[]
  warnings: string[]
  suggestions: TourProduct[]
}
```

### 7.3 Utility Functions

```typescript
// src/lib/utils/addon-mapping.ts

/**
 * Get all tours that an addon applies to
 */
export async function getApplicableToursForAddon(
  addonProductId: string,
  productService: any
): Promise<TourProduct[]> {
  const addon = await productService.retrieve(addonProductId)

  if (addon.metadata?.applicable_to_all_tours) {
    // Return all tour products
    const [tours] = await productService.listProducts({
      metadata: { is_tour: true },
      status: "published"
    })
    return tours
  }

  const tourIds = addon.metadata?.applicable_tours || []
  const tours = await Promise.all(
    tourIds.map(id => productService.retrieve(id))
  )

  return tours.filter(tour => tour.metadata?.is_tour === true)
}

/**
 * Get all addons available for a tour
 */
export async function getAvailableAddonsForTour(
  tourProductId: string,
  productService: any
): Promise<AddonProduct[]> {
  const [allAddons] = await productService.listProducts({
    metadata: { addon: true },
    status: "published"
  })

  return allAddons.filter((addon: AddonProduct) => {
    if (addon.metadata?.applicable_to_all_tours) {
      return true
    }
    return addon.metadata?.applicable_tours?.includes(tourProductId)
  })
}

/**
 * Validate tour mappings before save
 */
export async function validateTourMappings(
  addonProduct: AddonProduct,
  selectedTourIds: string[],
  productService: any
): Promise<MappingValidationResult> {
  const errors: string[] = []
  const warnings: string[] = []
  const suggestions: TourProduct[] = []

  // Validate tour IDs exist and are actual tours
  for (const tourId of selectedTourIds) {
    try {
      const tour = await productService.retrieve(tourId)
      if (!tour.metadata?.is_tour) {
        errors.push(`Product ${tourId} is not a tour`)
      }
    } catch (e) {
      errors.push(`Invalid tour ID: ${tourId}`)
    }
  }

  // Category-based warnings
  if (addonProduct.metadata?.category === "Accommodation") {
    const tours = await Promise.all(
      selectedTourIds.map(id => productService.retrieve(id))
    )
    const singleDayTours = tours.filter(
      t => t.metadata?.duration_days === 1
    )
    if (singleDayTours.length > 0) {
      warnings.push(
        `Accommodation addon mapped to ${singleDayTours.length} single-day tour(s)`
      )
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    suggestions
  }
}

/**
 * Get smart tour suggestions based on addon category
 */
export async function getSuggestedTours(
  addonProduct: AddonProduct,
  productService: any
): Promise<TourProduct[]> {
  const category = addonProduct.metadata?.category

  const [allTours] = await productService.listProducts({
    metadata: { is_tour: true },
    status: "published"
  })

  switch (category) {
    case "Accommodation":
      return allTours.filter(t => t.metadata.duration_days > 1)

    case "Activities":
      return allTours.filter(t =>
        t.metadata.category?.includes("Beach") ||
        t.metadata.location?.includes("Island")
      )

    default:
      return allTours // All tours for universal addons
  }
}
```

### 7.4 API Endpoints (Optional)

**If custom endpoints are needed:**

```typescript
// src/api/admin/addons/[id]/tours/route.ts

import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { Modules } from "@medusajs/framework/utils"

/**
 * GET /admin/addons/:id/tours
 * Get all tours that this addon applies to
 */
export async function GET(
  req: MedusaRequest,
  res: MedusaResponse
): Promise<void> {
  const { id } = req.params
  const productModuleService = req.scope.resolve(Modules.PRODUCT)

  const addon = await productModuleService.retrieve(id, {
    relations: ["metadata"]
  })

  if (!addon.metadata?.addon) {
    return res.status(400).json({
      error: "Product is not an addon"
    })
  }

  const tourIds = addon.metadata.applicable_tours || []
  const tours = await productModuleService.listProducts({
    id: tourIds,
    metadata: { is_tour: true }
  })

  res.json({
    addon_id: id,
    applicable_tours: tours,
    count: tours.length
  })
}

/**
 * POST /admin/addons/:id/tours
 * Update tour mappings for this addon
 */
export async function POST(
  req: MedusaRequest,
  res: MedusaResponse
): Promise<void> {
  const { id } = req.params
  const { tour_ids, replace = true } = req.body

  const productModuleService = req.scope.resolve(Modules.PRODUCT)

  const addon = await productModuleService.retrieve(id)

  let updatedTourIds = tour_ids

  if (!replace) {
    // Append to existing
    const existing = addon.metadata?.applicable_tours || []
    updatedTourIds = [...new Set([...existing, ...tour_ids])]
  }

  await productModuleService.updateProducts(id, {
    metadata: {
      ...addon.metadata,
      applicable_tours: updatedTourIds,
      last_mapping_update: new Date().toISOString()
    }
  })

  res.json({
    success: true,
    addon_id: id,
    tour_count: updatedTourIds.length
  })
}
```

---

## 8. IMPLEMENTATION PHASES

### Phase 1: Core Widget (Week 1)
**Priority: HIGH**

**Tasks:**
- [ ] Create `addon-tour-mapping.tsx` widget
- [ ] Implement basic tour selection UI (checkboxes)
- [ ] Add save functionality to update `metadata.applicable_tours`
- [ ] Add loading/saving states
- [ ] Add toast notifications
- [ ] Test with existing addon products

**Deliverable:** Working widget on addon product pages

### Phase 2: Enhanced UX (Week 2)
**Priority: MEDIUM**

**Tasks:**
- [ ] Add visual tour cards with thumbnails
- [ ] Implement search/filter functionality
- [ ] Add bulk select presets ("All Tours", "Multi-Day Only", etc.)
- [ ] Add validation and warnings
- [ ] Add mapping preview before save
- [ ] Group tours by category

**Deliverable:** Professional-grade UX with all features

### Phase 3: Secondary Widget (Week 3)
**Priority: LOW**

**Tasks:**
- [ ] Create `tour-available-addons.tsx` widget
- [ ] Implement read-only addon list
- [ ] Add quick-add functionality
- [ ] Add warning if tour has 0 addons
- [ ] Test bidirectional updates

**Deliverable:** Tour page addon widget

### Phase 4: Optimization (Week 4)
**Priority: LOW**

**Tasks:**
- [ ] Add smart suggestions based on category
- [ ] Implement caching for tour lists
- [ ] Add analytics tracking
- [ ] Performance optimization
- [ ] User testing and feedback
- [ ] Documentation

**Deliverable:** Polished, production-ready feature

---

## 9. TESTING CHECKLIST

### 9.1 Unit Tests

**Widget Tests:**
```typescript
// Tests for addon-tour-mapping.tsx

describe("AddonTourMapping Widget", () => {
  test("renders only for addon products", () => {
    const addonProduct = { metadata: { addon: true } }
    const tourProduct = { metadata: { is_tour: true } }

    expect(shouldRender(addonProduct)).toBe(true)
    expect(shouldRender(tourProduct)).toBe(false)
  })

  test("loads existing tour mappings", async () => {
    const addon = {
      metadata: {
        applicable_tours: ["tour_1", "tour_2"]
      }
    }

    const mappings = await loadTourMappings(addon)
    expect(mappings).toHaveLength(2)
  })

  test("validates tour IDs before save", async () => {
    const result = await validateTourMappings(addon, ["invalid_id"])
    expect(result.isValid).toBe(false)
    expect(result.errors).toContain("Invalid tour ID")
  })
})
```

### 9.2 Integration Tests

**API Tests:**
```typescript
describe("Addon-Tour Mapping API", () => {
  test("updates addon metadata with tour IDs", async () => {
    const response = await updateAddonTours(addonId, {
      tour_ids: ["tour_1", "tour_2"]
    })

    expect(response.success).toBe(true)

    const addon = await getAddon(addonId)
    expect(addon.metadata.applicable_tours).toEqual(
      ["tour_1", "tour_2"]
    )
  })

  test("retrieves addons for tour", async () => {
    const addons = await getAvailableAddonsForTour(tourId)
    expect(addons.length).toBeGreaterThan(0)
  })
})
```

### 9.3 E2E Tests

**User Workflow Tests:**
```typescript
test("Product Manager maps addon to multiple tours", async () => {
  // 1. Navigate to addon product
  await page.goto("/admin/products/addon-kayaking")

  // 2. Scroll to mapping widget
  await page.scrollTo("#addon-tour-mapping")

  // 3. Click edit
  await page.click("[data-testid='edit-tours-btn']")

  // 4. Select multi-day preset
  await page.click("[data-testid='preset-multiday']")

  // 5. Verify 8 tours selected
  const count = await page.locator(".selected-count").textContent()
  expect(count).toBe("8 tours selected")

  // 6. Save mappings
  await page.click("[data-testid='save-mappings-btn']")

  // 7. Verify success toast
  await expect(page.locator(".toast-success")).toBeVisible()
})
```

### 9.4 Manual Testing Scenarios

**Scenario 1: Create new addon**
- [ ] Create addon with all fields
- [ ] Map to 5 tours using checkboxes
- [ ] Save and verify toast notification
- [ ] Refresh page and verify mappings persist
- [ ] Check storefront - addon appears on selected tours

**Scenario 2: Bulk update**
- [ ] Open existing addon
- [ ] Click "Select All Tours"
- [ ] Save mappings
- [ ] Verify all 21 tours selected
- [ ] Check database metadata updated

**Scenario 3: Category validation**
- [ ] Create "Glamping" accommodation addon
- [ ] Map to 1-day tour
- [ ] Verify warning message appears
- [ ] Save anyway (allowed but warned)

**Scenario 4: Tour page view**
- [ ] Navigate to tour product
- [ ] Scroll to "Available Add-ons" widget
- [ ] Verify correct addons listed
- [ ] Use quick-add to add new addon
- [ ] Verify addon product updated

---

## 10. CODE EXAMPLES

### 10.1 Main Widget Component

```typescript
// src/admin/widgets/addon-tour-mapping.tsx

import { defineWidgetConfig } from "@medusajs/admin-sdk"
import {
  Container,
  Heading,
  Button,
  Checkbox,
  Input,
  Label,
  Text,
  Badge,
  toast,
  Toaster
} from "@medusajs/ui"
import { useState, useEffect } from "react"
import { DetailWidgetProps, AdminProduct } from "@medusajs/framework/types"
import { MagnifyingGlass, CheckCircle } from "@medusajs/icons"

interface TourProduct {
  id: string
  title: string
  handle: string
  thumbnail?: string
  metadata?: {
    is_tour?: boolean
    duration_days?: number
    location?: string
    category?: string
  }
}

const AddonTourMapping = ({ data }: DetailWidgetProps<AdminProduct>) => {
  const product = data

  // State
  const [loading, setLoading] = useState(true)
  const [editMode, setEditMode] = useState(false)
  const [saving, setSaving] = useState(false)
  const [allTours, setAllTours] = useState<TourProduct[]>([])
  const [selectedTourIds, setSelectedTourIds] = useState<string[]>([])
  const [searchQuery, setSearchQuery] = useState("")

  // Only show for addon products
  const isAddonProduct = product.metadata?.addon === true

  if (!isAddonProduct) {
    return null
  }

  // Load tours on mount
  useEffect(() => {
    loadTours()
  }, [product.id])

  const loadTours = async () => {
    try {
      setLoading(true)

      // Fetch all tour products
      const response = await fetch('/admin/products?metadata.is_tour=true', {
        credentials: 'include'
      })
      const { products } = await response.json()
      setAllTours(products)

      // Load existing mappings
      const applicableTours = product.metadata?.applicable_tours || []
      setSelectedTourIds(applicableTours)
    } catch (error) {
      console.error('Error loading tours:', error)
      toast.error("Failed to load tours")
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    try {
      setSaving(true)

      // Validate
      if (selectedTourIds.length === 0) {
        const confirm = window.confirm(
          "This addon is not mapped to any tours. Continue?"
        )
        if (!confirm) return
      }

      // Update product metadata
      const response = await fetch(`/admin/products/${product.id}`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          metadata: {
            ...product.metadata,
            applicable_tours: selectedTourIds,
            last_mapping_update: new Date().toISOString()
          }
        })
      })

      if (!response.ok) throw new Error('Failed to save')

      setEditMode(false)
      toast.success("Tour mappings saved!", {
        description: `This addon is now available on ${selectedTourIds.length} tours`
      })
    } catch (error) {
      console.error('Error saving:', error)
      toast.error("Failed to save tour mappings")
    } finally {
      setSaving(false)
    }
  }

  const handleToggleTour = (tourId: string) => {
    setSelectedTourIds(prev => {
      if (prev.includes(tourId)) {
        return prev.filter(id => id !== tourId)
      } else {
        return [...prev, tourId]
      }
    })
  }

  const handleSelectAll = () => {
    setSelectedTourIds(allTours.map(t => t.id))
  }

  const handleSelectMultiDayOnly = () => {
    const multiDayTours = allTours.filter(
      t => (t.metadata?.duration_days || 0) > 1
    )
    setSelectedTourIds(multiDayTours.map(t => t.id))
  }

  const handleClearAll = () => {
    setSelectedTourIds([])
  }

  // Filter tours by search
  const filteredTours = allTours.filter(tour =>
    tour.title.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Group by duration
  const singleDayTours = filteredTours.filter(
    t => (t.metadata?.duration_days || 0) === 1
  )
  const multiDayTours = filteredTours.filter(
    t => (t.metadata?.duration_days || 0) > 1
  )

  if (loading) {
    return (
      <Container>
        <div className="p-6">
          <Text>Loading tours...</Text>
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
            <Heading level="h2">Applicable Tours</Heading>
            <Text size="small" className="text-gray-600 mt-1">
              Configure which tours can include this addon
            </Text>
          </div>
          <div className="flex gap-2">
            {!editMode ? (
              <Button variant="secondary" onClick={() => setEditMode(true)}>
                Edit Applicable Tours
              </Button>
            ) : (
              <>
                <Button
                  variant="secondary"
                  onClick={() => {
                    setEditMode(false)
                    loadTours() // Reset
                  }}
                  disabled={saving}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  onClick={handleSave}
                  disabled={saving}
                >
                  {saving ? 'Saving...' : 'Save Tour Mappings'}
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Content */}
        {!editMode ? (
          // Read-only view
          <div className="px-6 py-4">
            <div className="mb-3">
              <Badge color={selectedTourIds.length > 0 ? "green" : "orange"}>
                {selectedTourIds.length} tours
              </Badge>
            </div>
            {selectedTourIds.length === 0 ? (
              <Text className="text-gray-500 italic">
                This addon is not mapped to any tours
              </Text>
            ) : (
              <div className="space-y-2">
                {allTours
                  .filter(t => selectedTourIds.includes(t.id))
                  .map(tour => (
                    <div key={tour.id} className="flex items-center gap-2">
                      <CheckCircle className="text-green-600" />
                      <Text>{tour.title}</Text>
                    </div>
                  ))}
              </div>
            )}
          </div>
        ) : (
          // Edit mode
          <div className="px-6 py-4 space-y-4">
            {/* Quick actions */}
            <div className="flex gap-2 flex-wrap">
              <Button
                variant="secondary"
                size="small"
                onClick={handleSelectAll}
              >
                Select All Tours ({allTours.length})
              </Button>
              <Button
                variant="secondary"
                size="small"
                onClick={handleSelectMultiDayOnly}
              >
                Multi-Day Only
              </Button>
              <Button
                variant="secondary"
                size="small"
                onClick={handleClearAll}
              >
                Clear All
              </Button>
            </div>

            {/* Search */}
            <div className="relative">
              <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <Input
                type="text"
                placeholder="Search tours..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Selection count */}
            <div>
              <Text size="small" className="text-gray-600">
                {selectedTourIds.length} of {allTours.length} tours selected
              </Text>
            </div>

            {/* Tour list - Single Day */}
            {singleDayTours.length > 0 && (
              <div>
                <Label className="text-sm font-semibold mb-2">
                  Single Day Tours ({singleDayTours.length})
                </Label>
                <div className="space-y-2">
                  {singleDayTours.map(tour => (
                    <div
                      key={tour.id}
                      className="flex items-center gap-3 p-3 border rounded hover:bg-gray-50"
                    >
                      <Checkbox
                        checked={selectedTourIds.includes(tour.id)}
                        onCheckedChange={() => handleToggleTour(tour.id)}
                      />
                      {tour.thumbnail && (
                        <img
                          src={tour.thumbnail}
                          alt={tour.title}
                          className="w-12 h-12 object-cover rounded"
                        />
                      )}
                      <div className="flex-1">
                        <Text className="font-medium">{tour.title}</Text>
                        <Text size="small" className="text-gray-500">
                          {tour.metadata?.location}
                        </Text>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Tour list - Multi Day */}
            {multiDayTours.length > 0 && (
              <div>
                <Label className="text-sm font-semibold mb-2">
                  Multi-Day Tours ({multiDayTours.length})
                </Label>
                <div className="space-y-2">
                  {multiDayTours.map(tour => (
                    <div
                      key={tour.id}
                      className="flex items-center gap-3 p-3 border rounded hover:bg-gray-50"
                    >
                      <Checkbox
                        checked={selectedTourIds.includes(tour.id)}
                        onCheckedChange={() => handleToggleTour(tour.id)}
                      />
                      {tour.thumbnail && (
                        <img
                          src={tour.thumbnail}
                          alt={tour.title}
                          className="w-12 h-12 object-cover rounded"
                        />
                      )}
                      <div className="flex-1">
                        <Text className="font-medium">{tour.title}</Text>
                        <Text size="small" className="text-gray-500">
                          {tour.metadata?.duration_days} days • {tour.metadata?.location}
                        </Text>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Warning */}
            {selectedTourIds.length === 0 && (
              <div className="bg-orange-50 border border-orange-200 rounded p-3">
                <Text size="small" className="text-orange-800">
                  ⚠ This addon is not applicable to any tours
                </Text>
              </div>
            )}
          </div>
        )}
      </Container>
    </>
  )
}

// Widget configuration
export const config = defineWidgetConfig({
  zone: "product.details.after",
})

export default AddonTourMapping
```

### 10.2 Secondary Widget Component

```typescript
// src/admin/widgets/tour-available-addons.tsx

import { defineWidgetConfig } from "@medusajs/admin-sdk"
import { Container, Heading, Text, Badge } from "@medusajs/ui"
import { useState, useEffect } from "react"
import { DetailWidgetProps, AdminProduct } from "@medusajs/framework/types"

const TourAvailableAddons = ({ data }: DetailWidgetProps<AdminProduct>) => {
  const product = data
  const [addons, setAddons] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  // Only show for tour products
  const isTourProduct = product.metadata?.is_tour === true

  if (!isTourProduct) {
    return null
  }

  useEffect(() => {
    loadAddons()
  }, [product.id])

  const loadAddons = async () => {
    try {
      setLoading(true)

      // Fetch all addons
      const response = await fetch('/admin/products?metadata.addon=true', {
        credentials: 'include'
      })
      const { products: allAddons } = await response.json()

      // Filter addons that include this tour
      const applicableAddons = allAddons.filter((addon: any) => {
        if (addon.metadata?.applicable_to_all_tours) return true
        return addon.metadata?.applicable_tours?.includes(product.id)
      })

      setAddons(applicableAddons)
    } catch (error) {
      console.error('Error loading addons:', error)
    } finally {
      setLoading(false)
    }
  }

  // Group by category
  const addonsByCategory = addons.reduce((acc: any, addon: any) => {
    const category = addon.metadata?.category || "Other"
    if (!acc[category]) acc[category] = []
    acc[category].push(addon)
    return acc
  }, {})

  if (loading) {
    return (
      <Container>
        <div className="p-6">
          <Text>Loading addons...</Text>
        </div>
      </Container>
    )
  }

  return (
    <Container className="divide-y p-0">
      <div className="px-6 py-4">
        <Heading level="h2">Available Add-ons for This Tour</Heading>
        <Text size="small" className="text-gray-600 mt-1">
          Addons that customers can select with this tour
        </Text>
      </div>

      <div className="px-6 py-4">
        {addons.length === 0 ? (
          <div className="bg-orange-50 border border-orange-200 rounded p-4">
            <Text className="text-orange-800">
              ⚠ No addons are configured for this tour
            </Text>
            <Text size="small" className="text-orange-700 mt-2">
              Configure addons from the addon product pages to make them available.
            </Text>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="mb-3">
              <Badge color="green">
                {addons.length} addons available
              </Badge>
            </div>

            {Object.entries(addonsByCategory).map(([category, categoryAddons]: [string, any]) => (
              <div key={category}>
                <Label className="text-sm font-semibold mb-2">
                  {category} ({categoryAddons.length})
                </Label>
                <div className="space-y-1 ml-4">
                  {categoryAddons.map((addon: any) => (
                    <div key={addon.id} className="flex items-center gap-2">
                      <Text size="small">• {addon.title}</Text>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Container>
  )
}

export const config = defineWidgetConfig({
  zone: "product.details.after",
})

export default TourAvailableAddons
```

---

## 11. PERFORMANCE CONSIDERATIONS

### 11.1 Optimization Strategies

**Caching:**
```typescript
// Cache tour list for 5 minutes
const TOUR_CACHE_TTL = 5 * 60 * 1000

let toursCache: {
  data: TourProduct[]
  timestamp: number
} | null = null

const loadToursWithCache = async () => {
  const now = Date.now()

  if (toursCache && (now - toursCache.timestamp) < TOUR_CACHE_TTL) {
    return toursCache.data
  }

  const tours = await fetchTours()
  toursCache = { data: tours, timestamp: now }
  return tours
}
```

**Lazy Loading:**
```typescript
// Load tours on widget open, not page load
const [toursLoaded, setToursLoaded] = useState(false)

const handleEditClick = () => {
  setEditMode(true)
  if (!toursLoaded) {
    loadTours()
    setToursLoaded(true)
  }
}
```

**Pagination:**
```typescript
// For large tour lists (50+ tours)
const PAGE_SIZE = 20

const [currentPage, setCurrentPage] = useState(1)
const paginatedTours = filteredTours.slice(
  (currentPage - 1) * PAGE_SIZE,
  currentPage * PAGE_SIZE
)
```

### 11.2 Bundle Size

**Code Splitting:**
```typescript
// Lazy load heavy components
const TourSelector = lazy(() => import('./components/TourSelector'))
const MappingPreview = lazy(() => import('./components/MappingPreview'))
```

**Tree Shaking:**
- Import only needed Medusa UI components
- Avoid importing entire icon libraries
- Use production builds

---

## 12. ACCESSIBILITY

### 12.1 WCAG 2.1 AA Compliance

**Keyboard Navigation:**
- Tab through all interactive elements
- Space/Enter to toggle checkboxes
- Escape to close modals
- Focus indicators visible

**Screen Reader Support:**
```tsx
<Checkbox
  checked={isSelected}
  onCheckedChange={handleToggle}
  aria-label={`Select ${tour.title}`}
  aria-describedby={`tour-${tour.id}-desc`}
/>
<Text id={`tour-${tour.id}-desc`} className="sr-only">
  {tour.metadata?.duration_days} day tour in {tour.metadata?.location}
</Text>
```

**Color Contrast:**
- All text meets 4.5:1 contrast ratio
- Interactive elements meet 3:1 contrast
- Don't rely solely on color for information

**Focus Management:**
```typescript
// Return focus to edit button after save
const editButtonRef = useRef<HTMLButtonElement>(null)

const handleSave = async () => {
  await saveMappings()
  setEditMode(false)
  editButtonRef.current?.focus()
}
```

---

## 13. FUTURE ENHANCEMENTS

### Phase 2 Features (Post-MVP)

**1. Analytics Dashboard**
```
┌────────────────────────────────────────┐
│ Addon Performance Metrics              │
├────────────────────────────────────────┤
│ • Attachment rate: 67% (across tours)  │
│ • Most popular addon: GoPro Package    │
│ • Highest revenue: Gourmet BBQ         │
│ • Tours with 0 addons: 2 warnings      │
└────────────────────────────────────────┘
```

**2. Smart Recommendations**
- ML-based tour suggestions
- "Customers who added this addon also selected..."
- Seasonal availability rules

**3. Bulk Import/Export**
- CSV import of mappings
- Export current configuration
- Template presets (e.g., "Summer Addons 2025")

**4. Version History**
- Track mapping changes over time
- Rollback to previous configuration
- Audit trail for compliance

**5. Advanced Validation**
- Dependency rules (e.g., "Glamping requires Multi-day")
- Exclusivity rules (e.g., "Beach Cabana excludes Glamping")
- Capacity warnings (e.g., "Only 2 BBQ setups available")

---

## 14. SUCCESS METRICS

### KPIs to Track

**Operational Efficiency:**
- Time to map new addon: Target < 2 minutes (vs. 10+ min manual)
- Mapping errors: Target < 1% of saves
- Admin user satisfaction: Target 4.5/5 stars

**Business Impact:**
- Addon attachment rate: Monitor increase
- Average order value: Track addon revenue
- Product coverage: % of tours with addons

**Technical Performance:**
- Widget load time: < 500ms
- Save operation: < 1 second
- Error rate: < 0.1%

---

## 15. DOCUMENTATION & TRAINING

### Admin User Guide

**Quick Start Guide:**
1. Navigate to Products → Add-ons Collection
2. Select addon to configure
3. Scroll to "Applicable Tours" widget
4. Click "Edit Applicable Tours"
5. Select tours using checkboxes or presets
6. Click "Save Tour Mappings"
7. Verify success notification

**Troubleshooting:**
- Widget not appearing → Check product has `metadata.addon = true`
- Save fails → Check network connection and permissions
- Tours not loading → Refresh page or contact support

**Video Tutorial:**
- Screen recording of mapping workflow
- Bulk update demonstration
- Common mistakes to avoid

---

## 16. APPROVAL & SIGN-OFF

**Design Review:**
- [ ] Product Manager approval
- [ ] UX Designer approval
- [ ] Technical Lead approval

**Development Ready:**
- [ ] Requirements finalized
- [ ] Mockups approved
- [ ] API contracts defined
- [ ] Test cases documented

**Launch Criteria:**
- [ ] All Phase 1 features complete
- [ ] 90%+ test coverage
- [ ] Performance targets met
- [ ] User acceptance testing passed
- [ ] Documentation complete

---

## APPENDIX

### A. Related Documentation

- Medusa Admin SDK: https://docs.medusajs.com/admin-development
- Existing Tour Widget: `/docs/tour-content-editor-widget.md`
- Addon Copy Guide: `/docs/addon-copy-implementation-guide.md`
- Product Types: `/src/lib/types/product.ts`

### B. Contact & Support

**Product Owner:** [Name]
**Technical Lead:** [Name]
**UX Designer:** [Name]

### C. Revision History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 1.0 | 2025-11-08 | Initial planning document | Claude |

---

**END OF PLANNING DOCUMENT**
