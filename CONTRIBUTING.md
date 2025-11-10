# Contributing to Sunshine Coast 4WD Tours

Welcome! This guide will help you contribute to the Sunshine Coast 4WD Tours project effectively.

## Table of Contents
1. [Getting Started](#getting-started)
2. [Development Workflow](#development-workflow)
3. [Code Standards](#code-standards)
4. [Testing Requirements](#testing-requirements)
5. [Documentation](#documentation)
6. [Pull Request Process](#pull-request-process)
7. [Performance & SEO Requirements](#performance--seo-requirements)
8. [Medusa Best Practices](#medusa-best-practices)
9. [Pricing System Guidelines](#pricing-system-guidelines)

---

## Getting Started

### Prerequisites
- **Node.js**: v18+ (LTS recommended)
- **PostgreSQL**: v14+
- **Redis**: v7+
- **npm**: v9+
- **Git**: Latest version

### Initial Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/medusajs/medusa-starter-default.git
   cd med-usa-4wd
   ```

2. **Install dependencies**
   ```bash
   # Backend
   cd backend
   npm install

   # Storefront
   cd ../storefront
   npm install
   ```

3. **Set up environment variables**
   ```bash
   # Backend
   cp docs/.env.production.backend.example backend/.env

   # Storefront
   cp docs/.env.production.storefront.example storefront/.env.local
   ```

4. **Start development servers**
   ```bash
   # Backend (from /backend)
   npm run dev

   # Storefront (from /storefront)
   npm run dev
   ```

5. **Run migrations and seed data**
   ```bash
   cd backend
   npm run db:migrate
   npm run seed
   ```

---

## Development Workflow

### Branch Strategy

- **master**: Production-ready code
- **develop**: Integration branch for features
- **feature/**: Feature branches (e.g., `feature/addon-filtering`)
- **fix/**: Bug fix branches (e.g., `fix/pricing-display`)
- **docs/**: Documentation updates

### Creating a Feature Branch

```bash
# Update master
git checkout master
git pull origin master

# Create feature branch
git checkout -b feature/your-feature-name

# Make changes and commit
git add .
git commit -m "feat: Add your feature description"

# Push to remote
git push origin feature/your-feature-name
```

### Commit Message Convention

We follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Types**:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `perf`: Performance improvements
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

**Examples**:
```bash
feat(checkout): Add payment retry logic
fix(pricing): Resolve cent to dollar conversion issue
docs(deployment): Update production deployment guide
perf(images): Optimize hero image loading
```

---

## Code Standards

### TypeScript

**ALWAYS use TypeScript for new files**

```typescript
// ✅ Good: Properly typed
interface TourProduct {
  id: string;
  title: string;
  price: number; // cents
  metadata: Record<string, any>;
}

const getTourPrice = (tour: TourProduct): number => {
  return tour.price;
};

// ❌ Bad: Using 'any' without reason
const getTourPrice = (tour: any): any => {
  return tour.price;
};
```

### React Components

**Use functional components with hooks**

```tsx
// ✅ Good: Functional component with TypeScript
interface TourCardProps {
  tour: TourProduct;
  onSelect: (id: string) => void;
}

export function TourCard({ tour, onSelect }: TourCardProps) {
  return (
    <div onClick={() => onSelect(tour.id)}>
      <h3>{tour.title}</h3>
      <p>{formatPrice(tour.price)}</p>
    </div>
  );
}

// ❌ Bad: Class component without types
export class TourCard extends React.Component {
  render() {
    return <div>{this.props.tour.title}</div>;
  }
}
```

### Code Formatting

- **Indentation**: 2 spaces
- **Quotes**: Single quotes for strings (except JSX attributes)
- **Semicolons**: Required
- **Max line length**: 100 characters
- **Trailing commas**: Yes (ES5 compatible)

```typescript
// ✅ Good
const tour = {
  id: 'tour_123',
  title: 'Double Island Point',
  price: 20000, // cents
};

// ❌ Bad
const tour = {id:"tour_123",title:"Double Island Point",price:20000}
```

### File Naming

- **Components**: PascalCase (e.g., `TourCard.tsx`)
- **Utilities**: camelCase (e.g., `pricing.ts`)
- **Types**: PascalCase (e.g., `TourTypes.ts`)
- **Constants**: UPPER_SNAKE_CASE (e.g., `API_CONSTANTS.ts`)

---

## Testing Requirements

### Test Coverage Requirements

- **Unit tests**: Minimum 70% coverage for utilities
- **Integration tests**: All API endpoints
- **E2E tests**: Critical user flows (checkout, booking)

### Running Tests

```bash
# Unit tests (Jest)
npm run test

# E2E tests (Playwright)
npm run test:e2e

# Test coverage
npm run test:coverage
```

### Writing Tests

**Unit Test Example**:
```typescript
// pricing.test.ts
import { formatPrice, dollarsToCents } from '@/lib/utils/pricing';

describe('formatPrice', () => {
  it('should format cents to dollar string', () => {
    expect(formatPrice(20000)).toBe('$200.00');
  });

  it('should handle zero', () => {
    expect(formatPrice(0)).toBe('$0.00');
  });
});
```

**E2E Test Example**:
```typescript
// checkout.spec.ts
import { test, expect } from '@playwright/test';

test('complete checkout flow', async ({ page }) => {
  await page.goto('/tours/double-island-point');
  await page.click('button:has-text("Book Now")');
  await page.fill('[name="email"]', 'test@example.com');
  await page.click('button:has-text("Continue")');

  // Verify order confirmation
  await expect(page.locator('h1')).toContainText('Order Confirmed');
});
```

---

## Documentation

### When to Update Documentation

**ALWAYS update documentation when**:
- Adding new features
- Changing APIs or workflows
- Updating environment variables
- Modifying deployment procedures
- Fixing critical bugs

### Documentation Structure

```
docs/
├── README.md                           # Project overview
├── PRODUCTION-DEPLOYMENT-GUIDE.md      # Deployment guide
├── GITHUB-DEPLOYMENT-RECORD.md         # Deployment record
├── DEVELOPER-PRICING-GUIDE.md          # Pricing system guide
├── performance/                        # Performance docs
├── pricing/                            # Pricing docs
└── testing/                            # Testing docs
```

### Documentation Standards

- **Format**: Markdown (.md)
- **Tone**: Clear, concise, professional
- **Code examples**: Always include working examples
- **Screenshots**: Use when helpful (store in `/docs/images/`)
- **Links**: Use relative links for internal docs

---

## Pull Request Process

### Before Creating a PR

1. **Run tests**
   ```bash
   npm run test
   npm run test:e2e
   ```

2. **Run linter**
   ```bash
   npm run lint
   npm run typecheck
   ```

3. **Build successfully**
   ```bash
   npm run build
   ```

4. **Update documentation**
   - Update relevant docs in `/docs`
   - Add comments to complex code
   - Update CHANGELOG.md

5. **Check performance** (if UI changes)
   ```bash
   npm run lighthouse
   ```

### PR Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Unit tests pass
- [ ] E2E tests pass
- [ ] Manual testing completed

## Performance Impact
- [ ] PageSpeed score maintained (≥ 90)
- [ ] Bundle size checked
- [ ] No new performance regressions

## Documentation
- [ ] Updated relevant documentation
- [ ] Added code comments
- [ ] Updated CHANGELOG.md

## Screenshots (if applicable)
[Add screenshots here]

## Related Issues
Closes #123
```

### PR Review Process

1. **Automated checks**: All CI checks must pass
2. **Code review**: At least 1 reviewer approval required
3. **Testing**: Manual testing by reviewer
4. **Performance**: No regressions in PageSpeed score
5. **Merge**: Squash and merge to maintain clean history

---

## Performance & SEO Requirements

### MANDATORY Performance Standards

**From CLAUDE.md - MUST BE FOLLOWED**:

- **Desktop PageSpeed**: ≥ 90 (target: 95+)
- **Mobile PageSpeed**: ≥ 90 (target: 95+)
- **LCP**: < 2.5s (desktop), < 4.0s (mobile)
- **FID**: < 100ms
- **CLS**: < 0.1
- **FCP**: < 1.8s
- **TTFB**: < 600ms

### Performance Checklist

Before submitting PR with UI changes:

- [ ] Images use Next.js Image component
- [ ] Critical images have `priority` prop
- [ ] Lazy loading for below-fold content
- [ ] Code splitting implemented
- [ ] Bundle size checked (`npm run analyze`)
- [ ] Fonts optimized with next/font
- [ ] No layout shift (CLS < 0.1)
- [ ] PageSpeed tested locally

### SEO Checklist

- [ ] Metadata complete (title, description, Open Graph)
- [ ] Structured data (JSON-LD) added if applicable
- [ ] Alt text on all images
- [ ] Semantic HTML (proper heading hierarchy)
- [ ] Canonical URLs set
- [ ] Sitemap updated (if new pages)

**Reference**: `/docs/PERFORMANCE-SEO-VERIFICATION-REPORT.md`

---

## Medusa Best Practices

### CRITICAL: Always Follow Official Documentation

**BEFORE implementing any Medusa feature**:

1. **Check local documentation**: `/docs/medusa-llm/medusa-llms-full.txt`
2. **Search for patterns**:
   ```bash
   grep -i "workflow" docs/medusa-llm/medusa-llms-full.txt
   ```
3. **Consult online docs**: https://docs.medusajs.com
4. **Follow exact patterns** from documentation

### Medusa v2 Patterns

**✅ Use Medusa Workflows for Complex Operations**:
```typescript
// ✅ Good: Using Medusa workflow
import { createWorkflow } from '@medusajs/workflows';

const createBookingWorkflow = createWorkflow(
  'create-booking',
  async (input) => {
    // Workflow steps
  }
);
```

**✅ Use Medusa Services**:
```typescript
// ✅ Good: Using Medusa service
const productService = req.scope.resolve('productService');
const product = await productService.retrieve(productId);
```

**❌ Don't Create Custom Implementations**:
```typescript
// ❌ Bad: Custom implementation instead of Medusa module
const getProducts = async () => {
  return await db.query('SELECT * FROM products');
};
```

### Medusa Module Structure

```
backend/src/
├── modules/              # Custom modules
│   └── resource-booking/
├── workflows/            # Business logic workflows
│   └── create-booking.ts
├── api/                  # Custom API routes
│   └── store/
└── admin/                # Admin customizations
    └── widgets/
```

**Reference**: `/docs/medusa-llm/` for complete Medusa documentation

---

## Pricing System Guidelines

### CRITICAL: Medusa v2 Pricing Format

**Backend (Medusa)**:
- Stores prices in **dollars** (e.g., 200 = $200.00)
- Database uses major currency units
- Store API returns dollars

**Frontend (Next.js)**:
- Internal state uses **cents** for precision (e.g., 20000 cents = $200)
- Adapter converts API dollars → frontend cents (`amount * 100`)
- Display converts frontend cents → user dollars (`amount / 100`)

### Pricing Code Examples

**✅ Correct Price Handling**:
```typescript
// In adapter (converts API dollars to frontend cents)
export function adaptProductPrice(apiProduct: any) {
  return {
    ...apiProduct,
    price: apiProduct.price * 100, // dollars → cents
  };
}

// In display component
import { formatPrice } from '@/lib/utils/pricing';

function ProductCard({ product }) {
  return <p>{formatPrice(product.price)}</p>; // expects cents
}

// formatPrice implementation
export function formatPrice(cents: number): string {
  return new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency: 'AUD',
  }).format(cents / 100); // cents → dollars for display
}
```

**❌ Common Mistakes**:
```typescript
// ❌ Storing cents in Medusa database
await medusa.products.create({
  title: 'Tour',
  price: 20000, // WRONG - Medusa expects dollars
});

// ❌ Displaying without conversion
function ProductCard({ product }) {
  return <p>${product.price}</p>; // WRONG - needs formatPrice()
}

// ❌ Sending price when creating cart
await medusa.carts.addLineItem(cartId, {
  variant_id: variantId,
  quantity: 1,
  price: 20000, // WRONG - Medusa calculates price
});
```

### Required Reading

**BEFORE working with prices**:
1. `/docs/MEDUSA-V2-PRICING-MIGRATION.md` - Migration history
2. `/docs/DEVELOPER-PRICING-GUIDE.md` - How to work with prices
3. `/storefront/lib/utils/pricing.ts` - Utility functions
4. `/storefront/lib/utils/addon-adapter.ts` - Conversion layer

---

## Common Workflows

### Adding a New Tour

1. **Backend**: Create product in Medusa Admin or via seed script
2. **Images**: Add to `/storefront/public/images/tours/`
3. **Metadata**: Add structured data to tour page
4. **Sitemap**: Automatically updates via `/app/sitemap.ts`
5. **Test**: Create E2E test for tour page
6. **Documentation**: Update tour list in docs if needed

### Adding a New Addon

1. **Backend**: Create addon product in Medusa
2. **Mapping**: Add to tour mapping in metadata
3. **Images**: Add to `/storefront/public/images/addons/`
4. **Copy**: Add persuasive copy to product description
5. **Test**: Verify filtering and availability
6. **Documentation**: Update addon documentation

### Updating Environment Variables

1. **Add to templates**: Update `.env.production.*.example` in `/docs`
2. **Document**: Add description in deployment guide
3. **Update code**: Add usage in application code
4. **Test locally**: Verify with new variable
5. **PR**: Include in PR description with explanation
6. **Deploy**: Update production environment after merge

---

## Troubleshooting

### Common Issues

#### TypeScript Errors
```bash
# Clear TypeScript cache
rm -rf .next tsconfig.tsbuildinfo
npm run typecheck
```

#### Build Failures
```bash
# Clear all caches
rm -rf .next node_modules
npm install
npm run build
```

#### Test Failures
```bash
# Run tests in watch mode
npm run test -- --watch

# Run specific test
npm run test pricing.test.ts
```

#### Performance Regressions
```bash
# Analyze bundle size
npm run analyze

# Run Lighthouse
npm run lighthouse
```

---

## Resources

### Project Documentation
- [Production Deployment Guide](./docs/PRODUCTION-DEPLOYMENT-GUIDE.md)
- [GitHub Deployment Record](./docs/GITHUB-DEPLOYMENT-RECORD.md)
- [Performance & SEO Report](./docs/PERFORMANCE-SEO-VERIFICATION-REPORT.md)
- [Security Checklist](./docs/SECURITY-CHECKLIST.md)

### External Documentation
- [Medusa Docs](https://docs.medusajs.com)
- [Next.js Docs](https://nextjs.org/docs)
- [Stripe Docs](https://stripe.com/docs)
- [TypeScript Docs](https://www.typescriptlang.org/docs/)

### Community
- [Medusa Discord](https://discord.gg/medusajs)
- [Next.js Discussions](https://github.com/vercel/next.js/discussions)

---

## Code of Conduct

### Our Standards

- **Be respectful**: Treat all contributors with respect
- **Be constructive**: Provide helpful feedback
- **Be collaborative**: Work together towards common goals
- **Be professional**: Maintain professional communication

### Unacceptable Behavior

- Harassment or discrimination
- Trolling or insulting comments
- Publishing others' private information
- Other conduct which could reasonably be considered inappropriate

---

## Questions?

If you have questions or need help:

1. Check existing documentation in `/docs`
2. Search GitHub issues
3. Ask in project discussions
4. Contact maintainers

---

**Thank you for contributing to Sunshine Coast 4WD Tours!**

**Version**: 1.0.0
**Last Updated**: 2025-11-10
