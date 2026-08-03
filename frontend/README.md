# Frontend Skeleton (`frontend`)

This folder contains a Next.js App Router storefront configured for **Medusa-only backend mode**:
- Commerce calls go directly to Medusa Store API.
- Customer auth calls go directly to Medusa auth endpoints.

## Included
- App routes: Home, About, Products, Product Detail, Cart, Checkout, Order Confirmation, Account
- Reusable UI components (`Header`, `Footer`, `ProductCard`)
- Typed API client and domain-aligned frontend types
- Direct Medusa API adapters with response mappers
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
- Medusa Store URL is read from `NEXT_PUBLIC_MEDUSA_BASE_URL`.
- Medusa publishable key is read from `NEXT_PUBLIC_MEDUSA_PUBLISHABLE_API_KEY`.
- Checkout uses Razorpay via backend endpoints at `NEXT_PUBLIC_MEDUSA_BASE_URL`; configure `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, and production `RAZORPAY_WEBHOOK_SECRET` in `backend/.env`. The checkout page supports payment retry and order-confirmation recovery after a verified payment.
- Wishlist and compare use localStorage for guests, then sync/migrate to backend customer APIs after login.
- Product reviews are loaded from backend review APIs; submitted reviews require login and remain pending until admin moderation.
- Account, order detail, and returns pages support customer order history, invoice download, shipment tracking display, cancel requests, and return/exchange requests. Admin processing remains in Medusa Admin.
- Catalog pages include URL-synced facets, price/stock filters, popularity/rating sorting, related/recently-viewed recommendations, debounced search suggestions, dynamic sitemap/robots, canonical metadata, Open Graph/Twitter metadata, and product JSON-LD.
- Custom `/admin` dashboard route is deprecated; use Medusa Admin at `NEXT_PUBLIC_MEDUSA_ADMIN_URL`.
- Current active auth is email/password. Signup creates/logs in customers directly and redirects to `/`; email/phone verification and phone login are intentionally detached until mail/SMS/phone auth providers are configured.
- `/verify` is a disabled/coming-soon page for the future OTP flow. See [`../AUTH_VERIFICATION.md`](../AUTH_VERIFICATION.md).
- Google and Apple sign-in buttons are intentionally hidden until OAuth providers and callback handling are implemented.

