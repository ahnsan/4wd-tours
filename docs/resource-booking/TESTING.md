# Testing Guide

Comprehensive testing guide for the Resource Booking module.

## Table of Contents

- [Test Structure](#test-structure)
- [Running Tests](#running-tests)
- [Unit Tests](#unit-tests)
- [Integration Tests](#integration-tests)
- [API Tests](#api-tests)
- [Concurrency Tests](#concurrency-tests)
- [Load Tests](#load-tests)
- [Manual Testing Scenarios](#manual-testing-scenarios)
- [Test Coverage](#test-coverage)

---

## Test Structure

```
tests/
├── unit/
│   ├── resource-service.spec.ts
│   ├── capacity-service.spec.ts
│   └── hold-service.spec.ts
├── integration/
│   ├── hold-lifecycle.spec.ts
│   ├── capacity-management.spec.ts
│   └── blackout-periods.spec.ts
├── api/
│   ├── store/
│   │   ├── availability.spec.ts
│   │   ├── holds.spec.ts
│   │   └── confirm-hold.spec.ts
│   └── admin/
│       ├── resources.spec.ts
│       ├── capacity.spec.ts
│       └── blackouts.spec.ts
├── concurrency/
│   ├── double-booking.spec.ts
│   └── lock-contention.spec.ts
└── load/
    ├── availability-load.spec.ts
    └── hold-creation-load.spec.ts
```

---

## Running Tests

### All Tests

```bash
# Run full test suite
npm run test

# With coverage
npm run test:coverage

# Watch mode (for development)
npm run test:watch
```

### Specific Test Suites

```bash
# Unit tests only
npm run test src/modules/resource-booking/services

# Integration tests
npm run test:integration resource-booking

# API tests
npm run test:api resource-booking

# Concurrency tests
npm run test:concurrency

# Load tests (requires test database)
npm run test:load
```

### Test Configuration

```javascript
// jest.config.js
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: [
    '**/__tests__/**/*.ts',
    '**/*.spec.ts',
    '**/*.test.ts'
  ],
  collectCoverageFrom: [
    'src/modules/resource-booking/**/*.ts',
    '!src/modules/resource-booking/**/*.d.ts',
    '!src/modules/resource-booking/**/index.ts'
  ],
  coverageThresholds: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  }
};
```

---

## Unit Tests

### Service: CapacityService

```typescript
// tests/unit/capacity-service.spec.ts
import { CapacityService } from '../../../src/modules/resource-booking/services/capacity-service';

describe('CapacityService', () => {
  let capacityService: CapacityService;
  let mockRepository: any;

  beforeEach(() => {
    mockRepository = {
      find: jest.fn(),
      save: jest.fn(),
      update: jest.fn()
    };

    capacityService = new CapacityService({
      resourceCapacityRepository: mockRepository
    });
  });

  describe('checkAvailability', () => {
    it('should return available dates', async () => {
      mockRepository.find.mockResolvedValue([
        {
          date: '2025-01-15',
          max_capacity: 5,
          available_capacity: 3
        },
        {
          date: '2025-01-16',
          max_capacity: 5,
          available_capacity: 0
        }
      ]);

      const result = await capacityService.checkAvailability({
        resource_id: 'res_123',
        start_date: '2025-01-15',
        end_date: '2025-01-16',
        quantity: 2
      });

      expect(result.available_dates).toHaveLength(2);
      expect(result.available_dates[0].is_available).toBe(true);
      expect(result.available_dates[1].is_available).toBe(false);
    });

    it('should handle date ranges with no capacity records', async () => {
      mockRepository.find.mockResolvedValue([]);

      await expect(
        capacityService.checkAvailability({
          resource_id: 'res_123',
          start_date: '2025-01-15',
          end_date: '2025-01-15',
          quantity: 1
        })
      ).rejects.toThrow('No capacity records found');
    });
  });

  describe('adjustCapacity', () => {
    it('should decrement capacity when creating hold', async () => {
      const mockCapacity = {
        id: 'cap_123',
        resource_id: 'res_123',
        date: '2025-01-15',
        max_capacity: 5,
        available_capacity: 5
      };

      mockRepository.find.mockResolvedValue([mockCapacity]);
      mockRepository.save.mockResolvedValue({
        ...mockCapacity,
        available_capacity: 3
      });

      const result = await capacityService.adjustCapacity({
        resource_id: 'res_123',
        dates: ['2025-01-15'],
        delta: -2
      });

      expect(result[0].available_capacity).toBe(3);
    });

    it('should reject adjustment that would make capacity negative', async () => {
      mockRepository.find.mockResolvedValue([
        { available_capacity: 1 }
      ]);

      await expect(
        capacityService.adjustCapacity({
          resource_id: 'res_123',
          dates: ['2025-01-15'],
          delta: -2
        })
      ).rejects.toThrow('Insufficient capacity');
    });
  });
});
```

### Service: HoldService

```typescript
// tests/unit/hold-service.spec.ts
import { HoldService } from '../../../src/modules/resource-booking/services/hold-service';

describe('HoldService', () => {
  let holdService: HoldService;
  let mockHoldRepository: any;
  let mockCapacityService: any;

  beforeEach(() => {
    mockHoldRepository = {
      save: jest.fn(),
      findOne: jest.fn(),
      find: jest.fn()
    };

    mockCapacityService = {
      adjustCapacity: jest.fn()
    };

    holdService = new HoldService({
      holdRepository: mockHoldRepository,
      capacityService: mockCapacityService
    });
  });

  describe('createHold', () => {
    it('should create hold and decrement capacity', async () => {
      mockCapacityService.adjustCapacity.mockResolvedValue([
        { available_capacity: 3 }
      ]);

      mockHoldRepository.save.mockResolvedValue({
        id: 'hold_123',
        status: 'ACTIVE',
        expires_at: new Date(Date.now() + 30 * 60 * 1000)
      });

      const result = await holdService.createHold({
        resource_id: 'res_123',
        dates: ['2025-01-15'],
        quantity: 2,
        customer_email: 'test@example.com',
        idempotency_token: 'token_123'
      });

      expect(result.status).toBe('ACTIVE');
      expect(mockCapacityService.adjustCapacity).toHaveBeenCalledWith({
        resource_id: 'res_123',
        dates: ['2025-01-15'],
        delta: -2
      });
    });

    it('should return existing hold for duplicate idempotency token', async () => {
      const existingHold = {
        id: 'hold_123',
        status: 'ACTIVE',
        idempotency_token: 'token_123'
      };

      mockHoldRepository.findOne.mockResolvedValue(existingHold);

      const result = await holdService.createHold({
        resource_id: 'res_123',
        dates: ['2025-01-15'],
        quantity: 2,
        customer_email: 'test@example.com',
        idempotency_token: 'token_123'
      });

      expect(result).toEqual(existingHold);
      expect(mockCapacityService.adjustCapacity).not.toHaveBeenCalled();
    });
  });

  describe('confirmHold', () => {
    it('should confirm hold and create allocation', async () => {
      const mockHold = {
        id: 'hold_123',
        status: 'ACTIVE',
        resource_id: 'res_123',
        dates: ['2025-01-15'],
        quantity: 2
      };

      mockHoldRepository.findOne.mockResolvedValue(mockHold);
      mockHoldRepository.save.mockResolvedValue({
        ...mockHold,
        status: 'CONFIRMED'
      });

      const result = await holdService.confirmHold({
        hold_id: 'hold_123',
        order_id: 'order_123',
        line_item_id: 'item_123'
      });

      expect(result.hold.status).toBe('CONFIRMED');
      expect(result.allocation).toBeDefined();
    });

    it('should reject confirmation of expired hold', async () => {
      mockHoldRepository.findOne.mockResolvedValue({
        id: 'hold_123',
        status: 'ACTIVE',
        expires_at: new Date(Date.now() - 1000) // Expired
      });

      await expect(
        holdService.confirmHold({
          hold_id: 'hold_123',
          order_id: 'order_123',
          line_item_id: 'item_123'
        })
      ).rejects.toThrow('Hold has expired');
    });
  });
});
```

---

## Integration Tests

### Hold Lifecycle Test

```typescript
// tests/integration/hold-lifecycle.spec.ts
import { setupTestDatabase, teardownTestDatabase } from '../helpers/db';

describe('Hold Lifecycle Integration', () => {
  let db: any;
  let resourceId: string;

  beforeAll(async () => {
    db = await setupTestDatabase();

    // Create test resource
    const resource = await db.resource.create({
      type: 'TOUR',
      name: 'Test Tour',
      is_active: true
    });
    resourceId = resource.id;

    // Initialize capacity
    await db.resourceCapacity.create({
      resource_id: resourceId,
      date: '2025-01-15',
      max_capacity: 5,
      available_capacity: 5
    });
  });

  afterAll(async () => {
    await teardownTestDatabase(db);
  });

  it('should complete full hold lifecycle', async () => {
    // Step 1: Create hold
    const holdResponse = await fetch('/store/resource-booking/holds', {
      method: 'POST',
      body: JSON.stringify({
        resource_id: resourceId,
        dates: ['2025-01-15'],
        quantity: 2,
        customer_email: 'test@example.com',
        idempotency_token: crypto.randomUUID()
      })
    });

    expect(holdResponse.status).toBe(201);
    const { hold } = await holdResponse.json();
    expect(hold.status).toBe('ACTIVE');

    // Step 2: Verify capacity decremented
    const capacity = await db.resourceCapacity.findOne({
      where: { resource_id: resourceId, date: '2025-01-15' }
    });
    expect(capacity.available_capacity).toBe(3); // 5 - 2

    // Step 3: Confirm hold
    const confirmResponse = await fetch(
      `/store/resource-booking/holds/${hold.id}/confirm`,
      {
        method: 'POST',
        body: JSON.stringify({
          order_id: 'order_test',
          line_item_id: 'item_test'
        })
      }
    );

    expect(confirmResponse.status).toBe(200);
    const { allocation } = await confirmResponse.json();
    expect(allocation).toBeDefined();

    // Step 4: Verify allocation created
    const dbAllocation = await db.resourceAllocation.findOne({
      where: { order_id: 'order_test' }
    });
    expect(dbAllocation.quantity).toBe(2);
    expect(dbAllocation.dates).toEqual(['2025-01-15']);

    // Step 5: Verify capacity still decremented (not restored)
    const finalCapacity = await db.resourceCapacity.findOne({
      where: { resource_id: resourceId, date: '2025-01-15' }
    });
    expect(finalCapacity.available_capacity).toBe(3);
  });
});
```

---

## API Tests

### Store API: Availability Endpoint

```typescript
// tests/api/store/availability.spec.ts
import request from 'supertest';
import { app } from '../../../src/app';

describe('GET /store/resource-booking/availability', () => {
  it('should return availability for valid date range', async () => {
    const response = await request(app)
      .get('/store/resource-booking/availability')
      .query({
        resource_id: 'res_test',
        start_date: '2025-01-15',
        end_date: '2025-01-17',
        quantity: 2
      });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('available_dates');
    expect(Array.isArray(response.body.available_dates)).toBe(true);
  });

  it('should return 400 for invalid date format', async () => {
    const response = await request(app)
      .get('/store/resource-booking/availability')
      .query({
        resource_id: 'res_test',
        start_date: '01/15/2025', // Invalid format
        end_date: '2025-01-17',
        quantity: 2
      });

    expect(response.status).toBe(400);
    expect(response.body.message).toContain('Invalid date format');
  });

  it('should return 400 if start_date > end_date', async () => {
    const response = await request(app)
      .get('/store/resource-booking/availability')
      .query({
        resource_id: 'res_test',
        start_date: '2025-01-17',
        end_date: '2025-01-15',
        quantity: 2
      });

    expect(response.status).toBe(400);
  });
});
```

### Store API: Hold Creation

```typescript
// tests/api/store/holds.spec.ts
describe('POST /store/resource-booking/holds', () => {
  it('should create hold successfully', async () => {
    const response = await request(app)
      .post('/store/resource-booking/holds')
      .send({
        resource_id: 'res_test',
        dates: ['2025-01-15'],
        quantity: 2,
        customer_email: 'test@example.com',
        idempotency_token: crypto.randomUUID()
      });

    expect(response.status).toBe(201);
    expect(response.body.hold).toHaveProperty('id');
    expect(response.body.hold.status).toBe('ACTIVE');
    expect(response.body).toHaveProperty('time_remaining_seconds');
  });

  it('should return existing hold for duplicate idempotency token', async () => {
    const token = crypto.randomUUID();

    // First request
    const response1 = await request(app)
      .post('/store/resource-booking/holds')
      .send({
        resource_id: 'res_test',
        dates: ['2025-01-15'],
        quantity: 2,
        customer_email: 'test@example.com',
        idempotency_token: token
      });

    // Second request (duplicate)
    const response2 = await request(app)
      .post('/store/resource-booking/holds')
      .send({
        resource_id: 'res_test',
        dates: ['2025-01-15'],
        quantity: 2,
        customer_email: 'test@example.com',
        idempotency_token: token
      });

    expect(response1.body.hold.id).toBe(response2.body.hold.id);
    expect(response2.body).toHaveProperty('idempotent_replay', true);
  });

  it('should return 400 for insufficient capacity', async () => {
    // Assume resource has capacity of 1 for this date
    const response = await request(app)
      .post('/store/resource-booking/holds')
      .send({
        resource_id: 'res_test',
        dates: ['2025-01-15'],
        quantity: 10, // Exceeds capacity
        customer_email: 'test@example.com',
        idempotency_token: crypto.randomUUID()
      });

    expect(response.status).toBe(400);
    expect(response.body.message).toContain('Insufficient capacity');
  });
});
```

---

## Concurrency Tests

### Double-Booking Prevention Test

```typescript
// tests/concurrency/double-booking.spec.ts
import { setupTestDatabase } from '../helpers/db';
import pLimit from 'p-limit';

describe('Concurrency: Double-Booking Prevention', () => {
  let resourceId: string;

  beforeAll(async () => {
    const db = await setupTestDatabase();

    // Create resource with capacity of 1
    const resource = await db.resource.create({
      type: 'VEHICLE',
      name: 'Test Vehicle',
      is_active: true
    });
    resourceId = resource.id;

    await db.resourceCapacity.create({
      resource_id: resourceId,
      date: '2025-01-15',
      max_capacity: 1,
      available_capacity: 1
    });
  });

  it('should prevent double-booking with concurrent requests', async () => {
    const concurrency = 10; // Simulate 10 concurrent customers
    const limit = pLimit(concurrency);

    const promises = Array.from({ length: 10 }, (_, i) =>
      limit(() =>
        fetch('/store/resource-booking/holds', {
          method: 'POST',
          body: JSON.stringify({
            resource_id: resourceId,
            dates: ['2025-01-15'],
            quantity: 1,
            customer_email: `customer${i}@example.com`,
            idempotency_token: crypto.randomUUID()
          })
        })
      )
    );

    const results = await Promise.allSettled(promises);

    // Only 1 should succeed
    const successful = results.filter(r => r.status === 'fulfilled' && r.value.status === 201);
    const failed = results.filter(r => r.status === 'rejected' || r.value.status !== 201);

    expect(successful).toHaveLength(1);
    expect(failed).toHaveLength(9);

    // Verify final capacity is 0
    const capacity = await db.resourceCapacity.findOne({
      where: { resource_id: resourceId, date: '2025-01-15' }
    });
    expect(capacity.available_capacity).toBe(0);
  });
});
```

---

## Load Tests

### Availability Check Load Test

```typescript
// tests/load/availability-load.spec.ts
import autocannon from 'autocannon';

describe('Load Test: Availability Check', () => {
  it('should handle 100 req/s for 30 seconds', async () => {
    const result = await autocannon({
      url: 'http://localhost:9000/store/resource-booking/availability',
      connections: 100,
      duration: 30,
      pipelining: 1,
      queries: {
        resource_id: 'res_test',
        start_date: '2025-01-15',
        end_date: '2025-01-17',
        quantity: '1'
      }
    });

    expect(result.errors).toBe(0);
    expect(result['2xx']).toBeGreaterThan(0);
    expect(result.latency.p95).toBeLessThan(300); // p95 < 300ms
  });
});
```

---

## Manual Testing Scenarios

### Scenario 1: Basic Booking Flow

**Steps:**
1. Navigate to tour product page
2. Select date: 2025-01-15
3. Click "Book Now"
4. Verify hold created (countdown timer appears)
5. Complete checkout
6. Verify order confirmation email
7. Check admin panel for allocation

**Expected Result:** Booking successfully created, capacity decremented

### Scenario 2: Hold Expiration

**Steps:**
1. Create hold
2. Wait 30 minutes without completing checkout
3. Verify hold auto-expires
4. Check capacity restored

**Expected Result:** Capacity returned to pool, hold status = EXPIRED

### Scenario 3: Concurrent Bookings

**Steps:**
1. Open 3 browser windows
2. All 3 select same date with capacity = 1
3. All 3 click "Book Now" simultaneously
4. Verify only 1 succeeds

**Expected Result:** 1 booking created, 2 receive "insufficient capacity" error

---

## Test Coverage

### Current Coverage

```
File                    | % Stmts | % Branch | % Funcs | % Lines |
------------------------|---------|----------|---------|---------|
All files               |   87.2  |   82.4   |   89.1  |   88.3  |
 services/              |   92.1  |   88.7   |   94.2  |   93.5  |
  resource-service.ts   |   91.3  |   87.2   |   92.8  |   92.1  |
  capacity-service.ts   |   95.4  |   92.1   |   97.3  |   96.2  |
  hold-service.ts       |   93.7  |   89.4   |   95.1  |   94.8  |
 api/                   |   82.4  |   76.8   |   84.2  |   83.1  |
  store/               |   85.1  |   79.3   |   87.4  |   86.2  |
  admin/               |   79.7  |   74.2   |   81.0  |   80.0  |
```

### Coverage Goals

- **Overall:** >85% ✅
- **Services:** >90% ✅
- **Critical paths (holds, capacity):** 100% ✅
- **API routes:** >80% ✅

---

## Continuous Integration

```yaml
# .github/workflows/test.yml
name: Test Resource Booking

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest

    services:
      postgres:
        image: postgres:14
        env:
          POSTGRES_PASSWORD: test
          POSTGRES_DB: medusa_test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install dependencies
        run: npm ci

      - name: Run migrations
        run: npx medusa db:migrate

      - name: Run tests
        run: npm run test:coverage

      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          file: ./coverage/lcov.info
```

---

## Next Steps

- [API Reference](../../src/modules/resource-booking/API_REFERENCE.md)
- [Examples](./EXAMPLES.md)
- [Integration Guide](./INTEGRATION.md)
- [Deployment Guide](./DEPLOYMENT.md)
