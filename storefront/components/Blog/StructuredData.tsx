import Script from 'next/script';

interface BlogPost {
  slug: string;
  title: string;
  description: string;
  content: string;
  author: {
    name: string;
    url: string;
    image: string;
  };
  publishedAt: string;
  modifiedAt: string;
  image: string;
  imageAlt: string;
  category: string;
  tags: string[];
  readingTime: number;
  featured: boolean;
}

interface StructuredDataProps {
  post: BlogPost;
}

/**
 * Structured Data Component for Blog Posts
 * Implements Article schema with Author and Organization schemas
 * Following SEO documentation requirements exactly
 */
export default function StructuredData({ post }: StructuredDataProps) {
  const baseUrl = 'https://sunshinecoast4wdtours.com.au';

  // Article Schema (JSON-LD)
  const articleSchema = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    '@id': `${baseUrl}/blog/${post.slug}#article`,

    // Basic info
    headline: post.title,
    description: post.description,

    // Images
    image: [post.image],

    // Author
    author: {
      '@type': 'Person',
      '@id': post.author.url,
      name: post.author.name,
      url: post.author.url,
      image: {
        '@type': 'ImageObject',
        url: post.author.image,
      },
    },

    // Publisher (Organization)
    publisher: {
      '@type': 'Organization',
      '@id': `${baseUrl}/#organization`,
      name: 'Sunshine Coast 4WD Tours',
      logo: {
        '@type': 'ImageObject',
        url: `${baseUrl}/images/logo.png`,
        width: 600,
        height: 60,
      },
      url: baseUrl,
      sameAs: [
        'https://www.facebook.com/SC4WDTours',
        'https://www.instagram.com/SC4WDTours',
        'https://twitter.com/SC4WDTours',
      ],
    },

    // Dates
    datePublished: post.publishedAt,
    dateModified: post.modifiedAt,

    // Content
    articleBody: post.content,
    wordCount: Math.ceil(post.content.length / 5), // Rough estimate

    // Main entity
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `${baseUrl}/blog/${post.slug}`,
    },

    // Category and keywords
    articleSection: post.category,
    keywords: post.tags.join(', '),

    // Language
    inLanguage: 'en-AU',

    // Reading time (custom property)
    timeRequired: `PT${post.readingTime}M`, // ISO 8601 duration format
  };

  // Organization Schema (for the blog)
  const organizationSchema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': `${baseUrl}/#organization`,
    name: 'Sunshine Coast 4WD Tours',
    alternateName: 'SC 4WD Tours',
    url: baseUrl,
    logo: {
      '@type': 'ImageObject',
      url: `${baseUrl}/images/logo.png`,
      width: 600,
      height: 60,
    },
    description:
      "Premium 4WD tours and off-road adventures on Queensland's Sunshine Coast",
    address: {
      '@type': 'PostalAddress',
      addressLocality: 'Sunshine Coast',
      addressRegion: 'QLD',
      addressCountry: 'AU',
    },
    sameAs: [
      'https://www.facebook.com/SC4WDTours',
      'https://www.instagram.com/SC4WDTours',
      'https://twitter.com/SC4WDTours',
    ],
  };

  // Author Schema (Person)
  const authorSchema = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    '@id': post.author.url,
    name: post.author.name,
    url: post.author.url,
    image: {
      '@type': 'ImageObject',
      url: post.author.image,
    },
    jobTitle: 'Expert 4WD Guide',
    worksFor: {
      '@type': 'Organization',
      '@id': `${baseUrl}/#organization`,
      name: 'Sunshine Coast 4WD Tours',
    },
    knowsAbout: [
      '4WD Tours',
      'Off-road Driving',
      'Sunshine Coast',
      'Queensland Tourism',
    ],
  };

  return (
    <>
      {/* Article Schema */}
      <Script
        id="article-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(articleSchema),
        }}
      />

      {/* Organization Schema */}
      <Script
        id="organization-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(organizationSchema),
        }}
      />

      {/* Author Schema */}
      <Script
        id="author-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(authorSchema),
        }}
      />
    </>
  );
}
