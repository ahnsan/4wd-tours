# Resource Booking API Reference

Complete API documentation for the Resource Booking module with request/response examples.

## Table of Contents

- [Store API](#store-api)
  - [Check Availability](#check-availability)
  - [Create Hold](#create-hold)
  - [Get Hold](#get-hold)
  - [Confirm Hold](#confirm-hold)
  - [Release Hold](#release-hold)
- [Admin API](#admin-api)
  - [Resources](#resources)
  - [Capacity Management](#capacity-management)
  - [Blackouts](#blackouts)
  - [Reports](#reports)

---

## Store API

Customer-facing endpoints for checking availability and managing holds.

### Check Availability

Check if a resource has available capacity for specific dates.

**Endpoint:** `GET /store/resource-booking/availability`

**Authentication:** None required

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `resource_id` | string (UUID) | Yes | Resource identifier (starts with `res_`) |
| `start_date` | string | Yes | Start date in YYYY-MM-DD format (Australia/Brisbane timezone) |
| `end_date` | string | Yes | End date in YYYY-MM-DD format (inclusive) |
| `quantity` | integer | No | Number of units needed (default: 1, min: 1, max: 100) |

**Example Request:**

```bash
curl -X GET "http://localhost:9000/store/resource-booking/availability?resource_id=res_01JCEXAMPLE&start_date=2025-01-15&end_date=2025-01-17&quantity=2" \
  -H "Content-Type: application/json"
```

**Success Response:** `200 OK`

```json
{
  "available_dates": [
    {
      "date": "2025-01-15",
      "max_capacity": 5,
      "available_capacity": 3,
      "is_available": true
    },
    {
      "date": "2025-01-16",
      "max_capacity": 5,
      "available_capacity": 1,
      "is_available": false
    },
    {
      "date": "2025-01-17",
      "max_capacity": 5,
      "available_capacity": 4,
      "is_available": true
    }
  ],
  "all_dates_available": false,
  "resource": {
    "id": "res_01JCEXAMPLE",
    "name": "Fraser Island 4WD Tour",
    "type": "TOUR"
  }
}
```

**Error Responses:**

```json
// 400 Bad Request - Invalid date format
{
  "type": "invalid_data",
  "message": "Invalid date format. Expected YYYY-MM-DD"
}

// 400 Bad Request - Start date after end date
{
  "type": "invalid_data",
  "message": "start_date must be before or equal to end_date"
}

// 400 Bad Request - Date range too large
{
  "type": "invalid_data",
  "message": "Date range cannot exceed 365 days"
}

// 404 Not Found - Resource not found
{
  "type": "not_found",
  "message": "Resource with id res_01JCEXAMPLE not found"
}
```

---

### Create Hold

Create a temporary 30-minute hold on resource capacity.

**Endpoint:** `POST /store/resource-booking/holds`

**Authentication:** None required (customer email tracked)

**Request Body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `resource_id` | string (UUID) | Yes | Resource to book |
| `dates` | string[] | Yes | Array of dates (YYYY-MM-DD) to hold |
| `quantity` | integer | Yes | Number of units to hold (min: 1) |
| `customer_email` | string (email) | Yes | Customer's email address |
| `idempotency_token` | string (UUID) | Yes | Unique token to prevent duplicate holds |
| `metadata` | object | No | Additional metadata (e.g., tour type, vehicle preference) |

**Example Request:**

```bash
curl -X POST "http://localhost:9000/store/resource-booking/holds" \
  -H "Content-Type: application/json" \
  -d '{
    "resource_id": "res_01JCEXAMPLE",
    "dates": ["2025-01-15", "2025-01-17"],
    "quantity": 2,
    "customer_email": "customer@example.com",
    "idempotency_token": "550e8400-e29b-41d4-a716-446655440000",
    "metadata": {
      "tour_type": "private",
      "special_requests": "Prefer morning departure"
    }
  }'
```

**Success Response:** `201 Created`

```json
{
  "hold": {
    "id": "hold_01JCEXAMPLE",
    "resource_id": "res_01JCEXAMPLE",
    "dates": ["2025-01-15", "2025-01-17"],
    "quantity": 2,
    "customer_email": "customer@example.com",
    "status": "ACTIVE",
    "idempotency_token": "550e8400-e29b-41d4-a716-446655440000",
    "expires_at": "2025-01-15T10:30:00.000Z",
    "created_at": "2025-01-15T10:00:00.000Z",
    "metadata": {
      "tour_type": "private",
      "special_requests": "Prefer morning departure"
    }
  },
  "time_remaining_seconds": 1800
}
```

**Idempotency:** If the same `idempotency_token` is sent within 24 hours, returns existing hold with `200 OK`:

```json
{
  "hold": { /* existing hold */ },
  "time_remaining_seconds": 1234,
  "idempotent_replay": true
}
```

**Error Responses:**

```json
// 400 Bad Request - Insufficient capacity
{
  "type": "invalid_data",
  "message": "Insufficient capacity for dates: 2025-01-16",
  "details": {
    "unavailable_dates": [
      {
        "date": "2025-01-16",
        "requested": 2,
        "available": 1
      }
    ]
  }
}

// 400 Bad Request - Invalid date format
{
  "type": "invalid_data",
  "message": "Invalid date format in dates array. Expected YYYY-MM-DD"
}

// 400 Bad Request - Past dates
{
  "type": "invalid_data",
  "message": "Cannot create hold for past dates"
}

// 409 Conflict - Blackout period
{
  "type": "conflict",
  "message": "Resource unavailable during blackout period",
  "details": {
    "blackout": {
      "id": "blackout_01JCEXAMPLE",
      "start_date": "2025-01-15",
      "end_date": "2025-01-20",
      "reason": "Maintenance"
    }
  }
}

// 429 Too Many Requests - Rate limited
{
  "type": "too_many_requests",
  "message": "Too many hold requests. Please try again in 60 seconds"
}

// 500 Internal Server Error - Lock timeout
{
  "type": "internal_error",
  "message": "Could not acquire lock. Please retry"
}
```

---

### Get Hold

Retrieve hold details by ID.

**Endpoint:** `GET /store/resource-booking/holds/:id`

**Authentication:** None required (validates customer_email if provided)

**Path Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | string (UUID) | Yes | Hold ID |

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `customer_email` | string (email) | No | Validates requester is hold owner |

**Example Request:**

```bash
curl -X GET "http://localhost:9000/store/resource-booking/holds/hold_01JCEXAMPLE?customer_email=customer@example.com" \
  -H "Content-Type: application/json"
```

**Success Response:** `200 OK`

```json
{
  "hold": {
    "id": "hold_01JCEXAMPLE",
    "resource_id": "res_01JCEXAMPLE",
    "dates": ["2025-01-15", "2025-01-17"],
    "quantity": 2,
    "customer_email": "customer@example.com",
    "status": "ACTIVE",
    "expires_at": "2025-01-15T10:30:00.000Z",
    "created_at": "2025-01-15T10:00:00.000Z",
    "updated_at": "2025-01-15T10:00:00.000Z"
  },
  "time_remaining_seconds": 1234,
  "is_expired": false
}
```

**Error Responses:**

```json
// 404 Not Found
{
  "type": "not_found",
  "message": "Hold with id hold_01JCEXAMPLE not found"
}

// 403 Forbidden - Email mismatch
{
  "type": "forbidden",
  "message": "Cannot access hold for different customer"
}
```

---

### Confirm Hold

Convert hold to permanent allocation after successful checkout.

**Endpoint:** `POST /store/resource-booking/holds/:id/confirm`

**Authentication:** Required (system or authenticated customer)

**Path Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | string (UUID) | Yes | Hold ID |

**Request Body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `order_id` | string (UUID) | Yes | Order ID from Medusa |
| `line_item_id` | string (UUID) | Yes | Line item ID from order |

**Example Request:**

```bash
curl -X POST "http://localhost:9000/store/resource-booking/holds/hold_01JCEXAMPLE/confirm" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "order_id": "order_01JCEXAMPLE",
    "line_item_id": "item_01JCEXAMPLE"
  }'
```

**Success Response:** `200 OK`

```json
{
  "allocation": {
    "id": "alloc_01JCEXAMPLE",
    "resource_id": "res_01JCEXAMPLE",
    "order_id": "order_01JCEXAMPLE",
    "line_item_id": "item_01JCEXAMPLE",
    "dates": ["2025-01-15", "2025-01-17"],
    "quantity": 2,
    "status": "CONFIRMED",
    "created_at": "2025-01-15T10:15:00.000Z"
  },
  "hold": {
    "id": "hold_01JCEXAMPLE",
    "status": "CONFIRMED",
    "confirmed_at": "2025-01-15T10:15:00.000Z"
  }
}
```

**Error Responses:**

```json
// 400 Bad Request - Hold expired
{
  "type": "invalid_data",
  "message": "Hold has expired. Please create a new hold"
}

// 400 Bad Request - Hold already confirmed
{
  "type": "invalid_data",
  "message": "Hold already confirmed"
}

// 404 Not Found
{
  "type": "not_found",
  "message": "Hold with id hold_01JCEXAMPLE not found"
}

// 409 Conflict - Order already has allocation
{
  "type": "conflict",
  "message": "Order already has an allocation for this resource"
}
```

---

### Release Hold

Release hold and return capacity to pool.

**Endpoint:** `DELETE /store/resource-booking/holds/:id`

**Authentication:** None required (validates customer_email)

**Path Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | string (UUID) | Yes | Hold ID |

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `customer_email` | string (email) | Yes | Must match hold owner |

**Example Request:**

```bash
curl -X DELETE "http://localhost:9000/store/resource-booking/holds/hold_01JCEXAMPLE?customer_email=customer@example.com" \
  -H "Content-Type: application/json"
```

**Success Response:** `200 OK`

```json
{
  "hold": {
    "id": "hold_01JCEXAMPLE",
    "status": "RELEASED",
    "released_at": "2025-01-15T10:05:00.000Z"
  },
  "capacity_returned": true,
  "dates_released": ["2025-01-15", "2025-01-17"]
}
```

**Error Responses:**

```json
// 400 Bad Request - Hold already released
{
  "type": "invalid_data",
  "message": "Hold is already released or confirmed"
}

// 403 Forbidden
{
  "type": "forbidden",
  "message": "Cannot release hold for different customer"
}

// 404 Not Found
{
  "type": "not_found",
  "message": "Hold with id hold_01JCEXAMPLE not found"
}
```

---

## Admin API

Administrative endpoints for managing resources, capacity, and blackouts.

### Resources

#### Create Resource

**Endpoint:** `POST /admin/resource-booking/resources`

**Authentication:** Required (Admin JWT)

**Request Body:**

```json
{
  "type": "VEHICLE",
  "name": "Fraser Island 4WD - Vehicle 1",
  "description": "Toyota Land Cruiser 200 Series for Fraser Island tours",
  "metadata": {
    "license_plate": "ABC123",
    "seats": 7,
    "year": 2023,
    "features": ["Air conditioning", "GPS", "First aid kit"]
  },
  "is_active": true
}
```

**Response:** `201 Created`

```json
{
  "resource": {
    "id": "res_01JCEXAMPLE",
    "type": "VEHICLE",
    "name": "Fraser Island 4WD - Vehicle 1",
    "description": "Toyota Land Cruiser 200 Series for Fraser Island tours",
    "metadata": {
      "license_plate": "ABC123",
      "seats": 7,
      "year": 2023,
      "features": ["Air conditioning", "GPS", "First aid kit"]
    },
    "is_active": true,
    "created_at": "2025-01-15T10:00:00.000Z",
    "updated_at": "2025-01-15T10:00:00.000Z"
  }
}
```

#### List Resources

**Endpoint:** `GET /admin/resource-booking/resources`

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `type` | string | Filter by resource type (VEHICLE, TOUR, GUIDE) |
| `is_active` | boolean | Filter by active status |
| `limit` | integer | Results per page (default: 20, max: 100) |
| `offset` | integer | Pagination offset |
| `q` | string | Search by name or description |

**Example Request:**

```bash
curl -X GET "http://localhost:9000/admin/resource-booking/resources?type=VEHICLE&is_active=true&limit=10" \
  -H "Authorization: Bearer <admin_token>"
```

**Response:** `200 OK`

```json
{
  "resources": [
    {
      "id": "res_01JCEXAMPLE",
      "type": "VEHICLE",
      "name": "Fraser Island 4WD - Vehicle 1",
      "is_active": true,
      "created_at": "2025-01-15T10:00:00.000Z"
    }
  ],
  "count": 5,
  "offset": 0,
  "limit": 10
}
```

#### Get Resource

**Endpoint:** `GET /admin/resource-booking/resources/:id`

**Response:** `200 OK`

```json
{
  "resource": {
    "id": "res_01JCEXAMPLE",
    "type": "VEHICLE",
    "name": "Fraser Island 4WD - Vehicle 1",
    "description": "Toyota Land Cruiser 200 Series",
    "metadata": { /* ... */ },
    "is_active": true,
    "created_at": "2025-01-15T10:00:00.000Z",
    "updated_at": "2025-01-15T10:00:00.000Z"
  },
  "stats": {
    "total_allocations": 45,
    "upcoming_bookings": 12,
    "capacity_utilization": 0.75
  }
}
```

#### Update Resource

**Endpoint:** `PUT /admin/resource-booking/resources/:id`

**Request Body:**

```json
{
  "name": "Fraser Island 4WD - Vehicle 1 (Updated)",
  "is_active": false,
  "metadata": {
    "license_plate": "XYZ789",
    "notes": "Under maintenance"
  }
}
```

**Response:** `200 OK`

#### Delete Resource

**Endpoint:** `DELETE /admin/resource-booking/resources/:id`

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `force` | boolean | Force delete even with existing bookings (default: false) |

**Response:** `200 OK`

```json
{
  "id": "res_01JCEXAMPLE",
  "deleted": true,
  "warning": "Resource had 3 upcoming bookings that were cancelled"
}
```

---

### Capacity Management

#### Initialize Capacity

Set up capacity for a date range.

**Endpoint:** `POST /admin/resource-booking/capacity/initialize`

**Request Body:**

```json
{
  "resource_id": "res_01JCEXAMPLE",
  "start_date": "2025-01-01",
  "end_date": "2025-12-31",
  "daily_capacity": 1,
  "skip_existing": true
}
```

**Response:** `201 Created`

```json
{
  "capacity_records_created": 365,
  "date_range": {
    "start_date": "2025-01-01",
    "end_date": "2025-12-31"
  },
  "daily_capacity": 1,
  "skipped_existing": 0
}
```

#### Get Capacity Report

**Endpoint:** `GET /admin/resource-booking/capacity/report`

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `resource_id` | string (UUID) | Yes | Resource to report on |
| `start_date` | string | Yes | Report start date |
| `end_date` | string | Yes | Report end date |
| `group_by` | string | No | Group by day/week/month (default: day) |

**Example Request:**

```bash
curl -X GET "http://localhost:9000/admin/resource-booking/capacity/report?resource_id=res_01JCEXAMPLE&start_date=2025-01-01&end_date=2025-01-31" \
  -H "Authorization: Bearer <admin_token>"
```

**Response:** `200 OK`

```json
{
  "resource": {
    "id": "res_01JCEXAMPLE",
    "name": "Fraser Island 4WD - Vehicle 1"
  },
  "date_range": {
    "start_date": "2025-01-01",
    "end_date": "2025-01-31"
  },
  "summary": {
    "total_capacity": 31,
    "total_allocated": 18,
    "total_on_hold": 3,
    "total_available": 10,
    "utilization_rate": 0.58
  },
  "daily_breakdown": [
    {
      "date": "2025-01-01",
      "max_capacity": 1,
      "allocated": 1,
      "on_hold": 0,
      "available": 0,
      "utilization": 1.0
    },
    {
      "date": "2025-01-02",
      "max_capacity": 1,
      "allocated": 0,
      "on_hold": 1,
      "available": 0,
      "utilization": 0.0
    }
  ]
}
```

#### Adjust Capacity

**Endpoint:** `POST /admin/resource-booking/capacity/adjust`

**Request Body:**

```json
{
  "resource_id": "res_01JCEXAMPLE",
  "dates": ["2025-01-15", "2025-01-16"],
  "adjustment": -1,
  "reason": "Maintenance scheduled"
}
```

**Response:** `200 OK`

```json
{
  "adjusted_dates": ["2025-01-15", "2025-01-16"],
  "adjustment": -1,
  "new_capacities": [
    { "date": "2025-01-15", "max_capacity": 0, "available_capacity": 0 },
    { "date": "2025-01-16", "max_capacity": 0, "available_capacity": 0 }
  ]
}
```

---

### Blackouts

#### Create Blackout

**Endpoint:** `POST /admin/resource-booking/blackouts`

**Request Body:**

```json
{
  "resource_id": "res_01JCEXAMPLE",
  "start_date": "2025-02-01",
  "end_date": "2025-02-05",
  "reason": "Annual maintenance and inspection",
  "cancel_existing_holds": true
}
```

**Response:** `201 Created`

```json
{
  "blackout": {
    "id": "blackout_01JCEXAMPLE",
    "resource_id": "res_01JCEXAMPLE",
    "start_date": "2025-02-01",
    "end_date": "2025-02-05",
    "reason": "Annual maintenance and inspection",
    "created_at": "2025-01-15T10:00:00.000Z"
  },
  "holds_cancelled": 2,
  "allocations_affected": 0
}
```

#### List Blackouts

**Endpoint:** `GET /admin/resource-booking/blackouts`

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `resource_id` | string (UUID) | Filter by resource |
| `start_date` | string | Filter blackouts after this date |
| `end_date` | string | Filter blackouts before this date |

**Response:** `200 OK`

```json
{
  "blackouts": [
    {
      "id": "blackout_01JCEXAMPLE",
      "resource_id": "res_01JCEXAMPLE",
      "start_date": "2025-02-01",
      "end_date": "2025-02-05",
      "reason": "Annual maintenance",
      "created_at": "2025-01-15T10:00:00.000Z"
    }
  ],
  "count": 3
}
```

#### Delete Blackout

**Endpoint:** `DELETE /admin/resource-booking/blackouts/:id`

**Response:** `200 OK`

```json
{
  "id": "blackout_01JCEXAMPLE",
  "deleted": true,
  "capacity_restored": true
}
```

---

### Reports

#### Allocation Report

**Endpoint:** `GET /admin/resource-booking/reports/allocations`

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `resource_id` | string (UUID) | Filter by resource |
| `start_date` | string | Allocations on/after this date |
| `end_date` | string | Allocations on/before this date |
| `order_id` | string (UUID) | Filter by order |

**Response:** `200 OK`

```json
{
  "allocations": [
    {
      "id": "alloc_01JCEXAMPLE",
      "resource": {
        "id": "res_01JCEXAMPLE",
        "name": "Fraser Island 4WD - Vehicle 1"
      },
      "order_id": "order_01JCEXAMPLE",
      "customer_email": "customer@example.com",
      "dates": ["2025-01-15", "2025-01-17"],
      "quantity": 2,
      "created_at": "2025-01-15T10:15:00.000Z"
    }
  ],
  "count": 45,
  "total_quantity": 87
}
```

#### Hold Expiration Report

**Endpoint:** `GET /admin/resource-booking/reports/hold-expirations`

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `date` | string | Date to analyze (default: today) |
| `resource_id` | string (UUID) | Filter by resource |

**Response:** `200 OK`

```json
{
  "date": "2025-01-15",
  "summary": {
    "total_holds_created": 50,
    "expired_before_confirmation": 8,
    "confirmed": 40,
    "manually_released": 2,
    "expiration_rate": 0.16
  },
  "resource_breakdown": [
    {
      "resource_id": "res_01JCEXAMPLE",
      "resource_name": "Fraser Island 4WD - Vehicle 1",
      "holds_created": 12,
      "expired": 2,
      "confirmed": 9,
      "released": 1
    }
  ]
}
```

---

## Error Handling

All API endpoints follow consistent error response format:

```json
{
  "type": "error_type",
  "message": "Human-readable error message",
  "details": {
    // Additional context (optional)
  }
}
```

### Error Types

| Type | HTTP Status | Description |
|------|-------------|-------------|
| `invalid_data` | 400 | Validation error or bad request |
| `unauthorized` | 401 | Authentication required |
| `forbidden` | 403 | Insufficient permissions |
| `not_found` | 404 | Resource not found |
| `conflict` | 409 | Conflicting state (e.g., blackout period) |
| `too_many_requests` | 429 | Rate limit exceeded |
| `internal_error` | 500 | Server error |

---

## Rate Limiting

Store API endpoints are rate-limited to prevent abuse:

- **Availability checks:** 100 requests/minute per IP
- **Hold creation:** 10 requests/minute per email
- **Hold operations:** 20 requests/minute per email

Admin API uses token-based rate limiting (1000 requests/hour).

---

## Webhooks

Subscribe to events:

- `resource_booking.hold.created`
- `resource_booking.hold.confirmed`
- `resource_booking.hold.expired`
- `resource_booking.hold.released`
- `resource_booking.allocation.created`
- `resource_booking.capacity.depleted`

Configure webhooks in Medusa admin panel.

---

## Postman Collection

Import pre-configured API collection:

```bash
curl -o resource-booking.postman.json \
  https://raw.githubusercontent.com/your-org/med-usa-4wd/main/docs/resource-booking/postman-collection.json
```

---

## SDK Examples

### JavaScript/TypeScript

```typescript
import { ResourceBookingClient } from '@medusa-booking/client';

const client = new ResourceBookingClient({
  baseUrl: 'http://localhost:9000'
});

// Check availability
const availability = await client.checkAvailability({
  resource_id: 'res_01JCEXAMPLE',
  start_date: '2025-01-15',
  end_date: '2025-01-17',
  quantity: 2
});

// Create hold
const hold = await client.createHold({
  resource_id: 'res_01JCEXAMPLE',
  dates: ['2025-01-15', '2025-01-17'],
  quantity: 2,
  customer_email: 'customer@example.com',
  idempotency_token: crypto.randomUUID()
});
```

---

## Next Steps

- [Integration Guide](../../docs/resource-booking/INTEGRATION.md) - Integrate with your checkout flow
- [Examples](../../docs/resource-booking/EXAMPLES.md) - Practical code examples
- [Testing Guide](../../docs/resource-booking/TESTING.md) - Test your integration
