# Tour Seeding Verification Module

This module provides comprehensive verification and testing for the tour seeding functionality, ensuring idempotency, performance, and data integrity.

## Files Created

### 1. Verification Script
**Location**: `/Users/Karim/med-usa-4wd/scripts/verify-seeds.sh`

Comprehensive bash script that tests:
- Seed idempotency (running twice produces same results)
- Product count verification
- Handle resolution for all products
- Store API endpoint functionality
- Response time performance (p95 < 300ms)
- Data integrity checks

### 2. Integration Test Suite
**Location**: `/Users/Karim/med-usa-4wd/tests/integration/seed-idempotency.spec.ts`

Jest integration tests covering:
- Multiple seed runs without duplicates
- Product and collection count verification
- Handle uniqueness
- Collection integrity
- Variant and price verification
- Metadata preservation
- Performance benchmarks

## Running the Tests

### Prerequisites
1. Ensure Medusa server is running:
```bash
pnpm dev
```

2. Server should be accessible at `http://localhost:9000`

### Running the Verification Script

```bash
# From project root
./scripts/verify-seeds.sh

# Or with custom server URL
STORE_API_URL=http://localhost:9000 ./scripts/verify-seeds.sh
```

The script will:
1. Check if server is running
2. Run seed script twice
3. Verify no duplicates were created
4. Test all product handles
5. Measure API response times
6. Generate a verification report

### Running the Integration Tests

```bash
# Run the specific test suite
pnpm test:integration tests/integration/seed-idempotency.spec.ts

# Or run all integration tests
pnpm test:integration:modules
```

## Test Commands Reference

### Manual Seeding
```bash
# Run seeds once
pnpm ts-node scripts/seed-tours.ts

# Run seeds twice (idempotency test)
pnpm ts-node scripts/seed-tours.ts
pnpm ts-node scripts/seed-tours.ts
```

### Manual API Testing
```bash
# Test products endpoint
curl http://localhost:9000/store/products

# Test product by handle
curl 'http://localhost:9000/store/products?handle=1d-fraser-island'

# Test collection filtering
curl 'http://localhost:9000/store/products?collection_id[]=tours'

# Test add-ons
curl http://localhost:9000/store/add-ons
```

### Performance Testing
```bash
# Measure response time for products endpoint
time curl -s http://localhost:9000/store/products > /dev/null

# Measure response time for specific handle
time curl -s 'http://localhost:9000/store/products?handle=1d-fraser-island' > /dev/null
```

## Verification Metrics

### Performance Targets
- **Response Time p95**: < 300ms
- **Average Response Time**: < 200ms
- **Seeding Duration**: < 30 seconds

### Expected Product Counts
- **Total Products**: 8 (5 tours + 3 add-ons)
- **Tour Products**: 5
- **Add-on Products**: 3
- **Collections**: 2 (tours, add-ons)

### Tour Products
1. `1d-rainbow-beach` - 1 Day Rainbow Beach Tour
2. `1d-fraser-island` - 1 Day Fraser Island Tour
3. `2d-fraser-rainbow` - 2 Day Fraser + Rainbow Combo
4. `3d-fraser-rainbow` - 3 Day Fraser & Rainbow Combo
5. `4d-fraser-rainbow` - 4 Day Fraser & Rainbow Combo

### Add-on Products
1. `addon-internet` - Always-on High-Speed Internet
2. `addon-glamping` - Glamping Setup
3. `addon-bbq` - BBQ on the Beach

## Test Coverage

### Idempotency Tests
- ✓ Running seeds multiple times
- ✓ No duplicate products created
- ✓ No duplicate collections created
- ✓ Product counts remain stable
- ✓ Metadata preservation

### Data Integrity Tests
- ✓ All products resolvable by handle
- ✓ Unique handles across all products
- ✓ Correct product titles
- ✓ Proper variant creation
- ✓ Price configuration
- ✓ Metadata accuracy

### Performance Tests
- ✓ Response time measurements
- ✓ p95 latency targets
- ✓ Bulk operation efficiency
- ✓ Seeding duration benchmarks

### API Functional Tests
- ✓ Products list endpoint
- ✓ Product by handle endpoint
- ✓ Collection filtering
- ✓ HTTP status codes
- ✓ Response structure

## Swarm Coordination

This module integrates with Claude Flow for swarm coordination:

### Hooks Integration
The verification script automatically runs coordination hooks:
- `post-task` - After verification completion
- `notify` - Status updates during verification

### Memory Storage
Verification results are stored at:
```
/Users/Karim/med-usa-4wd/swarm/seeding/verification-complete
```

This file contains:
- Test results summary
- Product counts
- Performance metrics
- Verification status

## Troubleshooting

### Server Not Running
If you see "Server is not running":
```bash
# Start the development server
pnpm dev
```

### Port Conflicts
If server is on different port:
```bash
STORE_API_URL=http://localhost:8000 ./scripts/verify-seeds.sh
```

### Performance Issues
If p95 times exceed 300ms:
1. Check database connections
2. Verify no other load on system
3. Check for N+1 queries
4. Review database indexes

### Test Failures
If integration tests fail:
1. Ensure database is clean or properly migrated
2. Check test environment variables
3. Verify Medusa container initialization
4. Review test logs for specific errors

## Database Queries

To manually inspect the database:

```sql
-- Count products
SELECT COUNT(*) FROM product;

-- List all products with handles
SELECT id, handle, title FROM product;

-- Check for duplicate handles
SELECT handle, COUNT(*)
FROM product
GROUP BY handle
HAVING COUNT(*) > 1;

-- Verify collections
SELECT id, handle, title FROM product_collection;
```

## Memory Usage

Monitor memory during seeding:

```bash
# Check Node.js memory usage
node --max-old-space-size=512 scripts/seed-tours.ts

# Monitor system memory
top -pid $(pgrep -f "medusa")
```

## CI/CD Integration

### GitHub Actions Example
```yaml
- name: Run seed verification
  run: |
    pnpm dev &
    sleep 10
    ./scripts/verify-seeds.sh

- name: Run integration tests
  run: pnpm test:integration tests/integration/seed-idempotency.spec.ts
```

## Next Steps

After verification passes:
1. ✓ Seeds are idempotent
2. ✓ API endpoints are functional
3. ✓ Performance meets targets
4. Ready for production seeding
5. Can proceed with storefront integration

## Support

For issues or questions:
- Review test logs in `swarm/seeding/verification-complete`
- Check Medusa server logs
- Verify database state
- Consult main project documentation
