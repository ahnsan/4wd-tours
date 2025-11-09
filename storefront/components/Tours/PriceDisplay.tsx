// Price display component for formatting AUD currency
'use client';

import React from 'react';

interface PriceDisplayProps {
  amount: number;
  currency?: string;
  className?: string;
}

export default function PriceDisplay({
  amount,
  currency = 'AUD',
  className = ''
}: PriceDisplayProps) {
  // Format price to AUD with proper cents
  const formatPrice = (cents: number): string => {
    const dollars = cents / 100;
    return new Intl.NumberFormat('en-AU', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(dollars);
  };

  return (
    <span className={className} aria-label={`Price: ${formatPrice(amount)}`}>
      {formatPrice(amount)}
    </span>
  );
}
