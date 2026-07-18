import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { createRazorpayRefund, normalizeRazorpayAmount, normalizeRazorpayCurrency } from "../../../../../lib/razorpay"
import { listRazorpayPaymentReferences, upsertRazorpayPaymentReference } from "../../../../../lib/razorpay-payment-references"

type CreateRazorpayRefundBody = {
  razorpay_payment_id?: unknown
  amount?: unknown
  reason?: unknown
  notes?: Record<string, unknown>
}

const normalizeString = (value: unknown): string => (typeof value === "string" ? value.trim() : "")
const normalizeOptionalAmount = (value: unknown): number | undefined => {
  if (value === undefined || value === null || value === "") return undefined
  return normalizeRazorpayAmount(value)
}

export async function POST(req: MedusaRequest<CreateRazorpayRefundBody>, res: MedusaResponse): Promise<void> {
  const body = (req.validatedBody ?? req.body ?? {}) as CreateRazorpayRefundBody
  const razorpayPaymentId = normalizeString(body.razorpay_payment_id)

  if (!razorpayPaymentId) {
    res.status(400).json({ message: "Razorpay payment id is required." })
    return
  }

  try {
    const existingReferences = await listRazorpayPaymentReferences({
      razorpayPaymentId,
      limit: 1
    })
    const existingReference = existingReferences[0]
    const amount = normalizeOptionalAmount(body.amount)
    const reason = normalizeString(body.reason) || "Admin refund"
    const notes = Object.fromEntries(
      Object.entries({
        ...(body.notes && typeof body.notes === "object" ? body.notes : {}),
        reason,
        cart_id: existingReference?.cart_id ?? undefined,
        medusa_order_id: existingReference?.medusa_order_id ?? undefined
      })
        .filter(([, value]) => value !== undefined && value !== null && value !== "")
        .map(([key, value]) => [key, String(value)])
    )

    const refund = await createRazorpayRefund({
      paymentId: razorpayPaymentId,
      amount,
      notes
    })
    const refundStatus = normalizeString(refund.status).toLowerCase() === "processed" ? "refunded" : "refund_pending"
    const reference = await upsertRazorpayPaymentReference({
      cartId: existingReference?.cart_id ?? undefined,
      medusaOrderId: existingReference?.medusa_order_id ?? undefined,
      razorpayOrderId: existingReference?.razorpay_order_id ?? undefined,
      razorpayPaymentId,
      razorpayRefundId: normalizeString(refund.id),
      amount: amount ?? existingReference?.amount ?? undefined,
      currency: normalizeRazorpayCurrency(refund.currency ?? existingReference?.currency),
      status: refundStatus,
      lastEvent: "admin.refund_created",
      payload: refund as Record<string, unknown>
    })

    res.status(200).json({ refund, reference })
  } catch (error: unknown) {
    res.status(500).json({ message: error instanceof Error ? error.message : "Failed to create Razorpay refund." })
  }
}

