import { CreateInventoryLevelInput, ExecArgs } from "@medusajs/framework/types";
import {
  ContainerRegistrationKeys,
  Modules,
  ProductStatus,
} from "@medusajs/framework/utils";
import {
  createApiKeysWorkflow,
  createInventoryLevelsWorkflow,
  createProductCategoriesWorkflow,
  createProductsWorkflow,
  createRegionsWorkflow,
  createSalesChannelsWorkflow,
  createShippingOptionsWorkflow,
  createShippingProfilesWorkflow,
  createStockLocationsWorkflow,
  createTaxRegionsWorkflow,
  linkSalesChannelsToApiKeyWorkflow,
  linkSalesChannelsToStockLocationWorkflow,
  updateStoresStep,
  updateStoresWorkflow,
} from "@medusajs/medusa/core-flows";
import {
  createWorkflow,
  transform,
  WorkflowResponse,
} from "@medusajs/workflows-sdk";

const updateStoreCurrencies = createWorkflow(
  "update-store-currencies",
  (input: {
    supported_currencies: { currency_code: string; is_default?: boolean }[];
    store_id: string;
  }) => {
    const normalizedInput = transform({ input }, (data) => {
      return {
        selector: { id: data.input.store_id },
        update: {
          supported_currencies: data.input.supported_currencies.map(
            (currency) => {
              return {
                currency_code: currency.currency_code,
                is_default: currency.is_default ?? false,
              };
            }
          ),
        },
      };
    });

    const stores = updateStoresStep(normalizedInput);

    return new WorkflowResponse(stores);
  }
);

export default async function seedProductionData({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER);
  const link = container.resolve(ContainerRegistrationKeys.LINK);
  const query = container.resolve(ContainerRegistrationKeys.QUERY);
  const fulfillmentModuleService = container.resolve(Modules.FULFILLMENT);
  const salesChannelModuleService = container.resolve(Modules.SALES_CHANNEL);
  const storeModuleService = container.resolve(Modules.STORE);

  // Only Australia
  const countries = ["au"];

  logger.info("Seeding store data...");
  const [store] = await storeModuleService.listStores();
  let defaultSalesChannel = await salesChannelModuleService.listSalesChannels({
    name: "Default Sales Channel",
  });

  if (!defaultSalesChannel.length) {
    const { result: salesChannelResult } = await createSalesChannelsWorkflow(
      container
    ).run({
      input: {
        salesChannelsData: [
          {
            name: "Default Sales Channel",
          },
        ],
      },
    });
    defaultSalesChannel = salesChannelResult;
  }

  // Only AUD currency
  await updateStoreCurrencies(container).run({
    input: {
      store_id: store.id,
      supported_currencies: [
        {
          currency_code: "aud",
          is_default: true,
        },
      ],
    },
  });

  await updateStoresWorkflow(container).run({
    input: {
      selector: { id: store.id },
      update: {
        default_sales_channel_id: defaultSalesChannel[0].id,
      },
    },
  });

  logger.info("Seeding region data...");
  const regionModuleService = container.resolve(Modules.REGION);
  let existingRegions = await regionModuleService.listRegions({});
  let region = existingRegions.find(r => r.currency_code === "aud");

  if (!region) {
    const { result: regionResult } = await createRegionsWorkflow(container).run({
      input: {
        regions: [
          {
            name: "Australia",
            currency_code: "aud",
            countries,
            payment_providers: ["pp_system_default", "pp_stripe_stripe"],
          },
        ],
      },
    });
    region = regionResult[0];
  }
  logger.info("Finished seeding regions.");

  logger.info("Seeding tax regions...");
  const taxModuleService = container.resolve(Modules.TAX);
  const existingTaxRegions = await taxModuleService.listTaxRegions({});
  const existingTaxCountries = existingTaxRegions.map((tr) => tr.country_code);

  const newTaxCountries = countries.filter(
    (country) => !existingTaxCountries.includes(country)
  );

  if (newTaxCountries.length > 0) {
    await createTaxRegionsWorkflow(container).run({
      input: newTaxCountries.map((country_code) => ({
        country_code,
        provider_id: "tp_system",
      })),
    });
    logger.info(`Created ${newTaxCountries.length} new tax regions.`);
  } else {
    logger.info("All tax regions already exist.");
  }
  logger.info("Finished seeding tax regions.");

  logger.info("Seeding stock location data...");
  const { result: stockLocationResult} = await createStockLocationsWorkflow(
    container
  ).run({
    input: {
      locations: [
        {
          name: "Sunshine Coast Base",
          address: {
            city: "Sunshine Coast",
            country_code: "AU",
            address_1: "Queensland",
          },
        },
      ],
    },
  });
  const stockLocation = stockLocationResult[0];

  await updateStoresWorkflow(container).run({
    input: {
      selector: { id: store.id },
      update: {
        default_location_id: stockLocation.id,
      },
    },
  });

  await link.create({
    [Modules.STOCK_LOCATION]: {
      stock_location_id: stockLocation.id,
    },
    [Modules.FULFILLMENT]: {
      fulfillment_provider_id: "manual_manual",
    },
  });

  logger.info("Seeding fulfillment data...");
  const shippingProfiles = await fulfillmentModuleService.listShippingProfiles({
    type: "default",
  });
  let shippingProfile = shippingProfiles.length ? shippingProfiles[0] : null;

  if (!shippingProfile) {
    const { result: shippingProfileResult } =
      await createShippingProfilesWorkflow(container).run({
        input: {
          data: [
            {
              name: "Default Shipping Profile",
              type: "default",
            },
          ],
        },
      });
    shippingProfile = shippingProfileResult[0];
  }

  const fulfillmentSet = await fulfillmentModuleService.createFulfillmentSets({
    name: "Sunshine Coast Tours",
    type: "shipping",
    service_zones: [
      {
        name: "Australia",
        geo_zones: [
          {
            country_code: "au",
            type: "country",
          },
        ],
      },
    ],
  });

  await link.create({
    [Modules.STOCK_LOCATION]: {
      stock_location_id: stockLocation.id,
    },
    [Modules.FULFILLMENT]: {
      fulfillment_set_id: fulfillmentSet.id,
    },
  });

  await createShippingOptionsWorkflow(container).run({
    input: [
      {
        name: "Tour Pickup - Sunshine Coast",
        price_type: "flat",
        provider_id: "manual_manual",
        service_zone_id: fulfillmentSet.service_zones[0].id,
        shipping_profile_id: shippingProfile.id,
        type: {
          label: "Pickup",
          description: "Pickup from designated meeting point.",
          code: "tour-pickup",
        },
        prices: [
          {
            currency_code: "aud",
            amount: 0,
          },
          {
            region_id: region.id,
            amount: 0,
          },
        ],
        rules: [
          {
            attribute: "enabled_in_store",
            value: "true",
            operator: "eq",
          },
          {
            attribute: "is_return",
            value: "false",
            operator: "eq",
          },
        ],
      },
    ],
  });
  logger.info("Finished seeding fulfillment data.");

  await linkSalesChannelsToStockLocationWorkflow(container).run({
    input: {
      id: stockLocation.id,
      add: [defaultSalesChannel[0].id],
    },
  });
  logger.info("Finished seeding stock location data.");

  logger.info("Seeding publishable API key data...");
  const { result: publishableApiKeyResult } = await createApiKeysWorkflow(
    container
  ).run({
    input: {
      api_keys: [
        {
          title: "Webshop",
          type: "publishable",
          created_by: "",
        },
      ],
    },
  });
  const publishableApiKey = publishableApiKeyResult[0];

  await linkSalesChannelsToApiKeyWorkflow(container).run({
    input: {
      id: publishableApiKey.id,
      add: [defaultSalesChannel[0].id],
    },
  });
  logger.info("Finished seeding publishable API key data.");

  logger.info("Seeding product data...");

  const productModuleService = container.resolve(Modules.PRODUCT);
  const existingProducts = await productModuleService.listProducts({});

  if (existingProducts.length > 0) {
    logger.info(`Found ${existingProducts.length} existing products, skipping product seeding.`);
    logger.info("Finished seeding product data.");
    return;
  }

  const { result: categoryResult } = await createProductCategoriesWorkflow(
    container
  ).run({
    input: {
      product_categories: [
        {
          name: "4WD Tours",
          is_active: true,
        },
        {
          name: "Fraser Island Tours",
          is_active: true,
        },
        {
          name: "Rainbow Beach Tours",
          is_active: true,
        },
        {
          name: "Add-ons",
          is_active: true,
        },
      ],
    },
  });

  // Seed all 5 tours + 19 add-ons
  await createProductsWorkflow(container).run({
    input: {
      products: [
        // TOUR 1: 1 Day Rainbow Beach
        {
          title: "1 Day Rainbow Beach Tour",
          handle: "1d-rainbow-beach",
          description: "Embark on an unforgettable 4WD adventure through the stunning colored sands of Rainbow Beach. This full-day tour showcases the natural beauty of Queensland's coast with expert guides leading you through pristine beaches, hidden creeks, and dramatic coastal landscapes.",
          status: ProductStatus.PUBLISHED,
          weight: 0,
          shipping_profile_id: shippingProfile.id,
          metadata: {
            is_tour: true,
            category: "4WD Beach Tour",
            duration: "1 day (7:00 AM - 5:30 PM)",
            location: "Rainbow Beach, Queensland",
            tour_type: "day_tour",
            difficulty: "Easy",
            max_participants: 7,
            duration_days: 1,
          },
          images: [
            {
              url: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4",
            },
          ],
          variants: [
            {
              title: "Default",
              sku: "TOUR-1D-RAINBOW-BEACH",
              manage_inventory: false,
              allow_backorder: false,
              prices: [
                {
                  amount: 2000,
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
        // TOUR 2: 1 Day Fraser Island
        {
          title: "1 Day Fraser Island Tour",
          handle: "1d-fraser-island",
          description: "Discover the magic of K'gari (Fraser Island), the world's largest sand island and UNESCO World Heritage site. This comprehensive day tour takes you to the island's most iconic locations including pristine lakes, ancient rainforests, and the famous 75 Mile Beach.",
          status: ProductStatus.PUBLISHED,
          weight: 0,
          shipping_profile_id: shippingProfile.id,
          metadata: {
            is_tour: true,
            category: "4WD Island Tour",
            duration: "1 day (6:00 AM - 6:30 PM)",
            location: "Fraser Island (K'gari), Queensland",
            tour_type: "day_tour",
            difficulty: "Moderate",
            max_participants: 7,
            duration_days: 1,
          },
          images: [
            {
              url: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4",
            },
          ],
          variants: [
            {
              title: "Default",
              sku: "TOUR-1D-FRASER-ISLAND",
              manage_inventory: false,
              allow_backorder: false,
              prices: [
                {
                  amount: 2000,
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
        // TOUR 3: 2 Day Fraser + Rainbow
        {
          title: "2 Day Fraser + Rainbow Combo",
          handle: "2d-fraser-rainbow",
          description: "The ultimate 2-day 4WD adventure combining the best of Fraser Island and Rainbow Beach. Experience pristine beaches, ancient rainforests, crystal-clear lakes, and dramatic coastal landscapes with overnight eco-lodge accommodation included.",
          status: ProductStatus.PUBLISHED,
          weight: 0,
          shipping_profile_id: shippingProfile.id,
          metadata: {
            is_tour: true,
            category: "4WD Multi-Day Tour",
            duration: "2 days / 1 night",
            location: "Fraser Island & Rainbow Beach, Queensland",
            tour_type: "multi_day",
            difficulty: "Moderate",
            max_participants: 7,
            duration_days: 2,
          },
          images: [
            {
              url: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4",
            },
          ],
          variants: [
            {
              title: "Default",
              sku: "TOUR-2D-FRASER-RAINBOW",
              manage_inventory: false,
              allow_backorder: false,
              prices: [
                {
                  amount: 4000,
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
        // TOUR 4: 3 Day Fraser & Rainbow
        {
          title: "3 Day Fraser & Rainbow Combo",
          handle: "3d-fraser-rainbow",
          description: "Experience the ultimate 3-day 4WD adventure exploring Fraser Island's hidden gems and Rainbow Beach's stunning colored sands. This extended tour includes 2 nights accommodation, all meals, and access to remote locations rarely visited by day-trippers.",
          status: ProductStatus.PUBLISHED,
          weight: 0,
          shipping_profile_id: shippingProfile.id,
          metadata: {
            is_tour: true,
            category: "4WD Extended Tour",
            duration: "3 days / 2 nights",
            location: "Fraser Island & Rainbow Beach, Queensland",
            tour_type: "multi_day",
            difficulty: "Moderate",
            max_participants: 7,
            duration_days: 3,
          },
          images: [
            {
              url: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4",
            },
          ],
          variants: [
            {
              title: "Default",
              sku: "TOUR-3D-FRASER-RAINBOW",
              manage_inventory: false,
              allow_backorder: false,
              prices: [
                {
                  amount: 6000,
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
        // TOUR 5: 4 Day Fraser & Rainbow
        {
          title: "4 Day Fraser & Rainbow Combo",
          handle: "4d-fraser-rainbow",
          description: "The most comprehensive 4WD adventure available on the Sunshine Coast. This 4-day expedition covers every corner of Fraser Island and Rainbow Beach, with 3 nights premium accommodation, all gourmet meals, and exclusive access to remote tracks and hidden locations.",
          status: ProductStatus.PUBLISHED,
          weight: 0,
          shipping_profile_id: shippingProfile.id,
          metadata: {
            is_tour: true,
            category: "4WD Expedition",
            duration: "4 days / 3 nights",
            location: "Fraser Island & Rainbow Beach, Queensland",
            tour_type: "multi_day",
            difficulty: "Moderate to Challenging",
            max_participants: 6,
            duration_days: 4,
          },
          images: [
            {
              url: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4",
            },
          ],
          variants: [
            {
              title: "Default",
              sku: "TOUR-4D-FRASER-RAINBOW",
              manage_inventory: false,
              allow_backorder: false,
              prices: [
                {
                  amount: 8000,
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
        // ADD-ON 1: High-Speed Internet
        {
          title: "Always-on High-Speed Internet",
          handle: "addon-internet",
          description: "Portable wifi hotspot to keep you connected throughout your adventure",
          status: ProductStatus.PUBLISHED,
          weight: 0,
          shipping_profile_id: shippingProfile.id,
          metadata: {
            addon: true,
            category: "Connectivity",
            unit: "per_day",
            icon: "wifi",
          },
          variants: [
            {
              title: "Default",
              sku: "ADDON-ADDON-INTERNET",
              manage_inventory: false,
              allow_backorder: false,
              prices: [
                {
                  amount: 30,
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
        // ADD-ON 2: Glamping Setup
        {
          title: "Glamping Setup",
          handle: "addon-glamping",
          description: "Luxury camping experience with comfortable bedding and premium amenities",
          status: ProductStatus.PUBLISHED,
          weight: 0,
          shipping_profile_id: shippingProfile.id,
          metadata: {
            addon: true,
            category: "Accommodation",
            unit: "per_day",
            icon: "tent",
          },
          variants: [
            {
              title: "Default",
              sku: "ADDON-ADDON-GLAMPING",
              manage_inventory: false,
              allow_backorder: false,
              prices: [
                {
                  amount: 80,
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
        // ADD-ON 3: BBQ on the Beach
        {
          title: "BBQ on the Beach",
          handle: "addon-bbq",
          description: "Complete BBQ kit for beachside cooking experience. Fresh meals under the stars.",
          status: ProductStatus.PUBLISHED,
          weight: 0,
          shipping_profile_id: shippingProfile.id,
          metadata: {
            addon: true,
            category: "Food & Beverage",
            unit: "per_day",
            icon: "utensils",
          },
          variants: [
            {
              title: "Default",
              sku: "ADDON-ADDON-BBQ",
              manage_inventory: false,
              allow_backorder: false,
              prices: [
                {
                  amount: 65,
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
        // ADD-ON 4: Gourmet Beach BBQ
        {
          title: "Gourmet Beach BBQ",
          handle: "addon-gourmet-bbq",
          description: "BBQ setup with premium meats and sides for an unforgettable beach dining experience",
          status: ProductStatus.PUBLISHED,
          weight: 0,
          shipping_profile_id: shippingProfile.id,
          metadata: {
            addon: true,
            category: "Food & Beverage",
            unit: "per_booking",
          },
          variants: [
            {
              title: "Default",
              sku: "ADDON-ADDON-GOURMET-BBQ",
              manage_inventory: false,
              allow_backorder: false,
              prices: [
                {
                  amount: 180,
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
        // ADD-ON 5: Picnic Hamper
        {
          title: "Picnic Hamper",
          handle: "addon-picnic-hamper",
          description: "Gourmet sandwiches, snacks, and drinks perfect for a beach picnic",
          status: ProductStatus.PUBLISHED,
          weight: 0,
          shipping_profile_id: shippingProfile.id,
          metadata: {
            addon: true,
            category: "Food & Beverage",
            unit: "per_booking",
          },
          variants: [
            {
              title: "Default",
              sku: "ADDON-ADDON-PICNIC-HAMPER",
              manage_inventory: false,
              allow_backorder: false,
              prices: [
                {
                  amount: 85,
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
        // ADD-ON 6: Seafood Platter
        {
          title: "Seafood Platter",
          handle: "addon-seafood-platter",
          description: "Fresh local seafood platter featuring the best catches from Queensland waters",
          status: ProductStatus.PUBLISHED,
          weight: 0,
          shipping_profile_id: shippingProfile.id,
          metadata: {
            addon: true,
            category: "Food & Beverage",
            unit: "per_booking",
          },
          variants: [
            {
              title: "Default",
              sku: "ADDON-ADDON-SEAFOOD-PLATTER",
              manage_inventory: false,
              allow_backorder: false,
              prices: [
                {
                  amount: 150,
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
        // ADD-ON 7: Starlink Satellite Internet
        {
          title: "Starlink Satellite Internet",
          handle: "addon-starlink",
          description: "High-speed satellite internet via Starlink - works anywhere with clear sky view",
          status: ProductStatus.PUBLISHED,
          weight: 0,
          shipping_profile_id: shippingProfile.id,
          metadata: {
            addon: true,
            category: "Connectivity",
            unit: "per_day",
          },
          variants: [
            {
              title: "Default",
              sku: "ADDON-ADDON-STARLINK",
              manage_inventory: false,
              allow_backorder: false,
              prices: [
                {
                  amount: 120,
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
        // ADD-ON 8: Luxury Eco-Lodge
        {
          title: "Luxury Eco-Lodge",
          handle: "addon-eco-lodge",
          description: "Premium eco-lodge accommodation with modern amenities and stunning views",
          status: ProductStatus.PUBLISHED,
          weight: 0,
          shipping_profile_id: shippingProfile.id,
          metadata: {
            addon: true,
            category: "Accommodation",
            unit: "per_night",
          },
          variants: [
            {
              title: "Default",
              sku: "ADDON-ADDON-ECO-LODGE",
              manage_inventory: false,
              allow_backorder: false,
              prices: [
                {
                  amount: 200,
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
        // ADD-ON 9: Private Safari Tent
        {
          title: "Private Safari Tent",
          handle: "addon-safari-tent",
          description: "Spacious private safari tent with comfortable bedding and exclusive location",
          status: ProductStatus.PUBLISHED,
          weight: 0,
          shipping_profile_id: shippingProfile.id,
          metadata: {
            addon: true,
            category: "Accommodation",
            unit: "per_night",
          },
          variants: [
            {
              title: "Default",
              sku: "ADDON-ADDON-SAFARI-TENT",
              manage_inventory: false,
              allow_backorder: false,
              prices: [
                {
                  amount: 100,
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
        // ADD-ON 10: Professional Photography Package
        {
          title: "Professional Photography Package",
          handle: "addon-photo-package",
          description: "Professional photographer captures your adventure with high-quality photos",
          status: ProductStatus.PUBLISHED,
          weight: 0,
          shipping_profile_id: shippingProfile.id,
          metadata: {
            addon: true,
            category: "Photography & Memories",
            unit: "per_day",
          },
          variants: [
            {
              title: "Default",
              sku: "ADDON-ADDON-PHOTO-PACKAGE",
              manage_inventory: false,
              allow_backorder: false,
              prices: [
                {
                  amount: 250,
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
        // ADD-ON 11: Drone Photography
        {
          title: "Drone Photography",
          handle: "addon-drone",
          description: "Stunning aerial photography and videography of your tour experience",
          status: ProductStatus.PUBLISHED,
          weight: 0,
          shipping_profile_id: shippingProfile.id,
          metadata: {
            addon: true,
            category: "Photography & Memories",
            unit: "per_booking",
          },
          variants: [
            {
              title: "Default",
              sku: "ADDON-ADDON-DRONE",
              manage_inventory: false,
              allow_backorder: false,
              prices: [
                {
                  amount: 400,
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
        // ADD-ON 12: GoPro Rental
        {
          title: "GoPro Rental",
          handle: "addon-gopro",
          description: "Rent a GoPro camera to capture your own adventure footage",
          status: ProductStatus.PUBLISHED,
          weight: 0,
          shipping_profile_id: shippingProfile.id,
          metadata: {
            addon: true,
            category: "Photography & Memories",
            unit: "per_day",
          },
          variants: [
            {
              title: "Default",
              sku: "ADDON-ADDON-GOPRO",
              manage_inventory: false,
              allow_backorder: false,
              prices: [
                {
                  amount: 45,
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
        // ADD-ON 13: Action Camera Bundle
        {
          title: "Action Camera Bundle",
          handle: "addon-action-camera",
          description: "Complete action camera package with mounts, batteries, and accessories",
          status: ProductStatus.PUBLISHED,
          weight: 0,
          shipping_profile_id: shippingProfile.id,
          metadata: {
            addon: true,
            category: "Photography & Memories",
            unit: "per_day",
          },
          variants: [
            {
              title: "Default",
              sku: "ADDON-ADDON-ACTION-CAMERA",
              manage_inventory: false,
              allow_backorder: false,
              prices: [
                {
                  amount: 75,
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
        // ADD-ON 14: Fishing Charter
        {
          title: "Fishing Charter",
          handle: "addon-fishing",
          description: "Guided fishing experience with all equipment and licenses included",
          status: ProductStatus.PUBLISHED,
          weight: 0,
          shipping_profile_id: shippingProfile.id,
          metadata: {
            addon: true,
            category: "Activities & Equipment",
            unit: "per_booking",
          },
          variants: [
            {
              title: "Default",
              sku: "ADDON-ADDON-FISHING",
              manage_inventory: false,
              allow_backorder: false,
              prices: [
                {
                  amount: 300,
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
        // ADD-ON 15: Kayak & Paddleboard Bundle
        {
          title: "Kayak & Paddleboard Bundle",
          handle: "addon-kayak",
          description: "Kayak and paddleboard rental for water exploration",
          status: ProductStatus.PUBLISHED,
          weight: 0,
          shipping_profile_id: shippingProfile.id,
          metadata: {
            addon: true,
            category: "Activities & Equipment",
            unit: "per_day",
          },
          variants: [
            {
              title: "Default",
              sku: "ADDON-ADDON-KAYAK",
              manage_inventory: false,
              allow_backorder: false,
              prices: [
                {
                  amount: 60,
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
        // ADD-ON 16: Snorkeling Equipment
        {
          title: "Snorkeling Equipment",
          handle: "addon-snorkeling",
          description: "Premium snorkeling gear including mask, snorkel, and fins",
          status: ProductStatus.PUBLISHED,
          weight: 0,
          shipping_profile_id: shippingProfile.id,
          metadata: {
            addon: true,
            category: "Activities & Equipment",
            unit: "per_day",
          },
          variants: [
            {
              title: "Default",
              sku: "ADDON-ADDON-SNORKELING",
              manage_inventory: false,
              allow_backorder: false,
              prices: [
                {
                  amount: 40,
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
        // ADD-ON 17: Vehicle Upgrade
        {
          title: "Vehicle Upgrade",
          handle: "addon-vehicle-upgrade",
          description: "Upgrade to premium 4WD vehicle with enhanced comfort and features",
          status: ProductStatus.PUBLISHED,
          weight: 0,
          shipping_profile_id: shippingProfile.id,
          metadata: {
            addon: true,
            category: "Other",
            unit: "per_day",
          },
          variants: [
            {
              title: "Default",
              sku: "ADDON-ADDON-VEHICLE-UPGRADE",
              manage_inventory: false,
              allow_backorder: false,
              prices: [
                {
                  amount: 100,
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
        // ADD-ON 18: Private Tour
        {
          title: "Private Tour",
          handle: "addon-private-tour",
          description: "Exclusive private tour experience for your group only",
          status: ProductStatus.PUBLISHED,
          weight: 0,
          shipping_profile_id: shippingProfile.id,
          metadata: {
            addon: true,
            category: "Other",
            unit: "per_booking",
          },
          variants: [
            {
              title: "Default",
              sku: "ADDON-ADDON-PRIVATE-TOUR",
              manage_inventory: false,
              allow_backorder: false,
              prices: [
                {
                  amount: 800,
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
        // ADD-ON 19: Airport Transfer
        {
          title: "Airport Transfer",
          handle: "addon-airport-transfer",
          description: "Convenient airport pickup and drop-off service",
          status: ProductStatus.PUBLISHED,
          weight: 0,
          shipping_profile_id: shippingProfile.id,
          metadata: {
            addon: true,
            category: "Other",
            unit: "per_booking",
          },
          variants: [
            {
              title: "Default",
              sku: "ADDON-ADDON-AIRPORT-TRANSFER",
              manage_inventory: false,
              allow_backorder: false,
              prices: [
                {
                  amount: 50,
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
  logger.info("Finished seeding product data.");

  logger.info("Seeding inventory levels.");

  const { data: inventoryItems } = await query.graph({
    entity: "inventory_item",
    fields: ["id"],
  });

  const inventoryLevels: CreateInventoryLevelInput[] = [];
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

  logger.info("Finished seeding inventory levels data.");
}
