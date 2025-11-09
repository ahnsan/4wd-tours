# User Journey Documentation
## Sunshine Coast 4WD Tours - E2E Booking Flow

---

## Table of Contents
1. [User Flow Overview](#user-flow-overview)
2. [Detailed Page-by-Page Journey](#detailed-page-by-page-journey)
3. [User Stories](#user-stories)
4. [Edge Cases & Error Handling](#edge-cases--error-handling)
5. [Mobile Experience](#mobile-experience)
6. [Accessibility Features](#accessibility-features)

---

## User Flow Overview

```
┌──────────────┐
│              │
│   Homepage   │
│              │
└──────┬───────┘
       │
       ▼
┌──────────────┐
│              │
│ Tours Catalog│
│  (Filtering) │
│              │
└──────┬───────┘
       │
       ▼
┌──────────────┐
│              │
│ Tour Detail  │
│ (Date/Pax)   │
│              │
└──────┬───────┘
       │
       ▼
┌──────────────┐
│              │
│   Add-ons    │
│  Selection   │
│              │
└──────┬───────┘
       │
       ▼
┌──────────────┐
│              │
│   Checkout   │
│ (Form + Pay) │
│              │
└──────┬───────┘
       │
       ▼
┌──────────────┐
│              │
│ Confirmation │
│              │
└──────────────┘
```

---

## Detailed Page-by-Page Journey

### 1. Homepage (`/`)

**Purpose**: Entry point, brand introduction, featured tours

**Key Elements**:
- Hero section with compelling imagery
- Featured tour cards
- Call-to-action: "Browse All Tours"
- Trust badges and testimonials
- Footer with contact information

**User Actions**:
- Browse featured tours
- Click "View Details" on tour cards
- Navigate to Tours page
- Access blog content
- Contact information

**SEO Optimizations**:
- Structured data (Organization, LocalBusiness)
- Open Graph tags
- Meta descriptions
- Performance optimization (LCP < 2.5s)

---

### 2. Tours Catalog (`/tours`)

**Purpose**: Browse and filter available tours

**Key Elements**:
- Breadcrumb navigation (Home > Tours)
- Category filter buttons
- Tour grid with cards showing:
  - Tour image
  - Title and description
  - Price (from AUD $X)
  - Duration
  - Max participants
  - Difficulty badge
- Information section highlighting benefits

**User Actions**:
- Filter tours by category
- View tour cards
- Click "View Details" to see individual tours
- Compare prices and durations

**Filtering Categories**:
- All Tours
- Beach & Coastal
- Camping & Adventure
- Hiking & Nature
- Beach & Wildlife
- Outback & Hinterland
- Training & Skills

**State Management**:
- No cart state required yet
- Filter state managed locally

---

### 3. Tour Detail Page (`/tours/[id]`)

**Purpose**: Detailed tour information, booking configuration

**Layout**:
- Left Column: Tour details, highlights, requirements
- Right Column: Sticky booking widget

**Key Elements**:

**Left Column**:
- Image gallery
- Full tour description
- Tour highlights (with checkmarks)
- What's included
- Requirements and preparation
- Safety information

**Right Column - Booking Widget**:
- Price display (AUD $X per person)
- Date selector (next 30 days)
- Participant quantity selector (1 to max participants)
- Running subtotal
- "Add to Cart & Continue" button
- Trust badges:
  - Secure Booking
  - Free Cancellation
  - Best Price Guarantee

**User Actions**:
1. Select tour date from dropdown
2. Adjust participant count (+/- buttons)
3. Review subtotal calculation
4. Click "Add to Cart & Continue"

**Validation**:
- Date selection required
- Participants must be between 1 and max allowed
- Real-time subtotal updates

**Cart State**:
- Tour added to CartContext
- Stored in localStorage
- Redirects to Add-ons page

---

### 4. Add-ons Selection Page (`/addons`)

**Purpose**: Enhance tour with optional extras

**Guard**: Redirects to /tours if no tour in cart

**Layout**:
- Left Column: Add-ons selection
- Right Column: Sticky cart summary

**Key Elements**:

**Left Column**:
- Header explaining add-ons
- Category filter buttons
- Add-on cards showing:
  - Name and category badge
  - Description
  - Price
  - Add/Remove buttons
  - Quantity controls

**Right Column - Cart Summary**:
- Tour details:
  - Tour name
  - Selected date
  - Number of participants
  - Subtotal
- Selected add-ons with quantities
- Running total
- Action buttons:
  - "Continue to Checkout"
  - "Skip Add-ons"
- Trust badges

**User Actions**:
1. Browse add-on categories
2. Click "Add to Cart" for desired add-ons
3. Adjust quantities with +/- buttons
4. Remove unwanted add-ons
5. Review cart summary
6. Click "Continue to Checkout" or "Skip Add-ons"

**Add-on Categories**:
- All Add-ons
- Food & Beverage
- Photography
- Equipment
- Transport
- Insurance

**Sample Add-ons**:
- Gourmet Picnic Lunch (AUD $35)
- Professional Photography Package (AUD $150)
- GoPro Camera Rental (AUD $45)
- Camping Equipment Package (AUD $80)
- Sunset Champagne Experience (AUD $65)
- Hotel Pickup & Drop-off (AUD $40)

**Cart State**:
- Add-ons tracked in CartContext
- Real-time total updates
- Persisted to localStorage

---

### 5. Checkout Page (`/checkout`)

**Purpose**: Collect customer information, process booking

**Guard**: Redirects to /tours if no tour in cart

**Layout**:
- Left Column: Multi-section form
- Right Column: Sticky order summary

**Key Elements**:

**Left Column - Form Sections**:

1. **Personal Information**
   - First Name (required, min 2 chars)
   - Last Name (required, min 2 chars)
   - Email (required, valid format)
   - Phone (required, Australian format)

2. **Address Information**
   - Street Address (required)
   - City (required)
   - State (dropdown, default QLD)
   - Postcode (required, 4 digits)

3. **Special Requests**
   - Textarea for dietary, accessibility needs, etc.
   - Optional field

4. **Terms & Conditions**
   - Checkbox (required)
   - Links to T&C and Privacy Policy

**Right Column - Order Summary**:
- Complete booking breakdown:
  - Tour details with date and participants
  - Add-ons with quantities
  - Total amount
- Security badge
- "Secure Checkout" messaging

**User Actions**:
1. Fill all required fields
2. Add special requests if needed
3. Agree to terms
4. Click "Complete Booking"

**Validation**:
- Real-time field validation
- Email format validation
- Phone number validation (Australian)
- Postcode validation (4 digits)
- Required field checks
- Scroll to first error on submit

**Form Errors**:
- Inline error messages below fields
- Red border on invalid fields
- Prevents submission until valid

**Submission Process**:
1. Validate all fields
2. Show loading state ("Processing...")
3. Simulate API call (2 second delay)
4. Generate booking reference (SC4WD-XXXXXXXX)
5. Store booking data in sessionStorage
6. Clear cart
7. Redirect to confirmation page

**Cart State**:
- Booking data stored temporarily
- Cart cleared after successful submission

---

### 6. Confirmation Page (`/confirmation?ref=XXX`)

**Purpose**: Booking confirmation, next steps, customer reassurance

**Guard**: Shows "Booking Not Found" if no booking data

**Key Elements**:

**Success Indicators**:
- Animated success icon (green checkmark)
- "Booking Confirmed!" heading
- Booking reference number (prominent display)
- Confirmation email notification

**Content Layout**:

**Left Column - Booking Details**:
1. **Confirmation Email Sent**
   - Highlighted info card
   - Email address confirmation

2. **Customer Details**
   - Name, email, phone
   - Formatted display

3. **Tour Details Card**
   - Tour name and price
   - Full date display
   - Participant count
   - Visual icons

4. **Add-ons List** (if applicable)
   - Name and quantity
   - Individual prices

5. **Total Section**
   - Prominent "Total Paid" amount

**Right Column - Next Steps**:

**Numbered Steps List**:
1. **Check Your Email**
   - Confirmation sent
   - Pre-tour information

2. **Prepare for Your Tour**
   - Packing list reminder
   - Clothing requirements

3. **Meet Your Guide**
   - Arrival time (15 min early)
   - Meeting point info

4. **Enjoy Your Adventure**
   - Camera reminder
   - Relaxation encouragement

**Help Card**:
- Contact information:
  - Email: bookings@sunshinecoast4wdtours.com.au
  - Phone: +61 XXX XXX XXX
  - Hours: Mon-Sun, 8 AM - 6 PM AEST

**Action Buttons**:
- "Print Confirmation" (opens print dialog)
- "Browse More Tours" (link to /tours)
- "Return to Homepage" (link to /)

**Social Sharing**:
- "Share your excitement!" prompt
- Social media buttons:
  - Facebook
  - Twitter
  - Instagram

**User Actions**:
1. Review booking details
2. Print confirmation
3. Share on social media
4. Browse more tours
5. Return to homepage

**Data Source**:
- Booking data from sessionStorage
- Booking reference from URL parameter

---

## User Stories

### Primary User Story
**As a** tourist planning a Sunshine Coast vacation
**I want to** browse and book 4WD tours online
**So that** I can secure my adventure in advance and enhance it with add-ons

**Acceptance Criteria**:
- ✅ Can browse tour catalog with filtering
- ✅ Can view detailed tour information
- ✅ Can select date and participant count
- ✅ Can add optional extras
- ✅ Can complete booking with valid information
- ✅ Receives booking confirmation

---

### Secondary User Stories

#### Mobile User
**As a** mobile user browsing on my phone
**I want** a responsive mobile experience
**So that** I can book tours on the go

**Acceptance Criteria**:
- ✅ Mobile-optimized navigation menu
- ✅ Touch-friendly interface elements
- ✅ Responsive layouts for all pages
- ✅ Fast loading on mobile networks

#### Cautious Buyer
**As a** cautious online shopper
**I want** security and trust indicators
**So that** I feel confident completing my purchase

**Acceptance Criteria**:
- ✅ Trust badges throughout flow
- ✅ Secure checkout messaging
- ✅ Free cancellation policy displayed
- ✅ Clear pricing with no hidden fees

#### International Tourist
**As an** international tourist
**I want** clear information and pricing
**So that** I understand what I'm booking

**Acceptance Criteria**:
- ✅ Clear currency display (AUD)
- ✅ Detailed tour descriptions
- ✅ What's included clearly listed
- ✅ Requirements and preparation info

---

## Edge Cases & Error Handling

### Cart State Edge Cases

#### 1. Empty Cart Access
**Scenario**: User navigates to /addons or /checkout without items in cart

**Handling**:
- Show "No Tour Selected" message
- Provide "Browse Tours" link
- Redirect to /tours

#### 2. Cart Persistence
**Scenario**: User refreshes page or closes browser

**Handling**:
- Cart state persisted to localStorage
- Restored on page load
- Survives browser refresh

#### 3. Stale Cart Data
**Scenario**: User returns after extended period, tour may be unavailable

**Handling**:
- Current Implementation: No expiration
- Recommended: Add timestamp, validate on checkout
- Future: Check availability with backend

---

### Form Validation Edge Cases

#### 1. Invalid Email Formats
**Examples**:
- `user@` (no domain)
- `@domain.com` (no user)
- `user.domain.com` (no @)

**Handling**:
- Regex validation: `/^[^\s@]+@[^\s@]+\.[^\s@]+$/`
- Inline error message
- Prevents submission

#### 2. Phone Number Formats
**Valid Formats**:
- `0412345678`
- `04 1234 5678`
- `(04) 1234-5678`
- `+61 412 345 678`

**Handling**:
- Accepts various formats
- Validates minimum 10 digits
- Shows error if too short

#### 3. Postcode Validation
**Requirements**:
- Australian postcodes: 4 digits
- Range: 0000-9999

**Handling**:
- Regex: `/^\d{4}$/`
- Inline error for invalid format

---

### Navigation Edge Cases

#### 1. Back Button Behavior
**Scenario**: User clicks browser back button

**Handling**:
- Cart state persists
- Can navigate freely
- No data loss

#### 2. Direct URL Access
**Scenario**: User bookmarks or shares deep link

**Examples**:
- `/tours/tour-1` - Works, shows tour
- `/addons` - Redirects if no cart
- `/checkout` - Redirects if no cart
- `/confirmation` - Shows "not found" if no data

#### 3. Missing Tour ID
**Scenario**: User accesses `/tours/invalid-id`

**Handling**:
- 404 handling
- "Tour Not Found" message
- Link to browse all tours

---

### Payment & Submission Edge Cases

#### 1. Network Failure During Submission
**Current Handling**:
- Error message displayed
- Form remains filled
- User can retry

**Recommended Enhancement**:
- Implement retry logic
- Save form data temporarily
- Show specific error messages

#### 2. Duplicate Submission Prevention
**Current Handling**:
- Button disabled during submission
- Shows "Processing..." state

**Protection**:
- Button disabled state
- Loading indicator
- Prevents double-clicking

#### 3. Session Expiration
**Scenario**: User leaves form open for extended period

**Current Handling**:
- No session timeout
- localStorage persists

**Recommended**:
- Add session timeout warning
- Auto-save form progress

---

## Mobile Experience

### Responsive Breakpoints

#### Desktop (1024px+)
- Two-column layouts (detail + sidebar)
- Horizontal navigation
- Sticky booking widgets

#### Tablet (768px - 1023px)
- Single column layouts
- Collapsible sections
- Touch-optimized controls

#### Mobile (< 768px)
- Full-width single column
- Mobile navigation menu (hamburger)
- Stacked layouts
- Large touch targets (min 44px)

### Mobile-Specific Features

#### 1. Navigation
- Hamburger menu icon
- Full-screen menu overlay
- Large touch targets
- Mobile-friendly dropdowns

#### 2. Form Inputs
- Mobile keyboards optimized:
  - `type="email"` for email keyboard
  - `type="tel"` for phone keyboard
  - `type="number"` for numeric inputs
- Auto-zoom disabled (max-scale=5)
- Touch-friendly date selectors

#### 3. Images
- Responsive images with `srcset`
- Lazy loading for below-fold images
- WebP format with fallbacks

#### 4. Performance
- Mobile-first CSS
- Reduced animations on mobile
- Optimized asset loading

---

## Accessibility Features

### WCAG 2.1 AA Compliance

#### 1. Semantic HTML
- Proper heading hierarchy (h1, h2, h3)
- `<main>` landmark for content
- `<nav>` landmark for navigation
- `<aside>` for supplementary content

#### 2. ARIA Labels
- Descriptive button labels
- Form field labels
- Navigation landmarks
- Icon buttons with aria-label

#### 3. Keyboard Navigation
- All interactive elements keyboard accessible
- Visible focus indicators
- Logical tab order
- Skip links (recommended addition)

#### 4. Screen Reader Support
- Alternative text for images
- Form field labels properly associated
- Error messages announced
- Status updates (ARIA live regions)

#### 5. Color Contrast
- Text meets minimum 4.5:1 ratio
- Interactive elements meet 3:1 ratio
- Focus indicators meet contrast requirements

#### 6. Form Accessibility
- Labels for all form inputs
- Error messages clearly associated
- Required fields indicated
- Help text for complex fields

### Accessibility Testing Checklist
- ✅ Keyboard navigation works
- ✅ Screen reader compatibility
- ✅ Color contrast verified
- ✅ Focus indicators visible
- ✅ Alt text for images
- ✅ Form labels present
- ✅ Error messages descriptive
- ✅ ARIA landmarks used

---

## Performance Optimizations

### Core Web Vitals Targets

#### LCP (Largest Contentful Paint)
- **Target**: < 2.5 seconds
- **Optimizations**:
  - Hero image preloading
  - Font preloading
  - Critical CSS inlining
  - Image optimization (WebP, lazy loading)

#### FID (First Input Delay)
- **Target**: < 100 milliseconds
- **Optimizations**:
  - Minimal JavaScript on initial load
  - Code splitting
  - Defer non-critical scripts

#### CLS (Cumulative Layout Shift)
- **Target**: < 0.1
- **Optimizations**:
  - Reserved space for images
  - No layout shifts on load
  - Stable font loading (font-display: swap)

### Loading Strategy
1. Critical HTML + CSS loaded first
2. Above-fold images prioritized
3. Below-fold images lazy loaded
4. Third-party scripts deferred
5. Progressive enhancement approach

---

## Future Enhancements

### Phase 2: Payment Integration
- Stripe payment gateway
- Secure payment processing
- Payment confirmation
- Receipt generation

### Phase 3: Backend Integration
- Medusa e-commerce backend
- Real-time availability checking
- Inventory management
- Order processing workflow
- Email notifications (automated)

### Phase 4: Advanced Features
- User accounts and profiles
- Booking history
- Wish lists / saved tours
- Multi-language support
- Currency conversion
- Review and rating system
- Photo galleries
- Live chat support
- Calendar view for availability
- Group booking discounts
- Gift vouchers

### Phase 5: Analytics & Optimization
- Google Analytics 4 integration
- Conversion funnel tracking
- A/B testing framework
- Heatmaps and session recordings
- Performance monitoring (Real User Monitoring)

---

## Testing Coverage

### E2E Tests (Playwright)
- ✅ Complete booking flow
- ✅ Form validation
- ✅ Cart persistence
- ✅ Navigation flow
- ✅ Mobile responsiveness
- ✅ Error handling
- ✅ Performance tests
- ✅ Accessibility tests

### Manual Testing Checklist
- [ ] Cross-browser testing (Chrome, Firefox, Safari, Edge)
- [ ] Mobile device testing (iOS, Android)
- [ ] Screen reader testing (NVDA, JAWS, VoiceOver)
- [ ] Keyboard-only navigation
- [ ] Various network conditions (3G, 4G, WiFi)
- [ ] Different viewport sizes
- [ ] Print functionality

---

## Support & Maintenance

### User Support Channels
- Email: bookings@sunshinecoast4wdtours.com.au
- Phone: +61 XXX XXX XXX
- Hours: Mon-Sun, 8:00 AM - 6:00 PM AEST

### Documentation
- User guide (this document)
- Technical documentation
- API documentation (when backend integrated)
- Troubleshooting guide

### Monitoring
- Error tracking (recommended: Sentry)
- Performance monitoring (recommended: Lighthouse CI)
- Uptime monitoring
- User analytics

---

## Conclusion

This E2E booking flow provides a complete, user-friendly experience for booking 4WD tours on the Sunshine Coast. The implementation focuses on:

1. **Usability**: Clear navigation, intuitive interface
2. **Performance**: Fast loading, optimized assets
3. **Accessibility**: WCAG 2.1 AA compliant
4. **Mobile-First**: Responsive design for all devices
5. **Security**: Secure booking process with trust indicators
6. **Robustness**: Comprehensive error handling and validation

The flow is production-ready for frontend operations and prepared for backend integration in Phase 2.

---

**Document Version**: 1.0
**Last Updated**: November 2025
**Maintained By**: E2E Flow Integration Team
