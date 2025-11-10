# Commerce Modules

In this chapter, you'll learn about Medusa's Commerce Modules.

## What is a Commerce Module?

Commerce Modules are built-in [modules](https://docs.medusajs.com/learn/fundamentals/modules) of Medusa that provide core commerce logic specific to domains like Products, Orders, Customers, Fulfillment, and much more.

Medusa's Commerce Modules are used to form Medusa's default [workflows](https://docs.medusajs.com/resources/medusa-workflows-reference) and [APIs](https://docs.medusajs.com/api/store). For example, when you call the add to cart endpoint. the add to cart workflow runs which uses the Product Module to check if the product exists, the Inventory Module to ensure the product is available in the inventory, and the Cart Module to finally add the product to the cart.

You'll find the details and steps of the add-to-cart workflow in [this workflow reference](https://docs.medusajs.com/resources/references/medusa-workflows/addToCartWorkflow)

The core commerce logic contained in Commerce Modules is also available directly when you are building customizations. This granular access to commerce functionality is unique and expands what's possible to build with Medusa drastically.

### List of Medusa's Commerce Modules

Refer to [this reference](https://docs.medusajs.com/resources/commerce-modules) for a full list of Commerce Modules in Medusa.

***

## Use Commerce Modules in Custom Flows

Similar to your [custom modules](https://docs.medusajs.com/learn/fundamentals/modules), the Medusa application registers a Commerce Module's service in the [container](https://docs.medusajs.com/learn/fundamentals/medusa-container). So, you can resolve it in your custom flows. This is useful as you build unique requirements extending core commerce features.

For example, consider you have a [workflow](https://docs.medusajs.com/learn/fundamentals/workflows) (a special function that performs a task in a series of steps with rollback mechanism) that needs a step to retrieve the total number of products. You can create a step in the workflow that resolves the Product Module's service from the container to use its methods:

```ts highlights={highlights}
import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"

export const countProductsStep = createStep(
  "count-products",
  async ({ }, { container }) => {
    const productModuleService = container.resolve("product")

    const [,count] = await productModuleService.listAndCountProducts()

    return new StepResponse(count)
  }
)
```

Your workflow can use services of both custom and Commerce Modules, supporting you in building custom flows without having to re-build core commerce features.
