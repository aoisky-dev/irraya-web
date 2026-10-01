import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { withPooledClient } from "../../../lib/db"

async function ensureTable(client: import("pg").PoolClient): Promise<void> {
  await client.query(`
    create table if not exists customer_order_requests (
      id serial primary key,
      order_id text not null,
      request_type text not null,
      status text not null default 'requested',
      reason text,
      notes text,
      items jsonb,
      tracking_number text,
      tracking_url text,
      refund_reference text,
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now()
    )
  `)
}

export async function GET(req: MedusaRequest, res: MedusaResponse): Promise<void> {
  const orderId = req.query.order_id as string | undefined

  try {
    const rows = await withPooledClient("customer_order_requests", ensureTable, async (client) => {
      const result = await client.query(
        `select * from customer_order_requests ${orderId ? "where order_id = $1" : ""} order by created_at desc`,
        orderId ? [orderId] : []
      )
      return result.rows
    })
    res.status(200).json({ requests: rows })
  } catch (error: unknown) {
    res.status(500).json({ message: error instanceof Error ? error.message : "Failed to fetch requests." })
  }
}
