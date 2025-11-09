'use client'

import React from 'react'
import Image from 'next/image'
import Link from 'next/link'

interface ProductVariant {
  id: string
  title: string
  price_set?: {
    prices: Array<{
      amount: number
      currency_code: string
    }>
  }
}

interface Product {
  id: string
  title: string
  description?: string
  handle: string
  thumbnail?: string
  images?: Array<{
    url: string
  }>
  variants?: ProductVariant[]
}

interface LinkedProductsProps {
  products: Product[]
  title?: string
  className?: string
}

/**
 * LinkedProducts Component
 * Displays related tours/products in blog articles
 * Features: Product cards with images, prices, and "Book Now" CTAs
 */
export default function LinkedProducts({
  products,
  title = "Related Tours",
  className = ""
}: LinkedProductsProps) {
  if (!products || products.length === 0) {
    return null
  }

  const formatPrice = (amount: number, currencyCode: string = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currencyCode.toUpperCase(),
    }).format(amount / 100) // Assuming amount is in cents
  }

  const getProductPrice = (product: Product) => {
    if (!product.variants || product.variants.length === 0) {
      return null
    }

    const variant = product.variants[0]
    if (!variant || !variant.price_set?.prices || variant.price_set.prices.length === 0) {
      return null
    }

    const price = variant.price_set.prices[0]
    if (!price) {
      return null
    }
    return {
      amount: price.amount,
      currency: price.currency_code,
      formatted: formatPrice(price.amount, price.currency_code)
    }
  }

  const getProductImage = (product: Product) => {
    if (product.thumbnail) {
      return product.thumbnail
    }
    if (product.images && product.images.length > 0) {
      return product.images[0]?.url || '/images/placeholder-tour.jpg'
    }
    return '/images/placeholder-tour.jpg' // Fallback image
  }

  return (
    <section className={`linked-products ${className}`}>
      <div className="container mx-auto px-4 py-12">
        <h2 className="text-3xl font-bold text-gray-900 mb-8">{title}</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {products.map((product) => {
            const price = getProductPrice(product)
            const imageUrl = getProductImage(product)

            return (
              <article
                key={product.id}
                className="product-card bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300"
              >
                {/* Product Image */}
                <div className="relative h-64 w-full overflow-hidden bg-gray-200">
                  <Image
                    src={imageUrl}
                    alt={product.title}
                    fill
                    className="object-cover hover:scale-105 transition-transform duration-300"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  />
                </div>

                {/* Product Details */}
                <div className="p-6">
                  <h3 className="text-xl font-semibold text-gray-900 mb-2 line-clamp-2">
                    {product.title}
                  </h3>

                  {product.description && (
                    <p className="text-gray-600 mb-4 line-clamp-3">
                      {product.description}
                    </p>
                  )}

                  {/* Price */}
                  {price && (
                    <div className="mb-4">
                      <span className="text-2xl font-bold text-blue-600">
                        {price.formatted}
                      </span>
                      <span className="text-gray-500 text-sm ml-2">
                        per person
                      </span>
                    </div>
                  )}

                  {/* CTA Button */}
                  <Link
                    href={`/tours/${product.handle}`}
                    className="block w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg text-center transition-colors duration-200"
                  >
                    Book Now
                  </Link>

                  {/* View Details Link */}
                  <Link
                    href={`/tours/${product.handle}`}
                    className="block mt-3 text-center text-blue-600 hover:text-blue-800 text-sm font-medium"
                  >
                    View Details →
                  </Link>
                </div>
              </article>
            )
          })}
        </div>
      </div>

      <style jsx>{`
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        .line-clamp-3 {
          display: -webkit-box;
          -webkit-line-clamp: 3;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </section>
  )
}
