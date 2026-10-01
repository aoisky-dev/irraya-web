import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { withPooledClient } from "../../../../lib/db"
import { createVerificationRequest } from "../../../../lib/auth-verification"

type ForgotPasswordBody = { email?: unknown }

const SSO_PROVIDER_LABELS: Record<string, string> = {
  google: "Google",
  github: "GitHub",
  apple: "Apple",
}

async function ensureProviderIdentityTable(client: import("pg").PoolClient): Promise<void> {
  // provider_identity is a Medusa core table — always exists, no DDL needed
}

export async function POST(req: MedusaRequest<ForgotPasswordBody>, res: MedusaResponse): Promise<void> {
  const body = (req.validatedBody ?? req.body ?? {}) as ForgotPasswordBody
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : ""

  if (!email || !email.includes("@")) {
    res.status(400).json({ message: "A valid email address is required." })
    return
  }

  try {
    const providers = await withPooledClient("provider_identity_check", ensureProviderIdentityTable, async (client) => {
      const result = await client.query(
        `select provider from provider_identity where entity_id = $1 and deleted_at is null`,
        [email]
      )
      return result.rows.map((r: any) => r.provider as string)
    })

    const hasEmailPass = providers.includes("emailpass")
    const ssoProviders = providers.filter(p => p !== "emailpass")

    if (!hasEmailPass && ssoProviders.length > 0) {
      const label = SSO_PROVIDER_LABELS[ssoProviders[0]] ?? ssoProviders[0]
      res.status(400).json({
        message: `This account uses ${label} sign-in and doesn't have a password. Please sign in with ${label} instead.`,
        provider: ssoProviders[0],
      })
      return
    }

    // No account — respond with success to avoid email enumeration
    if (providers.length === 0) {
      res.status(200).json({ message: "If an account exists for this email, a reset code has been sent." })
      return
    }

    const { requestId, expiresAt } = await createVerificationRequest("email", email)
    res.status(200).json({ requestId, expiresAt, message: "If an account exists for this email, a reset code has been sent." })
  } catch (err: unknown) {
    res.status(500).json({ message: err instanceof Error ? err.message : "Failed to send reset code." })
  }
}
