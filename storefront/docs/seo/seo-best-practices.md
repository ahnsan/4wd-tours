# SEO Best Practices for Sunshine Coast 4WD Tours

## Overview

This document outlines world-class SEO best practices for the Sunshine Coast 4WD Tours storefront. These guidelines are hard-follow requirements that ensure maximum search visibility for our Queensland-based adventure tourism business.

**Target Market**: Sunshine Coast, Queensland, Australia
**Business Type**: Adventure Tourism / 4WD Tour Operator
**Primary Keywords**: Sunshine Coast 4WD tours, Queensland off-road adventures, beach 4WD tours

---

## 1. Technical SEO Requirements

### 1.1 Sitemap (MANDATORY)

**Requirements:**
- XML sitemap at `/sitemap.xml`
- Update frequency: Daily for tours, weekly for static pages
- Include all public pages (tours, about, contact, blog)
- Submit to Google Search Console and Bing Webmaster Tools

**Implementation:**
```typescript
// app/sitemap.ts
import { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: 'https://sunshinecoast4wdtours.com.au',
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: 'https://sunshinecoast4wdtours.com.au/tours',
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: 'https://sunshinecoast4wdtours.com.au/about',
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: 'https://sunshinecoast4wdtours.com.au/contact',
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    // Add dynamic tour pages
  ];
}
```

### 1.2 Robots.txt (MANDATORY)

**Location**: `/public/robots.txt`

**Requirements:**
- Allow all search engines
- Block admin areas and API routes
- Reference sitemap location
- Block staging/test environments

**Implementation:**
```txt
# /public/robots.txt
User-agent: *
Allow: /
Disallow: /api/
Disallow: /admin/
Disallow: /_next/
Disallow: /checkout/
Disallow: /account/

# Sitemap location
Sitemap: https://sunshinecoast4wdtours.com.au/sitemap.xml

# Googlebot specific rules
User-agent: Googlebot
Allow: /
Crawl-delay: 0

# Prevent staging from being indexed
User-agent: *
Disallow: /staging/
```

### 1.3 Canonical URLs (MANDATORY)

**Rules:**
- Every page MUST have a canonical URL
- Avoid duplicate content issues
- Use absolute URLs (not relative)
- Consistent trailing slash handling

**Current Implementation (app/layout.tsx):**
```typescript
export const metadata: Metadata = {
  metadataBase: new URL('https://sunshinecoast4wdtours.com.au'),
  alternates: {
    canonical: 'https://sunshinecoast4wdtours.com.au',
  },
};
```

**Page-Level Override Example:**
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

### 1.4 HTTPS and Security (MANDATORY)

- **MANDATORY**: Entire site MUST be served over HTTPS
- HTTP requests MUST redirect to HTTPS (301)
- Valid SSL certificate with auto-renewal
- HSTS header enabled
- No mixed content warnings

**Next.js Configuration:**
```javascript
// next.config.js
module.exports = {
  async redirects() {
    return [
      {
        source: '/:path*',
        has: [
          {
            type: 'header',
            key: 'x-forwarded-proto',
            value: 'http',
          },
        ],
        destination: 'https://sunshinecoast4wdtours.com.au/:path*',
        permanent: true,
      },
    ];
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains; preload',
          },
        ],
      },
    ];
  },
};
```

---

## 2. On-Page SEO Standards

### 2.1 Title Tags (MANDATORY)

**Rules:**
- Length: 50-60 characters (MANDATORY)
- Include primary keyword near the beginning
- Include location (Sunshine Coast) for local SEO
- Unique for every page (no duplicates)
- Brand name at the end with pipe separator

**Format Pattern:**
```
[Primary Keyword] | [Location] | [Brand Name]
```

**Examples:**
```typescript
// Homepage
title: 'Sunshine Coast 4WD Tours | Premium Off-Road Adventures Queensland'

// Tour page
title: 'Beach 4WD Adventure | Sunshine Coast | SC 4WD Tours'

// About page
title: 'About Us | Expert 4WD Guides | Sunshine Coast 4WD Tours'

// Blog post
title: 'Best 4WD Tracks Sunshine Coast 2025 | SC 4WD Tours'
```

**Current Implementation (app/layout.tsx):**
```typescript
export const metadata: Metadata = {
  title: {
    default: 'Sunshine Coast 4WD Tours | Premium Off-Road Adventures Queensland',
    template: '%s | Sunshine Coast 4WD Tours',
  },
};
```

### 2.2 Meta Descriptions (MANDATORY)

**Rules:**
- Length: 150-160 characters (MANDATORY)
- Include primary and secondary keywords naturally
- Include call-to-action (Book now, Learn more)
- Location mention (Sunshine Coast, Queensland)
- Unique for every page

**Examples:**
```typescript
// Homepage
description: "Experience the best 4WD tours on Queensland's Sunshine Coast. Premium off-road adventures, beach drives, rainforest exploration. Book your adventure today!"

// Tour page
description: "Join our 4-hour beach 4WD adventure on Sunshine Coast. Expert guides, pristine beaches, wildlife encounters. From $149 per person. Book now!"

// About page
description: "Meet our expert 4WD guides with 20+ years experience on Sunshine Coast. Certified, local knowledge, safety-first approach. Learn about our team."
```

### 2.3 Heading Hierarchy (MANDATORY)

**Rules:**
- ONE H1 per page (MANDATORY)
- H1 should match or closely relate to title tag
- Use H2-H6 in hierarchical order (no skipping)
- Include keywords in headings naturally
- Descriptive, not generic (avoid "Click here", "Learn more")

**Correct Structure:**
```html
<h1>Sunshine Coast 4WD Beach Adventure Tour</h1>
  <h2>Tour Overview</h2>
    <h3>What's Included</h3>
    <h3>Tour Highlights</h3>
  <h2>Sunshine Coast Beaches You'll Explore</h2>
    <h3>Rainbow Beach 4WD Experience</h3>
    <h3>Fraser Island Access Points</h3>
  <h2>Booking Information</h2>
    <h3>Tour Pricing</h3>
    <h3>Available Dates</h3>
```

**WRONG Structure:**
```html
<!-- ❌ Multiple H1 tags -->
<h1>Beach Tour</h1>
<h1>Book Now</h1>

<!-- ❌ Skipping heading levels -->
<h2>Overview</h2>
<h4>Details</h4>

<!-- ❌ Generic headings -->
<h2>Click Here</h2>
<h3>Learn More</h3>
```

### 2.4 Image SEO (MANDATORY)

**Rules:**
- Alt text for ALL images (MANDATORY)
- Descriptive file names (not IMG_1234.jpg)
- WebP format with fallbacks
- Lazy loading for below-fold images
- Proper dimensions set (avoid layout shift)
- Title attribute for context (RECOMMENDED)

**Implementation:**
```tsx
// ✅ CORRECT
<Image
  src="/images/rainbow-beach-4wd-tour.webp"
  alt="4WD vehicle driving on Rainbow Beach Sunshine Coast during sunset tour"
  width={800}
  height={600}
  loading="lazy"
  title="Rainbow Beach 4WD Adventure - Sunshine Coast Tours"
/>

// ❌ WRONG
<img src="/img1234.jpg" />
<Image src="/hero.png" alt="image" />
```

**File Naming Convention:**
```
✅ sunshine-coast-4wd-beach-tour.webp
✅ rainbow-beach-adventure-2025.webp
✅ fraser-island-4x4-track.webp

❌ IMG_1234.jpg
❌ photo.png
❌ untitled.webp
```

---

## 3. Mobile SEO Requirements

### 3.1 Mobile-First Design (MANDATORY)

**Requirements:**
- Responsive design that works on all screen sizes
- Touch-friendly buttons (minimum 44x44px)
- Readable font sizes (minimum 16px body text)
- No horizontal scrolling
- Fast mobile page load (target < 2.5s LCP)

**Viewport Configuration (app/layout.tsx):**
```typescript
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5, // Allow zoom for accessibility
  themeColor: '#1a5f3f',
};
```

### 3.2 Mobile Usability (MANDATORY)

**Testing Requirements:**
- Test on real devices (iPhone, Android)
- Google Mobile-Friendly Test: PASS required
- No intrusive interstitials or popups
- Easy navigation with thumb-friendly menus
- Forms optimized for mobile input

**Testing Tools:**
- Google Mobile-Friendly Test: https://search.google.com/test/mobile-friendly
- PageSpeed Insights Mobile: https://pagespeed.web.dev/
- Chrome DevTools Device Mode

### 3.3 Core Web Vitals - Mobile (MANDATORY)

**Target Metrics:**
- LCP (Largest Contentful Paint): < 2.5s
- FID (First Input Delay): < 100ms
- CLS (Cumulative Layout Shift): < 0.1
- INP (Interaction to Next Paint): < 200ms

See `/docs/CORE_WEB_VITALS_OPTIMIZATION.md` for implementation details.

---

## 4. Site Speed and SEO Relationship

### 4.1 Performance is a Ranking Factor (MANDATORY)

**Google's Core Web Vitals are ranking factors:**
- Slow sites rank lower in search results
- Fast sites provide better user experience
- Mobile speed is MORE important than desktop

**Target Performance Metrics:**
- PageSpeed Insights Score: > 90 (mobile and desktop)
- Time to Interactive: < 3.5s
- Total Blocking Time: < 200ms
- Speed Index: < 3.0s

### 4.2 Performance Optimization Techniques

**Already Implemented (app/layout.tsx):**

1. **DNS Prefetch and Preconnect:**
```html
<link rel="dns-prefetch" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
```

2. **Critical Resource Preloading:**
```html
<link rel="preload" as="image" href="/images/hero.png" fetchPriority="high" />
```

3. **Font Optimization:**
```html
<link href="https://fonts.googleapis.com/css2?family=Lato:wght@300;400;700&display=swap" rel="stylesheet" />
```

**Additional Optimizations Required:**
- Image optimization (WebP, lazy loading)
- Code splitting and dynamic imports
- CDN usage for static assets
- Browser caching headers
- Minification of CSS/JS

See `/docs/PERFORMANCE_OPTIMIZATION.md` for full implementation guide.

---

## 5. International SEO

### 5.1 Language and Locale (MANDATORY)

**Current Implementation:**
```typescript
// app/layout.tsx
export const metadata: Metadata = {
  openGraph: {
    locale: 'en_AU', // Australian English
  },
};
```

```html
<html lang="en-AU">
```

### 5.2 Hreflang for Multi-Language (RECOMMENDED)

**If expanding to other markets:**
```typescript
export const metadata: Metadata = {
  alternates: {
    canonical: 'https://sunshinecoast4wdtours.com.au',
    languages: {
      'en-AU': 'https://sunshinecoast4wdtours.com.au',
      'en-US': 'https://sunshinecoast4wdtours.com/us',
      'en-GB': 'https://sunshinecoast4wdtours.co.uk',
    },
  },
};
```

### 5.3 Currency and Formatting

**Australian Standards:**
- Currency: AUD (Australian Dollars)
- Date format: DD/MM/YYYY
- Phone: +61 format
- Address: Australian postal format

---

## 6. Local SEO for Sunshine Coast

### 6.1 Google Business Profile (MANDATORY)

**Requirements:**
- Verified Google Business Profile
- Accurate business information
- Regular posts and updates
- Respond to all reviews
- Upload high-quality photos weekly
- Select correct business categories

**Primary Category:** Tour Operator
**Secondary Categories:** Tourist Attraction, Sightseeing Tour Agency, Adventure Sports

### 6.2 Local Citations (MANDATORY)

**Required Listings:**
- Google Business Profile
- Bing Places
- Apple Maps
- TripAdvisor
- Tourism Queensland
- Sunshine Coast Tourism
- Yellow Pages Australia
- True Local

**NAP Consistency (Name, Address, Phone):**
```
MUST be identical across all platforms:
Name: Sunshine Coast 4WD Tours
Address: [Exact street address]
Phone: +61 XXX XXX XXX
```

### 6.3 Local Keywords (MANDATORY)

**Primary Local Keywords:**
- Sunshine Coast 4WD tours
- 4WD tours Sunshine Coast
- Sunshine Coast off-road adventures
- Queensland 4x4 tours
- Beach 4WD Sunshine Coast
- Rainbow Beach 4WD tours
- Fraser Island tours Sunshine Coast

**Secondary Local Keywords:**
- Noosa 4WD adventures
- Caloundra off-road tours
- Mooloolaba beach tours
- Coolum 4x4 experiences

### 6.4 Local Content Strategy

**Required Content:**
1. Location pages for each service area
2. Blog posts about local attractions
3. Community event coverage
4. Local partnerships and collaborations
5. Sunshine Coast travel guides

**Example Local Content:**
```
Blog: "Top 10 4WD Tracks on Sunshine Coast (2025 Guide)"
Blog: "Rainbow Beach vs Fraser Island: Which 4WD Tour is Right for You?"
Blog: "Best Time to Visit Sunshine Coast for 4WD Adventures"
```

---

## 7. URL Structure Best Practices

### 7.1 URL Format (MANDATORY)

**Rules:**
- Lowercase only
- Use hyphens (not underscores)
- Short and descriptive
- Include target keyword
- Avoid special characters
- No session IDs or parameters

**Correct Examples:**
```
✅ /tours/beach-adventure
✅ /tours/rainbow-beach-4wd
✅ /tours/fraser-island-day-trip
✅ /blog/sunshine-coast-4wd-guide
✅ /about/our-team

❌ /Tours/Beach_Adventure
❌ /tour?id=123&session=abc
❌ /page.php?tour=beach
❌ /tours/BeachAdventure2025
```

### 7.2 URL Hierarchy

**Structure:**
```
Homepage: /
Tours: /tours
  - /tours/beach-adventure
  - /tours/rainforest-expedition
  - /tours/outback-experience
About: /about
  - /about/our-team
  - /about/safety
Blog: /blog
  - /blog/sunshine-coast-4wd-guide
  - /blog/best-4wd-tracks-2025
Contact: /contact
```

### 7.3 Redirects (MANDATORY)

**When URLs change:**
- Use 301 redirects (permanent)
- Never use 302 redirects for permanent changes
- Maintain redirect chains (max 1 redirect)
- Update internal links to avoid redirects

**Next.js Implementation:**
```javascript
// next.config.js
async redirects() {
  return [
    {
      source: '/old-tour-page',
      destination: '/tours/beach-adventure',
      permanent: true, // 301 redirect
    },
  ];
}
```

---

## 8. Internal Linking Strategy

### 8.1 Link Architecture (MANDATORY)

**Requirements:**
- Every page accessible within 3 clicks from homepage
- Use descriptive anchor text (not "click here")
- Link to related content
- Breadcrumb navigation on all pages
- Footer links to important pages

### 8.2 Anchor Text Best Practices

**Examples:**
```tsx
// ✅ CORRECT - Descriptive anchor text
<Link href="/tours/beach-adventure">
  Sunshine Coast beach 4WD adventure
</Link>

<Link href="/blog/4wd-safety-tips">
  Learn essential 4WD safety tips
</Link>

// ❌ WRONG - Generic anchor text
<Link href="/tours/beach-adventure">click here</Link>
<Link href="/blog/4wd-safety-tips">read more</Link>
```

### 8.3 Breadcrumb Implementation

**Structured Data (already implemented in app/layout.tsx):**
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

**Page-Level Breadcrumbs:**
```tsx
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
      name: tourName,
      item: `https://sunshinecoast4wdtours.com.au/tours/${slug}`,
    },
  ],
};
```

---

## 9. Content Optimization Guidelines

### 9.1 Content Quality (MANDATORY)

**Requirements:**
- Minimum 300 words per page
- Original content (no copying)
- Updated regularly (at least quarterly)
- Answer user questions
- Include relevant keywords naturally
- Avoid keyword stuffing

### 9.2 Keyword Density

**Guidelines:**
- Primary keyword: 1-2% density
- Use synonyms and related terms
- Include LSI (Latent Semantic Indexing) keywords
- Natural language (write for humans, not bots)

**Example:**
```
Primary: "Sunshine Coast 4WD tours"
Synonyms: "4x4 adventures Sunshine Coast", "off-road tours Queensland"
LSI: "beach driving", "Fraser Island", "Rainbow Beach", "4WD permits"
```

### 9.3 Content Types for SEO

**MANDATORY Content:**
1. Tour pages (detailed descriptions)
2. Location pages (service areas)
3. About page (company history, team)
4. FAQ page (common questions)
5. Contact page (with map)

**RECOMMENDED Content:**
1. Blog posts (weekly)
2. Customer testimonials
3. Photo galleries
4. Video content
5. Downloadable guides

---

## 10. Accessibility and SEO Connection

### 10.1 Accessibility is SEO (MANDATORY)

**Why it matters:**
- Google considers accessibility in rankings
- Improves user experience for all users
- Legal compliance (WCAG 2.1 AA)
- Increases potential customer base

### 10.2 Required Accessibility Features

**MANDATORY:**
- Alt text for all images
- Proper heading hierarchy (H1-H6)
- ARIA labels for interactive elements
- Keyboard navigation support
- Color contrast ratios (4.5:1 minimum)
- Focus indicators visible
- Form labels associated with inputs

**Testing Tools:**
- WAVE: https://wave.webaim.org/
- axe DevTools: Chrome extension
- Lighthouse Accessibility Audit
- Screen reader testing (NVDA, JAWS)

### 10.3 Semantic HTML (MANDATORY)

**Use proper HTML5 elements:**
```html
<!-- ✅ CORRECT - Semantic HTML -->
<header>
  <nav aria-label="Main navigation">
    <ul>
      <li><a href="/">Home</a></li>
    </ul>
  </nav>
</header>

<main>
  <article>
    <h1>Tour Title</h1>
    <section>
      <h2>Overview</h2>
    </section>
  </article>
</main>

<footer>
  <address>Contact information</address>
</footer>

<!-- ❌ WRONG - Divitis -->
<div class="header">
  <div class="nav">
    <div class="item">Home</div>
  </div>
</div>
```

---

## 11. SEO Testing and Validation

### 11.1 Required Testing Tools

**MANDATORY Testing (before launch):**
1. Google Search Console - Verify site ownership
2. Google PageSpeed Insights - Performance check
3. Google Mobile-Friendly Test - Mobile optimization
4. Google Rich Results Test - Structured data validation
5. Screaming Frog SEO Spider - Technical audit

**Testing URLs:**
- PageSpeed Insights: https://pagespeed.web.dev/
- Mobile-Friendly Test: https://search.google.com/test/mobile-friendly
- Rich Results Test: https://search.google.com/test/rich-results
- Schema Validator: https://validator.schema.org/

### 11.2 Regular Monitoring (ONGOING)

**Weekly:**
- Google Search Console errors
- Core Web Vitals performance
- Indexing status

**Monthly:**
- Keyword rankings
- Organic traffic trends
- Competitor analysis
- Backlink profile

**Quarterly:**
- Full technical SEO audit
- Content gap analysis
- Site structure review

---

## 12. Common SEO Mistakes to Avoid

### 12.1 Critical Errors (NEVER DO THIS)

**❌ NEVER:**
1. Duplicate content across pages
2. Keyword stuffing (unnatural keyword use)
3. Hidden text or links
4. Cloaking (showing different content to bots)
5. Buying links or link schemes
6. Thin content (< 300 words)
7. Slow page speed (> 4s load time)
8. Missing meta descriptions
9. Broken links (404 errors)
10. No mobile optimization

### 12.2 Technical Mistakes

**❌ Common Issues:**
1. Multiple H1 tags per page
2. Missing alt text on images
3. Non-descriptive URLs (/page?id=123)
4. No canonical URLs
5. Missing sitemap
6. Incorrect robots.txt blocking pages
7. No HTTPS (insecure site)
8. Slow server response time
9. No structured data
10. Poor internal linking

---

## 13. SEO Checklist - Pre-Launch

**Before going live, verify ALL items:**

### Technical SEO
- [ ] HTTPS enabled with valid SSL certificate
- [ ] Robots.txt file created and verified
- [ ] XML sitemap generated and submitted
- [ ] Canonical URLs on all pages
- [ ] 404 page designed
- [ ] 301 redirects for old URLs
- [ ] Site speed optimized (PageSpeed > 90)
- [ ] Mobile-friendly test passed
- [ ] Core Web Vitals in green range

### On-Page SEO
- [ ] Unique title tags (50-60 chars) on all pages
- [ ] Unique meta descriptions (150-160 chars) on all pages
- [ ] One H1 per page
- [ ] Proper heading hierarchy (H1-H6)
- [ ] Alt text on all images
- [ ] Descriptive URLs (lowercase, hyphens)
- [ ] Internal links with descriptive anchor text
- [ ] Breadcrumb navigation implemented

### Local SEO
- [ ] Google Business Profile verified
- [ ] NAP consistency across all platforms
- [ ] Local citations created
- [ ] LocalBusiness schema implemented
- [ ] Location pages created
- [ ] Google Maps embedded on contact page

### Content
- [ ] All pages have 300+ words of unique content
- [ ] Keywords used naturally (1-2% density)
- [ ] FAQ page created
- [ ] Blog section set up
- [ ] Customer testimonials added

### Structured Data
- [ ] Organization schema implemented
- [ ] LocalBusiness schema implemented
- [ ] Product schema for tours
- [ ] BreadcrumbList schema
- [ ] Validated with Google Rich Results Test

### Accessibility
- [ ] WCAG 2.1 AA compliance
- [ ] Keyboard navigation working
- [ ] Color contrast ratios passing
- [ ] ARIA labels on interactive elements
- [ ] Screen reader tested

### Analytics & Tracking
- [ ] Google Search Console set up
- [ ] Google Analytics installed
- [ ] Conversion tracking configured
- [ ] Search Console ownership verified

---

## 14. Resources and Documentation

### Official Documentation
- Next.js 14 Metadata API: https://nextjs.org/docs/app/api-reference/functions/generate-metadata
- Google Search Central: https://developers.google.com/search
- Schema.org: https://schema.org/
- Web.dev (Performance): https://web.dev/

### Internal Documentation
- `/docs/seo/metadata-standards.md` - Metadata implementation guide
- `/docs/seo/structured-data-requirements.md` - Schema.org implementation
- `/docs/PERFORMANCE_OPTIMIZATION.md` - Performance best practices
- `/docs/CORE_WEB_VITALS_OPTIMIZATION.md` - Core Web Vitals guide

### Testing Tools
- PageSpeed Insights: https://pagespeed.web.dev/
- Mobile-Friendly Test: https://search.google.com/test/mobile-friendly
- Rich Results Test: https://search.google.com/test/rich-results
- Schema Validator: https://validator.schema.org/
- WAVE Accessibility: https://wave.webaim.org/

---

## Version History

- **v1.0** (2025-11-07): Initial comprehensive SEO best practices documentation
- Reviewed and aligned with current app/layout.tsx implementation
- Sunshine Coast 4WD Tours specific guidelines established

---

**Document Status**: MANDATORY COMPLIANCE REQUIRED
**Review Cycle**: Quarterly
**Next Review**: 2026-02-07
**Owner**: SEO Team / Development Team
