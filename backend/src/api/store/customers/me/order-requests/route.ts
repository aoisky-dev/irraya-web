import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { authenticateCustomer } from "../../../../../lib/customer-auth"
import { createCustomerOrderRequest, listCustomerOrderRequests } from "../../../../../lib/customer-order-management"

type CreateOrderRequestBody = {
  order_id?: unknown
  request_type?: unknown
  reason?: unknown
  notes?: unknown
  items?: unknown
}

const normalizeString = (value: unknown): string => (typeof value === "string" ? value.trim() : "")

async function requireCustomer(req: MedusaRequest, res: MedusaResponse) {
  const customer = await authenticateCustomer(req.headers.authorization)
  if (!customer) {
    res.status(401).json({ message: "Sign in to manage order requests." })
    return null
  }
  return customer
}

export async function GET(req: MedusaRequest, res: MedusaResponse): Promise<void> {
  const customer = await requireCustomer(req, res)
  if (!customer) return

  try {
    const requests = await listCustomerOrderRequests({
      customerId: customer.customerId,
      orderId: normalizeString(req.query?.order_id) || undefined
    })
    res.status(200).json({ requests })
  } catch (error: unknown) {
    res.status(500).json({ message: error instanceof Error ? error.message : "Failed to load order requests." })
  }
}

export async function POST(req: MedusaRequest<CreateOrderRequestBody>, res: MedusaResponse): Promise<void> {
  const customer = await requireCustomer(req, res)
  if (!customer) return

  const body = (req.validatedBody ?? req.body ?? {}) as CreateOrderRequestBody

  try {
    const request = await createCustomerOrderRequest({
      customerId: customer.customerId,
      orderId: normalizeString(body.order_id),
      requestType: body.request_type,
      reason: normalizeString(body.reason),
      notes: normalizeString(body.notes),
      items: body.items
    })

    if (body.request_type === "exchange") {
      try {
        const logger = req.scope.resolve("logger")
        const shiprocketService = new (require("../../../../../modules/shiprocket/service").default)({ logger })
        const orderService = req.scope.resolve("orderModuleService") as any

        const order = await orderService.retrieveOrder(request.order_id, {
          relations: ["items", "shipping_address", "billing_address", "customer"],
        })

        if (order) {
          const exchangeItems = (request.items || []).map((exchangeItem: any) => {
            const orderItem = order.items?.find((i: any) => i.id === exchangeItem.item_id)
            return {
              sku: orderItem?.variant_sku || orderItem?.product_title || "SKU",
              name: orderItem?.product_title || "Exchange Item",
              units: exchangeItem.quantity || 1,
              selling_price: orderItem?.unit_price || 0,
            }
          })

          const subTotal = exchangeItems.reduce((acc: number, item: any) => acc + (Number(item.selling_price) * item.units), 0)

          const shiprocketPayload = {
            order_id: `EX-${order.display_id || order.id.split('_')[1]}-${Date.now().toString().slice(-4)}`,
            order_date: new Date().toISOString().split('T')[0],
            channel_id: "",
            pickup_customer_name: order.shipping_address?.first_name || order.customer?.first_name || "Customer",
            pickup_last_name: order.shipping_address?.last_name || order.customer?.last_name || "",
            pickup_address: order.shipping_address?.address_1 || "",
            pickup_address_2: order.shipping_address?.address_2 || "",
            pickup_city: order.shipping_address?.city || "",
            pickup_state: order.shipping_address?.province || "",
            pickup_country: order.shipping_address?.country_code || "IN",
            pickup_pincode: order.shipping_address?.postal_code || "",
            pickup_email: order.email || order.customer?.email || "",
            pickup_phone: order.shipping_address?.phone || order.customer?.phone || "9999999999",
            shipping_customer_name: "Irraya Warehouse",
            shipping_last_name: "",
            shipping_address: "Irraya Warehouse Address",
            shipping_address_2: "",
            shipping_city: "Hyderabad",
            shipping_country: "IN",
            shipping_pincode: process.env.SHIPROCKET_PICKUP_PINCODE || "500016",
            shipping_state: "Telangana",
            shipping_email: "support@irraya.com",
            shipping_phone: "9999999999",
            order_items: exchangeItems,
            payment_method: "Prepaid",
            shipping_charges: 0,
            giftwrap_charges: 0,
            transaction_charges: 0,
            total_discount: 0,
            sub_total: subTotal,
            length: 10,
            breadth: 10,
            height: 10,
            weight: 0.5
          }

          await shiprocketService.createReturnOrder(shiprocketPayload)
        }
      } catch (err: any) {
        req.scope.resolve("logger").error(`Shiprocket exchange failed: ${err.message}`)
      }
    }

    res.status(201).json({
      request,
      message: "Request submitted. Our team will review it and get back to you shortly."
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to submit order request."
    const status = /not found|already|outside|fulfilled|cancel/i.test(message) ? 400 : 500
    res.status(status).json({ message })
  }
}

