# Sunshine Coast 4WD Tours - Storefront

This is the storefront for Sunshine Coast 4WD Tours, built with Next.js 14.

## Features

- **Hero Section**: Full-width hero with navigation and CTAs
- **Tour Options**: Three main tour packages with imagery
- **Footer**: Instagram feed, contact info, and affiliate links
- **Responsive Design**: Mobile-first approach
- **TypeScript**: Full type safety

## Getting Started

```bash
# Install dependencies
cd storefront
yarn install

# Run development server
yarn dev
```

Open [http://localhost:8000](http://localhost:8000) to view the site.

## Project Structure

```
storefront/
├── app/                 # Next.js App Router
│   ├── layout.tsx      # Root layout with fonts
│   └── page.tsx        # Home page
├── components/         # React components
│   ├── Hero/          # Hero section
│   ├── TourOptions/   # Tour cards section
│   └── Footer/        # Footer with Instagram feed
├── public/            # Static assets
│   └── images/       # Tour images
└── styles/           # Global styles
    └── globals.css   # CSS variables and base styles
```

## Technologies

- Next.js 14 (App Router)
- TypeScript
- CSS Modules
- React 18

## Integration with Medusa

This storefront is designed to work alongside the Medusa backend running on port 9000.

### Medusa v2 Pricing

**IMPORTANT**: This project uses Medusa v2 pricing format.

- **Backend**: Prices stored in **dollars** (major currency units)
- **Frontend**: Prices stored in **cents** (integer precision)
- **Conversion**: Happens automatically at adapter layer

**Developer Resources**:
- **Migration Guide**: `/docs/MEDUSA-V2-PRICING-MIGRATION.md`
- **Developer Guide**: `/docs/DEVELOPER-PRICING-GUIDE.md`
- **Official Docs**: https://docs.medusajs.com/resources/commerce-modules/product/price

**Quick Reference**:

```typescript
// Adding a new product (backend)
prices: [{
  currency_code: "aud",
  amount: 200  // $200 in DOLLARS (not cents)
}]

// Displaying price (frontend)
import { formatPrice } from '@/lib/utils/pricing';
formatPrice(product.price_cents)  // Expects CENTS
```

**Common Tasks**:
- **Add Product**: See `/docs/DEVELOPER-PRICING-GUIDE.md#adding-new-products`
- **Display Price**: Use `formatPrice(cents)` or `<PriceDisplay amount={cents} />`
- **Troubleshooting**: Check `/docs/MEDUSA-V2-PRICING-MIGRATION.md#common-mistakes`
