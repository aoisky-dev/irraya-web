import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { listSales, createSale, savePriceListId } from "../../../../lib/sales-config"
import { syncSalePriceList } from "../../../../lib/price-list-sync"

export async function GET(_req: MedusaRequest, res: MedusaResponse): Promise<void> {
  try {
    const sales = await listSales()
    res.status(200).json({ sales })
  } catch (err: unknown) {
    res.status(500).json({ message: err instanceof Error ? err.message : "Failed to fetch sales." })
  }
}

type CreateSaleBody = { name?: unknown; discountPct?: unknown; label?: unknown; active?: unknown; startsAt?: unknown; endsAt?: unknown }

function parseDate(val: unknown): string | undefined {
  if (typeof val !== "string" || !val.trim()) return undefined
  const d = new Date(val)
  return Number.isNaN(d.getTime()) ? undefined : d.toISOString()
}

export async function POST(req: MedusaRequest<CreateSaleBody>, res: MedusaResponse): Promise<void> {
  const body = (req.validatedBody ?? req.body ?? {}) as CreateSaleBody
  const name = typeof body.name === "string" ? body.name.trim() : ""
  if (!name) { res.status(400).json({ message: "name is required." }); return }

  const discountPct = typeof body.discountPct === "number" ? body.discountPct
    : typeof body.discountPct === "string" ? parseFloat(body.discountPct) : 0

  if (!Number.isFinite(discountPct) || discountPct < 0 || discountPct > 100) {
    res.status(400).json({ message: "discountPct must be between 0 and 100." }); return
  }

  try {
    const sale = await createSale({
      name,
      discountPct,
      label: typeof body.label === "string" ? body.label.trim() || undefined : undefined,
      active: body.active === true || body.active === "true",
      startsAt: parseDate(body.startsAt),
      endsAt: parseDate(body.endsAt),
    })
    let syncWarning: string | undefined
    const priceListId = await syncSalePriceList(req.scope, sale).catch((err: unknown) => {
      syncWarning = err instanceof Error ? err.message : "Price list sync failed"
      console.error("[sale sync] create failed:", err)
      return null
    })
    if (priceListId !== null) await savePriceListId(sale.id, priceListId).catch(() => {})
    res.status(201).json({ sale: { ...sale, priceListId: priceListId ?? undefined }, syncWarning })
  } catch (err: unknown) {
    res.status(500).json({ message: err instanceof Error ? err.message : "Failed to create sale." })
  }
}
