#!/bin/bash

# Image optimization script using sips (macOS built-in tool)
# Target: All images under 200KB

MAX_SIZE_KB=200
MAX_SIZE_BYTES=$((MAX_SIZE_KB * 1024))
IMAGE_DIR="/Users/Karim/med-usa-4wd/storefront/public/images"

echo "🖼️  Image Optimization Tool"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Target: All images under ${MAX_SIZE_KB}KB"
echo ""

total_original_size=0
total_new_size=0
optimized_count=0
skipped_count=0

# Function to get file size in bytes
get_file_size() {
  stat -f%z "$1"
}

# Function to format bytes to KB
format_bytes() {
  echo "scale=2; $1 / 1024" | bc
}

# Function to optimize a single image
optimize_image() {
  local file="$1"
  local original_size=$(get_file_size "$file")
  local filename=$(basename "$file")
  local ext="${filename##*.}"
  ext=$(echo "$ext" | tr '[:upper:]' '[:lower:]')

  if [ $original_size -le $MAX_SIZE_BYTES ]; then
    echo "✓ $filename - Already under ${MAX_SIZE_KB}KB ($(format_bytes $original_size) KB)"
    echo "$original_size $original_size"
    return
  fi

  echo ""
  echo "🔧 Optimizing $filename ($(format_bytes $original_size) KB)..."

  # Create backup
  cp "$file" "$file.backup"

  local quality=80
  local optimized=false

  # Try different quality levels
  while [ $quality -ge 60 ]; do
    if [ "$ext" = "png" ]; then
      # For PNG, reduce quality
      sips -s format jpeg -s formatOptions $quality "$file.backup" --out "$file.temp" >/dev/null 2>&1
    else
      # For JPEG, reduce quality
      sips -s formatOptions $quality "$file.backup" --out "$file.temp" >/dev/null 2>&1
    fi

    local temp_size=$(get_file_size "$file.temp")

    if [ $temp_size -le $MAX_SIZE_BYTES ]; then
      mv "$file.temp" "$file"
      optimized=true
      echo "   ✓ Compressed to $(format_bytes $temp_size) KB at quality $quality"
      break
    else
      echo "   → $(format_bytes $temp_size) KB at quality $quality (still too large)"
      quality=$((quality - 5))
    fi

    rm -f "$file.temp"
  done

  # If still too large, resize the image
  if [ "$optimized" = false ]; then
    echo "   ⚠️  Still too large, resizing..."

    # Get original dimensions
    local width=$(sips -g pixelWidth "$file.backup" | tail -1 | awk '{print $2}')
    local scale=90

    while [ $scale -ge 50 ]; do
      local new_width=$((width * scale / 100))

      sips -Z $new_width "$file.backup" --out "$file.temp" >/dev/null 2>&1

      if [ "$ext" = "png" ]; then
        sips -s format jpeg -s formatOptions 75 "$file.temp" --out "$file.temp2" >/dev/null 2>&1
        mv "$file.temp2" "$file.temp"
      else
        sips -s formatOptions 75 "$file.temp" --out "$file.temp2" >/dev/null 2>&1
        mv "$file.temp2" "$file.temp"
      fi

      local temp_size=$(get_file_size "$file.temp")

      if [ $temp_size -le $MAX_SIZE_BYTES ]; then
        mv "$file.temp" "$file"
        optimized=true
        echo "   ✓ Resized to ${new_width}px width: $(format_bytes $temp_size) KB"
        break
      else
        echo "   → ${new_width}px: $(format_bytes $temp_size) KB (still too large)"
        scale=$((scale - 10))
      fi

      rm -f "$file.temp"
    done
  fi

  local final_size=$(get_file_size "$file")
  local reduction=$(echo "scale=1; ($original_size - $final_size) * 100 / $original_size" | bc)

  if [ $final_size -le $MAX_SIZE_BYTES ]; then
    echo "   ✅ Success! $(format_bytes $original_size) KB → $(format_bytes $final_size) KB (${reduction}% reduction)"
  else
    echo "   ⚠️  Warning: Still $(format_bytes $final_size) KB (couldn't get under ${MAX_SIZE_KB}KB)"
  fi

  # Clean up backup
  rm -f "$file.backup"

  echo "$original_size $final_size"
}

# Find and optimize all images
echo "📁 Scanning: $IMAGE_DIR"
echo ""

find "$IMAGE_DIR" -type f \( -iname "*.jpg" -o -iname "*.jpeg" -o -iname "*.png" \) | while read -r file; do
  result=$(optimize_image "$file")

  orig_size=$(echo "$result" | tail -1 | awk '{print $1}')
  new_size=$(echo "$result" | tail -1 | awk '{print $2}')

  total_original_size=$((total_original_size + orig_size))
  total_new_size=$((total_new_size + new_size))

  if [ "$orig_size" -gt "$MAX_SIZE_BYTES" ]; then
    optimized_count=$((optimized_count + 1))
  else
    skipped_count=$((skipped_count + 1))
  fi
done

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 Summary"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Optimization complete!"
