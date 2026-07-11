import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { confirmVerificationCode, isVerificationChannel } from "../../../../../lib/auth-verification"

type ConfirmBody = {
  channel?: unknown
  value?: unknown
  email?: unknown
  phone?: unknown
  code?: unknown
  request_id?: unknown
  requestId?: unknown
}

export async function POST(req: MedusaRequest<ConfirmBody>, res: MedusaResponse): Promise<void> {
  const body = (req.validatedBody ?? req.body ?? {}) as ConfirmBody
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

  if (typeof body.code !== "string" || !body.code.trim()) {
    res.status(400).json({ message: "Verification code is required." })
    return
  }

  try {
    const result = await confirmVerificationCode({
      channel,
      value,
      code: body.code,
      requestId: typeof body.request_id === "string" ? body.request_id : typeof body.requestId === "string" ? body.requestId : undefined
    })

    res.status(200).json({
      verified: true,
      verification_token: result.verificationToken
    })
  } catch (error: unknown) {
    res.status(400).json({
      verified: false,
      message: error instanceof Error ? error.message : "Verification failed."
    })
  }
}

