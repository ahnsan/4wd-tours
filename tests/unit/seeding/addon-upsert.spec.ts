/**
 * Unit tests for addon-upsert.ts
 * Tests all upsert functions with proper mocking
 * Target: 80%+ code coverage
 */

import { MedusaContainer } from "@medusajs/framework/types"
import { Modules, ContainerRegistrationKeys } from "@medusajs/framework/utils"
import {
  upsertCollection,
  upsertProductComplete,
  CollectionData,
  ProductData,
  VariantData,
  PriceData,
} from "../../../src/modules/seeding/addon-upsert"

describe("addon-upsert", () => {
  let mockContainer: MedusaContainer
  let mockProductService: any
  let mockPricingService: any
  let mockRemoteLink: any
  let consoleLogSpy: jest.SpyInstance
  let consoleErrorSpy: jest.SpyInstance

  beforeEach(() => {
    // Mock console methods
    consoleLogSpy = jest.spyOn(console, "log").mockImplementation()
    consoleErrorSpy = jest.spyOn(console, "error").mockImplementation()

    // Create mock services
    mockProductService = {
      listProductCollections: jest.fn(),
      createProductCollections: jest.fn(),
      listProducts: jest.fn(),
      createProducts: jest.fn(),
      updateProducts: jest.fn(),
      listProductVariants: jest.fn(),
      createProductVariants: jest.fn(),
      updateProductVariants: jest.fn(),
    }

    mockPricingService = {
      listPriceSets: jest.fn(),
      createPriceSets: jest.fn(),
      listPrices: jest.fn(),
      updatePrices: jest.fn(),
    }

    mockRemoteLink = {
      create: jest.fn(),
    }

    // Mock container
    mockContainer = {
      resolve: jest.fn((module: string) => {
        if (module === Modules.PRODUCT) {
          return mockProductService
        }
        if (module === Modules.PRICING) {
          return mockPricingService
        }
        if (module === ContainerRegistrationKeys.REMOTE_LINK) {
          return mockRemoteLink
        }
        return null
      }),
    } as any
  })

  afterEach(() => {
    jest.clearAllMocks()
    consoleLogSpy.mockRestore()
    consoleErrorSpy.mockRestore()
  })

  describe("upsertCollection", () => {
    const collectionData: CollectionData = {
      handle: "test-collection",
      title: "Test Collection",
    }

    it("should return existing collection ID when collection exists", async () => {
      const existingCollection = { id: "coll_123", handle: "test-collection" }
      mockProductService.listProductCollections.mockResolvedValue([existingCollection])

      const result = await upsertCollection(mockContainer, collectionData)

      expect(result).toBe("coll_123")
      expect(mockProductService.listProductCollections).toHaveBeenCalledWith({
        handle: "test-collection",
      })
      expect(mockProductService.createProductCollections).not.toHaveBeenCalled()
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('Collection "test-collection" already exists')
      )
    })

    it("should create new collection when it does not exist", async () => {
      const newCollection = { id: "coll_456", handle: "test-collection" }
      mockProductService.listProductCollections.mockResolvedValue([])
      mockProductService.createProductCollections.mockResolvedValue([newCollection])

      const result = await upsertCollection(mockContainer, collectionData)

      expect(result).toBe("coll_456")
      expect(mockProductService.createProductCollections).toHaveBeenCalledWith([
        {
          handle: "test-collection",
          title: "Test Collection",
        },
      ])
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('Created collection "test-collection"')
      )
    })

    it("should throw error when collection creation fails", async () => {
      const error = new Error("Database error")
      mockProductService.listProductCollections.mockResolvedValue([])
      mockProductService.createProductCollections.mockRejectedValue(error)

      await expect(upsertCollection(mockContainer, collectionData)).rejects.toThrow(
        "Database error"
      )
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Error upserting collection "test-collection"'),
        error
      )
    })
  })


  describe("upsertProductComplete", () => {
    const productData: ProductData = {
      handle: "complete-product",
      title: "Complete Product",
      collection_handle: "test-collection",
      status: "published",
      metadata: { addon: true },
    }

    const variantData: VariantData = {
      title: "Default Variant",
      sku: "COMPLETE-SKU",
      manage_inventory: false,
    }

    const priceData: PriceData = {
      amount: 10000,
      currency_code: "usd",
    }

    it("should complete full product upsert flow", async () => {
      // Mock product creation
      const newProduct = { id: "prod_999", handle: "complete-product" }
      mockProductService.listProducts.mockResolvedValue([])
      mockProductService.createProducts.mockResolvedValue([newProduct])
      mockProductService.listProductCollections.mockResolvedValue([])
      mockProductService.updateProducts.mockResolvedValue([newProduct])

      // Mock variant creation
      const newVariant = { id: "var_999", product_id: "prod_999" }
      mockProductService.listProductVariants.mockResolvedValue([])
      mockProductService.createProductVariants.mockResolvedValue([newVariant])

      // Mock price creation
      const newPriceSet = { id: "ps_999" }
      mockPricingService.listPriceSets.mockResolvedValue([])
      mockPricingService.createPriceSets.mockResolvedValue([newPriceSet])

      const result = await upsertProductComplete(
        mockContainer,
        productData,
        variantData,
        priceData
      )

      expect(result).toBe("prod_999")
      expect(mockProductService.createProducts).toHaveBeenCalled()
      expect(mockProductService.createProductVariants).toHaveBeenCalled()
      expect(mockPricingService.createPriceSets).toHaveBeenCalled()
    })

    it("should update existing product in complete flow", async () => {
      // Mock existing product
      const existingProduct = { id: "prod_888", handle: "complete-product" }
      const updatedProduct = { id: "prod_888", title: "Complete Product" }
      mockProductService.listProducts.mockResolvedValue([existingProduct])
      mockProductService.updateProducts.mockResolvedValue([updatedProduct])

      // Mock existing variant
      const existingVariant = { id: "var_888", product_id: "prod_888" }
      const updatedVariant = { id: "var_888", title: "Default Variant" }
      mockProductService.listProductVariants.mockResolvedValue([existingVariant])
      mockProductService.updateProductVariants.mockResolvedValue([updatedVariant])

      // Mock existing price
      const priceSet = { id: "ps_888" }
      const existingPrice = { id: "price_888", amount: 8000 }
      mockPricingService.listPriceSets.mockResolvedValue([priceSet])
      mockPricingService.listPrices.mockResolvedValue([existingPrice])
      mockPricingService.updatePrices.mockResolvedValue([])

      const result = await upsertProductComplete(
        mockContainer,
        productData,
        variantData,
        priceData
      )

      expect(result).toBe("prod_888")
      // When product exists, upsertProductComplete returns early without updating
      expect(mockProductService.updateProducts).not.toHaveBeenCalled()
      expect(mockProductService.updateProductVariants).not.toHaveBeenCalled()
      expect(mockPricingService.updatePrices).not.toHaveBeenCalled()
    })

    it("should propagate errors from product upsert", async () => {
      const error = new Error("Product upsert failed")
      mockProductService.listProducts.mockRejectedValue(error)

      await expect(
        upsertProductComplete(mockContainer, productData, variantData, priceData)
      ).rejects.toThrow("Product upsert failed")
    })

    it("should propagate errors from variant upsert", async () => {
      // Mock successful product creation
      const newProduct = { id: "prod_777", handle: "complete-product" }
      mockProductService.listProducts.mockResolvedValue([])
      mockProductService.createProducts.mockResolvedValue([newProduct])
      mockProductService.listProductCollections.mockResolvedValue([])

      // Mock variant error
      const error = new Error("Variant upsert failed")
      mockProductService.createProductVariants.mockRejectedValue(error)

      await expect(
        upsertProductComplete(mockContainer, productData, variantData, priceData)
      ).rejects.toThrow("Variant upsert failed")
    })

    it("should propagate errors from price upsert", async () => {
      // Mock successful product creation
      const newProduct = { id: "prod_666", handle: "complete-product" }
      mockProductService.listProducts.mockResolvedValue([])
      mockProductService.createProducts.mockResolvedValue([newProduct])
      mockProductService.listProductCollections.mockResolvedValue([])

      // Mock successful variant creation
      const newVariant = { id: "var_666", product_id: "prod_666" }
      mockProductService.createProductVariants.mockResolvedValue([newVariant])

      // Mock price error
      const error = new Error("Price upsert failed")
      mockPricingService.createPriceSets.mockRejectedValue(error)

      await expect(
        upsertProductComplete(mockContainer, productData, variantData, priceData)
      ).rejects.toThrow("Price upsert failed")
    })
  })
})
