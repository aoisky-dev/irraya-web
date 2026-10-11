import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { assignProducts, removeProducts, getSaleById, savePriceListId } from "../../../../../../lib/sales-config"
import { syncSalePriceList } from "../../../../../../lib/price-list-sync"

type ProductsBody = { productIds?: unknown }

export async function POST(req: MedusaRequest<ProductsBody>, res: MedusaResponse): Promise<void> {
  const id = Number(req.params.id)
  if (!Number.isInteger(id)) { res.status(400).json({ message: "Invalid sale id." }); return }

  const body = (req.validatedBody ?? req.body ?? {}) as ProductsBody
  const productIds = Array.isArray(body.productIds)
    ? body.productIds.filter((p): p is string => typeof p === "string" && p.trim().length > 0)
    : []

  if (productIds.length === 0) { res.status(400).json({ message: "productIds array is required." }); return }

  try {
    const result = await assignProducts(id, productIds)
    const sale = await getSaleById(id)
    let syncWarning: string | undefined
    if (sale) {
      const priceListId = await syncSalePriceList(req.scope, sale).catch((err: unknown) => {
        syncWarning = err instanceof Error ? err.message : "Price list sync failed"
        console.error("[sale sync] assign-products failed:", err)
        return null
      })
      if (priceListId !== sale.priceListId) await savePriceListId(id, priceListId).catch(() => {})
    }
    res.status(200).json({ ...result, syncWarning })
  } catch (err: unknown) {
    res.status(500).json({ message: err instanceof Error ? err.message : "Failed to assign products." })
  }
}

export async function DELETE(req: MedusaRequest<ProductsBody>, res: MedusaResponse): Promise<void> {
  const id = Number(req.params.id)
  if (!Number.isInteger(id)) { res.status(400).json({ message: "Invalid sale id." }); return }

  const body = (req.validatedBody ?? req.body ?? {}) as ProductsBody
  const productIds = Array.isArray(body.productIds)
    ? body.productIds.filter((p): p is string => typeof p === "string")
    : []

  if (productIds.length === 0) { res.status(400).json({ message: "productIds array is required." }); return }

  try {
    await removeProducts(id, productIds)
    const sale = await getSaleById(id)
    let syncWarning: string | undefined
    if (sale) {
      const priceListId = await syncSalePriceList(req.scope, sale).catch((err: unknown) => {
        syncWarning = err instanceof Error ? err.message : "Price list sync failed"
        console.error("[sale sync] remove-products failed:", err)
        return null
      })
      if (priceListId !== sale.priceListId) await savePriceListId(id, priceListId).catch(() => {})
    }
    res.status(200).json({ removed: true, syncWarning })
  } catch (err: unknown) {
    res.status(500).json({ message: err instanceof Error ? err.message : "Failed to remove products." })
  }
}
