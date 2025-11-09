import { MetadataRoute } from 'next';

/**
 * Dynamic sitemap generation for Sunshine Coast 4WD Tours
 * This helps search engines discover and index all pages on the site
 * Learn more: https://nextjs.org/docs/app/api-reference/file-conventions/metadata/sitemap
 */

// Blog posts data structure
interface BlogPost {
  slug: string;
  publishedAt: string;
  modifiedAt: string;
  priority: number;
}

// Function to fetch blog posts - replace with actual CMS/DB call
async function getBlogPosts(): Promise<BlogPost[]> {
  // TODO: Replace with actual data fetching from CMS or database
  return [
    {
      slug: 'best-4wd-tracks-sunshine-coast-2025',
      publishedAt: '2025-01-15T08:00:00+10:00',
      modifiedAt: '2025-01-20T14:30:00+10:00',
      priority: 0.8,
    },
    {
      slug: 'rainbow-beach-vs-fraser-island',
      publishedAt: '2025-01-10T09:00:00+10:00',
      modifiedAt: '2025-01-18T16:00:00+10:00',
      priority: 0.8,
    },
    {
      slug: 'first-time-4wd-adventure-guide',
      publishedAt: '2025-01-05T10:00:00+10:00',
      modifiedAt: '2025-01-15T12:00:00+10:00',
      priority: 0.7,
    },
    {
      slug: 'sunshine-coast-weather-guide-4wd',
      publishedAt: '2024-12-20T09:00:00+10:00',
      modifiedAt: '2025-01-10T11:00:00+10:00',
      priority: 0.7,
    },
  ];
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://sunshinecoast4wdtours.com.au';
  const currentDate = new Date();

  // Fetch blog posts for dynamic sitemap
  const blogPosts = await getBlogPosts();

  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    // Homepage - highest priority, updated frequently
    {
      url: baseUrl,
      lastModified: currentDate,
      changeFrequency: 'daily',
      priority: 1.0,
    },
    // Tours page - high priority
    {
      url: `${baseUrl}/tours`,
      lastModified: currentDate,
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    // Individual tour pages - high priority
    {
      url: `${baseUrl}/tours/beach-adventure`,
      lastModified: currentDate,
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/tours/rainforest-explorer`,
      lastModified: currentDate,
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/tours/outback-experience`,
      lastModified: currentDate,
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/tours/sunset-safari`,
      lastModified: currentDate,
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/tours/mountain-trek`,
      lastModified: currentDate,
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/tours/coastal-discovery`,
      lastModified: currentDate,
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    // About page - medium priority
    {
      url: `${baseUrl}/about`,
      lastModified: currentDate,
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    // Contact page - medium priority
    {
      url: `${baseUrl}/contact`,
      lastModified: currentDate,
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    // Booking page - high priority
    {
      url: `${baseUrl}/booking`,
      lastModified: currentDate,
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    // Gallery page - medium priority
    {
      url: `${baseUrl}/gallery`,
      lastModified: currentDate,
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    // Reviews page - medium priority
    {
      url: `${baseUrl}/reviews`,
      lastModified: currentDate,
      changeFrequency: 'weekly',
      priority: 0.7,
    },
    // FAQ page - medium priority
    {
      url: `${baseUrl}/faq`,
      lastModified: currentDate,
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    // Terms and Privacy - lower priority
    {
      url: `${baseUrl}/terms`,
      lastModified: currentDate,
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    {
      url: `${baseUrl}/privacy`,
      lastModified: currentDate,
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    // Blog listing page
    {
      url: `${baseUrl}/blog`,
      lastModified: currentDate,
      changeFrequency: 'daily',
      priority: 0.8,
    },
  ];

  // Blog post pages (dynamic)
  const blogPages: MetadataRoute.Sitemap = blogPosts.map((post) => ({
    url: `${baseUrl}/blog/${post.slug}`,
    lastModified: new Date(post.modifiedAt),
    changeFrequency: 'monthly' as const,
    priority: post.priority,
  }));

  // Combine all pages
  return [...staticPages, ...blogPages];
}
