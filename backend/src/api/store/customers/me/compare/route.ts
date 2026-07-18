import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { authenticateCustomer } from "../../../../../lib/customer-auth"
import { listCompareItems, replaceCompareItems } from "../../../../../lib/customer-commerce"

type CompareBody = {
  items?: Array<{
    product_id?: unknown
    product?: unknown
  }>
}

const normalizeString = (value: unknown): string => (typeof value === "string" ? value.trim() : "")

async function requireCustomer(req: MedusaRequest, res: MedusaResponse) {
  const customer = await authenticateCustomer(req.headers.authorization)
  if (!customer) {
    res.status(401).json({ message: "Sign in to sync your compare list." })
    return null
  }
  return customer
}

export async function GET(req: MedusaRequest, res: MedusaResponse): Promise<void> {
  const customer = await requireCustomer(req, res)
  if (!customer) return

  try {
    const items = await listCompareItems(customer.customerId)
    res.status(200).json({ items })
  } catch (error: unknown) {
    res.status(500).json({ message: error instanceof Error ? error.message : "Failed to load compare list." })
  }
}

export async function PUT(req: MedusaRequest<CompareBody>, res: MedusaResponse): Promise<void> {
  const customer = await requireCustomer(req, res)
  if (!customer) return

  const body = (req.validatedBody ?? req.body ?? {}) as CompareBody
  const items = Array.isArray(body.items)
    ? body.items.map((item) => ({
        productId: normalizeString(item.product_id),
        productSnapshot: item.product
      }))
    : []

  try {
    const saved = await replaceCompareItems(customer.customerId, items)
    res.status(200).json({ items: saved })
  } catch (error: unknown) {
    res.status(500).json({ message: error instanceof Error ? error.message : "Failed to sync compare list." })
  }
}

export async function DELETE(req: MedusaRequest, res: MedusaResponse): Promise<void> {
  const customer = await requireCustomer(req, res)
  if (!customer) return

  try {
    await replaceCompareItems(customer.customerId, [])
    res.status(200).json({ cleared: true })
  } catch (error: unknown) {
    res.status(500).json({ message: error instanceof Error ? error.message : "Failed to clear compare list." })
  }
}

