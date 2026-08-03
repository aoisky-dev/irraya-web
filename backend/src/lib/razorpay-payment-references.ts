import pg from "pg"

const { Client } = pg

export type RazorpayReferenceStatus =
  | "created"
  | "authorized"
  | "captured"
  | "failed"
  | "refund_pending"
  | "refunded"
  | "partially_refunded"

export type RazorpayPaymentReference = {
  id: number
  cart_id: string | null
  medusa_order_id: string | null
  razorpay_order_id: string | null
  razorpay_payment_id: string | null
  razorpay_refund_id: string | null
  amount: number | null
  currency: string | null
  status: RazorpayReferenceStatus
  failure_reason: string | null
  last_event: string | null
  payload: Record<string, unknown> | null
  created_at: string
  updated_at: string
}

export type UpsertRazorpayPaymentReferenceInput = {
  cartId?: string
  medusaOrderId?: string
  razorpayOrderId?: string
  razorpayPaymentId?: string
  razorpayRefundId?: string
  amount?: number
  currency?: string
  status: RazorpayReferenceStatus
  failureReason?: string
  lastEvent?: string
  payload?: Record<string, unknown>
}

async function withClient<T>(callback: (client: pg.Client) => Promise<T>): Promise<T> {
  const client = new Client({ connectionString: process.env.DATABASE_URL })

  try {
    await client.connect()
    await ensureRazorpayPaymentReferencesTable(client)
    return await callback(client)
  } finally {
    await client.end().catch(() => undefined)
  }
}

async function ensureRazorpayPaymentReferencesTable(client: pg.Client): Promise<void> {
  await client.query(`
    create table if not exists razorpay_payment_references (
      id bigserial primary key,
      cart_id text,
      medusa_order_id text,
      razorpay_order_id text unique,
      razorpay_payment_id text unique,
      razorpay_refund_id text,
      amount integer,
      currency text,
      status text not null,
      failure_reason text,
      last_event text,
      payload jsonb,
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now()
    )
  `)

  await client.query(`create index if not exists idx_razorpay_payment_references_cart_id on razorpay_payment_references(cart_id)`)
  await client.query(`create index if not exists idx_razorpay_payment_references_medusa_order_id on razorpay_payment_references(medusa_order_id)`)
  await client.query(`create index if not exists idx_razorpay_payment_references_status on razorpay_payment_references(status)`)
}

function normalizeOptionalString(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null
}

function normalizeOptionalNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? Math.round(value) : null
}

export async function upsertRazorpayPaymentReference(
  input: UpsertRazorpayPaymentReferenceInput
): Promise<RazorpayPaymentReference> {
  const razorpayOrderId = normalizeOptionalString(input.razorpayOrderId)
  const razorpayPaymentId = normalizeOptionalString(input.razorpayPaymentId)

  if (!razorpayOrderId && !razorpayPaymentId) {
    throw new Error("A Razorpay order id or payment id is required to store a payment reference.")
  }

  return withClient(async (client) => {
    if (razorpayOrderId) {
      const result = await client.query<RazorpayPaymentReference>(
        `insert into razorpay_payment_references (
           cart_id, medusa_order_id, razorpay_order_id, razorpay_payment_id, razorpay_refund_id,
           amount, currency, status, failure_reason, last_event, payload
         ) values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11::jsonb)
         on conflict (razorpay_order_id) do update set
           cart_id = coalesce(excluded.cart_id, razorpay_payment_references.cart_id),
           medusa_order_id = coalesce(excluded.medusa_order_id, razorpay_payment_references.medusa_order_id),
           razorpay_payment_id = coalesce(excluded.razorpay_payment_id, razorpay_payment_references.razorpay_payment_id),
           razorpay_refund_id = coalesce(excluded.razorpay_refund_id, razorpay_payment_references.razorpay_refund_id),
           amount = coalesce(excluded.amount, razorpay_payment_references.amount),
           currency = coalesce(excluded.currency, razorpay_payment_references.currency),
           status = excluded.status,
           failure_reason = coalesce(excluded.failure_reason, razorpay_payment_references.failure_reason),
           last_event = coalesce(excluded.last_event, razorpay_payment_references.last_event),
           payload = coalesce(excluded.payload, razorpay_payment_references.payload),
           updated_at = now()
         returning *`,
        [
          normalizeOptionalString(input.cartId),
          normalizeOptionalString(input.medusaOrderId),
          razorpayOrderId,
          razorpayPaymentId,
          normalizeOptionalString(input.razorpayRefundId),
          normalizeOptionalNumber(input.amount),
          normalizeOptionalString(input.currency)?.toUpperCase() ?? null,
          input.status,
          normalizeOptionalString(input.failureReason),
          normalizeOptionalString(input.lastEvent),
          input.payload ? JSON.stringify(input.payload) : null
        ]
      )
      return result.rows[0]
    }

    const result = await client.query<RazorpayPaymentReference>(
      `insert into razorpay_payment_references (
         cart_id, medusa_order_id, razorpay_payment_id, razorpay_refund_id,
         amount, currency, status, failure_reason, last_event, payload
       ) values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10::jsonb)
       on conflict (razorpay_payment_id) do update set
         cart_id = coalesce(excluded.cart_id, razorpay_payment_references.cart_id),
         medusa_order_id = coalesce(excluded.medusa_order_id, razorpay_payment_references.medusa_order_id),
         razorpay_refund_id = coalesce(excluded.razorpay_refund_id, razorpay_payment_references.razorpay_refund_id),
         amount = coalesce(excluded.amount, razorpay_payment_references.amount),
         currency = coalesce(excluded.currency, razorpay_payment_references.currency),
         status = excluded.status,
         failure_reason = coalesce(excluded.failure_reason, razorpay_payment_references.failure_reason),
         last_event = coalesce(excluded.last_event, razorpay_payment_references.last_event),
         payload = coalesce(excluded.payload, razorpay_payment_references.payload),
         updated_at = now()
       returning *`,
      [
        normalizeOptionalString(input.cartId),
        normalizeOptionalString(input.medusaOrderId),
        razorpayPaymentId,
        normalizeOptionalString(input.razorpayRefundId),
        normalizeOptionalNumber(input.amount),
        normalizeOptionalString(input.currency)?.toUpperCase() ?? null,
        input.status,
        normalizeOptionalString(input.failureReason),
        normalizeOptionalString(input.lastEvent),
        input.payload ? JSON.stringify(input.payload) : null
      ]
    )
    return result.rows[0]
  })
}

export async function listRazorpayPaymentReferences(input: {
  cartId?: string
  medusaOrderId?: string
  razorpayOrderId?: string
  razorpayPaymentId?: string
  status?: string
  limit?: number
}): Promise<RazorpayPaymentReference[]> {
  return withClient(async (client) => {
    const conditions: string[] = []
    const values: unknown[] = []

    for (const [column, value] of [
      ["cart_id", input.cartId],
      ["medusa_order_id", input.medusaOrderId],
      ["razorpay_order_id", input.razorpayOrderId],
      ["razorpay_payment_id", input.razorpayPaymentId],
      ["status", input.status]
    ] as Array<[string, unknown]>) {
      const normalized = normalizeOptionalString(value)
      if (normalized) {
        values.push(normalized)
        conditions.push(`${column} = $${values.length}`)
      }
    }

    const limit = Math.min(Math.max(input.limit ?? 50, 1), 200)
    values.push(limit)

    const result = await client.query<RazorpayPaymentReference>(
      `select * from razorpay_payment_references
       ${conditions.length ? `where ${conditions.join(" and ")}` : ""}
       order by updated_at desc
       limit $${values.length}`,
      values
    )

    return result.rows
  })
}

export async function attachRazorpayReferenceToMedusaOrder(input: {
  medusaOrderId: string
  razorpayOrderId: string
  razorpayPaymentId: string
  status: string
  amount?: number
  currency?: string
}): Promise<boolean> {
  const medusaOrderId = normalizeOptionalString(input.medusaOrderId)
  if (!medusaOrderId) return false

  return withClient(async (client) => {
    const metadata = {
      razorpay: {
        order_id: input.razorpayOrderId,
        payment_id: input.razorpayPaymentId,
        status: input.status,
        amount: input.amount,
        currency: input.currency,
        linked_at: new Date().toISOString()
      }
    }

    try {
      const result = await client.query(
        `update "order"
         set metadata = coalesce(metadata, '{}'::jsonb) || $1::jsonb,
             updated_at = now()
         where id = $2`,
        [JSON.stringify(metadata), medusaOrderId]
      )
      return (result.rowCount ?? 0) > 0
    } catch {
      return false
    }
  })
}

