# Tour Catalog Integration Guide

## Quick Start

### 1. Prerequisites

Ensure you have:
- Medusa backend running
- "tours" product collection created in Medusa admin
- Tour products added to the collection
- Tour images uploaded to `/storefront/public/images/`

### 2. Environment Setup

No additional environment variables required. The catalog uses:
- Medusa Store API endpoint: `/store/products`
- Collection filter: `collection_id[]=tours`

### 3. Accessing the Page

Navigate to: `http://localhost:8000/tours`

## Component Architecture

```
/storefront/app/tours/page.tsx (Main Page)
├── FilterBar (Search, Duration, Sort)
├── TourCard[] (Grid of tour cards)
│   ├── Next.js Image
│   ├── PriceDisplay
│   └── View Details button
└── Pagination
```

## Data Flow

```
useTours Hook
  ↓
Fetch from /store/products?collection_id[]=tours
  ↓
Apply filters (duration, sort, search)
  ↓
Return { tours, meta, isLoading, error }
  ↓
Render TourCards in grid
```

## API Endpoints Used

### Get Tours (with filters)
```
GET /store/products?collection_id[]=tours&duration=1-day&sort=price_asc&q=beach&offset=0&limit=12
```

**Query Parameters:**
- `collection_id[]`: "tours" (required)
- `duration`: "1-day", "2-day", "3-day", "4-day" (optional)
- `sort`: "price_asc", "price_desc" (optional)
- `q`: Search query (optional)
- `offset`: Pagination offset (optional, default: 0)
- `limit`: Results per page (optional, default: 12)

**Response:**
```json
{
  "products": [
    {
      "id": "prod_123",
      "handle": "rainbow-beach-adventure",
      "title": "Rainbow Beach 4WD Adventure",
      "description": "...",
      "thumbnail": "/images/tour.jpg",
      "images": [...],
      "variants": [...],
      "metadata": {
        "duration": "1-day",
        "featured": true
      }
    }
  ],
  "count": 24,
  "offset": 0,
  "limit": 12
}
```

## Adding to Navigation

Add to your main navigation:

```tsx
// In your Header/Navigation component
<Link href="/tours">
  Tours
</Link>
```

## Creating Tour Products in Medusa

### Via Admin UI

1. Log into Medusa Admin
2. Go to Products > Create Product
3. Set product details:
   - Title: Tour name
   - Handle: URL slug
   - Description: Tour description
   - Images: Upload tour images
4. Add to "tours" collection
5. Set metadata:
   ```json
   {
     "duration": "1-day",
     "departure_times": ["8:00 AM", "2:00 PM"],
     "inclusions": ["Guide", "Equipment"],
     "exclusions": ["Food", "Insurance"],
     "difficulty_level": "Easy",
     "min_participants": 2,
     "max_participants": 8,
     "featured": true
   }
   ```
6. Add variants with prices:
   - Currency: AUD
   - Amount: Price in cents (e.g., 15000 = $150.00)

### Via API

```bash
curl -X POST http://localhost:9000/admin/products \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "title": "Rainbow Beach Adventure",
    "handle": "rainbow-beach-adventure",
    "description": "Full day 4WD adventure...",
    "collection_id": "TOURS_COLLECTION_ID",
    "variants": [
      {
        "title": "Standard",
        "prices": [
          {
            "currency_code": "aud",
            "amount": 15000
          }
        ]
      }
    ],
    "metadata": {
      "duration": "1-day",
      "featured": true
    }
  }'
```

## Customization

### Changing Items Per Page

Edit `/storefront/app/tours/page.tsx`:

```tsx
const [filters, setFilters] = useState<TourFilters>({
  per_page: 16, // Change from 12 to 16
  page: 1,
});
```

### Adding More Filters

1. Update `TourFilters` type in `/storefront/lib/types/tour.ts`
2. Add filter controls to `FilterBar.tsx`
3. Update `useTours` hook to pass new params

### Styling Changes

All styles are in CSS modules:
- Page: `/storefront/app/tours/tours.module.css`
- Cards: `/storefront/components/Tours/TourCard.module.css`
- Filters: `/storefront/components/Tours/FilterBar.module.css`

### Changing Grid Layout

Edit `/storefront/app/tours/tours.module.css`:

```css
@media (min-width: 1440px) {
  .toursGrid {
    grid-template-columns: repeat(5, 1fr); /* Change from 4 to 5 */
  }
}
```

## Troubleshooting

### No Tours Showing

**Check:**
1. Is Medusa backend running?
2. Are tours in the "tours" collection?
3. Check browser console for API errors
4. Verify API endpoint: `http://localhost:9000/store/products?collection_id[]=tours`

### Images Not Loading

**Check:**
1. Images are in `/storefront/public/images/`
2. Image paths are correct in product data
3. Next.js Image domains configured in `next.config.js`

### Filters Not Working

**Check:**
1. Open browser DevTools Network tab
2. Watch API calls when changing filters
3. Verify query parameters are correct
4. Check for console errors

### Performance Issues

**Optimize:**
1. Reduce `per_page` value
2. Optimize images (compress, use WebP)
3. Check for React rendering issues
4. Enable ISR for caching

## Adding ISR (Incremental Static Regeneration)

Convert to server component with ISR:

```tsx
// Change from 'use client' to server component
export const revalidate = 3600; // 1 hour

export default async function ToursPage() {
  const response = await fetch(
    'http://localhost:9000/store/products?collection_id[]=tours',
    { next: { revalidate: 3600 } }
  );
  const data = await response.json();

  return (
    // ... render with static data
  );
}
```

## Production Checklist

- [ ] Environment variables configured
- [ ] API endpoints use production URLs
- [ ] Images optimized and uploaded
- [ ] Meta tags added for SEO
- [ ] Structured data implemented
- [ ] Performance tested (Lighthouse)
- [ ] Accessibility tested (WCAG)
- [ ] Mobile tested on real devices
- [ ] Error handling tested
- [ ] Analytics tracking added

## Related Documentation

- [Medusa Store API](https://docs.medusajs.com/api/store)
- [Next.js Image Optimization](https://nextjs.org/docs/basic-features/image-optimization)
- [Next.js Data Fetching](https://nextjs.org/docs/basic-features/data-fetching)
- [React Hooks](https://react.dev/reference/react)

## Support

For issues or questions:
1. Check Medusa documentation
2. Review Next.js documentation
3. Check project README
4. Contact development team

## Version History

- **v1.0.0** (2025-11-07): Initial implementation
  - Basic catalog with filtering
  - Search and pagination
  - Responsive design
  - Performance optimizations
