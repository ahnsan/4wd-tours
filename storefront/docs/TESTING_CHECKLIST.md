# Core Web Vitals Testing Checklist

## Pre-Testing Setup

- [ ] Run `npm install` to install web-vitals dependency
- [ ] Run `npm run build` to create production build
- [ ] Clear browser cache before testing

---

## 1. Local Development Testing

### Start Dev Server
```bash
npm run dev
```

### Verify in Browser Console
- [ ] Open http://localhost:8000
- [ ] Open Chrome DevTools (F12) → Console tab
- [ ] Refresh page and wait for Web Vitals logs
- [ ] Verify all metrics appear with color coding:
  - [ ] LCP (Largest Contentful Paint)
  - [ ] FID (First Input Delay)
  - [ ] CLS (Cumulative Layout Shift)
  - [ ] FCP (First Contentful Paint)
  - [ ] TTFB (Time to First Byte)
  - [ ] INP (Interaction to Next Paint)

### Expected Console Output
```
[Web Vitals] LCP { value: "1850ms", rating: "good", ... }
[Web Vitals] FID { value: "25ms", rating: "good", ... }
[Web Vitals] CLS { value: "0.045", rating: "good", ... }
```

---

## 2. Production Build Testing

### Build and Start Production Server
```bash
npm run build
npm run start
```

### Verify Production Optimizations
- [ ] Open http://localhost:8000
- [ ] Check Network tab for preloaded resources
- [ ] Verify hero image loads with high priority
- [ ] Confirm no layout shifts during page load
- [ ] Test responsiveness on different screen sizes

---

## 3. Lighthouse Testing

### Desktop Test
1. [ ] Open http://localhost:8000 in Chrome
2. [ ] Open Chrome DevTools (F12)
3. [ ] Go to "Lighthouse" tab
4. [ ] Select:
   - [ ] Mode: Navigation
   - [ ] Device: Desktop
   - [ ] Categories: Performance only (for faster testing)
5. [ ] Click "Generate report"
6. [ ] Verify scores:
   - [ ] Performance: 95-100
   - [ ] LCP: < 1.8s (green)
   - [ ] FID: < 30ms (green)
   - [ ] CLS: < 0.05 (green)

### Mobile Test
1. [ ] Repeat above steps with Device: Mobile
2. [ ] Verify scores:
   - [ ] Performance: 90-95
   - [ ] LCP: < 2.5s (green)
   - [ ] FID: < 60ms (green)
   - [ ] CLS: < 0.08 (green)

---

## 4. Manual Visual Inspection

### LCP (Largest Contentful Paint)
- [ ] Hero image appears quickly
- [ ] No blank/white screen during initial load
- [ ] Hero image is the LCP element (verify in Lighthouse)
- [ ] Image loads with appropriate quality

### FID (First Input Delay)
- [ ] Click buttons immediately after page load
- [ ] Verify instant response (no delay)
- [ ] Navigation links respond quickly
- [ ] Reserve button is clickable without lag

### CLS (Cumulative Layout Shift)
- [ ] No content "jumps" during page load
- [ ] Images don't cause layout shifts
- [ ] Fonts load without causing text reflow
- [ ] Buttons and cards maintain stable positions
- [ ] Footer images don't shift

---

## 5. Network Tab Verification

### Check Resource Loading
- [ ] Open DevTools → Network tab
- [ ] Reload page
- [ ] Verify preload tags:
  - [ ] Hero image preload (Priority: High)
  - [ ] Font preload
  - [ ] DNS prefetch for fonts.googleapis.com
- [ ] Confirm lazy loading for below-fold images
- [ ] Check web-vitals loads dynamically (not in initial bundle)

### Expected Network Priority
```
High Priority:
- /images/hero.png (preloaded)
- fonts.googleapis.com (preconnected)

Medium Priority:
- /images/tour_options.png (lazy loaded)
- /images/footer.png (lazy loaded)
```

---

## 6. Performance Panel Testing

### Record Page Load
1. [ ] Open DevTools → Performance tab
2. [ ] Click Record button
3. [ ] Reload page
4. [ ] Stop recording after page fully loads
5. [ ] Analyze timeline:
   - [ ] Check for long tasks (should be minimal)
   - [ ] Verify LCP timing (< 2.5s)
   - [ ] Look for layout shift events (should be minimal/none)

---

## 7. Responsive Testing

### Test Different Screen Sizes
- [ ] Desktop (1920x1080)
  - [ ] Images load properly
  - [ ] No layout shifts
  - [ ] Performance is excellent

- [ ] Laptop (1366x768)
  - [ ] Responsive images work
  - [ ] Layout remains stable

- [ ] Tablet (768x1024)
  - [ ] Images scale correctly
  - [ ] Touch targets are adequate (44x44px minimum)

- [ ] Mobile (375x667)
  - [ ] Mobile optimizations active
  - [ ] Images use responsive sizing
  - [ ] CLS is minimal

---

## 8. Real-World Testing

### PageSpeed Insights
1. [ ] Deploy to production (or use ngrok for local testing)
2. [ ] Visit https://pagespeed.web.dev
3. [ ] Enter your URL
4. [ ] Click "Analyze"
5. [ ] Verify both Field Data and Lab Data scores
6. [ ] Check Core Web Vitals assessment

### WebPageTest
1. [ ] Visit https://webpagetest.org
2. [ ] Enter your URL
3. [ ] Select test location (closest to target audience)
4. [ ] Run test with:
   - [ ] Desktop browser
   - [ ] Mobile browser (3G/4G)
5. [ ] Review filmstrip and waterfall
6. [ ] Check Web Vitals metrics

---

## 9. Accessibility Testing

### Keyboard Navigation
- [ ] Tab through all interactive elements
- [ ] Skip link appears on focus
- [ ] Focus indicators are visible (WCAG 2.1 AA)
- [ ] All buttons/links are keyboard accessible

### Screen Reader (Optional)
- [ ] Test with screen reader (NVDA/JAWS/VoiceOver)
- [ ] Verify alt text on images
- [ ] Check ARIA labels
- [ ] Ensure semantic structure

---

## 10. Browser Compatibility

Test in multiple browsers:
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)
- [ ] Mobile Safari (iOS)
- [ ] Mobile Chrome (Android)

---

## Common Issues & Solutions

### High LCP
**Issue**: LCP > 2.5s
**Check**:
- [ ] Is hero image preloaded?
- [ ] Is Next.js Image using `priority` prop?
- [ ] Is image optimized/compressed?
- [ ] Is server response fast?

**Solution**: Verify preload link exists in `<head>`

### High CLS
**Issue**: CLS > 0.1
**Check**:
- [ ] Do all images have width/height?
- [ ] Is aspect-ratio CSS applied?
- [ ] Are fonts loading with display=swap?
- [ ] Is there content insertion above fold?

**Solution**: Add explicit dimensions to shifting elements

### High FID
**Issue**: FID > 100ms
**Check**:
- [ ] Are there long-running scripts?
- [ ] Is JavaScript blocking main thread?
- [ ] Are heavy computations happening on load?

**Solution**: Defer non-critical JavaScript

---

## Success Criteria

### Lighthouse Scores (Desktop)
- ✅ Performance: 95-100
- ✅ LCP: < 1.8s
- ✅ FID: < 30ms
- ✅ CLS: < 0.05

### Lighthouse Scores (Mobile)
- ✅ Performance: 90-95
- ✅ LCP: < 2.5s
- ✅ FID: < 60ms
- ✅ CLS: < 0.08

### Visual Checks
- ✅ No layout shifts visible
- ✅ Fast, responsive interactions
- ✅ Smooth page load
- ✅ Images load appropriately

---

## Test Results Template

```markdown
## Test Results - [Date]

### Environment
- Browser: Chrome 119
- Device: Desktop
- Connection: Fast 4G

### Lighthouse Scores
- Performance: 98/100
- LCP: 1.5s
- FID: 15ms
- CLS: 0.03

### Notes
- All optimizations working as expected
- No layout shifts observed
- Hero image loads with high priority

### Issues Found
- None

### Next Steps
- Deploy to production
- Monitor real-user metrics
```

---

**Remember**: Run tests in incognito mode to avoid extension interference!
