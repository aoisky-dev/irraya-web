# Irraya Fashion — Medusa + Next.js Commerce

Irraya is a fashion commerce workspace with a Medusa v2 backend and a Next.js 15 storefront.

## Workspace structure

```text
irraya-web/
├── backend/                 # Medusa backend, admin, Store API, local Postgres/Redis
│   ├── medusa-config.js
│   ├── docker-compose.yml
│   ├── scripts/
│   └── src/
│       ├── api/auth/customer/verify/  # detached/dev OTP verification routes
│       └── lib/auth-verification.ts
├── frontend/                # Next.js storefront
│   ├── src/app/             # App Router pages
│   ├── src/components/      # shared UI components
│   ├── src/lib/api/         # Medusa API adapters
│   └── tests/               # Vitest tests
├── AUTH_VERIFICATION.md
├── DESIGN_DOC_FASHION_COMMERCE.md
└── README.md
```

## Active functionality

- Product browsing, product detail, search, categories, cart, wishlist, compare, checkout UI, and account pages.
- Customer auth uses Medusa customer email/password auth.
- Signup currently creates a customer account directly and logs the user in.
- Password validation requires at least 8 characters and at least one special character.
- Search results use the shared responsive product grid.

## Detached / future functionality

These are intentionally not active in the storefront until providers are configured:

- Email/phone OTP verification
- Phone login
- Google sign-in
- Apple sign-in

The backend has detached/dev OTP endpoints documented in [AUTH_VERIFICATION.md](./AUTH_VERIFICATION.md).

## Run locally

### Backend

```bash
cd "/Users/bhanuteja.jogu/work-projects/irraya-web/backend"
npm run bootstrap
```

After first setup, daily backend run can be:

```bash
cd "/Users/bhanuteja.jogu/work-projects/irraya-web/backend"
docker compose up -d
npm run dev
```

Backend defaults:

```text
Medusa backend: http://localhost:9000
Medusa Admin:   http://localhost:9000/app
```

### Frontend

```bash
cd "/Users/bhanuteja.jogu/work-projects/irraya-web/frontend"
cp .env.example .env.local
npm install
npm run dev
```

Frontend defaults:

```text
Storefront: http://localhost:3000
```

## Environment

### Backend

Create `backend/.env` from `backend/.env.example`.

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

`npm run bootstrap` generates strong local auth secrets if placeholders are present.

### Frontend

Create `frontend/.env.local` from `frontend/.env.example`.

```env
NEXT_PUBLIC_MEDUSA_BASE_URL=http://localhost:9000
NEXT_PUBLIC_MEDUSA_PUBLISHABLE_API_KEY=
NEXT_PUBLIC_MEDUSA_ADMIN_URL=http://localhost:9000/app
NEXT_PUBLIC_STORE_NAME=Irraya Fashion
```

## Useful commands

### Backend

```bash
cd "/Users/bhanuteja.jogu/work-projects/irraya-web/backend"
npm run check:env
npm run migrate
npm run seed:catalog:dry-run
npm run seed:catalog
npm run build
npm run dev
```

### Frontend

```bash
cd "/Users/bhanuteja.jogu/work-projects/irraya-web/frontend"
npm run typecheck
npm test
npm run dev
npm run build
```

## Create Medusa admin user

After backend setup/migrations:

```bash
cd "/Users/bhanuteja.jogu/work-projects/irraya-web/backend"
npx medusa user -e admin@irraya.com -p Admin@12345
```

Then log in at:

```text
http://localhost:9000/app
```

## Validation checklist

Before committing auth or commerce changes, run:

```bash
cd "/Users/bhanuteja.jogu/work-projects/irraya-web/backend"
npm run check:env
npx tsc --noEmit
npm run build
```

```bash
cd "/Users/bhanuteja.jogu/work-projects/irraya-web/frontend"
npm run typecheck
npm test
```

## Documentation

| Document | Description |
|---|---|
| [AUTH_VERIFICATION.md](./AUTH_VERIFICATION.md) | Detached OTP verification status and future provider checklist |
| [DESIGN_DOC_FASHION_COMMERCE.md](./DESIGN_DOC_FASHION_COMMERCE.md) | Product and system design notes |
| [frontend/DESIGN_SCHEMA.md](./frontend/DESIGN_SCHEMA.md) | Frontend route map and structure notes |
| [backend/README.md](./backend/README.md) | Medusa backend setup and seed commands |
| [frontend/README.md](./frontend/README.md) | Storefront setup and integration notes |

## Git hygiene

Local/generated files are ignored via `.gitignore`, including:

- `node_modules/`
- `.next/`
- `.medusa/`
- `.env*` except `.env.example`
- `.idea/`
- `.DS_Store`
- `*.tsbuildinfo`
- logs and cache directories
