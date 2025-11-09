#!/bin/bash

# Simple Blog API Test
API_URL="http://localhost:9000"

echo "=== Testing Blog Module ==="
echo ""

# Test 1: Create a blog post (without auth for now - direct DB test)
echo "1. Creating test blog post..."

cat > /tmp/post-data.json <<EOF
{
  "title": "Essential 4WD Accessories for Camping",
  "slug": "essential-4wd-accessories",
  "content": "<h2>Must-Have Gear</h2><p>Planning a camping trip?</p>",
  "excerpt": "Your guide to essential 4WD camping gear",
  "author": "Sarah Mitchell",
  "category": "guides",
  "tags": ["4wd", "camping", "gear"],
  "is_published": true
}
EOF

curl -X POST "$API_URL/admin/posts" \
  -H "Content-Type: application/json" \
  -d @/tmp/post-data.json \
  2>&1

echo ""
echo ""

# Test 2: Try to list posts
echo "2. Listing blog posts..."
curl -s "$API_URL/store/posts" | head -50

echo ""
echo "=== Test Complete ==="
