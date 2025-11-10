# Medusa Image Upload Guide

## Overview

This guide documents the process of uploading product images to Medusa v2 using the file upload workflow and product module service.

**Date:** 2025-11-08
**Medusa Version:** 2.11.3
**File Module:** Local File Provider (development)

## Summary

Successfully uploaded **11 images** to **5 tour products** using Medusa's built-in file upload workflow and product module service.

### Products Updated

| Product Handle | Product Title | Images | Thumbnail |
|----------------|---------------|--------|-----------|
| `1d-fraser-island` | 1 Day Fraser Island Tour | 2 | kgari-aerial.jpg |
| `1d-rainbow-beach` | 1 Day Rainbow Beach Tour | 2 | rainbow-beach.jpg |
| `2d-fraser-rainbow` | 2 Day Fraser + Rainbow Combo | 2 | 4wd-on-beach.jpg |
| `3d-fraser-rainbow` | 3 Day Fraser & Rainbow Combo | 2 | kgari-wreck.jpg |
| `4d-fraser-rainbow` | 4 Day Fraser & Rainbow Combo | 3 | Double-island-2.jpg |

## Image Mappings

### 1 Day Fraser Island Tour (`1d-fraser-island`)
- **Thumbnail:** `kgari-aerial.jpg` - Aerial view of Fraser Island (K'gari)
- **Images:**
  1. `kgari-aerial.jpg` - Aerial view showing the island's pristine beaches
  2. `kgari-dingo.jpg` - Native dingo, a key wildlife attraction

**Rationale:** Aerial view showcases the island's natural beauty, while dingo image highlights unique wildlife experience.

### 1 Day Rainbow Beach Tour (`1d-rainbow-beach`)
- **Thumbnail:** `rainbow-beach.jpg` - Rainbow Beach coastal scenery
- **Images:**
  1. `rainbow-beach.jpg` - The colorful sand cliffs of Rainbow Beach
  2. `double-island-point.jpg` - Coastal landscape view

**Rationale:** Iconic rainbow-colored sand cliffs are the main attraction, with coastal views as secondary interest.

### 2 Day Fraser + Rainbow Combo (`2d-fraser-rainbow`)
- **Thumbnail:** `4wd-on-beach.jpg` - 4WD adventure action shot
- **Images:**
  1. `4wd-on-beach.jpg` - 4WD driving on the beach
  2. `double-island-point.jpg` - Scenic coastal point

**Rationale:** Action shot appeals to adventure seekers, showing the active nature of the tour.

### 3 Day Fraser & Rainbow Combo (`3d-fraser-rainbow`)
- **Thumbnail:** `kgari-wreck.jpg` - Maheno Shipwreck on Fraser Island
- **Images:**
  1. `kgari-wreck.jpg` - Historic Maheno Shipwreck
  2. `kgari-aerial.jpg` - Aerial island view

**Rationale:** Iconic shipwreck is a must-see landmark that appeals to history and photography enthusiasts.

### 4 Day Fraser & Rainbow Combo (`4d-fraser-rainbow`)
- **Thumbnail:** `Double-island-2.jpg` - Premium coastal vista
- **Images:**
  1. `Double-island-2.jpg` - Double Island Point premium view
  2. `kgari-aerial.jpg` - Comprehensive aerial view
  3. `4wd-on-beach.jpg` - Adventure activity showcase

**Rationale:** Premium tour deserves the best coastal vista, with comprehensive coverage of all tour aspects.

## Technical Implementation

### Architecture

The upload process uses three key Medusa components:

1. **Upload Files Workflow** (`uploadFilesWorkflow`)
   - Handles file upload to the configured file service
   - Returns file metadata including URLs

2. **Product Module Service** (`productModuleService`)
   - Manages product data including images
   - Supports updating products with image URLs

3. **Local File Module Provider**
   - Stores files in the `/static` directory
   - Serves files at `http://localhost:9000/static/{filename}`

### Upload Script

**Location:** `/Users/Karim/med-usa-4wd/src/scripts/upload-tour-images.ts`

**Key Features:**
- Reads images from `storefront/public/images/tours/`
- Uploads files using `uploadFilesWorkflow`
- Updates products using `productModuleService.updateProducts()`
- Sets both thumbnail and images array
- Handles errors gracefully
- Provides detailed logging

**Usage:**
```bash
npx medusa exec /Users/Karim/med-usa-4wd/src/scripts/upload-tour-images.ts
```

### Verification Script

**Location:** `/Users/Karim/med-usa-4wd/src/scripts/verify-tour-images.ts`

**Key Features:**
- Fetches products with image relations
- Displays thumbnail and all images
- Outputs JSON summary for automation
- Provides statistics

**Usage:**
```bash
npx medusa exec /Users/Karim/med-usa-4wd/src/scripts/verify-tour-images.ts
```

## Medusa v2 File Upload Pattern

### 1. Upload Files

```typescript
import { uploadFilesWorkflow } from "@medusajs/medusa/core-flows";
import * as fs from "fs";

// Read file
const fileContent = fs.readFileSync(imagePath);
const base64Content = fileContent.toString('base64');

// Upload using workflow
const { result: uploadedFiles } = await uploadFilesWorkflow(container).run({
  input: {
    files: [
      {
        filename: "image.jpg",
        mimeType: "image/jpeg",
        content: base64Content,
        access: "public", // or "private"
      }
    ],
  },
});

// Extract URL
const imageUrl = uploadedFiles[0].url;
```

### 2. Update Product with Images

```typescript
import { Modules } from "@medusajs/framework/utils";

const productModuleService = container.resolve(Modules.PRODUCT);

await productModuleService.updateProducts(productId, {
  thumbnail: imageUrls[0], // First image as thumbnail
  images: imageUrls.map(url => ({ url })),
});
```

### 3. Fetch Products with Images

**Important:** Must include `relations: ["images"]` to fetch image data!

```typescript
const products = await productModuleService.listProducts(
  { handle: "product-handle" },
  {
    relations: ["images"], // Required!
  }
);
```

## File Storage

### Development (Local File Provider)

**Storage Location:** `/Users/Karim/med-usa-4wd/static/`

**URL Pattern:** `http://localhost:9000/static/{timestamp}-{filename}`

**Example:**
- File: `1762597232972-kgari-aerial.jpg`
- URL: `http://localhost:9000/static/1762597232972-kgari-aerial.jpg`

### Production Recommendations

For production, use a cloud file service provider:

1. **AWS S3** - Use `@medusajs/file-s3` module
2. **Google Cloud Storage** - Use appropriate provider
3. **Cloudinary** - For image optimization
4. **CDN** - For faster global delivery

**Configuration in `medusa-config.ts`:**
```typescript
modules: [
  {
    resolve: "@medusajs/file-s3",
    options: {
      s3_url: process.env.S3_URL,
      bucket: process.env.S3_BUCKET,
      access_key_id: process.env.S3_ACCESS_KEY_ID,
      secret_access_key: process.env.S3_SECRET_ACCESS_KEY,
    },
  },
]
```

## Verification Results

### API Response Example

**Product:** 1d-fraser-island

```json
{
  "handle": "1d-fraser-island",
  "status": "FOUND",
  "id": "prod_01K9H8KY3ERTCHH6EERRTVTRDA",
  "title": "1 Day Fraser Island Tour",
  "thumbnail": "http://localhost:9000/static/1762597232972-kgari-aerial.jpg",
  "imageCount": 2,
  "images": [
    {
      "id": "img_01K9HFPRBP2P0V3XKB0NQRJ12A",
      "url": "http://localhost:9000/static/1762597232972-kgari-aerial.jpg"
    },
    {
      "id": "img_01K9HFPRBPSYKC03VN8FGRC6Y2",
      "url": "http://localhost:9000/static/1762597232974-kgari-dingo.jpg"
    }
  ]
}
```

### Complete Results Summary

```
Total products checked: 5
Products with images: 5 (100%)
Products without images: 0 (0%)
Total images uploaded: 11
```

## Image Accessibility

All images are accessible via HTTP:

**Test Command:**
```bash
curl -I "http://localhost:9000/static/1762597232972-kgari-aerial.jpg"
```

**Expected Response:**
```
HTTP/1.1 200 OK
Content-Type: image/jpeg
Content-Length: 1917913
```

## Best Practices

### 1. Image Optimization

**Before uploading:**
- Optimize images (use ImageMagick, Sharp, or online tools)
- Recommended format: WebP or JPEG
- Recommended size: 1200x800px or similar
- Maximum file size: < 500KB
- Use descriptive filenames

**Example optimization:**
```bash
# Using ImageMagick
convert input.jpg -resize 1200x800 -quality 85 output.jpg

# Using Sharp (Node.js)
sharp('input.jpg')
  .resize(1200, 800)
  .webp({ quality: 85 })
  .toFile('output.webp');
```

### 2. Image Naming Convention

- Use lowercase with hyphens
- Be descriptive and SEO-friendly
- Include location or feature names
- Examples:
  - `kgari-aerial.jpg` (good)
  - `IMG_1234.jpg` (bad)

### 3. Alt Text and Accessibility

When displaying images on the storefront, always include alt text:

```tsx
<img
  src={product.thumbnail}
  alt={`${product.title} - Scenic view of Fraser Island`}
/>
```

### 4. Error Handling

Always wrap upload operations in try-catch blocks:

```typescript
try {
  const { result } = await uploadFilesWorkflow(container).run({
    input: { files }
  });
} catch (error) {
  logger.error("Upload failed:", error);
  // Handle error appropriately
}
```

## Troubleshooting

### Issue: Images array is empty after update

**Solution:** Include `relations: ["images"]` when fetching products:

```typescript
const products = await productModuleService.listProducts(
  { handle },
  { relations: ["images"] }  // Required!
);
```

### Issue: Upload fails with file size error

**Solutions:**
1. Optimize images before upload
2. Increase file size limit in Medusa configuration
3. Use image optimization services

### Issue: Images not accessible via URL

**Check:**
1. File exists in `/static` directory
2. File service is configured correctly
3. Server is serving static files
4. URL format is correct

### Issue: Thumbnail set but images array empty

**Cause:** Using `updateProductsWorkflow` instead of `productModuleService`

**Solution:** Use `productModuleService.updateProducts()` directly:

```typescript
await productModuleService.updateProducts(productId, {
  thumbnail: thumbnailUrl,
  images: imageUrls.map(url => ({ url })),
});
```

## Future Enhancements

### 1. Batch Upload via Admin UI

Create an admin widget for bulk image uploads:

```typescript
// /src/admin/widgets/bulk-image-uploader.tsx
import { defineWidgetConfig } from "@medusajs/admin-sdk"

const BulkImageUploader = () => {
  // Implementation for drag-and-drop upload
}

export const config = defineWidgetConfig({
  zone: "product.details.before",
})

export default BulkImageUploader
```

### 2. Image Variants and Transformations

Implement automatic image resizing for different use cases:

- Thumbnail: 300x200px
- Product card: 600x400px
- Product detail: 1200x800px
- Lightbox: 1920x1280px

### 3. CDN Integration

For production, integrate with a CDN:

- CloudFront (AWS)
- Cloud CDN (Google)
- Cloudflare
- Fastly

### 4. Image SEO Optimization

- Generate descriptive filenames from product data
- Auto-populate alt text from product descriptions
- Create image sitemaps
- Implement structured data for images

## Related Documentation

- [Medusa File Module](https://docs.medusajs.com/resources/infrastructure-modules/file)
- [Medusa Workflows](https://docs.medusajs.com/learn/fundamentals/workflows)
- [Product Module](https://docs.medusajs.com/resources/commerce-modules/product)
- [Custom CLI Scripts](https://docs.medusajs.com/learn/fundamentals/custom-cli-scripts)

## Conclusion

This implementation successfully demonstrates:

1. **Medusa v2 file upload workflow usage**
2. **Product image management best practices**
3. **Automated image upload via CLI scripts**
4. **Proper verification and testing procedures**

All 5 tour products now have appropriate, high-quality images that showcase the unique features of each tour offering. Images are accessible, properly stored, and ready for use in the storefront.

---

**Last Updated:** 2025-11-08
**Author:** Claude Code
**Status:** Complete
