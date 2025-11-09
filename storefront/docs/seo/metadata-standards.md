# Metadata Standards for Sunshine Coast 4WD Tours

## Overview

This document defines the exact metadata standards for all pages in the Sunshine Coast 4WD Tours storefront. These are hard-follow requirements using Next.js 14 App Router Metadata API.

**Framework**: Next.js 14 App Router
**Metadata API**: `next/metadata`
**Current Implementation**: `/app/layout.tsx`

---

## Table of Contents

1. [Title Tag Requirements](#1-title-tag-requirements)
2. [Meta Description Requirements](#2-meta-description-requirements)
3. [Open Graph Tags](#3-open-graph-tags)
4. [Twitter Cards](#4-twitter-cards)
5. [Structured Data](#5-structured-data)
6. [Canonical URLs](#6-canonical-urls)
7. [Alternate Links](#7-alternate-links)
8. [Robots Meta Tags](#8-robots-meta-tags)
9. [Viewport Configuration](#9-viewport-configuration)
10. [Theme Color and PWA Metadata](#10-theme-color-and-pwa-metadata)
11. [Language and Locale](#11-language-and-locale)
12. [Next.js 14 Metadata API Patterns](#12-nextjs-14-metadata-api-patterns)

---

## 1. Title Tag Requirements

### 1.1 Character Limits (MANDATORY)

**Absolute Requirements:**
- Minimum: 30 characters
- Maximum: 60 characters (HARD LIMIT)
- Optimal: 50-55 characters
- Google truncates at ~60 characters

### 1.2 Format Standards

**Template Pattern:**
```
[Primary Keyword] | [Location/Modifier] | [Brand]
```

**Examples by Page Type:**

```typescript
// Homepage
title: 'Sunshine Coast 4WD Tours | Premium Off-Road Adventures'
// Length: 58 characters ✅

// Tour Listing
title: '4WD Tours Sunshine Coast | Book Your Adventure Today'
// Length: 56 characters ✅

// Individual Tour
title: 'Beach 4WD Adventure | Sunshine Coast | SC 4WD Tours'
// Length: 55 characters ✅

// Blog Post
title: 'Best 4WD Tracks Sunshine Coast 2025 | Expert Guide'
// Length: 54 characters ✅

// About Page
title: 'About Us | Expert 4WD Guides | Sunshine Coast Tours'
// Length: 54 characters ✅
```

### 1.3 Next.js Implementation

**Root Layout (app/layout.tsx):**
```typescript
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: {
    default: 'Sunshine Coast 4WD Tours | Premium Off-Road Adventures Queensland',
    template: '%s | Sunshine Coast 4WD Tours',
  },
};
```

**Page-Level Override:**
```typescript
// app/tours/beach-adventure/page.tsx
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Beach 4WD Adventure | Sunshine Coast Queensland',
};
// Will render as: "Beach 4WD Adventure | Sunshine Coast Queensland | Sunshine Coast 4WD Tours"
```

**Dynamic Page Titles:**
```typescript
// app/tours/[slug]/page.tsx
import type { Metadata } from 'next';

export async function generateMetadata({ params }): Promise<Metadata> {
  const tour = await getTourBySlug(params.slug);

  return {
    title: `${tour.name} | ${tour.location} 4WD Tour`,
    // Automatically appends template: "... | Sunshine Coast 4WD Tours"
  };
}
```

### 1.4 Title Tag Best Practices

**DO:**
- ✅ Include primary keyword in first 30 characters
- ✅ Include location (Sunshine Coast) for local SEO
- ✅ Make titles unique for every page
- ✅ Use pipe (|) or hyphen (-) as separators
- ✅ Include year for time-sensitive content (2025)

**DON'T:**
- ❌ Exceed 60 characters
- ❌ Stuff keywords unnaturally
- ❌ Use ALL CAPS (except acronyms like 4WD)
- ❌ Duplicate titles across pages
- ❌ Use special characters (@, #, &, etc.)

---

## 2. Meta Description Requirements

### 2.1 Character Limits (MANDATORY)

**Absolute Requirements:**
- Minimum: 120 characters
- Maximum: 160 characters (HARD LIMIT)
- Optimal: 150-158 characters
- Google truncates at ~160 characters

### 2.2 Content Requirements

**MUST Include:**
1. Primary keyword
2. Secondary keyword
3. Location (Sunshine Coast, Queensland)
4. Call-to-action (Book now, Learn more, Discover)
5. Unique value proposition

### 2.3 Examples by Page Type

```typescript
// Homepage (158 characters)
description: "Experience the best 4WD tours on Queensland's Sunshine Coast. Premium off-road adventures, beach drives, rainforest exploration. Book your adventure today!"

// Tour Listing (157 characters)
description: "Explore our range of 4WD tours on Sunshine Coast. Beach adventures, rainforest expeditions, outback experiences. From $149. View all tours and book online."

// Beach Adventure Tour (159 characters)
description: "Join our 4-hour beach 4WD adventure on Sunshine Coast. Expert guides, pristine beaches, wildlife encounters. From $149 per person. Book your tour now!"

// Rainforest Expedition (158 characters)
description: "Discover Sunshine Coast's hidden rainforests on our guided 4WD expedition. Ancient trees, waterfalls, native wildlife. Full day tour from $249. Book today!"

// About Page (156 characters)
description: "Meet our expert 4WD guides with 20+ years experience on Sunshine Coast. Certified, local knowledge, safety-first approach. Learn about our passionate team."

// Blog Post (157 characters)
description: "Discover the top 10 4WD tracks on Sunshine Coast in 2025. Expert tips, difficulty ratings, permit requirements. Complete guide for off-road enthusiasts."

// Contact Page (153 characters)
description: "Contact Sunshine Coast 4WD Tours. Book your adventure, ask questions, or visit our office. Phone, email, or book online. We're here to help plan your tour."
```

### 2.4 Next.js Implementation

**Static Page:**
```typescript
// app/about/page.tsx
export const metadata: Metadata = {
  description: "Meet our expert 4WD guides with 20+ years experience on Sunshine Coast. Certified, local knowledge, safety-first approach. Learn about our passionate team.",
};
```

**Dynamic Page:**
```typescript
// app/tours/[slug]/page.tsx
export async function generateMetadata({ params }): Promise<Metadata> {
  const tour = await getTourBySlug(params.slug);

  return {
    description: `Join our ${tour.duration}-hour ${tour.name} on Sunshine Coast. ${tour.highlights}. From $${tour.price} per person. Book your tour now!`,
  };
}
```

### 2.5 Meta Description Best Practices

**DO:**
- ✅ Write unique descriptions for every page
- ✅ Include specific numbers ($149, 4-hour, 20+ years)
- ✅ Use active voice and action verbs
- ✅ End with a call-to-action
- ✅ Make it compelling and clickable

**DON'T:**
- ❌ Exceed 160 characters
- ❌ Duplicate descriptions across pages
- ❌ Use quotation marks (they cause truncation)
- ❌ Stuff keywords unnaturally
- ❌ Make false promises or clickbait

---

## 3. Open Graph Tags

### 3.1 Required Open Graph Properties (MANDATORY)

**Every page MUST have:**
- `og:title` (differs from title tag, can be longer)
- `og:description` (can differ from meta description)
- `og:type` (website, article, product)
- `og:url` (canonical URL)
- `og:image` (1200x630px recommended)
- `og:locale` (en_AU for Australian English)
- `og:site_name`

### 3.2 Image Requirements

**Dimensions:**
- Recommended: 1200 x 630 pixels
- Minimum: 600 x 315 pixels
- Aspect ratio: 1.91:1
- Format: JPG or PNG (< 5MB)
- Alt text required

### 3.3 Current Implementation (app/layout.tsx)

```typescript
export const metadata: Metadata = {
  openGraph: {
    type: 'website',
    locale: 'en_AU',
    url: 'https://sunshinecoast4wdtours.com.au',
    siteName: 'Sunshine Coast 4WD Tours',
    title: 'Sunshine Coast 4WD Tours | Premium Off-Road Adventures',
    description: "Experience the best 4WD tours on Queensland's Sunshine Coast. Premium off-road adventures, beach drives, rainforest exploration, and unforgettable outback experiences.",
    images: [
      {
        url: '/images/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Sunshine Coast 4WD Tours - Off-Road Adventures',
      },
    ],
  },
};
```

### 3.4 Page-Level Open Graph

```typescript
// app/tours/[slug]/page.tsx
export async function generateMetadata({ params }): Promise<Metadata> {
  const tour = await getTourBySlug(params.slug);

  return {
    openGraph: {
      type: 'website',
      url: `https://sunshinecoast4wdtours.com.au/tours/${params.slug}`,
      title: `${tour.name} | Sunshine Coast 4WD Adventure`,
      description: tour.description,
      images: [
        {
          url: tour.image,
          width: 1200,
          height: 630,
          alt: `${tour.name} - Sunshine Coast 4WD Tours`,
        },
      ],
    },
  };
}
```

### 3.5 Open Graph Type by Page

```typescript
// Homepage / Tours
type: 'website'

// Blog Posts
type: 'article'
article: {
  publishedTime: '2025-01-15T00:00:00Z',
  modifiedTime: '2025-01-20T00:00:00Z',
  authors: ['https://sunshinecoast4wdtours.com.au/about/team'],
  section: '4WD Guides',
  tags: ['4WD', 'Sunshine Coast', 'Off-road'],
}

// Individual Tours (if using product schema)
type: 'product'
```

---

## 4. Twitter Cards

### 4.1 Required Twitter Card Properties (MANDATORY)

**Every page MUST have:**
- `twitter:card` (summary or summary_large_image)
- `twitter:title`
- `twitter:description`
- `twitter:image`
- `twitter:site` (optional, @SC4WDTours)
- `twitter:creator` (optional, @SC4WDTours)

### 4.2 Twitter Card Types

**Use `summary_large_image` for:**
- Homepage
- Tour pages
- Blog posts with featured images

**Use `summary` for:**
- Text-heavy pages
- Pages without prominent images

### 4.3 Image Requirements

**For `summary_large_image`:**
- Recommended: 1200 x 628 pixels
- Minimum: 300 x 157 pixels
- Maximum: 4096 x 4096 pixels
- Aspect ratio: 2:1
- Format: JPG, PNG, WEBP, GIF
- Max file size: 5MB

**For `summary`:**
- Square image: 144 x 144 pixels minimum
- Maximum: 4096 x 4096 pixels

### 4.4 Current Implementation (app/layout.tsx)

```typescript
export const metadata: Metadata = {
  twitter: {
    card: 'summary_large_image',
    title: 'Sunshine Coast 4WD Tours | Premium Off-Road Adventures',
    description: "Experience the best 4WD tours on Queensland's Sunshine Coast. Book your premium off-road adventure today!",
    images: ['/images/twitter-image.jpg'],
    creator: '@SC4WDTours',
    site: '@SC4WDTours',
  },
};
```

### 4.5 Page-Level Twitter Cards

```typescript
// app/tours/[slug]/page.tsx
export async function generateMetadata({ params }): Promise<Metadata> {
  const tour = await getTourBySlug(params.slug);

  return {
    twitter: {
      card: 'summary_large_image',
      title: `${tour.name} | Sunshine Coast 4WD Tours`,
      description: tour.shortDescription,
      images: [tour.twitterImage],
      creator: '@SC4WDTours',
    },
  };
}
```

### 4.6 Twitter Card Validation

**Testing Tool:**
- Twitter Card Validator: https://cards-dev.twitter.com/validator
- Meta Tags Checker: https://metatags.io/

**Validation Checklist:**
- [ ] Image loads correctly
- [ ] Title displays properly (no truncation)
- [ ] Description is readable
- [ ] Card type is appropriate
- [ ] All required fields present

---

## 5. Structured Data

### 5.1 JSON-LD Implementation (MANDATORY)

**All structured data MUST use JSON-LD format (not Microdata or RDFa)**

**Why JSON-LD:**
- Google's recommended format
- Easier to implement and maintain
- Doesn't affect page rendering
- Can be added via Next.js Script component

### 5.2 Required Schemas (MANDATORY)

**Every site MUST have:**
1. Organization schema
2. LocalBusiness schema
3. BreadcrumbList schema

**Tour pages MUST have:**
4. Product schema (for each tour)
5. AggregateRating schema (if reviews exist)

**Blog posts SHOULD have:**
6. Article schema

See `/docs/seo/structured-data-requirements.md` for complete implementation guide.

---

## 6. Canonical URLs

### 6.1 Canonical URL Requirements (MANDATORY)

**Every page MUST have:**
- A canonical URL pointing to itself
- Absolute URL (not relative)
- HTTPS protocol
- Lowercase letters only
- Consistent trailing slash handling

### 6.2 Current Implementation

**Root Layout (app/layout.tsx):**
```typescript
export const metadata: Metadata = {
  metadataBase: new URL('https://sunshinecoast4wdtours.com.au'),
  alternates: {
    canonical: 'https://sunshinecoast4wdtours.com.au',
  },
};
```

**Page-Level Canonical:**
```typescript
// app/tours/beach-adventure/page.tsx
export const metadata: Metadata = {
  alternates: {
    canonical: 'https://sunshinecoast4wdtours.com.au/tours/beach-adventure',
  },
};
```

**Dynamic Page Canonical:**
```typescript
// app/tours/[slug]/page.tsx
export async function generateMetadata({ params }): Promise<Metadata> {
  return {
    alternates: {
      canonical: `https://sunshinecoast4wdtours.com.au/tours/${params.slug}`,
    },
  };
}
```

### 6.3 Canonical URL Best Practices

**DO:**
- ✅ Use absolute URLs (https://domain.com/page)
- ✅ Point to the preferred version of the page
- ✅ Use consistent trailing slash (choose one style)
- ✅ Include on all pages (even unique pages)
- ✅ Self-reference canonical on unique pages

**DON'T:**
- ❌ Use relative URLs (/page)
- ❌ Point to different domain (cross-domain)
- ❌ Use HTTP in canonical when page is HTTPS
- ❌ Chain canonicals (A→B→C)
- ❌ Have multiple canonical tags

### 6.4 Handling Query Parameters

**Ignore irrelevant parameters:**
```typescript
// If URL is: /tours/beach?utm_source=facebook&session=123
// Canonical should be:
canonical: 'https://sunshinecoast4wdtours.com.au/tours/beach'
```

**Include relevant parameters:**
```typescript
// If URL is: /tours?category=beach&sort=price
// And these change content, include them:
canonical: 'https://sunshinecoast4wdtours.com.au/tours?category=beach&sort=price'
```

---

## 7. Alternate Links

### 7.1 Mobile Alternate (if applicable)

**If you have separate mobile site (not recommended):**
```typescript
export const metadata: Metadata = {
  alternates: {
    canonical: 'https://sunshinecoast4wdtours.com.au',
    media: {
      'only screen and (max-width: 640px)': 'https://m.sunshinecoast4wdtours.com.au',
    },
  },
};
```

**Note:** For responsive sites (RECOMMENDED), this is NOT needed.

### 7.2 AMP Version (if applicable)

**If you have AMP pages:**
```typescript
export const metadata: Metadata = {
  alternates: {
    types: {
      'application/amp+xml': 'https://sunshinecoast4wdtours.com.au/tours/beach/amp',
    },
  },
};
```

**Note:** AMP is declining in importance. Not required for most sites.

### 7.3 Language Alternates (hreflang)

**For multi-language sites:**
```typescript
export const metadata: Metadata = {
  alternates: {
    canonical: 'https://sunshinecoast4wdtours.com.au',
    languages: {
      'en-AU': 'https://sunshinecoast4wdtours.com.au',
      'en-US': 'https://sunshinecoast4wdtours.com/us',
      'en-GB': 'https://sunshinecoast4wdtours.co.uk',
      'x-default': 'https://sunshinecoast4wdtours.com.au', // Fallback
    },
  },
};
```

**Currently:** Site is English (Australian) only, so this is not needed yet.

---

## 8. Robots Meta Tags

### 8.1 Robots Directives (MANDATORY)

**Default for all pages:**
```typescript
export const metadata: Metadata = {
  robots: {
    index: true,
    follow: true,
    nocache: false,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};
```

**Current Implementation (app/layout.tsx):**
```typescript
robots: {
  index: true,
  follow: true,
  nocache: false,
  googleBot: {
    index: true,
    follow: true,
    'max-video-preview': -1,
    'max-image-preview': 'large',
    'max-snippet': -1,
  },
},
```

### 8.2 When to Noindex (Special Cases)

**Noindex pages:**
```typescript
// app/checkout/page.tsx
export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
  },
};

// Examples:
// - Checkout pages
// - User account pages
// - Thank you pages
// - Internal search results
// - Filtered/faceted pages with duplicate content
```

### 8.3 Robots Directives Explained

| Directive | Purpose | Default |
|-----------|---------|---------|
| `index` | Allow indexing in search results | true |
| `follow` | Follow links on page | true |
| `noarchive` | Don't show cached version | false |
| `nosnippet` | Don't show text snippets | false |
| `noimageindex` | Don't index images | false |
| `max-snippet: N` | Max snippet length (-1 = unlimited) | -1 |
| `max-image-preview` | Image preview size (none, standard, large) | large |
| `max-video-preview: N` | Max video preview seconds (-1 = unlimited) | -1 |

---

## 9. Viewport Configuration

### 9.1 Viewport Meta Tag (MANDATORY)

**Current Implementation (app/layout.tsx):**
```typescript
import type { Viewport } from 'next';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: '#1a5f3f',
};
```

### 9.2 Viewport Properties

| Property | Value | Purpose |
|----------|-------|---------|
| `width` | 'device-width' | Responsive design (MANDATORY) |
| `initialScale` | 1 | Starting zoom level (MANDATORY) |
| `maximumScale` | 5 | Allow zoom (accessibility) |
| `minimumScale` | Not set | Allow zoom out |
| `userScalable` | Not set (default yes) | Allow user zoom |
| `viewportFit` | 'cover' | iPhone X notch handling |

### 9.3 Best Practices

**DO:**
- ✅ Always set width to 'device-width'
- ✅ Always set initialScale to 1
- ✅ Allow user scaling (accessibility requirement)
- ✅ Set maximumScale to at least 5

**DON'T:**
- ❌ Disable user scaling (user-scalable=no)
- ❌ Set maximumScale to 1 (prevents zoom)
- ❌ Use fixed width values

---

## 10. Theme Color and PWA Metadata

### 10.1 Theme Color (MANDATORY)

**Purpose:**
- Sets browser UI color on mobile devices
- Appears in browser tab bar (Android Chrome)
- Used in Progressive Web App (PWA)

**Current Implementation:**
```typescript
export const metadata: Metadata = {
  themeColor: '#1a5f3f', // Sunshine Coast 4WD Tours brand color
};

export const viewport: Viewport = {
  themeColor: '#1a5f3f',
};
```

### 10.2 Web App Manifest (MANDATORY for PWA)

**Location:** `/public/manifest.json`

**Current Reference (app/layout.tsx):**
```typescript
export const metadata: Metadata = {
  manifest: '/manifest.json',
};
```

**Required manifest.json:**
```json
{
  "name": "Sunshine Coast 4WD Tours",
  "short_name": "SC 4WD Tours",
  "description": "Premium 4WD tours and off-road adventures on Queensland's Sunshine Coast",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#1a5f3f",
  "orientation": "portrait-primary",
  "icons": [
    {
      "src": "/icons/icon-72x72.png",
      "sizes": "72x72",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-96x96.png",
      "sizes": "96x96",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-128x128.png",
      "sizes": "128x128",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-144x144.png",
      "sizes": "144x144",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-152x152.png",
      "sizes": "152x152",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-192x192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-384x384.png",
      "sizes": "384x384",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-512x512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ]
}
```

### 10.3 Apple Touch Icons

**Current Implementation (app/layout.tsx):**
```typescript
export const metadata: Metadata = {
  icons: {
    icon: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
};
```

**Required in `<head>` (app/layout.tsx):**
```html
<meta name="apple-mobile-web-app-capable" content="yes" />
<meta name="apple-mobile-web-app-status-bar-style" content="default" />
<meta name="apple-mobile-web-app-title" content="SC 4WD Tours" />
```

**Apple Touch Icon Sizes:**
- 180x180px (required for iOS)
- 152x152px (iPad)
- 120x120px (iPhone)

---

## 11. Language and Locale Metadata

### 11.1 HTML Lang Attribute (MANDATORY)

**Current Implementation (app/layout.tsx):**
```html
<html lang="en-AU">
```

**Language Codes:**
- `en-AU` - English (Australia) [CURRENT]
- `en-US` - English (United States)
- `en-GB` - English (United Kingdom)
- `en` - Generic English (avoid)

### 11.2 Open Graph Locale

**Current Implementation:**
```typescript
export const metadata: Metadata = {
  openGraph: {
    locale: 'en_AU', // Note: underscore, not hyphen
  },
};
```

### 11.3 Content Language

**Additional Meta Tag (optional):**
```html
<meta httpEquiv="content-language" content="en-AU" />
```

---

## 12. Next.js 14 Metadata API Patterns

### 12.1 Static Metadata

**Use for pages with fixed content:**

```typescript
// app/about/page.tsx
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'About Us | Expert 4WD Guides',
  description: 'Meet our expert 4WD guides with 20+ years experience on Sunshine Coast.',
  alternates: {
    canonical: 'https://sunshinecoast4wdtours.com.au/about',
  },
};

export default function AboutPage() {
  return <div>About content</div>;
}
```

### 12.2 Dynamic Metadata

**Use for dynamic pages (CMS content, database-driven):**

```typescript
// app/tours/[slug]/page.tsx
import type { Metadata } from 'next';

interface Props {
  params: { slug: string };
  searchParams: { [key: string]: string | string[] | undefined };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const tour = await getTourBySlug(params.slug);

  if (!tour) {
    return {
      title: 'Tour Not Found',
    };
  }

  return {
    title: tour.name,
    description: tour.description,
    keywords: tour.keywords,
    alternates: {
      canonical: `https://sunshinecoast4wdtours.com.au/tours/${params.slug}`,
    },
    openGraph: {
      title: tour.name,
      description: tour.description,
      images: [
        {
          url: tour.image,
          width: 1200,
          height: 630,
          alt: tour.imageAlt,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: tour.name,
      description: tour.shortDescription,
      images: [tour.twitterImage],
    },
  };
}

export default function TourPage({ params }: Props) {
  return <div>Tour content</div>;
}
```

### 12.3 Metadata Merging

**Parent metadata is merged with child metadata:**

```typescript
// app/layout.tsx (Root)
export const metadata: Metadata = {
  title: {
    template: '%s | Sunshine Coast 4WD Tours',
    default: 'Sunshine Coast 4WD Tours',
  },
  metadataBase: new URL('https://sunshinecoast4wdtours.com.au'),
};

// app/tours/layout.tsx (Tours section)
export const metadata: Metadata = {
  openGraph: {
    type: 'website',
    siteName: 'Sunshine Coast 4WD Tours',
  },
};

// app/tours/beach/page.tsx (Individual page)
export const metadata: Metadata = {
  title: 'Beach Adventure', // Merges with root template
  description: 'Beach 4WD tour description',
};

// Final rendered metadata for /tours/beach:
// title: "Beach Adventure | Sunshine Coast 4WD Tours"
// All other metadata from parent layouts merged
```

### 12.4 generateMetadata with Async Data

**Fetch data for metadata:**

```typescript
async function getTour(slug: string) {
  const res = await fetch(`https://api.example.com/tours/${slug}`, {
    next: { revalidate: 3600 }, // Revalidate every hour
  });
  return res.json();
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const tour = await getTour(params.slug);

  return {
    title: tour.title,
    description: tour.description,
  };
}
```

### 12.5 Complete Page Example

```typescript
// app/tours/[slug]/page.tsx
import type { Metadata } from 'next';
import Script from 'next/script';

interface Tour {
  id: string;
  slug: string;
  name: string;
  description: string;
  shortDescription: string;
  price: number;
  duration: number;
  image: string;
  keywords: string[];
}

async function getTour(slug: string): Promise<Tour | null> {
  // Fetch from CMS or database
  const res = await fetch(`https://api.example.com/tours/${slug}`);
  if (!res.ok) return null;
  return res.json();
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const tour = await getTour(params.slug);

  if (!tour) {
    return {
      title: 'Tour Not Found',
    };
  }

  return {
    title: `${tour.name} | Sunshine Coast 4WD Tour`,
    description: tour.description,
    keywords: tour.keywords,
    alternates: {
      canonical: `https://sunshinecoast4wdtours.com.au/tours/${params.slug}`,
    },
    openGraph: {
      type: 'website',
      url: `https://sunshinecoast4wdtours.com.au/tours/${params.slug}`,
      title: tour.name,
      description: tour.description,
      images: [
        {
          url: tour.image,
          width: 1200,
          height: 630,
          alt: `${tour.name} - Sunshine Coast 4WD Tours`,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: tour.name,
      description: tour.shortDescription,
      images: [tour.image],
    },
  };
}

export default async function TourPage({ params }: { params: { slug: string } }) {
  const tour = await getTour(params.slug);

  if (!tour) {
    return <div>Tour not found</div>;
  }

  // Product schema for the tour
  const productSchema = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: tour.name,
    description: tour.description,
    image: tour.image,
    offers: {
      '@type': 'Offer',
      price: tour.price,
      priceCurrency: 'AUD',
      availability: 'https://schema.org/InStock',
    },
  };

  return (
    <>
      <Script
        id={`tour-schema-${tour.id}`}
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(productSchema),
        }}
      />

      <div>
        <h1>{tour.name}</h1>
        <p>{tour.description}</p>
      </div>
    </>
  );
}
```

---

## 13. Verification Tags

### 13.1 Search Engine Verification (MANDATORY)

**Current Implementation (app/layout.tsx):**
```typescript
export const metadata: Metadata = {
  verification: {
    google: 'your-google-verification-code',
    yandex: 'your-yandex-verification-code',
  },
};
```

**How to get verification codes:**

1. **Google Search Console:**
   - Go to https://search.google.com/search-console
   - Add property for sunshinecoast4wdtours.com.au
   - Choose "HTML tag" verification method
   - Copy the content value from the meta tag
   - Add to verification.google

2. **Bing Webmaster Tools:**
   - Go to https://www.bing.com/webmasters
   - Add site
   - Choose "Meta tag" option
   - Copy verification code
   - Add to metadata:

```typescript
verification: {
  google: 'abc123...',
  other: {
    'msvalidate.01': 'bing-verification-code',
  },
}
```

### 13.2 Other Verification Services

```typescript
export const metadata: Metadata = {
  verification: {
    google: 'google-site-verification-code',
    yandex: 'yandex-verification-code',
    other: {
      'msvalidate.01': 'bing-verification-code',
      'facebook-domain-verification': 'fb-domain-verification-code',
      'p:domain_verify': 'pinterest-verification-code',
    },
  },
};
```

---

## 14. Metadata Validation Checklist

**Before deploying any page, verify:**

### Title Tags
- [ ] Length between 50-60 characters
- [ ] Includes primary keyword
- [ ] Includes location (Sunshine Coast)
- [ ] Unique for every page
- [ ] Template working correctly

### Meta Descriptions
- [ ] Length between 150-160 characters
- [ ] Includes primary and secondary keywords
- [ ] Includes call-to-action
- [ ] Unique for every page
- [ ] Compelling and clickable

### Open Graph
- [ ] og:title present and correct
- [ ] og:description present and correct
- [ ] og:image present (1200x630px)
- [ ] og:url is canonical URL
- [ ] og:type appropriate for page
- [ ] og:locale set to en_AU

### Twitter Cards
- [ ] twitter:card type set
- [ ] twitter:title present
- [ ] twitter:description present
- [ ] twitter:image present
- [ ] Validated with Twitter Card Validator

### Technical
- [ ] Canonical URL present and correct
- [ ] Robots meta tags appropriate
- [ ] Viewport meta tag configured
- [ ] Theme color set
- [ ] Language attribute (lang="en-AU")
- [ ] Manifest.json referenced

### Testing
- [ ] View source to confirm meta tags rendered
- [ ] Test with Facebook Sharing Debugger
- [ ] Test with Twitter Card Validator
- [ ] Test with LinkedIn Post Inspector
- [ ] Validate with Google Rich Results Test

---

## 15. Testing Tools

### Meta Tag Testing
- **Facebook Sharing Debugger**: https://developers.facebook.com/tools/debug/
- **Twitter Card Validator**: https://cards-dev.twitter.com/validator
- **LinkedIn Post Inspector**: https://www.linkedin.com/post-inspector/
- **Meta Tags Checker**: https://metatags.io/

### SEO Testing
- **Google Rich Results Test**: https://search.google.com/test/rich-results
- **Schema Validator**: https://validator.schema.org/
- **Mobile-Friendly Test**: https://search.google.com/test/mobile-friendly

### Performance Testing
- **PageSpeed Insights**: https://pagespeed.web.dev/
- **GTmetrix**: https://gtmetrix.com/

---

## Version History

- **v1.0** (2025-11-07): Initial comprehensive metadata standards documentation
- Aligned with Next.js 14 App Router Metadata API
- Referenced current app/layout.tsx implementation
- Sunshine Coast 4WD Tours specific examples

---

**Document Status**: MANDATORY COMPLIANCE REQUIRED
**Review Cycle**: Quarterly
**Next Review**: 2026-02-07
**Owner**: SEO Team / Development Team
