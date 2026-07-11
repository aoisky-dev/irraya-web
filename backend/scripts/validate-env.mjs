import fs from "node:fs"
import path from "node:path"

const envPath = path.resolve(process.cwd(), process.argv[2] || ".env")

if (!fs.existsSync(envPath)) {
  console.error(`Missing env file: ${envPath}`)
  process.exit(1)
}

const raw = fs.readFileSync(envPath, "utf8")
const lines = raw.split(/\r?\n/)
const values = {}

for (const line of lines) {
  const trimmed = line.trim()
  if (!trimmed || trimmed.startsWith("#")) continue
  const idx = trimmed.indexOf("=")
  if (idx === -1) continue
  const key = trimmed.slice(0, idx).trim()
  const value = trimmed.slice(idx + 1).trim()
  values[key] = value
}

const required = [
  "DATABASE_URL",
  "REDIS_URL",
  "JWT_SECRET",
  "COOKIE_SECRET",
  "STORE_CORS",
  "ADMIN_CORS",
  "AUTH_CORS"
]

const missing = required.filter((key) => !values[key])

if (missing.length > 0) {
  console.error("Missing required env vars:")
  for (const key of missing) {
    console.error(`- ${key}`)
  }
  process.exit(1)
}

const weakSecrets = ["JWT_SECRET", "COOKIE_SECRET"].filter((key) => {
  const value = values[key] || ""
  return /replace|change|secret/i.test(value) || value.length < 32
})

if (weakSecrets.length > 0) {
  console.error("Replace placeholder/weak auth secrets:")
  for (const key of weakSecrets) {
    console.error(`- ${key}`)
  }
  process.exit(1)
}

console.log(`Env validation passed for ${envPath}`)

