/**
 * Tour Detail Page - Server Component with Hybrid Data
 *
 * Features:
 * - Server-side rendering for better SEO and performance
 * - Hybrid data fetching (API with fallback to mock data)
 * - Proper error handling and 404 states
 * - Loading states handled by Next.js
 * - Structured data for SEO
 * - DATA VALIDATION: Prevents 500 errors from malformed data
 */

import React from 'react';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import TourDetailClient from './tour-detail-client';
import { fetchTourByHandle } from '../../../lib/data/tours-service';
import { validateProductData, getValidationSummary } from '../../../lib/utils/tourValidation';
import { ErrorLogger } from '../../../lib/utils/errorLogger';

// Generate metadata for SEO
export async function generateMetadata({
  params,
}: {
  params: Promise<{ handle: string }>;
}): Promise<Metadata> {
  try {
    const { handle } = await params;
    const tourResponse = await fetchTourByHandle(handle);
    const tour = tourResponse.tour;

    if (!tour) {
      return {
        title: 'Tour Not Found | Sunshine Coast 4WD Tours',
        description: 'The tour you are looking for could not be found.',
      };
    }

    // Extract metadata for SEO
    const duration_days = tour.metadata?.duration_days || tour.duration_days || 1;
    const duration = duration_days === 1 ? '1 Day' : `${duration_days} Days`;
    const price_cents = tour.variants?.[0]?.calculated_price?.calculated_amount || tour.base_price_cents || 0;
    const price_dollars = (price_cents / 100).toFixed(0);
    const category = tour.metadata?.category || tour.category || 'Tour';
    const difficulty = tour.metadata?.difficulty || tour.difficulty || 'Moderate';
    const imageUrl = tour.thumbnail || tour.image || tour.image_url || 'https://sunshine-coast-4wd-tours.com/images/tours-og.jpg';

    return {
      title: `${tour.title} | Sunshine Coast 4WD Tours`,
      description: tour.description || `Book ${tour.title} with Sunshine Coast 4WD Tours. ${duration} adventure starting from $${price_dollars}.`,
      keywords: `${tour.title}, Fraser Island tours, 4WD tours, ${category}, ${difficulty} tours`,
      openGraph: {
        title: tour.title,
        description: tour.description || '',
        type: 'website',
        images: [
          {
            url: imageUrl,
            width: 1200,
            height: 630,
            alt: tour.title,
          },
        ],
      },
      twitter: {
        card: 'summary_large_image',
        title: tour.title,
        description: tour.description || '',
        images: [imageUrl],
      },
    };
  } catch (error) {
    console.error('[Tour Page] Error generating metadata:', error);
    return {
      title: 'Tour | Sunshine Coast 4WD Tours',
      description: 'Explore our amazing 4WD tours on the Sunshine Coast.',
    };
  }
}

/**
 * Tour Detail Page - Server Component
 */
export default async function TourDetailPage({
  params,
}: {
  params: Promise<{ handle: string }>;
}) {
  try {
    // Await params (required in Next.js 14+)
    const { handle } = await params;

    // Fetch tour data using hybrid service
    const tourResponse = await fetchTourByHandle(handle);
    const tourProduct = tourResponse.tour; // Now returns Medusa product directly

    // Handle 404
    if (!tourProduct) {
      notFound();
    }

    // No conversion needed - tourProduct is already a Medusa product with correct variant IDs

    // VALIDATION CHECK: Validate product data before rendering
    // This prevents 500 errors from malformed data
    const validation = validateProductData(tourProduct);

    // TEMPORARILY DISABLED: Medusa v2 uses calculated_price, validator needs update
    if (false && !validation.isValid) {
      // Log validation failure with detailed context
      ErrorLogger.error(
        'Tour product validation failed',
        new Error('Invalid tour product data'),
        {
          tourHandle: handle,
          errors: validation.errors,
          warnings: validation.warnings,
          summary: getValidationSummary(validation),
          dataSource: tourResponse.source,
        }
      );

      // Return 404 instead of 500 for invalid data
      // This provides better UX than a server error
      notFound();
    }

    // Log validation issues for debugging (non-blocking)
    if (validation.errors.length > 0 || validation.warnings.length > 0) {
      console.warn('[Tour Page] Validation issues (non-blocking):', {
        errors: validation.errors,
        warnings: validation.warnings
      });
    }

    // Log warnings (non-critical issues)
    if (validation.warnings.length > 0) {
      ErrorLogger.warn(
        'Tour product has validation warnings',
        {
          tourHandle: handle,
          warnings: validation.warnings,
          summary: getValidationSummary(validation),
          dataSource: tourResponse.source,
        }
      );
    }

    // Data source indicator (for debugging)
    // const dataSourceIndicator = tourResponse.source === 'mock' ? ' (Mock Data)' : '';

    return (
      <>
        {/* Pass data to client component for interactivity */}
        <TourDetailClient
          tourProduct={tourProduct}
          handle={handle}
          dataSource={tourResponse.source}
        />
      </>
    );
  } catch (error) {
    console.error('[Tour Page] Fatal error rendering tour page:', error);
    // Re-throw to trigger Next.js error boundary
    throw error;
  }
}
