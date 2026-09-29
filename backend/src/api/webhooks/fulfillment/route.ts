import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { Modules } from "@medusajs/framework/utils"
import { createOrderShipmentWorkflow, markOrderFulfillmentAsDeliveredWorkflow } from "@medusajs/core-flows"

export const GET = async (
  req: MedusaRequest,
  res: MedusaResponse
) => {
  return res.status(200).json({ received: true })
}

// Shiprocket current_status values → our internal status
// Covers forward shipment, delivery failures, and RTO (return-to-origin).
function mapShiprocketStatus(srStatus: string): string {
  switch (srStatus) {
    case "PICKED UP":
    case "SHIPPED":
    case "IN TRANSIT":
      return "shipped"
    case "OUT FOR DELIVERY":
      return "out_for_delivery"
    case "DELIVERED":
      return "delivered"
    case "UNDELIVERED":
    case "DELIVERY DELAYED":
    case "DELIVERY RESCHEDULED":
      return "undelivered"
    case "RTO INITIATED":
    case "RTO IN TRANSIT":
      return "rto_in_transit"
    case "RTO DELIVERED":
    case "RTO ACKNOWLEDGED":
      return "rto_delivered"
    case "CANCELLED":
      return "cancelled"
    default:
      return "processing"
  }
}

export const POST = async (
  req: MedusaRequest,
  res: MedusaResponse
) => {
  // Reject all requests if the webhook secret is not configured.
  // A missing env var is a misconfiguration — we must not accept unauthenticated webhooks.
  const expectedToken = process.env.SHIPROCKET_WEBHOOK_SECRET
  if (!expectedToken) {
    console.error("[shiprocket-webhook] SHIPROCKET_WEBHOOK_SECRET is not set — rejecting all webhook requests")
    return res.status(500).json({ message: "Webhook secret not configured on server." })
  }

  // Shiprocket can send the secret as a Bearer token or as x-api-key depending
  // on how the webhook URL was configured. Check both.
  const authHeader = req.headers["authorization"]
  const xApiKey = req.headers["x-api-key"]
  const bearerToken = typeof authHeader === "string" && authHeader.startsWith("Bearer ")
    ? authHeader.slice(7)
    : null

  const providedToken = bearerToken || xApiKey
  if (providedToken !== expectedToken) {
    return res.status(401).json({ message: "Unauthorized webhook request" })
  }

  const orderModuleService = req.scope.resolve(Modules.ORDER)
  const payload = req.body as any

  const orderId = payload.order_id

  // Return 200 for Shiprocket's test pings when the webhook URL is first registered
  if (!orderId || orderId === "test") {
    return res.status(200).json({ received: true, message: "Ping successful" })
  }

  const query = req.scope.resolve("query")

  let order: any = null

  // Try finding by display_id first (Shiprocket order_id is built from our display_id)
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

  // Fallback: match by Medusa order id or by shiprocket_order_id stored in metadata
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
    console.log(`[shiprocket-webhook] Unknown order_id "${orderId}" — ignoring.`)
    return res.status(200).json({ received: true, message: "Order not found" })
  }

  const srStatus = (typeof payload.current_status === "string" ? payload.current_status : "").toUpperCase().trim()
  const status = mapShiprocketStatus(srStatus)

  const metadata = order.metadata || {}
  const currentShipment = metadata.shipment || {}

  // 1. Always update metadata so the frontend sees the latest carrier status
  await orderModuleService.updateOrders(order.id, {
    metadata: {
      ...metadata,
      shipment: {
        ...(typeof currentShipment === "object" ? currentShipment : {}),
        carrier: "Delhivery (via Shiprocket)",
        tracking_number: payload.awb || (currentShipment as any).tracking_number,
        tracking_url: payload.awb
          ? `https://shiprocket.co/tracking/${payload.awb}`
          : (currentShipment as any).tracking_url,
        status,
        ...(status === "delivered" && !(currentShipment as any).delivered_at
          ? { delivered_at: new Date().toISOString() }
          : {}),
        ...(status.startsWith("rto") && !(currentShipment as any).rto_initiated_at
          ? { rto_initiated_at: new Date().toISOString() }
          : {}),
      }
    }
  })

  // 2. Create a Medusa shipment record when the carrier has picked up / is in transit
  const isForwardInTransit = status === "shipped" || status === "out_for_delivery" || status === "delivered"
  if (isForwardInTransit) {
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
        console.log(`[shiprocket-webhook] Created Medusa shipment for order ${order.id}`)
      } catch (err) {
        console.error("[shiprocket-webhook] Failed to create Medusa shipment:", err)
      }
    }
  }

  // 3. Mark the fulfillment as delivered in Medusa
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
        console.log(`[shiprocket-webhook] Marked fulfillment as delivered for order ${order.id}`)
      } catch (err) {
        console.error("[shiprocket-webhook] Failed to mark fulfillment as delivered:", err)
      }
    }
  }

  return res.status(200).json({ received: true })
}
