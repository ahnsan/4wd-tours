# Resource Booking Usage Examples

Practical integration examples for common use cases.

## Table of Contents

- [Example 1: Basic Tour Booking Flow](#example-1-basic-tour-booking-flow)
- [Example 2: Vehicle Rental with Multi-Day Booking](#example-2-vehicle-rental-with-multi-day-booking)
- [Example 3: Admin Setup - New Tour Resource](#example-3-admin-setup---new-tour-resource)
- [Example 4: Handling Expired Holds](#example-4-handling-expired-holds)
- [Example 5: Concurrent Booking Prevention](#example-5-concurrent-booking-prevention)
- [Example 6: Blackout Period Management](#example-6-blackout-period-management)
- [Example 7: Capacity Report Generation](#example-7-capacity-report-generation)
- [Example 8: Order Cancellation with Capacity Restoration](#example-8-order-cancellation-with-capacity-restoration)
- [Example 9: Real-time Availability Calendar](#example-9-real-time-availability-calendar)
- [Example 10: Integration with Medusa Checkout](#example-10-integration-with-medusa-checkout)

---

## Example 1: Basic Tour Booking Flow

Complete customer journey from browsing to confirmed booking.

### Frontend Component (React)

```typescript
import { useState, useEffect } from 'react';

interface BookingFlowProps {
  tourId: string;
  tourName: string;
  selectedDate: string;
  quantity: number;
}

export function TourBookingFlow({
  tourId,
  tourName,
  selectedDate,
  quantity
}: BookingFlowProps) {
  const [isAvailable, setIsAvailable] = useState<boolean>(false);
  const [hold, setHold] = useState<any>(null);
  const [timeRemaining, setTimeRemaining] = useState<number>(1800);
  const [loading, setLoading] = useState<boolean>(false);

  // Step 1: Check availability
  useEffect(() => {
    async function checkAvailability() {
      setLoading(true);
      try {
        const response = await fetch(
          `/store/resource-booking/availability?` +
          new URLSearchParams({
            resource_id: tourId,
            start_date: selectedDate,
            end_date: selectedDate,
            quantity: quantity.toString()
          })
        );

        const data = await response.json();
        const dateAvailable = data.available_dates[0]?.is_available || false;
        setIsAvailable(dateAvailable);
      } catch (error) {
        console.error('Failed to check availability:', error);
      } finally {
        setLoading(false);
      }
    }

    checkAvailability();
  }, [tourId, selectedDate, quantity]);

  // Step 2: Create hold when customer clicks "Book Now"
  async function createHold(customerEmail: string) {
    setLoading(true);
    try {
      const idempotencyToken = crypto.randomUUID();

      const response = await fetch('/store/resource-booking/holds', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resource_id: tourId,
          dates: [selectedDate],
          quantity,
          customer_email: customerEmail,
          idempotency_token: idempotencyToken,
          metadata: {
            tour_name: tourName,
            booking_source: 'website'
          }
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message);
      }

      const { hold: holdData, time_remaining_seconds } = await response.json();
      setHold(holdData);
      setTimeRemaining(time_remaining_seconds);

      // Store hold ID in session for checkout
      sessionStorage.setItem('booking_hold_id', holdData.id);
      sessionStorage.setItem('idempotency_token', idempotencyToken);

      return holdData;
    } catch (error) {
      console.error('Failed to create hold:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }

  // Step 3: Countdown timer
  useEffect(() => {
    if (!hold || hold.status !== 'ACTIVE') return;

    const interval = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          alert('Your hold has expired. Please try booking again.');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [hold]);

  // Format time remaining
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="tour-booking-flow">
      <h2>{tourName}</h2>
      <p>Date: {selectedDate}</p>
      <p>Quantity: {quantity}</p>

      {loading && <p>Loading...</p>}

      {!loading && !hold && (
        <>
          {isAvailable ? (
            <button onClick={() => {
              const email = prompt('Enter your email:');
              if (email) createHold(email);
            }}>
              Book Now
            </button>
          ) : (
            <p className="text-red-600">
              This date is fully booked. Please select another date.
            </p>
          )}
        </>
      )}

      {hold && hold.status === 'ACTIVE' && (
        <div className="hold-active">
          <p className="text-green-600">
            Your booking is reserved!
          </p>
          <p className="text-lg font-bold">
            Time remaining: {formatTime(timeRemaining)}
          </p>
          <button onClick={() => window.location.href = '/checkout'}>
            Proceed to Checkout
          </button>
          <button onClick={() => releaseHold(hold.id)}>
            Cancel Reservation
          </button>
        </div>
      )}
    </div>
  );
}

// Release hold if customer cancels
async function releaseHold(holdId: string) {
  const email = sessionStorage.getItem('customer_email');

  await fetch(`/store/resource-booking/holds/${holdId}?customer_email=${email}`, {
    method: 'DELETE'
  });

  sessionStorage.removeItem('booking_hold_id');
  window.location.reload();
}
```

### Backend: Confirm Hold After Checkout

```typescript
// src/workflows/order-placed.ts
import { createWorkflow, WorkflowResponse } from '@medusajs/workflows-sdk';

export const orderPlacedWorkflow = createWorkflow(
  'order-placed',
  async (input: { order_id: string }) => {
    const { order_id } = input;

    // Get hold ID from order metadata
    const order = await orderService.retrieve(order_id);
    const holdId = order.metadata?.booking_hold_id;

    if (holdId) {
      // Find line item with tour/resource
      const tourLineItem = order.items.find(
        item => item.metadata?.resource_id
      );

      if (tourLineItem) {
        // Confirm hold and create allocation
        await fetch(`${process.env.MEDUSA_BACKEND_URL}/store/resource-booking/holds/${holdId}/confirm`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            order_id: order.id,
            line_item_id: tourLineItem.id
          })
        });
      }
    }

    return new WorkflowResponse({ success: true });
  }
);
```

---

## Example 2: Vehicle Rental with Multi-Day Booking

Booking a 4WD vehicle for multiple consecutive days.

```typescript
async function bookVehicleForTrip(
  vehicleId: string,
  startDate: string,
  endDate: string,
  customerEmail: string
) {
  // Step 1: Generate array of dates
  const dates = generateDateRange(startDate, endDate);
  console.log('Booking dates:', dates);
  // ['2025-01-15', '2025-01-16', '2025-01-17']

  // Step 2: Check availability for all dates
  const availabilityResponse = await fetch(
    `/store/resource-booking/availability?` +
    new URLSearchParams({
      resource_id: vehicleId,
      start_date: startDate,
      end_date: endDate,
      quantity: '1'
    })
  );

  const { available_dates, all_dates_available } = await availabilityResponse.json();

  if (!all_dates_available) {
    const unavailableDates = available_dates
      .filter(d => !d.is_available)
      .map(d => d.date);

    throw new Error(
      `Vehicle not available on: ${unavailableDates.join(', ')}`
    );
  }

  // Step 3: Create hold for all dates
  const hold = await fetch('/store/resource-booking/holds', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      resource_id: vehicleId,
      dates: dates,
      quantity: 1,
      customer_email: customerEmail,
      idempotency_token: crypto.randomUUID(),
      metadata: {
        rental_type: 'multi_day',
        duration_days: dates.length,
        pickup_location: 'Rainbow Beach',
        return_location: 'Rainbow Beach'
      }
    })
  });

  const { hold: holdData } = await hold.json();

  return {
    holdId: holdData.id,
    dates: dates,
    expiresAt: holdData.expires_at,
    totalDays: dates.length
  };
}

// Helper: Generate date range
function generateDateRange(startDate: string, endDate: string): string[] {
  const dates: string[] = [];
  const current = new Date(startDate);
  const end = new Date(endDate);

  while (current <= end) {
    dates.push(current.toISOString().split('T')[0]);
    current.setDate(current.getDate() + 1);
  }

  return dates;
}

// Usage
const booking = await bookVehicleForTrip(
  'res_vehicle_landcruiser_1',
  '2025-01-15',
  '2025-01-17',
  'customer@example.com'
);

console.log(`Booked vehicle for ${booking.totalDays} days`);
console.log(`Hold expires at: ${booking.expiresAt}`);
```

---

## Example 3: Admin Setup - New Tour Resource

Complete setup for a new tour with capacity initialization.

```typescript
// Admin script to set up new tour
async function setupNewTour(adminToken: string) {
  const baseURL = 'http://localhost:9000';

  // Step 1: Create resource
  const createResourceResponse = await fetch(
    `${baseURL}/admin/resource-booking/resources`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        type: 'TOUR',
        name: 'Fraser Island 1-Day 4WD Tour',
        description: 'Experience the beauty of Fraser Island with expert guides',
        metadata: {
          duration_hours: 8,
          difficulty: 'moderate',
          min_age: 12,
          max_participants: 8,
          included: ['Lunch', 'Equipment', 'Guide', 'Park Fees'],
          meeting_point: 'Rainbow Beach Visitor Center',
          meeting_time: '07:00 AM',
          highlights: [
            'Lake McKenzie',
            'Maheno Shipwreck',
            '75 Mile Beach',
            'Eli Creek'
          ]
        },
        is_active: true
      })
    }
  );

  const { resource } = await createResourceResponse.json();
  console.log('Created resource:', resource.id);

  // Step 2: Initialize capacity for next 6 months
  const today = new Date();
  const sixMonthsLater = new Date();
  sixMonthsLater.setMonth(today.getMonth() + 6);

  const initCapacityResponse = await fetch(
    `${baseURL}/admin/resource-booking/capacity/initialize`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        resource_id: resource.id,
        start_date: today.toISOString().split('T')[0],
        end_date: sixMonthsLater.toISOString().split('T')[0],
        daily_capacity: 8, // Max 8 participants per tour
        skip_existing: true
      })
    }
  );

  const { capacity_records_created } = await initCapacityResponse.json();
  console.log(`Initialized capacity for ${capacity_records_created} days`);

  // Step 3: Set up blackout periods (e.g., bad weather season)
  const createBlackoutResponse = await fetch(
    `${baseURL}/admin/resource-booking/blackouts`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        resource_id: resource.id,
        start_date: '2025-12-20',
        end_date: '2025-01-05',
        reason: 'Holiday closure period',
        cancel_existing_holds: true
      })
    }
  );

  const { blackout } = await createBlackoutResponse.json();
  console.log('Created blackout period:', blackout.id);

  return {
    resourceId: resource.id,
    capacityDays: capacity_records_created,
    blackoutId: blackout.id
  };
}

// Run setup
setupNewTour('admin_token_here').then(result => {
  console.log('Tour setup complete:', result);
});
```

---

## Example 4: Handling Expired Holds

Frontend component with auto-refresh logic.

```typescript
import { useState, useEffect, useCallback } from 'react';

export function HoldTimerComponent({ holdId, customerEmail }: {
  holdId: string;
  customerEmail: string;
}) {
  const [hold, setHold] = useState<any>(null);
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [isExpired, setIsExpired] = useState<boolean>(false);

  // Fetch hold status
  const fetchHold = useCallback(async () => {
    try {
      const response = await fetch(
        `/store/resource-booking/holds/${holdId}?customer_email=${customerEmail}`
      );

      if (!response.ok) {
        throw new Error('Hold not found');
      }

      const { hold: holdData, time_remaining_seconds, is_expired } = await response.json();

      setHold(holdData);
      setTimeRemaining(time_remaining_seconds);
      setIsExpired(is_expired);

      return holdData;
    } catch (error) {
      console.error('Failed to fetch hold:', error);
      setIsExpired(true);
    }
  }, [holdId, customerEmail]);

  // Initial fetch
  useEffect(() => {
    fetchHold();
  }, [fetchHold]);

  // Countdown timer with periodic refresh
  useEffect(() => {
    if (isExpired || !hold) return;

    const countdown = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          clearInterval(countdown);
          setIsExpired(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    // Refresh hold status every 30 seconds to catch server-side expiration
    const refreshInterval = setInterval(() => {
      fetchHold();
    }, 30000);

    return () => {
      clearInterval(countdown);
      clearInterval(refreshInterval);
    };
  }, [hold, isExpired, fetchHold]);

  // Auto-extend hold if customer is still active (optional feature)
  async function extendHold() {
    try {
      // Release old hold
      await fetch(
        `/store/resource-booking/holds/${holdId}?customer_email=${customerEmail}`,
        { method: 'DELETE' }
      );

      // Create new hold with same details
      const response = await fetch('/store/resource-booking/holds', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resource_id: hold.resource_id,
          dates: hold.dates,
          quantity: hold.quantity,
          customer_email: customerEmail,
          idempotency_token: crypto.randomUUID()
        })
      });

      const { hold: newHold, time_remaining_seconds } = await response.json();
      setHold(newHold);
      setTimeRemaining(time_remaining_seconds);
      setIsExpired(false);

      // Update session with new hold ID
      sessionStorage.setItem('booking_hold_id', newHold.id);

      return newHold;
    } catch (error) {
      console.error('Failed to extend hold:', error);
      throw error;
    }
  }

  if (isExpired) {
    return (
      <div className="hold-expired bg-red-100 p-4 rounded">
        <h3 className="text-red-800 font-bold">Reservation Expired</h3>
        <p>Your booking reservation has expired. Please start over.</p>
        <button
          onClick={extendHold}
          className="mt-2 bg-blue-600 text-white px-4 py-2 rounded"
        >
          Try to Re-book
        </button>
      </div>
    );
  }

  const minutes = Math.floor(timeRemaining / 60);
  const seconds = timeRemaining % 60;

  return (
    <div className="hold-timer bg-yellow-100 p-4 rounded">
      <h3 className="font-bold">Your Reservation is Active</h3>
      <p className="text-2xl font-mono">
        {minutes}:{seconds.toString().padStart(2, '0')}
      </p>
      <p className="text-sm text-gray-600">
        Complete checkout before time expires
      </p>
      {timeRemaining < 300 && (
        <button
          onClick={extendHold}
          className="mt-2 bg-blue-600 text-white px-3 py-1 rounded text-sm"
        >
          Extend Time
        </button>
      )}
    </div>
  );
}
```

---

## Example 5: Concurrent Booking Prevention

Demonstration of how the system handles concurrent booking attempts.

```typescript
// Simulate concurrent booking attempts
async function simulateConcurrentBookings() {
  const resourceId = 'res_tour_fraser_1day';
  const date = '2025-01-15';
  const customerEmails = [
    'customer1@example.com',
    'customer2@example.com',
    'customer3@example.com'
  ];

  // Assume resource has capacity of 1 for this date

  console.log('Starting concurrent booking simulation...');
  console.log(`Resource: ${resourceId}, Date: ${date}, Available capacity: 1`);

  // All 3 customers try to book at the exact same time
  const bookingPromises = customerEmails.map((email, index) =>
    createHoldWithLogging(resourceId, date, email, index + 1)
  );

  const results = await Promise.allSettled(bookingPromises);

  console.log('\nResults:');
  results.forEach((result, index) => {
    if (result.status === 'fulfilled') {
      console.log(`Customer ${index + 1}: SUCCESS - Hold ID ${result.value.hold.id}`);
    } else {
      console.log(`Customer ${index + 1}: FAILED - ${result.reason}`);
    }
  });
}

async function createHoldWithLogging(
  resourceId: string,
  date: string,
  email: string,
  customerNum: number
): Promise<any> {
  console.log(`[Customer ${customerNum}] Attempting to book...`);

  try {
    const response = await fetch('/store/resource-booking/holds', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        resource_id: resourceId,
        dates: [date],
        quantity: 1,
        customer_email: email,
        idempotency_token: crypto.randomUUID()
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message);
    }

    const data = await response.json();
    console.log(`[Customer ${customerNum}] Hold created successfully`);
    return data;

  } catch (error: any) {
    console.log(`[Customer ${customerNum}] Booking failed: ${error.message}`);
    throw error;
  }
}

// Expected output:
// [Customer 1] Attempting to book...
// [Customer 2] Attempting to book...
// [Customer 3] Attempting to book...
// [Customer 1] Hold created successfully
// [Customer 2] Booking failed: Insufficient capacity for dates: 2025-01-15
// [Customer 3] Booking failed: Insufficient capacity for dates: 2025-01-15
//
// Results:
// Customer 1: SUCCESS - Hold ID hold_abc123
// Customer 2: FAILED - Insufficient capacity for dates: 2025-01-15
// Customer 3: FAILED - Insufficient capacity for dates: 2025-01-15
```

---

## Example 6: Blackout Period Management

Admin workflow for managing resource unavailability.

```typescript
// Admin component for creating blackout periods
async function createMaintenanceBlackout(adminToken: string) {
  const resourceId = 'res_vehicle_landcruiser_1';

  // Step 1: Create blackout period
  const blackoutResponse = await fetch(
    '/admin/resource-booking/blackouts',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        resource_id: resourceId,
        start_date: '2025-02-01',
        end_date: '2025-02-05',
        reason: 'Annual vehicle service and safety inspection',
        cancel_existing_holds: true // Cancel any active holds during this period
      })
    }
  );

  const { blackout, holds_cancelled } = await blackoutResponse.json();

  console.log(`Created blackout: ${blackout.id}`);
  console.log(`Cancelled ${holds_cancelled} active holds`);

  // Step 2: Notify affected customers
  if (holds_cancelled > 0) {
    await notifyCustomersAboutCancellation(resourceId, blackout.start_date, blackout.end_date);
  }

  // Step 3: Adjust capacity to zero for blackout dates
  const dates = generateDateRange(blackout.start_date, blackout.end_date);

  for (const date of dates) {
    await fetch('/admin/resource-booking/capacity/adjust', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        resource_id: resourceId,
        dates: [date],
        adjustment: -999, // Set to zero (effectively)
        reason: `Blackout: ${blackout.reason}`
      })
    });
  }

  return blackout;
}

// Helper: Notify customers about cancellation
async function notifyCustomersAboutCancellation(
  resourceId: string,
  startDate: string,
  endDate: string
) {
  // Get affected allocations
  const response = await fetch(
    `/admin/resource-booking/reports/allocations?` +
    new URLSearchParams({
      resource_id: resourceId,
      start_date: startDate,
      end_date: endDate
    })
  );

  const { allocations } = await response.json();

  // Send emails to affected customers
  for (const allocation of allocations) {
    await sendEmail({
      to: allocation.customer_email,
      subject: 'Booking Cancellation Notice',
      body: `
        Dear Customer,

        We regret to inform you that your booking for ${allocation.resource.name}
        on ${allocation.dates.join(', ')} has been cancelled due to maintenance.

        We apologize for any inconvenience. Please contact us to reschedule.

        Best regards,
        Med USA 4WD Team
      `
    });
  }

  console.log(`Notified ${allocations.length} customers`);
}
```

---

## Example 7: Capacity Report Generation

Generate utilization reports for business analytics.

```typescript
// Generate monthly capacity report
async function generateMonthlyCapacityReport(
  adminToken: string,
  resourceId: string,
  month: string // Format: '2025-01'
) {
  const [year, monthNum] = month.split('-');
  const startDate = `${year}-${monthNum}-01`;
  const endDate = new Date(parseInt(year), parseInt(monthNum), 0)
    .toISOString()
    .split('T')[0]; // Last day of month

  // Fetch capacity report
  const response = await fetch(
    `/admin/resource-booking/capacity/report?` +
    new URLSearchParams({
      resource_id: resourceId,
      start_date: startDate,
      end_date: endDate
    }),
    {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    }
  );

  const report = await response.json();

  // Calculate additional metrics
  const metrics = calculateMetrics(report);

  // Generate report document
  const reportDoc = {
    resource: report.resource,
    period: { start_date: startDate, end_date: endDate },
    summary: {
      ...report.summary,
      revenue_projection: metrics.revenueProjection,
      peak_utilization_date: metrics.peakDate,
      low_utilization_dates: metrics.lowDates
    },
    recommendations: generateRecommendations(metrics)
  };

  return reportDoc;
}

function calculateMetrics(report: any) {
  const { daily_breakdown } = report;

  // Find peak utilization date
  const peakDate = daily_breakdown.reduce((max: any, day: any) =>
    day.utilization > max.utilization ? day : max
  );

  // Find low utilization dates (< 50%)
  const lowDates = daily_breakdown
    .filter((day: any) => day.utilization < 0.5 && day.utilization > 0)
    .map((day: any) => day.date);

  // Calculate revenue projection (assuming $200/booking)
  const revenueProjection = report.summary.total_allocated * 200;

  return {
    peakDate: peakDate.date,
    peakUtilization: peakDate.utilization,
    lowDates,
    revenueProjection
  };
}

function generateRecommendations(metrics: any) {
  const recommendations = [];

  if (metrics.lowDates.length > 5) {
    recommendations.push({
      type: 'PROMOTION',
      message: `Consider running promotions on low-demand dates: ${metrics.lowDates.slice(0, 3).join(', ')}`,
      impact: 'Increase utilization by 15-20%'
    });
  }

  if (metrics.peakUtilization >= 0.9) {
    recommendations.push({
      type: 'CAPACITY',
      message: 'High demand detected. Consider adding more resources or increasing capacity.',
      impact: 'Capture additional revenue'
    });
  }

  return recommendations;
}

// Usage
const report = await generateMonthlyCapacityReport(
  'admin_token',
  'res_tour_fraser_1day',
  '2025-01'
);

console.log(JSON.stringify(report, null, 2));
```

---

## Example 8: Order Cancellation with Capacity Restoration

Handle order cancellations and restore capacity.

```typescript
// Workflow for handling order cancellation
export async function handleOrderCancellation(orderId: string) {
  console.log(`Processing cancellation for order: ${orderId}`);

  // Step 1: Find allocations for this order
  const allocationsResponse = await fetch(
    `/admin/resource-booking/reports/allocations?order_id=${orderId}`,
    {
      headers: { 'Authorization': `Bearer ${process.env.ADMIN_TOKEN}` }
    }
  );

  const { allocations } = await allocationsResponse.json();

  if (allocations.length === 0) {
    console.log('No resource allocations found for this order');
    return { restored: false };
  }

  // Step 2: For each allocation, restore capacity
  for (const allocation of allocations) {
    console.log(`Restoring capacity for allocation: ${allocation.id}`);

    // Restore capacity for each date
    for (const date of allocation.dates) {
      await fetch('/admin/resource-booking/capacity/adjust', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.ADMIN_TOKEN}`
        },
        body: JSON.stringify({
          resource_id: allocation.resource_id,
          dates: [date],
          adjustment: allocation.quantity, // Add back to capacity
          reason: `Order ${orderId} cancelled`
        })
      });

      console.log(`Restored ${allocation.quantity} units for ${date}`);
    }

    // Mark allocation as cancelled in metadata
    await updateAllocationStatus(allocation.id, 'CANCELLED');
  }

  // Step 3: Notify customer
  await sendCancellationConfirmation(orderId, allocations);

  return {
    restored: true,
    allocations_count: allocations.length,
    total_capacity_restored: allocations.reduce(
      (sum: number, a: any) => sum + (a.quantity * a.dates.length),
      0
    )
  };
}

async function updateAllocationStatus(allocationId: string, status: string) {
  // Update allocation metadata (custom implementation)
  // Note: This requires adding a status field or using metadata
  console.log(`Updated allocation ${allocationId} status to ${status}`);
}

async function sendCancellationConfirmation(
  orderId: string,
  allocations: any[]
) {
  const dates = allocations.flatMap(a => a.dates);

  console.log(`Sending cancellation confirmation for dates: ${dates.join(', ')}`);
  // Email sending logic here
}

// Usage
const result = await handleOrderCancellation('order_01JCEXAMPLE');
console.log(`Restored ${result.total_capacity_restored} capacity units`);
```

---

## Example 9: Real-time Availability Calendar

Interactive calendar showing availability for next 30 days.

```typescript
import { useState, useEffect } from 'react';

export function AvailabilityCalendar({ resourceId }: { resourceId: string }) {
  const [availabilityMap, setAvailabilityMap] = useState<Map<string, any>>(new Map());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadAvailability() {
      const today = new Date();
      const endDate = new Date();
      endDate.setDate(today.getDate() + 30);

      const response = await fetch(
        `/store/resource-booking/availability?` +
        new URLSearchParams({
          resource_id: resourceId,
          start_date: today.toISOString().split('T')[0],
          end_date: endDate.toISOString().split('T')[0],
          quantity: '1'
        })
      );

      const { available_dates } = await response.json();

      const map = new Map();
      available_dates.forEach((day: any) => {
        map.set(day.date, day);
      });

      setAvailabilityMap(map);
      setLoading(false);
    }

    loadAvailability();

    // Refresh every 60 seconds
    const interval = setInterval(loadAvailability, 60000);
    return () => clearInterval(interval);
  }, [resourceId]);

  if (loading) return <div>Loading calendar...</div>;

  return (
    <div className="availability-calendar grid grid-cols-7 gap-2">
      {Array.from(availabilityMap.entries()).map(([date, data]) => (
        <DateCell
          key={date}
          date={date}
          isAvailable={data.is_available}
          availableCapacity={data.available_capacity}
          maxCapacity={data.max_capacity}
        />
      ))}
    </div>
  );
}

function DateCell({
  date,
  isAvailable,
  availableCapacity,
  maxCapacity
}: {
  date: string;
  isAvailable: boolean;
  availableCapacity: number;
  maxCapacity: number;
}) {
  const dayOfMonth = new Date(date).getDate();
  const utilization = (maxCapacity - availableCapacity) / maxCapacity;

  const getColor = () => {
    if (!isAvailable) return 'bg-red-200';
    if (utilization < 0.5) return 'bg-green-200';
    if (utilization < 0.8) return 'bg-yellow-200';
    return 'bg-orange-200';
  };

  return (
    <div className={`date-cell ${getColor()} p-2 rounded text-center`}>
      <div className="font-bold">{dayOfMonth}</div>
      <div className="text-xs">
        {isAvailable ? `${availableCapacity} left` : 'Full'}
      </div>
    </div>
  );
}
```

---

## Example 10: Integration with Medusa Checkout

Complete checkout flow with hold confirmation.

```typescript
// Custom checkout completion hook
import { useEffect } from 'react';
import { useCart } from 'medusa-react';

export function useBookingCheckout() {
  const { cart, completeCart } = useCart();

  async function completeCheckoutWithBooking() {
    // Get hold ID from session
    const holdId = sessionStorage.getItem('booking_hold_id');

    if (!holdId) {
      throw new Error('No booking hold found');
    }

    try {
      // Step 1: Complete cart/order
      const { order } = await completeCart();

      // Step 2: Confirm hold
      const tourLineItem = order.items.find(
        item => item.metadata?.is_tour_booking
      );

      if (tourLineItem) {
        await fetch(`/store/resource-booking/holds/${holdId}/confirm`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            order_id: order.id,
            line_item_id: tourLineItem.id
          })
        });

        console.log('Hold confirmed, allocation created');
      }

      // Step 3: Clean up session
      sessionStorage.removeItem('booking_hold_id');
      sessionStorage.removeItem('idempotency_token');

      return order;

    } catch (error) {
      console.error('Checkout failed:', error);
      // Hold will expire automatically if not confirmed
      throw error;
    }
  }

  return { completeCheckoutWithBooking };
}

// Usage in checkout page
export function CheckoutPage() {
  const { completeCheckoutWithBooking } = useBookingCheckout();

  async function handlePayment() {
    try {
      const order = await completeCheckoutWithBooking();

      // Redirect to success page
      window.location.href = `/order/confirmed/${order.id}`;
    } catch (error: any) {
      alert(`Checkout failed: ${error.message}`);
    }
  }

  return (
    <div>
      <button onClick={handlePayment}>
        Complete Booking
      </button>
    </div>
  );
}
```

---

## Testing Examples

These examples can be adapted for automated tests. See [TESTING.md](./TESTING.md) for test suite documentation.

---

## Next Steps

- [API Reference](../../src/modules/resource-booking/API_REFERENCE.md) - Full API documentation
- [Integration Guide](./INTEGRATION.md) - Detailed integration patterns
- [Testing Guide](./TESTING.md) - Test your implementation
- [Architecture](./ARCHITECTURE.md) - Understand system design
