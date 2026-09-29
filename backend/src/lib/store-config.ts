import { withPooledClient } from "./db"

export type SaleConfig = {
  active: boolean
  discountPct: number  // e.g. 10 means 10% off
  label?: string       // e.g. "Summer Sale"
  updatedAt?: string
}

async function ensureStoreConfigTable(client: import("pg").PoolClient): Promise<void> {
  await client.query(`
    create table if not exists store_config (
      key text primary key,
      value jsonb not null,
      updated_at timestamptz not null default now()
    )
  `)
}

export async function getSaleConfig(): Promise<SaleConfig> {
  return withPooledClient("store_config", ensureStoreConfigTable, async (client) => {
    const result = await client.query(`select value, updated_at from store_config where key = 'sale'`)
    if (result.rows.length === 0) {
      return { active: false, discountPct: 0 }
    }
    const val = result.rows[0].value as Record<string, unknown>
    return {
      active: val.active === true,
      discountPct: typeof val.discountPct === "number" ? val.discountPct : 0,
      label: typeof val.label === "string" ? val.label : undefined,
      updatedAt: result.rows[0].updated_at
    }
  })
}

export async function setSaleConfig(config: SaleConfig): Promise<SaleConfig> {
  return withPooledClient("store_config", ensureStoreConfigTable, async (client) => {
    const value = {
      active: config.active,
      discountPct: Math.max(0, Math.min(100, config.discountPct)),
      label: config.label || null
    }
    await client.query(
      `insert into store_config (key, value, updated_at)
       values ('sale', $1::jsonb, now())
       on conflict (key) do update set value = $1::jsonb, updated_at = now()`,
      [JSON.stringify(value)]
    )
    return { ...value, label: config.label }
  })
}
