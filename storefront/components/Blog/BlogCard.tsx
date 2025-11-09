// Blog Card Component with optimized images and SEO
import Image from 'next/image';
import Link from 'next/link';
import type { BlogPost } from '@/lib/types/blog';
import styles from './BlogCard.module.css';

interface BlogCardProps {
  post: BlogPost;
  priority?: boolean;
  featured?: boolean;
}

export function BlogCard({ post, priority = false, featured = false }: BlogCardProps) {
  const formattedDate = new Date(post.published_at).toLocaleDateString('en-AU', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <article className={`${styles.card} ${featured ? styles.featured : ''}`}>
      <Link href={`/blog/${post.slug}`} className={styles.imageLink}>
        <div className={styles.imageWrapper}>
          {/* MANDATORY: Use Next.js Image for optimization */}
          <Image
            src={post.featured_image}
            alt={post.featured_image_alt}
            fill
            sizes={featured ? '(max-width: 768px) 100vw, 1200px' : '(max-width: 768px) 100vw, 400px'}
            style={{ objectFit: 'cover' }}
            priority={priority} // MANDATORY: For LCP optimization on featured posts
            quality={85}
            className={styles.image}
          />

          {/* Category badge */}
          <div
            className={styles.categoryBadge}
            style={{ backgroundColor: post.category.color || '#1a5f3f' }}
          >
            {post.category.name}
          </div>
        </div>
      </Link>

      <div className={styles.content}>
        <div className={styles.meta}>
          <time dateTime={post.published_at} className={styles.date}>
            {formattedDate}
          </time>
          <span className={styles.readingTime}>
            {post.reading_time} min read
          </span>
        </div>

        <Link href={`/blog/${post.slug}`}>
          <h3 className={styles.title}>{post.title}</h3>
        </Link>

        <p className={styles.excerpt}>{post.excerpt}</p>

        <div className={styles.footer}>
          <div className={styles.author}>
            {post.author.avatar && (
              <Image
                src={post.author.avatar}
                alt={post.author.name}
                width={32}
                height={32}
                className={styles.authorAvatar}
              />
            )}
            <span className={styles.authorName}>{post.author.name}</span>
          </div>

          <Link href={`/blog/${post.slug}`} className={styles.readMore}>
            Read More →
          </Link>
        </div>

        {/* Tags */}
        {post.tags && post.tags.length > 0 && (
          <div className={styles.tags}>
            {post.tags.slice(0, 3).map((tag) => (
              <Link
                key={tag.id}
                href={`/blog?tag=${tag.slug}`}
                className={styles.tag}
              >
                #{tag.name}
              </Link>
            ))}
          </div>
        )}
      </div>
    </article>
  );
}

// Skeleton loader for BlogCard (MANDATORY for CLS prevention)
export function BlogCardSkeleton({ featured = false }: { featured?: boolean }) {
  return (
    <div className={`${styles.card} ${styles.skeleton} ${featured ? styles.featured : ''}`}>
      <div className={styles.imageWrapper}>
        <div className={styles.imageSkeleton} />
      </div>
      <div className={styles.content}>
        <div className={styles.meta}>
          <div className={styles.skeletonText} style={{ width: '120px', height: '16px' }} />
          <div className={styles.skeletonText} style={{ width: '80px', height: '16px' }} />
        </div>
        <div className={styles.skeletonText} style={{ width: '90%', height: '28px', marginTop: '12px' }} />
        <div className={styles.skeletonText} style={{ width: '100%', height: '20px', marginTop: '12px' }} />
        <div className={styles.skeletonText} style={{ width: '80%', height: '20px', marginTop: '8px' }} />
        <div className={styles.footer} style={{ marginTop: '20px' }}>
          <div className={styles.skeletonText} style={{ width: '100px', height: '20px' }} />
          <div className={styles.skeletonText} style={{ width: '80px', height: '20px' }} />
        </div>
      </div>
    </div>
  );
}
