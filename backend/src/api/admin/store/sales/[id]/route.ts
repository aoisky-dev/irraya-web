import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { Modules } from "@medusajs/framework/utils"
import { getSaleById, updateSale, deleteSale, savePriceListId } from "../../../../../lib/sales-config"
import { syncSalePriceList } from "../../../../../lib/price-list-sync"

export async function GET(req: MedusaRequest, res: MedusaResponse): Promise<void> {
  const id = Number(req.params.id)
  if (!Number.isInteger(id)) { res.status(400).json({ message: "Invalid sale id." }); return }
  const sale = await getSaleById(id)
  if (!sale) { res.status(404).json({ message: "Sale not found." }); return }
  res.status(200).json({ sale })
}

type UpdateSaleBody = { name?: unknown; discountPct?: unknown; label?: unknown; active?: unknown; startsAt?: unknown; endsAt?: unknown }

function parseDate(val: unknown): string | null | undefined {
  if (val === null || val === "") return null  // explicit clear
  if (typeof val !== "string") return undefined  // not provided — skip
  const d = new Date(val)
  return Number.isNaN(d.getTime()) ? undefined : d.toISOString()
}

export async function PUT(req: MedusaRequest<UpdateSaleBody>, res: MedusaResponse): Promise<void> {
  const id = Number(req.params.id)
  if (!Number.isInteger(id)) { res.status(400).json({ message: "Invalid sale id." }); return }

  const body = (req.validatedBody ?? req.body ?? {}) as UpdateSaleBody
  const input: Parameters<typeof updateSale>[1] = {}

  if (typeof body.name === "string") {
    const trimmed = body.name.trim()
    if (!trimmed) { res.status(400).json({ message: "name cannot be empty." }); return }
    input.name = trimmed
  }
  if (body.discountPct !== undefined) {
    const pct = typeof body.discountPct === "number" ? body.discountPct : parseFloat(String(body.discountPct))
    if (!Number.isFinite(pct) || pct < 0 || pct > 100) {
      res.status(400).json({ message: "discountPct must be between 0 and 100." }); return
    }
    input.discountPct = pct
  }
  if (body.label !== undefined) input.label = typeof body.label === "string" ? body.label.trim() : ""
  if (body.active !== undefined) input.active = body.active === true || body.active === "true"
  if ("startsAt" in body) { const v = parseDate(body.startsAt); if (v !== undefined) input.startsAt = v }
  if ("endsAt" in body) { const v = parseDate(body.endsAt); if (v !== undefined) input.endsAt = v }

  try {
    const sale = await updateSale(id, input)
    if (!sale) { res.status(404).json({ message: "Sale not found." }); return }
    let syncWarning: string | undefined
    const priceListId = await syncSalePriceList(req.scope, sale).catch((err: unknown) => {
      syncWarning = err instanceof Error ? err.message : "Price list sync failed"
      console.error("[sale sync] update failed:", err)
      return null
    })
    if (priceListId !== sale.priceListId) await savePriceListId(id, priceListId).catch(() => {})
    res.status(200).json({ sale: { ...sale, priceListId: priceListId ?? undefined }, syncWarning })
  } catch (err: unknown) {
    res.status(500).json({ message: err instanceof Error ? err.message : "Failed to update sale." })
  }
}

export async function DELETE(req: MedusaRequest, res: MedusaResponse): Promise<void> {
  const id = Number(req.params.id)
  if (!Number.isInteger(id)) { res.status(400).json({ message: "Invalid sale id." }); return }
  const sale = await getSaleById(id)
  if (!sale) { res.status(404).json({ message: "Sale not found." }); return }
  // Clean up Medusa price list before deleting the record
  if (sale.priceListId) {
    const pricingModule = req.scope.resolve(Modules.PRICING)
    await pricingModule.deletePriceLists([sale.priceListId]).catch(() => {})
  }
  const deleted = await deleteSale(id)
  if (!deleted) { res.status(404).json({ message: "Sale not found." }); return }
  res.status(200).json({ deleted: true })
}
