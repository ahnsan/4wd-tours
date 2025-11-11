/**
 * Export ALL add-ons from the local Medusa database
 *
 * Usage: npx medusa exec ./src/scripts/export-addons.ts
 *
 * This script:
 * - Finds all products with metadata.addon = true
 * - Exports comprehensive data including:
 *   - Product details (id, handle, title, description)
 *   - Pricing information (all variants and price sets)
 *   - Complete metadata (category, applicable_tours, pricing_type, etc.)
 *   - Image URLs and paths
 *   - Variant information
 * - Saves to /src/scripts/addon-export.json
 * - Provides detailed statistics and sample data verification
 */

import { ExecArgs } from "@medusajs/framework/types"
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"
import * as fs from "fs"
import * as path from "path"

interface ExportedAddon {
  // Product basics
  id: string
  handle: string
  title: string
  description: string | null
  status: string

  // Metadata
  metadata: {
    addon: boolean
    unit?: string
    category?: string
    applicable_tours?: string[]
    description?: string
    persuasive_title?: string
    persuasive_description?: string
    value_proposition?: string
    urgency_text?: string
    features?: string[]
    testimonial?: string
    category_intro?: string
    category_persuasion?: string
    [key: string]: any
  }

  // Pricing
  variants: Array<{
    id: string
    title: string
    sku: string | null
    allow_backorder: boolean
    manage_inventory: boolean
    prices: Array<{
      amount: number
      currency_code: string
      min_quantity: number | null
      max_quantity: number | null
    }>
  }>

  // Images
  images: Array<{
    id: string
    url: string
  }>

  // Collection
  collection_id: string | null

  // Timestamps
  created_at: string
  updated_at: string
}

interface ExportStats {
  total_addons: number
  by_category: Record<string, number>
  by_unit: Record<string, number>
  pricing_range: {
    min: number
    max: number
    average: number
  }
  universal_addons: number // applicable_tours includes "*"
  tour_specific_addons: number
}

export default async function exportAddons({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const query = container.resolve("query")

  logger.info("\n" + "=".repeat(80))
  logger.info("📦 ADDON EXPORT - Local Medusa Database")
  logger.info("=".repeat(80))
  logger.info(`Database: ${process.env.DATABASE_URL}`)
  logger.info(`Timestamp: ${new Date().toISOString()}`)
  logger.info("=".repeat(80))

  try {
    // Step 1: Query all products with addon metadata
    logger.info("\n🔍 Step 1: Querying all add-on products...")

    const { data: allProducts } = await query.graph({
      entity: "product",
      fields: [
        "id",
        "title",
        "handle",
        "description",
        "status",
        "metadata",
        "collection_id",
        "created_at",
        "updated_at",
        "images.id",
        "images.url",
        "variants.id",
        "variants.title",
        "variants.sku",
        "variants.allow_backorder",
        "variants.manage_inventory",
        "variants.prices.amount",
        "variants.prices.currency_code",
        "variants.prices.min_quantity",
        "variants.prices.max_quantity",
      ],
    })

    logger.info(`   ✓ Retrieved ${allProducts.length} total products from database`)

    // Step 2: Filter products with addon metadata
    logger.info("\n🔍 Step 2: Filtering add-on products...")

    const addonProducts = allProducts.filter((product: any) =>
      product.metadata && product.metadata.addon === true
    )

    logger.info(`   ✓ Found ${addonProducts.length} add-on products`)

    if (addonProducts.length === 0) {
      logger.warn("\n⚠️  No add-on products found in database!")
      logger.info("\nℹ️  To seed add-ons, run: npx medusa exec ./src/scripts/seed-addons.ts")
      return
    }

    // Step 3: Transform data for export
    logger.info("\n🔄 Step 3: Transforming data for export...")

    const exportedAddons: ExportedAddon[] = addonProducts.map((product: any) => ({
      id: product.id,
      handle: product.handle,
      title: product.title,
      description: product.description,
      status: product.status,
      metadata: product.metadata,
      variants: product.variants?.map((variant: any) => ({
        id: variant.id,
        title: variant.title,
        sku: variant.sku,
        allow_backorder: variant.allow_backorder,
        manage_inventory: variant.manage_inventory,
        prices: variant.prices?.map((price: any) => ({
          amount: price.amount, // Store raw amount (dollars in Medusa v2)
          currency_code: price.currency_code,
          min_quantity: price.min_quantity,
          max_quantity: price.max_quantity,
        })) || [],
      })) || [],
      images: product.images?.map((image: any) => ({
        id: image.id,
        url: image.url,
      })) || [],
      collection_id: product.collection_id,
      created_at: product.created_at,
      updated_at: product.updated_at,
    }))

    logger.info(`   ✓ Transformed ${exportedAddons.length} add-ons`)

    // Step 4: Calculate statistics
    logger.info("\n📊 Step 4: Calculating statistics...")

    const stats: ExportStats = {
      total_addons: exportedAddons.length,
      by_category: {},
      by_unit: {},
      pricing_range: {
        min: Infinity,
        max: 0,
        average: 0,
      },
      universal_addons: 0,
      tour_specific_addons: 0,
    }

    let totalPrice = 0
    let priceCount = 0

    exportedAddons.forEach(addon => {
      // Category stats
      const category = addon.metadata.category || "Uncategorized"
      stats.by_category[category] = (stats.by_category[category] || 0) + 1

      // Unit stats
      const unit = addon.metadata.unit || "unknown"
      stats.by_unit[unit] = (stats.by_unit[unit] || 0) + 1

      // Pricing stats
      addon.variants.forEach(variant => {
        variant.prices.forEach(price => {
          const amount = price.amount // Already in dollars (Medusa v2)
          stats.pricing_range.min = Math.min(stats.pricing_range.min, amount)
          stats.pricing_range.max = Math.max(stats.pricing_range.max, amount)
          totalPrice += amount
          priceCount++
        })
      })

      // Applicable tours stats
      const applicableTours = addon.metadata.applicable_tours || []
      if (applicableTours.includes("*")) {
        stats.universal_addons++
      } else if (applicableTours.length > 0) {
        stats.tour_specific_addons++
      }
    })

    stats.pricing_range.average = priceCount > 0 ? totalPrice / priceCount : 0

    // Handle case where no prices found
    if (stats.pricing_range.min === Infinity) {
      stats.pricing_range.min = 0
    }

    logger.info("   ✓ Statistics calculated")

    // Step 5: Save to file
    logger.info("\n💾 Step 5: Saving export to file...")

    const exportData = {
      export_metadata: {
        timestamp: new Date().toISOString(),
        database_url: process.env.DATABASE_URL?.replace(/:[^:@]*@/, ':***@'), // Mask password
        medusa_backend_url: process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || "http://localhost:9000",
        total_addons: exportedAddons.length,
      },
      statistics: stats,
      addons: exportedAddons,
    }

    const outputPath = path.join(__dirname, "addon-export.json")
    fs.writeFileSync(outputPath, JSON.stringify(exportData, null, 2), "utf-8")

    logger.info(`   ✓ Export saved to: ${outputPath}`)
    logger.info(`   ✓ File size: ${(fs.statSync(outputPath).size / 1024).toFixed(2)} KB`)

    // Step 6: Display summary
    logger.info("\n" + "=".repeat(80))
    logger.info("✅ EXPORT COMPLETE - SUMMARY")
    logger.info("=".repeat(80))
    logger.info(`\n📊 Overall Statistics:`)
    logger.info(`   Total add-ons exported:    ${stats.total_addons}`)
    logger.info(`   Universal add-ons:         ${stats.universal_addons} (available for all tours)`)
    logger.info(`   Tour-specific add-ons:     ${stats.tour_specific_addons}`)

    logger.info(`\n💰 Pricing Range (AUD):`)
    logger.info(`   Minimum:  $${stats.pricing_range.min.toFixed(2)}`)
    logger.info(`   Maximum:  $${stats.pricing_range.max.toFixed(2)}`)
    logger.info(`   Average:  $${stats.pricing_range.average.toFixed(2)}`)

    logger.info(`\n📂 By Category:`)
    Object.entries(stats.by_category)
      .sort((a, b) => b[1] - a[1])
      .forEach(([category, count]) => {
        logger.info(`   ${category}: ${count}`)
      })

    logger.info(`\n⚙️  By Pricing Unit:`)
    Object.entries(stats.by_unit)
      .sort((a, b) => b[1] - a[1])
      .forEach(([unit, count]) => {
        logger.info(`   ${unit}: ${count}`)
      })

    // Step 7: Display sample add-ons for verification
    logger.info("\n" + "=".repeat(80))
    logger.info("📋 SAMPLE ADD-ONS (First 3 for verification)")
    logger.info("=".repeat(80))

    exportedAddons.slice(0, 3).forEach((addon, index) => {
      logger.info(`\n${index + 1}. ${addon.title}`)
      logger.info(`   Handle: ${addon.handle}`)
      logger.info(`   Category: ${addon.metadata.category || "N/A"}`)
      logger.info(`   Unit: ${addon.metadata.unit || "N/A"}`)
      logger.info(`   Applicable Tours: ${addon.metadata.applicable_tours?.join(", ") || "N/A"}`)

      if (addon.variants && addon.variants.length > 0) {
        const variant = addon.variants[0]
        if (variant.prices && variant.prices.length > 0) {
          const price = variant.prices[0]
          logger.info(`   Price: $${price.amount.toFixed(2)} ${price.currency_code.toUpperCase()}`)
        }
      }

      logger.info(`   Description: ${addon.metadata.description?.substring(0, 100) || addon.description?.substring(0, 100) || "N/A"}...`)
      logger.info(`   Images: ${addon.images.length} image(s)`)

      if (addon.metadata.features && addon.metadata.features.length > 0) {
        logger.info(`   Features (${addon.metadata.features.length}):`)
        addon.metadata.features.slice(0, 2).forEach((feature: string) => {
          logger.info(`      • ${feature}`)
        })
        if (addon.metadata.features.length > 2) {
          logger.info(`      ... and ${addon.metadata.features.length - 2} more`)
        }
      }
    })

    // Step 8: Data quality report
    logger.info("\n" + "=".repeat(80))
    logger.info("🔍 DATA QUALITY REPORT")
    logger.info("=".repeat(80))

    let issues = 0
    const qualityChecks = {
      missing_metadata: 0,
      missing_category: 0,
      missing_applicable_tours: 0,
      missing_unit: 0,
      missing_description: 0,
      missing_variants: 0,
      missing_prices: 0,
      missing_images: 0,
    }

    exportedAddons.forEach(addon => {
      if (!addon.metadata || Object.keys(addon.metadata).length === 0) {
        qualityChecks.missing_metadata++
        issues++
      }
      if (!addon.metadata?.category) {
        qualityChecks.missing_category++
        issues++
      }
      if (!addon.metadata?.applicable_tours || addon.metadata.applicable_tours.length === 0) {
        qualityChecks.missing_applicable_tours++
        issues++
      }
      if (!addon.metadata?.unit) {
        qualityChecks.missing_unit++
        issues++
      }
      if (!addon.description && !addon.metadata?.description) {
        qualityChecks.missing_description++
        issues++
      }
      if (!addon.variants || addon.variants.length === 0) {
        qualityChecks.missing_variants++
        issues++
      } else {
        const hasPrice = addon.variants.some(v => v.prices && v.prices.length > 0)
        if (!hasPrice) {
          qualityChecks.missing_prices++
          issues++
        }
      }
      if (!addon.images || addon.images.length === 0) {
        qualityChecks.missing_images++
      }
    })

    if (issues === 0) {
      logger.info("\n✅ All add-ons have complete required data!")
    } else {
      logger.warn(`\n⚠️  Found ${issues} data quality issues:`)
      Object.entries(qualityChecks).forEach(([check, count]) => {
        if (count > 0) {
          logger.warn(`   ${check.replace(/_/g, " ")}: ${count} add-on(s)`)
        }
      })
    }

    // Final instructions
    logger.info("\n" + "=".repeat(80))
    logger.info("📁 Export Location:")
    logger.info(`   ${outputPath}`)
    logger.info("\n💡 Next Steps:")
    logger.info("   1. Review the exported JSON file")
    logger.info("   2. Verify sample add-ons above match expected data")
    logger.info("   3. Check data quality report for any issues")
    logger.info("   4. Use this export for migration or backup purposes")
    logger.info("=".repeat(80) + "\n")

  } catch (error) {
    logger.error("\n" + "=".repeat(80))
    logger.error("❌ EXPORT FAILED")
    logger.error("=".repeat(80))
    logger.error(error instanceof Error ? error.message : String(error))

    if (error instanceof Error && error.stack) {
      logger.debug("\nStack trace:")
      logger.debug(error.stack)
    }

    throw error
  }
}
