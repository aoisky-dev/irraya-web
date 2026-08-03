import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { authenticateCustomer } from "../../../../../lib/customer-auth"
import { addWishlistItem, listWishlistItems, removeWishlistItem } from "../../../../../lib/customer-commerce"

type WishlistBody = {
  product_id?: unknown
  product?: unknown
}

const normalizeString = (value: unknown): string => (typeof value === "string" ? value.trim() : "")

async function requireCustomer(req: MedusaRequest, res: MedusaResponse) {
  const customer = await authenticateCustomer(req.headers.authorization)
  if (!customer) {
    res.status(401).json({ message: "Sign in to manage your wishlist." })
    return null
  }
  return customer
}

export async function GET(req: MedusaRequest, res: MedusaResponse): Promise<void> {
  const customer = await requireCustomer(req, res)
  if (!customer) return

  try {
    const items = await listWishlistItems(customer.customerId)
    res.status(200).json({ items })
  } catch (error: unknown) {
    res.status(500).json({ message: error instanceof Error ? error.message : "Failed to load wishlist." })
  }
}

export async function POST(req: MedusaRequest<WishlistBody>, res: MedusaResponse): Promise<void> {
  const customer = await requireCustomer(req, res)
  if (!customer) return

  const body = (req.validatedBody ?? req.body ?? {}) as WishlistBody
  const productId = normalizeString(body.product_id)

  if (!productId) {
    res.status(400).json({ message: "Product id is required." })
    return
  }

  try {
    const item = await addWishlistItem(customer.customerId, productId, body.product)
    res.status(200).json({ item })
  } catch (error: unknown) {
    res.status(500).json({ message: error instanceof Error ? error.message : "Failed to save wishlist item." })
  }
}

export async function DELETE(req: MedusaRequest<WishlistBody>, res: MedusaResponse): Promise<void> {
  const customer = await requireCustomer(req, res)
  if (!customer) return

  const body = (req.validatedBody ?? req.body ?? {}) as WishlistBody
  const productId = normalizeString(body.product_id ?? req.query?.product_id)

  if (!productId) {
    res.status(400).json({ message: "Product id is required." })
    return
  }

  try {
    await removeWishlistItem(customer.customerId, productId)
    res.status(200).json({ removed: true })
  } catch (error: unknown) {
    res.status(500).json({ message: error instanceof Error ? error.message : "Failed to remove wishlist item." })
  }
}

