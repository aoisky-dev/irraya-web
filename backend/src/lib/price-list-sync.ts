import { withPooledClient } from "./db"
import { syncSalePriceListDb, type Sale } from "./sales-config"

/**
 * Syncs a Medusa price list for the given sale directly in the database.
 * Returns the Medusa price list ID (to persist), or null if the list was deleted/not created.
 */
export async function syncSalePriceList(
  _container: unknown,
  sale: Sale
): Promise<string | null> {
  return withPooledClient("sync_price_list", async () => {}, async (client) => {
    return syncSalePriceListDb(client, sale.id)
  })
}

