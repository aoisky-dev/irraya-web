import { SubscriberArgs, type SubscriberConfig } from "@medusajs/framework"
import { Modules } from "@medusajs/framework/utils"
import { createOrderFulfillmentWorkflow } from "@medusajs/core-flows"

export default async function orderAutoFulfillHandler({
  event: { data },
  container,
}: SubscriberArgs<{ id: string }>) {
  const orderModuleService = container.resolve(Modules.ORDER)
  const productModuleService = container.resolve(Modules.PRODUCT)
  
  const order = await orderModuleService.retrieveOrder(data.id, {
    relations: ["items"],
  })

  if (!order || !order.items || order.items.length === 0) return

  const itemsToFulfill: any[] = []

  for (const item of order.items) {
    if (!item.product_id) continue
    try {
      const product = await productModuleService.retrieveProduct(item.product_id)
      const metadata = product.metadata || {}
      if (metadata.auto_fulfill === "true" || metadata.auto_fulfill === true) {
        itemsToFulfill.push({
          id: item.id,
          quantity: item.quantity
        })
      }
    } catch (e) {
      // product might not exist or error
    }
  }

  if (itemsToFulfill.length > 0) {
    console.log(`Auto-fulfilling ${itemsToFulfill.length} items for order ${order.id}`)
    try {
      await createOrderFulfillmentWorkflow(container).run({
        input: {
          order_id: order.id,
          items: itemsToFulfill
        }
      })
      console.log(`Successfully auto-fulfilled order ${order.id}`)
    } catch (error) {
      console.error(`Failed to auto-fulfill order ${order.id}:`, error)
    }
  }
}

export const config: SubscriberConfig = {
  event: "order.placed",
}
