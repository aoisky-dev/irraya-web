import { SubscriberArgs, type SubscriberConfig } from "@medusajs/framework"
import { Modules } from "@medusajs/framework/utils"
import ShiprocketService from "../modules/shiprocket/service"

/** Shiprocket order_id must be unique and ≤ 50 characters. */
function buildShiprocketOrderId(displayId: number | undefined, orderId: string, fulfillmentId: string | undefined): string {
  const suffix = fulfillmentId ? `-${fulfillmentId.slice(-4)}` : ""
  // Prefer display_id (short integer). Fall back to the last 8 chars of the UUID.
  const base = displayId ? String(displayId) : orderId.split("_").pop()?.slice(-8) || orderId.slice(-8)
  const full = `${base}${suffix}`
  // Hard cap at 50 chars (Shiprocket limit)
  return full.slice(0, 50)
}

/** Convert Medusa monetary amount (paise) to rupees for Shiprocket. */
function paisaToRupees(paise: number | undefined | null): number {
  if (!paise || !Number.isFinite(paise)) return 0
  return Math.round(paise) / 100
}

export default async function shiprocketOrderFulfillmentCreatedHandler({
  event: { data },
  container,
}: SubscriberArgs<{ order_id: string, fulfillment_id: string }>) {
  const orderModuleService = container.resolve(Modules.ORDER)
  const fulfillmentModuleService = container.resolve(Modules.FULFILLMENT)
  const query = container.resolve("query")
  const logger = container.resolve("logger")
  const shiprocketService = new ShiprocketService({ logger })

  const orderId = data.order_id || (data as any).id
  if (!orderId) return

  const { data: orders } = await query.graph({
    entity: "order",
    fields: [
      "id", "display_id", "email", "created_at", "metadata",
      "summary.*",
      "shipping_address.*",
      "customer.*",
      "items.*",
      "items.item.*",
      "fulfillments.*",
      "fulfillments.items.*"
    ],
    filters: { id: orderId }
  })
  const order = orders?.[0]

  if (!order) return

  // Guard: all fields required for Shiprocket — refuse to create an order with
  // a fake/incomplete address rather than silently shipping to nowhere
  const addr = order.shipping_address
  const missingFields: string[] = []
  if (!addr?.first_name) missingFields.push("first_name")
  if (!addr?.address_1) missingFields.push("address_1")
  if (!addr?.city) missingFields.push("city")
  if (!addr?.province) missingFields.push("province")
  if (!addr?.postal_code) missingFields.push("postal_code")
  if (!addr?.phone) missingFields.push("phone")
  if (missingFields.length > 0) {
    logger.error(`[shiprocket-sync] Aborting — shipping address missing required fields: ${missingFields.join(", ")} (order ${orderId})`)
    return
  }

  let fulfillmentItems: any[] = []
  if (data.fulfillment_id) {
    const fulfillment = order.fulfillments?.find((f: any) => f.id === data.fulfillment_id)
    if (fulfillment) {
      fulfillmentItems = fulfillment.items || []
    }
  }

  // Fallback to order items if fulfillment retrieval fails or items missing
  if (fulfillmentItems.length === 0) {
    fulfillmentItems = order.items?.map((i: any) => ({
      ...i,
      line_item_id: i.item_id || i.item?.id,
      quantity: i.quantity
    })) || []
  }

  // Order Total
  // Using original_order_total or current_order_total from the summary object
  const orderTotalPaise = order.summary?.original_order_total ?? order.summary?.current_order_total ?? order.total ?? 0

  const payload = {
    order_id: buildShiprocketOrderId(order.display_id, order.id, data.fulfillment_id),
    order_date: new Date(order.created_at).toISOString().split("T")[0],
    pickup_location: "Primary",
    billing_customer_name: addr!.first_name,
    billing_last_name: addr!.last_name || "",
    billing_address: addr!.address_1!.slice(0, 150),
    billing_address_2: (addr!.address_2 || "").slice(0, 150),
    billing_city: addr!.city,
    billing_pincode: addr!.postal_code,
    billing_state: addr!.province,
    billing_country: (addr!.country_code || "IN").toUpperCase(),
    billing_email: order.email || "noreply@irraya.com",
    billing_phone: addr!.phone!.replace(/\D/g, "").slice(-10),
    shipping_is_billing: true,
    shipping_customer_name: addr!.first_name,
    shipping_last_name: addr!.last_name || "",
    shipping_address: addr!.address_1!.slice(0, 150),
    shipping_address_2: (addr!.address_2 || "").slice(0, 150),
    shipping_city: addr!.city,
    shipping_pincode: addr!.postal_code,
    shipping_state: addr!.province,
    shipping_country: (addr!.country_code || "IN").toUpperCase(),
    shipping_email: order.email || "noreply@irraya.com",
    shipping_phone: addr!.phone!.replace(/\D/g, "").slice(-10),
    order_items: fulfillmentItems.map((item: any) => {
      // Find matching order line item for pricing
      const orderItem = order.items?.find((i: any) => (i.item_id === item.line_item_id) || (i.item?.id === item.line_item_id) || (i.id === item.id))
      const unitPrice = orderItem?.item?.unit_price ?? orderItem?.unit_price ?? item.unit_price ?? 0
      const title = orderItem?.item?.product_title || orderItem?.item?.title || item.product_title || item.title || "Item"
      const sku = orderItem?.item?.variant_sku || item.variant_sku || item.sku || "SKU"
      
      return {
        name: title,
        sku: sku,
        units: item.quantity,
        selling_price: Math.max(1, paisaToRupees(unitPrice)),
      }
    }),
    payment_method: "Prepaid",
    sub_total: Math.max(1, paisaToRupees(Number(orderTotalPaise))),
    length: 10,
    breadth: 10,
    height: 10,
    weight: 0.5,
  }

  logger.info(`[shiprocket-sync] Creating order with payload: ${JSON.stringify(payload)}`)

  try {
    const srOrder = await shiprocketService.createOrder(payload)
    logger.info(`[shiprocket-sync] Order created: ${JSON.stringify(srOrder)}`)

    if (srOrder && srOrder.order_id) {
      await orderModuleService.updateOrders(order.id, {
        metadata: {
          ...(order.metadata || {}),
          shiprocket_order_id: srOrder.order_id
        }
      })
    }
  } catch (error) {
    console.error("Failed to sync order to Shiprocket", error)
  }

}

export const config: SubscriberConfig = {
  event: "order.fulfillment_created",
}
