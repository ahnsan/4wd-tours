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

    // Define add-on products with comprehensive persuasive copy
    const addons = [
      {
        product: {
          handle: "addon-internet",
          title: "Always-on High-Speed Internet",
          collection_handle: "add-ons",
          status: "published",
          metadata: {
            unit: "per_day",
            category: "Connectivity",
            icon: "wifi",
            description: "Stay connected with high-speed satellite internet throughout your tour. Never miss a moment to share your adventure.",
            persuasive_title: "Stay Connected in Paradise",
            persuasive_description: "Share your adventure in real-time with our portable high-speed wifi hotspot. Post those stunning sunset photos instantly, video call loved ones from Fraser Island, or keep up with work emails while exploring Rainbow Beach. Adventure doesn't mean disconnecting from what matters.",
            value_proposition: "Share your once-in-a-lifetime moments as they happen - don't wait days to post those incredible photos and videos.",
            features: [
              "Reliable 4G/5G portable hotspot device",
              "Connect up to 10 devices simultaneously",
              "Unlimited data throughout your tour",
              "Works in most remote locations",
              "Easy setup - just turn on and connect"
            ],
            social_proof: "98% of our guests love staying connected to share their journey in real-time",
            best_for: ["Digital nomads", "Content creators", "Families wanting to share memories", "Remote workers"]
          }
        },
        variant: {
          title: "Default",
          sku: "ADDON-INTERNET",
          manage_inventory: false
        },
        price: {
          amount: 5000, // $50 AUD per day
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
            description: "Premium glamping experience with luxury tents and bedding. Upgrade your camping to comfort.",
            persuasive_title: "Sleep Under the Stars in Luxury",
            persuasive_description: "Experience the magic of camping without sacrificing comfort. Our premium glamping setup includes a spacious luxury tent, plush bedding, camping furniture, and ambient lighting. Wake up to ocean views with all the conveniences of home.",
            value_proposition: "All the adventure of camping with none of the discomfort - perfect for first-time campers or those who love their creature comforts.",
            urgency_text: "Limited availability - only 3 glamping setups per tour to ensure exclusivity",
            features: [
              "Luxury 4-person bell tent with weather protection",
              "Premium bedding with pillows and quilts",
              "Camping furniture (chairs, table, lanterns)",
              "Portable charging station for devices",
              "Complete setup and pack-down included"
            ],
            social_proof: "Rated 5-stars by 95% of glampers - 'Best of both worlds!'",
            best_for: ["First-time campers", "Couples seeking romance", "Families with young children", "Anyone who values comfort"]
          }
        },
        variant: {
          title: "Default",
          sku: "ADDON-GLAMPING",
          manage_inventory: false
        },
        price: {
          amount: 25000, // $250 AUD per booking
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
            description: "Complete BBQ kit for beachside cooking experience. Fresh meals under the stars.",
            persuasive_title: "Savor the Sunset with Premium Beachside BBQ",
            persuasive_description: "Transform your adventure into a gourmet experience with our signature beach BBQ. Watch the sun set over pristine sands while enjoying premium Australian meats, fresh local seafood, and chef-prepared sides. Nothing beats the taste of flame-grilled perfection in paradise.",
            value_proposition: "Elevate your tour from memorable to extraordinary with a dining experience that rivals five-star restaurants, all in nature's most stunning setting.",
            urgency_text: "Limited to 2 BBQ setups per day to ensure premium quality and beachside ambiance",
            features: [
              "Premium grass-fed Australian beef and lamb",
              "Fresh Queensland seafood from local catches",
              "Gourmet sides and fresh salads",
              "Professional BBQ setup with all equipment",
              "Sunset timing for perfect ambiance",
              "Cleanup included - you just enjoy"
            ],
            social_proof: "Our beach BBQ is the #1 rated add-on by tour guests",
            best_for: ["Food lovers", "Romantic occasions", "Groups celebrating", "Anyone wanting an unforgettable meal"]
          }
        },
        variant: {
          title: "Default",
          sku: "ADDON-BBQ",
          manage_inventory: false
        },
        price: {
          amount: 18000, // $180 AUD per day
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
            description: "High-end DSLR camera with multiple lenses. Capture your adventure in stunning detail.",
            persuasive_title: "Capture Pro-Quality Memories Forever",
            persuasive_description: "Don't settle for phone photos of your once-in-a-lifetime adventure. Our professional Canon EOS R6 with premium lenses captures stunning 20MP images that will blow your Instagram followers away. Includes a quick tutorial so even beginners can shoot like pros.",
            value_proposition: "Professional-quality photos without the $3,000+ price tag of buying your own camera. The memories are worth it.",
            features: [
              "Canon EOS R6 mirrorless camera (20MP)",
              "Wide-angle lens perfect for landscapes",
              "Portrait lens for stunning people shots",
              "Weatherproof protection for beach conditions",
              "Extra batteries and 128GB memory card",
              "Quick tutorial on camera basics included"
            ],
            social_proof: "Guests who rent our cameras get 3x more Instagram engagement on their photos",
            best_for: ["Photography enthusiasts", "Instagram influencers", "Anyone wanting pro-quality memories", "First-time DSLR users"]
          }
        },
        variant: {
          title: "Default",
          sku: "ADDON-CAMERA",
          manage_inventory: false
        },
        price: {
          amount: 7500, // $75 AUD per booking
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
            description: "Delicious gourmet picnic with local Queensland produce. Perfect for beach lunches.",
            persuasive_title: "Artisan Picnic Hamper - Taste the Sunshine Coast",
            persuasive_description: "Skip the ordinary packed lunch and indulge in our curated picnic experience. Featuring artisan breads, local cheeses, premium deli meats, and fresh seasonal fruit, every bite celebrates Queensland's finest produce. Perfect for scenic lakeside stops or beachfront breaks.",
            value_proposition: "Enjoy restaurant-quality dining anywhere your adventure takes you, without the hassle of meal planning or prep.",
            features: [
              "Artisan sandwiches on fresh sourdough",
              "Local Queensland cheeses and seasonal fruits",
              "Premium snacks and gourmet treats",
              "Cold beverages included",
              "Delivered fresh daily to your location",
              "Dietary requirements accommodated"
            ],
            social_proof: "Featured in Queensland Food & Travel Magazine as 'Best Picnic Experience 2024'",
            best_for: ["Foodies", "Romantic outings", "Families", "Health-conscious travelers"]
          }
        },
        variant: {
          title: "Default",
          sku: "ADDON-PICNIC",
          manage_inventory: false
        },
        price: {
          amount: 8500, // $85 AUD per day
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
            description: "Complete fishing gear including rods, tackle, and bait. Try your luck at beach fishing.",
            persuasive_title: "Reel in Your Adventure - Beach Fishing Experience",
            persuasive_description: "Ever dreamed of catching your dinner on a pristine Australian beach? Our premium fishing package includes everything you need - quality rods, tackle, bait, and expert advice on the best spots. Rainbow Beach and Fraser Island offer incredible fishing opportunities.",
            value_proposition: "Experience authentic coastal living and potentially catch your own dinner - guided by locals who know exactly where the fish are biting.",
            features: [
              "2x quality fishing rods and reels",
              "Complete tackle box with lures and hooks",
              "Fresh bait supplied daily",
              "Fishing permit included",
              "Local spot recommendations and tips",
              "Basic cleaning equipment provided"
            ],
            social_proof: "42% of our fishing gear renters catch their first-ever fish!",
            best_for: ["Fishing enthusiasts", "Families seeking adventure", "First-time anglers", "Nature lovers"]
          }
        },
        variant: {
          title: "Default",
          sku: "ADDON-FISHING",
          manage_inventory: false
        },
        price: {
          amount: 6500, // $65 AUD per day
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
