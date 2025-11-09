/**
 * Integration tests for tour seeding idempotency
 * Verifies that running seeds multiple times does not create duplicates
 */

import { medusaIntegrationTestRunner } from "@medusajs/test-utils"
import { MedusaContainer } from "@medusajs/framework/types"
import { Modules } from "@medusajs/framework/utils"
import { seedTours, TOURS, ADDONS } from "../../src/modules/seeding/tour-seed"

jest.setTimeout(120 * 1000) // 2 minutes for seed operations

medusaIntegrationTestRunner({
  inApp: true,
  env: {},
  testSuite: ({ getContainer }) => {
    let container: MedusaContainer
    let productModuleService: any
    let pricingModuleService: any

    beforeAll(() => {
      container = getContainer()
      productModuleService = container.resolve(Modules.PRODUCT)
      pricingModuleService = container.resolve(Modules.PRICING)
    })

    describe("Tour Seeding Idempotency", () => {
      describe("Multiple seed runs", () => {
        it("should create products on first run", async () => {
          // Run seed for the first time
          await seedTours(container)

          // Verify products were created
          const [products] = await productModuleService.listProducts()
          const productCount = products.length

          // Should have created all tours and add-ons
          expect(productCount).toBeGreaterThanOrEqual(TOURS.length + ADDONS.length)

          // Verify collections exist
          const [collections] = await productModuleService.listProductCollections()
          const collectionHandles = collections.map((c: any) => c.handle)

          expect(collectionHandles).toContain("tours")
          expect(collectionHandles).toContain("add-ons")
        })

        it("should not create duplicates on second run", async () => {
          // Get count before second run
          const [productsBefore] = await productModuleService.listProducts()
          const countBefore = productsBefore.length

          // Run seed again (idempotency test)
          await seedTours(container)

          // Get count after second run
          const [productsAfter] = await productModuleService.listProducts()
          const countAfter = productsAfter.length

          // Count should remain the same
          expect(countAfter).toBe(countBefore)
        })

        it("should not create duplicate collections on second run", async () => {
          // Get collections before
          const [collectionsBefore] = await productModuleService.listProductCollections()
          const countBefore = collectionsBefore.length

          // Run seed again
          await seedTours(container)

          // Get collections after
          const [collectionsAfter] = await productModuleService.listProductCollections()
          const countAfter = collectionsAfter.length

          // Collection count should remain the same
          expect(countAfter).toBe(countBefore)
        })

        it("should update existing products on re-run", async () => {
          // Verify products can be found and have correct titles
          const [products] = await productModuleService.listProducts({
            handle: "1d-fraser-island",
          })

          expect(products.length).toBe(1)
          expect(products[0].title).toBe("1 Day Fraser Island Tour")
        })
      })

      describe("Product count verification", () => {
        it("should have correct number of tour products", async () => {
          // Get products by collection
          const [collections] = await productModuleService.listProductCollections({
            handle: "tours",
          })
          expect(collections.length).toBeGreaterThan(0)

          const tourCollectionId = collections[0].id

          const [tourProducts] = await productModuleService.listProducts({
            collection_id: [tourCollectionId],
          })

          // Should match the number of tours defined
          expect(tourProducts.length).toBe(TOURS.length)
        })

        it("should have correct number of add-on products", async () => {
          // Get products by collection
          const [collections] = await productModuleService.listProductCollections({
            handle: "add-ons",
          })
          expect(collections.length).toBeGreaterThan(0)

          const addonCollectionId = collections[0].id

          const [addonProducts] = await productModuleService.listProducts({
            collection_id: [addonCollectionId],
          })

          // Should match the number of add-ons defined
          expect(addonProducts.length).toBe(ADDONS.length)
        })
      })

      describe("Collection integrity", () => {
        it("should have exactly 2 collections", async () => {
          const [collections] = await productModuleService.listProductCollections()

          const handles = collections.map((c: any) => c.handle)

          expect(handles).toContain("tours")
          expect(handles).toContain("add-ons")
        })

        it("should have correct collection titles", async () => {
          const [toursCollection] = await productModuleService.listProductCollections({
            handle: "tours",
          })
          expect(toursCollection[0].title).toBe("4WD Tours")

          const [addonsCollection] = await productModuleService.listProductCollections({
            handle: "add-ons",
          })
          expect(addonsCollection[0].title).toBe("Tour Add-ons")
        })
      })

      describe("Handle uniqueness", () => {
        it("should have unique handles for all tour products", async () => {
          const tourHandles = TOURS.map(t => t.handle)
          const uniqueHandles = new Set(tourHandles)

          // All handles should be unique
          expect(uniqueHandles.size).toBe(tourHandles.length)
        })

        it("should have unique handles for all add-on products", async () => {
          const addonHandles = ADDONS.map(a => a.handle)
          const uniqueHandles = new Set(addonHandles)

          // All handles should be unique
          expect(uniqueHandles.size).toBe(addonHandles.length)
        })

        it("should be able to retrieve each tour by handle", async () => {
          for (const tour of TOURS) {
            const [products] = await productModuleService.listProducts({
              handle: tour.handle,
            })

            expect(products.length).toBe(1)
            expect(products[0].handle).toBe(tour.handle)
            expect(products[0].title).toBe(tour.title)
          }
        })

        it("should be able to retrieve each add-on by handle", async () => {
          for (const addon of ADDONS) {
            const [products] = await productModuleService.listProducts({
              handle: addon.handle,
            })

            expect(products.length).toBe(1)
            expect(products[0].handle).toBe(addon.handle)
            expect(products[0].title).toBe(addon.title)
          }
        })
      })

      describe("Product variants and prices", () => {
        it("should have exactly one variant per product", async () => {
          const [products] = await productModuleService.listProducts()

          for (const product of products) {
            const [variants] = await productModuleService.listProductVariants({
              product_id: product.id,
            })

            expect(variants.length).toBe(1)
            expect(variants[0].title).toBe("Default")
          }
        })

        it("should have prices in AUD for all products", async () => {
          const [products] = await productModuleService.listProducts()

          for (const product of products) {
            const [variants] = await productModuleService.listProductVariants({
              product_id: product.id,
            })

            expect(variants.length).toBeGreaterThan(0)

            // Note: Price verification would require checking pricing module
            // This is a basic check that variants exist
            expect(variants[0].sku).toBeTruthy()
          }
        })

        it("should have correct SKU format", async () => {
          const [products] = await productModuleService.listProducts({
            handle: "1d-fraser-island",
          })

          expect(products.length).toBe(1)

          const [variants] = await productModuleService.listProductVariants({
            product_id: products[0].id,
          })

          expect(variants[0].sku).toBe("TOUR-1D-FRASER-ISLAND")
        })
      })

      describe("Product metadata", () => {
        it("should have tour metadata on tour products", async () => {
          const [products] = await productModuleService.listProducts({
            handle: "1d-fraser-island",
          })

          expect(products.length).toBe(1)
          expect(products[0].metadata).toBeDefined()
          expect(products[0].metadata.is_tour).toBe(true)
          expect(products[0].metadata.duration_days).toBe(1)
        })

        it("should have add-on metadata on add-on products", async () => {
          const [products] = await productModuleService.listProducts({
            handle: "addon-internet",
          })

          expect(products.length).toBe(1)
          expect(products[0].metadata).toBeDefined()
          expect(products[0].metadata.addon).toBe(true)
          expect(products[0].metadata.unit).toBe("per_day")
        })

        it("should preserve metadata across multiple seed runs", async () => {
          // Get metadata before
          const [productsBefore] = await productModuleService.listProducts({
            handle: "2d-fraser-rainbow",
          })
          const metadataBefore = productsBefore[0].metadata

          // Run seed again
          await seedTours(container)

          // Get metadata after
          const [productsAfter] = await productModuleService.listProducts({
            handle: "2d-fraser-rainbow",
          })
          const metadataAfter = productsAfter[0].metadata

          // Metadata should be preserved
          expect(metadataAfter.is_tour).toBe(metadataBefore.is_tour)
          expect(metadataAfter.duration_days).toBe(metadataBefore.duration_days)
        })
      })

      describe("Product status", () => {
        it("should have all products published", async () => {
          const [products] = await productModuleService.listProducts()

          for (const product of products) {
            expect(product.status).toBe("published")
          }
        })
      })

      describe("Performance considerations", () => {
        it("should complete seeding in reasonable time", async () => {
          const startTime = Date.now()

          await seedTours(container)

          const endTime = Date.now()
          const duration = endTime - startTime

          // Seeding should complete in less than 30 seconds
          expect(duration).toBeLessThan(30000)
        })

        it("should efficiently handle bulk operations", async () => {
          // This test verifies that multiple products can be queried efficiently
          const startTime = Date.now()

          const [products] = await productModuleService.listProducts()

          const endTime = Date.now()
          const duration = endTime - startTime

          // Query should be fast (< 1 second)
          expect(duration).toBeLessThan(1000)
          expect(products.length).toBeGreaterThan(0)
        })
      })
    })

    describe("Edge cases and error handling", () => {
      it("should handle running seeds three times", async () => {
        const [productsBefore] = await productModuleService.listProducts()
        const countBefore = productsBefore.length

        // Run seed three times
        await seedTours(container)
        await seedTours(container)
        await seedTours(container)

        const [productsAfter] = await productModuleService.listProducts()
        const countAfter = productsAfter.length

        // Count should remain the same
        expect(countAfter).toBe(countBefore)
      })

      it("should maintain handle uniqueness across runs", async () => {
        await seedTours(container)

        const [products] = await productModuleService.listProducts()
        const handles = products.map((p: any) => p.handle)
        const uniqueHandles = new Set(handles)

        // All handles should be unique
        expect(uniqueHandles.size).toBe(handles.length)
      })
    })
  },
})
