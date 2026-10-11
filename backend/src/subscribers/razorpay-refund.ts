import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework"
import { Modules } from "@medusajs/framework/utils"
import { createRazorpayRefund } from "../lib/razorpay"
import { upsertRazorpayPaymentReference } from "../lib/razorpay-payment-references"
import { withPooledClient } from "../lib/db"

export default async function razorpayOrderCanceledHandler({
  event: { data },
  container,
}: SubscriberArgs<{ id: string }>) {
  const orderModuleService = container.resolve(Modules.ORDER)
  const logger = container.resolve("logger")

  try {
    const order = await orderModuleService.retrieveOrder(data.id)

    const razorpayData = order.metadata?.razorpay as { payment_id?: string; refund_id?: string; amount?: number; status?: string } | undefined

    if (!razorpayData || !razorpayData.payment_id) {
      logger.info(`Order ${data.id} missing or no razorpay payment_id found in metadata, skipping refund`)
      return
    }

    // Idempotency guard — refund already initiated (e.g. by the status/route fallback path)
    if (razorpayData.refund_id) {
      logger.info(`Order ${data.id} already has refund_id ${razorpayData.refund_id}, skipping duplicate refund`)
      return
    }

    const paymentId = razorpayData.payment_id

    logger.info(`Initiating Razorpay refund for payment: ${paymentId}`)

    const refundResult = await createRazorpayRefund({
      paymentId: paymentId,
      notes: {
        reason: "order_canceled",
        order_id: order.id
      }
    })
    
    const refundId = typeof refundResult.id === "string" ? refundResult.id : undefined
    const isProcessed = String(refundResult.status).toLowerCase() === "processed"
    const refStatus = isProcessed ? "refunded" : "refund_pending"

    // Update razorpay_payment_references table
    await upsertRazorpayPaymentReference({
      razorpayPaymentId: paymentId,
      razorpayRefundId: refundId,
      status: refStatus,
      lastEvent: "order.canceled.refund_initiated"
    })

    // Update order metadata and customer requests in database
    await withPooledClient("razorpay_refund", async () => {}, async (client) => {
      await client.query(
        `update "order"
         set metadata = jsonb_set(
           jsonb_set(coalesce(metadata, '{}'::jsonb), '{razorpay,refund_id}', to_jsonb($1::text), true),
           '{razorpay,status}', to_jsonb($2::text), true
         ) || (case when $3 = true then jsonb_build_object('latest_customer_request', jsonb_set(coalesce(metadata->'latest_customer_request', '{}'::jsonb), '{status}', '"refunded"'::jsonb, true)) else '{}'::jsonb end),
         updated_at = now()
         where id = $4`,
        [refundId ?? "", refStatus, isProcessed, order.id]
      )

      if (refundId) {
        await client.query(
          `update customer_order_requests
           set refund_reference = $1,
               status = case when $2 = true then 'refunded' else status end,
               updated_at = now()
           where order_id = $3 and request_type in ('cancel', 'return') and status != 'rejected'`,
          [refundId, isProcessed, order.id]
        )
      }
    })

    logger.info(`Razorpay Refund Initiated: ${JSON.stringify(refundResult)} (status: ${refStatus})`)
  } catch (error) {
    logger.error(`Failed to initiate refund in Razorpay for order ${data.id}: ${error}`)
  }
}

export const config: SubscriberConfig = {
  event: "order.canceled",
}
