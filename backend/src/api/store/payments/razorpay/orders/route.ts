import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import {
  buildRazorpayReceipt,
  createRazorpayOrder,
  getRazorpayKeyId,
  normalizeRazorpayAmount,
  normalizeRazorpayCurrency
} from "../../../../../lib/razorpay"
import { upsertRazorpayPaymentReference } from "../../../../../lib/razorpay-payment-references"

type CreateRazorpayOrderBody = {
  cart_id?: unknown
  amount?: unknown
  currency?: unknown
  customer?: {
    name?: unknown
    email?: unknown
    contact?: unknown
  }
}

const normalizeString = (value: unknown): string => (typeof value === "string" ? value.trim() : "")

export async function POST(req: MedusaRequest<CreateRazorpayOrderBody>, res: MedusaResponse): Promise<void> {
  const body = (req.validatedBody ?? req.body ?? {}) as CreateRazorpayOrderBody
  const cartId = normalizeString(body.cart_id)

  if (!cartId) {
    res.status(400).json({ message: "Cart id is required." })
    return
  }

  try {
    const amount = normalizeRazorpayAmount(body.amount)
    const currency = normalizeRazorpayCurrency(body.currency)
    const customer = body.customer && typeof body.customer === "object" ? body.customer : {}
    const notes: Record<string, string> = {
      cart_id: cartId
    }

    const customerName = normalizeString(customer.name)
    const customerEmail = normalizeString(customer.email)
    const customerContact = normalizeString(customer.contact)

    if (customerName) notes.customer_name = customerName
    if (customerEmail) notes.customer_email = customerEmail
    if (customerContact) notes.customer_contact = customerContact

    const razorpayOrder = await createRazorpayOrder({
      amount,
      currency,
      receipt: buildRazorpayReceipt(cartId),
      notes
    })

    await upsertRazorpayPaymentReference({
      cartId,
      razorpayOrderId: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      status: "created",
      lastEvent: "order.created",
      payload: {
        notes,
        razorpay_status: razorpayOrder.status
      }
    })

    res.status(200).json({
      razorpay_order_id: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      status: razorpayOrder.status,
      key_id: getRazorpayKeyId()
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to create Razorpay order."
    const status = message.includes("configured") ? 500 : 400
    res.status(status).json({ message })
  }
}

