# Blog API Quick Reference

## Endpoints

### Admin API

```bash
# List posts
GET /admin/blog/posts?limit=20&offset=0&is_published=true&category=tutorials&q=search

# Get single post
GET /admin/blog/posts/:id

# Create post
POST /admin/blog/posts
{
  "title": "Post Title",
  "slug": "post-title",
  "content": "Content here...",
  "author": "John Doe",
  "is_published": false
}

# Update post
PUT /admin/blog/posts/:id
{
  "title": "Updated Title",
  "is_published": true
}

# Delete post
DELETE /admin/blog/posts/:id
```

### Store API

```bash
# List published posts
GET /store/blog/posts?limit=20&offset=0&category=tutorials&tag=medusa&product_id=prod_01

# Get post by slug
GET /store/blog/posts/:slug
```

## Service Usage

```typescript
import { BLOG_MODULE } from "../modules/blog"
import BlogModuleService from "../modules/blog/service"

// In any API route or workflow
const blogService: BlogModuleService = req.scope.resolve(BLOG_MODULE)

// List posts
const [posts, count] = await blogService.listAndCountPosts(
  { is_published: true },
  { skip: 0, take: 20 }
)

// Get by ID
const post = await blogService.retrievePost(postId)

// Get by slug
const post = await blogService.getPostBySlug("my-post")

// Create
const post = await blogService.createPosts({ ...data })

// Update
const post = await blogService.updatePosts(postId, { ...updates })

// Delete
await blogService.deletePosts(postId)

// Get posts by product
const posts = await blogService.getPostsByProductId(productId)
```

## Next Steps

1. **Database Setup**:
   ```bash
   npx medusa db:generate blog
   npx medusa db:migrate
   ```

2. **Start Development Server**:
   ```bash
   npm run dev
   ```

3. **Test Endpoints**:
   ```bash
   # Test store endpoint
   curl http://localhost:9000/store/blog/posts

   # Test admin endpoint (requires auth)
   curl http://localhost:9000/admin/blog/posts \
     -H "Authorization: Bearer <token>"
   ```

4. **Integration**:
   - Build admin UI with Medusa Admin SDK
   - Create storefront components
   - Add rich text editor
   - Implement image uploads
   - Create RSS feed
   - Add sitemap generation

## File Locations

```
/Users/Karim/med-usa-4wd/
├── src/
│   ├── modules/blog/
│   │   ├── models/post.ts
│   │   ├── service.ts
│   │   └── index.ts
│   └── api/
│       ├── admin/blog/
│       │   ├── posts/
│       │   │   ├── route.ts (GET, POST)
│       │   │   └── [id]/route.ts (GET, PUT, DELETE)
│       │   └── validators.ts
│       ├── store/blog/
│       │   └── posts/
│       │       ├── route.ts (GET)
│       │       └── [slug]/route.ts (GET)
│       ├── middlewares.ts
│       └── blog/README.md
└── medusa-config.ts (module registered)
```

## Common Tasks

### Create a Blog Post

```bash
curl -X POST http://localhost:9000/admin/blog/posts \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Getting Started with Medusa",
    "slug": "getting-started-with-medusa",
    "content": "Medusa is a powerful ecommerce platform...",
    "excerpt": "Learn how to get started with Medusa",
    "author": "John Doe",
    "category": "tutorials",
    "tags": ["medusa", "ecommerce", "tutorial"],
    "product_ids": ["prod_01...", "prod_02..."],
    "is_published": true
  }'
```

### Link Post to Products

```bash
curl -X PUT http://localhost:9000/admin/blog/posts/post_01... \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "product_ids": ["prod_01...", "prod_02...", "prod_03..."]
  }'
```

### Get Posts for a Product

```bash
curl http://localhost:9000/store/blog/posts?product_id=prod_01...
```

### Search Posts

```bash
curl http://localhost:9000/store/blog/posts?q=medusa
```

### Filter by Category

```bash
curl http://localhost:9000/store/blog/posts?category=tutorials
```

## Validation Rules

- **title**: Required, max 255 characters
- **slug**: Required, max 255, lowercase alphanumeric with hyphens
- **content**: Required
- **author**: Required
- **excerpt**: Optional
- **featured_image**: Optional
- **product_ids**: Optional array of product IDs
- **category**: Optional
- **tags**: Optional array of strings
- **is_published**: Boolean, default false

## Error Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request (validation error)
- `404` - Not Found
- `409` - Conflict (duplicate slug)
- `500` - Internal Server Error
