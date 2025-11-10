# Form Persistence Implementation

## Overview

The form persistence system provides automatic state management for checkout forms, ensuring data resilience across page reloads, navigation, and browser tab switches. All data is stored in `sessionStorage` and is automatically cleared when the browser tab is closed or when checkout completes successfully.

## Features

### Core Capabilities

1. **Automatic Save & Restore**: Form data is automatically saved and restored across page loads
2. **Debouncing**: Prevents excessive storage writes with configurable debounce delays (default: 500ms)
3. **Security-First**: Automatically filters sensitive payment data (card numbers, CVV, tokens)
4. **Error Handling**: Graceful handling of JSON serialization errors and storage quota issues
5. **Data Expiration**: Automatic cleanup of stale data (default: 1 hour)
6. **Session-Based**: Uses sessionStorage (data cleared when tab closes)

## Architecture

### Files Created/Modified

#### 1. `/storefront/lib/utils/form-persistence.ts`
Core utility module providing:
- `saveFormData(key, data, debounceMs)` - Save form data with debouncing
- `loadFormData(key, maxAgeMs)` - Restore form data with validation
- `clearFormData(key)` - Clear specific form data
- `clearAllCheckoutData()` - Clear all checkout data
- `getPersistedKeys()` - List all persisted keys (debugging)
- `useFormPersistence(key, initialData)` - React hook for automatic persistence

#### 2. `/storefront/app/checkout/page.tsx` (Modified)
Updated to integrate persistence:
- Customer form data restoration on mount
- Payment form data restoration (sensitive fields excluded)
- Shipping option restoration
- Automatic save on data changes
- Clear all data on successful checkout

#### 3. `/storefront/tests/utils/form-persistence.test.ts`
Comprehensive test suite covering:
- Basic save/load operations
- Sensitive field filtering
- Debouncing behavior
- Data expiration
- Error handling
- Security validation

## Data Persisted

### Customer Information (`customer-info`)
```typescript
{
  fullName: string;
  email: string;
  phone: string;
  emergencyContact: string;
  emergencyPhone: string;
  dietaryRequirements: string;
  specialRequests: string;
}
```

### Payment Information (`payment-info`)
```typescript
{
  method: 'card' | 'paypal' | 'bank_transfer';
  cardName: string;       // Persisted
  cardExpiry: string;     // Persisted
  termsAccepted: boolean; // Persisted

  // EXCLUDED FOR SECURITY:
  cardNumber: string;     // NOT persisted
  cardCVV: string;        // NOT persisted
}
```

### Shipping Option (`shipping-option`)
```typescript
{
  selectedShippingOption: string; // Medusa shipping method ID
}
```

## Security Exclusions

The following fields are **NEVER** persisted to storage:

### Payment Security
- `cardNumber` - Credit card number
- `cardCVV` - Card verification value
- `cvv` - Alternative CVV field name
- `securityCode` - Security code
- `card_number` - Snake case variant
- `card_cvv` - Snake case variant

### API & Authentication
- `cart_id` - Managed by CartContext
- `access_token` - API access tokens
- `api_key` - API keys
- `payment_token` - Payment processor tokens
- `stripe_token` - Stripe payment tokens

### Implementation Details
Sensitive field filtering is implemented recursively, so nested objects are also protected.

## Usage Examples

### Basic Usage in Components

```typescript
import { saveFormData, loadFormData, clearFormData } from '@/lib/utils/form-persistence';

// Save data (debounced)
function handleFormChange(data: CustomerData) {
  setCustomerData(data);
  saveFormData('customer-info', data);
}

// Load data on mount
useEffect(() => {
  const restored = loadFormData<CustomerData>('customer-info');
  if (restored) {
    setCustomerData(restored);
  }
}, []);

// Clear data on success
function handleOrderComplete() {
  clearAllCheckoutData();
  router.push('/confirmation');
}
```

### Using the React Hook

```typescript
import { useFormPersistence } from '@/lib/utils/form-persistence';

function MyForm() {
  const [formData, setFormData, clearFormData] = useFormPersistence(
    'my-form',
    { name: '', email: '' }
  );

  // Data is automatically saved on changes and restored on mount
  return (
    <form>
      <input
        value={formData.name}
        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
      />
    </form>
  );
}
```

## Storage Format

Data is stored with metadata for validation and expiration:

```json
{
  "data": {
    "fullName": "John Doe",
    "email": "john@example.com"
  },
  "timestamp": 1699564800000,
  "version": "1.0.0"
}
```

### Storage Keys
All keys are prefixed with `checkout_persist_`:
- `checkout_persist_customer-info`
- `checkout_persist_payment-info`
- `checkout_persist_shipping-option`

## Data Lifecycle

### 1. Page Load
```
User lands on checkout page
  ↓
loadFormData() called for each form
  ↓
Data validation (structure + age check)
  ↓
Forms populated with restored data
```

### 2. User Input
```
User types in form field
  ↓
onChange handler called
  ↓
saveFormData() queued (debounced)
  ↓
After 500ms of inactivity, data saved to sessionStorage
```

### 3. Page Reload
```
User refreshes page
  ↓
Forms restored from sessionStorage
  ↓
User continues from where they left off
```

### 4. Successful Checkout
```
Order created successfully
  ↓
clearAllCheckoutData() called
  ↓
All checkout data removed from sessionStorage
  ↓
Redirect to confirmation page
```

### 5. Tab Close
```
User closes browser tab
  ↓
sessionStorage automatically cleared by browser
  ↓
No data persists between sessions
```

## Error Handling

### Graceful Degradation
The system is designed to fail gracefully:

1. **Storage Unavailable**: Logs warning, continues without persistence
2. **JSON Serialization Error**: Logs error, skips save
3. **Corrupted Data**: Clears corrupted entry, returns null
4. **Quota Exceeded**: Clears oldest item, retries save
5. **Expired Data**: Automatically removed on load

### Error Recovery
```typescript
try {
  saveFormData('key', data);
} catch (error) {
  // Form continues to work without persistence
  console.error('Persistence failed:', error);
}
```

## Performance Considerations

### Debouncing
- Default: 500ms delay between saves
- Prevents excessive storage writes during rapid typing
- Configurable per-call: `saveFormData(key, data, 1000)`

### Storage Impact
- Typical customer form: ~300 bytes
- Typical payment form (filtered): ~100 bytes
- Shipping option: ~50 bytes
- **Total**: ~450 bytes per checkout session

### Memory Cleanup
- Expired data automatically removed on load
- All data cleared on successful checkout
- sessionStorage cleared when tab closes

## Testing

### Run Tests
```bash
cd storefront
npm test form-persistence.test.ts
```

### Test Coverage
- ✅ Basic save/load operations
- ✅ Sensitive field filtering
- ✅ Debouncing behavior
- ✅ Data expiration
- ✅ Corrupted data handling
- ✅ Storage quota handling
- ✅ Nested object filtering
- ✅ Edge cases (empty data, only sensitive fields)

### Manual Testing Checklist
1. Fill out customer form → refresh page → verify data restored
2. Select shipping option → refresh page → verify selection persisted
3. Enter payment method → refresh page → verify method persisted
4. Enter card number → refresh page → verify card number NOT persisted
5. Complete checkout → verify all data cleared
6. Close tab → reopen → verify no data persists

## Browser Compatibility

### sessionStorage Support
- ✅ Chrome/Edge 4+
- ✅ Firefox 2+
- ✅ Safari 4+
- ✅ Opera 10.5+
- ✅ iOS Safari 3.2+
- ✅ Android Browser 2.1+

### Fallback Behavior
If sessionStorage is unavailable:
- `isBrowser()` returns false
- All persistence functions log warnings
- Forms work normally without persistence

## Next.js App Router Considerations

### Server vs Client Components
- Persistence utility is **client-side only**
- Uses `typeof window !== 'undefined'` checks
- Safe to import in client components
- Cannot be used in Server Components

### Integration with Next.js
```typescript
'use client';  // Required for pages using persistence

import { loadFormData } from '@/lib/utils/form-persistence';

export default function CheckoutPage() {
  // useState with lazy initializer for SSR compatibility
  const [data, setData] = useState(() => {
    return loadFormData('key') || defaultData;
  });
}
```

## Migration from localStorage

The previous implementation used `localStorage.setItem('checkout_customer', ...)`.

### Key Improvements
1. **Security**: Automatic sensitive field filtering
2. **Session-Based**: Data cleared when tab closes
3. **Validation**: Structure and age validation
4. **Debouncing**: Better performance
5. **Namespace**: Prevents key collisions

### Migration Path
No migration needed - old localStorage data is ignored. Users will need to re-enter data once.

## Future Enhancements

### Potential Improvements
1. **Encryption**: Encrypt data before storage
2. **Compression**: Compress large form data
3. **Sync Across Tabs**: Use BroadcastChannel API
4. **Cloud Backup**: Optional server-side persistence
5. **Analytics**: Track restoration success rates
6. **A/B Testing**: Test different debounce delays

### Monitoring Recommendations
- Track persistence success/failure rates
- Monitor data expiration frequency
- Measure restoration impact on conversion
- A/B test debounce delays for optimal UX

## Troubleshooting

### Data Not Persisting
1. Check browser console for errors
2. Verify sessionStorage is enabled
3. Check for privacy/incognito mode
4. Verify key names match exactly

### Data Not Restoring
1. Check data age (default max: 1 hour)
2. Verify data structure in DevTools
3. Check for JSON parsing errors
4. Ensure component is client-side

### Sensitive Data Leaking
1. Verify field names match SENSITIVE_FIELDS array
2. Check for typos in field names
3. Add custom sensitive fields if needed

## Support & Maintenance

### Code Ownership
- **Module**: `/storefront/lib/utils/form-persistence.ts`
- **Tests**: `/storefront/tests/utils/form-persistence.test.ts`
- **Integration**: `/storefront/app/checkout/page.tsx`

### Documentation
- This file: `/storefront/docs/form-persistence.md`
- Inline JSDoc comments in source files
- Test descriptions in test files

### Update Checklist
When modifying the persistence system:
1. ✅ Update type definitions
2. ✅ Add/update tests
3. ✅ Update this documentation
4. ✅ Check sensitive field list
5. ✅ Test in all major browsers
6. ✅ Verify no PII leakage

---

**Last Updated**: 2025-11-10
**Version**: 1.0.0
**Status**: Production Ready
