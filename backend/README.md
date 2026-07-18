# Irraya Medusa Backend (`backend`)

This folder now contains the Medusa backend setup for the Irraya store.

## What is configured

- Medusa backend app commands (`dev`, `build`, `start`)
- `medusa-config.js` driven by environment variables
- PostgreSQL and Redis local setup through `docker-compose.yml`
- `.env.example` template for DB/auth/CORS configuration
- `check:env` script to validate required env keys
- Detached email/phone OTP verification routes for future provider wiring
- Razorpay payment order creation and signature verification routes
- Customer wishlist, compare-list persistence, and product review moderation routes
- Customer order cancel/return/exchange request routes for Medusa Admin processing

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
RAZORPAY_KEY_ID=rzp_test_your_key_id
RAZORPAY_KEY_SECRET=replace_with_razorpay_key_secret
RAZORPAY_WEBHOOK_SECRET=replace_with_razorpay_webhook_secret
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

### Razorpay payments

Checkout uses Razorpay Checkout with backend-only secret handling:

```text
POST /store/payments/razorpay/orders
POST /store/payments/razorpay/verify
POST /store/payments/razorpay/link-order
POST /store/payments/razorpay/webhook
POST /admin/payments/razorpay/reconcile
POST /admin/payments/razorpay/refunds
```

Set `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` in `backend/.env`. The frontend requests a Razorpay order from the backend, opens Razorpay Checkout in the browser, then posts Razorpay's signed payment response back to `/store/payments/razorpay/verify` before completing the Medusa cart. After Medusa order creation, `/store/payments/razorpay/link-order` stores the Razorpay order/payment ids against a durable `razorpay_payment_references` ledger and attempts to attach them to Medusa order metadata.

For production, configure a Razorpay webhook pointing to:

```text
https://<your-backend-domain>/store/payments/razorpay/webhook
```

Enable at least these events in Razorpay Dashboard:

- `payment.captured`
- `payment.failed`
- `refund.created`
- `refund.processed`

Set the dashboard webhook secret as `RAZORPAY_WEBHOOK_SECRET`. The webhook endpoint verifies `x-razorpay-signature` and updates the payment reference ledger for captured, failed, pending-refund, refunded, and partially-refunded states.

Operations/admin flows:

- `POST /admin/payments/razorpay/reconcile` with `razorpay_order_id`, `razorpay_payment_id`, `order_id`, or `cart_id` fetches Razorpay state and updates the local ledger.
- `POST /admin/payments/razorpay/refunds` with `razorpay_payment_id` and optional `amount` creates a full or partial refund through Razorpay and records the refund id/status.

Use test keys from the Razorpay dashboard for local development. Never expose `RAZORPAY_KEY_SECRET` to the frontend.

### Customer wishlist, compare, and reviews

Authenticated customer commerce routes:

```text
GET    /store/customers/me/wishlist
POST   /store/customers/me/wishlist
DELETE /store/customers/me/wishlist
GET    /store/customers/me/compare
PUT    /store/customers/me/compare
DELETE /store/customers/me/compare
GET    /store/products/:id/reviews
POST   /store/products/:id/reviews
GET    /admin/reviews
PATCH  /admin/reviews
```

Wishlist and compare lists are persisted in custom Postgres tables with product snapshots so they sync across devices after login while still supporting guest localStorage fallback in the frontend. Guest wishlist/compare data is migrated into the customer account when the user signs in.

Reviews are stored in `product_reviews` with `pending`, `approved`, and `rejected` statuses. Storefront review lists only show approved reviews; submitted reviews remain pending until an admin approves them. Verified-purchase status is best-effort based on matching a customer order line item for the reviewed product.

### Customer order requests and returns

Customer-facing order management uses a request workflow while admin operations stay in Medusa Admin:

```text
GET  /store/customers/me/order-requests
POST /store/customers/me/order-requests
```

Customers can submit `cancel`, `return`, or `exchange` requests. Requests are stored in `customer_order_requests` and summarized onto the Medusa order `metadata.latest_customer_request`, making them visible from the order record in Medusa Admin. Admin approval/rejection, fulfillment updates, return processing, and refund execution should be handled in Medusa Admin and the configured Razorpay refund workflow.

Eligibility rules:

- Cancel requests are allowed before fulfillment/shipment.
- Return/exchange requests are allowed within 30 days and not for cancelled orders.
- Duplicate open requests of the same type for the same order are blocked.

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

