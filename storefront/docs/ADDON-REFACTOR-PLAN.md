# Add-On Flow - Complete Refactor Plan (Medusa Best Practices)

**Status**: 📋 PLANNING PHASE
**Goal**: Simplify from 781 lines (3 services) → ~150 lines (1 service)
**Approach**: Follow Medusa v2 patterns exactly, eliminate over-engineering

---

## Executive Summary

**Current Problem**: Add-ons still not displaying despite tactical fixes.

**Root Cause**: Over-engineered architecture with:
- 3 layers of services (addons-service.ts, addon-flow-service.ts, addon-filtering.ts)
- Custom filtering logic (should use Medusa Query)
- Unnecessary transformations (Product → Addon → CartAddon)
- Multi-step wizard complexity (287 lines)
- 61 total files for what should be simple product display

**Solution**: Complete refactor following Medusa best practices
- Direct Medusa SDK integration
- Server-side filtering with Medusa Query
- No custom types/transformations
- Simple product display (no wizard unless needed)
- ~60% code reduction

---

## Phase 1: Backend Simplification

### Current Backend (OVER-COMPLEX)

**File**: `/src/api/store/add-ons/route.ts` (69 lines)

```typescript
// Current: Custom endpoint with query.graph
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const query = req.scope.resolve("query")
  const { data: products } = await query.graph({
    entity: "product",
    fields: ["*", "variants.*", "variants.calculated_price.*"],
    filters: { collection_id: collectionId },
    context: { variants: { calculated_price: QueryContext(...) } }
  })
  return res.json({ add_ons: products })
}
```

**Problems**:
- Custom route for what Medusa SDK already provides
- Manual collection ID lookup
- Custom response format (`add_ons` instead of standard)

### Refactored Backend (MEDUSA PATTERN)

**Option A: Use Standard Product Endpoints**

```typescript
// NO CUSTOM ROUTE NEEDED!
// Use Medusa's built-in: GET /store/products

// Frontend calls:
// GET /store/products?collection_id[]=add-ons-collection-id&region_id=...
```

**Benefits**:
- ✅ Zero custom code
- ✅ Standard Medusa response format
- ✅ Built-in pricing calculation
- ✅ Automatic caching
- ✅ Less maintenance

**Option B: Minimal Custom Route (if metadata filtering needed)**

```typescript
// /src/api/store/add-ons/route.ts (~20 lines)
import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { Modules } from "@medusajs/framework/utils"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const productModule = req.scope.resolve(Modules.PRODUCT)

  // Use Product Module directly - simpler than query.graph
  const products = await productModule.listProducts(
    {
      collection_handle: "add-ons",
      status: "published"
    },
    {
      relations: ["variants", "variants.calculated_price"],
      select: ["id", "handle", "title", "description", "metadata"],
    }
  )

  // Standard format
  res.json({ products })
}
```

**Decision**: Start with Option A (no custom route), fall back to Option B only if needed.

---

## Phase 2: Frontend Simplification

### Current Frontend (OVER-COMPLEX)

**Files**:
- `lib/data/addons-service.ts` (297 lines) - API fetching + transformation
- `lib/data/addon-flow-service.ts` (287 lines) - Multi-step wizard logic
- `lib/data/addon-filtering.ts` (197 lines) - Client-side filtering
- `lib/types/cart.ts` - Custom Addon type
- Multiple hooks, components, utilities

**Total**: 781 lines across 3 core services + 58 supporting files

### Refactored Frontend (MEDUSA PATTERN)

**New Structure**:

```
lib/data/
  addons.ts (~150 lines total - SINGLE FILE)

components/addons/
  AddonsPage.tsx
  AddonCard.tsx
  CategoryFilter.tsx (optional)
```

#### New File: `lib/data/addons.ts` (~150 lines)

```typescript
/**
 * Add-ons Data Service
 * Uses Medusa SDK directly - no custom transformations
 */

import { sdk } from '@/lib/medusa'
import type { HttpTypes } from '@medusajs/types'

// Use Medusa's Product type directly - no custom Addon type!
export type Addon = HttpTypes.StoreProduct

/**
 * Fetch add-ons for a specific tour
 * Uses server-side filtering via Medusa SDK
 */
export async function fetchAddonsForTour(
  tourHandle: string,
  regionId: string
): Promise<Addon[]> {
  try {
    // Use Medusa SDK - handles auth, pricing, caching automatically
    const { products } = await sdk.store.product.list({
      collection_handle: 'add-ons',
      status: 'published',
      region_id: regionId,

      // SERVER-SIDE filtering using metadata (Medusa Query)
      // No need for client-side filtering!
      metadata: {
        addon: true,
        $or: [
          { applicable_tours: { $contains: tourHandle } },
          { applicable_tours: { $contains: '*' } }
        ]
      },

      // Include pricing and variants
      fields: '+variants.calculated_price.*,+metadata'
    })

    console.log(`[Addons] Fetched ${products.length} add-ons for ${tourHandle}`)
    return products
  } catch (error) {
    console.error('[Addons] Failed to fetch:', error)
    throw error
  }
}

/**
 * Group add-ons by category
 * Uses metadata.category from backend
 */
export function groupByCategory(addons: Addon[]): Record<string, Addon[]> {
  return addons.reduce((groups, addon) => {
    const category = addon.metadata?.category as string || 'Other'
    if (!groups[category]) groups[category] = []
    groups[category].push(addon)
    return groups
  }, {} as Record<string, Addon[]>)
}

/**
 * Add add-on to cart
 * Uses standard Medusa cart operations
 */
export async function addAddonToCart(
  cartId: string,
  variantId: string,
  quantity: number = 1
) {
  const { cart } = await sdk.store.cart.addLineItem(cartId, {
    variant_id: variantId,
    quantity,
    metadata: {
      is_addon: true,
      // Any other context needed
    }
  })

  return cart
}

/**
 * Remove add-on from cart
 */
export async function removeAddonFromCart(
  cartId: string,
  lineItemId: string
) {
  const { cart } = await sdk.store.cart.deleteLineItem(cartId, lineItemId)
  return cart
}

/**
 * Get add-on price display
 * Uses calculated_price from variant
 */
export function getAddonPrice(addon: Addon): {
  amount: number
  currency: string
  formatted: string
} {
  const variant = addon.variants?.[0]
  const price = variant?.calculated_price

  if (!price) {
    throw new Error(`No price for add-on ${addon.handle}`)
  }

  return {
    amount: price.calculated_amount,
    currency: price.currency_code,
    formatted: new Intl.NumberFormat('en-AU', {
      style: 'currency',
      currency: price.currency_code.toUpperCase()
    }).format(price.calculated_amount / 100)
  }
}

/**
 * Get pricing unit from metadata
 */
export function getPricingUnit(addon: Addon): 'per_booking' | 'per_day' | 'per_person' {
  return (addon.metadata?.unit as any) || 'per_booking'
}
```

**Key Changes**:
- ✅ Uses Medusa SDK directly
- ✅ Server-side filtering (no client-side filtering needed!)
- ✅ No custom types (uses HttpTypes.StoreProduct)
- ✅ No transformations (Product → Product, not Product → Addon)
- ✅ Standard cart operations
- ✅ ~150 lines total (vs. 781 lines current)

---

## Phase 3: UI Simplification

### Current UI (MULTI-STEP WIZARD)

**Files**:
- `app/checkout/add-ons-flow/page.tsx` - Wizard logic
- `components/AddOn/AddOnMultiStepFlow.tsx` - Step management
- `components/AddOn/AddOnCategoryStep.tsx` - Category steps
- Multiple other components

**Total**: 13 component files, complex state management

### Refactored UI (SIMPLE PRODUCT DISPLAY)

**Option A: Single Page with Tabs** (RECOMMENDED)

```tsx
// app/checkout/add-ons/page.tsx (~100 lines)

'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { fetchAddonsForTour, groupByCategory } from '@/lib/data/addons'
import { AddonCard } from '@/components/addons/AddonCard'
import { useCart } from '@/lib/context/CartContext'

export default function AddonsPage() {
  const searchParams = useSearchParams()
  const tourHandle = searchParams.get('tour')
  const { cart, regionId } = useCart()

  const [addons, setAddons] = useState([])
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadAddons() {
      if (!tourHandle || !regionId) return

      try {
        const data = await fetchAddonsForTour(tourHandle, regionId)
        setAddons(data)
      } catch (error) {
        console.error('Failed to load add-ons:', error)
      } finally {
        setLoading(false)
      }
    }

    loadAddons()
  }, [tourHandle, regionId])

  if (loading) return <div>Loading add-ons...</div>
  if (addons.length === 0) {
    // Skip to checkout if no add-ons
    router.push('/checkout')
    return null
  }

  const grouped = groupByCategory(addons)
  const categories = Object.keys(grouped)
  const activeCategory = selectedCategory || categories[0]

  return (
    <div className="addons-page">
      <h1>Enhance Your Adventure</h1>

      {/* Category Tabs */}
      <div className="category-tabs">
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={activeCategory === cat ? 'active' : ''}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Add-ons Grid */}
      <div className="addons-grid">
        {grouped[activeCategory]?.map(addon => (
          <AddonCard
            key={addon.id}
            addon={addon}
            onAdd={() => handleAddToCart(addon)}
            onRemove={() => handleRemoveFromCart(addon)}
            isSelected={isInCart(addon.id)}
          />
        ))}
      </div>

      {/* Actions */}
      <button onClick={() => router.push('/checkout')}>
        Continue to Checkout
      </button>
    </div>
  )
}
```

**Benefits**:
- ✅ Simple, clean code (~100 lines vs. 287 lines wizard)
- ✅ Better UX (users see all options, can jump between categories)
- ✅ Standard e-commerce pattern (like Amazon, Shopify)
- ✅ Easy to understand and maintain

**Option B: Keep Multi-Step Wizard** (if user testing shows preference)

Keep the multi-step UX but simplify the backend:
- Use simplified `lib/data/addons.ts`
- Remove filtering service
- Remove transformation layers
- Keep step progression UI

**Decision**: Implement Option A first, can add wizard back if needed.

---

## Phase 4: Remove Dead Code

### Files to DELETE:

1. **Services** (replaced by single `addons.ts`):
   - ❌ `lib/data/addons-service.ts` (297 lines)
   - ❌ `lib/data/addon-flow-service.ts` (287 lines)
   - ❌ `lib/data/addon-filtering.ts` (197 lines)

2. **Custom Types** (use Medusa types):
   - ❌ Custom `Addon` type in `lib/types/cart.ts`
   - ❌ `CartAddon` type
   - ❌ `AddOnResponse`, `AddOnsResponse` types

3. **Hooks** (simplified):
   - ❌ `hooks/useAddOnMultiStepFlow.ts` (if using Option A)
   - ❌ `hooks/useAddOnSelection.ts` (cart handles this)
   - Keep: `hooks/useAddOns.ts` (update to use new service)

4. **Components** (if using Option A):
   - ❌ `components/AddOn/AddOnMultiStepFlow.tsx`
   - ❌ `components/AddOn/AddOnCategoryStep.tsx`
   - ❌ `components/AddOn/AddOnDrawer.tsx` (if not needed)
   - Keep: `AddOnCard.tsx` (update for new data structure)

5. **Utils**:
   - ❌ Category mapping utilities (use metadata directly)
   - ❌ Custom price formatters (use Intl.NumberFormat)

**Total Deleted**: ~40+ files, ~600+ lines of code

---

## Phase 5: Migration Steps

### Step 1: Create New Service (Parallel)

1. Create `lib/data/addons.ts` with new implementation
2. Keep old files temporarily
3. Test new service in isolation

### Step 2: Update Components

1. Update `AddonCard.tsx` to use Medusa Product type
2. Create new `AddonsPage.tsx` (Option A)
3. Test component rendering

### Step 3: Switch Routing

1. Update route to use new page
2. Test complete flow: Tour → Add-ons → Checkout
3. Verify cart operations work

### Step 4: Remove Old Code

1. Delete old service files
2. Delete unused components
3. Delete custom types
4. Run tests

### Step 5: Performance Verification

1. Run `npm run verify`
2. Test in browser
3. Check performance metrics
4. Compare: Should be faster (server-side filtering)

---

## Expected Benefits

### Code Metrics

| Metric | Before | After | Change |
|--------|--------|-------|--------|
| Service Files | 3 (781 lines) | 1 (150 lines) | -81% |
| Total Files | 61 | ~20 | -67% |
| Component Files | 13 | 3-4 | -70% |
| Custom Types | 5 | 0 | -100% |
| Transformations | 3 layers | 0 layers | -100% |

### Performance

| Metric | Before | After | Improvement |
|--------|--------|-------|-------------|
| Initial Load | Client filtering | Server filtering | Faster |
| Data Transfer | All add-ons | Filtered add-ons | Less data |
| Type Safety | Custom types | Medusa types | Better |
| Maintainability | High complexity | Low complexity | Much easier |

### Reliability

- ✅ No custom transformations = fewer bugs
- ✅ Server-side filtering = correct results
- ✅ Standard Medusa patterns = easier to debug
- ✅ Less code = less to maintain

---

## Implementation Plan

### Week 1: Backend + Core Service

**Day 1-2**: Backend
- [ ] Decide: Option A (no custom route) or Option B (minimal route)
- [ ] Test standard Medusa product endpoint
- [ ] Verify metadata filtering works
- [ ] Test pricing calculation

**Day 3-5**: Frontend Service
- [ ] Create `lib/data/addons.ts`
- [ ] Implement `fetchAddonsForTour()`
- [ ] Implement cart operations
- [ ] Write unit tests

### Week 2: UI Refactor

**Day 1-2**: Components
- [ ] Update `AddonCard.tsx` for Product type
- [ ] Create category filter component
- [ ] Test component rendering

**Day 3-4**: Page
- [ ] Create new `AddonsPage.tsx` (Option A)
- [ ] Implement tab navigation
- [ ] Wire up cart operations
- [ ] Test complete flow

**Day 5**: Integration
- [ ] Update routing
- [ ] Test tour → add-ons → checkout
- [ ] Fix any integration issues

### Week 3: Cleanup + Testing

**Day 1-2**: Remove Old Code
- [ ] Delete old service files
- [ ] Delete unused components
- [ ] Delete custom types
- [ ] Update imports

**Day 3-4**: Testing
- [ ] Run all tests
- [ ] Manual testing in browser
- [ ] Performance verification
- [ ] Fix any issues

**Day 5**: Documentation
- [ ] Update documentation
- [ ] Create migration notes
- [ ] Document new patterns

---

## Rollback Plan

If refactor fails or issues arise:

1. **Git branches**: Keep old code in separate branch
2. **Feature flag**: Use environment variable to toggle old/new
3. **Gradual rollout**: Test with specific tours first
4. **Monitoring**: Track errors, performance

---

## Decision Points

### Must Decide:

1. **UI Pattern**: Single page (Option A) or multi-step wizard (Option B)?
   - Recommendation: Option A (simpler, standard pattern)
   - Can A/B test later if needed

2. **Backend Route**: Standard endpoint (Option A) or custom (Option B)?
   - Recommendation: Try Option A first
   - Only use Option B if metadata filtering doesn't work

3. **Migration Approach**: Big bang or gradual?
   - Recommendation: Gradual (parallel implementation)
   - Less risk, easier to rollback

---

## Success Criteria

### Functional

- ✅ Add-ons display correctly for all tours
- ✅ Filtering by tour works (server-side)
- ✅ Add to cart works
- ✅ Remove from cart works
- ✅ Pricing displays correctly
- ✅ All categories show correctly

### Non-Functional

- ✅ Code reduced by >60%
- ✅ Performance same or better
- ✅ No new bugs introduced
- ✅ Passes all automated tests
- ✅ Easier to maintain

### Documentation

- ✅ New patterns documented
- ✅ Migration guide created
- ✅ Team trained on new approach

---

## Risk Assessment

### High Risk

- **Data structure mismatch**: Medusa Product type might be missing fields
  - Mitigation: Test with real data first, add metadata as needed

### Medium Risk

- **UX regression**: Users might prefer multi-step wizard
  - Mitigation: A/B test, can revert to wizard with simpler backend

### Low Risk

- **Performance regression**: Server-side filtering might be slower
  - Mitigation: Benchmark first, add caching if needed

---

## Next Steps

1. **Review this plan** with team
2. **Decide on options**: UI pattern, backend approach, migration strategy
3. **Set timeline**: Adjust phases based on priority
4. **Start Phase 1**: Begin with backend verification

---

**Questions to Answer Before Starting**:

1. Do users like multi-step wizard or prefer single page?
2. Are there any add-on fields not in Product metadata?
3. What's the priority: speed of implementation vs. perfect architecture?
4. Is there budget for A/B testing UI patterns?

---

**End of Refactor Plan**
