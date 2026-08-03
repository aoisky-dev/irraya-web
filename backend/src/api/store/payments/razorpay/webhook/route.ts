import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { normalizeRazorpayAmount, normalizeRazorpayCurrency, verifyRazorpayWebhookSignature } from "../../../../../lib/razorpay"
import { upsertRazorpayPaymentReference, type RazorpayReferenceStatus } from "../../../../../lib/razorpay-payment-references"

type RazorpayWebhookPayload = {
  event?: unknown
  payload?: {
    payment?: { entity?: Record<string, unknown> }
    refund?: { entity?: Record<string, unknown> }
    order?: { entity?: Record<string, unknown> }
  }
}

function normalizeString(value: unknown): string {
  return typeof value === "string" ? value.trim() : ""
}

function getNestedString(entity: Record<string, unknown> | undefined, key: string): string {
  return normalizeString(entity?.[key])
}

function getNotes(entity: Record<string, unknown> | undefined): Record<string, unknown> {
  return entity?.notes && typeof entity.notes === "object" ? entity.notes as Record<string, unknown> : {}
}

function getAmount(entity: Record<string, unknown> | undefined): number | undefined {
  try {
    return normalizeRazorpayAmount(entity?.amount)
  } catch {
    return undefined
  }
}

function getCurrency(entity: Record<string, unknown> | undefined): string | undefined {
  const currency = normalizeRazorpayCurrency(entity?.currency)
  return currency || undefined
}

function getWebhookSignature(req: MedusaRequest): string {
  const header = req.headers["x-razorpay-signature"]
  return Array.isArray(header) ? normalizeString(header[0]) : normalizeString(header)
}

async function getRawWebhookBody(req: MedusaRequest): Promise<string> {
  const requestWithRawBody = req as MedusaRequest & { rawBody?: unknown; text?: () => Promise<string> }

  if (typeof requestWithRawBody.rawBody === "string") return requestWithRawBody.rawBody
  if (Buffer.isBuffer(requestWithRawBody.rawBody)) return requestWithRawBody.rawBody.toString("utf8")
  if (typeof req.body === "string") return req.body
  if (Buffer.isBuffer(req.body)) return req.body.toString("utf8")
  if (typeof requestWithRawBody.text === "function") return requestWithRawBody.text()

  return JSON.stringify(req.body ?? {})
}

function parseWebhookPayload(rawBody: string, body: unknown): RazorpayWebhookPayload {
  if (body && typeof body === "object" && !Buffer.isBuffer(body)) {
    return body as RazorpayWebhookPayload
  }

  return JSON.parse(rawBody) as RazorpayWebhookPayload
}

function statusForEvent(event: string, payment: Record<string, unknown> | undefined, refund: Record<string, unknown> | undefined): RazorpayReferenceStatus {
  if (event === "payment.captured") return "captured"
  if (event === "payment.failed") return "failed"
  if (event === "refund.created") return "refund_pending"
  if (event === "refund.processed") {
    const refundAmount = getAmount(refund) ?? 0
    const paymentAmount = getAmount(payment) ?? refundAmount
    return refundAmount > 0 && paymentAmount > refundAmount ? "partially_refunded" : "refunded"
  }
  return "authorized"
}

export async function POST(req: MedusaRequest, res: MedusaResponse): Promise<void> {
  const rawBody = await getRawWebhookBody(req)
  const signature = getWebhookSignature(req)

  try {
    if (!verifyRazorpayWebhookSignature(rawBody, signature)) {
      res.status(400).json({ message: "Invalid Razorpay webhook signature." })
      return
    }

    const payload = parseWebhookPayload(rawBody, req.body)
    const event = normalizeString(payload.event)
    const payment = payload.payload?.payment?.entity
    const refund = payload.payload?.refund?.entity
    const order = payload.payload?.order?.entity
    const paymentNotes = getNotes(payment)
    const orderNotes = getNotes(order)
    const cartId = normalizeString(paymentNotes.cart_id) || normalizeString(orderNotes.cart_id)
    const razorpayOrderId = getNestedString(payment, "order_id") || getNestedString(order, "id")
    const razorpayPaymentId = getNestedString(payment, "id") || getNestedString(refund, "payment_id")
    const razorpayRefundId = getNestedString(refund, "id")

    if (!["payment.captured", "payment.failed", "refund.created", "refund.processed"].includes(event)) {
      res.status(200).json({ received: true, ignored: true, event })
      return
    }

    if (!razorpayOrderId && !razorpayPaymentId) {
      res.status(400).json({ message: "Webhook payload did not include a Razorpay order or payment id." })
      return
    }

    const status = statusForEvent(event, payment, refund)
    const reference = await upsertRazorpayPaymentReference({
      cartId: cartId || undefined,
      razorpayOrderId: razorpayOrderId || undefined,
      razorpayPaymentId: razorpayPaymentId || undefined,
      razorpayRefundId: razorpayRefundId || undefined,
      amount: getAmount(payment) ?? getAmount(refund),
      currency: getCurrency(payment) ?? getCurrency(refund),
      status,
      failureReason: getNestedString(payment, "error_description") || undefined,
      lastEvent: event,
      payload: payload as Record<string, unknown>
    })

    res.status(200).json({ received: true, event, status, reference })
  } catch (error: unknown) {
    res.status(500).json({ message: error instanceof Error ? error.message : "Failed to process Razorpay webhook." })
  }
}

