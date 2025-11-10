'use client';

/**
 * Client-side Filter Bar Component
 * Separated from main tours page for SSR optimization
 *
 * Performance Optimizations:
 * - Debounced search input (300ms delay)
 * - Prevents excessive re-renders
 * - Server-side filtering via URL params
 *
 * Accessibility Features:
 * - Full keyboard navigation support
 * - ARIA labels for all controls
 * - Clear focus indicators
 * - Screen reader announcements
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import styles from './FilterBar.module.css';

export default function FilterBarClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  const [duration, setDuration] = useState(searchParams.get('duration') || '');
  const [sort, setSort] = useState(searchParams.get('sort') || '');
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [isSearching, setIsSearching] = useState(false);

  /**
   * Debounced filter application
   * Waits 300ms after last change before updating URL
   */
  const applyFiltersDebounced = useCallback((
    searchValue: string,
    durationValue: string,
    sortValue: string
  ) => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    setIsSearching(true);

    debounceTimerRef.current = setTimeout(() => {
      const params = new URLSearchParams();
      if (durationValue) params.append('duration', durationValue);
      if (sortValue) params.append('sort', sortValue);
      if (searchValue) params.append('search', searchValue);

      router.push(`/tours?${params.toString()}`);
      setIsSearching(false);
    }, 300);
  }, [router]);

  // Cleanup debounce timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  const handleFilterChange = () => {
    const params = new URLSearchParams();
    if (duration) params.append('duration', duration);
    if (sort) params.append('sort', sort);
    if (search) params.append('search', search);

    router.push(`/tours?${params.toString()}`);
  };

  const handleSearchChange = (value: string) => {
    setSearch(value);
    applyFiltersDebounced(value, duration, sort);
  };

  const handleDurationChange = (value: string) => {
    setDuration(value);
    applyFiltersDebounced(search, value, sort);
  };

  const handleSortChange = (value: string) => {
    setSort(value);
    applyFiltersDebounced(search, duration, value);
  };

  const handleReset = () => {
    setDuration('');
    setSort('');
    setSearch('');
    setIsSearching(false);
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    router.push('/tours');
  };

  return (
    <div className={styles.filterBar} role="search" aria-label="Tour filters">
      <div className={styles.filterGroup}>
        <div className={styles.searchWrapper}>
          <input
            type="search"
            placeholder="Search tours..."
            className={styles.searchInput}
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleFilterChange();
              }
            }}
            aria-label="Search tours by name or description"
            aria-describedby={isSearching ? 'search-status' : undefined}
          />
          {isSearching && (
            <span id="search-status" className={styles.searchingIndicator} aria-live="polite">
              Searching...
            </span>
          )}
        </div>

        <select
          className={styles.filterSelect}
          value={duration}
          onChange={(e) => handleDurationChange(e.target.value)}
          aria-label="Filter tours by duration"
        >
          <option value="">All Durations</option>
          <option value="1-day">1 Day</option>
          <option value="2-day">2 Days</option>
          <option value="3-day">3 Days</option>
          <option value="4-day">4+ Days</option>
        </select>

        <select
          className={styles.filterSelect}
          value={sort}
          onChange={(e) => handleSortChange(e.target.value)}
          aria-label="Sort tours by price or name"
        >
          <option value="">Sort By</option>
          <option value="price_asc">Price: Low to High</option>
          <option value="price_desc">Price: High to Low</option>
          <option value="name_asc">Name: A-Z</option>
          <option value="name_desc">Name: Z-A</option>
        </select>

        <button
          className={styles.resetButton}
          onClick={handleReset}
          aria-label="Reset all filters"
          type="button"
        >
          Reset Filters
        </button>
      </div>
    </div>
  );
}
