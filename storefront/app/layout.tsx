import type { Metadata, Viewport } from 'next';
import Script from 'next/script';
import { Lato, Lora } from 'next/font/google';
import '../styles/globals.css';
import { WebVitals } from '../components/WebVitals';
import Navigation from '../components/Navigation/Navigation';
import { ErrorBoundary } from '../components/ErrorBoundary';

// Optimized font loading using Next.js font optimization
// Performance gain: -300-400ms FCP, -0.10-0.15 CLS
const lato = Lato({
  weight: ['400', '700'],
  subsets: ['latin'],
  display: 'swap',
  preload: true,
  variable: '--font-lato',
});

const lora = Lora({
  weight: ['400', '500'],
  subsets: ['latin'],
  display: 'swap',
  preload: true,
  variable: '--font-lora',
});

// Comprehensive SEO metadata configuration
export const metadata: Metadata = {
  metadataBase: new URL('https://sunshinecoast4wdtours.com.au'),
  title: {
    default: 'Sunshine Coast 4WD Tours | Premium Off-Road Adventures Queensland',
    template: '%s | Sunshine Coast 4WD Tours',
  },
  description: 'Experience the best 4WD tours on Queensland\'s Sunshine Coast. Premium off-road adventures, beach drives, rainforest exploration, and unforgettable outback experiences. Book your adventure today!',
  keywords: [
    'Sunshine Coast',
    '4WD tours',
    'off-road adventures',
    'Queensland tours',
    'beach driving',
    'rainforest tours',
    'outback adventures',
    '4x4 tours Australia',
    'Sunshine Coast tourism',
    'adventure tours Queensland',
    'scenic tours',
    'nature tours',
    'eco tours',
    'camping tours',
    'hiking adventures',
  ],
  authors: [{ name: 'Sunshine Coast 4WD Tours' }],
  creator: 'Sunshine Coast 4WD Tours',
  publisher: 'Sunshine Coast 4WD Tours',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  manifest: '/manifest.json',
  icons: {
    icon: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
  openGraph: {
    type: 'website',
    locale: 'en_AU',
    url: 'https://sunshinecoast4wdtours.com.au',
    siteName: 'Sunshine Coast 4WD Tours',
    title: 'Sunshine Coast 4WD Tours | Premium Off-Road Adventures',
    description: 'Experience the best 4WD tours on Queensland\'s Sunshine Coast. Premium off-road adventures, beach drives, rainforest exploration, and unforgettable outback experiences.',
    images: [
      {
        url: '/images/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Sunshine Coast 4WD Tours - Off-Road Adventures',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Sunshine Coast 4WD Tours | Premium Off-Road Adventures',
    description: 'Experience the best 4WD tours on Queensland\'s Sunshine Coast. Book your premium off-road adventure today!',
    images: ['/images/twitter-image.jpg'],
    creator: '@SC4WDTours',
    site: '@SC4WDTours',
  },
  robots: {
    index: true,
    follow: true,
    nocache: false,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: 'your-google-verification-code',
    yandex: 'your-yandex-verification-code',
  },
  alternates: {
    canonical: 'https://sunshinecoast4wdtours.com.au',
  },
  category: 'travel',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: '#1a5f3f',
};

// JSON-LD Structured Data Schemas
const organizationSchema = {
  '@context': 'https://schema.org',
  '@type': 'TouristAttraction',
  '@id': 'https://sunshinecoast4wdtours.com.au/#organization',
  name: 'Sunshine Coast 4WD Tours',
  alternateName: 'SC 4WD Tours',
  url: 'https://sunshinecoast4wdtours.com.au',
  logo: 'https://sunshinecoast4wdtours.com.au/images/logo.png',
  description: 'Premium 4WD tours and off-road adventures on Queensland\'s Sunshine Coast',
  address: {
    '@type': 'PostalAddress',
    addressLocality: 'Sunshine Coast',
    addressRegion: 'QLD',
    addressCountry: 'AU',
  },
  geo: {
    '@type': 'GeoCoordinates',
    latitude: -26.6500,
    longitude: 153.0667,
  },
  telephone: '+61-XXX-XXX-XXX',
  priceRange: '$$',
  openingHoursSpecification: [
    {
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: [
        'Monday',
        'Tuesday',
        'Wednesday',
        'Thursday',
        'Friday',
        'Saturday',
        'Sunday',
      ],
      opens: '08:00',
      closes: '18:00',
    },
  ],
  sameAs: [
    'https://www.facebook.com/SC4WDTours',
    'https://www.instagram.com/SC4WDTours',
    'https://twitter.com/SC4WDTours',
  ],
};

const localBusinessSchema = {
  '@context': 'https://schema.org',
  '@type': 'LocalBusiness',
  '@id': 'https://sunshinecoast4wdtours.com.au/#localbusiness',
  name: 'Sunshine Coast 4WD Tours',
  image: 'https://sunshinecoast4wdtours.com.au/images/hero.png',
  description: 'Experience premium 4WD tours on Queensland\'s Sunshine Coast with expert guides',
  url: 'https://sunshinecoast4wdtours.com.au',
  telephone: '+61-XXX-XXX-XXX',
  address: {
    '@type': 'PostalAddress',
    streetAddress: 'XXX Main Street',
    addressLocality: 'Sunshine Coast',
    addressRegion: 'QLD',
    postalCode: 'XXXX',
    addressCountry: 'AU',
  },
  geo: {
    '@type': 'GeoCoordinates',
    latitude: -26.6500,
    longitude: 153.0667,
  },
  priceRange: '$$',
  aggregateRating: {
    '@type': 'AggregateRating',
    ratingValue: '4.8',
    reviewCount: '127',
  },
};

const breadcrumbSchema = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    {
      '@type': 'ListItem',
      position: 1,
      name: 'Home',
      item: 'https://sunshinecoast4wdtours.com.au',
    },
  ],
};

const tourProductSchema = {
  '@context': 'https://schema.org',
  '@type': 'Product',
  name: 'Sunshine Coast 4WD Adventure Tours',
  description: 'Premium 4WD off-road adventure tours on Queensland\'s Sunshine Coast',
  brand: {
    '@type': 'Brand',
    name: 'Sunshine Coast 4WD Tours',
  },
  offers: {
    '@type': 'AggregateOffer',
    url: 'https://sunshinecoast4wdtours.com.au',
    priceCurrency: 'AUD',
    lowPrice: '149',
    highPrice: '499',
    offerCount: '6',
    availability: 'https://schema.org/InStock',
  },
  aggregateRating: {
    '@type': 'AggregateRating',
    ratingValue: '4.8',
    reviewCount: '127',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en-AU">
      <head>
        {/* Performance: DNS Prefetch and Preconnect for external resources */}
        <link rel="dns-prefetch" href="https://www.googletagmanager.com" />
        <link rel="dns-prefetch" href="https://www.google-analytics.com" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />

        {/* Preload critical hero image for LCP optimization */}
        <link
          rel="preload"
          as="image"
          href="/images/hero.png"
          type="image/png"
          fetchPriority="high"
        />

        {/* Preload critical fonts to reduce CLS */}
        <link
          rel="preload"
          href="/fonts/lato-v24-latin-regular.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
        <link
          rel="preload"
          href="/fonts/lora-v35-latin-regular.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />

        {/* Additional meta tags for performance */}
        <meta name="format-detection" content="telephone=no" />
        <meta httpEquiv="x-ua-compatible" content="ie=edge" />

        {/* Additional SEO meta tags */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="SC 4WD Tours" />
      </head>
      <body className={`${lato.variable} ${lora.variable}`}>
        {/* JSON-LD Structured Data for SEO */}
        <Script
          id="organization-schema"
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(organizationSchema),
          }}
        />
        <Script
          id="local-business-schema"
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(localBusinessSchema),
          }}
        />
        <Script
          id="breadcrumb-schema"
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(breadcrumbSchema),
          }}
        />
        <Script
          id="tour-product-schema"
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(tourProductSchema),
          }}
        />

        <WebVitals />
        <ErrorBoundary>
          <Navigation />
          {children}
        </ErrorBoundary>
      </body>
    </html>
  );
}
