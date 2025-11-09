# Web Vitals Quick Start Guide

## Installation

```bash
npm install
# or
yarn install
```

This will install the `web-vitals` package (v3.5.0) required for performance monitoring.

## Development

```bash
npm run dev
```

Open http://localhost:8000 and check the browser console for Web Vitals metrics:

```
[Web Vitals] LCP
  value: 1850ms
  rating: good
  delta: 100ms
```

## Testing Performance

### 1. Local Lighthouse Test
1. Open Chrome DevTools (F12)
2. Go to "Lighthouse" tab
3. Select "Performance" category
4. Click "Generate report"

### 2. Production Testing
```bash
npm run build
npm run start
```

Then test with:
- Chrome DevTools Lighthouse
- https://pagespeed.web.dev
- https://webpagetest.org

## Key Optimizations

✅ **LCP < 2.5s**
- Hero image preloaded with `fetchPriority="high"`
- Next.js Image with `priority` prop
- Optimized font loading

✅ **FID < 100ms**
- Minimal JavaScript
- Dynamic imports for web-vitals
- No blocking scripts

✅ **CLS < 0.1**
- All images have explicit dimensions
- CSS aspect-ratio on all images
- Reserved space for dynamic content

## Monitoring

### Development
Web Vitals are logged to console with color coding:
- 🟢 Green = Good
- 🟠 Orange = Needs Improvement
- 🔴 Red = Poor

### Production
Metrics are sent to `/api/analytics` endpoint.

To integrate with analytics service:
1. Set `NEXT_PUBLIC_ANALYTICS_ENDPOINT` environment variable
2. Implement `/api/analytics` endpoint (or use existing service)

## Target Scores

### Desktop
- Performance: 95-100
- LCP: 1.2s - 1.8s
- FID: 10ms - 30ms
- CLS: 0.02 - 0.05

### Mobile (4G)
- Performance: 90-95
- LCP: 2.0s - 2.5s
- FID: 20ms - 60ms
- CLS: 0.03 - 0.08

## Common Issues

### High LCP
- Ensure images are optimized (WebP/AVIF)
- Check server response time
- Verify preload tags are working

### High CLS
- Add explicit dimensions to all images
- Use CSS aspect-ratio
- Avoid inserting content above existing content

### High FID
- Defer non-critical JavaScript
- Split code with dynamic imports
- Optimize long-running tasks

## Need Help?

See full documentation: `/docs/CORE_WEB_VITALS_OPTIMIZATION.md`
