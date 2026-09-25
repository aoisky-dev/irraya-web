const { defineConfig, loadEnv } = require("@medusajs/framework/utils")

loadEnv(process.env.NODE_ENV || "development", process.cwd())

module.exports = defineConfig({
  projectConfig: {
    databaseUrl:
      process.env.DATABASE_URL ||
      "postgres://postgres:postgres@127.0.0.1:5433/medusa",
    // Explicit, bounded connection pool for Medusa's own ORM (MikroORM/knex).
    // Without this, pool sizing defaults can be unpredictable and combine with
    // ad hoc pg connections elsewhere in the app to exhaust Postgres'
    // max_connections, which surfaces as intermittent errors/timeouts on
    // admin pages (e.g. Inventory) and generally high latency under load.
    databaseDriverOptions: {
      pool: {
        min: Number(process.env.DB_POOL_MIN ?? 2),
        max: Number(process.env.DB_POOL_MAX ?? 10)
      }
    },
    redisUrl: process.env.REDIS_URL || "redis://127.0.0.1:6380",
    http: {
      storeCors: process.env.STORE_CORS || "http://localhost:3000",
      adminCors:
        process.env.ADMIN_CORS || "http://localhost:7001,http://localhost:3000",
      authCors:
        process.env.AUTH_CORS || "http://localhost:3000,http://localhost:7001",
      jwtSecret: process.env.JWT_SECRET || "replace_me_in_env",
      cookieSecret: process.env.COOKIE_SECRET || "replace_me_in_env"
    }
  },
  admin: {
    maxUploadFileSize: 2 * 1024 * 1024,
  },
  modules: [
    {
      resolve: "@medusajs/file",
      options: {
        providers: [
          {
            resolve: "@medusajs/file-local",
            id: "local",
            options: {
              upload_dir: "/app/uploads",
              backend_url: `${process.env.MEDUSA_BACKEND_URL || "http://localhost:9000"}/uploads`,
            },
          },
        ],
      },
    },
  ]
})
