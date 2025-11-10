#!/usr/bin/env node

/**
 * Download Add-on Images from Pexels (Simplified Version)
 *
 * This script downloads images from Pexels and saves them as JPEG.
 * Next.js Image component will handle WebP/AVIF conversion automatically at runtime.
 *
 * Requirements:
 * - PEXELS_API_KEY environment variable
 * - macOS sips tool (built-in)
 *
 * Usage:
 *   PEXELS_API_KEY=your_key node scripts/download-addon-images-simple.js
 */

const fs = require('fs').promises;
const path = require('path');
const https = require('https');
const { exec } = require('child_process');
const { promisify } = require('util');

const execAsync = promisify(exec);

// Configuration
const PEXELS_API_KEY = process.env.PEXELS_API_KEY;
const MAPPING_FILE = path.join(__dirname, '../../docs/addon-image-mapping.json');
const OUTPUT_DIR = path.join(__dirname, '../public/images/addons');
const MANIFEST_FILE = path.join(__dirname, '../../docs/addon-images-manifest.json');
const METADATA_FILE = path.join(OUTPUT_DIR, 'metadata.json');

// Image settings
const TARGET_WIDTH = 1200;
const TARGET_HEIGHT = 800;

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
      } else if (response.statusCode === 301 || response.statusCode === 302) {
        // Follow redirect
        downloadFile(response.headers.location).then(resolve).catch(reject);
      } else {
        reject(new Error(`HTTP ${response.statusCode}: ${response.statusMessage}`));
      }
    }).on('error', reject);
  });
}

/**
 * Search Pexels for images
 */
function searchPexels(query, perPage = 15) {
  return new Promise((resolve, reject) => {
    const url = `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=${perPage}&orientation=landscape`;

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
          reject(new Error(`Pexels API error: ${response.statusCode}`));
        }
      });
    }).on('error', reject);
  });
}

/**
 * Optimize image using macOS sips
 */
async function optimizeImage(inputPath, outputPath, width, height) {
  try {
    // Resize and convert to JPEG with sips
    await execAsync(`sips -s format jpeg -s formatOptions 90 -Z ${width} -c ${height} ${width} "${inputPath}" --out "${outputPath}"`);

    // Get file size
    const stats = await fs.stat(outputPath);
    return stats.size;
  } catch (error) {
    console.error(`  ❌ Error optimizing image: ${error.message}`);
    // If sips fails, just copy the file
    await fs.copyFile(inputPath, outputPath);
    const stats = await fs.stat(outputPath);
    return stats.size;
  }
}

/**
 * Process a single addon
 */
async function processAddon(addon, index, total) {
  console.log(`\n[${ index + 1}/${total}] Processing: ${addon.title}`);
  console.log(`  Category: ${addon.category}`);

  // Try each search term until we find a good image
  for (const searchTerm of addon.pexels_search_terms) {
    console.log(`  🔍 Searching Pexels for: "${searchTerm}"`);

    try {
      const results = await searchPexels(searchTerm);

      if (results.photos && results.photos.length > 0) {
        const photo = results.photos[0]; // Use first result
        console.log(`  ✅ Found photo by ${photo.photographer}`);
        console.log(`  📸 Photo ID: ${photo.id}`);

        // Download original image
        const imageUrl = photo.src.large2x || photo.src.large;
        console.log(`  ⬇️  Downloading from Pexels...`);

        const imageBuffer = await downloadFile(imageUrl);
        const tempPath = path.join(OUTPUT_DIR, `temp-${addon.handle}.jpg`);
        await fs.writeFile(tempPath, imageBuffer);

        // Optimize with sips
        const outputPath = path.join(OUTPUT_DIR, `${addon.handle}.jpg`);
        console.log(`  🎨 Optimizing image...`);
        const fileSize = await optimizeImage(tempPath, outputPath, TARGET_WIDTH, TARGET_HEIGHT);

        // Remove temp file
        await fs.unlink(tempPath);

        console.log(`  ✅ Saved: ${addon.handle}.jpg (${(fileSize / 1024).toFixed(1)} KB)`);

        return {
          addon_handle: addon.handle,
          addon_title: addon.title,
          source_url: photo.url,
          photo_id: photo.id,
          photographer: photo.photographer,
          photographer_url: photo.photographer_url,
          pexels_url: photo.url,
          search_term_used: searchTerm,
          image_file: `${addon.handle}.jpg`,
          image_path: `/images/addons/${addon.handle}.jpg`,
          alt_text: addon.alt_text_template,
          file_size_kb: Math.round(fileSize / 1024),
          dimensions: `${TARGET_WIDTH}x${TARGET_HEIGHT}`,
          license: 'Pexels Free License',
          license_url: 'https://www.pexels.com/license/'
        };
      } else {
        console.log(`  ⚠️  No results for "${searchTerm}", trying next term...`);
      }
    } catch (error) {
      console.error(`  ❌ Error searching for "${searchTerm}": ${error.message}`);
    }

    // Rate limiting - wait 1 second between searches
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  console.log(`  ❌ Could not find suitable image for ${addon.title}`);
  return null;
}

/**
 * Main execution
 */
async function main() {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('       PEXELS ADD-ON IMAGE DOWNLOADER (SIMPLIFIED)');
  console.log('═══════════════════════════════════════════════════════════\n');

  // Validate API key
  if (!PEXELS_API_KEY) {
    console.error('❌ ERROR: PEXELS_API_KEY environment variable not set\n');
    console.log('Get a free API key from: https://www.pexels.com/api/\n');
    console.log('Then run:');
    console.log('  PEXELS_API_KEY=your_key node scripts/download-addon-images-simple.js\n');
    process.exit(1);
  }

  // Create output directory
  try {
    await fs.mkdir(OUTPUT_DIR, { recursive: true });
    console.log(`✅ Output directory ready: ${OUTPUT_DIR}\n`);
  } catch (error) {
    console.error(`❌ Error creating output directory: ${error.message}`);
    process.exit(1);
  }

  // Load addon mapping
  let mapping;
  try {
    const mappingData = await fs.readFile(MAPPING_FILE, 'utf8');
    mapping = JSON.parse(mappingData);
    console.log(`✅ Loaded ${mapping.addons.length} addons from mapping file\n`);
  } catch (error) {
    console.error(`❌ Error loading mapping file: ${error.message}`);
    process.exit(1);
  }

  // Process each addon
  const results = [];
  const total = mapping.addons.length;

  for (let i = 0; i < mapping.addons.length; i++) {
    const addon = mapping.addons[i];
    const result = await processAddon(addon, i, total);
    if (result) {
      results.push(result);
    }
  }

  // Generate manifest
  const manifest = {
    generated_at: new Date().toISOString(),
    total_addons: total,
    successful_downloads: results.length,
    failed_downloads: total - results.length,
    total_size_kb: results.reduce((sum, r) => sum + r.file_size_kb, 0),
    images: results,
    optimization_notes: [
      'Images saved as JPEG at 1200x800px',
      'Next.js Image component will automatically convert to WebP/AVIF at runtime',
      'Next.js will generate responsive sizes automatically',
      'All images licensed under Pexels Free License'
    ]
  };

  await fs.writeFile(MANIFEST_FILE, JSON.stringify(manifest, null, 2));

  // Generate metadata file
  const metadata = {
    license: 'Pexels Free License',
    license_url: 'https://www.pexels.com/license/',
    attribution_required: false,
    images: results.map(r => ({
      file: r.image_file,
      photographer: r.photographer,
      photographer_url: r.photographer_url,
      pexels_url: r.pexels_url,
      photo_id: r.photo_id
    }))
  };

  await fs.writeFile(METADATA_FILE, JSON.stringify(metadata, null, 2));

  // Summary
  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('                      SUMMARY');
  console.log('═══════════════════════════════════════════════════════════\n');
  console.log(`✅ Successfully downloaded: ${results.length}/${total} images`);
  console.log(`📁 Total size: ${(manifest.total_size_kb / 1024).toFixed(1)} MB`);
  console.log(`💾 Average size: ${(manifest.total_size_kb / results.length).toFixed(1)} KB per image`);
  console.log(`\n📄 Manifest saved: ${MANIFEST_FILE}`);
  console.log(`📄 Metadata saved: ${METADATA_FILE}`);

  if (results.length < total) {
    console.log(`\n⚠️  Warning: ${total - results.length} images could not be downloaded`);
    console.log('   You may need to manually source images for these addons');
  }

  console.log('\n✨ Next.js will automatically optimize images at runtime:');
  console.log('   • Convert to WebP/AVIF for modern browsers');
  console.log('   • Generate responsive sizes');
  console.log('   • Lazy load below-fold images');
  console.log('   • Maintain PageSpeed 90+ score\n');
}

main().catch(error => {
  console.error('\n❌ Fatal error:', error);
  process.exit(1);
});
