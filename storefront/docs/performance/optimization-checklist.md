# Performance Optimization Checklist

## Overview

This comprehensive checklist ensures all performance optimizations are implemented and validated before deployment. Use this checklist for every release to maintain consistently high performance.

**Score System:**
- MANDATORY: Must be completed before deployment
- RECOMMENDED: Should be completed for optimal performance
- OPTIONAL: Nice-to-have optimizations

---

## Pre-Deployment Checklist

### 1. Performance Metrics (MANDATORY)

- [ ] **PageSpeed Insights Desktop Score ≥ 90**
  ```bash
  # Test command
  npx lighthouse https://your-staging-url.com --preset=desktop --view
  ```

- [ ] **PageSpeed Insights Mobile Score ≥ 90**
  ```bash
  # Test command
  npx lighthouse https://your-staging-url.com --preset=mobile --view
  ```

- [ ] **LCP < 2.5s (Desktop), < 4.0s (Mobile)**
  ```bash
  # Test with Lighthouse
  npx lighthouse https://your-staging-url.com --only-categories=performance
  ```

- [ ] **FID < 100ms**
  - Verify in Chrome DevTools Performance tab
  - Check Real User Monitoring (RUM) data

- [ ] **INP < 200ms**
  - Test user interactions with Chrome DevTools
  - Monitor with Web Vitals extension

- [ ] **CLS < 0.1**
  ```bash
  # Test with Lighthouse
  npx lighthouse https://your-staging-url.com --only-audits=cumulative-layout-shift
  ```

- [ ] **TTFB < 600ms (Desktop), < 800ms (Mobile)**
  ```bash
  # Test with curl
  curl -o /dev/null -s -w 'Time to first byte: %{time_starttransfer}s\n' https://your-staging-url.com
  ```

- [ ] **First Load JS < 200 KB (gzipped)**
  ```bash
  # Check bundle size
  npm run build
  npm run analyze
  ```

---

### 2. Build Validation (MANDATORY)

- [ ] **Production build completes without errors**
  ```bash
  npm run build
  # Should complete with exit code 0
  ```

- [ ] **Bundle analysis reviewed**
  ```bash
  ANALYZE=true npm run build
  # Review bundle-analyzer report
  ```

- [ ] **No console errors in production build**
  ```bash
  # Start production server and check console
  npm run start
  ```

- [ ] **TypeScript compilation passes**
  ```bash
  npx tsc --noEmit
  ```

- [ ] **Linting passes**
  ```bash
  npm run lint
  ```

- [ ] **No duplicate dependencies**
  ```bash
  npm dedupe
  npm ls
  ```

---

## Image Optimization Checklist

### MANDATORY Image Requirements

- [ ] **All images use Next.js Image component**
  ```typescript
  // ✅ CORRECT
  import Image from 'next/image';
  <Image src="/photo.jpg" alt="Photo" width={600} height={400} />

  // ❌ INCORRECT
  <img src="/photo.jpg" alt="Photo" />
  ```

- [ ] **All images have explicit width/height or fill prop**
  ```typescript
  // Option 1: Explicit dimensions
  <Image src="/photo.jpg" alt="Photo" width={600} height={400} />

  // Option 2: Fill with container
  <div style={{ position: 'relative', width: '100%', height: '400px' }}>
    <Image src="/photo.jpg" alt="Photo" fill />
  </div>
  ```

- [ ] **LCP images have priority prop**
  ```typescript
  // MANDATORY for above-fold images
  <Image src="/hero.jpg" alt="Hero" width={1920} height={1080} priority />
  ```

- [ ] **All images have descriptive alt text**
  ```typescript
  // ✅ CORRECT
  <Image src="/product.jpg" alt="Blue cotton t-shirt with logo" width={400} height={400} />

  // ❌ INCORRECT
  <Image src="/product.jpg" alt="image" width={400} height={400} />
  ```

- [ ] **Images use appropriate quality settings**
  | Image Type | Quality Setting |
  |------------|----------------|
  | Hero/Banner | 80-85 |
  | Product Photos | 75-80 |
  | Thumbnails | 70-75 |
  | Logos (use SVG) | 100 |

  ```typescript
  <Image src="/hero.jpg" alt="Hero" width={1920} height={1080} quality={85} priority />
  ```

- [ ] **Responsive images use sizes prop**
  ```typescript
  <Image
    src="/banner.jpg"
    alt="Banner"
    width={1920}
    height={1080}
    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 1920px"
  />
  ```

### RECOMMENDED Image Optimizations

- [ ] **Blur placeholders implemented for key images**
  ```typescript
  <Image
    src="/product.jpg"
    alt="Product"
    width={600}
    height={400}
    placeholder="blur"
    blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRg..."
  />
  ```

- [ ] **Images served from CDN**
  ```typescript
  // next.config.js
  module.exports = {
    images: {
      loader: 'custom',
      loaderFile: './lib/imageLoader.ts',
    },
  };
  ```

- [ ] **Unused images removed from public directory**
  ```bash
  # Find potentially unused images
  find public/images -type f -name "*.jpg" -o -name "*.png" | while read file; do
    if ! grep -r "$(basename "$file")" app/ components/; then
      echo "Potentially unused: $file"
    fi
  done
  ```

### Image Size Validation

- [ ] **Verify image sizes meet requirements**
  ```bash
  # Check image sizes
  find public/images -type f -exec du -h {} \; | sort -rh | head -20

  # Max sizes (compressed):
  # - Hero images: 150 KB
  # - Product images: 80 KB
  # - Thumbnails: 20 KB
  # - Icons: 10 KB
  ```

---

## Code Optimization Checklist

### JavaScript Optimization (MANDATORY)

- [ ] **Code splitting implemented for routes**
  ```typescript
  // Automatic in Next.js App Router - verify in build output
  npm run build
  # Check for individual route chunks
  ```

- [ ] **Heavy components dynamically imported**
  ```typescript
  import dynamic from 'next/dynamic';

  const HeavyChart = dynamic(() => import('@/components/HeavyChart'), {
    loading: () => <Skeleton />,
    ssr: false,
  });
  ```

- [ ] **Third-party libraries tree-shaken**
  ```typescript
  // ✅ CORRECT: Specific imports
  import debounce from 'lodash/debounce';

  // ❌ INCORRECT: Import entire library
  import _ from 'lodash';
  ```

- [ ] **Unused dependencies removed**
  ```bash
  npx depcheck
  # Remove unused packages
  npm uninstall <unused-package>
  ```

- [ ] **Console statements removed in production**
  ```typescript
  // next.config.js
  module.exports = {
    compiler: {
      removeConsole: process.env.NODE_ENV === 'production',
    },
  };
  ```

### CSS Optimization (MANDATORY)

- [ ] **CSS Modules or Tailwind used for scoping**
  ```typescript
  // CSS Modules
  import styles from './Button.module.css';
  <button className={styles.button}>Click</button>

  // OR Tailwind
  <button className="px-4 py-2 bg-blue-500">Click</button>
  ```

- [ ] **Unused CSS purged (Tailwind)**
  ```javascript
  // tailwind.config.js
  module.exports = {
    content: [
      './pages/**/*.{js,ts,jsx,tsx,mdx}',
      './components/**/*.{js,ts,jsx,tsx,mdx}',
      './app/**/*.{js,ts,jsx,tsx,mdx}',
    ],
  };
  ```

- [ ] **Critical CSS inlined**
  ```typescript
  // app/layout.tsx
  export default function RootLayout({ children }) {
    return (
      <html>
        <head>
          <style dangerouslySetInnerHTML={{
            __html: `/* Critical CSS for above-fold content */`
          }} />
        </head>
        <body>{children}</body>
      </html>
    );
  }
  ```

### TypeScript/React Optimization (RECOMMENDED)

- [ ] **useMemo used for expensive calculations**
  ```typescript
  const expensiveValue = useMemo(() => {
    return computeExpensiveValue(data);
  }, [data]);
  ```

- [ ] **useCallback used for child component callbacks**
  ```typescript
  const handleClick = useCallback(() => {
    doSomething();
  }, [dependencies]);
  ```

- [ ] **React.memo used for pure components**
  ```typescript
  const ProductCard = React.memo(({ product }) => {
    return <div>{product.name}</div>;
  });
  ```

- [ ] **Key prop properly used in lists**
  ```typescript
  // ✅ CORRECT: Stable, unique keys
  {products.map((product) => (
    <ProductCard key={product.id} product={product} />
  ))}

  // ❌ INCORRECT: Index as key
  {products.map((product, index) => (
    <ProductCard key={index} product={product} />
  ))}
  ```

---

## Bundle Size Requirements

### MANDATORY Size Limits

- [ ] **First Load JS < 200 KB (gzipped)**
  ```bash
  # Check in build output
  npm run build
  # Look for "First Load JS" in output
  ```

- [ ] **Page-specific JS < 100 KB (gzipped)**
  ```bash
  # Verify in Next.js build output
  # Each route should show bundle size
  ```

- [ ] **Vendor JS < 150 KB (gzipped)**
  ```bash
  # Run bundle analyzer
  ANALYZE=true npm run build
  ```

### Bundle Analysis (MANDATORY)

- [ ] **Run bundle analyzer before deployment**
  ```bash
  # Install analyzer
  npm install --save-dev @next/bundle-analyzer

  # Run analysis
  ANALYZE=true npm run build
  ```

- [ ] **Review largest bundles**
  - Identify bundles > 50 KB
  - Check for duplicate dependencies
  - Look for optimization opportunities

- [ ] **Verify tree shaking working**
  ```bash
  # Check that unused exports are removed
  # Look for "unused code" warnings in build
  ```

---

## Lazy Loading Requirements

### MANDATORY Lazy Loading

- [ ] **Below-fold images lazy loaded**
  ```typescript
  // Default behavior for Next.js Image (unless priority prop)
  <Image src="/product.jpg" alt="Product" width={400} height={400} />
  // loading="lazy" is automatic
  ```

- [ ] **Non-critical components lazy loaded**
  ```typescript
  const Reviews = dynamic(() => import('@/components/Reviews'), {
    loading: () => <ReviewsSkeleton />,
  });

  const RelatedProducts = dynamic(() => import('@/components/RelatedProducts'), {
    loading: () => <ProductsSkeleton />,
  });
  ```

- [ ] **Third-party widgets lazy loaded**
  ```typescript
  import Script from 'next/script';

  <Script
    src="https://widget.example.com/script.js"
    strategy="lazyOnload"
  />
  ```

### RECOMMENDED Lazy Loading

- [ ] **Intersection Observer for manual lazy loading**
  ```typescript
  function LazyComponent() {
    const [isVisible, setIsVisible] = useState(false);
    const ref = useRef(null);

    useEffect(() => {
      const observer = new IntersectionObserver(([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      });

      if (ref.current) {
        observer.observe(ref.current);
      }

      return () => observer.disconnect();
    }, []);

    return <div ref={ref}>{isVisible && <HeavyComponent />}</div>;
  }
  ```

- [ ] **Route prefetching optimized**
  ```typescript
  // Disable prefetch for non-critical links
  <Link href="/heavy-page" prefetch={false}>
    Heavy Page
  </Link>
  ```

---

## Critical CSS Extraction

### MANDATORY Critical CSS

- [ ] **Above-fold styles inlined**
  ```typescript
  // app/layout.tsx
  <head>
    <style dangerouslySetInnerHTML={{
      __html: `
        body { margin: 0; font-family: system-ui; }
        .hero { min-height: 500px; }
      `
    }} />
  </head>
  ```

- [ ] **Font display set to swap**
  ```typescript
  // app/layout.tsx
  import { Inter } from 'next/font/google';

  const inter = Inter({
    subsets: ['latin'],
    display: 'swap', // MANDATORY
  });
  ```

### RECOMMENDED Critical CSS

- [ ] **Critical CSS extracted automatically**
  ```javascript
  // next.config.js
  module.exports = {
    experimental: {
      optimizeCss: true,
    },
  };
  ```

---

## Resource Hints

### MANDATORY Resource Hints

- [ ] **Preconnect to critical origins**
  ```typescript
  // app/layout.tsx
  <head>
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
    <link rel="preconnect" href="https://cdn.yourdomain.com" />
  </head>
  ```

- [ ] **DNS prefetch for third-party domains**
  ```typescript
  <head>
    <link rel="dns-prefetch" href="https://www.google-analytics.com" />
    <link rel="dns-prefetch" href="https://www.googletagmanager.com" />
  </head>
  ```

### RECOMMENDED Resource Hints

- [ ] **Preload critical fonts**
  ```typescript
  <head>
    <link
      rel="preload"
      href="/fonts/inter-var.woff2"
      as="font"
      type="font/woff2"
      crossOrigin=""
    />
  </head>
  ```

- [ ] **Preload LCP image**
  ```typescript
  <head>
    <link
      rel="preload"
      as="image"
      href="/hero.jpg"
      imageSrcSet="/hero-640w.jpg 640w, /hero-1920w.jpg 1920w"
      imageSizes="100vw"
    />
  </head>
  ```

- [ ] **Prefetch next page assets**
  ```typescript
  <Link href="/products" prefetch={true}>
    Products
  </Link>
  ```

---

## Testing Procedures

### Local Testing (MANDATORY)

- [ ] **Test production build locally**
  ```bash
  npm run build
  npm start
  # Visit http://localhost:3000
  ```

- [ ] **Run Lighthouse audit**
  ```bash
  # Desktop
  npx lighthouse http://localhost:3000 --preset=desktop --view

  # Mobile
  npx lighthouse http://localhost:3000 --preset=mobile --view
  ```

- [ ] **Test with throttled network**
  - Open Chrome DevTools
  - Network tab > Throttling > Slow 3G
  - Verify page loads acceptably

- [ ] **Test with slow CPU**
  - Open Chrome DevTools
  - Performance tab > CPU throttling > 4x slowdown
  - Verify interactions are responsive

- [ ] **Check Web Vitals extension**
  - Install Chrome Web Vitals extension
  - Visit all key pages
  - Verify all metrics in "Good" range

### Staging Testing (MANDATORY)

- [ ] **Run Lighthouse CI**
  ```bash
  npx @lhci/cli@latest autorun --config=lighthouserc.json
  ```

- [ ] **Test on real mobile devices**
  - iOS Safari
  - Android Chrome
  - Verify performance on actual devices

- [ ] **Run WebPageTest**
  - Visit https://www.webpagetest.org/
  - Test from multiple locations
  - Run 3x and check median results

- [ ] **Validate Core Web Vitals**
  ```bash
  # Use Google Search Console or Chrome UX Report API
  curl "https://chromeuxreport.googleapis.com/v1/records:queryRecord?key=YOUR_API_KEY" \
    -H "Content-Type: application/json" \
    --data '{"url": "https://your-staging-url.com"}'
  ```

### RECOMMENDED Testing

- [ ] **Test on low-end devices**
  - Use device emulation in Chrome
  - Test on devices like Moto G4

- [ ] **Test with ad blockers disabled**
  - Verify third-party scripts load correctly

- [ ] **Cross-browser testing**
  - Chrome
  - Safari
  - Firefox
  - Edge

---

## Environment-Specific Checks

### Development Environment

- [ ] **Next.js dev server runs without errors**
  ```bash
  npm run dev
  ```

- [ ] **Hot reload working correctly**

- [ ] **Source maps generated**
  ```javascript
  // next.config.js
  module.exports = {
    productionBrowserSourceMaps: true, // Optional for production
  };
  ```

### Staging Environment (MANDATORY)

- [ ] **Environment variables configured**
  ```bash
  # Verify all required env vars are set
  echo $NEXT_PUBLIC_API_URL
  echo $NEXT_PUBLIC_CDN_URL
  ```

- [ ] **CDN properly configured**
  - Test assets load from CDN
  - Verify cache headers

- [ ] **Analytics tracking working**
  - Google Analytics
  - Web Vitals monitoring
  - Error tracking

- [ ] **SSL certificate valid**
  ```bash
  openssl s_client -connect your-staging-url.com:443 -servername your-staging-url.com
  ```

### Production Environment (MANDATORY)

- [ ] **All environment variables set**

- [ ] **CDN cache properly configured**
  - Static assets: 1 year cache
  - HTML: 5 minutes cache
  - API: Appropriate cache based on data

- [ ] **Monitoring and alerting active**
  - Performance monitoring
  - Error tracking
  - Uptime monitoring

- [ ] **Rollback plan documented**

---

## Caching Validation

### MANDATORY Cache Headers

- [ ] **Static assets cached for 1 year**
  ```bash
  # Test cache headers
  curl -I https://your-domain.com/_next/static/chunks/main-abc123.js
  # Should show: Cache-Control: public, max-age=31536000, immutable
  ```

- [ ] **Images cached appropriately**
  ```bash
  curl -I https://your-domain.com/_next/image?url=/photo.jpg&w=640&q=75
  # Should show appropriate Cache-Control header
  ```

- [ ] **API responses cached when appropriate**
  ```bash
  curl -I https://your-domain.com/api/products
  # Should show: Cache-Control: public, s-maxage=60, stale-while-revalidate=300
  ```

### CDN Configuration (MANDATORY)

- [ ] **CDN enabled for static assets**

- [ ] **Gzip/Brotli compression enabled**
  ```bash
  # Test compression
  curl -H "Accept-Encoding: gzip,deflate,br" -I https://your-domain.com/
  # Should show: Content-Encoding: br (or gzip)
  ```

- [ ] **CDN cache hit rate > 80%**
  - Check CDN dashboard
  - Optimize cache rules if needed

### Service Worker (OPTIONAL)

- [ ] **Service worker registered**
  ```typescript
  // public/sw.js
  self.addEventListener('install', (event) => {
    event.waitUntil(
      caches.open('v1').then((cache) => {
        return cache.addAll(['/']);
      })
    );
  });
  ```

- [ ] **Offline functionality working**

---

## Monitoring Setup

### MANDATORY Monitoring

- [ ] **Real User Monitoring (RUM) active**
  ```typescript
  // Verify Web Vitals are being sent
  import { useReportWebVitals } from 'next/web-vitals';

  export function WebVitalsReporter() {
    useReportWebVitals((metric) => {
      // Send to analytics
      sendToAnalytics(metric);
    });
    return null;
  }
  ```

- [ ] **Error tracking configured**
  - Sentry, LogRocket, or similar
  - Verify errors are being captured

- [ ] **Performance alerts configured**
  - Alert when LCP > 2.5s
  - Alert when CLS > 0.1
  - Alert when FID/INP exceed thresholds

### RECOMMENDED Monitoring

- [ ] **Synthetic monitoring setup**
  - Lighthouse CI running every hour
  - WebPageTest scheduled tests

- [ ] **Performance dashboard accessible**
  - Web Vitals trends
  - Page load times
  - Error rates

- [ ] **Custom performance metrics tracked**
  - Time to interactive
  - API response times
  - Third-party script load times

---

## Security Checks

### MANDATORY Security

- [ ] **Dependencies audited**
  ```bash
  npm audit
  # Fix all high/critical vulnerabilities
  npm audit fix
  ```

- [ ] **Content Security Policy configured**
  ```typescript
  // next.config.js
  module.exports = {
    async headers() {
      return [{
        source: '/:path*',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: "default-src 'self'; script-src 'self' 'unsafe-inline' https://trusted-cdn.com;"
          }
        ]
      }];
    }
  };
  ```

- [ ] **HTTPS enforced**
  ```typescript
  // middleware.ts
  export function middleware(request: NextRequest) {
    if (request.headers.get('x-forwarded-proto') !== 'https') {
      return NextResponse.redirect(
        `https://${request.headers.get('host')}${request.nextUrl.pathname}`,
        301
      );
    }
  }
  ```

---

## Documentation

### MANDATORY Documentation

- [ ] **Performance budget documented**

- [ ] **Optimization strategies documented**

- [ ] **Known performance issues tracked**

- [ ] **Testing procedures documented**

### RECOMMENDED Documentation

- [ ] **Performance benchmarks recorded**
  - Baseline metrics
  - Target metrics
  - Current metrics

- [ ] **Optimization backlog maintained**

---

## Final Pre-Deployment Checklist

### Critical Checks (MANDATORY)

- [ ] PageSpeed Insights score ≥ 90 (desktop and mobile)
- [ ] LCP < 2.5s (desktop), < 4.0s (mobile)
- [ ] FID/INP within acceptable range
- [ ] CLS < 0.1
- [ ] First Load JS < 200 KB
- [ ] All images optimized
- [ ] Production build successful
- [ ] No console errors
- [ ] Lighthouse CI passing
- [ ] Bundle analysis reviewed
- [ ] Cache headers configured
- [ ] CDN enabled
- [ ] Monitoring active
- [ ] Security audit passed

### Sign-off

- [ ] **Developer sign-off**: _________________
- [ ] **QA sign-off**: _________________
- [ ] **Performance team sign-off**: _________________

**Deployment Date**: _________________

**Performance Baseline**:
- Desktop PageSpeed Score: _____
- Mobile PageSpeed Score: _____
- LCP (Desktop): _____ ms
- LCP (Mobile): _____ ms
- CLS: _____
- First Load JS: _____ KB

---

## Quick Reference Commands

```bash
# Build and analyze
npm run build
ANALYZE=true npm run build

# Lighthouse audits
npx lighthouse http://localhost:3000 --preset=desktop --view
npx lighthouse http://localhost:3000 --preset=mobile --view

# Check bundle size
npm run build && du -sh .next/static

# Test dependencies
npm audit
npx depcheck

# Run Lighthouse CI
npx @lhci/cli@latest autorun

# Check image sizes
find public -type f \( -name "*.jpg" -o -name "*.png" -o -name "*.webp" \) -exec du -h {} \; | sort -rh

# Test TTFB
curl -o /dev/null -s -w 'TTFB: %{time_starttransfer}s\n' https://your-domain.com

# Check cache headers
curl -I https://your-domain.com/_next/static/chunks/main.js

# Test compression
curl -H "Accept-Encoding: gzip,deflate,br" -I https://your-domain.com
```

---

**Last Updated:** 2025-11-07
**Review Frequency:** Before every deployment
**Owner:** Performance Team
