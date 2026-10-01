import { SubscriberArgs, type SubscriberConfig } from "@medusajs/framework"
import { Modules } from "@medusajs/framework/utils"
import { createRazorpayRefund } from "../lib/razorpay"
import { upsertRazorpayPaymentReference } from "../lib/razorpay-payment-references"

export default async function razorpayOrderCanceledHandler({
  event: { data },
  container,
}: SubscriberArgs<{ id: string }>) {
  const orderModuleService = container.resolve(Modules.ORDER)
  const logger = container.resolve("logger")

  try {
    const order = await orderModuleService.retrieveOrder(data.id)

    const razorpayData = order.metadata?.razorpay as { payment_id?: string; refund_id?: string; amount?: number } | undefined

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
    
    // Update razorpay_payment_references table
    await upsertRazorpayPaymentReference({
      razorpayPaymentId: paymentId,
      razorpayRefundId: typeof refundResult.id === "string" ? refundResult.id : undefined,
      status: "refund_pending",
      lastEvent: "order.canceled.refund_initiated"
    })

    logger.info(`Razorpay Refund Initiated: ${JSON.stringify(refundResult)}`)
  } catch (error) {
    logger.error(`Failed to initiate refund in Razorpay for order ${data.id}: ${error}`)
  }
}

export const config: SubscriberConfig = {
  event: "order.canceled",
}
