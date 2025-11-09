# Structured Data Requirements for Sunshine Coast 4WD Tours

## Overview

This document defines the comprehensive structured data (Schema.org) requirements for the Sunshine Coast 4WD Tours storefront. All structured data MUST be implemented using JSON-LD format as recommended by Google.

**Format**: JSON-LD (JavaScript Object Notation for Linked Data)
**Framework**: Next.js 14 App Router with Script component
**Current Implementation**: `/app/layout.tsx`
**Validation**: Google Rich Results Test

---

## Table of Contents

1. [JSON-LD Implementation Guide](#1-json-ld-implementation-guide)
2. [Organization Schema (MANDATORY)](#2-organization-schema-mandatory)
3. [LocalBusiness Schema (MANDATORY)](#3-localbusiness-schema-mandatory)
4. [Product Schema for Tours](#4-product-schema-for-tours)
5. [BreadcrumbList Schema](#5-breadcrumblist-schema)
6. [Review/Rating Schema](#6-reviewrating-schema)
7. [FAQ Schema](#7-faq-schema)
8. [Article Schema for Blog Posts](#8-article-schema-for-blog-posts)
9. [Event Schema for Scheduled Tours](#9-event-schema-for-scheduled-tours)
10. [Offer Schema for Pricing](#10-offer-schema-for-pricing)
11. [Testing Structured Data](#11-testing-structured-data)
12. [Common Mistakes to Avoid](#12-common-mistakes-to-avoid)

---

## 1. JSON-LD Implementation Guide

### 1.1 What is JSON-LD?

JSON-LD (JavaScript Object Notation for Linked Data) is a method of encoding structured data using JSON. It's Google's recommended format for structured data.

**Why JSON-LD over Microdata or RDFa:**
- ✅ Doesn't clutter HTML markup
- ✅ Easier to implement and maintain
- ✅ Can be dynamically generated
- ✅ Google's preferred format
- ✅ Doesn't affect page rendering

### 1.2 Next.js Implementation Pattern

**Using Next.js Script Component:**
```tsx
import Script from 'next/script';

export default function Page() {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Sunshine Coast 4WD Tours',
  };

  return (
    <>
      <Script
        id="organization-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(schema),
        }}
      />

      <div>Page content</div>
    </>
  );
}
```

### 1.3 Where to Place Structured Data

**Root Layout (`app/layout.tsx`):**
- Organization schema
- LocalBusiness schema
- Site-wide breadcrumbs

**Page-Level (`app/[page]/page.tsx`):**
- Product schema (tour pages)
- Article schema (blog posts)
- Event schema (scheduled tours)
- Page-specific breadcrumbs
- FAQ schema

### 1.4 Current Implementation Location

See `/app/layout.tsx` lines 98-290 for current structured data implementation.

---

## 2. Organization Schema (MANDATORY)

### 2.1 Purpose

The Organization schema tells search engines about your business entity. This is the foundational schema that all other schemas reference.

**Benefits:**
- Knowledge Graph eligibility
- Brand recognition in search results
- Trust signals to search engines
- Connection to social media profiles

### 2.2 Required Properties (MANDATORY)

| Property | Type | Description | Required |
|----------|------|-------------|----------|
| `@context` | URL | Always "https://schema.org" | ✅ MANDATORY |
| `@type` | Text | Organization type | ✅ MANDATORY |
| `@id` | URL | Unique identifier | ✅ MANDATORY |
| `name` | Text | Official business name | ✅ MANDATORY |
| `url` | URL | Main website URL | ✅ MANDATORY |
| `logo` | URL | Company logo | ✅ MANDATORY |
| `description` | Text | Business description | ✅ MANDATORY |
| `address` | PostalAddress | Business address | ✅ MANDATORY |
| `telephone` | Text | Contact phone | ✅ MANDATORY |
| `sameAs` | URL[] | Social media profiles | RECOMMENDED |

### 2.3 Current Implementation (app/layout.tsx)

```typescript
const organizationSchema = {
  '@context': 'https://schema.org',
  '@type': 'TouristAttraction',
  '@id': 'https://sunshinecoast4wdtours.com.au/#organization',
  name: 'Sunshine Coast 4WD Tours',
  alternateName: 'SC 4WD Tours',
  url: 'https://sunshinecoast4wdtours.com.au',
  logo: 'https://sunshinecoast4wdtours.com.au/images/logo.png',
  description: 'Premium 4WD tours and off-road adventures on Queensland\'s Sunshine Coast',
  address: {
    '@type': 'PostalAddress',
    addressLocality: 'Sunshine Coast',
    addressRegion: 'QLD',
    addressCountry: 'AU',
  },
  geo: {
    '@type': 'GeoCoordinates',
    latitude: -26.6500,
    longitude: 153.0667,
  },
  telephone: '+61-XXX-XXX-XXX',
  priceRange: '$$',
  openingHoursSpecification: [
    {
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: [
        'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday',
      ],
      opens: '08:00',
      closes: '18:00',
    },
  ],
  sameAs: [
    'https://www.facebook.com/SC4WDTours',
    'https://www.instagram.com/SC4WDTours',
    'https://twitter.com/SC4WDTours',
  ],
};
```

### 2.4 Recommended Enhancements

```typescript
const organizationSchemaEnhanced = {
  '@context': 'https://schema.org',
  '@type': 'TouristAttraction',
  '@id': 'https://sunshinecoast4wdtours.com.au/#organization',
  name: 'Sunshine Coast 4WD Tours',
  alternateName: 'SC 4WD Tours',
  url: 'https://sunshinecoast4wdtours.com.au',
  logo: {
    '@type': 'ImageObject',
    url: 'https://sunshinecoast4wdtours.com.au/images/logo.png',
    width: 600,
    height: 60,
  },
  image: 'https://sunshinecoast4wdtours.com.au/images/hero.png',
  description: 'Premium 4WD tours and off-road adventures on Queensland\'s Sunshine Coast',

  // Address with complete details
  address: {
    '@type': 'PostalAddress',
    streetAddress: '123 Beach Road', // REPLACE WITH ACTUAL
    addressLocality: 'Sunshine Coast',
    addressRegion: 'QLD',
    postalCode: '4558', // REPLACE WITH ACTUAL
    addressCountry: 'AU',
  },

  // Geographic coordinates
  geo: {
    '@type': 'GeoCoordinates',
    latitude: -26.6500, // REPLACE WITH ACTUAL
    longitude: 153.0667, // REPLACE WITH ACTUAL
  },

  // Contact information
  contactPoint: {
    '@type': 'ContactPoint',
    telephone: '+61-XXX-XXX-XXX', // REPLACE WITH ACTUAL
    contactType: 'customer service',
    email: 'info@sunshinecoast4wdtours.com.au', // REPLACE WITH ACTUAL
    areaServed: 'AU',
    availableLanguage: ['English'],
  },

  // Business hours
  openingHoursSpecification: [
    {
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
      opens: '08:00',
      closes: '18:00',
    },
  ],

  // Price range
  priceRange: '$$',

  // Social media profiles
  sameAs: [
    'https://www.facebook.com/SC4WDTours',
    'https://www.instagram.com/SC4WDTours',
    'https://twitter.com/SC4WDTours',
    'https://www.linkedin.com/company/sc4wdtours',
    'https://www.youtube.com/c/SC4WDTours',
  ],

  // Founding date (if available)
  foundingDate: '2010-01-01', // REPLACE WITH ACTUAL

  // Number of employees (optional)
  numberOfEmployees: {
    '@type': 'QuantitativeValue',
    value: 15,
  },
};
```

---

## 3. LocalBusiness Schema (MANDATORY)

### 3.1 Purpose

LocalBusiness schema is CRITICAL for local SEO on Sunshine Coast. This helps your business appear in Google Maps and local search results.

**Benefits:**
- Appears in Google Maps results
- Local pack (map + 3 businesses) eligibility
- "Near me" search visibility
- Business hours display in search
- Star ratings in search results

### 3.2 Required Properties (MANDATORY)

| Property | Type | Description | Required |
|----------|------|-------------|----------|
| `@type` | Text | LocalBusiness or specific type | ✅ MANDATORY |
| `name` | Text | Business name | ✅ MANDATORY |
| `image` | URL | Business image | ✅ MANDATORY |
| `address` | PostalAddress | Complete address | ✅ MANDATORY |
| `geo` | GeoCoordinates | Latitude/Longitude | ✅ MANDATORY |
| `url` | URL | Website URL | ✅ MANDATORY |
| `telephone` | Text | Phone number | ✅ MANDATORY |
| `priceRange` | Text | Price range indicator | RECOMMENDED |
| `openingHoursSpecification` | OpeningHoursSpecification | Business hours | RECOMMENDED |
| `aggregateRating` | AggregateRating | Average rating | RECOMMENDED |

### 3.3 Current Implementation (app/layout.tsx)

```typescript
const localBusinessSchema = {
  '@context': 'https://schema.org',
  '@type': 'LocalBusiness',
  '@id': 'https://sunshinecoast4wdtours.com.au/#localbusiness',
  name: 'Sunshine Coast 4WD Tours',
  image: 'https://sunshinecoast4wdtours.com.au/images/hero.png',
  description: 'Experience premium 4WD tours on Queensland\'s Sunshine Coast with expert guides',
  url: 'https://sunshinecoast4wdtours.com.au',
  telephone: '+61-XXX-XXX-XXX',
  address: {
    '@type': 'PostalAddress',
    streetAddress: 'XXX Main Street',
    addressLocality: 'Sunshine Coast',
    addressRegion: 'QLD',
    postalCode: 'XXXX',
    addressCountry: 'AU',
  },
  geo: {
    '@type': 'GeoCoordinates',
    latitude: -26.6500,
    longitude: 153.0667,
  },
  priceRange: '$$',
  aggregateRating: {
    '@type': 'AggregateRating',
    ratingValue: '4.8',
    reviewCount: '127',
  },
};
```

### 3.4 Enhanced LocalBusiness Schema

```typescript
const localBusinessSchemaEnhanced = {
  '@context': 'https://schema.org',
  '@type': 'TouristInformationCenter', // More specific than LocalBusiness
  '@id': 'https://sunshinecoast4wdtours.com.au/#localbusiness',
  name: 'Sunshine Coast 4WD Tours',

  // Images
  image: [
    'https://sunshinecoast4wdtours.com.au/images/hero.png',
    'https://sunshinecoast4wdtours.com.au/images/tour-1.jpg',
    'https://sunshinecoast4wdtours.com.au/images/tour-2.jpg',
  ],

  description: 'Experience premium 4WD tours on Queensland\'s Sunshine Coast with expert guides',
  url: 'https://sunshinecoast4wdtours.com.au',
  telephone: '+61-XXX-XXX-XXX', // REPLACE WITH ACTUAL
  email: 'info@sunshinecoast4wdtours.com.au', // REPLACE WITH ACTUAL

  // Complete address
  address: {
    '@type': 'PostalAddress',
    streetAddress: '123 Beach Road', // REPLACE WITH ACTUAL
    addressLocality: 'Sunshine Coast',
    addressRegion: 'Queensland',
    postalCode: '4558', // REPLACE WITH ACTUAL
    addressCountry: 'AU',
  },

  // Exact coordinates (VERY IMPORTANT for local SEO)
  geo: {
    '@type': 'GeoCoordinates',
    latitude: -26.6500, // REPLACE WITH EXACT COORDINATES
    longitude: 153.0667, // REPLACE WITH EXACT COORDINATES
  },

  // Service area
  areaServed: {
    '@type': 'GeoCircle',
    geoMidpoint: {
      '@type': 'GeoCoordinates',
      latitude: -26.6500,
      longitude: 153.0667,
    },
    geoRadius: '50000', // 50km radius
  },

  // Opening hours
  openingHoursSpecification: [
    {
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
      opens: '08:00',
      closes: '18:00',
    },
    {
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: ['Saturday', 'Sunday'],
      opens: '07:00',
      closes: '19:00',
    },
  ],

  // Price range
  priceRange: '$$', // $ = cheap, $$ = moderate, $$$ = expensive, $$$$ = very expensive

  // Payment methods accepted
  paymentAccepted: ['Cash', 'Credit Card', 'Debit Card', 'Bank Transfer'],
  currenciesAccepted: 'AUD',

  // Ratings (UPDATE WITH REAL DATA)
  aggregateRating: {
    '@type': 'AggregateRating',
    ratingValue: '4.8',
    bestRating: '5',
    worstRating: '1',
    ratingCount: '127',
  },

  // Social media
  sameAs: [
    'https://www.facebook.com/SC4WDTours',
    'https://www.instagram.com/SC4WDTours',
    'https://twitter.com/SC4WDTours',
  ],
};
```

### 3.5 LocalBusiness Type Selection

**Choose the most specific @type:**

```typescript
// Current (good)
'@type': 'LocalBusiness'

// Better options (more specific):
'@type': 'TouristInformationCenter'
'@type': 'TravelAgency'
'@type': 'TouristAttraction'

// Multiple types (RECOMMENDED):
'@type': ['LocalBusiness', 'TouristInformationCenter', 'TravelAgency']
```

---

## 4. Product Schema for Tours

### 4.1 Purpose

Each tour should have Product schema to appear in Google Shopping and product-related searches.

**Benefits:**
- Rich snippets in search results
- Price display in search
- Availability status
- Star ratings
- Review count

### 4.2 Current Implementation (app/layout.tsx)

```typescript
const tourProductSchema = {
  '@context': 'https://schema.org',
  '@type': 'Product',
  name: 'Sunshine Coast 4WD Adventure Tours',
  description: 'Premium 4WD off-road adventure tours on Queensland\'s Sunshine Coast',
  brand: {
    '@type': 'Brand',
    name: 'Sunshine Coast 4WD Tours',
  },
  offers: {
    '@type': 'AggregateOffer',
    url: 'https://sunshinecoast4wdtours.com.au',
    priceCurrency: 'AUD',
    lowPrice: '149',
    highPrice: '499',
    offerCount: '6',
    availability: 'https://schema.org/InStock',
  },
  aggregateRating: {
    '@type': 'AggregateRating',
    ratingValue: '4.8',
    reviewCount: '127',
  },
};
```

### 4.3 Individual Tour Product Schema

**Implement on each tour page:**

```typescript
// app/tours/[slug]/page.tsx
export default function TourPage({ tour }) {
  const tourProductSchema = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    '@id': `https://sunshinecoast4wdtours.com.au/tours/${tour.slug}#product`,
    name: tour.name,
    description: tour.description,

    // Product image
    image: [
      tour.mainImage,
      tour.image2,
      tour.image3,
    ],

    // Brand
    brand: {
      '@type': 'Brand',
      name: 'Sunshine Coast 4WD Tours',
    },

    // Category
    category: '4WD Tours',

    // SKU (Stock Keeping Unit)
    sku: tour.sku || tour.id,

    // Offer details
    offers: {
      '@type': 'Offer',
      url: `https://sunshinecoast4wdtours.com.au/tours/${tour.slug}`,
      priceCurrency: 'AUD',
      price: tour.price,
      priceValidUntil: '2025-12-31',
      availability: tour.available ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
      itemCondition: 'https://schema.org/NewCondition',

      // Seller
      seller: {
        '@type': 'Organization',
        name: 'Sunshine Coast 4WD Tours',
      },

      // Booking details
      validFrom: '2025-01-01',
      availabilityStarts: '2025-01-01',
      availabilityEnds: '2025-12-31',
    },

    // Ratings (if available)
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: tour.rating,
      reviewCount: tour.reviewCount,
      bestRating: '5',
      worstRating: '1',
    },

    // Reviews (if available)
    review: tour.reviews?.map(review => ({
      '@type': 'Review',
      author: {
        '@type': 'Person',
        name: review.authorName,
      },
      datePublished: review.date,
      reviewBody: review.text,
      reviewRating: {
        '@type': 'Rating',
        ratingValue: review.rating,
        bestRating: '5',
        worstRating: '1',
      },
    })),
  };

  return (
    <>
      <Script
        id={`tour-product-schema-${tour.id}`}
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(tourProductSchema),
        }}
      />

      {/* Tour page content */}
    </>
  );
}
```

### 4.4 TouristTrip Schema (Alternative for Tours)

**More specific for tour products:**

```typescript
const touristTripSchema = {
  '@context': 'https://schema.org',
  '@type': 'TouristTrip',
  name: 'Beach 4WD Adventure',
  description: 'Experience pristine Sunshine Coast beaches in a 4WD vehicle',

  // Trip itinerary
  itinerary: {
    '@type': 'ItemList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        item: {
          '@type': 'TouristAttraction',
          name: 'Rainbow Beach',
          description: 'Explore the colorful sands of Rainbow Beach',
        },
      },
      {
        '@type': 'ListItem',
        position: 2,
        item: {
          '@type': 'TouristAttraction',
          name: 'Carlo Sand Blow',
          description: 'Visit the stunning sand dunes',
        },
      },
    ],
  },

  // Tour provider
  provider: {
    '@type': 'Organization',
    name: 'Sunshine Coast 4WD Tours',
    url: 'https://sunshinecoast4wdtours.com.au',
  },

  // Offer
  offers: {
    '@type': 'Offer',
    price: '149',
    priceCurrency: 'AUD',
    availability: 'https://schema.org/InStock',
  },

  // Tour details
  touristType: 'Adventure Seekers',
  duration: 'PT4H', // ISO 8601 duration format (4 hours)

  // Location
  touristDestination: {
    '@type': 'Place',
    name: 'Sunshine Coast',
    address: {
      '@type': 'PostalAddress',
      addressLocality: 'Sunshine Coast',
      addressRegion: 'QLD',
      addressCountry: 'AU',
    },
  },
};
```

---

## 5. BreadcrumbList Schema

### 5.1 Purpose

Breadcrumbs help users and search engines understand site hierarchy.

**Benefits:**
- Breadcrumb trail in search results
- Better site structure understanding
- Improved navigation
- Lower bounce rates

### 5.2 Current Implementation (app/layout.tsx)

```typescript
const breadcrumbSchema = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    {
      '@type': 'ListItem',
      position: 1,
      name: 'Home',
      item: 'https://sunshinecoast4wdtours.com.au',
    },
  ],
};
```

### 5.3 Page-Specific Breadcrumbs

**Homepage breadcrumb (root layout is fine)**

**Tour listing page:**
```typescript
// app/tours/page.tsx
const breadcrumbSchema = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    {
      '@type': 'ListItem',
      position: 1,
      name: 'Home',
      item: 'https://sunshinecoast4wdtours.com.au',
    },
    {
      '@type': 'ListItem',
      position: 2,
      name: 'Tours',
      item: 'https://sunshinecoast4wdtours.com.au/tours',
    },
  ],
};
```

**Individual tour page:**
```typescript
// app/tours/[slug]/page.tsx
const breadcrumbSchema = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    {
      '@type': 'ListItem',
      position: 1,
      name: 'Home',
      item: 'https://sunshinecoast4wdtours.com.au',
    },
    {
      '@type': 'ListItem',
      position: 2,
      name: 'Tours',
      item: 'https://sunshinecoast4wdtours.com.au/tours',
    },
    {
      '@type': 'ListItem',
      position: 3,
      name: 'Beach Adventure',
      item: 'https://sunshinecoast4wdtours.com.au/tours/beach-adventure',
    },
  ],
};
```

**Blog post:**
```typescript
// app/blog/[slug]/page.tsx
const breadcrumbSchema = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    {
      '@type': 'ListItem',
      position: 1,
      name: 'Home',
      item: 'https://sunshinecoast4wdtours.com.au',
    },
    {
      '@type': 'ListItem',
      position: 2,
      name: 'Blog',
      item: 'https://sunshinecoast4wdtours.com.au/blog',
    },
    {
      '@type': 'ListItem',
      position: 3,
      name: 'Best 4WD Tracks Sunshine Coast',
      item: 'https://sunshinecoast4wdtours.com.au/blog/best-4wd-tracks-sunshine-coast',
    },
  ],
};
```

### 5.4 Breadcrumb Best Practices

**DO:**
- ✅ Include all levels of hierarchy
- ✅ Use position starting from 1
- ✅ Use actual page titles for 'name'
- ✅ Use absolute URLs for 'item'
- ✅ Match visual breadcrumbs on page

**DON'T:**
- ❌ Skip levels in hierarchy
- ❌ Use generic names ("Page", "Item")
- ❌ Exceed 8 levels deep
- ❌ Have mismatched URLs

---

## 6. Review/Rating Schema

### 6.1 Purpose

Display star ratings and review counts in search results.

**Benefits:**
- Star ratings in search results
- Increased click-through rates
- Trust signals
- Social proof

### 6.2 AggregateRating Schema

**On business/organization:**
```typescript
const aggregateRatingSchema = {
  '@context': 'https://schema.org',
  '@type': 'LocalBusiness',
  name: 'Sunshine Coast 4WD Tours',
  aggregateRating: {
    '@type': 'AggregateRating',
    ratingValue: '4.8', // Average rating (1-5)
    bestRating: '5',    // Maximum rating
    worstRating: '1',   // Minimum rating
    ratingCount: '127', // Total number of ratings
    reviewCount: '95',  // Total number of reviews (can differ from ratings)
  },
};
```

### 6.3 Individual Review Schema

```typescript
const reviewSchema = {
  '@context': 'https://schema.org',
  '@type': 'Review',
  '@id': 'https://sunshinecoast4wdtours.com.au/reviews#review-123',

  // Item being reviewed
  itemReviewed: {
    '@type': 'Product',
    name: 'Beach 4WD Adventure',
  },

  // Author
  author: {
    '@type': 'Person',
    name: 'John Smith',
  },

  // Review content
  reviewBody: 'Amazing experience! The guides were knowledgeable and the beaches were stunning.',

  // Rating
  reviewRating: {
    '@type': 'Rating',
    ratingValue: '5',
    bestRating: '5',
    worstRating: '1',
  },

  // Date
  datePublished: '2025-01-15',

  // Publisher (optional)
  publisher: {
    '@type': 'Organization',
    name: 'Sunshine Coast 4WD Tours',
  },
};
```

### 6.4 Multiple Reviews on Product

```typescript
// app/tours/[slug]/page.tsx
const tourWithReviews = {
  '@context': 'https://schema.org',
  '@type': 'Product',
  name: 'Beach 4WD Adventure',

  // Aggregate rating
  aggregateRating: {
    '@type': 'AggregateRating',
    ratingValue: '4.8',
    reviewCount: '45',
  },

  // Individual reviews
  review: [
    {
      '@type': 'Review',
      author: {
        '@type': 'Person',
        name: 'Sarah Johnson',
      },
      datePublished: '2025-01-10',
      reviewBody: 'Fantastic tour! Highly recommend for families.',
      reviewRating: {
        '@type': 'Rating',
        ratingValue: '5',
      },
    },
    {
      '@type': 'Review',
      author: {
        '@type': 'Person',
        name: 'Mike Chen',
      },
      datePublished: '2025-01-05',
      reviewBody: 'Great value for money. Saw amazing wildlife.',
      reviewRating: {
        '@type': 'Rating',
        ratingValue: '4',
      },
    },
  ],
};
```

### 6.5 Review Guidelines

**MANDATORY Requirements:**
- Must be genuine, user-generated reviews
- Cannot be fake or paid reviews
- Must have author name
- Must have rating value
- Must have date published

**Google's Review Snippet Guidelines:**
- Minimum 5 reviews recommended
- Reviews must be visible on the page
- Reviews must be genuine
- Self-serving reviews are prohibited

---

## 7. FAQ Schema

### 7.1 Purpose

Display FAQs directly in search results as expandable boxes.

**Benefits:**
- Featured snippet eligibility
- More SERP real estate
- Answer common questions
- Reduce support queries

### 7.2 FAQ Schema Structure

```typescript
// app/faq/page.tsx or any page with FAQs
const faqSchema = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'What should I bring on a 4WD tour?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'We recommend bringing sunscreen, a hat, comfortable clothing, closed-toe shoes, a camera, and a water bottle. All safety equipment and refreshments are provided.',
      },
    },
    {
      '@type': 'Question',
      name: 'How long do the tours last?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Our tours range from 2-hour express trips to full-day 8-hour adventures. Most popular tours are 4-6 hours including breaks and photo opportunities.',
      },
    },
    {
      '@type': 'Question',
      name: 'Are tours suitable for children?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Yes! Most tours are family-friendly. Children aged 5+ are welcome. Child seats are available upon request. Please contact us for specific tour age restrictions.',
      },
    },
    {
      '@type': 'Question',
      name: 'What happens if weather is bad?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Safety is our priority. If weather conditions are unsafe, we will reschedule your tour or offer a full refund. We monitor weather closely and contact guests 24 hours before departure.',
      },
    },
    {
      '@type': 'Question',
      name: 'Do I need a 4WD license?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'No license is required. All tours are guided experiences with professional drivers. If you want to drive yourself, we offer guided self-drive tours which require a valid driver\'s license.',
      },
    },
  ],
};
```

### 7.3 FAQ Implementation in Next.js

```tsx
// app/faq/page.tsx
import Script from 'next/script';

export default function FAQPage() {
  const faqData = [
    {
      question: 'What should I bring on a 4WD tour?',
      answer: 'We recommend bringing sunscreen, a hat, comfortable clothing...',
    },
    // ... more FAQs
  ];

  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqData.map(faq => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  };

  return (
    <>
      <Script
        id="faq-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(faqSchema),
        }}
      />

      <div>
        <h1>Frequently Asked Questions</h1>
        {faqData.map((faq, index) => (
          <div key={index}>
            <h2>{faq.question}</h2>
            <p>{faq.answer}</p>
          </div>
        ))}
      </div>
    </>
  );
}
```

### 7.4 FAQ Best Practices

**DO:**
- ✅ Use actual questions from customers
- ✅ Provide clear, complete answers
- ✅ Display FAQs visibly on the page
- ✅ Keep answers concise (2-3 sentences)
- ✅ Update regularly

**DON'T:**
- ❌ Use for promotional content
- ❌ Include questions that aren't FAQs
- ❌ Hide FAQ content from users
- ❌ Duplicate content across pages

---

## 8. Article Schema for Blog Posts

### 8.1 Purpose

Help search engines understand blog content structure.

**Benefits:**
- Featured snippets eligibility
- Article rich results
- Knowledge Graph connections
- Better content classification

### 8.2 Article Schema Structure

```typescript
// app/blog/[slug]/page.tsx
const articleSchema = {
  '@context': 'https://schema.org',
  '@type': 'Article', // or 'BlogPosting', 'NewsArticle'

  // Basic info
  headline: 'Best 4WD Tracks on Sunshine Coast (2025 Guide)',
  alternativeHeadline: 'Complete Guide to Sunshine Coast 4WD Tracks',

  // Images
  image: [
    'https://sunshinecoast4wdtours.com.au/blog/images/4wd-tracks-hero.jpg',
    'https://sunshinecoast4wdtours.com.au/blog/images/4wd-tracks-1.jpg',
  ],

  // Author
  author: {
    '@type': 'Person',
    name: 'John Smith',
    url: 'https://sunshinecoast4wdtours.com.au/about/john-smith',
  },

  // Publisher
  publisher: {
    '@type': 'Organization',
    name: 'Sunshine Coast 4WD Tours',
    logo: {
      '@type': 'ImageObject',
      url: 'https://sunshinecoast4wdtours.com.au/images/logo.png',
      width: 600,
      height: 60,
    },
  },

  // Dates
  datePublished: '2025-01-15T08:00:00+10:00',
  dateModified: '2025-01-20T14:30:00+10:00',

  // Content
  description: 'Discover the top 10 4WD tracks on Sunshine Coast in 2025. Expert tips, difficulty ratings, permit requirements.',

  // Article body (optional, but helps)
  articleBody: 'Full article text here...',

  // Word count
  wordCount: 2500,

  // Main entity
  mainEntityOfPage: {
    '@type': 'WebPage',
    '@id': 'https://sunshinecoast4wdtours.com.au/blog/best-4wd-tracks-sunshine-coast',
  },
};
```

### 8.3 BlogPosting Schema (Alternative)

```typescript
const blogPostingSchema = {
  '@context': 'https://schema.org',
  '@type': 'BlogPosting',
  headline: 'How to Prepare for Your First 4WD Adventure',

  author: {
    '@type': 'Person',
    name: 'Sarah Williams',
    jobTitle: 'Senior 4WD Guide',
  },

  publisher: {
    '@type': 'Organization',
    name: 'Sunshine Coast 4WD Tours',
    logo: {
      '@type': 'ImageObject',
      url: 'https://sunshinecoast4wdtours.com.au/images/logo.png',
    },
  },

  datePublished: '2025-01-10',
  dateModified: '2025-01-15',

  image: 'https://sunshinecoast4wdtours.com.au/blog/images/first-4wd-adventure.jpg',

  description: 'Complete guide for first-time 4WD adventurers. Learn what to pack, safety tips, and what to expect.',

  keywords: ['4WD tips', 'off-road guide', 'first-time 4WD', 'Sunshine Coast'],

  articleSection: '4WD Guides',

  commentCount: 15,

  // Comments (if you have them)
  comment: [
    {
      '@type': 'Comment',
      author: {
        '@type': 'Person',
        name: 'Mike Johnson',
      },
      datePublished: '2025-01-11',
      text: 'Great guide! Very helpful for beginners.',
    },
  ],
};
```

### 8.4 Article Types

**Choose the most appropriate @type:**

- **Article** - General articles
- **BlogPosting** - Blog posts
- **NewsArticle** - News content
- **ScholarlyArticle** - Academic/research
- **TechArticle** - Technical guides
- **Report** - Reports and whitepapers

---

## 9. Event Schema for Scheduled Tours

### 9.1 Purpose

If you offer tours at specific dates/times, Event schema helps them appear in Google Events.

**Benefits:**
- Google Events listing
- Calendar integration
- Date/time display in search
- Registration/booking links

### 9.2 Event Schema Structure

```typescript
const eventSchema = {
  '@context': 'https://schema.org',
  '@type': 'Event',
  '@id': 'https://sunshinecoast4wdtours.com.au/events/sunset-beach-tour-2025-02-14',

  // Event details
  name: 'Valentine\'s Day Sunset Beach 4WD Tour',
  description: 'Special romantic sunset tour along Sunshine Coast beaches',

  // Image
  image: [
    'https://sunshinecoast4wdtours.com.au/events/valentines-sunset-tour.jpg',
  ],

  // Date and time
  startDate: '2025-02-14T17:00:00+10:00', // ISO 8601 format
  endDate: '2025-02-14T21:00:00+10:00',

  // Duration
  duration: 'PT4H', // ISO 8601 duration (4 hours)

  // Status
  eventStatus: 'https://schema.org/EventScheduled',
  eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',

  // Location
  location: {
    '@type': 'Place',
    name: 'Rainbow Beach',
    address: {
      '@type': 'PostalAddress',
      addressLocality: 'Rainbow Beach',
      addressRegion: 'QLD',
      addressCountry: 'AU',
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: -25.9037,
      longitude: 153.0882,
    },
  },

  // Organizer
  organizer: {
    '@type': 'Organization',
    name: 'Sunshine Coast 4WD Tours',
    url: 'https://sunshinecoast4wdtours.com.au',
  },

  // Performer (tour guide)
  performer: {
    '@type': 'Person',
    name: 'John Smith',
    jobTitle: 'Senior 4WD Guide',
  },

  // Offers
  offers: {
    '@type': 'Offer',
    url: 'https://sunshinecoast4wdtours.com.au/events/sunset-beach-tour-2025-02-14',
    price: '199',
    priceCurrency: 'AUD',
    availability: 'https://schema.org/InStock',
    validFrom: '2025-01-01',

    // Inventory
    inventoryLevel: {
      '@type': 'QuantitativeValue',
      value: 12, // 12 spots available
    },
  },

  // Maximum attendees
  maximumAttendeeCapacity: 20,
  remainingAttendeeCapacity: 12,
};
```

### 9.3 Event Status Values

```typescript
eventStatus: 'https://schema.org/EventScheduled'    // Confirmed
eventStatus: 'https://schema.org/EventCancelled'    // Cancelled
eventStatus: 'https://schema.org/EventPostponed'    // Postponed
eventStatus: 'https://schema.org/EventRescheduled'  // Rescheduled
eventStatus: 'https://schema.org/EventMovedOnline'  // Moved online
```

### 9.4 Recurring Events

```typescript
const recurringEventSchema = {
  '@context': 'https://schema.org',
  '@type': 'EventSeries',
  name: 'Weekly Rainforest Expedition',

  // Recurring schedule
  eventSchedule: {
    '@type': 'Schedule',
    repeatFrequency: 'P1W', // Every 1 week
    byDay: 'Saturday',
    startTime: '08:00:00',
    endTime: '16:00:00',
  },

  // Start and end of series
  startDate: '2025-01-01',
  endDate: '2025-12-31',

  // Location, offers, etc.
  location: {
    '@type': 'Place',
    name: 'Sunshine Coast Rainforest',
  },
};
```

---

## 10. Offer Schema for Pricing

### 10.1 Purpose

Detailed pricing information for tours and packages.

**Benefits:**
- Price display in search results
- Availability status
- Valid-from and valid-through dates
- Multiple price options

### 10.2 Simple Offer

```typescript
const offerSchema = {
  '@type': 'Offer',
  url: 'https://sunshinecoast4wdtours.com.au/tours/beach-adventure',
  priceCurrency: 'AUD',
  price: '149',
  priceValidUntil: '2025-12-31',
  availability: 'https://schema.org/InStock',
  itemCondition: 'https://schema.org/NewCondition',
};
```

### 10.3 AggregateOffer (Multiple Prices)

```typescript
const aggregateOfferSchema = {
  '@type': 'AggregateOffer',
  url: 'https://sunshinecoast4wdtours.com.au/tours',
  priceCurrency: 'AUD',
  lowPrice: '149',  // Lowest tour price
  highPrice: '499', // Highest tour price
  offerCount: '6',  // Number of different tours
  availability: 'https://schema.org/InStock',
};
```

### 10.4 Offer with Multiple Options

```typescript
const multipleOffersSchema = {
  '@context': 'https://schema.org',
  '@type': 'Product',
  name: 'Beach 4WD Adventure',

  offers: [
    {
      '@type': 'Offer',
      name: 'Standard Package',
      price: '149',
      priceCurrency: 'AUD',
      availability: 'https://schema.org/InStock',
    },
    {
      '@type': 'Offer',
      name: 'Premium Package (with lunch)',
      price: '199',
      priceCurrency: 'AUD',
      availability: 'https://schema.org/InStock',
    },
    {
      '@type': 'Offer',
      name: 'Private Tour',
      price: '499',
      priceCurrency: 'AUD',
      availability: 'https://schema.org/LimitedAvailability',
    },
  ],
};
```

### 10.5 Availability Status Values

```typescript
availability: 'https://schema.org/InStock'            // Available
availability: 'https://schema.org/OutOfStock'         // Sold out
availability: 'https://schema.org/PreOrder'           // Pre-booking
availability: 'https://schema.org/LimitedAvailability' // Few spots left
availability: 'https://schema.org/Discontinued'       // No longer offered
availability: 'https://schema.org/InStoreOnly'        // Book at office only
availability: 'https://schema.org/OnlineOnly'         // Online booking only
```

---

## 11. Testing Structured Data

### 11.1 Google Rich Results Test (MANDATORY)

**URL:** https://search.google.com/test/rich-results

**How to test:**
1. Enter your page URL or paste code
2. Click "Test URL" or "Test Code"
3. Review results for errors and warnings
4. Fix all errors (errors prevent rich results)
5. Address warnings when possible

**What to check:**
- ✅ No errors (MANDATORY)
- ✅ Warnings addressed (RECOMMENDED)
- ✅ Preview shows correctly
- ✅ All required properties present

### 11.2 Schema.org Validator

**URL:** https://validator.schema.org/

**How to use:**
1. Paste your JSON-LD code
2. Click "Validate"
3. Review any errors or warnings
4. Ensure schema structure is correct

### 11.3 Google Search Console

**Monitor structured data performance:**
1. Go to Google Search Console
2. Navigate to "Enhancements"
3. Check for errors on:
   - Products
   - Reviews
   - Articles
   - FAQs
   - Breadcrumbs
   - Local Business
4. Fix any reported issues

### 11.4 Manual Testing Checklist

**For each page with structured data:**

- [ ] Valid JSON (no syntax errors)
- [ ] All required properties present
- [ ] URLs are absolute (not relative)
- [ ] Dates in ISO 8601 format
- [ ] Images accessible and correct size
- [ ] Prices formatted correctly (no $ symbol)
- [ ] Ratings within valid range (0-5)
- [ ] Review counts accurate
- [ ] No false or misleading information
- [ ] Data matches visible page content

### 11.5 Browser DevTools Testing

**View structured data in browser:**
1. Right-click page → "View Page Source"
2. Search for `type="application/ld+json"`
3. Verify JSON is properly formatted
4. Check for missing commas, quotes, etc.

**Chrome DevTools:**
1. Open DevTools (F12)
2. Go to "Elements" tab
3. Search for `<script type="application/ld+json">`
4. Verify structure

---

## 12. Common Mistakes to Avoid

### 12.1 Critical Errors (NEVER DO THIS)

**❌ NEVER:**

1. **Include Hidden Content**
   ```typescript
   // ❌ WRONG - Data not visible on page
   description: "Amazing tour with 50% discount!" // But no discount shown on page
   ```

2. **Use Fake Reviews**
   ```typescript
   // ❌ WRONG - Fake reviews
   review: [
     { author: { name: "Our Company" }, reviewRating: { ratingValue: "5" } }
   ]
   ```

3. **Inflate Ratings**
   ```typescript
   // ❌ WRONG - False rating
   aggregateRating: {
     ratingValue: "4.8", // But actual rating is 3.2
     reviewCount: "500"  // But only have 10 reviews
   }
   ```

4. **Use Relative URLs**
   ```typescript
   // ❌ WRONG - Relative URL
   url: "/tours/beach"

   // ✅ CORRECT - Absolute URL
   url: "https://sunshinecoast4wdtours.com.au/tours/beach"
   ```

5. **Incorrect Date Formats**
   ```typescript
   // ❌ WRONG - Invalid date format
   datePublished: "15/01/2025"

   // ✅ CORRECT - ISO 8601 format
   datePublished: "2025-01-15T08:00:00+10:00"
   ```

6. **Missing Required Properties**
   ```typescript
   // ❌ WRONG - Missing required @type
   const schema = {
     "@context": "https://schema.org",
     name: "Tour Name"
   }

   // ✅ CORRECT - Includes @type
   const schema = {
     "@context": "https://schema.org",
     "@type": "Product",
     name: "Tour Name"
   }
   ```

### 12.2 Common Technical Mistakes

**❌ Syntax Errors:**
```typescript
// ❌ WRONG - Missing comma
const schema = {
  "@context": "https://schema.org"
  "@type": "Product"
}

// ✅ CORRECT
const schema = {
  "@context": "https://schema.org",
  "@type": "Product",
}
```

**❌ Incorrect Nesting:**
```typescript
// ❌ WRONG - author should be inside Review
const schema = {
  "@type": "Review",
  reviewRating: {
    "@type": "Rating",
    ratingValue: "5",
    author: { name: "John" } // Wrong location
  }
}

// ✅ CORRECT
const schema = {
  "@type": "Review",
  author: {
    "@type": "Person",
    name: "John"
  },
  reviewRating: {
    "@type": "Rating",
    ratingValue: "5"
  }
}
```

### 12.3 Content Mismatch

**❌ Schema doesn't match page content:**
```typescript
// Page title: "Beach Adventure Tour"
// ❌ WRONG - Doesn't match
const schema = {
  "@type": "Product",
  name: "Rainforest Expedition" // Different tour
}

// ✅ CORRECT - Matches page
const schema = {
  "@type": "Product",
  name: "Beach Adventure Tour"
}
```

### 12.4 Duplicate IDs

**❌ Same @id on multiple items:**
```typescript
// ❌ WRONG - Duplicate IDs
const schema1 = {
  "@id": "https://example.com/#product"
}
const schema2 = {
  "@id": "https://example.com/#product" // Same ID!
}

// ✅ CORRECT - Unique IDs
const schema1 = {
  "@id": "https://sunshinecoast4wdtours.com.au/#organization"
}
const schema2 = {
  "@id": "https://sunshinecoast4wdtours.com.au/#localbusiness"
}
```

### 12.5 Google's Quality Guidelines

**Avoid these violations:**
- Spammy or irrelevant content in structured data
- Misleading or false information
- Content not visible to users
- Self-serving reviews
- Manipulative practices
- Doorway pages
- Cloaking

**Result of violations:**
- Manual action from Google
- Loss of rich results
- Lower rankings
- Removal from search results

---

## 13. Structured Data Checklist

**Before deploying any structured data:**

### JSON-LD Basics
- [ ] Valid JSON syntax (no errors)
- [ ] @context set to "https://schema.org"
- [ ] @type specified
- [ ] @id unique and absolute URL
- [ ] All required properties present

### Organization Schema
- [ ] Name, URL, logo present
- [ ] Address complete and accurate
- [ ] Phone number in international format
- [ ] Geo coordinates accurate
- [ ] Social media links (sameAs) included

### LocalBusiness Schema
- [ ] All Organization requirements met
- [ ] Opening hours specified
- [ ] Price range indicated
- [ ] Aggregate rating (if have reviews)
- [ ] Area served defined

### Product Schema (Tours)
- [ ] Name, description, image present
- [ ] Offer with price and currency
- [ ] Availability status correct
- [ ] Brand specified
- [ ] Ratings (if applicable)

### Breadcrumb Schema
- [ ] Position starts at 1
- [ ] All levels included
- [ ] Absolute URLs
- [ ] Matches visual breadcrumbs

### Review Schema
- [ ] Genuine user reviews only
- [ ] Author name present
- [ ] Rating value valid (1-5)
- [ ] Date published included
- [ ] Review text visible on page

### Article Schema (Blog)
- [ ] Headline present
- [ ] Author specified
- [ ] Publisher with logo
- [ ] Date published and modified
- [ ] Image(s) included

### Testing
- [ ] Google Rich Results Test passed (no errors)
- [ ] Schema.org Validator passed
- [ ] Preview looks correct
- [ ] Data matches page content
- [ ] URLs accessible and correct

---

## 14. Resources

### Validation Tools
- **Google Rich Results Test**: https://search.google.com/test/rich-results
- **Schema.org Validator**: https://validator.schema.org/
- **Google Search Console**: https://search.google.com/search-console
- **JSON-LD Playground**: https://json-ld.org/playground/

### Documentation
- **Schema.org**: https://schema.org/
- **Google Search Central**: https://developers.google.com/search/docs/advanced/structured-data/intro-structured-data
- **Next.js Metadata**: https://nextjs.org/docs/app/api-reference/functions/generate-metadata

### Internal Documentation
- `/docs/seo/seo-best-practices.md` - Overall SEO guidelines
- `/docs/seo/metadata-standards.md` - Metadata implementation
- `/app/layout.tsx` - Current structured data implementation

---

## Version History

- **v1.0** (2025-11-07): Initial comprehensive structured data requirements
- Referenced current app/layout.tsx implementation
- Sunshine Coast 4WD Tours specific schemas
- Complete testing and validation procedures

---

**Document Status**: MANDATORY COMPLIANCE REQUIRED
**Review Cycle**: Quarterly
**Next Review**: 2026-02-07
**Owner**: SEO Team / Development Team
