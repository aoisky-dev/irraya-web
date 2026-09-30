import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { createVerificationRequest, normalizeVerificationValue } from "../../../../lib/auth-verification"

type ForgotPasswordBody = { email?: unknown }

export async function POST(req: MedusaRequest<ForgotPasswordBody>, res: MedusaResponse): Promise<void> {
  const body = (req.validatedBody ?? req.body ?? {}) as ForgotPasswordBody
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : ""

  if (!email || !email.includes("@")) {
    res.status(400).json({ message: "A valid email address is required." })
    return
  }

  try {
    // Always respond with success to avoid leaking whether the email exists.
    // createVerificationRequest sends the OTP email internally.
    const { requestId, expiresAt } = await createVerificationRequest("email", email)
    res.status(200).json({ requestId, expiresAt, message: "If an account exists for this email, a reset code has been sent." })
  } catch (err: unknown) {
    res.status(500).json({ message: err instanceof Error ? err.message : "Failed to send reset code." })
  }
}
