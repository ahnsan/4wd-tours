# Sunshine Coast 4WD Tours

<p align="center">
  <a href="https://www.medusajs.com">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="https://user-images.githubusercontent.com/59018053/229103275-b5e482bb-4601-46e6-8142-244f531cebdb.svg">
    <source media="(prefers-color-scheme: light)" srcset="https://user-images.githubusercontent.com/59018053/229103726-e5b529a3-9b3f-4970-8a1f-c6af37f087bf.svg">
    <img alt="Medusa logo" src="https://user-images.githubusercontent.com/59018053/229103726-e5b529a3-9b3f-4970-8a1f-c6af37f087bf.svg">
    </picture>
  </a>
</p>

<h4 align="center">
  <a href="https://docs.medusajs.com">Documentation</a> |
  <a href="https://www.medusajs.com">Website</a> |
  <a href="https://discord.gg/medusajs">Discord</a>
</h4>

<p align="center">
  A production-ready e-commerce platform for booking 4WD tour experiences on the Sunshine Coast, Australia
</p>

---

## 🚀 Project Overview

**Sunshine Coast 4WD Tours** is a full-stack e-commerce platform built with **Medusa v2** and **Next.js 14**, designed for booking guided 4WD tour experiences. The platform features dynamic tour management, real-time availability, addon customization, and secure payment processing via Stripe.

### Key Features

- 🏖️ **Tour Management**: Dynamic tour catalog with detailed descriptions, pricing, and availability
- 🎯 **Addon System**: Customizable tour addons with intelligent filtering and recommendations
- 💳 **Secure Payments**: Stripe integration with webhook support for payment confirmation
- 📅 **Resource Booking**: Real-time availability checking and booking management
- 📱 **Responsive Design**: Mobile-first design optimized for all devices
- ⚡ **Performance Optimized**: 92/100 Lighthouse score with Next.js image optimization
- 🔍 **SEO Ready**: Comprehensive metadata, structured data, and sitemap
- 🌏 **Local SEO**: LocalBusiness schema for Sunshine Coast location
- 🛡️ **Production Ready**: Comprehensive documentation and deployment guides

---

## 📁 Repository Information

- **Repository**: https://github.com/medusajs/medusa-starter-default.git
- **Branch**: master
- **Last Updated**: 2025-11-10
- **Status**: ✅ Ready for deployment

---

## 🏗️ Tech Stack

### Backend
- **Medusa v2**: Commerce modules and API
- **PostgreSQL**: Primary database
- **Redis**: Session and cache management
- **Stripe**: Payment processing
- **Node.js**: Runtime environment

### Storefront
- **Next.js 14**: React framework (App Router)
- **TypeScript**: Type safety
- **Tailwind CSS**: Styling
- **React Hook Form**: Form management
- **Zod**: Schema validation
- **Playwright**: E2E testing

---

## 🚀 Quick Start

### Prerequisites

- Node.js v18+
- PostgreSQL v14+
- Redis v7+
- npm v9+

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/medusajs/medusa-starter-default.git
   cd med-usa-4wd
   ```

2. **Install dependencies**
   ```bash
   # Backend
   npm install

   # Storefront
   cd storefront
   npm install
   ```

3. **Set up environment variables**
   ```bash
   # Backend
   cp docs/.env.production.backend.example backend/.env

   # Storefront
   cp docs/.env.production.storefront.example storefront/.env.local
   ```

4. **Start PostgreSQL and Redis**
   ```bash
   # Using Docker Compose (recommended)
   docker-compose up -d postgres redis

   # Or start services manually
   ```

5. **Run migrations and seed data**
   ```bash
   cd backend
   npm run db:migrate
   npm run seed
   ```

6. **Start development servers**
   ```bash
   # Backend (from /backend)
   npm run dev
   # Backend runs at: http://localhost:9000

   # Storefront (from /storefront)
   npm run dev
   # Storefront runs at: http://localhost:8000
   ```

7. **Access the application**
   - **Storefront**: http://localhost:8000
   - **Admin Panel**: http://localhost:9000/app
   - **API**: http://localhost:9000

---

## 📚 Documentation

### Essential Documentation

- **[GITHUB-DEPLOYMENT-RECORD.md](./docs/GITHUB-DEPLOYMENT-RECORD.md)** - Complete deployment record and next steps
- **[PRODUCTION-DEPLOYMENT-GUIDE.md](./docs/PRODUCTION-DEPLOYMENT-GUIDE.md)** - 900+ line comprehensive deployment guide
- **[CONTRIBUTING.md](./CONTRIBUTING.md)** - Contributing guidelines and development workflow
- **[PERFORMANCE-SEO-VERIFICATION-REPORT.md](./docs/PERFORMANCE-SEO-VERIFICATION-REPORT.md)** - Performance audit and SEO implementation

### Configuration Documentation

- **[ENVIRONMENT-CONFIGURATION-SUMMARY.md](./docs/ENVIRONMENT-CONFIGURATION-SUMMARY.md)** - Environment variable reference
- **[CORS-CONFIGURATION-GUIDE.md](./docs/CORS-CONFIGURATION-GUIDE.md)** - CORS setup details
- **[SECURITY-CHECKLIST.md](./docs/SECURITY-CHECKLIST.md)** - Security best practices
- **[STRIPE-PRODUCTION-SETUP.md](./docs/STRIPE-PRODUCTION-SETUP.md)** - Stripe configuration guide

### Feature Documentation

- **[MEDUSA-V2-PRICING-MIGRATION.md](./docs/MEDUSA-V2-PRICING-MIGRATION.md)** - Pricing system implementation
- **[DEVELOPER-PRICING-GUIDE.md](./docs/DEVELOPER-PRICING-GUIDE.md)** - How to work with prices
- **[Resource Booking Docs](./docs/resource-booking/)** - Booking system documentation
- **[Testing Docs](./docs/testing/)** - Test documentation and reports

### Quick Reference

- **[QUICK-REFERENCE-PRODUCTION.md](./docs/QUICK-REFERENCE-PRODUCTION.md)** - Quick deployment checklist
- **[Local Medusa Documentation](./docs/medusa-llm/)** - Offline Medusa docs (5.4MB)

---

## 🎯 Project Structure

```
med-usa-4wd/
├── backend/                  # Medusa v2 backend
│   ├── medusa-config.ts     # Backend configuration
│   ├── src/                 # Custom modules and workflows
│   └── package.json
│
├── storefront/              # Next.js 14 storefront
│   ├── app/                # App Router pages
│   ├── components/         # React components
│   ├── lib/                # Utilities and adapters
│   ├── contexts/           # React contexts
│   ├── public/             # Static assets
│   └── package.json
│
├── docs/                    # Comprehensive documentation
│   ├── GITHUB-DEPLOYMENT-RECORD.md
│   ├── PRODUCTION-DEPLOYMENT-GUIDE.md
│   ├── PERFORMANCE-SEO-VERIFICATION-REPORT.md
│   ├── medusa-llm/         # Local Medusa documentation
│   ├── performance/        # Performance guidelines
│   ├── pricing/            # Pricing implementation docs
│   └── testing/            # Test documentation
│
├── CONTRIBUTING.md          # Contributing guidelines
├── README.md               # This file
└── package.json            # Root package.json
```

---

## 🧪 Testing

### Run Tests

```bash
# Unit tests (Jest)
npm run test

# E2E tests (Playwright)
npm run test:e2e

# Test coverage
npm run test:coverage

# Run Lighthouse performance audit
npm run lighthouse
```

### Test Coverage

- **Unit Tests**: 70%+ coverage for utilities
- **E2E Tests**: Critical user flows (checkout, booking)
- **Integration Tests**: API endpoints

---

## 📊 Performance & SEO

### Performance Metrics (Development)

- **Lighthouse Score**: 92/100
- **LCP**: 2.1s (target: < 2.5s)
- **CLS**: 0.05 (target: < 0.1)
- **TBT**: 150ms (target: < 200ms)
- **Bundle Size**: Optimized with code splitting

### SEO Implementation

- ✅ Complete metadata on all pages
- ✅ Structured data (JSON-LD): Organization, LocalBusiness, Product, Breadcrumb
- ✅ Dynamic sitemap at `/sitemap.xml`
- ✅ Robots.txt configured
- ✅ Semantic HTML with proper heading hierarchy
- ✅ Alt text on all images
- ✅ Mobile-friendly and responsive

**See**: [PERFORMANCE-SEO-VERIFICATION-REPORT.md](./docs/PERFORMANCE-SEO-VERIFICATION-REPORT.md) for detailed audit results.

---

## 🚢 Deployment

### Recommended Platforms

- **Storefront**: [Vercel](https://vercel.com) (optimized for Next.js)
- **Backend**: [Railway](https://railway.app) (includes PostgreSQL and Redis)
- **Database**: [Supabase](https://supabase.com) (Sydney region for low latency)

### Quick Deployment

```bash
# Deploy storefront to Vercel
cd storefront
npx vercel

# Deploy backend to Railway
# Use Railway dashboard or CLI
```

### Pre-Deployment Checklist

- [ ] All environment variables configured
- [ ] Strong secrets generated (64+ characters)
- [ ] Stripe live mode configured
- [ ] CORS domains set for production
- [ ] Database migrations run
- [ ] Webhook endpoints configured
- [ ] PageSpeed score ≥ 90 (desktop and mobile)

**See**: [PRODUCTION-DEPLOYMENT-GUIDE.md](./docs/PRODUCTION-DEPLOYMENT-GUIDE.md) for complete deployment instructions.

---

## 🎓 Development Guidelines

### Code Standards

- **Language**: TypeScript (mandatory for new files)
- **Components**: Functional components with hooks
- **Styling**: Tailwind CSS
- **Formatting**: Prettier with 2-space indentation
- **Linting**: ESLint with strict rules

### Commit Convention

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
feat(checkout): Add payment retry logic
fix(pricing): Resolve cent to dollar conversion
docs(deployment): Update production guide
perf(images): Optimize hero image loading
```

### Pull Request Process

1. Create feature branch from `master`
2. Make changes and commit
3. Run tests and build
4. Update documentation
5. Create pull request
6. Pass code review
7. Merge to `master`

**See**: [CONTRIBUTING.md](./CONTRIBUTING.md) for detailed contributing guidelines.

---

## 🔒 Security

### Security Best Practices

- ✅ Strong secrets (64+ characters)
- ✅ Environment variables never committed
- ✅ HTTPS only in production
- ✅ CORS properly configured
- ✅ Stripe webhook signature verification
- ✅ Input validation on all forms
- ✅ SQL injection prevention (Medusa ORM)

**See**: [SECURITY-CHECKLIST.md](./docs/SECURITY-CHECKLIST.md) for complete security guidelines.

---

## 💰 Pricing System

### Medusa v2 Pricing Format

**CRITICAL**: Medusa v2 uses a different pricing format than v1.

- **Backend**: Stores prices in **dollars** (e.g., 200 = $200.00)
- **Frontend**: Uses **cents** internally for precision (e.g., 20000 cents = $200)
- **Conversion**: Adapter layer converts API dollars → frontend cents
- **Display**: Format cents → dollars for user display

**Example**:
```typescript
// Backend (Medusa) - dollars
{ price: 200 } // $200.00

// Frontend (internal) - cents
{ price: 20000 } // 20000 cents = $200

// Frontend (display) - dollars
formatPrice(20000) // "$200.00"
```

**See**:
- [MEDUSA-V2-PRICING-MIGRATION.md](./docs/MEDUSA-V2-PRICING-MIGRATION.md) - Migration history
- [DEVELOPER-PRICING-GUIDE.md](./docs/DEVELOPER-PRICING-GUIDE.md) - How to work with prices

---

## 📖 Learn More

### Official Documentation

- **Medusa**: https://docs.medusajs.com
- **Next.js**: https://nextjs.org/docs
- **Stripe**: https://stripe.com/docs
- **PostgreSQL**: https://www.postgresql.org/docs/

### Community & Support

- **Medusa Discord**: https://discord.gg/medusajs
- **Medusa GitHub**: https://github.com/medusajs/medusa
- **Next.js Discussions**: https://github.com/vercel/next.js/discussions

---

## 🤝 Contributing

We welcome contributions! Please read our [Contributing Guidelines](./CONTRIBUTING.md) before submitting a pull request.

### Quick Contribution Steps

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Update documentation
6. Submit a pull request

---

## 📝 License

This project is based on [Medusa](https://github.com/medusajs/medusa) and follows the same license.

---

## 🙏 Acknowledgments

- Built with [Medusa](https://medusajs.com) - Open-source e-commerce platform
- Powered by [Next.js](https://nextjs.org) - React framework
- Payments by [Stripe](https://stripe.com) - Payment processing

---

## 📞 Contact & Support

### Project Information

- **Repository**: https://github.com/medusajs/medusa-starter-default.git
- **Branch**: master
- **Status**: Production-ready

### Support Channels

- **Medusa Discord**: https://discord.gg/medusajs
- **GitHub Issues**: Create an issue in this repository
- **Documentation**: See `/docs` folder for comprehensive guides

---

## 🗺️ Roadmap

### Completed ✅

- [x] Medusa v2 backend setup
- [x] Next.js 14 storefront
- [x] Tour management system
- [x] Addon filtering and recommendations
- [x] Stripe payment integration
- [x] Resource booking system
- [x] Performance optimization (92/100 Lighthouse)
- [x] SEO implementation (metadata, structured data, sitemap)
- [x] Comprehensive documentation (900+ lines)
- [x] E2E testing with Playwright
- [x] Production deployment guides

### Planned 🔮

- [ ] Deploy to Vercel (storefront)
- [ ] Deploy to Railway (backend)
- [ ] Production PageSpeed verification (≥ 90)
- [ ] Google Search Console setup
- [ ] Customer reviews and ratings
- [ ] Multi-language support
- [ ] Advanced analytics dashboard
- [ ] Email marketing integration
- [ ] Social media integration

---

**Version**: 1.0.0
**Last Updated**: 2025-11-10
**Status**: ✅ Ready for deployment

---

<p align="center">
  Made with ❤️ for Sunshine Coast 4WD Tours
</p>
