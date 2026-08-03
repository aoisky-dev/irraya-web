import crypto from "node:crypto"
import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import pg from "pg"
import scrypt from "scrypt-kdf"

type ChangePasswordBody = {
  email?: unknown
  current_password?: unknown
  new_password?: unknown
}

type CustomerAuthToken = {
  actor_id?: string
  actor_type?: string
  auth_identity_id?: string
  exp?: number
}

const { Client } = pg

function base64UrlDecode(value: string): Buffer {
  return Buffer.from(value, "base64url")
}

function verifyCustomerToken(authHeader: string | undefined): CustomerAuthToken | null {
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice("Bearer ".length).trim() : ""
  if (!token) return null

  const [header, payload, signature] = token.split(".")
  if (!header || !payload || !signature) return null

  const secret = process.env.JWT_SECRET
  if (!secret) return null

  const expected = crypto.createHmac("sha256", secret).update(`${header}.${payload}`).digest("base64url")
  const providedBuffer = Buffer.from(signature)
  const expectedBuffer = Buffer.from(expected)

  if (providedBuffer.length !== expectedBuffer.length || !crypto.timingSafeEqual(providedBuffer, expectedBuffer)) {
    return null
  }

  try {
    const parsed = JSON.parse(base64UrlDecode(payload).toString("utf8")) as CustomerAuthToken
    if (parsed.exp && parsed.exp * 1000 <= Date.now()) return null
    if (parsed.actor_type !== "customer" || !parsed.auth_identity_id) return null
    return parsed
  } catch {
    return null
  }
}

function isValidPassword(value: unknown): value is string {
  return typeof value === "string" && value.length >= 8 && /[!@#$%^&*(),.?":{}|<>\[\]\\\/;'`~_\-+=]/.test(value)
}

export async function POST(req: MedusaRequest<ChangePasswordBody>, res: MedusaResponse): Promise<void> {
  const body = (req.validatedBody ?? req.body ?? {}) as ChangePasswordBody
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : ""
  const currentPassword = typeof body.current_password === "string" ? body.current_password : ""
  const newPassword = typeof body.new_password === "string" ? body.new_password : ""

  if (!email || !currentPassword || !newPassword) {
    res.status(400).json({ message: "Email, current password, and new password are required." })
    return
  }

  if (!isValidPassword(newPassword)) {
    res.status(400).json({ message: "Password must be at least 8 characters and include at least one special character." })
    return
  }

  if (currentPassword === newPassword) {
    res.status(400).json({ message: "New password must be different from current password." })
    return
  }

  const auth = verifyCustomerToken(req.headers.authorization)
  if (!auth) {
    res.status(401).json({ message: "Unauthorized" })
    return
  }

  const client = new Client({ connectionString: process.env.DATABASE_URL })

  try {
    await client.connect()

    const identityResult = await client.query(
      `select id, entity_id, provider_metadata
       from provider_identity
       where auth_identity_id = $1
         and provider = 'emailpass'
         and deleted_at is null
       limit 1`,
      [auth.auth_identity_id]
    )

    const identity = identityResult.rows[0]
    if (!identity || identity.entity_id?.toLowerCase() !== email) {
      res.status(403).json({ message: "Unable to change password for this account." })
      return
    }

    const currentHash = identity.provider_metadata?.password
    if (typeof currentHash !== "string") {
      res.status(400).json({ message: "Password credentials are not configured for this account." })
      return
    }

    const currentMatches = await scrypt.verify(Buffer.from(currentHash, "base64"), currentPassword)
    if (!currentMatches) {
      res.status(400).json({ message: "Current password is incorrect." })
      return
    }

    const nextHash = (await scrypt.kdf(newPassword, { logN: 15, r: 8, p: 1 })).toString("base64")

    await client.query(
      `update provider_identity
       set provider_metadata = jsonb_set(coalesce(provider_metadata, '{}'::jsonb), '{password}', to_jsonb($1::text), true),
           updated_at = now()
       where id = $2`,
      [nextHash, identity.id]
    )

    res.status(200).json({ message: "Password changed successfully." })
  } catch (error: unknown) {
    res.status(500).json({ message: error instanceof Error ? error.message : "Failed to change password." })
  } finally {
    await client.end().catch(() => undefined)
  }
}

