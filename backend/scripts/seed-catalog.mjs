#!/usr/bin/env node
import path from "node:path"
import { config as loadDotenv } from "dotenv"
import { sampleCatalog } from "./sample-catalog.mjs"

loadDotenv({ path: path.join(process.cwd(), ".env") })

const args = process.argv.slice(2)
const dryRun = args.includes("--dry-run")
const showHelp = args.includes("--help") || args.includes("-h")
const cliBaseUrl = args.find((arg) => arg.startsWith("--base-url="))?.split("=")[1]
const cliCurrency = args.find((arg) => arg.startsWith("--currency="))?.split("=")[1]

if (showHelp) {
  console.log(`Seed Medusa catalog data

Usage:
  node ./scripts/seed-catalog.mjs [--dry-run] [--base-url=http://localhost:9000] [--currency=inr]

Auth options:
  1) MEDUSA_ADMIN_TOKEN
  2) MEDUSA_ADMIN_EMAIL + MEDUSA_ADMIN_PASSWORD

Examples:
  npm run seed:catalog
  npm run seed:catalog:dry-run
  npm run seed:catalog -- --base-url=https://your-medusa-host
`)
  process.exit(0)
}

function normalizeBaseUrl(value) {
  const trimmed = (value || "").trim()
  if (!trimmed) return ""
  return trimmed.replace(/\/+$/, "")
}

const baseUrl = normalizeBaseUrl(
  cliBaseUrl ||
    process.env.MEDUSA_BACKEND_URL ||
    process.env.MEDUSA_BASE_URL ||
    `http://localhost:${process.env.PORT || "9000"}`
)

const currencyCode = (cliCurrency || process.env.SEED_CATALOG_CURRENCY || "inr").toLowerCase()

if (!baseUrl) {
  console.error("Missing Medusa base URL. Pass --base-url or set MEDUSA_BACKEND_URL.")
  process.exit(1)
}

async function httpRequest(targetUrl, init = {}) {
  const response = await fetch(targetUrl, init)
  const text = await response.text()
  let payload = null

  if (text) {
    try {
      payload = JSON.parse(text)
    } catch {
      payload = { message: text }
    }
  }

  if (!response.ok) {
    const reason = payload?.message || payload?.type || text || response.statusText
    throw new Error(`HTTP ${response.status} ${response.statusText} (${targetUrl}): ${reason}`)
  }

  return payload ?? {}
}

async function resolveAdminToken() {
  const tokenFromEnv = process.env.MEDUSA_ADMIN_TOKEN?.trim()
  if (tokenFromEnv) return tokenFromEnv

  const email = process.env.MEDUSA_ADMIN_EMAIL?.trim()
  const password = process.env.MEDUSA_ADMIN_PASSWORD?.trim()

  if (!email || !password) {
    throw new Error(
      "Missing admin auth: set MEDUSA_ADMIN_TOKEN or MEDUSA_ADMIN_EMAIL + MEDUSA_ADMIN_PASSWORD in backend/.env"
    )
  }

  const authPaths = ["/auth/user/emailpass", "/auth/user/emailpass/login"]

  for (const authPath of authPaths) {
    try {
      const data = await httpRequest(`${baseUrl}${authPath}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      })

      const token = data?.token || data?.access_token
      if (typeof token === "string" && token.length > 0) {
        return token
      }
    } catch {
      // Try the next auth path.
    }
  }

  throw new Error("Failed to authenticate admin user. Verify email/password and backend URL.")
}

function buildProductPayload(product, salesChannelId) {
  const sizeValues = [...new Set(product.variants.map((variant) => variant.size))]
  const colorValues = [...new Set(product.variants.map((variant) => variant.color))]

  return {
    title: product.title,
    handle: product.handle,
    description: product.description,
    status: "published",
    thumbnail: product.image,
    images: [{ url: product.image }],
    metadata: {
      category: product.category,
      ...product.metadata
    },
    options: [
      { title: "Size", values: sizeValues },
      { title: "Color", values: colorValues }
    ],
    variants: product.variants.map((variant) => ({
      title: `${variant.size} / ${variant.color}`,
      sku: variant.sku,
      manage_inventory: true,
      allow_backorder: false,
      options: {
        Size: variant.size,
        Color: variant.color
      },
      prices: [{ currency_code: currencyCode, amount: variant.priceInCents }]
    })),
    ...(salesChannelId ? { sales_channels: [{ id: salesChannelId }] } : {})
  }
}

async function getDefaultSalesChannel(token) {
  const data = await httpRequest(`${baseUrl}/admin/sales-channels?limit=1`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  })

  return data?.sales_channels?.[0]?.id || null
}

async function findProductByHandle(handle, token) {
  const data = await httpRequest(
    `${baseUrl}/admin/products?handle=${encodeURIComponent(handle)}&limit=1`,
    {
      headers: {
        Authorization: `Bearer ${token}`
      }
    }
  )

  return data?.products?.[0] || null
}

async function createProduct(productPayload, token) {
  return httpRequest(`${baseUrl}/admin/products`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(productPayload)
  })
}

async function seedCatalog() {
  console.log(`Using Medusa backend: ${baseUrl}`)
  console.log(`Currency code: ${currencyCode}`)
  if (dryRun) {
    console.log("Dry run enabled: no products will be created.")
  }

  const token = await resolveAdminToken()
  const salesChannelId = await getDefaultSalesChannel(token)

  if (salesChannelId) {
    console.log(`Using sales channel: ${salesChannelId}`)
  } else {
    console.warn("No sales channel found. Products will be created without explicit channel mapping.")
  }

  let createdCount = 0
  let skippedCount = 0

  for (const product of sampleCatalog) {
    const existing = await findProductByHandle(product.handle, token)
    if (existing) {
      skippedCount += 1
      console.log(`Skipping existing product: ${product.handle}`)
      continue
    }

    const payload = buildProductPayload(product, salesChannelId)

    if (dryRun) {
      createdCount += 1
      console.log(`Would create product: ${product.handle}`)
      continue
    }

    await createProduct(payload, token)
    createdCount += 1
    console.log(`Created product: ${product.handle}`)
  }

  console.log("\nCatalog seed complete")
  console.log(`- Created: ${createdCount}`)
  console.log(`- Skipped (already exists): ${skippedCount}`)
}

seedCatalog().catch((error) => {
  console.error("Catalog seed failed")
  console.error(error)
  process.exit(1)
})

