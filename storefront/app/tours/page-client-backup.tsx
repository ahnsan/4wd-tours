// Tour catalog page with ISR and filtering
'use client';

import React, { useState, useCallback } from 'react';
import { useTours } from '../../lib/hooks/useTours';
import TourCard from '../../components/Tours/TourCard';
import FilterBar from '../../components/Tours/FilterBar';
import styles from './tours.module.css';
import type { TourFilters } from '../../lib/types/tour';

export default function ToursPage() {
  const [filters, setFilters] = useState<TourFilters>({
    per_page: 12,
    page: 1,
  });

  const { tours, meta, isLoading, error } = useTours(filters);

  // Handle filter changes from FilterBar
  const handleFilterChange = useCallback((newFilters: {
    duration?: string;
    sort?: 'price_asc' | 'price_desc';
    search?: string;
  }) => {
    setFilters(prev => ({
      ...prev,
      ...newFilters,
      page: 1, // Reset to first page when filters change
    }));
  }, []);

  // Handle pagination
  const handlePageChange = (newPage: number) => {
    setFilters(prev => ({
      ...prev,
      page: newPage,
    }));

    // Scroll to top of page
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Calculate pagination info
  const totalPages = meta ? Math.ceil(meta.count / (filters.per_page || 12)) : 1;
  const currentPage = filters.page || 1;

  return (
    <div className={styles.toursPage}>
      {/* Header Section */}
      <header className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>Sunshine Coast 4WD Tours</h1>
        <p className={styles.pageSubtitle}>
          Discover the best 4WD adventures on the Sunshine Coast. From day tours to multi-day expeditions,
          find your perfect experience.
        </p>
      </header>

      {/* Filter Bar */}
      <FilterBar onFilterChange={handleFilterChange} />

      {/* Main Content */}
      <main className={styles.mainContent}>
        {/* Loading State */}
        {isLoading && (
          <div className={styles.loadingContainer} role="status" aria-live="polite">
            <div className={styles.spinner} aria-hidden="true"></div>
            <p>Loading tours...</p>
          </div>
        )}

        {/* Error State */}
        {error && !isLoading && (
          <div className={styles.errorContainer} role="alert">
            <svg
              width="48"
              height="48"
              viewBox="0 0 48 48"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
            >
              <path
                d="M24 44C35.0457 44 44 35.0457 44 24C44 12.9543 35.0457 4 24 4C12.9543 4 4 12.9543 4 24C4 35.0457 12.9543 44 24 44Z"
                stroke="currentColor"
                strokeWidth="2"
              />
              <path
                d="M24 16V26"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
              <circle cx="24" cy="32" r="1.5" fill="currentColor" />
            </svg>
            <h2>Unable to Load Tours</h2>
            <p>{error.message}</p>
            <button onClick={() => window.location.reload()} className={styles.retryButton}>
              Try Again
            </button>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !error && tours.length === 0 && (
          <div className={styles.emptyContainer}>
            <svg
              width="64"
              height="64"
              viewBox="0 0 64 64"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
            >
              <path
                d="M32 56C45.2548 56 56 45.2548 56 32C56 18.7452 45.2548 8 32 8C18.7452 8 8 18.7452 8 32C8 45.2548 18.7452 56 32 56Z"
                stroke="currentColor"
                strokeWidth="2"
              />
              <path
                d="M22 28L32 38L42 28"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <h2>No Tours Found</h2>
            <p>Try adjusting your filters to see more results.</p>
          </div>
        )}

        {/* Tours Grid */}
        {!isLoading && !error && tours.length > 0 && (
          <>
            <div className={styles.resultsInfo}>
              <p>
                Showing {meta?.offset ? meta.offset + 1 : 1}-
                {Math.min((meta?.offset || 0) + (meta?.limit || 12), meta?.count || 0)} of {meta?.count || 0} tours
              </p>
            </div>

            <div className={styles.toursGrid}>
              {tours.map((tour) => (
                <TourCard key={tour.id} tour={tour} />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <nav className={styles.pagination} aria-label="Tour pagination">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className={styles.paginationButton}
                  aria-label="Previous page"
                >
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 20 20"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    aria-hidden="true"
                  >
                    <path
                      d="M12 4L6 10L12 16"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  Previous
                </button>

                <div className={styles.pageNumbers}>
                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter(page => {
                      // Show first page, last page, current page, and pages around current
                      return (
                        page === 1 ||
                        page === totalPages ||
                        (page >= currentPage - 1 && page <= currentPage + 1)
                      );
                    })
                    .map((page, index, array) => (
                      <React.Fragment key={page}>
                        {index > 0 && array[index - 1] !== page - 1 && (
                          <span className={styles.ellipsis} aria-hidden="true">
                            ...
                          </span>
                        )}
                        <button
                          onClick={() => handlePageChange(page)}
                          className={`${styles.pageNumber} ${
                            page === currentPage ? styles.active : ''
                          }`}
                          aria-label={`Go to page ${page}`}
                          aria-current={page === currentPage ? 'page' : undefined}
                        >
                          {page}
                        </button>
                      </React.Fragment>
                    ))}
                </div>

                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className={styles.paginationButton}
                  aria-label="Next page"
                >
                  Next
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 20 20"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    aria-hidden="true"
                  >
                    <path
                      d="M8 4L14 10L8 16"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>
              </nav>
            )}
          </>
        )}
      </main>
    </div>
  );
}
