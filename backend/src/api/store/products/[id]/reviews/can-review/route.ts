import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { authenticateCustomer } from "../../../../../../lib/customer-auth"
import { hasVerifiedPurchase, customerHasReviewed } from "../../../../../../lib/customer-commerce"

/**
 * GET /store/products/:id/reviews/can-review
 * Returns { canReview: true } if the authenticated customer has a delivered order for this product and hasn't reviewed it yet.
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
    if (!canReview) {
      res.status(200).json({ canReview: false, reason: "no_delivered_order" })
      return
    }

    const hasReviewed = await customerHasReviewed(customer.customerId, productId)
    if (hasReviewed) {
      res.status(200).json({ canReview: false, reason: "already_reviewed" })
      return
    }

    res.status(200).json({ canReview: true, reason: "verified_purchase" })
  } catch {
    res.status(200).json({ canReview: false, reason: "error" })
  }
}
