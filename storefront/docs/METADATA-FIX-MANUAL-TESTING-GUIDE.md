# Metadata Preservation Fix - Manual Testing Guide

## Overview
This guide provides step-by-step instructions to manually verify that the metadata preservation fix is working correctly.

## Background
**Issue**: When adding an addon to the cart, it was immediately being removed because `applicable_tours` metadata was lost during cart sync.

**Fix**: Modified CartContext to preserve and restore `applicable_tours` metadata when storing/retrieving addons from Medusa backend.

## Prerequisites
- Development server running on `http://localhost:8000`
- Browser with DevTools (Chrome/Firefox/Safari)
- A tour selected in cart (e.g., `2d-fraser-rainbow`)

## Test Setup

### Step 1: Open the Add-ons Flow Page
1. Navigate to: `http://localhost:8000/checkout/add-ons-flow?tour=2d-fraser-rainbow`
2. The page should load without errors
3. You should see a list of addons available for the selected tour

### Step 2: Open Browser DevTools
1. Press `F12` (or `Cmd+Option+I` on Mac)
2. Click on the **Console** tab
3. Clear any existing console messages (optional)

## Manual Test Cases

### Test 1: Add Single Addon
**Objective**: Verify addon is added and stays in cart

1. **Action**: Click "ADD" button on any addon (e.g., "BBQ on the Beach")
2. **Expected Results**:
   - ✅ Success toast appears: "[Addon Name] added"
   - ❌ NO removal toast should appear
   - ✅ Addon appears in cart sidebar
   - ✅ Cart total updates correctly

3. **Console Verification**:
   Look for these log messages:
   ```
   [CartContext] Adding addon: { id: "...", title: "...", variant_id: "...", price_cents: ... }
   [CartContext] Storing addon metadata: {
     addon_id: "...",
     category: "...",
     applicable_tours: ["2d-fraser-rainbow", ...],
     max_quantity: ...
   }
   [CartContext] Syncing cart from backend...
   [CartContext] Restored addon metadata: {
     addon_id: "...",
     category: "...",
     applicable_tours: ["2d-fraser-rainbow", ...],
     max_quantity: ...
   }
   ```

4. **Key Checks**:
   - ✅ `applicable_tours` array is present in "Storing" log
   - ✅ `applicable_tours` array is present in "Restored" log
   - ✅ `applicable_tours` includes the current tour handle
   - ✅ No error messages in console

**PASS/FAIL**: _________

---

### Test 2: Add Multiple Addons
**Objective**: Verify multiple addons can be added without interference

1. **Action**: Click "ADD" on 2-3 different addons
2. **Expected Results**:
   - ✅ Each addon shows success toast
   - ✅ All addons appear in cart
   - ✅ No removal toasts appear
   - ✅ Cart total reflects all addons

3. **Console Verification**:
   - ✅ See "Storing" and "Restored" logs for each addon
   - ✅ Each addon has its own `applicable_tours` array
   - ✅ No validation errors

**PASS/FAIL**: _________

---

### Test 3: Remove Addon
**Objective**: Verify addon removal works correctly

1. **Action**: Click "REMOVE" on an addon in cart
2. **Expected Results**:
   - ✅ Info toast: "[Addon Name] removed"
   - ✅ Addon disappears from cart
   - ✅ Cart total updates correctly

3. **Console Verification**:
   - ✅ No errors during removal
   - ✅ Cart sync completes successfully

**PASS/FAIL**: _________

---

### Test 4: Change Addon Quantity
**Objective**: Verify quantity changes preserve metadata

1. **Action**: Increase/decrease quantity on an addon (if quantity controls available)
2. **Expected Results**:
   - ✅ Quantity updates in cart
   - ✅ Price recalculates correctly
   - ✅ Addon stays in cart

3. **Console Verification**:
   - ✅ Metadata is preserved during update
   - ✅ `applicable_tours` still present after update

**PASS/FAIL**: _________

---

### Test 5: Page Refresh (Cart Persistence)
**Objective**: Verify cart persists across page reloads

1. **Setup**: Add 2-3 addons to cart
2. **Action**: Refresh the page (F5 or Cmd+R)
3. **Expected Results**:
   - ✅ Page reloads
   - ✅ All addons still in cart
   - ✅ Cart totals correct
   - ✅ No removal toasts after reload

4. **Console Verification**:
   - ✅ See "Syncing cart from backend" message
   - ✅ See "Restored addon metadata" for each addon
   - ✅ `applicable_tours` restored for each addon

**PASS/FAIL**: _________

---

### Test 6: Navigate Between Categories
**Objective**: Verify addons persist when navigating flow steps

1. **Setup**: Add addon on Step 1
2. **Action**: Click "Next Category" to go to Step 2
3. **Action**: Click "Back" to return to Step 1
4. **Expected Results**:
   - ✅ Previously added addon still in cart
   - ✅ Still shows as selected
   - ✅ No removal toasts

**PASS/FAIL**: _________

---

### Test 7: Incompatible Addon Detection (Edge Case)
**Objective**: Verify tour change detection removes incompatible addons

**Note**: This test requires changing tours, which may not be possible in add-ons flow.
Test only if tour selection can be changed from this page.

1. **Setup**: Add addon specific to current tour
2. **Action**: Change to different tour (if possible)
3. **Expected Results**:
   - ✅ Info toast: "[N] add-on(s) removed (not available for this tour): [names]"
   - ✅ Incompatible addons removed from cart
   - ✅ Compatible addons (if any) remain

**PASS/FAIL**: _________ (N/A if tour change not possible)

---

## Inspection Tests

### Inspect Cart State in DevTools

1. In Console, run:
   ```javascript
   // Access cart state (may need to find it in React DevTools)
   // Look for CartContext state
   ```

2. **OR** Use React DevTools:
   - Install React DevTools extension
   - Open Components tab
   - Find `CartProvider` component
   - Inspect `cart.addons` array
   - Verify each addon has `metadata.applicable_tours`

### Check LocalStorage

1. In Console tab, run:
   ```javascript
   localStorage.getItem('medusa_cart_id')
   ```
2. Copy the cart ID
3. Use Medusa admin to inspect cart and verify metadata

---

## Expected Console Log Pattern

When adding an addon, you should see this sequence:

```
[Add-ons Flow] Using tour handle: 2d-fraser-rainbow
[CartContext] addAddonToCart called with: { addon_id: "...", ... }
[CartContext] Calculated addon price: 3000
[CartContext] Adding NEW addon to cart with variant_id: var_...
[CartContext] Storing addon metadata: {
  addon_id: "prod_...",
  category: "Activities",
  applicable_tours: ["2d-fraser-rainbow", "3d-fraser-advanced"],
  max_quantity: 10
}
[CartContext] Syncing cart from backend, cart_id: cart_...
[CartContext] Retrieved cart with 2 items
[CartContext] Restored addon metadata: {
  addon_id: "prod_...",
  category: "Activities",
  applicable_tours: ["2d-fraser-rainbow", "3d-fraser-advanced"],
  max_quantity: 10
}
[CartContext] Cart sync complete. Tour booking: true
```

---

## Troubleshooting

### Issue: Addon added then immediately removed
**Symptoms**:
- Success toast appears
- Immediately followed by removal toast
- Addon not in cart

**Likely Cause**: Metadata not being preserved
**Check**:
- Console logs for "Storing addon metadata"
- Verify `applicable_tours` is present
- Check "Restored addon metadata" has `applicable_tours`

**Fix**: Verify CartContext changes are deployed (hot reload may not have picked up changes)

---

### Issue: No console logs appearing
**Symptoms**:
- No CartContext logs in console
- Addons not being added

**Check**:
- DevTools Console tab is open
- Console level set to "Verbose" or "All"
- No filters applied in console
- Server running and page loaded correctly

---

### Issue: applicable_tours is undefined
**Symptoms**:
- Console shows `applicable_tours: undefined`

**Check**:
- Addon data source has `metadata.applicable_tours` field
- Backend returning correct data structure
- Type definitions include `applicable_tours` field

---

## Success Criteria

The fix is working correctly if:

- ✅ All manual tests pass
- ✅ Console logs show metadata being stored
- ✅ Console logs show metadata being restored
- ✅ `applicable_tours` array is present in both storage and restoration
- ✅ No addons are incorrectly removed after being added
- ✅ Cart state persists across page refreshes
- ✅ No TypeScript or runtime errors

---

## Test Report Template

```
# Metadata Fix Test Report

**Date**: ___________
**Tester**: ___________
**Browser**: ___________
**Environment**: localhost:8000

## Test Results

- Test 1 (Add Single Addon): PASS / FAIL
- Test 2 (Multiple Addons): PASS / FAIL
- Test 3 (Remove Addon): PASS / FAIL
- Test 4 (Change Quantity): PASS / FAIL
- Test 5 (Page Refresh): PASS / FAIL
- Test 6 (Navigate Categories): PASS / FAIL
- Test 7 (Incompatible Detection): PASS / FAIL / N/A

## Console Logs Verification
- Metadata storage logged: YES / NO
- Metadata restoration logged: YES / NO
- applicable_tours present: YES / NO

## Issues Found
[List any issues encountered]

## Overall Status
PASS / FAIL

## Notes
[Any additional observations]
```

---

## Additional Verification

### Code Review Checklist
- ✅ CartContext.tsx lines 234-240: Metadata restoration
- ✅ CartContext.tsx lines 489-493: Metadata storage
- ✅ cart.ts lines 289-292: Type definition includes applicable_tours
- ✅ addon-filtering.ts: Validation functions exist
- ✅ AddOnsFlow page.tsx lines 154-180: Tour change detection

### Files Changed
1. `/lib/context/CartContext.tsx` - Lines 234-240, 489-493
2. `/lib/types/cart.ts` - Lines 289-292
3. All other files unchanged (filtering logic already existed)

---

## Conclusion

If all tests pass, the metadata preservation fix is working correctly and the issue of addons being removed immediately after addition has been resolved.
