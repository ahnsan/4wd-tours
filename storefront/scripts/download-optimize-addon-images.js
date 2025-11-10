#!/usr/bin/env node

/**
 * Download and Optimize Add-on Images from Pexels
 *
 * This script:
 * 1. Fetches images from Pexels API based on addon-image-mapping.json
 * 2. Downloads high-quality images (1920px minimum)
 * 3. Optimizes to WebP and AVIF formats
 * 4. Creates responsive sizes: [640, 750, 828, 1080, 1200, 1920]px
 * 5. Generates manifest with attribution
 *
 * Requirements:
 * - PEXELS_API_KEY environment variable
 * - Sharp library (already installed)
 *
 * Usage:
 *   PEXELS_API_KEY=your_key node scripts/download-optimize-addon-images.js
 */

const fs = require('fs').promises;
const path = require('path');
const https = require('https');
const sharp = require('sharp');

// Configuration
const PEXELS_API_KEY = process.env.PEXELS_API_KEY;
const MAPPING_FILE = path.join(__dirname, '../../docs/addon-image-mapping.json');
const OUTPUT_DIR = path.join(__dirname, '../public/images/addons');
const MANIFEST_FILE = path.join(__dirname, '../../docs/addon-images-manifest.json');
const METADATA_FILE = path.join(OUTPUT_DIR, 'metadata.json');

// Responsive sizes to generate
const RESPONSIVE_WIDTHS = [640, 750, 828, 1080, 1200, 1920];

// Optimization quality settings
const WEBP_QUALITY = 85;
const AVIF_QUALITY = 80;
const JPEG_QUALITY = 90;

/**
 * Download file from URL
 */
function downloadFile(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (response) => {
      if (response.statusCode === 200) {
        const chunks = [];
        response.on('data', (chunk) => chunks.push(chunk));
        response.on('end', () => resolve(Buffer.concat(chunks)));
      } else {
        reject(new Error(`Failed to download: ${response.statusCode}`));
      }
    }).on('error', reject);
  });
}

/**
 * Search Pexels for images
 */
async function searchPexels(query, perPage = 5) {
  if (!PEXELS_API_KEY) {
    throw new Error('PEXELS_API_KEY environment variable is required');
  }

  const url = `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=${perPage}&orientation=landscape`;

  return new Promise((resolve, reject) => {
    https.get(url, {
      headers: {
        'Authorization': PEXELS_API_KEY
      }
    }, (response) => {
      let data = '';
      response.on('data', (chunk) => data += chunk);
      response.on('end', () => {
        if (response.statusCode === 200) {
          resolve(JSON.parse(data));
        } else {
          reject(new Error(`Pexels API error: ${response.statusCode} - ${data}`));
        }
      });
    }).on('error', reject);
  });
}

/**
 * Optimize image to multiple formats and sizes
 */
async function optimizeImage(inputBuffer, outputBasePath, addonHandle) {
  const formats = {
    webp: [],
    avif: [],
    original: null
  };

  // Get image metadata
  const metadata = await sharp(inputBuffer).metadata();
  console.log(`  Original size: ${metadata.width}x${metadata.height}`);

  // Save original as JPEG
  const originalPath = `${addonHandle}-original.jpg`;
  await sharp(inputBuffer)
    .jpeg({ quality: JPEG_QUALITY })
    .toFile(path.join(outputBasePath, originalPath));
  formats.original = originalPath;
  console.log(`  ✓ Saved original: ${originalPath}`);

  // Generate responsive sizes
  for (const width of RESPONSIVE_WIDTHS) {
    // Skip if original is smaller than target width
    if (metadata.width < width) {
      console.log(`  ⊘ Skipping ${width}w (original is smaller)`);
      continue;
    }

    // WebP
    const webpFilename = `${addonHandle}-${width}w.webp`;
    await sharp(inputBuffer)
      .resize(width, null, { withoutEnlargement: true })
      .webp({ quality: WEBP_QUALITY })
      .toFile(path.join(outputBasePath, webpFilename));
    formats.webp.push(webpFilename);
    console.log(`  ✓ Generated WebP: ${webpFilename}`);

    // AVIF
    const avifFilename = `${addonHandle}-${width}w.avif`;
    await sharp(inputBuffer)
      .resize(width, null, { withoutEnlargement: true })
      .avif({ quality: AVIF_QUALITY })
      .toFile(path.join(outputBasePath, avifFilename));
    formats.avif.push(avifFilename);
    console.log(`  ✓ Generated AVIF: ${avifFilename}`);
  }

  return formats;
}

/**
 * Generate SEO-optimized alt text
 */
function generateAltText(addonName, category) {
  const categoryContext = {
    'Food & Beverage': 'dining experience',
    'Photography': 'photography service',
    'Equipment': 'equipment rental',
    'Transport': 'transport service',
    'Insurance': 'travel protection'
  };

  const context = categoryContext[category] || 'add-on service';
  return `${addonName} - Premium ${context} for 4WD tours on Sunshine Coast`;
}

/**
 * Main execution
 */
async function main() {
  console.log('🚀 Starting Add-on Image Download & Optimization\n');

  // Verify API key
  if (!PEXELS_API_KEY) {
    console.error('❌ ERROR: PEXELS_API_KEY environment variable is required');
    console.error('\nTo get a free API key:');
    console.error('1. Visit https://www.pexels.com/api/');
    console.error('2. Sign up for a free account');
    console.error('3. Generate an API key');
    console.error('4. Run: PEXELS_API_KEY=your_key node scripts/download-optimize-addon-images.js\n');
    process.exit(1);
  }

  // Load mapping file
  console.log('📖 Loading addon-image-mapping.json...');
  const mappingData = JSON.parse(await fs.readFile(MAPPING_FILE, 'utf8'));
  const addons = mappingData.addons;
  console.log(`Found ${addons.length} addons to process\n`);

  // Create output directory
  await fs.mkdir(OUTPUT_DIR, { recursive: true });
  console.log(`✓ Output directory ready: ${OUTPUT_DIR}\n`);

  // Process each addon
  const manifest = {
    generated_at: new Date().toISOString(),
    total_images: 0,
    pexels_license: "Pexels Free License - https://www.pexels.com/license/",
    images: []
  };

  const metadata = {
    license: "Pexels Free License",
    license_url: "https://www.pexels.com/license/",
    attribution_required: false,
    commercial_use: true,
    modification_allowed: true,
    images: []
  };

  for (let i = 0; i < addons.length; i++) {
    const addon = addons[i];
    console.log(`\n[${'='.repeat(60)}]`);
    console.log(`Processing [${i + 1}/${addons.length}]: ${addon.addon_name}`);
    console.log(`[${'='.repeat(60)}]\n`);

    try {
      // Search Pexels with first search term
      const searchQuery = addon.pexels_search_terms[0];
      console.log(`🔍 Searching Pexels: "${searchQuery}"`);

      const searchResults = await searchPexels(searchQuery, 3);

      if (!searchResults.photos || searchResults.photos.length === 0) {
        console.error(`  ⚠️  No photos found for "${searchQuery}", trying alternate term...`);

        // Try second search term
        if (addon.pexels_search_terms.length > 1) {
          const altQuery = addon.pexels_search_terms[1];
          console.log(`🔍 Searching Pexels: "${altQuery}"`);
          const altResults = await searchPexels(altQuery, 3);

          if (!altResults.photos || altResults.photos.length === 0) {
            throw new Error('No suitable images found');
          }
          searchResults.photos = altResults.photos;
        } else {
          throw new Error('No suitable images found');
        }
      }

      // Select best photo (highest quality)
      const photo = searchResults.photos[0];
      console.log(`✓ Selected photo by ${photo.photographer}`);
      console.log(`  Photo ID: ${photo.id}`);
      console.log(`  URL: ${photo.url}`);

      // Download original image (use large2x for best quality)
      const imageUrl = photo.src.large2x || photo.src.original;
      console.log(`\n⬇️  Downloading image from Pexels...`);
      const imageBuffer = await downloadFile(imageUrl);
      console.log(`✓ Downloaded ${(imageBuffer.length / 1024 / 1024).toFixed(2)} MB\n`);

      // Optimize image
      console.log(`⚙️  Optimizing image formats...`);
      const formats = await optimizeImage(imageBuffer, OUTPUT_DIR, addon.addon_handle);

      // Generate alt text
      const altText = generateAltText(addon.addon_name, addon.category);

      // Add to manifest
      const imageEntry = {
        addon_id: addon.addon_id,
        addon_handle: addon.addon_handle,
        addon_name: addon.addon_name,
        category: addon.category,
        source_url: photo.url,
        pexels_id: photo.id,
        photographer: photo.photographer,
        photographer_url: photo.photographer_url,
        formats: formats,
        alt_text: altText,
        license: "Pexels Free License"
      };

      manifest.images.push(imageEntry);

      metadata.images.push({
        addon_handle: addon.addon_handle,
        pexels_id: photo.id,
        photographer: photo.photographer,
        photographer_url: photo.photographer_url,
        photo_url: photo.url,
        downloaded_at: new Date().toISOString()
      });

      manifest.total_images++;
      console.log(`\n✅ Successfully processed: ${addon.addon_name}\n`);

      // Rate limiting - wait 1 second between requests
      if (i < addons.length - 1) {
        console.log('⏳ Waiting 1s to respect API rate limits...');
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

    } catch (error) {
      console.error(`\n❌ Error processing ${addon.addon_name}:`, error.message);
      console.error('   Skipping to next addon...\n');
    }
  }

  // Save manifest
  console.log(`\n[${'='.repeat(60)}]`);
  console.log('📝 Saving manifest and metadata files...');
  await fs.writeFile(MANIFEST_FILE, JSON.stringify(manifest, null, 2));
  console.log(`✓ Manifest saved: ${MANIFEST_FILE}`);

  await fs.writeFile(METADATA_FILE, JSON.stringify(metadata, null, 2));
  console.log(`✓ Metadata saved: ${METADATA_FILE}`);

  // Summary
  console.log(`\n[${'='.repeat(60)}]`);
  console.log('🎉 IMAGE OPTIMIZATION COMPLETE!');
  console.log(`[${'='.repeat(60)}]\n`);
  console.log(`✅ Successfully processed: ${manifest.total_images}/${addons.length} addons`);
  console.log(`📁 Images saved to: ${OUTPUT_DIR}`);
  console.log(`📄 Manifest: ${MANIFEST_FILE}`);
  console.log(`📄 Metadata: ${METADATA_FILE}\n`);

  if (manifest.total_images < addons.length) {
    console.warn(`⚠️  Warning: ${addons.length - manifest.total_images} addon(s) failed to process`);
    console.warn('   Check error messages above for details\n');
  }

  // Generate summary for next steps
  console.log('📋 NEXT STEPS:\n');
  console.log('1. Review generated images in:', OUTPUT_DIR);
  console.log('2. Check addon-images-manifest.json for attribution details');
  console.log('3. Update components to use new image paths');
  console.log('4. Test PageSpeed score (target: 90+)');
  console.log('5. Verify Pexels attribution is visible where required\n');
}

// Execute
main().catch(error => {
  console.error('\n💥 FATAL ERROR:', error.message);
  console.error(error.stack);
  process.exit(1);
});
