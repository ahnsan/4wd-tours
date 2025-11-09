# Add-ons Page Testing Guide

**Purpose:** Verify text overflow fixes and UI/UX improvements
**Target URL:** http://localhost:8000/checkout/add-ons

---

## 🧪 Desktop Testing (Critical)

### Viewport 1: 1920px (Large Desktop)
**Chrome DevTools Setup:**
1. Open DevTools (F12)
2. Toggle device toolbar (Ctrl+Shift+M / Cmd+Shift+M)
3. Select "Responsive"
4. Set width: 1920px, height: 1080px

**What to Check:**
- [ ] Grid shows **3 columns** of add-on cards
- [ ] Gap between cards is **24px** (extra large)
- [ ] All cards in same row have **equal height**
- [ ] Long titles truncate to **2 lines** with ellipsis
- [ ] Long descriptions truncate to **3 lines** with ellipsis
- [ ] Price displays on **single line**, never wraps
- [ ] Category badges stay within card boundaries
- [ ] Hover effect: Card lifts 2px, title changes to tan color
- [ ] Selected cards have **3px** border (thicker than 2px default)

---

### Viewport 2: 1440px (Standard Desktop)
**Chrome DevTools Setup:**
- Set width: 1440px, height: 900px

**What to Check:**
- [ ] Grid shows **3 columns** of add-on cards
- [ ] Gap between cards is **24px**
- [ ] Cards maintain consistent height in each row
- [ ] No text overflow (titles, descriptions, prices)
- [ ] Hover effects work smoothly
- [ ] Selected state is visually clear

---

### Viewport 3: 1280px (Small Desktop)
**Chrome DevTools Setup:**
- Set width: 1280px, height: 800px

**What to Check:**
- [ ] Grid shows **2 columns** of add-on cards
- [ ] Gap between cards is **20px**
- [ ] Cards still maintain consistent height
- [ ] All text truncation working correctly
- [ ] No horizontal scrolling
- [ ] Summary sidebar visible and sticky

---

### Viewport 4: 1024px (Tablet Landscape)
**Chrome DevTools Setup:**
- Set width: 1024px, height: 768px

**What to Check:**
- [ ] Grid shows **2 columns** of add-on cards
- [ ] Gap between cards is **20px**
- [ ] Cards responsive and well-sized
- [ ] Summary sidebar still visible
- [ ] No layout breaking

---

## 📱 Mobile Testing

### Viewport 5: 768px (Tablet Portrait)
**Chrome DevTools Setup:**
- Set width: 768px, height: 1024px

**What to Check:**
- [ ] Grid shows **1 column** (stacked)
- [ ] Summary sidebar moves below add-ons
- [ ] Cards take full width
- [ ] Text truncation still works
- [ ] Touch targets are 48px minimum

---

### Viewport 6: 375px (Mobile)
**Chrome DevTools Setup:**
- Set width: 375px, height: 667px (iPhone SE)

**What to Check:**
- [ ] Grid shows **1 column** (stacked)
- [ ] Cards stack vertically with spacing
- [ ] No horizontal scrolling
- [ ] Text is readable (not too small)
- [ ] Buttons are easy to tap (48px min)
- [ ] Quantity controls work well

---

## 🎯 Specific Test Cases

### Test Case 1: Short Text (Minimum)
**Setup:** Add an add-on with:
- Title: "GPS Device" (11 chars)
- Description: "Track your route." (18 chars)

**Expected Result:**
- [ ] Title displays normally (no truncation needed)
- [ ] Description displays normally (no truncation)
- [ ] No ellipsis visible
- [ ] Card height matches others in row

---

### Test Case 2: Long Text (Maximum)
**Setup:** Add an add-on with:
- Title: "Professional Photography Package with Drone Coverage and Editing" (65 chars)
- Description: "Capture stunning aerial photos and videos of your adventure with our professional drone photography service. Includes full editing, color grading, and delivery of high-resolution files within 7 days. Perfect for creating lasting memories and social media content." (279 chars)

**Expected Result:**
- [ ] Title shows **2 lines** with ellipsis (...) at end
- [ ] Description shows **3 lines** with ellipsis (...) at end
- [ ] "Learn more" button is visible and functional
- [ ] Card height matches others in row
- [ ] No text escapes card boundaries
- [ ] Clicking "Learn more" shows full details in drawer

---

### Test Case 3: Price Display
**Setup:** Test with various pricing scenarios:
1. High price: $1,234.56
2. Long unit: "per item (14 days)"

**Expected Result:**
- [ ] Price always on **single line**
- [ ] No price wrapping or breaking
- [ ] Unit text truncates if too long (ellipsis)
- [ ] Price stays visually prominent

---

### Test Case 4: Category Badges
**Setup:** Test with:
- Short category: "Gear"
- Long category: "Essential Equipment Rental"

**Expected Result:**
- [ ] Short category displays fully
- [ ] Long category truncates with ellipsis if needed
- [ ] Badge stays within card boundaries
- [ ] Badge doesn't break card layout

---

### Test Case 5: Grid Consistency
**Setup:** Mix of short and long content across 6+ cards

**Expected Result:**
- [ ] All cards in same row have **equal height**
- [ ] Grid looks balanced and professional
- [ ] No "staircase" effect
- [ ] Gaps are consistent

---

### Test Case 6: Interaction States

#### Hover State (Desktop Only)
**Setup:** Hover over a card
**Expected Result:**
- [ ] Card lifts up **2px** (translateY)
- [ ] Shadow increases (0 4px 12px)
- [ ] Title color changes to tan (#C4B5A0)
- [ ] Border color changes to tan
- [ ] Transition is smooth (200ms)

#### Selected State
**Setup:** Click checkbox to select a card
**Expected Result:**
- [ ] Border becomes **3px** (thicker)
- [ ] Border color is tan
- [ ] Background changes to light cream
- [ ] Shadow is enhanced (0 6px 20px)
- [ ] Quantity controls appear (if applicable)
- [ ] Total price shows at bottom

#### Disabled State
**Setup:** View an unavailable add-on
**Expected Result:**
- [ ] Card opacity is **0.6** (greyed out)
- [ ] Cursor changes to "not-allowed"
- [ ] Checkbox is disabled
- [ ] No hover effects

---

## ♿ Accessibility Testing

### Reduced Motion Preference
**Setup:**
1. Open System Preferences / Settings
2. Enable "Reduce motion"
   - macOS: Accessibility > Display > Reduce motion
   - Windows: Ease of Access > Display > Show animations

**Expected Result:**
- [ ] No hover lift animation (translateY)
- [ ] No transitions on state changes
- [ ] Everything still functional
- [ ] Layout remains the same

---

### Keyboard Navigation
**Setup:** Use keyboard only (Tab, Enter, Space)

**Expected Result:**
- [ ] Can tab through all cards
- [ ] Focus outline is visible (3px solid)
- [ ] Can check/uncheck with Space or Enter
- [ ] Can navigate quantity controls with Tab
- [ ] Focus order is logical

---

### Screen Reader Testing
**Setup:** Enable VoiceOver (Cmd+F5) or NVDA

**Expected Result:**
- [ ] Card title is announced
- [ ] Price is announced
- [ ] Description is announced
- [ ] "Learn more" button is labeled correctly
- [ ] Quantity changes are announced
- [ ] Total updates are announced

---

## 🔍 Performance Testing

### Layout Stability (CLS)
**Setup:** Use Chrome DevTools > Performance

**Expected Result:**
- [ ] No layout shifts during page load
- [ ] Cards don't resize after text loads
- [ ] No content jumping
- [ ] CLS score: **0** (no shifts)

---

### Rendering Performance
**Setup:** Use Chrome DevTools > Performance > Record

**Actions:**
1. Scroll through add-ons
2. Hover over cards
3. Select/deselect cards
4. Change quantities

**Expected Result:**
- [ ] Smooth 60fps scrolling
- [ ] No jank during hover
- [ ] Quick state changes (< 100ms)
- [ ] No forced reflows

---

## 📸 Visual Regression Testing

### Screenshots to Capture
For each viewport (1920px, 1440px, 1280px, 1024px, 768px, 375px):

1. **Default State**
   - [ ] All cards visible, nothing selected

2. **With Selections**
   - [ ] 2-3 cards selected
   - [ ] Quantity controls visible

3. **Hover State** (desktop only)
   - [ ] One card hovered

4. **Long Text**
   - [ ] Cards with truncated titles/descriptions

5. **Empty State**
   - [ ] No add-ons available message

---

## ✅ Sign-Off Checklist

### Desktop (All Viewports)
- [ ] No text overflow anywhere
- [ ] Consistent card heights in each row
- [ ] Grid columns correct (3/2/1)
- [ ] Hover effects work (desktop only)
- [ ] Selected state is clear
- [ ] Price always on single line

### Mobile (768px and below)
- [ ] Single column layout
- [ ] No horizontal scroll
- [ ] Touch targets are 48px min
- [ ] Text is readable
- [ ] All interactions work

### Accessibility
- [ ] Keyboard navigation works
- [ ] Screen reader friendly
- [ ] Reduced motion respected
- [ ] High contrast mode works
- [ ] WCAG 2.1 AA compliant

### Performance
- [ ] No layout shifts (CLS = 0)
- [ ] Smooth interactions (60fps)
- [ ] Fast load times
- [ ] No console errors

### Visual Quality
- [ ] Professional appearance
- [ ] Matches design inspiration (Airbnb, Viator, GetYourGuide)
- [ ] Consistent spacing
- [ ] Clear visual hierarchy

---

## 🐛 Known Issues / Limitations

### Browser Compatibility
- `-webkit-line-clamp` requires WebKit browsers (Chrome, Safari, Edge)
- Fallback: `overflow: hidden` ensures no overflow even without clamp
- IE11: Not supported (project uses modern browsers only)

### Edge Cases
- **Very short cards:** Min-height of 280px ensures consistency
- **Mobile min-height:** Removed on mobile to let content determine height
- **Long category names:** Truncate with ellipsis to prevent overflow

---

## 📝 Testing Notes Template

```
Date: ____________________
Tester: __________________
Environment: _____________

| Viewport | Columns | Overflow | Hover | Selected | Notes |
|----------|---------|----------|-------|----------|-------|
| 1920px   | ☐ 3     | ☐ None   | ☐ OK  | ☐ OK     |       |
| 1440px   | ☐ 3     | ☐ None   | ☐ OK  | ☐ OK     |       |
| 1280px   | ☐ 2     | ☐ None   | ☐ OK  | ☐ OK     |       |
| 1024px   | ☐ 2     | ☐ None   | ☐ OK  | ☐ OK     |       |
| 768px    | ☐ 1     | ☐ None   | N/A   | ☐ OK     |       |
| 375px    | ☐ 1     | ☐ None   | N/A   | ☐ OK     |       |

Issues Found:
1. _____________________________________________
2. _____________________________________________
3. _____________________________________________

Overall Status: ☐ PASS  ☐ FAIL
```

---

## 🚀 Quick Test Commands

```bash
# Start dev server
npm run dev

# Open in browser
open http://localhost:8000/checkout/add-ons

# Run Lighthouse (Performance + Accessibility)
npx lighthouse http://localhost:8000/checkout/add-ons --view

# Check bundle size impact
npm run build
npm run analyze
```

---

**Last Updated:** 2025-11-08
**Status:** Ready for QA
**Estimated Test Time:** 30-45 minutes (comprehensive)
