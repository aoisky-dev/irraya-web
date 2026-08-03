import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import {
  fetchRazorpayOrder,
  fetchRazorpayOrderPayments,
  fetchRazorpayPayment,
  normalizeRazorpayAmount,
  normalizeRazorpayCurrency,
  normalizeRazorpayPaymentStatus,
  type RazorpayPaymentApiResponse
} from "../../../../../lib/razorpay"
import { listRazorpayPaymentReferences, upsertRazorpayPaymentReference } from "../../../../../lib/razorpay-payment-references"

type ReconcileRazorpayPaymentBody = {
  cart_id?: unknown
  order_id?: unknown
  razorpay_order_id?: unknown
  razorpay_payment_id?: unknown
}

const normalizeString = (value: unknown): string => (typeof value === "string" ? value.trim() : "")

function amountFromPayment(payment: RazorpayPaymentApiResponse): number | undefined {
  try {
    return normalizeRazorpayAmount(payment.amount)
  } catch {
    return undefined
  }
}

export async function POST(req: MedusaRequest<ReconcileRazorpayPaymentBody>, res: MedusaResponse): Promise<void> {
  const body = (req.validatedBody ?? req.body ?? {}) as ReconcileRazorpayPaymentBody
  const cartId = normalizeString(body.cart_id)
  const medusaOrderId = normalizeString(body.order_id)
  const razorpayOrderId = normalizeString(body.razorpay_order_id)
  const razorpayPaymentId = normalizeString(body.razorpay_payment_id)

  if (!cartId && !medusaOrderId && !razorpayOrderId && !razorpayPaymentId) {
    res.status(400).json({ message: "Provide a cart id, Medusa order id, Razorpay order id, or Razorpay payment id." })
    return
  }

  try {
    const existingReferences = await listRazorpayPaymentReferences({
      cartId: cartId || undefined,
      medusaOrderId: medusaOrderId || undefined,
      razorpayOrderId: razorpayOrderId || undefined,
      razorpayPaymentId: razorpayPaymentId || undefined,
      limit: 25
    })
    const resolvedRazorpayOrderId = razorpayOrderId || existingReferences[0]?.razorpay_order_id || ""
    const resolvedRazorpayPaymentId = razorpayPaymentId || existingReferences[0]?.razorpay_payment_id || ""

    const razorpayOrder = resolvedRazorpayOrderId ? await fetchRazorpayOrder(resolvedRazorpayOrderId) : null
    const payments = resolvedRazorpayPaymentId
      ? [await fetchRazorpayPayment(resolvedRazorpayPaymentId)]
      : resolvedRazorpayOrderId
        ? await fetchRazorpayOrderPayments(resolvedRazorpayOrderId)
        : []

    const updatedReferences = []
    for (const payment of payments) {
      const orderId = normalizeString(payment.order_id) || resolvedRazorpayOrderId
      const paymentId = normalizeString(payment.id)
      if (!orderId && !paymentId) continue

      updatedReferences.push(await upsertRazorpayPaymentReference({
        cartId: cartId || existingReferences[0]?.cart_id || undefined,
        medusaOrderId: medusaOrderId || existingReferences[0]?.medusa_order_id || undefined,
        razorpayOrderId: orderId || undefined,
        razorpayPaymentId: paymentId || undefined,
        amount: amountFromPayment(payment),
        currency: normalizeRazorpayCurrency(payment.currency),
        status: normalizeRazorpayPaymentStatus(payment),
        failureReason: normalizeString(payment.error_description) || undefined,
        lastEvent: "admin.reconciled",
        payload: payment as Record<string, unknown>
      }))
    }

    res.status(200).json({
      reconciled: true,
      razorpay_order: razorpayOrder,
      payments,
      references: updatedReferences.length ? updatedReferences : existingReferences
    })
  } catch (error: unknown) {
    res.status(500).json({ message: error instanceof Error ? error.message : "Failed to reconcile Razorpay payment." })
  }
}

