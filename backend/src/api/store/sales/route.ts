import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { getActiveSales } from "../../../lib/sales-config"

export async function GET(_req: MedusaRequest, res: MedusaResponse): Promise<void> {
  try {
    const sales = await getActiveSales()
    res.status(200).json({ sales })
  } catch (err: unknown) {
    res.status(500).json({ message: err instanceof Error ? err.message : "Failed to fetch sales." })
  }
}
