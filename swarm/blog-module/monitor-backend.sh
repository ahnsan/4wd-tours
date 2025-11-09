#!/bin/bash

# Monitor Backend Agent Progress for Blog Module
# Database Agent uses this to check if Backend Agent has created data models

BLOG_MODULE_DIR="/Users/Karim/med-usa-4wd/src/modules/blog"
STATUS_FILE="/Users/Karim/med-usa-4wd/swarm/blog-module/backend-implementation/status.md"
READY_FILE="/Users/Karim/med-usa-4wd/swarm/blog-module/backend-implementation/ready.md"

echo "==================================="
echo "Blog Module Backend Monitor"
echo "==================================="
echo ""

# Check if blog module directory exists
if [ -d "$BLOG_MODULE_DIR" ]; then
    echo "✅ Blog module directory exists: $BLOG_MODULE_DIR"
    echo ""
    echo "Files in blog module:"
    ls -lah "$BLOG_MODULE_DIR"
    echo ""

    # Check for models directory
    if [ -d "$BLOG_MODULE_DIR/models" ]; then
        echo "✅ Models directory exists"
        echo "Model files:"
        ls -lah "$BLOG_MODULE_DIR/models/"
        echo ""
    else
        echo "⏳ Models directory not found yet"
    fi

    # Check for index.ts
    if [ -f "$BLOG_MODULE_DIR/index.ts" ]; then
        echo "✅ Module index.ts exists"
    else
        echo "⏳ Module index.ts not found yet"
    fi

    echo ""
    echo "🎯 Blog module structure detected!"
    echo "Database Agent can proceed with migration generation."

else
    echo "⏳ Blog module directory does not exist yet: $BLOG_MODULE_DIR"
    echo ""
    echo "Waiting for Backend Agent to create data models..."
    echo ""
    echo "Expected structure:"
    echo "  $BLOG_MODULE_DIR/"
    echo "  ├── models/"
    echo "  │   ├── blog-post.ts"
    echo "  │   ├── blog-category.ts"
    echo "  │   └── blog-tag.ts"
    echo "  ├── index.ts"
    echo "  └── service.ts (optional)"
fi

echo ""
echo "==================================="
echo "Coordination Status"
echo "==================================="

# Check for ready signal
if [ -f "$READY_FILE" ]; then
    echo "✅ Backend Agent has signaled ready"
    cat "$READY_FILE"
else
    echo "⏳ No ready signal yet from Backend Agent"
fi

echo ""
echo "Last status update:"
if [ -f "$STATUS_FILE" ]; then
    echo "---"
    cat "$STATUS_FILE" | head -20
fi

echo ""
echo "==================================="
echo "To proceed with migrations:"
echo "  npx medusa db:generate blog"
echo "  npx medusa db:migrate"
echo "==================================="
