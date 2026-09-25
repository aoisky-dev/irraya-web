import pg from "pg"
import { withPooledClient } from "./db"

export type OrderRequestType = "cancel" | "return" | "exchange"
export type OrderRequestStatus = "requested" | "under_review" | "approved" | "rejected" | "refunded" | "completed"

export type OrderRequestItem = {
  item_id?: string
  product_id?: string
  variant_id?: string
  quantity?: number
}

export type CustomerOrderRequest = {
  id: number
  customer_id: string
  order_id: string
  request_type: OrderRequestType
  status: OrderRequestStatus
  reason: string
  notes: string | null
  items: OrderRequestItem[]
  tracking_number: string | null
  tracking_url: string | null
  refund_reference: string | null
  created_at: string
  updated_at: string
}

type OrderRow = {
  id: string
  customer_id: string | null
  status: string | null
  fulfillment_status?: string | null
  metadata: Record<string, unknown> | null
  created_at: string
}

async function withClient<T>(callback: (client: pg.PoolClient) => Promise<T>): Promise<T> {
  return withPooledClient("customer_order_requests", ensureCustomerOrderRequestTable, callback)
}

async function ensureCustomerOrderRequestTable(client: pg.PoolClient): Promise<void> {
  await client.query(`
    create table if not exists customer_order_requests (
      id bigserial primary key,
      customer_id text not null,
      order_id text not null,
      request_type text not null,
      status text not null default 'requested',
      reason text not null,
      notes text,
      items jsonb not null default '[]'::jsonb,
      tracking_number text,
      tracking_url text,
      refund_reference text,
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now()
    )
  `)
  await client.query(`create index if not exists idx_customer_order_requests_customer_id on customer_order_requests(customer_id)`)
  await client.query(`create index if not exists idx_customer_order_requests_order_id on customer_order_requests(order_id)`)
  await client.query(`create index if not exists idx_customer_order_requests_status on customer_order_requests(status)`)
}

function normalizeString(value: unknown): string {
  return typeof value === "string" ? value.trim() : ""
}

function normalizeRequestType(value: unknown): OrderRequestType | null {
  const type = normalizeString(value)
  return type === "cancel" || type === "return" || type === "exchange" ? type : null
}

function normalizeItems(value: unknown): OrderRequestItem[] {
  if (!Array.isArray(value)) return []
  return value.slice(0, 50).map((item) => {
    const raw = item && typeof item === "object" ? item as Record<string, unknown> : {}
    const quantity = typeof raw.quantity === "number" ? raw.quantity : Number(raw.quantity)
    return {
      item_id: normalizeString(raw.item_id) || undefined,
      product_id: normalizeString(raw.product_id) || undefined,
      variant_id: normalizeString(raw.variant_id) || undefined,
      quantity: Number.isFinite(quantity) && quantity > 0 ? Math.round(quantity) : undefined
    }
  }).filter((item) => item.item_id || item.product_id || item.variant_id)
}

function isWithinReturnWindow(order: OrderRow): boolean {
  const createdAt = new Date(order.created_at).getTime()
  if (!Number.isFinite(createdAt)) return false
  const returnWindowMs = 48 * 60 * 60 * 1000
  return Date.now() - createdAt <= returnWindowMs
}

function assertEligible(order: OrderRow, requestType: OrderRequestType): void {
  const status = normalizeString(order.status).toLowerCase()
  const fulfillmentStatus = normalizeString(order.fulfillment_status).toLowerCase()

  if (status === "canceled" || status === "cancelled") {
    throw new Error("This order has already been cancelled.")
  }

  if (requestType === "cancel") {
    if (["fulfilled", "shipped", "delivered"].includes(fulfillmentStatus) || status === "fulfilled") {
      throw new Error("This order is already fulfilled. Please request a return instead.")
    }
    return
  }

  if (!isWithinReturnWindow(order)) {
    throw new Error("This order is outside the 48-hour exchange window.")
  }
}

async function getOwnedOrder(client: pg.PoolClient, customerId: string, orderId: string): Promise<OrderRow> {
  const result = await client.query<OrderRow>(
    `select id, customer_id, status, metadata, created_at
     from "order"
     where id = $1
       and customer_id = $2
       and deleted_at is null
     limit 1`,
    [orderId, customerId]
  )

  const order = result.rows[0]
  if (!order) {
    throw new Error("Order not found for this customer.")
  }
  return order
}

async function attachRequestMetadata(client: pg.PoolClient, request: CustomerOrderRequest): Promise<void> {
  const summary = {
    id: request.id,
    type: request.request_type,
    status: request.status,
    reason: request.reason,
    created_at: request.created_at
  }

  await client.query(
    `update "order"
     set metadata = coalesce(metadata, '{}'::jsonb) || jsonb_build_object(
       'latest_customer_request', $1::jsonb,
       'customer_request_ids', (
         select coalesce(jsonb_agg(id order by created_at desc), '[]'::jsonb)
         from customer_order_requests
         where order_id = $2
       )
     ),
     updated_at = now()
     where id = $2`,
    [JSON.stringify(summary), request.order_id]
  )
}

export async function listCustomerOrderRequests(input: {
  customerId: string
  orderId?: string
}): Promise<CustomerOrderRequest[]> {
  return withClient(async (client) => {
    const values: unknown[] = [input.customerId]
    const conditions = ["customer_id = $1"]
    const orderId = normalizeString(input.orderId)
    if (orderId) {
      values.push(orderId)
      conditions.push(`order_id = $${values.length}`)
    }

    const result = await client.query<CustomerOrderRequest>(
      `select * from customer_order_requests
       where ${conditions.join(" and ")}
       order by created_at desc`,
      values
    )
    return result.rows
  })
}

export async function createCustomerOrderRequest(input: {
  customerId: string
  orderId: string
  requestType: unknown
  reason: string
  notes?: string
  items?: unknown
}): Promise<CustomerOrderRequest> {
  const requestType = normalizeRequestType(input.requestType)
  const orderId = normalizeString(input.orderId)
  const reason = normalizeString(input.reason)

  if (!requestType) throw new Error("Request type must be cancel, return, or exchange.")
  if (!orderId) throw new Error("Order id is required.")
  if (!reason) throw new Error("Reason is required.")

  return withClient(async (client) => {
    const order = await getOwnedOrder(client, input.customerId, orderId)
    assertEligible(order, requestType)

    const existingOpen = await client.query(
      `select 1 from customer_order_requests
       where customer_id = $1
         and order_id = $2
         and request_type = $3
         and status in ('requested', 'under_review', 'approved')
       limit 1`,
      [input.customerId, orderId, requestType]
    )

    if ((existingOpen.rowCount ?? 0) > 0) {
      throw new Error(`An open ${requestType} request already exists for this order.`)
    }

    const result = await client.query<CustomerOrderRequest>(
      `insert into customer_order_requests (customer_id, order_id, request_type, reason, notes, items)
       values ($1, $2, $3, $4, $5, $6::jsonb)
       returning *`,
      [input.customerId, orderId, requestType, reason, normalizeString(input.notes) || null, JSON.stringify(normalizeItems(input.items))]
    )

    const request = result.rows[0]
    await attachRequestMetadata(client, request)
    return request
  })
}

export function getOrderEligibility(order: { status?: string; fulfillment_status?: string; created_at?: string }): {
  canCancel: boolean
  canReturn: boolean
  canExchange: boolean
  returnWindowEndsAt: string | null
} {
  const createdAt = order.created_at ? new Date(order.created_at) : null
  const returnWindowEndsAt = createdAt && Number.isFinite(createdAt.getTime())
    ? new Date(createdAt.getTime() + 48 * 60 * 60 * 1000).toISOString()
    : null
  const status = normalizeString(order.status).toLowerCase()
  const fulfillmentStatus = normalizeString(order.fulfillment_status).toLowerCase()
  const cancelled = status === "canceled" || status === "cancelled"
  const fulfilled = status === "fulfilled" || ["fulfilled", "shipped", "delivered"].includes(fulfillmentStatus)
  const inReturnWindow = returnWindowEndsAt ? Date.now() <= new Date(returnWindowEndsAt).getTime() : false

  return {
    canCancel: !cancelled && !fulfilled,
    canReturn: !cancelled && inReturnWindow,
    canExchange: !cancelled && inReturnWindow,
    returnWindowEndsAt
  }
}

