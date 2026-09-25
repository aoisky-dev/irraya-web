import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { capturePaymentWorkflow } from "@medusajs/core-flows"
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

/**
 * Auto-capture Medusa payments using the official capturePaymentWorkflow.
 * Uses Medusa's Query module to traverse cart → payment_collection → payments,
 * then runs the capture workflow for each authorized payment.
 */
async function autoCaptureOrderPayments(req: MedusaRequest, orderId: string, cartId?: string): Promise<void> {
  try {
    const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
    let paymentIds: string[] = []

    // Strategy 1: Find payments via cart → payment_collection → payments
    if (cartId) {
      try {
        const { data: cartData } = await query.graph({
          entity: "cart",
          filters: { id: cartId },
          fields: ["payment_collection.payments.id", "payment_collection.payments.status"],
        })
        const payments = cartData?.[0]?.payment_collection?.payments ?? []
        paymentIds = payments
          .filter((p: any) => p.status === "authorized" || p.status === "not_paid")
          .map((p: any) => p.id)
      } catch (err) {
        console.warn("[link-order] Cart query failed:", err)
      }
    }

    // Strategy 2: Find payments via order → payment_collection link
    if (paymentIds.length === 0) {
      try {
        const { data: orderPayColData } = await query.graph({
          entity: "order",
          filters: { id: orderId },
          fields: ["payment_collection.payments.id", "payment_collection.payments.status"],
        })
        const payments = orderPayColData?.[0]?.payment_collection?.payments ?? []
        paymentIds = payments
          .filter((p: any) => p.status === "authorized" || p.status === "not_paid")
          .map((p: any) => p.id)
      } catch (err) {
        console.warn("[link-order] Order query failed:", err)
      }
    }

    // Strategy 3: Query order_payment_collection link table directly
    if (paymentIds.length === 0) {
      try {
        const { data: linkData } = await query.graph({
          entity: "order_payment_collection",
          filters: { order_id: orderId },
          fields: ["payment_collection.payments.id", "payment_collection.payments.status"],
        })
        for (const link of linkData ?? []) {
          const payments = link?.payment_collection?.payments ?? []
          for (const p of payments) {
            if (p.status === "authorized" || p.status === "not_paid") {
              paymentIds.push(p.id)
            }
          }
        }
      } catch (err) {
        console.warn("[link-order] Link query failed:", err)
      }
    }

    // Capture each payment using the official workflow
    for (const paymentId of paymentIds) {
      try {
        await capturePaymentWorkflow(req.scope).run({
          input: { payment_id: paymentId },
        })
        console.info(`[link-order] Captured payment ${paymentId} for order ${orderId}`)
      } catch (err) {
        console.warn(`[link-order] Workflow capture failed for ${paymentId}, trying direct:`, err)
        // Fallback: try direct payment module capture
        try {
          const { Modules } = await import("@medusajs/framework/utils")
          const paymentService = req.scope.resolve(Modules.PAYMENT) as any
          await paymentService.capturePayment({ payment_id: paymentId })
          console.info(`[link-order] Direct-captured payment ${paymentId} for order ${orderId}`)
        } catch (directErr) {
          console.warn(`[link-order] Direct capture also failed for ${paymentId}:`, directErr)
        }
      }
    }

    if (paymentIds.length === 0) {
      console.warn(`[link-order] No capturable payments found for order ${orderId} (cart ${cartId})`)
    }
  } catch (err) {
    console.warn(`[link-order] Auto-capture failed for order ${orderId}:`, err)
  }
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

    // Auto-capture the payment in Medusa so Admin doesn't prompt for manual capture
    // Await instead of fire-and-forget so capture completes before response
    try {
      await autoCaptureOrderPayments(req, orderId, cartId)
    } catch (err) {
      console.warn("[link-order] Non-fatal auto-capture error:", err)
    }

    res.status(200).json({
      linked: true,
      metadata_attached: metadataAttached,
      reference
    })
  } catch (error: unknown) {
    res.status(500).json({ message: error instanceof Error ? error.message : "Failed to link Razorpay payment to order." })
  }
}
