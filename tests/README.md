# Tour Seeding Module - Test Suite

Comprehensive test suite for the Tour Seeding Module with 80%+ code coverage.

## Test Structure

### Unit Tests
Location: `/tests/unit/seeding/addon-upsert.spec.ts`

Tests all core functionality of the addon-upsert module:
- Collection upsert (create/update)
- Product upsert (create/update)
- Variant upsert (create/update)
- Price upsert (create/update)
- Complete product flow integration

### API Tests
Location: `/tests/api/store/addons.spec.ts`

Tests the store API endpoint for add-ons:
- Response structure validation
- Performance benchmarks (< 300ms target)
- Empty collection handling
- Metadata filtering (addon=true)
- Data integrity checks

## Running Tests

### Unit Tests
```bash
# Run all unit tests
npm run test:unit

# Run unit tests with coverage
npm run test:unit:coverage

# Run seeding tests specifically with coverage
npm run test:seeding
```

### API Tests
```bash
# Run API integration tests
npm run test:api
```

### All Tests
```bash
# Run all test types
npm run test:integration:http
npm run test:integration:modules
npm run test:unit
npm run test:api
```

## Coverage Report

### Unit Tests: addon-upsert.ts
```
-----------------|---------|----------|---------|---------|-------------------
File             | % Stmts | % Branch | % Funcs | % Lines | Uncovered Line #s
-----------------|---------|----------|---------|---------|-------------------
All files        |     100 |     90.9 |     100 |     100 |
 addon-upsert.ts |     100 |     90.9 |     100 |     100 | 90-91,151
-----------------|---------|----------|---------|---------|-------------------
```

**Coverage Summary:**
- Statement Coverage: 100%
- Branch Coverage: 90.9%
- Function Coverage: 100%
- Line Coverage: 100%

**Result: EXCEEDS 80% TARGET**

### Test Results
```
Test Suites: 1 passed, 1 total
Tests:       22 passed, 22 total
Time:        0.999 s
```

## Test Coverage Details

### upsertCollection (3 tests)
- ✓ Returns existing collection ID when collection exists
- ✓ Creates new collection when it does not exist
- ✓ Throws error when collection creation fails

### upsertProduct (5 tests)
- ✓ Updates existing product and returns its ID
- ✓ Creates new product when it does not exist
- ✓ Creates product without linking to collection if collection_handle not provided
- ✓ Uses default status and metadata when not provided
- ✓ Throws error when product creation fails

### upsertVariant (5 tests)
- ✓ Updates existing variant and returns its ID
- ✓ Creates new variant when none exists
- ✓ Uses default SKU when not provided
- ✓ Handles manage_inventory undefined correctly
- ✓ Throws error when variant creation fails

### upsertPrice (4 tests)
- ✓ Updates existing price when price set and price exist
- ✓ Creates new price set when none exists
- ✓ Creates new price set when price set exists but price does not
- ✓ Throws error when price update fails

### upsertProductComplete (5 tests)
- ✓ Completes full product upsert flow
- ✓ Updates existing product in complete flow
- ✓ Propagates errors from product upsert
- ✓ Propagates errors from variant upsert
- ✓ Propagates errors from price upsert

## API Test Coverage

### GET /store/add-ons Endpoint (12 tests)

**Response Structure (2 tests)**
- Response shape validation
- Product structure with variants and prices

**Performance (2 tests)**
- Response time < 300ms
- Performance indicator in response

**Empty Collection Handling (3 tests)**
- No collection exists
- Collection exists but empty
- Products exist but no addon metadata

**Metadata Filtering (3 tests)**
- Only returns products with addon=true
- Filters multiple products correctly
- Filters unpublished products

**Error Handling (1 test)**
- Graceful error handling

**Data Integrity (1 test)**
- Complete product data with variants and prices

## Test Framework & Tools

- **Testing Framework**: Jest 29.7.0
- **Test Utilities**: @medusajs/test-utils 2.11.3
- **Transformer**: @swc/jest 0.2.36
- **Environment**: Node.js (experimental VM modules)

## Mocking Strategy

### Unit Tests
- Mock MedusaContainer for dependency injection
- Mock Product Module Service (Modules.PRODUCT)
- Mock Pricing Module Service (Modules.PRICING)
- Spy on console.log and console.error for verification

### API Tests
- Use medusaIntegrationTestRunner for full integration
- Real database and services
- Actual HTTP requests via test API client

## Notes

### Known Issues
- API integration tests may timeout on slow database connections
- Tests use experimental VM modules (Node.js flag required)
- Integration tests require proper database setup

### Best Practices
- Run unit tests before committing
- Verify coverage remains above 80%
- Update tests when modifying core functionality
- Keep test data isolated and clean

### Test Isolation
- Each test is independent
- Mocks are reset after each test (afterEach)
- No shared state between tests
- Clean database state for integration tests

## CI/CD Integration

### Recommended Pipeline
```yaml
test:
  - npm run test:unit:coverage
  - npm run test:api
  - npm run test:integration:http
```

### Coverage Threshold
- Minimum: 80% on all metrics
- Current: 100% statements, 90.9% branches, 100% functions, 100% lines

## Future Enhancements

1. Add mutation testing with Stryker
2. Add performance benchmarking tests
3. Add E2E tests with Playwright
4. Add visual regression tests
5. Add load testing for API endpoints
6. Increase branch coverage to 100%

## Maintenance

- Review and update tests quarterly
- Add tests for new features immediately
- Refactor tests when code changes
- Keep test documentation current

## Support

For issues or questions about tests:
1. Check test output for detailed error messages
2. Review test documentation
3. Check Jest documentation: https://jestjs.io
4. Check Medusa test utils: https://docs.medusajs.com
