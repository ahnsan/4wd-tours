'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import styles from './confirmation.module.css';

interface BookingData {
  bookingRef: string;
  formData: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
  };
  cart: {
    tour: {
      tour: {
        title: string;
        price: number;
      };
      date: string;
      participants: number;
      subtotal: number;
    };
    addOns: Array<{
      addOn: {
        name: string;
        price: number;
      };
      quantity: number;
      subtotal: number;
    }>;
    total: number;
  };
  bookingDate: string;
}

export default function ConfirmationPage() {
  const searchParams = useSearchParams();
  const bookingRef = searchParams.get('ref');
  const [bookingData, setBookingData] = useState<BookingData | null>(null);

  useEffect(() => {
    const data = sessionStorage.getItem('bookingData');
    if (data) {
      setBookingData(JSON.parse(data));
    }
  }, []);

  if (!bookingRef || !bookingData) {
    return (
      <main className={styles.noBooking}>
        <h1>Booking Not Found</h1>
        <p>We couldn't find your booking confirmation.</p>
        <Link href="/tours" className={styles.backBtn}>
          Browse Tours
        </Link>
      </main>
    );
  }

  return (
    <main className={styles.confirmationPage}>
      <div className={styles.successIcon}>
        <svg width="80" height="80" viewBox="0 0 80 80" fill="none">
          <circle cx="40" cy="40" r="40" fill="#1a5f3f" />
          <path
            d="M25 40L35 50L55 30"
            stroke="white"
            strokeWidth="4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>

      <h1 className={styles.title}>Booking Confirmed!</h1>
      <p className={styles.subtitle}>
        Thank you for booking with Sunshine Coast 4WD Tours
      </p>

      <div className={styles.bookingRef}>
        <span className={styles.refLabel}>Booking Reference</span>
        <span className={styles.refNumber}>{bookingData.bookingRef}</span>
      </div>

      <div className={styles.content}>
        {/* Confirmation Details */}
        <section className={styles.detailsSection}>
          <div className={styles.infoCard}>
            <h2>Confirmation Email Sent</h2>
            <p>
              We've sent a confirmation email to{' '}
              <strong>{bookingData.formData.email}</strong> with all your booking
              details and important information.
            </p>
          </div>

          {/* Customer Details */}
          <div className={styles.customerDetails}>
            <h3>Your Details</h3>
            <div className={styles.detailRow}>
              <span>Name</span>
              <span>
                {bookingData.formData.firstName} {bookingData.formData.lastName}
              </span>
            </div>
            <div className={styles.detailRow}>
              <span>Email</span>
              <span>{bookingData.formData.email}</span>
            </div>
            <div className={styles.detailRow}>
              <span>Phone</span>
              <span>{bookingData.formData.phone}</span>
            </div>
          </div>

          {/* Tour Details */}
          <div className={styles.tourDetails}>
            <h3>Your Tour</h3>
            <div className={styles.tourCard}>
              <div className={styles.tourHeader}>
                <h4>{bookingData.cart.tour.tour.title}</h4>
                <span className={styles.tourPrice}>
                  AUD ${bookingData.cart.tour.subtotal}
                </span>
              </div>
              <div className={styles.tourMeta}>
                <div className={styles.metaItem}>
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M10 0a10 10 0 100 20 10 10 0 000-20zm0 18a8 8 0 110-16 8 8 0 010 16z"/>
                    <path d="M10 4a.625.625 0 00-.625.625v5c0 .166.066.325.183.442l3.125 3.125a.625.625 0 00.884-.884L10.625 9.366V4.625A.625.625 0 0010 4z"/>
                  </svg>
                  {new Date(bookingData.cart.tour.date).toLocaleDateString('en-AU', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </div>
                <div className={styles.metaItem}>
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M10 10a3.75 3.75 0 100-7.5 3.75 3.75 0 000 7.5zm0 1.875c-3.34 0-10 1.675-10 5v1.875h20v-1.875c0-3.325-6.66-5-10-5z"/>
                  </svg>
                  {bookingData.cart.tour.participants} participant(s)
                </div>
              </div>
            </div>
          </div>

          {/* Add-ons */}
          {bookingData.cart.addOns && bookingData.cart.addOns.length > 0 && (
            <div className={styles.addonsDetails}>
              <h3>Add-ons</h3>
              {bookingData.cart.addOns.map((item, index) => (
                item?.addOn ? (
                  <div key={index} className={styles.addonItem}>
                    <div>
                      <span className={styles.addonName}>{item.addOn.name}</span>
                      <span className={styles.addonQty}>× {item.quantity}</span>
                    </div>
                    <span className={styles.addonPrice}>AUD ${item.subtotal}</span>
                  </div>
                ) : null
              ))}
            </div>
          )}

          {/* Total */}
          <div className={styles.totalSection}>
            <div className={styles.totalRow}>
              <span className={styles.totalLabel}>Total Paid</span>
              <span className={styles.totalAmount}>
                AUD ${bookingData.cart.total}
              </span>
            </div>
          </div>
        </section>

        {/* Next Steps */}
        <aside className={styles.nextSteps}>
          <h2>What Happens Next?</h2>

          <div className={styles.stepsList}>
            <div className={styles.step}>
              <div className={styles.stepNumber}>1</div>
              <div className={styles.stepContent}>
                <h3>Check Your Email</h3>
                <p>
                  You'll receive a confirmation email with your booking details and
                  important pre-tour information.
                </p>
              </div>
            </div>

            <div className={styles.step}>
              <div className={styles.stepNumber}>2</div>
              <div className={styles.stepContent}>
                <h3>Prepare for Your Tour</h3>
                <p>
                  Review the packing list and requirements we've sent you. Make sure
                  you have comfortable outdoor clothing and closed-toe shoes.
                </p>
              </div>
            </div>

            <div className={styles.step}>
              <div className={styles.stepNumber}>3</div>
              <div className={styles.stepContent}>
                <h3>Meet Your Guide</h3>
                <p>
                  Arrive at the meeting point 15 minutes before departure. Your guide
                  will be waiting with your tour details.
                </p>
              </div>
            </div>

            <div className={styles.step}>
              <div className={styles.stepNumber}>4</div>
              <div className={styles.stepContent}>
                <h3>Enjoy Your Adventure</h3>
                <p>
                  Relax and enjoy your Sunshine Coast 4WD adventure! Don't forget your
                  camera to capture amazing memories.
                </p>
              </div>
            </div>
          </div>

          <div className={styles.helpCard}>
            <h3>Need Help?</h3>
            <p>
              If you have any questions or need to make changes to your booking, please
              contact us:
            </p>
            <div className={styles.contactInfo}>
              <div>
                <strong>Email:</strong> bookings@sunshinecoast4wdtours.com.au
              </div>
              <div>
                <strong>Phone:</strong> +61 XXX XXX XXX
              </div>
              <div>
                <strong>Hours:</strong> Mon-Sun, 8:00 AM - 6:00 PM AEST
              </div>
            </div>
          </div>
        </aside>
      </div>

      <div className={styles.actions}>
        <button
          onClick={() => window.print()}
          className={styles.printBtn}
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
            <path d="M16 4V2H4v2H0v10h4v4h12v-4h4V4h-4zm-2 0H6V4h8v2zm0 12H6v-6h8v6zm4-6h-2v-2H4v2H2V6h16v4z"/>
          </svg>
          Print Confirmation
        </button>

        <Link href="/tours" className={styles.browseBtn}>
          Browse More Tours
        </Link>

        <Link href="/" className={styles.homeBtn}>
          Return to Homepage
        </Link>
      </div>

      <div className={styles.socialShare}>
        <p>Share your excitement!</p>
        <div className={styles.socialButtons}>
          <button className={styles.socialBtn} aria-label="Share on Facebook">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
            </svg>
          </button>
          <button className={styles.socialBtn} aria-label="Share on Twitter">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
              <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
            </svg>
          </button>
          <button className={styles.socialBtn} aria-label="Share on Instagram">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
            </svg>
          </button>
        </div>
      </div>
    </main>
  );
}
