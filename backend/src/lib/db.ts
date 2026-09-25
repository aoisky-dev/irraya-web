import pg from "pg"

/**
 * Shared Postgres connection pool for custom (non-Medusa-ORM) queries.
 *
 * Previously, several lib modules (customer-auth, customer-commerce,
 * customer-order-management, razorpay-payment-references) each opened a brand
 * new `pg.Client` TCP connection for *every single request* and tore it down
 * immediately after. Under any real concurrency this causes:
 *   - High per-request latency (TCP + auth handshake on every call).
 *   - Postgres connection exhaustion (default max_connections is often ~100,
 *     shared with Medusa's own MikroORM pool), which intermittently surfaces
 *     as "sorry, too many clients already" errors on unrelated pages/routes
 *     (e.g. the Admin Inventory page) because the whole Postgres instance is
 *     connection-starved.
 *   - Repeated `create table/index if not exists` schema-ensure calls firing
 *     on every request instead of once per process.
 *
 * This module fixes that by reusing one bounded pool per process, and by
 * caching "schema ensured" state so DDL only runs once.
 */

let pool: pg.Pool | null = null

function createPool(): pg.Pool {
  const newPool = new pg.Pool({
    connectionString: process.env.DATABASE_URL,
    max: Number(process.env.PG_POOL_MAX ?? 10),
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 10_000
  })

  // A pool-level error (e.g. an idle client dropped by the server) must be
  // handled, otherwise it can crash the whole Node process.
  newPool.on("error", (error) => {
    console.error("[db] unexpected error on idle pg client", error)
  })

  return newPool
}

export function getPool(): pg.Pool {
  if (!pool) {
    pool = createPool()
  }
  return pool
}

const ensuredSchemas = new Set<string>()

/**
 * Acquire a pooled client, ensure a given schema (table/index) has been
 * created exactly once per process, run the callback, then release the
 * client back to the pool (never closing the underlying connection).
 */
export async function withPooledClient<T>(
  schemaKey: string,
  ensureSchema: (client: pg.PoolClient) => Promise<void>,
  callback: (client: pg.PoolClient) => Promise<T>
): Promise<T> {
  const client = await getPool().connect()

  try {
    if (!ensuredSchemas.has(schemaKey)) {
      await ensureSchema(client)
      ensuredSchemas.add(schemaKey)
    }
    return await callback(client)
  } finally {
    client.release()
  }
}

