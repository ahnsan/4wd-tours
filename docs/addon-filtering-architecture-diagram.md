# Addon Filtering Architecture Diagram

## System Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           FRONTEND (Next.js)                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌────────────────────────────────────────────────────────────────────┐    │
│  │  Component Layer: /app/checkout/add-ons-flow/page.tsx             │    │
│  │                                                                     │    │
│  │  1. User State:                                                    │    │
│  │     - cart.tour = { handle: "1d-rainbow-beach", ... }             │    │
│  │     - cart.selected_addons = [...]                                │    │
│  │                                                                     │    │
│  │  2. Data Fetching:                                                │    │
│  │     useEffect(() => {                                             │    │
│  │       const tourHandle = cart.tour?.handle;                       │    │
│  │       const steps = await getCategorySteps(tourHandle); ◄─────┐  │    │
│  │     }, [cart.tour?.handle])                                   │  │    │
│  │                                                               │  │    │
│  │  3. Render:                                                   │  │    │
│  │     steps.map(step => <CategoryView addons={step.addons} />)  │  │    │
│  └────────────────────────────────────────────────────────────┬──┘  │    │
│                                                                │     │    │
│                                                                │     │    │
│  ┌────────────────────────────────────────────────────────────┼─────┘    │
│  │  Service Layer: /lib/data/addon-flow-service.ts            │          │
│  │                                                             │          │
│  │  getCategorySteps(tourHandle?: string | null) {            │          │
│  │    1. Fetch all addons from API ──────────────────────┐    │          │
│  │    2. Group by category                               │    │          │
│  │    3. Filter by tour applicability ◄──────────────┐   │    │          │
│  │    4. Create category steps                        │   │    │          │
│  │    5. Return filtered steps                        │   │    │          │
│  │  }                                                  │   │    │          │
│  └─────────────────────────────────────────────────────┼───┼────┘          │
│                                                        │   │               │
│  ┌─────────────────────────────────────────────────────┼───┼───────┐      │
│  │  Filtering Service: /lib/data/addon-filtering.ts   │   │       │      │
│  │                                                     │   │       │      │
│  │  filterAddonsByCategoryAndTour(grouped, tourHandle) {  │       │      │
│  │    For each category:                             │   │       │      │
│  │      For each addon:                              │   │       │      │
│  │        if (isApplicable(addon, tourHandle))       │   │       │      │
│  │          include addon                            │   │       │      │
│  │    Return filtered categories                     │   │       │      │
│  │  }                                                 │   │       │      │
│  │                                                    │   │       │      │
│  │  isAddonApplicableToTour(addon, tourHandle) {     │   │       │      │
│  │    if (!tourHandle) return false;                 │   │       │      │
│  │    if (addon.metadata.applicable_tours === ["*"]) │   │       │      │
│  │      return true;  // Universal                   │   │       │      │
│  │    return addon.metadata.applicable_tours         │   │       │      │
│  │           .includes(tourHandle);                  │   │       │      │
│  │  }                                                 │   │       │      │
│  └─────────────────────────────────────────────────────┬──┘       │      │
│                                                        │          │      │
│  ┌─────────────────────────────────────────────────────┼──────────┼──┐   │
│  │  API Client: /lib/data/addons-service.ts           │          │  │   │
│  │                                                     │          │  │   │
│  │  fetchAllAddOns() {                                │          │  │   │
│  │    GET /store/products?region_id=...              │          │  │   │
│  │    Filter by handle: "addon-*"                    │          │  │   │
│  │    Return: AddOn[] (with metadata)                │          │  │   │
│  │  }                                                 │          │  │   │
│  └─────────────────────────────────────────────────────┼──────────┼──┘   │
│                                                        │          │      │
└────────────────────────────────────────────────────────┼──────────┼──────┘
                                                         │          │
                                                         ▼          │
┌─────────────────────────────────────────────────────────────────────────────┐
│                         BACKEND (Medusa.js)                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────┐        │
│  │  API Endpoint: GET /store/products                              │        │
│  │                                                                  │        │
│  │  Returns all products (tours + addons)                          │        │
│  │  Frontend filters by handle: "addon-*"                          │        │
│  └─────────────────────────────────────────────────────────────────┘        │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────┐        │
│  │  Database: Products Table                                        │        │
│  │                                                                  │        │
│  │  ┌───────────────────────────────────────────────────────┐      │        │
│  │  │ Product: "addon-gourmet-bbq"                          │      │        │
│  │  │ ├─ title: "Gourmet Beach BBQ"                         │      │        │
│  │  │ ├─ handle: "addon-gourmet-bbq"                        │      │        │
│  │  │ ├─ price: 18000 cents                                 │      │        │
│  │  │ └─ metadata: {                                        │      │        │
│  │  │      addon: true,                                     │      │        │
│  │  │      category: "Food & Beverage",                     │      │        │
│  │  │      applicable_tours: ["*"] ◄──────────────────────────────────┐    │
│  │  │    }                                                  │      │   │    │
│  │  └───────────────────────────────────────────────────────┘      │   │    │
│  │                                                                  │   │    │
│  │  ┌───────────────────────────────────────────────────────┐      │   │    │
│  │  │ Product: "addon-fraser-photography"                   │      │   │    │
│  │  │ ├─ title: "Fraser Island Photography Package"        │      │   │    │
│  │  │ ├─ handle: "addon-fraser-photography"                │      │   │    │
│  │  │ ├─ price: 25000 cents                                │      │   │    │
│  │  │ └─ metadata: {                                       │      │   │    │
│  │  │      addon: true,                                    │      │   │    │
│  │  │      category: "Photography",                        │      │   │    │
│  │  │      applicable_tours: [                             │      │   │    │
│  │  │        "1d-fraser-island",                           │      │   │    │
│  │  │        "2d-fraser-camping"                           │      │   │    │
│  │  │      ] ◄──────────────────────────────────────────────────────┤    │
│  │  │    }                                                 │      │   │    │
│  │  └───────────────────────────────────────────────────────┘      │   │    │
│  └─────────────────────────────────────────────────────────────────┘   │    │
│                                                                         │    │
│  ┌──────────────────────────────────────────────────────────────────────┘   │
│  │  Seeding Script: /src/modules/seeding/tour-seed.ts                       │
│  │                                                                           │
│  │  export const ADDONS = [                                                 │
│  │    {                                                                     │
│  │      title: "Gourmet Beach BBQ",                                         │
│  │      handle: "addon-gourmet-bbq",                                        │
│  │      metadata: {                                                         │
│  │        applicable_tours: ["*"]  // ◄─── KEY FIELD FOR FILTERING         │
│  │      }                                                                   │
│  │    },                                                                    │
│  │    // ... more addons                                                    │
│  │  ];                                                                      │
│  └──────────────────────────────────────────────────────────────────────────┘
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

## Data Flow Sequence

```
User Action                     Frontend                          Backend
────────────                   ──────────                        ─────────

1. Select tour
   "1D Rainbow Beach"  ──────►  cart.tour = {
                                  handle: "1d-rainbow-beach",
                                  duration_days: 1
                                }

2. Navigate to
   /add-ons-flow      ──────►  useEffect triggers:
                                getCategorySteps("1d-rainbow-beach")

3.                             fetchAllAddOns()  ────────────►  GET /store/products
                                                                 ?region_id=xxx

4.                                               ◄────────────  {
                                                                  products: [
                                                                    { handle: "addon-gourmet-bbq",
                                                                      metadata: {
                                                                        applicable_tours: ["*"]
                                                                      }
                                                                    },
                                                                    { handle: "addon-fraser-photo",
                                                                      metadata: {
                                                                        applicable_tours: [
                                                                          "1d-fraser-island"
                                                                        ]
                                                                      }
                                                                    }
                                                                  ]
                                                                }

5.                             Filter client-side:
                                - "addon-gourmet-bbq" ✓ (universal)
                                - "addon-fraser-photo" ✗ (Fraser only)

6.                             Group by category:
                                {
                                  "Food & Beverage": [gourmet-bbq],
                                  "Photography": []  // Empty!
                                }

7.                             Remove empty categories:
                                {
                                  "Food & Beverage": [gourmet-bbq]
                                }

8.                             Create category steps:
                                [
                                  {
                                    categoryName: "Food & Beverage",
                                    stepNumber: 1,
                                    totalSteps: 1,
                                    addons: [gourmet-bbq]
                                  }
                                ]

9.                             Render UI:
                                - Progress: "Step 1 of 1"
                                - Category: "Food & Beverage"
                                - Addon: "Gourmet Beach BBQ" ✓
```

---

## Filtering Decision Tree

```
                           Start: Filter Addon
                                   │
                                   ▼
                        ┌──────────────────────┐
                        │ Is tour selected?    │
                        │ (tourHandle != null) │
                        └──────────┬───────────┘
                                   │
                    ┌──────────────┴──────────────┐
                    │ YES                         │ NO
                    ▼                             ▼
        ┌─────────────────────────┐    ┌──────────────────┐
        │ Get applicable_tours    │    │ Return FALSE     │
        │ from addon.metadata     │    │ (no tour = hide) │
        └─────────┬───────────────┘    └──────────────────┘
                  │
                  ▼
        ┌─────────────────────────┐
        │ applicable_tours value? │
        └─────────┬───────────────┘
                  │
    ┌─────────────┼─────────────┬──────────────┐
    │             │             │              │
    ▼             ▼             ▼              ▼
┌──────┐    ┌─────────┐   ┌─────────┐   ┌──────────┐
│ null │    │ ["*"]   │   │ []      │   │ [...handles...]
└──┬───┘    └────┬────┘   └────┬────┘   └─────┬────┘
   │             │             │              │
   ▼             ▼             ▼              ▼
┌───────┐   ┌─────────┐   ┌────────┐   ┌──────────────────┐
│ TRUE  │   │ TRUE    │   │ FALSE  │   │ includes(tour)? │
│(univ.)│   │(univ.)  │   │(hide)  │   │  YES → TRUE     │
└───────┘   └─────────┘   └────────┘   │  NO  → FALSE    │
                                       └──────────────────┘
```

---

## Component Hierarchy

```
AddOnsFlowPage
├─ ToastProvider
└─ AddOnsFlowContent
   ├─ useCartContext()
   │  └─ cart.tour.handle ──────────┐
   │                                 │
   ├─ useEffect()                    │
   │  └─ getCategorySteps(handle) ◄──┘
   │     └─ Returns: CategoryStep[]
   │        └─ { categoryName, addons: [filtered] }
   │
   ├─ Progress Bar
   │  └─ "Step 1 of 3"
   │
   ├─ Category Intro
   │  ├─ Icon
   │  ├─ Title
   │  └─ Description
   │
   ├─ Addons Grid
   │  └─ currentStep.addons.map(addon =>
   │     └─ AddOnCard
   │        ├─ isSelected
   │        ├─ onToggle
   │        └─ quantity
   │  )
   │
   ├─ Navigation Buttons
   │  ├─ Back
   │  ├─ Skip Category
   │  └─ Next / Review & Continue
   │
   └─ Booking Summary (Sticky)
```

---

## State Management

```
┌────────────────────────────────────────────────────────────┐
│  CartContext (Global State)                                │
├────────────────────────────────────────────────────────────┤
│                                                             │
│  cart = {                                                   │
│    tour: {                                                  │
│      id: "prod_xxx",                                        │
│      handle: "1d-rainbow-beach",  ◄─── FILTER KEY          │
│      title: "1 Day Rainbow Beach Tour",                    │
│      duration_days: 1                                       │
│    },                                                       │
│    participants: 2,                                         │
│    selected_addons: [                                       │
│      {                                                      │
│        id: "prod_yyy",                                      │
│        title: "Gourmet Beach BBQ",                          │
│        quantity: 1,                                         │
│        metadata: {                                          │
│          applicable_tours: ["*"]  ◄─── VALIDATION          │
│        }                                                    │
│      }                                                      │
│    ]                                                        │
│  }                                                          │
│                                                             │
│  Actions:                                                   │
│  ├─ setTour(tour)  ──────┐                                 │
│  ├─ addAddOn(addon)       │                                 │
│  └─ removeAddOn(id)       │                                 │
│                           │                                 │
└───────────────────────────┼─────────────────────────────────┘
                            │
                            ▼
┌────────────────────────────────────────────────────────────┐
│  Component State (Local to page)                           │
├────────────────────────────────────────────────────────────┤
│                                                             │
│  const [steps, setSteps] = useState<CategoryStep[]>([])    │
│  const [currentStepIndex, setCurrentStepIndex] = useState(0)
│  const [selectedAddOns, setSelectedAddOns] = useState<Set>(new Set())
│  const [isLoading, setIsLoading] = useState(true)          │
│                                                             │
│  useEffect(() => {                                          │
│    loadSteps() ──────┐                                      │
│  }, [cart.tour?.handle])  ◄─── Re-run when tour changes   │
│                      │                                      │
└──────────────────────┼──────────────────────────────────────┘
                       │
                       ▼
              getCategorySteps(tourHandle)
                       │
                       └─► Filtered steps returned
```

---

## Performance Optimization Points

```
Component Render
      │
      ├─► useMemo(() => filterSteps(), [tourHandle])  ◄─── 1. Memoize filtering
      │
      ├─► useEffect(() => loadSteps(), [tourHandle])  ◄─── 2. Only reload on tour change
      │
      └─► SWR(['steps', tourHandle], fetcher)         ◄─── 3. Cache with SWR
                                                            (future enhancement)

Service Layer
      │
      ├─► In-memory cache of fetchAllAddOns()         ◄─── 4. Cache raw data
      │
      └─► Client-side filtering (fast)                ◄─── 5. < 50ms target

Backend (Future)
      │
      └─► GET /store/addons?tour_handle=xxx           ◄─── 6. Server-side filtering
                                                            (reduce payload)
```

---

## Error Handling

```
Error Scenario                       Handling Strategy
─────────────                       ─────────────────

1. No tour in cart                  → Redirect to home
                                      useEffect: if (!cart.tour) router.push('/')

2. API fetch fails                  → Show error toast + retry button
                                      catch (error) { showToast('Failed to load') }

3. Empty results after filtering    → Show empty state + "Continue" button
                                      if (steps.length === 0) return <EmptyState />

4. Tour changes mid-flow            → Auto-remove incompatible addons + toast
                                      useEffect checks selectedAddons applicability

5. Invalid addon metadata           → Treat as universal (fail-safe)
                                      if (!applicable_tours) return true

6. Network timeout                  → Retry with exponential backoff
                                      fetchWithTimeout(url, {timeout: 5000})
```

---

*Architecture version: 1.0*
*See `addon-filtering-design.md` for detailed documentation*
