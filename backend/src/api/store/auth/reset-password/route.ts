import crypto from "node:crypto"
import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import scrypt from "scrypt-kdf"
import { verifyVerificationToken } from "../../../../lib/auth-verification"
import { withPooledClient } from "../../../../lib/db"

type ResetPasswordBody = {
  verificationToken?: unknown
  newPassword?: unknown
}

function isValidPassword(value: unknown): value is string {
  return typeof value === "string" && value.length >= 8 && /[!@#$%^&*(),.?":{}|<>\[\]\\\/;'`~_\-+=]/.test(value)
}

export async function POST(req: MedusaRequest<ResetPasswordBody>, res: MedusaResponse): Promise<void> {
  const body = (req.validatedBody ?? req.body ?? {}) as ResetPasswordBody
  const token = typeof body.verificationToken === "string" ? body.verificationToken.trim() : ""
  const newPassword = typeof body.newPassword === "string" ? body.newPassword : ""

  if (!token) {
    res.status(400).json({ message: "Verification token is required." })
    return
  }

  if (!isValidPassword(newPassword)) {
    res.status(400).json({ message: "Password must be at least 8 characters and include at least one special character." })
    return
  }

  const payload = verifyVerificationToken(token)
  if (!payload || payload.channel !== "email") {
    res.status(400).json({ message: "Invalid or expired verification token." })
    return
  }

  const email = payload.value.toLowerCase()

  try {
    await withPooledClient("provider_identity_reset", async () => {}, async (client) => {
      const identityResult = await client.query(
        `select id from provider_identity
         where entity_id = $1 and provider = 'emailpass' and deleted_at is null
         limit 1`,
        [email]
      )

      if (identityResult.rows.length === 0) {
        res.status(200).json({ message: "Password reset successfully." })
        return
      }

      const identity = identityResult.rows[0]
      const newHash = (await scrypt.kdf(newPassword, { logN: 15, r: 8, p: 1 })).toString("base64")

      await client.query(
        `update provider_identity
         set provider_metadata = jsonb_set(coalesce(provider_metadata, '{}'::jsonb), '{password}', to_jsonb($1::text), true),
             updated_at = now()
         where id = $2`,
        [newHash, identity.id]
      )

      res.status(200).json({ message: "Password reset successfully." })
    })
  } catch (err: unknown) {
    res.status(500).json({ message: err instanceof Error ? err.message : "Failed to reset password." })
  }
}
