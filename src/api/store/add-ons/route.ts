/**
 * Store API endpoint to list add-on products
 * GET /store/add-ons
 */

import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { Modules } from "@medusajs/framework/utils"
import { Product, ProductVariant, ProductPrice, AddOnsResponse, AddOnProduct } from "../../../lib/types/product"
import { logger } from "../../../lib/logger"
import { handleAPIError } from "../../../lib/errors/error-handler"

export async function GET(
  req: MedusaRequest,
  res: MedusaResponse<AddOnsResponse>
): Promise<void> {
  const startTime = Date.now()
  const requestLogger = logger.child({ endpoint: 'GET /store/add-ons' })

  try {
    const productModuleService = req.scope.resolve(Modules.PRODUCT)

    requestLogger.debug('Fetching add-ons collection')

    // Get add-ons collection
    const [collections] = await productModuleService.listProductCollections({
      handle: "add-ons",
    })

    if (!collections || collections.length === 0) {
      requestLogger.warn('Add-ons collection not found')
      res.json({
        add_ons: [],
        count: 0,
        timing_ms: Date.now() - startTime,
      })
      return
    }

    const collectionId = collections[0].id

    requestLogger.debug('Fetching products in add-ons collection', { collectionId })

    // Get all products in add-ons collection with metadata.addon = true
    const [products] = await productModuleService.listProducts({
      collection_id: collectionId,
      status: "published",
    }, {
      relations: ["variants", "variants.prices"],
    })

    // Filter for products with addon metadata (with proper typing)
    const addons = (products as Product[])?.filter(
      (product: Product) => product.metadata?.addon === true
    ) || []

    const responseTime = Date.now() - startTime

    const response: AddOnsResponse = {
      add_ons: addons.map((product: Product): AddOnProduct => ({
        id: product.id,
        handle: product.handle,
        title: product.title,
        metadata: product.metadata || {},
        variants: (product.variants || []).map((variant: ProductVariant) => ({
          id: variant.id,
          title: variant.title,
          sku: variant.sku,
          prices: (variant.prices || []).map((price: ProductPrice) => ({
            amount: price.amount,
            currency_code: price.currency_code,
          })),
        })),
      })),
      count: addons.length,
      timing_ms: responseTime,
      performance: responseTime < 300 ? "✓ Target met (<300ms)" : "⚠ Exceeds target",
    }

    requestLogger.info('Add-ons fetched successfully', {
      count: addons.length,
      timing_ms: responseTime,
      performanceTarget: responseTime < 300
    })

    res.json(response)
  } catch (error) {
    requestLogger.error('Failed to fetch add-ons', error instanceof Error ? error : undefined)

    const responseTime = Date.now() - startTime
    res.status(500).json({
      error: "Failed to fetch add-ons",
      message: error instanceof Error ? error.message : "Unknown error",
      timing_ms: responseTime,
    } as any)
  }
}
