/**
 * Event subscriber for addon collection products
 * Automatically sets metadata.addon = true when products are added to the "add-ons" collection
 *
 * @event product.created - Fired when a new product is created
 * @event product.updated - Fired when a product is updated (including collection changes)
 */

import {
  type SubscriberArgs,
  type SubscriberConfig,
} from "@medusajs/framework"
import { Modules } from "@medusajs/framework/utils"

/**
 * Subscriber function that handles product creation and updates
 * Automatically tags products in the "add-ons" collection with proper metadata
 */
export default async function addonCollectionSubscriber({
  event: { data },
  container,
}: SubscriberArgs<{ id: string }>) {
  const logger = container.resolve("logger")
  const productModuleService = container.resolve(Modules.PRODUCT)

  try {
    const productId = data.id

    logger.info(`[Addon Collection Subscriber] Processing product ${productId}`)

    // Retrieve product with collection information
    const products = await productModuleService.listProducts(
      { id: productId },
      {
        relations: ["collection"],
        take: 1,
      }
    )

    if (!products || products.length === 0) {
      logger.warn(`[Addon Collection Subscriber] Product ${productId} not found`)
      return
    }

    const product = products[0]

    // Check if product is in the "add-ons" collection
    const isInAddonsCollection = product.collection?.handle === "add-ons"

    logger.debug(`[Addon Collection Subscriber] Product ${productId} collection check`, {
      productHandle: product.handle,
      collectionHandle: product.collection?.handle,
      isInAddonsCollection,
      currentMetadata: product.metadata,
    })

    // Determine if metadata needs to be updated
    const currentAddonFlag = product.metadata?.addon === true
    const currentApplicableTours = product.metadata?.applicable_tours

    let needsUpdate = false
    const updates: Record<string, any> = { ...product.metadata }

    if (isInAddonsCollection) {
      // Product is in add-ons collection - ensure metadata is set
      if (!currentAddonFlag) {
        updates.addon = true
        needsUpdate = true
        logger.info(`[Addon Collection Subscriber] Setting addon=true for product ${product.handle}`)
      }

      // Set applicable_tours to ["*"] if not already set
      if (!currentApplicableTours || !Array.isArray(currentApplicableTours) || currentApplicableTours.length === 0) {
        updates.applicable_tours = ["*"]
        needsUpdate = true
        logger.info(`[Addon Collection Subscriber] Setting applicable_tours=["*"] for product ${product.handle}`)
      }
    } else {
      // Product is NOT in add-ons collection - remove addon metadata if present
      if (currentAddonFlag) {
        updates.addon = false
        needsUpdate = true
        logger.info(`[Addon Collection Subscriber] Removing addon flag from product ${product.handle}`)
      }
    }

    // Apply updates if needed
    if (needsUpdate) {
      await productModuleService.updateProducts(productId, {
        metadata: updates,
      })

      logger.info(`[Addon Collection Subscriber] Successfully updated metadata for product ${product.handle}`, {
        productId,
        metadata: updates,
      })
    } else {
      logger.debug(`[Addon Collection Subscriber] No metadata changes needed for product ${product.handle}`)
    }
  } catch (error) {
    logger.error("[Addon Collection Subscriber] Error processing product", {
      productId: data.id,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    })

    // Don't throw - we don't want to break the main flow if subscriber fails
    // The subscriber should be resilient and not affect core operations
  }
}

/**
 * Subscriber configuration
 * Listens to both product.created and product.updated events
 * - product.created: When a new product is created with collection_id set
 * - product.updated: When a product's collection_id is changed
 */
export const config: SubscriberConfig = {
  event: ["product.created", "product.updated"],
}
