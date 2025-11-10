# Medusa API Response Validation

This directory contains Zod schemas for validating Medusa v2 API responses in the storefront application.

## Overview

The validation layer ensures that API responses from the Medusa backend match expected data structures, helping catch breaking changes early and improving type safety.

## Files

- **medusa-schemas.ts** - Zod validation schemas for all critical Medusa API responses

## Validation Strategy

### Graceful Degradation Approach

**CRITICAL**: This implementation follows a **graceful degradation** strategy:

1. Validation is applied to all critical API responses (cart, order, payment)
2. If validation fails, errors are **logged** but the flow continues
3. Original API data is returned if validation fails
4. This prevents breaking existing functionality while providing debugging insights

### Why Graceful Degradation?

- **Backward Compatibility**: API may return extra fields not in schemas
- **Forward Compatibility**: API may evolve without breaking the frontend
- **Resilience**: Validation errors don't crash the application
- **Debugging**: Validation errors are logged for investigation

## Validated Responses

### Cart Operations
- `POST /store/carts` - Create cart
- `GET /store/carts/:id` - Get cart
- `POST /store/carts/:id` - Update cart
- `POST /store/carts/:id/line-items` - Add item to cart
- `POST /store/carts/:id/line-items/:itemId` - Update line item
- `DELETE /store/carts/:id/line-items/:itemId` - Remove line item

### Order Operations
- `GET /store/orders/:id` - Get order

### Payment Operations
- `POST /store/payment-collections` - Create payment collection
- `POST /store/payment-collections/:id/payment-sessions` - Initialize payment session

### Checkout Operations
- `POST /store/carts/:id/complete` - Complete cart (returns order or cart)

## Schema Features

### Passthrough Mode
All schemas use `.passthrough()` to allow extra fields from the API:

```typescript
export const MedusaCartSchema = z.object({
  id: z.string(),
  items: z.array(CartLineItemSchema),
  // ... other fields
}).passthrough(); // Allows extra fields not defined in schema
```

### Optional Fields
Most fields are optional to handle partial responses:

```typescript
export const MedusaCartSchema = z.object({
  id: z.string().min(1), // Required
  email: z.string().email().optional(), // Optional
  items: z.array(CartLineItemSchema).default([]), // Default value
  // ...
});
```

## Usage Examples

### Direct Validation

```typescript
import { validateCartResponse, ValidationResult } from './medusa-schemas';

const apiResponse = await fetch('/store/carts/cart_123');
const data = await apiResponse.json();

// Validate the response
const validated = validateCartResponse(data);
// Always returns data (original or validated)
```

### In Cart Service

The validation is automatically applied in `cart-service.ts` via the `handleResponse` function:

```typescript
// Validation happens automatically based on operation type
const data = await handleResponse<{ cart: MedusaCart }>(response, 'Get cart');
// data.cart is validated against MedusaCartSchema
```

## Validation Logging

When validation fails, detailed logs are generated:

```
[Validation] Cart response validation failed:
  errors: [
    { path: ['cart', 'id'], message: 'Required' },
    { path: ['cart', 'region_id'], message: 'Required' }
  ]
  data: {...} // Truncated API response for debugging
```

## Adding New Schemas

To add validation for new API responses:

1. **Define the schema**:
```typescript
export const NewResponseSchema = z.object({
  data: z.string(),
  // ... fields
}).passthrough();
```

2. **Create validation helper**:
```typescript
export function validateNewResponse(data: unknown): any {
  const result = validateSchema(NewResponseSchema, data, 'New response');
  if (!result.success) {
    console.warn('[Validation] New response validation failed:', result.error);
    return data; // Graceful fallback
  }
  return result.data;
}
```

3. **Integrate into handleResponse**:
```typescript
else if (operationLower.includes('new operation')) {
  validatedData = validateNewResponse(data);
}
```

## Best Practices

1. **Always use `.passthrough()`** - Allows API evolution without breaking schemas
2. **Make fields optional when possible** - Handles partial responses gracefully
3. **Provide default values** - Use `.default([])` for arrays, `.default(0)` for numbers
4. **Log validation failures** - Always log but don't throw for validation errors
5. **Return original data on failure** - Ensures backward compatibility

## Medusa v2 Compatibility

These schemas are designed for **Medusa v2** and follow the official Medusa documentation:

- Uses Zod (recommended by Medusa)
- Follows Medusa's data model structure
- Compatible with Medusa's payment collection flow
- Aligned with Medusa's address schema

## References

- [Medusa API Routes Validation](https://docs.medusajs.com/learn/fundamentals/api-routes/validation)
- [Zod Documentation](https://zod.dev/)
- [Medusa Store API](https://docs.medusajs.com/api/store)
- Local Medusa docs: `/docs/medusa-llm/medusa-llms-full.txt`

## Troubleshooting

### Validation Errors in Production

If you see validation errors in production logs:

1. **Check if it's a breaking change**: Compare API response with schema
2. **Update schema if needed**: API may have added/changed fields
3. **Verify Medusa version**: Ensure backend and frontend are compatible
4. **Check Medusa docs**: Consult official docs for latest API structure

### Performance Impact

Validation has minimal performance impact:
- Schemas are compiled once at runtime
- Validation is fast (microseconds for typical responses)
- Only runs on successful API responses
- Graceful fallback prevents retry overhead
