'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Script from 'next/script';
import TourGallery from '../../../components/Tours/TourGallery';
import DatePicker from '../../../components/Tours/DatePicker';
import TourAddOns from '../../../components/Tours/TourAddOns';
import { useCart } from '../../../lib/hooks/useCart';
import { getProductPrice, formatPrice } from '../../../lib/utils/pricing';
import { ErrorLogger } from '../../../lib/utils/errorLogger';
import type { Tour } from '@/lib/types/cart';
import styles from './tour-detail.module.css';

interface TourDetailClientProps {
  tourProduct: any;
  handle: string;
  dataSource: 'api' | 'mock' | 'cache';
  error?: string;
}

export default function TourDetailClient({
  tourProduct,
  handle,
  dataSource,
  error,
}: TourDetailClientProps) {
  const router = useRouter();
  const { addTourToCart } = useCart();
  const tour = tourProduct;

  // DEBUG: Log tour structure to understand what we're receiving
  console.log('[TourDetailClient] Received tourProduct:', {
    id: tour?.id,
    title: tour?.title,
    hasVariants: !!tour?.variants,
    variantsLength: tour?.variants?.length,
    firstVariantId: tour?.variants?.[0]?.id,
    fullTourObject: tour,
  });

  // Booking state
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedVariantId, setSelectedVariantId] = useState<string>(
    tour.variants?.[0]?.id || ''
  );
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  // Ref for DatePicker scroll functionality
  const datePickerRef = useRef<HTMLDivElement>(null);

  // Log page load and data source
  useEffect(() => {
    if (error) {
      ErrorLogger.warn('Tour page loaded with fallback data', {
        tourHandle: handle,
        dataSource,
        error,
      });
    } else {
      ErrorLogger.info('Tour page loaded successfully', {
        tourHandle: handle,
        tourId: tour.id,
        tourTitle: tour.title,
        dataSource,
      });
    }
  }, [handle, dataSource, error, tour.id, tour.title]);

  // Calculate total price based on tour duration
  const getTotalPrice = () => {
    if (!tour) return 0;
    const price = getProductPrice(tour);
    if (!price) return 0;
    // Price is already calculated as duration_days × $2000 per day
    return price.amount / 100;
  };

  // Get price per day for display
  const getPricePerDay = () => {
    const durationDays = parseInt(tour.metadata?.duration_days || '1');
    return 2000; // $2000 per day constant
  };

  // Handle booking - Add to cart
  const handleBookNow = async () => {
    try {
      // Validation errors
      if (!selectedDate) {
        ErrorLogger.warn('Booking attempted without date selection', {
          tourHandle: handle,
          tourTitle: tour?.title,
        });

        // Scroll to DatePicker instead of showing alert
        if (datePickerRef.current) {
          datePickerRef.current.scrollIntoView({
            behavior: 'smooth',
            block: 'center'
          });
        }
        return;
      }

      if (!tour) {
        ErrorLogger.warn('Booking attempted without tour data', {
          tourHandle: handle,
        });
        alert('Tour information is not available');
        return;
      }

      // Get price using the correct method
      const productPrice = getProductPrice(tour);
      const priceAmount = productPrice?.amount || 0;

      if (!priceAmount) {
        ErrorLogger.error('Price not available for booking', new Error('Price missing'), {
          tourHandle: handle,
          tourId: tour.id,
        });
        alert('Price information is not available. Please try again.');
        return;
      }

      // CRITICAL: Validate variant ID exists (cannot be empty string)
      if (!selectedVariantId || selectedVariantId === '') {
        ErrorLogger.error('No variant ID available for tour', new Error('Variant missing'), {
          tourHandle: handle,
          tourId: tour.id,
          variants: tour.variants,
          selectedVariantId: selectedVariantId,
        });
        console.error('[Book Now] CRITICAL ERROR: Missing variant ID', {
          tour: tour,
          variants: tour.variants,
          selectedVariantId: selectedVariantId,
        });
        alert('Tour configuration error: Missing product variant. Please refresh the page or contact support.');
        return;
      }

      // Debug logging for troubleshooting
      console.log('[Book Now] Tour booking details:', {
        tourId: tour.id,
        tourHandle: handle,
        variantId: selectedVariantId,
        variants: tour.variants,
        priceAmount: priceAmount,
        participants: 1,
        startDate: selectedDate.toISOString(),
      });

      // Create tour object matching the Tour interface from cart types
      const cartTour: Tour = {
        id: tour.id,
        variant_id: selectedVariantId,        // Required for Medusa line item
        handle: handle,                       // Required for tour identification
        title: tour.title,
        description: tour.description || '',
        base_price_cents: priceAmount,        // Keep in cents, not dollars
        duration_days: parseInt(tour.metadata?.duration_days || '1'),
        thumbnail: tour.thumbnail || '',      // Primary image field
        image_url: tour.thumbnail || '',      // Fallback compatibility
        metadata: {                           // Required for validation
          difficulty: tour.metadata?.difficulty,
          min_participants: tour.metadata?.min_participants ? parseInt(tour.metadata.min_participants) : undefined,
          max_participants: tour.metadata?.max_participants ? parseInt(tour.metadata.max_participants) : undefined,
          category: tour.metadata?.category,
        },
      };

      // Add tour to cart using new CartContext API
      await addTourToCart({
        tour: cartTour,
        participants: 1, // Default participants
        start_date: selectedDate.toISOString(),
      });

      // Store booking info in sessionStorage for compatibility
      const bookingInfo = {
        tourId: tour.id,
        tourHandle: handle,
        tourTitle: tour.title,
        variantId: selectedVariantId,
        quantity: 1,
        selectedDate: selectedDate.toISOString(),
        totalPrice: getTotalPrice(),
      };
      sessionStorage.setItem('currentBooking', JSON.stringify(bookingInfo));

      // Log successful booking
      ErrorLogger.info('Tour added to cart successfully', {
        tourHandle: handle,
        tourId: tour.id,
        tourTitle: tour.title,
        quantity: 1,
        totalPrice: getTotalPrice(),
        selectedDate: selectedDate.toISOString(),
        dataSource,
      });

      // Navigate directly to add-ons flow with tour handle in URL
      // This avoids race condition where cart hasn't synced yet
      router.push(`/checkout/add-ons-flow?tour=${encodeURIComponent(handle)}`);
    } catch (err) {
      ErrorLogger.error('Error during booking process', err instanceof Error ? err : new Error(String(err)), {
        tourHandle: handle,
        tourTitle: tour?.title,
        selectedDate: selectedDate?.toISOString(),
        quantity: 1,
        dataSource,
      });
      alert('An error occurred while adding the tour to your cart. Please try again.');
    }
  };

  // Generate structured data
  const generateStructuredData = () => {
    const productPrice = getProductPrice(tour);

    return {
      '@context': 'https://schema.org',
      '@type': 'Product',
      '@id': `https://sunshinecoast4wdtours.com.au/tours/${handle}`,
      name: tour.title,
      description: tour.description,
      image: generateGalleryImages().map((img: { url: string }) => img.url),
      brand: {
        '@type': 'Brand',
        name: 'Sunshine Coast 4WD Tours',
      },
      offers: {
        '@type': 'Offer',
        url: `https://sunshinecoast4wdtours.com.au/tours/${handle}`,
        priceCurrency: productPrice?.currency_code || 'AUD',
        price: productPrice ? (productPrice.amount / 100).toFixed(2) : '0',
        availability: 'https://schema.org/InStock',
        priceValidUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split('T')[0],
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

  // Generate gallery images from Medusa product images
  const generateGalleryImages = () => {
    // Default fallback images if no Medusa images are available
    const fallbackImages = [
      {
        id: '1',
        url: tour.thumbnail || '/images/tours/kgari-aerial.jpg',
        alt: `${tour.title} - Tour image 1`,
      },
      {
        id: '2',
        url: '/images/tours/4wd-on-beach.jpg',
        alt: `${tour.title} - 4WD vehicle driving on pristine beach adventure`,
      },
      {
        id: '3',
        url: '/images/tours/rainbow-beach.jpg',
        alt: `${tour.title} - Rainbow Beach colored cliffs with golden sand and ocean views`,
      },
      {
        id: '4',
        url: '/images/tours/kgari-wreck.jpg',
        alt: `${tour.title} - Historic Maheno Shipwreck on 75 Mile Beach`,
      },
      {
        id: '5',
        url: '/images/tours/double-island-point.jpg',
        alt: `${tour.title} - Double Island Point coastal scenery and 4WD track`,
      },
    ];

    // Use Medusa product images if available, otherwise use fallback
    if (tour.images && tour.images.length > 0) {
      return tour.images.map((img: any, index: number) => ({
        id: img.id || `image-${index}`,
        url: img.url,
        alt: img.alt || `${tour.title} - Image ${index + 1}`,
      }));
    }

    // If thumbnail exists but no images array, create single-image gallery
    if (tour.thumbnail) {
      return [
        {
          id: '1',
          url: tour.thumbnail,
          alt: tour.title,
        },
        ...fallbackImages.slice(1), // Add fallback images for additional gallery items
      ];
    }

    // Use fallback images as last resort
    return fallbackImages;
  };

  // Generate itinerary based on tour duration
  const generateItinerary = () => {
    const duration = parseInt(tour.metadata?.duration_days || '1');

    if (duration === 1) {
      return [
        {
          time: '7:00 AM',
          title: 'Pickup from Meeting Point',
          description: 'We\'ll collect you from your accommodation or designated meeting point on the Sunshine Coast.',
        },
        {
          time: '8:30 AM',
          title: 'Rainbow Beach Arrival',
          description: 'Arrive at Rainbow Beach and receive a comprehensive safety briefing about the 4WD experience.',
        },
        {
          time: '10:00 AM',
          title: '4WD Adventure Begins',
          description: 'Hit the colored sands and experience the thrill of 4WD driving on one of Australia\'s most iconic beaches.',
        },
        {
          time: '12:30 PM',
          title: 'Lunch Break',
          description: 'Enjoy a picnic lunch with stunning ocean views (lunch included in tour price).',
        },
        {
          time: '2:00 PM',
          title: 'Explore Hidden Gems',
          description: 'Visit secluded spots, freshwater creeks, and learn about the local ecosystem from our expert guides.',
        },
        {
          time: '4:00 PM',
          title: 'Return Journey',
          description: 'Head back to Rainbow Beach with memories and photos to last a lifetime.',
        },
        {
          time: '5:30 PM',
          title: 'Drop-off',
          description: 'Return to your accommodation or meeting point.',
        },
      ];
    } else if (duration === 2) {
      return [
        {
          time: 'Day 1 - 7:00 AM',
          title: 'Fraser Island Departure',
          description: 'Begin your 2-day adventure with pickup and ferry crossing to Fraser Island.',
        },
        {
          time: 'Day 1 - 10:00 AM',
          title: 'Lake McKenzie',
          description: 'Swim in the crystal-clear waters of one of the world\'s most beautiful lakes.',
        },
        {
          time: 'Day 1 - 2:00 PM',
          title: 'Maheno Shipwreck & Beach Drive',
          description: 'Explore the historic shipwreck and drive along 75 Mile Beach.',
        },
        {
          time: 'Day 1 - 6:00 PM',
          title: 'Eco-Lodge Check-in',
          description: 'Settle into your comfortable eco-lodge accommodation and enjoy dinner.',
        },
        {
          time: 'Day 2 - 7:00 AM',
          title: 'Champagne Pools',
          description: 'Start with a refreshing swim in the natural rock pools.',
        },
        {
          time: 'Day 2 - 11:00 AM',
          title: 'Rainforest Walk',
          description: 'Experience ancient rainforests and pristine creeks.',
        },
        {
          time: 'Day 2 - 4:00 PM',
          title: 'Return Journey',
          description: 'Ferry back to mainland and return to Sunshine Coast.',
        },
      ];
    } else {
      return [
        {
          time: 'Day 1',
          title: 'Fraser Island Exploration',
          description: `Begin your ${duration}-day adventure with comprehensive tours of Fraser Island's top attractions.`,
        },
        {
          time: `Days 2-${duration - 1}`,
          title: 'Extended Island Experience',
          description: 'Deep dive into hidden gems, remote beaches, and exclusive 4WD tracks with expert guides.',
        },
        {
          time: `Day ${duration}`,
          title: 'Rainbow Beach & Return',
          description: 'Explore Rainbow Beach colored cliffs before returning to Sunshine Coast.',
        },
      ];
    }
  };

  const productPrice = getProductPrice(tour);
  const unitPrice = productPrice ? productPrice.amount / 100 : 0;
  const pricePerDay = getPricePerDay();
  const durationDays = parseInt(tour.metadata?.duration_days || '1');
  const currencyCode = productPrice?.currency_code || 'AUD';
  const dataSourceIndicator = dataSource === 'mock' ? ' (Mock Data)' : '';
  const galleryImages = generateGalleryImages();
  const itinerary = generateItinerary();

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
        {/* Hero Image Section */}
        <div className={styles.heroSection}>
          <div className={styles.heroImageWrapper}>
            <Image
              src={galleryImages[selectedImageIndex].url}
              alt={galleryImages[selectedImageIndex].alt}
              fill
              priority
              className={styles.heroImage}
              style={{ objectFit: 'cover' }}
            />
            <div className={styles.heroOverlay}>
              <div className={styles.heroContent}>
                <h1 className={styles.heroTitle}>{tour.title}</h1>
                {tour.metadata?.category && (
                  <span className={styles.heroCategory}>{tour.metadata.category}</span>
                )}
                {tour.metadata?.difficulty && (
                  <span className={styles.heroDifficulty}>
                    Difficulty: {tour.metadata.difficulty}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Data Source Warning */}
        {error && (
          <div
            style={{
              padding: '16px 20px',
              margin: '20px 0',
              backgroundColor: '#fff3cd',
              border: '1px solid #ffc107',
              borderRadius: '8px',
              color: '#856404',
              fontSize: '14px',
            }}
          >
            ⚠️ Note: Using offline data. {error}
          </div>
        )}

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

        {/* Image Gallery Thumbnails */}
        <div className={styles.galleryThumbnails}>
          {galleryImages.map((image: any, index: number) => (
            <button
              key={image.id}
              className={`${styles.thumbnail} ${index === selectedImageIndex ? styles.thumbnailActive : ''}`}
              onClick={() => setSelectedImageIndex(index)}
              aria-label={`View ${image.alt}`}
            >
              <Image
                src={image.url}
                alt={image.alt}
                width={120}
                height={80}
                className={styles.thumbnailImage}
                style={{ objectFit: 'cover' }}
                loading={index > 2 ? 'lazy' : 'eager'}
                quality={75}
              />
            </button>
          ))}
        </div>

        {/* Main Content Grid */}
        <div className={styles.grid}>
          {/* Left Column - Tour Information */}
          <div className={styles.mainContent}>
            {/* Tour Description */}
            <section className={styles.section} aria-labelledby="tour-description-heading">
              <h2 id="tour-description-heading" className={styles.sectionTitle}>Tour Overview</h2>
              <div className={styles.description}>
                {tour.description || (
                  <p>
                    Embark on an unforgettable 4WD adventure through the stunning
                    landscapes of the Sunshine Coast. This tour offers the perfect blend
                    of excitement and natural beauty, taking you to some of Queensland's
                    most spectacular off-road destinations. Our experienced guides will
                    ensure you have a safe and memorable experience exploring Fraser
                    Island and Rainbow Beach in comfort and style.
                  </p>
                )}
              </div>
            </section>

            {/* About This Tour - New metadata field */}
            {tour.metadata?.about_tour && (
              <section className={styles.section} aria-labelledby="about-tour-heading">
                <h2 id="about-tour-heading" className={styles.sectionTitle}>About This Tour</h2>
                <div className={styles.contentBlock}>
                  {typeof tour.metadata.about_tour === 'string' ? (
                    <p>{tour.metadata.about_tour}</p>
                  ) : Array.isArray(tour.metadata.about_tour) ? (
                    <ul className={styles.contentList}>
                      {tour.metadata.about_tour.map((item: string, index: number) => (
                        <li key={index}>{item}</li>
                      ))}
                    </ul>
                  ) : (
                    <p>{String(tour.metadata.about_tour)}</p>
                  )}
                </div>
              </section>
            )}

            {/* Tour Itinerary - Can use metadata.tour_itinerary or fallback to generated */}
            <section className={styles.section} aria-labelledby="itinerary-heading">
              <h2 id="itinerary-heading" className={styles.sectionTitle}>Tour Itinerary</h2>
              <div className={styles.itinerary}>
                {(tour.metadata?.tour_itinerary || itinerary).map((item: any, index: number) => (
                  <div key={index} className={styles.itineraryItem}>
                    <div className={styles.itineraryTime}>
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                        <circle cx="12" cy="12" r="10" />
                        <polyline points="12 6 12 12 16 14" />
                      </svg>
                      <span>{item.time}</span>
                    </div>
                    <div className={styles.itineraryContent}>
                      <h3 className={styles.itineraryTitle}>{item.title}</h3>
                      <p className={styles.itineraryDescription}>{item.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* What to Expect - New metadata field */}
            {tour.metadata?.what_to_expect && (
              <section className={styles.section} aria-labelledby="what-to-expect-heading">
                <h2 id="what-to-expect-heading" className={styles.sectionTitle}>What to Expect</h2>
                <div className={styles.contentBlock}>
                  {typeof tour.metadata.what_to_expect === 'string' ? (
                    <div className={styles.expectationText}>
                      <p>{tour.metadata.what_to_expect}</p>
                    </div>
                  ) : Array.isArray(tour.metadata.what_to_expect) ? (
                    <ul className={styles.expectationList}>
                      {tour.metadata.what_to_expect.map((item: string, index: number) => (
                        <li key={index}>
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1a5f3f" strokeWidth="2" aria-hidden="true">
                            <path d="M9 11l3 3L22 4" />
                            <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" />
                          </svg>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p>{String(tour.metadata.what_to_expect)}</p>
                  )}
                </div>
              </section>
            )}

            {/* Add-Ons Section - Optional extras to enhance the tour */}
            <TourAddOns />

            {/* Inclusions & Exclusions */}
            {(tour.metadata?.inclusions || tour.metadata?.exclusions) && (
              <section className={styles.section} aria-labelledby="inclusions-heading">
                <h2 id="inclusions-heading" className={styles.sectionTitle}>What's Included</h2>
                <div className={styles.inclusionsGrid}>
                  {tour.metadata?.inclusions && tour.metadata.inclusions.length > 0 && (
                    <div className={styles.inclusionsList}>
                      <h3 className={styles.inclusionsTitle}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#1a5f3f" strokeWidth="2" aria-hidden="true">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                        Included in Price
                      </h3>
                      <ul>
                        {tour.metadata.inclusions.map((item: string, index: number) => (
                          <li key={index}>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1a5f3f" strokeWidth="2" aria-hidden="true">
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
                      <h3 className={styles.inclusionsTitle}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2" aria-hidden="true">
                          <line x1="18" y1="6" x2="6" y2="18" />
                          <line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                        Not Included
                      </h3>
                      <ul>
                        {tour.metadata.exclusions.map((item: string, index: number) => (
                          <li key={index}>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2" aria-hidden="true">
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
              </section>
            )}
          </div>

          {/* Right Column - Booking Card (Sticky) */}
          <div className={styles.bookingColumn}>
            <div className={styles.bookingCard}>
              {/* Price Display */}
              <div className={styles.priceSection}>
                <div className={styles.priceLabel}>Total Price</div>
                <div className={styles.priceAmount}>
                  {formatPrice(productPrice?.amount || 0, true, currencyCode)}
                </div>
                <div className={styles.priceUnit}>
                  ${pricePerDay.toLocaleString()} per day × {durationDays} {durationDays === 1 ? 'day' : 'days'}
                </div>
              </div>

              {/* Quick Info */}
              <div className={styles.quickInfo}>
                {tour.metadata?.duration && (
                  <div className={styles.infoItem}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10" />
                      <polyline points="12 6 12 12 16 14" />
                    </svg>
                    <span>{tour.metadata.duration}</span>
                  </div>
                )}
                {tour.metadata?.max_participants && (
                  <div className={styles.infoItem}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                      <circle cx="9" cy="7" r="4" />
                      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                    </svg>
                    <span>Up to {tour.metadata.max_participants} guests</span>
                  </div>
                )}
                {tour.metadata?.departure_times && tour.metadata.departure_times.length > 0 && (
                  <div className={styles.infoItem}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10" />
                      <polyline points="12 6 12 12 16 14" />
                    </svg>
                    <span>Departs {tour.metadata.departure_times[0]}</span>
                  </div>
                )}
              </div>

              {/* Booking Form */}
              <div className={styles.bookingForm}>
                <h3 className={styles.bookingTitle}>Book Your Adventure</h3>

                {/* Date Picker */}
                <div className={styles.formGroup} ref={datePickerRef}>
                  <label className={styles.formLabel}>Select Date</label>
                  <DatePicker
                    selectedDate={selectedDate}
                    onDateChange={setSelectedDate}
                    minDate={new Date()}
                    unavailableDates={[]}
                  />
                </div>

                {/* Pricing Information */}
                <div className={styles.pricingInfo}>
                  <div className={styles.pricingRow}>
                    <span>Duration:</span>
                    <strong>{durationDays} {durationDays === 1 ? 'day' : 'days'}</strong>
                  </div>
                  <div className={styles.pricingRow}>
                    <span>Rate per day:</span>
                    <strong>${pricePerDay.toLocaleString()}</strong>
                  </div>
                  <div className={styles.pricingDivider}></div>
                  <div className={styles.pricingRow}>
                    <span className={styles.totalLabel}>Total:</span>
                    <strong className={styles.totalAmount}>
                      {formatPrice(getTotalPrice() * 100, true, currencyCode)}
                    </strong>
                  </div>
                </div>

                {/* Book Now Button */}
                <button
                  className={styles.bookButton}
                  onClick={handleBookNow}
                >
                  {selectedDate ? 'Book Now' : 'Select a Date First'}
                </button>

                {/* Trust Badges */}
                <div className={styles.trustBadges}>
                  <div className={styles.trustBadge}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                    </svg>
                    <span>Secure Booking</span>
                  </div>
                  <div className={styles.trustBadge}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    <span>Best Price Guarantee</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
