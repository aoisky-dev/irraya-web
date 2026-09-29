import { SubscriberArgs, type SubscriberConfig } from "@medusajs/framework"
import { Modules } from "@medusajs/framework/utils"
import ShiprocketService from "../modules/shiprocket/service"

export default async function shiprocketOrderCanceledHandler({
  event: { data },
  container,
}: SubscriberArgs<{ id: string }>) {
  const orderModuleService = container.resolve(Modules.ORDER)
  const logger = container.resolve("logger")
  const shiprocketService = new ShiprocketService({ logger })

  const order = await orderModuleService.retrieveOrder(data.id)

  if (!order || !order.metadata?.shiprocket_order_id) {
    logger.info("Order missing or no shiprocket_order_id found in metadata, skipping cancellation")
    return
  }

  // Metadata is JSONB — the stored value may come back as a string or number.
  // Shiprocket cancel expects an array of integer order IDs.
  const srOrderId = Number(order.metadata.shiprocket_order_id)
  if (!Number.isFinite(srOrderId) || srOrderId <= 0) {
    logger.warn(`Invalid shiprocket_order_id "${order.metadata.shiprocket_order_id}" on order ${data.id}, skipping`)
    return
  }

  try {
    const result = await shiprocketService.cancelOrder([srOrderId])
    logger.info(`Shiprocket Order Cancelled: ${JSON.stringify(result)}`)
  } catch (error) {
    logger.error(`Failed to cancel order in Shiprocket: ${error}`)
  }
}

export const config: SubscriberConfig = {
  event: "order.canceled",
}
