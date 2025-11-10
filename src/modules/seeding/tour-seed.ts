/**
 * Tour seeding orchestration
 * Defines data arrays and coordinates upsert operations
 */

import { ExecArgs, MedusaContainer } from "@medusajs/framework/types"
import {
  upsertCollection,
  upsertProductComplete,
  CollectionData,
  ProductData,
  VariantData,
  PriceData,
} from "./addon-upsert"

/**
 * Type definition for addon metadata
 */
interface AddonMetadata {
  addon: true
  unit: "per_booking" | "per_day" | "per_person"
  category: string
  applicable_tours: string[] // Tour handles this addon can be used with
  description?: string
  persuasive_title?: string
  persuasive_description?: string
  value_proposition?: string
  urgency_text?: string
  features?: string[]
  testimonial?: string
  category_intro?: string
  category_persuasion?: string
}

/**
 * Validation function to ensure all addons have applicable_tours field
 */
function validateAddonMetadata(addon: any): void {
  if (!addon.metadata.applicable_tours || addon.metadata.applicable_tours.length === 0) {
    throw new Error(`Addon ${addon.handle} missing applicable_tours field`)
  }

  // Validate that applicable_tours is an array
  if (!Array.isArray(addon.metadata.applicable_tours)) {
    throw new Error(`Addon ${addon.handle} applicable_tours must be an array`)
  }

  // Validate that each tour handle is a string
  for (const tour of addon.metadata.applicable_tours) {
    if (typeof tour !== 'string') {
      throw new Error(`Addon ${addon.handle} has invalid tour handle: ${tour}`)
    }
  }
}

// Tour product definitions
// ALL TOURS: $2000 AUD per day (200000 cents per day)
export const TOURS = [
  {
    title: "1 Day Rainbow Beach Tour",
    handle: "1d-rainbow-beach",
    description: "Embark on an unforgettable 4WD adventure through the stunning colored sands of Rainbow Beach. This full-day tour offers the perfect blend of excitement and natural beauty, taking you to one of Queensland's most spectacular off-road destinations. Our experienced guides will ensure you have a safe and memorable experience exploring Rainbow Beach in comfort and style.",
    price: 200000, // $2000 AUD (1 day × $2000)
    duration_days: 1,
    metadata: {
      is_tour: true,
      duration_days: 1,
      duration: "1 day (7:00 AM - 5:30 PM)",
      category: "4WD Beach Tour",
      difficulty: "Easy",
      max_participants: 7,
      departure_times: ["7:00 AM"],
      location: "Rainbow Beach, Queensland",
      about_tour: [
        "Experience the thrill of 4WD driving on Rainbow Beach's famous colored sands",
        "Discover hidden freshwater creeks and secluded coastal spots",
        "Learn about the local ecosystem and indigenous culture from expert guides",
        "Enjoy a picnic lunch with stunning ocean views (included)",
        "Perfect for first-time 4WD adventurers and families"
      ],
      what_to_expect: [
        "Professional 4WD vehicle with all safety equipment",
        "Comprehensive safety briefing before departure",
        "Multiple beach driving experiences on colored sands",
        "Visits to secluded spots and freshwater creeks",
        "Wildlife spotting opportunities",
        "Small group sizes for personalized attention",
        "All-weather tour with covered vehicle"
      ],
      tour_itinerary: [
        {
          time: "7:00 AM",
          title: "Pickup from Meeting Point",
          description: "We'll collect you from your accommodation or designated meeting point on the Sunshine Coast."
        },
        {
          time: "8:30 AM",
          title: "Rainbow Beach Arrival",
          description: "Arrive at Rainbow Beach and receive a comprehensive safety briefing about the 4WD experience."
        },
        {
          time: "10:00 AM",
          title: "4WD Adventure Begins",
          description: "Hit the colored sands and experience the thrill of 4WD driving on one of Australia's most iconic beaches."
        },
        {
          time: "12:30 PM",
          title: "Lunch Break",
          description: "Enjoy a picnic lunch with stunning ocean views (lunch included in tour price)."
        },
        {
          time: "2:00 PM",
          title: "Explore Hidden Gems",
          description: "Visit secluded spots, freshwater creeks, and learn about the local ecosystem from our expert guides."
        },
        {
          time: "4:00 PM",
          title: "Return Journey",
          description: "Head back to Rainbow Beach with memories and photos to last a lifetime."
        },
        {
          time: "5:30 PM",
          title: "Drop-off",
          description: "Return to your accommodation or meeting point."
        }
      ],
      inclusions: [
        "Professional 4WD vehicle and driver/guide",
        "Hotel pickup and drop-off (Sunshine Coast area)",
        "Comprehensive safety briefing and equipment",
        "Picnic lunch with beverages",
        "National park entry fees",
        "All-weather rain jackets if needed",
        "Digital photos of your adventure",
        "Small group experience (max 7 guests)"
      ],
      exclusions: [
        "Personal travel insurance",
        "Additional food and beverages not specified",
        "Gratuities (optional)",
        "Hotel accommodation"
      ]
    }
  },
  {
    title: "1 Day Fraser Island Tour",
    handle: "1d-fraser-island",
    description: "Discover the magic of K'gari (Fraser Island), the world's largest sand island and UNESCO World Heritage site. This action-packed day tour takes you to iconic locations including pristine freshwater lakes, ancient rainforests, and the famous 75 Mile Beach. Experience the ultimate 4WD adventure with our expert guides.",
    price: 200000, // $2000 AUD (1 day × $2000)
    duration_days: 1,
    metadata: {
      is_tour: true,
      duration_days: 1,
      duration: "1 day (6:00 AM - 6:30 PM)",
      category: "4WD Island Tour",
      difficulty: "Moderate",
      max_participants: 7,
      departure_times: ["6:00 AM"],
      location: "Fraser Island (K'gari), Queensland",
      about_tour: [
        "Explore the world's largest sand island and UNESCO World Heritage site",
        "Visit iconic locations including Lake McKenzie and Maheno Shipwreck",
        "Drive along the famous 75 Mile Beach highway",
        "Experience ancient rainforests growing in sand",
        "Spot native wildlife including dingoes, wallabies, and tropical birds"
      ],
      what_to_expect: [
        "Comfortable 4WD ferry crossing to Fraser Island",
        "Expert guide with extensive island knowledge",
        "Swimming in crystal-clear freshwater lakes",
        "Beach driving on 75 Mile Beach",
        "Rainforest walks through unique ecosystems",
        "Indigenous cultural insights",
        "Morning tea and lunch included"
      ],
      tour_itinerary: [
        {
          time: "6:00 AM",
          title: "Pickup and Ferry Departure",
          description: "Early morning pickup from Sunshine Coast, followed by scenic ferry crossing to Fraser Island."
        },
        {
          time: "8:30 AM",
          title: "Central Station & Rainforest",
          description: "Explore ancient rainforests and learn about the island's unique ecosystem."
        },
        {
          time: "10:00 AM",
          title: "Lake McKenzie",
          description: "Swim in the crystal-clear waters of one of the world's most beautiful freshwater lakes."
        },
        {
          time: "12:00 PM",
          title: "75 Mile Beach Drive",
          description: "Experience the thrill of driving on the island's famous beach highway."
        },
        {
          time: "1:00 PM",
          title: "Lunch at Eurong",
          description: "Enjoy lunch with ocean views at the Eurong Beach Resort area."
        },
        {
          time: "2:30 PM",
          title: "Maheno Shipwreck",
          description: "Explore the historic shipwreck and learn about its fascinating history."
        },
        {
          time: "4:00 PM",
          title: "Eli Creek",
          description: "Float down the pristine freshwater creek or enjoy a refreshing swim."
        },
        {
          time: "5:00 PM",
          title: "Return Ferry",
          description: "Ferry back to mainland with incredible sunset views."
        },
        {
          time: "6:30 PM",
          title: "Drop-off",
          description: "Return to your Sunshine Coast accommodation."
        }
      ],
      inclusions: [
        "Professional 4WD vehicle and experienced guide",
        "Hotel pickup and drop-off (Sunshine Coast)",
        "Return ferry transfers to Fraser Island",
        "Morning tea and lunch",
        "National park permits and fees",
        "Swimming stops at lakes and creeks",
        "Rainforest walks",
        "Digital photos of your adventure"
      ],
      exclusions: [
        "Personal travel insurance",
        "Additional meals and snacks",
        "Optional activities",
        "Gratuities (optional)"
      ]
    }
  },
  {
    title: "2 Day Fraser + Rainbow Combo",
    handle: "2d-fraser-rainbow",
    description: "The ultimate 2-day 4WD adventure combining the best of Fraser Island and Rainbow Beach. Experience pristine lakes, ancient rainforests, the famous Maheno Shipwreck, and Rainbow Beach's spectacular colored cliffs. This tour includes comfortable eco-lodge accommodation and all meals.",
    price: 400000, // $4000 AUD (2 days × $2000)
    duration_days: 2,
    metadata: {
      is_tour: true,
      duration_days: 2,
      duration: "2 days / 1 night",
      category: "4WD Multi-Day Tour",
      difficulty: "Moderate",
      max_participants: 7,
      departure_times: ["7:00 AM"],
      location: "Fraser Island & Rainbow Beach, Queensland",
      about_tour: [
        "Comprehensive 2-day exploration of Fraser Island and Rainbow Beach",
        "Stay overnight in comfortable eco-lodge accommodation",
        "All meals included - breakfast, lunch, and dinner",
        "Small group sizes ensuring personalized attention",
        "Perfect blend of adventure, relaxation, and natural beauty"
      ],
      what_to_expect: [
        "Two full days of 4WD adventures",
        "Swimming in Lake McKenzie and Champagne Pools",
        "Exploring the Maheno Shipwreck and 75 Mile Beach",
        "Rainbow Beach colored sands and cliffs",
        "Comfortable eco-lodge accommodation",
        "All meals and refreshments included",
        "Expert guides sharing local knowledge"
      ],
      tour_itinerary: [
        {
          time: "Day 1 - 7:00 AM",
          title: "Fraser Island Departure",
          description: "Begin your 2-day adventure with pickup and ferry crossing to Fraser Island."
        },
        {
          time: "Day 1 - 10:00 AM",
          title: "Lake McKenzie",
          description: "Swim in the crystal-clear waters of one of the world's most beautiful lakes."
        },
        {
          time: "Day 1 - 2:00 PM",
          title: "Maheno Shipwreck & Beach Drive",
          description: "Explore the historic shipwreck and drive along 75 Mile Beach."
        },
        {
          time: "Day 1 - 6:00 PM",
          title: "Eco-Lodge Check-in",
          description: "Settle into your comfortable eco-lodge accommodation and enjoy dinner."
        },
        {
          time: "Day 2 - 7:00 AM",
          title: "Champagne Pools",
          description: "Start with a refreshing swim in the natural rock pools."
        },
        {
          time: "Day 2 - 11:00 AM",
          title: "Rainforest Walk",
          description: "Experience ancient rainforests and pristine creeks."
        },
        {
          time: "Day 2 - 4:00 PM",
          title: "Return Journey",
          description: "Ferry back to mainland and return to Sunshine Coast."
        }
      ],
      inclusions: [
        "Professional 4WD vehicle and expert guide",
        "Hotel pickup and drop-off",
        "Return ferry transfers",
        "1 night eco-lodge accommodation",
        "All meals (2 breakfasts, 2 lunches, 1 dinner)",
        "National park permits and fees",
        "Swimming stops and rainforest walks",
        "Digital photos"
      ],
      exclusions: [
        "Personal travel insurance",
        "Alcoholic beverages",
        "Optional activities",
        "Gratuities (optional)"
      ]
    }
  },
  {
    title: "3 Day Fraser & Rainbow Combo",
    handle: "3d-fraser-rainbow",
    description: "Experience the ultimate 3-day 4WD adventure exploring Fraser Island's hidden gems and Rainbow Beach's spectacular coastline. This extended tour allows time to discover remote locations, pristine beaches, and ancient rainforests at a relaxed pace. Includes 2 nights accommodation and all meals.",
    price: 600000, // $6000 AUD (3 days × $2000)
    duration_days: 3,
    metadata: {
      is_tour: true,
      duration_days: 3,
      duration: "3 days / 2 nights",
      category: "4WD Extended Tour",
      difficulty: "Moderate",
      max_participants: 7,
      departure_times: ["7:00 AM"],
      location: "Fraser Island & Rainbow Beach, Queensland",
      about_tour: [
        "Extended 3-day exploration with more time at each location",
        "Visit remote areas rarely seen by day-trippers",
        "2 nights in quality eco-lodge accommodation",
        "All meals included throughout the tour",
        "Relaxed pace allowing for spontaneous wildlife encounters",
        "Ideal for photography enthusiasts and nature lovers"
      ],
      what_to_expect: [
        "Three full days of immersive 4WD experiences",
        "Access to remote beaches and hidden freshwater lakes",
        "Extended rainforest walks and wildlife spotting",
        "Sunrise and sunset photography opportunities",
        "Quality accommodation with modern amenities",
        "Gourmet meals featuring local Queensland produce",
        "Small group ensuring personalized experiences"
      ],
      tour_itinerary: [
        {
          time: "Day 1",
          title: "Fraser Island Exploration",
          description: "Begin your 3-day adventure with comprehensive tours of Fraser Island's top attractions including Lake McKenzie, Central Station rainforest, and 75 Mile Beach."
        },
        {
          time: "Day 2",
          title: "Remote Island Experience",
          description: "Discover hidden gems and remote locations including Indian Head lookout, Champagne Pools, and secluded beaches. Enjoy sunset views from the eco-lodge."
        },
        {
          time: "Day 3",
          title: "Rainbow Beach & Return",
          description: "Explore Rainbow Beach colored cliffs, enjoy final beach drives, and capture stunning coastal photography before returning to Sunshine Coast."
        }
      ],
      inclusions: [
        "Professional 4WD vehicle and expert guide",
        "Hotel pickup and drop-off",
        "Return ferry transfers",
        "2 nights eco-lodge accommodation",
        "All meals (3 breakfasts, 3 lunches, 2 dinners)",
        "National park permits and fees",
        "Extended swimming and exploration time",
        "Professional photography tips and digital photos",
        "Small group experience"
      ],
      exclusions: [
        "Personal travel insurance",
        "Alcoholic beverages",
        "Optional activities and spa treatments",
        "Gratuities (optional)"
      ]
    }
  },
  {
    title: "4 Day Fraser & Rainbow Combo",
    handle: "4d-fraser-rainbow",
    description: "The most comprehensive 4WD adventure available on the Sunshine Coast. This 4-day expedition covers every corner of Fraser Island and Rainbow Beach, including exclusive access to remote 4WD tracks and hidden locations. Perfect for serious adventurers seeking the ultimate off-road experience.",
    price: 800000, // $8000 AUD (4 days × $2000)
    duration_days: 4,
    metadata: {
      is_tour: true,
      duration_days: 4,
      duration: "4 days / 3 nights",
      category: "4WD Expedition",
      difficulty: "Moderate to Challenging",
      max_participants: 6,
      departure_times: ["7:00 AM"],
      location: "Fraser Island & Rainbow Beach, Queensland",
      about_tour: [
        "The ultimate 4-day expedition for serious adventurers",
        "Access to exclusive remote tracks and hidden locations",
        "3 nights in premium eco-lodge accommodation",
        "All gourmet meals and refreshments included",
        "Maximum 6 guests for exclusive small group experience",
        "Extended wildlife observation and photography opportunities",
        "Learn advanced 4WD driving techniques from experts"
      ],
      what_to_expect: [
        "Four full days of comprehensive exploration",
        "Remote 4WD tracks accessible only to experienced guides",
        "Multiple locations for swimming, fishing, and relaxation",
        "Sunrise and sunset sessions at iconic viewpoints",
        "Premium accommodation with spa facilities",
        "Gourmet dining experience with local Queensland cuisine",
        "Advanced 4WD driving instruction (optional)",
        "Extensive wildlife encounters and conservation insights"
      ],
      tour_itinerary: [
        {
          time: "Day 1",
          title: "Fraser Island Deep Dive",
          description: "Comprehensive exploration of Fraser Island's southern highlights including Lake McKenzie, Central Station, and 75 Mile Beach with extended time at each location."
        },
        {
          time: "Day 2",
          title: "Northern Fraser Expedition",
          description: "Journey to the northern reaches including Indian Head, Champagne Pools, and remote beaches. Learn advanced 4WD techniques on challenging tracks."
        },
        {
          time: "Day 3",
          title: "Hidden Gems & Exclusive Tracks",
          description: "Access exclusive 4WD tracks to discover hidden lakes, remote rainforests, and secluded beaches known only to expert guides."
        },
        {
          time: "Day 4",
          title: "Rainbow Beach & Coastal Finale",
          description: "Explore Rainbow Beach colored cliffs, Double Island Point, and enjoy final coastal adventures before returning with unforgettable memories."
        }
      ],
      inclusions: [
        "Premium 4WD vehicle with all safety equipment",
        "Hotel pickup and drop-off",
        "Return ferry transfers",
        "3 nights premium eco-lodge accommodation",
        "All gourmet meals (4 breakfasts, 4 lunches, 3 dinners)",
        "National park permits and exclusive track access",
        "Advanced 4WD driving instruction",
        "Professional photography guidance",
        "Fishing equipment (catch and release)",
        "Premium digital photo package",
        "Exclusive small group (max 6 guests)"
      ],
      exclusions: [
        "Personal travel insurance",
        "Alcoholic beverages",
        "Optional spa treatments",
        "Fishing licenses (if keeping catch)",
        "Gratuities (optional)"
      ]
    }
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
      applicable_tours: ["*"], // Universal - available for all tours
      description: "BBQ setup with premium meats and sides for an unforgettable beach dining experience",
      persuasive_title: "Savor the Sunset with Premium Beachside BBQ",
      persuasive_description: "Transform your adventure into a gourmet experience with our signature beach BBQ. Watch the sun set over pristine sands while enjoying premium Australian meats, fresh local seafood, and chef-prepared sides. Nothing beats the taste of flame-grilled perfection in paradise.",
      value_proposition: "Elevate your tour from memorable to extraordinary with a dining experience that rivals five-star restaurants, all in nature's most stunning setting.",
      urgency_text: "Limited to 2 BBQ setups per day to ensure premium quality and beachside ambiance",
      features: [
        "Premium grass-fed Australian beef and lamb",
        "Fresh Queensland seafood from local catches",
        "Gourmet sides including Caesar salad and garlic bread",
        "Professional portable BBQ setup with ocean views",
        "All cooking equipment and utensils provided"
      ],
      testimonial: "The beach BBQ was the highlight of our trip. Watching the sunset while eating perfectly cooked steaks on Rainbow Beach - absolutely unforgettable! - Sarah & Mike, Brisbane",
      category_intro: "Fuel Your Adventure",
      category_persuasion: "Great food creates great memories. Our culinary experiences are designed to complement your journey with flavors as spectacular as the landscapes you'll explore."
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
      applicable_tours: ["*"], // Universal - available for all tours
      description: "Gourmet sandwiches, snacks, and drinks perfect for a beach picnic",
      persuasive_title: "Artisan Picnic Hamper - Taste the Sunshine Coast",
      persuasive_description: "Skip the ordinary packed lunch and indulge in our curated picnic experience. Featuring artisan breads, local cheeses, premium deli meats, and fresh seasonal fruit, every bite celebrates Queensland's finest produce. Perfect for scenic lakeside stops or beachfront breaks.",
      value_proposition: "Enjoy restaurant-quality dining anywhere your adventure takes you, without the hassle of meal planning or prep.",
      features: [
        "Artisan sandwiches on fresh sourdough",
        "Local Queensland cheeses and seasonal fruits",
        "Premium snacks and gourmet treats",
        "Refreshing beverages and bottled water",
        "Eco-friendly packaging with reusable containers"
      ],
      testimonial: "So much better than bringing our own lunch! The quality was incredible and it saved us time we spent exploring instead of making sandwiches. - Emma, Sydney",
      category_intro: "Fuel Your Adventure",
      category_persuasion: "Great food creates great memories. Our culinary experiences are designed to complement your journey with flavors as spectacular as the landscapes you'll explore."
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
      applicable_tours: ["*"], // Universal - available for all tours
      description: "Fresh local seafood platter featuring the best catches from Queensland waters",
      persuasive_title: "Ocean-Fresh Seafood Platter - From Boat to Beach",
      persuasive_description: "Indulge in the freshest seafood Queensland has to offer. Our platter showcases today's catch from local fishermen - succulent prawns, tender calamari, fresh oysters, and premium fish. Served ocean-side with lemon, cocktail sauce, and crusty bread for the ultimate coastal feast.",
      value_proposition: "Taste the ocean at its finest - seafood so fresh it was swimming this morning, served in the most spectacular beachfront setting imaginable.",
      urgency_text: "Subject to daily catch availability - pre-order recommended to guarantee your platter",
      features: [
        "Locally caught seafood sourced daily",
        "Premium selection: prawns, oysters, calamari, fish",
        "Traditional condiments and fresh lemon",
        "Crusty artisan bread and butter",
        "Served on ice in premium presentation platter"
      ],
      testimonial: "As a seafood lover, this was heaven! Everything was incredibly fresh and the beachfront setting made it taste even better. Worth every penny! - James, Melbourne",
      category_intro: "Fuel Your Adventure",
      category_persuasion: "Great food creates great memories. Our culinary experiences are designed to complement your journey with flavors as spectacular as the landscapes you'll explore."
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
      applicable_tours: ["*"], // Universal - available for all tours
      description: "Portable wifi hotspot to keep you connected throughout your adventure",
      persuasive_title: "Stay Connected in Paradise",
      persuasive_description: "Share your adventure in real-time with our portable high-speed wifi hotspot. Post those stunning sunset photos instantly, video call loved ones from Fraser Island, or keep up with work emails while exploring Rainbow Beach. Adventure doesn't mean disconnecting from what matters.",
      value_proposition: "Share your once-in-a-lifetime moments as they happen - don't wait days to post those incredible photos and videos.",
      features: [
        "Reliable 4G/5G portable hotspot device",
        "Connect up to 10 devices simultaneously",
        "Unlimited data throughout your tour",
        "Full battery life for all-day coverage",
        "Works in most coastal and island locations"
      ],
      testimonial: "Being able to share our Fraser Island photos in real-time made our families feel like they were there with us. Plus, I could check work emails during breaks - win-win! - David, Sydney",
      category_intro: "Stay Connected",
      category_persuasion: "Don't let adventure mean disconnection. Share your journey, stay in touch with loved ones, and handle urgent matters while experiencing the trip of a lifetime."
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
      applicable_tours: ["*"], // Universal - available for all tours
      description: "High-speed satellite connectivity even in the most remote locations",
      persuasive_title: "Ultimate Connectivity - Even in Remote Paradise",
      persuasive_description: "Experience cutting-edge Starlink satellite internet in the most remote corners of Fraser Island and beyond. Stream, upload, and work at high speeds from locations where traditional internet fails. Perfect for digital nomads, content creators, and those who need rock-solid connectivity anywhere.",
      value_proposition: "Never compromise on connectivity - enjoy blazing-fast internet speeds even 100km from civilization, comparable to home broadband.",
      urgency_text: "Limited Starlink units available - book early to secure this premium connectivity option",
      features: [
        "High-speed satellite internet via Starlink",
        "100+ Mbps speeds even in remote areas",
        "Low latency suitable for video calls and streaming",
        "Works anywhere with clear sky view",
        "Priority support for connectivity issues"
      ],
      testimonial: "As a travel blogger, Starlink was a game-changer. I uploaded 4K videos from the middle of Fraser Island! Absolutely worth it for content creators. - Jessica, Content Creator",
      category_intro: "Stay Connected",
      category_persuasion: "Don't let adventure mean disconnection. Share your journey, stay in touch with loved ones, and handle urgent matters while experiencing the trip of a lifetime."
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
      applicable_tours: ["*"], // Universal - available for all tours
      description: "Professional drone photos and videos to capture your adventure from above",
      persuasive_title: "Capture Your Adventure from Above - Cinematic Drone Footage",
      persuasive_description: "See your journey from a breathtaking new perspective with professional drone photography and videography. Soaring shots of your 4WD conquering Rainbow Beach, aerial views of pristine Fraser Island lakes, and epic coastal panoramas that make your friends say 'wow'. Our licensed drone pilots capture cinema-quality footage you'll treasure forever.",
      value_proposition: "Own stunning aerial footage that transforms your adventure into a professional travel documentary worthy of social media stardom.",
      urgency_text: "Weather-dependent service - book early for best conditions and editing turnaround",
      features: [
        "Licensed and insured professional drone pilots",
        "4K aerial video footage of your entire journey",
        "50+ high-resolution aerial photographs",
        "Edited highlight reel (3-5 minutes)",
        "All raw footage provided on USB drive",
        "Same-day preview, full delivery within 48 hours"
      ],
      testimonial: "The drone footage made our trip look like a National Geographic documentary! We've watched the highlight reel a dozen times. Best $200 we spent on the entire trip. - Tom & Lisa, Perth",
      category_intro: "Preserve Your Memories",
      category_persuasion: "Years from now, you'll treasure these moments. Our photography packages ensure you capture every spectacular second of your adventure in stunning detail."
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
      applicable_tours: ["*"], // Universal - available for all tours
      description: "GoPro camera with mounts and SD card for capturing all the action",
      persuasive_title: "Capture Every Thrill - Professional GoPro Action Package",
      persuasive_description: "Don't just experience the adventure - capture every exhilarating second with our premium GoPro setup. Helmet mounts for 4WD action, chest mounts for beach walks, and waterproof housing for swimming in crystal lakes. Go home with action-packed footage your phone could never capture.",
      value_proposition: "Record hands-free POV footage of every thrilling moment - from beach driving to swimming in Lake McKenzie - without worrying about expensive equipment.",
      features: [
        "Latest GoPro Hero camera with 4K capability",
        "Multiple mounting options (helmet, chest, handlebar)",
        "Waterproof housing for swimming and water activities",
        "High-capacity SD card (128GB) included",
        "Spare batteries for all-day recording",
        "Quick tutorial on settings and operation"
      ],
      testimonial: "The GoPro captured everything our phones couldn't - the beach driving, underwater shots, all the action! And we didn't have to risk our own camera. Perfect! - Rachel, Gold Coast",
      category_intro: "Preserve Your Memories",
      category_persuasion: "Years from now, you'll treasure these moments. Our photography packages ensure you capture every spectacular second of your adventure in stunning detail."
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
      applicable_tours: ["*"], // Universal - available for all tours
      description: "Printed photo album of your trip, professionally curated and designed",
      persuasive_title: "Heirloom Photo Album - Your Adventure, Beautifully Bound",
      persuasive_description: "Transform your digital photos into a stunning coffee table masterpiece. Our professional designers curate the best moments from your tour and create a premium hardcover album with archival-quality printing. Each page tells your story with carefully selected images, captions, and elegant layouts that do justice to your incredible journey.",
      value_proposition: "Own a tangible, professionally-designed keepsake that brings your adventure to life every time someone opens it - far beyond what digital photos can deliver.",
      features: [
        "30-40 page premium hardcover album",
        "Professional photo curation and layout design",
        "Archival-quality printing on premium paper",
        "Custom cover with your choice of hero image",
        "Protective presentation box included",
        "Delivered to your home within 2 weeks"
      ],
      testimonial: "This album sits on our coffee table and every guest picks it up. The quality is incredible and it's such a beautiful way to relive our Fraser Island adventure. - Mark & Jenny, Canberra",
      category_intro: "Preserve Your Memories",
      category_persuasion: "Years from now, you'll treasure these moments. Our photography packages ensure you capture every spectacular second of your adventure in stunning detail."
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
      applicable_tours: ["2d-fraser-rainbow", "3d-fraser-rainbow", "4d-fraser-rainbow"], // Multi-day tours only
      description: "Luxury camping experience with comfortable bedding and premium amenities",
      persuasive_title: "Sleep Under the Stars in 5-Star Comfort",
      persuasive_description: "Experience the magic of Fraser Island nights without sacrificing comfort. Our glamping setup combines the romance of sleeping under pristine starry skies with hotel-quality bedding, plush pillows, and premium camping amenities. Wake up to birdsong and ocean breezes in your private luxury tent - it's camping reimagined for the discerning adventurer.",
      value_proposition: "Enjoy the authentic wilderness experience with the comfort of a boutique hotel - no sleeping on the ground, no roughing it, just pure luxury in nature.",
      features: [
        "Spacious safari-style tent with standing room",
        "Queen-size bed with hotel-quality linens",
        "Comfortable pillows and warm duvets",
        "Solar-powered lighting and USB charging",
        "Private outdoor seating area",
        "Premium camping furniture and amenities"
      ],
      testimonial: "We're not campers, but glamping changed our minds! Falling asleep to the sound of waves and waking up to sunrise over the ocean - pure magic. And we were SO comfortable! - Sophie & James, Melbourne",
      category_intro: "Elevate Your Comfort",
      category_persuasion: "Multi-day adventures deserve proper rest. Our accommodation upgrades ensure you wake up refreshed and ready to explore, not sore and exhausted from basic camping."
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
      applicable_tours: ["*"], // Universal - available for all tours
      description: "Private beach shelter with comfortable seating and shade",
      persuasive_title: "Your Private Beach Paradise - Luxury Cabana Setup",
      persuasive_description: "Claim your own slice of paradise with our premium beach cabana. Escape the sun during the heat of the day in your private shaded retreat, complete with comfortable loungers, cooling breeze, and stunning ocean views. Perfect for lunch breaks, afternoon relaxation, or simply enjoying the beach in comfort while others bake in the sun.",
      value_proposition: "Transform any beach stop into your personal luxury resort - shade, comfort, and privacy while everyone else scrambles for sparse natural shade.",
      features: [
        "Large premium beach tent with UV protection",
        "Comfortable beach loungers and chairs",
        "Portable table for dining and drinks",
        "Cooler box with ice for refreshments",
        "Beach blankets and towels",
        "Quick setup and takedown by guide"
      ],
      testimonial: "The cabana made such a difference on the hot days. We had our own shaded paradise while others huddled under trees. Felt like VIP treatment on the beach! - Linda & Mark, Brisbane",
      category_intro: "Elevate Your Comfort",
      category_persuasion: "Multi-day adventures deserve proper rest. Our accommodation upgrades ensure you wake up refreshed and ready to explore, not sore and exhausted from basic camping."
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
      applicable_tours: ["2d-fraser-rainbow", "3d-fraser-rainbow", "4d-fraser-rainbow"], // Multi-day tours only
      description: "Upgrade to sustainable eco-lodge accommodation with modern comforts",
      persuasive_title: "Premium Eco-Lodge - Sustainability Meets Luxury",
      persuasive_description: "Upgrade to our partner eco-lodges and experience sustainable tourism at its finest. These award-winning accommodations offer private rooms with ocean views, modern bathrooms with hot showers, gourmet dining, and resort-style amenities - all powered by renewable energy. Sleep soundly knowing you're minimizing your environmental impact while maximizing your comfort.",
      value_proposition: "Enjoy resort-quality accommodations with clear conscience - luxury that's carbon-neutral and supports local environmental conservation efforts.",
      urgency_text: "Limited eco-lodge rooms available - these sustainable sanctuaries book months in advance",
      features: [
        "Private room with en-suite bathroom",
        "Hot shower and modern facilities",
        "Ocean or rainforest views from your room",
        "100% renewable energy powered",
        "Gourmet breakfast included",
        "Access to lodge pool and common areas",
        "Supporting local conservation projects"
      ],
      testimonial: "The eco-lodge was incredible - felt like a 5-star resort but knowing it's sustainable made it even better. The sunrise view from our room was unforgettable! - Emma & Chris, Sydney",
      category_intro: "Elevate Your Comfort",
      category_persuasion: "Multi-day adventures deserve proper rest. Our accommodation upgrades ensure you wake up refreshed and ready to explore, not sore and exhausted from basic camping."
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
      applicable_tours: ["*"], // Universal - available for all tours
      description: "Complete fishing setup including rods, tackle, and bait",
      persuasive_title: "Catch Your Dinner - Premium Fishing Experience",
      persuasive_description: "Cast a line into some of Queensland's best fishing waters with our professional-grade equipment. Whether you're targeting flathead in the shallows, bream in the creeks, or trying your luck from the beach, we provide everything you need. Our guides know the best spots and techniques - you just need to reel them in.",
      value_proposition: "Experience the thrill of catching your own fresh fish in pristine waters, with expert guidance and quality gear that increases your chances of success.",
      features: [
        "Quality fishing rods and reels (multiple setups)",
        "Complete tackle box with lures and hooks",
        "Fresh bait and local fishing expertise",
        "Guidance on best fishing spots and techniques",
        "Fish cleaning kit (catch and keep allowed)",
        "All necessary fishing accessories"
      ],
      testimonial: "Caught a 60cm flathead with the guide's help! Haven't been that excited in years. The equipment was great quality and made fishing so easy. - Paul, Newcastle",
      category_intro: "Amplify Your Adventure",
      category_persuasion: "Take your tour beyond sightseeing. Our activity packages let you actively engage with the environment, creating hands-on memories and stories worth telling."
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
      applicable_tours: ["1d-rainbow-beach", "2d-fraser-rainbow", "3d-fraser-rainbow", "4d-fraser-rainbow"], // Rainbow Beach tours only
      description: "Sandboards and wax for an adrenaline-pumping dune experience",
      persuasive_title: "Shred the Dunes - Extreme Sandboarding Adventure",
      persuasive_description: "Experience the rush of surfing down massive sand dunes at exhilarating speeds. Fraser Island and Rainbow Beach offer some of Australia's best sandboarding terrain - towering golden slopes perfect for carving, jumping, and catching serious air. It's like snowboarding, but warmer and no ski lifts required.",
      value_proposition: "Get your adrenaline fix without the cold - pure speed and excitement on towering sand dunes that you won't find anywhere else.",
      features: [
        "High-performance sandboards designed for dunes",
        "Quality wax for optimal board performance",
        "Safety instruction and technique coaching",
        "Access to the best sandboarding dunes",
        "Suitable for beginners to advanced riders",
        "GoPro compatible for action footage"
      ],
      testimonial: "So much fun! Hit speeds we never expected and the jumps were epic. My teens loved it - best part of the trip for them. Definitely worth adding! - Karen & Family, Adelaide",
      category_intro: "Amplify Your Adventure",
      category_persuasion: "Take your tour beyond sightseeing. Our activity packages let you actively engage with the environment, creating hands-on memories and stories worth telling."
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
      applicable_tours: ["*"], // Universal - available for all tours
      description: "Bodyboards and fins for riding the waves",
      persuasive_title: "Ride the Waves - Bodyboarding Made Easy",
      persuasive_description: "Feel the thrill of riding Queensland's perfect waves with our premium bodyboarding setup. Whether you're a first-timer or experienced wave rider, 75 Mile Beach and Rainbow Beach offer ideal conditions for bodyboarding fun. Catch waves, feel the rush, and experience the ocean in an entirely new way.",
      value_proposition: "Experience the excitement of surfing without the steep learning curve - bodyboarding is easy to learn and instantly fun for all ages.",
      features: [
        "Quality bodyboards in multiple sizes",
        "Professional swim fins for wave catching",
        "Quick instruction for beginners",
        "Works in various wave conditions",
        "Suitable for ages 8 and up",
        "Safety leash and wetsuit available"
      ],
      testimonial: "Never bodyboarded before but picked it up in minutes! Spent hours in the waves having a blast. Great value and perfect for families. - Michelle, Gold Coast",
      category_intro: "Amplify Your Adventure",
      category_persuasion: "Take your tour beyond sightseeing. Our activity packages let you actively engage with the environment, creating hands-on memories and stories worth telling."
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
      applicable_tours: ["*"], // Universal - available for all tours
      description: "Stand-up paddleboards and paddles for exploring calm waters",
      persuasive_title: "Glide Across Crystal Waters - SUP Paradise",
      persuasive_description: "Stand-up paddleboarding on Fraser Island's calm creeks and pristine lakes is absolutely magical. Glide across mirror-like waters, spot fish beneath your board, and access hidden corners unreachable on foot. It's peaceful, invigorating, and the perfect way to connect with nature while getting a surprising full-body workout.",
      value_proposition: "Explore hidden waterways and experience nature from a unique vantage point - peaceful meditation meets gentle exercise in paradise.",
      features: [
        "Stable inflatable SUPs perfect for beginners",
        "Adjustable paddles for all heights",
        "Life jackets and safety equipment",
        "Dry bag for phone and valuables",
        "Quick instruction and technique tips",
        "Suitable for calm lakes and protected waters"
      ],
      testimonial: "Paddleboarding on Lake McKenzie was surreal - so peaceful and beautiful. Easy to learn and such a unique way to experience the lake. Highly recommend! - Sarah, Sydney",
      category_intro: "Amplify Your Adventure",
      category_persuasion: "Take your tour beyond sightseeing. Our activity packages let you actively engage with the environment, creating hands-on memories and stories worth telling."
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
      applicable_tours: ["*"], // Universal - available for all tours
      description: "Single or double kayaks for coastal exploration and wildlife viewing",
      persuasive_title: "Paddle Your Own Adventure - Kayak Exploration",
      persuasive_description: "Navigate pristine waterways at your own pace with our premium kayaking package. Perfect for couples or solo explorers, kayaking lets you venture into shallow creeks teeming with fish, explore secluded coves, and get up close to coastal wildlife. It's peaceful, romantic, and offers access to places most tourists never see.",
      value_proposition: "Discover secret spots and encounter wildlife up close - the quiet approach of kayaking reveals nature's hidden treasures.",
      urgency_text: "Limited kayaks available - popular with couples and nature photographers",
      features: [
        "Single or tandem ocean kayaks",
        "Quality paddles and safety equipment",
        "Waterproof storage compartments",
        "Life jackets and whistle",
        "Wildlife spotting guide and binoculars",
        "Best for calm waters and sheltered areas",
        "Perfect for couples or solo adventurers"
      ],
      testimonial: "Kayaking through the mangroves and creeks was incredible! We saw stingrays, fish, and amazing birds. So quiet and peaceful - felt like we had the whole place to ourselves. - Ben & Amy, Melbourne",
      category_intro: "Amplify Your Adventure",
      category_persuasion: "Take your tour beyond sightseeing. Our activity packages let you actively engage with the environment, creating hands-on memories and stories worth telling."
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
        description: tour.description,
        collection_handle: "tours",
        status: "published",
        metadata: tour.metadata,
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

    // Step 3: Validate add-on metadata
    console.log("🔍 Validating add-on metadata...")
    for (const addon of ADDONS) {
      validateAddonMetadata(addon)
    }
    console.log(`✅ All ${ADDONS.length} addons validated successfully\n`)

    // Step 4: Create add-on products
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

// Default export for medusa exec command
export default async function ({ container }: ExecArgs) {
  await seedTours(container)
}
