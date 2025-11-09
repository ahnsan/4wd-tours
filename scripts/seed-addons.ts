/**
 * Seed script for add-on products
 * Usage: npx medusa exec ./scripts/seed-addons.ts
 *
 * Creates add-on products with handles starting with "addon-"
 * These products are filtered and displayed on /checkout/add-ons page
 */

import { ExecArgs } from "@medusajs/framework/types";
import { Modules } from "@medusajs/framework/utils";
import { upsertCollection, upsertProductComplete } from "../src/modules/seeding/addon-upsert";

export default async function seedAddons({ container }: ExecArgs) {
  console.log("\n🌱 Starting add-ons seeding...\n");

  try {
    // Create "Add-ons" collection first
    const collectionId = await upsertCollection(container, {
      handle: "add-ons",
      title: "Tour Add-ons",
    });
    console.log(`✓ Add-ons collection ready (ID: ${collectionId})\n`);

    // Define add-on products matching frontend expectations
    const addons = [
      {
        product: {
          handle: "addon-internet",
          title: "Always-on High-Speed Internet",
          collection_handle: "add-ons",
          status: "published",
          metadata: {
            unit: "per_day",
            category: "Equipment",
            icon: "wifi",
            description: "Stay connected with high-speed satellite internet throughout your tour. Never miss a moment to share your adventure."
          }
        },
        variant: {
          title: "Default",
          sku: "ADDON-INTERNET",
          manage_inventory: false
        },
        price: {
          amount: 5000, // $50 AUD
          currency_code: "aud"
        }
      },
      {
        product: {
          handle: "addon-glamping",
          title: "Glamping Setup",
          collection_handle: "add-ons",
          status: "published",
          metadata: {
            unit: "per_booking",
            category: "Equipment",
            icon: "tent",
            description: "Premium glamping experience with luxury tents and bedding. Upgrade your camping to comfort."
          }
        },
        variant: {
          title: "Default",
          sku: "ADDON-GLAMPING",
          manage_inventory: false
        },
        price: {
          amount: 25000, // $250 AUD
          currency_code: "aud"
        }
      },
      {
        product: {
          handle: "addon-bbq",
          title: "BBQ on the Beach",
          collection_handle: "add-ons",
          status: "published",
          metadata: {
            unit: "per_day",
            category: "Food & Beverage",
            icon: "utensils",
            description: "Complete BBQ kit for beachside cooking experience. Fresh meals under the stars."
          }
        },
        variant: {
          title: "Default",
          sku: "ADDON-BBQ",
          manage_inventory: false
        },
        price: {
          amount: 18000, // $180 AUD
          currency_code: "aud"
        }
      },
      {
        product: {
          handle: "addon-camera",
          title: "Professional Camera Rental",
          collection_handle: "add-ons",
          status: "published",
          metadata: {
            unit: "per_booking",
            category: "Photography",
            icon: "camera",
            description: "High-end DSLR camera with multiple lenses. Capture your adventure in stunning detail."
          }
        },
        variant: {
          title: "Default",
          sku: "ADDON-CAMERA",
          manage_inventory: false
        },
        price: {
          amount: 7500, // $75 AUD
          currency_code: "aud"
        }
      },
      {
        product: {
          handle: "addon-picnic",
          title: "Gourmet Picnic Package",
          collection_handle: "add-ons",
          status: "published",
          metadata: {
            unit: "per_day",
            category: "Food & Beverage",
            icon: "utensils",
            description: "Delicious gourmet picnic with local Queensland produce. Perfect for beach lunches."
          }
        },
        variant: {
          title: "Default",
          sku: "ADDON-PICNIC",
          manage_inventory: false
        },
        price: {
          amount: 8500, // $85 AUD
          currency_code: "aud"
        }
      },
      {
        product: {
          handle: "addon-fishing",
          title: "Fishing Gear Package",
          collection_handle: "add-ons",
          status: "published",
          metadata: {
            unit: "per_day",
            category: "Equipment",
            icon: "star",
            description: "Complete fishing gear including rods, tackle, and bait. Try your luck at beach fishing."
          }
        },
        variant: {
          title: "Default",
          sku: "ADDON-FISHING",
          manage_inventory: false
        },
        price: {
          amount: 6500, // $65 AUD
          currency_code: "aud"
        }
      }
    ];

    console.log("Creating add-on products...\n");

    for (const addon of addons) {
      await upsertProductComplete(
        container,
        addon.product,
        addon.variant,
        addon.price
      );
    }

    console.log(`\n✅ Add-ons seeding complete!`);
    console.log(`   Created ${addons.length} add-on products`);
    console.log(`   All products have handles starting with "addon-"`);
    console.log(`   Products will appear on /checkout/add-ons page\n`);

  } catch (error) {
    console.error("\n❌ Add-ons seeding failed:", error);
    throw error;
  }
}
