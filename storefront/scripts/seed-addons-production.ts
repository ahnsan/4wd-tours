/**
 * Production Add-ons Seeding Script for Medusa v2
 *
 * This script seeds add-on products to the Medusa backend for production deployment.
 * Designed to be executed via Railway CLI or directly via Node.js/TypeScript.
 *
 * Features:
 * - Idempotent: Won't duplicate products if run multiple times
 * - Production image URLs: Uses Vercel public folder URLs
 * - Medusa v2 compatible: Follows official Medusa patterns
 * - Error handling: Comprehensive logging and error recovery
 * - Metadata preservation: Maintains all addon metadata
 * - Proper pricing: Uses dollars (Medusa v2 format), not cents
 *
 * Usage:
 *   Via Railway CLI:
 *     railway run node -r esbuild-register scripts/seed-addons-production.ts
 *
 *   Locally (requires .env.production):
 *     tsx scripts/seed-addons-production.ts
 *
 * Prerequisites:
 * - Medusa backend must be running
 * - Region must exist (Australia region: reg_01K9S1YB6T87JJW43F5ZAE8HWG)
 * - Publishable API key must be configured
 * - Images must be deployed to Vercel public folder
 *
 * Environment Variables Required:
 * - NEXT_PUBLIC_MEDUSA_BACKEND_URL: Backend URL (Railway production URL)
 * - NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY: Publishable API key
 * - NEXT_PUBLIC_DEFAULT_REGION_ID: Region ID for pricing
 * - VERCEL_URL or PUBLIC_URL: Base URL for image assets
 */

import fetch from 'node-fetch';

// ============================================================================
// Configuration
// ============================================================================

const CONFIG = {
  // Backend configuration
  BACKEND_URL: process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || 'https://4wd-tours-production.up.railway.app',
  PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || '',
  REGION_ID: process.env.NEXT_PUBLIC_DEFAULT_REGION_ID || 'reg_01K9S1YB6T87JJW43F5ZAE8HWG',

  // Image base URL (Vercel deployment or local)
  IMAGE_BASE_URL: process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : process.env.PUBLIC_URL || 'https://sunshine-coast-4wd-tours.vercel.app',

  // Script configuration
  TIMEOUT_MS: 10000,
  DRY_RUN: process.env.DRY_RUN === 'true',
  VERBOSE: process.env.VERBOSE === 'true',
};

// ============================================================================
// Add-on Product Data (19 add-ons)
// ============================================================================

interface AddonData {
  handle: string;
  title: string;
  description: string;
  category: string;
  price_dollars: number; // Medusa v2 uses dollars, not cents
  pricing_type: 'per_booking' | 'per_day' | 'per_person';
  image_filename: string;
  metadata: {
    unit: string;
    category: string;
    max_quantity?: number;
    quantity_allowed: boolean;
    recommended_for?: string[];
    tags?: string[];
  };
}

const ADDON_PRODUCTS: AddonData[] = [
  // Food & Beverage Category
  {
    handle: 'addon-gourmet-bbq',
    title: 'Gourmet Beach BBQ',
    description: 'Premium BBQ experience on the beach featuring Australian grass-fed steaks, local seafood, and gourmet sides. Perfect for sunset dining on Fraser Island.',
    category: 'Food & Beverage',
    price_dollars: 180,
    pricing_type: 'per_day',
    image_filename: 'addon-gourmet-bbq.jpg',
    metadata: {
      unit: 'per_day',
      category: 'Food & Beverage',
      max_quantity: 3,
      quantity_allowed: true,
      recommended_for: ['2d-fraser-rainbow', '3d-fraser-combo'],
      tags: ['bbq', 'dining', 'sunset', 'premium', 'australian'],
    },
  },
  {
    handle: 'addon-picnic-hamper',
    title: 'Picnic Hamper',
    description: 'Artisan picnic hamper with Queensland cheeses, charcuterie, fresh bread, and local produce. Includes reusable basket and blanket.',
    category: 'Food & Beverage',
    price_dollars: 85,
    pricing_type: 'per_booking',
    image_filename: 'addon-picnic-hamper.jpg',
    metadata: {
      unit: 'per_booking',
      category: 'Food & Beverage',
      max_quantity: 5,
      quantity_allowed: true,
      recommended_for: ['1d-fraser-express', '2d-fraser-rainbow'],
      tags: ['picnic', 'gourmet', 'artisan', 'queensland'],
    },
  },
  {
    handle: 'addon-seafood-platter',
    title: 'Seafood Platter',
    description: 'Fresh Queensland seafood platter with prawns, oysters, local fish, and seasonal catches. Served on ice with lemon and dipping sauces.',
    category: 'Food & Beverage',
    price_dollars: 150,
    pricing_type: 'per_day',
    image_filename: 'addon-seafood-platter.jpg',
    metadata: {
      unit: 'per_day',
      category: 'Food & Beverage',
      max_quantity: 3,
      quantity_allowed: true,
      recommended_for: ['2d-fraser-rainbow', '3d-fraser-combo'],
      tags: ['seafood', 'fresh', 'queensland', 'ocean-to-table'],
    },
  },
  {
    handle: 'addon-bbq',
    title: 'BBQ on the Beach',
    description: 'Classic beach BBQ setup with premium Australian meats, vegetables, and all equipment. Perfect for group dining under the stars.',
    category: 'Food & Beverage',
    price_dollars: 120,
    pricing_type: 'per_day',
    image_filename: 'addon-bbq.jpg',
    metadata: {
      unit: 'per_day',
      category: 'Food & Beverage',
      max_quantity: 3,
      quantity_allowed: true,
      recommended_for: ['2d-fraser-rainbow', '3d-fraser-combo'],
      tags: ['bbq', 'beach', 'group', 'dining'],
    },
  },
  {
    handle: 'addon-picnic',
    title: 'Gourmet Picnic Package',
    description: 'Upscale picnic package with gourmet sandwiches, salads, desserts, and premium beverages. Elegantly presented for beach dining.',
    category: 'Food & Beverage',
    price_dollars: 95,
    pricing_type: 'per_booking',
    image_filename: 'addon-picnic.jpg',
    metadata: {
      unit: 'per_booking',
      category: 'Food & Beverage',
      max_quantity: 5,
      quantity_allowed: true,
      recommended_for: ['1d-fraser-express', '2d-fraser-rainbow'],
      tags: ['picnic', 'gourmet', 'beach', 'dining'],
    },
  },

  // Connectivity Category
  {
    handle: 'addon-internet',
    title: 'Always-on High-Speed Internet',
    description: 'Portable 4G/5G hotspot with unlimited data. Stay connected even in remote Fraser Island locations. Up to 10 devices.',
    category: 'Connectivity',
    price_dollars: 30,
    pricing_type: 'per_day',
    image_filename: 'addon-internet.jpg',
    metadata: {
      unit: 'per_day',
      category: 'Connectivity',
      max_quantity: 2,
      quantity_allowed: true,
      recommended_for: ['2d-fraser-rainbow', '3d-fraser-combo'],
      tags: ['wifi', 'internet', 'connectivity', 'remote-work'],
    },
  },
  {
    handle: 'addon-starlink',
    title: 'Starlink Satellite Internet',
    description: 'Premium Starlink satellite internet for ultra-fast connectivity anywhere. Perfect for digital nomads and remote workers.',
    category: 'Connectivity',
    price_dollars: 50,
    pricing_type: 'per_day',
    image_filename: 'addon-starlink.jpg',
    metadata: {
      unit: 'per_day',
      category: 'Connectivity',
      max_quantity: 1,
      quantity_allowed: false,
      recommended_for: ['3d-fraser-combo'],
      tags: ['starlink', 'satellite', 'premium', 'internet'],
    },
  },

  // Photography Category
  {
    handle: 'addon-drone-photography',
    title: 'Aerial Photography Package',
    description: 'Professional drone photography and videography. Capture stunning aerial views of your Fraser Island adventure. Includes edited photos and 4K video.',
    category: 'Photography',
    price_dollars: 200,
    pricing_type: 'per_booking',
    image_filename: 'addon-drone-photography.jpg',
    metadata: {
      unit: 'per_booking',
      category: 'Photography',
      max_quantity: 1,
      quantity_allowed: false,
      recommended_for: ['2d-fraser-rainbow', '3d-fraser-combo'],
      tags: ['drone', 'aerial', 'photography', 'video'],
    },
  },
  {
    handle: 'addon-gopro',
    title: 'GoPro Package',
    description: 'GoPro Hero 12 with mounts, waterproof case, and accessories. Capture POV footage of your 4WD and water adventures.',
    category: 'Photography',
    price_dollars: 75,
    pricing_type: 'per_booking',
    image_filename: 'addon-gopro.jpg',
    metadata: {
      unit: 'per_booking',
      category: 'Photography',
      max_quantity: 3,
      quantity_allowed: true,
      recommended_for: ['1d-fraser-express', '2d-fraser-rainbow', '3d-fraser-combo'],
      tags: ['gopro', 'action-camera', 'waterproof', 'pov'],
    },
  },
  {
    handle: 'addon-photo-album',
    title: 'Professional Photo Album',
    description: 'Premium hardcover photo album with professional editing and printing. Preserve your Fraser Island memories in heirloom quality.',
    category: 'Photography',
    price_dollars: 150,
    pricing_type: 'per_booking',
    image_filename: 'addon-photo-album.jpg',
    metadata: {
      unit: 'per_booking',
      category: 'Photography',
      max_quantity: 3,
      quantity_allowed: true,
      recommended_for: ['2d-fraser-rainbow', '3d-fraser-combo'],
      tags: ['photo-album', 'memories', 'print', 'professional'],
    },
  },
  {
    handle: 'addon-camera',
    title: 'Professional Camera Rental',
    description: 'Canon EOS R6 or Nikon Z6 II with premium lenses. Perfect for capturing high-quality landscape and wildlife photography.',
    category: 'Photography',
    price_dollars: 100,
    pricing_type: 'per_booking',
    image_filename: 'addon-camera.jpg',
    metadata: {
      unit: 'per_booking',
      category: 'Photography',
      max_quantity: 2,
      quantity_allowed: true,
      recommended_for: ['2d-fraser-rainbow', '3d-fraser-combo'],
      tags: ['camera', 'dslr', 'professional', 'rental'],
    },
  },

  // Accommodation & Comfort Category
  {
    handle: 'addon-glamping',
    title: 'Glamping Setup',
    description: 'Luxury safari-style tent with hotel-quality bedding, solar lighting, and comfortable furnishings. Beach or rainforest location.',
    category: 'Accommodation & Comfort',
    price_dollars: 250,
    pricing_type: 'per_day',
    image_filename: 'addon-glamping.jpg',
    metadata: {
      unit: 'per_day',
      category: 'Accommodation & Comfort',
      max_quantity: 3,
      quantity_allowed: true,
      recommended_for: ['2d-fraser-rainbow', '3d-fraser-combo'],
      tags: ['glamping', 'luxury', 'camping', 'comfort'],
    },
  },
  {
    handle: 'addon-beach-cabana',
    title: 'Beach Cabana',
    description: 'Private beach cabana with luxury loungers, shade, and refreshments. Your exclusive beachfront retreat on Rainbow Beach.',
    category: 'Accommodation & Comfort',
    price_dollars: 180,
    pricing_type: 'per_day',
    image_filename: 'addon-beach-cabana.jpg',
    metadata: {
      unit: 'per_day',
      category: 'Accommodation & Comfort',
      max_quantity: 2,
      quantity_allowed: true,
      recommended_for: ['1d-fraser-express', '2d-fraser-rainbow'],
      tags: ['cabana', 'beach', 'luxury', 'shade'],
    },
  },
  {
    handle: 'addon-eco-lodge',
    title: 'Eco-Lodge Upgrade',
    description: 'Premium eco-lodge accommodation with ocean views, sustainable luxury, and modern amenities. Near Fraser Island departure point.',
    category: 'Accommodation & Comfort',
    price_dollars: 300,
    pricing_type: 'per_day',
    image_filename: 'addon-eco-lodge.jpg',
    metadata: {
      unit: 'per_day',
      category: 'Accommodation & Comfort',
      max_quantity: 5,
      quantity_allowed: true,
      recommended_for: ['2d-fraser-rainbow', '3d-fraser-combo'],
      tags: ['eco-lodge', 'sustainable', 'luxury', 'accommodation'],
    },
  },

  // Activities & Equipment Category
  {
    handle: 'addon-fishing',
    title: 'Fishing Equipment',
    description: 'Complete beach fishing setup with rods, reels, tackle, and bait. Fish the legendary 75 Mile Beach with expert guidance.',
    category: 'Activities & Equipment',
    price_dollars: 65,
    pricing_type: 'per_day',
    image_filename: 'addon-fishing.jpg',
    metadata: {
      unit: 'per_day',
      category: 'Activities & Equipment',
      max_quantity: 5,
      quantity_allowed: true,
      recommended_for: ['2d-fraser-rainbow', '3d-fraser-combo'],
      tags: ['fishing', 'beach', 'equipment', 'sport'],
    },
  },
  {
    handle: 'addon-sandboarding',
    title: 'Sandboarding Gear',
    description: 'Sandboards and safety equipment for Rainbow Beach\'s iconic colored sand dunes. Thrilling adventure for all skill levels.',
    category: 'Activities & Equipment',
    price_dollars: 45,
    pricing_type: 'per_booking',
    image_filename: 'addon-sandboarding.jpg',
    metadata: {
      unit: 'per_booking',
      category: 'Activities & Equipment',
      max_quantity: 6,
      quantity_allowed: true,
      recommended_for: ['1d-fraser-express', '2d-fraser-rainbow'],
      tags: ['sandboarding', 'dunes', 'adventure', 'sport'],
    },
  },
  {
    handle: 'addon-bodyboarding',
    title: 'Bodyboarding Set',
    description: 'Quality bodyboards, fins, and wetsuits. Perfect waves on Fraser Island\'s 75 Mile Beach for all skill levels.',
    category: 'Activities & Equipment',
    price_dollars: 35,
    pricing_type: 'per_booking',
    image_filename: 'addon-bodyboarding.jpg',
    metadata: {
      unit: 'per_booking',
      category: 'Activities & Equipment',
      max_quantity: 8,
      quantity_allowed: true,
      recommended_for: ['1d-fraser-express', '2d-fraser-rainbow', '3d-fraser-combo'],
      tags: ['bodyboarding', 'waves', 'beach', 'water-sport'],
    },
  },
  {
    handle: 'addon-paddleboarding',
    title: 'Paddleboarding Package',
    description: 'Stand-up paddleboards with accessories. Explore crystal-clear Lake McKenzie and sheltered bays at your own pace.',
    category: 'Activities & Equipment',
    price_dollars: 55,
    pricing_type: 'per_day',
    image_filename: 'addon-paddleboarding.jpg',
    metadata: {
      unit: 'per_day',
      category: 'Activities & Equipment',
      max_quantity: 4,
      quantity_allowed: true,
      recommended_for: ['2d-fraser-rainbow', '3d-fraser-combo'],
      tags: ['paddleboarding', 'sup', 'lake', 'water-sport'],
    },
  },
  {
    handle: 'addon-kayaking',
    title: 'Kayaking Adventure',
    description: 'Ocean kayaking equipment and guided exploration. Discover hidden coves and encounter dolphins around Fraser Island.',
    category: 'Activities & Equipment',
    price_dollars: 75,
    pricing_type: 'per_day',
    image_filename: 'addon-kayaking.jpg',
    metadata: {
      unit: 'per_day',
      category: 'Activities & Equipment',
      max_quantity: 4,
      quantity_allowed: true,
      recommended_for: ['2d-fraser-rainbow', '3d-fraser-combo'],
      tags: ['kayaking', 'ocean', 'adventure', 'wildlife'],
    },
  },
];

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Fetch with timeout
 */
async function fetchWithTimeout(url: string, options: any, timeout: number): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return response as Response;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}

/**
 * Log with timestamp
 */
function log(message: string, level: 'info' | 'warn' | 'error' | 'success' = 'info') {
  const timestamp = new Date().toISOString();
  const prefix = {
    info: '📝',
    warn: '⚠️',
    error: '❌',
    success: '✅',
  }[level];

  console.log(`[${timestamp}] ${prefix} ${message}`);
}

/**
 * Get full image URL
 */
function getImageUrl(filename: string): string {
  return `${CONFIG.IMAGE_BASE_URL}/images/addons/${filename}`;
}

// ============================================================================
// Medusa API Functions
// ============================================================================

/**
 * Check if product with handle already exists
 */
async function productExists(handle: string): Promise<boolean> {
  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (CONFIG.PUBLISHABLE_KEY) {
      headers['x-publishable-api-key'] = CONFIG.PUBLISHABLE_KEY;
    }

    const response = await fetchWithTimeout(
      `${CONFIG.BACKEND_URL}/store/products?handle=${handle}`,
      { headers },
      CONFIG.TIMEOUT_MS
    );

    if (!response.ok) {
      throw new Error(`API responded with ${response.status}`);
    }

    const data = await response.json();
    return data.products && data.products.length > 0;
  } catch (error) {
    log(`Error checking if product exists: ${error}`, 'error');
    return false;
  }
}

/**
 * Create product in Medusa
 */
async function createProduct(addonData: AddonData): Promise<any> {
  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (CONFIG.PUBLISHABLE_KEY) {
      headers['x-publishable-api-key'] = CONFIG.PUBLISHABLE_KEY;
    }

    // Medusa v2 product creation payload
    const productPayload = {
      title: addonData.title,
      handle: addonData.handle,
      description: addonData.description,
      is_giftcard: false,
      discountable: true,
      thumbnail: getImageUrl(addonData.image_filename),
      images: [
        {
          url: getImageUrl(addonData.image_filename),
        },
      ],
      // Metadata for add-on specific fields
      metadata: addonData.metadata,
      // Product options (required by Medusa)
      options: [
        {
          title: 'Default Option',
        },
      ],
      // Variants with pricing
      variants: [
        {
          title: 'Default',
          inventory_quantity: 9999, // High inventory for add-ons
          manage_inventory: false,
          prices: [
            {
              currency_code: 'aud',
              amount: addonData.price_dollars, // Medusa v2 uses dollars
              region_id: CONFIG.REGION_ID,
            },
          ],
          options: {
            'Default Option': 'Default',
          },
        },
      ],
    };

    if (CONFIG.VERBOSE) {
      log(`Creating product payload: ${JSON.stringify(productPayload, null, 2)}`, 'info');
    }

    const response = await fetchWithTimeout(
      `${CONFIG.BACKEND_URL}/admin/products`,
      {
        method: 'POST',
        headers: {
          ...headers,
          // Admin API requires admin auth token
          // This should be set in Railway environment or passed as parameter
          'Authorization': `Bearer ${process.env.MEDUSA_ADMIN_TOKEN || ''}`,
        },
        body: JSON.stringify(productPayload),
      },
      CONFIG.TIMEOUT_MS
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API responded with ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    return data.product;
  } catch (error) {
    log(`Error creating product: ${error}`, 'error');
    throw error;
  }
}

// ============================================================================
// Main Seeding Function
// ============================================================================

/**
 * Seed all add-on products to Medusa backend
 */
async function seedAddons() {
  log('🚀 Starting add-ons seeding script', 'info');
  log(`Backend URL: ${CONFIG.BACKEND_URL}`, 'info');
  log(`Image Base URL: ${CONFIG.IMAGE_BASE_URL}`, 'info');
  log(`Region ID: ${CONFIG.REGION_ID}`, 'info');
  log(`Total add-ons to seed: ${ADDON_PRODUCTS.length}`, 'info');
  log(`Dry run mode: ${CONFIG.DRY_RUN}`, 'info');
  console.log('');

  if (!CONFIG.PUBLISHABLE_KEY) {
    log('Warning: NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY not set. Some operations may fail.', 'warn');
  }

  const results = {
    total: ADDON_PRODUCTS.length,
    created: 0,
    skipped: 0,
    failed: 0,
    errors: [] as string[],
  };

  for (const addon of ADDON_PRODUCTS) {
    try {
      log(`Processing: ${addon.title} (${addon.handle})`, 'info');

      // Check if product already exists (idempotency)
      const exists = await productExists(addon.handle);

      if (exists) {
        log(`  ⏭️  Skipped: Product already exists`, 'warn');
        results.skipped++;
        continue;
      }

      if (CONFIG.DRY_RUN) {
        log(`  🔍 Dry run: Would create product`, 'info');
        results.created++;
        continue;
      }

      // Create the product
      const product = await createProduct(addon);
      log(`  ✅ Created: ${product.id}`, 'success');
      results.created++;

    } catch (error) {
      const errorMsg = `Failed to create ${addon.handle}: ${error}`;
      log(`  ❌ ${errorMsg}`, 'error');
      results.failed++;
      results.errors.push(errorMsg);
    }

    // Small delay between requests to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  // Print summary
  console.log('');
  log('📊 Seeding Summary:', 'info');
  log(`  Total add-ons: ${results.total}`, 'info');
  log(`  ✅ Created: ${results.created}`, results.created > 0 ? 'success' : 'info');
  log(`  ⏭️  Skipped (already exist): ${results.skipped}`, results.skipped > 0 ? 'warn' : 'info');
  log(`  ❌ Failed: ${results.failed}`, results.failed > 0 ? 'error' : 'info');

  if (results.errors.length > 0) {
    console.log('');
    log('❌ Errors encountered:', 'error');
    results.errors.forEach((error, index) => {
      log(`  ${index + 1}. ${error}`, 'error');
    });
  }

  console.log('');
  if (results.failed === 0) {
    log('🎉 Add-ons seeding completed successfully!', 'success');
    process.exit(0);
  } else {
    log('⚠️ Add-ons seeding completed with errors. Check logs above.', 'warn');
    process.exit(1);
  }
}

// ============================================================================
// Script Execution
// ============================================================================

// Handle unhandled rejections
process.on('unhandledRejection', (error) => {
  log(`Unhandled rejection: ${error}`, 'error');
  process.exit(1);
});

// Run the script
if (require.main === module) {
  seedAddons().catch((error) => {
    log(`Fatal error: ${error}`, 'error');
    process.exit(1);
  });
}

export { seedAddons, ADDON_PRODUCTS, CONFIG };
