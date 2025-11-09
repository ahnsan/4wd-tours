# Medusa Development Guide

## Overview
This guide provides mandatory standards for all Medusa-related development in the med-usa-4wd project.

## Official Documentation Sources

### LLM-Optimized Documentation
- **Full Documentation**: https://docs.medusajs.com/llms-full.txt
- **Concise Version**: https://docs.medusajs.com/llms.txt
- **Markdown Pages**: Append `/index.html.md` to any docs URL

### Key Documentation Sections
- Getting Started: https://docs.medusajs.com/learn/installation/index.html.md
- Customization: https://docs.medusajs.com/learn/customization/index.html.md
- Storefront Development: https://docs.medusajs.com/resources/storefront-development/index.html.md
- Admin Customization: https://docs.medusajs.com/resources/admin-development/index.html.md
- Commerce Modules: https://docs.medusajs.com/learn/fundamentals/modules/commerce-modules/index.html.md

## Project Structure Standards

### Backend (Medusa Server)
```
src/
├── api/              # Custom API routes
├── admin/            # Admin customizations
├── subscribers/      # Event subscribers
├── workflows/        # Custom workflows
├── modules/          # Custom modules
└── scripts/          # Utility scripts
```

### Storefront
```
storefront/
├── app/              # Next.js App Router pages
├── components/       # React components
├── lib/              # Utility functions and Medusa client
└── styles/           # Styling files
```

## Development Patterns

### 1. Creating Custom Routes
Always use Medusa's route pattern:
```typescript
// src/api/[scope]/[resource]/route.ts
import { MedusaRequest, MedusaResponse } from "@medusajs/framework"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  // Implementation
}
```

### 2. Using Services
Always use dependency injection:
```typescript
import { MedusaRequest, MedusaResponse } from "@medusajs/framework"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const productService = req.scope.resolve("productService")
  const products = await productService.list()
  res.json({ products })
}
```

### 3. Creating Workflows
Use Medusa's workflow system for complex operations:
```typescript
import { createWorkflow } from "@medusajs/framework/workflows"

export const myCustomWorkflow = createWorkflow(
  "my-custom-workflow",
  function (input) {
    // Workflow steps
  }
)
```

## Testing Standards

- Test all custom routes
- Test all custom workflows
- Test all admin customizations
- Use Medusa's testing utilities

## Documentation Requirements

Every custom Medusa feature must have:
- Purpose and use case
- API endpoint documentation (if applicable)
- Example usage
- Dependencies
- Testing instructions

## Resources

- Official Docs: https://docs.medusajs.com
- GitHub: https://github.com/medusajs/medusa
- Discord: https://discord.gg/medusajs
