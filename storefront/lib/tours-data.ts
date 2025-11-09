import { Tour, AddOn } from '../contexts/CartContext';

// Sample tours data - In production, this would come from Medusa API
export const toursData: Tour[] = [
  {
    id: 'tour-1',
    handle: '2d-fraser-rainbow',
    title: '2 Day Fraser & Rainbow Beach Adventure',
    description: 'Experience the ultimate Fraser Island and Rainbow Beach adventure over two unforgettable days. Explore pristine beaches, colored sand cliffs, freshwater lakes, and ancient rainforests. This comprehensive tour includes beach camping, guided 4WD adventures, swimming in crystal-clear lakes, and witnessing spectacular sunrises over the Pacific Ocean.',
    price: 549,
    duration: '2 Days / 1 Night',
    image: '/images/tour_options.png',
    category: 'Camping & Adventure',
    difficulty: 'Moderate',
    maxParticipants: 12,
  },
  {
    id: 'tour-2',
    handle: '1d-fraser-island',
    title: 'Rainbow Beach Tag-Along 4WD Adventure',
    description: 'Join Fraser Dingo 4WD Adventures for our relaxed and friendly guided tour. Experience pristine beaches, colored sands, and stunning coastal views while staying in comfortable beach house accommodation.',
    price: 249,
    duration: 'Full Day (8 hours)',
    image: '/images/tour_options.png',
    category: 'Beach & Coastal',
    difficulty: 'Easy',
    maxParticipants: 12,
  },
  {
    id: 'tour-3',
    handle: 'fraser-island-camping',
    title: 'K\'gari (Fraser Island) 4WD Camping Expedition',
    description: 'Experience four-wheel driving on K\'gari and spend your nights camping under the stars. Our camping package is a hassle-free way to pack less and see more of this World Heritage paradise.',
    price: 399,
    duration: '2 Days / 1 Night',
    image: '/images/tour_options.png',
    category: 'Camping & Adventure',
    difficulty: 'Moderate',
    maxParticipants: 8,
  },
  {
    id: 'tour-4',
    handle: 'fraser-rainforest-hiking',
    title: 'Fraser Island Rainforest Hiking Adventure',
    description: 'Explore K\'gari on foot with one of Fraser Island Hiking\'s unique packages. Discover untouched nature when you slow down and walk through diverse ecosystems including rainforest, mangroves, and pristine beaches.',
    price: 179,
    duration: 'Full Day (6 hours)',
    image: '/images/tour_options.png',
    category: 'Hiking & Nature',
    difficulty: 'Moderate',
    maxParticipants: 10,
  },
  {
    id: 'tour-5',
    handle: 'sunset-beach-safari',
    title: 'Sunset Beach Drive & Wildlife Safari',
    description: 'Experience the magic of the Sunshine Coast at golden hour. Drive along stunning beaches, spot dolphins and whales (seasonal), and enjoy a spectacular sunset with champagne and canapés.',
    price: 199,
    duration: 'Half Day (4 hours)',
    image: '/images/tour_options.png',
    category: 'Beach & Wildlife',
    difficulty: 'Easy',
    maxParticipants: 15,
  },
  {
    id: 'tour-6',
    handle: 'hinterland-discovery',
    title: 'Outback & Hinterland Discovery Tour',
    description: 'Journey into the Queensland hinterland and discover hidden waterfalls, ancient rainforest, and breathtaking mountain views. Includes lunch at a local winery.',
    price: 299,
    duration: 'Full Day (9 hours)',
    image: '/images/tour_options.png',
    category: 'Outback & Hinterland',
    difficulty: 'Moderate',
    maxParticipants: 10,
  },
  {
    id: 'tour-7',
    handle: '4wd-skills-training',
    title: 'Advanced 4WD Skills Training',
    description: 'Master off-road driving techniques with our expert instructors. Learn sand driving, recovery techniques, and recovery techniques, and vehicle setup for serious adventurers.',
    price: 349,
    duration: 'Full Day (8 hours)',
    image: '/images/tour_options.png',
    category: 'Training & Skills',
    difficulty: 'Advanced',
    maxParticipants: 6,
  },
];

// Sample add-ons data
export const addOnsData: AddOn[] = [
  {
    id: 'addon-1',
    name: 'Gourmet Picnic Lunch',
    description: 'Premium lunch basket featuring local Queensland produce, artisan breads, cheeses, and fresh fruits',
    price: 35,
    category: 'Food & Beverage',
  },
  {
    id: 'addon-2',
    name: 'Professional Photography Package',
    description: 'Professional photographer captures your adventure. Receive 50+ edited digital photos within 48 hours',
    price: 150,
    category: 'Photography',
  },
  {
    id: 'addon-3',
    name: 'GoPro Camera Rental',
    description: 'GoPro Hero 11 camera with mounts and SD card. Capture your own adventure footage',
    price: 45,
    category: 'Equipment',
  },
  {
    id: 'addon-4',
    name: 'Camping Equipment Package',
    description: 'Quality tent, sleeping bags, camping chairs, and cooking equipment for overnight tours',
    price: 80,
    category: 'Equipment',
  },
  {
    id: 'addon-5',
    name: 'Wildlife Spotting Binoculars',
    description: 'Premium binoculars for wildlife watching and scenic viewing',
    price: 25,
    category: 'Equipment',
  },
  {
    id: 'addon-6',
    name: 'Sunset Champagne Experience',
    description: 'Premium Australian champagne with gourmet cheese and crackers served at sunset',
    price: 65,
    category: 'Food & Beverage',
  },
  {
    id: 'addon-7',
    name: 'Hotel Pickup & Drop-off',
    description: 'Convenient pickup and drop-off service from your Sunshine Coast accommodation',
    price: 40,
    category: 'Transport',
  },
  {
    id: 'addon-8',
    name: 'Extended Travel Insurance',
    description: 'Comprehensive travel insurance coverage for your tour',
    price: 30,
    category: 'Insurance',
  },
];

// Helper functions
export function getTourById(id: string): Tour | undefined {
  return toursData.find((tour) => tour.id === id);
}

export function getTourByHandle(handle: string): Tour | undefined {
  // Map common handles to tour IDs
  const handleToId: Record<string, string> = {
    // Tour 1 - 2 Day Fraser & Rainbow Beach
    '2d-fraser-rainbow': 'tour-1',
    '2-day-fraser-rainbow': 'tour-1',
    // Tour 2 - Rainbow Beach Tag-Along
    '1d-fraser-island': 'tour-2',
    'rainbow-beach-tag-along': 'tour-2',
    // Tour 3 - K'gari Camping
    'fraser-island-camping': 'tour-3',
    'kgari-camping': 'tour-3',
    // Tour 4 - Rainforest Hiking
    'fraser-rainforest-hiking': 'tour-4',
    // Tour 5 - Sunset Beach Drive
    'sunset-beach-safari': 'tour-5',
    // Tour 6 - Hinterland Discovery
    'hinterland-discovery': 'tour-6',
    // Tour 7 - 4WD Skills
    '4wd-skills-training': 'tour-7',
  };

  const tourId = handleToId[handle];
  return tourId ? getTourById(tourId) : undefined;
}

export function getAddOnById(id: string): AddOn | undefined {
  return addOnsData.find((addon) => addon.id === id);
}

export function getToursByCategory(category: string): Tour[] {
  return toursData.filter((tour) => tour.category === category);
}

export function getAddOnsByCategory(category: string): AddOn[] {
  return addOnsData.filter((addon) => addon.category === category);
}

export const tourCategories = [
  'All Tours',
  'Beach & Coastal',
  'Camping & Adventure',
  'Hiking & Nature',
  'Beach & Wildlife',
  'Outback & Hinterland',
  'Training & Skills',
];

export const addOnCategories = [
  'All Add-ons',
  'Food & Beverage',
  'Photography',
  'Equipment',
  'Transport',
  'Insurance',
];
