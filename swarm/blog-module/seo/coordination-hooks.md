# Blog Module SEO - Coordination Hooks

**Purpose**: Enable swarm agents to coordinate on blog SEO tasks
**Memory Location**: `swarm/blog-module/seo`

## Coordination Commands

### For Blog Content Agents

When creating or updating blog posts:

```bash
# 1. Before starting work
npx claude-flow@alpha hooks pre-task --description "Creating blog post: [post-title]"
npx claude-flow@alpha hooks session-restore --session-id "swarm-blog-seo"

# 2. After creating blog post content
npx claude-flow@alpha hooks post-edit --file "app/blog/[slug]/page.tsx" --memory-key "swarm/blog-module/seo/posts/[slug]"

# 3. Notify SEO agent
npx claude-flow@alpha hooks notify --message "New blog post created: [post-title] at /blog/[slug]"

# 4. Complete task
npx claude-flow@alpha hooks post-task --task-id "blog-content-[slug]"
```

### For SEO Agents

When updating SEO metadata:

```bash
# 1. Before updating metadata
npx claude-flow@alpha hooks pre-edit --file "app/blog/[slug]/page.tsx" --description "Updating SEO metadata"

# 2. After metadata update
npx claude-flow@alpha hooks post-edit --file "app/blog/[slug]/page.tsx" --memory-key "swarm/blog-module/seo/metadata/[slug]"

# 3. Store metadata in memory
npx claude-flow@alpha hooks memory-store --key "swarm/blog-module/seo/metadata/[slug]" --value "{title, description, keywords}"

# 4. Notify other agents
npx claude-flow@alpha hooks notify --message "SEO metadata updated for: [post-title]"
```

### For Sitemap Agents

When updating sitemap:

```bash
# 1. Before updating sitemap
npx claude-flow@alpha hooks pre-edit --file "app/sitemap.ts" --description "Adding blog posts to sitemap"

# 2. After sitemap update
npx claude-flow@alpha hooks post-edit --file "app/sitemap.ts" --memory-key "swarm/blog-module/seo/sitemap-updated"

# 3. Validate sitemap
npx claude-flow@alpha hooks validate --file "app/sitemap.ts" --type "sitemap"

# 4. Complete task
npx claude-flow@alpha hooks post-task --task-id "sitemap-blog-integration"
```

## Memory Structure

### Blog Post Metadata
**Key**: `swarm/blog-module/seo/posts/[slug]`

**Value**:
```json
{
  "slug": "post-slug",
  "title": "Post Title (50-60 chars)",
  "description": "Meta description (150-160 chars)",
  "keywords": ["keyword1", "keyword2"],
  "publishedAt": "2025-01-15T08:00:00+10:00",
  "modifiedAt": "2025-01-20T14:30:00+10:00",
  "author": "Author Name",
  "category": "Category Name",
  "priority": 0.8,
  "seoValidated": true,
  "performanceScore": 95
}
```

### Sitemap Status
**Key**: `swarm/blog-module/seo/sitemap-status`

**Value**:
```json
{
  "totalPosts": 4,
  "lastUpdated": "2025-11-07T12:00:00+10:00",
  "posts": [
    "best-4wd-tracks-sunshine-coast-2025",
    "rainbow-beach-vs-fraser-island",
    "first-time-4wd-adventure-guide",
    "sunshine-coast-weather-guide-4wd"
  ],
  "validated": true
}
```

### SEO Validation Results
**Key**: `swarm/blog-module/seo/validation/[slug]`

**Value**:
```json
{
  "slug": "post-slug",
  "validatedAt": "2025-11-07T12:00:00+10:00",
  "results": {
    "richResultsTest": "passed",
    "schemaValidation": "passed",
    "openGraphValidation": "passed",
    "twitterCardValidation": "passed",
    "pagespeedDesktop": 95,
    "pagespeedMobile": 93,
    "errors": [],
    "warnings": []
  }
}
```

## Coordination Patterns

### Pattern 1: New Blog Post Creation

**Sequence**:
1. Content Agent creates blog post
2. Content Agent stores post data in memory
3. Content Agent notifies SEO Agent
4. SEO Agent reads memory
5. SEO Agent validates metadata
6. SEO Agent updates sitemap
7. SEO Agent stores validation results
8. SEO Agent notifies completion

### Pattern 2: Blog Post Update

**Sequence**:
1. Content Agent updates blog post
2. Content Agent updates memory with new modifiedAt
3. Content Agent notifies SEO Agent
4. SEO Agent reads memory
5. SEO Agent validates metadata changes
6. SEO Agent updates sitemap lastModified
7. SEO Agent stores new validation results
8. SEO Agent notifies completion

### Pattern 3: Sitemap Regeneration

**Sequence**:
1. Sitemap Agent triggers regeneration
2. Sitemap Agent reads all blog posts from memory
3. Sitemap Agent generates sitemap entries
4. Sitemap Agent validates sitemap structure
5. Sitemap Agent stores sitemap status
6. Sitemap Agent notifies all agents

## Agent Responsibilities

### Content Creation Agent
- Create blog post content
- Provide initial metadata (title, description)
- Store post data in memory
- Notify SEO Agent of new content

### SEO Agent (This Agent)
- Generate SEO metadata
- Create structured data
- Validate all SEO elements
- Update sitemap
- Store validation results
- Coordinate with other agents

### Testing Agent
- Run SEO validation tools
- Test structured data
- Check PageSpeed scores
- Validate metadata compliance
- Report issues

### Frontend Agent
- Implement blog UI components
- Ensure proper HTML structure
- Implement responsive design
- Optimize images
- Follow accessibility guidelines

## Validation Commands

### Check Metadata Compliance
```bash
# Store validation request
npx claude-flow@alpha hooks memory-store --key "swarm/blog-module/seo/validation-request" --value "{slug: 'post-slug', agent: 'seo-agent'}"

# Testing agent reads request and validates
npx claude-flow@alpha hooks memory-retrieve --key "swarm/blog-module/seo/validation-request"

# Testing agent stores results
npx claude-flow@alpha hooks memory-store --key "swarm/blog-module/seo/validation/post-slug" --value "{results}"
```

### Check Sitemap Status
```bash
# Retrieve sitemap status
npx claude-flow@alpha hooks memory-retrieve --key "swarm/blog-module/seo/sitemap-status"

# If sitemap needs update, store request
npx claude-flow@alpha hooks memory-store --key "swarm/blog-module/seo/sitemap-update-needed" --value "true"
```

## Session Management

### Start SEO Session
```bash
npx claude-flow@alpha hooks session-start --session-id "swarm-blog-seo" --agent "seo-agent"
```

### End SEO Session
```bash
npx claude-flow@alpha hooks session-end --session-id "swarm-blog-seo" --export-metrics true
```

### Restore SEO Context
```bash
npx claude-flow@alpha hooks session-restore --session-id "swarm-blog-seo"
```

## Performance Tracking

### Store Performance Metrics
```bash
npx claude-flow@alpha hooks memory-store --key "swarm/blog-module/seo/performance/[slug]" --value "{
  pagespeedDesktop: 95,
  pagespeedMobile: 93,
  lcp: 2.1,
  fid: 85,
  cls: 0.05,
  timestamp: '2025-11-07T12:00:00+10:00'
}"
```

### Retrieve Performance History
```bash
npx claude-flow@alpha hooks memory-retrieve --key "swarm/blog-module/seo/performance/*"
```

## Error Handling

### Store SEO Errors
```bash
npx claude-flow@alpha hooks memory-store --key "swarm/blog-module/seo/errors/[slug]" --value "{
  error: 'Title too long (65 characters)',
  severity: 'high',
  file: 'app/blog/[slug]/page.tsx',
  line: 45,
  timestamp: '2025-11-07T12:00:00+10:00'
}"
```

### Notify Errors
```bash
npx claude-flow@alpha hooks notify --message "SEO Error: [error-description]" --level "error"
```

## Next Agent Instructions

When you receive a notification about blog content:

1. Check memory for post data:
   ```bash
   npx claude-flow@alpha hooks memory-retrieve --key "swarm/blog-module/seo/posts/[slug]"
   ```

2. Validate metadata compliance with docs/seo/ requirements

3. Update if needed and store results:
   ```bash
   npx claude-flow@alpha hooks memory-store --key "swarm/blog-module/seo/validation/[slug]" --value "{results}"
   ```

4. Notify completion:
   ```bash
   npx claude-flow@alpha hooks notify --message "SEO validation complete for: [post-title]"
   ```

## Status: READY FOR AGENT COORDINATION

All coordination hooks are documented and ready for use by swarm agents.
