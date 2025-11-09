/**
 * Link add-on products to default sales channel
 * Usage: npx medusa exec ./scripts/link-addons-to-sales-channel.ts
 */

import { ExecArgs } from "@medusajs/framework/types";
import { Modules, ContainerRegistrationKeys } from "@medusajs/framework/utils";

export default async function linkAddonsToSalesChannel({ container }: ExecArgs) {
  console.log("\n🔗 Linking add-ons to default sales channel...\n");

  try {
    const productModuleService = container.resolve(Modules.PRODUCT);
    const salesChannelModuleService = container.resolve(Modules.SALES_CHANNEL);
    const remoteLink = container.resolve(ContainerRegistrationKeys.REMOTE_LINK);

    // Get default sales channel
    const salesChannels = await salesChannelModuleService.listSalesChannels({
      name: "Default Sales Channel",
    });

    if (!salesChannels || salesChannels.length === 0) {
      console.error("❌ Default Sales Channel not found!");
      return;
    }

    const defaultSalesChannel = salesChannels[0];
    console.log(`✓ Found default sales channel: ${defaultSalesChannel.name} (${defaultSalesChannel.id})\n`);

    // Get all add-on products
    const allProducts = await productModuleService.listProducts({});
    const addonProducts = allProducts.filter((p: any) => p.handle?.startsWith('addon-'));

    console.log(`Found ${addonProducts.length} add-on products\n`);

    // Link each add-on to the sales channel
    for (const product of addonProducts) {
      try {
        await remoteLink.create([{
          [Modules.PRODUCT]: {
            product_id: product.id,
          },
          [Modules.SALES_CHANNEL]: {
            sales_channel_id: defaultSalesChannel.id,
          },
        }]);
        console.log(`✓ Linked ${product.handle} to sales channel`);
      } catch (error: any) {
        // Ignore if already linked
        if (error.message && error.message.includes("already exists")) {
          console.log(`✓ ${product.handle} already linked`);
        } else {
          console.error(`✗ Error linking ${product.handle}:`, error.message);
        }
      }
    }

    console.log(`\n✅ Finished linking add-ons to sales channel!\n`);

  } catch (error) {
    console.error("\n❌ Linking failed:", error);
    throw error;
  }
}
