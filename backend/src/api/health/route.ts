import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { getPool } from "../../lib/db"

export async function GET(_req: MedusaRequest, res: MedusaResponse): Promise<void> {
  try {
    await getPool().query("select 1")
    res.status(200).json({ status: "ok", timestamp: new Date().toISOString() })
  } catch {
    res.status(503).json({ status: "degraded", reason: "database unreachable" })
  }
}
