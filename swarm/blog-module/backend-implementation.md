# Blog Module Backend Implementation

## Overview
Complete Medusa.js blog module implementation following official Medusa v2 patterns and best practices.

## Implementation Date
November 7, 2025

## Module Location
`/Users/Karim/med-usa-4wd/src/modules/blog/`

## File Structure
```
src/modules/blog/
├── models/
│   ├── post.ts          # Blog post data model
│   └── category.ts      # Category data model
├── service.ts           # BlogModuleService with CRUD operations
└── index.ts            # Module export configuration
```

## Data Models

### 1. Post Model (`models/post.ts`)

**Location:** `/Users/Karim/med-usa-4wd/src/modules/blog/models/post.ts`

**Fields:**
- `id` (primary key) - Unique identifier
- `title` (text) - Post title
- `slug` (text, unique) - URL-friendly identifier
- `content` (text) - Full post content
- `excerpt` (text, nullable) - Short summary
- `featured_image` (text, nullable) - Image URL
- `seo_title` (text, nullable) - SEO meta title
- `seo_description` (text, nullable) - SEO meta description
- `published_at` (dateTime, nullable) - Publication timestamp
- `author_id` (text, nullable) - Author identifier
- `category_id` (text, nullable) - Category foreign key
- `product_ids` (json, nullable) - Array of linked Medusa product IDs
- `tags` (json, nullable) - Array of tags
- `is_published` (boolean, default: false) - Publication status
- `created_at` (dateTime, auto) - Creation timestamp
- `updated_at` (dateTime, auto) - Last update timestamp

**Pattern Used:**
```typescript
import { model } from "@medusajs/framework/utils"

const Post = model.define("post", {
  id: model.id().primaryKey(),
  title: model.text(),
  slug: model.text().unique(),
  // ... additional fields
})

export default Post
```

### 2. Category Model (`models/category.ts`)

**Location:** `/Users/Karim/med-usa-4wd/src/modules/blog/models/category.ts`

**Fields:**
- `id` (primary key) - Unique identifier
- `name` (text) - Category name
- `slug` (text) - URL-friendly identifier
- `description` (text, nullable) - Category description

**Pattern Used:**
```typescript
import { model } from "@medusajs/framework/utils"

const Category = model.define("category", {
  id: model.id().primaryKey(),
  name: model.text(),
  slug: model.text(),
  description: model.text().nullable(),
})

export default Category
```

## Service Implementation

**Location:** `/Users/Karim/med-usa-4wd/src/modules/blog/service.ts`

### MedusaService Auto-Generated Methods

The service extends `MedusaService` which automatically generates CRUD methods:

#### Post Methods (Auto-generated):
- `listPosts(filters, config)` - List posts with filters
- `listAndCountPosts(filters, config)` - List posts with count
- `retrievePost(id, config)` - Get single post by ID
- `createPosts(data)` - Create new post(s)
- `updatePosts(id, data)` - Update post
- `deletePosts(id)` - Delete post

#### Category Methods (Auto-generated):
- `listCategories(filters, config)` - List categories
- `listAndCountCategories(filters, config)` - List with count
- `retrieveCategory(id, config)` - Get single category
- `createCategories(data)` - Create category
- `updateCategories(id, data)` - Update category
- `deleteCategories(id)` - Delete category

### Custom Methods Added

#### Post-Related Methods:
1. **`listPublishedPosts()`**
   - Returns all published posts ordered by publish date (DESC)
   - Filters: `is_published: true`

2. **`getPostBySlug(slug: string)`**
   - Retrieve post by URL slug
   - Returns single post or undefined

3. **`getPostsByCategory(categoryId: string, publishedOnly: boolean)`**
   - Get all posts in a specific category
   - Optional filter for published posts only

4. **`getPostsByAuthor(authorId: string, publishedOnly: boolean)`**
   - Get all posts by specific author
   - Optional filter for published posts only

5. **`publishPost(postId: string)`**
   - Set post as published with current timestamp
   - Updates: `is_published: true`, `published_at: new Date()`

6. **`unpublishPost(postId: string)`**
   - Set post as unpublished
   - Updates: `is_published: false`, `published_at: null`

#### Product Integration Methods:
7. **`getPostsByProductId(productId: string)`**
   - Find all posts that reference a specific Medusa product
   - Filters published posts containing the product ID

8. **`linkProductsToPost(postId: string, productIds: string[])`**
   - Replace post's product_ids with new array
   - Full replacement operation

9. **`addProductsToPost(postId: string, productIds: string[])`**
   - Append products to existing list
   - Maintains unique IDs (no duplicates)

10. **`removeProductsFromPost(postId: string, productIds: string[])`**
    - Remove specific products from post
    - Keeps other existing product links

#### Category Methods:
11. **`getCategoryBySlug(slug: string)`**
    - Retrieve category by URL slug
    - Returns single category or undefined

## Module Configuration

### Module Export (`index.ts`)

**Location:** `/Users/Karim/med-usa-4wd/src/modules/blog/index.ts`

```typescript
import BlogModuleService from "./service"
import { Module } from "@medusajs/framework/utils"

export const BLOG_MODULE = "blog"

export default Module(BLOG_MODULE, {
  service: BlogModuleService,
})
```

### Medusa Config Registration

**Location:** `/Users/Karim/med-usa-4wd/medusa-config.ts`

The module has been registered in Medusa's configuration:

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

## Next Steps

### 1. Generate and Run Migrations

```bash
# Generate migrations for the blog module
npx medusa db:generate blog

# Run migrations to create database tables
npx medusa db:migrate
```

### 2. Using the Module in API Routes

Example API route at `src/api/store/blog/route.ts`:

```typescript
import { MedusaRequest, MedusaResponse } from "@medusajs/framework"
import BlogModuleService from "../../../modules/blog/service"
import { BLOG_MODULE } from "../../../modules/blog"

export async function GET(
  req: MedusaRequest,
  res: MedusaResponse
): Promise<void> {
  const blogModuleService: BlogModuleService = req.scope.resolve(
    BLOG_MODULE
  )

  const posts = await blogModuleService.listPublishedPosts()

  res.json({
    posts
  })
}
```

### 3. Admin UI Integration

Create admin routes for blog management:
- `src/admin/routes/blog/page.tsx` - Blog listing
- `src/admin/routes/blog/[id]/page.tsx` - Post editor
- `src/admin/routes/blog/categories/page.tsx` - Category management

### 4. API Endpoints to Create

Recommended API structure:

**Store API (Public):**
- `GET /store/blog` - List published posts
- `GET /store/blog/:slug` - Get post by slug
- `GET /store/blog/categories/:slug` - Get posts by category
- `GET /store/blog/products/:id` - Get posts related to product

**Admin API:**
- `GET /admin/blog` - List all posts (including drafts)
- `POST /admin/blog` - Create new post
- `GET /admin/blog/:id` - Get post details
- `PUT /admin/blog/:id` - Update post
- `DELETE /admin/blog/:id` - Delete post
- `POST /admin/blog/:id/publish` - Publish post
- `POST /admin/blog/:id/unpublish` - Unpublish post
- `GET /admin/blog/categories` - List categories
- `POST /admin/blog/categories` - Create category
- `PUT /admin/blog/categories/:id` - Update category
- `DELETE /admin/blog/categories/:id` - Delete category

## Medusa Best Practices Followed

1. **Model Definition Pattern**
   - Used `model.define()` from `@medusajs/framework/utils`
   - Proper field types (id, text, dateTime, json, boolean)
   - Appropriate nullable and default values

2. **Service Pattern**
   - Extended `MedusaService` for automatic CRUD generation
   - Added custom methods for business logic
   - Clear method naming and documentation

3. **Module Export Pattern**
   - Used `Module()` helper from framework
   - Exported module identifier constant
   - Registered service correctly

4. **Dependency Injection**
   - Module can be resolved via `req.scope.resolve(BLOG_MODULE)`
   - Follows Medusa's DI container pattern

5. **E-commerce Integration**
   - Product linking via `product_ids` JSON field
   - Methods for managing product relationships
   - Enables content marketing for products

## Features Included

- ✅ Complete blog post management (CRUD)
- ✅ Category management (CRUD)
- ✅ SEO fields (title, description)
- ✅ Publishing workflow (draft/published states)
- ✅ Slug-based routing
- ✅ Author tracking
- ✅ Featured images
- ✅ Content excerpts
- ✅ Product linking (e-commerce integration)
- ✅ Tag support
- ✅ Timestamps (created_at, updated_at)
- ✅ Query filtering and sorting

## Testing Checklist

- [ ] Generate migrations: `npx medusa db:generate blog`
- [ ] Run migrations: `npx medusa db:migrate`
- [ ] Verify module loads: `npm run dev`
- [ ] Test creating a post via admin API
- [ ] Test creating a category
- [ ] Test publishing/unpublishing posts
- [ ] Test product linking
- [ ] Test querying by slug
- [ ] Test querying by category
- [ ] Verify store API returns only published posts

## Documentation References

- Medusa Modules: https://docs.medusajs.com/learn/fundamentals/modules
- Data Models: https://docs.medusajs.com/learn/fundamentals/data-models
- Services: https://docs.medusajs.com/references/medusa-service
- Module Configuration: https://docs.medusajs.com/learn/fundamentals/modules/module-configuration

## Implementation Notes

- All code follows Medusa v2.11.3 patterns
- No external dependencies added
- Service methods are fully typed
- JSON fields used for arrays (product_ids, tags)
- Unique constraint on slug for SEO-friendly URLs
- Boolean flag + timestamp for publishing workflow
- Category relationship via foreign key (category_id)
- Author relationship via foreign key (author_id)
- Ready for migration generation and database creation

## Status

✅ **COMPLETE** - Ready for migration and testing
