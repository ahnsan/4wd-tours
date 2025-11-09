'use client';

import React from 'react';
import { QuantitySelectorProps } from '../../lib/types/tour';
import styles from './QuantitySelector.module.css';

export default function QuantitySelector({
  quantity,
  onQuantityChange,
  min = 1,
  max = 20,
}: QuantitySelectorProps) {
  const handleDecrement = () => {
    if (quantity > min) {
      onQuantityChange(quantity - 1);
    }
  };

  const handleIncrement = () => {
    if (quantity < max) {
      onQuantityChange(quantity + 1);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value, 10);
    if (!isNaN(value) && value >= min && value <= max) {
      onQuantityChange(value);
    }
  };

  return (
    <div className={styles.quantitySelector}>
      <label htmlFor="quantity" className={styles.label}>
        Number of Participants
      </label>
      <div className={styles.controls}>
        <button
          type="button"
          className={styles.button}
          onClick={handleDecrement}
          disabled={quantity <= min}
          aria-label="Decrease quantity"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        </button>

        <input
          id="quantity"
          type="number"
          className={styles.input}
          value={quantity}
          onChange={handleInputChange}
          min={min}
          max={max}
          aria-label="Quantity"
        />

        <button
          type="button"
          className={styles.button}
          onClick={handleIncrement}
          disabled={quantity >= max}
          aria-label="Increase quantity"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        </button>
      </div>

      <p className={styles.hint}>
        Min: {min} {min === 1 ? 'person' : 'people'} | Max: {max} people
      </p>
    </div>
  );
}
