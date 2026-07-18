import pg from "pg"

const { Client } = pg

export type ProductSnapshot = {
  id: string
  handle?: string
  title?: string
  image?: string
  category?: string
  description?: string
  rating?: number
  reviewsCount?: number
  metadata?: Record<string, string>
  variants?: Array<Record<string, unknown>>
}

export type SavedProductItem = {
  id: number
  customer_id: string
  product_id: string
  product_snapshot: ProductSnapshot
  sort_order?: number
  created_at: string
  updated_at: string
}

export type ReviewStatus = "pending" | "approved" | "rejected"

export type StoredReview = {
  id: number
  product_id: string
  customer_id: string | null
  author_name: string
  rating: number
  text: string
  image_urls: string[]
  status: ReviewStatus
  verified_purchase: boolean
  moderation_note: string | null
  created_at: string
  updated_at: string
}

export type ReviewSummary = {
  productId: string
  averageRating: number
  reviewsCount: number
}

async function withClient<T>(callback: (client: pg.Client) => Promise<T>): Promise<T> {
  const client = new Client({ connectionString: process.env.DATABASE_URL })

  try {
    await client.connect()
    await ensureCustomerCommerceTables(client)
    return await callback(client)
  } finally {
    await client.end().catch(() => undefined)
  }
}

async function ensureCustomerCommerceTables(client: pg.Client): Promise<void> {
  await client.query(`
    create table if not exists customer_wishlist_items (
      id bigserial primary key,
      customer_id text not null,
      product_id text not null,
      product_snapshot jsonb not null default '{}'::jsonb,
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now(),
      unique(customer_id, product_id)
    )
  `)
  await client.query(`create index if not exists idx_customer_wishlist_items_customer_id on customer_wishlist_items(customer_id)`)

  await client.query(`
    create table if not exists customer_compare_items (
      id bigserial primary key,
      customer_id text not null,
      product_id text not null,
      product_snapshot jsonb not null default '{}'::jsonb,
      sort_order integer not null default 0,
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now(),
      unique(customer_id, product_id)
    )
  `)
  await client.query(`create index if not exists idx_customer_compare_items_customer_id on customer_compare_items(customer_id)`)

  await client.query(`
    create table if not exists product_reviews (
      id bigserial primary key,
      product_id text not null,
      customer_id text,
      author_name text not null,
      rating integer not null check (rating between 1 and 5),
      text text not null,
      image_urls text[] not null default '{}',
      status text not null default 'pending',
      verified_purchase boolean not null default false,
      moderation_note text,
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now()
    )
  `)
  await client.query(`create index if not exists idx_product_reviews_product_status on product_reviews(product_id, status)`)
  await client.query(`create index if not exists idx_product_reviews_customer_id on product_reviews(customer_id)`)
}

function normalizeString(value: unknown): string {
  return typeof value === "string" ? value.trim() : ""
}

function sanitizeProductSnapshot(value: unknown, productId: string): ProductSnapshot {
  const raw = value && typeof value === "object" ? value as Record<string, unknown> : {}
  return {
    id: normalizeString(raw.id) || productId,
    handle: normalizeString(raw.handle) || undefined,
    title: normalizeString(raw.title) || undefined,
    image: normalizeString(raw.image) || undefined,
    category: normalizeString(raw.category) || undefined,
    description: normalizeString(raw.description) || undefined,
    rating: typeof raw.rating === "number" && Number.isFinite(raw.rating) ? raw.rating : undefined,
    reviewsCount: typeof raw.reviewsCount === "number" && Number.isFinite(raw.reviewsCount) ? raw.reviewsCount : undefined,
    metadata: raw.metadata && typeof raw.metadata === "object"
      ? Object.fromEntries(Object.entries(raw.metadata as Record<string, unknown>).map(([k, v]) => [k, String(v)]))
      : undefined,
    variants: Array.isArray(raw.variants) ? raw.variants.slice(0, 20).filter((v) => v && typeof v === "object") as Array<Record<string, unknown>> : undefined
  }
}

export async function listWishlistItems(customerId: string): Promise<SavedProductItem[]> {
  return withClient(async (client) => {
    const result = await client.query<SavedProductItem>(
      `select * from customer_wishlist_items where customer_id = $1 order by created_at desc`,
      [customerId]
    )
    return result.rows
  })
}

export async function addWishlistItem(customerId: string, productId: string, productSnapshot: unknown): Promise<SavedProductItem> {
  const snapshot = sanitizeProductSnapshot(productSnapshot, productId)
  return withClient(async (client) => {
    const result = await client.query<SavedProductItem>(
      `insert into customer_wishlist_items (customer_id, product_id, product_snapshot)
       values ($1, $2, $3::jsonb)
       on conflict (customer_id, product_id) do update set
         product_snapshot = excluded.product_snapshot,
         updated_at = now()
       returning *`,
      [customerId, productId, JSON.stringify(snapshot)]
    )
    return result.rows[0]
  })
}

export async function removeWishlistItem(customerId: string, productId: string): Promise<void> {
  await withClient(async (client) => {
    await client.query(`delete from customer_wishlist_items where customer_id = $1 and product_id = $2`, [customerId, productId])
  })
}

export async function replaceCompareItems(customerId: string, items: Array<{ productId: string; productSnapshot: unknown }>): Promise<SavedProductItem[]> {
  const limitedItems = items.slice(0, 4).filter((item) => normalizeString(item.productId))
  return withClient(async (client) => {
    await client.query("begin")
    try {
      await client.query(`delete from customer_compare_items where customer_id = $1`, [customerId])
      for (const [index, item] of limitedItems.entries()) {
        await client.query(
          `insert into customer_compare_items (customer_id, product_id, product_snapshot, sort_order)
           values ($1, $2, $3::jsonb, $4)
           on conflict (customer_id, product_id) do update set
             product_snapshot = excluded.product_snapshot,
             sort_order = excluded.sort_order,
             updated_at = now()`,
          [customerId, item.productId, JSON.stringify(sanitizeProductSnapshot(item.productSnapshot, item.productId)), index]
        )
      }
      await client.query("commit")
    } catch (error) {
      await client.query("rollback")
      throw error
    }

    const result = await client.query<SavedProductItem>(
      `select * from customer_compare_items where customer_id = $1 order by sort_order asc, created_at asc`,
      [customerId]
    )
    return result.rows
  })
}

export async function listCompareItems(customerId: string): Promise<SavedProductItem[]> {
  return withClient(async (client) => {
    const result = await client.query<SavedProductItem>(
      `select * from customer_compare_items where customer_id = $1 order by sort_order asc, created_at asc`,
      [customerId]
    )
    return result.rows
  })
}

export async function hasVerifiedPurchase(customerId: string, productId: string): Promise<boolean> {
  return withClient(async (client) => {
    try {
      const result = await client.query(
        `select 1
         from "order" o
         join order_line_item oli on oli.order_id = o.id
         where o.customer_id = $1
           and oli.product_id = $2
           and o.deleted_at is null
         limit 1`,
        [customerId, productId]
      )
      return (result.rowCount ?? 0) > 0
    } catch {
      return false
    }
  })
}

export async function createProductReview(input: {
  productId: string
  customerId: string
  authorName: string
  rating: number
  text: string
  imageUrls?: string[]
  verifiedPurchase?: boolean
}): Promise<StoredReview> {
  return withClient(async (client) => {
    const result = await client.query<StoredReview>(
      `insert into product_reviews (product_id, customer_id, author_name, rating, text, image_urls, status, verified_purchase)
       values ($1, $2, $3, $4, $5, $6, 'pending', $7)
       returning *`,
      [
        input.productId,
        input.customerId,
        input.authorName,
        Math.min(Math.max(Math.round(input.rating), 1), 5),
        input.text,
        input.imageUrls ?? [],
        Boolean(input.verifiedPurchase)
      ]
    )
    return result.rows[0]
  })
}

export async function listProductReviews(productId: string, includeModeration = false): Promise<StoredReview[]> {
  return withClient(async (client) => {
    const result = await client.query<StoredReview>(
      `select * from product_reviews
       where product_id = $1 ${includeModeration ? "" : "and status = 'approved'"}
       order by created_at desc`,
      [productId]
    )
    return result.rows
  })
}

export async function getReviewSummary(productId: string): Promise<ReviewSummary> {
  return withClient(async (client) => {
    const result = await client.query(
      `select coalesce(round(avg(rating)::numeric, 1), 0) as average_rating, count(*)::int as reviews_count
       from product_reviews
       where product_id = $1 and status = 'approved'`,
      [productId]
    )
    const row = result.rows[0] ?? {}
    return {
      productId,
      averageRating: Number(row.average_rating ?? 0),
      reviewsCount: Number(row.reviews_count ?? 0)
    }
  })
}

export async function listReviewsForModeration(status?: string): Promise<StoredReview[]> {
  return withClient(async (client) => {
    const normalizedStatus = normalizeString(status)
    const result = await client.query<StoredReview>(
      `select * from product_reviews
       ${normalizedStatus ? "where status = $1" : ""}
       order by created_at desc
       limit 200`,
      normalizedStatus ? [normalizedStatus] : []
    )
    return result.rows
  })
}

export async function moderateReview(input: { reviewId: number; status: ReviewStatus; note?: string }): Promise<StoredReview | null> {
  return withClient(async (client) => {
    const result = await client.query<StoredReview>(
      `update product_reviews
       set status = $1,
           moderation_note = $2,
           updated_at = now()
       where id = $3
       returning *`,
      [input.status, normalizeString(input.note), input.reviewId]
    )
    return result.rows[0] ?? null
  })
}

