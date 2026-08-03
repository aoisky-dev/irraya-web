import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { verifyRazorpayPaymentSignature } from "../../../../../lib/razorpay"
import { upsertRazorpayPaymentReference } from "../../../../../lib/razorpay-payment-references"

type VerifyRazorpayPaymentBody = {
  cart_id?: unknown
  order_id?: unknown
  amount?: unknown
  razorpay_order_id?: unknown
  razorpay_payment_id?: unknown
  razorpay_signature?: unknown
}

const normalizeString = (value: unknown): string => (typeof value === "string" ? value.trim() : "")
const normalizeAmount = (value: unknown): number => {
  const amount = typeof value === "number" ? value : typeof value === "string" ? Number(value) : 0
  return Number.isFinite(amount) && amount > 0 ? Math.round(amount) : 0
}

export async function POST(req: MedusaRequest<VerifyRazorpayPaymentBody>, res: MedusaResponse): Promise<void> {
  const body = (req.validatedBody ?? req.body ?? {}) as VerifyRazorpayPaymentBody
  const cartId = normalizeString(body.cart_id)
  const orderId = normalizeString(body.order_id) || cartId
  const razorpayOrderId = normalizeString(body.razorpay_order_id)
  const razorpayPaymentId = normalizeString(body.razorpay_payment_id)
  const razorpaySignature = normalizeString(body.razorpay_signature)

  if (!cartId || !razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
    res.status(400).json({ message: "Cart id and Razorpay payment details are required." })
    return
  }

  try {
    const isValid = verifyRazorpayPaymentSignature({
      razorpay_order_id: razorpayOrderId,
      razorpay_payment_id: razorpayPaymentId,
      razorpay_signature: razorpaySignature
    })

    if (!isValid) {
      res.status(400).json({ message: "Razorpay payment verification failed." })
      return
    }

    const amount = normalizeAmount(body.amount)

    const reference = await upsertRazorpayPaymentReference({
      cartId,
      medusaOrderId: orderId !== cartId ? orderId : undefined,
      razorpayOrderId,
      razorpayPaymentId,
      amount,
      status: "authorized",
      lastEvent: "checkout.signature_verified",
      payload: {
        verified_at: new Date().toISOString()
      }
    })

    res.status(200).json({
      payment: {
        id: razorpayPaymentId,
        orderId,
        provider: "razorpay",
        amountInCents: amount,
        status: "authorized",
        providerReference: razorpayOrderId,
        providerPaymentId: razorpayPaymentId
      },
      reference
    })
  } catch (error: unknown) {
    res.status(500).json({ message: error instanceof Error ? error.message : "Failed to verify Razorpay payment." })
  }
}

