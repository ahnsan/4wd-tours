# BMAD: Resource Booking System

Business goal, Motivation, Acceptance criteria, and Details specification.

## Business Goal (B)

Implement a date-based resource booking system that prevents double-booking by blocking dates when tours, vehicles, or guides are reserved, with support for temporary holds during the checkout process.

### Primary Objectives

1. **Prevent Overbooking:** Ensure no resource is double-booked for the same date
2. **Support Checkout Flow:** Allow customers to temporarily reserve resources while completing checkout
3. **Maximize Utilization:** Release capacity when reservations expire or are cancelled
4. **Provide Visibility:** Give admins and customers real-time availability information

### Success Metrics

- **Zero overbookings:** <0.001% probability of double-booking
- **Low abandonment:** <20% of holds expire without confirmation
- **Fast response:** <300ms p95 API latency
- **High conversion:** >80% of holds convert to confirmed bookings

---

## Motivation (M)

### Business Context

Med USA 4WD operates tour and vehicle rental services in Queensland, Australia. Currently, bookings are managed manually, leading to:

**Pain Points:**
1. **Double-bookings:** Multiple customers book same resource for same date
2. **Manual coordination:** Staff spend hours checking availability and managing conflicts
3. **Lost revenue:** Unable to accurately track capacity and optimize pricing
4. **Poor customer experience:** Bookings confirmed but later cancelled due to conflicts
5. **No holds:** Customers lose reservations if payment processing is slow

### Competitive Advantage

Implementing automated resource booking provides:

- **24/7 instant booking confirmation:** No waiting for manual confirmation
- **Real-time availability:** Customers see accurate availability
- **Reduced operational overhead:** Staff focus on customer service, not spreadsheets
- **Scalability:** Support growth without proportional staff increase
- **Data-driven decisions:** Capacity utilization data for business planning

### Technical Drivers

- **Concurrency requirements:** Multiple customers booking simultaneously
- **Data integrity:** Critical to maintain accurate capacity state
- **Integration:** Must work seamlessly with existing Medusa.js e-commerce platform
- **Performance:** High traffic during peak booking season

---

## Acceptance Criteria (A)

### AC1: Date-Based Capacity Management

**Given** a resource (vehicle, tour, guide) with a defined daily capacity
**When** capacity is initialized for a date range
**Then** system creates capacity records for each date with available capacity equal to max capacity

**Scenarios:**
- Initialize capacity for next 365 days with daily capacity of 5
- Update capacity for specific dates (e.g., reduce to 0 for maintenance)
- Query remaining capacity for date range

**Validation:**
- ✅ Capacity records created for all dates in range
- ✅ Available capacity never exceeds max capacity
- ✅ Available capacity never goes negative
- ✅ Unique constraint: one capacity record per resource per date

---

### AC2: Availability Checking

**Given** a customer browsing tours
**When** they select a date range and quantity
**Then** system shows which dates have sufficient capacity

**Scenarios:**
- Check availability for single date
- Check availability for multi-day trip (e.g., 3-day tour)
- Handle case where some dates available, others not

**Validation:**
- ✅ Returns availability status for each date
- ✅ Shows remaining capacity per date
- ✅ Accounts for existing holds and allocations
- ✅ Response time <200ms for 30-day range

---

### AC3: Temporary Hold Creation (30 minutes)

**Given** a customer ready to book
**When** they click "Book Now"
**Then** system creates a 30-minute hold that decrements capacity

**Scenarios:**
- Create hold for single date
- Create hold for multiple dates
- Prevent hold if insufficient capacity
- Idempotent hold creation (same token = same hold)

**Validation:**
- ✅ Hold created with ACTIVE status
- ✅ Expires_at set to 30 minutes from creation
- ✅ Capacity decremented immediately
- ✅ Customer receives hold ID and expiration time
- ✅ Duplicate requests with same idempotency token return existing hold

---

### AC4: Hold Confirmation (Convert to Booking)

**Given** a customer with an active hold
**When** they successfully complete checkout
**Then** hold is confirmed and converted to permanent allocation

**Scenarios:**
- Confirm hold within 30-minute window
- Reject confirmation after expiration
- Reject confirmation if hold already confirmed
- Link allocation to order and line item

**Validation:**
- ✅ Hold status changed to CONFIRMED
- ✅ Allocation record created with order reference
- ✅ Capacity remains decremented (not restored)
- ✅ Cannot confirm expired hold
- ✅ Idempotent confirmation

---

### AC5: Hold Release/Expiration

**Given** a hold that is not confirmed
**When** 30 minutes elapse OR customer cancels
**Then** hold is released and capacity is restored

**Scenarios:**
- Customer cancels before completing checkout
- Hold expires due to timeout
- Automated cleanup job processes expired holds
- Manual release by admin

**Validation:**
- ✅ Hold status changed to RELEASED or EXPIRED
- ✅ Capacity restored to available pool
- ✅ Cannot release already-confirmed hold
- ✅ Cleanup job runs every 5 minutes
- ✅ Race condition safe (no duplicate capacity restoration)

---

### AC6: Concurrency Control (No Double-Booking)

**Given** multiple customers booking the same resource simultaneously
**When** capacity is 1 and 3 customers try to book at the exact same time
**Then** only 1 booking succeeds, others receive "insufficient capacity" error

**Scenarios:**
- 100 concurrent requests for resource with capacity of 10
- High contention for popular dates
- Lock timeout handling (retry logic)

**Validation:**
- ✅ PostgreSQL advisory locks prevent race conditions
- ✅ Optimistic locking in UPDATE query (WHERE available_capacity >= ?)
- ✅ Double-booking probability <0.001% under load
- ✅ No deadlocks
- ✅ Lock released within 5 seconds

---

### AC7: Blackout Periods

**Given** a resource that needs to be unavailable for a period
**When** admin creates a blackout period
**Then** no new bookings can be made for those dates

**Scenarios:**
- Create blackout for maintenance (e.g., Feb 1-5)
- Automatically cancel active holds during blackout period
- Warn about existing confirmed bookings during blackout

**Validation:**
- ✅ Blackout record created with reason
- ✅ Availability checks return unavailable for blackout dates
- ✅ Hold creation fails during blackout
- ✅ Optional: cancel existing holds when blackout created

---

### AC8: Admin Management

**Given** an admin user
**When** they manage resources and capacity
**Then** they can perform CRUD operations and view reports

**Scenarios:**
- Create/update/delete resources
- Initialize capacity for date ranges
- View capacity utilization report
- List all allocations for a date range
- Manually adjust capacity (e.g., add extra vehicle)

**Validation:**
- ✅ Admin API requires authentication
- ✅ CRUD operations for resources
- ✅ Bulk capacity initialization
- ✅ Utilization reports with filters
- ✅ Audit logging for all changes

---

### AC9: Timezone Handling

**Given** system operates in Australia/Brisbane timezone
**When** dates are stored and queried
**Then** all dates are consistently in Australia/Brisbane timezone

**Scenarios:**
- Customer in different timezone books for "Jan 15"
- System interprets "Jan 15" as Australia/Brisbane date
- No DST-related bugs

**Validation:**
- ✅ All dates stored as DATE type (no time component)
- ✅ Date parsing uses Australia/Brisbane timezone
- ✅ API accepts dates in YYYY-MM-DD format only
- ✅ Consistent date handling across all endpoints

---

### AC10: Performance Requirements

**Given** the system under realistic load
**When** 100 concurrent users are booking
**Then** system maintains performance targets

**Load Test Scenarios:**
- 100 concurrent availability checks
- 50 concurrent hold creations
- Mixed workload (availability + holds + confirmations)

**Validation:**
- ✅ p50 latency <150ms
- ✅ p95 latency <300ms
- ✅ p99 latency <500ms
- ✅ Throughput >100 requests/second
- ✅ Zero errors under normal load
- ✅ Graceful degradation under extreme load

---

## Details (D)

### Database Schema

**5 Core Tables:**

1. **resource** - Bookable items
   - id (PK), type (VEHICLE/TOUR/GUIDE), name, description, metadata, is_active

2. **resource_capacity** - Daily capacity tracking
   - id (PK), resource_id (FK), date, max_capacity, available_capacity
   - Unique constraint: (resource_id, date)

3. **resource_hold** - Temporary 30-minute reservations
   - id (PK), resource_id (FK), dates[], quantity, customer_email, idempotency_token, status, expires_at

4. **resource_allocation** - Permanent bookings
   - id (PK), resource_id (FK), order_id, line_item_id, dates[], quantity

5. **resource_blackout** - Unavailability periods
   - id (PK), resource_id (FK), start_date, end_date, reason

### API Endpoints

**Store API (Customer-facing):**
- `GET /store/resource-booking/availability` - Check availability
- `POST /store/resource-booking/holds` - Create hold
- `GET /store/resource-booking/holds/:id` - Get hold details
- `POST /store/resource-booking/holds/:id/confirm` - Confirm hold
- `DELETE /store/resource-booking/holds/:id` - Release hold

**Admin API:**
- `POST /admin/resource-booking/resources` - Create resource
- `GET /admin/resource-booking/resources` - List resources
- `GET /admin/resource-booking/resources/:id` - Get resource
- `PUT /admin/resource-booking/resources/:id` - Update resource
- `DELETE /admin/resource-booking/resources/:id` - Delete resource
- `POST /admin/resource-booking/capacity/initialize` - Initialize capacity
- `POST /admin/resource-booking/capacity/adjust` - Adjust capacity
- `GET /admin/resource-booking/capacity/report` - Capacity report
- `POST /admin/resource-booking/blackouts` - Create blackout
- `GET /admin/resource-booking/blackouts` - List blackouts
- `DELETE /admin/resource-booking/blackouts/:id` - Delete blackout

### Concurrency Control Algorithm

**Two-layer protection:**

1. **Advisory Lock:**
   ```typescript
   lockId = hash(resource_id + date)
   pg_advisory_lock(lockId)
   // ... perform capacity check and update
   pg_advisory_unlock(lockId)
   ```

2. **Optimistic Locking:**
   ```sql
   UPDATE resource_capacity
   SET available_capacity = available_capacity - ?
   WHERE resource_id = ? AND date = ?
     AND available_capacity >= ?  -- Critical: ensures sufficient capacity
   RETURNING *;
   ```

### Hold Expiration Strategy

**Automated Cleanup:**
- Cron job runs every 5 minutes
- Finds holds where `expires_at < NOW() AND status = 'ACTIVE'`
- For each expired hold:
  - Update status to 'EXPIRED'
  - Restore capacity: `available_capacity = available_capacity + quantity`
  - Emit webhook event

**Alternative (Future):** Redis TTL for automatic expiration

### Idempotency Implementation

**Hold Creation:**
- Client generates UUID as idempotency_token
- Unique constraint on `idempotency_token` column
- If token already exists (within 24 hours), return existing hold
- Response includes `idempotent_replay: true` flag

### Integration Points

**With Medusa Checkout:**
1. Customer adds bookable product to cart
2. Frontend calls `/holds` to create hold
3. Hold ID stored in cart metadata
4. On successful order placement, workflow calls `/holds/:id/confirm`
5. Allocation created and linked to order

**With Product Catalog:**
- Products have `metadata.resource_id` linking to resource
- Product page queries availability via `/availability` endpoint
- Frontend displays calendar with available/unavailable dates

**With Order Management:**
- Allocations linked to orders via `order_id`
- If order cancelled, admin can manually restore capacity
- Future: automated capacity restoration on cancellation

### Error Handling

**Common Errors:**
- `400 Bad Request` - Invalid input (date format, negative quantity)
- `404 Not Found` - Resource or hold not found
- `409 Conflict` - Insufficient capacity or blackout period
- `429 Too Many Requests` - Rate limit exceeded
- `500 Internal Server Error` - Database error or lock timeout

**Retry Strategy:**
- Idempotent operations (hold creation, confirmation) safe to retry
- Advisory lock timeout: retry with exponential backoff
- Network errors: retry up to 3 times

### Performance Optimizations

**Database:**
- Partial index: `WHERE available_capacity > 0` (faster availability queries)
- GIN index on `dates[]` array column (fast date range queries)
- Connection pooling (max 20 connections)

**Application:**
- Cache resource metadata (rarely changes)
- Batch capacity queries for date ranges
- Minimize lock hold time (<100ms)

**Future Enhancements:**
- Redis cache for availability checks
- Read replicas for reporting queries
- Database partitioning by date (for very large datasets)

### Security Considerations

**Store API:**
- Rate limiting: 100 req/min per IP for availability, 10 req/min for holds
- No authentication (email-based tracking)
- CORS restricted to storefront domain

**Admin API:**
- JWT authentication required
- Role-based access control
- Audit logging for all mutations

**Data Protection:**
- Customer emails hashed in logs
- PII retention: 30 days for holds, indefinite for allocations (linked to orders)
- GDPR compliance: customer can request data deletion

### Testing Requirements

**Unit Tests:**
- Service layer: >90% coverage
- Critical paths (holds, capacity): 100% coverage

**Integration Tests:**
- Full hold lifecycle (create → confirm)
- Hold lifecycle (create → expire)
- Concurrent booking scenarios

**Load Tests:**
- 100 concurrent users
- Mixed workload (availability, holds, confirmations)
- Sustain for 10 minutes
- Target: <1% error rate, <300ms p95 latency

### Monitoring & Alerting

**Key Metrics:**
- Hold expiration rate (alert if >30%)
- API latency (alert if p95 >500ms)
- Failed hold creation rate (alert if >5%)
- Database connection pool usage (alert if >90%)
- Active holds count (alert if >1000)

**Dashboards:**
- Real-time capacity utilization
- Hold funnel (created → confirmed → expired)
- Resource popularity (bookings per resource)
- Revenue projection based on allocations

---

## Implementation Phases

### Phase 1: Core Booking (MVP)
- ✅ Database schema
- ✅ Resource and capacity management
- ✅ Hold creation and confirmation
- ✅ Basic concurrency control
- ✅ Store API endpoints

**Timeline:** 2 weeks

### Phase 2: Admin & Automation
- ✅ Admin API endpoints
- ✅ Automated cleanup job
- ✅ Blackout periods
- ✅ Capacity reports

**Timeline:** 1 week

### Phase 3: Integration & Testing
- ✅ Medusa checkout integration
- ✅ Storefront calendar component
- ✅ Load testing
- ✅ Documentation

**Timeline:** 1 week

### Phase 4: Production Deployment
- ✅ Monitoring setup
- ✅ Production seeding
- ✅ Smoke tests
- ✅ Go-live

**Timeline:** 3 days

### Future Enhancements (Post-MVP)
- [ ] Redis caching for availability
- [ ] Waiting list for fully-booked dates
- [ ] Dynamic pricing based on demand
- [ ] Multi-resource bookings (package deals)
- [ ] Email reminders for upcoming bookings
- [ ] Mobile app integration
- [ ] Analytics dashboard

---

## Risks & Mitigations

### Risk 1: Database Lock Contention
**Impact:** High - Could prevent bookings
**Likelihood:** Medium - High traffic dates
**Mitigation:**
- Advisory locks are date-specific (distributes contention)
- Lock timeout with retry logic
- Monitor lock wait times

### Risk 2: Hold Expiration During Checkout
**Impact:** Medium - Poor customer experience
**Likelihood:** Medium - Slow payment processing
**Mitigation:**
- Display prominent countdown timer
- Allow hold extension (optional feature)
- Optimize checkout flow to minimize time

### Risk 3: Data Inconsistency
**Impact:** Critical - Overbooking or lost revenue
**Likelihood:** Low - Protected by constraints and locks
**Mitigation:**
- Database constraints (capacity >= 0)
- Two-layer locking mechanism
- Comprehensive testing
- Database backups

### Risk 4: Performance Degradation
**Impact:** High - Slow API = lost bookings
**Likelihood:** Low - Well-optimized queries
**Mitigation:**
- Load testing before launch
- Database indexes optimized
- Connection pooling
- Monitoring and alerting

---

## Dependencies

**External:**
- Medusa.js v2.11.3+
- PostgreSQL 12+
- Node.js 18+

**Internal:**
- Medusa checkout workflow
- Medusa product catalog
- Medusa order management

**Optional:**
- Redis (for caching)
- Sentry (for error tracking)
- Datadog (for monitoring)

---

## Success Criteria

**Launch Criteria:**
- ✅ All acceptance criteria met
- ✅ Load test passed (100 concurrent users, <300ms p95)
- ✅ Zero double-bookings in staging
- ✅ Integration tests passing
- ✅ Documentation complete
- ✅ Team trained

**Post-Launch (30 days):**
- Overbooking rate: <0.001%
- Hold expiration rate: <20%
- API p95 latency: <300ms
- Conversion rate (holds → confirmed): >80%
- Zero critical bugs
- Customer satisfaction: >4.5/5

---

## Appendix

### Glossary

- **Resource:** A bookable item (vehicle, tour, guide)
- **Capacity:** Number of units available per resource per date
- **Hold:** Temporary 30-minute reservation
- **Allocation:** Permanent booking linked to order
- **Blackout:** Period when resource is unavailable
- **Idempotency Token:** UUID to prevent duplicate operations
- **Advisory Lock:** PostgreSQL locking mechanism for concurrency control

### Related Documents

- [Architecture](./ARCHITECTURE.md) - System design details
- [API Reference](../../src/modules/resource-booking/API_REFERENCE.md) - API documentation
- [Database Schema](../../src/modules/resource-booking/SCHEMA.md) - Schema details
- [Testing Guide](./TESTING.md) - Test strategy
- [Deployment Guide](./DEPLOYMENT.md) - Production deployment

### Contact

**Product Owner:** Med USA 4WD Team
**Tech Lead:** Development Team
**Support:** support@medusa4wd.com

**Document Version:** 1.0
**Last Updated:** 2025-01-08
**Status:** ✅ Approved for Implementation
