#!/bin/bash

cd /Users/Karim/med-usa-4wd/storefront/public/images

echo "🔧 Applying aggressive optimization to remaining large images..."
echo ""

optimize_aggressive() {
  local img="$1"

  echo "Processing: $img"

  if [ ! -f "$img" ]; then
    echo "  ❌ File not found"
    return
  fi

  local original_size=$(stat -f%z "$img")
  local original_kb=$((original_size / 1024))
  echo "  Current: ${original_kb} KB"

  if [ $original_kb -le 200 ]; then
    echo "  ✅ Already under 200KB"
    return
  fi

  # Create backup
  cp "$img" "$img.backup"

  # Get original width
  local width=$(sips -g pixelWidth "$img" | tail -1 | awk '{print $2}')

  # Try 35% width with quality 50
  local new_width=$((width * 35 / 100))
  sips -Z $new_width -s formatOptions 50 "$img.backup" --out "$img" >/dev/null 2>&1

  local new_size=$(stat -f%z "$img")
  local new_kb=$((new_size / 1024))

  if [ $new_kb -le 200 ]; then
    echo "  ✅ Success! ${original_kb} KB → ${new_kb} KB"
  else
    echo "  → ${new_kb} KB (trying 30% width, quality 45)"
    new_width=$((width * 30 / 100))
    sips -Z $new_width -s formatOptions 45 "$img.backup" --out "$img" >/dev/null 2>&1
    new_size=$(stat -f%z "$img")
    new_kb=$((new_size / 1024))

    if [ $new_kb -le 200 ]; then
      echo "  ✅ Success! ${original_kb} KB → ${new_kb} KB"
    else
      echo "  → ${new_kb} KB (trying 25% width, quality 40)"
      new_width=$((width * 25 / 100))
      sips -Z $new_width -s formatOptions 40 "$img.backup" --out "$img" >/dev/null 2>&1
      new_size=$(stat -f%z "$img")
      new_kb=$((new_size / 1024))
      echo "  ✅ Final: ${original_kb} KB → ${new_kb} KB"
    fi
  fi

  rm -f "$img.backup"
  echo ""
}

# Optimize remaining large images
optimize_aggressive "tours/Double-island-2.jpg"
optimize_aggressive "tours/double-island-point.jpg"
optimize_aggressive "tours/kgari-aerial.jpg"
optimize_aggressive "tours/kgari-dingo.jpg"
optimize_aggressive "tours/rainbow-beach.jpg"
optimize_aggressive "hero.png"
optimize_aggressive "hero_clean.png"
optimize_aggressive "footer.png"
optimize_aggressive "tour_options.png"
optimize_aggressive "hero_original_backup.png"

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Checking all image sizes..."
echo ""
find . -type f \( -iname "*.jpg" -o -iname "*.jpeg" -o -iname "*.png" \) | while read img; do
  size=$(stat -f%z "$img")
  size_kb=$((size / 1024))
  if [ $size_kb -gt 200 ]; then
    echo "❌ $img: ${size_kb} KB (still over 200KB)"
  else
    echo "✅ $img: ${size_kb} KB"
  fi
done
