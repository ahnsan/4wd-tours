// Related Posts Component
'use client';

import { useRelatedPosts } from '@/lib/hooks/useBlog';
import { BlogCard, BlogCardSkeleton } from './BlogCard';
import styles from './RelatedPosts.module.css';

interface RelatedPostsProps {
  postId: string;
  limit?: number;
}

export function RelatedPosts({ postId, limit = 3 }: RelatedPostsProps) {
  const { posts, isLoading, error } = useRelatedPosts(postId, limit);

  if (error) {
    console.error('[RelatedPosts] Error loading related posts:', error);
    return null;
  }

  if (!isLoading && posts.length === 0) {
    return null;
  }

  return (
    <section className={styles.relatedSection}>
      <div className={styles.header}>
        <h2 className={styles.title}>Related Articles</h2>
        <p className={styles.subtitle}>
          Continue exploring similar topics and adventures
        </p>
      </div>

      <div className={styles.grid}>
        {isLoading ? (
          // Skeleton loaders (MANDATORY for CLS prevention)
          Array.from({ length: limit }).map((_, index) => (
            <BlogCardSkeleton key={index} />
          ))
        ) : (
          posts.map((post) => (
            <BlogCard key={post.id} post={post} />
          ))
        )}
      </div>
    </section>
  );
}
