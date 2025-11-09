# Blog Module Quick Reference

## File Locations

```
/Users/Karim/med-usa-4wd/src/modules/blog/
├── models/
│   ├── post.ts          # Post data model
│   └── category.ts      # Category data model
├── service.ts           # BlogModuleService
└── index.ts            # Module export
```

## Quick Start

### 1. Run Migrations
```bash
cd /Users/Karim/med-usa-4wd
npx medusa db:generate blog
npx medusa db:migrate
```

### 2. Use in API Route
```typescript
import { BLOG_MODULE } from "../../../modules/blog"
import BlogModuleService from "../../../modules/blog/service"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const blogService: BlogModuleService = req.scope.resolve(BLOG_MODULE)
  const posts = await blogService.listPublishedPosts()
  res.json({ posts })
}
```

## Service Methods Cheat Sheet

### Auto-Generated CRUD Methods

**Posts:**
```typescript
await service.listPosts(filters, config)
await service.retrievePost(id, config)
await service.createPosts(data)
await service.updatePosts(id, data)
await service.deletePosts(id)
```

**Categories:**
```typescript
await service.listCategories(filters, config)
await service.retrieveCategory(id, config)
await service.createCategories(data)
await service.updateCategories(id, data)
await service.deleteCategories(id)
```

### Custom Methods

**Post Queries:**
```typescript
await service.listPublishedPosts()
await service.getPostBySlug(slug)
await service.getPostsByCategory(categoryId, publishedOnly)
await service.getPostsByAuthor(authorId, publishedOnly)
```

**Publishing:**
```typescript
await service.publishPost(postId)
await service.unpublishPost(postId)
```

**Product Integration:**
```typescript
await service.getPostsByProductId(productId)
await service.linkProductsToPost(postId, [productIds])
await service.addProductsToPost(postId, [productIds])
await service.removeProductsFromPost(postId, [productIds])
```

**Category Queries:**
```typescript
await service.getCategoryBySlug(slug)
```

## Post Schema

```typescript
{
  id: string,
  title: string,
  slug: string,
  content: string,
  excerpt?: string,
  featured_image?: string,
  seo_title?: string,
  seo_description?: string,
  published_at?: Date,
  author_id?: string,
  category_id?: string,
  product_ids?: string[],
  tags?: string[],
  is_published: boolean,
  created_at: Date,
  updated_at: Date
}
```

## Category Schema

```typescript
{
  id: string,
  name: string,
  slug: string,
  description?: string
}
```

## Example Usage Patterns

### Create a Post
```typescript
const post = await blogService.createPosts({
  title: "My First Post",
  slug: "my-first-post",
  content: "Full content here...",
  excerpt: "Short summary",
  author_id: "user_123",
  category_id: "cat_123",
  is_published: false
})
```

### Publish a Post
```typescript
await blogService.publishPost(post.id)
```

### Link Products to Post
```typescript
await blogService.linkProductsToPost(post.id, [
  "prod_123",
  "prod_456"
])
```

### Get Published Posts by Category
```typescript
const posts = await blogService.getPostsByCategory(
  "cat_123",
  true // publishedOnly
)
```

### Get Post by Slug (for Store)
```typescript
const post = await blogService.getPostBySlug("my-first-post")
```

## Status: ✅ Ready for Use

Run migrations and start building your API routes!
