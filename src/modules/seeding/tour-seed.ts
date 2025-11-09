/**
 * Tour seeding orchestration
 * Defines data arrays and coordinates upsert operations
 */

import { MedusaContainer } from "@medusajs/framework/types"
import {
  upsertCollection,
  upsertProductComplete,
  CollectionData,
  ProductData,
  VariantData,
  PriceData,
} from "./addon-upsert"

// Tour product definitions
// ALL TOURS: $2000 AUD per day (200000 cents per day)
export const TOURS = [
  {
    title: "1 Day Rainbow Beach Tour",
    handle: "1d-rainbow-beach",
    price: 200000, // $2000 AUD (1 day × $2000)
    duration_days: 1,
  },
  {
    title: "1 Day Fraser Island Tour",
    handle: "1d-fraser-island",
    price: 200000, // $2000 AUD (1 day × $2000)
    duration_days: 1,
  },
  {
    title: "2 Day Fraser + Rainbow Combo",
    handle: "2d-fraser-rainbow",
    price: 400000, // $4000 AUD (2 days × $2000)
    duration_days: 2,
  },
  {
    title: "3 Day Fraser & Rainbow Combo",
    handle: "3d-fraser-rainbow",
    price: 600000, // $6000 AUD (3 days × $2000)
    duration_days: 3,
  },
  {
    title: "4 Day Fraser & Rainbow Combo",
    handle: "4d-fraser-rainbow",
    price: 800000, // $8000 AUD (4 days × $2000)
    duration_days: 4,
  },
]

// Add-on product definitions
export const ADDONS = [
  // Food & Beverage
  {
    title: "Gourmet Beach BBQ",
    handle: "addon-gourmet-bbq",
    price: 18000, // $180 AUD
    metadata: {
      addon: true,
      unit: "per_booking",
      category: "Food & Beverage",
      description: "BBQ setup with premium meats and sides for an unforgettable beach dining experience",
    },
  },
  {
    title: "Picnic Hamper",
    handle: "addon-picnic-hamper",
    price: 8500, // $85 AUD
    metadata: {
      addon: true,
      unit: "per_booking",
      category: "Food & Beverage",
      description: "Gourmet sandwiches, snacks, and drinks perfect for a beach picnic",
    },
  },
  {
    title: "Seafood Platter",
    handle: "addon-seafood-platter",
    price: 15000, // $150 AUD
    metadata: {
      addon: true,
      unit: "per_booking",
      category: "Food & Beverage",
      description: "Fresh local seafood platter featuring the best catches from Queensland waters",
    },
  },

  // Connectivity
  {
    title: "Always-on High-Speed Internet",
    handle: "addon-internet",
    price: 3000, // $30 AUD
    metadata: {
      addon: true,
      unit: "per_day",
      category: "Connectivity",
      description: "Portable wifi hotspot to keep you connected throughout your adventure",
    },
  },
  {
    title: "Starlink Satellite Internet",
    handle: "addon-starlink",
    price: 5000, // $50 AUD
    metadata: {
      addon: true,
      unit: "per_day",
      category: "Connectivity",
      description: "High-speed satellite connectivity even in the most remote locations",
    },
  },

  // Photography
  {
    title: "Aerial Photography Package",
    handle: "addon-drone-photography",
    price: 20000, // $200 AUD
    metadata: {
      addon: true,
      unit: "per_booking",
      category: "Photography",
      description: "Professional drone photos and videos to capture your adventure from above",
    },
  },
  {
    title: "GoPro Package",
    handle: "addon-gopro",
    price: 7500, // $75 AUD
    metadata: {
      addon: true,
      unit: "per_booking",
      category: "Photography",
      description: "GoPro camera with mounts and SD card for capturing all the action",
    },
  },
  {
    title: "Professional Photo Album",
    handle: "addon-photo-album",
    price: 15000, // $150 AUD
    metadata: {
      addon: true,
      unit: "per_booking",
      category: "Photography",
      description: "Printed photo album of your trip, professionally curated and designed",
    },
  },

  // Accommodation
  {
    title: "Glamping Setup",
    handle: "addon-glamping",
    price: 25000, // $250 AUD
    metadata: {
      addon: true,
      unit: "per_day",
      category: "Accommodation",
      description: "Luxury camping experience with comfortable bedding and premium amenities",
    },
  },
  {
    title: "Beach Cabana",
    handle: "addon-beach-cabana",
    price: 18000, // $180 AUD
    metadata: {
      addon: true,
      unit: "per_day",
      category: "Accommodation",
      description: "Private beach shelter with comfortable seating and shade",
    },
  },
  {
    title: "Eco-Lodge Upgrade",
    handle: "addon-eco-lodge",
    price: 30000, // $300 AUD
    metadata: {
      addon: true,
      unit: "per_day",
      category: "Accommodation",
      description: "Upgrade to sustainable eco-lodge accommodation with modern comforts",
    },
  },

  // Activities
  {
    title: "Fishing Equipment",
    handle: "addon-fishing",
    price: 6500, // $65 AUD
    metadata: {
      addon: true,
      unit: "per_day",
      category: "Activities",
      description: "Complete fishing setup including rods, tackle, and bait",
    },
  },
  {
    title: "Sandboarding Gear",
    handle: "addon-sandboarding",
    price: 4500, // $45 AUD
    metadata: {
      addon: true,
      unit: "per_day",
      category: "Activities",
      description: "Sandboards and wax for an adrenaline-pumping dune experience",
    },
  },
  {
    title: "Bodyboarding Set",
    handle: "addon-bodyboarding",
    price: 3500, // $35 AUD
    metadata: {
      addon: true,
      unit: "per_day",
      category: "Activities",
      description: "Bodyboards and fins for riding the waves",
    },
  },
  {
    title: "Paddleboarding Package",
    handle: "addon-paddleboarding",
    price: 5500, // $55 AUD
    metadata: {
      addon: true,
      unit: "per_day",
      category: "Activities",
      description: "Stand-up paddleboards and paddles for exploring calm waters",
    },
  },
  {
    title: "Kayaking Adventure",
    handle: "addon-kayaking",
    price: 7500, // $75 AUD
    metadata: {
      addon: true,
      unit: "per_day",
      category: "Activities",
      description: "Single or double kayaks for coastal exploration and wildlife viewing",
    },
  },
]

/**
 * Main seeding function
 * Idempotent - safe to run multiple times
 */
export async function seedTours(container: MedusaContainer): Promise<void> {
  console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
  console.log("🌱 Starting Tour & Add-on Seeding")
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n")

  try {
    // Step 1: Create collections
    console.log("📦 Creating/ensuring collections...")
    await upsertCollection(container, {
      handle: "tours",
      title: "4WD Tours",
    })

    await upsertCollection(container, {
      handle: "add-ons",
      title: "Tour Add-ons",
    })
    console.log("")

    // Step 2: Create tour products
    console.log("🚗 Creating/ensuring tour products...")
    for (const tour of TOURS) {
      const productData: ProductData = {
        handle: tour.handle,
        title: tour.title,
        collection_handle: "tours",
        status: "published",
        metadata: {
          is_tour: true,
          duration_days: tour.duration_days,
        },
      }

      const variantData: VariantData = {
        title: "Default",
        sku: `TOUR-${tour.handle.toUpperCase()}`,
        manage_inventory: false,
      }

      const priceData: PriceData = {
        amount: tour.price,
        currency_code: "aud",
      }

      await upsertProductComplete(
        container,
        productData,
        variantData,
        priceData
      )
    }
    console.log("")

    // Step 3: Create add-on products
    console.log("🎁 Creating/ensuring add-on products...")
    for (const addon of ADDONS) {
      const productData: ProductData = {
        handle: addon.handle,
        title: addon.title,
        collection_handle: "add-ons",
        status: "published",
        metadata: addon.metadata,
      }

      const variantData: VariantData = {
        title: "Default",
        sku: `ADDON-${addon.handle.toUpperCase()}`,
        manage_inventory: false,
      }

      const priceData: PriceData = {
        amount: addon.price,
        currency_code: "aud",
      }

      await upsertProductComplete(
        container,
        productData,
        variantData,
        priceData
      )
    }
    console.log("")

    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
    console.log("✅ Seeding completed successfully!")
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n")

    console.log("📊 Summary:")
    console.log(`  • ${TOURS.length} tour products`)
    console.log(`  • ${ADDONS.length} add-on products`)
    console.log(`  • 2 collections (tours, add-ons)`)
    console.log(`  • All prices in AUD cents`)
    console.log(`  • Status: published\n`)
  } catch (error) {
    console.error("\n❌ Seeding failed:", error)
    throw error
  }
}
