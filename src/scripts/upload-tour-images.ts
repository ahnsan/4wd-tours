import { ExecArgs } from "@medusajs/framework/types";
import {
  ContainerRegistrationKeys,
  Modules,
} from "@medusajs/framework/utils";
import { uploadFilesWorkflow } from "@medusajs/medusa/core-flows";
import { updateProductsWorkflow } from "@medusajs/medusa/core-flows";
import * as fs from "fs";
import * as path from "path";

/**
 * Upload tour images to Medusa products
 *
 * This script:
 * 1. Reads image files from storefront/public/images/tours/
 * 2. Uploads them to Medusa using the file service
 * 3. Updates tour products with the uploaded image URLs
 */
export default async function uploadTourImages({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER);
  const productModuleService = container.resolve(Modules.PRODUCT);

  logger.info("Starting tour image upload process...");

  // Define image mappings: product handle -> [primary image, ...additional images]
  const imageMapping: Record<string, string[]> = {
    "1d-fraser-island": ["kgari-aerial.jpg", "kgari-dingo.jpg"],
    "1d-rainbow-beach": ["rainbow-beach.jpg", "double-island-point.jpg"],
    "2d-fraser-rainbow": ["4wd-on-beach.jpg", "double-island-point.jpg"],
    "3d-fraser-rainbow": ["kgari-wreck.jpg", "kgari-aerial.jpg"],
    "4d-fraser-rainbow": ["Double-island-2.jpg", "kgari-aerial.jpg", "4wd-on-beach.jpg"],
  };

  const imagesDir = path.resolve(process.cwd(), "storefront/public/images/tours");

  // Check if images directory exists
  if (!fs.existsSync(imagesDir)) {
    logger.error(`Images directory not found: ${imagesDir}`);
    return;
  }

  logger.info(`Reading images from: ${imagesDir}`);

  // Process each product
  for (const [handle, imageFiles] of Object.entries(imageMapping)) {
    logger.info(`Processing product: ${handle}`);

    // Find the product
    const products = await productModuleService.listProducts({ handle });

    if (products.length === 0) {
      logger.warn(`Product not found: ${handle}, skipping...`);
      continue;
    }

    const product = products[0];
    logger.info(`Found product: ${product.title} (ID: ${product.id})`);

    // Prepare files for upload
    const filesToUpload: any[] = [];

    for (const imageFile of imageFiles) {
      const imagePath = path.join(imagesDir, imageFile);

      if (!fs.existsSync(imagePath)) {
        logger.warn(`Image file not found: ${imagePath}, skipping...`);
        continue;
      }

      // Read file as binary
      const fileContent = fs.readFileSync(imagePath);
      const base64Content = fileContent.toString('base64');

      // Determine MIME type
      const ext = path.extname(imageFile).toLowerCase();
      const mimeTypes: Record<string, string> = {
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.png': 'image/png',
        '.webp': 'image/webp',
        '.gif': 'image/gif',
      };
      const mimeType = mimeTypes[ext] || 'image/jpeg';

      filesToUpload.push({
        filename: imageFile,
        mimeType,
        content: base64Content,
        access: 'public' as const,
      });

      logger.info(`Prepared file for upload: ${imageFile} (${mimeType})`);
    }

    if (filesToUpload.length === 0) {
      logger.warn(`No valid images found for product: ${handle}, skipping...`);
      continue;
    }

    try {
      // Upload files using Medusa workflow
      logger.info(`Uploading ${filesToUpload.length} file(s) for ${handle}...`);

      const { result: uploadedFiles } = await uploadFilesWorkflow(container).run({
        input: {
          files: filesToUpload,
        },
      });

      logger.info(`Successfully uploaded ${uploadedFiles.length} file(s)`);

      // Extract URLs from uploaded files
      const imageUrls = uploadedFiles.map((file: any) => file.url);
      const thumbnailUrl = imageUrls[0]; // First image is the thumbnail

      logger.info(`Image URLs: ${imageUrls.join(', ')}`);
      logger.info(`Thumbnail URL: ${thumbnailUrl}`);

      // Update product with images using productModuleService directly
      logger.info(`Updating product ${handle} with images...`);

      await productModuleService.updateProducts(product.id, {
        thumbnail: thumbnailUrl,
        images: imageUrls.map((url: string) => ({ url })),
      });

      logger.info(`Successfully updated product ${handle} with ${imageUrls.length} image(s)`);

    } catch (error) {
      logger.error(`Error uploading images for ${handle}:`, error);
    }
  }

  logger.info("Finished uploading tour images!");
}
