import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { getSaleConfig, setSaleConfig } from "../../../../lib/store-config"

export async function GET(_req: MedusaRequest, res: MedusaResponse): Promise<void> {
  try {
    const config = await getSaleConfig()
    res.status(200).json({ sale: config })
  } catch (error: unknown) {
    res.status(500).json({ message: error instanceof Error ? error.message : "Failed to fetch sale config." })
  }
}

type SetSaleBody = {
  active?: unknown
  discountPct?: unknown
  label?: unknown
}

export async function PUT(req: MedusaRequest<SetSaleBody>, res: MedusaResponse): Promise<void> {
  const body = (req.validatedBody ?? req.body ?? {}) as SetSaleBody

  const active = body.active === true || body.active === "true"
  const discountPct = typeof body.discountPct === "number"
    ? body.discountPct
    : typeof body.discountPct === "string"
      ? parseFloat(body.discountPct)
      : 0

  if (!Number.isFinite(discountPct) || discountPct < 0 || discountPct > 100) {
    res.status(400).json({ message: "discountPct must be a number between 0 and 100." })
    return
  }

  const label = typeof body.label === "string" ? body.label.trim() : undefined

  try {
    const config = await setSaleConfig({ active, discountPct, label })
    res.status(200).json({ sale: config })
  } catch (error: unknown) {
    res.status(500).json({ message: error instanceof Error ? error.message : "Failed to update sale config." })
  }
}
