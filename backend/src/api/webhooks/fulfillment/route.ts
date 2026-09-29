import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { Modules } from "@medusajs/framework/utils"
import { createOrderShipmentWorkflow, markOrderFulfillmentAsDeliveredWorkflow } from "@medusajs/core-flows"
export const POST = async (
  req: MedusaRequest,
  res: MedusaResponse
) => {
  // Verify webhook security token
  const expectedToken = process.env.SHIPROCKET_WEBHOOK_SECRET || "default_secret_replace_me"
  const providedToken = req.headers["x-api-key"]
  
  if (providedToken !== expectedToken) {
    return res.status(401).json({ message: "Unauthorized webhook request" })
  }

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
      fields: ["id", "metadata", "fulfillments.*", "fulfillments.items.*"],
      filters: { display_id: Number(orderId) }
    })
    if (ordersByDisplayId && ordersByDisplayId.length > 0) {
      order = ordersByDisplayId[0]
    }
  }

  // Fallback to id
  if (!order) {
    const { data: ordersById } = await query.graph({
      entity: "order",
      fields: ["id", "metadata", "fulfillments.*", "fulfillments.items.*"],
      filters: { id: orderId }
    })
    if (ordersById && ordersById.length > 0) {
      order = ordersById[0]
    }
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

  // 1. Update metadata so frontend gets the custom status updates
  await orderModuleService.updateOrders(order.id, {
    metadata: {
      ...metadata,
      shipment: {
        ...(typeof currentShipment === "object" ? currentShipment : {}),
        carrier: "Delhivery (via Shiprocket)",
        tracking_number: payload.awb || (currentShipment as any).tracking_number,
        tracking_url: payload.awb ? `https://shiprocket.co/tracking/${payload.awb}` : (currentShipment as any).tracking_url,
        status,
        ...(status === "delivered" && !(currentShipment as any).delivered_at ? { delivered_at: new Date().toISOString() } : {}),
      }
    }
  })

  // 2. If shipped or delivered, officially create the shipment in Medusa so Admin UI updates to "Shipped"
  if (status === "shipped" || status === "out_for_delivery" || status === "delivered") {
    // Find a fulfillment that hasn't been shipped yet
    const fulfillment = order.fulfillments?.find((f: any) => !f.shipped_at)
    if (fulfillment) {
      try {
        await createOrderShipmentWorkflow(req.scope).run({
          input: {
            order_id: order.id,
            fulfillment_id: fulfillment.id,
            items: fulfillment.items?.map((i: any) => ({
              id: i.line_item_id || i.id, 
              quantity: i.quantity,
            })) || [],
            labels: [
              {
                tracking_number: payload.awb || "",
                tracking_url: payload.awb ? `https://shiprocket.co/tracking/${payload.awb}` : "",
                label_url: "",
              }
            ],
          }
        })
        console.log(`Successfully created Medusa shipment for order ${order.id} based on Shiprocket webhook.`)
      } catch (err) {
        console.error("Failed to create Medusa shipment for order via webhook:", err)
      }
    }
  }

  // 3. If delivered, also mark the fulfillment as delivered in Medusa
  if (status === "delivered") {
    const shippedFulfillment = order.fulfillments?.find((f: any) => !f.delivered_at)
    if (shippedFulfillment) {
      try {
        await markOrderFulfillmentAsDeliveredWorkflow(req.scope).run({
          input: {
            orderId: order.id,
            fulfillmentId: shippedFulfillment.id,
          }
        })
        console.log(`Successfully marked fulfillment as delivered for order ${order.id}.`)
      } catch (err) {
        console.error("Failed to mark Medusa fulfillment as delivered via webhook:", err)
      }
    }
  }

  return res.status(200).json({ received: true })
}
