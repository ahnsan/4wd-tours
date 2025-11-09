/**
 * Unit tests for BlogModuleService
 * Tests all blog service methods with proper mocking
 * Target: 90%+ code coverage for blog module
 */

import BlogModuleService from "../../../src/modules/blog/service"

describe("BlogModuleService", () => {
  let service: BlogModuleService
  let mockListPosts: jest.Mock
  let mockListAndCountPosts: jest.Mock
  let mockRetrievePost: jest.Mock
  let mockCreatePosts: jest.Mock
  let mockUpdatePosts: jest.Mock
  let mockDeletePosts: jest.Mock
  let mockListCategories: jest.Mock
  let mockRetrieveCategory: jest.Mock

  beforeEach(() => {
    // Create mocks for all base MedusaService methods
    mockListPosts = jest.fn()
    mockListAndCountPosts = jest.fn()
    mockRetrievePost = jest.fn()
    mockCreatePosts = jest.fn()
    mockUpdatePosts = jest.fn()
    mockDeletePosts = jest.fn()
    mockListCategories = jest.fn()
    mockRetrieveCategory = jest.fn()

    // Create service instance and mock inherited methods
    service = new BlogModuleService()
    service.listPosts = mockListPosts
    service.listAndCountPosts = mockListAndCountPosts
    service.retrievePost = mockRetrievePost
    service.createPosts = mockCreatePosts
    service.updatePosts = mockUpdatePosts
    service.deletePosts = mockDeletePosts
    service.listCategories = mockListCategories
    service.retrieveCategory = mockRetrieveCategory
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe("listPublishedPosts", () => {
    it("should return only published posts ordered by published_at DESC", async () => {
      const mockPosts = [
        { id: "post_1", title: "Post 1", is_published: true, published_at: new Date("2025-01-10") },
        { id: "post_2", title: "Post 2", is_published: true, published_at: new Date("2025-01-09") },
      ]
      mockListPosts.mockResolvedValue(mockPosts)

      const result = await service.listPublishedPosts()

      expect(result).toEqual(mockPosts)
      expect(mockListPosts).toHaveBeenCalledWith(
        { is_published: true },
        { order: { published_at: "DESC" } }
      )
    })

    it("should return empty array when no published posts exist", async () => {
      mockListPosts.mockResolvedValue([])

      const result = await service.listPublishedPosts()

      expect(result).toEqual([])
      expect(mockListPosts).toHaveBeenCalledWith(
        { is_published: true },
        { order: { published_at: "DESC" } }
      )
    })

    it("should handle errors from listPosts", async () => {
      const error = new Error("Database error")
      mockListPosts.mockRejectedValue(error)

      await expect(service.listPublishedPosts()).rejects.toThrow("Database error")
    })
  })

  describe("getPostBySlug", () => {
    it("should return post when slug exists", async () => {
      const mockPost = { id: "post_1", slug: "test-post", title: "Test Post" }
      mockListPosts.mockResolvedValue([mockPost])

      const result = await service.getPostBySlug("test-post")

      expect(result).toEqual(mockPost)
      expect(mockListPosts).toHaveBeenCalledWith({ slug: "test-post" })
    })

    it("should return undefined when slug does not exist", async () => {
      mockListPosts.mockResolvedValue([])

      const result = await service.getPostBySlug("non-existent")

      expect(result).toBeUndefined()
      expect(mockListPosts).toHaveBeenCalledWith({ slug: "non-existent" })
    })

    it("should handle special characters in slug", async () => {
      const mockPost = { id: "post_1", slug: "test-post-2024", title: "Test Post 2024" }
      mockListPosts.mockResolvedValue([mockPost])

      const result = await service.getPostBySlug("test-post-2024")

      expect(result).toEqual(mockPost)
    })

    it("should handle errors from listPosts", async () => {
      const error = new Error("Database error")
      mockListPosts.mockRejectedValue(error)

      await expect(service.getPostBySlug("test")).rejects.toThrow("Database error")
    })
  })

  describe("getPostsByProductId", () => {
    it("should return published posts containing the product ID", async () => {
      const mockPosts = [
        { id: "post_1", product_ids: ["prod_1", "prod_2"], is_published: true },
        { id: "post_2", product_ids: ["prod_3"], is_published: true },
        { id: "post_3", product_ids: ["prod_1"], is_published: true },
      ]
      mockListPosts.mockResolvedValue(mockPosts)

      const result = await service.getPostsByProductId("prod_1")

      expect(result).toHaveLength(2)
      expect(result[0].id).toBe("post_1")
      expect(result[1].id).toBe("post_3")
      expect(mockListPosts).toHaveBeenCalledWith({ is_published: true })
    })

    it("should return empty array when no posts contain the product ID", async () => {
      const mockPosts = [
        { id: "post_1", product_ids: ["prod_2"], is_published: true },
      ]
      mockListPosts.mockResolvedValue(mockPosts)

      const result = await service.getPostsByProductId("prod_999")

      expect(result).toEqual([])
    })

    it("should handle posts with null/undefined product_ids", async () => {
      const mockPosts = [
        { id: "post_1", product_ids: null, is_published: true },
        { id: "post_2", product_ids: undefined, is_published: true },
        { id: "post_3", product_ids: ["prod_1"], is_published: true },
      ]
      mockListPosts.mockResolvedValue(mockPosts)

      const result = await service.getPostsByProductId("prod_1")

      expect(result).toHaveLength(1)
      expect(result[0].id).toBe("post_3")
    })

    it("should handle empty product_ids array", async () => {
      const mockPosts = [
        { id: "post_1", product_ids: [], is_published: true },
      ]
      mockListPosts.mockResolvedValue(mockPosts)

      const result = await service.getPostsByProductId("prod_1")

      expect(result).toEqual([])
    })
  })

  describe("linkProductsToPost", () => {
    it("should replace product IDs on a post", async () => {
      const mockUpdatedPost = { id: "post_1", product_ids: ["prod_1", "prod_2"] }
      mockUpdatePosts.mockResolvedValue(mockUpdatedPost)

      const result = await service.linkProductsToPost("post_1", ["prod_1", "prod_2"])

      expect(result).toEqual(mockUpdatedPost)
      expect(mockUpdatePosts).toHaveBeenCalledWith(
        { id: "post_1" },
        { product_ids: ["prod_1", "prod_2"] }
      )
    })

    it("should handle empty product IDs array", async () => {
      const mockUpdatedPost = { id: "post_1", product_ids: [] }
      mockUpdatePosts.mockResolvedValue(mockUpdatedPost)

      const result = await service.linkProductsToPost("post_1", [])

      expect(result).toEqual(mockUpdatedPost)
      expect(mockUpdatePosts).toHaveBeenCalledWith(
        { id: "post_1" },
        { product_ids: [] }
      )
    })

    it("should handle errors from updatePosts", async () => {
      const error = new Error("Update failed")
      mockUpdatePosts.mockRejectedValue(error)

      await expect(service.linkProductsToPost("post_1", ["prod_1"])).rejects.toThrow("Update failed")
    })
  })

  describe("addProductsToPost", () => {
    it("should append new product IDs to existing ones", async () => {
      const mockPost = { id: "post_1", product_ids: ["prod_1", "prod_2"] }
      const mockUpdatedPost = { id: "post_1", product_ids: ["prod_1", "prod_2", "prod_3"] }
      mockRetrievePost.mockResolvedValue(mockPost)
      mockUpdatePosts.mockResolvedValue(mockUpdatedPost)

      const result = await service.addProductsToPost("post_1", ["prod_3"])

      expect(result).toEqual(mockUpdatedPost)
      expect(mockRetrievePost).toHaveBeenCalledWith("post_1")
      expect(mockUpdatePosts).toHaveBeenCalledWith(
        { id: "post_1" },
        { product_ids: ["prod_1", "prod_2", "prod_3"] }
      )
    })

    it("should deduplicate product IDs", async () => {
      const mockPost = { id: "post_1", product_ids: ["prod_1", "prod_2"] }
      const mockUpdatedPost = { id: "post_1", product_ids: ["prod_1", "prod_2"] }
      mockRetrievePost.mockResolvedValue(mockPost)
      mockUpdatePosts.mockResolvedValue(mockUpdatedPost)

      const result = await service.addProductsToPost("post_1", ["prod_1", "prod_2"])

      expect(result).toEqual(mockUpdatedPost)
      expect(mockUpdatePosts).toHaveBeenCalledWith(
        { id: "post_1" },
        { product_ids: ["prod_1", "prod_2"] }
      )
    })

    it("should handle post with no existing product_ids", async () => {
      const mockPost = { id: "post_1", product_ids: null }
      const mockUpdatedPost = { id: "post_1", product_ids: ["prod_1"] }
      mockRetrievePost.mockResolvedValue(mockPost)
      mockUpdatePosts.mockResolvedValue(mockUpdatedPost)

      const result = await service.addProductsToPost("post_1", ["prod_1"])

      expect(result).toEqual(mockUpdatedPost)
      expect(mockUpdatePosts).toHaveBeenCalledWith(
        { id: "post_1" },
        { product_ids: ["prod_1"] }
      )
    })

    it("should handle multiple new product IDs", async () => {
      const mockPost = { id: "post_1", product_ids: ["prod_1"] }
      const mockUpdatedPost = { id: "post_1", product_ids: ["prod_1", "prod_2", "prod_3", "prod_4"] }
      mockRetrievePost.mockResolvedValue(mockPost)
      mockUpdatePosts.mockResolvedValue(mockUpdatedPost)

      const result = await service.addProductsToPost("post_1", ["prod_2", "prod_3", "prod_4"])

      expect(result).toEqual(mockUpdatedPost)
    })
  })

  describe("removeProductsFromPost", () => {
    it("should remove specified product IDs from post", async () => {
      const mockPost = { id: "post_1", product_ids: ["prod_1", "prod_2", "prod_3"] }
      const mockUpdatedPost = { id: "post_1", product_ids: ["prod_1"] }
      mockRetrievePost.mockResolvedValue(mockPost)
      mockUpdatePosts.mockResolvedValue(mockUpdatedPost)

      const result = await service.removeProductsFromPost("post_1", ["prod_2", "prod_3"])

      expect(result).toEqual(mockUpdatedPost)
      expect(mockRetrievePost).toHaveBeenCalledWith("post_1")
      expect(mockUpdatePosts).toHaveBeenCalledWith(
        { id: "post_1" },
        { product_ids: ["prod_1"] }
      )
    })

    it("should handle removing all product IDs", async () => {
      const mockPost = { id: "post_1", product_ids: ["prod_1", "prod_2"] }
      const mockUpdatedPost = { id: "post_1", product_ids: [] }
      mockRetrievePost.mockResolvedValue(mockPost)
      mockUpdatePosts.mockResolvedValue(mockUpdatedPost)

      const result = await service.removeProductsFromPost("post_1", ["prod_1", "prod_2"])

      expect(result).toEqual(mockUpdatedPost)
      expect(mockUpdatePosts).toHaveBeenCalledWith(
        { id: "post_1" },
        { product_ids: [] }
      )
    })

    it("should handle removing non-existent product IDs", async () => {
      const mockPost = { id: "post_1", product_ids: ["prod_1", "prod_2"] }
      const mockUpdatedPost = { id: "post_1", product_ids: ["prod_1", "prod_2"] }
      mockRetrievePost.mockResolvedValue(mockPost)
      mockUpdatePosts.mockResolvedValue(mockUpdatedPost)

      const result = await service.removeProductsFromPost("post_1", ["prod_999"])

      expect(result).toEqual(mockUpdatedPost)
      expect(mockUpdatePosts).toHaveBeenCalledWith(
        { id: "post_1" },
        { product_ids: ["prod_1", "prod_2"] }
      )
    })

    it("should handle post with null product_ids", async () => {
      const mockPost = { id: "post_1", product_ids: null }
      const mockUpdatedPost = { id: "post_1", product_ids: [] }
      mockRetrievePost.mockResolvedValue(mockPost)
      mockUpdatePosts.mockResolvedValue(mockUpdatedPost)

      const result = await service.removeProductsFromPost("post_1", ["prod_1"])

      expect(result).toEqual(mockUpdatedPost)
      expect(mockUpdatePosts).toHaveBeenCalledWith(
        { id: "post_1" },
        { product_ids: [] }
      )
    })
  })

  describe("getCategoryBySlug", () => {
    it("should return category when slug exists", async () => {
      const mockCategory = { id: "cat_1", slug: "tours", name: "Tours" }
      mockListCategories.mockResolvedValue([mockCategory])

      const result = await service.getCategoryBySlug("tours")

      expect(result).toEqual(mockCategory)
      expect(mockListCategories).toHaveBeenCalledWith({ slug: "tours" })
    })

    it("should return undefined when slug does not exist", async () => {
      mockListCategories.mockResolvedValue([])

      const result = await service.getCategoryBySlug("non-existent")

      expect(result).toBeUndefined()
      expect(mockListCategories).toHaveBeenCalledWith({ slug: "non-existent" })
    })

    it("should handle errors from listCategories", async () => {
      const error = new Error("Database error")
      mockListCategories.mockRejectedValue(error)

      await expect(service.getCategoryBySlug("test")).rejects.toThrow("Database error")
    })
  })

  describe("getPostsByCategory", () => {
    it("should return published posts for category ordered by published_at DESC", async () => {
      const mockPosts = [
        { id: "post_1", category_id: "cat_1", is_published: true, published_at: new Date("2025-01-10") },
        { id: "post_2", category_id: "cat_1", is_published: true, published_at: new Date("2025-01-09") },
      ]
      mockListPosts.mockResolvedValue(mockPosts)

      const result = await service.getPostsByCategory("cat_1")

      expect(result).toEqual(mockPosts)
      expect(mockListPosts).toHaveBeenCalledWith(
        { category_id: "cat_1", is_published: true },
        { order: { published_at: "DESC" } }
      )
    })

    it("should include unpublished posts when publishedOnly is false", async () => {
      const mockPosts = [
        { id: "post_1", category_id: "cat_1", is_published: true },
        { id: "post_2", category_id: "cat_1", is_published: false },
      ]
      mockListPosts.mockResolvedValue(mockPosts)

      const result = await service.getPostsByCategory("cat_1", false)

      expect(result).toEqual(mockPosts)
      expect(mockListPosts).toHaveBeenCalledWith(
        { category_id: "cat_1" },
        { order: { published_at: "DESC" } }
      )
    })

    it("should return empty array when category has no posts", async () => {
      mockListPosts.mockResolvedValue([])

      const result = await service.getPostsByCategory("cat_999")

      expect(result).toEqual([])
    })

    it("should default publishedOnly to true", async () => {
      mockListPosts.mockResolvedValue([])

      await service.getPostsByCategory("cat_1")

      expect(mockListPosts).toHaveBeenCalledWith(
        { category_id: "cat_1", is_published: true },
        { order: { published_at: "DESC" } }
      )
    })
  })

  describe("getPostsByAuthor", () => {
    it("should return published posts for author ordered by published_at DESC", async () => {
      const mockPosts = [
        { id: "post_1", author_id: "author_1", is_published: true, published_at: new Date("2025-01-10") },
        { id: "post_2", author_id: "author_1", is_published: true, published_at: new Date("2025-01-09") },
      ]
      mockListPosts.mockResolvedValue(mockPosts)

      const result = await service.getPostsByAuthor("author_1")

      expect(result).toEqual(mockPosts)
      expect(mockListPosts).toHaveBeenCalledWith(
        { author_id: "author_1", is_published: true },
        { order: { published_at: "DESC" } }
      )
    })

    it("should include unpublished posts when publishedOnly is false", async () => {
      const mockPosts = [
        { id: "post_1", author_id: "author_1", is_published: true },
        { id: "post_2", author_id: "author_1", is_published: false },
      ]
      mockListPosts.mockResolvedValue(mockPosts)

      const result = await service.getPostsByAuthor("author_1", false)

      expect(result).toEqual(mockPosts)
      expect(mockListPosts).toHaveBeenCalledWith(
        { author_id: "author_1" },
        { order: { published_at: "DESC" } }
      )
    })

    it("should return empty array when author has no posts", async () => {
      mockListPosts.mockResolvedValue([])

      const result = await service.getPostsByAuthor("author_999")

      expect(result).toEqual([])
    })

    it("should default publishedOnly to true", async () => {
      mockListPosts.mockResolvedValue([])

      await service.getPostsByAuthor("author_1")

      expect(mockListPosts).toHaveBeenCalledWith(
        { author_id: "author_1", is_published: true },
        { order: { published_at: "DESC" } }
      )
    })
  })

  describe("publishPost", () => {
    it("should set is_published to true and set published_at timestamp", async () => {
      const mockUpdatedPost = {
        id: "post_1",
        is_published: true,
        published_at: expect.any(Date),
      }
      mockUpdatePosts.mockResolvedValue(mockUpdatedPost)

      const result = await service.publishPost("post_1")

      expect(result).toEqual(mockUpdatedPost)
      expect(mockUpdatePosts).toHaveBeenCalledWith(
        { id: "post_1" },
        {
          is_published: true,
          published_at: expect.any(Date),
        }
      )
    })

    it("should handle errors from updatePosts", async () => {
      const error = new Error("Update failed")
      mockUpdatePosts.mockRejectedValue(error)

      await expect(service.publishPost("post_1")).rejects.toThrow("Update failed")
    })
  })

  describe("unpublishPost", () => {
    it("should set is_published to false and clear published_at", async () => {
      const mockUpdatedPost = {
        id: "post_1",
        is_published: false,
        published_at: null,
      }
      mockUpdatePosts.mockResolvedValue(mockUpdatedPost)

      const result = await service.unpublishPost("post_1")

      expect(result).toEqual(mockUpdatedPost)
      expect(mockUpdatePosts).toHaveBeenCalledWith(
        { id: "post_1" },
        {
          is_published: false,
          published_at: null,
        }
      )
    })

    it("should handle errors from updatePosts", async () => {
      const error = new Error("Update failed")
      mockUpdatePosts.mockRejectedValue(error)

      await expect(service.unpublishPost("post_1")).rejects.toThrow("Update failed")
    })
  })
})
