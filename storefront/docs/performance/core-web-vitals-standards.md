# Core Web Vitals Standards

## Overview

Core Web Vitals are essential metrics that Google uses to measure user experience. These metrics directly impact SEO rankings and user satisfaction. This document provides comprehensive standards and optimization strategies for each vital.

---

## The Three Core Web Vitals

| Metric | What It Measures | Good | Needs Improvement | Poor |
|--------|------------------|------|-------------------|------|
| **LCP (Largest Contentful Paint)** | Loading Performance | ≤ 2.5s | 2.5s - 4.0s | > 4.0s |
| **FID (First Input Delay)** | Interactivity | ≤ 100ms | 100ms - 300ms | > 300ms |
| **INP (Interaction to Next Paint)** | Responsiveness | ≤ 200ms | 200ms - 500ms | > 500ms |
| **CLS (Cumulative Layout Shift)** | Visual Stability | ≤ 0.1 | 0.1 - 0.25 | > 0.25 |

**MANDATORY**: 75% of page loads must achieve "Good" scores across all metrics.

---

## 1. Largest Contentful Paint (LCP)

### Definition

LCP measures the render time of the largest visible content element in the viewport. This could be:
- Large images or video thumbnails
- Block-level text elements
- Background images loaded via CSS

### MANDATORY Standards

| Environment | Target | Critical Threshold |
|-------------|--------|-------------------|
| Desktop | < 2.0s | < 2.5s |
| Mobile | < 3.0s | < 4.0s |
| Tablet | < 2.5s | < 3.5s |

### Common LCP Elements

```typescript
// Identify LCP element
window.addEventListener('load', () => {
  new PerformanceObserver((entryList) => {
    const entries = entryList.getEntries();
    const lastEntry = entries[entries.length - 1];
    console.log('LCP element:', lastEntry.element);
    console.log('LCP time:', lastEntry.renderTime || lastEntry.loadTime);
  }).observe({ type: 'largest-contentful-paint', buffered: true });
});
```

### Optimization Strategies

#### 1. Server Response Time (MANDATORY)

**Target: TTFB < 600ms**

```typescript
// next.config.js - Enable compression
module.exports = {
  compress: true, // MANDATORY: Enable gzip compression
  poweredByHeader: false, // RECOMMENDED: Remove X-Powered-By header
};

// middleware.ts - Add performance headers
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const response = NextResponse.next();

  // MANDATORY: Add Server-Timing header for debugging
  response.headers.set('Server-Timing', `cdn-cache;desc="HIT"`);

  // MANDATORY: Add cache headers
  if (request.nextUrl.pathname.startsWith('/api/')) {
    response.headers.set('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=300');
  }

  return response;
}
```

**Edge Functions (RECOMMENDED):**
```typescript
// app/api/products/route.ts
export const runtime = 'edge'; // RECOMMENDED: Use edge runtime for faster responses

export async function GET(request: Request) {
  const products = await fetchProducts();
  return Response.json(products, {
    headers: {
      'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
    },
  });
}
```

#### 2. Image Optimization (MANDATORY)

```typescript
// components/HeroSection.tsx - MANDATORY implementation
import Image from 'next/image';

export function HeroSection() {
  return (
    <section className="hero">
      {/* MANDATORY: Use priority for LCP images */}
      <Image
        src="/hero-banner.jpg"
        alt="Welcome to our store"
        width={1920}
        height={1080}
        priority // CRITICAL: Prevents lazy loading for LCP image
        quality={85} // MANDATORY: Balance quality vs size
        placeholder="blur"
        blurDataURL={shimmer(1920, 1080)} // RECOMMENDED: Show placeholder
        sizes="100vw" // MANDATORY: Responsive sizing
        style={{
          width: '100%',
          height: 'auto',
        }}
      />
    </section>
  );
}

// Blur placeholder generator (RECOMMENDED)
const shimmer = (w: number, h: number) => `
  <svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="g">
        <stop stop-color="#f6f7f8" offset="0%" />
        <stop stop-color="#edeef1" offset="20%" />
        <stop stop-color="#f6f7f8" offset="40%" />
        <stop stop-color="#f6f7f8" offset="100%" />
      </linearGradient>
    </defs>
    <rect width="${w}" height="${h}" fill="#f6f7f8" />
    <rect width="${w}" height="${h}" fill="url(#g)" />
  </svg>
`;

const toBase64 = (str: string) =>
  typeof window === 'undefined' ? Buffer.from(str).toString('base64') : window.btoa(str);

export const shimmerDataUrl = (w: number, h: number) =>
  `data:image/svg+xml;base64,${toBase64(shimmer(w, h))}`;
```

#### 3. Resource Hints (MANDATORY)

```typescript
// app/layout.tsx - MANDATORY preconnect to critical origins
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        {/* MANDATORY: Preconnect to image CDN */}
        <link rel="preconnect" href="https://cdn.yourdomain.com" />

        {/* MANDATORY: Preconnect to font provider */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />

        {/* MANDATORY: DNS prefetch for analytics */}
        <link rel="dns-prefetch" href="https://www.google-analytics.com" />

        {/* RECOMMENDED: Preload critical fonts */}
        <link
          rel="preload"
          href="/fonts/inter-var.woff2"
          as="font"
          type="font/woff2"
          crossOrigin=""
        />

        {/* RECOMMENDED: Preload LCP image if not using priority prop */}
        <link
          rel="preload"
          as="image"
          href="/hero-banner.jpg"
          imageSrcSet="/hero-banner-640w.jpg 640w, /hero-banner-1920w.jpg 1920w"
          imageSizes="100vw"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
```

#### 4. Critical CSS (MANDATORY)

```typescript
// app/layout.tsx - Inline critical CSS
import './globals.css'; // MANDATORY: Import global styles first

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        {/* MANDATORY: Inline critical CSS for above-fold content */}
        <style dangerouslySetInnerHTML={{
          __html: `
            /* Critical CSS for initial render */
            body { margin: 0; font-family: system-ui, sans-serif; }
            .hero { min-height: 500px; }
            .skeleton { background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%); }
          `
        }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
```

#### 5. Content Delivery Network (MANDATORY)

```typescript
// next.config.js - Configure CDN
module.exports = {
  images: {
    loader: 'custom',
    loaderFile: './lib/imageLoader.ts',
  },
  assetPrefix: process.env.NODE_ENV === 'production' ? 'https://cdn.yourdomain.com' : '',
};

// lib/imageLoader.ts - MANDATORY: CDN image loader
export default function cloudflareLoader({ src, width, quality }) {
  const params = [`width=${width}`];
  if (quality) {
    params.push(`quality=${quality}`);
  }
  return `https://cdn.yourdomain.com/cdn-cgi/image/${params.join(',')}/${src}`;
}
```

### LCP Monitoring (MANDATORY)

```typescript
// app/components/WebVitals.tsx
'use client';

import { useEffect } from 'react';

export function LCPMonitor() {
  useEffect(() => {
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        const lcpEntry = entry as PerformanceEntry & {
          element?: Element;
          renderTime: number;
          loadTime: number;
        };

        const lcpTime = lcpEntry.renderTime || lcpEntry.loadTime;

        // MANDATORY: Send to analytics
        if (typeof window !== 'undefined' && (window as any).gtag) {
          (window as any).gtag('event', 'LCP', {
            value: lcpTime,
            metric_id: 'lcp',
            metric_value: lcpTime,
            metric_delta: lcpTime,
          });
        }

        // MANDATORY: Console warning if LCP is poor
        if (lcpTime > 2500) {
          console.warn(`⚠️ Poor LCP: ${lcpTime}ms`, lcpEntry.element);
        }
      }
    });

    observer.observe({ type: 'largest-contentful-paint', buffered: true });

    return () => observer.disconnect();
  }, []);

  return null;
}
```

---

## 2. First Input Delay (FID) / Interaction to Next Paint (INP)

### Definition

- **FID**: Measures the time from when a user first interacts with a page to when the browser responds
- **INP**: Measures the latency of all user interactions throughout the page lifecycle

**Note**: Google is transitioning from FID to INP as a Core Web Vital in 2024.

### MANDATORY Standards

| Metric | Good | Needs Improvement | Poor |
|--------|------|-------------------|------|
| FID | ≤ 100ms | 100ms - 300ms | > 300ms |
| INP | ≤ 200ms | 200ms - 500ms | > 500ms |

### Optimization Strategies

#### 1. Reduce JavaScript Execution Time (MANDATORY)

```typescript
// MANDATORY: Code splitting for heavy components
import dynamic from 'next/dynamic';

// Lazy load non-critical components
const ProductReviews = dynamic(() => import('./ProductReviews'), {
  loading: () => <ReviewsSkeleton />,
  ssr: false, // RECOMMENDED: Skip SSR for client-only components
});

const ProductRecommendations = dynamic(() => import('./ProductRecommendations'), {
  loading: () => <RecommendationsSkeleton />,
});

export default function ProductPage() {
  return (
    <div>
      <ProductDetails /> {/* Critical: loads immediately */}

      {/* MANDATORY: Wrap in Suspense for better UX */}
      <Suspense fallback={<ReviewsSkeleton />}>
        <ProductReviews />
      </Suspense>

      <Suspense fallback={<RecommendationsSkeleton />}>
        <ProductRecommendations />
      </Suspense>
    </div>
  );
}
```

#### 2. Optimize Event Handlers (MANDATORY)

```typescript
// hooks/useOptimizedCallback.ts - MANDATORY for frequent events
import { useCallback, useRef } from 'react';

export function useThrottle<T extends (...args: any[]) => any>(
  callback: T,
  delay: number = 100
): T {
  const lastRun = useRef(Date.now());

  return useCallback(
    ((...args) => {
      const now = Date.now();
      if (now - lastRun.current >= delay) {
        lastRun.current = now;
        return callback(...args);
      }
    }) as T,
    [callback, delay]
  );
}

export function useDebounce<T extends (...args: any[]) => any>(
  callback: T,
  delay: number = 300
): T {
  const timeoutRef = useRef<NodeJS.Timeout>();

  return useCallback(
    ((...args) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = setTimeout(() => {
        callback(...args);
      }, delay);
    }) as T,
    [callback, delay]
  );
}

// Usage example - MANDATORY for search inputs
function SearchBar() {
  const [query, setQuery] = useState('');
  const debouncedSearch = useDebounce((value: string) => {
    performSearch(value);
  }, 300);

  return (
    <input
      type="text"
      value={query}
      onChange={(e) => {
        setQuery(e.target.value);
        debouncedSearch(e.target.value);
      }}
    />
  );
}
```

#### 3. Minimize Main Thread Work (MANDATORY)

```typescript
// MANDATORY: Use Web Workers for heavy computation
// workers/productFilter.worker.ts
self.addEventListener('message', (e: MessageEvent) => {
  const { products, filters } = e.data;

  // Heavy filtering logic runs off main thread
  const filtered = products.filter((product: any) => {
    let matches = true;

    if (filters.category && product.category !== filters.category) {
      matches = false;
    }

    if (filters.priceRange) {
      const [min, max] = filters.priceRange;
      if (product.price < min || product.price > max) {
        matches = false;
      }
    }

    // ... more complex filtering

    return matches;
  });

  self.postMessage(filtered);
});

// components/ProductFilter.tsx
import { useEffect, useState } from 'react';

export function ProductFilter({ products }) {
  const [filtered, setFiltered] = useState(products);
  const [filters, setFilters] = useState({});

  useEffect(() => {
    // MANDATORY: Use worker for heavy filtering
    const worker = new Worker(
      new URL('../workers/productFilter.worker.ts', import.meta.url)
    );

    worker.postMessage({ products, filters });

    worker.onmessage = (e) => {
      setFiltered(e.data);
    };

    return () => worker.terminate();
  }, [products, filters]);

  return <ProductList products={filtered} />;
}
```

#### 4. Break Up Long Tasks (MANDATORY)

```typescript
// utils/scheduler.ts - MANDATORY for long-running operations
export async function schedulerYield() {
  // Use scheduler.yield() if available, otherwise setTimeout
  if ('scheduler' in window && 'yield' in (window as any).scheduler) {
    return (window as any).scheduler.yield();
  }
  return new Promise((resolve) => setTimeout(resolve, 0));
}

// Usage example - MANDATORY for processing large datasets
async function processLargeDataset(items: any[]) {
  const results = [];

  for (let i = 0; i < items.length; i++) {
    // Process item
    results.push(processItem(items[i]));

    // MANDATORY: Yield to main thread every 50 items
    if (i % 50 === 0) {
      await schedulerYield();
    }
  }

  return results;
}
```

#### 5. Optimize Third-Party Scripts (MANDATORY)

```typescript
// app/layout.tsx - MANDATORY: Load third-party scripts efficiently
import Script from 'next/script';

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        {children}

        {/* MANDATORY: Load analytics after page interactive */}
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=GA_MEASUREMENT_ID"
          strategy="afterInteractive" // MANDATORY: Not "beforeInteractive"
        />

        {/* RECOMMENDED: Lazy load non-critical scripts */}
        <Script
          src="https://widget.example.com/script.js"
          strategy="lazyOnload"
        />
      </body>
    </html>
  );
}
```

### INP Monitoring (MANDATORY)

```typescript
// app/components/INPMonitor.tsx
'use client';

import { useEffect } from 'react';

export function INPMonitor() {
  useEffect(() => {
    if (typeof PerformanceObserver === 'undefined') return;

    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        const eventEntry = entry as PerformanceEventTiming;

        // MANDATORY: Track interactions longer than 200ms
        if (eventEntry.duration > 200) {
          console.warn('⚠️ Slow interaction detected:', {
            name: eventEntry.name,
            duration: eventEntry.duration,
            startTime: eventEntry.startTime,
          });

          // MANDATORY: Send to analytics
          if (typeof window !== 'undefined' && (window as any).gtag) {
            (window as any).gtag('event', 'slow_interaction', {
              event_category: 'Performance',
              event_label: eventEntry.name,
              value: Math.round(eventEntry.duration),
            });
          }
        }
      }
    });

    observer.observe({ type: 'event', buffered: true, durationThreshold: 16 });

    return () => observer.disconnect();
  }, []);

  return null;
}
```

---

## 3. Cumulative Layout Shift (CLS)

### Definition

CLS measures visual stability by quantifying unexpected layout shifts during the page lifecycle.

### MANDATORY Standards

| Score | Rating |
|-------|--------|
| ≤ 0.1 | Good (MANDATORY) |
| 0.1 - 0.25 | Needs Improvement |
| > 0.25 | Poor (CRITICAL) |

### Common Causes of CLS

1. Images without dimensions
2. Ads, embeds, and iframes without dimensions
3. Dynamically injected content
4. Web fonts causing FOIT/FOUT
5. Actions waiting for network response

### Optimization Strategies

#### 1. Define Image Dimensions (MANDATORY)

```typescript
// MANDATORY: Always specify width and height
import Image from 'next/image';

// ✅ CORRECT: Explicit dimensions
<Image
  src="/product.jpg"
  alt="Product"
  width={600}
  height={400}
  sizes="(max-width: 768px) 100vw, 600px"
/>

// ✅ CORRECT: Responsive with aspect ratio
<div style={{ position: 'relative', aspectRatio: '16/9' }}>
  <Image
    src="/banner.jpg"
    alt="Banner"
    fill
    style={{ objectFit: 'cover' }}
  />
</div>

// ❌ INCORRECT: No dimensions
<img src="/product.jpg" alt="Product" />
```

#### 2. Reserve Space for Ads and Embeds (MANDATORY)

```typescript
// components/AdSlot.tsx - MANDATORY: Reserve space for ads
export function AdSlot({ width = 300, height = 250 }) {
  return (
    <div
      className="ad-slot"
      style={{
        width: `${width}px`,
        height: `${height}px`,
        minHeight: `${height}px`, // MANDATORY: Prevent collapse
        backgroundColor: '#f0f0f0', // RECOMMENDED: Placeholder color
      }}
    >
      {/* Ad content loads here */}
    </div>
  );
}

// components/YouTubeEmbed.tsx - MANDATORY: Aspect ratio container
export function YouTubeEmbed({ videoId }: { videoId: string }) {
  return (
    <div
      style={{
        position: 'relative',
        paddingBottom: '56.25%', // MANDATORY: 16:9 aspect ratio
        height: 0,
        overflow: 'hidden',
      }}
    >
      <iframe
        src={`https://www.youtube.com/embed/${videoId}`}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
        }}
        frameBorder="0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      />
    </div>
  );
}
```

#### 3. Font Loading Strategy (MANDATORY)

```typescript
// app/layout.tsx - MANDATORY: Use next/font for optimal loading
import { Inter, Roboto_Mono } from 'next/font/google';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap', // MANDATORY: Prevent invisible text and layout shift
  variable: '--font-inter',
  preload: true, // MANDATORY: Preload font files
  fallback: ['system-ui', 'arial'], // RECOMMENDED: System font fallback
});

const robotoMono = Roboto_Mono({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-roboto-mono',
  preload: true,
  fallback: ['Courier New', 'monospace'],
});

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${inter.variable} ${robotoMono.variable}`}>
      <body className={inter.className}>{children}</body>
    </html>
  );
}

// globals.css - MANDATORY: Size-adjust for fallback fonts
:root {
  --font-inter: 'Inter', system-ui, arial;
}

@font-face {
  font-family: 'Arial Fallback';
  src: local('Arial');
  size-adjust: 107%; /* MANDATORY: Match Inter metrics */
  ascent-override: 90%;
  descent-override: 22%;
  line-gap-override: 0%;
}
```

#### 4. Skeleton Screens (MANDATORY)

```typescript
// components/ProductCardSkeleton.tsx - MANDATORY for loading states
export function ProductCardSkeleton() {
  return (
    <div
      className="product-card-skeleton"
      style={{
        width: '100%',
        minHeight: '400px', // MANDATORY: Match actual card height
      }}
    >
      {/* Image skeleton */}
      <div
        style={{
          width: '100%',
          height: '200px',
          backgroundColor: '#e0e0e0',
          borderRadius: '8px',
        }}
      />

      {/* Title skeleton */}
      <div
        style={{
          width: '80%',
          height: '24px',
          backgroundColor: '#e0e0e0',
          marginTop: '16px',
          borderRadius: '4px',
        }}
      />

      {/* Price skeleton */}
      <div
        style={{
          width: '40%',
          height: '20px',
          backgroundColor: '#e0e0e0',
          marginTop: '12px',
          borderRadius: '4px',
        }}
      />
    </div>
  );
}

// Usage
function ProductGrid() {
  const { data: products, isLoading } = useProducts();

  if (isLoading) {
    return (
      <div className="product-grid">
        {Array.from({ length: 12 }).map((_, i) => (
          <ProductCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  return (
    <div className="product-grid">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
```

#### 5. Animation Best Practices (MANDATORY)

```css
/* MANDATORY: Only animate transform and opacity */
.button {
  transition: transform 0.2s ease, opacity 0.2s ease;
}

.button:hover {
  transform: translateY(-2px); /* ✅ GOOD: No layout shift */
  opacity: 0.9; /* ✅ GOOD: No layout shift */
}

/* ❌ BAD: Causes layout shifts */
.bad-button:hover {
  margin-top: -2px; /* Triggers reflow */
  height: 52px; /* Triggers reflow */
  padding: 16px; /* Triggers reflow */
}

/* MANDATORY: Use will-change sparingly */
.animated-element {
  will-change: transform, opacity; /* ✅ GOOD: Hints to browser */
}

/* RECOMMENDED: Add transform-style for 3D transforms */
.card {
  transform-style: preserve-3d;
  transition: transform 0.3s ease;
}
```

### CLS Monitoring (MANDATORY)

```typescript
// app/components/CLSMonitor.tsx
'use client';

import { useEffect } from 'react';

export function CLSMonitor() {
  useEffect(() => {
    let clsValue = 0;
    let clsEntries: LayoutShift[] = [];

    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        const layoutShift = entry as LayoutShift;

        // Only count layout shifts without recent user input
        if (!layoutShift.hadRecentInput) {
          clsValue += layoutShift.value;
          clsEntries.push(layoutShift);

          // MANDATORY: Console warning if CLS exceeds threshold
          if (clsValue > 0.1) {
            console.warn('⚠️ High CLS detected:', {
              value: clsValue,
              entries: clsEntries.map((e) => ({
                value: e.value,
                sources: e.sources,
                startTime: e.startTime,
              })),
            });
          }
        }
      }
    });

    observer.observe({ type: 'layout-shift', buffered: true });

    // MANDATORY: Send final CLS to analytics on page unload
    const sendCLS = () => {
      if (typeof window !== 'undefined' && (window as any).gtag) {
        (window as any).gtag('event', 'CLS', {
          value: clsValue,
          metric_id: 'cls',
          metric_value: clsValue,
        });
      }
    };

    window.addEventListener('pagehide', sendCLS);

    return () => {
      observer.disconnect();
      window.removeEventListener('pagehide', sendCLS);
    };
  }, []);

  return null;
}

interface LayoutShift extends PerformanceEntry {
  value: number;
  hadRecentInput: boolean;
  sources: Array<{
    node?: Node;
    previousRect: DOMRectReadOnly;
    currentRect: DOMRectReadOnly;
  }>;
}
```

---

## Real User Monitoring (RUM)

### MANDATORY Implementation

```typescript
// app/components/WebVitalsReporter.tsx
'use client';

import { useReportWebVitals } from 'next/web-vitals';

export function WebVitalsReporter() {
  useReportWebVitals((metric) => {
    // MANDATORY: Send all Web Vitals to analytics
    const body = JSON.stringify({
      name: metric.name,
      value: metric.value,
      rating: metric.rating,
      delta: metric.delta,
      id: metric.id,
      navigationType: metric.navigationType,
      page: window.location.pathname,
      userAgent: navigator.userAgent,
      timestamp: Date.now(),
    });

    // Send to your analytics endpoint
    const url = '/api/analytics/web-vitals';

    if (navigator.sendBeacon) {
      navigator.sendBeacon(url, body);
    } else {
      fetch(url, { body, method: 'POST', keepalive: true });
    }

    // MANDATORY: Also send to Google Analytics if available
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', metric.name, {
        value: Math.round(metric.name === 'CLS' ? metric.value * 1000 : metric.value),
        event_category: 'Web Vitals',
        event_label: metric.id,
        non_interaction: true,
      });
    }
  });

  return null;
}

// app/layout.tsx - Add to root layout
import { WebVitalsReporter } from '@/components/WebVitalsReporter';

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <WebVitalsReporter />
        {children}
      </body>
    </html>
  );
}
```

### Analytics Dashboard (MANDATORY)

```typescript
// app/api/analytics/web-vitals/route.ts
import { NextRequest } from 'next/server';

export async function POST(request: NextRequest) {
  const data = await request.json();

  // MANDATORY: Validate data
  if (!data.name || !data.value) {
    return new Response('Invalid data', { status: 400 });
  }

  // MANDATORY: Store in database or send to analytics service
  await storeWebVital(data);

  // MANDATORY: Check thresholds and alert if exceeded
  if (shouldAlert(data)) {
    await sendAlert({
      metric: data.name,
      value: data.value,
      page: data.page,
      threshold: getThreshold(data.name),
    });
  }

  return new Response('OK', { status: 200 });
}

function shouldAlert(data: any): boolean {
  const thresholds = {
    LCP: 2500,
    FID: 100,
    INP: 200,
    CLS: 0.1,
  };

  return data.value > thresholds[data.name as keyof typeof thresholds];
}

function getThreshold(metric: string): number {
  const thresholds = {
    LCP: 2500,
    FID: 100,
    INP: 200,
    CLS: 0.1,
  };

  return thresholds[metric as keyof typeof thresholds];
}
```

---

## Performance Budgets

### MANDATORY Budgets

```json
// .performance-budget.json
{
  "budgets": {
    "lcp": {
      "desktop": 2000,
      "mobile": 2500,
      "unit": "ms"
    },
    "fid": {
      "all": 100,
      "unit": "ms"
    },
    "inp": {
      "all": 200,
      "unit": "ms"
    },
    "cls": {
      "all": 0.1,
      "unit": "score"
    },
    "ttfb": {
      "desktop": 600,
      "mobile": 800,
      "unit": "ms"
    },
    "fcp": {
      "desktop": 1800,
      "mobile": 3000,
      "unit": "ms"
    }
  }
}
```

### Budget Enforcement (MANDATORY in CI/CD)

```typescript
// scripts/check-performance-budget.ts
import * as fs from 'fs';
import * as lighthouse from 'lighthouse';
import * as chromeLauncher from 'chrome-launcher';

async function checkBudget(url: string) {
  const chrome = await chromeLauncher.launch({ chromeFlags: ['--headless'] });
  const options = {
    logLevel: 'info' as const,
    output: 'json' as const,
    port: chrome.port,
  };

  const runnerResult = await lighthouse(url, options);
  const audits = runnerResult?.lhr.audits;

  const budget = JSON.parse(
    fs.readFileSync('.performance-budget.json', 'utf-8')
  );

  let failed = false;

  // Check LCP
  const lcp = audits?.['largest-contentful-paint']?.numericValue || 0;
  if (lcp > budget.budgets.lcp.desktop) {
    console.error(`❌ LCP budget exceeded: ${lcp}ms > ${budget.budgets.lcp.desktop}ms`);
    failed = true;
  }

  // Check CLS
  const cls = audits?.['cumulative-layout-shift']?.numericValue || 0;
  if (cls > budget.budgets.cls.all) {
    console.error(`❌ CLS budget exceeded: ${cls} > ${budget.budgets.cls.all}`);
    failed = true;
  }

  await chrome.kill();

  if (failed) {
    process.exit(1);
  }

  console.log('✅ All performance budgets met');
}

checkBudget(process.env.TEST_URL || 'http://localhost:3000');
```

---

## Regression Prevention

### MANDATORY CI/CD Integration

```yaml
# .github/workflows/performance.yml
name: Performance Check

on:
  pull_request:
    branches: [main]
  push:
    branches: [main]

jobs:
  lighthouse:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install dependencies
        run: npm ci

      - name: Build
        run: npm run build

      - name: Start server
        run: npm start &
        env:
          PORT: 3000

      - name: Wait for server
        run: npx wait-on http://localhost:3000

      - name: Run Lighthouse CI
        run: |
          npm install -g @lhci/cli
          lhci autorun --config=lighthouserc.json

      - name: Check performance budget
        run: npm run check:performance-budget
```

```json
// lighthouserc.json - MANDATORY configuration
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
        "largest-contentful-paint": ["error", {"maxNumericValue": 2500}],
        "first-input-delay": ["error", {"maxNumericValue": 100}],
        "cumulative-layout-shift": ["error", {"maxNumericValue": 0.1}],
        "total-blocking-time": ["error", {"maxNumericValue": 200}],
        "speed-index": ["error", {"maxNumericValue": 3400}]
      }
    },
    "upload": {
      "target": "temporary-public-storage"
    }
  }
}
```

---

## Performance Dashboard

### MANDATORY Monitoring Setup

```typescript
// app/admin/performance/page.tsx
import { getWebVitalsStats } from '@/lib/analytics';

export default async function PerformanceDashboard() {
  const stats = await getWebVitalsStats();

  return (
    <div className="dashboard">
      <h1>Core Web Vitals Dashboard</h1>

      <MetricCard
        title="LCP"
        value={stats.lcp.p75}
        threshold={2500}
        unit="ms"
        trend={stats.lcp.trend}
      />

      <MetricCard
        title="FID"
        value={stats.fid.p75}
        threshold={100}
        unit="ms"
        trend={stats.fid.trend}
      />

      <MetricCard
        title="CLS"
        value={stats.cls.p75}
        threshold={0.1}
        unit=""
        trend={stats.cls.trend}
      />

      <MetricCard
        title="INP"
        value={stats.inp.p75}
        threshold={200}
        unit="ms"
        trend={stats.inp.trend}
      />
    </div>
  );
}

function MetricCard({ title, value, threshold, unit, trend }) {
  const status = value <= threshold ? 'good' : 'poor';

  return (
    <div className={`metric-card metric-card--${status}`}>
      <h2>{title}</h2>
      <p className="metric-value">
        {value.toFixed(title === 'CLS' ? 3 : 0)}
        {unit}
      </p>
      <p className="metric-threshold">Threshold: {threshold}{unit}</p>
      <p className="metric-trend">
        {trend > 0 ? '📈' : '📉'} {Math.abs(trend)}% vs last week
      </p>
    </div>
  );
}
```

---

## Summary

### Critical Requirements

- [ ] LCP < 2.5s for 75% of page loads
- [ ] FID < 100ms for 75% of page loads
- [ ] INP < 200ms for 75% of page loads
- [ ] CLS < 0.1 for 75% of page loads
- [ ] Real User Monitoring (RUM) active in production
- [ ] Performance budgets enforced in CI/CD
- [ ] Lighthouse CI passing all assertions
- [ ] Web Vitals tracked and alerted
- [ ] Performance dashboard accessible
- [ ] Weekly performance reviews scheduled

---

**Last Updated:** 2025-11-07
**Review Frequency:** Monthly
**Owner:** Performance Team
