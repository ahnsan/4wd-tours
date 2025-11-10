# Form Persistence Data Flow

## Visual Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        CHECKOUT PAGE LIFECYCLE                           │
└─────────────────────────────────────────────────────────────────────────┘

╔═══════════════════════════════════════════════════════════════════════╗
║                          1. PAGE LOAD / MOUNT                          ║
╚═══════════════════════════════════════════════════════════════════════╝

    User navigates to /checkout
             ⬇
    ┌─────────────────────┐
    │  CheckoutPage()     │
    │  Component Mount    │
    └──────────┬──────────┘
               │
    ┌──────────▼──────────────────────────────────────────────┐
    │  useState(() => loadFormData('customer-info'))          │
    │  useState(() => loadFormData('payment-info'))           │
    │  useEffect(() => loadFormData('shipping-option'))       │
    └──────────┬──────────────────────────────────────────────┘
               │
    ┌──────────▼─────────────────┐
    │  sessionStorage.getItem()  │
    │  'checkout_persist_*'      │
    └──────────┬─────────────────┘
               │
         ┌─────▼─────┐
         │  Valid?   │◄── Structure validation
         │  Fresh?   │◄── Age < 1 hour
         └─────┬─────┘
               │
       ┌───────┴────────┐
       │                │
    YES│             NO │
       ▼                ▼
  ┌─────────┐      ┌──────────┐
  │ Restore │      │  Empty   │
  │  Form   │      │  Form    │
  └─────────┘      └──────────┘

╔═══════════════════════════════════════════════════════════════════════╗
║                         2. USER INPUT                                  ║
╚═══════════════════════════════════════════════════════════════════════╝

    User types in form field
             ⬇
    ┌─────────────────────┐
    │  onChange handler   │
    │  (CustomerForm)     │
    └──────────┬──────────┘
               │
    ┌──────────▼──────────────────────────┐
    │  handleCustomerDataChange(data)     │
    │  - setCustomerData(data)            │
    │  - saveFormData('customer-info')    │
    └──────────┬──────────────────────────┘
               │
    ┌──────────▼─────────────────────┐
    │  Debounce Timer (500ms)        │
    │  - Clears previous timer       │
    │  - Starts new 500ms countdown  │
    └──────────┬─────────────────────┘
               │
         [User stops typing]
               │
    ┌──────────▼─────────────────────┐
    │  Filter Sensitive Fields       │
    │  - Remove cardNumber           │
    │  - Remove cardCVV              │
    │  - Remove cart_id, tokens      │
    └──────────┬─────────────────────┘
               │
    ┌──────────▼─────────────────────┐
    │  JSON.stringify({              │
    │    data: filteredData,         │
    │    timestamp: Date.now(),      │
    │    version: '1.0.0'            │
    │  })                            │
    └──────────┬─────────────────────┘
               │
    ┌──────────▼────────────────────────┐
    │  sessionStorage.setItem(          │
    │    'checkout_persist_*',          │
    │    serializedData                 │
    │  )                                │
    └───────────────────────────────────┘

╔═══════════════════════════════════════════════════════════════════════╗
║                      3. PAGE RELOAD / REFRESH                          ║
╚═══════════════════════════════════════════════════════════════════════╝

    User presses F5 or navigates away and back
             ⬇
    [Repeat "PAGE LOAD / MOUNT" flow above]
             ⬇
    Form data restored → User continues

╔═══════════════════════════════════════════════════════════════════════╗
║                    4. SUCCESSFUL CHECKOUT                              ║
╚═══════════════════════════════════════════════════════════════════════╝

    User clicks "Complete Booking"
             ⬇
    ┌─────────────────────────┐
    │  handleCompleteBooking()│
    └──────────┬──────────────┘
               │
    ┌──────────▼──────────────┐
    │  Validate all forms     │
    │  Sync items to cart     │
    │  Update cart details    │
    │  Initialize payment     │
    └──────────┬──────────────┘
               │
    ┌──────────▼──────────────┐
    │  completeCart()         │
    │  → Order created! ✓     │
    └──────────┬──────────────┘
               │
    ┌──────────▼─────────────────────┐
    │  clearAllCheckoutData()        │
    │  - Iterate sessionStorage      │
    │  - Find 'checkout_persist_*'   │
    │  - Remove all matches          │
    └──────────┬─────────────────────┘
               │
    ┌──────────▼─────────────────────┐
    │  sessionStorage clean! ✓       │
    └──────────┬─────────────────────┘
               │
    ┌──────────▼─────────────────────┐
    │  router.push('/confirmation')  │
    └────────────────────────────────┘

╔═══════════════════════════════════════════════════════════════════════╗
║                        5. TAB CLOSE                                    ║
╚═══════════════════════════════════════════════════════════════════════╝

    User closes browser tab
             ⬇
    ┌─────────────────────────────┐
    │  Browser automatically      │
    │  clears sessionStorage      │
    └──────────┬──────────────────┘
               │
    ┌──────────▼──────────────────┐
    │  All data deleted ✓         │
    │  No persistence between     │
    │  separate browser sessions  │
    └─────────────────────────────┘
```

## Data Flow Summary

### Storage Keys Used

| Key | Form | Fields Stored | Size |
|-----|------|--------------|------|
| `checkout_persist_customer-info` | Customer Details | fullName, email, phone, emergency contacts, dietary, requests | ~300 bytes |
| `checkout_persist_payment-info` | Payment Method | method, cardName, cardExpiry, termsAccepted | ~100 bytes |
| `checkout_persist_shipping-option` | Shipping | selectedShippingOption | ~50 bytes |

### Security Filtering

```
INPUT DATA                    FILTERED DATA (SAVED)
{                            {
  method: 'card',              method: 'card',         ✓ Saved
  cardName: 'John Doe',        cardName: 'John Doe',   ✓ Saved
  cardNumber: '4111...',       [REMOVED]               ✗ Filtered
  cardExpiry: '12/25',         cardExpiry: '12/25',    ✓ Saved
  cardCVV: '123',              [REMOVED]               ✗ Filtered
  termsAccepted: true          termsAccepted: true     ✓ Saved
}                            }
```

### Debouncing Behavior

```
Timeline (User typing "John Doe"):

0ms     : User types "J"
          → saveFormData() called
          → Timer starts (500ms)

100ms   : User types "o"
          → saveFormData() called again
          → Previous timer CANCELLED
          → New timer starts (500ms)

200ms   : User types "h"
          → Previous timer CANCELLED
          → New timer starts (500ms)

300ms   : User types "n"
          → Previous timer CANCELLED
          → New timer starts (500ms)

400ms   : User types " "
          → Previous timer CANCELLED
          → New timer starts (500ms)

500ms   : User types "D"
          → Previous timer CANCELLED
          → New timer starts (500ms)

600ms   : User types "o"
          → Previous timer CANCELLED
          → New timer starts (500ms)

700ms   : User types "e"
          → Previous timer CANCELLED
          → New timer starts (500ms)

1200ms  : [User stops typing]
          → Timer expires
          → SINGLE save to sessionStorage
          → Value: "John Doe"

Result: 8 keystrokes → 1 storage write (87.5% reduction)
```

### Expiration & Cleanup

```
SCENARIO 1: Data within 1 hour
────────────────────────────────
Saved:   10:00 AM
Loaded:  10:30 AM (30 min later)
Result:  ✓ Data restored

SCENARIO 2: Data older than 1 hour
───────────────────────────────────
Saved:   10:00 AM
Loaded:  11:30 AM (90 min later)
Result:  ✗ Data expired & cleared

SCENARIO 3: Corrupted data
──────────────────────────
Saved:   Valid JSON
Loaded:  Corrupted/Invalid JSON
Result:  ✗ Data cleared, null returned

SCENARIO 4: Successful checkout
────────────────────────────────
Action:  Order completed
Result:  ✓ All data cleared immediately

SCENARIO 5: Tab closed
──────────────────────
Action:  Browser tab closed
Result:  ✓ All sessionStorage auto-cleared
```

## Error Handling Flow

```
┌────────────────────────┐
│  saveFormData() called │
└───────────┬────────────┘
            │
    ┌───────▼────────┐
    │  Try serialize │
    └───────┬────────┘
            │
     ┌──────▼──────┐
     │  Error?     │
     └──────┬──────┘
            │
    ┌───────┴────────┐
    │                │
 YES│             NO │
    ▼                ▼
┌─────────────┐  ┌──────────┐
│ QuotaError? │  │  Save ✓  │
└──────┬──────┘  └──────────┘
       │
   YES │
       ▼
┌──────────────────┐
│ clearOldestData()│
│ Retry save       │
└──────────────────┘
```

## Cross-Component Communication

```
┌─────────────────────┐
│  CustomerForm.tsx   │
│  - Manages own state│
│  - Calls parent     │
│    callback         │
└──────────┬──────────┘
           │
           │ onDataChange(data, isValid)
           │
           ▼
┌─────────────────────────────────┐
│  CheckoutPage.tsx               │
│  - handleCustomerDataChange()   │
│  - setCustomerData(data)        │
│  - saveFormData('customer')     │◄─── Persistence here
└─────────────────────────────────┘
           │
           │ saveFormData()
           │
           ▼
┌─────────────────────────────────┐
│  form-persistence.ts            │
│  - Filter sensitive fields      │
│  - Debounce                     │
│  - Save to sessionStorage       │
└─────────────────────────────────┘
```

---

**Legend**:
- ✓ = Operation successful
- ✗ = Operation blocked/failed
- → = Data flow direction
- ◄── = Note/annotation
