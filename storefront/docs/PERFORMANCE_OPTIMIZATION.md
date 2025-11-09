# Performance Optimization Guide

## Overview

This document outlines all the performance optimizations implemented to achieve a PageSpeed score of 90+.

## Implemented Optimizations

### 1. Font Loading Optimization

**Location:** `/app/layout.tsx`

- **DNS Prefetch**: Pre-resolves DNS for Google Fonts domains
- **Preconnect**: Establishes early connections to fonts.googleapis.com and fonts.gstatic.com
- **Font Display Swap**: Uses `display=swap` parameter to prevent FOIT (Flash of Invisible Text)
- **Font Preloading**: Preloads critical Lato font variant for faster rendering

```tsx
<link rel="dns-prefetch" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
<link rel="preload" href="https://fonts.gstatic.com/s/lato/v24/..." as="font" />
```

### 2. Image Optimization

**Location:** `/next.config.js`

- **Modern Formats**: Serves AVIF and WebP with automatic fallbacks
- **Responsive Sizes**: 8 device sizes and 8 image sizes for optimal delivery
- **Cache Control**: 60-second minimum cache TTL
- **SVG Security**: Secure SVG handling with CSP

```javascript
images: {
  formats: ['image/avif', 'image/webp'],
  deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
  imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
}
```

### 3. Hero Image Preloading

**Location:** `/app/layout.tsx`

- **LCP Optimization**: Preloads hero image with high priority
- **Fetch Priority**: Uses `fetchPriority="high"` for critical above-fold image

```tsx
<link rel="preload" as="image" href="/images/hero.png" fetchPriority="high" />
```

### 4. Build Optimizations

**Location:** `/next.config.js`

- **SWC Minification**: 17x faster than Terser, produces smaller bundles
- **Compression**: Gzip compression enabled
- **Code Splitting**: Optimized vendor and common chunks
- **Module IDs**: Deterministic module IDs for better caching
- **Runtime Chunk**: Single runtime chunk reduces overhead

```javascript
swcMinify: true,
compress: true,
webpack: (config) => {
  config.optimization = {
    moduleIds: 'deterministic',
    runtimeChunk: 'single',
    splitChunks: { /* advanced config */ }
  }
}
```

### 5. Experimental Features

**Location:** `/next.config.js`

- **CSS Optimization**: Automatic CSS minification and optimization
- **Package Import Optimization**: Tree-shaking for React packages

```javascript
experimental: {
  optimizeCss: true,
  optimizePackageImports: ['react', 'react-dom'],
}
```

### 6. Caching Headers

**Location:** `/next.config.js`

- **Static Assets**: 1-year immutable cache for images and static files
- **Next.js Build Assets**: Immutable cache for webpack chunks

```javascript
async headers() {
  return [
    {
      source: '/:all*(svg|jpg|jpeg|png|gif|ico|webp|avif)',
      headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }],
    },
  ];
}
```

### 7. Web Vitals Monitoring

**Location:** `/lib/analytics.ts`, `/components/WebVitals.tsx`

Tracks all Core Web Vitals:
- **CLS (Cumulative Layout Shift)**: < 0.1 (good)
- **FID (First Input Delay)**: < 100ms (good)
- **LCP (Largest Contentful Paint)**: < 2.5s (good)
- **FCP (First Contentful Paint)**: < 1.8s (good)
- **TTFB (Time to First Byte)**: < 800ms (good)
- **INP (Interaction to Next Paint)**: < 200ms (good)

Features:
- Color-coded console logging in development
- Automatic reporting to analytics endpoint in production
- Uses `navigator.sendBeacon()` for reliable reporting

### 8. Metadata & Viewport Optimization

**Location:** `/app/layout.tsx`

- **Viewport Meta**: Proper scaling configuration
- **Theme Color**: Consistent theme color for PWA
- **Icons**: Optimized favicon and Apple touch icon
- **Manifest**: PWA manifest support

### 9. Security Headers

**Location:** `/next.config.js`

- **Powered-By Header Removal**: Removes `X-Powered-By: Next.js`
- **SVG CSP**: Content Security Policy for SVG files

### 10. Standalone Output

**Location:** `/next.config.js`

- **Standalone Mode**: Optimized Docker deployment with minimal dependencies

## Performance Targets

### Core Web Vitals
- LCP: < 2.5s
- FID: < 100ms
- CLS: < 0.1
- INP: < 200ms

### PageSpeed Score
- Target: 90+ on mobile and desktop
- Desktop: 95+
- Mobile: 90+

## Bundle Analysis

To analyze bundle size:

1. Install bundle analyzer:
```bash
npm install @next/bundle-analyzer
```

2. Uncomment the bundle analyzer section in `next.config.js`

3. Run analysis:
```bash
ANALYZE=true npm run build
```

## Monitoring

### Development
- Open browser console to see color-coded Web Vitals metrics
- Green: Good performance
- Orange: Needs improvement
- Red: Poor performance

### Production
- Metrics automatically sent to `/api/analytics` endpoint
- Integrate with your analytics service (Google Analytics, Vercel Analytics, etc.)

## Additional Recommendations

### 1. Content Delivery Network (CDN)
- Deploy on Vercel or similar platform with edge network
- Enables automatic edge caching and global distribution

### 2. Database Optimization
- Use connection pooling
- Implement query caching
- Add database indexes

### 3. API Routes
- Implement response caching
- Use ISR (Incremental Static Regeneration) where possible
- Optimize database queries

### 4. Third-Party Scripts
- Load non-critical scripts asynchronously
- Use Next.js Script component with appropriate strategy
- Consider self-hosting critical third-party resources

### 5. Images
- Always use Next.js Image component
- Provide proper width/height to prevent CLS
- Use blur placeholders for better perceived performance
- Optimize images before uploading (use tools like Squoosh)

### 6. Server Components
- Maximize use of React Server Components
- Only use 'use client' when necessary
- Fetch data in Server Components when possible

### 7. Route Prefetching
- Next.js automatically prefetches visible links
- Use `prefetch={false}` on non-critical links
- Consider manual prefetching for critical user paths

## Testing Performance

### Local Testing
```bash
npm run build
npm run start
# Open Chrome DevTools → Lighthouse
```

### Production Testing
- PageSpeed Insights: https://pagespeed.web.dev/
- WebPageTest: https://www.webpagetest.org/
- GTmetrix: https://gtmetrix.com/

## Troubleshooting

### Common Issues

**1. Large JavaScript Bundle**
- Check bundle analyzer
- Look for large dependencies
- Consider code splitting or dynamic imports

**2. Poor LCP**
- Ensure hero image is preloaded
- Check server response time (TTFB)
- Verify image optimization

**3. High CLS**
- Add explicit width/height to images
- Reserve space for dynamic content
- Avoid inserting content above existing content

**4. Slow TTFB**
- Optimize database queries
- Add caching layers
- Use CDN for static assets

## Resources

- [Next.js Performance](https://nextjs.org/docs/advanced-features/measuring-performance)
- [Web Vitals](https://web.dev/vitals/)
- [Core Web Vitals](https://web.dev/vitals/)
- [Lighthouse Performance Scoring](https://web.dev/performance-scoring/)
