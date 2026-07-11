# Irraya Medusa Backend (`backend`)

This folder now contains the Medusa backend setup for the Irraya store.

## What is configured

- Medusa backend app commands (`dev`, `build`, `start`)
- `medusa-config.js` driven by environment variables
- PostgreSQL and Redis local setup through `docker-compose.yml`
- `.env.example` template for DB/auth/CORS configuration
- `check:env` script to validate required env keys
- Detached email/phone OTP verification routes for future provider wiring

## Quick start

```bash
cd /Users/bhanuteja.jogu/work-projects/irraya-web/backend
npm run bootstrap
```

`bootstrap` will:
- create `.env` from `.env.example` (if missing)
- install dependencies
- validate required env keys
- start local Postgres + Redis via Docker (if available)
- run Medusa database migrations
- launch Medusa in dev mode

Manual flow is still available:

```bash
cd /Users/bhanuteja.jogu/work-projects/irraya-web/backend
cp .env.example .env
npm install
npm run check:env
npm run dev
```

Backend runs at `http://localhost:9000` by default.

## Environment variables

Create `backend/.env` from `.env.example` and update values:

```env
DATABASE_URL=postgres://postgres:postgres@127.0.0.1:5433/medusa
REDIS_URL=redis://127.0.0.1:6380
JWT_SECRET=replace_with_strong_random_string
COOKIE_SECRET=replace_with_strong_random_string
STORE_CORS=http://localhost:3000
ADMIN_CORS=http://localhost:7001,http://localhost:3000
AUTH_CORS=http://localhost:3000,http://localhost:7001
PORT=9000
```

Local defaults intentionally use `5433` (Postgres) and `6380` (Redis) to avoid collisions with other dev stacks using `5432`/`6379`.

### Detached auth verification

The backend includes detached OTP verification endpoints for the future email/phone verification flow:

```text
POST /auth/customer/verify/request
POST /auth/customer/verify/confirm
```

These routes currently use in-memory OTP storage and console-only delivery because no mail/SMS provider is configured yet. They are **not connected to active frontend signup**; users can currently create accounts without verification.

See [`../AUTH_VERIFICATION.md`](../AUTH_VERIFICATION.md) for endpoint examples, env options, and the provider enablement checklist.

## Optional local services (Postgres + Redis)

```bash
cd /Users/bhanuteja.jogu/work-projects/irraya-web/backend
docker compose up -d
```

## Create admin user

After backend setup/migrations, create your first admin user:

```bash
cd /Users/bhanuteja.jogu/work-projects/irraya-web/backend
npx medusa user -e admin@irraya.com -p Admin@12345
```

Then log in at `http://localhost:9000/app` using the same email/password.

If needed, create a different admin account by changing `-e` and `-p` values.

## Useful commands

```bash
npm run bootstrap
npm run bootstrap:no-dev
npm run migrate
npm run seed:catalog:dry-run
npm run seed:catalog
npm run dev
npm run build
npm run start
npm run check:env
```

## Seed sample catalog

Use the sample catalog seeder to populate products, variants, pricing, and metadata in Medusa.
The script is idempotent by `handle` (existing products are skipped).

```bash
cd /Users/bhanuteja.jogu/work-projects/irraya-web/backend
npm run seed:catalog:dry-run
npm run seed:catalog
```

### Seeder auth options

Set one of the following in `backend/.env`:

```env
# Option 1 (recommended for local scripts)
MEDUSA_ADMIN_TOKEN=your_admin_jwt

# Option 2 (script will login and fetch token)
MEDUSA_ADMIN_EMAIL=admin@irraya.com
MEDUSA_ADMIN_PASSWORD=Admin@12345
```

### Optional seeder envs

```env
# Defaults to http://localhost:9000 when not provided
MEDUSA_BACKEND_URL=http://localhost:9000

# Defaults to inr
SEED_CATALOG_CURRENCY=inr
```

