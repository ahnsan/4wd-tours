# Phase 2: Component Structure Analysis for Add-ons Refactor

**Generated**: 2025-11-10
**Status**: Analysis Complete
**Purpose**: Guide Phase 2 implementation of add-ons refactor (frontend components)

---

## Executive Summary

### Current State
- **Phase 1 Complete**: New `lib/data/addons.ts` service created (336 lines)
- **Current Page**: Multi-step wizard with 483 lines
- **Current Card Component**: 298 lines with custom `Addon` type from `lib/types/cart.ts`
- **Backend Ready**: Custom `/store/add-ons` endpoint with server-side filtering

### Phase 2 Objective
Update frontend components to use the new simplified service with `HttpTypes.StoreProduct` instead of custom `Addon` type.

### Key Findings
1. **Type Mismatch**: Current components use `Addon` from `lib/types/cart.ts`, new service uses `HttpTypes.StoreProduct`
2. **Prop Changes Required**: 23 field mappings needed from old to new type
3. **Integration Complexity**: Medium (3-4 files need updates)
4. **Migration Risk**: Low (parallel implementation possible)

---

## 1. Current Add-ons Page Analysis

### File: `/Users/Karim/med-usa-4wd/storefront/app/checkout/add-ons-flow/page.tsx`

**Lines of Code**: 483 lines

#### Data Fetching Pattern

**Current (Old Service)**:
```typescript
// Lines 85-86: Using OLD addon-flow-service
import { getCategorySteps } from '../../../lib/data/addon-flow-service';
const categorySteps = await getCategorySteps(tourHandle);
```

**What Data It Fetches**:
- `CategoryStep[]` - Array of categorized add-ons
- Server-side filtered by `tourHandle` (correct pattern)
- Includes persuasive copy for each category

**Structure of `CategoryStep`**:
```typescript
interface CategoryStep {
  stepNumber: number;
  totalSteps: number;
  categoryName: string;
  addons: Addon[];  // From lib/types/cart.ts
  intro: CategoryIntro;
}
```

#### Props and State Management

**Component Dependencies**:
```typescript
// Line 36: Cart context for add-ons
const { cart, addAddonToCart, removeAddonFromCart, updateAddonQuantity } = useCartContext();

// Line 39-42: Local state
const [steps, setSteps] = useState<CategoryStep[]>([]);
const [currentStepIndex, setCurrentStepIndex] = useState(0);
const [selectedAddOns, setSelectedAddOns] = useState<Set<string>>(new Set());
const [isLoading, setIsLoading] = useState(true);
```

**Expected Props**: None (top-level page component)

**Search Params**:
- `?step=<number>` - Current step index
- `?tour=<handle>` - Tour handle for filtering

#### Hooks Used

1. **useRouter** (line 33) - Navigation between steps
2. **useSearchParams** (line 34) - Read step and tour params
3. **useToast** (line 35) - Show success/error messages
4. **useCartContext** (line 36) - Cart operations
5. **useState** (lines 39-42) - Local state management
6. **useEffect** (lines 45-177) - Multiple effects:
   - Load step from URL
   - Load category steps
   - Initialize selected add-ons from cart
   - Analytics tracking
   - Tour validation and redirect
   - Incompatible addon removal
7. **useMemo** (lines 179-189) - Memoize current step and progress
8. **useCallback** (lines 192-314) - Memoize event handlers

#### Key Features

**Multi-Step Flow**:
- Progress bar (lines 351-365)
- Filter badge showing filtered count (lines 368-377)
- Category introduction section (lines 380-400)
- Navigation buttons (Back/Skip/Next) (lines 425-450)
- Skip all button (lines 452-456)
- Sticky booking summary sidebar (lines 460-466)

**Addon Card Integration** (lines 410-420):
```typescript
<AddOnCard
  key={addon.id}
  addon={addon}  // Type: Addon from lib/types/cart.ts
  isSelected={selectedAddOns.has(addon.id)}
  quantity={getAddonQuantity(addon.id)}
  onToggle={handleToggleAddOn}
  onQuantityChange={handleQuantityChange}
  tourDays={cart.tour_booking?.tour?.duration_days || 1}
  participants={cart.tour_booking?.participants || 1}
/>
```

#### Analytics Integration

**Events Tracked**:
- `view_addon_category_step` (lines 122-130)
- `complete_addon_category` (lines 262-271)
- `continue_from_addons` (lines 277-286)
- `skip_addons` (lines 307-312)
- `select_addon` (lines 230-242)
- `deselect_addon` (lines 209-216)

---

## 2. AddOnCard Component Analysis

### File: `/Users/Karim/med-usa-4wd/storefront/components/Checkout/AddOnCard.tsx`

**Lines of Code**: 298 lines

#### Current Prop Interface

```typescript
interface AddOnCardProps {
  addon: Addon;  // FROM: lib/types/cart.ts
  isSelected: boolean;
  quantity: number;
  onToggle: (addon: Addon) => void;
  onQuantityChange: (addonId: string, quantity: number) => void;
  onLearnMore?: (addon: Addon) => void;
  tourDays?: number;
  participants?: number;
}
```

#### Fields Used from `Addon` Type

**Direct Field Access** (23 fields):
```typescript
// Core identification
addon.id                  // Line 163, 179, 192, 226, etc.
addon.title               // Lines 202, 191, 219, etc.
addon.description         // Line 204
addon.category            // Lines 76, 206-210
addon.available           // Lines 152, 178, 189, 277-279

// Pricing fields
addon.price_cents         // Lines 86, 101-108, 290
addon.pricing_type        // Lines 128-145, 232

// Visual fields
addon.icon                // Lines 76, 195
addon.thumbnail           // Not used in current implementation

// Metadata (not directly accessed)
addon.metadata            // Could be used for validation
```

#### Component Features

**Price Display Logic** (lines 83-146):
- Validates `price_cents`, `tourDays`, `participants`
- Calculates display price based on `pricing_type`:
  - `per_day`: base × tourDays
  - `per_person`: base × participants
  - `per_booking`: base price only
- Formats price in dollars with unit label

**Quantity Controls** (lines 232-265):
- Only shown if selected AND pricing_type !== 'per_booking'
- Debounced quantity changes (300ms delay)
- Min: 1, Max: 99
- Increment/decrement buttons

**Accessibility**:
- ARIA labels on all interactive elements
- Screen reader text for totals
- Semantic HTML (article, role="listitem")
- Keyboard navigation support

**Performance Optimizations**:
- React.memo with custom comparison (lines 283-295)
- Debounced quantity changes (lines 29-55, 80)
- Only re-renders on specific prop changes

---

## 3. Type Mapping Analysis

### Current Type: `Addon` (from `lib/types/cart.ts`)

```typescript
export interface Addon {
  id: string;                    // Medusa product ID
  variant_id: string;            // Medusa variant ID
  title: string;
  description: string;
  price_cents: number;           // Base price in cents
  pricing_type: AddonPricingType; // 'per_booking' | 'per_day' | 'per_person'
  category: string;
  available: boolean;
  icon?: string;
  thumbnail?: string;
  metadata?: {
    quantity_allowed?: boolean;
    max_quantity?: number;
    recommended_for?: string[];
    tags?: string[];
    [key: string]: any;
  };
}
```

### New Type: `HttpTypes.StoreProduct` (from `@medusajs/types`)

```typescript
// Medusa's standard Product type
export interface StoreProduct {
  id: string;
  handle: string;
  title: string;
  description?: string;
  status: string;
  variants?: StoreProductVariant[];
  metadata?: Record<string, unknown>;
  // ... many other fields
}
```

### Field Mapping Required

| Current Field | New Field | Mapping Strategy | Notes |
|--------------|-----------|------------------|-------|
| `id` | `id` | Direct | ✅ Same |
| `variant_id` | `variants[0].id` | Extract | ⚠️ Need to extract from variants array |
| `title` | `title` | Direct | ✅ Same |
| `description` | `description` | Direct | ✅ Same (optional in new type) |
| `price_cents` | `variants[0].calculated_price.calculated_amount` | Extract | ⚠️ Complex path |
| `pricing_type` | `metadata.unit` | Extract from metadata | ⚠️ Type casting needed |
| `category` | `metadata.category` | Extract from metadata | ⚠️ Type casting needed |
| `available` | `status === 'published'` | Derive | ⚠️ Need to check status |
| `icon` | `metadata.icon` | Extract from metadata | ⚠️ May not exist |
| `thumbnail` | `thumbnail` | Direct | ✅ Same |
| `metadata` | `metadata` | Direct | ✅ Same structure |

### Critical Observations

1. **Variant ID**: Must extract from `variants[0].id` instead of direct property
2. **Pricing**: Must use `variants[0].calculated_price.calculated_amount` instead of `price_cents`
3. **Metadata Fields**: Multiple fields moved to metadata (pricing_type, category, icon)
4. **Type Safety**: Need utility functions to safely extract and type-cast metadata

---

## 4. Cart Context Integration

### File: `/Users/Karim/med-usa-4wd/storefront/lib/context/CartContext.tsx`

**Lines of Code**: 702 lines

#### Current Add-on Operations

**Add Addon to Cart** (lines 402-484):
```typescript
const addAddonToCart = useCallback(
  async ({ addon, quantity = 1 }: AddAddonParams) => {
    // CRITICAL VALIDATION: Checks for variant_id
    if (!addon.variant_id) {
      throw new Error(`Addon "${addon.title}" (id: ${addon.id}) is missing variant_id`);
    }

    // Calculates addon price based on pricing_type
    const calculatedPrice = calculateAddonPrice(addon, quantity, {
      tour_duration_days: cart.tour_booking.tour.duration_days,
      participants: cart.tour_booking.participants,
    });

    // Adds line item to Medusa cart
    await addLineItem(cartId, addon.variant_id, quantity, metadata);
  },
  [cart.tour_booking, cart.addons, ensureCart, syncCartFromBackend]
);
```

**Remove Addon from Cart** (lines 489-511):
```typescript
const removeAddonFromCart = useCallback(
  async (addonId: string) => {
    const addon = cart.addons.find((a) => a.addon.id === addonId);
    if (!addon?.line_item_id || !cart.cart_id) return;

    await removeLineItem(cart.cart_id, addon.line_item_id);
    await syncCartFromBackend(cart.cart_id);
  },
  [cart.cart_id, cart.addons, syncCartFromBackend]
);
```

**Update Addon Quantity** (lines 516-531):
```typescript
const updateAddonQuantity = useCallback(
  async (addonId: string, quantity: number) => {
    const addon = cart.addons.find((a) => a.addon.id === addonId);
    if (!addon) throw new Error('Addon not found in cart');

    if (quantity === 0) {
      await removeAddonFromCart(addonId);
      return;
    }

    await addAddonToCart({ addon: addon.addon, quantity });
  },
  [cart.addons, addAddonToCart, removeAddonFromCart]
);
```

#### Integration Points with New Service

**Current Flow**:
1. Page fetches add-ons via `getCategorySteps(tourHandle)`
2. User selects add-on
3. Page calls `addAddonToCart({ addon, quantity })`
4. CartContext validates `addon.variant_id` exists
5. CartContext calculates price using `calculateAddonPrice(addon, ...)`
6. CartContext calls Medusa API to add line item

**New Flow (Phase 2)**:
1. Page fetches add-ons via NEW `fetchAddonsForTour(tourHandle, regionId)`
2. Page converts `HttpTypes.StoreProduct` to `Addon` type (ADAPTER LAYER)
3. User selects add-on
4. Page calls `addAddonToCart({ addon, quantity })` - NO CHANGE
5. CartContext validates `addon.variant_id` exists - NO CHANGE
6. CartContext calculates price - NO CHANGE
7. CartContext calls Medusa API - NO CHANGE

**Key Insight**: CartContext expects custom `Addon` type. We need an adapter layer to convert `HttpTypes.StoreProduct` → `Addon`.

---

## 5. Refactor Plan Review

### Option A: Single Page with Tabs (RECOMMENDED in plan)

**From ADDON-REFACTOR-PLAN.md** (lines 287-372):
- Replace multi-step wizard with tabbed interface
- Show all categories at once
- User can jump between categories
- Simpler code (~100 lines vs 483 lines)
- Better UX for power users

**Benefits**:
- ✅ 79% code reduction (483 → 100 lines)
- ✅ Better discoverability (see all options)
- ✅ Faster navigation (no step progression)
- ✅ Standard e-commerce pattern

**Drawbacks**:
- ❌ Loss of guided experience
- ❌ May overwhelm users with choices
- ❌ Need to rewrite analytics tracking

### Option B: Keep Multi-Step Flow (ALTERNATIVE)

**From ADDON-REFACTOR-PLAN.md** (lines 380-387):
- Keep existing multi-step UX
- Replace data fetching with new service
- Update prop types
- Minimal component changes

**Benefits**:
- ✅ Preserve familiar UX
- ✅ Lower implementation risk
- ✅ Keep existing analytics
- ✅ Guided experience for users

**Drawbacks**:
- ❌ Still 483 lines (no code reduction)
- ❌ Multi-step complexity remains
- ❌ Need adapter layer for types

---

## 6. Component Dependency Map

```
┌─────────────────────────────────────────────────────────────┐
│ app/checkout/add-ons-flow/page.tsx (483 lines)              │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ CURRENT DEPENDENCIES                                    │ │
│ │ • lib/data/addon-flow-service (getCategorySteps)       │ │
│ │ • lib/types/cart (Addon type)                          │ │
│ │ • lib/context/CartContext (cart operations)            │ │
│ │ • components/Checkout/AddOnCard                        │ │
│ │ • components/Checkout/BookingSummary                   │ │
│ └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                               │
                               │ passes Addon
                               ▼
┌─────────────────────────────────────────────────────────────┐
│ components/Checkout/AddOnCard.tsx (298 lines)               │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ PROPS RECEIVED                                          │ │
│ │ • addon: Addon (from lib/types/cart)                   │ │
│ │ • isSelected: boolean                                   │ │
│ │ • quantity: number                                      │ │
│ │ • onToggle: (addon: Addon) => void                     │ │
│ │ • onQuantityChange: (id, qty) => void                  │ │
│ │ • tourDays?: number                                     │ │
│ │ • participants?: number                                 │ │
│ └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                               │
                               │ calls onToggle(addon)
                               ▼
┌─────────────────────────────────────────────────────────────┐
│ lib/context/CartContext.tsx (702 lines)                     │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ CART OPERATIONS                                         │ │
│ │ • addAddonToCart({ addon: Addon, quantity })           │ │
│ │ • removeAddonFromCart(addonId)                         │ │
│ │ • updateAddonQuantity(addonId, quantity)               │ │
│ │                                                          │ │
│ │ VALIDATIONS                                             │ │
│ │ • addon.variant_id must exist                          │ │
│ │ • Calls calculateAddonPrice(addon, ...)                │ │
│ └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ NEW SERVICE (Phase 1 - Complete)                            │
│ lib/data/addons.ts (336 lines)                              │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ EXPORTS                                                 │ │
│ │ • type Addon = HttpTypes.StoreProduct                  │ │
│ │ • fetchAddonsForTour(tourHandle, regionId)             │ │
│ │ • groupByCategory(addons)                              │ │
│ │ • addAddonToCart(cartId, variantId, qty) [UNUSED]     │ │
│ │ • removeAddonFromCart(cartId, lineItemId) [UNUSED]    │ │
│ │ • getAddonPrice(addon)                                 │ │
│ │ • getPricingUnit(addon)                                │ │
│ └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

---

## 7. Required Prop Changes

### AddOnCard Component

**Current Props** (uses `Addon` from `lib/types/cart.ts`):
```typescript
interface AddOnCardProps {
  addon: Addon;  // Custom type
  // ... other props
}
```

**Option 1: Update to Use HttpTypes.StoreProduct Directly**
```typescript
import type { HttpTypes } from '@medusajs/types';

interface AddOnCardProps {
  addon: HttpTypes.StoreProduct;  // Medusa type
  // ... other props
}
```

**Changes Required in Component**:
```typescript
// OLD: addon.price_cents
// NEW: addon.variants?.[0]?.calculated_price?.calculated_amount || 0

// OLD: addon.pricing_type
// NEW: (addon.metadata?.unit as PricingUnit) || 'per_booking'

// OLD: addon.category
// NEW: (addon.metadata?.category as string) || 'Other'

// OLD: addon.available
// NEW: addon.status === 'published'

// OLD: addon.icon
// NEW: addon.metadata?.icon as string | undefined

// OLD: addon.variant_id
// NEW: addon.variants?.[0]?.id || ''
```

**Option 2: Create Adapter Function (RECOMMENDED)**
```typescript
// NEW FILE: lib/utils/addon-adapter.ts

import type { HttpTypes } from '@medusajs/types';
import type { Addon } from '@/lib/types/cart';

/**
 * Convert Medusa StoreProduct to legacy Addon type
 * This adapter allows components to work without changes
 */
export function adaptProductToAddon(product: HttpTypes.StoreProduct): Addon {
  const variant = product.variants?.[0];
  const calculatedPrice = variant?.calculated_price;

  return {
    id: product.id,
    variant_id: variant?.id || '',
    title: product.title,
    description: product.description || '',
    price_cents: calculatedPrice?.calculated_amount || 0,
    pricing_type: (product.metadata?.unit as any) || 'per_booking',
    category: (product.metadata?.category as string) || 'Other',
    available: product.status === 'published',
    icon: product.metadata?.icon as string | undefined,
    thumbnail: product.thumbnail || undefined,
    metadata: product.metadata as any,
  };
}
```

**Benefits of Adapter**:
- ✅ Components work without changes
- ✅ Type safety maintained
- ✅ Single point of conversion
- ✅ Easy to test
- ✅ Can be removed later when components updated

---

## 8. Integration Points with New Service

### Data Fetching Integration

**Current** (in `page.tsx` lines 85-91):
```typescript
import { getCategorySteps } from '../../../lib/data/addon-flow-service';

const categorySteps = await getCategorySteps(tourHandle);
setSteps(categorySteps);
```

**New (Option 1 - Keep Multi-Step Flow)**:
```typescript
import { fetchAddonsForTour, groupByCategory } from '@/lib/data/addons';
import { adaptProductToAddon } from '@/lib/utils/addon-adapter';
import { CATEGORY_ORDER, type CategoryIntro } from '@/lib/data/addon-flow-service';

// Fetch products from new service
const products = await fetchAddonsForTour(tourHandle, regionId);

// Convert to legacy Addon type
const addons = products.map(adaptProductToAddon);

// Group by category
const grouped = groupByCategory(products);

// Build category steps (keep existing multi-step logic)
const categorySteps: CategoryStep[] = CATEGORY_ORDER
  .filter(categoryName => grouped[categoryName]?.length > 0)
  .map((categoryName, index) => ({
    stepNumber: index + 1,
    totalSteps: CATEGORY_ORDER.length,
    categoryName,
    addons: grouped[categoryName].map(adaptProductToAddon),
    intro: CATEGORY_INTROS[categoryName],
  }));

setSteps(categorySteps);
```

**New (Option 2 - Single Page with Tabs)**:
```typescript
import { fetchAddonsForTour, groupByCategory } from '@/lib/data/addons';
import { adaptProductToAddon } from '@/lib/utils/addon-adapter';

// Fetch and convert
const products = await fetchAddonsForTour(tourHandle, regionId);
const addons = products.map(adaptProductToAddon);
const grouped = groupByCategory(products);

// No need for steps - just use grouped directly
setGroupedAddons(grouped);
```

### Cart Integration

**No Changes Required** in CartContext because:
1. Adapter converts `HttpTypes.StoreProduct` → `Addon`
2. CartContext still receives `Addon` type
3. All cart operations remain identical

**Cart Operations Flow**:
```typescript
// 1. Fetch from new service
const products = await fetchAddonsForTour(tourHandle, regionId);

// 2. Convert to Addon type
const addons = products.map(adaptProductToAddon);

// 3. Pass to AddOnCard (expects Addon)
<AddOnCard addon={addon} ... />

// 4. User clicks - component calls onToggle(addon)
onToggle={(addon: Addon) => {
  // addon is already in correct format
  addAddonToCart({ addon, quantity: 1 });
}}

// 5. CartContext receives Addon - NO CHANGE
addAddonToCart({ addon, quantity }) {
  // addon.variant_id exists (from adapter)
  // addon.price_cents exists (from adapter)
  // addon.pricing_type exists (from adapter)
  // Everything works as before
}
```

---

## 9. Migration Complexity Assessment

### Complexity Rating: **MEDIUM** (3/5)

#### Easy Parts (Low Risk)

1. **Data Fetching** (Complexity: 1/5)
   - Replace `getCategorySteps()` with `fetchAddonsForTour()`
   - Single function call change
   - Already tested in Phase 1

2. **Adapter Layer** (Complexity: 2/5)
   - Simple mapping function
   - Straightforward field conversions
   - Easy to test

3. **Cart Integration** (Complexity: 1/5)
   - No changes needed (adapter handles conversion)
   - Existing functions work as-is

#### Medium Parts (Moderate Risk)

4. **Page Component Updates** (Complexity: 3/5)
   - Need to update imports
   - Change data fetching logic
   - Update type annotations
   - 15-20 lines to modify

5. **AddOnCard Component** (Complexity: 3/5)
   - If using adapter: minimal changes (update import only)
   - If updating directly: 20+ field accesses to change
   - Need to update prop type annotation

#### Hard Parts (Higher Risk)

6. **Testing** (Complexity: 4/5)
   - Need to test adapter thoroughly
   - Verify all fields map correctly
   - Test edge cases (missing variants, no price)
   - Ensure cart operations still work

7. **Analytics** (Complexity: 3/5)
   - 6 analytics events to verify
   - Ensure addon data structure matches expectations
   - May need to update event parameters

### Risk Factors

| Risk | Severity | Mitigation |
|------|----------|------------|
| Type mismatches | HIGH | Use adapter function, TypeScript compilation checks |
| Missing variant_id | HIGH | Adapter validates and throws early |
| Missing price data | HIGH | Adapter handles with fallback to 0 |
| Analytics breakage | MEDIUM | Thorough testing before deployment |
| Cart operations fail | MEDIUM | Existing validation in CartContext |
| User flow disruption | LOW | No UX changes with adapter approach |

---

## 10. Specific Recommendations for Phase 2

### Recommended Approach: **Option B with Adapter**

**Keep Multi-Step Flow + Use Adapter Layer**

#### Why This Approach?

1. **Lower Risk**: Minimal component changes
2. **Faster Implementation**: ~2-3 hours vs ~8-10 hours for full rewrite
3. **Preserve UX**: Users familiar with current flow
4. **Easier Rollback**: Can revert quickly if issues
5. **Analytics Intact**: No tracking changes needed

#### Implementation Steps

**Step 1: Create Adapter (30 minutes)**
```bash
# Create new file
touch lib/utils/addon-adapter.ts

# Write adapter function (see example in Section 7)
# Write unit tests for adapter
```

**Step 2: Update Page Component (1 hour)**
```typescript
// In app/checkout/add-ons-flow/page.tsx

// OLD IMPORTS (Remove)
- import { getCategorySteps } from '../../../lib/data/addon-flow-service';
- import type { Addon } from '../../../lib/types/cart';

// NEW IMPORTS (Add)
+ import { fetchAddonsForTour, groupByCategory } from '@/lib/data/addons';
+ import { adaptProductToAddon } from '@/lib/utils/addon-adapter';
+ import { CATEGORY_ORDER, CATEGORY_INTROS, type CategoryIntro } from '../../../lib/data/addon-flow-service';

// Update loadSteps function (lines 56-106)
async function loadSteps() {
  // ... validation code stays same ...

  // OLD
- const categorySteps = await getCategorySteps(tourHandle);

  // NEW
+ const regionId = cart.region?.id || 'default-region'; // Get from cart context
+ const products = await fetchAddonsForTour(tourHandle, regionId);
+ const addons = products.map(adaptProductToAddon);
+ const grouped = groupByCategory(products);
+
+ // Build category steps from grouped data
+ const categorySteps = CATEGORY_ORDER
+   .filter(cat => grouped[cat]?.length > 0)
+   .map((cat, idx) => ({
+     stepNumber: idx + 1,
+     totalSteps: CATEGORY_ORDER.length,
+     categoryName: cat,
+     addons: grouped[cat].map(adaptProductToAddon),
+     intro: CATEGORY_INTROS[cat],
+   }));

  setSteps(categorySteps);
}
```

**Step 3: Update AddOnCard Component (15 minutes)**
```typescript
// In components/Checkout/AddOnCard.tsx

// Change: Update import to ensure using cart.ts type
import type { Addon } from '@/lib/types/cart';

// No other changes needed (adapter provides correct type)
```

**Step 4: Testing (1 hour)**
```typescript
// Test adapter
- Create test file: lib/utils/__tests__/addon-adapter.test.ts
- Test all field mappings
- Test edge cases (missing data)

// Test page
- Visit add-ons flow
- Verify all categories load
- Verify prices display correctly
- Verify cart operations work
- Verify analytics still fire

// Test card
- Verify all addons render
- Verify quantity controls work
- Verify pricing calculations correct
```

**Step 5: Documentation (30 minutes)**
```bash
# Update documentation
- Update ADDON-REFACTOR-PLAN.md (mark Phase 2 complete)
- Document adapter in code comments
- Update type definitions documentation
```

### Alternative: Single Page with Tabs (Future Enhancement)

**If time permits or user testing shows preference**:
1. Keep adapter in place
2. Create new simplified page component
3. A/B test both versions
4. Choose winner based on data

**Benefits of deferring this**:
- Lower immediate risk
- Can gather user feedback first
- Allows incremental improvement

---

## 11. Files That Need Changes

### Must Change (3 files)

1. **NEW FILE: `/Users/Karim/med-usa-4wd/storefront/lib/utils/addon-adapter.ts`**
   - **Purpose**: Convert `HttpTypes.StoreProduct` → `Addon`
   - **Lines**: ~50 lines
   - **Risk**: LOW (new file, easy to test)

2. **MODIFY: `/Users/Karim/med-usa-4wd/storefront/app/checkout/add-ons-flow/page.tsx`**
   - **Changes**: Update imports, replace data fetching (lines 7-16, 56-106)
   - **Lines Changed**: ~30 lines
   - **Risk**: MEDIUM (core functionality)

3. **MODIFY: `/Users/Karim/med-usa-4wd/storefront/components/Checkout/AddOnCard.tsx`**
   - **Changes**: Update import (line 4)
   - **Lines Changed**: 1 line (if using adapter)
   - **Risk**: LOW (minimal change)

### May Need Updates (2 files)

4. **OPTIONAL: `/Users/Karim/med-usa-4wd/storefront/lib/data/addon-flow-service.ts`**
   - **Purpose**: Export `CATEGORY_ORDER` and `CATEGORY_INTROS` for reuse
   - **Changes**: Ensure exports are public
   - **Lines Changed**: 0 lines (already exported)
   - **Risk**: NONE

5. **OPTIONAL: `/Users/Karim/med-usa-4wd/storefront/lib/context/CartContext.tsx`**
   - **Purpose**: Add region_id to cart state for price fetching
   - **Changes**: Expose `cart.region.id` (may already exist)
   - **Lines Changed**: 0-5 lines
   - **Risk**: LOW

### Should NOT Change (Keep As-Is)

- ✅ `lib/data/addons.ts` - Phase 1 complete, working
- ✅ `lib/types/cart.ts` - Keep existing `Addon` type for now
- ✅ Backend `/store/add-ons` endpoint - Already deployed
- ✅ `lib/data/addons-service.ts` - Can deprecate later (Phase 3)
- ✅ `lib/data/addon-filtering.ts` - Can deprecate later (Phase 3)

---

## 12. Success Criteria for Phase 2

### Functional Requirements

- [ ] Add-ons load and display correctly for all tours
- [ ] Prices display with correct formatting
- [ ] Quantity controls work (increment/decrement)
- [ ] Add to cart successful for all addon types
- [ ] Remove from cart works
- [ ] Cart totals calculate correctly
- [ ] Multi-step navigation works (Back/Next/Skip)
- [ ] Progress bar updates correctly
- [ ] Filter badge shows correct count
- [ ] Analytics events fire correctly

### Technical Requirements

- [ ] TypeScript compilation passes with no errors
- [ ] All adapter unit tests pass (>95% coverage)
- [ ] Page integration tests pass
- [ ] Component tests pass
- [ ] No runtime errors in browser console
- [ ] Performance metrics maintained (no regressions)

### Quality Requirements

- [ ] Code follows Medusa best practices
- [ ] Adapter function has JSDoc comments
- [ ] Updated files have clear comments explaining changes
- [ ] No linting warnings
- [ ] No accessibility regressions

### Documentation Requirements

- [ ] Adapter function documented
- [ ] Phase 2 completion notes added to ADDON-REFACTOR-PLAN.md
- [ ] Type mapping documented
- [ ] Integration points documented

---

## 13. Estimated Timeline

### Total Time: **3-4 hours** (with adapter approach)

**Breakdown**:
- Adapter creation: 30 minutes
- Adapter tests: 30 minutes
- Page component updates: 1 hour
- AddOnCard updates: 15 minutes
- Integration testing: 1 hour
- Documentation: 30 minutes
- Buffer for issues: 30 minutes

### Alternative Timeline: **8-10 hours** (single page rewrite)

**Breakdown**:
- New page component: 2 hours
- Update all field accesses: 1.5 hours
- Remove multi-step logic: 1 hour
- Update analytics: 1.5 hours
- Update tests: 2 hours
- Documentation: 1 hour
- Buffer: 1-2 hours

**Recommendation**: Use adapter approach for Phase 2, consider full rewrite for Phase 3.

---

## 14. Next Steps

### Immediate Actions

1. **Review this analysis** with team
2. **Decide on approach**:
   - Option A: Single page with tabs (high effort, better UX)
   - Option B: Keep multi-step + adapter (low effort, lower risk) **← RECOMMENDED**
3. **Create implementation checklist** based on chosen approach
4. **Set aside 4-hour block** for focused implementation
5. **Prepare rollback plan** (Git branch strategy)

### Before Starting Implementation

1. Create feature branch: `git checkout -b feature/phase2-component-refactor`
2. Read through this document again
3. Set up test environment
4. Ensure Phase 1 addons.ts service is working
5. Back up current working state

### During Implementation

1. Follow steps in Section 10 sequentially
2. Commit after each major step
3. Test thoroughly after each change
4. Document any deviations from plan

### After Implementation

1. Run full test suite
2. Manual testing in browser
3. Update ADDON-REFACTOR-PLAN.md
4. Create PR with detailed description
5. Request code review
6. Deploy to staging
7. Monitor for issues

---

## 15. Risk Mitigation Strategies

### High-Risk Areas

**1. Type Conversion Errors**
- **Mitigation**: Comprehensive adapter tests
- **Fallback**: Add runtime validation in adapter
- **Monitoring**: Log adapter errors to console

**2. Missing Variant IDs**
- **Mitigation**: Backend validation (Phase 1)
- **Fallback**: Adapter throws clear error
- **Monitoring**: Track adapter errors

**3. Price Calculation Mismatch**
- **Mitigation**: Test all pricing types (per_booking, per_day, per_person)
- **Fallback**: Compare with old service calculations
- **Monitoring**: Log price mismatches

**4. Cart Operations Fail**
- **Mitigation**: Keep CartContext validation
- **Fallback**: Show user-friendly error message
- **Monitoring**: Track cart errors in analytics

### Rollback Plan

**If critical issue discovered**:
1. Revert to main branch: `git checkout main`
2. Old service still exists (not deleted in Phase 2)
3. Components revert to old imports
4. 5-minute rollback window

**Partial Rollback**:
- Can revert individual components
- Can disable adapter and use old service
- Can A/B test old vs new

---

## 16. Open Questions

### Must Answer Before Starting

1. **Region ID**: Where to get `regionId` for `fetchAddonsForTour()`?
   - Check CartContext for `cart.region.id`
   - Or use default region from environment variable?

2. **Category Intros**: Keep in `addon-flow-service.ts` or move to new file?
   - Recommend: Keep for now, move in Phase 3

3. **Analytics Events**: Update event parameters or keep as-is?
   - Recommend: Keep as-is for Phase 2

4. **Error Handling**: How to handle missing product data?
   - Recommend: Adapter throws, page catches and shows toast

### Nice to Have (Can Defer)

5. **Performance**: Should we add caching to adapter?
   - Defer to Phase 3 if needed

6. **Type Safety**: Should we create branded types?
   - Defer to Phase 3

7. **Testing**: What's the test coverage target?
   - Recommend: 90%+ for adapter, 80%+ for components

---

## Appendix A: Code Snippets

### Complete Adapter Implementation

```typescript
// lib/utils/addon-adapter.ts

/**
 * Adapter to convert Medusa StoreProduct to legacy Addon type
 *
 * This adapter allows existing components to work with the new
 * Phase 1 addons service without requiring component rewrites.
 *
 * @module addon-adapter
 */

import type { HttpTypes } from '@medusajs/types';
import type { Addon, AddonPricingType } from '@/lib/types/cart';

/**
 * Convert Medusa StoreProduct to legacy Addon type
 *
 * @param product - Medusa StoreProduct from addons.ts service
 * @returns Addon type compatible with existing components
 * @throws Error if product is missing required variant data
 *
 * @example
 * const products = await fetchAddonsForTour('2d-fraser-rainbow', regionId);
 * const addons = products.map(adaptProductToAddon);
 */
export function adaptProductToAddon(product: HttpTypes.StoreProduct): Addon {
  // Validate product has variants
  if (!product.variants || product.variants.length === 0) {
    throw new Error(
      `Product "${product.title}" (${product.id}) has no variants. ` +
      `All products must have at least one variant.`
    );
  }

  const variant = product.variants[0];

  // Validate variant has ID
  if (!variant.id) {
    throw new Error(
      `Product "${product.title}" (${product.id}) variant missing ID.`
    );
  }

  // Extract calculated price (server-calculated, includes region pricing)
  const calculatedPrice = variant.calculated_price;
  const priceAmount = calculatedPrice?.calculated_amount;

  // Validate price exists
  if (typeof priceAmount !== 'number') {
    console.error(
      `[Adapter] Product "${product.title}" has no calculated price:`,
      { product_id: product.id, variant_id: variant.id, calculatedPrice }
    );
    // Allow to continue with 0 price (will be caught by component validation)
  }

  // Extract metadata fields with type safety
  const metadata = product.metadata || {};
  const unit = metadata.unit as AddonPricingType | undefined;
  const category = metadata.category as string | undefined;
  const icon = metadata.icon as string | undefined;

  return {
    id: product.id,
    variant_id: variant.id,
    title: product.title,
    description: product.description || '',
    price_cents: priceAmount || 0,
    pricing_type: unit || 'per_booking',
    category: category || 'Other',
    available: product.status === 'published',
    icon: icon,
    thumbnail: product.thumbnail || undefined,
    metadata: metadata as any, // Pass through all metadata
  };
}

/**
 * Batch convert array of products to addons
 * Filters out any that fail conversion
 *
 * @param products - Array of Medusa StoreProducts
 * @returns Array of Addons (may be shorter if conversions failed)
 */
export function adaptProductsToAddons(
  products: HttpTypes.StoreProduct[]
): Addon[] {
  return products.reduce<Addon[]>((addons, product) => {
    try {
      addons.push(adaptProductToAddon(product));
    } catch (error) {
      console.error('[Adapter] Failed to convert product:', {
        product_id: product.id,
        title: product.title,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      // Skip this product, continue with others
    }
    return addons;
  }, []);
}
```

### Adapter Unit Tests

```typescript
// lib/utils/__tests__/addon-adapter.test.ts

import { describe, it, expect } from '@jest/globals';
import type { HttpTypes } from '@medusajs/types';
import { adaptProductToAddon, adaptProductsToAddons } from '../addon-adapter';

describe('adaptProductToAddon', () => {
  it('should convert valid product to addon', () => {
    const product: HttpTypes.StoreProduct = {
      id: 'prod_123',
      title: 'Test Addon',
      description: 'Test description',
      status: 'published',
      variants: [
        {
          id: 'variant_456',
          calculated_price: {
            calculated_amount: 3000, // $30.00
            currency_code: 'aud',
          },
        },
      ],
      metadata: {
        unit: 'per_day',
        category: 'Food & Beverage',
        icon: '/icons/food.svg',
      },
    } as any;

    const addon = adaptProductToAddon(product);

    expect(addon).toEqual({
      id: 'prod_123',
      variant_id: 'variant_456',
      title: 'Test Addon',
      description: 'Test description',
      price_cents: 3000,
      pricing_type: 'per_day',
      category: 'Food & Beverage',
      available: true,
      icon: '/icons/food.svg',
      thumbnail: undefined,
      metadata: expect.any(Object),
    });
  });

  it('should handle missing optional fields', () => {
    const product: HttpTypes.StoreProduct = {
      id: 'prod_123',
      title: 'Minimal Addon',
      status: 'published',
      variants: [
        {
          id: 'variant_456',
          calculated_price: {
            calculated_amount: 1000,
            currency_code: 'aud',
          },
        },
      ],
    } as any;

    const addon = adaptProductToAddon(product);

    expect(addon.description).toBe('');
    expect(addon.pricing_type).toBe('per_booking');
    expect(addon.category).toBe('Other');
    expect(addon.icon).toBeUndefined();
  });

  it('should throw error if no variants', () => {
    const product: HttpTypes.StoreProduct = {
      id: 'prod_123',
      title: 'No Variants',
      status: 'published',
      variants: [],
    } as any;

    expect(() => adaptProductToAddon(product)).toThrow(
      'Product "No Variants" (prod_123) has no variants'
    );
  });

  it('should handle missing price gracefully', () => {
    const product: HttpTypes.StoreProduct = {
      id: 'prod_123',
      title: 'No Price',
      status: 'published',
      variants: [
        {
          id: 'variant_456',
        },
      ],
    } as any;

    const addon = adaptProductToAddon(product);
    expect(addon.price_cents).toBe(0);
  });

  it('should mark unavailable if status is not published', () => {
    const product: HttpTypes.StoreProduct = {
      id: 'prod_123',
      title: 'Draft Product',
      status: 'draft',
      variants: [
        {
          id: 'variant_456',
          calculated_price: {
            calculated_amount: 1000,
            currency_code: 'aud',
          },
        },
      ],
    } as any;

    const addon = adaptProductToAddon(product);
    expect(addon.available).toBe(false);
  });
});

describe('adaptProductsToAddons', () => {
  it('should convert array of products', () => {
    const products: HttpTypes.StoreProduct[] = [
      {
        id: 'prod_1',
        title: 'Product 1',
        status: 'published',
        variants: [
          {
            id: 'var_1',
            calculated_price: { calculated_amount: 1000, currency_code: 'aud' },
          },
        ],
      },
      {
        id: 'prod_2',
        title: 'Product 2',
        status: 'published',
        variants: [
          {
            id: 'var_2',
            calculated_price: { calculated_amount: 2000, currency_code: 'aud' },
          },
        ],
      },
    ] as any;

    const addons = adaptProductsToAddons(products);
    expect(addons).toHaveLength(2);
    expect(addons[0].id).toBe('prod_1');
    expect(addons[1].id).toBe('prod_2');
  });

  it('should skip invalid products and continue', () => {
    const products: HttpTypes.StoreProduct[] = [
      {
        id: 'prod_1',
        title: 'Valid Product',
        status: 'published',
        variants: [
          {
            id: 'var_1',
            calculated_price: { calculated_amount: 1000, currency_code: 'aud' },
          },
        ],
      },
      {
        id: 'prod_2',
        title: 'Invalid Product',
        status: 'published',
        variants: [], // No variants - will fail
      },
      {
        id: 'prod_3',
        title: 'Another Valid',
        status: 'published',
        variants: [
          {
            id: 'var_3',
            calculated_price: { calculated_amount: 3000, currency_code: 'aud' },
          },
        ],
      },
    ] as any;

    const addons = adaptProductsToAddons(products);
    expect(addons).toHaveLength(2);
    expect(addons[0].id).toBe('prod_1');
    expect(addons[1].id).toBe('prod_3');
  });
});
```

---

## Appendix B: Testing Checklist

### Unit Tests

- [ ] Adapter converts all fields correctly
- [ ] Adapter handles missing optional fields
- [ ] Adapter throws on missing required fields
- [ ] Adapter handles invalid pricing data
- [ ] Batch adapter skips invalid products
- [ ] All pricing types handled (per_booking, per_day, per_person)

### Integration Tests

- [ ] Page loads add-ons from new service
- [ ] Page displays all categories
- [ ] Page handles empty categories
- [ ] Page handles API errors gracefully
- [ ] AddOnCard renders with adapted data
- [ ] AddOnCard calculates prices correctly
- [ ] Cart operations work with adapted data

### Manual Testing

- [ ] Visit /checkout/add-ons-flow?tour=2d-fraser-rainbow
- [ ] Verify all 5 categories load
- [ ] Verify prices display correctly
- [ ] Click add-on to select
- [ ] Verify quantity controls appear
- [ ] Change quantity (test +/- buttons)
- [ ] Verify total price updates
- [ ] Click Next to go to next category
- [ ] Click Back to return
- [ ] Click Skip Category
- [ ] Click Skip All
- [ ] Check cart has correct items
- [ ] Check cart totals are correct
- [ ] Complete checkout flow

### Browser Console Checks

- [ ] No TypeScript errors
- [ ] No runtime errors
- [ ] Adapter logs are correct
- [ ] No pricing calculation warnings
- [ ] Analytics events fire correctly

### Performance Checks

- [ ] Page load time < 2 seconds
- [ ] No layout shift (CLS)
- [ ] Smooth scrolling
- [ ] No memory leaks
- [ ] API calls complete in < 500ms

---

**END OF ANALYSIS DOCUMENT**
