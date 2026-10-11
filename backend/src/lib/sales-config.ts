import { withPooledClient } from "./db"
import type pg from "pg"

export type Sale = {
  id: number
  name: string
  active: boolean
  discountPct: number
  label?: string
  priceListId?: string
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
      price_list_id text,
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now()
    );
    create table if not exists sale_products (
      product_id text primary key,
      sale_id integer not null references sales(id) on delete cascade,
      assigned_at timestamptz not null default now()
    );
    alter table sales add column if not exists price_list_id text;
  `)

  // Auto-sync any active sale that doesn't have an active price_list synced
  try {
    const activeSales = await client.query(
      `select s.id from sales s where s.active = true and s.discount_pct > 0`
    )
    for (const row of activeSales.rows) {
      await syncSalePriceListDb(client, row.id)
    }
  } catch (err) {
    console.error("[ensureSchema] sale auto-sync warning:", err)
  }
}

export async function syncSalePriceListDb(client: pg.PoolClient, saleId: number): Promise<string | null> {
  const saleRes = await client.query(`select * from sales where id = $1`, [saleId])
  if (saleRes.rows.length === 0) return null
  const sale = saleRes.rows[0]

  const priceListId = `plist_sale_${sale.id}`

  if (!sale.active || Number(sale.discount_pct) <= 0) {
    // Revert active cart line items back to base prices
    try {
      await client.query(`
        update cart_line_item cli
        set 
          unit_price = base_p.amount,
          compare_at_unit_price = null,
          updated_at = now()
        from sale_products sp
        join product_variant pv on pv.product_id = sp.product_id and pv.deleted_at is null
        join product_variant_price_set pvps on pvps.variant_id = pv.id and pvps.deleted_at is null
        join price base_p on base_p.price_set_id = pvps.price_set_id and base_p.currency_code = 'inr' and base_p.price_list_id is null and base_p.deleted_at is null
        where cli.variant_id = pv.id
          and cli.deleted_at is null
          and sp.sale_id = $1
      `, [sale.id])
    } catch { /* ignore if cart table not yet created */ }

    await client.query(`delete from price where price_list_id = $1`, [priceListId])
    await client.query(`delete from price_list where id = $1`, [priceListId])
    await client.query(`update sales set price_list_id = null, updated_at = now() where id = $1`, [sale.id])
    return null
  }

  const title = sale.label || sale.name
  const description = `${Number(sale.discount_pct)}% off`
  await client.query(`
    insert into price_list (id, status, title, description, type, rules_count, created_at, updated_at)
    values ($1, 'active', $2, $3, 'sale', 0, now(), now())
    on conflict (id) do update set
      status = 'active',
      title = excluded.title,
      description = excluded.description,
      type = 'sale',
      updated_at = now(),
      deleted_at = null
  `, [priceListId, title, description])

  await client.query(`update sales set price_list_id = $1, updated_at = now() where id = $2`, [priceListId, sale.id])
  await client.query(`delete from price where price_list_id = $1`, [priceListId])

  const discountPct = Number(sale.discount_pct)
  await client.query(`
    insert into price (id, price_set_id, currency_code, amount, raw_amount, rules_count, price_list_id, created_at, updated_at)
    select
      'price_sale_' || $1 || '_' || substr(md5(pvps.price_set_id), 1, 16),
      pvps.price_set_id,
      'inr',
      floor(base_p.amount * (1 - $2::numeric / 100.0)),
      jsonb_build_object('value', floor(base_p.amount * (1 - $2::numeric / 100.0))::text, 'precision', 20),
      0,
      $3,
      now(),
      now()
    from sale_products sp
    join product_variant pv on pv.product_id = sp.product_id and pv.deleted_at is null
    join product_variant_price_set pvps on pvps.variant_id = pv.id and pvps.deleted_at is null
    join price base_p on base_p.price_set_id = pvps.price_set_id and base_p.currency_code = 'inr' and base_p.price_list_id is null and base_p.deleted_at is null
    where sp.sale_id = $1
    on conflict (id) do update set
      amount = excluded.amount,
      raw_amount = excluded.raw_amount,
      updated_at = now(),
      deleted_at = null
  `, [sale.id, discountPct, priceListId])

  // Sync any open cart line items with the new sale price
  try {
    await client.query(`
      update cart_line_item cli
      set 
        unit_price = p_sale.amount,
        compare_at_unit_price = coalesce(cli.compare_at_unit_price, base_p.amount),
        updated_at = now()
      from sale_products sp
      join product_variant pv on pv.product_id = sp.product_id and pv.deleted_at is null
      join product_variant_price_set pvps on pvps.variant_id = pv.id and pvps.deleted_at is null
      join price base_p on base_p.price_set_id = pvps.price_set_id and base_p.currency_code = 'inr' and base_p.price_list_id is null and base_p.deleted_at is null
      join price p_sale on p_sale.price_set_id = pvps.price_set_id and p_sale.price_list_id = $1 and p_sale.currency_code = 'inr' and p_sale.deleted_at is null
      where cli.variant_id = pv.id
        and cli.deleted_at is null
        and sp.sale_id = $2
    `, [priceListId, sale.id])
  } catch { /* ignore if cart table not yet created */ }

  return priceListId
}

function rowToSale(row: any, productIds?: string[]): Sale {
  return {
    id: row.id,
    name: row.name,
    active: row.active,
    discountPct: Number(row.discount_pct),
    label: row.label || undefined,
    priceListId: row.price_list_id || undefined,
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
    await syncSalePriceListDb(client, res.rows[0].id)
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

    if (fields.length > 0) {
      fields.push(`updated_at = now()`)
      values.push(id)

      await client.query(
        `update sales set ${fields.join(", ")} where id = $${i}`,
        values
      )
    }

    await syncSalePriceListDb(client, id)

    const updated = await client.query(`select * from sales where id = $1`, [id])
    if (updated.rows.length === 0) return null

    const productsRes = await client.query(`select product_id from sale_products where sale_id = $1`, [id])
    return rowToSale(updated.rows[0], productsRes.rows.map(r => r.product_id))
  })
}

export async function deleteSale(id: number): Promise<boolean> {
  return withPooledClient("sales_schema", ensureSchema, async (client) => {
    const sale = await client.query(`select price_list_id from sales where id = $1`, [id])
    if (sale.rows[0]?.price_list_id) {
      await client.query(`delete from price where price_list_id = $1`, [sale.rows[0].price_list_id])
      await client.query(`delete from price_list where id = $1`, [sale.rows[0].price_list_id])
    }
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

      await syncSalePriceListDb(client, saleId)
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
    await syncSalePriceListDb(client, saleId)
  })
}

/** Persist the Medusa price list ID on a sale record after sync. */
export async function savePriceListId(saleId: number, priceListId: string | null): Promise<void> {
  return withPooledClient("sales_schema", ensureSchema, async (client) => {
    await client.query(
      `update sales set price_list_id = $1, updated_at = now() where id = $2`,
      [priceListId ?? null, saleId]
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
