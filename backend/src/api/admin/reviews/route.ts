import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { authenticateCustomer } from "../../../lib/customer-auth"
import { listReviewsForModeration, moderateReview, type ReviewStatus } from "../../../lib/customer-commerce"

type ModerateReviewBody = {
  review_id?: unknown
  status?: unknown
  note?: unknown
}

const normalizeString = (value: unknown): string => (typeof value === "string" ? value.trim() : "")

async function requireAdmin(req: MedusaRequest, res: MedusaResponse) {
  const customer = await authenticateCustomer(req.headers.authorization)
  if (!customer || customer.role !== "admin") {
    res.status(403).json({ message: "Admin access is required." })
    return null
  }
  return customer
}

export async function GET(req: MedusaRequest, res: MedusaResponse): Promise<void> {
  const admin = await requireAdmin(req, res)
  if (!admin) return

  try {
    const reviews = await listReviewsForModeration(normalizeString(req.query?.status))
    res.status(200).json({ reviews })
  } catch (error: unknown) {
    res.status(500).json({ message: error instanceof Error ? error.message : "Failed to load reviews." })
  }
}

export async function PATCH(req: MedusaRequest<ModerateReviewBody>, res: MedusaResponse): Promise<void> {
  const admin = await requireAdmin(req, res)
  if (!admin) return

  const body = (req.validatedBody ?? req.body ?? {}) as ModerateReviewBody
  const reviewId = typeof body.review_id === "number" ? body.review_id : Number(body.review_id)
  const status = normalizeString(body.status) as ReviewStatus

  if (!Number.isFinite(reviewId) || !["pending", "approved", "rejected"].includes(status)) {
    res.status(400).json({ message: "Valid review id and status are required." })
    return
  }

  try {
    const review = await moderateReview({
      reviewId: Math.round(reviewId),
      status,
      note: normalizeString(body.note)
    })

    if (!review) {
      res.status(404).json({ message: "Review not found." })
      return
    }

    res.status(200).json({ review })
  } catch (error: unknown) {
    res.status(500).json({ message: error instanceof Error ? error.message : "Failed to moderate review." })
  }
}

