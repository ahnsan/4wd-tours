/**
 * Add-on Images Utility
 *
 * Maps add-on handles to their corresponding images from the manifest.
 * Provides image paths and alt text for Next.js Image component optimization.
 */

// Import manifest data (runtime import for Next.js compatibility)
import manifestData from '../../public/addon-images-manifest.json';

// Type the manifest
interface ManifestImage {
  addon_handle: string;
  addon_title: string;
  image_path: string;
  alt_text: string;
  dimensions: string;
  [key: string]: any;
}

interface AddonManifest {
  images: ManifestImage[];
  [key: string]: any;
}

const addonManifest = manifestData as AddonManifest;

export interface AddonImageData {
  addon_handle: string;
  addon_title: string;
  image_path: string;
  alt_text: string;
  dimensions: string;
}

/**
 * Get image data for an add-on by handle
 * @param handle - Add-on handle (e.g., "addon-glamping", "addon-bbq")
 * @returns Image data or null if not found
 */
export function getAddonImageByHandle(handle: string): AddonImageData | null {
  const imageData = addonManifest.images.find(
    (img) => img.addon_handle === handle
  );

  if (!imageData) {
    console.warn(`[Add-on Images] No image found for handle: ${handle}`);
    return null;
  }

  return {
    addon_handle: imageData.addon_handle,
    addon_title: imageData.addon_title,
    image_path: imageData.image_path,
    alt_text: imageData.alt_text,
    dimensions: imageData.dimensions,
  };
}

/**
 * Get image data for an add-on by ID
 * This maps frontend addon IDs to backend handles
 * @param id - Add-on ID (e.g., "addon-1", "prod_123")
 * @param title - Add-on title for fallback matching
 * @returns Image data or null if not found
 */
export function getAddonImageById(id: string, title?: string): AddonImageData | null {
  // First try direct handle match (for backend IDs that are handles)
  let imageData = getAddonImageByHandle(id);

  if (imageData) {
    return imageData;
  }

  // If title provided, try fuzzy matching by title
  if (title) {
    const foundImage = addonManifest.images.find(
      (img) => img.addon_title.toLowerCase().includes(title.toLowerCase()) ||
               title.toLowerCase().includes(img.addon_title.toLowerCase())
    );

    if (foundImage) {
      return {
        addon_handle: foundImage.addon_handle,
        addon_title: foundImage.addon_title,
        image_path: foundImage.image_path,
        alt_text: foundImage.alt_text,
        dimensions: foundImage.dimensions,
      };
    }
  }

  console.warn(`[Add-on Images] No image found for ID: ${id}, title: ${title || 'N/A'}`);
  return null;
}

/**
 * Get fallback image for add-ons without specific images
 */
export function getFallbackAddonImage(): AddonImageData {
  return {
    addon_handle: 'default',
    addon_title: 'Add-on',
    image_path: '/images/addons/default-addon.jpg',
    alt_text: 'Fraser Island 4WD tour add-on',
    dimensions: '1200x800',
  };
}

/**
 * Get all available add-on images
 */
export function getAllAddonImages(): AddonImageData[] {
  return addonManifest.images.map((img) => ({
    addon_handle: img.addon_handle,
    addon_title: img.addon_title,
    image_path: img.image_path,
    alt_text: img.alt_text,
    dimensions: img.dimensions,
  }));
}

/**
 * Check if an add-on has an image
 */
export function hasAddonImage(handle: string): boolean {
  return addonManifest.images.some((img) => img.addon_handle === handle);
}
