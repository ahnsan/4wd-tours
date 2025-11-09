# Deployment Guide

Production deployment guide for the Resource Booking module.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Database Setup](#database-setup)
- [Environment Configuration](#environment-configuration)
- [Migration Process](#migration-process)
- [Seeding Data](#seeding-data)
- [Deployment Steps](#deployment-steps)
- [Monitoring](#monitoring)
- [Backup Strategy](#backup-strategy)
- [Rollback Plan](#rollback-plan)
- [Troubleshooting](#troubleshooting)

---

## Prerequisites

### System Requirements

- **Node.js:** 18.x or higher
- **PostgreSQL:** 12.x or higher
- **Medusa.js:** 2.11.3 or higher
- **RAM:** Minimum 2GB, recommended 4GB+
- **CPU:** 2+ cores recommended for production
- **Disk:** 20GB+ for database and logs

### Dependencies

```json
{
  "dependencies": {
    "@medusajs/medusa": "^2.11.3",
    "typeorm": "^0.3.x",
    "pg": "^8.11.x",
    "luxon": "^3.4.x"
  }
}
```

---

## Database Setup

### Create Production Database

```bash
# Connect to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE medusa_production;

# Create user (if not exists)
CREATE USER medusa_user WITH ENCRYPTED PASSWORD 'secure_password_here';

# Grant privileges
GRANT ALL PRIVILEGES ON DATABASE medusa_production TO medusa_user;

# Enable extensions
\c medusa_production
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- For full-text search
```

### Configure Connection Pool

```typescript
// medusa-config.ts
export default {
  projectConfig: {
    database_url: process.env.DATABASE_URL,
    database_extra: {
      max: 20, // Maximum connections
      min: 2,  // Minimum connections
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
      statement_timeout: 30000, // 30 seconds
    }
  }
};
```

### SSL Configuration (Production)

```typescript
// medusa-config.ts
export default {
  projectConfig: {
    database_url: process.env.DATABASE_URL,
    database_extra: {
      ssl: {
        rejectUnauthorized: true,
        ca: process.env.DATABASE_SSL_CA // Path to CA certificate
      }
    }
  }
};
```

---

## Environment Configuration

### Required Environment Variables

```bash
# .env.production
NODE_ENV=production
DATABASE_URL=postgresql://medusa_user:password@localhost:5432/medusa_production
REDIS_URL=redis://localhost:6379

# Medusa configuration
MEDUSA_BACKEND_URL=https://api.yoursite.com
STORE_CORS=https://yoursite.com,https://www.yoursite.com
ADMIN_CORS=https://admin.yoursite.com

# Timezone (critical for booking system)
TZ=Australia/Brisbane

# JWT secret (generate secure random string)
JWT_SECRET=your_secure_jwt_secret_here

# Cookie secret
COOKIE_SECRET=your_secure_cookie_secret_here

# Optional: Redis for caching
CACHE_REDIS_URL=redis://localhost:6379

# Optional: Monitoring
SENTRY_DSN=https://your-sentry-dsn
LOG_LEVEL=info
```

### Generate Secure Secrets

```bash
# Generate JWT secret
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Generate cookie secret
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### Validate Configuration

```bash
# Test database connection
npx medusa db:test

# Verify environment variables
node -e "console.log(process.env.DATABASE_URL ? 'DB configured' : 'DB not configured')"
```

---

## Migration Process

### Run Migrations

```bash
# Dry run (check what will be applied)
npx medusa db:migrate --dry-run

# Apply migrations
npx medusa db:migrate

# Verify migrations
psql $DATABASE_URL -c "SELECT * FROM migrations ORDER BY timestamp DESC LIMIT 5;"
```

### Migration Files

Ensure these migrations are applied in order:

1. `001_create_resource_table.sql`
2. `002_create_capacity_table.sql`
3. `003_create_hold_table.sql`
4. `004_create_allocation_table.sql`
5. `005_create_blackout_table.sql`
6. `006_create_indexes.sql`
7. `007_create_functions.sql` (advisory lock helpers)
8. `008_create_triggers.sql`

### Verify Schema

```sql
-- Check tables created
SELECT tablename FROM pg_tables
WHERE schemaname = 'public'
  AND tablename LIKE 'resource%'
ORDER BY tablename;

-- Check indexes
SELECT indexname, tablename
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename LIKE 'resource%'
ORDER BY tablename, indexname;

-- Check constraints
SELECT conname, contype, pg_get_constraintdef(oid)
FROM pg_constraint
WHERE conrelid::regclass::text LIKE 'resource%';
```

---

## Seeding Data

### Production Data Seeding

```bash
# Run seed script
pnpm medusa exec ./scripts/seed-resources-production.ts
```

### Seed Script Example

```typescript
// scripts/seed-resources-production.ts
import { MedusaContainer } from '@medusajs/medusa/dist/types/global';

export default async function seedResourcesProduction(
  container: MedusaContainer
) {
  console.log('Seeding production resources...');

  // Create Fraser Island tours
  const fraserTour = await createResource({
    type: 'TOUR',
    name: 'Fraser Island 1-Day 4WD Tour',
    description: 'Full day guided tour of Fraser Island',
    metadata: {
      duration_hours: 8,
      max_participants: 8,
      meeting_point: 'Rainbow Beach Visitor Center'
    }
  });

  // Initialize capacity for next 12 months
  const today = new Date();
  const oneYearLater = new Date();
  oneYearLater.setFullYear(today.getFullYear() + 1);

  await initializeCapacity({
    resource_id: fraserTour.id,
    start_date: today.toISOString().split('T')[0],
    end_date: oneYearLater.toISOString().split('T')[0],
    daily_capacity: 8
  });

  console.log('Seeding complete!');
}

// Helper functions...
```

### Validate Seeded Data

```sql
-- Check resources created
SELECT id, type, name, is_active FROM resource;

-- Check capacity initialized
SELECT
  resource_id,
  COUNT(*) as days_initialized,
  MIN(date) as start_date,
  MAX(date) as end_date,
  AVG(max_capacity) as avg_capacity
FROM resource_capacity
GROUP BY resource_id;
```

---

## Deployment Steps

### Step 1: Pre-Deployment Checklist

- [ ] Database backup completed
- [ ] Environment variables configured
- [ ] Migrations tested in staging
- [ ] Load tests passed
- [ ] Monitoring configured
- [ ] Rollback plan prepared

### Step 2: Deploy Application

```bash
# Build application
npm run build

# Install production dependencies only
npm ci --production

# Start application with PM2
pm2 start npm --name "medusa" -- start

# Or with systemd
sudo systemctl start medusa
```

### Step 3: Run Migrations

```bash
# Apply database migrations
npx medusa db:migrate

# Verify
npx medusa db:status
```

### Step 4: Seed Production Data

```bash
# Seed initial resources
pnpm medusa exec ./scripts/seed-resources-production.ts
```

### Step 5: Smoke Tests

```bash
# Test Store API
curl https://api.yoursite.com/store/resource-booking/availability?resource_id=res_test&start_date=2025-01-15&end_date=2025-01-17&quantity=1

# Test Admin API (requires auth token)
curl -H "Authorization: Bearer $ADMIN_TOKEN" \
  https://api.yoursite.com/admin/resource-booking/resources
```

### Step 6: Enable Scheduled Jobs

```typescript
// medusa-config.ts
export default {
  projectConfig: {
    // ...
  },
  jobs: [
    {
      schedule: '*/5 * * * *', // Every 5 minutes
      handler: 'src/jobs/cleanup-expired-holds'
    }
  ]
};
```

### Step 7: Monitor Deployment

```bash
# Check application logs
pm2 logs medusa

# Check database connections
psql $DATABASE_URL -c "SELECT count(*) FROM pg_stat_activity WHERE datname = 'medusa_production';"

# Check API health
curl https://api.yoursite.com/health
```

---

## Monitoring

### Application Monitoring

**Using PM2:**
```bash
# Monitor processes
pm2 monit

# View logs
pm2 logs --lines 100

# Check metrics
pm2 describe medusa
```

**Using Sentry (Recommended):**
```typescript
// src/instrumentation.ts
import * as Sentry from '@sentry/node';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.1,
  integrations: [
    new Sentry.Integrations.Http({ tracing: true }),
    new Sentry.Integrations.Express({ app })
  ]
});
```

### Database Monitoring

```sql
-- Monitor active holds
SELECT COUNT(*) as active_holds
FROM resource_hold
WHERE status = 'ACTIVE' AND expires_at > NOW();

-- Monitor capacity utilization
SELECT
  r.name,
  c.date,
  c.max_capacity,
  c.available_capacity,
  ROUND(100.0 * (c.max_capacity - c.available_capacity) / c.max_capacity, 2) as utilization_pct
FROM resource_capacity c
JOIN resource r ON c.resource_id = r.id
WHERE c.date = CURRENT_DATE
ORDER BY utilization_pct DESC;

-- Monitor hold expiration rate
SELECT
  DATE(created_at) as date,
  COUNT(*) as total_holds,
  SUM(CASE WHEN status = 'EXPIRED' THEN 1 ELSE 0 END) as expired_holds,
  ROUND(100.0 * SUM(CASE WHEN status = 'EXPIRED' THEN 1 ELSE 0 END) / COUNT(*), 2) as expiration_rate
FROM resource_hold
WHERE created_at >= NOW() - INTERVAL '7 days'
GROUP BY DATE(created_at)
ORDER BY date DESC;
```

### Key Metrics to Track

| Metric | Target | Alert Threshold |
|--------|--------|----------------|
| Hold expiration rate | <20% | >30% |
| API p95 latency | <300ms | >500ms |
| Database connection pool usage | <80% | >90% |
| Active holds count | - | >1000 |
| Failed hold creations | <1% | >5% |
| Hold confirmation rate | >80% | <70% |

### Alerting

```typescript
// src/monitoring/alerts.ts
import { sendAlert } from './alert-service';

// Alert if hold expiration rate too high
export async function checkHoldExpirationRate() {
  const result = await db.query(`
    SELECT
      COUNT(*) as total,
      SUM(CASE WHEN status = 'EXPIRED' THEN 1 ELSE 0 END) as expired
    FROM resource_hold
    WHERE created_at >= NOW() - INTERVAL '1 hour'
  `);

  const expirationRate = result.rows[0].expired / result.rows[0].total;

  if (expirationRate > 0.3) {
    await sendAlert({
      severity: 'warning',
      message: `High hold expiration rate: ${(expirationRate * 100).toFixed(1)}%`
    });
  }
}
```

---

## Backup Strategy

### Database Backups

**Automated Daily Backups:**
```bash
#!/bin/bash
# /usr/local/bin/backup-medusa-db.sh

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backups/medusa"
DB_NAME="medusa_production"

# Create backup
pg_dump -U medusa_user -d $DB_NAME | gzip > "$BACKUP_DIR/medusa_$DATE.sql.gz"

# Verify backup
gunzip -t "$BACKUP_DIR/medusa_$DATE.sql.gz"

# Delete backups older than 30 days
find $BACKUP_DIR -name "medusa_*.sql.gz" -mtime +30 -delete

# Upload to S3 (optional)
aws s3 cp "$BACKUP_DIR/medusa_$DATE.sql.gz" s3://your-bucket/backups/
```

**Cron Job:**
```bash
# Run daily at 2 AM
0 2 * * * /usr/local/bin/backup-medusa-db.sh >> /var/log/backup-medusa.log 2>&1
```

### Restore from Backup

```bash
# Download from S3 (if applicable)
aws s3 cp s3://your-bucket/backups/medusa_20250115.sql.gz .

# Restore
gunzip medusa_20250115.sql.gz
psql -U medusa_user -d medusa_production < medusa_20250115.sql
```

### Point-in-Time Recovery

**Enable WAL Archiving:**
```conf
# postgresql.conf
wal_level = replica
archive_mode = on
archive_command = 'cp %p /archives/%f'
```

---

## Rollback Plan

### Rollback Steps

**1. Stop Application:**
```bash
pm2 stop medusa
```

**2. Restore Database:**
```bash
# Restore from latest backup
psql -U medusa_user -d medusa_production < /backups/medusa_latest.sql
```

**3. Revert Code:**
```bash
# Checkout previous version
git checkout v1.0.0

# Reinstall dependencies
npm ci --production

# Rebuild
npm run build
```

**4. Restart Application:**
```bash
pm2 restart medusa
```

**5. Verify:**
```bash
# Check health
curl https://api.yoursite.com/health

# Check critical endpoints
curl https://api.yoursite.com/store/resource-booking/availability?...
```

### Migration Rollback

```bash
# Revert last migration
npx medusa db:rollback

# Revert multiple migrations
npx medusa db:rollback --count 3
```

---

## Troubleshooting

### Issue: Database Connection Pool Exhausted

**Symptoms:**
- Timeout errors
- "too many connections" errors

**Solution:**
```typescript
// Increase pool size
database_extra: {
  max: 30, // Increased from 20
  idleTimeoutMillis: 20000 // Reduce idle timeout
}
```

### Issue: Hold Cleanup Job Not Running

**Symptoms:**
- Expired holds accumulating
- Capacity not being restored

**Solution:**
```bash
# Check cron jobs
pm2 list

# Manually trigger cleanup
pnpm medusa exec ./src/jobs/cleanup-expired-holds.ts

# Check logs
pm2 logs medusa | grep cleanup
```

### Issue: Advisory Lock Timeouts

**Symptoms:**
- "Could not acquire lock" errors
- Slow hold creation

**Solution:**
```sql
-- Check for long-running locks
SELECT
  locktype,
  relation::regclass,
  mode,
  granted,
  pg_blocking_pids(pid) as blocked_by
FROM pg_locks
WHERE NOT granted;

-- Kill blocking queries if necessary
SELECT pg_terminate_backend(pid)
FROM pg_stat_activity
WHERE state = 'active' AND query_start < NOW() - INTERVAL '5 minutes';
```

### Issue: High Memory Usage

**Symptoms:**
- OOM errors
- Slow performance

**Solution:**
```bash
# Check memory usage
pm2 monit

# Increase Node memory limit
node --max-old-space-size=4096 dist/main.js

# Or in PM2
pm2 start npm --name medusa --node-args="--max-old-space-size=4096" -- start
```

### Issue: Slow API Response Times

**Symptoms:**
- p95 latency >500ms
- Customer complaints

**Solution:**
```sql
-- Check slow queries
SELECT
  query,
  mean_exec_time,
  calls
FROM pg_stat_statements
WHERE mean_exec_time > 100
ORDER BY mean_exec_time DESC
LIMIT 10;

-- Add missing indexes
CREATE INDEX IF NOT EXISTS idx_capacity_resource_date_partial
  ON resource_capacity(resource_id, date)
  WHERE available_capacity > 0;

-- Analyze tables
ANALYZE resource_capacity;
ANALYZE resource_hold;
```

---

## Production Checklist

### Before Go-Live

- [ ] Load testing completed (100+ concurrent users)
- [ ] Database backups automated
- [ ] Monitoring dashboards configured
- [ ] Alert thresholds set
- [ ] SSL certificates installed
- [ ] CORS properly configured
- [ ] Rate limiting enabled
- [ ] Error tracking (Sentry) configured
- [ ] Documentation reviewed
- [ ] Team trained on operations

### Day 1 Operations

- [ ] Monitor error rates
- [ ] Check hold expiration rate
- [ ] Verify capacity updates
- [ ] Review API latency metrics
- [ ] Test rollback procedure
- [ ] Customer support briefed

### Ongoing Maintenance

- [ ] Weekly: Review capacity utilization
- [ ] Weekly: Check backup success
- [ ] Monthly: Analyze booking patterns
- [ ] Quarterly: Capacity planning review
- [ ] As needed: Optimize slow queries

---

## Next Steps

- [API Reference](../../src/modules/resource-booking/API_REFERENCE.md)
- [Monitoring Setup](./MONITORING.md) (if applicable)
- [Architecture](./ARCHITECTURE.md)
- [Testing Guide](./TESTING.md)
