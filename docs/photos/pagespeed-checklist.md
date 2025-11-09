# PageSpeed Optimization Checklist - Photo Integration

## Pre-Deployment Checklist

### ✅ Image Optimization
- [x] All images use Next.js `<Image>` component
- [x] Hero images have `priority={true}` attribute
- [x] Below-fold images use lazy loading (default)
- [x] Images have proper `width` and `height` or `fill` prop
- [x] Quality optimized (90 for hero, 80 for cards)
- [x] Responsive sizes attribute configured
- [x] Images are in optimized formats (Next.js converts to WebP/AVIF automatically)

### ✅ Performance Best Practices
- [x] No CLS (Cumulative Layout Shift) - all images have dimensions
- [x] LCP optimized - hero images preloaded with priority
- [x] Progressive image loading strategy implemented
- [x] No blocking image loads on initial render
- [x] Image file sizes reasonable (1-2MB, optimized by Next.js)

### ✅ SEO Optimization
- [x] All images have descriptive alt text
- [x] Alt text includes relevant keywords
- [x] Alt text includes location and brand name
- [x] Structured data includes image URLs
- [x] Images suitable for social media sharing (OG tags)

### ✅ Accessibility
- [x] Alt text describes image content accurately
- [x] No text embedded in images
- [x] Images support keyboard navigation (gallery)
- [x] ARIA labels where appropriate

---

## Testing Instructions

### 1. Local Development Test
```bash
cd /Users/Karim/med-usa-4wd/storefront
npm run dev
```
- Open http://localhost:3000
- Check that images load correctly
- Verify no console errors
- Check responsive behavior on different screen sizes

### 2. Production Build Test
```bash
cd /Users/Karim/med-usa-4wd/storefront
npm run build
npm run start
```
- Verify images are optimized in build output
- Check for any build warnings
- Test production bundle size

### 3. PageSpeed Insights Test
```bash
# After deployment to staging/production
# Visit: https://pagespeed.web.dev/
```
- Test homepage: `/`
- Test tour page: `/tours/[handle]`
- Target scores:
  - ✅ Desktop: 90+
  - ✅ Mobile: 90+

### 4. Core Web Vitals Check
Use Chrome DevTools:
1. Open DevTools (F12)
2. Go to Performance tab
3. Click "Reload and Record"
4. Check metrics:
   - **LCP:** Should be < 2.5s (green)
   - **CLS:** Should be < 0.1 (green)
   - **FID:** Should be < 100ms (green)

### 5. Lighthouse Audit
```bash
npx lighthouse http://localhost:3000 --view --preset=desktop
npx lighthouse http://localhost:3000 --view --preset=mobile
```
Target scores:
- Performance: 90+
- Accessibility: 95+
- Best Practices: 95+
- SEO: 95+

### 6. Mobile Device Testing
Test on real devices:
- iPhone (Safari)
- Android (Chrome)
- Verify image loading on 3G/4G networks
- Check responsive image sizing
- Test swipe gestures on gallery

### 7. SEO Validation
- **Google Rich Results Test:** https://search.google.com/test/rich-results
- **Structured Data Testing Tool:** Validate JSON-LD schemas
- **Social Media Preview:**
  - Facebook Sharing Debugger: https://developers.facebook.com/tools/debug/
  - Twitter Card Validator: https://cards-dev.twitter.com/validator

---

## Performance Metrics Targets

### Core Web Vitals
| Metric | Target | Status |
|--------|--------|--------|
| LCP (Largest Contentful Paint) | < 2.5s | ✅ Optimized with priority loading |
| FID (First Input Delay) | < 100ms | ✅ No blocking resources |
| CLS (Cumulative Layout Shift) | < 0.1 | ✅ Proper image dimensions |
| FCP (First Contentful Paint) | < 1.8s | ✅ Priority hero images |
| TTFB (Time to First Byte) | < 600ms | ⚠️ Depends on hosting |

### PageSpeed Insights
| Category | Desktop Target | Mobile Target | Status |
|----------|---------------|---------------|--------|
| Performance | 90+ | 90+ | ✅ Images optimized |
| Accessibility | 95+ | 95+ | ✅ Alt text present |
| Best Practices | 95+ | 95+ | ✅ Next.js best practices |
| SEO | 95+ | 95+ | ✅ Structured data |

---

## Common Issues & Solutions

### Issue: Images Load Slowly
**Solution:**
- Verify Next.js Image optimization is enabled
- Check network throttling in DevTools
- Ensure images use `priority={true}` for above-fold content

### Issue: Layout Shift on Image Load
**Solution:**
- Add proper `width` and `height` props to all Image components
- Use `fill` prop with proper container dimensions
- Reference `photo-map.ts` for correct dimensions

### Issue: Large Image File Sizes
**Solution:**
- Next.js automatically optimizes images
- Check if source images are unnecessarily large (>2MB)
- Consider pre-compressing source files with ImageOptim/TinyPNG

### Issue: Poor Mobile Performance
**Solution:**
- Verify responsive `sizes` attribute is set correctly
- Check if too many images load at once
- Ensure lazy loading is working for below-fold images

### Issue: Missing Alt Text
**Solution:**
- Use `PHOTO_ALT_TEXT` from `photo-map.ts`
- Ensure all Image components have `alt` prop
- Run accessibility audit in Lighthouse

---

## Optimization Opportunities

### Future Enhancements:
1. **AVIF Format Support**
   ```javascript
   // next.config.js
   module.exports = {
     images: {
       formats: ['image/avif', 'image/webp'],
     },
   };
   ```

2. **CDN Integration**
   - Cloudflare Images
   - Cloudinary
   - AWS CloudFront

3. **Image Preloading**
   ```html
   <link rel="preload" as="image" href="/images/tours/kgari-aerial.jpg" />
   ```

4. **Blur Placeholder**
   ```tsx
   <Image
     src="/images/tours/kgari-aerial.jpg"
     alt="..."
     placeholder="blur"
     blurDataURL="data:image/jpeg;base64,..."
   />
   ```

5. **Dynamic Imports for Gallery**
   ```tsx
   const TourGallery = dynamic(() => import('./TourGallery'), {
     loading: () => <p>Loading gallery...</p>,
   });
   ```

---

## Monitoring After Deployment

### Real User Monitoring (RUM)
- Set up Core Web Vitals tracking with Google Analytics 4
- Monitor field data in Google Search Console
- Track performance over time

### Periodic Audits
- Run PageSpeed Insights weekly
- Monitor Lighthouse scores
- Check for Core Web Vitals regressions

### Performance Budget
Set alerts if:
- LCP > 3.0s
- CLS > 0.15
- PageSpeed score drops below 85

---

## Quick Test Commands

```bash
# Development server
npm run dev

# Production build
npm run build && npm run start

# Lighthouse audit (desktop)
npx lighthouse http://localhost:3000 --preset=desktop --view

# Lighthouse audit (mobile)
npx lighthouse http://localhost:3000 --preset=mobile --view

# Bundle analysis
ANALYZE=true npm run build

# Type checking
npm run typecheck

# Linting
npm run lint
```

---

## Sign-off Checklist

Before marking this task as complete:

- [x] All images integrated across homepage and product pages
- [x] Next.js Image component used everywhere
- [x] Proper dimensions set to prevent CLS
- [x] Priority loading for above-fold images
- [x] SEO-optimized alt text for all images
- [x] Photo mapping library created (`photo-map.ts`)
- [x] Documentation created
- [ ] PageSpeed Insights test completed (90+ score)
- [ ] Mobile device testing completed
- [ ] Accessibility audit passed
- [ ] SEO validation completed
- [ ] Deployed to staging environment

---

**Last Updated:** November 8, 2025
**Next Review:** After deployment and PageSpeed testing
