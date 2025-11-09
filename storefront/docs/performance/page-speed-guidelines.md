# PageSpeed Guidelines

## Performance Objectives

### MANDATORY Targets

| Metric | Desktop | Mobile | Priority |
|--------|---------|--------|----------|
| **PageSpeed Insights Score** | ≥ 90 | ≥ 90 | CRITICAL |
| **Lighthouse Performance** | ≥ 90 | ≥ 90 | CRITICAL |
| **First Contentful Paint (FCP)** | < 1.8s | < 3.0s | HIGH |
| **Largest Contentful Paint (LCP)** | < 2.5s | < 4.0s | CRITICAL |
| **Time to Interactive (TTI)** | < 3.8s | < 7.3s | HIGH |
| **Total Blocking Time (TBT)** | < 200ms | < 600ms | HIGH |
| **Cumulative Layout Shift (CLS)** | < 0.1 | < 0.1 | CRITICAL |
| **Speed Index** | < 3.4s | < 5.8s | MEDIUM |

### RECOMMENDED Targets

| Metric | Desktop | Mobile |
|--------|---------|--------|
| **Time to First Byte (TTFB)** | < 600ms | < 800ms |
| **First Input Delay (FID)** | < 100ms | < 100ms |
| **Interaction to Next Paint (INP)** | < 200ms | < 200ms |

---

## Core Metrics Deep Dive

### 1. Largest Contentful Paint (LCP) - MANDATORY

**Target: < 2.5s (mobile: < 4.0s)**

LCP measures loading performance. The largest content element should render within 2.5 seconds of page load start.

#### Optimization Strategies

**Server-Side Optimizations:**
```typescript
// app/layout.tsx - Priority resource hints
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        {/* MANDATORY: Preconnect to critical origins */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link rel="preconnect" href="https://cdn.yourdomain.com" />

        {/* MANDATORY: DNS prefetch for third-party domains */}
        <link rel="dns-prefetch" href="https://www.google-analytics.com" />
        <link rel="dns-prefetch" href="https://www.googletagmanager.com" />
      </head>
      <body>{children}</body>
    </html>
  );
}
```

**Image Optimization (MANDATORY):**
```typescript
// components/HeroImage.tsx
import Image from 'next/image';

export function HeroImage() {
  return (
    <Image
      src="/hero-image.jpg"
      alt="Hero banner"
      width={1920}
      height={1080}
      priority // MANDATORY for LCP images
      quality={85} // MANDATORY: Balance quality vs size
      placeholder="blur"
      blurDataURL="data:image/jpeg;base64,..." // RECOMMENDED
      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 1920px"
    />
  );
}
```

**Critical CSS Extraction:**
```typescript
// next.config.js
module.exports = {
  experimental: {
    optimizeCss: true, // MANDATORY: Enable CSS optimization
  },
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production', // RECOMMENDED
  },
};
```

**Font Loading (MANDATORY):**
```typescript
// app/layout.tsx - Use next/font
import { Inter, Roboto } from 'next/font/google';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap', // MANDATORY: Prevent FOIT
  preload: true, // MANDATORY
  variable: '--font-inter',
});

const roboto = Roboto({
  weight: ['400', '700'],
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-roboto',
});

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${inter.variable} ${roboto.variable}`}>
      <body>{children}</body>
    </html>
  );
}
```

---

### 2. First Input Delay (FID) / Interaction to Next Paint (INP) - MANDATORY

**Target: < 100ms (FID), < 200ms (INP)**

FID/INP measures interactivity. Pages should respond to user input within 100ms.

#### Optimization Strategies

**Code Splitting (MANDATORY):**
```typescript
// app/product/[id]/page.tsx
import dynamic from 'next/dynamic';

// MANDATORY: Lazy load non-critical components
const ProductReviews = dynamic(() => import('@/components/ProductReviews'), {
  loading: () => <ReviewsSkeleton />,
  ssr: false, // Client-side only if not needed for SEO
});

const RelatedProducts = dynamic(() => import('@/components/RelatedProducts'), {
  loading: () => <ProductGridSkeleton />,
});

export default function ProductPage({ params }) {
  return (
    <div>
      <ProductDetails id={params.id} /> {/* Critical: Server-side */}
      <Suspense fallback={<ReviewsSkeleton />}>
        <ProductReviews productId={params.id} />
      </Suspense>
      <Suspense fallback={<ProductGridSkeleton />}>
        <RelatedProducts productId={params.id} />
      </Suspense>
    </div>
  );
}
```

**Debouncing/Throttling (MANDATORY for search and filters):**
```typescript
// hooks/useDebounce.ts
import { useEffect, useState } from 'react';

export function useDebounce<T>(value: T, delay: number = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => clearTimeout(handler);
  }, [value, delay]);

  return debouncedValue;
}

// Usage in search component
function SearchBar() {
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearch = useDebounce(searchTerm, 300); // MANDATORY: 300ms delay

  useEffect(() => {
    if (debouncedSearch) {
      performSearch(debouncedSearch);
    }
  }, [debouncedSearch]);

  return <input onChange={(e) => setSearchTerm(e.target.value)} />;
}
```

**Web Workers for Heavy Computation (RECOMMENDED):**
```typescript
// workers/dataProcessor.worker.ts
self.addEventListener('message', (e) => {
  const { data, operation } = e.data;

  let result;
  switch (operation) {
    case 'filterProducts':
      result = data.filter(/* complex filtering logic */);
      break;
    case 'sortProducts':
      result = data.sort(/* complex sorting logic */);
      break;
  }

  self.postMessage(result);
});

// components/ProductList.tsx
import { useEffect, useState } from 'react';

function ProductList({ products }) {
  const [filteredProducts, setFilteredProducts] = useState(products);

  useEffect(() => {
    const worker = new Worker(new URL('../workers/dataProcessor.worker.ts', import.meta.url));

    worker.postMessage({ data: products, operation: 'filterProducts' });
    worker.onmessage = (e) => setFilteredProducts(e.data);

    return () => worker.terminate();
  }, [products]);

  return <div>{/* Render filtered products */}</div>;
}
```

**Event Handler Optimization (MANDATORY):**
```typescript
// MANDATORY: Use passive event listeners for scroll/touch
useEffect(() => {
  const handleScroll = () => {
    // Scroll handling logic
  };

  window.addEventListener('scroll', handleScroll, { passive: true });
  return () => window.removeEventListener('scroll', handleScroll);
}, []);

// MANDATORY: Memoize callbacks
const handleClick = useCallback(() => {
  // Click handling logic
}, [dependencies]);
```

---

### 3. Cumulative Layout Shift (CLS) - MANDATORY

**Target: < 0.1**

CLS measures visual stability. Prevent unexpected layout shifts during page load.

#### Optimization Strategies

**Image/Video Dimensions (MANDATORY):**
```typescript
// MANDATORY: Always specify width and height
<Image
  src="/product.jpg"
  alt="Product"
  width={600}
  height={400}
  sizes="(max-width: 768px) 100vw, 600px"
/>

// For responsive images, maintain aspect ratio
<div style={{ aspectRatio: '16/9', position: 'relative' }}>
  <Image
    src="/banner.jpg"
    alt="Banner"
    fill
    style={{ objectFit: 'cover' }}
  />
</div>
```

**Font Loading (MANDATORY):**
```css
/* MANDATORY: Use font-display: swap */
@font-face {
  font-family: 'CustomFont';
  src: url('/fonts/custom-font.woff2') format('woff2');
  font-display: swap; /* Prevents invisible text and layout shift */
  font-weight: 400;
  font-style: normal;
}
```

**Reserve Space for Dynamic Content (MANDATORY):**
```typescript
// MANDATORY: Use skeleton loaders
function ProductCard({ productId }: { productId: string }) {
  const { data: product, isLoading } = useProduct(productId);

  if (isLoading) {
    return (
      <div className="product-card" style={{ minHeight: '400px' }}>
        <Skeleton height={200} /> {/* Image skeleton */}
        <Skeleton height={24} width="80%" /> {/* Title skeleton */}
        <Skeleton height={20} width="60%" /> {/* Price skeleton */}
      </div>
    );
  }

  return (
    <div className="product-card">
      <Image src={product.image} alt={product.name} width={200} height={200} />
      <h3>{product.name}</h3>
      <p>{product.price}</p>
    </div>
  );
}
```

**Animation Best Practices (MANDATORY):**
```css
/* MANDATORY: Only animate transform and opacity */
.animated-element {
  /* ✅ GOOD: GPU-accelerated properties */
  transition: transform 0.3s ease, opacity 0.3s ease;
  will-change: transform, opacity;
}

.animated-element:hover {
  transform: translateY(-5px);
  opacity: 0.9;
}

/* ❌ BAD: Causes layout shifts */
.bad-animation {
  transition: width 0.3s ease, height 0.3s ease, margin 0.3s ease;
}
```

---

## Image Optimization Requirements

### MANDATORY Image Optimization Checklist

- [ ] **Use Next.js Image component** for all images
- [ ] **Set explicit width/height** or use `fill` prop
- [ ] **Use `priority` prop** for LCP images (hero images, above-fold content)
- [ ] **Lazy load** below-fold images (default behavior)
- [ ] **Optimize quality**: 75-85 for photos, 100 for logos/icons
- [ ] **Use WebP format** (Next.js Image handles automatically)
- [ ] **Implement responsive images** with `sizes` prop
- [ ] **Add blur placeholders** for better perceived performance

### Image Configuration

```typescript
// next.config.js - MANDATORY configuration
module.exports = {
  images: {
    formats: ['image/avif', 'image/webp'], // MANDATORY: Modern formats
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840], // MANDATORY
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384], // MANDATORY
    minimumCacheTTL: 60, // MANDATORY: Cache for 60 seconds minimum
    domains: ['cdn.yourdomain.com', 'images.yourdomain.com'], // MANDATORY: Allowed domains
  },
};
```

### Image Size Guidelines (MANDATORY)

| Image Type | Max File Size | Recommended Format | Quality |
|------------|---------------|-------------------|---------|
| Hero/Banner | 150 KB | WebP/AVIF | 80-85 |
| Product Images | 80 KB | WebP/AVIF | 75-80 |
| Thumbnails | 20 KB | WebP/AVIF | 70-75 |
| Icons | 10 KB | SVG (preferred) or WebP | 100 |
| Logos | 15 KB | SVG (preferred) or PNG | 100 |

---

## JavaScript Optimization

### Bundle Size Requirements (MANDATORY)

| Bundle Type | Max Size (Gzipped) | Priority |
|-------------|-------------------|----------|
| **First Load JS** | < 200 KB | CRITICAL |
| **Page-specific JS** | < 100 KB | HIGH |
| **Vendor JS** | < 150 KB | HIGH |

### Bundle Analysis (MANDATORY before deployment)

```bash
# MANDATORY: Run bundle analysis before every production build
npm run build -- --analyze

# Or add to package.json
{
  "scripts": {
    "analyze": "ANALYZE=true npm run build"
  }
}
```

```typescript
// next.config.js - Enable bundle analyzer
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});

module.exports = withBundleAnalyzer({
  // ... other config
});
```

### Code Splitting Strategies (MANDATORY)

```typescript
// 1. MANDATORY: Route-based splitting (automatic in Next.js App Router)
// Each page is automatically split

// 2. MANDATORY: Component-based splitting
import dynamic from 'next/dynamic';

const HeavyChart = dynamic(() => import('@/components/HeavyChart'), {
  loading: () => <ChartSkeleton />,
  ssr: false,
});

// 3. MANDATORY: Conditional loading
const AdminPanel = dynamic(() => import('@/components/AdminPanel'), {
  ssr: false,
});

function Dashboard({ isAdmin }) {
  return (
    <div>
      <DashboardStats />
      {isAdmin && <AdminPanel />} {/* Only loads for admins */}
    </div>
  );
}

// 4. RECOMMENDED: Library-specific imports
// ❌ BAD: Imports entire lodash
import _ from 'lodash';

// ✅ GOOD: Imports only specific function
import debounce from 'lodash/debounce';

// ❌ BAD: Imports entire icon library
import { FaUser, FaHome, FaSearch } from 'react-icons/fa';

// ✅ GOOD: Imports from specific icon set
import { FaUser } from 'react-icons/fa/FaUser';
```

### Tree Shaking (MANDATORY)

```typescript
// next.config.js
module.exports = {
  swcMinify: true, // MANDATORY: Use SWC for minification
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production', // RECOMMENDED
  },
  experimental: {
    optimizePackageImports: ['@/components', 'lucide-react', 'date-fns'], // RECOMMENDED
  },
};
```

---

## CSS Optimization

### CSS Best Practices (MANDATORY)

```typescript
// 1. MANDATORY: Use CSS Modules or Tailwind for scoped styles
// components/Button/Button.module.css
.button {
  padding: 0.5rem 1rem;
  border-radius: 0.25rem;
}

// components/Button/Button.tsx
import styles from './Button.module.css';

export function Button({ children }) {
  return <button className={styles.button}>{children}</button>;
}

// 2. MANDATORY: Critical CSS for above-fold content
// app/layout.tsx
import './critical.css'; // Inlined by Next.js

// 3. RECOMMENDED: Purge unused CSS with Tailwind
// tailwind.config.js
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  // ... rest of config
};
```

### CSS Size Limits (MANDATORY)

| CSS Type | Max Size (Gzipped) |
|----------|-------------------|
| **Critical CSS** | < 14 KB |
| **Page-specific CSS** | < 50 KB |
| **Total CSS** | < 100 KB |

---

## Caching Strategies

### HTTP Caching (MANDATORY)

```typescript
// next.config.js - Static asset caching
module.exports = {
  async headers() {
    return [
      {
        source: '/fonts/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable', // MANDATORY: 1 year for fonts
          },
        ],
      },
      {
        source: '/images/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable', // MANDATORY: 1 year for images
          },
        ],
      },
      {
        source: '/:path*.js',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable', // MANDATORY: 1 year for JS
          },
        ],
      },
      {
        source: '/:path*.css',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable', // MANDATORY: 1 year for CSS
          },
        ],
      },
    ];
  },
};
```

### API Caching (MANDATORY)

```typescript
// app/api/products/route.ts - API route caching
export async function GET() {
  const products = await fetchProducts();

  return Response.json(products, {
    headers: {
      'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300', // MANDATORY
    },
  });
}

// app/product/[id]/page.tsx - Page-level caching
export const revalidate = 3600; // MANDATORY: Revalidate every hour

export async function generateStaticParams() {
  const products = await fetchProducts();
  return products.map((product) => ({ id: product.id }));
}
```

### Service Worker Caching (RECOMMENDED)

```typescript
// public/sw.js - Service worker for offline support
const CACHE_NAME = 'storefront-v1';
const STATIC_ASSETS = [
  '/',
  '/styles.css',
  '/script.js',
  '/logo.svg',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});
```

---

## CDN Best Practices

### MANDATORY CDN Configuration

1. **Use CDN for Static Assets**
   - Images: `https://cdn.yourdomain.com/images/`
   - JavaScript: `https://cdn.yourdomain.com/js/`
   - CSS: `https://cdn.yourdomain.com/css/`
   - Fonts: `https://cdn.yourdomain.com/fonts/`

2. **Enable CDN Compression** (MANDATORY)
   - Gzip for all text assets
   - Brotli for modern browsers (preferred)

3. **Set Appropriate TTLs** (MANDATORY)
   - Static assets: 1 year (31536000 seconds)
   - HTML: 5 minutes (300 seconds)
   - API responses: Based on data freshness

4. **Use CDN Purge/Invalidation** (MANDATORY)
   ```bash
   # Example: Cloudflare API
   curl -X POST "https://api.cloudflare.com/client/v4/zones/{zone_id}/purge_cache" \
     -H "Authorization: Bearer {api_token}" \
     -H "Content-Type: application/json" \
     --data '{"purge_everything":true}'
   ```

5. **Enable CDN SSL** (MANDATORY)
   - Use TLS 1.3
   - Enable HTTP/2 or HTTP/3
   - Set up proper certificate chain

---

## Mobile-Specific Optimizations

### MANDATORY Mobile Optimizations

```typescript
// 1. Responsive images with mobile-first sizing
<Image
  src="/hero.jpg"
  alt="Hero"
  width={1920}
  height={1080}
  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 80vw, 1920px"
  priority
/>

// 2. Touch-optimized interactions (MANDATORY: 44x44px minimum)
<button style={{ minWidth: '44px', minHeight: '44px', touchAction: 'manipulation' }}>
  Click Me
</button>

// 3. Reduce mobile-specific JavaScript
import { useMediaQuery } from '@/hooks/useMediaQuery';

function ProductPage() {
  const isMobile = useMediaQuery('(max-width: 768px)');

  return (
    <div>
      <ProductDetails />
      {!isMobile && <ProductRecommendations />} {/* Desktop only */}
    </div>
  );
}

// 4. Network-aware loading
function ProductGallery() {
  const [connection, setConnection] = useState(null);

  useEffect(() => {
    const conn = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
    setConnection(conn);
  }, []);

  const imageQuality = connection?.effectiveType === '4g' ? 85 : 60;

  return <Image src="/product.jpg" alt="Product" quality={imageQuality} />;
}
```

---

## Testing Procedures

### MANDATORY Pre-Deployment Testing

1. **Lighthouse CI** (MANDATORY)
   ```bash
   # Install Lighthouse CI
   npm install -g @lhci/cli

   # Run audit
   lhci autorun --config=lighthouserc.json
   ```

   ```json
   // lighthouserc.json
   {
     "ci": {
       "collect": {
         "url": ["http://localhost:3000/"],
         "numberOfRuns": 3
       },
       "assert": {
         "preset": "lighthouse:recommended",
         "assertions": {
           "categories:performance": ["error", {"minScore": 0.9}],
           "categories:accessibility": ["error", {"minScore": 0.9}],
           "first-contentful-paint": ["error", {"maxNumericValue": 2000}],
           "largest-contentful-paint": ["error", {"maxNumericValue": 2500}],
           "cumulative-layout-shift": ["error", {"maxNumericValue": 0.1}],
           "total-blocking-time": ["error", {"maxNumericValue": 200}]
         }
       }
     }
   }
   ```

2. **WebPageTest** (MANDATORY for production deployments)
   - Test from multiple locations
   - Test on real mobile devices
   - Run 3x tests and use median result

3. **Real User Monitoring** (MANDATORY in production)
   ```typescript
   // app/layout.tsx - Web Vitals monitoring
   'use client';

   import { useReportWebVitals } from 'next/web-vitals';

   export function WebVitalsReporter() {
     useReportWebVitals((metric) => {
       // MANDATORY: Send to analytics
       if (metric.label === 'web-vital') {
         // Send to your analytics service
         analytics.track('Web Vitals', {
           name: metric.name,
           value: metric.value,
           rating: metric.rating,
         });
       }
     });

     return null;
   }
   ```

4. **Bundle Size Monitoring** (MANDATORY)
   ```bash
   # Add to CI/CD pipeline
   npm run build
   npm run analyze

   # Fail if bundle exceeds limits
   node scripts/check-bundle-size.js
   ```

---

## Validation Commands

### MANDATORY Validation Before Deployment

```bash
# 1. Build and analyze bundle
npm run build
npm run analyze

# 2. Run Lighthouse audit
npx lighthouse http://localhost:3000 --view --preset=desktop
npx lighthouse http://localhost:3000 --view --preset=mobile --throttling.cpuSlowdownMultiplier=4

# 3. Check bundle sizes
npx bundlesize

# 4. Test with slow network (Chrome DevTools)
# Network tab > Throttling > Slow 3G

# 5. Validate images
npx next-image-export-optimizer --check

# 6. Check for unused dependencies
npx depcheck

# 7. Audit dependencies for vulnerabilities
npm audit

# 8. Run performance tests
npm run test:performance
```

---

## Performance Budget

### MANDATORY Budget Enforcement

```json
// .budgetrc.json
{
  "budgets": [
    {
      "path": "/_next/static/**/*.js",
      "maxSize": "200kb",
      "compression": "gzip"
    },
    {
      "path": "/_next/static/**/*.css",
      "maxSize": "50kb",
      "compression": "gzip"
    },
    {
      "path": "/images/**/*",
      "maxSize": "150kb"
    }
  ]
}
```

```typescript
// scripts/check-bundle-size.js - MANDATORY in CI/CD
const fs = require('fs');
const path = require('path');
const { gzipSync } = require('zlib');

const MAX_BUNDLE_SIZE = 200 * 1024; // 200 KB

const buildDir = path.join(__dirname, '../.next/static/chunks');
const files = fs.readdirSync(buildDir);

let totalSize = 0;
let failed = false;

files.forEach((file) => {
  if (file.endsWith('.js')) {
    const content = fs.readFileSync(path.join(buildDir, file));
    const gzipped = gzipSync(content);
    const size = gzipped.length;
    totalSize += size;

    if (size > MAX_BUNDLE_SIZE) {
      console.error(`❌ ${file} exceeds budget: ${(size / 1024).toFixed(2)} KB`);
      failed = true;
    } else {
      console.log(`✅ ${file}: ${(size / 1024).toFixed(2)} KB`);
    }
  }
});

console.log(`\nTotal gzipped JS size: ${(totalSize / 1024).toFixed(2)} KB`);

if (failed) {
  process.exit(1);
}
```

---

## Summary Checklist

### Before Every Deployment (MANDATORY)

- [ ] PageSpeed Insights score ≥ 90 (desktop and mobile)
- [ ] LCP < 2.5s (mobile: < 4.0s)
- [ ] FID < 100ms
- [ ] CLS < 0.1
- [ ] First Load JS < 200 KB (gzipped)
- [ ] All images optimized with Next.js Image
- [ ] Critical images have `priority` prop
- [ ] Bundle analysis completed
- [ ] No console errors or warnings
- [ ] Lighthouse CI passing
- [ ] Caching headers configured
- [ ] CDN enabled for static assets
- [ ] Web Vitals monitoring active
- [ ] Mobile performance tested on real devices

### Continuous Monitoring (MANDATORY in Production)

- [ ] Real User Monitoring (RUM) active
- [ ] Synthetic monitoring (every 15 minutes)
- [ ] Performance alerts configured
- [ ] Weekly performance reviews scheduled
- [ ] Performance dashboard accessible to team

---

## Resources

### Tools (MANDATORY)

- **Lighthouse CI**: https://github.com/GoogleChrome/lighthouse-ci
- **WebPageTest**: https://www.webpagetest.org/
- **Chrome DevTools**: Built-in browser developer tools
- **Next.js Bundle Analyzer**: `@next/bundle-analyzer`
- **Web Vitals Extension**: Chrome extension for real-time metrics

### Documentation

- Next.js Performance: https://nextjs.org/docs/app/building-your-application/optimizing
- Core Web Vitals: https://web.dev/vitals/
- Image Optimization: https://nextjs.org/docs/app/building-your-application/optimizing/images
- Font Optimization: https://nextjs.org/docs/app/building-your-application/optimizing/fonts

---

**Last Updated:** 2025-11-07
**Review Frequency:** Monthly
**Owner:** Performance Team
