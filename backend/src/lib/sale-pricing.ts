import { getPool } from "./db"

/**
 * Returns the server-computed sale unit price (in rupees, same denomination
 * as Medusa's cart unit_price field) for a given variant, or null if the
 * variant's product is not in any active sale.
 *
 * Uses the same direct SQL joins as syncSalePriceListDb so the table names
 * are guaranteed to work. Called by the add-to-cart middleware — the client
 * never sends a price.
 */
export async function getSaleUnitPrice(variantId: string): Promise<number | null> {
  const client = await getPool().connect()
  try {
    const result = await client.query<{ sale_price: string }>(`
      select floor(base_p.amount * (1 - s.discount_pct / 100.0))::numeric as sale_price
      from product_variant pv
      join product_variant_price_set pvps on pvps.variant_id = pv.id
        and pvps.deleted_at is null
      join price base_p on base_p.price_set_id = pvps.price_set_id
        and base_p.currency_code = 'inr'
        and base_p.price_list_id is null
        and base_p.deleted_at is null
      join sale_products sp on sp.product_id = pv.product_id
      join sales s on s.id = sp.sale_id
        and s.active = true
        and s.discount_pct > 0
      where pv.id = $1
        and pv.deleted_at is null
      limit 1
    `, [variantId])

    if (!result.rows.length) return null
    const price = Number(result.rows[0].sale_price)
    return Number.isFinite(price) && price > 0 ? price : null
  } finally {
    client.release()
  }
}
