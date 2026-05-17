# Frontend Skeleton (`frontend`)

This folder contains a Next.js App Router scaffold for the fashion storefront, designed to integrate with the backend created in `backend/`.

## Included
- App routes: Home, About, Products, Product Detail, Cart, Checkout, Order Confirmation, Account
- Reusable UI components (`Header`, `Footer`, `ProductCard`)
- Typed API client and domain-aligned frontend types
- Temporary fallback data until backend HTTP endpoints are exposed
- Basic test harness (`vitest`)

## Quick start

```bash
cd /Users/bhanuteja.jogu/work-projects/irraya-web/frontend
cp .env.example .env.local
npm install
npm test
npm run dev
```

## Integration notes
- Backend base URL is read from `NEXT_PUBLIC_BACKEND_BASE_URL`.
- Current API wrappers target planned endpoints:
  - `GET /products`
  - `GET /products/:handle`
  - `GET /carts/:id`
  - `POST /checkout/:cartId`
  - `POST /payments/:orderId/authorize`

Until backend HTTP handlers are implemented, product/cart functions fall back to local mock data.

