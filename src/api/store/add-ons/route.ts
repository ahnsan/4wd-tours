/**
 * Store API endpoint to list add-on products
 * GET /store/add-ons
 */

import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { Modules, QueryContext } from "@medusajs/framework/utils"
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
    const query = req.scope.resolve("query")

    // Get region_id and currency_code from query params for pricing context
    const region_id = req.query.region_id as string
    const currency_code = req.query.currency_code as string || "aud"
    const tour_handle = req.query.tour_handle as string | undefined

    requestLogger.debug('Fetching add-ons collection', { region_id, currency_code, tour_handle })

    // Get add-ons collection
    const collections = await productModuleService.listProductCollections({
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

    requestLogger.debug('Fetching products in add-ons collection with calculated prices', { collectionId })

    // Get all products in add-ons collection with calculated prices
    // Use query.graph to get variants with calculated_price based on region/currency context
    const { data: products } = await query.graph({
      entity: "product",
      fields: [
        "*",
        "variants.*",
        "variants.calculated_price.*",
      ],
      filters: {
        collection_id: collectionId,
        status: "published",
      },
      context: region_id || currency_code ? {
        variants: {
          calculated_price: QueryContext({
            ...(region_id && { region_id }),
            ...(currency_code && { currency_code }),
          }),
        },
      } : undefined,
    })

    // Filter for products with addon metadata (with proper typing)
    // MEDUSA BEST PRACTICE: Server-side filtering for better performance
    let addons = (products as Product[])?.filter(
      (product: Product) => product.metadata?.addon === true
    ) || []

    // Server-side filter by tour handle if provided
    if (tour_handle) {
      addons = addons.filter((product: Product) => {
        const applicableTours = product.metadata?.applicable_tours as string[] | undefined

        if (!applicableTours || applicableTours.length === 0) {
          return false // Not applicable if no tours specified
        }

        // Include if wildcard or tour handle matches
        return applicableTours.includes('*') || applicableTours.includes(tour_handle)
      })

      requestLogger.debug('Filtered add-ons by tour', {
        tour_handle,
        count: addons.length
      })
    }

    const responseTime = Date.now() - startTime

    const response: AddOnsResponse = {
      add_ons: addons.map((product: Product): AddOnProduct => ({
        id: product.id,
        handle: product.handle,
        title: product.title,
        metadata: product.metadata || {},
        variants: (product.variants || []).map((variant: any) => ({
          id: variant.id,
          title: variant.title,
          sku: variant.sku,
          // Include both calculated_price (Medusa v2) and prices array for backwards compatibility
          calculated_price: variant.calculated_price ? {
            calculated_amount: variant.calculated_price.calculated_amount,
            currency_code: variant.calculated_price.currency_code,
            is_calculated_price_tax_inclusive: variant.calculated_price.is_calculated_price_tax_inclusive,
          } : undefined,
          prices: variant.calculated_price ? [{
            amount: variant.calculated_price.calculated_amount,
            currency_code: variant.calculated_price.currency_code,
          }] : [],
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
