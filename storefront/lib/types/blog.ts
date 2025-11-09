// Blog type definitions for TypeScript
export interface BlogPost {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  featured_image: string;
  featured_image_alt: string;
  author: Author;
  category: Category;
  tags: Tag[];
  published_at: string;
  updated_at: string;
  reading_time: number;
  seo: SEOMetadata;
  featured: boolean;
}

export interface Author {
  id: string;
  name: string;
  avatar?: string;
  bio?: string;
  social?: {
    twitter?: string;
    linkedin?: string;
    website?: string;
  };
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  color?: string;
}

export interface Tag {
  id: string;
  name: string;
  slug: string;
}

export interface SEOMetadata {
  meta_title: string;
  meta_description: string;
  og_image?: string;
  og_title?: string;
  og_description?: string;
  twitter_image?: string;
  twitter_title?: string;
  twitter_description?: string;
  canonical_url?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    page: number;
    per_page: number;
    total: number;
    total_pages: number;
  };
}

export interface BlogFilters {
  category?: string;
  tag?: string;
  search?: string;
  page?: number;
  per_page?: number;
}
