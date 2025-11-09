// Filter bar component for tour catalog
'use client';

import React, { useState } from 'react';
import { useDebounce } from '../../lib/hooks/useTours';
import styles from './FilterBar.module.css';

interface FilterBarProps {
  onFilterChange: (filters: {
    duration?: string;
    sort?: 'price_asc' | 'price_desc';
    search?: string;
  }) => void;
}

export default function FilterBar({ onFilterChange }: FilterBarProps) {
  const [search, setSearch] = useState('');
  const [duration, setDuration] = useState('');
  const [sort, setSort] = useState<'price_asc' | 'price_desc' | ''>('');

  // Debounce search for performance (300ms delay)
  const debouncedSearch = useDebounce(search, 300);

  // Update filters when debounced search changes
  React.useEffect(() => {
    onFilterChange({
      search: debouncedSearch || undefined,
      duration: duration || undefined,
      sort: sort || undefined,
    });
  }, [debouncedSearch, duration, sort, onFilterChange]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
  };

  const handleDurationChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setDuration(e.target.value);
  };

  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSort(e.target.value as 'price_asc' | 'price_desc' | '');
  };

  const handleClearFilters = () => {
    setSearch('');
    setDuration('');
    setSort('');
  };

  const hasActiveFilters = search || duration || sort;

  return (
    <div className={styles.filterBar} role="search" aria-label="Tour filters">
      <div className={styles.filterGroup}>
        <label htmlFor="search" className={styles.label}>
          Search Tours
        </label>
        <div className={styles.searchContainer}>
          <svg
            width="20"
            height="20"
            viewBox="0 0 20 20"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={styles.searchIcon}
            aria-hidden="true"
          >
            <path
              d="M9 17C13.4183 17 17 13.4183 17 9C17 4.58172 13.4183 1 9 1C4.58172 1 1 4.58172 1 9C1 13.4183 4.58172 17 9 17Z"
              stroke="currentColor"
              strokeWidth="2"
            />
            <path
              d="M19 19L14.65 14.65"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
          <input
            id="search"
            type="text"
            placeholder="Search by tour name..."
            value={search}
            onChange={handleSearchChange}
            className={styles.searchInput}
            aria-label="Search tours by name"
          />
        </div>
      </div>

      <div className={styles.filterGroup}>
        <label htmlFor="duration" className={styles.label}>
          Duration
        </label>
        <select
          id="duration"
          value={duration}
          onChange={handleDurationChange}
          className={styles.select}
          aria-label="Filter by tour duration"
        >
          <option value="">All Durations</option>
          <option value="1-day">1 Day</option>
          <option value="2-day">2 Days</option>
          <option value="3-day">3 Days</option>
          <option value="4-day">4+ Days</option>
        </select>
      </div>

      <div className={styles.filterGroup}>
        <label htmlFor="sort" className={styles.label}>
          Sort By
        </label>
        <select
          id="sort"
          value={sort}
          onChange={handleSortChange}
          className={styles.select}
          aria-label="Sort tours by price"
        >
          <option value="">Default</option>
          <option value="price_asc">Price: Low to High</option>
          <option value="price_desc">Price: High to Low</option>
        </select>
      </div>

      {hasActiveFilters && (
        <button
          onClick={handleClearFilters}
          className={styles.clearButton}
          aria-label="Clear all filters"
        >
          Clear Filters
        </button>
      )}
    </div>
  );
}
