import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import {
  attachRazorpayReferenceToMedusaOrder,
  upsertRazorpayPaymentReference
} from "../../../../../lib/razorpay-payment-references"

type LinkRazorpayOrderBody = {
  cart_id?: unknown
  order_id?: unknown
  amount?: unknown
  currency?: unknown
  razorpay_order_id?: unknown
  razorpay_payment_id?: unknown
  status?: unknown
}

const normalizeString = (value: unknown): string => (typeof value === "string" ? value.trim() : "")
const normalizeAmount = (value: unknown): number | undefined => {
  const amount = typeof value === "number" ? value : typeof value === "string" ? Number(value) : NaN
  return Number.isFinite(amount) && amount > 0 ? Math.round(amount) : undefined
}

export async function POST(req: MedusaRequest<LinkRazorpayOrderBody>, res: MedusaResponse): Promise<void> {
  const body = (req.validatedBody ?? req.body ?? {}) as LinkRazorpayOrderBody
  const cartId = normalizeString(body.cart_id)
  const orderId = normalizeString(body.order_id)
  const razorpayOrderId = normalizeString(body.razorpay_order_id)
  const razorpayPaymentId = normalizeString(body.razorpay_payment_id)
  const status = normalizeString(body.status) || "authorized"
  const currency = normalizeString(body.currency).toUpperCase()

  if (!cartId || !orderId || !razorpayOrderId || !razorpayPaymentId) {
    res.status(400).json({ message: "Cart id, order id, and Razorpay payment details are required." })
    return
  }

  try {
    const amount = normalizeAmount(body.amount)
    const reference = await upsertRazorpayPaymentReference({
      cartId,
      medusaOrderId: orderId,
      razorpayOrderId,
      razorpayPaymentId,
      amount,
      currency: currency || undefined,
      status: status === "captured" ? "captured" : "authorized",
      lastEvent: "medusa.order_linked",
      payload: {
        linked_at: new Date().toISOString()
      }
    })

    const metadataAttached = await attachRazorpayReferenceToMedusaOrder({
      medusaOrderId: orderId,
      razorpayOrderId,
      razorpayPaymentId,
      status: reference.status,
      amount,
      currency: currency || undefined
    })

    res.status(200).json({
      linked: true,
      metadata_attached: metadataAttached,
      reference
    })
  } catch (error: unknown) {
    res.status(500).json({ message: error instanceof Error ? error.message : "Failed to link Razorpay payment to order." })
  }
}

