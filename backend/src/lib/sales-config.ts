import { withPooledClient } from "./db"
import type pg from "pg"

export type Sale = {
  id: number
  name: string
  active: boolean
  discountPct: number
  label?: string
  createdAt?: string
  updatedAt?: string
  productIds?: string[]
}

async function ensureSchema(client: pg.PoolClient): Promise<void> {
  await client.query(`
    create table if not exists sales (
      id serial primary key,
      name text not null,
      active boolean not null default false,
      discount_pct numeric(5,2) not null default 0,
      label text,
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now()
    );
    create table if not exists sale_products (
      product_id text primary key,
      sale_id integer not null references sales(id) on delete cascade,
      assigned_at timestamptz not null default now()
    );
  `)
}

function rowToSale(row: any, productIds?: string[]): Sale {
  return {
    id: row.id,
    name: row.name,
    active: row.active,
    discountPct: Number(row.discount_pct),
    label: row.label || undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    productIds,
  }
}

export async function listSales(): Promise<Sale[]> {
  return withPooledClient("sales_schema", ensureSchema, async (client) => {
    const salesRes = await client.query(`select * from sales order by created_at desc`)
    const productsRes = await client.query(`select sale_id, product_id from sale_products`)

    const productsBySale = new Map<number, string[]>()
    for (const row of productsRes.rows) {
      const arr = productsBySale.get(row.sale_id) ?? []
      arr.push(row.product_id)
      productsBySale.set(row.sale_id, arr)
    }

    return salesRes.rows.map(r => rowToSale(r, productsBySale.get(r.id) ?? []))
  })
}

export async function getSaleById(id: number): Promise<Sale | null> {
  return withPooledClient("sales_schema", ensureSchema, async (client) => {
    const saleRes = await client.query(`select * from sales where id = $1`, [id])
    if (saleRes.rows.length === 0) return null
    const productsRes = await client.query(`select product_id from sale_products where sale_id = $1`, [id])
    return rowToSale(saleRes.rows[0], productsRes.rows.map(r => r.product_id))
  })
}

export async function createSale(input: { name: string; discountPct: number; label?: string; active?: boolean }): Promise<Sale> {
  return withPooledClient("sales_schema", ensureSchema, async (client) => {
    const res = await client.query(
      `insert into sales (name, discount_pct, label, active) values ($1, $2, $3, $4) returning *`,
      [input.name, Math.max(0, Math.min(100, input.discountPct)), input.label || null, input.active ?? false]
    )
    return rowToSale(res.rows[0], [])
  })
}

export async function updateSale(id: number, input: { name?: string; discountPct?: number; label?: string; active?: boolean }): Promise<Sale | null> {
  return withPooledClient("sales_schema", ensureSchema, async (client) => {
    const fields: string[] = []
    const values: unknown[] = []
    let i = 1

    if (input.name !== undefined) { fields.push(`name = $${i++}`); values.push(input.name) }
    if (input.discountPct !== undefined) { fields.push(`discount_pct = $${i++}`); values.push(Math.max(0, Math.min(100, input.discountPct))) }
    if (input.label !== undefined) { fields.push(`label = $${i++}`); values.push(input.label || null) }
    if (input.active !== undefined) { fields.push(`active = $${i++}`); values.push(input.active) }

    if (fields.length === 0) return getSaleById(id)

    fields.push(`updated_at = now()`)
    values.push(id)

    const res = await client.query(
      `update sales set ${fields.join(", ")} where id = $${i} returning *`,
      values
    )
    if (res.rows.length === 0) return null

    const productsRes = await client.query(`select product_id from sale_products where sale_id = $1`, [id])
    return rowToSale(res.rows[0], productsRes.rows.map(r => r.product_id))
  })
}

export async function deleteSale(id: number): Promise<boolean> {
  return withPooledClient("sales_schema", ensureSchema, async (client) => {
    const res = await client.query(`delete from sales where id = $1`, [id])
    return (res.rowCount ?? 0) > 0
  })
}

export async function assignProducts(saleId: number, productIds: string[]): Promise<{ assigned: string[]; alreadyInOtherSale: string[] }> {
  return withPooledClient("sales_schema", ensureSchema, async (client) => {
    await client.query("begin")
    try {
      // Lock existing rows to prevent concurrent assignment to different sales
      const existing = await client.query(
        `select product_id, sale_id from sale_products where product_id = any($1) for update`,
        [productIds]
      )
      const conflicts = existing.rows.filter((r: any) => r.sale_id !== saleId).map((r: any) => r.product_id)
      const toAssign = productIds.filter(id => !conflicts.includes(id))

      for (const productId of toAssign) {
        await client.query(
          `insert into sale_products (product_id, sale_id)
           values ($1, $2)
           on conflict (product_id) do update set sale_id = $2, assigned_at = now()`,
          [productId, saleId]
        )
      }

      await client.query("commit")
      return { assigned: toAssign, alreadyInOtherSale: conflicts }
    } catch (err) {
      await client.query("rollback")
      throw err
    }
  })
}

export async function removeProducts(saleId: number, productIds: string[]): Promise<void> {
  return withPooledClient("sales_schema", ensureSchema, async (client) => {
    await client.query(
      `delete from sale_products where sale_id = $1 and product_id = any($2)`,
      [saleId, productIds]
    )
  })
}

/** For the store API: returns only active sales with their product IDs */
export async function getActiveSales(): Promise<Sale[]> {
  return withPooledClient("sales_schema", ensureSchema, async (client) => {
    const salesRes = await client.query(`select * from sales where active = true`)
    if (salesRes.rows.length === 0) return []

    const saleIds = salesRes.rows.map((r: any) => r.id)
    const productsRes = await client.query(
      `select sale_id, product_id from sale_products where sale_id = any($1)`,
      [saleIds]
    )

    const productsBySale = new Map<number, string[]>()
    for (const row of productsRes.rows) {
      const arr = productsBySale.get(row.sale_id) ?? []
      arr.push(row.product_id)
      productsBySale.set(row.sale_id, arr)
    }

    return salesRes.rows.map((r: any) => rowToSale(r, productsBySale.get(r.id) ?? []))
  })
}
