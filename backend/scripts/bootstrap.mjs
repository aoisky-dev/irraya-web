#!/usr/bin/env node
import { existsSync, copyFileSync, readFileSync, writeFileSync } from "node:fs"
import { spawnSync } from "node:child_process"
import { randomBytes } from "node:crypto"
import path from "node:path"

const root = process.cwd()
const envPath = path.join(root, ".env")
const envExamplePath = path.join(root, ".env.example")
const noDev = process.argv.includes("--no-dev")

function parseEnvFile(filePath) {
  const raw = readFileSync(filePath, "utf8")
  const out = {}

  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith("#")) continue
    const idx = trimmed.indexOf("=")
    if (idx === -1) continue
    const key = trimmed.slice(0, idx).trim()
    const value = trimmed.slice(idx + 1).trim()
    out[key] = value
  }

  return out
}

if (!existsSync(envPath)) {
  if (!existsSync(envExamplePath)) {
    console.error("Missing .env and .env.example in backend root")
    process.exit(1)
  }

  copyFileSync(envExamplePath, envPath)
  console.log("Created .env from .env.example")
}

function isPlaceholderSecret(value) {
  return !value || /replace|change|secret/i.test(value) || value.length < 32
}

function ensureLocalSecrets() {
  let raw = readFileSync(envPath, "utf8")
  let changed = false

  for (const key of ["JWT_SECRET", "COOKIE_SECRET"]) {
    const pattern = new RegExp(`^${key}=.*$`, "m")
    const current = raw.match(pattern)?.[0]?.slice(key.length + 1).trim()
    if (isPlaceholderSecret(current)) {
      const next = `${key}=${randomBytes(32).toString("hex")}`
      raw = pattern.test(raw) ? raw.replace(pattern, next) : `${raw.trimEnd()}\n${next}\n`
      changed = true
    }
  }

  if (changed) {
    writeFileSync(envPath, raw)
    console.log("Generated local JWT_SECRET and/or COOKIE_SECRET values in .env")
  }
}

ensureLocalSecrets()

const envFromFile = parseEnvFile(envPath)
const commandEnv = { ...process.env, ...envFromFile }

function run(command, args, options = {}) {
  const { allowFailure = false, ...spawnOptions } = options
  const result = spawnSync(command, args, {
    stdio: "inherit",
    cwd: root,
    shell: false,
    env: commandEnv,
    ...spawnOptions
  })

  if (result.status !== 0 && !allowFailure) {
    process.exit(result.status ?? 1)
  }

  return result
}

console.log("Installing dependencies...")
run("npm", ["install", "--no-audit", "--no-fund"])

console.log("Validating environment...")
run("npm", ["run", "check:env"])

console.log("Starting local Postgres and Redis with Docker Compose...")
const dockerCheck = spawnSync("docker", ["compose", "version"], {
  stdio: "ignore",
  cwd: root
})

if (dockerCheck.status === 0) {
  const dockerUp = run("docker", ["compose", "up", "-d"], { allowFailure: true })
  if (dockerUp.status !== 0) {
    console.warn("Docker daemon unavailable. Skipping container startup.")
  }
} else {
  console.warn("Docker Compose not available. Skipping container startup.")
}

console.log("Running database migrations...")
run("npm", ["run", "migrate"])

if (noDev) {
  console.log("Bootstrap complete (--no-dev used, backend not started).")
  process.exit(0)
}

console.log("Launching Medusa backend in dev mode...")
run("npm", ["run", "dev"])
