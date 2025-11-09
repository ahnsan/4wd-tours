# Blog-Product Linking Integration

This document describes the Product-Blog linking integration for the Med USA 4WD platform.

## Overview

The blog module allows linking tours/products to blog posts, enabling content marketing and improved product discoverability.

## Architecture

### 1. Backend Module (src/modules/blog)

**Post Model** (`models/post.ts`):
- `id` - Primary key
- `title` - Post title
- `slug` - URL-friendly identifier (unique)
- `content` - Post content (HTML)
- `excerpt` - Short description
- `author` - Author name
- `featured_image` - Main image URL
- `product_ids` - **JSON array of linked product IDs**
- `category` - Post category
- `tags` - JSON array of tags
- `is_published` - Publication status
- `published_at` - Publication date
- `created_at` - Creation timestamp
- `updated_at` - Update timestamp

**Blog Service** (`service.ts`):
- `listPublishedPosts()` - Get all published posts
- `getPostBySlug(slug)` - Get post by slug
- `getPostsByProductId(productId)` - Find posts featuring a product
- `linkProductsToPost(postId, productIds)` - Set product links (replace)
- `addProductsToPost(postId, productIds)` - Add products (append)
- `removeProductsFromPost(postId, productIds)` - Remove products

### 2. API Routes

**Store API** (Public):
- `GET /store/posts` - List published posts with product data
- `GET /store/posts/:slug` - Get single post with full product details and pricing

**Admin API** (Protected):
- `GET /admin/posts` - List all posts
- `POST /admin/posts` - Create new post
- `GET /admin/posts/:id` - Get post by ID
- `POST /admin/posts/:id` - Update post
- `DELETE /admin/posts/:id` - Delete post
- `POST /admin/posts/:id/products` - Manage product links

### 3. Frontend Components

**LinkedProducts** (`storefront/components/Blog/LinkedProducts.tsx`):
- Displays related tours in blog articles
- Product cards with images, prices, and CTAs
- "Book Now" buttons linking to tour pages
- Responsive grid layout (1/2/3 columns)
- Image optimization with Next.js Image
- Price formatting with Intl API

**BlogPost** (`storefront/components/Blog/BlogPost.tsx`):
- Complete blog post display
- Featured image support
- Author and date metadata
- Category and tags
- Integrated LinkedProducts component
- SEO-friendly markup

### 4. Admin UI

**BlogPostProductSelector** (`src/admin/widgets/blog-post-products.tsx`):
- Admin widget for product selection
- Checkbox list of available products
- Product thumbnails and descriptions
- Real-time save functionality
- Displays selected product count

## Setup Instructions

### 1. Module Registration

The blog module is already registered in `medusa-config.ts`:

```typescript
modules: [
  {
    resolve: "./src/modules/blog",
  },
]
```

### 2. Generate Migrations

```bash
npx medusa db:generate blog
```

This creates migration files for the Post model.

### 3. Run Migrations

```bash
npx medusa db:migrate
```

This creates the `post` table in the database.

### 4. Restart Medusa

```bash
npm run dev
```

## API Usage Examples

### Create a Blog Post with Product Links

```bash
POST /admin/posts
Content-Type: application/json

{
  "title": "Top 5 Fraser Island Tours",
  "slug": "top-5-fraser-island-tours",
  "content": "<p>Discover the best Fraser Island adventures...</p>",
  "excerpt": "Your guide to the best Fraser Island tours",
  "author": "Med USA 4WD Team",
  "featured_image": "https://example.com/fraser.jpg",
  "product_ids": ["prod_123", "prod_456", "prod_789"],
  "category": "Tours",
  "tags": ["Fraser Island", "Adventure", "4WD"],
  "is_published": true,
  "published_at": "2025-11-07T00:00:00Z"
}
```

### Get Published Posts with Products

```bash
GET /store/posts

Response:
{
  "posts": [
    {
      "id": "post_123",
      "title": "Top 5 Fraser Island Tours",
      "slug": "top-5-fraser-island-tours",
      "excerpt": "Your guide to the best Fraser Island tours",
      "author": "Med USA 4WD Team",
      "product_ids": ["prod_123", "prod_456"],
      "linked_products": [
        {
          "id": "prod_123",
          "title": "Fraser Island 2-Day Tour",
          "handle": "fraser-island-2-day",
          "thumbnail": "https://...",
          "variants": [...]
        }
      ]
    }
  ]
}
```

### Link Products to Existing Post

```bash
POST /admin/posts/post_123/products
Content-Type: application/json

{
  "product_ids": ["prod_123", "prod_456"],
  "action": "set"  // or "add" or "remove"
}
```

## Frontend Integration

### Using LinkedProducts Component

```tsx
import LinkedProducts from '@/components/Blog/LinkedProducts'

function BlogArticle({ post }) {
  return (
    <article>
      <h1>{post.title}</h1>
      <div dangerouslySetInnerHTML={{ __html: post.content }} />
      
      {/* Display linked products */}
      <LinkedProducts 
        products={post.linked_products}
        title="Featured Tours in This Article"
      />
    </article>
  )
}
```

### Using BlogPost Component

```tsx
import BlogPost from '@/components/Blog/BlogPost'

export default async function PostPage({ params }) {
  const response = await fetch(`/store/posts/${params.slug}`)
  const { post } = await response.json()
  
  return <BlogPost post={post} />
}
```

## Benefits

1. **Content Marketing**: Create SEO-friendly content that drives product sales
2. **Product Discovery**: Help customers find relevant tours through blog articles
3. **Cross-Selling**: Feature multiple related tours in single articles
4. **Flexible Linking**: Easily add, remove, or update product associations
5. **Rich Display**: Show product cards with images, prices, and CTAs
6. **Admin Efficiency**: Simple checkbox interface for product selection

## Performance Considerations

- Product data is fetched efficiently using Medusa's services
- Images are optimized using Next.js Image component
- Prices are cached and formatted client-side
- Lazy loading can be added for below-fold content

## SEO Features

- Semantic HTML structure
- Meta tags support (add via BlogPost props)
- Structured data ready (can add Product schema)
- Fast loading with optimized images
- Mobile-responsive design

## Future Enhancements

- [ ] Add product review snippets
- [ ] Implement blog post search
- [ ] Add related posts based on products
- [ ] Create blog post categories page
- [ ] Add social sharing buttons
- [ ] Implement comments system
- [ ] Add blog post analytics
- [ ] Create email newsletter integration

## Troubleshooting

### Products not showing in posts

1. Check that product IDs are valid
2. Verify products are published
3. Check network requests in browser console
4. Verify productModuleService is available

### Admin widget not appearing

1. Ensure admin SDK is properly installed
2. Check widget zone configuration
3. Verify admin build process
4. Check browser console for errors

### Migration errors

1. Ensure database is running
2. Check database connection string
3. Verify no conflicting migrations
4. Try `npx medusa db:migrate --force` (caution: development only)

## Support

For issues or questions:
- Check Medusa documentation: https://docs.medusajs.com
- Review module README: src/modules/README.md
- Contact development team
