'use client'

import React from 'react'
import Image from 'next/image'
import LinkedProducts from './LinkedProducts'

interface Post {
  id: string
  title: string
  slug: string
  content: string
  excerpt?: string
  author: string
  featured_image?: string
  category?: string
  tags?: string[]
  published_at?: string
  linked_products?: any[]
}

interface BlogPostProps {
  post: Post
}

/**
 * BlogPost Component
 * Displays a complete blog post with linked products
 */
export default function BlogPost({ post }: BlogPostProps) {
  const formattedDate = post.published_at
    ? new Date(post.published_at).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    : ''

  return (
    <article className="blog-post max-w-4xl mx-auto px-4 py-12">
      {/* Header */}
      <header className="mb-8">
        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
          {post.title}
        </h1>

        <div className="flex items-center text-gray-600 text-sm mb-6">
          <span className="font-medium">{post.author}</span>
          {formattedDate && (
            <>
              <span className="mx-2">•</span>
              <time dateTime={post.published_at}>{formattedDate}</time>
            </>
          )}
          {post.category && (
            <>
              <span className="mx-2">•</span>
              <span className="text-blue-600">{post.category}</span>
            </>
          )}
        </div>

        {post.excerpt && (
          <p className="text-xl text-gray-700 leading-relaxed">
            {post.excerpt}
          </p>
        )}
      </header>

      {/* Featured Image */}
      {post.featured_image && (
        <div className="relative w-full h-96 mb-8 rounded-lg overflow-hidden">
          <Image
            src={post.featured_image}
            alt={post.title}
            fill
            className="object-cover"
            priority
          />
        </div>
      )}

      {/* Content */}
      <div
        className="prose prose-lg max-w-none mb-12"
        dangerouslySetInnerHTML={{ __html: post.content }}
      />

      {/* Tags */}
      {post.tags && post.tags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-12">
          {post.tags.map((tag: string) => (
            <span
              key={tag}
              className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm"
            >
              #{tag}
            </span>
          ))}
        </div>
      )}

      {/* Linked Products */}
      {post.linked_products && post.linked_products.length > 0 && (
        <div className="border-t border-gray-200 pt-12">
          <LinkedProducts
            products={post.linked_products}
            title="Featured Tours in This Article"
          />
        </div>
      )}
    </article>
  )
}
