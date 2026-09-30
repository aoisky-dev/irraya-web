import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { getSaleById, updateSale, deleteSale } from "../../../../../lib/sales-config"

export async function GET(req: MedusaRequest, res: MedusaResponse): Promise<void> {
  const id = Number(req.params.id)
  if (!Number.isInteger(id)) { res.status(400).json({ message: "Invalid sale id." }); return }
  const sale = await getSaleById(id)
  if (!sale) { res.status(404).json({ message: "Sale not found." }); return }
  res.status(200).json({ sale })
}

type UpdateSaleBody = { name?: unknown; discountPct?: unknown; label?: unknown; active?: unknown }

export async function PUT(req: MedusaRequest<UpdateSaleBody>, res: MedusaResponse): Promise<void> {
  const id = Number(req.params.id)
  if (!Number.isInteger(id)) { res.status(400).json({ message: "Invalid sale id." }); return }

  const body = (req.validatedBody ?? req.body ?? {}) as UpdateSaleBody
  const input: Parameters<typeof updateSale>[1] = {}

  if (typeof body.name === "string") input.name = body.name.trim()
  if (body.discountPct !== undefined) {
    const pct = typeof body.discountPct === "number" ? body.discountPct : parseFloat(String(body.discountPct))
    if (!Number.isFinite(pct) || pct < 0 || pct > 100) {
      res.status(400).json({ message: "discountPct must be between 0 and 100." }); return
    }
    input.discountPct = pct
  }
  if (body.label !== undefined) input.label = typeof body.label === "string" ? body.label.trim() : ""
  if (body.active !== undefined) input.active = body.active === true || body.active === "true"

  try {
    const sale = await updateSale(id, input)
    if (!sale) { res.status(404).json({ message: "Sale not found." }); return }
    res.status(200).json({ sale })
  } catch (err: unknown) {
    res.status(500).json({ message: err instanceof Error ? err.message : "Failed to update sale." })
  }
}

export async function DELETE(req: MedusaRequest, res: MedusaResponse): Promise<void> {
  const id = Number(req.params.id)
  if (!Number.isInteger(id)) { res.status(400).json({ message: "Invalid sale id." }); return }
  const deleted = await deleteSale(id)
  if (!deleted) { res.status(404).json({ message: "Sale not found." }); return }
  res.status(200).json({ deleted: true })
}
