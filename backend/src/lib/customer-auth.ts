import crypto from "node:crypto"
import { withPooledClient } from "./db"

export type CustomerAuthToken = {
  actor_id?: string
  actor_type?: string
  auth_identity_id?: string
  exp?: number
}

export type AuthenticatedCustomer = {
  customerId: string
  authIdentityId: string
  email?: string
  role: "admin" | "customer"
}

function base64UrlDecode(value: string): Buffer {
  return Buffer.from(value, "base64url")
}

export function verifyCustomerToken(authHeader: string | undefined): CustomerAuthToken | null {
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

export async function authenticateCustomer(authHeader: string | undefined): Promise<AuthenticatedCustomer | null> {
  const token = verifyCustomerToken(authHeader)
  if (!token?.auth_identity_id) return null

  try {
    return await withPooledClient(
      "customer_auth_lookup",
      async () => undefined, // no schema to ensure — these tables are managed by Medusa
      async (client) => {
        const result = await client.query(
          `select c.id, c.email, c.metadata
           from provider_identity pi
           join customer c on (c.id = $2 or lower(c.email) = lower(pi.entity_id))
           where pi.auth_identity_id = $1
             and pi.deleted_at is null
             and c.deleted_at is null
           limit 1`,
          [token.auth_identity_id, token.actor_id ?? ""]
        )

        const row = result.rows[0]
        if (!row?.id) return null

        return {
          customerId: String(row.id),
          authIdentityId: token.auth_identity_id as string,
          email: typeof row.email === "string" ? row.email : undefined,
          role: row.metadata?.role === "admin" ? "admin" : "customer"
        } satisfies AuthenticatedCustomer
      }
    )
  } catch {
    return null
  }
}




