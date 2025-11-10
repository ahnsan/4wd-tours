#!/bin/bash

cd /Users/Karim/med-usa-4wd/storefront/public/images

echo "📊 Final Image Size Verification Report"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

total_size=0
count=0
under_limit=0
over_limit=0

echo "All Images:"
echo ""

find . -type f \( -iname "*.jpg" -o -iname "*.jpeg" -o -iname "*.png" \) -not -name "*.backup" | sort | while read img; do
  size=$(stat -f%z "$img" 2>/dev/null || echo 0)
  size_kb=$((size / 1024))

  if [ $size_kb -gt 200 ]; then
    echo "  ❌ $img: ${size_kb} KB (OVER LIMIT)"
  else
    echo "  ✅ $img: ${size_kb} KB"
  fi
done

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Summary:"
echo ""

total_count=$(find . -type f \( -iname "*.jpg" -o -iname "*.jpeg" -o -iname "*.png" \) -not -name "*.backup" | wc -l | tr -d ' ')
echo "  Total images: $total_count"

under_count=$(find . -type f \( -iname "*.jpg" -o -iname "*.jpeg" -o -iname "*.png" \) -not -name "*.backup" -size -200k | wc -l | tr -d ' ')
echo "  Images under 200KB: $under_count"

over_count=$(find . -type f \( -iname "*.jpg" -o -iname "*.jpeg" -o -iname "*.png" \) -not -name "*.backup" -size +200k | wc -l | tr -d ' ')
echo "  Images over 200KB: $over_count"

total_size_kb=$(find . -type f \( -iname "*.jpg" -o -iname "*.jpeg" -o -iname "*.png" \) -not -name "*.backup" -exec stat -f%z {} \; | awk '{sum+=$1} END {printf "%.2f", sum/1024}')
echo "  Total size: ${total_size_kb} KB"

echo ""
if [ "$over_count" -eq 0 ]; then
  echo "✅ SUCCESS! All images are under 200KB"
else
  echo "⚠️  WARNING: $over_count images still over 200KB"
fi
