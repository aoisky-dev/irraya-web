import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { Modules } from "@medusajs/framework/utils"

export const POST = async (
  req: MedusaRequest,
  res: MedusaResponse
) => {
  const orderModuleService = req.scope.resolve(Modules.ORDER)
  const payload = req.body as any

  // Shiprocket webhook payload has current_status, awb, order_id
  const orderId = payload.order_id
  if (!orderId) {
    return res.status(400).json({ message: "No order_id in payload" })
  }

  const query = req.scope.resolve("query")
  
  let order: any = null

  // Try finding by display_id first
  if (!isNaN(Number(orderId))) {
    const { data: ordersByDisplayId } = await query.graph({
      entity: "order",
      fields: ["id", "metadata"],
      filters: { display_id: Number(orderId) }
    })
    if (ordersByDisplayId && ordersByDisplayId.length > 0) {
      order = ordersByDisplayId[0]
    }
  }

  // Fallback to id
  if (!order) {
    const orders = await orderModuleService.listOrders({ id: orderId })
    order = orders[0]
  }

  if (!order) {
    return res.status(404).json({ message: "Order not found" })
  }


  const srStatus = payload.current_status?.toUpperCase() || ""
  let status = "processing"

  if (["PICKED UP", "SHIPPED", "IN TRANSIT"].includes(srStatus)) {
    status = "shipped"
  } else if (["OUT FOR DELIVERY"].includes(srStatus)) {
    status = "out_for_delivery"
  } else if (["DELIVERED"].includes(srStatus)) {
    status = "delivered"
  }

  const metadata = order.metadata || {}
  const currentShipment = metadata.shipment || {}

  await orderModuleService.updateOrders(order.id, {
    metadata: {
      ...metadata,
      shipment: {
        ...(typeof currentShipment === "object" ? currentShipment : {}),
        carrier: "Delhivery (via Shiprocket)",
        tracking_number: payload.awb || (currentShipment as any).tracking_number,
        tracking_url: payload.awb ? `https://shiprocket.co/tracking/${payload.awb}` : (currentShipment as any).tracking_url,
        status,
      }
    }
  })

  return res.status(200).json({ received: true })
}
