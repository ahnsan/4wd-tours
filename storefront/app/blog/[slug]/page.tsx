import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Script from 'next/script';
import StructuredData from '@/components/Blog/StructuredData';

// This would typically come from a CMS or database
// For now, we'll create a mock data structure
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

// Mock function to fetch blog post - replace with actual CMS/DB call
async function getBlogPost(slug: string): Promise<BlogPost | null> {
  // TODO: Replace with actual data fetching from CMS or database
  const posts: Record<string, BlogPost> = {
    'best-4wd-tracks-sunshine-coast-2025': {
      slug: 'best-4wd-tracks-sunshine-coast-2025',
      title: 'Best 4WD Tracks Sunshine Coast 2025',
      description: 'Discover the top 10 4WD tracks on Sunshine Coast in 2025. Expert tips, difficulty ratings, permit requirements. Complete guide for off-road enthusiasts.',
      content: 'Full article content here...',
      author: {
        name: 'John Smith',
        url: 'https://sunshinecoast4wdtours.com.au/about/team',
        image: 'https://sunshinecoast4wdtours.com.au/images/team/john-smith.jpg',
      },
      publishedAt: '2025-01-15T08:00:00+10:00',
      modifiedAt: '2025-01-20T14:30:00+10:00',
      image: 'https://sunshinecoast4wdtours.com.au/images/blog/4wd-tracks-hero.jpg',
      imageAlt: '4WD vehicle on Rainbow Beach Sunshine Coast Queensland',
      category: '4WD Guides',
      tags: ['4WD', 'Sunshine Coast', 'Off-road', 'Travel Guide'],
      readingTime: 8,
      featured: true,
    },
    'rainbow-beach-vs-fraser-island': {
      slug: 'rainbow-beach-vs-fraser-island',
      title: 'Rainbow Beach vs Fraser Island: Complete Comparison',
      description: 'Choosing between Rainbow Beach and Fraser Island for your 4WD adventure? Compare both destinations with expert insights, costs, and recommendations.',
      content: 'Full article content here...',
      author: {
        name: 'Sarah Williams',
        url: 'https://sunshinecoast4wdtours.com.au/about/team',
        image: 'https://sunshinecoast4wdtours.com.au/images/team/sarah-williams.jpg',
      },
      publishedAt: '2025-01-10T09:00:00+10:00',
      modifiedAt: '2025-01-18T16:00:00+10:00',
      image: 'https://sunshinecoast4wdtours.com.au/images/blog/rainbow-beach-fraser.jpg',
      imageAlt: 'Comparison of Rainbow Beach and Fraser Island 4WD destinations',
      category: 'Destination Guides',
      tags: ['Rainbow Beach', 'Fraser Island', '4WD', 'Travel Planning'],
      readingTime: 6,
      featured: true,
    },
  };

  return posts[slug] || null;
}

// Dynamic metadata generation for each blog post
export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const post = await getBlogPost(params.slug);

  if (!post) {
    return {
      title: 'Blog Post Not Found',
      description: 'The blog post you are looking for could not be found.',
    };
  }

  const baseUrl = 'https://sunshinecoast4wdtours.com.au';
  const postUrl = `${baseUrl}/blog/${params.slug}`;

  return {
    title: post.title,
    description: post.description,
    keywords: post.tags,

    // Open Graph
    openGraph: {
      type: 'article',
      url: postUrl,
      title: post.title,
      description: post.description,
      images: [
        {
          url: post.image,
          width: 1200,
          height: 630,
          alt: post.imageAlt,
        },
      ],
      siteName: 'Sunshine Coast 4WD Tours',
      locale: 'en_AU',
      publishedTime: post.publishedAt,
      modifiedTime: post.modifiedAt,
      authors: [post.author.url],
      section: post.category,
      tags: post.tags,
    },

    // Twitter Card
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description: post.description,
      images: [post.image],
      creator: '@SC4WDTours',
      site: '@SC4WDTours',
    },

    // Canonical URL
    alternates: {
      canonical: postUrl,
    },

    // Additional metadata
    authors: [{ name: post.author.name, url: post.author.url }],
    category: post.category,
  };
}

// Generate static params for all blog posts (for static generation)
export async function generateStaticParams() {
  // TODO: Fetch all blog post slugs from CMS/database
  return [
    { slug: 'best-4wd-tracks-sunshine-coast-2025' },
    { slug: 'rainbow-beach-vs-fraser-island' },
  ];
}

export default async function BlogPostPage({
  params,
}: {
  params: { slug: string };
}) {
  const post = await getBlogPost(params.slug);

  if (!post) {
    notFound();
  }

  return (
    <>
      {/* Structured Data for Article */}
      <StructuredData post={post} />

      {/* Breadcrumb Structured Data */}
      <Script
        id="breadcrumb-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'BreadcrumbList',
            itemListElement: [
              {
                '@type': 'ListItem',
                position: 1,
                name: 'Home',
                item: 'https://sunshinecoast4wdtours.com.au',
              },
              {
                '@type': 'ListItem',
                position: 2,
                name: 'Blog',
                item: 'https://sunshinecoast4wdtours.com.au/blog',
              },
              {
                '@type': 'ListItem',
                position: 3,
                name: post.title,
                item: `https://sunshinecoast4wdtours.com.au/blog/${params.slug}`,
              },
            ],
          }),
        }}
      />

      <article className="max-w-4xl mx-auto px-4 py-8">
        {/* Article Header */}
        <header className="mb-8">
          <h1 className="text-4xl font-bold mb-4">{post.title}</h1>

          <div className="flex items-center gap-4 text-gray-600 mb-6">
            <time dateTime={post.publishedAt}>
              {new Date(post.publishedAt).toLocaleDateString('en-AU', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </time>
            <span>·</span>
            <span>{post.readingTime} min read</span>
            <span>·</span>
            <span>{post.category}</span>
          </div>

          {/* Author Info */}
          <div className="flex items-center gap-4">
            <img
              src={post.author.image}
              alt={post.author.name}
              className="w-12 h-12 rounded-full"
            />
            <div>
              <p className="font-medium">{post.author.name}</p>
              <p className="text-sm text-gray-600">Expert 4WD Guide</p>
            </div>
          </div>
        </header>

        {/* Featured Image */}
        <figure className="mb-8">
          <img
            src={post.image}
            alt={post.imageAlt}
            className="w-full h-auto rounded-lg"
          />
          <figcaption className="text-sm text-gray-600 mt-2">
            {post.imageAlt}
          </figcaption>
        </figure>

        {/* Article Content */}
        <div className="prose prose-lg max-w-none">
          {/* TODO: Render actual blog content from CMS */}
          <p>{post.content}</p>
        </div>

        {/* Tags */}
        <footer className="mt-8 pt-8 border-t">
          <div className="flex flex-wrap gap-2">
            {post.tags.map((tag) => (
              <span
                key={tag}
                className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm"
              >
                {tag}
              </span>
            ))}
          </div>
        </footer>
      </article>
    </>
  );
}
