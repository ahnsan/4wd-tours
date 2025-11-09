# Documentation Standards - World Class

## Overview
This document defines the mandatory standards for organizing all documentation in the med-usa-4wd project.

## Documentation Principles

### 🎯 Core Principles
1. **Discoverability** - Anyone should find what they need in < 30 seconds
2. **Consistency** - All docs follow the same structure and style
3. **Maintainability** - Docs are easy to update and refactor
4. **Clarity** - Technical accuracy with plain language
5. **Completeness** - No orphaned or incomplete documentation

## Folder Structure - MANDATORY

```
docs/
├── README.md                          # Navigation hub for all docs
├── getting-started/                   # Onboarding documentation
│   ├── installation.md
│   ├── local-development.md
│   └── first-deployment.md
├── architecture/                      # System design documents
│   ├── overview.md
│   ├── backend-architecture.md
│   ├── storefront-architecture.md
│   └── database-schema.md
├── standards/                         # Development standards
│   ├── medusa-development-guide.md
│   ├── project-organization.md
│   ├── documentation-standards.md
│   ├── code-style-guide.md
│   └── testing-standards.md
├── api/                               # API documentation
│   ├── overview.md
│   ├── authentication.md
│   ├── endpoints/
│   │   ├── products.md
│   │   ├── orders.md
│   │   └── customers.md
│   └── webhooks.md
├── guides/                            # How-to guides
│   ├── adding-custom-routes.md
│   ├── creating-workflows.md
│   ├── customizing-admin.md
│   └── integrating-payment-providers.md
├── deployment/                        # Deployment documentation
│   ├── production-checklist.md
│   ├── environment-variables.md
│   ├── scaling-guide.md
│   └── monitoring.md
├── troubleshooting/                   # Problem-solving docs
│   ├── common-errors.md
│   ├── debugging-guide.md
│   └── faq.md
└── adr/                              # Architecture Decision Records
    ├── 001-choosing-medusa.md
    ├── 002-database-selection.md
    └── template.md
```

## File Naming Standards

### Rules
- Use `kebab-case` for all filenames (e.g., `deployment-guide.md`)
- Be descriptive but concise (max 40 characters)
- Use `.md` extension for all markdown files
- No spaces, special characters, or capitals in filenames

### Examples
✅ Good:
- `getting-started.md`
- `api-authentication.md`
- `troubleshooting-database-errors.md`

❌ Bad:
- `Getting Started.md` (spaces, capitals)
- `api_authentication.md` (underscores)
- `troubleshooting.md` (too vague)
- `troubleshooting_database_connection_timeout_errors_and_solutions.md` (too long)

## Document Structure Template

Every document must follow this structure:

```markdown
# Document Title

## Overview
Brief description (2-3 sentences) of what this document covers.

## Table of Contents (if > 3 sections)
- [Section 1](#section-1)
- [Section 2](#section-2)

## Prerequisites (if applicable)
What the reader needs to know or have before proceeding.

## Main Content
Organized in logical sections with clear headings.

## Examples (if applicable)
Code examples with explanations.

## Troubleshooting (if applicable)
Common issues and solutions.

## Related Documentation
Links to related docs.

## Last Updated
Date: YYYY-MM-DD
By: [Author name or role]
```

## Writing Style Guide

### Language
- Use active voice ("Click the button" not "The button should be clicked")
- Use present tense ("The API returns" not "The API will return")
- Be concise but complete
- Avoid jargon; define technical terms

### Code Examples
- Always include working code examples
- Add comments to explain complex parts
- Show both the code and expected output
- Use syntax highlighting (```typescript, ```bash, etc.)

### Links
- Use relative links for internal docs (`[Guide](../guides/setup.md)`)
- Use absolute links for external docs
- Keep link text descriptive ("See the [Medusa installation guide]" not "click here")

## Documentation Types

### 1. Tutorials
- Step-by-step instructions
- Assume no prior knowledge
- Include screenshots/diagrams
- Test with a fresh user

### 2. Guides
- Task-oriented
- Assume basic knowledge
- Focus on how-to accomplish specific goals
- Include troubleshooting

### 3. Reference
- Complete and accurate
- Organized alphabetically or logically
- Include all parameters/options
- Link to related references

### 4. Architecture Decision Records (ADR)
- Document important decisions
- Include context, options considered, decision, consequences
- Immutable (never delete, only supersede)

## Maintenance Rules

### Review Schedule
- **Critical docs** (getting-started, installation): Monthly
- **Standard docs** (guides, API): Quarterly
- **Reference docs**: On every relevant code change

### Deprecation Process
1. Mark doc with `[DEPRECATED]` prefix in title
2. Add deprecation notice at top with replacement link
3. Move to `docs/deprecated/` after 90 days
4. Delete after 180 days (if no dependencies)

### Version Control
- All docs in git
- Update docs in same PR as code changes
- Use meaningful commit messages for doc changes
- Review doc changes in PRs

## Quality Checklist

Before merging any documentation:
- [ ] Filename follows naming standards
- [ ] Document follows structure template
- [ ] All links work (internal and external)
- [ ] Code examples are tested and working
- [ ] Grammar and spelling checked
- [ ] Technical accuracy verified
- [ ] "Last Updated" field is current
- [ ] Related docs are linked

## Anti-Patterns to Avoid

❌ **Don't:**
- Create docs in root directory
- Use generic names (doc.md, notes.md, temp.md)
- Leave TODOs in committed docs
- Copy-paste without updating
- Create docs without updating docs/README.md
- Use absolute file paths in examples
- Include sensitive data (API keys, passwords)

✅ **Do:**
- Organize docs in appropriate subfolder
- Use descriptive names
- Complete docs before committing
- Customize examples for our project
- Keep docs/README.md navigation updated
- Use relative paths or environment variables
- Use placeholder values

## Tools and Automation

### Linting
- Use markdownlint for consistency
- Enforce in CI/CD pipeline

### Link Checking
- Automated link checking in CI/CD
- Fix broken links immediately

### Search
- Documentation should be searchable
- Consider adding search to docs site

## Migration Path

If you find docs violating these standards:
1. Create an issue
2. Refactor to match standards
3. Update links pointing to old location
4. Remove old files

## Last Updated
Date: 2025-11-07
By: Documentation Standards Expert
