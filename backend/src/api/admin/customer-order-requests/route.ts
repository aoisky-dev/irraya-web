import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import pg from "pg"

const { Client } = pg

export async function GET(req: MedusaRequest, res: MedusaResponse): Promise<void> {
  const client = new Client({ connectionString: process.env.DATABASE_URL })

  const orderId = req.query.order_id as string | undefined

  try {
    await client.connect()

    const result = await client.query(
      `select * from customer_order_requests 
       ${orderId ? 'where order_id = $1' : ''}
       order by created_at desc`,
      orderId ? [orderId] : []
    )

    res.status(200).json({ requests: result.rows })
  } catch (error: unknown) {
    res.status(500).json({ message: error instanceof Error ? error.message : "Failed to fetch requests." })
  } finally {
    await client.end().catch(() => undefined)
  }
}
