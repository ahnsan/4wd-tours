# Blog Module Documentation

## Overview

Complete blog implementation for the Sunshine Coast 4WD Tours Next.js storefront. Built with performance optimization, SEO best practices, and responsive design.

---

## Features

### Core Features
- ✅ Blog listing page with pagination (12 posts per page)
- ✅ Dynamic article pages with rich media support
- ✅ Category filtering with visual feedback
- ✅ Search functionality with debouncing (300ms)
- ✅ Featured posts section
- ✅ Related posts recommendations
- ✅ Author profiles with bio and social links
- ✅ Share buttons (Twitter, Facebook, LinkedIn, Copy Link)
- ✅ Table of contents for articles
- ✅ Reading time estimates
- ✅ Tags and categories

### Performance Features
- ✅ Next.js Image optimization (WebP, AVIF)
- ✅ Priority loading for LCP images
- ✅ Skeleton loaders for CLS prevention
- ✅ Incremental Static Regeneration (ISR) - 1 hour
- ✅ Debounced search (300ms)
- ✅ GPU-accelerated animations
- ✅ Code splitting with dynamic imports
- ✅ Lazy loading for below-fold content
- ✅ **Target:** PageSpeed 90+ (desktop & mobile)
- ✅ **Target:** LCP < 2.5s, FID < 100ms, CLS < 0.1

### SEO Features
- ✅ Complete metadata (title, description, keywords)
- ✅ Open Graph tags (all pages)
- ✅ Twitter Cards (all pages)
- ✅ JSON-LD structured data (Article, Breadcrumb)
- ✅ Canonical URLs
- ✅ Author attribution
- ✅ Semantic HTML with proper heading hierarchy
- ✅ Mobile-friendly and responsive
- ✅ Breadcrumb navigation

---

## File Structure

```
app/blog/
├── page.tsx                          # Blog listing page
├── blog.module.css                   # Listing page styles
├── [slug]/
│   ├── page.tsx                      # Article detail page
│   └── article.module.css            # Article styles
└── README.md                         # This file

components/Blog/
├── BlogCard.tsx                      # Blog post card
├── BlogCard.module.css
├── CategoryFilter.tsx                # Filter & search
├── CategoryFilter.module.css
├── ArticleContent.tsx                # Article renderer
├── ArticleContent.module.css
├── RelatedPosts.tsx                  # Related posts
├── RelatedPosts.module.css
├── Pagination.tsx                    # Pagination
├── Pagination.module.css
└── index.ts                          # Component exports

lib/
├── types/blog.ts                     # TypeScript types
└── hooks/useBlog.ts                  # Custom hooks
```

---

## Usage

### Blog Listing Page

**URL:** `/blog`

**Query Parameters:**
- `page` - Page number (default: 1)
- `category` - Category slug filter
- `tag` - Tag slug filter
- `search` - Search query

**Examples:**
```
/blog
/blog?page=2
/blog?category=4wd-guides
/blog?tag=adventure&page=1
/blog?search=rainbow%20beach
```

---

### Article Detail Page

**URL:** `/blog/[slug]`

**Examples:**
```
/blog/best-4wd-tracks-sunshine-coast
/blog/rainbow-beach-camping-guide
```

---

## Components

### 1. BlogCard

Display blog post preview card.

```tsx
import { BlogCard, BlogCardSkeleton } from '@/components/Blog';

// Regular card
<BlogCard post={post} />

// Featured card (larger)
<BlogCard post={post} featured />

// Priority loading (LCP optimization)
<BlogCard post={post} priority />

// Skeleton loader
<BlogCardSkeleton />
```

---

### 2. CategoryFilter

Search and filter interface.

```tsx
import { CategoryFilter } from '@/components/Blog';

<CategoryFilter />
```

Features:
- Search input with debouncing (300ms)
- Category buttons
- Active filter indicators
- Clear all button

---

### 3. ArticleContent

Render article content with rich media.

```tsx
import { ArticleContent, ShareButtons, TableOfContents } from '@/components/Blog';

// Article content
<ArticleContent content={post.content} />

// Share buttons
<ShareButtons title={post.title} url={articleUrl} />

// Table of contents
<TableOfContents content={post.content} />
```

---

### 4. RelatedPosts

Display related articles.

```tsx
import { RelatedPosts } from '@/components/Blog';

<RelatedPosts postId={post.id} limit={3} />
```

---

### 5. Pagination

Page navigation.

```tsx
import { Pagination } from '@/components/Blog';

<Pagination currentPage={1} totalPages={5} />
```

---

## Custom Hooks

### useBlogPosts

Fetch blog posts with filtering and pagination.

```tsx
import { useBlogPosts } from '@/lib/hooks/useBlog';

const { posts, meta, isLoading, error, refetch } = useBlogPosts({
  page: 1,
  per_page: 12,
  category: 'guides',
  search: 'adventure'
});
```

---

### useBlogPost

Fetch single blog post.

```tsx
import { useBlogPost } from '@/lib/hooks/useBlog';

const { post, isLoading, error } = useBlogPost('article-slug');
```

---

### useRelatedPosts

Fetch related posts.

```tsx
import { useRelatedPosts } from '@/lib/hooks/useBlog';

const { posts, isLoading, error } = useRelatedPosts('post-id', 3);
```

---

### useCategories

Fetch all categories.

```tsx
import { useCategories } from '@/lib/hooks/useBlog';

const { categories, isLoading, error } = useCategories();
```

---

### useDebounce

Debounce value changes (for search).

```tsx
import { useDebounce } from '@/lib/hooks/useBlog';

const [search, setSearch] = useState('');
const debouncedSearch = useDebounce(search, 300);
```

---

## API Integration

See `/memory/swarm/blog-module/api-routes.md` for complete API documentation.

### Required Endpoints

1. `GET /api/blog/posts` - List posts with filtering
2. `GET /api/blog/posts/:slug` - Get single post
3. `GET /api/blog/posts/:id/related` - Get related posts
4. `GET /api/blog/categories` - List categories
5. `GET /api/blog/tags` - List tags

---

## TypeScript Types

```typescript
// Post
interface BlogPost {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  featured_image: string;
  featured_image_alt: string;
  author: Author;
  category: Category;
  tags: Tag[];
  published_at: string;
  updated_at: string;
  reading_time: number;
  seo: SEOMetadata;
  featured: boolean;
}

// Author
interface Author {
  id: string;
  name: string;
  avatar?: string;
  bio?: string;
  social?: {
    twitter?: string;
    linkedin?: string;
    website?: string;
  };
}

// Category
interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  color?: string;
}

// Tag
interface Tag {
  id: string;
  name: string;
  slug: string;
}
```

---

## Performance Optimization

### Image Optimization (MANDATORY)

```tsx
// Priority for LCP images
<Image src={post.featured_image} priority quality={85} />

// Responsive sizing
sizes="(max-width: 768px) 100vw, 600px"

// Lazy loading (default)
<Image src={post.image} loading="lazy" />
```

---

### Code Splitting

```tsx
// Dynamic imports for heavy components
const HeavyComponent = dynamic(() => import('./HeavyComponent'), {
  loading: () => <Skeleton />,
  ssr: false
});
```

---

### Caching Strategy

```tsx
// ISR with 1-hour revalidation
export const revalidate = 3600;

// API caching
fetch(url, {
  next: { revalidate: 3600 }
});
```

---

## SEO Best Practices

### Metadata

```tsx
export async function generateMetadata({ params }): Promise<Metadata> {
  return {
    title: post.seo.meta_title,
    description: post.seo.meta_description,
    keywords: post.tags.map(t => t.name),
    openGraph: {
      title: post.seo.og_title,
      description: post.seo.og_description,
      images: [post.seo.og_image],
      type: 'article'
    },
    twitter: {
      card: 'summary_large_image',
      title: post.seo.twitter_title,
      description: post.seo.twitter_description
    }
  };
}
```

---

### Structured Data

```tsx
const articleSchema = {
  '@context': 'https://schema.org',
  '@type': 'BlogPosting',
  headline: post.title,
  image: post.featured_image,
  datePublished: post.published_at,
  author: {
    '@type': 'Person',
    name: post.author.name
  }
};
```

---

## Responsive Design

### Breakpoints

```css
/* Mobile: < 768px */
@media (max-width: 768px) { }

/* Tablet: 769px - 1024px */
@media (min-width: 769px) and (max-width: 1024px) { }

/* Desktop: > 1025px */
@media (min-width: 1025px) { }
```

---

## Testing

### Run Tests

```bash
# Unit tests
npm run test:unit -- components/Blog

# Integration tests
npm run test:integration -- app/blog

# Performance tests
npm run lighthouse -- /blog
npm run lighthouse -- /blog/test-article

# Accessibility tests
npm run test:a11y -- /blog
```

---

## Deployment Checklist

Before deploying to production:

- [ ] Run Lighthouse (target: 90+)
- [ ] Check Core Web Vitals (LCP < 2.5s, CLS < 0.1)
- [ ] Verify all images are optimized
- [ ] Test pagination
- [ ] Test search and filters
- [ ] Verify SEO metadata
- [ ] Check structured data (Google Rich Results Test)
- [ ] Test mobile responsiveness
- [ ] Verify API integration
- [ ] Check error states
- [ ] Test 404 pages
- [ ] Verify ISR revalidation
- [ ] Monitor bundle size

---

## Troubleshooting

### Images not loading
- Check image domains in `next.config.js`
- Verify image paths are correct
- Check CDN configuration

### Slow page load
- Run Lighthouse audit
- Check bundle size
- Verify ISR is working
- Check API response times

### Search not working
- Verify debounce is applied
- Check API endpoint
- Test search query encoding

### Filters not applying
- Check URL query parameters
- Verify router.push is working
- Test category/tag slugs

---

## Support

For issues or questions:
1. Check `/memory/swarm/blog-module/frontend.md`
2. Review API documentation in `/memory/swarm/blog-module/api-routes.md`
3. Review performance guidelines in `/docs/performance/`

---

## Credits

Built by Frontend Development Agent for Sunshine Coast 4WD Tours.

**Last Updated:** 2025-11-07
