import { model } from "@medusajs/framework/utils"

const Category = model.define("category", {
  id: model.id().primaryKey(),
  name: model.text(),
  slug: model.text(),
  description: model.text().nullable(),
})

export default Category
