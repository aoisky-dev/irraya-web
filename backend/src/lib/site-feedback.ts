import pg from "pg"
import { withPooledClient } from "./db"

export type SiteFeedbackStatus = "new" | "reviewed" | "resolved"

export type SiteFeedback = {
  id: number
  customer_id: string | null
  email: string | null
  name: string | null
  rating: number | null
  category: string
  message: string
  page_url: string | null
  status: SiteFeedbackStatus
  created_at: string
  updated_at: string
}

const SCHEMA_KEY = "site_feedback"

async function ensureSiteFeedbackTable(client: pg.PoolClient): Promise<void> {
  await client.query(`
    create table if not exists site_feedback (
      id bigserial primary key,
      customer_id text,
      email text,
      name text,
      rating integer check (rating between 1 and 5),
      category text not null default 'general',
      message text not null,
      page_url text,
      status text not null default 'new',
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now()
    )
  `)
  await client.query(`create index if not exists idx_site_feedback_status on site_feedback(status)`)
  await client.query(`create index if not exists idx_site_feedback_customer_id on site_feedback(customer_id)`)
}

function normalizeString(value: unknown): string {
  return typeof value === "string" ? value.trim() : ""
}

export async function createSiteFeedback(input: {
  customerId?: string | null
  email?: string
  name?: string
  rating?: number
  category?: string
  message: string
  pageUrl?: string
}): Promise<SiteFeedback> {
  return withPooledClient(SCHEMA_KEY, ensureSiteFeedbackTable, async (client) => {
    const result = await client.query<SiteFeedback>(
      `insert into site_feedback (customer_id, email, name, rating, category, message, page_url)
       values ($1, $2, $3, $4, $5, $6, $7)
       returning *`,
      [
        input.customerId || null,
        normalizeString(input.email) || null,
        normalizeString(input.name) || null,
        typeof input.rating === "number" && Number.isFinite(input.rating)
          ? Math.min(Math.max(Math.round(input.rating), 1), 5)
          : null,
        normalizeString(input.category) || "general",
        input.message,
        normalizeString(input.pageUrl) || null
      ]
    )
    return result.rows[0]
  })
}

export async function listSiteFeedback(status?: string): Promise<SiteFeedback[]> {
  return withPooledClient(SCHEMA_KEY, ensureSiteFeedbackTable, async (client) => {
    const normalizedStatus = normalizeString(status)
    const result = await client.query<SiteFeedback>(
      `select * from site_feedback
       ${normalizedStatus ? "where status = $1" : ""}
       order by created_at desc
       limit 200`,
      normalizedStatus ? [normalizedStatus] : []
    )
    return result.rows
  })
}

export async function updateSiteFeedbackStatus(id: number, status: SiteFeedbackStatus): Promise<SiteFeedback | null> {
  return withPooledClient(SCHEMA_KEY, ensureSiteFeedbackTable, async (client) => {
    const result = await client.query<SiteFeedback>(
      `update site_feedback set status = $1, updated_at = now() where id = $2 returning *`,
      [status, id]
    )
    return result.rows[0] ?? null
  })
}

