import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { authenticateCustomer } from "../../../lib/customer-auth"
import { createSiteFeedback } from "../../../lib/site-feedback"

type CreateFeedbackBody = {
  message?: unknown
  email?: unknown
  name?: unknown
  rating?: unknown
  category?: unknown
  page_url?: unknown
}

const normalizeString = (value: unknown): string => (typeof value === "string" ? value.trim() : "")

export async function POST(req: MedusaRequest<CreateFeedbackBody>, res: MedusaResponse): Promise<void> {
  const body = (req.validatedBody ?? req.body ?? {}) as CreateFeedbackBody
  const message = normalizeString(body.message)

  if (!message) {
    res.status(400).json({ message: "Feedback message is required." })
    return
  }

  // Feedback can be submitted by guests or signed-in customers. Auth is
  // best-effort here so a missing/expired token never blocks submission.
  const customer = await authenticateCustomer(req.headers.authorization).catch(() => null)
  const ratingRaw = typeof body.rating === "number" ? body.rating : Number(body.rating)

  try {
    const feedback = await createSiteFeedback({
      customerId: customer?.customerId ?? null,
      email: normalizeString(body.email) || customer?.email,
      name: normalizeString(body.name),
      rating: Number.isFinite(ratingRaw) ? ratingRaw : undefined,
      category: normalizeString(body.category) || "general",
      message,
      pageUrl: normalizeString(body.page_url)
    })

    res.status(201).json({ feedback, message: "Thanks for your feedback!" })
  } catch (error: unknown) {
    res.status(500).json({ message: error instanceof Error ? error.message : "Failed to submit feedback." })
  }
}

