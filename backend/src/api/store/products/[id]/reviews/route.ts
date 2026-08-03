import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { authenticateCustomer } from "../../../../../lib/customer-auth"
import { createProductReview, getReviewSummary, hasVerifiedPurchase, listProductReviews } from "../../../../../lib/customer-commerce"

type CreateReviewBody = {
  rating?: unknown
  text?: unknown
  author_name?: unknown
  image_urls?: unknown
}

const normalizeString = (value: unknown): string => (typeof value === "string" ? value.trim() : "")
const normalizeRating = (value: unknown): number => {
  const rating = typeof value === "number" ? value : typeof value === "string" ? Number(value) : NaN
  if (!Number.isFinite(rating)) return 0
  return Math.min(Math.max(Math.round(rating), 1), 5)
}
const normalizeImageUrls = (value: unknown): string[] => Array.isArray(value)
  ? value.map(normalizeString).filter(Boolean).slice(0, 5)
  : []

export async function GET(req: MedusaRequest, res: MedusaResponse): Promise<void> {
  const productId = normalizeString(req.params.id)

  if (!productId) {
    res.status(400).json({ message: "Product id is required." })
    return
  }

  try {
    const [reviews, summary] = await Promise.all([
      listProductReviews(productId),
      getReviewSummary(productId)
    ])
    res.status(200).json({ reviews, summary })
  } catch (error: unknown) {
    res.status(500).json({ message: error instanceof Error ? error.message : "Failed to load reviews." })
  }
}

export async function POST(req: MedusaRequest<CreateReviewBody>, res: MedusaResponse): Promise<void> {
  const customer = await authenticateCustomer(req.headers.authorization)
  if (!customer) {
    res.status(401).json({ message: "Sign in to write a review." })
    return
  }

  const productId = normalizeString(req.params.id)
  const body = (req.validatedBody ?? req.body ?? {}) as CreateReviewBody
  const rating = normalizeRating(body.rating)
  const text = normalizeString(body.text)
  const authorName = normalizeString(body.author_name) || customer.email || "Irraya customer"

  if (!productId) {
    res.status(400).json({ message: "Product id is required." })
    return
  }

  if (!rating || !text) {
    res.status(400).json({ message: "Rating and review text are required." })
    return
  }

  try {
    const verifiedPurchase = await hasVerifiedPurchase(customer.customerId, productId)
    const review = await createProductReview({
      productId,
      customerId: customer.customerId,
      authorName,
      rating,
      text,
      imageUrls: normalizeImageUrls(body.image_urls),
      verifiedPurchase
    })

    res.status(201).json({
      review,
      message: "Review submitted and pending moderation."
    })
  } catch (error: unknown) {
    res.status(500).json({ message: error instanceof Error ? error.message : "Failed to submit review." })
  }
}

