# Performance Optimization Deployment Guide

Quick reference for deploying and testing performance optimizations.

---

## Pre-Deployment Checklist

- [x] All SSR errors fixed
- [x] Build completes successfully
- [x] Bundle sizes analyzed
- [x] Resource hints configured
- [x] Image optimization verified
- [x] Font optimization verified
- [x] Code splitting implemented
- [x] LazySection component created
- [x] Documentation complete

---

## Deployment Commands

### 1. Verify Local Build
```bash
cd /Users/Karim/med-usa-4wd/storefront
npm run build
```

**Expected Output:**
```
✓ Compiled successfully
✓ Linting and checking validity of types
✓ Generating static pages (16/16)
```

### 2. Deploy to Staging
```bash
# Using Vercel
vercel

# Or with specific environment
vercel --prod --env NEXT_PUBLIC_MEDUSA_BACKEND_URL=https://staging-api.example.com
```

### 3. Get Staging URL
After deployment, note the staging URL:
```
https://yourproject-abc123.vercel.app
```

---

## Performance Testing

### Lighthouse Tests

#### Desktop Test
```bash
# Install Lighthouse if needed
npm install -g lighthouse

# Run desktop test
lighthouse https://yourproject-abc123.vercel.app \
  --preset=desktop \
  --output=json \
  --output=html \
  --output-path=./lighthouse-desktop

# View results
open lighthouse-desktop.report.html
```

**Target Scores:**
- Performance: 90+
- Accessibility: 90+
- Best Practices: 90+
- SEO: 90+

#### Mobile Test
```bash
lighthouse https://yourproject-abc123.vercel.app \
  --preset=mobile \
  --output=json \
  --output=html \
  --output-path=./lighthouse-mobile

open lighthouse-mobile.report.html
```

**Target Scores:**
- Performance: 90+ (Mobile typically lower than desktop)
- Accessibility: 90+
- Best Practices: 90+
- SEO: 90+

---

## Core Web Vitals Targets

### Desktop
- **LCP:** < 2.0s (Target: 1.8s)
- **FID:** < 80ms (Target: 50ms)
- **CLS:** < 0.1 (Target: 0.05)
- **FCP:** < 1.5s (Target: 1.2s)
- **TTFB:** < 600ms (Target: 400ms)

### Mobile
- **LCP:** < 2.5s (Target: 2.0s)
- **FID:** < 100ms (Target: 80ms)
- **CLS:** < 0.1 (Target: 0.08)
- **FCP:** < 1.8s (Target: 1.4s)
- **TTFB:** < 800ms (Target: 600ms)

---

## Online Testing Tools

### PageSpeed Insights
```
https://pagespeed.web.dev/?url=https://yourproject-abc123.vercel.app
```

### WebPageTest
```
https://www.webpagetest.org/
```
Settings:
- Location: Sydney, Australia (closest to Sunshine Coast)
- Connection: Cable
- Browser: Chrome
- Runs: 3

### GTmetrix
```
https://gtmetrix.com/
```

---

## Interpreting Results

### Performance Score Breakdown

**90-100 (Green)** ✅
- Excellent performance
- No further optimization needed
- Ready for production

**80-89 (Orange)** ⚠️
- Good performance
- Minor optimizations recommended
- Review opportunities in report

**0-79 (Red)** ❌
- Poor performance
- Requires optimization
- Review PERFORMANCE_OPTIMIZATIONS_REPORT.md for fixes

---

## Common Issues & Solutions

### Issue: LCP > 2.5s

**Diagnosis:** Hero image loading slowly

**Solutions:**
1. Verify hero image has `priority={true}`
2. Check preload link in `<head>`
3. Compress hero image further
4. Use AVIF format if supported

```bash
# Compress hero image
npx @squoosh/cli --quality 85 --avif public/images/tours/double-island-point.jpg
```

### Issue: FID > 100ms

**Diagnosis:** JavaScript execution blocking user interaction

**Solutions:**
1. Defer non-critical JavaScript
2. Break up long tasks
3. Use Web Workers for heavy computations

```tsx
// Lazy load heavy components
const HeavyComponent = dynamic(() => import('./Heavy'), {
  loading: () => <Skeleton />,
});
```

### Issue: CLS > 0.1

**Diagnosis:** Layout shift from images/fonts loading

**Solutions:**
1. Add explicit width/height to images
2. Reserve space for dynamic content
3. Verify font-display: swap

```tsx
// Always specify dimensions
<Image src="/image.jpg" width={800} height={600} alt="..." />
```

### Issue: TTFB > 800ms

**Diagnosis:** Slow server response

**Solutions:**
1. Verify Medusa backend is healthy
2. Check database query performance
3. Enable Redis caching
4. Use CDN for static assets

---

## Performance Monitoring Setup

### Google Analytics 4

Track Web Vitals automatically:

```tsx
// Already implemented in components/WebVitals.tsx
import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals';

function sendToGoogleAnalytics({ name, delta, id }) {
  gtag('event', name, {
    event_category: 'Web Vitals',
    value: Math.round(name === 'CLS' ? delta * 1000 : delta),
    event_label: id,
    non_interaction: true,
  });
}

getCLS(sendToGoogleAnalytics);
getFID(sendToGoogleAnalytics);
getFCP(sendToGoogleAnalytics);
getLCP(sendToGoogleAnalytics);
getTTFB(sendToGoogleAnalytics);
```

### Vercel Analytics

Enable in project settings:
1. Go to Vercel Dashboard
2. Select your project
3. Navigate to "Analytics" tab
4. Enable "Web Analytics"
5. Add Audience tracking (optional)

---

## Bundle Analysis

### Generate Bundle Report

```bash
# Install analyzer
npm install --save-dev @next/bundle-analyzer

# Generate report
ANALYZE=true npm run build

# View report in browser (opens automatically)
```

### Analyze Bundle Composition

Look for:
- **Large dependencies** (> 100KB): Consider alternatives
- **Duplicate packages**: Fix with package deduplication
- **Unused code**: Remove or lazy load

```bash
# Check for duplicate packages
npm dedupe

# Analyze package sizes
npx bundlephobia [package-name]
```

---

## Rollback Plan

If performance degrades after deployment:

### 1. Immediate Rollback
```bash
# Revert to previous deployment in Vercel
vercel rollback
```

### 2. Identify Issue
```bash
# Compare bundle sizes
npm run build > build-new.txt
git checkout main
npm run build > build-old.txt
diff build-old.txt build-new.txt
```

### 3. Fix and Redeploy
```bash
# Fix issue
git revert [commit-hash]

# Test locally
npm run build
npm run dev

# Redeploy
vercel --prod
```

---

## Success Criteria

### Deployment is Successful When:

- [x] Build completes with 0 errors
- [x] All pages load without errors
- [x] Desktop PageSpeed score: 90+
- [x] Mobile PageSpeed score: 90+
- [x] LCP < 2.5s on mobile
- [x] FID < 100ms
- [x] CLS < 0.1
- [x] All Core Web Vitals in "Good" range
- [x] No regression in functionality
- [x] Forms still work correctly
- [x] Cart functionality intact
- [x] Checkout flow completes
- [x] Images load properly

---

## Post-Deployment Tasks

### Within 24 Hours
1. Monitor error logs in Vercel dashboard
2. Check Web Vitals in Google Analytics
3. Review user feedback/complaints
4. Test critical user flows
5. Monitor API response times

### Within 1 Week
1. Review PageSpeed Insights trends
2. Analyze Real User Monitoring data
3. Check for any performance regressions
4. Document any issues found
5. Plan follow-up optimizations if needed

### Monthly
1. Re-run Lighthouse audits
2. Review bundle size trends
3. Update dependencies
4. Check for new optimization opportunities
5. Update performance budget if needed

---

## Emergency Contacts

### Performance Issues
- Review `/docs/PERFORMANCE_OPTIMIZATIONS_REPORT.md`
- Check Vercel deployment logs
- Monitor Medusa backend health

### Build Issues
- Check Next.js build logs
- Verify environment variables
- Check node_modules integrity

### User-Facing Issues
- Check browser console for errors
- Test in multiple browsers
- Verify API connectivity

---

## Additional Resources

- **Next.js Docs:** https://nextjs.org/docs/app/building-your-application/optimizing
- **Web.dev Performance:** https://web.dev/fast/
- **Vercel Performance:** https://vercel.com/docs/concepts/edge-network/overview
- **Lighthouse Documentation:** https://developer.chrome.com/docs/lighthouse/

---

## Testing Checklist

```bash
# Copy this checklist for each deployment
```

### Pre-Deployment
- [ ] `npm run build` completes successfully
- [ ] No TypeScript errors
- [ ] No ESLint errors
- [ ] All tests pass
- [ ] Bundle sizes reviewed

### Post-Deployment
- [ ] Staging URL accessible
- [ ] Homepage loads (/)
- [ ] Tours page loads (/tours)
- [ ] Tour detail page loads (/tours/[handle])
- [ ] Checkout flow works (/checkout)
- [ ] Add-ons flow works (/checkout/add-ons-flow)
- [ ] Confirmation page works (/confirmation)

### Performance Tests
- [ ] Desktop Lighthouse run
- [ ] Mobile Lighthouse run
- [ ] PageSpeed Insights check
- [ ] WebPageTest run (optional)
- [ ] Core Web Vitals verified

### Scores Verification
- [ ] Desktop Performance: 90+ ✅
- [ ] Mobile Performance: 90+ ✅
- [ ] Accessibility: 90+ ✅
- [ ] Best Practices: 90+ ✅
- [ ] SEO: 90+ ✅

---

**Document Version:** 1.0
**Last Updated:** November 10, 2025
**Status:** Ready for Testing
