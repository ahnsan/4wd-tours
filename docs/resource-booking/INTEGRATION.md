# Resource Booking Integration Guide

Step-by-step guide for integrating the Resource Booking module with your Medusa.js application.

## Table of Contents

- [Integration with Checkout Flow](#integration-with-checkout-flow)
- [Integration with Product Catalog](#integration-with-product-catalog)
- [Integration with Order Fulfillment](#integration-with-order-fulfillment)
- [Integration with Cart](#integration-with-cart)
- [Storefront Integration](#storefront-integration)
- [Webhooks Integration](#webhooks-integration)
- [Admin Dashboard Integration](#admin-dashboard-integration)

---

## Integration with Checkout Flow

### Overview

The booking system integrates with Medusa checkout by:
1. Creating a hold when customer adds bookable item to cart
2. Storing hold ID in cart/session context
3. Confirming hold after successful order placement
4. Releasing hold if checkout fails or is abandoned

### Step 1: Extend Cart Context

Add hold tracking to cart metadata:

```typescript
// src/workflows/cart-created.ts
import { createWorkflow } from '@medusajs/workflows-sdk';

export const cartCreatedWorkflow = createWorkflow(
  'cart-created',
  async (input: { cart_id: string }) => {
    // Initialize cart metadata for bookings
    await cartService.update(input.cart_id, {
      metadata: {
        booking_holds: [], // Array of hold IDs
        booking_expires_at: null // Earliest expiration time
      }
    });
  }
);
```

### Step 2: Create Hold When Adding Bookable Product

```typescript
// src/api/store/cart/add-booking-item/route.ts
import { MedusaRequest, MedusaResponse } from '@medusajs/medusa';

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const { cart_id, product_id, dates, quantity, customer_email } = req.body;

  // Get product resource mapping
  const product = await productService.retrieve(product_id);
  const resourceId = product.metadata?.resource_id;

  if (!resourceId) {
    return res.status(400).json({
      message: 'Product is not a bookable resource'
    });
  }

  // Create hold
  const holdResponse = await fetch('/store/resource-booking/holds', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      resource_id: resourceId,
      dates,
      quantity,
      customer_email,
      idempotency_token: crypto.randomUUID(),
      metadata: { product_id, cart_id }
    })
  });

  const { hold } = await holdResponse.json();

  // Add line item to cart
  const lineItem = await cartService.addLineItem(cart_id, {
    variant_id: product.variants[0].id,
    quantity,
    metadata: {
      booking_hold_id: hold.id,
      booking_dates: dates,
      resource_id: resourceId
    }
  });

  // Update cart metadata
  const cart = await cartService.retrieve(cart_id);
  const holds = cart.metadata?.booking_holds || [];
  holds.push(hold.id);

  await cartService.update(cart_id, {
    metadata: {
      ...cart.metadata,
      booking_holds: holds,
      booking_expires_at: hold.expires_at
    }
  });

  return res.json({ lineItem, hold });
}
```

### Step 3: Display Hold Timer in Checkout

```typescript
// storefront/src/components/CheckoutTimer.tsx
import { useEffect, useState } from 'react';
import { useCart } from 'medusa-react';

export function CheckoutTimer() {
  const { cart } = useCart();
  const [timeRemaining, setTimeRemaining] = useState<number>(0);

  useEffect(() => {
    if (!cart?.metadata?.booking_expires_at) return;

    const expiresAt = new Date(cart.metadata.booking_expires_at as string);
    const updateTimer = () => {
      const now = new Date();
      const remaining = Math.max(0, Math.floor((expiresAt.getTime() - now.getTime()) / 1000));
      setTimeRemaining(remaining);

      if (remaining === 0) {
        alert('Your booking reservation has expired. Please start over.');
        window.location.href = '/cart';
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [cart]);

  if (timeRemaining === 0) return null;

  const minutes = Math.floor(timeRemaining / 60);
  const seconds = timeRemaining % 60;

  return (
    <div className="bg-yellow-100 border border-yellow-400 p-4 rounded mb-4">
      <div className="flex items-center justify-between">
        <span className="font-semibold">Reservation expires in:</span>
        <span className="text-2xl font-mono">
          {minutes}:{seconds.toString().padStart(2, '0')}
        </span>
      </div>
      <p className="text-sm text-gray-600 mt-2">
        Complete checkout before time runs out to secure your booking.
      </p>
    </div>
  );
}
```

### Step 4: Confirm Hold After Order Placement

```typescript
// src/workflows/order-placed.ts
import { createWorkflow, WorkflowResponse } from '@medusajs/workflows-sdk';

export const orderPlacedWorkflow = createWorkflow(
  'order-placed',
  async (input: { order_id: string }) => {
    const order = await orderService.retrieve(input.order_id, {
      relations: ['items']
    });

    // Find line items with bookings
    const bookingItems = order.items.filter(
      item => item.metadata?.booking_hold_id
    );

    // Confirm each hold
    for (const item of bookingItems) {
      const holdId = item.metadata.booking_hold_id as string;

      try {
        await fetch(`/store/resource-booking/holds/${holdId}/confirm`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            order_id: order.id,
            line_item_id: item.id
          })
        });

        console.log(`Confirmed hold ${holdId} for order ${order.id}`);

      } catch (error) {
        console.error(`Failed to confirm hold ${holdId}:`, error);
        // Handle error (e.g., hold expired, send customer service alert)
      }
    }

    return new WorkflowResponse({ success: true });
  }
);
```

### Step 5: Release Hold on Cart Abandonment

```typescript
// src/jobs/release-abandoned-holds.ts
import { ScheduledJobConfig } from '@medusajs/medusa';

export const releaseAbandonedHoldsJob: ScheduledJobConfig = {
  name: 'release-abandoned-holds',
  schedule: '*/10 * * * *', // Every 10 minutes
  async handler(container) {
    const cartService = container.resolve('cartService');

    // Find carts with holds that haven't been updated in 40+ minutes
    const cutoff = new Date(Date.now() - 40 * 60 * 1000);

    const abandonedCarts = await cartService.list({
      updated_at: { lt: cutoff }
    });

    for (const cart of abandonedCarts) {
      const holds = cart.metadata?.booking_holds || [];

      for (const holdId of holds) {
        try {
          await fetch(`/store/resource-booking/holds/${holdId}`, {
            method: 'DELETE',
            params: { customer_email: cart.email }
          });

          console.log(`Released hold ${holdId} from abandoned cart ${cart.id}`);
        } catch (error) {
          // Hold may have already expired
          console.log(`Hold ${holdId} already released or expired`);
        }
      }
    }
  }
};
```

---

## Integration with Product Catalog

### Link Products to Resources

```typescript
// Admin: Create product with resource link
async function createBookableProduct(adminToken: string) {
  const response = await fetch('/admin/products', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${adminToken}`
    },
    body: JSON.stringify({
      title: 'Fraser Island 1-Day 4WD Tour',
      description: 'Experience the beauty of Fraser Island',
      is_giftcard: false,
      discountable: true,
      options: [
        {
          title: 'Date',
          values: ['Select date at checkout']
        }
      ],
      variants: [
        {
          title: 'Standard',
          prices: [
            { amount: 20000, currency_code: 'usd' } // $200
          ],
          inventory_quantity: 999, // Not tracked via product inventory
          manage_inventory: false,
          metadata: {
            resource_id: 'res_tour_fraser_1day',
            booking_required: true
          }
        }
      ],
      metadata: {
        resource_id: 'res_tour_fraser_1day',
        booking_type: 'tour',
        duration_hours: 8,
        is_bookable: true
      }
    })
  });

  return await response.json();
}
```

### Display Availability Calendar in Product Page

```typescript
// storefront/src/components/ProductBookingCalendar.tsx
import { useState, useEffect } from 'react';

export function ProductBookingCalendar({ productId, resourceId }: {
  productId: string;
  resourceId: string;
}) {
  const [availability, setAvailability] = useState<any[]>([]);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

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
      setAvailability(available_dates);
    }

    loadAvailability();
  }, [resourceId]);

  return (
    <div className="booking-calendar">
      <h3 className="text-lg font-semibold mb-4">Select Your Date</h3>

      <div className="grid grid-cols-7 gap-2">
        {availability.map(day => (
          <button
            key={day.date}
            onClick={() => setSelectedDate(day.date)}
            disabled={!day.is_available}
            className={`
              p-3 rounded border text-center
              ${selectedDate === day.date ? 'bg-blue-600 text-white' : ''}
              ${!day.is_available ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'hover:bg-blue-100'}
            `}
          >
            <div className="font-bold">{new Date(day.date).getDate()}</div>
            <div className="text-xs">
              {day.is_available ? `${day.available_capacity} left` : 'Full'}
            </div>
          </button>
        ))}
      </div>

      {selectedDate && (
        <button
          onClick={() => addToCart(productId, selectedDate)}
          className="mt-4 w-full bg-blue-600 text-white py-3 rounded font-semibold"
        >
          Book for {selectedDate}
        </button>
      )}
    </div>
  );
}

async function addToCart(productId: string, date: string) {
  // Implementation from Step 2 above
}
```

---

## Integration with Order Fulfillment

### Track Allocations in Order Details

```typescript
// Admin: View order with booking details
async function getOrderWithBookings(orderId: string, adminToken: string) {
  const orderResponse = await fetch(`/admin/orders/${orderId}`, {
    headers: { 'Authorization': `Bearer ${adminToken}` }
  });

  const order = await orderResponse.json();

  // Fetch allocations for this order
  const allocationsResponse = await fetch(
    `/admin/resource-booking/reports/allocations?order_id=${orderId}`,
    {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    }
  );

  const { allocations } = await allocationsResponse.json();

  return {
    ...order,
    bookings: allocations
  };
}
```

### Generate Booking Confirmation Email

```typescript
// src/subscribers/order-placed.ts
import { EventBusService } from '@medusajs/medusa';

export default async function orderPlacedHandler(container) {
  const eventBus: EventBusService = container.resolve('eventBusService');

  eventBus.subscribe('order.placed', async (data) => {
    const { id: orderId } = data;

    // Get allocations
    const allocationsResponse = await fetch(
      `/admin/resource-booking/reports/allocations?order_id=${orderId}`
    );

    const { allocations } = await allocationsResponse.json();

    if (allocations.length === 0) return; // Not a booking order

    // Send confirmation email
    await sendBookingConfirmationEmail({
      orderId,
      allocations,
      customer: data.customer
    });
  });
}

async function sendBookingConfirmationEmail(data: any) {
  const { orderId, allocations, customer } = data;

  const emailContent = `
    Dear ${customer.first_name},

    Your booking is confirmed!

    Order ID: ${orderId}

    Booking Details:
    ${allocations.map((a: any) => `
      - ${a.resource.name}
      - Dates: ${a.dates.join(', ')}
      - Quantity: ${a.quantity}
    `).join('\n')}

    See you soon!

    Med USA 4WD Team
  `;

  // Send email via your email service
  await emailService.send({
    to: customer.email,
    subject: 'Booking Confirmation',
    body: emailContent
  });
}
```

---

## Integration with Cart

### Validate Cart Before Checkout

```typescript
// src/api/store/cart/validate/route.ts
export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const { cart_id } = req.body;

  const cart = await cartService.retrieve(cart_id, {
    relations: ['items']
  });

  const errors: string[] = [];

  // Check if holds are still valid
  for (const item of cart.items) {
    const holdId = item.metadata?.booking_hold_id;

    if (holdId) {
      try {
        const holdResponse = await fetch(
          `/store/resource-booking/holds/${holdId}?customer_email=${cart.email}`
        );

        const { hold, is_expired } = await holdResponse.json();

        if (is_expired || hold.status !== 'ACTIVE') {
          errors.push(`Booking for ${item.title} has expired. Please re-book.`);
        }

      } catch (error) {
        errors.push(`Could not validate booking for ${item.title}`);
      }
    }
  }

  if (errors.length > 0) {
    return res.status(400).json({ errors });
  }

  return res.json({ valid: true });
}
```

---

## Storefront Integration

### Complete Booking Flow Component

```typescript
// storefront/src/pages/tours/[id].tsx
import { useRouter } from 'next/router';
import { useState } from 'react';
import { ProductBookingCalendar } from '@/components/ProductBookingCalendar';
import { useCart } from 'medusa-react';

export default function TourProductPage() {
  const router = useRouter();
  const { id } = router.query;
  const { cart, addItem } = useCart();

  const [product, setProduct] = useState<any>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);

  // Load product (with resource metadata)
  useEffect(() => {
    async function loadProduct() {
      const response = await fetch(`/store/products/${id}`);
      const { product } = await response.json();
      setProduct(product);
    }
    loadProduct();
  }, [id]);

  async function handleBooking() {
    if (!selectedDate) {
      alert('Please select a date');
      return;
    }

    // Create hold and add to cart (integrated endpoint)
    await fetch('/store/cart/add-booking-item', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        cart_id: cart.id,
        product_id: product.id,
        dates: [selectedDate],
        quantity,
        customer_email: cart.email || 'guest@example.com'
      })
    });

    router.push('/cart');
  }

  if (!product) return <div>Loading...</div>;

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold">{product.title}</h1>
      <p className="text-gray-600 mt-2">{product.description}</p>

      <div className="mt-8">
        <label className="block mb-2 font-semibold">Number of People:</label>
        <input
          type="number"
          min="1"
          max="8"
          value={quantity}
          onChange={e => setQuantity(parseInt(e.target.value))}
          className="border rounded px-3 py-2"
        />
      </div>

      <div className="mt-8">
        <ProductBookingCalendar
          productId={product.id}
          resourceId={product.metadata.resource_id}
          selectedDate={selectedDate}
          onDateSelect={setSelectedDate}
        />
      </div>

      <button
        onClick={handleBooking}
        className="mt-8 w-full bg-blue-600 text-white py-4 rounded-lg font-semibold text-lg"
      >
        Book Now - ${product.variants[0].prices[0].amount / 100}
      </button>
    </div>
  );
}
```

---

## Webhooks Integration

### Subscribe to Booking Events

```typescript
// src/subscribers/booking-events.ts
import { EventBusService } from '@medusajs/medusa';

export default async function bookingEventsHandler(container) {
  const eventBus: EventBusService = container.resolve('eventBusService');

  // Hold created
  eventBus.subscribe('resource_booking.hold.created', async (data) => {
    console.log('New hold created:', data.hold_id);
    // Trigger analytics, send to CRM, etc.
  });

  // Hold expired
  eventBus.subscribe('resource_booking.hold.expired', async (data) => {
    console.log('Hold expired:', data.hold_id);
    // Send reminder email to customer?
  });

  // Allocation created (confirmed booking)
  eventBus.subscribe('resource_booking.allocation.created', async (data) => {
    console.log('Booking confirmed:', data.allocation_id);
    // Send to operations team, update external calendars, etc.
  });

  // Capacity depleted (100% booked)
  eventBus.subscribe('resource_booking.capacity.depleted', async (data) => {
    console.log('Resource fully booked:', data.resource_id, data.date);
    // Alert admin, trigger dynamic pricing, etc.
  });
}
```

---

## Admin Dashboard Integration

### Custom Admin Widget for Bookings

```typescript
// src/admin/widgets/bookings-dashboard.tsx
import { defineWidgetConfig } from '@medusajs/admin-sdk';

export const BookingsDashboardWidget = () => {
  const [todaysBookings, setTodaysBookings] = useState<number>(0);
  const [upcomingCapacity, setUpcomingCapacity] = useState<any>(null);

  useEffect(() => {
    async function loadStats() {
      const today = new Date().toISOString().split('T')[0];

      // Get today's allocations
      const allocationsResponse = await fetch(
        `/admin/resource-booking/reports/allocations?start_date=${today}&end_date=${today}`
      );
      const { count } = await allocationsResponse.json();
      setTodaysBookings(count);

      // Get next 7 days capacity
      // ...implementation
    }

    loadStats();
  }, []);

  return (
    <div className="bg-white p-6 rounded shadow">
      <h2 className="text-xl font-bold mb-4">Bookings Overview</h2>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-blue-100 p-4 rounded">
          <div className="text-3xl font-bold">{todaysBookings}</div>
          <div className="text-sm text-gray-600">Today's Bookings</div>
        </div>

        <div className="bg-green-100 p-4 rounded">
          <div className="text-3xl font-bold">87%</div>
          <div className="text-sm text-gray-600">Week Utilization</div>
        </div>
      </div>
    </div>
  );
};

export const config = defineWidgetConfig({
  zone: 'order.list.before'
});
```

---

## Best Practices

### 1. Always Validate Holds Before Checkout
```typescript
const { is_expired } = await validateHold(holdId);
if (is_expired) {
  // Prompt customer to re-book
}
```

### 2. Display Clear Expiration Warnings
```typescript
if (timeRemaining < 300) { // 5 minutes
  showWarning('Your reservation expires soon!');
}
```

### 3. Handle Edge Cases Gracefully
- Hold expires during checkout
- Customer closes browser mid-booking
- Payment fails after hold creation

### 4. Cleanup Abandoned Carts
Run scheduled job to release holds from abandoned carts.

### 5. Monitor Key Metrics
- Hold expiration rate
- Average time to confirmation
- Peak booking times

---

## Troubleshooting

**Issue:** Hold creation fails with "Insufficient capacity"
- **Cause:** Another customer booked simultaneously
- **Solution:** Show alternative dates or prompt retry

**Issue:** Hold expires before checkout completes
- **Cause:** Customer too slow or form errors
- **Solution:** Display prominent timer, allow hold extension

**Issue:** Order placed but hold not confirmed
- **Cause:** Network error or workflow failure
- **Solution:** Implement retry logic in order workflow

---

## Next Steps

- [API Reference](../../src/modules/resource-booking/API_REFERENCE.md)
- [Examples](./EXAMPLES.md)
- [Testing Guide](./TESTING.md)
- [Architecture](./ARCHITECTURE.md)
