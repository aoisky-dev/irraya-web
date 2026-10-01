import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import {
  createVerificationRequest,
  confirmVerificationCode,
  isVerificationChannel,
  normalizeVerificationValue,
} from "../../../../lib/auth-verification"

// POST /store/auth/otp/send
type SendBody = { channel?: unknown; value?: unknown }

export async function POST(req: MedusaRequest<SendBody>, res: MedusaResponse): Promise<void> {
  const body = (req.validatedBody ?? req.body ?? {}) as SendBody
  const channel = typeof body.channel === "string" ? body.channel : "email"
  const value = typeof body.value === "string" ? body.value.trim() : ""

  if (!isVerificationChannel(channel)) {
    res.status(400).json({ message: "channel must be 'email' or 'phone'." })
    return
  }
  if (!value) {
    res.status(400).json({ message: "value is required." })
    return
  }

  try {
    const { requestId, expiresAt } = await createVerificationRequest(channel, value)
    res.status(200).json({ requestId, expiresAt })
  } catch (err: unknown) {
    res.status(500).json({ message: err instanceof Error ? err.message : "Failed to send code." })
  }
}
