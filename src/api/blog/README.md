# Blog API Routes

Complete API documentation for the Medusa Blog Module.

## Overview

The Blog API provides endpoints for managing blog posts with product linking capabilities. It includes both admin and store (public) routes following Medusa's official patterns.

## Base URLs

- **Admin API**: `/admin/blog`
- **Store API**: `/store/blog`

## Data Model

### BlogPost

```typescript
{
  id: string                    // Primary key
  title: string                 // Post title
  slug: string                  // URL-friendly slug (unique)
  content: string               // Full post content
  excerpt?: string              // Short excerpt
  author: string                // Author name
  featured_image?: string       // Featured image URL
  product_ids?: string[]        // Array of linked product IDs
  category?: string             // Post category
  tags?: string[]               // Array of tags
  is_published: boolean         // Published status
  published_at?: Date           // Publication date
  created_at: Date              // Creation timestamp
  updated_at: Date              // Last update timestamp
}
```

---

## Admin API Routes

All admin routes require authentication (handled automatically by Medusa).

### 1. List All Posts

**Endpoint**: `GET /admin/blog/posts`

**Description**: Retrieve a paginated list of all blog posts with filtering.

**Query Parameters**:
- `limit` (number, default: 20) - Number of posts per page (max: 100)
- `offset` (number, default: 0) - Offset for pagination
- `is_published` (boolean) - Filter by published status
- `category` (string) - Filter by category
- `q` (string) - Search query (searches title, content, author, excerpt)

**Response**:
```json
{
  "posts": [
    {
      "id": "post_01...",
      "title": "Sample Post",
      "slug": "sample-post",
      "content": "Full content...",
      "excerpt": "Short excerpt...",
      "author": "John Doe",
      "featured_image": "https://...",
      "product_ids": ["prod_01...", "prod_02..."],
      "category": "tutorials",
      "tags": ["medusa", "ecommerce"],
      "is_published": true,
      "published_at": "2025-01-01T00:00:00.000Z",
      "created_at": "2025-01-01T00:00:00.000Z",
      "updated_at": "2025-01-01T00:00:00.000Z"
    }
  ],
  "count": 42,
  "limit": 20,
  "offset": 0
}
```

**Example**:
```bash
curl -X GET "http://localhost:9000/admin/blog/posts?limit=10&is_published=true" \
  -H "Authorization: Bearer <admin_token>"
```

---

### 2. Get Single Post

**Endpoint**: `GET /admin/blog/posts/:id`

**Description**: Retrieve a single blog post by ID.

**Path Parameters**:
- `id` (string, required) - Post ID

**Response**:
```json
{
  "post": {
    "id": "post_01...",
    "title": "Sample Post",
    "slug": "sample-post",
    // ... all post fields
  }
}
```

**Error Responses**:
- `404` - Post not found
- `500` - Server error

**Example**:
```bash
curl -X GET "http://localhost:9000/admin/blog/posts/post_01..." \
  -H "Authorization: Bearer <admin_token>"
```

---

### 3. Create Post

**Endpoint**: `POST /admin/blog/posts`

**Description**: Create a new blog post.

**Request Body**:
```json
{
  "title": "New Post Title",
  "slug": "new-post-title",
  "content": "Full post content goes here...",
  "excerpt": "Short excerpt...",
  "author": "John Doe",
  "featured_image": "https://example.com/image.jpg",
  "product_ids": ["prod_01...", "prod_02..."],
  "category": "tutorials",
  "tags": ["medusa", "ecommerce"],
  "is_published": false
}
```

**Required Fields**:
- `title` (string, max 255)
- `slug` (string, max 255, lowercase alphanumeric with hyphens)
- `content` (string)
- `author` (string)

**Optional Fields**:
- `excerpt` (string)
- `featured_image` (string)
- `product_ids` (string[])
- `category` (string)
- `tags` (string[])
- `is_published` (boolean, default: false)

**Response**:
```json
{
  "post": {
    "id": "post_01...",
    "title": "New Post Title",
    // ... all post fields
  }
}
```

**Error Responses**:
- `400` - Missing required fields or validation error
- `409` - Slug already exists
- `500` - Server error

**Example**:
```bash
curl -X POST "http://localhost:9000/admin/blog/posts" \
  -H "Authorization: Bearer <admin_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "My First Post",
    "slug": "my-first-post",
    "content": "This is the content...",
    "author": "John Doe",
    "is_published": false
  }'
```

---

### 4. Update Post

**Endpoint**: `PUT /admin/blog/posts/:id`

**Description**: Update an existing blog post.

**Path Parameters**:
- `id` (string, required) - Post ID

**Request Body**: Same as create, but all fields are optional.

**Special Behavior**:
- When `is_published` changes from `false` to `true`, `published_at` is automatically set
- When `is_published` changes from `true` to `false`, `published_at` is cleared

**Response**:
```json
{
  "post": {
    "id": "post_01...",
    // ... updated post fields
  }
}
```

**Error Responses**:
- `404` - Post not found
- `409` - Slug already exists (when changing slug)
- `500` - Server error

**Example**:
```bash
curl -X PUT "http://localhost:9000/admin/blog/posts/post_01..." \
  -H "Authorization: Bearer <admin_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Updated Title",
    "is_published": true
  }'
```

---

### 5. Delete Post

**Endpoint**: `DELETE /admin/blog/posts/:id`

**Description**: Delete a blog post permanently.

**Path Parameters**:
- `id` (string, required) - Post ID

**Response**:
```json
{
  "id": "post_01...",
  "deleted": true
}
```

**Error Responses**:
- `404` - Post not found
- `500` - Server error

**Example**:
```bash
curl -X DELETE "http://localhost:9000/admin/blog/posts/post_01..." \
  -H "Authorization: Bearer <admin_token>"
```

---

## Store API Routes

Public routes for storefront integration. No authentication required.

### 6. List Published Posts

**Endpoint**: `GET /store/blog/posts`

**Description**: Retrieve a paginated list of published blog posts.

**Query Parameters**:
- `limit` (number, default: 20) - Number of posts per page (max: 100)
- `offset` (number, default: 0) - Offset for pagination
- `q` (string) - Search query
- `category` (string) - Filter by category
- `tag` (string) - Filter by tag
- `product_id` (string) - Filter posts linked to a specific product

**Response**: Same format as admin list, but only includes published posts.

**Special Features**:
- Only returns posts where `is_published = true`
- Posts are ordered by `published_at DESC`
- Product linking support via `product_id` filter

**Example**:
```bash
# List all published posts
curl -X GET "http://localhost:9000/store/blog/posts?limit=10"

# Search posts
curl -X GET "http://localhost:9000/store/blog/posts?q=medusa"

# Filter by category
curl -X GET "http://localhost:9000/store/blog/posts?category=tutorials"

# Get posts for a specific product
curl -X GET "http://localhost:9000/store/blog/posts?product_id=prod_01..."
```

---

### 7. Get Post by Slug

**Endpoint**: `GET /store/blog/posts/:slug`

**Description**: Retrieve a single published post by its slug.

**Path Parameters**:
- `slug` (string, required) - Post slug

**Response**:
```json
{
  "post": {
    "id": "post_01...",
    "title": "Sample Post",
    "slug": "sample-post",
    // ... all post fields
  }
}
```

**Special Features**:
- Only returns published posts
- Returns 404 if post is not published or doesn't exist

**Error Responses**:
- `404` - Post not found or not published
- `500` - Server error

**Example**:
```bash
curl -X GET "http://localhost:9000/store/blog/posts/my-first-post"
```

---

## Middleware

Custom middleware is applied to all blog routes:

### Admin Routes (`/admin/blog/*`)
- Request logging
- Admin authentication (Medusa built-in)

### Store Routes (`/store/blog/*`)
- Request logging
- CORS headers for public access

---

## Product Linking

Posts can be linked to products using the `product_ids` field. This enables:

1. **Content-Driven Commerce**: Associate blog posts with products
2. **Product Discovery**: Show related posts on product pages
3. **SEO Benefits**: Create content around products

### Examples:

**Create post with product links**:
```json
{
  "title": "Best 4WD Accessories",
  "slug": "best-4wd-accessories",
  "content": "...",
  "author": "John Doe",
  "product_ids": ["prod_01...", "prod_02..."]
}
```

**Get posts for a product**:
```bash
curl -X GET "http://localhost:9000/store/blog/posts?product_id=prod_01..."
```

---

## Error Handling

All endpoints follow consistent error response format:

```json
{
  "message": "Error description",
  "error": "Detailed error message (in development)"
}
```

**Common Status Codes**:
- `200` - Success
- `201` - Created
- `400` - Bad Request (validation error)
- `404` - Not Found
- `409` - Conflict (duplicate slug)
- `500` - Internal Server Error

---

## Validation

Request validation is handled using Zod schemas:

- **Title**: Required, max 255 characters
- **Slug**: Required, max 255, lowercase alphanumeric with hyphens only
- **Content**: Required
- **Author**: Required
- **Excerpt**: Optional
- **Featured Image**: Optional
- **Product IDs**: Optional array of strings
- **Category**: Optional string
- **Tags**: Optional array of strings
- **Is Published**: Boolean, default false

---

## Integration Examples

### Next.js Storefront

```typescript
// Fetch blog posts
async function getBlogPosts(limit = 10, offset = 0) {
  const res = await fetch(
    `http://localhost:9000/store/blog/posts?limit=${limit}&offset=${offset}`
  )
  return res.json()
}

// Get single post
async function getBlogPost(slug: string) {
  const res = await fetch(`http://localhost:9000/store/blog/posts/${slug}`)
  return res.json()
}

// Get posts for a product
async function getProductBlogPosts(productId: string) {
  const res = await fetch(
    `http://localhost:9000/store/blog/posts?product_id=${productId}`
  )
  return res.json()
}
```

### Admin Dashboard

```typescript
// Create post
async function createPost(data: CreatePostData) {
  const res = await fetch('http://localhost:9000/admin/blog/posts', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${adminToken}`
    },
    body: JSON.stringify(data)
  })
  return res.json()
}

// Update post
async function updatePost(id: string, data: UpdatePostData) {
  const res = await fetch(`http://localhost:9000/admin/blog/posts/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${adminToken}`
    },
    body: JSON.stringify(data)
  })
  return res.json()
}
```

---

## Database Setup

After creating the blog module, run migrations:

```bash
# Generate migrations
npx medusa db:generate blog

# Run migrations
npx medusa db:migrate
```

---

## Module Configuration

The blog module is registered in `medusa-config.ts`:

```typescript
module.exports = defineConfig({
  projectConfig: {
    // ... project config
  },
  modules: [
    {
      resolve: "./src/modules/blog",
    },
  ],
})
```

---

## Best Practices

1. **Slugs**: Always use lowercase, URL-friendly slugs
2. **SEO**: Populate excerpt for better search engine visibility
3. **Images**: Use optimized images for featured_image
4. **Content**: Write meaningful content (avoid thin content)
5. **Categories**: Use consistent category names
6. **Tags**: Keep tags relevant and consistent
7. **Publishing**: Review posts before setting is_published = true
8. **Product Links**: Only link relevant products to maintain quality

---

## Support

For issues or questions, refer to:
- [Medusa Documentation](https://docs.medusajs.com)
- [Medusa Modules Guide](https://docs.medusajs.com/learn/fundamentals/modules)
- [Medusa API Routes](https://docs.medusajs.com/learn/fundamentals/api-routes)
