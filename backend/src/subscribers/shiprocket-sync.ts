import { SubscriberArgs, type SubscriberConfig } from "@medusajs/framework"
import { Modules } from "@medusajs/framework/utils"
import ShiprocketService from "../modules/shiprocket/service"

export default async function shiprocketOrderFulfillmentCreatedHandler({
  event: { data },
  container,
}: SubscriberArgs<{ order_id: string, fulfillment_id: string }>) {
  const orderModuleService = container.resolve(Modules.ORDER)
  const fulfillmentModuleService = container.resolve(Modules.FULFILLMENT)
  const logger = container.resolve("logger")
  const shiprocketService = new ShiprocketService({ logger })

  // order.fulfillment_created gives order_id and fulfillment_id
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

  // Format payload for Shiprocket Custom Order
  const payload = {
    order_id: (order.display_id || order.id) + (data.fulfillment_id ? `-${data.fulfillment_id.slice(-4)}` : ''),
    order_date: new Date(order.created_at).toISOString().split('T')[0],
    pickup_location: "Primary", // Requires a setup in Shiprocket
    billing_customer_name: order.shipping_address?.first_name || "Customer",
    billing_last_name: order.shipping_address?.last_name || "",
    billing_address: order.shipping_address?.address_1 || "N/A",
    billing_city: order.shipping_address?.city || "N/A",
    billing_pincode: order.shipping_address?.postal_code || "000000",
    billing_state: order.shipping_address?.province || "N/A",
    billing_country: order.shipping_address?.country_code || "IN",
    billing_email: order.email || "test@example.com",
    billing_phone: order.shipping_address?.phone || "0000000000",
    shipping_is_billing: true,
    order_items: fulfillmentItems.map((item: any) => ({
      name: item.title,
      sku: item.variant_sku || item.sku || "SKU",
      units: item.quantity,
      selling_price: item.unit_price || 0,
    })),
    payment_method: "Prepaid",
    sub_total: order.item_total || 0,
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
