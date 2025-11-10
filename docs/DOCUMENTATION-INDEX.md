# Documentation Index

**Last Updated**: 2025-11-10
**Total Documentation Files**: 120+ files
**Total Size**: ~3.5MB

---

## 📋 Quick Navigation

### 🚀 Getting Started (READ THESE FIRST)

1. **[README.md](../README.md)** - Project overview and quick start guide
2. **[CONTRIBUTING.md](../CONTRIBUTING.md)** - Contributing guidelines and development workflow
3. **[GITHUB-DEPLOYMENT-RECORD.md](./GITHUB-DEPLOYMENT-RECORD.md)** - Complete deployment record and status
4. **[QUICK-REFERENCE-PRODUCTION.md](./QUICK-REFERENCE-PRODUCTION.md)** - Quick deployment checklist

### 🚢 Deployment Documentation

#### Essential Deployment Guides
- **[PRODUCTION-DEPLOYMENT-GUIDE.md](./PRODUCTION-DEPLOYMENT-GUIDE.md)** (900+ lines) - Comprehensive deployment guide
  - Environment variables
  - Security best practices
  - Database configuration
  - Stripe production setup
  - CORS configuration
  - Deployment platforms (Vercel, Railway, Render)
  - Pre/post-deployment checklists
  - Secret rotation procedures
  - Troubleshooting

#### Configuration Files
- **[.env.production.backend.example](./.env.production.backend.example)** - Backend environment template
- **[.env.production.storefront.example](./.env.production.storefront.example)** - Storefront environment template
- **[ENVIRONMENT-CONFIGURATION-SUMMARY.md](./ENVIRONMENT-CONFIGURATION-SUMMARY.md)** - Environment variable reference

#### Specialized Configuration
- **[CORS-CONFIGURATION-GUIDE.md](./CORS-CONFIGURATION-GUIDE.md)** - CORS setup details
- **[SECURITY-CHECKLIST.md](./SECURITY-CHECKLIST.md)** - Security best practices
- **[STRIPE-PRODUCTION-SETUP.md](./STRIPE-PRODUCTION-SETUP.md)** - Stripe configuration guide

### ⚡ Performance & SEO

#### Performance Documentation
- **[PERFORMANCE-SEO-VERIFICATION-REPORT.md](./PERFORMANCE-SEO-VERIFICATION-REPORT.md)** - Pre-deployment audit
- **[performance/page-speed-guidelines.md](./performance/page-speed-guidelines.md)** - PageSpeed optimization (90+ target)
- **[performance/core-web-vitals-standards.md](./performance/core-web-vitals-standards.md)** - Core Web Vitals requirements
- **[performance/optimization-checklist.md](./performance/optimization-checklist.md)** - Pre-deployment checklist
- **[performance-optimizations-applied.md](./performance-optimizations-applied.md)** - Applied optimizations
- **[performance-audit-checkout.md](./performance-audit-checkout.md)** - Checkout performance audit

#### SEO Documentation
Covered in PERFORMANCE-SEO-VERIFICATION-REPORT.md:
- Metadata implementation
- Structured data (JSON-LD)
- Sitemap and robots.txt
- Local SEO (Sunshine Coast)
- Image optimization with alt text

### 💰 Pricing System

**CRITICAL**: Medusa v2 pricing format (dollars in backend, cents in frontend)

- **[MEDUSA-V2-PRICING-MIGRATION.md](./MEDUSA-V2-PRICING-MIGRATION.md)** - Complete migration history
- **[DEVELOPER-PRICING-GUIDE.md](./DEVELOPER-PRICING-GUIDE.md)** - How to work with prices
- **[PRICING-VERIFICATION-REPORT.md](./PRICING-VERIFICATION-REPORT.md)** - Pricing system verification
- **[PRICING-MIGRATION-COMPLETION-REPORT.md](./PRICING-MIGRATION-COMPLETION-REPORT.md)** - Migration completion
- **[pricing/](./pricing/)** - Additional pricing documentation

#### Key Pricing Files
- `/storefront/lib/utils/pricing.ts` - Price conversion utilities
- `/storefront/lib/utils/addon-adapter.ts` - Dollar → cent conversion
- `/storefront/components/Tours/PriceDisplay.tsx` - Price display component

### 📦 Feature Documentation

#### Addon System
- **[addon-filtering-design.md](./addon-filtering-design.md)** - Addon filtering architecture (45KB)
- **[addon-filtering-implementation-guide.md](./addon-filtering-implementation-guide.md)** - Implementation guide
- **[addon-filtering-quick-reference.md](./addon-filtering-quick-reference.md)** - Quick reference
- **[ADDON-IMAGES-COMPLETE-GUIDE.md](./ADDON-IMAGES-COMPLETE-GUIDE.md)** - Image implementation (70KB)
- **[addon-persuasive-copy.md](./addon-persuasive-copy.md)** - Marketing copy
- **[ADDON-TOUR-MAPPING-INDEX.txt](./ADDON-TOUR-MAPPING-INDEX.txt)** - Complete mapping index

#### Resource Booking System
- **[resource-booking/](./resource-booking/)** - Booking system documentation
- **[RESOURCE_BOOKING_SWARM_COMPLETE.md](./RESOURCE_BOOKING_SWARM_COMPLETE.md)** - Implementation report
- **[QUICK_START_RESOURCE_BOOKING.md](./QUICK_START_RESOURCE_BOOKING.md)** - Quick start guide

#### Payment Integration
- **[payment/](./payment/)** - Payment documentation
- **[payment-retry-implementation.md](./payment-retry-implementation.md)** - Retry logic
- **[STRIPE-PRODUCTION-SETUP.md](./STRIPE-PRODUCTION-SETUP.md)** - Production setup

#### Cart & Checkout
- **[CART_TESTING_GUIDE.md](./CART_TESTING_GUIDE.md)** - Cart testing guide
- **[CART_COMPLETION_FIX.md](./CART_COMPLETION_FIX.md)** - Cart completion fix
- **[QUICK_START_CHECKOUT.md](./QUICK_START_CHECKOUT.md)** - Checkout quick start

### 🧪 Testing Documentation

#### Test Reports
- **[testing/](./testing/)** - Test documentation folder
- **[E2E_TESTING_GUIDE.md](./E2E_TESTING_GUIDE.md)** - E2E testing guide
- **[E2E-TEST-RUN-REPORT.md](./E2E-TEST-RUN-REPORT.md)** - Test run report
- **[E2E-TEST-SUMMARY.md](./E2E-TEST-SUMMARY.md)** - Test summary

#### Image Testing
- **[IMAGE-TESTING-COMPLETE.md](./IMAGE-TESTING-COMPLETE.md)** - Image testing results
- **[image-integration-test-report.md](./image-integration-test-report.md)** - Integration tests
- **[addon-images-validation-report.md](./addon-images-validation-report.md)** - Validation report

### 📖 Medusa Documentation

#### Local Medusa Documentation (Offline Access)
- **[medusa-llm/medusa-llms-full.txt](./medusa-llm/medusa-llms-full.txt)** (5.4MB) - MOST COMPREHENSIVE
- **[medusa-llm/medusa-llms.txt](./medusa-llm/medusa-llms.txt)** - Concise version
- **[medusa-llm/learn-*.md](./medusa-llm/)** - Learning guides
- **[MEDUSA-DOCUMENTATION-SETUP-COMPLETE.md](./MEDUSA-DOCUMENTATION-SETUP-COMPLETE.md)** - Setup guide

#### Medusa Best Practices
- **[MEDUSA_V2_AUDIT_SUMMARY.md](./MEDUSA_V2_AUDIT_SUMMARY.md)** - Audit summary
- **[DATABASE_AGENT_MIGRATION_REPORT.md](./DATABASE_AGENT_MIGRATION_REPORT.md)** - Migration report

### 🎨 Content & UX

#### Tour Content
- **[TOUR_CONTENT_MIGRATION.md](./TOUR_CONTENT_MIGRATION.md)** - Content migration
- **[TOUR_CONTENT_SUMMARY.md](./TOUR_CONTENT_SUMMARY.md)** - Content summary
- **[tour-page-content-mapping.md](./tour-page-content-mapping.md)** - Content mapping

#### UX Audits
- **[ux-audit-home-page.md](./ux-audit-home-page.md)** (50KB) - Homepage UX audit
- **[ux-audit-tour-detail.md](./ux-audit-tour-detail.md)** (39KB) - Tour detail UX audit
- **[ux-audit-tours-listing.md](./ux-audit-tours-listing.md)** (28KB) - Tours listing UX audit

#### Image Documentation
- **[IMAGE-OPTIMIZATION-COMPLETE.md](./IMAGE-OPTIMIZATION-COMPLETE.md)** - Optimization guide
- **[IMAGE-SOURCING-SETUP.md](./IMAGE-SOURCING-SETUP.md)** - Image sourcing
- **[image-seo-enhancements.md](./image-seo-enhancements.md)** (47KB) - SEO enhancements

### 🔧 Code Quality & Audit

#### Code Audits
- **[code-audit-report.md](./code-audit-report.md)** (34KB) - Code quality audit
- **[audit/](./audit/)** - Audit reports folder

#### Bug Fixes & Investigations
- **[revalidate-error-investigation.md](./revalidate-error-investigation.md)** - Revalidate investigation
- **[revalidate-fixes-summary.md](./revalidate-fixes-summary.md)** - Fixes summary
- **[NULL_DESCRIPTION_FIXES.md](./NULL_DESCRIPTION_FIXES.md)** - Null description fixes
- **[ADMIN-TOUR-EDITOR-FIX.md](./ADMIN-TOUR-EDITOR-FIX.md)** - Admin editor fix

### 📊 Implementation Reports

#### Swarm Completion Reports
- **[SWARM_COMPLETION_REPORT.md](./SWARM_COMPLETION_REPORT.md)** (18KB) - Overall completion
- **[SWARM_TOURS_FIX_COMPLETE.md](./SWARM_TOURS_FIX_COMPLETE.md)** - Tours fix report

#### Integration Reports
- **[addon-flow-integration-report.md](./addon-flow-integration-report.md)** (20KB) - Flow integration
- **[image-integration-report.md](./image-integration-report.md)** - Image integration
- **[INTEGRATION-SUMMARY.md](./INTEGRATION-SUMMARY.md)** - Overall integration

#### Quick Fix Reports
- **[QUICK-FIXES-IMPLEMENTATION-REPORT.md](./QUICK-FIXES-IMPLEMENTATION-REPORT.md)** - Quick fixes
- **[IMAGE_FIXES_COMPLETE.md](./IMAGE_FIXES_COMPLETE.md)** - Image fixes

---

## 📂 Documentation by Category

### By File Size (Largest)

1. **medusa-llm/medusa-llms-full.txt** (5.4MB) - Complete Medusa documentation
2. **ADDON-IMAGES-COMPLETE-GUIDE.md** (70KB) - Addon images guide
3. **addon-tour-mapping-admin-ui-plan.md** (56KB) - Admin UI plan
4. **addon-tour-mapping-diagrams.md** (57KB) - Mapping diagrams
5. **ux-audit-home-page.md** (50KB) - Homepage UX audit
6. **image-seo-enhancements.md** (47KB) - Image SEO
7. **addon-filtering-design.md** (45KB) - Filtering design

### By Priority (Most Critical)

**Priority 1 - READ BEFORE DEPLOYMENT**:
1. GITHUB-DEPLOYMENT-RECORD.md
2. PRODUCTION-DEPLOYMENT-GUIDE.md
3. SECURITY-CHECKLIST.md
4. PERFORMANCE-SEO-VERIFICATION-REPORT.md
5. STRIPE-PRODUCTION-SETUP.md

**Priority 2 - Development**:
1. CONTRIBUTING.md
2. DEVELOPER-PRICING-GUIDE.md
3. MEDUSA-V2-PRICING-MIGRATION.md
4. medusa-llm/medusa-llms-full.txt

**Priority 3 - Feature-Specific**:
1. Feature-specific docs based on what you're working on
2. Testing guides when writing tests
3. UX audits when updating UI

---

## 🔍 How to Find Documentation

### By Topic

**Deployment**:
```bash
ls -lh docs/ | grep -i "deployment\|production\|environment"
```

**Performance**:
```bash
ls -lh docs/performance/
```

**Pricing**:
```bash
ls -lh docs/pricing/
grep -r "pricing" docs/*.md
```

**Testing**:
```bash
ls -lh docs/testing/
```

**Addons**:
```bash
ls -lh docs/ | grep -i "addon"
```

### Search Within Documentation

```bash
# Search all documentation
grep -r "keyword" docs/

# Search specific category
grep -r "keyword" docs/performance/

# Search Medusa docs
grep -i "workflow" docs/medusa-llm/medusa-llms-full.txt
```

---

## 📝 Documentation Standards

### File Naming Conventions

- **ALL CAPS**: High-priority, comprehensive guides (e.g., PRODUCTION-DEPLOYMENT-GUIDE.md)
- **kebab-case**: Technical documentation (e.g., addon-filtering-design.md)
- **SCREAMING_SNAKE_CASE**: Quick fixes and urgent issues (e.g., NULL_DESCRIPTION_FIXES.md)

### Documentation Types

1. **Guides** (comprehensive, 500+ lines)
   - PRODUCTION-DEPLOYMENT-GUIDE.md
   - ADDON-IMAGES-COMPLETE-GUIDE.md

2. **Quick References** (concise, < 100 lines)
   - QUICK-REFERENCE-PRODUCTION.md
   - QUICK_START_CHECKOUT.md

3. **Reports** (implementation summaries)
   - SWARM_COMPLETION_REPORT.md
   - PERFORMANCE-SEO-VERIFICATION-REPORT.md

4. **Technical Specs** (architecture and design)
   - addon-filtering-design.md
   - addon-tour-mapping-technical-specs.md

---

## 🔗 External Resources

### Official Documentation
- **Medusa Docs**: https://docs.medusajs.com
- **Next.js Docs**: https://nextjs.org/docs
- **Stripe Docs**: https://stripe.com/docs
- **PostgreSQL Docs**: https://www.postgresql.org/docs/

### Testing Tools
- **PageSpeed Insights**: https://pagespeed.web.dev
- **Google Rich Results Test**: https://search.google.com/test/rich-results
- **Lighthouse CI**: https://github.com/GoogleChrome/lighthouse-ci

### Deployment Platforms
- **Vercel**: https://vercel.com/docs
- **Railway**: https://docs.railway.app
- **Render**: https://render.com/docs
- **Supabase**: https://supabase.com/docs

---

## 📈 Documentation Statistics

### Total Files by Category

- **Deployment**: 10 files
- **Performance**: 8 files
- **Pricing**: 7 files
- **Addon System**: 20+ files
- **Testing**: 12+ files
- **Medusa Docs**: 12 files (5.4MB total)
- **UX/Content**: 15+ files
- **Reports**: 20+ files

### Documentation Completeness

- ✅ **Deployment Documentation**: 100% complete
- ✅ **Performance Documentation**: 100% complete
- ✅ **Security Documentation**: 100% complete
- ✅ **Feature Documentation**: 95% complete
- ✅ **Testing Documentation**: 90% complete
- ⚠️ **API Documentation**: 60% complete (needs expansion)

---

## 🆕 Recently Added Documentation (2025-11-10)

1. **GITHUB-DEPLOYMENT-RECORD.md** (21KB) - Complete deployment record with next steps
2. **CONTRIBUTING.md** (15KB) - Contributing guidelines for developers
3. **Updated README.md** (13KB) - Enhanced project overview with GitHub links

---

## 🎯 Next Documentation Tasks

### Planned Documentation

- [ ] API endpoint documentation (Swagger/OpenAPI)
- [ ] Advanced troubleshooting guide
- [ ] Performance optimization case studies
- [ ] Database schema documentation
- [ ] Monitoring and alerting setup guide
- [ ] Disaster recovery procedures
- [ ] Multi-environment deployment guide

### Documentation Maintenance

- [ ] Update screenshots in UX audits
- [ ] Add video tutorials for deployment
- [ ] Create flowcharts for complex workflows
- [ ] Expand API examples
- [ ] Add more troubleshooting scenarios

---

## ❓ Questions?

If you can't find what you're looking for:

1. **Search**: Use grep to search all docs
   ```bash
   grep -r "your keyword" docs/
   ```

2. **Check Index**: Review this file for related topics

3. **Check README**: Main project documentation in README.md

4. **Check CONTRIBUTING**: Development workflow in CONTRIBUTING.md

5. **Ask**: Create an issue or discussion in GitHub

---

**Maintained By**: Development Team
**Last Updated**: 2025-11-10 18:27:00 UTC
**Version**: 1.0.0
**Status**: ✅ Active and Maintained
