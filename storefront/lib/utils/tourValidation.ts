/**
 * Tour Data Validation Utilities
 *
 * Provides comprehensive validation for tour data to prevent runtime errors
 * caused by missing or malformed data from the API or data sources.
 *
 * Usage:
 *   const validation = validateTourData(tour);
 *   if (!validation.isValid) {
 *     // Handle error - show user-friendly message
 *     return <TourNotFound errors={validation.errors} />;
 *   }
 *   // Proceed with validated tour data
 */

import type { Tour } from '@/contexts/CartContext';

export interface ValidationError {
  field: string;
  message: string;
  severity: 'critical' | 'warning' | 'info';
}

export interface TourValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationError[];
  tour?: Tour;
}

export interface ProductValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationError[];
  product?: any;
}

/**
 * Validate Tour data structure
 * Returns detailed validation results with field-specific errors
 */
export function validateTourData(tour: any): TourValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationError[] = [];

  // Critical validations - must pass for tour to be usable
  if (!tour) {
    errors.push({
      field: 'tour',
      message: 'Tour data is null or undefined',
      severity: 'critical',
    });
    return { isValid: false, errors, warnings };
  }

  if (!tour.id || typeof tour.id !== 'string') {
    errors.push({
      field: 'id',
      message: 'Tour ID is missing or invalid',
      severity: 'critical',
    });
  }

  if (!tour.title || typeof tour.title !== 'string' || tour.title.trim() === '') {
    errors.push({
      field: 'title',
      message: 'Tour title is missing or empty',
      severity: 'critical',
    });
  }

  // Validate price
  if (tour.price === undefined || tour.price === null) {
    errors.push({
      field: 'price',
      message: 'Tour price is missing',
      severity: 'critical',
    });
  } else if (typeof tour.price !== 'number' || tour.price < 0) {
    errors.push({
      field: 'price',
      message: 'Tour price is invalid or negative',
      severity: 'critical',
    });
  }

  // Warning validations - tour can still be displayed but may have issues
  if (!tour.description || tour.description.trim() === '') {
    warnings.push({
      field: 'description',
      message: 'Tour description is missing - will use default',
      severity: 'warning',
    });
  }

  if (!tour.image || typeof tour.image !== 'string') {
    warnings.push({
      field: 'image',
      message: 'Tour image is missing - will use placeholder',
      severity: 'warning',
    });
  }

  if (!tour.duration || typeof tour.duration !== 'string') {
    warnings.push({
      field: 'duration',
      message: 'Tour duration is missing - will use default',
      severity: 'warning',
    });
  }

  if (!tour.category) {
    warnings.push({
      field: 'category',
      message: 'Tour category is missing - will use default',
      severity: 'info',
    });
  }

  if (!tour.difficulty) {
    warnings.push({
      field: 'difficulty',
      message: 'Tour difficulty is missing - will use default',
      severity: 'info',
    });
  }

  if (!tour.maxParticipants || typeof tour.maxParticipants !== 'number') {
    warnings.push({
      field: 'maxParticipants',
      message: 'Max participants is missing - will use default (20)',
      severity: 'info',
    });
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    tour: errors.length === 0 ? (tour as Tour) : undefined,
  };
}

/**
 * Validate Product data structure (Medusa format)
 * Used for tour detail pages that receive product data from API
 */
export function validateProductData(product: any): ProductValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationError[] = [];

  // Critical validations
  if (!product) {
    errors.push({
      field: 'product',
      message: 'Product data is null or undefined',
      severity: 'critical',
    });
    return { isValid: false, errors, warnings };
  }

  if (!product.id) {
    errors.push({
      field: 'id',
      message: 'Product ID is missing',
      severity: 'critical',
    });
  }

  if (!product.title || product.title.trim() === '') {
    errors.push({
      field: 'title',
      message: 'Product title is missing or empty',
      severity: 'critical',
    });
  }

  // Validate variants array
  if (!product.variants || !Array.isArray(product.variants)) {
    errors.push({
      field: 'variants',
      message: 'Product variants array is missing or invalid',
      severity: 'critical',
    });
  } else if (product.variants.length === 0) {
    errors.push({
      field: 'variants',
      message: 'Product has no variants available',
      severity: 'critical',
    });
  } else {
    // Validate first variant
    const variant = product.variants[0];
    if (!variant.id) {
      errors.push({
        field: 'variants[0].id',
        message: 'Variant ID is missing',
        severity: 'critical',
      });
    }

    // Validate prices array
    if (!variant.prices || !Array.isArray(variant.prices)) {
      errors.push({
        field: 'variants[0].prices',
        message: 'Variant prices array is missing or invalid',
        severity: 'critical',
      });
    } else if (variant.prices.length === 0) {
      errors.push({
        field: 'variants[0].prices',
        message: 'Variant has no prices available',
        severity: 'critical',
      });
    } else {
      // Validate first price
      const price = variant.prices[0];
      if (price.amount === undefined || price.amount === null) {
        errors.push({
          field: 'variants[0].prices[0].amount',
          message: 'Price amount is missing',
          severity: 'critical',
        });
      } else if (typeof price.amount !== 'number' || price.amount < 0) {
        errors.push({
          field: 'variants[0].prices[0].amount',
          message: 'Price amount is invalid or negative',
          severity: 'critical',
        });
      }

      if (!price.currency_code) {
        warnings.push({
          field: 'variants[0].prices[0].currency_code',
          message: 'Currency code is missing - will use default (AUD)',
          severity: 'warning',
        });
      }
    }
  }

  // Warning validations
  if (!product.description) {
    warnings.push({
      field: 'description',
      message: 'Product description is missing',
      severity: 'warning',
    });
  }

  if (!product.thumbnail) {
    warnings.push({
      field: 'thumbnail',
      message: 'Product thumbnail is missing',
      severity: 'warning',
    });
  }

  if (!product.metadata) {
    warnings.push({
      field: 'metadata',
      message: 'Product metadata is missing - tour details may be incomplete',
      severity: 'warning',
    });
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    product: errors.length === 0 ? product : undefined,
  };
}

/**
 * Validate tour data with automatic sanitization
 * Returns sanitized tour data with safe defaults for missing fields
 */
export function validateAndSanitizeTour(tour: any): Tour {
  const validation = validateTourData(tour);

  // If critical errors, throw exception
  if (!validation.isValid) {
    const criticalErrors = validation.errors
      .filter(e => e.severity === 'critical')
      .map(e => `${e.field}: ${e.message}`)
      .join('; ');
    throw new Error(`Tour data validation failed: ${criticalErrors}`);
  }

  // Return sanitized tour with safe defaults
  return {
    id: tour.id,
    title: tour.title,
    description: tour.description || '',
    price: tour.price || 0,
    duration: tour.duration || '1 day',
    image: tour.image || '/images/tour_options.png',
    category: tour.category || 'Tour',
    difficulty: tour.difficulty || 'Moderate',
    maxParticipants: tour.maxParticipants || 20,
  };
}

/**
 * Validate product data with automatic sanitization
 * Returns sanitized product data with safe defaults
 */
export function validateAndSanitizeProduct(product: any): any {
  const validation = validateProductData(product);

  // If critical errors, throw exception
  if (!validation.isValid) {
    const criticalErrors = validation.errors
      .filter(e => e.severity === 'critical')
      .map(e => `${e.field}: ${e.message}`)
      .join('; ');
    throw new Error(`Product data validation failed: ${criticalErrors}`);
  }

  // Return product with safe defaults applied
  return {
    ...product,
    description: product.description || '',
    thumbnail: product.thumbnail || '/images/tour_options.png',
    metadata: product.metadata || {},
  };
}

/**
 * Check if tour is bookable (all required booking data is present)
 */
export function isTourBookable(tour: any): boolean {
  const validation = validateTourData(tour);
  return validation.isValid && tour.price > 0;
}

/**
 * Get validation summary for logging
 */
export function getValidationSummary(
  validation: TourValidationResult | ProductValidationResult
): string {
  const parts: string[] = [];

  if (!validation.isValid) {
    parts.push(`${validation.errors.length} critical error(s)`);
  }

  if (validation.warnings.length > 0) {
    parts.push(`${validation.warnings.length} warning(s)`);
  }

  if (parts.length === 0) {
    return 'All validations passed';
  }

  return parts.join(', ');
}
