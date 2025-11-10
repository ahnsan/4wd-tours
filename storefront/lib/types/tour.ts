// Tour type definitions for TypeScript

export interface TourProduct {
  id: string;
  handle: string;
  title: string;
  description: string;
  thumbnail: string;
  images: TourImage[];
  variants: TourVariant[];
  options: TourOption[];
  metadata: TourMetadata;
  collection_id?: string;
  collection?: TourCollection;
  created_at: string;
  updated_at: string;
}

export interface TourImage {
  id: string;
  url: string;
  alt?: string;
  metadata?: {
    width?: number;
    height?: number;
  };
}

export interface TourVariant {
  id: string;
  title: string;
  sku?: string;
  prices: TourPrice[];
  inventory_quantity: number;
  allow_backorder: boolean;
  manage_inventory: boolean;
  options: { [key: string]: string };
}

export interface TourPrice {
  id: string;
  currency_code: string;
  amount: number;
  variant_id: string;
}

export interface TourOption {
  id: string;
  title: string;
  values: TourOptionValue[];
}

export interface TourOptionValue {
  id: string;
  value: string;
}

export interface TourMetadata {
  duration?: string;
  departure_times?: string[];
  inclusions?: string[];
  exclusions?: string[];
  difficulty_level?: string;
  difficulty?: string; // Added to match CartContext Tour interface and tours-data.ts
  min_participants?: number;
  max_participants?: number;
  category?: string;
  featured?: boolean;
}

export interface TourCollection {
  id: string;
  title: string;
  handle: string;
  metadata?: {
    description?: string;
  };
}

export interface RelatedTour {
  id: string;
  handle: string;
  title: string;
  thumbnail: string;
  description: string;
  price: number;
  currency: string;
  duration?: string;
  category?: string;
}

export interface CartItem {
  variantId: string;
  quantity: number;
  selectedDate: string;
}

export interface TourDetailPageProps {
  params: {
    handle: string;
  };
}

export interface DatePickerProps {
  selectedDate: Date | null;
  onDateChange: (date: Date | null) => void;
  minDate?: Date;
  maxDate?: Date;
  unavailableDates?: Date[];
}

export interface QuantitySelectorProps {
  quantity: number;
  onQuantityChange: (quantity: number) => void;
  min?: number;
  max?: number;
}

export interface TourGalleryProps {
  images: TourImage[];
  title: string;
}

export interface TourSEO {
  title: string;
  description: string;
  image: string;
  canonical_url: string;
  product_schema: object;
}

// Additional types for catalog page
export interface TourFilters {
  duration?: string;
  sort?: 'price_asc' | 'price_desc' | 'name_asc' | 'name_desc';
  search?: string;
  page?: number;
  per_page?: number;
}

export interface PaginatedTourResponse {
  products: TourProduct[];
  count: number;
  offset: number;
  limit: number;
}
