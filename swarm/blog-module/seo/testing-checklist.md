# Blog Module SEO - Testing Checklist

**Date**: 2025-11-07
**Purpose**: Validate all SEO implementations before deployment

## Pre-Deployment Testing

### 1. Metadata Validation

#### Title Tags
- [ ] Length: 50-60 characters (MANDATORY)
- [ ] Includes primary keyword (e.g., "4WD", "Sunshine Coast")
- [ ] Includes location (Sunshine Coast)
- [ ] Unique for every blog post
- [ ] No special characters (except hyphens and pipes)
- [ ] Follows format: `[Primary Keyword] | [Location] | [Brand]`

**Test Command**:
```bash
# Check title tag in HTML
curl -s https://sunshinecoast4wdtours.com.au/blog/[slug] | grep -o '<title>[^<]*</title>'
```

#### Meta Descriptions
- [ ] Length: 150-160 characters (MANDATORY)
- [ ] Includes primary and secondary keywords
- [ ] Includes call-to-action
- [ ] Compelling and clickable
- [ ] No quotation marks
- [ ] Unique for every blog post

**Test Command**:
```bash
# Check meta description
curl -s https://sunshinecoast4wdtours.com.au/blog/[slug] | grep -o '<meta name="description"[^>]*>'
```

### 2. Open Graph Tags

#### Required Properties
- [ ] `og:type` = "article" (not "website")
- [ ] `og:title` present and correct
- [ ] `og:description` present (can differ from meta description)
- [ ] `og:url` is absolute canonical URL
- [ ] `og:image` present (1200x630px recommended)
- [ ] `og:locale` = "en_AU"
- [ ] `og:site_name` = "Sunshine Coast 4WD Tours"
- [ ] `article:published_time` in ISO 8601 format
- [ ] `article:modified_time` in ISO 8601 format
- [ ] `article:author` present
- [ ] `article:section` = category
- [ ] `article:tag` array present

**Test Tool**: Facebook Sharing Debugger
https://developers.facebook.com/tools/debug/

**Manual Test**:
1. Enter URL: `https://sunshinecoast4wdtours.com.au/blog/[slug]`
2. Click "Debug"
3. Check all OG tags are present
4. Verify image displays correctly
5. Check for warnings or errors

### 3. Twitter Cards

#### Required Properties
- [ ] `twitter:card` = "summary_large_image"
- [ ] `twitter:title` present
- [ ] `twitter:description` present
- [ ] `twitter:image` present
- [ ] `twitter:creator` = "@SC4WDTours"
- [ ] `twitter:site` = "@SC4WDTours"

**Test Tool**: Twitter Card Validator
https://cards-dev.twitter.com/validator

**Manual Test**:
1. Enter URL: `https://sunshinecoast4wdtours.com.au/blog/[slug]`
2. Click "Preview card"
3. Verify card displays correctly
4. Check image loads
5. Verify title and description

### 4. Structured Data (JSON-LD)

#### Article Schema
- [ ] `@context` = "https://schema.org"
- [ ] `@type` = "Article"
- [ ] `@id` present and unique
- [ ] `headline` present
- [ ] `description` present
- [ ] `image` array with URLs
- [ ] `author` object with Person schema
- [ ] `publisher` object with Organization schema
- [ ] `datePublished` in ISO 8601 format
- [ ] `dateModified` in ISO 8601 format
- [ ] `mainEntityOfPage` present
- [ ] `articleSection` = category
- [ ] `keywords` comma-separated
- [ ] `inLanguage` = "en-AU"

**Test Tool**: Google Rich Results Test
https://search.google.com/test/rich-results

**Manual Test**:
1. Enter URL: `https://sunshinecoast4wdtours.com.au/blog/[slug]`
2. Click "Test URL"
3. Check for 0 errors (MANDATORY)
4. Review warnings
5. Verify Article schema detected
6. Check preview rendering

#### Organization Schema
- [ ] `@type` = "Organization"
- [ ] `name` = "Sunshine Coast 4WD Tours"
- [ ] `url` present
- [ ] `logo` with ImageObject
- [ ] `description` present
- [ ] `address` with PostalAddress
- [ ] `sameAs` array with social media

#### Author Schema
- [ ] `@type` = "Person"
- [ ] `name` present
- [ ] `url` present
- [ ] `image` present
- [ ] `jobTitle` present
- [ ] `worksFor` references Organization

#### Breadcrumb Schema
- [ ] `@type` = "BreadcrumbList"
- [ ] `itemListElement` array present
- [ ] Three levels: Home → Blog → Post
- [ ] Position starts at 1
- [ ] All items have absolute URLs

**Test Tool**: Schema.org Validator
https://validator.schema.org/

**Manual Test**:
1. View page source
2. Copy all JSON-LD scripts
3. Paste into validator
4. Check for errors
5. Verify structure

### 5. Canonical URLs

- [ ] Present on all blog post pages
- [ ] Absolute URL (not relative)
- [ ] HTTPS protocol
- [ ] Matches page URL exactly
- [ ] No query parameters (unless necessary)
- [ ] Lowercase letters only
- [ ] Self-referencing (not pointing elsewhere)

**Test Command**:
```bash
# Check canonical URL
curl -s https://sunshinecoast4wdtours.com.au/blog/[slug] | grep -o '<link rel="canonical"[^>]*>'
```

### 6. Sitemap Validation

#### Blog Posts in Sitemap
- [ ] All blog posts included
- [ ] URLs are absolute
- [ ] `lastModified` uses actual post date (not current date)
- [ ] `changeFrequency` = "monthly"
- [ ] `priority` = 0.7-0.8
- [ ] Blog listing page included (`/blog`)
- [ ] Valid XML structure

**Test Tool**: Google Search Console
https://search.google.com/search-console

**Manual Test**:
1. Visit `https://sunshinecoast4wdtours.com.au/sitemap.xml`
2. Check all blog post URLs present
3. Verify lastModified dates are accurate
4. Submit sitemap to Search Console
5. Check for indexing errors

**Test Command**:
```bash
# Fetch and validate sitemap
curl -s https://sunshinecoast4wdtours.com.au/sitemap.xml | xmllint --format -
```

### 7. robots.txt Validation

- [ ] Blog section explicitly allowed (`Allow: /blog/`)
- [ ] Blog images allowed (`Allow: /images/blog/`)
- [ ] No conflicting Disallow rules
- [ ] Sitemap reference present
- [ ] Googlebot crawl-delay = 0
- [ ] Valid syntax

**Test Tool**: Google Search Console Robots Testing Tool
https://search.google.com/search-console (Crawl > robots.txt Tester)

**Manual Test**:
1. Visit `https://sunshinecoast4wdtours.com.au/robots.txt`
2. Verify blog rules present
3. Test with Google's robots.txt Tester
4. Check no blocked resources

### 8. Performance Testing

#### PageSpeed Insights
- [ ] Desktop score: 90+ (MANDATORY)
- [ ] Mobile score: 90+ (MANDATORY)
- [ ] No blocking resources
- [ ] Images optimized
- [ ] CSS/JS minified

**Test Tool**: PageSpeed Insights
https://pagespeed.web.dev/

**Target Scores**:
- Desktop: 95+ (minimum 90)
- Mobile: 93+ (minimum 90)

#### Core Web Vitals
- [ ] LCP (Largest Contentful Paint): < 2.5s
- [ ] FID (First Input Delay): < 100ms
- [ ] CLS (Cumulative Layout Shift): < 0.1
- [ ] FCP (First Contentful Paint): < 1.8s
- [ ] TTFB (Time to First Byte): < 600ms

### 9. Mobile Testing

- [ ] Mobile-friendly test passed
- [ ] Touch targets at least 48x48px
- [ ] Text readable (minimum 16px)
- [ ] No horizontal scrolling
- [ ] Fast load time on 3G
- [ ] Images responsive

**Test Tool**: Google Mobile-Friendly Test
https://search.google.com/test/mobile-friendly

### 10. Accessibility Testing

- [ ] WCAG 2.1 AA compliance
- [ ] Alt text on all images
- [ ] Proper heading hierarchy (H1 → H2 → H3)
- [ ] Color contrast ratios: 4.5:1 minimum
- [ ] Keyboard navigation works
- [ ] Screen reader compatible
- [ ] Focus indicators visible
- [ ] ARIA labels on interactive elements

**Test Tool**: WAVE
https://wave.webaim.org/

**Test Tool**: axe DevTools
Chrome extension

### 11. Content Quality

- [ ] Minimum 300 words per post
- [ ] Original content (not copied)
- [ ] Keyword density: 1-2%
- [ ] LSI keywords included
- [ ] Internal links present
- [ ] External links (if relevant)
- [ ] Proper grammar and spelling
- [ ] Engaging and valuable

### 12. Image Optimization

- [ ] All images < 200KB
- [ ] WebP format (with fallbacks)
- [ ] Proper dimensions (1200x630 for OG images)
- [ ] Descriptive file names
- [ ] Alt text present and descriptive
- [ ] Lazy loading for below-fold images
- [ ] Responsive images (srcset)

## Automated Testing Commands

### Full SEO Test Suite
```bash
# Run all SEO tests
npm run test:seo

# Test metadata compliance
npm run test:metadata

# Validate structured data
npm run test:schema

# Check performance
npm run test:performance
```

### Individual Tests
```bash
# Check title tags
npm run test:titles

# Check meta descriptions
npm run test:descriptions

# Validate Open Graph
npm run test:opengraph

# Validate Twitter Cards
npm run test:twitter

# Check canonical URLs
npm run test:canonical

# Validate sitemap
npm run test:sitemap
```

## Pre-Deployment Checklist

Before deploying blog module to production:

### Critical (MUST PASS)
- [ ] All metadata within character limits
- [ ] All structured data validates (0 errors)
- [ ] Sitemap includes all blog posts
- [ ] robots.txt allows blog indexing
- [ ] PageSpeed scores 90+ (mobile and desktop)
- [ ] Core Web Vitals in green range
- [ ] Mobile-friendly test passed
- [ ] No broken links
- [ ] All images have alt text

### Important (SHOULD PASS)
- [ ] Open Graph preview looks good
- [ ] Twitter Card preview looks good
- [ ] Breadcrumbs display correctly
- [ ] Author schema present
- [ ] All warnings addressed
- [ ] Accessibility score 95+
- [ ] Images optimized
- [ ] Internal linking implemented

### Recommended (NICE TO HAVE)
- [ ] FAQ schema (if FAQs present)
- [ ] Video schema (if videos present)
- [ ] Comments schema (if comments enabled)
- [ ] Rating schema (if ratings enabled)

## Post-Deployment Monitoring

### Week 1
- [ ] Submit sitemap to Google Search Console
- [ ] Submit sitemap to Bing Webmaster Tools
- [ ] Monitor indexing status
- [ ] Check for crawl errors
- [ ] Monitor Core Web Vitals
- [ ] Check for manual actions

### Week 2-4
- [ ] Monitor keyword rankings
- [ ] Track organic traffic
- [ ] Review Search Console performance
- [ ] Check backlink profile
- [ ] Monitor page speed
- [ ] Review user engagement metrics

### Monthly
- [ ] Full technical SEO audit
- [ ] Content gap analysis
- [ ] Competitor analysis
- [ ] Update stale content
- [ ] Check for 404 errors
- [ ] Review internal linking

## Validation Results Template

### Blog Post: [Post Title]
**URL**: `https://sunshinecoast4wdtours.com.au/blog/[slug]`
**Date Tested**: 2025-11-07

#### Metadata
- Title: ✅ 52 characters
- Description: ✅ 158 characters
- Keywords: ✅ Present
- Canonical: ✅ Correct

#### Open Graph
- Type: ✅ article
- Image: ✅ 1200x630
- All tags: ✅ Present

#### Twitter Card
- Card type: ✅ summary_large_image
- All tags: ✅ Present

#### Structured Data
- Article schema: ✅ Valid (0 errors)
- Organization schema: ✅ Valid
- Author schema: ✅ Valid
- Breadcrumb schema: ✅ Valid

#### Performance
- PageSpeed Desktop: 95/100 ✅
- PageSpeed Mobile: 93/100 ✅
- LCP: 2.1s ✅
- FID: 85ms ✅
- CLS: 0.05 ✅

#### Issues Found
- None

#### Recommendations
- Consider adding FAQ schema
- Add more internal links

**Status**: ✅ APPROVED FOR DEPLOYMENT

## Tools Quick Reference

### Validation
- Google Rich Results: https://search.google.com/test/rich-results
- Schema Validator: https://validator.schema.org/
- Facebook Debugger: https://developers.facebook.com/tools/debug/
- Twitter Validator: https://cards-dev.twitter.com/validator

### Performance
- PageSpeed Insights: https://pagespeed.web.dev/
- GTmetrix: https://gtmetrix.com/
- WebPageTest: https://www.webpagetest.org/

### Accessibility
- WAVE: https://wave.webaim.org/
- axe DevTools: https://www.deque.com/axe/devtools/

### SEO
- Google Search Console: https://search.google.com/search-console
- Bing Webmaster Tools: https://www.bing.com/webmasters
- Mobile-Friendly Test: https://search.google.com/test/mobile-friendly

## Status: READY FOR TESTING

All testing procedures documented and ready for execution.
