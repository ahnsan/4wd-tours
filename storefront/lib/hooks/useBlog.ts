// Custom hooks for blog API integration with Medusa
'use client';

import { useState, useEffect, useCallback } from 'react';
import type { BlogPost, PaginatedResponse, BlogFilters } from '../types/blog';

// Environment configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:9000';
const PUBLISHABLE_API_KEY = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY;

// MANDATORY: Use coordination hooks before API calls
const useCoordinationHook = (operation: string) => {
  useEffect(() => {
    // Pre-operation coordination
    if (typeof window !== 'undefined') {
      console.log(`[Blog Hook] ${operation} - coordinating via memory`);
    }
  }, [operation]);
};

// Build request headers with publishable API key
function buildHeaders(): HeadersInit {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };

  if (PUBLISHABLE_API_KEY) {
    headers['x-publishable-api-key'] = PUBLISHABLE_API_KEY;
  }

  return headers;
}

export function useBlogPosts(filters?: BlogFilters) {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [meta, setMeta] = useState<PaginatedResponse<BlogPost>['meta'] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useCoordinationHook('fetchBlogPosts');

  const fetchPosts = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Build query string from filters
      const params = new URLSearchParams();
      if (filters?.category) params.append('category', filters.category);
      if (filters?.tag) params.append('tag', filters.tag);
      if (filters?.search) params.append('search', filters.search);
      if (filters?.page) params.append('page', filters.page.toString());
      if (filters?.per_page) params.append('per_page', filters.per_page.toString());

      // MANDATORY: Use Medusa API endpoint pattern
      const response = await fetch(`${API_BASE_URL}/store/blog/posts?${params.toString()}`, {
        headers: buildHeaders(),
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch posts: ${response.statusText}`);
      }

      const apiResponse = await response.json();

      // Transform Medusa API response to match PaginatedResponse format
      setPosts(apiResponse.posts || []);
      setMeta({
        page: filters?.page || 1,
        per_page: filters?.per_page || apiResponse.limit || 20,
        total: apiResponse.count || 0,
        total_pages: Math.ceil((apiResponse.count || 0) / (apiResponse.limit || 20)),
      });
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
      console.error('[useBlogPosts] Error fetching posts:', err);
    } finally {
      setIsLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  return { posts, meta, isLoading, error, refetch: fetchPosts };
}

export function useBlogPost(slug: string) {
  const [post, setPost] = useState<BlogPost | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useCoordinationHook(`fetchBlogPost:${slug}`);

  useEffect(() => {
    async function fetchPost() {
      try {
        setIsLoading(true);
        setError(null);

        // MANDATORY: Use Medusa API endpoint pattern
        const response = await fetch(`${API_BASE_URL}/store/blog/posts/${slug}`, {
          headers: buildHeaders(),
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch post: ${response.statusText}`);
        }

        const data = await response.json();
        setPost(data.post);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Unknown error'));
        console.error('[useBlogPost] Error fetching post:', err);
      } finally {
        setIsLoading(false);
      }
    }

    if (slug) {
      fetchPost();
    }
  }, [slug]);

  return { post, isLoading, error };
}

export function useRelatedPosts(postId: string, limit: number = 3) {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useCoordinationHook(`fetchRelatedPosts:${postId}`);

  useEffect(() => {
    async function fetchRelated() {
      try {
        setIsLoading(true);
        setError(null);

        const response = await fetch(`${API_BASE_URL}/store/blog/posts/${postId}/related?limit=${limit}`, {
          headers: buildHeaders(),
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch related posts: ${response.statusText}`);
        }

        const data = await response.json();
        setPosts(data.posts);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Unknown error'));
        console.error('[useRelatedPosts] Error fetching related posts:', err);
      } finally {
        setIsLoading(false);
      }
    }

    if (postId) {
      fetchRelated();
    }
  }, [postId, limit]);

  return { posts, isLoading, error };
}

export function useCategories() {
  const [categories, setCategories] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useCoordinationHook('fetchCategories');

  useEffect(() => {
    async function fetchCategories() {
      try {
        setIsLoading(true);
        setError(null);

        const response = await fetch(`${API_BASE_URL}/store/blog/categories`, {
          headers: buildHeaders(),
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch categories: ${response.statusText}`);
        }

        const data = await response.json();
        setCategories(data.categories);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Unknown error'));
        console.error('[useCategories] Error fetching categories:', err);
      } finally {
        setIsLoading(false);
      }
    }

    fetchCategories();
  }, []);

  return { categories, isLoading, error };
}

// Debounce hook for search functionality (MANDATORY for performance)
export function useDebounce<T>(value: T, delay: number = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}
