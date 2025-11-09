# 🧪 End-to-End Testing Guide - Product & Add-on Purchase Flow

**Project:** Sunshine Coast 4WD Tours
**Date:** November 7, 2025
**Status:** ✅ Servers Running (Medusa: 9000, Frontend: 8000)

---

## 🌐 Complete E2E Flow URLs

### **Full Customer Journey: Product Selection → Checkout → Confirmation**

```
┌─────────────────────────────────────────────────────────────┐
│  COMPLETE E2E BOOKING FLOW - 7 STEPS                        │
└─────────────────────────────────────────────────────────────┘

Step 1: Homepage
URL: http://localhost:8000/
Action: View hero section, click "Browse Tours"

Step 2: Tour Catalog (Browse All Tours)
URL: http://localhost:8000/tours
Actions:
  - Filter by duration
  - Sort by price
  - Search tours
  - View tour cards

Step 3: Tour Detail Page (Select Specific Tour)
URL: http://localhost:8000/tours/1d-fraser-island
Alternative URLs:
  - http://localhost:8000/tours/1d-rainbow-beach
  - http://localhost:8000/tours/2d-fraser-rainbow
  - http://localhost:8000/tours/3d-fraser-rainbow
  - http://localhost:8000/tours/4d-fraser-rainbow
Actions:
  - Select date (date picker)
  - Choose number of guests
  - View tour details
  - Click "Continue to Add-ons" (adds tour to cart)

Step 4: Add-ons Selection Page
URL: http://localhost:8000/checkout/add-ons
Available Add-ons:
  - Always-on High-Speed Internet ($50 AUD/day)
  - Glamping Setup ($250 AUD/day)
  - BBQ on the Beach ($180 AUD/booking)
Actions:
  - Select add-ons
  - Adjust quantities
  - View live total calculation
  - Click "Continue to Checkout"

Step 5: Checkout Page (Customer Details & Payment)
URL: http://localhost:8000/checkout
Actions:
  - Enter customer details (name, email, phone)
  - Enter payment information
  - Review order summary
  - View GST calculation (10%)
  - Click "Complete Booking"

Step 6: Confirmation Page
URL: http://localhost:8000/checkout/confirmation
Actions:
  - View booking reference number
  - View booking summary
  - Download receipt (future feature)
  - Start new booking

Step 7: Alternative Confirmation Route (Legacy)
URL: http://localhost:8000/confirmation
Note: Duplicate route - should be consolidated
```

---

## 🎯 Quick Test URLs

### **Fastest Path to Test Complete Flow:**

```bash
# 1. Start from tours catalog
http://localhost:8000/tours

# 2. Select Fraser Island tour
http://localhost:8000/tours/1d-fraser-island

# 3. Select add-ons
http://localhost:8000/checkout/add-ons

# 4. Complete checkout
http://localhost:8000/checkout

# 5. View confirmation
http://localhost:8000/checkout/confirmation
```

---

## 📋 Test Scenarios

### **Scenario 1: Basic Single Tour Booking**
1. Navigate to http://localhost:8000/tours
2. Click on "1 Day Fraser Island Tour"
3. Select today's date
4. Set guests: 2
5. Click "Continue to Add-ons"
6. Skip add-ons (click "Continue to Checkout")
7. Fill customer details
8. Complete booking

**Expected Result:**
- Total: $4,000 AUD (2 guests × $2,000)
- GST: $400 AUD
- Final Total: $4,400 AUD

---

### **Scenario 2: Tour + Add-ons Booking**
1. Navigate to http://localhost:8000/tours
2. Select "2 Day Fraser + Rainbow Combo"
3. Select date: 2 days from now
4. Guests: 4
5. Continue to add-ons
6. Add: "Always-on High-Speed Internet" (Qty: 2 days)
7. Add: "BBQ on the Beach" (Qty: 1)
8. Continue to checkout
9. Complete booking

**Expected Result:**
- Tour: $16,000 AUD (4 guests × $4,000)
- Internet: $100 AUD (2 days × $50)
- BBQ: $180 AUD
- Subtotal: $16,280 AUD
- GST: $1,628 AUD
- Final Total: $17,908 AUD

---

### **Scenario 3: Multi-day Tour with Glamping**
1. Navigate to http://localhost:8000/tours/4d-fraser-rainbow
2. Select date: Next weekend
3. Guests: 2
4. Continue to add-ons
5. Add: "Glamping Setup" (Qty: 4 days)
6. Add: "Always-on High-Speed Internet" (Qty: 4 days)
7. Complete checkout

**Expected Result:**
- Tour: $16,000 AUD (2 guests × $8,000)
- Glamping: $1,000 AUD (4 days × $250)
- Internet: $200 AUD (4 days × $50)
- Subtotal: $17,200 AUD
- GST: $1,720 AUD
- Final Total: $18,920 AUD

---

## 🧪 Manual Testing Checklist

### **Tours Catalog Page** (http://localhost:8000/tours)
- [ ] All 5 tours display correctly
- [ ] Filter by duration works
- [ ] Sort by price works (asc/desc)
- [ ] Search functionality works
- [ ] Tour cards show correct prices
- [ ] "View Details" buttons work
- [ ] Responsive design (mobile, tablet, desktop)
- [ ] Images load optimized (WebP/AVIF)
- [ ] Loading states display
- [ ] Error states handle gracefully

### **Tour Detail Page** (http://localhost:8000/tours/[handle])
- [ ] Tour details display correctly
- [ ] Date picker shows available dates
- [ ] Guest quantity selector works (min: 1)
- [ ] Price updates based on guest count
- [ ] "Continue to Add-ons" adds to cart
- [ ] Tour images display properly
- [ ] Metadata and SEO tags present
- [ ] Breadcrumb navigation works
- [ ] Mobile-friendly layout

### **Add-ons Page** (http://localhost:8000/checkout/add-ons)
- [ ] Cart summary shows selected tour
- [ ] All 3 add-ons display
- [ ] Quantity selectors work
- [ ] Prices update in real-time
- [ ] Total calculation accurate
- [ ] "Continue to Checkout" button works
- [ ] "Skip Add-ons" option works
- [ ] Per-day vs per-booking pricing clear
- [ ] Mobile layout functional

### **Checkout Page** (http://localhost:8000/checkout)
- [ ] Order summary displays all items
- [ ] GST calculation correct (10%)
- [ ] Customer form validation works
- [ ] Email validation works
- [ ] Phone validation works
- [ ] Payment method selection works
- [ ] "Complete Booking" button enabled when valid
- [ ] Form errors display clearly
- [ ] Price breakdown clear
- [ ] Terms & conditions checkbox

### **Confirmation Page** (http://localhost:8000/checkout/confirmation)
- [ ] Booking reference number generated
- [ ] All booking details correct
- [ ] Total matches checkout page
- [ ] "Start New Booking" button works
- [ ] Success message displays
- [ ] Booking summary accurate
- [ ] Print/download option (future)

---

## 🔍 API Endpoints to Test (Backend)

### **Store API (Public)**
```bash
# 1. List all tours
curl http://localhost:9000/store/products \
  -H "x-publishable-api-key: YOUR_KEY"

# 2. Get specific tour
curl http://localhost:9000/store/products?handle=1d-fraser-island \
  -H "x-publishable-api-key: YOUR_KEY"

# 3. List add-ons
curl http://localhost:9000/store/add-ons \
  -H "x-publishable-api-key: YOUR_KEY"

# 4. Create cart
curl -X POST http://localhost:9000/store/carts \
  -H "Content-Type: application/json" \
  -H "x-publishable-api-key: YOUR_KEY"

# 5. Add item to cart
curl -X POST http://localhost:9000/store/carts/{cart_id}/line-items \
  -H "Content-Type: application/json" \
  -H "x-publishable-api-key: YOUR_KEY" \
  -d '{"variant_id": "variant_id", "quantity": 2}'
```

---

## 📱 Device Testing Matrix

### **Browsers**
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)

### **Mobile Devices**
- [ ] iPhone (iOS Safari)
- [ ] Android (Chrome)
- [ ] Tablet (iPad)

### **Screen Sizes**
- [ ] Desktop: 1920×1080
- [ ] Laptop: 1366×768
- [ ] Tablet: 768×1024
- [ ] Mobile: 375×667

---

## ⚠️ Known Issues (From Audit)

### **Security Issues**
- ⚠️ No authentication on admin routes
- ⚠️ Payment data stored in localStorage (not production-ready)
- ⚠️ No rate limiting
- ⚠️ XSS vulnerability in blog content

### **Performance Issues**
- ⚠️ Tours page is client-side only (no SSR)
- ⚠️ Large images not optimized
- ⚠️ No database indexes (API slow)
- ⚠️ Sequential API calls

### **Functional Issues**
- ⚠️ Mock data used in some components
- ⚠️ Cart persists in localStorage only (no backend cart)
- ⚠️ No payment gateway integration
- ⚠️ No email confirmation

---

## 🚀 Automated E2E Test Commands

### **Run with Playwright (when implemented)**
```bash
# Run all E2E tests
npm run test:e2e

# Run specific test suite
npm run test:e2e -- booking-flow.spec.ts

# Run in headed mode (see browser)
npm run test:e2e -- --headed

# Run on specific device
npm run test:e2e -- --device="iPhone 12"
```

### **Current Status**
- ❌ Playwright config missing
- ❌ E2E tests written but not executable
- ⚠️ Need to implement before production

---

## 📊 Success Metrics

### **Performance Targets**
- Page load: <2 seconds
- API response: <200ms
- Time to interactive: <3 seconds
- Cart operations: <500ms

### **Conversion Funnel**
- Tours page → Detail: 40-60%
- Detail → Add-ons: 70-80%
- Add-ons → Checkout: 80-90%
- Checkout → Complete: 60-70%

### **Error Rates**
- API errors: <1%
- Client errors: <2%
- Payment failures: <5%

---

## 🐛 Bug Reporting Template

When testing, report bugs using this format:

```markdown
**URL:** http://localhost:8000/tours/1d-fraser-island
**Device:** Desktop Chrome 119
**Steps to Reproduce:**
1. Navigate to tour detail page
2. Select date: Tomorrow
3. Click "Continue to Add-ons"

**Expected Result:** Redirect to add-ons page with tour in cart
**Actual Result:** Cart is empty on add-ons page
**Severity:** High
**Screenshots:** [attach]
```

---

## 📞 Next Steps

1. **Manual Testing:** Follow scenarios above
2. **Report Issues:** Use bug template
3. **Performance Testing:** Check PageSpeed on each page
4. **Mobile Testing:** Test on real devices
5. **API Testing:** Verify backend endpoints
6. **Security Review:** Check OWASP Top 10
7. **Accessibility:** Test with screen reader

---

## 🎯 Ready to Test?

**Start Here:** http://localhost:8000/tours

Follow **Scenario 1** (Basic Single Tour Booking) first, then proceed to more complex scenarios.

**Questions or Issues?**
- Check `/docs/audit/EXECUTIVE_SUMMARY.md` for known issues
- Review security report before production testing
- Ensure both servers are running (Medusa: 9000, Frontend: 8000)

---

*Happy Testing!* 🚀
