import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { cancelOrderWorkflow } from "@medusajs/core-flows"
import { createRazorpayRefund } from "../../../../../lib/razorpay"
import { upsertRazorpayPaymentReference } from "../../../../../lib/razorpay-payment-references"
import ShiprocketService from "../../../../../../modules/shiprocket/service"
import pg from "pg"

/** Convert Medusa paise amount to rupees for Shiprocket. */
const paisaToRupees = (paise: number | undefined | null): number =>
  Math.round((paise ?? 0)) / 100

const { Client } = pg

type UpdateStatusBody = {
  status: "approved" | "rejected" | "refunded" | "completed"
  notes?: string
}

const normalizeString = (value: unknown): string => (typeof value === "string" ? value.trim() : "")

export async function POST(req: MedusaRequest<UpdateStatusBody>, res: MedusaResponse): Promise<void> {
  const { id } = req.params
  const body = (req.validatedBody ?? req.body ?? {}) as UpdateStatusBody
  const status = normalizeString(body.status)
  const notes = normalizeString(body.notes)

  if (!["approved", "rejected", "refunded", "completed"].includes(status)) {
    res.status(400).json({ message: "Invalid status." })
    return
  }

  const client = new Client({ connectionString: process.env.DATABASE_URL })

  try {
    await client.connect()

    const result = await client.query(
      `update customer_order_requests
       set status = $1,
           notes = coalesce($2, notes),
           updated_at = now()
       where id = $3
       returning *`,
      [status, notes || null, id]
    )

    if (result.rowCount === 0) {
      res.status(404).json({ message: "Request not found." })
      return
    }

    const request = result.rows[0]

    // Update order metadata
    const summary = {
      id: request.id,
      type: request.request_type,
      status: request.status,
      reason: request.reason,
      created_at: request.created_at
    }

    await client.query(
      `update "order"
       set metadata = coalesce(metadata, '{}'::jsonb) || jsonb_build_object(
         'latest_customer_request', $1::jsonb,
         'customer_request_ids', (
           select coalesce(jsonb_agg(r.id order by r.created_at desc), '[]'::jsonb)
           from customer_order_requests r
           where r.order_id = $2
         )
       ),
       updated_at = now()
       where id = $2`,
      [JSON.stringify(summary), request.order_id]
    )

    // If this is a cancellation and it was approved, trigger Medusa's native order cancellation
    if (request.request_type === "cancel" && status === "approved") {
      let workflowSucceeded = false
      try {
        await cancelOrderWorkflow(req.scope).run({
          input: { order_id: request.order_id }
        })
        workflowSucceeded = true
        console.info(`[admin] Successfully native-canceled Medusa order ${request.order_id}`)
      } catch (cancelError) {
        console.error(`[admin] Failed to native-cancel Medusa order via workflow ${request.order_id}:`, cancelError)
        // Fallback: directly update the order status in the database
        // This ensures the frontend sees the cancelled status even if the workflow fails
        try {
          await client.query(
            `update "order" set status = 'canceled', canceled_at = now(), updated_at = now() where id = $1`,
            [request.order_id]
          )
          console.info(`[admin] Direct-canceled order ${request.order_id} in database as fallback`)
        } catch (directCancelError) {
          console.error(`[admin] Also failed to direct-cancel order ${request.order_id}:`, directCancelError)
          // Don't throw — the metadata already records the approved cancel,
          // and the frontend mapper now derives cancelled status from that
        }
      }

      // When the workflow fails, the order.canceled event never fires, so the razorpay-refund
      // subscriber won't run. Trigger the refund directly in that case.
      if (!workflowSucceeded) {
        try {
          const orderResult = await client.query(
            `select metadata from "order" where id = $1`,
            [request.order_id]
          )
          const orderMetadata = orderResult.rows[0]?.metadata
          const razorpayPaymentId = orderMetadata?.razorpay?.payment_id
          if (razorpayPaymentId) {
            const refundResult = await createRazorpayRefund({
              paymentId: razorpayPaymentId,
              notes: { reason: "order_canceled", order_id: request.order_id }
            })
            await upsertRazorpayPaymentReference({
              razorpayPaymentId,
              razorpayRefundId: typeof refundResult.id === "string" ? refundResult.id : undefined,
              status: "refund_pending",
              lastEvent: "order.canceled.refund_initiated.fallback"
            })
            console.info(`[admin] Fallback Razorpay refund initiated for order ${request.order_id}`)
          } else {
            console.info(`[admin] No razorpay payment_id on order ${request.order_id}, skipping refund`)
          }
        } catch (refundError) {
          console.error(`[admin] Failed to initiate fallback Razorpay refund for order ${request.order_id}:`, refundError)
        }
      }
    }

    // If this is an exchange and it was approved, store the exchange status on the order
    if (request.request_type === "exchange" && (status === "approved" || status === "completed")) {
      try {
        await client.query(
          `update "order"
           set metadata = coalesce(metadata, '{}'::jsonb) || jsonb_build_object(
             'exchange_status', $1
           ),
           updated_at = now()
           where id = $2`,
          [status, request.order_id]
        )
        
        if (status === "approved") {
          const logger = req.scope.resolve("logger")
          const shiprocketService = new ShiprocketService({ logger })
          const orderService = req.scope.resolve("orderModuleService") as any

          const order = await orderService.retrieveOrder(request.order_id, {
            relations: ["items", "shipping_address", "billing_address", "customer"],
          })

          if (order) {
            const exchangeItems = (request.items || []).map((exchangeItem: any) => {
              const orderItem = order.items?.find((i: any) => i.id === exchangeItem.item_id || i.product_id === exchangeItem.product_id)
              return {
                sku: orderItem?.variant_sku || orderItem?.product_title || "SKU",
                name: orderItem?.product_title || orderItem?.title || "Exchange Item",
                units: exchangeItem.quantity || 1,
                // unit_price is in paise — convert to rupees for Shiprocket
                selling_price: paisaToRupees(orderItem?.unit_price),
              }
            })

            const subTotal = exchangeItems.reduce((acc: number, item: any) => acc + (Number(item.selling_price) * item.units), 0)

            // Warehouse destination for the reverse pickup (customer → warehouse).
            // All fields must come from env vars — never use placeholder strings.
            const warehouseName = process.env.SHIPROCKET_WAREHOUSE_NAME || "Irraya Warehouse"
            const warehouseAddress = process.env.SHIPROCKET_WAREHOUSE_ADDRESS || ""
            const warehouseCity = process.env.SHIPROCKET_WAREHOUSE_CITY || "Hyderabad"
            const warehouseState = process.env.SHIPROCKET_WAREHOUSE_STATE || "Telangana"
            const warehousePincode = process.env.SHIPROCKET_PICKUP_PINCODE || ""
            const warehouseEmail = process.env.SHIPROCKET_WAREHOUSE_EMAIL || "support@irraya.com"
            const warehousePhone = process.env.SHIPROCKET_WAREHOUSE_PHONE || ""

            if (!warehouseAddress || !warehousePincode) {
              throw new Error("SHIPROCKET_WAREHOUSE_ADDRESS and SHIPROCKET_PICKUP_PINCODE must be set to create a return order")
            }

            // order_id for Shiprocket must be unique and ≤ 50 chars
            const srReturnOrderId = `EX-${order.display_id || order.id.split("_").pop()?.slice(-8)}-${Date.now().toString().slice(-4)}`.slice(0, 50)

            const shiprocketPayload = {
              order_id: srReturnOrderId,
              order_date: new Date().toISOString().split("T")[0],
              pickup_customer_name: order.shipping_address?.first_name || order.customer?.first_name || "Customer",
              pickup_last_name: order.shipping_address?.last_name || order.customer?.last_name || "",
              pickup_address: (order.shipping_address?.address_1 || "").slice(0, 150),
              pickup_address_2: order.shipping_address?.address_2 || "",
              pickup_city: order.shipping_address?.city || "",
              pickup_state: order.shipping_address?.province || "",
              pickup_country: (order.shipping_address?.country_code || "IN").toUpperCase(),
              pickup_pincode: order.shipping_address?.postal_code || "",
              pickup_email: order.email || order.customer?.email || "",
              pickup_phone: order.shipping_address?.phone || order.customer?.phone || "",
              shipping_customer_name: warehouseName,
              shipping_last_name: "",
              shipping_address: warehouseAddress,
              shipping_address_2: "",
              shipping_city: warehouseCity,
              shipping_country: "IN",
              shipping_pincode: warehousePincode,
              shipping_state: warehouseState,
              shipping_email: warehouseEmail,
              shipping_phone: warehousePhone,
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
            console.info(`[admin] Created Shiprocket return order for exchange ${request.order_id}`)
          }
        }
      } catch (exchangeError: any) {
        console.warn(`[admin] Failed to process exchange for order ${request.order_id}:`, exchangeError.message)
      }
    }

    res.status(200).json({ request })
  } catch (error: unknown) {
    res.status(500).json({ message: error instanceof Error ? error.message : "Failed to update request." })
  } finally {
    await client.end().catch(() => undefined)
  }
}
