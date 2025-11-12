# Medusa v2 Pricing Investigation Report

**Date:** 2025-11-12
**Investigator:** Claude Code
**Status:** CRITICAL ISSUE IDENTIFIED - Script using incorrect Medusa v2 pricing methods

---

## Executive Summary

**THE PROBLEM:**
The Admin UI at http://localhost:9000/app shows prices for products, but the pricing check script reports NO prices exist. This creates a critical discrepancy in the system.

**ROOT CAUSE IDENTIFIED:**
The `check-all-pricing.ts` script uses **incorrect methods** to query prices in Medusa v2. It queries the Pricing Module directly and attempts to match prices by substring filtering on `price_set_id`, which **does not work** because:

1. The remote link between `ProductVariant` and `PriceSet` is not exposed through the Pricing Module API
2. Substring matching on `price_set_id` is unreliable and not a valid query pattern
3. The script does not leverage Medusa v2's Query system for cross-module data retrieval

**SOLUTION:**
Use Medusa v2's **Query** system with proper field paths to retrieve prices through the remote link between Product and Pricing modules.

---

## Understanding Medusa v2 Pricing Architecture

### Core Concepts

#### 1. **Price Data Model**
- Represents a specific monetary value
- Properties:
  - `amount`: Price in **major currency units** (dollars, not cents)
  - `currency_code`: Currency (e.g., "aud", "usd")
  - `price_set_id`: Foreign key to the Price Set
  - `min_quantity`, `max_quantity`: Optional tiering
  - `rules`: Optional price rules for conditional pricing

#### 2. **PriceSet Data Model**
- A collection of prices for a resource
- Contains multiple `Price` records for:
  - Different currencies (multi-currency support)
  - Different price rules (regional pricing, customer groups, etc.)
  - Different tiers (quantity-based pricing)

#### 3. **Remote Link: ProductVariant ↔ PriceSet**
- Medusa v2 uses **Module Links** to connect data models across modules
- Each `ProductVariant` is linked to ONE `PriceSet`
- The link is established through Medusa's Link Module, NOT through foreign keys
- **This is the critical piece the old script was missing!**

```
┌─────────────────┐         Remote Link          ┌─────────────────┐
│ ProductVariant  │◄─────────────────────────────►│    PriceSet     │
│ (Product Module)│      (via Link Module)        │ (Pricing Module)│
└─────────────────┘                               └─────────────────┘
                                                           │
                                                           │ Contains
                                                           ▼
                                                   ┌─────────────────┐
                                                   │     Price       │
                                                   │  (amount, curr) │
                                                   └─────────────────┘
```

### How Prices Are Stored

**Database Structure:**
```
price_set (Pricing Module)
  ├─ id: pset_01K9H8KY27NSMS6CV7915GMYN5
  └─ prices[]
      └─ price
          ├─ id: price_01K9H8KY27AX04VY59VXJVXVE8
          ├─ amount: 2000 (AUD $2000.00)
          ├─ currency_code: "aud"
          └─ price_set_id: pset_01K9H8KY27NSMS6CV7915GMYN5

variant (Product Module)
  ├─ id: variant_01K9H8KY20KCD0CMGB2VAY5CEZ
  └─ [Remote Link] → price_set_id: pset_01K9H8KY27NSMS6CV7915GMYN5
```

**Important:** The link is maintained by the Link Module, not as a direct foreign key in the variant table.

### Price Storage Format (v1 vs v2)

| Aspect | Medusa v1 | Medusa v2 |
|--------|-----------|-----------|
| **Price Unit** | Cents (smallest currency unit) | Dollars (major currency unit) |
| **Example: $200** | Stored as `20000` | Stored as `200` |
| **Example: $19.99** | Stored as `1999` | Stored as `19.99` |
| **Why Changed** | Simpler math, avoid float issues | Simpler for developers, supports decimals |

**Critical:** Our database has prices in the **correct Medusa v2 format** (dollars).

---

## Why the Current Script Fails

### Script Analysis: `scripts/check-all-pricing.ts`

**What it does (INCORRECTLY):**

```typescript
// ❌ WRONG APPROACH
const pricingModuleService = container.resolve(Modules.PRICING)

// Get all prices (thousands of records, no context)
const allPrices = await pricingModuleService.listPrices({})

// Try to filter by substring matching on price_set_id
const variantPrices = allPrices.filter((p: any) =>
  p.price_set_id && p.price_set_id.includes(variant.id.substring(0, 10))
)
```

**Why this fails:**

1. **No Remote Link Access**: The Pricing Module API does not expose which variant a price set belongs to
2. **Inefficient**: Loads ALL prices into memory (76 price sets × multiple prices each)
3. **Unreliable Filtering**: Substring matching on IDs is not a valid query pattern
4. **Wrong Abstraction**: Bypasses Medusa's Query system designed for cross-module queries

**Result:** ⚠️ No prices found (even though they exist!)

---

## The Correct Approach: Using Query

### Medusa v2's Query System

**Query** is a tool from the Modules SDK that:
- Retrieves data across multiple modules
- Automatically handles remote links
- Provides a unified interface for cross-module queries
- Is **the official way** to query related data in Medusa v2

### Method 1: Retrieve All Variant Prices

**Use Case:** Get all prices for a variant (all currencies, all rules)

```typescript
// ✅ CORRECT APPROACH
const query = container.resolve(ContainerRegistrationKeys.QUERY)

const { data: products } = await query.graph({
  entity: "product",
  fields: [
    "id",
    "title",
    "variants.*",
    "variants.prices.*",  // ← This traverses the remote link!
  ],
  filters: {
    id: "prod_01K9H8KY10KSHDDY4TH6ZQYY99",
  },
})

// Access prices
const variant = products[0].variants[0]
const prices = variant.prices // Array of Price objects
```

**Output Example:**
```javascript
{
  id: "variant_01K9H8KY20KCD0CMGB2VAY5CEZ",
  title: "Default",
  prices: [
    {
      id: "price_01K9H8KY27AX04VY59VXJVXVE8",
      amount: 2000,
      currency_code: "aud",
      price_set_id: "pset_01K9H8KY27NSMS6CV7915GMYN5"
    }
  ]
}
```

### Method 2: Retrieve Calculated Price (RECOMMENDED)

**Use Case:** Get the best price for a specific context (currency, region, customer group, etc.)

```typescript
// ✅ RECOMMENDED FOR STOREFRONT
const { data: products } = await query.graph({
  entity: "product",
  fields: [
    "id",
    "title",
    "variants.*",
    "variants.calculated_price.*",  // ← Best price for context
  ],
  filters: {
    id: "prod_01K9H8KY10KSHDDY4TH6ZQYY99",
  },
  context: {
    variants: {
      calculated_price: QueryContext({
        currency_code: "aud",
        region_id: "reg_123",  // Optional
        customer_group_id: "cg_456",  // Optional
      }),
    },
  },
})

// Access calculated price
const variant = products[0].variants[0]
const price = variant.calculated_price
```

**Calculated Price Object:**
```javascript
{
  calculated_amount: 2000,        // Best price for context
  original_amount: 2000,          // Original price (before discounts)
  currency_code: "aud",
  is_calculated_price_tax_inclusive: false,
  is_original_price_tax_inclusive: false,
  price_list_id: null,           // null = default price
  min_quantity: null,
  max_quantity: null
}
```

**Note:** In our test, `calculated_price` returned `null`. This suggests either:
1. A missing price for the requested context
2. A potential issue with the remote link setup
3. Need to investigate further why Method 1 works but Method 2 doesn't

---

## Test Results

### Test Script: `scripts/test-pricing-correct.ts`

**Key Findings:**

1. **Method 1 (variants.prices.*): ✅ SUCCESS**
   - Found 1 variant with 1 price
   - Price: AUD 2000 (correct v2 format)
   - Remote link is working!

2. **Method 2 (variants.calculated_price.*): ⚠️ FAILED**
   - NO calculated price returned
   - Needs further investigation
   - Possible causes:
     - Missing price rules
     - Context mismatch
     - Need to check region/currency setup

3. **Method 3 (price_set query): ⚠️ PARTIAL**
   - Found 76 price sets
   - BUT: variant links not populated
   - Shows prices exist but links may need verification

4. **Method 4 (Pricing Module direct): ❌ NOT RECOMMENDED**
   - Can list price sets
   - Cannot access variant relationship
   - Same problem as the failing script

### Admin UI vs. Scripts

**Admin UI Shows Prices:**
- Uses Medusa's official Admin API
- Admin API uses Query internally
- Therefore sees prices correctly

**Old Script Reports No Prices:**
- Uses wrong method (Pricing Module direct)
- Misses the remote link
- False negative: prices exist but can't see them!

---

## Recommendations

### 1. Fix the Check Script

**Replace** `scripts/check-all-pricing.ts` with the correct Query-based approach:

```typescript
import { ExecArgs } from "@medusajs/framework/types"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

export default async function checkAllPricing({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const query = container.resolve(ContainerRegistrationKeys.QUERY)

  logger.info("\n=== Product Pricing Check (CORRECTED) ===\n")

  // Get all products with variants and prices
  const { data: products } = await query.graph({
    entity: "product",
    fields: [
      "id",
      "title",
      "handle",
      "variants.*",
      "variants.prices.*",
    ],
  })

  logger.info(`Found ${products.length} products\n`)

  for (const product of products) {
    logger.info(`Product: ${product.handle}`)
    logger.info(`  Title: ${product.title}`)
    logger.info(`  Variants: ${product.variants?.length || 0}`)

    if (product.variants && product.variants.length > 0) {
      for (const variant of product.variants) {
        logger.info(`    Variant: ${variant.title || 'Default'} (${variant.id})`)

        if (variant.prices && variant.prices.length > 0) {
          variant.prices.forEach((price: any) => {
            logger.info(`      ✅ ${price.currency_code?.toUpperCase()}: ${price.amount}`)
          })
        } else {
          logger.info(`      ⚠️  No prices`)
        }
      }
    }
    logger.info('')
  }

  logger.info("\n=== Check Complete ===\n")
}
```

### 2. Investigate Calculated Price Issue

The `calculated_price` should work but returned `null`. Next steps:

1. **Check Region Setup:**
   ```bash
   pnpm medusa exec ./scripts/check-region-setup.ts
   ```

2. **Verify Price Set Links:**
   ```bash
   pnpm medusa exec ./scripts/verify-price-set-links.ts
   ```

3. **Test with Different Contexts:**
   - Try without region_id
   - Try with just currency_code
   - Try querying variants directly (not through products)

### 3. Storefront Integration

For the storefront, **always use `calculated_price`**:

```typescript
// In storefront API/components
const { data: products } = await query.graph({
  entity: "product",
  fields: [
    "*",
    "variants.*",
    "variants.calculated_price.*",
  ],
  filters: {
    handle: "1d-rainbow-beach",
  },
  context: {
    variants: {
      calculated_price: QueryContext({
        currency_code: cart?.currency_code || "aud",
        region_id: cart?.region_id,
      }),
    },
  },
})
```

Benefits:
- Automatically selects best price
- Handles price lists (sales, VIP pricing)
- Respects price rules (regional, customer group)
- Returns tax-inclusive information

### 4. Documentation Updates

**Update these docs:**

1. `/docs/DEVELOPER-PRICING-GUIDE.md`
   - Add section on querying prices
   - Include Query examples
   - Explain remote links

2. `/docs/MEDUSA-V2-PRICING-MIGRATION.md`
   - Add troubleshooting section
   - Document the Query approach

3. Create: `/docs/TROUBLESHOOTING-PRICING.md`
   - Common issues and solutions
   - How to verify pricing setup
   - Query examples for different use cases

---

## Technical Deep Dive: Remote Links

### What Are Remote Links?

In Medusa v2, modules are **isolated** - they don't directly reference each other's data models. Instead, relationships are established through the **Link Module**.

**Traditional Approach (v1):**
```sql
-- Direct foreign key
CREATE TABLE product_variant (
  id VARCHAR PRIMARY KEY,
  price_id VARCHAR REFERENCES price(id)  -- Direct FK
);
```

**Medusa v2 Approach:**
```sql
-- Separate link table maintained by Link Module
CREATE TABLE link_product_variant_price_set (
  variant_id VARCHAR,
  price_set_id VARCHAR,
  PRIMARY KEY (variant_id, price_set_id)
);
```

### Why Use Remote Links?

1. **Module Isolation**: Each module can be developed/tested independently
2. **Flexibility**: Easy to add/remove relationships without schema changes
3. **Extensibility**: Custom modules can link to core modules
4. **Scalability**: Different databases for different modules (future)

### How to Query Remote Links

**The Query syntax:**
```
entity.linked_entity.field
```

**Examples:**

```typescript
// Variant → PriceSet → Prices
"variants.prices.*"

// Variant → PriceSet (calculated)
"variants.calculated_price.*"

// PriceSet → Variant
"price_set.variant.*"

// Variant → Inventory Items
"variants.inventory_items.*"

// Product → Categories
"products.categories.*"
```

**The magic:** Query automatically:
1. Detects the remote link
2. Joins across the Link Module
3. Fetches related data
4. Returns unified result

---

## Database Verification

### Current State (as of test)

**Price Sets in Database:** 76

**Sample Price Set:**
```javascript
{
  id: "pset_01K9H8KY27NSMS6CV7915GMYN5",
  prices: [
    {
      id: "price_01K9H8KY27AX04VY59VXJVXVE8",
      amount: 2000,
      currency_code: "aud"
    }
  ]
}
```

**Variant with Prices:**
```javascript
{
  id: "variant_01K9H8KY20KCD0CMGB2VAY5CEZ",
  title: "Default",
  product: {
    id: "prod_01K9H8KY10KSHDDY4TH6ZQYY99",
    title: "1 Day Rainbow Beach Tour"
  },
  prices: [
    {
      amount: 2000,
      currency_code: "aud"
    }
  ]
}
```

**Conclusion:** Prices ARE stored correctly. The old script just couldn't see them!

---

## Next Steps

### Immediate Actions

1. ✅ **DONE:** Create investigation report (this document)
2. ✅ **DONE:** Create test script with correct methods
3. ⏳ **TODO:** Update `check-all-pricing.ts` to use Query
4. ⏳ **TODO:** Investigate why `calculated_price` returns null
5. ⏳ **TODO:** Create verification script for price set links
6. ⏳ **TODO:** Update developer documentation

### Medium-Term Actions

1. Verify all price set links are created correctly
2. Test calculated price with different contexts
3. Ensure storefront uses calculated_price correctly
4. Add automated tests for pricing queries
5. Create troubleshooting guide

### Long-Term Actions

1. Monitor pricing query performance
2. Consider caching for calculated prices
3. Document custom pricing workflows
4. Training for team on Medusa v2 pricing patterns

---

## Appendix A: Key Files

### Investigation Files
- `/scripts/test-pricing-correct.ts` - Working test script with all methods
- `/scripts/check-all-pricing.ts` - OLD failing script (needs update)
- `/scripts/check-pricing-links.ts` - Attempts to check remote links
- `/scripts/analyze-current-prices.ts` - Price format analysis

### Documentation Files
- `/docs/MEDUSA-V2-PRICING-MIGRATION.md` - Migration history
- `/docs/DEVELOPER-PRICING-GUIDE.md` - Developer guide
- `/docs/pricing-investigation-report.md` - This file
- `/docs/medusa-llm/medusa-llms-full.txt` - Official Medusa v2 docs

### Key Source Code
- Medusa Query: `@medusajs/framework/utils` → `QueryContext`
- Remote Link: Handled by Link Module (transparent to developers)
- Pricing Module: `@medusajs/framework/utils` → `Modules.PRICING`

---

## Appendix B: Reference Links

### Medusa v2 Documentation
- [Pricing Module Concepts](https://docs.medusajs.com/resources/commerce-modules/pricing/concepts/)
- [Price Calculation](https://docs.medusajs.com/resources/commerce-modules/pricing/price-calculation/)
- [Query Documentation](https://docs.medusajs.com/docs/learn/fundamentals/module-links/query/)
- [Module Links](https://docs.medusajs.com/docs/learn/fundamentals/module-links/)
- [Product Variant Prices Guide](https://docs.medusajs.com/resources/commerce-modules/product/guides/price/)

### Local Documentation
- Location: `/docs/medusa-llm/medusa-llms-full.txt`
- Search keywords: "pricing", "price_set", "calculated_price", "remote link", "query.graph"

---

## Glossary

**Price Set**: A collection of prices for a resource (product variant, shipping option)

**Price**: A single monetary value with currency and optional rules

**Remote Link**: A relationship between data models in different modules, managed by Link Module

**Query**: Medusa SDK tool for retrieving data across modules

**Calculated Price**: The best-matching price for a given context (currency, region, customer group)

**QueryContext**: Function to specify context for calculated prices

**Major Currency Unit**: Dollars/Euros/etc. (not cents) - Medusa v2 storage format

**Module**: Self-contained package providing features for a specific domain (e.g., Product, Pricing, Cart)

---

**Report End**

*For questions or issues, refer to the Medusa v2 documentation or the working test script at `/scripts/test-pricing-correct.ts`*
