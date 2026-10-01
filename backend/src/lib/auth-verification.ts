import { createHash, createHmac, randomInt, randomUUID, timingSafeEqual } from "node:crypto"
import { sendMail } from "./mailer"
import { otpTemplate } from "./email-templates"
import { getRedis } from "./redis"

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

const ttlSeconds = (): number => Number.parseInt(process.env.OTP_TTL_SECONDS || "600", 10)
const maxAttempts = (): number => Number.parseInt(process.env.OTP_MAX_ATTEMPTS || "5", 10)
const tokenTtlSeconds = (): number => Number.parseInt(process.env.VERIFICATION_TOKEN_TTL_SECONDS || "900", 10)
const signingSecret = (): string => process.env.VERIFICATION_TOKEN_SECRET || process.env.JWT_SECRET || "dev_verification_secret"

const redisKey = (requestId: string) => `otp:${requestId}`

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
  const ttl = ttlSeconds()

  const record: VerificationRecord = {
    channel,
    value,
    codeHash: hashCode(requestId, code),
    expiresAt,
    attempts: 0,
  }

  // Store in Redis with TTL — survives restarts and works across multiple instances
  await getRedis().setex(redisKey(requestId), ttl, JSON.stringify(record))

  if (channel === "email") {
    const tpl = otpTemplate({ email: value, code, expiresMinutes: Math.round(ttl / 60) })
    sendMail({ to: value, subject: tpl.subject, html: tpl.html, text: tpl.text }).catch((err) =>
      console.error("[auth-verification] Failed to send OTP email:", err)
    )
  } else {
    console.info(`[Irraya OTP] ${channel} ${value} code: ${code}`)
  }

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
  const redis = getRedis()

  if (!input.requestId) {
    throw new Error("Verification request not found or expired.")
  }

  const raw = await redis.get(redisKey(input.requestId))
  if (!raw) throw new Error("Verification request not found or expired.")

  const record: VerificationRecord = JSON.parse(raw)

  if (record.expiresAt <= now) {
    await redis.del(redisKey(input.requestId))
    throw new Error("Verification request not found or expired.")
  }

  if (record.channel !== input.channel || record.value !== value) {
    throw new Error("Verification request not found or expired.")
  }

  if (record.attempts >= maxAttempts()) {
    await redis.del(redisKey(input.requestId))
    throw new Error("Too many verification attempts. Request a new code.")
  }

  record.attempts += 1

  const expected = Buffer.from(record.codeHash)
  const provided = Buffer.from(hashCode(input.requestId, input.code.trim()))
  const matches = expected.length === provided.length && timingSafeEqual(expected, provided)

  if (!matches) {
    // Persist incremented attempt count back to Redis
    const remaining = Math.ceil((record.expiresAt - now) / 1000)
    await redis.setex(redisKey(input.requestId), Math.max(1, remaining), JSON.stringify(record))
    throw new Error("Invalid verification code.")
  }

  await redis.del(redisKey(input.requestId))

  return {
    verificationToken: signPayload({
      channel: input.channel,
      value,
      exp: now + tokenTtlSeconds() * 1000,
    }),
  }
}
