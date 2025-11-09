# Quick Start: Seed Verification

## TL;DR - Run Everything

```bash
# 1. Start server
pnpm dev

# 2. Run verification script (in another terminal)
./scripts/verify-seeds.sh

# 3. Run integration tests
pnpm test:integration tests/integration/seed-idempotency.spec.ts
```

---

## What Gets Tested?

### Verification Script (`verify-seeds.sh`)
- ✓ Runs seeds twice
- ✓ Checks for duplicates
- ✓ Tests all API endpoints
- ✓ Measures response times
- ✓ Validates data integrity

### Integration Tests (`seed-idempotency.spec.ts`)
- ✓ Programmatic idempotency tests
- ✓ Deep data validation
- ✓ Edge case handling
- ✓ Performance benchmarks

---

## Expected Results

### Product Counts
- 8 total products
- 5 tours
- 3 add-ons
- 2 collections

### Performance
- p95 response time < 300ms
- Average response < 200ms
- Seeding completes < 30 seconds

### Status
- All products published
- All handles unique
- All prices in AUD
- All metadata correct

---

## Common Commands

```bash
# Manual seed (once)
pnpm ts-node scripts/seed-tours.ts

# Manual seed (twice for idempotency)
pnpm ts-node scripts/seed-tours.ts && pnpm ts-node scripts/seed-tours.ts

# Test single endpoint
curl http://localhost:9000/store/products

# Test product by handle
curl 'http://localhost:9000/store/products?handle=1d-fraser-island'

# Measure response time
time curl -s http://localhost:9000/store/products > /dev/null
```

---

## Success Criteria

✅ All tests pass
✅ No duplicates after second seed
✅ All handles resolve correctly
✅ Response times under 300ms
✅ Verification report generated

---

## Troubleshooting

**Server not running?**
```bash
pnpm dev
```

**Tests failing?**
```bash
# Check logs
tail -f logs/medusa.log

# Check database
psql -d medusa -c "SELECT COUNT(*) FROM product;"
```

**Performance issues?**
```bash
# Check system resources
top

# Check database connections
psql -d medusa -c "SELECT count(*) FROM pg_stat_activity;"
```

---

## Files Created

1. `/Users/Karim/med-usa-4wd/scripts/verify-seeds.sh` - Main verification script
2. `/Users/Karim/med-usa-4wd/tests/integration/seed-idempotency.spec.ts` - Integration tests
3. `/Users/Karim/med-usa-4wd/swarm/seeding/README.md` - Full documentation
4. `/Users/Karim/med-usa-4wd/swarm/seeding/verification-complete` - Results (auto-generated)

---

## Next Steps After Verification

1. ✓ Seeds are idempotent
2. ✓ Ready for production
3. → Integrate with storefront
4. → Setup automated testing
5. → Configure CI/CD pipeline
