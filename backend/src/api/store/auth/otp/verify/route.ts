import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import {
  confirmVerificationCode,
  isVerificationChannel,
  normalizeVerificationValue,
} from "../../../../../lib/auth-verification"

type VerifyBody = { channel?: unknown; value?: unknown; code?: unknown; requestId?: unknown }

export async function POST(req: MedusaRequest<VerifyBody>, res: MedusaResponse): Promise<void> {
  const body = (req.validatedBody ?? req.body ?? {}) as VerifyBody
  const channel = typeof body.channel === "string" ? body.channel : "email"
  const value = typeof body.value === "string" ? body.value.trim() : ""
  const code = typeof body.code === "string" ? body.code.trim() : ""
  const requestId = typeof body.requestId === "string" ? body.requestId.trim() : undefined

  if (!isVerificationChannel(channel)) {
    res.status(400).json({ message: "channel must be 'email' or 'phone'." })
    return
  }
  if (!value || !code) {
    res.status(400).json({ message: "value and code are required." })
    return
  }

  try {
    const { verificationToken } = await confirmVerificationCode({ channel, value, code, requestId })
    res.status(200).json({ verificationToken })
  } catch (err: unknown) {
    res.status(400).json({ message: err instanceof Error ? err.message : "Verification failed." })
  }
}
