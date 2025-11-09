# Swarm Coordination Hooks

This document describes how to use coordination hooks with the blog-product integration.

## Overview

The integration uses Claude Flow hooks for distributed coordination between agents working on different parts of the system.

## Hook Types

### 1. Pre-Task Hooks

Run before starting any task:

```bash
npx claude-flow@alpha hooks pre-task \
  --description "Implementing blog post creation with product linking"
```

### 2. Session Restore

Restore context from previous sessions:

```bash
npx claude-flow@alpha hooks session-restore \
  --session-id "swarm-blog-integration"
```

### 3. Post-Edit Hooks

Track file changes and store in memory:

```bash
npx claude-flow@alpha hooks post-edit \
  --file "src/modules/blog/models/post.ts" \
  --memory-key "swarm/blog-module/backend-implementation"
```

### 4. Notify Hooks

Coordinate between agents:

```bash
npx claude-flow@alpha hooks notify \
  --message "Blog module backend completed, ready for frontend integration"
```

### 5. Post-Task Hooks

Mark task completion:

```bash
npx claude-flow@alpha hooks post-task \
  --task-id "blog-product-linking-integration"
```

### 6. Session End

Export metrics and close session:

```bash
npx claude-flow@alpha hooks session-end \
  --export-metrics true
```

## Memory Storage

### Store Implementation Details

```bash
# Store backend implementation
npx claude-flow@alpha hooks post-edit \
  --file "src/modules/blog/service.ts" \
  --memory-key "swarm/blog-module/backend-implementation"

# Store API routes
npx claude-flow@alpha hooks post-edit \
  --file "src/api/store/posts/route.ts" \
  --memory-key "swarm/blog-module/api-routes"

# Store frontend components
npx claude-flow@alpha hooks post-edit \
  --file "storefront/components/Blog/LinkedProducts.tsx" \
  --memory-key "swarm/blog-module/frontend-components"

# Store integration summary
npx claude-flow@alpha hooks post-edit \
  --file "docs/integration/blog-product-linking.md" \
  --memory-key "swarm/blog-module/integration"
```

### Retrieve from Memory

```bash
# Get implementation details
npx claude-flow@alpha memory retrieve \
  --key "swarm/blog-module/backend-implementation"

# Get integration docs
npx claude-flow@alpha memory retrieve \
  --key "swarm/blog-module/integration"
```

## Integration Workflow

### Phase 1: Backend Development

```bash
# Start session
npx claude-flow@alpha hooks pre-task \
  --description "Blog module backend development"

# Create module
# ... implement models, services, etc.

# Track progress
npx claude-flow@alpha hooks post-edit \
  --file "src/modules/blog/models/post.ts" \
  --memory-key "swarm/blog-module/backend-implementation"

# Notify completion
npx claude-flow@alpha hooks notify \
  --message "Backend module completed"
```

### Phase 2: API Development

```bash
# Continue session
npx claude-flow@alpha hooks session-restore \
  --session-id "swarm-blog-integration"

# Create API routes
# ... implement store and admin routes

# Track progress
npx claude-flow@alpha hooks post-edit \
  --file "src/api/store/posts/route.ts" \
  --memory-key "swarm/blog-module/api-routes"
```

### Phase 3: Frontend Development

```bash
# Create components
# ... implement LinkedProducts, BlogPost

# Track progress
npx claude-flow@alpha hooks post-edit \
  --file "storefront/components/Blog/LinkedProducts.tsx" \
  --memory-key "swarm/blog-module/frontend-components"

# Complete task
npx claude-flow@alpha hooks post-task \
  --task-id "blog-product-linking-integration"

# End session
npx claude-flow@alpha hooks session-end \
  --export-metrics true
```

## Coordination Patterns

### Parallel Development

Multiple agents can work simultaneously:

```bash
# Agent 1: Backend
Task("Backend Developer", "Implement blog module", "backend-dev")

# Agent 2: Frontend
Task("Frontend Developer", "Create React components", "coder")

# Agent 3: Documentation
Task("Technical Writer", "Document integration", "researcher")
```

Each agent uses hooks to coordinate:

```bash
# Backend agent
npx claude-flow@alpha hooks notify \
  --message "Blog service API ready for frontend integration"

# Frontend agent (checks memory)
npx claude-flow@alpha memory retrieve \
  --key "swarm/blog-module/backend-implementation"
```

### Sequential Dependencies

For tasks that must complete in order:

```bash
# Step 1: Model definition
npx claude-flow@alpha hooks pre-task \
  --description "Define Post model"
# ... implement
npx claude-flow@alpha hooks post-task --task-id "model-definition"

# Step 2: Service implementation
npx claude-flow@alpha hooks pre-task \
  --description "Implement blog service" \
  --depends-on "model-definition"
# ... implement
npx claude-flow@alpha hooks post-task --task-id "service-implementation"
```

## Best Practices

1. **Always use pre-task hooks** before starting work
2. **Store all significant changes** in memory with descriptive keys
3. **Notify other agents** when completing major milestones
4. **Use consistent session IDs** for related work
5. **Export metrics** at the end of each session
6. **Check memory** before starting to avoid duplicate work

## Memory Keys Convention

Use hierarchical keys:

```
swarm/
  blog-module/
    backend-implementation
    api-routes
    frontend-components
    admin-ui
    integration
    migrations
```

## Troubleshooting

### Hooks not working

```bash
# Check Claude Flow installation
npx claude-flow@alpha --version

# Verify MCP server
claude mcp status
```

### Memory not persisting

```bash
# Check memory database
ls -la .swarm/memory.db

# Verify memory entries
npx claude-flow@alpha memory list
```

### Session conflicts

```bash
# List active sessions
npx claude-flow@alpha swarm status

# End conflicting sessions
npx claude-flow@alpha hooks session-end --session-id "old-session"
```

## Advanced Features

### Neural Training

Train patterns from successful implementations:

```bash
npx claude-flow@alpha neural train \
  --pattern "blog-product-linking" \
  --success true
```

### Performance Metrics

Track implementation metrics:

```bash
npx claude-flow@alpha hooks session-end \
  --export-metrics true \
  --output "metrics/blog-integration.json"
```

### Automatic Topology Selection

Let Claude Flow choose optimal coordination:

```bash
npx claude-flow@alpha swarm init \
  --auto-topology true \
  --complexity "medium"
```
