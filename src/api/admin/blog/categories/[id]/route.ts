import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import BlogModuleService from "../../../../../modules/blog/service"
import { BLOG_MODULE } from "../../../../../modules/blog"
import { handleAPIError } from "../../../../../lib/errors/error-handler"
import { logger } from "../../../../../lib/logger"

// GET /admin/blog/categories/:id - Get a single category
export async function GET(
  req: MedusaRequest,
  res: MedusaResponse
) {
  const requestLogger = logger.child({ endpoint: 'GET /admin/blog/categories/:id' })

  try {
    const blogModuleService: BlogModuleService = req.scope.resolve(BLOG_MODULE)
    const { id } = req.params

    requestLogger.debug('Fetching category', { categoryId: id })

    const category = await blogModuleService.retrieveCategory(id)

    if (!category) {
      return res.status(404).json({
        message: "Category not found"
      })
    }

    requestLogger.info('Category retrieved successfully', { categoryId: id })

    res.json({
      category,
    })
  } catch (error) {
    requestLogger.error('Failed to retrieve category', error instanceof Error ? error : undefined)
    handleAPIError(error, res)
  }
}

// PUT /admin/blog/categories/:id - Update a category
export async function PUT(
  req: MedusaRequest,
  res: MedusaResponse
) {
  const requestLogger = logger.child({ endpoint: 'PUT /admin/blog/categories/:id' })

  try {
    const blogModuleService: BlogModuleService = req.scope.resolve(BLOG_MODULE)
    const { id } = req.params
    const { name, slug, description } = req.body

    requestLogger.debug('Updating category', { categoryId: id })

    const updateData: any = {}
    if (name !== undefined) updateData.name = name
    if (slug !== undefined) updateData.slug = slug
    if (description !== undefined) updateData.description = description

    const category = await blogModuleService.updateCategories(id, updateData)

    requestLogger.info('Category updated successfully', { categoryId: id })

    res.json({
      category,
    })
  } catch (error) {
    requestLogger.error('Failed to update category', error instanceof Error ? error : undefined)
    handleAPIError(error, res)
  }
}

// DELETE /admin/blog/categories/:id - Delete a category
export async function DELETE(
  req: MedusaRequest,
  res: MedusaResponse
) {
  const requestLogger = logger.child({ endpoint: 'DELETE /admin/blog/categories/:id' })

  try {
    const blogModuleService: BlogModuleService = req.scope.resolve(BLOG_MODULE)
    const { id } = req.params

    requestLogger.debug('Deleting category', { categoryId: id })

    await blogModuleService.deleteCategories(id)

    requestLogger.info('Category deleted successfully', { categoryId: id })

    res.status(204).send()
  } catch (error) {
    requestLogger.error('Failed to delete category', error instanceof Error ? error : undefined)
    handleAPIError(error, res)
  }
}
