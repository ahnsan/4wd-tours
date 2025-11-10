# Tour Detail Page Content Mapping

## Overview
This document maps all content sections on tour detail pages to their data sources and identifies which fields need backend editing capabilities through the Medusa Admin panel.

**Last Updated**: 2025-11-08
**Page File**: `/Users/Karim/med-usa-4wd/storefront/app/tours/[handle]/page.tsx`
**Client Component**: `/Users/Karim/med-usa-4wd/storefront/app/tours/[handle]/tour-detail-client.tsx`

---

## Content Sections on Tour Detail Page

### 1. Hero Section
**Location**: Lines 374-399 in `tour-detail-client.tsx`

**Content Displayed**:
- Hero Image (full-width, 500px height on desktop)
- Tour Title (H1)
- Category Badge
- Difficulty Badge

**Data Sources**:
| Field | Source | Current Path | Editable in Admin? |
|-------|--------|--------------|-------------------|
| Hero Image | Product images | `tour.images[selectedImageIndex].url` | Yes (Product Images) |
| Title | Product field | `tour.title` | Yes (Product Title) |
| Category | Metadata | `tour.metadata?.category` | **NO - Needs UI** |
| Difficulty | Metadata | `tour.metadata?.difficulty` | **NO - Needs UI** |

**Fallback Strategy**:
- Hero image defaults to thumbnail, then first product image, then `/images/tour_options.png`

---

### 2. Image Gallery
**Location**: Lines 432-450 in `tour-detail-client.tsx`
**Component**: Built-in thumbnail gallery (not using TourGallery component)

**Content Displayed**:
- Thumbnail strip (120x80px each)
- Click to select main hero image
- Scrollable horizontal strip

**Data Sources**:
| Field | Source | Current Path | Editable in Admin? |
|-------|--------|--------------|-------------------|
| Gallery Images | Product images | `tour.images[]` | Yes (Product Images) |
| Image Alt Text | Image metadata | `image.alt` | Yes (Product Images) |

**Note**: The TourGallery component (`/Users/Karim/med-usa-4wd/storefront/components/Tours/TourGallery.tsx`) exists but is NOT currently used on the tour detail page. It provides a more advanced gallery with navigation arrows.

---

### 3. About This Tour Section
**Location**: Lines 457-471 in `tour-detail-client.tsx`

**Content Displayed**:
- Section title: "About This Tour"
- Tour description (rich text)
- Fallback description if none provided

**Data Sources**:
| Field | Source | Current Path | Editable in Admin? |
|-------|--------|--------------|-------------------|
| Description | Product field | `tour.description` | Yes (Product Description) |

**Fallback Content**:
```
"Embark on an unforgettable 4WD adventure through the stunning landscapes
of the Sunshine Coast. This tour offers the perfect blend of excitement
and natural beauty, taking you to some of Queensland's most spectacular
off-road destinations..."
```

---

### 4. Tour Itinerary Section
**Location**: Lines 474-493 in `tour-detail-client.tsx`
**Generator Function**: `generateItinerary()` (lines 253-351)

**Content Displayed**:
- Section title: "Tour Itinerary"
- Timeline-style itinerary items with:
  - Time/Day indicator
  - Activity title
  - Activity description

**Data Sources**:
| Field | Source | Current Path | Editable in Admin? |
|-------|--------|--------------|-------------------|
| Itinerary | **HARDCODED** | Generated based on `duration_days` | **NO - Needs Custom Field** |
| Duration | Metadata | `tour.metadata?.duration_days` | **NO - Needs UI** |

**Current Behavior**:
- **1-day tours**: 7 hardcoded time slots (7:00 AM to 5:30 PM)
- **2-day tours**: 7 hardcoded activities (Day 1 & Day 2)
- **3+ day tours**: 3 generic activities

**CRITICAL NEED**: Backend-editable itinerary field
- Should support multiple itinerary items
- Each item needs: time/day, title, description
- Should be stored as structured JSON in metadata

**Recommended Metadata Structure**:
```json
{
  "itinerary": [
    {
      "time": "7:00 AM",
      "title": "Pickup from Meeting Point",
      "description": "We'll collect you from your accommodation..."
    },
    {
      "time": "8:30 AM",
      "title": "Rainbow Beach Arrival",
      "description": "Arrive at Rainbow Beach and receive..."
    }
  ]
}
```

---

### 5. What to Expect Section (Inclusions & Exclusions)
**Location**: Lines 496-545 in `tour-detail-client.tsx`

**Content Displayed**:
- Section title: "What to Expect"
- Two-column grid:
  - "What's Included" list (green checkmarks)
  - "Not Included" list (red X marks)

**Data Sources**:
| Field | Source | Current Path | Editable in Admin? |
|-------|--------|--------------|-------------------|
| Inclusions | Metadata (array) | `tour.metadata?.inclusions` | **NO - Needs UI** |
| Exclusions | Metadata (array) | `tour.metadata?.exclusions` | **NO - Needs UI** |

**Current Fallback** (in `convertTourToProduct()`, lines 279-289 in `tours-service.ts`):
```javascript
inclusions: [
  'Professional 4WD guide',
  'All national park fees',
  'Safety equipment',
  'Complimentary water and snacks',
],
exclusions: [
  'Personal travel insurance',
  'Meals (unless specified)',
  'Alcoholic beverages',
]
```

---

### 6. Booking Card - Price Section
**Location**: Lines 549-560 in `tour-detail-client.tsx`

**Content Displayed**:
- "Total Price" label
- Calculated total price (formatted currency)
- Price breakdown: "$2000 per day × X days"

**Data Sources**:
| Field | Source | Current Path | Editable in Admin? |
|-------|--------|--------------|-------------------|
| Base Price | Variant calculated_price | `variant.calculated_price.calculated_amount` | Yes (Variant Pricing) |
| Duration Days | Metadata | `tour.metadata?.duration_days` | **NO - Needs UI** |
| Currency | Price region | `productPrice?.currency_code` | Yes (Region Settings) |

**Current Pricing Logic**:
- **Base**: $2000 per day (hardcoded constant)
- **Total**: duration_days × $2000
- Stored in cents (amount / 100 for display)

---

### 7. Booking Card - Quick Info
**Location**: Lines 562-593 in `tour-detail-client.tsx`

**Content Displayed**:
- Duration (with clock icon)
- Max participants (with people icon)
- Departure time (with clock icon)

**Data Sources**:
| Field | Source | Current Path | Editable in Admin? |
|-------|--------|--------------|-------------------|
| Duration | Metadata | `tour.metadata?.duration` | **NO - Needs UI** |
| Max Participants | Metadata | `tour.metadata?.max_participants` | **NO - Needs UI** |
| Departure Times | Metadata (array) | `tour.metadata?.departure_times[0]` | **NO - Needs UI** |

**Current Fallback** (in `convertTourToProduct()`, lines 272-278 in `tours-service.ts`):
```javascript
duration: tour.duration, // e.g., "1 Day" or "2 Days"
max_participants: tour.maxParticipants,
departure_times: ['8:00 AM'],
```

---

### 8. Booking Card - Date Picker
**Location**: Lines 600-608 in `tour-detail-client.tsx`
**Component**: `/Users/Karim/med-usa-4wd/storefront/components/Tours/DatePicker.tsx`

**Content Displayed**:
- "Select Date" label
- Date picker component
- Minimum date: today
- Unavailable dates: empty array (not implemented)

**Data Sources**:
| Field | Source | Current Path | Editable in Admin? |
|-------|--------|--------------|-------------------|
| Unavailable Dates | **NOT IMPLEMENTED** | Empty array `[]` | **NO - Needs Booking System** |

**Future Enhancement**:
- Needs backend integration for tour availability
- Should connect to booking/inventory system
- Block out dates that are fully booked

---

### 9. Booking Card - Pricing Info
**Location**: Lines 611-627 in `tour-detail-client.tsx`

**Content Displayed**:
- Duration: "X day(s)"
- Rate per day: "$2,000"
- Divider line
- Total calculated price

**Data Sources**:
| Field | Source | Current Path | Editable in Admin? |
|-------|--------|--------------|-------------------|
| Duration Days | Metadata | `tour.metadata?.duration_days` | **NO - Needs UI** |
| Price Per Day | Hardcoded | `getPricePerDay()` returns 2000 | **NO - Should be Product Price** |
| Total Price | Calculated | `getTotalPrice()` | Auto-calculated |

---

### 10. SEO & Structured Data
**Location**: Lines 156-194 in `tour-detail-client.tsx` (structured data) and lines 22-69 in `page.tsx` (metadata)

**Content Displayed** (not visible, for search engines):
- Product schema (JSON-LD)
- Open Graph metadata
- Twitter Card metadata
- Meta description

**Data Sources**:
| Field | Source | Current Path | Editable in Admin? |
|-------|--------|--------------|-------------------|
| Product Name | Product field | `tour.title` | Yes (Product Title) |
| Description | Product field | `tour.description` | Yes (Product Description) |
| Images | Product images | `tour.images[]` | Yes (Product Images) |
| Price | Calculated | `productPrice.amount` | Yes (Variant Pricing) |
| Duration | Metadata | `tour.metadata?.duration` | **NO - Needs UI** |
| Category | Metadata | `tour.metadata?.category` | **NO - Needs UI** |
| Difficulty | Metadata | `tour.metadata?.difficulty` | **NO - Needs UI** |

**Structured Data Example**:
```json
{
  "@context": "https://schema.org",
  "@type": "Product",
  "name": "Fraser Island 4WD Adventure",
  "description": "...",
  "image": ["url1", "url2"],
  "brand": { "@type": "Brand", "name": "Sunshine Coast 4WD Tours" },
  "offers": {
    "@type": "Offer",
    "price": "2000.00",
    "priceCurrency": "AUD",
    "availability": "https://schema.org/InStock"
  },
  "aggregateRating": {
    "@type": "AggregateRating",
    "ratingValue": "4.8",
    "reviewCount": "127"
  }
}
```

**Note**: Ratings (4.8, 127 reviews) are **HARDCODED** - need review system integration.

---

## Complete Metadata Field Mapping

### Currently Used Metadata Fields

| Metadata Field | Type | Used For | Editable? | Priority |
|----------------|------|----------|-----------|----------|
| `duration` | string | Display string (e.g., "1 Day") | NO | HIGH |
| `duration_days` | number | Price calculation, itinerary logic | NO | HIGH |
| `category` | string | Hero badge, SEO, filtering | NO | HIGH |
| `difficulty` | string | Hero badge, SEO | NO | MEDIUM |
| `max_participants` | number | Booking card quick info | NO | MEDIUM |
| `min_participants` | number | Quantity selector limits | NO | LOW |
| `departure_times` | string[] | Booking card quick info | NO | MEDIUM |
| `inclusions` | string[] | What's Included list | NO | HIGH |
| `exclusions` | string[] | Not Included list | NO | HIGH |
| `featured` | boolean | Featured badge on tour cards | NO | LOW |

### Recommended New Metadata Fields

| New Field | Type | Purpose | Priority |
|-----------|------|---------|----------|
| `itinerary` | JSON array | Custom itinerary items (time, title, desc) | **CRITICAL** |
| `unavailable_dates` | date[] | Block out fully booked dates | HIGH |
| `highlights` | string[] | Key tour highlights/features | MEDIUM |
| `requirements` | string[] | What participants need to bring | MEDIUM |
| `age_restrictions` | string | Age requirements (e.g., "12+") | LOW |
| `fitness_level` | string | Required fitness level | LOW |
| `cancellation_policy` | string | Cancellation terms | MEDIUM |

---

## Component File Paths Reference

### Page Components
- **Main Page**: `/Users/Karim/med-usa-4wd/storefront/app/tours/[handle]/page.tsx`
- **Client Component**: `/Users/Karim/med-usa-4wd/storefront/app/tours/[handle]/tour-detail-client.tsx`
- **Styles**: `/Users/Karim/med-usa-4wd/storefront/app/tours/[handle]/tour-detail.module.css`

### Shared Components
- **TourGallery**: `/Users/Karim/med-usa-4wd/storefront/components/Tours/TourGallery.tsx` (NOT CURRENTLY USED)
- **DatePicker**: `/Users/Karim/med-usa-4wd/storefront/components/Tours/DatePicker.tsx`
- **TourCard**: `/Users/Karim/med-usa-4wd/storefront/components/Tours/TourCard.tsx` (for listing pages)

### Data Layer
- **Tours Service**: `/Users/Karim/med-usa-4wd/storefront/lib/data/tours-service.ts`
- **Cart Context**: `/Users/Karim/med-usa-4wd/storefront/contexts/CartContext.tsx`
- **Tour Types**: `/Users/Karim/med-usa-4wd/storefront/lib/types/tour.ts`

---

## Admin UI Requirements Summary

### Phase 1 - Critical Fields (Immediate Need)
These fields are essential for content editors to manage tour information:

1. **Itinerary Builder** (CRITICAL)
   - Multi-item input for custom itineraries
   - Fields: time/day, title, description per item
   - Add/remove/reorder capabilities
   - Store as `metadata.itinerary` JSON array

2. **Duration Fields** (HIGH)
   - `duration` (string): Display text (e.g., "2 Days / 1 Night")
   - `duration_days` (number): For calculations
   - Should auto-sync if possible

3. **Inclusions/Exclusions** (HIGH)
   - `inclusions` (string array): What's included
   - `exclusions` (string array): What's not included
   - Multi-line text input, converts to array

4. **Tour Attributes** (HIGH)
   - `category` (select): Adventure, Cultural, Beach, etc.
   - `difficulty` (select): Easy, Moderate, Challenging, Expert
   - `max_participants` (number): Capacity limit

### Phase 2 - Enhanced Fields (Secondary Priority)

5. **Booking Information** (MEDIUM)
   - `departure_times` (string array): Available start times
   - `min_participants` (number): Minimum to run tour
   - `unavailable_dates` (date array): Blocked dates

6. **Additional Content** (MEDIUM)
   - `highlights` (string array): Key features
   - `requirements` (string array): What to bring
   - `cancellation_policy` (text): Terms and conditions

### Phase 3 - Future Enhancements (Low Priority)

7. **Advanced Features** (LOW)
   - `featured` (boolean): Show featured badge
   - `age_restrictions` (string): Age requirements
   - `fitness_level` (string): Physical requirements
   - Review/rating system integration

---

## Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                     MEDUSA BACKEND                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Product Fields (Editable in Admin):                       │
│  ├─ title         ✓ Editable                              │
│  ├─ description   ✓ Editable                              │
│  ├─ images[]      ✓ Editable                              │
│  ├─ thumbnail     ✓ Editable                              │
│  └─ variants[]    ✓ Editable (prices)                     │
│                                                             │
│  Metadata Fields (NOT Editable without custom UI):         │
│  ├─ duration          ✗ Needs UI                          │
│  ├─ duration_days     ✗ Needs UI                          │
│  ├─ category          ✗ Needs UI                          │
│  ├─ difficulty        ✗ Needs UI                          │
│  ├─ inclusions[]      ✗ Needs UI                          │
│  ├─ exclusions[]      ✗ Needs UI                          │
│  ├─ max_participants  ✗ Needs UI                          │
│  ├─ departure_times[] ✗ Needs UI                          │
│  └─ itinerary[]       ✗ Needs UI (CRITICAL)               │
│                                                             │
└──────────────────┬──────────────────────────────────────────┘
                   │
                   │ API Call: /store/products?handle={handle}
                   ↓
┌─────────────────────────────────────────────────────────────┐
│                    TOURS SERVICE                            │
│          (tours-service.ts)                                 │
├─────────────────────────────────────────────────────────────┤
│  Fetches product from Medusa API                           │
│  Converts to Tour format                                    │
│  Applies fallbacks for missing metadata                    │
└──────────────────┬──────────────────────────────────────────┘
                   │
                   ↓
┌─────────────────────────────────────────────────────────────┐
│              TOUR DETAIL PAGE (SSR)                         │
│          (page.tsx)                                         │
├─────────────────────────────────────────────────────────────┤
│  Validates data                                             │
│  Generates SEO metadata                                     │
│  Passes to client component                                 │
└──────────────────┬──────────────────────────────────────────┘
                   │
                   ↓
┌─────────────────────────────────────────────────────────────┐
│          TOUR DETAIL CLIENT COMPONENT                       │
│      (tour-detail-client.tsx)                               │
├─────────────────────────────────────────────────────────────┤
│  Renders all content sections:                             │
│  ├─ Hero (title, category, difficulty)                     │
│  ├─ Gallery (images)                                        │
│  ├─ About (description)                                     │
│  ├─ Itinerary (GENERATED from duration_days)               │
│  ├─ Inclusions/Exclusions                                   │
│  ├─ Booking Card (price, duration, participants)           │
│  └─ Date Picker & CTA                                       │
└─────────────────────────────────────────────────────────────┘
```

---

## Recommendations

### 1. Immediate Action Items

**Create Medusa Admin UI Widget for Tour Metadata** with the following fields:
- Duration (text + number)
- Category (dropdown)
- Difficulty (dropdown)
- Max/Min Participants (numbers)
- Departure Times (multi-input)
- Inclusions (multi-line)
- Exclusions (multi-line)
- **Itinerary Builder (drag-drop interface)**

### 2. Technical Implementation

**Option A: Custom Admin Widget**
- Create custom React component in Medusa Admin
- Use Medusa UI components for consistency
- Save to `product.metadata` field
- Reference: Medusa Admin Widgets documentation

**Option B: JSON Editor (Quick Solution)**
- Use Monaco editor or similar for JSON editing
- Provide schema/validation
- Less user-friendly but faster to implement

**Option C: External CMS Integration**
- Use Strapi, Contentful, or Sanity
- Sync with Medusa via webhooks
- More complex but very flexible

### 3. Content Migration Strategy

Once admin UI is ready:
1. Identify all tours needing content updates
2. Create content templates for consistency
3. Populate itineraries for each tour
4. Add inclusions/exclusions specific to each tour
5. Set proper categories and difficulty levels
6. Review and test all tour pages

### 4. Future Enhancements

- **Dynamic Pricing**: Remove $2000/day constant, use variant prices
- **Availability Calendar**: Real-time booking integration
- **Review System**: Replace hardcoded ratings
- **Multi-language Support**: i18n for metadata fields
- **Rich Text Editor**: For descriptions and itinerary items
- **Media Library**: Centralized image management

---

## Testing Checklist

When metadata editing is implemented, test:

- [ ] All metadata fields save correctly
- [ ] Special characters in text fields (quotes, apostrophes)
- [ ] Empty arrays don't break rendering
- [ ] Missing optional fields use fallbacks
- [ ] Itinerary items display in correct order
- [ ] Price calculations work with new duration_days
- [ ] SEO metadata generates correctly
- [ ] Mobile responsive layout intact
- [ ] Images display with correct alt text
- [ ] Structured data validates (Google Rich Results Test)

---

## Contact & Support

For questions about this mapping or implementation:
- **Document Author**: Claude Code
- **Date**: 2025-11-08
- **Version**: 1.0
