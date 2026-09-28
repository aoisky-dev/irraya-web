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
    logger.info("Order missing or no shiprocket_order_id found in metadata, skipping cancelation")
    return
  }

  try {
    const srOrderId = order.metadata.shiprocket_order_id as number
    const result = await shiprocketService.cancelOrder([srOrderId])
    logger.info(`Shiprocket Order Canceled: ${JSON.stringify(result)}`)
  } catch (error) {
    logger.error(`Failed to cancel order in Shiprocket: ${error}`)
  }
}

export const config: SubscriberConfig = {
  event: "order.canceled",
}
