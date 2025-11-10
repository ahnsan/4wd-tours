# Backend API Analysis - Cart Response Format

**Agent**: Backend API Analyzer
**Date**: 2025-11-10
**Task**: Analyze Medusa v2 cart API responses to understand validation failures

## Executive Summary

The validation is failing because the Zod schema expects **required string fields** for address properties, but Medusa v2 API returns **null** for unset address fields. This is the root cause of the 13 validation errors.

## Key Findings

### 1. API Endpoints Being Called

From `/Users/Karim/med-usa-4wd/storefront/lib/data/cart-service.ts`:

**Cart Operations:**
- `POST /store/carts` - Create cart (line 316)
- `GET /store/carts/{id}` - Get cart (line 380)
- `POST /store/carts/{id}` - Update cart (line 724)
- `POST /store/carts/{id}/line-items` - Add item (line 461)
- `POST /store/carts/{id}/complete` - Complete cart (line 1074)

**Fields Requested in getCart() (lines 357-371):**
```javascript
const defaultFields = [
  '*items',
  '*items.variant',
  '*items.product',
  '*shipping_methods',
  '*shipping_address',
  '*billing_address',
  '*payment_sessions',
  '*payment_collection',
  '*region',
  'subtotal',
  'total',
  'tax_total',
  'shipping_total',
];
```

### 2. Medusa v2 Cart Response Structure

From official documentation (`/Users/Karim/med-usa-4wd/docs/medusa-llm/medusa-llms-full.txt`):

**Cart Address Fields** (lines 29464-29466):
- Cart has `shipping_address` and `billing_address`
- Both use the `Address` data model
- These fields are **optional** in the cart response

**Address Data Model Properties:**
- `first_name` - **nullable**
- `last_name` - **nullable**
- `address_1` - **nullable**
- `address_2` - **nullable**
- `city` - **nullable**
- `country_code` - **nullable**
- `province` - **nullable**
- `postal_code` - **nullable**
- `phone` - **nullable**
- `company` - **nullable**

### 3. Current Validation Schema

From `/Users/Karim/med-usa-4wd/storefront/lib/validation/medusa-schemas.ts` (lines 26-38):

```typescript
export const AddressSchema = z.object({
  first_name: z.string().min(1),        // ❌ PROBLEM: Requires string
  last_name: z.string().min(1),         // ❌ PROBLEM: Requires string
  address_1: z.string().min(1),         // ❌ PROBLEM: Requires string
  address_2: z.string().optional(),     // ✅ OK: Optional
  city: z.string().min(1),              // ❌ PROBLEM: Requires string
  country_code: z.string().length(2),   // ❌ PROBLEM: Requires string
  province: z.string().optional(),      // ✅ OK: Optional
  postal_code: z.string().min(1),       // ❌ PROBLEM: Requires string
  phone: z.string().optional(),         // ✅ OK: Optional
  company: z.string().optional(),       // ✅ OK: Optional
  metadata: z.record(z.string(), z.any()).optional(),
}).passthrough();
```

## The Validation Mismatch

### What Medusa v2 API Returns (for new/empty carts):
```json
{
  "cart": {
    "id": "cart_01ABC123",
    "shipping_address": {
      "first_name": null,
      "last_name": null,
      "address_1": null,
      "city": null,
      "country_code": null,
      "postal_code": null,
      "province": null,
      "phone": null,
      "company": null
    },
    "billing_address": null,
    "items": [],
    "region_id": "reg_01K9G4HA190556136E7RJQ4411"
  }
}
```

### What Zod Schema Expects:
```typescript
{
  shipping_address: {
    first_name: string,     // ❌ Got: null
    last_name: string,      // ❌ Got: null
    address_1: string,      // ❌ Got: null
    city: string,           // ❌ Got: null
    country_code: string,   // ❌ Got: null
    postal_code: string     // ❌ Got: null
  }
}
```

## Root Cause

**The 13 validation failures occur because:**

1. Medusa v2 returns address fields as `null` for new/unset carts
2. Current Zod schema expects these to be **strings** (even empty strings)
3. Zod's `.string()` validator rejects `null` values
4. The schema should use `.string().nullable()` or `.string().optional().nullable()`

## Affected Fields (13 Total)

From the validation agent's findings, these fields fail validation:

**Shipping Address (6 fields):**
1. `shipping_address.first_name`
2. `shipping_address.last_name`
3. `shipping_address.address_1`
4. `shipping_address.city`
5. `shipping_address.country_code`
6. `shipping_address.postal_code`

**Billing Address (6 fields):**
7. `billing_address.first_name`
8. `billing_address.last_name`
9. `billing_address.address_1`
10. `billing_address.city`
11. `billing_address.country_code`
12. `billing_address.postal_code`

**Other (1 field):**
13. `email` (likely also nullable in Medusa v2)

## Recommended Fix

Update the AddressSchema to allow `null` values:

```typescript
export const AddressSchema = z.object({
  first_name: z.string().nullable(),
  last_name: z.string().nullable(),
  address_1: z.string().nullable(),
  address_2: z.string().nullable(),
  city: z.string().nullable(),
  country_code: z.string().nullable(),
  province: z.string().nullable(),
  postal_code: z.string().nullable(),
  phone: z.string().nullable(),
  company: z.string().nullable(),
  metadata: z.record(z.string(), z.any()).optional(),
}).passthrough();
```

Also update cart email field:
```typescript
email: z.string().email().nullable().optional(),
```

## Documentation References

1. **Medusa v2 Address Model**: `/Users/Karim/med-usa-4wd/docs/medusa-llm/medusa-llms-full.txt` (line 29466)
2. **Cart Schema Definition**: `/Users/Karim/med-usa-4wd/storefront/lib/validation/medusa-schemas.ts` (lines 26-38)
3. **Cart Service**: `/Users/Karim/med-usa-4wd/storefront/lib/data/cart-service.ts` (lines 348-407)

## Impact

**Current Behavior:**
- Validation fails silently (graceful degradation is enabled)
- Raw data is used, bypassing validation
- Console warnings appear in development

**After Fix:**
- Validation will pass for new/empty carts
- Type safety maintained throughout application
- Proper null handling for unset address fields

## Next Steps

Pass findings to the Coordination Agent to orchestrate the fix implementation.
