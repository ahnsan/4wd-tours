# Metadata Data Flow - Visual Diagram

**Date**: 2025-11-11
**Purpose**: Visualize how metadata flows from database to frontend

---

## Current Flow (BROKEN ❌)

```
┌─────────────────────────────────────────────────────────────────────┐
│ PostgreSQL Database                                                  │
│                                                                      │
│ product table:                                                       │
│   metadata (JSONB) = {                                              │
│     "addon": true,                                                  │
│     "applicable_tours": ["2d-fraser-rainbow", "3d-fraser-rainbow"], │
│     "category": "Accommodation",                                    │
│     "max_quantity": 10                                              │
│   }                                                                 │
└───────────────────────────────┬──────────────────────────────────────┘
                                │
                                │ SQL Query
                                ▼
┌─────────────────────────────────────────────────────────────────────┐
│ Medusa Store API (/store/products)                                  │
│                                                                      │
│ Request: GET /store/products?fields=+metadata                       │
│ Header: x-publishable-api-key: pk_34de...                          │
│                                                                      │
│ Response (JSON):                                                     │
│   {                                                                 │
│     "products": [{                                                  │
│       "id": "prod_...",                                            │
│       "title": "Glamping Setup",                                   │
│       "metadata": {                                                │
│         "addon": true,                                             │
│         "applicable_tours": ["2d-fraser-rainbow", ...], ✅         │
│         "category": "Accommodation",                               │
│         "max_quantity": 10                                         │
│       }                                                            │
│     }]                                                             │
│   }                                                                │
└───────────────────────────────┬─────────────────────────────────────┘
                                │
                                │ HTTP Response
                                ▼
┌─────────────────────────────────────────────────────────────────────┐
│ Frontend: addons-service.ts                                          │
│                                                                      │
│ function convertProductToAddOn(product: any): Addon {               │
│                                                                      │
│   // ❌ PROBLEM: Only preserves some metadata fields                │
│   return {                                                          │
│     id: product.id,                                                │
│     title: product.title,                                          │
│     category: product.metadata?.category,                          │
│     metadata: {                                                    │
│       max_quantity: product.metadata?.max_quantity,      ✅        │
│       quantity_allowed: product.metadata?.quantity_allowed, ✅    │
│       recommended_for: product.metadata?.recommended_for,  ✅      │
│       tags: product.metadata?.tags,                       ✅       │
│       // ❌ MISSING: applicable_tours is NOT preserved here!       │
│     }                                                              │
│   }                                                                │
│ }                                                                   │
└───────────────────────────────┬─────────────────────────────────────┘
                                │
                                │ Return Addon Object
                                ▼
┌─────────────────────────────────────────────────────────────────────┐
│ Frontend: Cart Validation Logic                                      │
│                                                                      │
│ function validateAddon(addon: Addon, tourHandle: string) {          │
│   const applicableTours = addon.metadata?.applicable_tours;         │
│   //                     ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^       │
│   //                     ❌ RETURNS NULL/UNDEFINED                  │
│   //                     Because it was dropped in conversion!      │
│                                                                      │
│   if (!applicableTours) {                                           │
│     return false; // ❌ Addon incorrectly marked as invalid         │
│   }                                                                 │
│                                                                      │
│   return applicableTours.includes(tourHandle);                      │
│ }                                                                   │
│                                                                      │
│ Result: ❌ Addon removed from cart (false negative)                │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Fixed Flow (WORKING ✅)

```
┌─────────────────────────────────────────────────────────────────────┐
│ PostgreSQL Database                                                  │
│                                                                      │
│ product table:                                                       │
│   metadata (JSONB) = {                                              │
│     "addon": true,                                                  │
│     "applicable_tours": ["2d-fraser-rainbow", "3d-fraser-rainbow"], │
│     "category": "Accommodation",                                    │
│     "max_quantity": 10                                              │
│   }                                                                 │
└───────────────────────────────┬──────────────────────────────────────┘
                                │
                                │ SQL Query
                                ▼
┌─────────────────────────────────────────────────────────────────────┐
│ Medusa Store API (/store/products)                                  │
│                                                                      │
│ Request: GET /store/products?fields=+metadata                       │
│ Header: x-publishable-api-key: pk_34de...                          │
│                                                                      │
│ Response (JSON):                                                     │
│   {                                                                 │
│     "products": [{                                                  │
│       "id": "prod_...",                                            │
│       "title": "Glamping Setup",                                   │
│       "metadata": {                                                │
│         "addon": true,                                             │
│         "applicable_tours": ["2d-fraser-rainbow", ...], ✅         │
│         "category": "Accommodation",                               │
│         "max_quantity": 10                                         │
│       }                                                            │
│     }]                                                             │
│   }                                                                │
└───────────────────────────────┬─────────────────────────────────────┘
                                │
                                │ HTTP Response
                                ▼
┌─────────────────────────────────────────────────────────────────────┐
│ Frontend: addons-service.ts (FIXED)                                 │
│                                                                      │
│ function convertProductToAddOn(product: any): Addon {               │
│                                                                      │
│   // ✅ FIX: Now preserves ALL metadata fields                      │
│   return {                                                          │
│     id: product.id,                                                │
│     title: product.title,                                          │
│     category: product.metadata?.category,                          │
│     metadata: {                                                    │
│       applicable_tours: product.metadata?.applicable_tours, ✅     │
│       max_quantity: product.metadata?.max_quantity,      ✅        │
│       quantity_allowed: product.metadata?.quantity_allowed, ✅    │
│       recommended_for: product.metadata?.recommended_for,  ✅      │
│       tags: product.metadata?.tags,                       ✅       │
│     }                                                              │
│   }                                                                │
│ }                                                                   │
└───────────────────────────────┬─────────────────────────────────────┘
                                │
                                │ Return Addon Object
                                ▼
┌─────────────────────────────────────────────────────────────────────┐
│ Frontend: Cart Validation Logic                                      │
│                                                                      │
│ function validateAddon(addon: Addon, tourHandle: string) {          │
│   const applicableTours = addon.metadata?.applicable_tours;         │
│   //                     ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^       │
│   //                     ✅ NOW RETURNS: ["2d-fraser-rainbow", ...] │
│   //                     Because it's preserved in conversion!      │
│                                                                      │
│   if (!applicableTours) {                                           │
│     return false; // Not reached - applicableTours exists           │
│   }                                                                 │
│                                                                      │
│   return applicableTours.includes(tourHandle);                      │
│   //     ✅ Returns true for compatible tours                       │
│ }                                                                   │
│                                                                      │
│ Result: ✅ Addon stays in cart (correct validation)                │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Admin Panel Independence

```
┌──────────────────────────────────────────────────────────┐
│ Admin Panel (Optional - Can be disabled)                  │
│                                                           │
│  - UI for managing products, orders, customers           │
│  - Makes API calls to Admin API (/admin/*)              │
│  - NOT required for Store API to function                │
│  - Can be disabled: admin.disable = true                 │
└──────────────────────────────┬────────────────────────────┘
                               │
                               │ HTTP (Optional)
                               ▼
┌──────────────────────────────────────────────────────────┐
│ Admin API (/admin/*)                                      │
│                                                           │
│  - Create/Update/Delete operations                        │
│  - Administrative endpoints                              │
│  - JWT authentication required                           │
│  - NOT used by Store API                                 │
└──────────────────────────────┬────────────────────────────┘
                               │
                               │ Direct DB Access
                               ▼
┌──────────────────────────────────────────────────────────┐
│ PostgreSQL Database (Shared)                              │
│                                                           │
│  - Stores all product data                               │
│  - Stores metadata as JSONB                              │
│  - Accessed by both Admin and Store APIs                 │
└──────────────────────────────┬────────────────────────────┘
                               │
                               │ Direct DB Access
                               ▼
┌──────────────────────────────────────────────────────────┐
│ Store API (/store/*)                                      │
│                                                           │
│  - Read-only customer-facing operations                   │
│  - Products, carts, orders, checkout                     │
│  - Publishable API key authentication                    │
│  - INDEPENDENT of Admin API/Panel                        │
└──────────────────────────────┬────────────────────────────┘
                               │
                               │ HTTP
                               ▼
┌──────────────────────────────────────────────────────────┐
│ Storefront (Frontend)                                     │
│                                                           │
│  - Next.js application                                   │
│  - Makes API calls to Store API only                     │
│  - Uses publishable API key                              │
│  - Does NOT interact with Admin API                      │
└──────────────────────────────────────────────────────────┘
```

**Key Point**: Admin Panel and Admin API are completely separate from Store API. The Store API works independently, connecting directly to the database.

---

## API Request Flow Detail

```
┌─────────────────────────────────────────────────────────────┐
│ Step 1: Frontend Makes Request                              │
│                                                              │
│ fetch(`${API_BASE_URL}/store/products?fields=+metadata`, {  │
│   headers: {                                                │
│     'x-publishable-api-key': 'pk_34de...'                  │
│   }                                                         │
│ })                                                          │
└──────────────────────────┬───────────────────────────────────┘
                           │
                           │ HTTP Request
                           ▼
┌─────────────────────────────────────────────────────────────┐
│ Step 2: Medusa Backend Receives Request                     │
│                                                              │
│  1. Validates publishable API key ✅                        │
│  2. Determines sales channel scope                          │
│  3. Parses `fields=+metadata` parameter                     │
│  4. Queries PostgreSQL database                             │
│  5. Includes metadata in SELECT statement                   │
│  6. Returns JSON response with metadata                     │
└──────────────────────────┬───────────────────────────────────┘
                           │
                           │ JSON Response
                           ▼
┌─────────────────────────────────────────────────────────────┐
│ Step 3: Frontend Receives Response                          │
│                                                              │
│ {                                                           │
│   "products": [{                                            │
│     "metadata": {                                           │
│       "applicable_tours": [...],  ✅ Present in API        │
│       "category": "...",          ✅ Present in API        │
│       "max_quantity": 10          ✅ Present in API        │
│     }                                                       │
│   }]                                                        │
│ }                                                           │
└──────────────────────────┬───────────────────────────────────┘
                           │
                           │ Data Conversion
                           ▼
┌─────────────────────────────────────────────────────────────┐
│ Step 4: convertProductToAddOn() (BEFORE FIX)                │
│                                                              │
│ metadata: {                                                 │
│   // ❌ applicable_tours DROPPED here                      │
│   max_quantity: product.metadata?.max_quantity,  ✅        │
│   // ... other fields                                       │
│ }                                                           │
└──────────────────────────┬───────────────────────────────────┘
                           │
                           │ Addon Object
                           ▼
┌─────────────────────────────────────────────────────────────┐
│ Step 5: Cart Validation (FAILS)                             │
│                                                              │
│ const applicableTours = addon.metadata?.applicable_tours;   │
│ // Returns: null/undefined ❌                               │
│                                                              │
│ if (!applicableTours) {                                     │
│   removeAddonFromCart(addon);  ❌ Incorrectly removed      │
│ }                                                           │
└─────────────────────────────────────────────────────────────┘
```

---

## The Fix in Detail

```typescript
// BEFORE (Lines 154-160):
metadata: {
  max_quantity: product.metadata?.max_quantity,
  quantity_allowed: product.metadata?.quantity_allowed,
  recommended_for: product.metadata?.recommended_for,
  tags: product.metadata?.tags,
  // ❌ applicable_tours is MISSING
},

// AFTER (Add one line):
metadata: {
  applicable_tours: product.metadata?.applicable_tours, // ✅ ADD THIS
  max_quantity: product.metadata?.max_quantity,
  quantity_allowed: product.metadata?.quantity_allowed,
  recommended_for: product.metadata?.recommended_for,
  tags: product.metadata?.tags,
},
```

**Impact:**
- `applicable_tours` data flows from database → API → frontend → cart validation
- Cart validation now has correct data to determine addon compatibility
- Addons are correctly kept or removed based on tour compatibility
- No backend changes needed (API already returns the data correctly)

---

## Testing Verification

### Before Fix
```javascript
// API Response (correct):
{
  "metadata": {
    "applicable_tours": ["2d-fraser-rainbow"],
    "max_quantity": 10
  }
}

// Frontend Addon Object (broken):
{
  "metadata": {
    // ❌ applicable_tours: undefined
    "max_quantity": 10
  }
}

// Cart Validation:
if (!addon.metadata?.applicable_tours) {
  removeAddon(); // ❌ EXECUTED (false negative)
}
```

### After Fix
```javascript
// API Response (correct):
{
  "metadata": {
    "applicable_tours": ["2d-fraser-rainbow"],
    "max_quantity": 10
  }
}

// Frontend Addon Object (fixed):
{
  "metadata": {
    "applicable_tours": ["2d-fraser-rainbow"], // ✅ Preserved
    "max_quantity": 10
  }
}

// Cart Validation:
if (!addon.metadata?.applicable_tours) {
  removeAddon(); // ✅ NOT EXECUTED
}
if (addon.metadata.applicable_tours.includes(currentTour)) {
  keepAddon(); // ✅ EXECUTED (correct validation)
}
```

---

## Summary

| Component | Status | Notes |
|-----------|--------|-------|
| Database | ✅ Working | Contains `applicable_tours` data |
| Store API | ✅ Working | Returns metadata with `fields=+metadata` |
| Publishable Key | ✅ Working | Authentication successful |
| Admin Panel | ⚪ Not Required | Store API works independently |
| Frontend Conversion | ❌ Broken → ✅ Fixed | One-line fix to preserve field |
| Cart Validation | ❌ Broken → ✅ Fixed | Now receives correct data |

---

**Visualization Purpose**: This diagram shows that the issue is NOT in the backend (database, API, authentication) but in the frontend data transformation layer. The fix is simple: preserve the `applicable_tours` field that the API already provides.
