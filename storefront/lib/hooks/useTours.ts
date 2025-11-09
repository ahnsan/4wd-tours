// Custom hooks for tour API integration with Medusa
'use client';

import { useState, useEffect, useCallback } from 'react';
import type { TourProduct, TourFilters, PaginatedTourResponse } from '../types/tour';

// MANDATORY: Use coordination hooks before API calls
const useCoordinationHook = (operation: string) => {
  useEffect(() => {
    // Pre-operation coordination
    if (typeof window !== 'undefined') {
      console.log(`[Tour Hook] ${operation} - coordinating via memory`);
    }
  }, [operation]);
};

export function useTours(filters?: TourFilters) {
  const [tours, setTours] = useState<TourProduct[]>([]);
  const [meta, setMeta] = useState<{ count: number; offset: number; limit: number } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useCoordinationHook('fetchTours');

  const fetchTours = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Build query string from filters
      const params = new URLSearchParams();

      // Always filter by tours collection
      params.append('collection_id[]', 'tours');

      if (filters?.duration) params.append('duration', filters.duration);
      if (filters?.sort) params.append('sort', filters.sort);
      if (filters?.search) params.append('q', filters.search);
      if (filters?.page) params.append('offset', ((filters.page - 1) * (filters.per_page || 12)).toString());
      if (filters?.per_page) params.append('limit', filters.per_page.toString());

      // MANDATORY: Use Medusa API endpoint pattern
      const response = await fetch(`/store/products?${params.toString()}`, {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch tours: ${response.statusText}`);
      }

      const data: PaginatedTourResponse = await response.json();
      setTours(data.products);
      setMeta({
        count: data.count,
        offset: data.offset,
        limit: data.limit,
      });
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
      console.error('[useTours] Error fetching tours:', err);
    } finally {
      setIsLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchTours();
  }, [fetchTours]);

  return { tours, meta, isLoading, error, refetch: fetchTours };
}

export function useTour(handle: string) {
  const [tour, setTour] = useState<TourProduct | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useCoordinationHook(`fetchTour:${handle}`);

  useEffect(() => {
    async function fetchTour() {
      try {
        setIsLoading(true);
        setError(null);

        // MANDATORY: Use Medusa API endpoint pattern
        const response = await fetch(`/store/products/${handle}`, {
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch tour: ${response.statusText}`);
        }

        const data = await response.json();
        setTour(data.product);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Unknown error'));
        console.error('[useTour] Error fetching tour:', err);
      } finally {
        setIsLoading(false);
      }
    }

    if (handle) {
      fetchTour();
    }
  }, [handle]);

  return { tour, isLoading, error };
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
