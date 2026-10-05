import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { authenticateCustomer } from "../../../../../../lib/customer-auth"
import { updateProductReview, deleteProductReview } from "../../../../../../lib/customer-commerce"

type UpdateReviewBody = {
  rating?: unknown
  text?: unknown
}

const normalizeString = (value: unknown): string => (typeof value === "string" ? value.trim() : "")
const normalizeRating = (value: unknown): number => {
  const rating = typeof value === "number" ? value : typeof value === "string" ? Number(value) : NaN
  if (!Number.isFinite(rating)) return 0
  return Math.min(Math.max(Math.round(rating), 1), 5)
}

export async function PATCH(req: MedusaRequest<UpdateReviewBody>, res: MedusaResponse): Promise<void> {
  const customer = await authenticateCustomer(req.headers.authorization)
  if (!customer) {
    res.status(401).json({ message: "Sign in to edit your review." })
    return
  }

  const reviewIdStr = normalizeString(req.params.reviewId)
  if (!reviewIdStr || isNaN(Number(reviewIdStr))) {
    res.status(400).json({ message: "Valid review id is required." })
    return
  }
  const reviewId = Number(reviewIdStr)

  const body = (req.validatedBody ?? req.body ?? {}) as UpdateReviewBody
  const rating = body.rating ? normalizeRating(body.rating) : undefined
  const text = body.text ? normalizeString(body.text) : undefined

  try {
    const updatedReview = await updateProductReview(reviewId, customer.customerId, { rating, text })
    if (!updatedReview) {
      res.status(404).json({ message: "Review not found or you don't have permission to edit it." })
      return
    }
    res.status(200).json({ review: updatedReview, message: "Review updated successfully." })
  } catch (error: unknown) {
    res.status(500).json({ message: error instanceof Error ? error.message : "Failed to update review." })
  }
}

export async function DELETE(req: MedusaRequest, res: MedusaResponse): Promise<void> {
  const customer = await authenticateCustomer(req.headers.authorization)
  if (!customer) {
    res.status(401).json({ message: "Sign in to delete your review." })
    return
  }

  const reviewIdStr = normalizeString(req.params.reviewId)
  if (!reviewIdStr || isNaN(Number(reviewIdStr))) {
    res.status(400).json({ message: "Valid review id is required." })
    return
  }
  const reviewId = Number(reviewIdStr)

  try {
    const success = await deleteProductReview(reviewId, customer.customerId)
    if (!success) {
      res.status(404).json({ message: "Review not found or you don't have permission to delete it." })
      return
    }
    res.status(200).json({ message: "Review deleted successfully." })
  } catch (error: unknown) {
    res.status(500).json({ message: error instanceof Error ? error.message : "Failed to delete review." })
  }
}
