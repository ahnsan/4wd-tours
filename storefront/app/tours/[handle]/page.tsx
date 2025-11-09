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
import { fetchTourByHandle, convertTourToProduct } from '../../../lib/data/tours-service';
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

    return {
      title: `${tour.title} | Sunshine Coast 4WD Tours`,
      description: tour.description || `Book ${tour.title} with Sunshine Coast 4WD Tours. ${tour.duration} adventure starting from $${tour.price}.`,
      keywords: `${tour.title}, Fraser Island tours, 4WD tours, ${tour.category}, ${tour.difficulty} tours`,
      openGraph: {
        title: tour.title,
        description: tour.description || '',
        type: 'website',
        images: [
          {
            url: tour.image || 'https://sunshine-coast-4wd-tours.com/images/tours-og.jpg',
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
        images: [tour.image || 'https://sunshine-coast-4wd-tours.com/images/tours-og.jpg'],
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
    const tour = tourResponse.tour;

    // Handle 404
    if (!tour) {
      notFound();
    }

    // Convert tour to product format for compatibility with existing components
    const tourProduct = convertTourToProduct(tour);

    // VALIDATION CHECK: Validate product data before rendering
    // This prevents 500 errors from malformed data
    const validation = validateProductData(tourProduct);

    if (!validation.isValid) {
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
          tourProduct={validation.product || tourProduct}
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
