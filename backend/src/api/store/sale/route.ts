import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { getSaleConfig } from "../../../lib/store-config"

export async function GET(_req: MedusaRequest, res: MedusaResponse): Promise<void> {
  try {
    const config = await getSaleConfig()
    res.status(200).json({ sale: config })
  } catch (error: unknown) {
    res.status(500).json({ message: error instanceof Error ? error.message : "Failed to fetch sale config." })
  }
}
