# Med-USA-4WD Documentation

Welcome to the documentation for the Fraser Dingo 4WD Adventures e-commerce platform.

## 📚 Quick Navigation

### 🚀 Getting Started
Start here if you're new to the project:
- [Installation Guide](getting-started/installation.md)
- [Local Development Setup](getting-started/local-development.md)
- [First Deployment](getting-started/first-deployment.md)

### 🏗️ Architecture
Understand how the system works:
- [Architecture Overview](architecture/overview.md)
- [Backend Architecture](architecture/backend-architecture.md)
- [Storefront Architecture](architecture/storefront-architecture.md)
- [Database Schema](architecture/database-schema.md)

### 📋 Development Standards
**READ THESE BEFORE CODING:**
- [**Medusa Development Guide**](standards/medusa-development-guide.md) ⭐ **MANDATORY**
- [Project Organization Standards](standards/project-organization.md) ⭐ **MANDATORY**
- [Documentation Standards](standards/documentation-standards.md) ⭐ **MANDATORY**
- [Code Style Guide](standards/code-style-guide.md)
- [Testing Standards](standards/testing-standards.md)

### ⚡ Performance Optimization
**MANDATORY REFERENCE - 90+ PageSpeed Score Required:**
- [**Page Speed Guidelines**](performance/page-speed-guidelines.md) ⭐ **MANDATORY** - Achieve 90+ score on desktop and mobile
- [**Core Web Vitals Standards**](performance/core-web-vitals-standards.md) ⭐ **MANDATORY** - LCP, FID, CLS requirements
- [**Optimization Checklist**](performance/optimization-checklist.md) ⭐ **MANDATORY** - Pre-deployment verification

### 🔍 SEO Best Practices
**MANDATORY REFERENCE - Maximum Visibility Required:**
- [**SEO Best Practices**](seo/seo-best-practices.md) ⭐ **MANDATORY** - Complete SEO implementation guide
- [**Metadata Standards**](seo/metadata-standards.md) ⭐ **MANDATORY** - Title, description, Open Graph, Twitter Cards
- [**Structured Data Requirements**](seo/structured-data-requirements.md) ⭐ **MANDATORY** - Schema.org JSON-LD implementation

### 🔌 API Documentation
- [API Overview](api/overview.md)
- [Authentication](api/authentication.md)
- [Products API](api/endpoints/products.md)
- [Orders API](api/endpoints/orders.md)
- [Customers API](api/endpoints/customers.md)
- [Webhooks](api/webhooks.md)

### 📖 Guides
Step-by-step tutorials:
- [Adding Custom Routes](guides/adding-custom-routes.md)
- [Creating Workflows](guides/creating-workflows.md)
- [Customizing Admin Panel](guides/customizing-admin.md)
- [Integrating Payment Providers](guides/integrating-payment-providers.md)

### 🚀 Deployment
Production deployment guides:
- [Production Checklist](deployment/production-checklist.md)
- [Environment Variables](deployment/environment-variables.md)
- [Scaling Guide](deployment/scaling-guide.md)
- [Monitoring & Logging](deployment/monitoring.md)

### 🔧 Troubleshooting
Having issues? Check here:
- [Common Errors](troubleshooting/common-errors.md)
- [Debugging Guide](troubleshooting/debugging-guide.md)
- [FAQ](troubleshooting/faq.md)

### 📝 Architecture Decision Records
Important decisions and their context:
- [ADR Template](adr/template.md)
- [001: Choosing Medusa](adr/001-choosing-medusa.md)
- [002: Database Selection](adr/002-database-selection.md)

## 🎯 Quick Reference

### Technology Stack
- **Backend**: Medusa v2.11.3
- **Frontend**: Next.js 14 (App Router)
- **Database**: PostgreSQL
- **Language**: TypeScript

### Key Resources
- **Medusa Official Docs**: https://docs.medusajs.com
- **Medusa LLM Docs**: https://docs.medusajs.com/llms-full.txt
- **Project Repository**: [Add your repo URL]
- **Project Board**: [Add your board URL]

### Useful Slash Commands
- `/medusa-docs` - Access Medusa documentation
- `/dev` - Start development server
- `/db-reset` - Reset database

## 📁 Documentation Structure

```
docs/
├── README.md                    # This file - navigation hub
├── getting-started/             # Onboarding docs
├── architecture/                # System design
├── standards/                   # **READ THESE FIRST** ⭐
├── performance/                 # **MANDATORY** - Performance optimization ⚡
├── seo/                         # **MANDATORY** - SEO best practices 🔍
├── api/                         # API documentation
├── guides/                      # How-to guides
├── deployment/                  # Production deployment
├── troubleshooting/             # Problem solving
└── adr/                        # Decision records
```

## ✅ Before You Start Coding

**MANDATORY READING:**
1. [Medusa Development Guide](standards/medusa-development-guide.md)
2. [Project Organization Standards](standards/project-organization.md)
3. [Documentation Standards](standards/documentation-standards.md)
4. [Page Speed Guidelines](performance/page-speed-guidelines.md) - **90+ score required**
5. [SEO Best Practices](seo/seo-best-practices.md) - **Maximum visibility required**

**MANDATORY RULES:**
- ✅ ALWAYS check Medusa official docs before implementing
- ✅ ALWAYS follow project organization standards
- ✅ ALWAYS keep root directory clean
- ✅ ALWAYS document new features
- ✅ ALWAYS achieve 90+ PageSpeed score (desktop & mobile)
- ✅ ALWAYS implement complete SEO metadata and structured data
- ✅ ALWAYS verify Core Web Vitals are in "Good" range
- ❌ NEVER create files in root directory (except configs)
- ❌ NEVER deviate from Medusa patterns
- ❌ NEVER commit undocumented features
- ❌ NEVER deploy without passing performance audits
- ❌ NEVER skip SEO implementation

## 🤝 Contributing to Documentation

Found a gap in the docs? Want to improve something?

1. Check [Documentation Standards](standards/documentation-standards.md)
2. Follow the document structure template
3. Submit a PR with your changes
4. Update this README if adding new sections

## 📞 Need Help?

- Check [Troubleshooting](troubleshooting/) section first
- Review [FAQ](troubleshooting/faq.md)
- Ask in team chat/Slack
- Create an issue in the project board

---

**Last Updated**: 2025-11-07

**Tip**: Use Cmd/Ctrl + F to search for keywords in this navigation page!
