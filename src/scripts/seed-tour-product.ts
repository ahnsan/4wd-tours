import { ExecArgs } from "@medusajs/framework/types";
import {
  ContainerRegistrationKeys,
  Modules,
  ProductStatus,
} from "@medusajs/framework/utils";
import {
  createProductsWorkflow,
  createInventoryLevelsWorkflow,
} from "@medusajs/medusa/core-flows";

export default async function seedTourProduct({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER);
  const query = container.resolve(ContainerRegistrationKeys.QUERY);
  const productModuleService = container.resolve(Modules.PRODUCT);
  const salesChannelModuleService = container.resolve(Modules.SALES_CHANNEL);
  const fulfillmentModuleService = container.resolve(Modules.FULFILLMENT);
  const stockLocationModuleService = container.resolve(Modules.STOCK_LOCATION);

  logger.info("Seeding 2d-fraser-rainbow tour product...");

  // Check if product already exists
  const existingProducts = await productModuleService.listProducts({
    handle: "2d-fraser-rainbow",
  });

  if (existingProducts.length > 0) {
    logger.info("Tour product already exists, skipping.");
    return;
  }

  // Get default sales channel
  const defaultSalesChannel = await salesChannelModuleService.listSalesChannels({
    name: "Default Sales Channel",
  });

  if (!defaultSalesChannel.length) {
    logger.error("Default sales channel not found!");
    return;
  }

  // Get shipping profile
  const shippingProfiles = await fulfillmentModuleService.listShippingProfiles({
    type: "default",
  });

  if (!shippingProfiles.length) {
    logger.error("Default shipping profile not found!");
    return;
  }

  const shippingProfile = shippingProfiles[0];

  logger.info("Creating tour product...");

  // Create product
  const { result: productResult } = await createProductsWorkflow(container).run({
    input: {
      products: [
        {
          title: "2 Day Fraser Island & Rainbow Beach Adventure",
          description:
            "Experience the ultimate 2-day 4WD adventure exploring Fraser Island and Rainbow Beach. Drive along pristine beaches, discover freshwater lakes, rainforests, and witness stunning coastal landscapes. Perfect for adventure seekers!",
          handle: "2d-fraser-rainbow",
          weight: 0,
          status: ProductStatus.PUBLISHED,
          shipping_profile_id: shippingProfile.id,
          metadata: {
            duration: "2 days",
            category: "4WD Tour",
            location: "Fraser Island & Rainbow Beach",
            difficulty: "moderate",
            includes: "4WD vehicle, camping equipment, guide",
          },
          images: [
            {
              url: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4",
            },
          ],
          options: [
            {
              title: "Participants",
              values: ["1 Person", "2 People", "3 People", "4 People"],
            },
          ],
          variants: [
            {
              title: "1 Person",
              sku: "FRASER-2D-1P",
              options: {
                Participants: "1 Person",
              },
              prices: [
                {
                  amount: 59900,
                  currency_code: "aud",
                },
              ],
            },
            {
              title: "2 People",
              sku: "FRASER-2D-2P",
              options: {
                Participants: "2 People",
              },
              prices: [
                {
                  amount: 109900,
                  currency_code: "aud",
                },
              ],
            },
            {
              title: "3 People",
              sku: "FRASER-2D-3P",
              options: {
                Participants: "3 People",
              },
              prices: [
                {
                  amount: 159900,
                  currency_code: "aud",
                },
              ],
            },
            {
              title: "4 People",
              sku: "FRASER-2D-4P",
              options: {
                Participants: "4 People",
              },
              prices: [
                {
                  amount: 209900,
                  currency_code: "aud",
                },
              ],
            },
          ],
          sales_channels: [
            {
              id: defaultSalesChannel[0].id,
            },
          ],
        },
      ],
    },
  });

  logger.info(`Created product: ${productResult[0].title}`);

  // Create inventory levels
  const { data: inventoryItems } = await query.graph({
    entity: "inventory_item",
    fields: ["id"],
  });

  const stockLocations = await stockLocationModuleService.listStockLocations({});
  const stockLocation = stockLocations[0];

  if (!stockLocation) {
    logger.error("No stock location found!");
    return;
  }

  logger.info("Creating inventory levels...");

  const inventoryLevels: any[] = [];
  for (const inventoryItem of inventoryItems) {
    const inventoryLevel = {
      location_id: stockLocation.id,
      stocked_quantity: 1000000,
      inventory_item_id: inventoryItem.id,
    };
    inventoryLevels.push(inventoryLevel);
  }

  await createInventoryLevelsWorkflow(container).run({
    input: {
      inventory_levels: inventoryLevels,
    },
  });

  logger.info("Finished seeding tour product!");
}
