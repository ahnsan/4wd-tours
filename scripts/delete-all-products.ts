/**
 * Delete all products to allow clean re-seeding
 * Usage: pnpm medusa exec ./scripts/delete-all-products.ts
 */

import { ExecArgs } from "@medusajs/framework/types";
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils";
import { deleteProductsWorkflow } from "@medusajs/medusa/core-flows";

export default async function deleteAllProducts({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER);
  const productModuleService = container.resolve(Modules.PRODUCT);

  logger.info("Fetching all products...");

  const products = await productModuleService.listProducts({});

  if (products.length === 0) {
    logger.info("No products found to delete");
    return;
  }

  logger.info(`Found ${products.length} products to delete`);

  const productIds = products.map(p => p.id);

  logger.info("Deleting products...");

  await deleteProductsWorkflow(container).run({
    input: {
      ids: productIds,
    },
  });

  logger.info(`✓ Successfully deleted ${products.length} products`);
  logger.info("\nYou can now re-seed with:");
  logger.info("  pnpm medusa exec ./src/scripts/seed.ts");
  logger.info("  pnpm medusa exec ./scripts/seed-tours.ts");
}
