import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { assignProducts, removeProducts } from "../../../../../../lib/sales-config"

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
    res.status(200).json(result)
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
    res.status(200).json({ removed: true })
  } catch (err: unknown) {
    res.status(500).json({ message: err instanceof Error ? err.message : "Failed to remove products." })
  }
}
