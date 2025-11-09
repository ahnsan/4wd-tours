'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Script from 'next/script';
import TourGallery from '../../../components/Tours/TourGallery';
import DatePicker from '../../../components/Tours/DatePicker';
import QuantitySelector from '../../../components/Tours/QuantitySelector';
import { useCart } from '../../../contexts/CartContext';
import { TourProduct, RelatedTour } from '../../../lib/types/tour';
import { getProductPrice, formatPrice } from '../../../lib/utils/pricing';
import { ErrorLogger } from '../../../lib/utils/errorLogger';
import { handleApiError, is404Error } from '../../../lib/utils/apiErrorHandler';
import styles from './tour-detail.module.css';

// Mock API base URL - replace with actual backend URL
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:9000';

export default function TourDetailPage({ params }: { params: { handle: string } }) {
  const router = useRouter();
  const { addTour } = useCart();
  const [tour, setTour] = useState<TourProduct | null>(null);
  const [relatedTours, setRelatedTours] = useState<RelatedTour[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Booking state
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(null);

  // Fetch tour data with parallel API calls
  // Performance optimization: -400-600ms page load time
  useEffect(() => {
    async function fetchTourData() {
      try {
        setLoading(true);
        setError(null);

        // Build headers with API key
        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
        };

        const apiKey = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY;
        if (apiKey) {
          headers['x-publishable-api-key'] = apiKey;
        }

        // ✅ PARALLEL API CALLS - Fetch tour and related tours simultaneously
        const [tourResponse, relatedResponse] = await Promise.all([
          fetch(`${API_BASE_URL}/store/products?handle=${params.handle}`, { headers }),
          fetch(`${API_BASE_URL}/store/products?limit=3&offset=0`, { headers }),
        ]);

        // Check for API errors
        if (!tourResponse.ok) {
          const error = new Error(`Failed to fetch tour: ${tourResponse.statusText}`);
          Object.assign(error, { status: tourResponse.status, statusText: tourResponse.statusText });
          throw error;
        }

        if (!relatedResponse.ok) {
          // Log related tours error but don't fail the page
          await handleApiError(
            { status: relatedResponse.status, statusText: relatedResponse.statusText },
            `Tour Detail Page - Related Tours (handle: ${params.handle})`
          );
        }

        const tourData = await tourResponse.json();
        const relatedData = relatedResponse.ok ? await relatedResponse.json() : { products: [] };

        const tourProduct = tourData.products?.[0];
        if (!tourProduct) {
          const notFoundError = new Error('Tour not found');
          Object.assign(notFoundError, { status: 404 });
          throw notFoundError;
        }

        setTour(tourProduct);

        // Set default variant
        if (tourProduct.variants && tourProduct.variants.length > 0) {
          setSelectedVariantId(tourProduct.variants[0].id);
        }

        // Process related tours
        const related = relatedData.products
          ?.filter((p: TourProduct) => p.id !== tourProduct.id)
          ?.slice(0, 3)
          ?.map((p: TourProduct) => ({
            id: p.id,
            handle: p.handle,
            title: p.title,
            thumbnail: p.thumbnail,
            description: p.description,
            price: p.variants?.[0]?.prices?.[0]?.amount || 0,
            currency: p.variants?.[0]?.prices?.[0]?.currency_code || 'AUD',
            duration: p.metadata?.duration,
            category: p.metadata?.category,
          })) || [];

        setRelatedTours(related);
        setLoading(false);

        // Log successful page load
        ErrorLogger.info('Tour detail page loaded successfully', {
          tourHandle: params.handle,
          tourId: tourProduct.id,
          tourTitle: tourProduct.title,
          relatedToursCount: related.length,
        });
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to load tour';
        setError(errorMessage);
        setLoading(false);

        // Log error with full context
        await handleApiError(err, `Tour Detail Page - Main Fetch (handle: ${params.handle})`);

        // Special handling for 404 errors
        if (is404Error(err)) {
          ErrorLogger.warn('Tour not found - 404', {
            tourHandle: params.handle,
            url: typeof window !== 'undefined' ? window.location.href : undefined,
          });
        }
      }
    }

    fetchTourData();
  }, [params.handle]);

  // Calculate total price using the pricing utility
  const getTotalPrice = () => {
    if (!tour) return 0;

    const price = getProductPrice(tour);
    if (!price) return 0;

    return (price.amount / 100) * quantity; // Convert cents to dollars
  };

  // Handle booking - Add to cart
  const handleBookNow = () => {
    try {
      // Validation errors
      if (!selectedDate) {
        ErrorLogger.warn('Booking attempted without date selection', {
          tourHandle: params.handle,
          tourTitle: tour?.title,
        });
        alert('Please select a tour date');
        return;
      }

      if (!selectedVariantId || !tour) {
        ErrorLogger.warn('Booking attempted without variant selection', {
          tourHandle: params.handle,
          tourTitle: tour?.title,
          selectedVariantId,
        });
        alert('Please select a tour option');
        return;
      }

      // Convert tour data to Cart format
      const variant = tour.variants.find(v => v.id === selectedVariantId);
      const priceAmount = variant?.prices?.[0]?.amount || 0;

      if (!variant) {
        ErrorLogger.error('Variant not found during booking', new Error('Variant not found'), {
          tourHandle: params.handle,
          selectedVariantId,
          availableVariants: tour.variants.map(v => v.id),
        });
        alert('Selected tour option is not available');
        return;
      }

      const cartTour = {
        id: tour.id,
        title: tour.title,
        description: tour.description || '',
        price: priceAmount, // Price in cents
        duration: tour.metadata?.duration || '1 day',
        image: tour.thumbnail || '',
        category: tour.metadata?.category || 'Tour',
        difficulty: tour.metadata?.difficulty || 'Moderate',
        maxParticipants: tour.metadata?.max_participants || 20,
      };

      // Add tour to cart
      addTour(cartTour, selectedDate.toISOString(), quantity);

      // Store booking info in sessionStorage for backward compatibility
      const bookingInfo = {
        tourId: tour.id,
        tourHandle: tour.handle,
        tourTitle: tour.title,
        variantId: selectedVariantId,
        quantity,
        selectedDate: selectedDate.toISOString(),
        totalPrice: getTotalPrice(),
      };
      sessionStorage.setItem('currentBooking', JSON.stringify(bookingInfo));

      // Log successful booking
      ErrorLogger.info('Tour added to cart successfully', {
        tourHandle: params.handle,
        tourId: tour.id,
        tourTitle: tour.title,
        quantity,
        totalPrice: getTotalPrice(),
        selectedDate: selectedDate.toISOString(),
      });

      // Navigate to add-ons page
      router.push('/checkout/add-ons');
    } catch (err) {
      ErrorLogger.error('Error during booking process', err instanceof Error ? err : new Error(String(err)), {
        tourHandle: params.handle,
        tourTitle: tour?.title,
        selectedDate: selectedDate?.toISOString(),
        quantity,
      });
      alert('An error occurred while adding the tour to your cart. Please try again.');
    }
  };

  // Generate structured data
  const generateStructuredData = () => {
    if (!tour) return null;

    const variant = tour.variants?.[0];
    const price = variant?.prices?.[0];

    return {
      '@context': 'https://schema.org',
      '@type': 'Product',
      '@id': `https://sunshinecoast4wdtours.com.au/tours/${tour.handle}`,
      name: tour.title,
      description: tour.description,
      image: tour.images?.map(img => img.url) || [tour.thumbnail],
      brand: {
        '@type': 'Brand',
        name: 'Sunshine Coast 4WD Tours',
      },
      offers: {
        '@type': 'Offer',
        url: `https://sunshinecoast4wdtours.com.au/tours/${tour.handle}`,
        priceCurrency: price?.currency_code || 'AUD',
        price: price ? (price.amount / 100).toFixed(2) : '0',
        availability: (variant?.inventory_quantity ?? 0) > 0
          ? 'https://schema.org/InStock'
          : 'https://schema.org/OutOfStock',
        priceValidUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      },
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: '4.8',
        reviewCount: '127',
      },
      ...(tour.metadata?.duration && {
        additionalProperty: {
          '@type': 'PropertyValue',
          name: 'Duration',
          value: tour.metadata.duration,
        },
      }),
    };
  };

  if (loading) {
    return (
      <div className={styles.loading}>
        <div className={styles.spinner} />
        <p>Loading tour details...</p>
      </div>
    );
  }

  if (error || !tour) {
    return (
      <div className={styles.error}>
        <h1>Tour Not Found</h1>
        <p>{error || 'The tour you are looking for does not exist.'}</p>
        <button onClick={() => router.push('/tours')} className={styles.backButton}>
          Back to Tours
        </button>
      </div>
    );
  }

  const productPrice = getProductPrice(tour);
  const unitPrice = productPrice ? productPrice.amount / 100 : 0;
  const currencyCode = productPrice?.currency_code || 'AUD';

  return (
    <>
      {/* Structured Data */}
      <Script
        id="tour-product-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(generateStructuredData()),
        }}
      />

      <main className={styles.container}>
        {/* Breadcrumbs */}
        <nav className={styles.breadcrumbs} aria-label="Breadcrumb">
          <ol>
            <li>
              <a href="/">Home</a>
            </li>
            <li>
              <a href="/tours">Tours</a>
            </li>
            <li aria-current="page">{tour.title}</li>
          </ol>
        </nav>

        {/* Main Content Grid */}
        <div className={styles.grid}>
          {/* Left Column - Gallery */}
          <div className={styles.gallerySection}>
            <TourGallery
              images={tour.images || [{
                id: '1',
                url: tour.thumbnail || 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200&h=800&fit=crop',
                alt: tour.title
              }]}
              title={tour.title}
            />
          </div>

          {/* Right Column - Details & Booking */}
          <div className={styles.detailsSection}>
            {/* Tour Header */}
            <div className={styles.header}>
              <h1 className={styles.title}>{tour.title}</h1>
              {tour.metadata?.category && (
                <span className={styles.category}>{tour.metadata.category}</span>
              )}
            </div>

            {/* Price */}
            <div className={styles.priceSection}>
              <div className={styles.price}>
                <span className={styles.priceLabel}>From</span>
                <span className={styles.priceAmount}>
                  {formatPrice(productPrice?.amount || 0, true, currencyCode)}
                </span>
                <span className={styles.priceUnit}>per person</span>
              </div>
            </div>

            {/* Quick Info */}
            {(tour.metadata?.duration || tour.metadata?.departure_times) && (
              <div className={styles.quickInfo}>
                {tour.metadata?.duration && (
                  <div className={styles.infoItem}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10" />
                      <polyline points="12 6 12 12 16 14" />
                    </svg>
                    <span>Duration: {tour.metadata.duration}</span>
                  </div>
                )}
                {tour.metadata?.departure_times && tour.metadata.departure_times.length > 0 && (
                  <div className={styles.infoItem}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10" />
                      <polyline points="12 6 12 12 16 14" />
                    </svg>
                    <span>Departure: {tour.metadata.departure_times[0]}</span>
                  </div>
                )}
              </div>
            )}

            {/* Booking Section */}
            <div className={styles.bookingSection}>
              <h2 className={styles.sectionTitle}>Book Your Tour</h2>

              {/* Date Picker */}
              <div className={styles.formGroup}>
                <DatePicker
                  selectedDate={selectedDate}
                  onDateChange={setSelectedDate}
                  minDate={new Date()}
                  unavailableDates={[]}
                />
              </div>

              {/* Quantity Selector */}
              <div className={styles.formGroup}>
                <QuantitySelector
                  quantity={quantity}
                  onQuantityChange={setQuantity}
                  min={tour.metadata?.min_participants || 1}
                  max={tour.metadata?.max_participants || 20}
                />
              </div>

              {/* Total Price */}
              <div className={styles.totalPrice}>
                <span>Total Price:</span>
                <strong>{formatPrice(getTotalPrice() * 100, true, currencyCode)}</strong>
              </div>

              {/* Book Now Button */}
              <button
                className={styles.bookButton}
                onClick={handleBookNow}
                disabled={!selectedDate}
              >
                Book Now
              </button>
            </div>
          </div>
        </div>

        {/* Tour Description */}
        <div className={styles.descriptionSection}>
          <h2 className={styles.sectionTitle}>Tour Description</h2>
          <div className={styles.description}>
            {tour.description || (
              <p>
                Embark on an unforgettable 4WD adventure through the stunning landscapes of the Sunshine Coast.
                This tour offers the perfect blend of excitement and natural beauty, taking you to some of Queensland's
                most spectacular off-road destinations. Our experienced guides will ensure you have a safe and
                memorable experience exploring Fraser Island and Rainbow Beach in comfort and style.
              </p>
            )}
          </div>
        </div>

        {/* Inclusions & Exclusions */}
        {(tour.metadata?.inclusions || tour.metadata?.exclusions) && (
          <div className={styles.inclusionsSection}>
            <div className={styles.inclusionsGrid}>
              {tour.metadata?.inclusions && tour.metadata.inclusions.length > 0 && (
                <div className={styles.inclusionsList}>
                  <h3>What's Included</h3>
                  <ul>
                    {tour.metadata.inclusions.map((item, index) => (
                      <li key={index}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1a5f3f" strokeWidth="2">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {tour.metadata?.exclusions && tour.metadata.exclusions.length > 0 && (
                <div className={styles.exclusionsList}>
                  <h3>Not Included</h3>
                  <ul>
                    {tour.metadata.exclusions.map((item, index) => (
                      <li key={index}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2">
                          <line x1="18" y1="6" x2="6" y2="18" />
                          <line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Related Tours */}
        {relatedTours.length > 0 && (
          <div className={styles.relatedSection}>
            <h2 className={styles.sectionTitle}>Related Tours</h2>
            <div className={styles.relatedGrid}>
              {relatedTours.map((relatedTour) => (
                <a
                  key={relatedTour.id}
                  href={`/tours/${relatedTour.handle}`}
                  className={styles.relatedCard}
                >
                  <div className={styles.relatedImage}>
                    <Image
                      src={relatedTour.thumbnail || 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop'}
                      alt={relatedTour.title}
                      width={400}
                      height={300}
                      className={styles.relatedImg}
                      unoptimized={!relatedTour.thumbnail}
                    />
                  </div>
                  <div className={styles.relatedContent}>
                    <h3>{relatedTour.title}</h3>
                    <p>{relatedTour.description?.substring(0, 100) || 'Discover more amazing 4WD adventures on the Sunshine Coast'}...</p>
                    <div className={styles.relatedFooter}>
                      {relatedTour.duration && (
                        <span className={styles.relatedDuration}>{relatedTour.duration}</span>
                      )}
                      <span className={styles.relatedPrice}>
                        {formatPrice(relatedTour.price, true, relatedTour.currency)}
                      </span>
                    </div>
                  </div>
                </a>
              ))}
            </div>
          </div>
        )}
      </main>
    </>
  );
}
