#!/bin/bash

cd /Users/Karim/med-usa-4wd/storefront/public/images

echo "🖼️  Creating WebP versions for better performance..."
echo ""

convert_to_webp() {
  local img="$1"
  local webp_path="${img%.*}.webp"

  if [ ! -f "$img" ]; then
    echo "  ❌ File not found: $img"
    return
  fi

  echo "Converting: $img"

  # Convert to WebP with quality 80
  sips -s format webp -s formatOptions 80 "$img" --out "$webp_path" >/dev/null 2>&1

  if [ -f "$webp_path" ]; then
    local original_size=$(stat -f%z "$img")
    local webp_size=$(stat -f%z "$webp_path")
    local original_kb=$((original_size / 1024))
    local webp_kb=$((webp_size / 1024))

    if [ $webp_kb -lt $original_kb ]; then
      local savings=$((100 - (webp_kb * 100 / original_kb)))
      echo "  ✅ ${original_kb} KB → ${webp_kb} KB (${savings}% smaller)"
    else
      echo "  ✅ ${original_kb} KB → ${webp_kb} KB"
    fi
  else
    echo "  ⚠️  WebP conversion failed"
  fi

  echo ""
}

echo "=== Converting Tour Images ==="
echo ""
for img in tours/*.jpg; do
  convert_to_webp "$img"
done

echo "=== Converting UI Images ==="
echo ""
convert_to_webp "hero.png"
convert_to_webp "hero_clean.png"
convert_to_webp "footer.png"
convert_to_webp "tour_options.png"

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ WebP conversion complete!"
echo ""
echo "WebP files created:"
find . -name "*.webp" -exec ls -lh {} \; | awk '{print "  " $5, $9}'
