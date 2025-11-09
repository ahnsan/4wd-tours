# Resource Booking System - Quick Start Guide

## Database Migration

### Run Migration
```bash
npx medusa db:migrate
```

Expected output:
```
MODULE: resource_booking
  ● Migrating Migration20251108021100
  ✔ Migrated Migration20251108021100
Completed successfully
```

### Verify Schema
```bash
npx ts-node scripts/verify-schema-direct.ts
```

### Rollback Migration (if needed)
```bash
npx medusa db:rollback
```

---

## Seed Resources

### Seed Initial Resources (Recommended)
```bash
npx ts-node scripts/seed-resources-direct.ts
```

This will create:
- 3 vehicles (4WD Cruisers)
- 90 days of capacity for each vehicle

**Note:** Use `seed-resources-direct.ts` until Backend Agent implements services.
After services are ready, use: `npx medusa exec ./scripts/seed-resources.ts`

---

## Database Schema Overview

### Tables Created
1. **resource** - Bookable resources (vehicles, tours, guides)
2. **resource_capacity** - Daily capacity tracking
3. **resource_blackout** - Unavailability periods
4. **resource_hold** - Temporary reservations (30-min TTL)
5. **resource_allocation** - Confirmed bookings

### Key Features
- 12 optimized indexes for fast queries
- 4 automatic triggers for timestamp updates
- 44 constraints for data integrity
- Foreign key cascading for referential integrity
- Idempotent hold creation
- Partial indexes for active holds

---

## Direct Database Access

### Connect to Database
```bash
psql postgres://localhost/medusa-4wd-tours
```

### Useful Queries

#### View All Resources
```sql
SELECT id, type, name, is_active FROM resource;
```

#### Check Capacity for a Date
```sql
SELECT r.name, rc.date, rc.max_capacity, rc.available_capacity
FROM resource_capacity rc
JOIN resource r ON r.id = rc.resource_id
WHERE rc.date = '2025-11-08'
ORDER BY r.name;
```

#### View Active Holds
```sql
SELECT rh.*, r.name as resource_name
FROM resource_hold rh
JOIN resource r ON r.id = rh.resource_id
WHERE rh.status = 'ACTIVE'
AND rh.expires_at > NOW()
ORDER BY rh.created_at DESC;
```

#### View Allocations
```sql
SELECT ra.*, r.name as resource_name
FROM resource_allocation ra
JOIN resource r ON r.id = ra.resource_id
ORDER BY ra.date DESC, ra.created_at DESC
LIMIT 20;
```

#### Check Blackout Periods
```sql
SELECT rb.*, r.name as resource_name
FROM resource_blackout rb
JOIN resource r ON r.id = rb.resource_id
WHERE rb.end_date >= CURRENT_DATE
ORDER BY rb.start_date;
```

---

## Module Integration

### Module Location
`/src/modules/resource_booking/`

### Module Identifier
```typescript
export const RESOURCE_BOOKING_MODULE = "resource_booking"
```

### Resolve Module in Code
```typescript
const resourceBookingService = container.resolve("resource_booking")
```

---

## File Locations

### Migration
- `/src/modules/resource_booking/migrations/Migration20251108021100.ts`

### Scripts
- `/scripts/seed-resources.ts` - Seed initial resources
- `/scripts/verify-schema-direct.ts` - Verify database schema
- `/scripts/verify-resource-booking-schema.ts` - Alternative verification (uses Medusa exec)

### Documentation
- `/docs/DATABASE_AGENT_MIGRATION_REPORT.md` - Complete migration report
- `/docs/resource-booking-quick-start.md` - This file

---

## Troubleshooting

### Migration Fails
1. Check database connection:
   ```bash
   psql $DATABASE_URL -c "SELECT version();"
   ```

2. Check if tables already exist:
   ```bash
   npx ts-node scripts/verify-schema-direct.ts
   ```

3. If needed, rollback and retry:
   ```bash
   npx medusa db:rollback
   npx medusa db:migrate
   ```

### Verification Script Fails
Ensure PostgreSQL is running:
```bash
brew services list | grep postgresql
# or
pg_isready
```

### Seeding Issues
Check if resource_booking module is loaded:
```bash
npx medusa exec ./scripts/verify-resource-booking-schema.ts
```

---

## Next Steps

1. **Backend Agent** will implement:
   - MikroORM models
   - Business logic services
   - Capacity management
   - Hold TTL handling

2. **API Agent** will create:
   - Store API endpoints
   - Admin API endpoints
   - Availability checking

3. **Testing Agent** will add:
   - Unit tests
   - Integration tests
   - E2E tests

---

## Support

For issues or questions, refer to:
- `/docs/DATABASE_AGENT_MIGRATION_REPORT.md` - Detailed technical report
- Medusa documentation: https://docs.medusajs.com
- PostgreSQL documentation: https://www.postgresql.org/docs/
