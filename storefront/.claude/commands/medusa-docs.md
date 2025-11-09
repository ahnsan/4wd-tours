# Medusa Documentation Helper

You are helping with a Medusa.js project. The user needs quick access to official Medusa documentation.

## Official Documentation Sources

**Primary Resources:**
- Full documentation text: https://docs.medusajs.com/llms-full.txt
- Concise documentation: https://docs.medusajs.com/llms.txt
- Any page as markdown: Add `/index.html.md` to any URL

## Common Documentation Topics

### Core Topics
- **Installation**: https://docs.medusajs.com/learn/installation/index.html.md
- **Customization**: https://docs.medusajs.com/learn/customization/index.html.md
- **Commerce Modules**: https://docs.medusajs.com/learn/fundamentals/modules/commerce-modules/index.html.md
- **Workflows**: https://docs.medusajs.com/learn/fundamentals/workflows/index.html.md

### Development Resources
- **Storefront Development**: https://docs.medusajs.com/resources/storefront-development/index.html.md
- **Admin Development**: https://docs.medusajs.com/resources/admin-development/index.html.md
- **API Routes**: https://docs.medusajs.com/learn/customization/custom-features/api-route/index.html.md
- **Data Models**: https://docs.medusajs.com/learn/fundamentals/data-models/index.html.md

## How to Use Documentation

### 1. Fetch Specific Documentation
Use the WebFetch tool to retrieve documentation content:

```
WebFetch("https://docs.medusajs.com/llms.txt", "Find information about [specific topic]")
```

### 2. Get Detailed Page Content
For specific pages, add `/index.html.md` to the URL:

```
WebFetch("https://docs.medusajs.com/learn/customization/index.html.md", "Show me how to customize Medusa")
```

## CRITICAL REMINDERS

**ALWAYS:**
- Check official Medusa documentation BEFORE implementing features
- Follow Medusa patterns and conventions EXACTLY
- Use Medusa's built-in features and modules when available
- Verify implementation against official examples

**NEVER:**
- Create custom implementations when Medusa provides the feature
- Deviate from Medusa patterns without justification
- Assume functionality without checking docs first

## Local Documentation

This project also has local standards documentation:
- **Medusa Development Guide**: `docs/standards/medusa-development-guide.md`

Check local docs for project-specific patterns and standards.

## Next Steps

1. If you know the specific topic, use WebFetch to retrieve relevant documentation
2. Review the documentation carefully before implementing
3. Follow Medusa patterns exactly as documented
4. Verify your implementation matches official examples

**What documentation topic do you need help with?**
