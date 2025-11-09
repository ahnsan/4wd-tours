/**
 * API Integration tests for /store/add-ons endpoint
 * Tests response shape, performance, and data filtering
 */

import { medusaIntegrationTestRunner } from "@medusajs/test-utils"
import { Modules } from "@medusajs/framework/utils"

jest.setTimeout(60 * 1000)

medusaIntegrationTestRunner({
  inApp: true,
  env: {},
  testSuite: ({ api, getContainer }) => {
    describe("GET /store/add-ons", () => {
      let productModuleService: any
      let pricingModuleService: any

      beforeEach(async () => {
        const container = getContainer()
        productModuleService = container.resolve(Modules.PRODUCT)
        pricingModuleService = container.resolve(Modules.PRICING)
      })

      describe("Response Structure", () => {
        it("should return correct response shape with add-ons", async () => {
          // Create add-ons collection
          const [collection] = await productModuleService.createProductCollections([
            {
              handle: "add-ons",
              title: "Add-Ons",
            },
          ])

          // Create product with addon metadata
          const [product] = await productModuleService.createProducts([
            {
              handle: "test-addon",
              title: "Test Add-On",
              status: "published",
              collection_id: collection.id,
              metadata: { addon: true },
            },
          ])

          // Create variant
          const [variant] = await productModuleService.createProductVariants([
            {
              product_id: product.id,
              title: "Default",
              sku: "TEST-ADDON-001",
            },
          ])

          // Create price
          await pricingModuleService.createPriceSets([
            {
              variant_id: variant.id,
              prices: [
                {
                  amount: 5000,
                  currency_code: "usd",
                },
              ],
            },
          ])

          const response = await api.get("/store/add-ons")

          expect(response.status).toBe(200)
          expect(response.data).toHaveProperty("add_ons")
          expect(response.data).toHaveProperty("count")
          expect(response.data).toHaveProperty("timing_ms")
          expect(response.data).toHaveProperty("performance")
          expect(Array.isArray(response.data.add_ons)).toBe(true)
          expect(typeof response.data.count).toBe("number")
          expect(typeof response.data.timing_ms).toBe("number")
        })

        it("should return products with correct structure", async () => {
          // Create add-ons collection
          const [collection] = await productModuleService.createProductCollections([
            {
              handle: "add-ons",
              title: "Add-Ons",
            },
          ])

          // Create product
          const [product] = await productModuleService.createProducts([
            {
              handle: "structured-addon",
              title: "Structured Add-On",
              status: "published",
              collection_id: collection.id,
              metadata: { addon: true, category: "equipment" },
            },
          ])

          // Create variant
          const [variant] = await productModuleService.createProductVariants([
            {
              product_id: product.id,
              title: "Standard",
              sku: "STRUCT-001",
            },
          ])

          // Create price
          await pricingModuleService.createPriceSets([
            {
              variant_id: variant.id,
              prices: [
                {
                  amount: 7500,
                  currency_code: "usd",
                },
              ],
            },
          ])

          const response = await api.get("/store/add-ons")

          expect(response.status).toBe(200)
          const addon = response.data.add_ons[0]

          // Check product structure
          expect(addon).toHaveProperty("id")
          expect(addon).toHaveProperty("handle")
          expect(addon).toHaveProperty("title")
          expect(addon).toHaveProperty("metadata")
          expect(addon).toHaveProperty("variants")

          // Check metadata
          expect(addon.metadata.addon).toBe(true)

          // Check variant structure
          expect(Array.isArray(addon.variants)).toBe(true)
          expect(addon.variants.length).toBeGreaterThan(0)

          const addonVariant = addon.variants[0]
          expect(addonVariant).toHaveProperty("id")
          expect(addonVariant).toHaveProperty("title")
          expect(addonVariant).toHaveProperty("sku")
          expect(addonVariant).toHaveProperty("prices")

          // Check price structure
          expect(Array.isArray(addonVariant.prices)).toBe(true)
          expect(addonVariant.prices.length).toBeGreaterThan(0)

          const price = addonVariant.prices[0]
          expect(price).toHaveProperty("amount")
          expect(price).toHaveProperty("currency_code")
          expect(typeof price.amount).toBe("number")
          expect(typeof price.currency_code).toBe("string")
        })
      })

      describe("Performance", () => {
        it("should respond in less than 300ms", async () => {
          // Create collection and products
          const [collection] = await productModuleService.createProductCollections([
            {
              handle: "add-ons",
              title: "Add-Ons",
            },
          ])

          // Create multiple products to simulate realistic scenario
          for (let i = 0; i < 5; i++) {
            const [product] = await productModuleService.createProducts([
              {
                handle: `perf-addon-${i}`,
                title: `Performance Add-On ${i}`,
                status: "published",
                collection_id: collection.id,
                metadata: { addon: true },
              },
            ])

            const [variant] = await productModuleService.createProductVariants([
              {
                product_id: product.id,
                title: "Default",
                sku: `PERF-${i}`,
              },
            ])

            await pricingModuleService.createPriceSets([
              {
                variant_id: variant.id,
                prices: [
                  {
                    amount: 1000 * (i + 1),
                    currency_code: "usd",
                  },
                ],
              },
            ])
          }

          const response = await api.get("/store/add-ons")

          expect(response.status).toBe(200)
          expect(response.data.timing_ms).toBeLessThan(300)
          expect(response.data.performance).toContain("✓ Target met")
        })

        it("should include performance indicator in response", async () => {
          const response = await api.get("/store/add-ons")

          expect(response.status).toBe(200)
          expect(response.data).toHaveProperty("performance")
          expect(typeof response.data.performance).toBe("string")
        })
      })

      describe("Empty Collection Handling", () => {
        it("should return empty array when add-ons collection does not exist", async () => {
          const response = await api.get("/store/add-ons")

          expect(response.status).toBe(200)
          expect(response.data.add_ons).toEqual([])
          expect(response.data.count).toBe(0)
          expect(response.data).toHaveProperty("timing_ms")
        })

        it("should return empty array when collection exists but has no products", async () => {
          // Create empty add-ons collection
          await productModuleService.createProductCollections([
            {
              handle: "add-ons",
              title: "Add-Ons",
            },
          ])

          const response = await api.get("/store/add-ons")

          expect(response.status).toBe(200)
          expect(response.data.add_ons).toEqual([])
          expect(response.data.count).toBe(0)
        })

        it("should return empty array when products exist but none have addon metadata", async () => {
          // Create add-ons collection
          const [collection] = await productModuleService.createProductCollections([
            {
              handle: "add-ons",
              title: "Add-Ons",
            },
          ])

          // Create product WITHOUT addon metadata
          await productModuleService.createProducts([
            {
              handle: "not-an-addon",
              title: "Not an Add-On",
              status: "published",
              collection_id: collection.id,
              metadata: { addon: false },
            },
          ])

          const response = await api.get("/store/add-ons")

          expect(response.status).toBe(200)
          expect(response.data.add_ons).toEqual([])
          expect(response.data.count).toBe(0)
        })
      })

      describe("Metadata Filtering", () => {
        it("should only return products with metadata.addon = true", async () => {
          // Create add-ons collection
          const [collection] = await productModuleService.createProductCollections([
            {
              handle: "add-ons",
              title: "Add-Ons",
            },
          ])

          // Create product with addon = true
          const [addonProduct] = await productModuleService.createProducts([
            {
              handle: "true-addon",
              title: "True Add-On",
              status: "published",
              collection_id: collection.id,
              metadata: { addon: true },
            },
          ])

          // Create variant for true addon
          const [addonVariant] = await productModuleService.createProductVariants([
            {
              product_id: addonProduct.id,
              title: "Default",
              sku: "TRUE-ADDON",
            },
          ])

          // Create price
          await pricingModuleService.createPriceSets([
            {
              variant_id: addonVariant.id,
              prices: [{ amount: 5000, currency_code: "usd" }],
            },
          ])

          // Create product with addon = false
          await productModuleService.createProducts([
            {
              handle: "false-addon",
              title: "False Add-On",
              status: "published",
              collection_id: collection.id,
              metadata: { addon: false },
            },
          ])

          // Create product without addon metadata
          await productModuleService.createProducts([
            {
              handle: "no-addon-meta",
              title: "No Add-On Meta",
              status: "published",
              collection_id: collection.id,
              metadata: { other: "data" },
            },
          ])

          const response = await api.get("/store/add-ons")

          expect(response.status).toBe(200)
          expect(response.data.count).toBe(1)
          expect(response.data.add_ons.length).toBe(1)
          expect(response.data.add_ons[0].handle).toBe("true-addon")
          expect(response.data.add_ons[0].metadata.addon).toBe(true)
        })

        it("should filter multiple products correctly", async () => {
          // Create add-ons collection
          const [collection] = await productModuleService.createProductCollections([
            {
              handle: "add-ons",
              title: "Add-Ons",
            },
          ])

          // Create 3 true add-ons
          for (let i = 0; i < 3; i++) {
            const [product] = await productModuleService.createProducts([
              {
                handle: `addon-${i}`,
                title: `Add-On ${i}`,
                status: "published",
                collection_id: collection.id,
                metadata: { addon: true },
              },
            ])

            const [variant] = await productModuleService.createProductVariants([
              {
                product_id: product.id,
                title: "Default",
                sku: `ADDON-${i}`,
              },
            ])

            await pricingModuleService.createPriceSets([
              {
                variant_id: variant.id,
                prices: [{ amount: 1000 * (i + 1), currency_code: "usd" }],
              },
            ])
          }

          // Create 2 false add-ons
          for (let i = 0; i < 2; i++) {
            await productModuleService.createProducts([
              {
                handle: `not-addon-${i}`,
                title: `Not Add-On ${i}`,
                status: "published",
                collection_id: collection.id,
                metadata: { addon: false },
              },
            ])
          }

          const response = await api.get("/store/add-ons")

          expect(response.status).toBe(200)
          expect(response.data.count).toBe(3)
          expect(response.data.add_ons.length).toBe(3)

          // Verify all returned products have addon: true
          response.data.add_ons.forEach((addon: any) => {
            expect(addon.metadata.addon).toBe(true)
          })
        })

        it("should filter unpublished products", async () => {
          // Create add-ons collection
          const [collection] = await productModuleService.createProductCollections([
            {
              handle: "add-ons",
              title: "Add-Ons",
            },
          ])

          // Create published addon
          const [publishedProduct] = await productModuleService.createProducts([
            {
              handle: "published-addon",
              title: "Published Add-On",
              status: "published",
              collection_id: collection.id,
              metadata: { addon: true },
            },
          ])

          const [publishedVariant] = await productModuleService.createProductVariants([
            {
              product_id: publishedProduct.id,
              title: "Default",
              sku: "PUBLISHED",
            },
          ])

          await pricingModuleService.createPriceSets([
            {
              variant_id: publishedVariant.id,
              prices: [{ amount: 5000, currency_code: "usd" }],
            },
          ])

          // Create draft addon
          await productModuleService.createProducts([
            {
              handle: "draft-addon",
              title: "Draft Add-On",
              status: "draft",
              collection_id: collection.id,
              metadata: { addon: true },
            },
          ])

          const response = await api.get("/store/add-ons")

          expect(response.status).toBe(200)
          expect(response.data.count).toBe(1)
          expect(response.data.add_ons[0].handle).toBe("published-addon")
        })
      })

      describe("Error Handling", () => {
        it("should handle errors gracefully", async () => {
          // This test verifies the endpoint doesn't crash on unexpected errors
          const response = await api.get("/store/add-ons")

          expect(response.status).toBe(200)
          expect(response.data).toHaveProperty("add_ons")
        })
      })

      describe("Data Integrity", () => {
        it("should return complete product data with variants and prices", async () => {
          // Create add-ons collection
          const [collection] = await productModuleService.createProductCollections([
            {
              handle: "add-ons",
              title: "Add-Ons",
            },
          ])

          // Create product with multiple variants and prices
          const [product] = await productModuleService.createProducts([
            {
              handle: "multi-variant-addon",
              title: "Multi Variant Add-On",
              status: "published",
              collection_id: collection.id,
              metadata: { addon: true, category: "premium" },
            },
          ])

          // Create multiple variants
          const variants = []
          for (let i = 0; i < 2; i++) {
            const [variant] = await productModuleService.createProductVariants([
              {
                product_id: product.id,
                title: `Variant ${i + 1}`,
                sku: `MULTI-${i + 1}`,
              },
            ])
            variants.push(variant)

            // Create multiple currency prices
            await pricingModuleService.createPriceSets([
              {
                variant_id: variant.id,
                prices: [
                  { amount: 5000 + i * 1000, currency_code: "usd" },
                ],
              },
            ])
          }

          const response = await api.get("/store/add-ons")

          expect(response.status).toBe(200)
          expect(response.data.count).toBe(1)

          const addon = response.data.add_ons[0]
          expect(addon.variants.length).toBe(2)

          // Verify each variant has prices
          addon.variants.forEach((variant: any) => {
            expect(variant.prices.length).toBeGreaterThan(0)
            expect(variant).toHaveProperty("id")
            expect(variant).toHaveProperty("title")
            expect(variant).toHaveProperty("sku")
          })
        })
      })
    })
  },
})
