import { defineWidgetConfig } from "@medusajs/admin-sdk"
import { Container, Heading, Select, Button, Label } from "@medusajs/ui"
import { useState, useEffect } from "react"

/**
 * Admin Widget: Product Selector for Blog Posts
 * Allows selecting products when creating/editing blog posts
 */
const BlogPostProductSelector = ({ data }: any) => {
  const [selectedProducts, setSelectedProducts] = useState<string[]>([])
  const [availableProducts, setAvailableProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Load available products
    const loadProducts = async () => {
      try {
        const response = await fetch('/admin/products', {
          credentials: 'include'
        })
        const { products } = await response.json()
        setAvailableProducts(products)

        // Load existing product links if editing
        if (data?.postId) {
          const postResponse = await fetch(`/admin/posts/${data.postId}`, {
            credentials: 'include'
          })
          const { post } = await postResponse.json()
          setSelectedProducts(post.product_ids || [])
        }
      } catch (error) {
        console.error('Error loading products:', error)
      } finally {
        setLoading(false)
      }
    }

    loadProducts()
  }, [data?.postId])

  const handleProductToggle = (productId: string) => {
    setSelectedProducts(prev => {
      if (prev.includes(productId)) {
        return prev.filter(id => id !== productId)
      } else {
        return [...prev, productId]
      }
    })
  }

  const handleSave = async () => {
    if (!data?.postId) return

    try {
      await fetch(`/admin/posts/${data.postId}/products`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          product_ids: selectedProducts,
          action: 'set'
        })
      })

      alert('Products linked successfully!')
    } catch (error) {
      console.error('Error linking products:', error)
      alert('Error linking products')
    }
  }

  if (loading) {
    return <div>Loading products...</div>
  }

  return (
    <Container>
      <Heading level="h2">Linked Products/Tours</Heading>
      <p className="text-sm text-gray-600 mb-4">
        Select products or tours to feature in this blog post
      </p>

      <div className="space-y-4">
        {availableProducts.map((product) => (
          <div key={product.id} className="flex items-center gap-3 p-3 border rounded">
            <input
              type="checkbox"
              id={`product-${product.id}`}
              checked={selectedProducts.includes(product.id)}
              onChange={() => handleProductToggle(product.id)}
              className="w-4 h-4"
            />
            <Label htmlFor={`product-${product.id}`} className="flex-1 cursor-pointer">
              <div className="flex items-center gap-3">
                {product.thumbnail && (
                  <img
                    src={product.thumbnail}
                    alt={product.title}
                    className="w-12 h-12 object-cover rounded"
                  />
                )}
                <div>
                  <div className="font-medium">{product.title}</div>
                  {product.description && (
                    <div className="text-sm text-gray-500 line-clamp-1">
                      {product.description}
                    </div>
                  )}
                </div>
              </div>
            </Label>
          </div>
        ))}
      </div>

      {data?.postId && (
        <Button onClick={handleSave} className="mt-4">
          Save Product Links
        </Button>
      )}

      <div className="mt-4 text-sm text-gray-600">
        {selectedProducts.length} product(s) selected
      </div>
    </Container>
  )
}

export const config = defineWidgetConfig({
  zone: "post.details.after",
})

export default BlogPostProductSelector
