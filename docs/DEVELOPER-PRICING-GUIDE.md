# Developer Pricing Guide - Medusa v2

**Last Updated**: 2025-11-10
**Medusa Version**: v2.x

This guide explains how to work with pricing in the Med USA 4WD Tours application.

---

## Quick Reference

### Database (Backend)
```typescript
// Medusa v2 stores prices in DOLLARS
await pricingModuleService.create({
  amount: 30,  // $30.00 (NOT 3000!)
  currency_code: "aud",
})
```

### Store API
```json
{
  "calculated_price": {
    "calculated_amount": 30  // In dollars
  }
}
```

### Frontend (Storefront)
```typescript
// Store in CENTS for precision
const priceInCents = apiPrice * 100  // 30 * 100 = 3000

// Display using formatter
formatPrice(3000)  // "$30.00"
```

---

## Backend: Medusa v2 Pricing

### 🚨 CRITICAL RULE

**Medusa v2 stores prices in DOLLARS** (major currency units), **NOT cents**.

```typescript
// ✅ CORRECT: Use dollars
amount: 30  // Represents $30.00

// ❌ WRONG: Don't use cents
amount: 3000  // This would be $3,000.00!
```

---

## Frontend: Next.js Storefront

### 🚨 CRITICAL RULE

**Frontend stores prices in CENTS** for integer precision, **NOT dollars**.

```typescript
// ✅ CORRECT: Use cents internally
const priceInCents = 3000  // $30.00

// ❌ WRONG: Don't use dollars
const priceInDollars = 30.00  // Floating point = bad for money
```

---

## Common Mistakes

### ❌ Mistake 1: Using cents in Medusa

```typescript
// ❌ WRONG: Using cents in backend
amount: 3000,  // This is $3,000, not $30!

// ✅ CORRECT: Use dollars
amount: 30,  // $30.00
```

### ❌ Mistake 2: Using dollars on frontend

```typescript
// ❌ WRONG: Storing dollars
const price = 30.00  // Floating point arithmetic = bad

// ✅ CORRECT: Store cents
const price = 3000  // Integer cents = precise
```

---

## Migration Notes

If migrating from v1 (cents) to v2 (dollars):

```bash
# 1. Backup
npx medusa exec ./scripts/backup-prices.ts

# 2. Migrate
npx medusa exec ./scripts/migrate-prices-to-v2.ts

# 3. Verify
npx medusa exec ./scripts/verify-migration-success.ts
```

**See full guide**: `/docs/MEDUSA-V2-PRICING-MIGRATION.md`

---

## Further Reading

- [Medusa v2 Pricing Module](https://docs.medusajs.com/resources/commerce-modules/product/price)
- [Migration Report](/docs/MEDUSA-V2-PRICING-MIGRATION.md)
- [CLAUDE.md Pricing Section](/CLAUDE.md#-pricing---mandatory-rules)

---

**Remember**: Backend in dollars, frontend in cents, always convert! 💰
