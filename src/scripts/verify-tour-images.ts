import { ExecArgs } from "@medusajs/framework/types";
import {
  ContainerRegistrationKeys,
  Modules,
} from "@medusajs/framework/utils";

/**
 * Verify tour images were uploaded successfully
 *
 * This script queries all tour products and displays their image information
 */
export default async function verifyTourImages({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER);
  const productModuleService = container.resolve(Modules.PRODUCT);

  logger.info("Verifying tour product images...");

  const tourHandles = [
    "1d-fraser-island",
    "1d-rainbow-beach",
    "2d-fraser-rainbow",
    "3d-fraser-rainbow",
    "4d-fraser-rainbow",
  ];

  const results: any[] = [];

  for (const handle of tourHandles) {
    const products = await productModuleService.listProducts(
      { handle },
      {
        relations: ["images"],
      }
    );

    if (products.length === 0) {
      logger.warn(`Product not found: ${handle}`);
      results.push({
        handle,
        status: "NOT_FOUND",
        title: null,
        thumbnail: null,
        images: [],
      });
      continue;
    }

    const product = products[0];

    const productInfo = {
      handle: product.handle,
      status: "FOUND",
      id: product.id,
      title: product.title,
      thumbnail: product.thumbnail,
      imageCount: product.images?.length || 0,
      images: product.images?.map((img: any) => ({
        id: img.id,
        url: img.url,
      })) || [],
    };

    results.push(productInfo);

    logger.info(`\n--- ${product.title} ---`);
    logger.info(`Handle: ${product.handle}`);
    logger.info(`ID: ${product.id}`);
    logger.info(`Thumbnail: ${product.thumbnail || "NOT SET"}`);
    logger.info(`Images (${productInfo.imageCount}):`);

    if (product.images && product.images.length > 0) {
      product.images.forEach((img: any, idx: number) => {
        logger.info(`  ${idx + 1}. ${img.url}`);
      });
    } else {
      logger.warn(`  No images found!`);
    }
  }

  // Summary
  logger.info("\n\n=== SUMMARY ===");
  logger.info(`Total products checked: ${results.length}`);
  logger.info(`Products with images: ${results.filter(r => r.imageCount > 0).length}`);
  logger.info(`Products without images: ${results.filter(r => r.imageCount === 0).length}`);

  // JSON output for automation
  logger.info("\n\n=== JSON OUTPUT ===");
  console.log(JSON.stringify(results, null, 2));

  logger.info("\nVerification complete!");
}
