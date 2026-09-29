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
  const logger = container.resolve("logger")
  const shiprocketService = new ShiprocketService({ logger })

  const orderId = data.order_id || (data as any).id
  if (!orderId) return

  const order = await orderModuleService.retrieveOrder(orderId, {
    relations: ["shipping_address", "customer"],
  })

  if (!order) return

  let fulfillmentItems: any[] = []
  if (data.fulfillment_id) {
    try {
      const fulfillment = await fulfillmentModuleService.retrieveFulfillment(data.fulfillment_id, {
        relations: ["items"]
      })
      fulfillmentItems = fulfillment.items || []
    } catch (e) {
      console.warn("Could not retrieve fulfillment items", e)
    }
  }

  // Fallback to order items if fulfillment retrieval fails or items missing
  if (fulfillmentItems.length === 0) {
    const fullOrder = await orderModuleService.retrieveOrder(orderId, { relations: ["items"] })
    fulfillmentItems = fullOrder.items || []
  }

  const payload = {
    order_id: buildShiprocketOrderId(order.display_id, order.id, data.fulfillment_id),
    order_date: new Date(order.created_at).toISOString().split("T")[0],
    pickup_location: "Primary",
    billing_customer_name: order.shipping_address?.first_name || "Customer",
    billing_last_name: order.shipping_address?.last_name || "",
    billing_address: (order.shipping_address?.address_1 || "N/A").slice(0, 150),
    billing_city: order.shipping_address?.city || "N/A",
    billing_pincode: order.shipping_address?.postal_code || "000000",
    billing_state: order.shipping_address?.province || "N/A",
    billing_country: (order.shipping_address?.country_code || "IN").toUpperCase(),
    billing_email: order.email || "noreply@irraya.com",
    billing_phone: order.shipping_address?.phone || "0000000000",
    shipping_is_billing: true,
    order_items: fulfillmentItems.map((item: any) => ({
      // item.title may be absent; fall back through line_item and product title
      name: item.title || item.line_item?.title || item.product_title || "Item",
      sku: item.variant_sku || item.sku || item.line_item?.variant_sku || "SKU",
      units: item.quantity,
      selling_price: paisaToRupees(item.unit_price ?? item.line_item?.unit_price),
    })),
    payment_method: "Prepaid",
    sub_total: paisaToRupees(order.item_total),
    length: 10,
    breadth: 10,
    height: 10,
    weight: 0.5,
  }

  try {
    const srOrder = await shiprocketService.createOrder(payload)
    console.log("Shiprocket Order Created: ", srOrder)

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
