#!/bin/bash

# Medusa LLM Documentation Update Script
# This script downloads the latest Medusa LLM documentation
# Run this weekly to keep documentation up-to-date

set -e

# Configuration
DOCS_DIR="$(dirname "$0")/../docs/medusa-llm"
TIMESTAMP=$(date +"%Y-%m-%d_%H-%M-%S")
LOG_FILE="$DOCS_DIR/update-log.txt"

# Create docs directory if it doesn't exist
mkdir -p "$DOCS_DIR"

# Log function
log() {
    echo "[$(date +"%Y-%m-%d %H:%M:%S")] $1" | tee -a "$LOG_FILE"
}

log "Starting Medusa documentation update..."

# Download full text version
log "Downloading llms-full.txt..."
if curl -f -o "$DOCS_DIR/medusa-llms-full.txt" "https://docs.medusajs.com/llms-full.txt"; then
    log "✅ Successfully downloaded llms-full.txt"
else
    log "❌ Failed to download llms-full.txt"
fi

# Download concise version
log "Downloading llms.txt..."
if curl -f -o "$DOCS_DIR/medusa-llms.txt" "https://docs.medusajs.com/llms.txt"; then
    log "✅ Successfully downloaded llms.txt"
else
    log "❌ Failed to download llms.txt"
fi

# Download key documentation pages as Markdown
log "Downloading key documentation pages..."

# Array of important documentation pages
declare -a DOCS_PAGES=(
    "learn/introduction/build-with-llms-ai"
    "learn/introduction/architecture"
    "learn/fundamentals/modules/commerce-modules"
    "learn/installation"
    "learn/basics/workflows"
    "learn/basics/events-and-subscribers"
    "learn/basics/api-routes"
    "learn/basics/admin-customizations"
)

for page in "${DOCS_PAGES[@]}"; do
    # Extract filename from path
    filename=$(echo "$page" | tr '/' '-')

    log "Downloading $page..."
    if curl -f -o "$DOCS_DIR/$filename.md" "https://docs.medusajs.com/$page/index.html.md"; then
        log "✅ Downloaded $filename.md"
    else
        log "⚠️  Failed to download $page"
    fi
done

# Create backup of previous version
if [ -f "$DOCS_DIR/medusa-llms-full.txt" ]; then
    BACKUP_DIR="$DOCS_DIR/backups"
    mkdir -p "$BACKUP_DIR"

    # Keep only last 3 backups
    find "$BACKUP_DIR" -name "medusa-llms-full-*.txt" -type f | sort -r | tail -n +4 | xargs rm -f 2>/dev/null || true

    log "Creating backup of previous version..."
    cp "$DOCS_DIR/medusa-llms-full.txt" "$BACKUP_DIR/medusa-llms-full-$TIMESTAMP.txt" 2>/dev/null || true
fi

# Create metadata file with update information
cat > "$DOCS_DIR/metadata.json" <<EOF
{
  "lastUpdate": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
  "timestamp": "$TIMESTAMP",
  "version": "$(curl -s https://docs.medusajs.com/api/version 2>/dev/null || echo 'unknown')",
  "files": {
    "llmsFull": "medusa-llms-full.txt",
    "llmsConcise": "medusa-llms.txt"
  }
}
EOF

log "✅ Documentation update completed successfully!"
log "Files saved to: $DOCS_DIR"
log "---"

# Display summary
echo ""
echo "📚 Medusa Documentation Update Summary"
echo "========================================"
echo "Location: $DOCS_DIR"
echo "Updated: $(date)"
echo ""
echo "Files:"
ls -lh "$DOCS_DIR"/*.txt 2>/dev/null || echo "No .txt files found"
echo ""
