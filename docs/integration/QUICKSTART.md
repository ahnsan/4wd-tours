# Blog-Product Integration Quick Start

## 1. Generate Database Migration

```bash
npx medusa db:generate blog
```

This creates migration files in `.medusa/migrations/` directory.

## 2. Run Migration

```bash
npx medusa db:migrate
```

This creates the `post` table with all fields including `product_ids`.

## 3. Start Development Server

```bash
npm run dev
```

The Medusa backend will be available at http://localhost:9000

## 4. Create Your First Blog Post

### Using Admin API:

```bash
curl -X POST http://localhost:9000/admin/posts \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Amazing Fraser Island Adventures",
    "slug": "fraser-island-adventures",
    "content": "<h2>Discover Fraser Island</h2><p>Experience the worlds largest sand island...</p>",
    "excerpt": "Your guide to unforgettable Fraser Island tours",
    "author": "Med USA 4WD Team",
    "product_ids": [],
    "is_published": true
  }'
```

## 5. Link Products to Post

First, get product IDs from your Medusa store:

```bash
curl http://localhost:9000/store/products
```

Then link products to your post:

```bash
curl -X POST http://localhost:9000/admin/posts/POST_ID/products \
  -H "Content-Type: application/json" \
  -d '{
    "product_ids": ["prod_123", "prod_456"],
    "action": "set"
  }'
```

## 6. View Posts with Products

```bash
curl http://localhost:9000/store/posts
```

## 7. Frontend Integration

Create a blog page in your Next.js storefront:

```tsx
// storefront/app/blog/page.tsx
import { LinkedProducts } from '@/components/Blog/LinkedProducts'

export default async function BlogPage() {
  const response = await fetch('http://localhost:9000/store/posts')
  const { posts } = await response.json()
  
  return (
    <div>
      {posts.map(post => (
        <article key={post.id}>
          <h2>{post.title}</h2>
          <p>{post.excerpt}</p>
          <LinkedProducts products={post.linked_products} />
        </article>
      ))}
    </div>
  )
}
```

## File Structure

```
src/
├── modules/
│   └── blog/
│       ├── models/
│       │   └── post.ts           # Post model with product_ids
│       ├── service.ts             # Blog service with linking methods
│       └── index.ts               # Module export
├── api/
│   ├── store/
│   │   └── posts/
│   │       ├── route.ts           # List posts (public)
│   │       └── [slug]/route.ts    # Get post by slug (public)
│   └── admin/
│       └── posts/
│           ├── route.ts           # CRUD operations (admin)
│           ├── [id]/route.ts      # Single post operations
│           └── [id]/products/route.ts  # Product linking
└── admin/
    └── widgets/
        └── blog-post-products.tsx # Admin UI for product selection

storefront/
└── components/
    └── Blog/
        ├── LinkedProducts.tsx     # Product cards component
        └── BlogPost.tsx          # Complete blog post display

docs/
└── integration/
    ├── blog-product-linking.md   # Full documentation
    ├── hooks-coordination.md     # Swarm coordination
    └── QUICKSTART.md            # This file
```

## Next Steps

1. Customize LinkedProducts component styling
2. Add blog post list page to storefront
3. Add blog post detail page to storefront
4. Implement admin UI for blog management
5. Add SEO metadata to posts
6. Implement blog search functionality
7. Add blog categories and tags filtering

## Troubleshooting

### Migration fails

```bash
# Check database connection
npx medusa db:migrate --force
```

### Products not showing

Verify:
1. Product IDs are correct
2. Products are published
3. API route is fetching products correctly

### Admin widget not visible

1. Rebuild admin: `npm run build`
2. Clear browser cache
3. Check admin SDK version compatibility

## Support

See full documentation in `/docs/integration/blog-product-linking.md`
