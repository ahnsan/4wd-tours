#!/bin/bash

cd /Users/Karim/med-usa-4wd/storefront/public/images

echo "🔧 Optimizing all large images..."
echo ""

optimize_image() {
  local img="$1"
  local target_kb="$2"

  echo "Processing: $img"

  if [ ! -f "$img" ]; then
    echo "  ❌ File not found"
    return
  fi

  local original_size=$(stat -f%z "$img")
  local original_kb=$((original_size / 1024))
  echo "  Original: ${original_kb} KB"

  if [ $original_kb -le $target_kb ]; then
    echo "  ✅ Already under ${target_kb}KB"
    return
  fi

  # Create backup
  cp "$img" "$img.backup"

  # Get original width
  local width=$(sips -g pixelWidth "$img" | tail -1 | awk '{print $2}')

  # Try 60% width first with quality 70
  local new_width=$((width * 60 / 100))
  sips -Z $new_width -s formatOptions 70 "$img.backup" --out "$img" >/dev/null 2>&1

  local new_size=$(stat -f%z "$img")
  local new_kb=$((new_size / 1024))
  echo "  First try: ${new_kb} KB"

  # If still too large, try 50% width with quality 60
  if [ $new_kb -gt $target_kb ]; then
    echo "  Still too large, trying more compression..."
    new_width=$((width * 50 / 100))
    sips -Z $new_width -s formatOptions 60 "$img.backup" --out "$img" >/dev/null 2>&1
    new_size=$(stat -f%z "$img")
    new_kb=$((new_size / 1024))
    echo "  Second try: ${new_kb} KB"
  fi

  # If still too large, try 40% width with quality 55
  if [ $new_kb -gt $target_kb ]; then
    echo "  Still too large, trying even more compression..."
    new_width=$((width * 40 / 100))
    sips -Z $new_width -s formatOptions 55 "$img.backup" --out "$img" >/dev/null 2>&1
    new_size=$(stat -f%z "$img")
    new_kb=$((new_size / 1024))
    echo "  Third try: ${new_kb} KB"
  fi

  # Final check
  if [ $new_kb -le $target_kb ]; then
    local reduction=$(echo "scale=1; ($original_kb - $new_kb) * 100 / $original_kb" | bc)
    echo "  ✅ Success! ${original_kb} KB → ${new_kb} KB (${reduction}% reduction)"
  else
    echo "  ⚠️  Final: ${new_kb} KB (couldn't get under ${target_kb}KB)"
  fi

  rm -f "$img.backup"
  echo ""
}

echo "=== Tour Images ==="
echo ""
optimize_image "tours/4wd-on-beach.jpg" 200
optimize_image "tours/Double-island-2.jpg" 200
optimize_image "tours/double-island-point.jpg" 200
optimize_image "tours/kgari-aerial.jpg" 200
optimize_image "tours/kgari-dingo.jpg" 200
optimize_image "tours/kgari-wreck.jpg" 200
optimize_image "tours/rainbow-beach.jpg" 200

echo "=== Hero & UI Images ==="
echo ""
optimize_image "hero.png" 200
optimize_image "hero_clean.png" 200
optimize_image "footer.png" 200
optimize_image "tour_options.png" 200
optimize_image "hero_original_backup.png" 200

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Optimization complete!"
echo ""
echo "Checking final sizes..."
echo ""
find . -type f \( -iname "*.jpg" -o -iname "*.jpeg" -o -iname "*.png" \) -size +200k -exec ls -lh {} \; | awk '{print $5, $9}'
