'use client';

import React from 'react';
import styles from './CategoryFilter.module.css';

interface CategoryFilterProps {
  categories: string[];
  selectedCategory: string | null;
  onCategoryChange: (category: string | null) => void;
}

export default function CategoryFilter({
  categories,
  selectedCategory,
  onCategoryChange,
}: CategoryFilterProps) {
  return (
    <div className={styles.filterContainer} role="group" aria-label="Filter by category">
      <button
        type="button"
        onClick={() => onCategoryChange(null)}
        className={`${styles.filterButton} ${selectedCategory === null ? styles.active : ''}`}
        aria-pressed={selectedCategory === null}
        aria-label="Show all categories"
      >
        All
      </button>
      {categories.map((category) => (
        <button
          key={category}
          type="button"
          onClick={() => onCategoryChange(category)}
          className={`${styles.filterButton} ${selectedCategory === category ? styles.active : ''}`}
          aria-pressed={selectedCategory === category}
          aria-label={`Filter by ${category}`}
        >
          {category}
        </button>
      ))}
    </div>
  );
}
