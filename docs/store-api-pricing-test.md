# Store API Pricing Test Report

**Test Date**: 2025-11-12
**API Base URL**: http://localhost:9000
**Test Product**: Rainbow Beach Tour (`prod_01K9H8KY10KSHDDY4TH6ZQYY99`)
**Test Addon**: Always-on High-Speed Internet (`prod_01K9H8KY6YHAAP1THH4R7EB258`)

---

## Executive Summary

**Status**: RESOLVED - Store API returns prices correctly when `region_id` parameter is provided.

**Key Findings**:
- Store API requires `region_id` parameter to return `calculated_price` object
- Without `region_id`, API returns only raw `prices` array (not useful for frontend)
- With `region_id`, API returns both `calculated_price` and `prices` on variants
- Storefront addons service already uses correct query pattern
- Currency values follow Medusa v2 standards (dollars, not cents)

---

## Test Results

### Test 1: Store API WITHOUT region_id

**Query**:
```bash
curl -s "http://localhost:9000/store/products/prod_01K9H8KY10KSHDDY4TH6ZQYY99?fields=%2Bvariants.%2A%2Cvariants.prices.%2A" \
  -H "x-publishable-api-key: pk_34de56e6f305b46e6d22bb1d2d3304bd9eea498066ca7749bd667318dca31ffc"
```

**Result**: SUCCESS (Limited Data)
- Returns `variants` array with `prices` array
- Does NOT return `calculated_price` object
- Price data structure:
  ```json
  {
    "variants": [{
      "id": "variant_01K9H8KY20KCD0CMGB2VAY5CEZ",
      "prices": [{
        "id": "price_01K9H8KY27AX04VY59VXJVXVE8",
        "currency_code": "aud",
        "amount": 2000,
        "raw_amount": {
          "value": "2000",
          "precision": 20
        }
      }]
    }]
  }
  ```

**Issue**: Frontend cannot use this data without region context. The `prices` array contains raw price records without regional calculations.

---

### Test 2: Store API WITH region_id (Australia)

**Query**:
```bash
curl -s "http://localhost:9000/store/products/prod_01K9H8KY10KSHDDY4TH6ZQYY99?fields=%2Bvariants.%2A%2Cvariants.prices.%2A&region_id=reg_01K9G4HA190556136E7RJQ4411" \
  -H "x-publishable-api-key: pk_34de56e6f305b46e6d22bb1d2d3304bd9eea498066ca7749bd667318dca31ffc"
```

**Result**: SUCCESS (Complete Data)
- Returns `variants` array with BOTH `prices` and `calculated_price`
- `calculated_price` object contains region-specific pricing
- Price data structure:
  ```json
  {
    "variants": [{
      "id": "variant_01K9H8KY20KCD0CMGB2VAY5CEZ",
      "calculated_price": {
        "id": "pset_01K9H8KY27NSMS6CV7915GMYN5",
        "is_calculated_price_price_list": false,
        "is_calculated_price_tax_inclusive": true,
        "calculated_amount": 2000,
        "raw_calculated_amount": {
          "value": "2000",
          "precision": 20
        },
        "is_original_price_price_list": false,
        "is_original_price_tax_inclusive": true,
        "original_amount": 2000,
        "raw_original_amount": {
          "value": "2000",
          "precision": 20
        },
        "currency_code": "aud",
        "calculated_price": {
          "id": "price_01K9H8KY27AX04VY59VXJVXVE8",
          "price_list_id": null,
          "price_list_type": null,
          "min_quantity": null,
          "max_quantity": null
        },
        "original_price": {
          "id": "price_01K9H8KY27AX04VY59VXJVXVE8",
          "price_list_id": null,
          "price_list_type": null,
          "min_quantity": null,
          "max_quantity": null
        }
      },
      "prices": [{
        "id": "price_01K9H8KY27AX04VY59VXJVXVE8",
        "currency_code": "aud",
        "amount": 2000,
        "raw_amount": {
          "value": "2000",
          "precision": 20
        }
      }]
    }]
  }
  ```

**Success**: Frontend can now access `calculated_amount` (2000 AUD = $2000.00)

---

### Test 3: Store API WITH currency_code (Invalid Parameter)

**Query**:
```bash
curl -s "http://localhost:9000/store/products/prod_01K9H8KY10KSHDDY4TH6ZQYY99?fields=%2Bvariants.%2A%2Cvariants.prices.%2A&currency_code=aud" \
  -H "x-publishable-api-key: pk_34de56e6f305b46e6d22bb1d2d3304bd9eea498066ca7749bd667318dca31ffc"
```

**Result**: ERROR
```json
{
  "type": "invalid_data",
  "message": "Invalid request: Unrecognized fields: 'currency_code'"
}
```

**Conclusion**: `currency_code` is NOT a valid parameter. Use `region_id` instead.

---

### Test 4: Addon Product Pricing (High-Speed Internet)

**Query**:
```bash
curl -s "http://localhost:9000/store/products/prod_01K9H8KY6YHAAP1THH4R7EB258?region_id=reg_01K9G4HA190556136E7RJQ4411&fields=%2Bvariants.%2A%2Cvariants.prices.%2A%2C%2Bmetadata" \
  -H "x-publishable-api-key: pk_34de56e6f305b46e6d22bb1d2d3304bd9eea498066ca7749bd667318dca31ffc"
```

**Result**: SUCCESS
- Addon product returns same pricing structure as tours
- `calculated_amount`: 30 (AUD = $30.00)
- Metadata properly includes `addon: true` and `unit: "per_day"`
- Frontend can correctly identify pricing type

**Sample Response**:
```json
{
  "product": {
    "id": "prod_01K9H8KY6YHAAP1THH4R7EB258",
    "title": "Always-on High-Speed Internet",
    "handle": "addon-internet",
    "metadata": {
      "addon": true,
      "unit": "per_day",
      "category": "Connectivity"
    },
    "variants": [{
      "calculated_price": {
        "calculated_amount": 30,
        "currency_code": "aud"
      }
    }]
  }
}
```

---

### Test 5: Products List Endpoint (Bulk Query)

**Query**:
```bash
curl -s "http://localhost:9000/store/products?region_id=reg_01K9G4HA190556136E7RJQ4411&fields=*images,*variants,+metadata" \
  -H "x-publishable-api-key: pk_34de56e6f305b46e6d22bb1d2d3304bd9eea498066ca7749bd667318dca31ffc"
```

**Result**: SUCCESS
- Returns 24 products total
- 19 addon products identified (with `metadata.addon: true`)
- All variants include `calculated_price` object
- Pricing structure consistent across all products

---

## Available Regions

**Query**:
```bash
curl -s "http://localhost:9000/store/regions" \
  -H "x-publishable-api-key: pk_34de56e6f305b46e6d22bb1d2d3304bd9eea498066ca7749bd667318dca31ffc"
```

**Available Regions**:
1. **Australia** (`reg_01K9G4HA190556136E7RJQ4411`)
   - Currency: AUD
   - Country: Australia

2. **Europe** (`reg_01K9H2CNE9KCFS102CVK279DRQ`)
   - Currency: EUR
   - Countries: Denmark, France, Germany, Italy, Spain, Sweden, United Kingdom

---

## Storefront Integration Analysis

### Current Implementation: `/storefront/lib/data/addons-service.ts`

**Query Pattern** (Lines 199-203):
```typescript
const response = await fetchWithTimeout(
  `${API_BASE_URL}/store/products?region_id=${dynamicRegionId}&fields=*images,*variants,+metadata`,
  { headers, cache: 'no-store' },
  API_TIMEOUT
);
```

**Status**: CORRECT - Already using `region_id` parameter

### Price Extraction Logic (Lines 119-142)

**Current Implementation**:
```typescript
// Validate pricing information exists
if (!variant.calculated_price || typeof variant.calculated_price.calculated_amount === 'undefined') {
  console.error(`[Add-ons Service] FATAL: No calculated price found for variant ${variant_id}`);
  throw new Error(`Add-on ${product.handle} has no calculated price`);
}

// Validate price is a valid number
const calculatedAmount = variant.calculated_price.calculated_amount;
if (typeof calculatedAmount !== 'number' || isNaN(calculatedAmount) || calculatedAmount < 0) {
  console.error(`[Add-ons Service] FATAL: Invalid price value`);
  throw new Error(`Add-on ${product.handle} has invalid price`);
}

// Medusa v2 returns prices in DOLLARS (API auto-divides by 100)
// Frontend needs CENTS for precision
// Conversion: 30 dollars × 100 = 3000 cents
price_cents = Math.round(calculatedAmount * 100);
```

**Status**: CORRECT
- Properly validates `calculated_price` exists
- Correctly extracts `calculated_amount` from API response
- Properly converts dollars to cents for frontend precision
- Follows Medusa v2 pricing standards

---

## Price Format Comparison

### What API Returns (Medusa v2 Format)

**Format**: Dollars (major currency units)
```json
{
  "calculated_price": {
    "calculated_amount": 2000,    // $2000.00 AUD
    "currency_code": "aud"
  }
}
```

**Addon Example**:
```json
{
  "calculated_price": {
    "calculated_amount": 30,      // $30.00 AUD
    "currency_code": "aud"
  }
}
```

### What Storefront Expects (Frontend Format)

**Format**: Cents (for precision)
```typescript
interface Addon {
  price_cents: number;  // 200000 cents = $2000.00
}
```

**Conversion Formula**:
```typescript
// API returns dollars, frontend needs cents
price_cents = calculatedAmount * 100;

// Examples:
// 2000 dollars × 100 = 200000 cents (displayed as $2000.00)
// 30 dollars × 100 = 3000 cents (displayed as $30.00)
```

**Display Conversion** (`/storefront/lib/utils/pricing.ts`):
```typescript
export function formatPrice(cents: number): string {
  const dollars = cents / 100;
  return `$${dollars.toFixed(2)}`;
}
```

---

## Critical Findings

### Issue Identification

**RESOLVED**: The Store API pricing is working correctly. The issue was NOT with the API.

**Root Cause Analysis**:
1. Store API requires `region_id` parameter to calculate prices
2. Without `region_id`, API cannot determine region-specific pricing
3. Storefront service ALREADY uses correct query pattern
4. Price conversion (dollars → cents) is properly implemented

### What Works

1. **API Endpoint**: `/store/products` and `/store/products/:id` both return correct pricing
2. **Query Parameters**: `region_id` parameter correctly triggers price calculation
3. **Field Expansion**: `fields=*images,*variants,+metadata` properly expands all required fields
4. **Price Structure**: `calculated_price.calculated_amount` contains region-specific price
5. **Currency Format**: Medusa v2 returns prices in dollars (e.g., 2000 = $2000.00)
6. **Frontend Conversion**: Service correctly converts dollars to cents (`amount * 100`)
7. **Addon Detection**: Products with `metadata.addon: true` are properly identified
8. **Pricing Types**: Metadata correctly identifies pricing units (`per_day`, `per_booking`, `per_person`)

### What Doesn't Work

1. **currency_code Parameter**: NOT a valid API parameter (use `region_id` instead)
2. **Missing region_id**: API returns incomplete pricing data without region context

---

## Working cURL Commands

### Get Single Product with Pricing
```bash
# Tour product
curl -s "http://localhost:9000/store/products/prod_01K9H8KY10KSHDDY4TH6ZQYY99?region_id=reg_01K9G4HA190556136E7RJQ4411&fields=%2Bvariants.%2A%2Cvariants.prices.%2A" \
  -H "x-publishable-api-key: pk_34de56e6f305b46e6d22bb1d2d3304bd9eea498066ca7749bd667318dca31ffc"

# Addon product
curl -s "http://localhost:9000/store/products/prod_01K9H8KY6YHAAP1THH4R7EB258?region_id=reg_01K9G4HA190556136E7RJQ4411&fields=%2Bvariants.%2A%2Cvariants.prices.%2A%2C%2Bmetadata" \
  -H "x-publishable-api-key: pk_34de56e6f305b46e6d22bb1d2d3304bd9eea498066ca7749bd667318dca31ffc"
```

### Get All Products with Pricing (Storefront Pattern)
```bash
curl -s "http://localhost:9000/store/products?region_id=reg_01K9G4HA190556136E7RJQ4411&fields=*images,*variants,+metadata" \
  -H "x-publishable-api-key: pk_34de56e6f305b46e6d22bb1d2d3304bd9eea498066ca7749bd667318dca31ffc" \
  -H "Content-Type: application/json"
```

### Get Available Regions
```bash
curl -s "http://localhost:9000/store/regions" \
  -H "x-publishable-api-key: pk_34de56e6f305b46e6d22bb1d2d3304bd9eea498066ca7749bd667318dca31ffc"
```

---

## Required Query Parameters Explained

### region_id (REQUIRED for pricing)

**Purpose**: Tells Medusa which region's pricing to calculate
**Effect**: Enables `calculated_price` object on variants
**Format**: `region_id=reg_01K9G4HA190556136E7RJQ4411` (Australia)

**Why Required**:
- Medusa supports multi-region pricing
- Different regions may have different prices, taxes, currencies
- API needs region context to calculate final price with tax

**Without region_id**:
```json
{
  "variants": [{
    "prices": [...]  // Raw price records (not useful)
  }]
}
```

**With region_id**:
```json
{
  "variants": [{
    "calculated_price": {
      "calculated_amount": 2000,
      "currency_code": "aud",
      "is_calculated_price_tax_inclusive": true
    },
    "prices": [...]  // Also includes raw prices
  }]
}
```

### fields (Required for variant/pricing data)

**Purpose**: Expand related entities (variants, prices, metadata)
**Format**: `fields=%2Bvariants.%2A%2Cvariants.prices.%2A%2C%2Bmetadata`
**Decoded**: `fields=+variants.*,variants.prices.*,+metadata`

**Field Syntax**:
- `+variants.*` - Include ALL variant fields
- `variants.prices.*` - Include ALL price fields on variants
- `+metadata` - Include product metadata

**Alternative Shorter Syntax**:
- `fields=*images,*variants,+metadata` (used by storefront)
- Automatically includes variant prices when expanding variants

### x-publishable-api-key (REQUIRED)

**Purpose**: Authenticate Store API requests
**Format**: Header `x-publishable-api-key: pk_34de...`
**Value**: `pk_34de56e6f305b46e6d22bb1d2d3304bd9eea498066ca7749bd667318dca31ffc`

**Security Note**: Publishable key is safe to expose in frontend code

---

## Medusa v2 Pricing Standards

### Database Storage Format

**Format**: Dollars (major currency units)
```sql
-- Example: $2000.00 stored as 2000
-- Example: $30.00 stored as 30
```

**Historical Note**: Medusa v1 stored cents, v2 stores dollars

### API Response Format

**Format**: Dollars (same as database)
```json
{
  "calculated_amount": 2000,  // $2000.00 AUD
  "raw_calculated_amount": {
    "value": "2000",
    "precision": 20
  }
}
```

### Frontend Internal Format

**Format**: Cents (for precision in JavaScript)
```typescript
// Why cents?
// - Avoid floating-point arithmetic errors
// - Precise calculations (2000 cents vs 20.00 dollars)
// - Industry standard for money in programming

const price_cents = 200000;  // $2000.00
const addon_cents = 3000;    // $30.00
```

### Display Format

**Format**: Dollars with 2 decimals
```typescript
formatPrice(200000)  // "$2000.00"
formatPrice(3000)    // "$30.00"
```

---

## Recommendations

### For Storefront Development

1. **CONTINUE** using current query pattern in `addons-service.ts` - it's correct
2. **ENSURE** `region_id` is always provided from cart context
3. **VALIDATE** region is set before fetching products/addons
4. **FALLBACK** to environment variable `NEXT_PUBLIC_DEFAULT_REGION_ID` if cart has no region

### For API Testing

1. **ALWAYS** include `region_id` parameter when testing pricing
2. **USE** `/store/regions` endpoint to get valid region IDs
3. **EXPAND** variants and prices using `fields` parameter
4. **AVOID** using `currency_code` parameter (not supported)

### For Price Handling

1. **API LAYER**: Prices are in dollars (Medusa v2 standard)
2. **ADAPTER LAYER**: Convert dollars to cents (`amount * 100`)
3. **INTERNAL STATE**: Store prices in cents (precision)
4. **DISPLAY LAYER**: Convert cents to dollars (`amount / 100`)
5. **NEVER** send prices to Medusa API (server calculates automatically)

### For Error Handling

1. **VALIDATE** `region_id` is provided before API calls
2. **CHECK** `calculated_price` exists in response
3. **VALIDATE** `calculated_amount` is a valid number
4. **FAIL FAST** if pricing data is missing (don't use fallbacks)
5. **LOG** detailed errors for debugging

---

## Documentation References

### Official Medusa v2 Pricing Documentation

**Primary**: `/docs/medusa-llm/medusa-llms-full.txt` (local documentation)
**Online**: https://docs.medusajs.com/resources/commerce-modules/product/price
**Concise**: https://docs.medusajs.com/llms.txt

### Project-Specific Documentation

1. **Migration Guide**: `/docs/MEDUSA-V2-PRICING-MIGRATION.md`
   - Complete history of pricing format changes
   - Migration from cents to dollars
   - Before/after examples

2. **Developer Guide**: `/docs/DEVELOPER-PRICING-GUIDE.md`
   - How to work with prices in development
   - Best practices for price handling
   - Common mistakes to avoid

3. **Utility Files**:
   - `/storefront/lib/utils/pricing.ts` - Price formatting utilities
   - `/storefront/lib/utils/addon-adapter.ts` - Dollar to cent conversion
   - `/storefront/components/Tours/PriceDisplay.tsx` - Display component

---

## Testing Checklist

- [x] Test Store API without region_id (returns incomplete data)
- [x] Test Store API with region_id (returns calculated_price)
- [x] Test currency_code parameter (not supported)
- [x] Test single product endpoint
- [x] Test products list endpoint
- [x] Verify addon products return pricing
- [x] Verify pricing structure matches storefront expectations
- [x] Verify price conversion (dollars to cents)
- [x] Verify regions endpoint returns available regions
- [x] Review storefront service implementation
- [x] Confirm no issues with API pricing

---

## Conclusion

**The Store API is working correctly.** The pricing system is properly implemented according to Medusa v2 standards:

1. API returns prices in DOLLARS (e.g., 2000 = $2000.00)
2. Frontend converts to CENTS for precision (2000 × 100 = 200000 cents)
3. Display layer shows DOLLARS (200000 ÷ 100 = $2000.00)

**No changes required** to the storefront addons service. The implementation already:
- Uses correct `region_id` parameter
- Properly expands variant and price fields
- Validates `calculated_price` exists
- Converts dollars to cents correctly
- Handles errors appropriately

**Key Requirement**: Ensure `region_id` is ALWAYS provided when fetching products, either from cart context or environment variable.

---

**Test Report Generated**: 2025-11-12
**Tested By**: Claude Code
**Status**: Complete
**API Version**: Medusa v2
**Storefront Version**: Next.js 14
