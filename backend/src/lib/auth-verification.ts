import { createHash, createHmac, randomInt, randomUUID, timingSafeEqual } from "node:crypto"

export type VerificationChannel = "email" | "phone"

type VerificationRecord = {
  channel: VerificationChannel
  value: string
  codeHash: string
  expiresAt: number
  attempts: number
}

type VerificationTokenPayload = {
  channel: VerificationChannel
  value: string
  exp: number
}

const store = new Map<string, VerificationRecord>()

const ttlSeconds = (): number => Number.parseInt(process.env.OTP_TTL_SECONDS || "600", 10)
const maxAttempts = (): number => Number.parseInt(process.env.OTP_MAX_ATTEMPTS || "5", 10)
const tokenTtlSeconds = (): number => Number.parseInt(process.env.VERIFICATION_TOKEN_TTL_SECONDS || "900", 10)
const signingSecret = (): string => process.env.VERIFICATION_TOKEN_SECRET || process.env.JWT_SECRET || "dev_verification_secret"

export function normalizeVerificationValue(channel: VerificationChannel, value: string): string {
  const trimmed = value.trim()
  return channel === "email" ? trimmed.toLowerCase() : trimmed.replace(/[\s()-]/g, "")
}

export function isVerificationChannel(value: unknown): value is VerificationChannel {
  return value === "email" || value === "phone"
}

function hashCode(requestId: string, code: string): string {
  return createHash("sha256").update(`${requestId}:${code}:${signingSecret()}`).digest("hex")
}

function signPayload(payload: VerificationTokenPayload): string {
  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString("base64url")
  const signature = createHmac("sha256", signingSecret()).update(encodedPayload).digest("base64url")
  return `${encodedPayload}.${signature}`
}

export function verifyVerificationToken(token: string): VerificationTokenPayload | null {
  const [encodedPayload, signature] = token.split(".")
  if (!encodedPayload || !signature) return null

  const expected = createHmac("sha256", signingSecret()).update(encodedPayload).digest("base64url")
  const providedBuffer = Buffer.from(signature)
  const expectedBuffer = Buffer.from(expected)

  if (providedBuffer.length !== expectedBuffer.length || !timingSafeEqual(providedBuffer, expectedBuffer)) {
    return null
  }

  try {
    const payload = JSON.parse(Buffer.from(encodedPayload, "base64url").toString("utf8")) as VerificationTokenPayload
    return payload.exp > Date.now() ? payload : null
  } catch {
    return null
  }
}

export async function createVerificationRequest(channel: VerificationChannel, rawValue: string): Promise<{ requestId: string; expiresAt: number }> {
  const value = normalizeVerificationValue(channel, rawValue)
  const code = String(randomInt(0, 1_000_000)).padStart(6, "0")
  const requestId = `otp_${randomUUID()}`
  const expiresAt = Date.now() + ttlSeconds() * 1000

  store.set(requestId, {
    channel,
    value,
    codeHash: hashCode(requestId, code),
    expiresAt,
    attempts: 0
  })

  // Detached delivery mode: no mail/SMS provider is configured yet.
  // When providers are added, replace this console delivery with provider dispatch.
  console.info(`[Irraya OTP] ${channel} ${value} code: ${code}`)

  return { requestId, expiresAt }
}

export async function confirmVerificationCode(input: {
  channel: VerificationChannel
  value: string
  code: string
  requestId?: string
}): Promise<{ verificationToken: string }> {
  const value = normalizeVerificationValue(input.channel, input.value)
  const now = Date.now()

  const candidates = input.requestId
    ? [[input.requestId, store.get(input.requestId)] as const]
    : Array.from(store.entries()).filter(([, record]) => record.channel === input.channel && record.value === value)

  for (const [requestId, record] of candidates) {
    if (!record) continue

    if (record.expiresAt <= now) {
      store.delete(requestId)
      continue
    }

    if (record.channel !== input.channel || record.value !== value) {
      continue
    }

    if (record.attempts >= maxAttempts()) {
      store.delete(requestId)
      throw new Error("Too many verification attempts. Request a new code.")
    }

    record.attempts += 1

    const expected = Buffer.from(record.codeHash)
    const provided = Buffer.from(hashCode(requestId, input.code.trim()))
    const matches = expected.length === provided.length && timingSafeEqual(expected, provided)

    if (!matches) {
      throw new Error("Invalid verification code.")
    }

    store.delete(requestId)
    return {
      verificationToken: signPayload({
        channel: input.channel,
        value,
        exp: now + tokenTtlSeconds() * 1000
      })
    }
  }

  throw new Error("Verification request not found or expired.")
}

