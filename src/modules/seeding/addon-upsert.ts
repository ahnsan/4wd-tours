/**
 * Idempotent upsert helpers for collections and products
 * Typesafe and designed for re-runnable seeds
 */

import { MedusaContainer } from "@medusajs/framework/types"
import { Modules, ContainerRegistrationKeys } from "@medusajs/framework/utils"

export interface CollectionData {
  handle: string
  title: string
}

export interface ProductData {
  handle: string
  title: string
  description?: string
  collection_handle: string
  status?: string
  metadata?: Record<string, any>
}

export interface VariantData {
  title: string
  sku?: string
  manage_inventory?: boolean
}

export interface PriceData {
  amount: number
  currency_code: string
}

/**
 * Upsert collection by handle (idempotent)
 */
export async function upsertCollection(
  container: MedusaContainer,
  data: CollectionData
): Promise<string> {
  const productModuleService = container.resolve(Modules.PRODUCT)

  try {
    // Try to find existing collection
    const existingCollections = await productModuleService.listProductCollections({
      handle: data.handle,
    })

    if (existingCollections && Array.isArray(existingCollections) && existingCollections.length > 0) {
      console.log(`✓ Collection "${data.handle}" already exists`)
      return existingCollections[0].id
    }

    // Create new collection - wrap in try/catch for race conditions
    try {
      const collections = await productModuleService.createProductCollections([{
        handle: data.handle,
        title: data.title,
      }])

      console.log(`✓ Created collection "${data.handle}"`)
      return collections[0].id
    } catch (createError: any) {
      // If collection was created between check and create (race condition), fetch it
      if (createError.message && createError.message.includes("already exists")) {
        const collections = await productModuleService.listProductCollections({
          handle: data.handle,
        })
        if (collections && Array.isArray(collections) && collections.length > 0) {
          console.log(`✓ Collection "${data.handle}" already exists (race condition)`)
          return collections[0].id
        }
      }
      throw createError
    }
  } catch (error) {
    console.error(`✗ Error upserting collection "${data.handle}":`, error)
    throw error
  }
}

/**
 * Complete product upsert with variant and price using module services
 * Idempotent - checks if product exists and updates or creates accordingly
 */
export async function upsertProductComplete(
  container: MedusaContainer,
  productData: ProductData,
  variantData: VariantData,
  priceData: PriceData
): Promise<string> {
  const productModuleService = container.resolve(Modules.PRODUCT)
  const pricingModuleService = container.resolve(Modules.PRICING)
  const remoteLink = container.resolve(ContainerRegistrationKeys.REMOTE_LINK)

  try {
    // Check if product exists
    const existingProducts = await productModuleService.listProducts({
      handle: productData.handle,
    })

    if (existingProducts && Array.isArray(existingProducts) && existingProducts.length > 0) {
      const product = existingProducts[0]

      // Update product with new description and metadata
      const updateData: any = {}
      if (productData.description && productData.description !== product.description) {
        updateData.description = productData.description
      }
      if (productData.metadata && JSON.stringify(productData.metadata) !== JSON.stringify(product.metadata)) {
        updateData.metadata = productData.metadata
      }

      if (Object.keys(updateData).length > 0) {
        await productModuleService.updateProducts(product.id, updateData)
        console.log(`✓ Updated product "${productData.handle}" with new content (${product.id})`)
      } else {
        console.log(`✓ Product "${productData.handle}" already exists with prices (${product.id})`)
      }

      return product.id
    }

    // Get collection ID if specified
    let collectionId: string | undefined
    if (productData.collection_handle) {
      const collections = await productModuleService.listProductCollections({
        handle: productData.collection_handle,
      })
      if (collections && Array.isArray(collections) && collections.length > 0) {
        collectionId = collections[0].id
      }
    }

    // Step 1: Create product
    const products = await productModuleService.createProducts([{
      handle: productData.handle,
      title: productData.title,
      description: productData.description,
      status: productData.status || "published",
      collection_id: collectionId,
      metadata: productData.metadata || {},
    }])
    const product = products[0]

    // Step 2: Create variant
    const variants = await productModuleService.createProductVariants([{
      product_id: product.id,
      title: variantData.title,
      sku: variantData.sku || `SKU-${productData.handle.toUpperCase()}`,
      manage_inventory: variantData.manage_inventory !== undefined ? variantData.manage_inventory : false,
    }])
    const variant = variants[0]

    // Step 3: Create price set with price
    // CRITICAL: Must include region_id in rules for calculated_price to work
    // Australia region ID for Sunshine Coast 4WD Tours
    const AUSTRALIA_REGION_ID = 'reg_01K9G4HA190556136E7RJQ4411'

    const priceSets = await pricingModuleService.createPriceSets([{
      prices: [{
        amount: priceData.amount,
        currency_code: priceData.currency_code,
        rules: {
          region_id: AUSTRALIA_REGION_ID,
        },
      }],
    }])
    const priceSet = priceSets[0]

    // Step 4: Link variant to price set
    await remoteLink.create([{
      [Modules.PRODUCT]: {
        variant_id: variant.id,
      },
      [Modules.PRICING]: {
        price_set_id: priceSet.id,
      },
    }])

    console.log(`✓ Created product "${productData.handle}" with variant and price (${product.id})`)
    return product.id
  } catch (error) {
    console.error(`✗ Error upserting product "${productData.handle}":`, error)
    throw error
  }
}
