# Add-On Display Issue Fix

**Date**: November 10, 2025
**Issue**: Add-ons stopped appearing after server relaunch
**Status**: ✅ FIXED

---

## Problem Summary

After implementing metadata preservation changes and relaunching servers, the add-ons flow page stopped displaying addon cards. The page would load but show "Loading add-ons..." indefinitely with no addon cards appearing.

---

## Root Cause

**Next.js 14 App Router Pattern Violation**

The issue was a **client component calling server-side code directly** in a useEffect hook:

### What Was Happening:

1. `app/checkout/add-ons-flow/page.tsx` is a **client component** (`'use client'`)
2. The page's useEffect called `getCategoryStepsV2(tourHandle)` directly
3. `getCategoryStepsV2` → calls `fetchAddonsForTour` → makes HTTP fetch to backend
4. In Next.js 14 App Router, **client components cannot execute server-side async functions** during SSR/hydration

### Why It Broke:

- The page was trying to call server-side data fetching functions from client-side code
- Next.js blocks this pattern for security and architecture reasons
- The fetch would fail silently in the browser with "Failed to fetch" error
- NO API calls to `/store/add-ons` would ever be made

### Evidence:

- Backend API working perfectly (confirmed via curl: 13 addons returned)
- CORS properly configured
- Environment variables correct
- But page logs showed NO `/store/add-ons` API calls
- Browser console showed: `TypeError: Failed to fetch`

---

## Solution

**Implemented Proper Next.js 14 App Router Pattern**

Created a Next.js API Route to handle server-side data fetching, allowing the client component to fetch from it.

### Changes Made:

#### 1. Created API Route: `/app/api/category-steps/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { getCategoryStepsV2 } from '@/lib/data/addon-flow-helpers'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const tourHandle = searchParams.get('tour')

    if (!tourHandle) {
      return NextResponse.json({
        success: false,
        error: 'Tour handle is required',
      }, { status: 400 })
    }

    const steps = await getCategoryStepsV2(tourHandle)

    return NextResponse.json({
      success: true,
      steps,
      meta: {
        stepCount: steps.length,
        addonCount: steps.reduce((sum, step) => sum + step.addons.length, 0),
      },
    })
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 })
  }
}
```

#### 2. Updated Client Component: `app/checkout/add-ons-flow/page.tsx`

**Before** (lines 87-94):
```typescript
// Load steps filtered by tour using NEW service (server-side filtering)
const startTime = performance.now();
const categorySteps = await getCategoryStepsV2(tourHandle);
const endTime = performance.now();

console.log(`[Add-ons Flow] Loaded ${categorySteps.length} steps in ${(endTime - startTime).toFixed(2)}ms`);

setSteps(categorySteps);
```

**After** (lines 87-105):
```typescript
// Load steps from API route (proper Next.js 14 pattern for client components)
const startTime = performance.now();
const response = await fetch(`/api/category-steps?tour=${encodeURIComponent(tourHandle)}`);

if (!response.ok) {
  throw new Error(`API responded with ${response.status}`);
}

const data = await response.json();
const endTime = performance.now();

if (!data.success) {
  throw new Error(data.error || 'Failed to load category steps');
}

const categorySteps = data.steps;
console.log(`[Add-ons Flow] Loaded ${categorySteps.length} steps in ${(endTime - startTime).toFixed(2)}ms`);

setSteps(categorySteps);
```

---

## Verification

### Before Fix:
```
❌ Page loads (HTTP 200)
❌ NO API calls to /store/add-ons or /api/category-steps
❌ Browser error: "Failed to fetch"
❌ Addons never appear
```

### After Fix:
```
✅ Page loads (HTTP 200)
✅ API call to /api/category-steps (HTTP 200 in 524ms)
✅ Backend fetch to /store/add-ons (13 addons returned)
✅ 5 category steps generated
✅ All addon metadata preserved
✅ Addons display correctly in UI
```

### Server Logs After Fix:
```
[Category Steps API] Fetching for tour: 2d-fraser-rainbow
[Flow Helpers] Fetching add-ons for tour: 2d-fraser-rainbow
[Addons] Fetching add-ons for tour "2d-fraser-rainbow"
[Addons] Fetched 13 add-ons for "2d-fraser-rainbow"
[Flow Helpers] Converted 13 products to addons
[Flow Helpers] Generated 5 category steps
[Category Steps API] Returning 5 steps with 13 total addons
GET /api/category-steps?tour=2d-fraser-rainbow 200 in 524ms
GET /checkout/add-ons-flow?tour=2d-fraser-rainbow 200 in 509ms
```

---

## Architecture Pattern

### Next.js 14 App Router Best Practices

**Server Components** (default):
- Can directly call async server functions
- Can fetch data during SSR
- No `'use client'` directive
- Example: `app/tours/page.tsx`

**Client Components** (with `'use client'`):
- Must fetch data via API routes or browser fetch
- Cannot call server-side async functions directly
- Used for interactivity (useState, useEffect, etc.)
- Example: `app/checkout/add-ons-flow/page.tsx`

**API Routes** (`app/api/*/route.ts`):
- Bridge between client and server
- Handle server-side logic
- Return JSON responses
- Example: `app/api/category-steps/route.ts`

### Data Flow (After Fix):

```
1. Client Component (Browser)
   ↓ fetch('/api/category-steps?tour=X')

2. API Route (Server)
   ↓ getCategoryStepsV2(tourHandle)

3. Flow Helpers (Server)
   ↓ fetchAddonsForTour(tourHandle, regionId)

4. Addons Service (Server)
   ↓ fetch('http://localhost:9000/store/add-ons')

5. Medusa Backend
   ↓ Returns 13 products with metadata

6. Response Chain
   Backend → Service → Helpers → API Route → Client
   ↓
7. Client Renders Addon Cards ✅
```

---

## Related Issues

This fix is **separate from** the metadata preservation changes made earlier. The metadata preservation changes (lines 479-500 and 220-251 in CartContext.tsx) are working correctly and were not the cause of this issue.

### Metadata Preservation Status:
✅ `applicable_tours` field preserved in line item metadata
✅ `category` field preserved in line item metadata
✅ `max_quantity` field preserved in line item metadata
✅ All metadata restored during cart sync

The metadata preservation changes are working as intended - this display issue was purely a Next.js architecture pattern problem.

---

## Files Modified

1. **Created**: `app/api/category-steps/route.ts` (47 lines)
   - New API route for server-side data fetching

2. **Modified**: `app/checkout/add-ons-flow/page.tsx` (lines 87-105)
   - Changed from direct function call to API fetch

---

## Lessons Learned

### 1. Next.js 14 App Router Patterns
- Always use API routes for client components that need server data
- Don't mix server-side code with client-side execution contexts
- Follow the framework's separation of concerns

### 2. Debugging Client/Server Boundaries
- Check if API calls are actually being made (server logs)
- Verify component is client or server (`'use client'` directive)
- Browser console errors may indicate pattern violations

### 3. Testing After Architecture Changes
- Test full data flow, not just individual functions
- Verify logs show expected API calls
- Check both server and client logs

---

## Future Improvements

1. **Consider Server Components**: Evaluate if the add-ons flow page could be refactored to use Server Components for initial data loading, eliminating the need for the API route

2. **Add Error Boundaries**: Implement React Error Boundaries to catch and display data fetching errors gracefully

3. **Add Loading States**: Improve UX with skeleton loaders during data fetching

4. **Cache API Route**: Consider implementing Next.js caching for the category steps API route to improve performance

---

## Status

✅ **FIXED AND VERIFIED**

- Add-ons display correctly in the UI
- All 13 addons load for 2d-fraser-rainbow tour
- 5 category steps generated correctly
- Metadata preservation working as expected
- Follows Next.js 14 best practices

---

**Fixed By**: Claude Code
**Date**: November 10, 2025
**Verification**: Manual testing + server log analysis
