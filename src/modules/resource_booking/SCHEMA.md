# Database Schema Documentation

Complete database schema for the Resource Booking module.

## Table of Contents

- [Entity Relationship Diagram](#entity-relationship-diagram)
- [Tables](#tables)
  - [resource](#resource)
  - [resource_capacity](#resource_capacity)
  - [resource_hold](#resource_hold)
  - [resource_allocation](#resource_allocation)
  - [resource_blackout](#resource_blackout)
- [Indexes](#indexes)
- [Constraints](#constraints)
- [Triggers](#triggers)
- [Migration Files](#migration-files)

---

## Entity Relationship Diagram

```
┌─────────────────────────────────────┐
│           RESOURCE                  │
├─────────────────────────────────────┤
│ id (PK)               VARCHAR(255)  │
│ type                  VARCHAR(50)   │  ENUM: VEHICLE, TOUR, GUIDE
│ name                  VARCHAR(255)  │
│ description           TEXT          │
│ metadata              JSONB         │
│ is_active             BOOLEAN       │
│ created_at            TIMESTAMP     │
│ updated_at            TIMESTAMP     │
│ deleted_at            TIMESTAMP     │
└─────────────────────────────────────┘
         │
         │ 1:N
         ├────────────────────────────────────────┐
         │                                        │
         │ 1:N                                    │ 1:N
         ▼                                        ▼
┌──────────────────────────┐         ┌──────────────────────────┐
│   RESOURCE_CAPACITY      │         │    RESOURCE_HOLD         │
├──────────────────────────┤         ├──────────────────────────┤
│ id (PK)        UUID      │         │ id (PK)        UUID      │
│ resource_id (FK) VARCHAR │◄────────│ resource_id (FK) VARCHAR │
│ date           DATE      │         │ dates          DATE[]    │
│ max_capacity   INTEGER   │         │ quantity       INTEGER   │
│ available_cap. INTEGER   │         │ customer_email VARCHAR   │
│ created_at     TIMESTAMP │         │ idempotency_.. VARCHAR   │
│ updated_at     TIMESTAMP │         │ status         VARCHAR   │
└──────────────────────────┘         │ expires_at     TIMESTAMP │
                                     │ confirmed_at   TIMESTAMP │
         │                           │ metadata       JSONB     │
         │ 1:N                       │ created_at     TIMESTAMP │
         │                           │ updated_at     TIMESTAMP │
         ▼                           └──────────────────────────┘
┌──────────────────────────┐
│  RESOURCE_ALLOCATION     │                    │
├──────────────────────────┤                    │ 1:N
│ id (PK)        UUID      │                    ▼
│ resource_id (FK) VARCHAR │         ┌──────────────────────────┐
│ order_id       VARCHAR   │         │   RESOURCE_BLACKOUT      │
│ line_item_id   VARCHAR   │         ├──────────────────────────┤
│ dates          DATE[]    │         │ id (PK)        UUID      │
│ quantity       INTEGER   │         │ resource_id (FK) VARCHAR │
│ metadata       JSONB     │         │ start_date     DATE      │
│ created_at     TIMESTAMP │         │ end_date       DATE      │
│ updated_at     TIMESTAMP │         │ reason         TEXT      │
└──────────────────────────┘         │ created_at     TIMESTAMP │
                                     │ updated_at     TIMESTAMP │
                                     └──────────────────────────┘
```

---

## Tables

### resource

Defines bookable resources (vehicles, tours, guides).

**Table:** `resource`

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | VARCHAR(255) | NO | `res_` prefix + ULID | Primary key |
| `type` | VARCHAR(50) | NO | - | Resource type: VEHICLE, TOUR, GUIDE |
| `name` | VARCHAR(255) | NO | - | Display name |
| `description` | TEXT | YES | NULL | Detailed description |
| `metadata` | JSONB | YES | {} | Additional data (e.g., vehicle specs, tour details) |
| `is_active` | BOOLEAN | NO | true | Whether resource is bookable |
| `created_at` | TIMESTAMP | NO | CURRENT_TIMESTAMP | Creation timestamp |
| `updated_at` | TIMESTAMP | NO | CURRENT_TIMESTAMP | Last update timestamp |
| `deleted_at` | TIMESTAMP | YES | NULL | Soft delete timestamp |

**Constraints:**
- PRIMARY KEY: `id`
- CHECK: `type IN ('VEHICLE', 'TOUR', 'GUIDE')`
- UNIQUE: `name` (among non-deleted records)

**Example Row:**

```sql
INSERT INTO resource (id, type, name, description, metadata, is_active)
VALUES (
  'res_01JCEXAMPLE',
  'VEHICLE',
  'Fraser Island 4WD - Vehicle 1',
  'Toyota Land Cruiser 200 Series equipped for Fraser Island tours',
  '{"license_plate": "ABC123", "seats": 7, "year": 2023}'::jsonb,
  true
);
```

---

### resource_capacity

Tracks daily capacity limits for each resource.

**Table:** `resource_capacity`

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | UUID | NO | gen_random_uuid() | Primary key |
| `resource_id` | VARCHAR(255) | NO | - | Foreign key to resource.id |
| `date` | DATE | NO | - | Calendar date (Australia/Brisbane timezone) |
| `max_capacity` | INTEGER | NO | - | Maximum units available for this date |
| `available_capacity` | INTEGER | NO | max_capacity | Remaining units available |
| `created_at` | TIMESTAMP | NO | CURRENT_TIMESTAMP | Creation timestamp |
| `updated_at` | TIMESTAMP | NO | CURRENT_TIMESTAMP | Last update timestamp |

**Constraints:**
- PRIMARY KEY: `id`
- FOREIGN KEY: `resource_id` REFERENCES `resource(id)` ON DELETE CASCADE
- UNIQUE: `(resource_id, date)` - One capacity record per resource per date
- CHECK: `max_capacity >= 0`
- CHECK: `available_capacity >= 0`
- CHECK: `available_capacity <= max_capacity`

**Indexes:**
- `idx_capacity_resource_date` (UNIQUE): `(resource_id, date)`
- `idx_capacity_date_range`: `(resource_id, date)` WHERE `available_capacity > 0`

**Example Row:**

```sql
INSERT INTO resource_capacity (id, resource_id, date, max_capacity, available_capacity)
VALUES (
  gen_random_uuid(),
  'res_01JCEXAMPLE',
  '2025-01-15',
  5,
  3  -- 2 units booked, 3 remaining
);
```

**Notes:**
- Capacity is decremented when holds are created
- Capacity is restored when holds expire or are released
- Capacity remains decremented when hold is confirmed (converted to allocation)

---

### resource_hold

Temporary 30-minute reservations before checkout.

**Table:** `resource_hold`

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | UUID | NO | gen_random_uuid() | Primary key |
| `resource_id` | VARCHAR(255) | NO | - | Foreign key to resource.id |
| `dates` | DATE[] | NO | - | Array of dates being held |
| `quantity` | INTEGER | NO | - | Number of units per date |
| `customer_email` | VARCHAR(255) | NO | - | Customer's email (for tracking/cancellation) |
| `idempotency_token` | VARCHAR(255) | NO | - | Unique token for idempotent creation |
| `status` | VARCHAR(50) | NO | 'ACTIVE' | Hold status |
| `expires_at` | TIMESTAMP | NO | NOW() + 30 minutes | Expiration timestamp |
| `confirmed_at` | TIMESTAMP | YES | NULL | When hold was confirmed |
| `metadata` | JSONB | YES | {} | Additional data (e.g., special requests) |
| `created_at` | TIMESTAMP | NO | CURRENT_TIMESTAMP | Creation timestamp |
| `updated_at` | TIMESTAMP | NO | CURRENT_TIMESTAMP | Last update timestamp |

**Constraints:**
- PRIMARY KEY: `id`
- FOREIGN KEY: `resource_id` REFERENCES `resource(id)` ON DELETE RESTRICT
- CHECK: `status IN ('ACTIVE', 'CONFIRMED', 'RELEASED', 'EXPIRED')`
- CHECK: `quantity > 0`
- CHECK: `array_length(dates, 1) > 0`
- UNIQUE: `idempotency_token` (ensures idempotent hold creation)

**Indexes:**
- `idx_hold_resource`: `(resource_id, status)`
- `idx_hold_customer`: `(customer_email, status)`
- `idx_hold_idempotency`: `(idempotency_token)` UNIQUE
- `idx_hold_expiration`: `(expires_at, status)` WHERE `status = 'ACTIVE'`

**Status Transitions:**

```
ACTIVE ──┬──> CONFIRMED (after successful checkout)
         ├──> RELEASED (customer cancels)
         └──> EXPIRED (30 minutes elapsed without confirmation)
```

**Example Row:**

```sql
INSERT INTO resource_hold (
  id, resource_id, dates, quantity, customer_email,
  idempotency_token, status, expires_at
)
VALUES (
  gen_random_uuid(),
  'res_01JCEXAMPLE',
  ARRAY['2025-01-15'::date, '2025-01-17'::date],
  2,
  'customer@example.com',
  '550e8400-e29b-41d4-a716-446655440000',
  'ACTIVE',
  NOW() + INTERVAL '30 minutes'
);
```

**Notes:**
- Holds are automatically cleaned up by cron job every 5 minutes
- Expired holds have their capacity returned to the pool
- Confirmed holds are converted to allocations

---

### resource_allocation

Permanent bookings linked to orders.

**Table:** `resource_allocation`

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | UUID | NO | gen_random_uuid() | Primary key |
| `resource_id` | VARCHAR(255) | NO | - | Foreign key to resource.id |
| `order_id` | VARCHAR(255) | NO | - | Medusa order ID |
| `line_item_id` | VARCHAR(255) | NO | - | Medusa line item ID |
| `dates` | DATE[] | NO | - | Array of allocated dates |
| `quantity` | INTEGER | NO | - | Number of units per date |
| `metadata` | JSONB | YES | {} | Additional data from hold/order |
| `created_at` | TIMESTAMP | NO | CURRENT_TIMESTAMP | Creation timestamp |
| `updated_at` | TIMESTAMP | NO | CURRENT_TIMESTAMP | Last update timestamp |

**Constraints:**
- PRIMARY KEY: `id`
- FOREIGN KEY: `resource_id` REFERENCES `resource(id)` ON DELETE RESTRICT
- CHECK: `quantity > 0`
- CHECK: `array_length(dates, 1) > 0`
- UNIQUE: `(order_id, line_item_id)` - One allocation per line item

**Indexes:**
- `idx_allocation_resource`: `(resource_id)`
- `idx_allocation_order`: `(order_id)`
- `idx_allocation_dates`: `(resource_id)` USING GIN `(dates)`

**Example Row:**

```sql
INSERT INTO resource_allocation (
  id, resource_id, order_id, line_item_id, dates, quantity
)
VALUES (
  gen_random_uuid(),
  'res_01JCEXAMPLE',
  'order_01JCEXAMPLE',
  'item_01JCEXAMPLE',
  ARRAY['2025-01-15'::date, '2025-01-17'::date],
  2
);
```

**Notes:**
- Created when hold is confirmed after successful checkout
- Permanent record - not deleted even if order is cancelled (for audit trail)
- Capacity remains allocated (not returned unless explicitly adjusted by admin)

---

### resource_blackout

Date ranges when resources are unavailable.

**Table:** `resource_blackout`

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | UUID | NO | gen_random_uuid() | Primary key |
| `resource_id` | VARCHAR(255) | NO | - | Foreign key to resource.id |
| `start_date` | DATE | NO | - | First date of blackout period |
| `end_date` | DATE | NO | - | Last date of blackout period (inclusive) |
| `reason` | TEXT | YES | NULL | Explanation (e.g., "Maintenance", "Holiday") |
| `created_at` | TIMESTAMP | NO | CURRENT_TIMESTAMP | Creation timestamp |
| `updated_at` | TIMESTAMP | NO | CURRENT_TIMESTAMP | Last update timestamp |

**Constraints:**
- PRIMARY KEY: `id`
- FOREIGN KEY: `resource_id` REFERENCES `resource(id)` ON DELETE CASCADE
- CHECK: `end_date >= start_date`

**Indexes:**
- `idx_blackout_resource`: `(resource_id)`
- `idx_blackout_dates`: `(resource_id, start_date, end_date)`

**Example Row:**

```sql
INSERT INTO resource_blackout (id, resource_id, start_date, end_date, reason)
VALUES (
  gen_random_uuid(),
  'res_01JCEXAMPLE',
  '2025-02-01',
  '2025-02-05',
  'Annual vehicle maintenance and safety inspection'
);
```

**Notes:**
- Prevents new holds/allocations during blackout period
- Existing allocations during blackout are flagged for admin review
- When blackout is created, active holds during that period can be auto-cancelled

---

## Indexes

### Performance Indexes

| Index Name | Table | Columns | Type | Purpose |
|------------|-------|---------|------|---------|
| `idx_capacity_resource_date` | resource_capacity | (resource_id, date) | UNIQUE BTREE | Fast capacity lookups |
| `idx_capacity_available` | resource_capacity | (resource_id, date) WHERE available_capacity > 0 | PARTIAL BTREE | Filter available dates |
| `idx_hold_expiration` | resource_hold | (expires_at, status) WHERE status = 'ACTIVE' | PARTIAL BTREE | Cleanup expired holds |
| `idx_hold_idempotency` | resource_hold | (idempotency_token) | UNIQUE BTREE | Enforce idempotency |
| `idx_allocation_dates` | resource_allocation | dates | GIN | Query by date ranges |
| `idx_blackout_overlap` | resource_blackout | (resource_id, start_date, end_date) | BTREE | Check date overlaps |

### Advisory Lock Function

```sql
-- Function to generate consistent lock ID for resource + date
CREATE OR REPLACE FUNCTION get_resource_date_lock_id(
  p_resource_id VARCHAR,
  p_date DATE
) RETURNS BIGINT AS $$
BEGIN
  RETURN ('x' || substr(md5(p_resource_id || p_date::text), 1, 15))::bit(60)::bigint;
END;
$$ LANGUAGE plpgsql IMMUTABLE;
```

**Usage:**

```sql
-- Acquire advisory lock before capacity check
SELECT pg_advisory_lock(get_resource_date_lock_id('res_01JCEXAMPLE', '2025-01-15'));

-- Perform capacity check and adjustment
UPDATE resource_capacity
SET available_capacity = available_capacity - 1
WHERE resource_id = 'res_01JCEXAMPLE'
  AND date = '2025-01-15'
  AND available_capacity >= 1;

-- Release lock
SELECT pg_advisory_unlock(get_resource_date_lock_id('res_01JCEXAMPLE', '2025-01-15'));
```

---

## Constraints

### Data Integrity Rules

**1. Capacity Constraints**
```sql
ALTER TABLE resource_capacity
ADD CONSTRAINT chk_capacity_positive CHECK (max_capacity >= 0),
ADD CONSTRAINT chk_available_positive CHECK (available_capacity >= 0),
ADD CONSTRAINT chk_available_lte_max CHECK (available_capacity <= max_capacity);
```

**2. Hold Quantity Constraints**
```sql
ALTER TABLE resource_hold
ADD CONSTRAINT chk_hold_quantity_positive CHECK (quantity > 0),
ADD CONSTRAINT chk_hold_dates_not_empty CHECK (array_length(dates, 1) > 0);
```

**3. Blackout Date Constraints**
```sql
ALTER TABLE resource_blackout
ADD CONSTRAINT chk_blackout_date_order CHECK (end_date >= start_date);
```

**4. Resource Type Constraints**
```sql
ALTER TABLE resource
ADD CONSTRAINT chk_resource_type CHECK (type IN ('VEHICLE', 'TOUR', 'GUIDE'));
```

---

## Triggers

### Auto-Update Timestamps

```sql
-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to all tables
CREATE TRIGGER trg_resource_updated_at
  BEFORE UPDATE ON resource
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_capacity_updated_at
  BEFORE UPDATE ON resource_capacity
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_hold_updated_at
  BEFORE UPDATE ON resource_hold
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_allocation_updated_at
  BEFORE UPDATE ON resource_allocation
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_blackout_updated_at
  BEFORE UPDATE ON resource_blackout
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

### Audit Logging (Optional)

```sql
-- Audit table for capacity changes
CREATE TABLE resource_capacity_audit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  capacity_id UUID NOT NULL,
  resource_id VARCHAR(255) NOT NULL,
  date DATE NOT NULL,
  old_available INTEGER,
  new_available INTEGER,
  change_reason VARCHAR(255),
  changed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Trigger to log capacity changes
CREATE OR REPLACE FUNCTION audit_capacity_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.available_capacity <> NEW.available_capacity THEN
    INSERT INTO resource_capacity_audit (
      capacity_id, resource_id, date,
      old_available, new_available, change_reason
    ) VALUES (
      NEW.id, NEW.resource_id, NEW.date,
      OLD.available_capacity, NEW.available_capacity,
      'Capacity adjustment'
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_audit_capacity_change
  AFTER UPDATE ON resource_capacity
  FOR EACH ROW EXECUTE FUNCTION audit_capacity_change();
```

---

## Migration Files

### Migration Order

1. `001_create_resource_table.sql`
2. `002_create_capacity_table.sql`
3. `003_create_hold_table.sql`
4. `004_create_allocation_table.sql`
5. `005_create_blackout_table.sql`
6. `006_create_indexes.sql`
7. `007_create_functions.sql`
8. `008_create_triggers.sql`

### Sample Migration: Create Resource Table

```sql
-- Migration: 001_create_resource_table.sql
-- Description: Create resource table for bookable items

CREATE TABLE IF NOT EXISTS resource (
  id VARCHAR(255) PRIMARY KEY,
  type VARCHAR(50) NOT NULL CHECK (type IN ('VEHICLE', 'TOUR', 'GUIDE')),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP
);

-- Index for active resources
CREATE INDEX idx_resource_active ON resource(is_active) WHERE deleted_at IS NULL;

-- Index for resource type
CREATE INDEX idx_resource_type ON resource(type) WHERE deleted_at IS NULL;

-- Unique constraint on name (among non-deleted)
CREATE UNIQUE INDEX idx_resource_name_unique
  ON resource(name) WHERE deleted_at IS NULL;

-- Comment on table
COMMENT ON TABLE resource IS 'Bookable resources (vehicles, tours, guides)';
COMMENT ON COLUMN resource.type IS 'Resource type: VEHICLE, TOUR, or GUIDE';
COMMENT ON COLUMN resource.metadata IS 'Additional resource-specific data (JSON)';
COMMENT ON COLUMN resource.is_active IS 'Whether resource is currently bookable';
COMMENT ON COLUMN resource.deleted_at IS 'Soft delete timestamp';
```

### Sample Migration: Create Capacity Table

```sql
-- Migration: 002_create_capacity_table.sql
-- Description: Create capacity tracking table

CREATE TABLE IF NOT EXISTS resource_capacity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  resource_id VARCHAR(255) NOT NULL REFERENCES resource(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  max_capacity INTEGER NOT NULL CHECK (max_capacity >= 0),
  available_capacity INTEGER NOT NULL CHECK (available_capacity >= 0),
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

  -- Ensure available <= max
  CONSTRAINT chk_available_lte_max CHECK (available_capacity <= max_capacity),

  -- One capacity record per resource per date
  CONSTRAINT uq_resource_date UNIQUE (resource_id, date)
);

-- Index for fast lookups
CREATE INDEX idx_capacity_resource_date ON resource_capacity(resource_id, date);

-- Partial index for available capacity
CREATE INDEX idx_capacity_available
  ON resource_capacity(resource_id, date)
  WHERE available_capacity > 0;

-- Comment on table
COMMENT ON TABLE resource_capacity IS 'Daily capacity limits for resources';
COMMENT ON COLUMN resource_capacity.max_capacity IS 'Maximum units available for this date';
COMMENT ON COLUMN resource_capacity.available_capacity IS 'Remaining units available';
```

### Rolling Back Migrations

```sql
-- Rollback script for capacity table
DROP TABLE IF EXISTS resource_capacity CASCADE;

-- Rollback script for resource table
DROP TABLE IF EXISTS resource CASCADE;
```

---

## Data Types Reference

### PostgreSQL Type Mappings

| Schema Type | PostgreSQL Type | Size | Range/Notes |
|-------------|----------------|------|-------------|
| `id (resource)` | VARCHAR(255) | Variable | ULID format: `res_01JCEXAMPLE` |
| `id (others)` | UUID | 16 bytes | Random UUID v4 |
| `type` | VARCHAR(50) | Variable | ENUM values stored as string |
| `dates` | DATE[] | Variable | Array of DATE values |
| `metadata` | JSONB | Variable | Binary JSON, indexed |
| `created_at` | TIMESTAMP | 8 bytes | Timezone-aware, UTC storage |
| `capacity` | INTEGER | 4 bytes | -2,147,483,648 to +2,147,483,647 |

### JSONB Metadata Examples

**Vehicle Metadata:**
```json
{
  "license_plate": "ABC123",
  "seats": 7,
  "year": 2023,
  "make": "Toyota",
  "model": "Land Cruiser",
  "features": ["GPS", "First Aid Kit", "Air Conditioning"],
  "maintenance_schedule": "2025-02-01"
}
```

**Tour Metadata:**
```json
{
  "duration_hours": 8,
  "difficulty": "moderate",
  "min_age": 12,
  "max_participants": 8,
  "included": ["Lunch", "Equipment", "Guide"],
  "meeting_point": "Rainbow Beach Visitor Center"
}
```

**Guide Metadata:**
```json
{
  "name": "John Smith",
  "languages": ["English", "German"],
  "certifications": ["First Aid", "4WD Training"],
  "specializations": ["Eco Tours", "Photography Tours"],
  "max_group_size": 8
}
```

---

## Query Examples

### Common Queries

**1. Check Availability for Date Range**
```sql
SELECT
  date,
  max_capacity,
  available_capacity,
  (available_capacity >= 2) AS is_available
FROM resource_capacity
WHERE resource_id = 'res_01JCEXAMPLE'
  AND date BETWEEN '2025-01-15' AND '2025-01-17'
ORDER BY date;
```

**2. Find Active Holds Expiring Soon**
```sql
SELECT
  id,
  resource_id,
  customer_email,
  expires_at,
  EXTRACT(EPOCH FROM (expires_at - NOW())) AS seconds_remaining
FROM resource_hold
WHERE status = 'ACTIVE'
  AND expires_at <= NOW() + INTERVAL '5 minutes'
ORDER BY expires_at;
```

**3. Get Capacity Utilization Report**
```sql
SELECT
  r.name AS resource_name,
  COUNT(*) AS total_days,
  SUM(c.max_capacity) AS total_capacity,
  SUM(c.max_capacity - c.available_capacity) AS allocated,
  ROUND(
    100.0 * SUM(c.max_capacity - c.available_capacity) /
    NULLIF(SUM(c.max_capacity), 0),
    2
  ) AS utilization_percent
FROM resource r
JOIN resource_capacity c ON r.id = c.resource_id
WHERE c.date BETWEEN '2025-01-01' AND '2025-01-31'
GROUP BY r.id, r.name
ORDER BY utilization_percent DESC;
```

**4. Find Overlapping Blackouts**
```sql
SELECT *
FROM resource_blackout
WHERE resource_id = 'res_01JCEXAMPLE'
  AND daterange(start_date, end_date, '[]') &&
      daterange('2025-01-15'::date, '2025-01-17'::date, '[]');
```

**5. Get All Allocations for Order**
```sql
SELECT
  a.id,
  r.name AS resource_name,
  a.dates,
  a.quantity,
  a.created_at
FROM resource_allocation a
JOIN resource r ON a.resource_id = r.id
WHERE a.order_id = 'order_01JCEXAMPLE'
ORDER BY a.created_at;
```

---

## Backup and Restore

### Backup Schema and Data

```bash
# Backup entire resource booking schema
pg_dump -h localhost -U medusa -d medusa_db \
  -t resource -t resource_capacity -t resource_hold \
  -t resource_allocation -t resource_blackout \
  --file=resource_booking_backup_$(date +%Y%m%d).sql

# Backup schema only (no data)
pg_dump -h localhost -U medusa -d medusa_db \
  -t resource -t resource_capacity -t resource_hold \
  -t resource_allocation -t resource_blackout \
  --schema-only \
  --file=resource_booking_schema.sql
```

### Restore from Backup

```bash
# Restore schema and data
psql -h localhost -U medusa -d medusa_db \
  -f resource_booking_backup_20250115.sql
```

---

## Performance Considerations

### Query Optimization Tips

1. **Always use indexes for date range queries**
   - `resource_capacity(resource_id, date)` index makes availability checks fast

2. **Use partial indexes for filtered queries**
   - `available_capacity > 0` partial index reduces index size

3. **Leverage GIN indexes for array queries**
   - `resource_allocation.dates` GIN index enables efficient date membership checks

4. **Minimize lock contention**
   - Use advisory locks only for critical sections (capacity checks)
   - Release locks immediately after capacity adjustment

5. **Batch operations when possible**
   - Initialize capacity for date ranges (not individual days)
   - Cleanup expired holds in batches (not one-by-one)

### Table Maintenance

```sql
-- Analyze tables after bulk operations
ANALYZE resource_capacity;
ANALYZE resource_hold;

-- Vacuum to reclaim space from deleted holds
VACUUM resource_hold;

-- Reindex if index performance degrades
REINDEX TABLE resource_capacity;
```

---

## Next Steps

- [API Reference](./API_REFERENCE.md) - Learn how to query this data via API
- [Architecture](../../docs/resource-booking/ARCHITECTURE.md) - Understand system design
- [Deployment](../../docs/resource-booking/DEPLOYMENT.md) - Set up database in production
