import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { createVerificationRequest, isVerificationChannel } from "../../../../../lib/auth-verification"

type RequestBody = {
  channel?: unknown
  value?: unknown
  email?: unknown
  phone?: unknown
}

export async function POST(req: MedusaRequest<RequestBody>, res: MedusaResponse): Promise<void> {
  const body = (req.validatedBody ?? req.body ?? {}) as RequestBody
  const channel = body.channel

  if (!isVerificationChannel(channel)) {
    res.status(400).json({ message: "Verification channel must be email or phone." })
    return
  }

  const value = typeof body.value === "string"
    ? body.value
    : channel === "email" && typeof body.email === "string"
      ? body.email
      : channel === "phone" && typeof body.phone === "string"
        ? body.phone
        : ""

  if (!value.trim()) {
    res.status(400).json({ message: `A ${channel} value is required.` })
    return
  }

  const request = await createVerificationRequest(channel, value)

  res.status(200).json({
    request_id: request.requestId,
    expires_at: new Date(request.expiresAt).toISOString(),
    message: "Verification code generated. Delivery is currently console-only until mail/SMS providers are configured."
  })
}

