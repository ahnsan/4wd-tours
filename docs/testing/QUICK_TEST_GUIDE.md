# Quick Testing Guide - Hybrid Addon Widget

## 5-Minute Quick Test

### Setup
1. Ensure servers are running:
   - Backend: http://localhost:9000
   - Admin: http://localhost:9000/app
   - Storefront: http://localhost:8000

### Admin Widget Test (2 minutes)

1. **Open Admin**
   ```
   http://localhost:9000/app
   ```

2. **Navigate to Tour Product**
   - Go to Products
   - Select any tour (e.g., "1-Day Fraser Island")
   - Scroll down past product details

3. **Verify Widgets Appear**
   - [ ] "Available Addons" section visible
   - [ ] "Tour Addons" section visible
   - [ ] Both show addon counts

4. **Test Edit Mode**
   - Click "Edit Addons" button
   - [ ] Edit mode activates
   - [ ] Checkboxes appear
   - [ ] Search box appears
   - [ ] Quick action buttons appear

5. **Test Selection**
   - Check/uncheck some addons
   - [ ] Visual feedback (blue highlight)
   - [ ] Count badge updates
   - [ ] Universal addons marked

6. **Test Save**
   - Click "Save Changes"
   - [ ] "Saving..." state shows
   - [ ] Toast notification appears
   - [ ] Returns to read-only mode

### Storefront Test (3 minutes)

1. **Navigate to Tour**
   ```
   http://localhost:8000/tours/1d-fraser-island
   ```

2. **Book Tour**
   - Select a date
   - Click "Book Now"
   - [ ] Redirects to `/checkout/add-ons`
   - [ ] Then to `/checkout/add-ons/{category}`

3. **Verify Addons**
   - [ ] Addon cards display
   - [ ] Only applicable addons shown
   - [ ] Can select/deselect addons
   - [ ] Categories work

4. **Check Console**
   - Open DevTools Console
   - [ ] No errors visible
   - [ ] Debug logs show correct flow

## Expected Results

### All Passing Criteria
- ✅ Widgets appear on tour pages only
- ✅ Initial selections match metadata
- ✅ Edit mode toggles work
- ✅ Save updates successfully
- ✅ Booking flow navigates correctly
- ✅ Addons display on checkout
- ✅ No console errors

## Troubleshooting

### Widget Not Appearing
- Check product has `metadata.is_tour = true`
- Verify widget files are compiled
- Check browser console for errors

### Addons Not Loading
- Verify "add-ons" collection exists
- Check addon products have `applicable_tours` metadata
- Inspect Network tab for failed API calls

### Save Failing
- Check Network tab for 4xx/5xx errors
- Verify authentication cookie is valid
- Check backend logs for errors

## Full Test Report

For comprehensive test cases and detailed procedures, see:
```
/Users/Karim/med-usa-4wd/docs/testing/HYBRID_WIDGET_TEST_REPORT.md
```

---

**Quick Reference:**
- Admin: http://localhost:9000/app
- Storefront: http://localhost:8000
- Backend: http://localhost:9000
