'use client';

import React, { useState, useEffect, Suspense } from 'react';

// Force dynamic rendering since this page uses useSearchParams
export const dynamicParams = true;
export const revalidate = 0;
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import styles from './confirmation.module.css';
import { formatCurrency, calculatePriceBreakdown } from '../../../lib/utils/pricing';
import { getOrder, type MedusaOrder } from '../../../lib/data/cart-service';

interface BookingDetails {
  bookingId: string;
  bookingDate: string;
  tour: {
    id: string;
    name: string;
    date: string;
    participants: number;
    basePrice: number;
  };
  addOns: Array<{
    id: string;
    name: string;
    price: number;
    quantity?: number;
  }>;
  customer: {
    fullName: string;
    email: string;
    phone: string;
    emergencyContact: string;
    emergencyPhone: string;
    dietaryRequirements: string;
    specialRequests: string;
  };
  payment: {
    method: string;
  };
}

// Separate component for useSearchParams to fix Suspense boundary requirement
function ConfirmationWithParams() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const bookingId = searchParams.get('bookingId');

  const [order, setOrder] = useState<MedusaOrder | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!bookingId) {
      router.push('/');
      return;
    }

    // Fetch real order from Medusa backend
    const fetchOrder = async () => {
      try {
        setIsLoading(true);
        console.log('[Confirmation] Fetching order:', bookingId);
        const orderData = await getOrder(bookingId);
        setOrder(orderData);
        console.log('[Confirmation] Order loaded successfully');
      } catch (error) {
        console.error('[Confirmation] Failed to load order:', error);
        setError('Failed to load order details. Please contact support.');
        // Don't redirect - show error instead
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrder();
  }, [bookingId, router]);

  const formatDate = (dateString: string): string => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-AU', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch {
      return dateString;
    }
  };

  const formatDateTime = (dateString: string): string => {
    try {
      const date = new Date(dateString);
      return date.toLocaleString('en-AU', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateString;
    }
  };

  const handleDownloadPDF = () => {
    setIsDownloading(true);

    // Simulate PDF generation (in production, use a PDF library)
    setTimeout(() => {
      alert('PDF download functionality would be implemented here using a library like jsPDF or react-pdf.');
      setIsDownloading(false);
    }, 1000);
  };

  if (isLoading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner} />
        <p>Loading your order details...</p>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className={styles.errorContainer}>
        <div className={styles.errorIcon}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
        </div>
        <h1 className={styles.errorTitle}>Order Not Found</h1>
        <p className={styles.errorMessage}>
          {error || 'We could not find your order details.'}
        </p>
        <Link href="/" className={styles.homeButton}>
          Return to Home
        </Link>
      </div>
    );
  }

  // Calculate price breakdown from order
  const priceBreakdown = {
    tourBasePrice: order.subtotal - (order.shipping_total || 0),
    addOnsTotal: 0, // Add-ons are included in subtotal
    subtotal: order.subtotal,
    gst: order.tax_total,
    grandTotal: order.total,
  };

  return (
    <div className={styles.confirmationPage}>
      {/* Success Header */}
      <div className={styles.successHeader}>
        <div className={styles.successIcon}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
            <path d="M20 6L9 17l-5-5" />
          </svg>
        </div>
        <h1 className={styles.successTitle}>Booking Confirmed!</h1>
        <p className={styles.successMessage}>
          Thank you for booking with Sunshine Coast 4WD Tours
        </p>
      </div>

      {/* Main Content */}
      <div className={styles.container}>
        <div className={styles.contentGrid}>
          {/* Booking Reference */}
          <div className={styles.referenceSection}>
            <div className={styles.referenceBox}>
              <span className={styles.referenceLabel}>Your Order Number</span>
              <span className={styles.referenceNumber}>#{order.display_id}</span>
            </div>
            <p className={styles.emailConfirmation}>
              A confirmation email has been sent to{' '}
              <strong>{order.email}</strong>
            </p>
            <p className={styles.orderIdNote}>
              Order ID: {order.id}
            </p>
          </div>

          {/* Booking Details Card */}
          <div className={styles.detailsCard}>
            <h2 className={styles.cardTitle}>Booking Details</h2>

            {/* Order Information */}
            <div className={styles.section}>
              <h3 className={styles.sectionTitle}>Order Information</h3>
              <div className={styles.detailsGrid}>
                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>Order Status:</span>
                  <span className={styles.detailValue} style={{ textTransform: 'capitalize' }}>
                    {order.status}
                  </span>
                </div>
                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>Order Date:</span>
                  <span className={styles.detailValue}>
                    {formatDateTime(order.created_at)}
                  </span>
                </div>
                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>Items:</span>
                  <span className={styles.detailValue}>
                    {order.items.length} {order.items.length === 1 ? 'item' : 'items'}
                  </span>
                </div>
              </div>
            </div>

            {/* Items in Order */}
            {order.items.length > 0 && (
              <div className={styles.section}>
                <h3 className={styles.sectionTitle}>Order Items</h3>
                <div className={styles.addOnsList}>
                  {order.items.map((item) => (
                    <div key={item.id} className={styles.addOnItem}>
                      <div>
                        <span className={styles.addOnName}>
                          {item.title || 'Tour Package'}
                        </span>
                        {item.description && (
                          <p className={styles.itemDescription}>{item.description}</p>
                        )}
                      </div>
                      <div>
                        <span className={styles.itemQuantity}>Qty: {item.quantity}</span>
                        <span className={styles.addOnPrice}>
                          {formatCurrency(item.total || 0)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Shipping Address */}
            {order.shipping_address && (
              <div className={styles.section}>
                <h3 className={styles.sectionTitle}>Shipping Address</h3>
                <div className={styles.detailsGrid}>
                  <div className={styles.detailRow}>
                    <span className={styles.detailLabel}>Name:</span>
                    <span className={styles.detailValue}>
                      {order.shipping_address.first_name} {order.shipping_address.last_name}
                    </span>
                  </div>
                  <div className={styles.detailRow}>
                    <span className={styles.detailLabel}>Email:</span>
                    <span className={styles.detailValue}>{order.email}</span>
                  </div>
                  {order.shipping_address.phone && (
                    <div className={styles.detailRow}>
                      <span className={styles.detailLabel}>Phone:</span>
                      <span className={styles.detailValue}>{order.shipping_address.phone}</span>
                    </div>
                  )}
                  <div className={styles.detailRow}>
                    <span className={styles.detailLabel}>Address:</span>
                    <span className={styles.detailValue}>
                      {order.shipping_address.address_1}
                      {order.shipping_address.address_2 && `, ${order.shipping_address.address_2}`}
                      <br />
                      {order.shipping_address.city}, {order.shipping_address.province || ''} {order.shipping_address.postal_code}
                      <br />
                      {order.shipping_address.country_code.toUpperCase()}
                    </span>
                  </div>
                  {order.shipping_address.metadata?.emergency_contact && (
                    <div className={styles.detailRow}>
                      <span className={styles.detailLabel}>Emergency Contact:</span>
                      <span className={styles.detailValue}>
                        {order.shipping_address.metadata.emergency_contact} ({order.shipping_address.metadata.emergency_phone})
                      </span>
                    </div>
                  )}
                  {order.shipping_address.metadata?.dietary_requirements && (
                    <div className={styles.detailRow}>
                      <span className={styles.detailLabel}>Dietary Requirements:</span>
                      <span className={styles.detailValue}>
                        {order.shipping_address.metadata.dietary_requirements}
                      </span>
                    </div>
                  )}
                  {order.shipping_address.metadata?.special_requests && (
                    <div className={styles.detailRow}>
                      <span className={styles.detailLabel}>Special Requests:</span>
                      <span className={styles.detailValue}>
                        {order.shipping_address.metadata.special_requests}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Payment Summary */}
            <div className={styles.section}>
              <h3 className={styles.sectionTitle}>Payment Summary</h3>
              <div className={styles.priceBreakdown}>
                <div className={styles.priceRow}>
                  <span>Subtotal:</span>
                  <span>{formatCurrency(order.subtotal)}</span>
                </div>
                {order.discount_total > 0 && (
                  <div className={styles.priceRow}>
                    <span>Discount:</span>
                    <span>-{formatCurrency(order.discount_total)}</span>
                  </div>
                )}
                {order.shipping_total > 0 && (
                  <div className={styles.priceRow}>
                    <span>Shipping:</span>
                    <span>{formatCurrency(order.shipping_total)}</span>
                  </div>
                )}
                <div className={styles.priceRow}>
                  <span>Tax:</span>
                  <span>{formatCurrency(order.tax_total)}</span>
                </div>
                <div className={`${styles.priceRow} ${styles.totalRow}`}>
                  <span>Total Paid (AUD):</span>
                  <span>{formatCurrency(order.total)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className={styles.actionsSection}>
            <button
              onClick={handleDownloadPDF}
              disabled={isDownloading}
              className={styles.downloadButton}
            >
              {isDownloading ? (
                <>
                  <span className={styles.buttonSpinner} />
                  Generating PDF...
                </>
              ) : (
                <>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="7 10 12 15 17 10" />
                    <line x1="12" y1="15" x2="12" y2="3" />
                  </svg>
                  Download PDF
                </>
              )}
            </button>

            <Link href="/" className={styles.bookAnotherButton}>
              Book Another Tour
            </Link>

            <Link href="/" className={styles.homeLink}>
              Return to Home
            </Link>
          </div>

          {/* Important Information */}
          <div className={styles.infoBox}>
            <h3 className={styles.infoTitle}>Important Information</h3>
            <ul className={styles.infoList}>
              <li>Please arrive 15 minutes before the tour start time</li>
              <li>Bring comfortable clothing and closed-toe shoes</li>
              <li>Don't forget sunscreen, hat, and water bottle</li>
              <li>Check your email for detailed meeting point information</li>
              <li>Contact us at least 24 hours in advance for any changes</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

// Wrapper component that properly handles Suspense for useSearchParams
function ConfirmationContent() {
  return (
    <Suspense fallback={
      <div className={styles.loadingContainer}>
        <div className={styles.spinner} />
        <p>Loading your order details...</p>
      </div>
    }>
      <ConfirmationWithParams />
    </Suspense>
  );
}

export default function ConfirmationPage() {
  return <ConfirmationContent />;
}
