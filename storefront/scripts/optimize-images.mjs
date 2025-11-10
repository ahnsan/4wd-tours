#!/usr/bin/env node
import sharp from 'sharp';
import { readdir, stat } from 'fs/promises';
import { join, extname, basename } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const MAX_SIZE_KB = 200;
const MAX_SIZE_BYTES = MAX_SIZE_KB * 1024;

// Image directories to scan
const IMAGE_DIRS = [
  join(__dirname, '../public/images'),
];

/**
 * Get file size in bytes
 */
async function getFileSize(filePath) {
  const stats = await stat(filePath);
  return stats.size;
}

/**
 * Format bytes to human readable
 */
function formatBytes(bytes) {
  return (bytes / 1024).toFixed(2) + ' KB';
}

/**
 * Find all image files recursively
 */
async function findImages(dir) {
  const images = [];
  const entries = await readdir(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = join(dir, entry.name);

    if (entry.isDirectory()) {
      images.push(...await findImages(fullPath));
    } else if (entry.isFile()) {
      const ext = extname(entry.name).toLowerCase();
      if (['.jpg', '.jpeg', '.png'].includes(ext)) {
        images.push(fullPath);
      }
    }
  }

  return images;
}

/**
 * Optimize a single image
 */
async function optimizeImage(filePath) {
  const ext = extname(filePath).toLowerCase();
  const originalSize = await getFileSize(filePath);

  if (originalSize <= MAX_SIZE_BYTES) {
    console.log(`✓ ${basename(filePath)} - Already under ${MAX_SIZE_KB}KB (${formatBytes(originalSize)})`);
    return { optimized: false, originalSize, newSize: originalSize };
  }

  console.log(`\n🔧 Optimizing ${basename(filePath)} (${formatBytes(originalSize)})...`);

  let quality = 80;
  let optimized = false;
  let newSize = originalSize;
  const backupPath = filePath + '.backup';

  try {
    // Create backup
    await sharp(filePath).toFile(backupPath);

    // Try different quality levels until we get under 200KB
    while (quality >= 60 && newSize > MAX_SIZE_BYTES) {
      const image = sharp(filePath + '.backup');

      if (ext === '.png') {
        // For PNG, use compression and convert to JPEG if needed
        if (quality === 80) {
          // First try: optimize PNG
          await image
            .png({ quality, compressionLevel: 9, effort: 10 })
            .toFile(filePath + '.temp');
        } else {
          // If still too large, convert to JPEG
          await image
            .jpeg({ quality, mozjpeg: true })
            .toFile(filePath + '.temp');
        }
      } else {
        // For JPEG, use mozjpeg for better compression
        await image
          .jpeg({ quality, mozjpeg: true })
          .toFile(filePath + '.temp');
      }

      newSize = await getFileSize(filePath + '.temp');

      if (newSize <= MAX_SIZE_BYTES) {
        // Success! Replace original
        await sharp(filePath + '.temp').toFile(filePath);
        optimized = true;
        console.log(`   ✓ Compressed to ${formatBytes(newSize)} at quality ${quality}`);
        break;
      } else {
        console.log(`   → ${formatBytes(newSize)} at quality ${quality} (still too large)`);
        quality -= 5;
      }
    }

    // If still too large, resize the image
    if (!optimized) {
      console.log(`   ⚠️  Still too large, resizing...`);
      const metadata = await sharp(backupPath).metadata();
      let width = metadata.width;
      let scale = 0.9;

      while (newSize > MAX_SIZE_BYTES && scale >= 0.5) {
        width = Math.floor(metadata.width * scale);

        const image = sharp(backupPath).resize(width);

        if (ext === '.png') {
          await image.jpeg({ quality: 75, mozjpeg: true }).toFile(filePath + '.temp');
        } else {
          await image.jpeg({ quality: 75, mozjpeg: true }).toFile(filePath + '.temp');
        }

        newSize = await getFileSize(filePath + '.temp');

        if (newSize <= MAX_SIZE_BYTES) {
          await sharp(filePath + '.temp').toFile(filePath);
          optimized = true;
          console.log(`   ✓ Resized to ${width}px width: ${formatBytes(newSize)}`);
          break;
        } else {
          console.log(`   → ${width}px: ${formatBytes(newSize)} (still too large)`);
          scale -= 0.1;
        }
      }
    }

    // Clean up temp files
    try {
      await sharp(filePath + '.temp').toFile(filePath + '.delete');
    } catch (e) {}

    const finalSize = await getFileSize(filePath);
    const reduction = ((originalSize - finalSize) / originalSize * 100).toFixed(1);

    if (finalSize <= MAX_SIZE_BYTES) {
      console.log(`   ✅ Success! ${formatBytes(originalSize)} → ${formatBytes(finalSize)} (${reduction}% reduction)`);
    } else {
      console.log(`   ⚠️  Warning: Still ${formatBytes(finalSize)} (couldn't get under ${MAX_SIZE_KB}KB)`);
    }

    return { optimized: true, originalSize, newSize: finalSize };
  } catch (error) {
    console.error(`   ❌ Error optimizing ${basename(filePath)}:`, error.message);
    return { optimized: false, originalSize, newSize: originalSize, error: error.message };
  }
}

/**
 * Create WebP versions of all images
 */
async function createWebPVersion(filePath) {
  const ext = extname(filePath);
  const webpPath = filePath.replace(ext, '.webp');

  try {
    await sharp(filePath)
      .webp({ quality: 80, effort: 6 })
      .toFile(webpPath);

    const webpSize = await getFileSize(webpPath);
    if (webpSize <= MAX_SIZE_BYTES) {
      console.log(`   ✓ WebP created: ${formatBytes(webpSize)}`);
      return true;
    } else {
      console.log(`   ⚠️  WebP still too large: ${formatBytes(webpSize)}`);
      return false;
    }
  } catch (error) {
    console.error(`   ❌ Error creating WebP for ${basename(filePath)}:`, error.message);
    return false;
  }
}

/**
 * Main function
 */
async function main() {
  console.log('🖼️  Image Optimization Tool');
  console.log('━'.repeat(50));
  console.log(`Target: All images under ${MAX_SIZE_KB}KB\n`);

  let totalOriginalSize = 0;
  let totalNewSize = 0;
  let optimizedCount = 0;
  let skippedCount = 0;

  for (const dir of IMAGE_DIRS) {
    console.log(`📁 Scanning: ${dir}\n`);

    const images = await findImages(dir);
    console.log(`Found ${images.length} images\n`);

    for (const imagePath of images) {
      const result = await optimizeImage(imagePath);
      totalOriginalSize += result.originalSize;
      totalNewSize += result.newSize;

      if (result.optimized) {
        optimizedCount++;
        // Create WebP version
        await createWebPVersion(imagePath);
      } else {
        skippedCount++;
      }
    }
  }

  console.log('\n' + '━'.repeat(50));
  console.log('📊 Summary');
  console.log('━'.repeat(50));
  console.log(`Optimized: ${optimizedCount} images`);
  console.log(`Skipped: ${skippedCount} images (already under ${MAX_SIZE_KB}KB)`);
  console.log(`Total size reduction: ${formatBytes(totalOriginalSize)} → ${formatBytes(totalNewSize)}`);
  console.log(`Savings: ${formatBytes(totalOriginalSize - totalNewSize)} (${((totalOriginalSize - totalNewSize) / totalOriginalSize * 100).toFixed(1)}%)`);
  console.log('\n✅ Optimization complete!');
}

main().catch(console.error);
