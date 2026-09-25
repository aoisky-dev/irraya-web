import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { cancelOrderWorkflow } from "@medusajs/core-flows"
import pg from "pg"

const { Client } = pg

type UpdateStatusBody = {
  status: "approved" | "rejected" | "refunded" | "completed"
  notes?: string
}

const normalizeString = (value: unknown): string => (typeof value === "string" ? value.trim() : "")

export async function POST(req: MedusaRequest<UpdateStatusBody>, res: MedusaResponse): Promise<void> {
  const { id } = req.params
  const body = (req.validatedBody ?? req.body ?? {}) as UpdateStatusBody
  const status = normalizeString(body.status)
  const notes = normalizeString(body.notes)

  if (!["approved", "rejected", "refunded", "completed"].includes(status)) {
    res.status(400).json({ message: "Invalid status." })
    return
  }

  const client = new Client({ connectionString: process.env.DATABASE_URL })

  try {
    await client.connect()

    const result = await client.query(
      `update customer_order_requests
       set status = $1,
           notes = coalesce($2, notes),
           updated_at = now()
       where id = $3
       returning *`,
      [status, notes || null, id]
    )

    if (result.rowCount === 0) {
      res.status(404).json({ message: "Request not found." })
      return
    }

    const request = result.rows[0]

    // Update order metadata
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
           select coalesce(jsonb_agg(r.id order by r.created_at desc), '[]'::jsonb)
           from customer_order_requests r
           where r.order_id = $2
         )
       ),
       updated_at = now()
       where id = $2`,
      [JSON.stringify(summary), request.order_id]
    )

    // If this is a cancellation and it was approved, trigger Medusa's native order cancellation
    if (request.request_type === "cancel" && status === "approved") {
      try {
        await cancelOrderWorkflow(req.scope).run({
          input: { order_id: request.order_id }
        })
        console.info(`[admin] Successfully native-canceled Medusa order ${request.order_id}`)
      } catch (cancelError) {
        console.error(`[admin] Failed to native-cancel Medusa order via workflow ${request.order_id}:`, cancelError)
        // Fallback: directly update the order status in the database
        // This ensures the frontend sees the cancelled status even if the workflow fails
        try {
          await client.query(
            `update "order" set status = 'canceled', canceled_at = now(), updated_at = now() where id = $1`,
            [request.order_id]
          )
          console.info(`[admin] Direct-canceled order ${request.order_id} in database as fallback`)
        } catch (directCancelError) {
          console.error(`[admin] Also failed to direct-cancel order ${request.order_id}:`, directCancelError)
          // Don't throw — the metadata already records the approved cancel,
          // and the frontend mapper now derives cancelled status from that
        }
      }
    }

    // If this is an exchange and it was approved, store the exchange status on the order
    if (request.request_type === "exchange" && (status === "approved" || status === "completed")) {
      try {
        await client.query(
          `update "order"
           set metadata = coalesce(metadata, '{}'::jsonb) || jsonb_build_object(
             'exchange_status', $1
           ),
           updated_at = now()
           where id = $2`,
          [status, request.order_id]
        )
      } catch (exchangeError) {
        console.warn(`[admin] Failed to update exchange metadata for order ${request.order_id}:`, exchangeError)
      }
    }

    res.status(200).json({ request })
  } catch (error: unknown) {
    res.status(500).json({ message: error instanceof Error ? error.message : "Failed to update request." })
  } finally {
    await client.end().catch(() => undefined)
  }
}
