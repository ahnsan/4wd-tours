# Performance Audit Report: Checkout Pages

**Date:** November 8, 2025
**Auditor:** Claude Code Performance Analysis
**Pages Audited:**
- `/checkout/add-ons` - Add-ons selection page
- `/checkout` - Checkout/payment page
- `/checkout/confirmation` - Order confirmation page

---

## Executive Summary

### Current State
The checkout flow has **good foundations** with some performance optimizations already in place:
- ✅ Font optimization with `display: swap`
- ✅ Code splitting with `dynamic()` imports
- ✅ Resource preloading in layout
- ✅ Optimized Next.js configuration

### Critical Issues Identified
1. **Large Bundle Sizes** - Add-ons page: 580KB (uncompressed)
2. **Build Errors** - Missing CartProvider, Suspense boundaries
3. **API Performance** - No request caching, sequential API calls
4. **Missing Optimizations** - No lazy loading, limited code splitting

### Performance Targets vs. Current
| Metric | Target | Current (Estimated) | Status |
|--------|--------|---------------------|---------|
| LCP | < 2.5s | ~3.5-4.0s | ❌ NEEDS WORK |
| FID | < 100ms | ~80-100ms | ⚠️ BORDERLINE |
| CLS | < 0.1 | ~0.05-0.08 | ✅ GOOD |
| FCP | < 1.8s | ~2.0-2.5s | ❌ NEEDS WORK |
| TTI | < 3.5s | ~4.5-5.0s | ❌ NEEDS WORK |
| PageSpeed Desktop | 90+ | ~75-80 (est.) | ❌ NEEDS WORK |
| PageSpeed Mobile | 90+ | ~60-70 (est.) | ❌ NEEDS WORK |

---

## Detailed Analysis

### 1. Bundle Size Analysis

#### Current Bundle Sizes (Uncompressed)

**Add-ons Page (`/checkout/add-ons`)**
- Main bundle: **580KB** (page.js)
- Route bundle: 28KB (page-*.js)
- **Total: ~608KB** (uncompressed)

**Checkout Page (`/checkout`)**
- Main bundle: **608KB** (page.js)
- Route bundle: 29KB (page-*.js)
- **Total: ~637KB** (uncompressed)

**Confirmation Page (`/checkout/confirmation`)**
- Route bundle: 12KB (page-*.js)
- **Total: ~12KB** (uncompressed, excluding shared chunks)

**Shared Dependencies**
- Vendor chunk: 604KB (`vendor-*.js`)
- AddOnCard component: 52KB (separate chunk)
- Polyfills: 112KB

#### Analysis
🔴 **CRITICAL:** Add-ons and Checkout pages have bundles **2-3x larger than recommended**
- Recommended max: ~200KB per route (compressed)
- Current: 580-608KB (uncompressed, likely ~150-200KB compressed)
- **Issue:** While gzipped size may be acceptable, initial parse time is still high

---

### 2. Page-by-Page Performance Analysis

#### 2.1 Add-ons Page (`/checkout/add-ons`)

**Strengths:**
- ✅ Dynamic imports for heavy components (AddOnDrawer, AddOnCard, StickySummary)
- ✅ Lazy loading of analytics with `requestIdleCallback`
- ✅ IntersectionObserver for viewport-based tracking
- ✅ React.memo-like optimizations with `useCallback` and `useMemo`
- ✅ localStorage persistence for resilience

**Performance Bottlenecks:**

1. **Large Initial Bundle (580KB)**
   - **Impact:** ~1.5-2.0s additional parse/compile time on mobile
   - **Root Cause:** All add-ons logic loaded upfront
   - **Fix Priority:** HIGH

2. **useAddOns Hook - API Call Delay**
   ```typescript
   // Current: Sequential fetch, no caching
   const response = await fetchAllAddOns();
   ```
   - **Impact:** ~300-500ms network delay + ~50-100ms parse
   - **No Cache:** Every navigation refetches
   - **Fix Priority:** HIGH

3. **Heavy Client-Side Filtering**
   ```typescript
   const filteredAndSortedAddons = useMemo(() => {
     // Filters, sorts, and calculates recommendations
     // Runs on every selectedCategory/sortBy change
   }, [addons, selectedCategory, sortBy, cart.tour, cart.participants]);
   ```
   - **Impact:** ~20-50ms per re-render
   - **Fix Priority:** MEDIUM

4. **Multiple useEffect Hooks**
   - 7 separate `useEffect` hooks executing on mount
   - **Impact:** ~50-100ms cumulative execution time
   - **Fix Priority:** LOW

5. **No Loading Skeletons**
   - Shows spinner during load
   - **Impact:** Poor perceived performance
   - **Fix Priority:** MEDIUM

**Recommendations:**

1. **Implement Request Caching** (Priority: HIGH)
   ```typescript
   // Use SWR or React Query for caching
   import useSWR from 'swr';

   const { data: addons, error, isLoading } = useSWR(
     '/api/addons',
     fetchAllAddOns,
     {
       revalidateOnFocus: false,
       revalidateOnReconnect: false,
       dedupingInterval: 60000, // 1 minute
     }
   );
   ```
   **Expected Gain:** -300ms on repeat visits

2. **Split Add-ons Data Loading** (Priority: HIGH)
   ```typescript
   // Load essential add-ons first, then defer others
   const { data: essentialAddons } = useSWR('/api/addons?category=Essential');
   const { data: allAddons } = useSWR('/api/addons', { isPaused: !essentialAddons });
   ```
   **Expected Gain:** -200ms FCP, -0.5s LCP

3. **Virtualize Add-ons List** (Priority: MEDIUM)
   - Only render visible add-on cards
   - Use `react-window` or `react-virtual`
   **Expected Gain:** -100ms TTI, -50ms long tasks

4. **Add Content Skeletons** (Priority: MEDIUM)
   ```tsx
   {isLoading && (
     <div className={styles.grid}>
       {[1,2,3,4,5,6].map(i => <AddOnCardSkeleton key={i} />)}
     </div>
   )}
   ```
   **Expected Gain:** Better perceived performance

5. **Prefetch on Hover** (Priority: LOW)
   ```typescript
   <Link
     href="/checkout"
     onMouseEnter={() => router.prefetch('/checkout')}
   >
     Continue
   </Link>
   ```
   **Expected Gain:** -200ms navigation to checkout

---

#### 2.2 Checkout Page (`/checkout`)

**Strengths:**
- ✅ Client-side only (`'use client'`) - appropriate for this page
- ✅ Form validation with real-time feedback
- ✅ Optimistic UI updates

**Performance Bottlenecks:**

1. **Large Bundle (608KB)**
   - **Impact:** Similar to add-ons page
   - **Root Cause:** All Medusa cart service loaded upfront
   - **Fix Priority:** HIGH

2. **Sequential Checkout Flow**
   ```typescript
   // Current: 8 sequential API calls
   await setCartEmail(cartId, email);
   await setShippingAddress(cartId, address);
   await setBillingAddress(cartId, address);
   await addShippingMethod(cartId, shippingId);
   await initializePaymentSessions(cartId);
   await setPaymentSession(cartId, 'manual');
   await completeCart(cartId);
   ```
   - **Impact:** ~1.5-2.5s total checkout time
   - **Fix Priority:** HIGH

3. **Cart Service Not Optimized**
   - 10-second timeout for each request
   - No request batching
   - No parallel requests where possible
   - **Impact:** Slow checkout completion
   - **Fix Priority:** HIGH

4. **Missing Form Persistence**
   - Only saves to localStorage on change
   - Could lose data on crash
   - **Fix Priority:** LOW

**Recommendations:**

1. **Parallelize Independent API Calls** (Priority: HIGH)
   ```typescript
   // Parallel where possible
   const [emailResult, addressResult] = await Promise.all([
     setCartEmail(cartId, email),
     setShippingAddress(cartId, address),
   ]);

   // Sequential only when dependencies exist
   await setBillingAddress(cartId, address);
   const shipping = await addShippingMethod(cartId, shippingId);
   ```
   **Expected Gain:** -800ms checkout completion time

2. **Implement Request Deduplication** (Priority: HIGH)
   - Prevent duplicate cart fetches
   - Use request cache for 5-10 seconds
   **Expected Gain:** -200ms on form interactions

3. **Add Progressive Enhancement** (Priority: MEDIUM)
   - Save form data to localStorage every 500ms
   - Auto-restore on page reload
   **Expected Gain:** Better UX, no performance impact

4. **Optimize Bundle with Code Splitting** (Priority: HIGH)
   ```typescript
   // Split Medusa cart service
   const { completeCart } = await import('../lib/data/cart-service');
   ```
   **Expected Gain:** -150KB initial bundle, -300ms parse time

---

#### 2.3 Confirmation Page (`/checkout/confirmation`)

**Strengths:**
- ✅ Small bundle size (12KB route-specific)
- ✅ Suspense boundary for async data
- ✅ Good error handling

**Performance Bottlenecks:**

1. **Build Error - Missing Suspense**
   ```
   ⨯ useSearchParams() should be wrapped in a suspense boundary
   ```
   - **Impact:** Build warnings, potential runtime errors
   - **Fix Priority:** HIGH (blocking)

2. **Order Fetch Not Cached**
   ```typescript
   const orderData = await getOrder(bookingId);
   ```
   - **Impact:** ~300-500ms on page load
   - **Fix Priority:** MEDIUM

**Recommendations:**

1. **Fix Suspense Boundary** (Priority: HIGH - BLOCKING)
   ```tsx
   // Already has Suspense at export, but needs at useSearchParams
   function ConfirmationContent() {
     return (
       <Suspense fallback={<LoadingSpinner />}>
         <ConfirmationWithParams />
       </Suspense>
     );
   }

   function ConfirmationWithParams() {
     const searchParams = useSearchParams();
     // ... rest of logic
   }
   ```
   **Expected Gain:** Fix build error

2. **Cache Order Data** (Priority: MEDIUM)
   - Orders don't change once created
   - Cache indefinitely in client
   **Expected Gain:** -300ms on page refresh

---

### 3. Hook Performance Analysis

#### 3.1 `useAddOns` Hook

**Current Implementation:**
```typescript
export function useAddOns(): UseAddOnsReturn {
  const [addons, setAddons] = useState<AddOn[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      fetchAddOns(); // Fetches every time
    }
  }, [fetchAddOns]);
}
```

**Issues:**
1. ❌ No caching - refetches on every mount
2. ❌ No error retry logic
3. ❌ No stale-while-revalidate pattern
4. ⚠️ Client-side only guard needed for SSR

**Optimized Version:**
```typescript
export function useAddOns(): UseAddOnsReturn {
  return useSWR('/api/addons', fetchAllAddOns, {
    revalidateOnFocus: false,
    dedupingInterval: 60000,
    fallbackData: [],
    suspense: false,
  });
}
```

**Expected Gains:**
- -300ms on repeat visits (cache hit)
- -50ms deduplication on rapid mounts
- Better error handling

---

#### 3.2 `useCart` Hook

**Current Implementation:**
```typescript
export function useCart() {
  const [cart, setCart] = useState<CartState>(getInitialCartState);

  // Syncs with Medusa on every operation
  const addAddOn = useCallback(async (addon: AddOn) => {
    // Optimistic update
    setCart(prev => ...);

    // Async Medusa sync (fire-and-forget)
    syncWithMedusa();
  }, []);
}
```

**Issues:**
1. ✅ Good: Optimistic updates
2. ✅ Good: localStorage persistence
3. ⚠️ Potential race conditions with concurrent updates
4. ❌ No abort controller for cancelled operations

**Recommendations:**
```typescript
const syncWithMedusa = useCallback(async () => {
  const controller = new AbortController();

  try {
    await fetch(url, { signal: controller.signal });
  } catch (error) {
    if (error.name !== 'AbortError') throw error;
  }

  return () => controller.abort();
}, []);
```

**Expected Gains:**
- Prevents memory leaks on unmount
- Better error handling

---

### 4. Build Errors & Warnings

#### Critical Build Errors

1. **Missing Suspense Boundary** (BLOCKING)
   - **File:** `/checkout/confirmation/page.tsx`
   - **Error:** `useSearchParams() should be wrapped in a suspense boundary`
   - **Fix:** Wrap component using `useSearchParams` in `<Suspense>`

2. **Missing CartProvider** (BLOCKING)
   - **File:** `/addons/page.tsx`
   - **Error:** `useCart must be used within a CartProvider`
   - **Fix:** Either:
     - Create CartProvider context, OR
     - Move cart logic to root layout, OR
     - Use alternative state management

#### Warnings (Non-blocking but should fix)

1. **Metadata themeColor Deprecated**
   - **Count:** 14 occurrences
   - **Fix:** Move to `viewport` export
   ```typescript
   // Before
   export const metadata = { themeColor: '#1a5f3f' };

   // After
   export const viewport = { themeColor: '#1a5f3f' };
   ```

---

## Optimization Implementation Plan

### Phase 1: Critical Fixes (Priority: HIGH - Week 1)

#### 1.1 Fix Build Errors
- [ ] Add Suspense boundary to confirmation page
- [ ] Create CartProvider or refactor cart state management
- [ ] Fix metadata themeColor warnings
- **Expected Time:** 2-3 hours
- **Expected Impact:** Enable clean builds

#### 1.2 Implement Request Caching
- [ ] Install SWR: `npm install swr`
- [ ] Wrap useAddOns with SWR
- [ ] Add cache config for optimal performance
- **Expected Time:** 3-4 hours
- **Expected Impact:** -300ms repeat visits

#### 1.3 Optimize Cart Service
- [ ] Parallelize independent API calls in checkout flow
- [ ] Add request deduplication
- [ ] Reduce timeout from 10s to 5s for faster failures
- **Expected Time:** 4-6 hours
- **Expected Impact:** -800ms checkout completion

#### 1.4 Code Splitting Improvements
- [ ] Split cart-service into smaller modules
- [ ] Lazy load confirmation page components
- [ ] Defer non-critical analytics
- **Expected Time:** 3-4 hours
- **Expected Impact:** -150KB initial bundle, -300ms parse

---

### Phase 2: Performance Enhancements (Priority: MEDIUM - Week 2)

#### 2.1 Add Loading Skeletons
- [ ] Create AddOnCardSkeleton component
- [ ] Create FormSkeleton for checkout page
- [ ] Add shimmer animation for better UX
- **Expected Time:** 4-5 hours
- **Expected Impact:** Better perceived performance

#### 2.2 Optimize Add-ons Filtering
- [ ] Move recommendations calculation to server/API
- [ ] Cache recommendation results
- [ ] Debounce sort/filter changes
- **Expected Time:** 3-4 hours
- **Expected Impact:** -20ms per interaction

#### 2.3 Add Prefetching
- [ ] Prefetch /checkout on add-ons page hover
- [ ] Prefetch /confirmation on checkout submit
- [ ] Preload critical data on route transition
- **Expected Time:** 2-3 hours
- **Expected Impact:** -200ms navigation

---

### Phase 3: Advanced Optimizations (Priority: LOW - Week 3)

#### 3.1 Virtualize Add-ons List
- [ ] Install react-window: `npm install react-window`
- [ ] Implement virtual scrolling for add-ons grid
- [ ] Add scroll restoration
- **Expected Time:** 5-6 hours
- **Expected Impact:** -100ms TTI for large lists

#### 3.2 Service Worker Caching
- [ ] Add Next.js PWA plugin
- [ ] Cache static assets
- [ ] Cache API responses (with TTL)
- **Expected Time:** 6-8 hours
- **Expected Impact:** Offline support, -500ms repeat visits

#### 3.3 Image Optimization (if images added)
- [ ] Use Next.js Image component
- [ ] Implement lazy loading
- [ ] Generate WebP/AVIF formats
- **Expected Time:** N/A (no images currently)
- **Expected Impact:** N/A

---

## Expected Performance Improvements

### After Phase 1 (Critical Fixes)
| Metric | Before | After Phase 1 | Improvement |
|--------|--------|---------------|-------------|
| LCP | ~3.5-4.0s | ~2.5-3.0s | -1.0s (25-30%) |
| FCP | ~2.0-2.5s | ~1.5-1.8s | -0.5s (25%) |
| TTI | ~4.5-5.0s | ~3.5-4.0s | -1.0s (20%) |
| Bundle Size | 608KB | 450KB | -158KB (26%) |
| PageSpeed Desktop | ~75-80 | ~85-90 | +10 points |
| PageSpeed Mobile | ~60-70 | ~75-80 | +15 points |

### After Phase 2 (Enhancements)
| Metric | After Phase 1 | After Phase 2 | Improvement |
|--------|---------------|---------------|-------------|
| LCP | ~2.5-3.0s | ~2.0-2.4s | -0.5s |
| FCP | ~1.5-1.8s | ~1.2-1.5s | -0.3s |
| TTI | ~3.5-4.0s | ~3.0-3.4s | -0.5s |
| PageSpeed Desktop | ~85-90 | ~90-95 | +5 points |
| PageSpeed Mobile | ~75-80 | ~85-90 | +10 points |

### After Phase 3 (Advanced)
| Metric | After Phase 2 | After Phase 3 | Final Target |
|--------|---------------|---------------|--------------|
| LCP | ~2.0-2.4s | < 2.0s | ✅ PASS |
| FCP | ~1.2-1.5s | < 1.2s | ✅ PASS |
| TTI | ~3.0-3.4s | < 3.0s | ✅ PASS |
| PageSpeed Desktop | ~90-95 | 95+ | ✅ PASS |
| PageSpeed Mobile | ~85-90 | 90+ | ✅ PASS |

---

## Quick Wins (Immediate Implementation)

### 1. Fix Build Errors (30 mins)
```typescript
// confirmation/page.tsx - Add Suspense wrapper
function ConfirmationWithParams() {
  const searchParams = useSearchParams();
  // ... existing logic
}

export default function ConfirmationPage() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <ConfirmationWithParams />
    </Suspense>
  );
}
```

### 2. Add Request Caching (1 hour)
```bash
npm install swr
```

```typescript
// lib/hooks/useAddOns.ts
import useSWR from 'swr';

export function useAddOns() {
  const { data, error, isLoading } = useSWR(
    'addons',
    fetchAllAddOns,
    {
      revalidateOnFocus: false,
      dedupingInterval: 60000,
    }
  );

  return {
    addons: data?.addons || [],
    isLoading,
    error,
    dataSource: data?.source,
  };
}
```

### 3. Parallelize Checkout API Calls (2 hours)
```typescript
// In handleCompleteBooking()
// BEFORE: Sequential (slow)
await setCartEmail(cartId, email);
await setShippingAddress(cartId, address);

// AFTER: Parallel (fast)
await Promise.all([
  setCartEmail(cartId, email),
  setShippingAddress(cartId, address),
  setBillingAddress(cartId, address),
]);
```

**Expected Total Impact from Quick Wins:**
- -500ms checkout completion time
- -300ms add-ons page load on repeat visits
- Clean builds with no errors

---

## Monitoring & Testing Plan

### 1. Performance Monitoring Setup

**Install Web Vitals Reporting:**
```typescript
// components/WebVitals.tsx
import { useReportWebVitals } from 'next/web-vitals';

export function WebVitals() {
  useReportWebVitals((metric) => {
    // Send to analytics
    console.log(metric);

    // Track in Medusa or external service
    if (process.env.NODE_ENV === 'production') {
      fetch('/api/analytics', {
        method: 'POST',
        body: JSON.stringify(metric),
      });
    }
  });
}
```

### 2. Lighthouse CI Integration

**Add to `.github/workflows/lighthouse.yml`:**
```yaml
name: Lighthouse CI
on: [pull_request]
jobs:
  lighthouse:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Run Lighthouse
        uses: treosh/lighthouse-ci-action@v9
        with:
          urls: |
            http://localhost:8000/checkout/add-ons
            http://localhost:8000/checkout
          budgetPath: ./lighthouse-budget.json
          temporaryPublicStorage: true
```

### 3. Performance Budgets

**Create `lighthouse-budget.json`:**
```json
{
  "budgets": [
    {
      "path": "/*",
      "timings": [
        { "metric": "first-contentful-paint", "budget": 1800 },
        { "metric": "largest-contentful-paint", "budget": 2500 },
        { "metric": "interactive", "budget": 3500 }
      ],
      "resourceSizes": [
        { "resourceType": "script", "budget": 300 },
        { "resourceType": "total", "budget": 500 }
      ]
    }
  ]
}
```

### 4. Testing Checklist

**Before Deployment:**
- [ ] Run Lighthouse on all 3 pages (desktop & mobile)
- [ ] Verify LCP < 2.5s on 4G throttled connection
- [ ] Check bundle sizes: `npm run build && du -sh .next/static/chunks/app/*`
- [ ] Test on real mobile device (Android mid-range)
- [ ] Verify no console errors or warnings
- [ ] Check network waterfall in DevTools
- [ ] Validate Core Web Vitals in PageSpeed Insights

**After Deployment:**
- [ ] Monitor real user metrics (RUM) for 48 hours
- [ ] Check error rates in production logs
- [ ] Verify conversion rates haven't decreased
- [ ] Monitor checkout completion times

---

## Conclusion

### Current Performance Summary
The checkout flow has **good foundations** but requires **significant optimizations** to meet PageSpeed 90+ targets:
- ✅ Font optimization already in place
- ✅ Some code splitting implemented
- ❌ Large bundle sizes (580-608KB)
- ❌ No request caching
- ❌ Sequential API calls slowing checkout

### Priority Actions (This Week)
1. **Fix build errors** (blocking) - 2-3 hours
2. **Implement request caching with SWR** - 3-4 hours
3. **Parallelize checkout API calls** - 4-6 hours
4. **Reduce bundle sizes** - 3-4 hours

**Total Effort:** 12-17 hours (~2 days)

**Expected Results After Priority Actions:**
- PageSpeed Desktop: 85-90 (from ~75-80)
- PageSpeed Mobile: 75-80 (from ~60-70)
- LCP: ~2.5-3.0s (from ~3.5-4.0s)
- Clean builds with no errors

### Next Steps

1. **Week 1:** Implement Phase 1 (Critical Fixes)
2. **Week 2:** Implement Phase 2 (Enhancements) + measure improvements
3. **Week 3:** Implement Phase 3 (Advanced) + final testing
4. **Week 4:** Monitor production metrics, iterate based on real data

### Success Criteria
- ✅ PageSpeed Desktop: 90+
- ✅ PageSpeed Mobile: 90+
- ✅ All Core Web Vitals in "Good" range
- ✅ No build errors or warnings
- ✅ Checkout completion time < 2.5s

---

## Appendix

### A. Dependencies Analysis

**Current Dependencies:**
```json
{
  "@medusajs/js-sdk": "2.11.3",     // 🔴 Large (est. ~200KB)
  "next": "14.2.33",                // ✅ Core framework
  "react": "18.3.1",                // ✅ Core framework
  "web-vitals": "3.5.2",            // ✅ Small (~5KB)
  "isomorphic-dompurify": "2.31.0"  // ⚠️ Medium (~50KB)
}
```

**Recommended Additions:**
- `swr@2.2.4` - Request caching (~10KB)
- `react-window@1.8.10` - Virtual scrolling (optional, ~20KB)

### B. File Sizes Reference

**Compression Ratios (typical):**
- Gzip: ~65-70% reduction
- Brotli: ~70-75% reduction

**Example:**
- 580KB uncompressed → ~180KB gzipped → ~145KB brotli

**Mobile Parse Times (3G):**
- 100KB: ~100-150ms
- 200KB: ~200-300ms
- 500KB: ~500-800ms ❌ Too slow

### C. Useful Commands

```bash
# Build and analyze bundles
npm run build

# Check bundle sizes
du -sh .next/static/chunks/app/*

# Run Lighthouse
npm install -g lighthouse
lighthouse http://localhost:8000/checkout/add-ons --view

# Check TypeScript
npm run type-check

# Run all tests
npm test
```

### D. Resources

- [Next.js Performance Best Practices](https://nextjs.org/docs/pages/building-your-application/optimizing)
- [Web.dev Core Web Vitals](https://web.dev/vitals/)
- [Lighthouse Performance Scoring](https://web.dev/performance-scoring/)
- [Medusa Storefront Development](https://docs.medusajs.com/resources/storefront-development)

---

**Report Generated:** November 8, 2025
**Next Review:** After Phase 1 implementation (1 week)
