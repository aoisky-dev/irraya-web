import crypto from "node:crypto"

type RazorpayOrderApiResponse = {
  id?: unknown
  amount?: unknown
  currency?: unknown
  status?: unknown
  amount_paid?: unknown
  receipt?: unknown
  notes?: unknown
}

export type RazorpayPaymentApiResponse = {
  id?: unknown
  order_id?: unknown
  amount?: unknown
  currency?: unknown
  status?: unknown
  captured?: unknown
  error_description?: unknown
  notes?: unknown
}

export type RazorpayRefundApiResponse = {
  id?: unknown
  payment_id?: unknown
  amount?: unknown
  currency?: unknown
  status?: unknown
  notes?: unknown
}

export type RazorpayPaymentVerificationInput = {
  razorpay_order_id: string
  razorpay_payment_id: string
  razorpay_signature: string
}

const RAZORPAY_API_BASE_URL = "https://api.razorpay.com/v1"
const RAZORPAY_ORDERS_URL = `${RAZORPAY_API_BASE_URL}/orders`

function getRazorpayCredentials(): { keyId: string; keySecret: string } {
  const keyId = process.env.RAZORPAY_KEY_ID?.trim() ?? ""
  const keySecret = process.env.RAZORPAY_KEY_SECRET?.trim() ?? ""

  if (!keyId || !keySecret) {
    throw new Error("Razorpay credentials are not configured.")
  }

  return { keyId, keySecret }
}

export function getRazorpayKeyId(): string {
  return getRazorpayCredentials().keyId
}

function getRazorpayWebhookSecret(): string {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET?.trim() ?? ""

  if (!secret) {
    throw new Error("Razorpay webhook secret is not configured.")
  }

  return secret
}

function getRazorpayAuthorizationHeader(): string {
  const { keyId, keySecret } = getRazorpayCredentials()
  const credentials = Buffer.from(`${keyId}:${keySecret}`).toString("base64")
  return `Basic ${credentials}`
}

export function normalizeRazorpayCurrency(value: unknown): string {
  const currency = typeof value === "string" ? value.trim().toUpperCase() : "INR"
  return currency || "INR"
}

export function normalizeRazorpayAmount(value: unknown): number {
  const amount = typeof value === "number" ? value : typeof value === "string" ? Number(value) : NaN
  if (!Number.isFinite(amount) || !Number.isInteger(amount) || amount <= 0) {
    throw new Error("Payment amount must be a positive integer in the smallest currency unit.")
  }
  return amount
}

export function buildRazorpayReceipt(cartId: string): string {
  const digest = crypto.createHash("sha256").update(cartId).digest("hex").slice(0, 24)
  return `cart_${digest}`
}

export async function createRazorpayOrder(input: {
  amount: number
  currency: string
  receipt: string
  notes?: Record<string, string>
}): Promise<{ id: string; amount: number; currency: string; status: string }> {
  const response = await fetch(RAZORPAY_ORDERS_URL, {
    method: "POST",
    headers: {
      Authorization: getRazorpayAuthorizationHeader(),
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      amount: input.amount,
      currency: input.currency,
      receipt: input.receipt,
      notes: input.notes,
      payment_capture: true
    })
  })

  const rawBody = await response.text()
  let parsed: RazorpayOrderApiResponse & { error?: { description?: string } } = {}

  try {
    parsed = rawBody ? JSON.parse(rawBody) : {}
  } catch {
    parsed = {}
  }

  if (!response.ok) {
    throw new Error(parsed.error?.description || rawBody || "Failed to create Razorpay order.")
  }

  if (typeof parsed.id !== "string") {
    throw new Error("Razorpay order response did not include an order id.")
  }

  return {
    id: parsed.id,
    amount: normalizeRazorpayAmount(parsed.amount),
    currency: normalizeRazorpayCurrency(parsed.currency),
    status: typeof parsed.status === "string" ? parsed.status : "created"
  }
}

async function requestRazorpayApi<T extends { error?: { description?: string } }>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${RAZORPAY_API_BASE_URL}${path}`, {
    ...init,
    headers: {
      Authorization: getRazorpayAuthorizationHeader(),
      "Content-Type": "application/json",
      ...(init?.headers ?? {})
    }
  })

  const rawBody = await response.text()
  let parsed: T = {} as T

  try {
    parsed = rawBody ? JSON.parse(rawBody) : ({} as T)
  } catch {
    parsed = {} as T
  }

  if (!response.ok) {
    throw new Error(parsed.error?.description || rawBody || "Razorpay API request failed.")
  }

  return parsed
}

export async function fetchRazorpayOrder(orderId: string): Promise<RazorpayOrderApiResponse> {
  if (!orderId) throw new Error("Razorpay order id is required.")
  return requestRazorpayApi<RazorpayOrderApiResponse & { error?: { description?: string } }>(`/orders/${encodeURIComponent(orderId)}`)
}

export async function fetchRazorpayPayment(paymentId: string): Promise<RazorpayPaymentApiResponse> {
  if (!paymentId) throw new Error("Razorpay payment id is required.")
  return requestRazorpayApi<RazorpayPaymentApiResponse & { error?: { description?: string } }>(`/payments/${encodeURIComponent(paymentId)}`)
}

export async function fetchRazorpayOrderPayments(orderId: string): Promise<RazorpayPaymentApiResponse[]> {
  if (!orderId) throw new Error("Razorpay order id is required.")
  const response = await requestRazorpayApi<{ items?: RazorpayPaymentApiResponse[]; error?: { description?: string } }>(
    `/orders/${encodeURIComponent(orderId)}/payments`
  )
  return Array.isArray(response.items) ? response.items : []
}

export async function createRazorpayRefund(input: {
  paymentId: string
  amount?: number
  notes?: Record<string, string>
}): Promise<RazorpayRefundApiResponse> {
  if (!input.paymentId) throw new Error("Razorpay payment id is required.")

  const body: Record<string, unknown> = {
    notes: input.notes
  }

  if (typeof input.amount === "number") {
    body.amount = normalizeRazorpayAmount(input.amount)
  }

  return requestRazorpayApi<RazorpayRefundApiResponse & { error?: { description?: string } }>(
    `/payments/${encodeURIComponent(input.paymentId)}/refund`,
    {
      method: "POST",
      body: JSON.stringify(body)
    }
  )
}

export function verifyRazorpayWebhookSignature(rawBody: string, signature: string): boolean {
  if (!rawBody || !signature) return false

  const expected = crypto.createHmac("sha256", getRazorpayWebhookSecret()).update(rawBody).digest("hex")
  const expectedBuffer = Buffer.from(expected)
  const providedBuffer = Buffer.from(signature)

  return expectedBuffer.length === providedBuffer.length && crypto.timingSafeEqual(expectedBuffer, providedBuffer)
}

export function normalizeRazorpayPaymentStatus(payment: RazorpayPaymentApiResponse): "authorized" | "captured" | "failed" {
  const status = typeof payment.status === "string" ? payment.status.toLowerCase() : ""
  if (status === "captured" || payment.captured === true) return "captured"
  if (status === "failed") return "failed"
  return "authorized"
}

export function verifyRazorpayPaymentSignature(input: RazorpayPaymentVerificationInput): boolean {
  const { keySecret } = getRazorpayCredentials()
  const expected = crypto
    .createHmac("sha256", keySecret)
    .update(`${input.razorpay_order_id}|${input.razorpay_payment_id}`)
    .digest("hex")

  const expectedBuffer = Buffer.from(expected)
  const providedBuffer = Buffer.from(input.razorpay_signature)

  return expectedBuffer.length === providedBuffer.length && crypto.timingSafeEqual(expectedBuffer, providedBuffer)
}

