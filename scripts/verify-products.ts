/**
 * Verify products in database
 * Usage: pnpm medusa exec ./scripts/verify-products.ts
 */

import { ExecArgs } from "@medusajs/framework/types";
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils";

export default async function verifyProducts({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER);
  const productModuleService = container.resolve(Modules.PRODUCT);

  logger.info("Fetching all products...");

  const products = await productModuleService.listProducts({}, {
    relations: ["variants", "variants.prices"],
  });

  logger.info(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  logger.info(`📦 Total products: ${products.length}`);
  logger.info(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);

  products.forEach((p, idx) => {
    logger.info(`${idx + 1}. ${p.title}`);
    logger.info(`   Handle: ${p.handle}`);
    logger.info(`   Status: ${p.status}`);
    logger.info(`   Variants: ${p.variants?.length || 0}`);

    if (p.variants && p.variants.length > 0) {
      const variant = p.variants[0];
      logger.info(`   Prices: ${variant.prices?.length || 0}`);
    }
    logger.info('');
  });

  logger.info("Verification complete!");
}
