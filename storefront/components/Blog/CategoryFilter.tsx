// Category Filter and Search Component
'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCategories, useDebounce } from '@/lib/hooks/useBlog';
import styles from './CategoryFilter.module.css';

export function CategoryFilter() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { categories, isLoading } = useCategories();

  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || 'all');

  // MANDATORY: Debounce search for performance (300ms delay)
  const debouncedSearch = useDebounce(searchQuery, 300);

  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString());

    // Update search param
    if (debouncedSearch) {
      params.set('search', debouncedSearch);
      params.set('page', '1'); // Reset to first page on search
    } else {
      params.delete('search');
    }

    // Update category param
    if (selectedCategory && selectedCategory !== 'all') {
      params.set('category', selectedCategory);
      params.set('page', '1'); // Reset to first page on category change
    } else {
      params.delete('category');
    }

    router.push(`/blog?${params.toString()}`, { scroll: false });
  }, [debouncedSearch, selectedCategory, router, searchParams]);

  const handleCategoryChange = (categorySlug: string) => {
    setSelectedCategory(categorySlug);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedCategory('all');
    router.push('/blog');
  };

  const hasActiveFilters = searchQuery || (selectedCategory && selectedCategory !== 'all');

  return (
    <div className={styles.filterContainer}>
      {/* Search Bar */}
      <div className={styles.searchWrapper}>
        <input
          type="search"
          placeholder="Search articles..."
          value={searchQuery}
          onChange={handleSearchChange}
          className={styles.searchInput}
          aria-label="Search blog posts"
        />
        <svg
          className={styles.searchIcon}
          width="20"
          height="20"
          viewBox="0 0 20 20"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M9 17A8 8 0 1 0 9 1a8 8 0 0 0 0 16zM19 19l-4.35-4.35"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>

      {/* Category Filters */}
      <div className={styles.categoriesWrapper}>
        <h3 className={styles.filterLabel}>Categories</h3>
        <div className={styles.categoryGrid}>
          <button
            onClick={() => handleCategoryChange('all')}
            className={`${styles.categoryButton} ${selectedCategory === 'all' ? styles.active : ''}`}
            aria-pressed={selectedCategory === 'all'}
          >
            All Posts
          </button>

          {isLoading ? (
            // Skeleton loaders (MANDATORY for CLS prevention)
            Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className={styles.categorySkeleton} />
            ))
          ) : (
            categories.map((category) => (
              <button
                key={category.id}
                onClick={() => handleCategoryChange(category.slug)}
                className={`${styles.categoryButton} ${selectedCategory === category.slug ? styles.active : ''}`}
                style={{
                  '--category-color': category.color || '#1a5f3f',
                } as React.CSSProperties}
                aria-pressed={selectedCategory === category.slug}
              >
                {category.name}
              </button>
            ))
          )}
        </div>
      </div>

      {/* Active Filters / Clear Button */}
      {hasActiveFilters && (
        <div className={styles.activeFilters}>
          <span className={styles.filterCount}>
            Filters active
          </span>
          <button onClick={clearFilters} className={styles.clearButton}>
            Clear all filters
          </button>
        </div>
      )}
    </div>
  );
}
