// Blog Listing Page with Pagination and Filtering
import { Metadata } from 'next';
import { Suspense } from 'react';
import { BlogCard, BlogCardSkeleton } from '@/components/Blog/BlogCard';
import { CategoryFilter } from '@/components/Blog/CategoryFilter';
import { Pagination } from '@/components/Blog/Pagination';
import type { BlogPost, PaginatedResponse } from '@/lib/types/blog';
import styles from './blog.module.css';

// MANDATORY: Generate metadata for SEO
export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'Blog | Latest 4WD Adventures & Travel Tips',
    description: 'Explore our latest blog posts about 4WD adventures, travel tips, destination guides, and off-road experiences on the Sunshine Coast and beyond.',
    keywords: [
      '4WD blog',
      'adventure travel',
      'Sunshine Coast travel',
      'off-road tips',
      'travel guides',
      'camping tips',
      '4x4 adventures',
      'Queensland travel',
    ],
    openGraph: {
      title: 'Blog | Latest 4WD Adventures & Travel Tips',
      description: 'Explore our latest blog posts about 4WD adventures, travel tips, and off-road experiences.',
      type: 'website',
      images: [
        {
          url: '/images/blog-og-image.jpg',
          width: 1200,
          height: 630,
          alt: 'Sunshine Coast 4WD Tours Blog',
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: 'Blog | Latest 4WD Adventures & Travel Tips',
      description: 'Explore our latest blog posts about 4WD adventures and travel tips.',
      images: ['/images/blog-twitter-image.jpg'],
    },
    alternates: {
      canonical: 'https://sunshinecoast4wdtours.com.au/blog',
    },
  };
}

// MANDATORY: Use ISR for better performance
export const revalidate = 3600; // Revalidate every hour

interface BlogPageProps {
  searchParams: {
    page?: string;
    category?: string;
    tag?: string;
    search?: string;
  };
}

async function fetchBlogPosts(
  page: number = 1,
  category?: string,
  tag?: string,
  search?: string
): Promise<PaginatedResponse<BlogPost>> {
  try {
    // Build query string
    const params = new URLSearchParams();
    params.append('page', page.toString());
    params.append('per_page', '12');
    if (category) params.append('category', category);
    if (tag) params.append('tag', tag);
    if (search) params.append('search', search);

    // MANDATORY: Use Medusa API endpoint pattern
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:9000';
    const response = await fetch(`${baseUrl}/api/blog/posts?${params.toString()}`, {
      headers: {
        'Content-Type': 'application/json',
      },
      next: { revalidate: 3600 }, // MANDATORY: Cache for 1 hour
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch posts: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('[BlogPage] Error fetching posts:', error);
    // Return empty result on error
    return {
      data: [],
      meta: {
        page: 1,
        per_page: 12,
        total: 0,
        total_pages: 0,
      },
    };
  }
}

export default async function BlogPage({ searchParams }: BlogPageProps) {
  const page = parseInt(searchParams.page || '1', 10);
  const category = searchParams.category;
  const tag = searchParams.tag;
  const search = searchParams.search;

  const { data: posts, meta } = await fetchBlogPosts(page, category, tag, search);

  // Separate featured post (first post on page 1)
  const featuredPost = page === 1 && posts.length > 0 ? posts[0] : null;
  const regularPosts = page === 1 && posts.length > 0 ? posts.slice(1) : posts;

  return (
    <div className={styles.blogPage}>
      {/* Hero Section */}
      <header className={styles.hero}>
        <div className={styles.heroContent}>
          <h1 className={styles.heroTitle}>
            Adventures & Travel Stories
          </h1>
          <p className={styles.heroSubtitle}>
            Discover the latest tips, guides, and stories from our 4WD adventures on the Sunshine Coast
          </p>
        </div>
      </header>

      <div className={styles.container}>
        {/* Filters */}
        <Suspense fallback={<div className={styles.filterSkeleton} />}>
          <CategoryFilter />
        </Suspense>

        {/* Featured Post (only on page 1) */}
        {featuredPost && (
          <section className={styles.featuredSection}>
            <h2 className={styles.sectionTitle}>Featured Article</h2>
            <BlogCard post={featuredPost} priority featured />
          </section>
        )}

        {/* Results Count */}
        {meta.total > 0 && (
          <div className={styles.resultsInfo}>
            <p>
              Showing {((page - 1) * meta.per_page) + 1} - {Math.min(page * meta.per_page, meta.total)} of {meta.total} articles
            </p>
          </div>
        )}

        {/* Blog Grid */}
        {posts.length > 0 ? (
          <>
            <div className={styles.blogGrid}>
              {regularPosts.map((post, index) => (
                <BlogCard
                  key={post.id}
                  post={post}
                  priority={index < 3} // MANDATORY: Priority for first 3 posts
                />
              ))}
            </div>

            {/* Pagination */}
            <Pagination currentPage={page} totalPages={meta.total_pages} />
          </>
        ) : (
          <div className={styles.emptyState}>
            <svg
              width="120"
              height="120"
              viewBox="0 0 120 120"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <circle cx="60" cy="60" r="50" stroke="#e0e0e0" strokeWidth="4" />
              <path
                d="M45 60h30M60 45v30"
                stroke="#e0e0e0"
                strokeWidth="4"
                strokeLinecap="round"
              />
            </svg>
            <h3>No articles found</h3>
            <p>Try adjusting your filters or search query</p>
          </div>
        )}
      </div>
    </div>
  );
}

// Loading UI (MANDATORY for better UX)
// Note: Should be moved to loading.tsx for Next.js App Router
function LoadingComponent() {
  return (
    <div className={styles.blogPage}>
      <header className={styles.hero}>
        <div className={styles.heroContent}>
          <div className={styles.heroSkeleton} />
          <div className={styles.heroSkeleton} style={{ width: '60%' }} />
        </div>
      </header>

      <div className={styles.container}>
        <div className={styles.filterSkeleton} />

        <div className={styles.blogGrid}>
          {Array.from({ length: 9 }).map((_, index) => (
            <BlogCardSkeleton key={index} />
          ))}
        </div>
      </div>
    </div>
  );
}
