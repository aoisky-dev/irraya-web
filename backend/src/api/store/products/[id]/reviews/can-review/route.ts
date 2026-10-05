import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { authenticateCustomer } from "../../../../../../lib/customer-auth"
import { hasVerifiedPurchase } from "../../../../../../lib/customer-commerce"

/**
 * GET /store/products/:id/reviews/can-review
 * Returns { canReview: true } if the authenticated customer has a delivered order for this product.
 */
export async function GET(req: MedusaRequest, res: MedusaResponse): Promise<void> {
  const customer = await authenticateCustomer(req.headers.authorization)
  if (!customer) {
    res.status(200).json({ canReview: false, reason: "not_authenticated" })
    return
  }

  const productId = typeof req.params.id === "string" ? req.params.id.trim() : ""
  if (!productId) {
    res.status(200).json({ canReview: false, reason: "invalid_product" })
    return
  }

  try {
    const canReview = await hasVerifiedPurchase(customer.customerId, productId)
    res.status(200).json({ canReview, reason: canReview ? "verified_purchase" : "no_delivered_order" })
  } catch {
    res.status(200).json({ canReview: false, reason: "error" })
  }
}
