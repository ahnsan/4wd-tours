# Project Organization Standards

## Root Directory Rules - MANDATORY

### Golden Rule
**The root directory should contain ONLY essential configuration files and top-level folders.**

### Allowed in Root Directory

**Configuration Files Only:**
- `package.json` - Project dependencies
- `medusa-config.ts` - Medusa configuration
- `tsconfig.json` - TypeScript configuration
- `.env` - Environment variables (git-ignored)
- `.gitignore` - Git ignore rules
- `.eslintrc` / `.prettierrc` - Code style configs
- `README.md` - Project overview ONLY
- `CLAUDE.md` - Claude Flow configuration
- `.mcp.json` - MCP server configuration

**Top-Level Directories Only:**
- `src/` - Backend source code
- `storefront/` - Frontend application
- `docs/` - All documentation (see documentation-standards.md)
- `.claude/` - Claude Flow configuration
- `.hive-mind/` - Hive mind database
- `.swarm/` - Swarm memory
- `node_modules/` - Dependencies (git-ignored)
- `data/` - Database files (git-ignored)

### NEVER in Root Directory

**Prohibited:**
- Working files (temp.txt, test.js, scratch.md)
- Test files (test.ts, demo.js)
- Documentation files (use docs/ folder)
- Data files (use data/ folder)
- Image files (use public/ or assets/ folder)
- Log files (use logs/ folder, git-ignored)
- Build artifacts (use .gitignore)
- Personal notes or TODOs (use docs/notes/ or issues)

## Directory Organization Standards

### Source Code (`src/`)
```
src/
├── api/              # API routes (RESTful endpoints)
├── admin/            # Admin panel customizations
├── subscribers/      # Event subscribers
├── workflows/        # Business logic workflows
├── modules/          # Custom Medusa modules
├── scripts/          # Utility scripts
└── types/            # TypeScript type definitions
```

### Storefront (`storefront/`)
```
storefront/
├── app/              # Next.js pages (App Router)
├── components/       # React components
│   ├── common/      # Shared components
│   ├── layout/      # Layout components
│   └── features/    # Feature-specific components
├── lib/              # Utilities and API clients
├── styles/           # CSS/styling files
├── public/           # Static assets
│   ├── images/      # Image files
│   └── fonts/       # Font files
└── types/            # TypeScript types
```

### Data Directory (`data/`)
```
data/               # Git-ignored
├── uploads/        # User-uploaded files
├── exports/        # Exported data
└── backups/        # Database backups
```

## File Naming Conventions

### Backend Files
- Routes: `route.ts`
- Services: `[name].service.ts`
- Workflows: `[name].workflow.ts`
- Subscribers: `[name].subscriber.ts`
- Types: `[name].types.ts`

### Frontend Files
- Components: `PascalCase.tsx` (e.g., `ProductCard.tsx`)
- Pages: `page.tsx` (Next.js App Router)
- Utilities: `camelCase.ts` (e.g., `formatPrice.ts`)
- Styles: `[component].module.css`

## Cleanup Checklist

Run this checklist weekly:
- [ ] No files in root except allowed configs
- [ ] All docs in `docs/` folder
- [ ] All images in appropriate folders
- [ ] No temporary or test files
- [ ] All working files moved to correct locations
- [ ] .gitignore covers all generated files
- [ ] No duplicate files

## Automation

Add to `.gitignore`:
```
# Prevent root directory pollution
/*.txt
/*.md
!README.md
!CLAUDE.md
/temp*
/test*
/scratch*
*.log
*.tmp
```

## Enforcement

- Code reviews must check root directory cleanliness
- CI/CD should validate root directory structure
- Pre-commit hooks can warn about root directory additions

## Best Practices

### 1. Configuration Management
- Keep all environment-specific configs in `.env` files
- Use `.env.example` to document required environment variables
- Never commit sensitive data to version control

### 2. Documentation Organization
- Technical docs go in `docs/technical/`
- API docs go in `docs/api/`
- Standards and guidelines go in `docs/standards/`
- User guides go in `docs/guides/`
- Keep README.md concise - link to detailed docs

### 3. Asset Management
- Images: Store in `storefront/public/images/` or `public/assets/images/`
- Organize by feature or category: `images/products/`, `images/banners/`
- Optimize all images before committing
- Use descriptive names: `product-hero-banner.jpg` not `img1.jpg`

### 4. Code Organization
- One feature per directory
- Group related files together
- Keep components small and focused
- Use barrel exports (`index.ts`) for clean imports

### 5. Dependency Management
- Regularly audit and update dependencies
- Remove unused dependencies
- Document why specific versions are pinned
- Use `npm ci` in CI/CD for reproducible builds

## Migration Guide

If your project currently has root directory clutter:

1. **Audit Current State**
   ```bash
   ls -la | grep -v -E '(^d|node_modules|.git)'
   ```

2. **Create Proper Structure**
   ```bash
   mkdir -p docs/{technical,api,standards,guides,notes}
   mkdir -p data/{uploads,exports,backups}
   mkdir -p storefront/public/{images,fonts}
   ```

3. **Move Files**
   - Documentation: `mv *.md docs/` (except README.md, CLAUDE.md)
   - Data files: `mv *.json *.csv data/exports/`
   - Images: `mv *.png *.jpg storefront/public/images/`
   - Temporary files: Delete or move to appropriate location

4. **Update .gitignore**
   - Add patterns to prevent future pollution
   - Commit the updated .gitignore

5. **Update References**
   - Search codebase for hardcoded paths
   - Update import statements
   - Update documentation links

## Validation Script

Create `scripts/validate-structure.js`:
```javascript
const fs = require('fs');
const path = require('path');

const ALLOWED_ROOT_FILES = [
  'package.json',
  'package-lock.json',
  'medusa-config.ts',
  'tsconfig.json',
  '.env',
  '.env.example',
  '.gitignore',
  '.eslintrc',
  '.eslintrc.js',
  '.eslintrc.json',
  '.prettierrc',
  '.prettierrc.js',
  '.prettierrc.json',
  'README.md',
  'CLAUDE.md',
  '.mcp.json',
];

const ALLOWED_ROOT_DIRS = [
  'src',
  'storefront',
  'docs',
  '.claude',
  '.hive-mind',
  '.swarm',
  'node_modules',
  'data',
  '.git',
];

const rootContents = fs.readdirSync('.');
const violations = [];

rootContents.forEach(item => {
  const stat = fs.statSync(item);
  const isFile = stat.isFile();
  const isDir = stat.isDirectory();

  if (isFile && !ALLOWED_ROOT_FILES.includes(item)) {
    violations.push(`Unauthorized file in root: ${item}`);
  }
  if (isDir && !ALLOWED_ROOT_DIRS.includes(item)) {
    violations.push(`Unauthorized directory in root: ${item}`);
  }
});

if (violations.length > 0) {
  console.error('Root directory violations found:');
  violations.forEach(v => console.error(`  - ${v}`));
  process.exit(1);
} else {
  console.log('Root directory structure is clean!');
}
```

Run with: `node scripts/validate-structure.js`

## Common Anti-Patterns to Avoid

### 1. "Temporary" Files in Root
```
❌ BAD:
/temp-fix.js
/test-feature.ts
/scratch.md

✅ GOOD:
docs/notes/temp-feature-notes.md
src/scripts/one-off-migration.ts (properly organized)
```

### 2. Multiple Config Files for Same Tool
```
❌ BAD:
/.eslintrc
/.eslintrc.json
/eslint.config.js

✅ GOOD:
/.eslintrc.json (pick one format)
```

### 3. Data Files in Root
```
❌ BAD:
/users.json
/products.csv
/backup.sql

✅ GOOD:
data/exports/users.json
data/exports/products.csv
data/backups/backup-2025-11-07.sql
```

### 4. Documentation Sprawl
```
❌ BAD:
/README.md
/API.md
/SETUP.md
/DEPLOYMENT.md
/CONTRIBUTING.md

✅ GOOD:
/README.md (overview only, links to docs/)
docs/api/README.md
docs/guides/setup.md
docs/guides/deployment.md
docs/contributing.md
```

## Summary

A clean root directory:
- Makes the project more professional
- Improves navigation and discovery
- Reduces confusion for new developers
- Makes automation easier
- Prevents accidental commits of sensitive files
- Demonstrates attention to detail and quality

**Remember:** Every file in the root directory should justify its existence. When in doubt, put it in a subdirectory.
