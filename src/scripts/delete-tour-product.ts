import { ExecArgs } from "@medusajs/framework/types";
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils";
import { deleteProductsWorkflow } from "@medusajs/medusa/core-flows";

export default async function deleteTourProduct({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER);
  const productModuleService = container.resolve(Modules.PRODUCT);

  logger.info("Deleting existing tour product...");

  const existingProducts = await productModuleService.listProducts({
    handle: "2d-fraser-rainbow",
  });

  if (existingProducts.length > 0) {
    logger.info(`Found ${existingProducts.length} product(s) to delete`);

    for (const product of existingProducts) {
      await deleteProductsWorkflow(container).run({
        input: {
          ids: [product.id],
        },
      });
      logger.info(`Deleted product: ${product.id} - ${product.title}`);
    }
  } else {
    logger.info("No tour products found to delete");
  }

  logger.info("Finished deleting tour products");
}
