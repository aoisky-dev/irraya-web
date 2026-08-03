# Frontend Design Schema (Initial)

## 1) Goal
Create a Next.js storefront layout that can integrate cleanly with the backend domain/services already scaffolded in `backend/`.

## 2) Route Map (MVP)
- `/` -> Home
- `/about` -> About Us
- `/products` -> Product listing
- `/products/[handle]` -> Product detail
- `/cart` -> Cart
- `/checkout` -> Checkout
- `/order/[id]` -> Order confirmation
- `/account` -> Customer account

## 3) Frontend Architecture
- **Framework:** Next.js App Router
- **Composition:** server-rendered route pages + reusable UI components
- **Data access:** API wrapper layer under `src/lib/api/*`
- **Config:** environment-driven `medusaBaseUrl` and Medusa publishable API key
- **Typing:** shared shape alignment with backend entities (`Product`, `Cart`, `Order`, `Payment`)

## 4) Folder Structure

```text
frontend/
  src/
    app/
      layout.tsx
      page.tsx
      about/page.tsx
      products/page.tsx
      products/[handle]/page.tsx
      cart/page.tsx
      checkout/page.tsx
      order/[id]/page.tsx
      account/page.tsx
    components/
      Header.tsx
      Footer.tsx
      ProductCard.tsx
    lib/
      config.ts
      types.ts
      format.ts
      mock-data.ts
      api/
        client.ts
        products.ts
        cart.ts
        checkout.ts
  tests/
    format.spec.ts
  README.md
  package.json
```

## 5) Backend Integration Contract
Frontend API layer now targets Medusa Store/Auth endpoints directly:
1. `GET /store/products`
2. `GET /store/products?handle=...`
3. `GET /store/carts/:id`
4. `POST /store/carts/:id/complete`
5. `POST /auth/customer/emailpass` and `GET /store/customers/me`

## 6) State and Data Plan
- Start with server components for initial fetch.
- Add client state for cart interactions in next step.
- Introduce optimistic UI only after backend idempotent endpoints are available.

## 7) Rendering Plan
- Home/products/product detail: SSR for SEO and freshness.
- Cart/checkout/account: interactive client-first pages once auth/session is in place.

## 8) Next Implementation Steps
1. Add backend HTTP handlers and remove fallback mock paths.
2. Add cart state management and update-item APIs.
3. Implement checkout form with address + payment intent handling.
4. Add auth guards for account pages.
5. Add E2E tests for browse-to-order flow.

