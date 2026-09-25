import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { authenticateCustomer } from "../../../lib/customer-auth"
import { listSiteFeedback, updateSiteFeedbackStatus, type SiteFeedbackStatus } from "../../../lib/site-feedback"

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
    const feedback = await listSiteFeedback(normalizeString(req.query?.status))
    res.status(200).json({ feedback })
  } catch (error: unknown) {
    res.status(500).json({ message: error instanceof Error ? error.message : "Failed to load feedback." })
  }
}

type UpdateFeedbackBody = { id?: unknown; status?: unknown }

export async function PATCH(req: MedusaRequest<UpdateFeedbackBody>, res: MedusaResponse): Promise<void> {
  const admin = await requireAdmin(req, res)
  if (!admin) return

  const body = (req.validatedBody ?? req.body ?? {}) as UpdateFeedbackBody
  const id = typeof body.id === "number" ? body.id : Number(body.id)
  const status = normalizeString(body.status) as SiteFeedbackStatus

  if (!Number.isFinite(id) || !["new", "reviewed", "resolved"].includes(status)) {
    res.status(400).json({ message: "Valid feedback id and status are required." })
    return
  }

  try {
    const feedback = await updateSiteFeedbackStatus(Math.round(id), status)
    if (!feedback) {
      res.status(404).json({ message: "Feedback not found." })
      return
    }
    res.status(200).json({ feedback })
  } catch (error: unknown) {
    res.status(500).json({ message: error instanceof Error ? error.message : "Failed to update feedback." })
  }
}

