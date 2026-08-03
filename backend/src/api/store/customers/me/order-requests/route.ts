import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { authenticateCustomer } from "../../../../../lib/customer-auth"
import { createCustomerOrderRequest, listCustomerOrderRequests } from "../../../../../lib/customer-order-management"

type CreateOrderRequestBody = {
  order_id?: unknown
  request_type?: unknown
  reason?: unknown
  notes?: unknown
  items?: unknown
}

const normalizeString = (value: unknown): string => (typeof value === "string" ? value.trim() : "")

async function requireCustomer(req: MedusaRequest, res: MedusaResponse) {
  const customer = await authenticateCustomer(req.headers.authorization)
  if (!customer) {
    res.status(401).json({ message: "Sign in to manage order requests." })
    return null
  }
  return customer
}

export async function GET(req: MedusaRequest, res: MedusaResponse): Promise<void> {
  const customer = await requireCustomer(req, res)
  if (!customer) return

  try {
    const requests = await listCustomerOrderRequests({
      customerId: customer.customerId,
      orderId: normalizeString(req.query?.order_id) || undefined
    })
    res.status(200).json({ requests })
  } catch (error: unknown) {
    res.status(500).json({ message: error instanceof Error ? error.message : "Failed to load order requests." })
  }
}

export async function POST(req: MedusaRequest<CreateOrderRequestBody>, res: MedusaResponse): Promise<void> {
  const customer = await requireCustomer(req, res)
  if (!customer) return

  const body = (req.validatedBody ?? req.body ?? {}) as CreateOrderRequestBody

  try {
    const request = await createCustomerOrderRequest({
      customerId: customer.customerId,
      orderId: normalizeString(body.order_id),
      requestType: body.request_type,
      reason: normalizeString(body.reason),
      notes: normalizeString(body.notes),
      items: body.items
    })

    res.status(201).json({
      request,
      message: "Request submitted. Our support team will review it in Medusa Admin."
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to submit order request."
    const status = /not found|already|outside|fulfilled|cancel/i.test(message) ? 400 : 500
    res.status(status).json({ message })
  }
}

