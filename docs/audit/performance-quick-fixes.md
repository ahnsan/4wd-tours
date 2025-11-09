# Performance Quick Fixes Checklist

**Priority order for maximum impact with minimal effort**

---

## 🔴 CRITICAL - Do Today (6-8 hours)

### 1. Image Optimization (2-3 hours)

**Tools needed:**
```bash
# Install sharp for image optimization
npm install -g sharp-cli

# Or use online tools:
# - squoosh.app (Google)
# - tinypng.com
# - imageoptim.com (Mac)
```

**Commands:**
```bash
cd /Users/Karim/med-usa-4wd/storefront/public/images

# Convert PNG to WebP (target: 80% quality)
sharp hero.png -o hero.webp --webp-quality 80
sharp footer.png -o footer.webp --webp-quality 80
sharp tour_options.png -o tour_options.webp --webp-quality 80

# Convert to AVIF for modern browsers
sharp hero.png -o hero.avif --avif-quality 75
sharp footer.png -o footer.avif --avif-quality 75
sharp tour_options.png -o tour_options.avif --avif-quality 75

# Delete duplicate/backup files
rm hero_clean.png hero_original_backup.png
```

**Verify sizes:**
```bash
# Target sizes:
# hero.webp: < 120KB (currently 1.2MB PNG)
# hero.avif: < 80KB
# footer.webp: < 90KB (currently 2.1MB PNG)
# tour_options.webp: < 90KB (currently 2.1MB PNG)
```

**Expected gain:** LCP -2.0s, PageSpeed +20 points

---

### 2. Add Database Indexes (1 hour)

**File:** `/src/modules/blog/models/post.ts`

```typescript
import { model } from "@medusajs/framework/utils"

const Post = model.define("post", {
  id: model.id().primaryKey(),
  title: model.text(),
  slug: model.text().unique(),
  content: model.text(),
  excerpt: model.text().nullable(),
  featured_image: model.text().nullable(),
  seo_title: model.text().nullable(),
  seo_description: model.text().nullable(),

  // ✅ ADD INDEXES HERE
  published_at: model.dateTime().nullable().index(),
  is_published: model.boolean().default(false).index(),
  author_id: model.text().nullable().index(),
  category_id: model.text().nullable().index(),

  product_ids: model.json().nullable(),
  tags: model.json().nullable(),
})
// ✅ ADD COMPOUND INDEX
.index(['is_published', 'published_at'])

export default Post
```

**After editing, create migration:**
```bash
cd /Users/Karim/med-usa-4wd
npm run build
# Migration will be auto-generated
```

**Expected gain:** API response 5-8x faster (from 300-800ms to 50-150ms)

---

### 3. Convert Tours Page to SSR (3-4 hours)

#### Step 1: Create Server Component for Tours Page

**File:** `/storefront/app/tours/page.tsx`

**REPLACE entire file with:**

```tsx
// Tour catalog page with SSR and ISR
import React from 'react';
import TourCard from '../../components/Tours/TourCard';
import FilterBarClient from '../../components/Tours/FilterBarClient'; // Will create
import styles from './tours.module.css';
import type { TourFilters } from '../../lib/types/tour';

// ✅ ADD ISR
export const revalidate = 1800; // 30 minutes

// ✅ Server-side data fetching
async function fetchTours(filters: TourFilters) {
  const params = new URLSearchParams();
  params.append('collection_id[]', 'tours');

  if (filters.duration) params.append('duration', filters.duration);
  if (filters.sort) params.append('sort', filters.sort);
  if (filters.search) params.append('q', filters.search);
  if (filters.page) params.append('offset', ((filters.page - 1) * (filters.per_page || 12)).toString());
  if (filters.per_page) params.append('limit', filters.per_page.toString());

  const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:9000';
  const response = await fetch(`${baseUrl}/store/products?${params.toString()}`, {
    headers: { 'Content-Type': 'application/json' },
    next: { revalidate: 1800 },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch tours');
  }

  return response.json();
}

export default async function ToursPage({ searchParams }: { searchParams: TourFilters }) {
  const filters: TourFilters = {
    per_page: 12,
    page: Number(searchParams.page) || 1,
    duration: searchParams.duration,
    sort: searchParams.sort,
    search: searchParams.search,
  };

  const data = await fetchTours(filters);
  const tours = data.products || [];
  const meta = {
    count: data.count || 0,
    offset: data.offset || 0,
    limit: data.limit || 12,
  };

  const totalPages = Math.ceil(meta.count / (filters.per_page || 12));
  const currentPage = filters.page || 1;

  return (
    <div className={styles.toursPage}>
      <header className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>Sunshine Coast 4WD Tours</h1>
        <p className={styles.pageSubtitle}>
          Discover the best 4WD adventures on the Sunshine Coast.
        </p>
      </header>

      <FilterBarClient />

      <main className={styles.mainContent}>
        {tours.length > 0 ? (
          <>
            <div className={styles.resultsInfo}>
              <p>Showing {meta.offset + 1}-{Math.min(meta.offset + meta.limit, meta.count)} of {meta.count} tours</p>
            </div>

            <div className={styles.toursGrid}>
              {tours.map((tour: any) => (
                <TourCard key={tour.id} tour={tour} />
              ))}
            </div>

            {/* Pagination - simplified for SSR */}
            {totalPages > 1 && (
              <nav className={styles.pagination}>
                {currentPage > 1 && (
                  <a href={`/tours?page=${currentPage - 1}`} className={styles.paginationButton}>
                    Previous
                  </a>
                )}
                <span>{currentPage} / {totalPages}</span>
                {currentPage < totalPages && (
                  <a href={`/tours?page=${currentPage + 1}`} className={styles.paginationButton}>
                    Next
                  </a>
                )}
              </nav>
            )}
          </>
        ) : (
          <div className={styles.emptyContainer}>
            <h2>No Tours Found</h2>
          </div>
        )}
      </main>
    </div>
  );
}
```

#### Step 2: Create Client Filter Component

**File:** `/storefront/components/Tours/FilterBarClient.tsx` (NEW FILE)

```tsx
'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import styles from './FilterBar.module.css';

export default function FilterBarClient() {
  const router = useRouter();
  const [duration, setDuration] = useState('');
  const [sort, setSort] = useState('');
  const [search, setSearch] = useState('');

  const handleFilterChange = () => {
    const params = new URLSearchParams();
    if (duration) params.append('duration', duration);
    if (sort) params.append('sort', sort);
    if (search) params.append('search', search);

    router.push(`/tours?${params.toString()}`);
  };

  return (
    <div className={styles.filterBar}>
      <input
        type="text"
        placeholder="Search tours..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        onKeyPress={(e) => e.key === 'Enter' && handleFilterChange()}
      />
      <select value={duration} onChange={(e) => setDuration(e.target.value)}>
        <option value="">All Durations</option>
        <option value="half-day">Half Day</option>
        <option value="full-day">Full Day</option>
        <option value="multi-day">Multi Day</option>
      </select>
      <select value={sort} onChange={(e) => setSort(e.target.value)}>
        <option value="">Sort By</option>
        <option value="price_asc">Price: Low to High</option>
        <option value="price_desc">Price: High to Low</option>
      </select>
      <button onClick={handleFilterChange}>Apply Filters</button>
    </div>
  );
}
```

**Expected gain:** FCP -1.0s, LCP -1.5s, PageSpeed +15 points

---

## ⚠️ HIGH PRIORITY - Do This Week (5-6 hours)

### 4. Optimize Font Loading (1 hour)

**File:** `/storefront/app/layout.tsx`

**Remove lines 223-252 (Google Fonts link):**
```tsx
// ❌ DELETE THIS:
<link rel="dns-prefetch" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond..." rel="stylesheet" />
```

**Add at top of file:**
```tsx
import { Lato, Lora } from 'next/font/google';

const lato = Lato({
  weight: ['400', '700'],
  subsets: ['latin'],
  display: 'swap',
  preload: true,
  variable: '--font-lato',
});

const lora = Lora({
  weight: ['400', '500'],
  subsets: ['latin'],
  display: 'swap',
  preload: true,
  variable: '--font-lora',
});
```

**Update body tag:**
```tsx
<body className={`${lato.variable} ${lora.variable}`}>
```

**Update globals.css:**
```css
:root {
  --font-lato: 'Lato', sans-serif;
  --font-lora: 'Lora', serif;
}

body {
  font-family: var(--font-lato);
}

h1, h2, h3 {
  font-family: var(--font-lora);
}
```

**Expected gain:** FCP -400ms, CLS -0.10

---

### 5. Parallel API Calls (2 hours)

**File:** `/storefront/app/tours/[handle]/page.tsx`

**Find lines 28-93, replace fetchTourData with:**

```tsx
useEffect(() => {
  async function fetchTourData() {
    try {
      setLoading(true);

      // ✅ PARALLEL fetching instead of sequential
      const [tourData, relatedData] = await Promise.all([
        fetch(`${API_BASE_URL}/store/products?handle=${params.handle}`).then(r => r.json()),
        fetch(`${API_BASE_URL}/store/products?limit=3&offset=0`).then(r => r.json()),
      ]);

      const tourProduct = tourData.products?.[0];
      if (!tourProduct) throw new Error('Tour not found');

      setTour(tourProduct);
      if (tourProduct.variants?.length > 0) {
        setSelectedVariantId(tourProduct.variants[0].id);
      }

      // Filter related tours
      const related = relatedData.products
        ?.filter((p: TourProduct) => p.id !== tourProduct.id)
        ?.slice(0, 3)
        ?.map((p: TourProduct) => ({...})) || [];

      setRelatedTours(related);
      setLoading(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load tour');
      setLoading(false);
    }
  }

  fetchTourData();
}, [params.handle]);
```

**Expected gain:** Page load -600ms

---

### 6. Add Bundle Analyzer (30 min)

```bash
cd /Users/Karim/med-usa-4wd/storefront
npm install --save-dev @next/bundle-analyzer
```

**File:** `/storefront/next.config.js`

**Add at top:**
```javascript
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});
```

**Change last line from:**
```javascript
module.exports = nextConfig
```

**To:**
```javascript
module.exports = withBundleAnalyzer(nextConfig)
```

**Run analysis:**
```bash
ANALYZE=true npm run build
```

---

### 7. Fix N+1 Query (2 hours)

**File:** `/src/modules/blog/service.ts`

**Replace getPostsByProductId method (lines 57-67) with:**

```typescript
/**
 * Get posts by product ID (optimized)
 */
async getPostsByProductId(productId: string) {
  // ✅ Database-level filtering instead of in-memory
  return await this.listPosts({
    is_published: true,
    product_ids: {
      $contains: productId,  // JSONB contains operator
    }
  }, {
    order: {
      published_at: "DESC",
    },
  })
}
```

**Expected gain:** API response -400-600ms

---

## Testing Commands

### Test Performance Locally

```bash
# Build production version
cd /Users/Karim/med-usa-4wd/storefront
npm run build
npm run start

# In another terminal, test with Lighthouse
npx lighthouse http://localhost:8000 --view

# Test specific pages
npx lighthouse http://localhost:8000/tours --view
npx lighthouse http://localhost:8000/blog --view
```

### Monitor Web Vitals in Dev

```bash
npm run dev
# Open browser console to see Web Vitals logging
```

### Check Image Sizes

```bash
cd /Users/Karim/med-usa-4wd/storefront/public/images
ls -lh *.webp *.avif

# Should see:
# hero.webp: ~80-120KB
# hero.avif: ~50-80KB
# footer.webp: ~60-90KB
# tour_options.webp: ~60-90KB
```

---

## Quick Validation Checklist

After each fix, verify:

- [ ] `npm run build` completes without errors
- [ ] Pages load correctly in browser
- [ ] Web Vitals console shows improved metrics
- [ ] Lighthouse score improved
- [ ] No broken images
- [ ] API calls return data correctly

---

## Estimated Timeline

| Day | Tasks | Hours | Cumulative |
|-----|-------|-------|------------|
| Day 1 | Image optimization | 2-3h | 3h |
| Day 1 | Database indexes | 1h | 4h |
| Day 1-2 | Tours SSR conversion | 3-4h | 8h |
| Day 2 | Font optimization | 1h | 9h |
| Day 2 | Parallel API calls | 2h | 11h |
| Day 3 | Bundle analyzer | 0.5h | 11.5h |
| Day 3 | Fix N+1 query | 2h | 13.5h |

**Total: 13.5 hours over 3 days**

**Expected Result:**
- ✅ PageSpeed Desktop: 90+
- ✅ PageSpeed Mobile: 88-92
- ✅ LCP: < 2.2s
- ✅ All other Core Web Vitals: Green

---

## Before You Start

1. **Backup your code:**
```bash
cd /Users/Karim/med-usa-4wd
git add .
git commit -m "Backup before performance optimization"
git branch performance-optimization
git checkout performance-optimization
```

2. **Install required tools:**
```bash
npm install -g sharp-cli lighthouse
```

3. **Verify environment:**
```bash
node --version  # Should be >= 20
npm --version
```

---

## After Completing Fixes

Run full test:
```bash
cd /Users/Karim/med-usa-4wd/storefront
npm run build
npm run start

# In another terminal
npx lighthouse http://localhost:8000 --output=html --output-path=./lighthouse-report.html --view
```

Target scores:
- Performance: 90+
- Accessibility: 95+
- Best Practices: 95+
- SEO: 100

---

**Good luck! Each fix will show immediate improvement in Lighthouse scores.**
