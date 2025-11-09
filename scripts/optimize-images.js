#!/usr/bin/env node

/**
 * Image Optimization Script
 * Converts PNG images to WebP and AVIF formats with responsive sizes
 *
 * Usage: node scripts/optimize-images.js
 */

const sharp = require('../storefront/node_modules/sharp');
const fs = require('fs');
const path = require('path');

const INPUT_DIR = path.join(__dirname, '..', 'storefront', 'public', 'images');
const OUTPUT_DIR = path.join(__dirname, '..', 'storefront', 'public', 'images', 'optimized');

// Image quality settings
const WEBP_QUALITY = 80;
const AVIF_QUALITY = 75;
const JPG_QUALITY = 85;

// Responsive image sizes
const SIZES = [320, 640, 828, 1200, 1920];

// Files to optimize (PNG images)
const IMAGE_FILES = [
  'hero.png',
  'footer.png',
  'tour_options.png'
];

/**
 * Ensure output directory exists
 */
function ensureOutputDir() {
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    console.log(`✓ Created output directory: ${OUTPUT_DIR}`);
  }
}

/**
 * Get file size in KB
 */
function getFileSizeKB(filePath) {
  const stats = fs.statSync(filePath);
  return (stats.size / 1024).toFixed(2);
}

/**
 * Optimize a single image to WebP and AVIF formats
 */
async function optimizeImage(filename) {
  const inputPath = path.join(INPUT_DIR, filename);

  if (!fs.existsSync(inputPath)) {
    console.log(`⚠ File not found: ${filename}`);
    return;
  }

  const originalSize = getFileSizeKB(inputPath);
  console.log(`\n📸 Processing: ${filename} (${originalSize} KB)`);

  const baseName = path.parse(filename).name;
  const image = sharp(inputPath);
  const metadata = await image.metadata();

  console.log(`   Original dimensions: ${metadata.width}x${metadata.height}`);

  // Generate WebP versions
  console.log('   Generating WebP versions...');
  for (const width of SIZES) {
    if (width <= metadata.width) {
      const outputPath = path.join(OUTPUT_DIR, `${baseName}-${width}w.webp`);
      await image
        .clone()
        .resize(width, null, { withoutEnlargement: true })
        .webp({ quality: WEBP_QUALITY })
        .toFile(outputPath);

      const size = getFileSizeKB(outputPath);
      console.log(`   ✓ ${baseName}-${width}w.webp (${size} KB)`);
    }
  }

  // Generate full-size WebP
  const fullWebpPath = path.join(OUTPUT_DIR, `${baseName}.webp`);
  await image.clone().webp({ quality: WEBP_QUALITY }).toFile(fullWebpPath);
  const webpSize = getFileSizeKB(fullWebpPath);
  console.log(`   ✓ ${baseName}.webp (${webpSize} KB)`);

  // Generate AVIF versions
  console.log('   Generating AVIF versions...');
  for (const width of SIZES) {
    if (width <= metadata.width) {
      const outputPath = path.join(OUTPUT_DIR, `${baseName}-${width}w.avif`);
      await image
        .clone()
        .resize(width, null, { withoutEnlargement: true })
        .avif({ quality: AVIF_QUALITY })
        .toFile(outputPath);

      const size = getFileSizeKB(outputPath);
      console.log(`   ✓ ${baseName}-${width}w.avif (${size} KB)`);
    }
  }

  // Generate full-size AVIF
  const fullAvifPath = path.join(OUTPUT_DIR, `${baseName}.avif`);
  await image.clone().avif({ quality: AVIF_QUALITY }).toFile(fullAvifPath);
  const avifSize = getFileSizeKB(fullAvifPath);
  console.log(`   ✓ ${baseName}.avif (${avifSize} KB)`);

  // If PNG contains photos, also generate JPG
  if (filename.includes('hero') || filename.includes('tour')) {
    console.log('   Generating JPG version...');
    const jpgPath = path.join(OUTPUT_DIR, `${baseName}.jpg`);
    await image.clone().jpeg({ quality: JPG_QUALITY }).toFile(jpgPath);
    const jpgSize = getFileSizeKB(jpgPath);
    console.log(`   ✓ ${baseName}.jpg (${jpgSize} KB)`);
  }

  console.log(`   🎉 Compression ratio: ${((originalSize - avifSize) / originalSize * 100).toFixed(1)}% smaller (AVIF)`);
}

/**
 * Main execution
 */
async function main() {
  console.log('🚀 Starting image optimization...\n');
  console.log(`Input directory: ${INPUT_DIR}`);
  console.log(`Output directory: ${OUTPUT_DIR}\n`);

  ensureOutputDir();

  let processed = 0;
  let skipped = 0;

  for (const file of IMAGE_FILES) {
    try {
      await optimizeImage(file);
      processed++;
    } catch (error) {
      console.error(`❌ Error processing ${file}:`, error.message);
      skipped++;
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('✅ Optimization complete!');
  console.log(`   Processed: ${processed} images`);
  console.log(`   Skipped: ${skipped} images`);
  console.log('='.repeat(60));
  console.log('\n📝 Next steps:');
  console.log('1. Review optimized images in: storefront/public/images/optimized/');
  console.log('2. Replace original images with optimized versions');
  console.log('3. Update Next.js Image components to use responsive srcsets');
  console.log('4. Delete duplicate/backup images (hero_clean.png, hero_original_backup.png)');
}

// Run the script
main().catch(console.error);
