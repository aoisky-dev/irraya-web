# Irraya Web — Comprehensive Improvement Plan

> **Scope:** Design, UX, Layout, Logic Handling, Frontend Security, Backend Security  
> **Status:** Plan only — no implementation. Each item is tagged with priority and effort.  
> **Color Palette preserved:** `#712119` (accent-warm / brand burgundy), `#0E0E0E` (primary), `#F5F3EE` (warm off-white)

---

## Reference Inspiration Summary

### shopkshm.com
- **Splash / loader screen** — animated brand intro creates premium first impression
- **Full-viewport hero slider** with minimal text overlaid bottom-left, navigation bullet dots
- **"Spotlight" section** — editorial 2-column + 3-column product storytelling layout with large imagery
- **Swipe-friendly mobile product cards** with `aspect-ratio: 3/4` — taller portrait cards feel editorial
- **Pill-style CTA buttons** with `border-radius: 26px 0` — signature asymmetric corner (brand touch)
- **Side-panel slide-out mini cart** (fixed, 420px, rounded corners) — no page navigation needed
- **Rating pill overlaid on product image** — trust signal right on the card
- **Custom unified icon set** — consistent stroke weight throughout

### terractive.in (Shopify)
- **Warm off-white background** `#F7F0E8` — very similar to Irraya's current `#F5F3EE` ✓ (already aligned)
- **DM Sans** across all fonts — identical to Irraya's body font ✓
- **Black/charcoal text on warm backgrounds** — high contrast
- **Rounded CTA buttons** `border-radius: 300px` — pill shape, very approachable
- **Yellow accent** `#EFEC5D` for secondary CTAs — energetic contrast punch
- **Zero-radius cards** with sharp editorial image grid — same philosophy as Irraya Atelier ✓
- **"Free Exchanges & Easy Returns"** prominently in meta — clear policy upfront
- **Large full-width category banner images** — "men / women / accessories" split landing

### Common patterns from both references
1. Generous whitespace with image-led storytelling
2. Mini-cart as side drawer (not a separate page)
3. Mobile: 2-column product grid with larger thumb images
4. Urgency via "Only X left" badges on cards
5. Sticky filter bar on PLP
6. Clear, short exchange/return policy copy visible in checkout

---

## Section 1 — Design & Visual Improvements

### 1.1 Hero Section
**Current state:** Static single banner image, overlay gradient, centered h1 + CTA button.

**Issues:**
- Hero is static — no animation, no story progression
- "Explore Collection" button is white on dark — conflicts with brand burgundy palette
- `hero::before` ghost watermark text is wasted when hidden behind image overlay
- `min-height: 90vh` but `objectPosition: center 25%` can crop badly on tall screens
- No urgency, no storytelling progression, no seasonal context

**Recommended Changes:**
1. **Hero carousel/slider** — 2–3 slides auto-advancing (5s), with swipe on mobile. Each slide targets a different collection ("New Arrivals", "Festive Edit").
2. **Text placement** — move copy to bottom-left (`flex-start`) in a semi-opaque panel. Inspired by KSHM's slider.
3. **CTA button** — use brand burgundy `var(--accent-warm)` or an outlined white button with hover fill. Remove solid white button.
4. **Slide indicator dots** — thin animated dots / line progression bottom-left.
5. **Mobile hero** — reduce to `min-height: 75vh`, use a portrait-crop image.
6. Add `text-shadow` to hero copy for legibility across varied banner images.

**Priority: High | Effort: Medium**

---

### 1.2 Navigation / Header
**Current state:** 3-column grid nav (left links | center logo | right icons), sticky with blur backdrop.

**Issues:**
- No active/current page indicator on nav links
- `header-right` explicitly hides Account icon on mobile — user can't login easily
- No search typeahead — search is a link to `/search` page, adding friction
- Missing Wishlist count badge (cart has one, wishlist does not)
- Mobile hamburger menu has no current-page indicator

**Recommended Changes:**
1. **Active route indicator** — add `aria-current="page"` and a CSS underline for the active nav link.
2. **Mobile bottom navigation bar** — replace hamburger overlay with a fixed bottom tab bar (Home, Shop, Search, Wishlist, Account). Dominant pattern on all successful Indian D2C mobile web apps.
3. **Search inline typeahead** — on desktop, clicking search expands an inline input with debounced top-5 suggestions. No full-page navigation needed.
4. **Wishlist badge** — show item count badge (same style as cart badge).
5. **"Sale" nav link** — when sale is active (SaleProvider), dynamically inject a "Sale" link in header with accent-warm color.
6. **Category dropdown on hover** (desktop) — hovering "Collections" shows a 2-column mega panel with category images.

**Priority: High | Effort: Medium–High**

---

### 1.3 Announcement Bar
**Current state:** Scrolling ticker, black bg, sale-aware (turns burgundy when active).

**Issues:**
- Font size `0.67rem` — too small, hard to read on mobile
- No clickable CTA within the bar for sale messages
- No dismiss button

**Recommended Changes:**
1. Bump font to `0.72rem` min (`0.78rem` on desktop).
2. Make sale bar messages link to `/products?sort=sale`.
3. Optional close button with sessionStorage persistence.

**Priority: Low | Effort: Low**

---

### 1.4 Product Cards (PLP Grid & Scroll Rows)
**Current state:** `aspect-ratio: 2/3`, hover overlay "View Product", wishlist slide-in, category + title + price in card body.

**Issues:**
- No color swatch on card — user can't tell product has multiple colors
- No quick-add to cart — must navigate to PDP to add
- Rating at `0.65rem` — easy to miss
- Low stock label not visually differentiated from normal muted text
- Card overlay on hover is full-width and heavy

**Recommended Changes:**
1. **Color swatches on card** — up to 3 color circles at card body bottom. Clicking swatch changes card image client-side.
2. **Quick-add button** — bottom-anchored "Quick Add" on hover, opens size-picker popover, adds to cart without navigation.
3. **Rating pill on image** — frosted glass pill overlaid bottom-left of card image (like KSHM).
4. **Card width** — `flex: 0 0 22%` (≈4.5 visible) in scroll rows instead of 5.
5. **"Low stock" badge** — visually distinct (orange pill) vs "Sold Out" (dark grey pill).

**Priority: High | Effort: Medium**

---

### 1.5 Homepage Layout
**Current state:** Hero → Features Row → Collections scroll row → Trending scroll row → Brand Story section.

**Issues:**
- Features Row (icons) feels generic and filler
- Collections and Trending use identical scroll component — page feels repetitive
- "Featured Products" is commented out — no editorial section
- Brand Story is a centered text block — underwhelming vs competitors
- Newsletter is commented out entirely
- No social proof
- **Collection cards use `aspect-ratio: 16/9` (landscape) but the source images are portrait-oriented** — the landscape crop wastes image real-estate, forces awkward focal point cropping, and loses the editorial, fashion-editorial feel that a tall portrait card naturally conveys. Both KSHM and Terractive use portrait ratios for their category cards.

**Recommended Changes:**
1. **Editorial "Story" banner** — between Collections and Trending: full-bleed 2-column (brand photo + editorial copy + CTA). Like Terractive's category-split.
2. **Trending → 5-column grid** on desktop instead of horizontal scroll. Scrolls are for discovery; trending deserves a browsable grid.
3. **Social proof strip** — 4–6 square Instagram customer photos row, links to Instagram.
4. **Features Row redesign** — 3 trust-signal icon cards with more breathing room, or move to footer top area.
5. **Re-enable Newsletter section** — redesigned full-bleed dark section with compelling headline.
6. **"New Arrivals" section** — filter products tagged `new-arrival` as a horizontal scroll under the hero.
7. **Collection cards → portrait ratio** *(user-requested)* — change `.collection-card` from `aspect-ratio: 16/9` to `aspect-ratio: 3/4` (or `2/3` to match product card ratio). On the scroll row, change `scroll-row-item-collection` from `flex: 0 0 50%` to `flex: 0 0 40%` on desktop (showing ~2.5 cards at a time). On mobile, `flex: 0 0 80%` so one card peeks at the edge to encourage swipe. Update `objectPosition` on the collection images to `center top` to keep model/subject in frame on the taller crop. This change also applies to the `/collections` page grid if it uses `.collections-grid` with `aspect-ratio: 16/9`.

**Priority: High | Effort: Low**

---

### 1.6 Product Detail Page (PDP)
**Current state:** 2-column (images left, info right), thumbnails grid, size/color selectors, ATC + wishlist, pincode checker, FAQ, reviews.

**Issues:**
- Image zoom requires double-click for fullscreen — non-intuitive
- Thumbnail `aspect-ratio: 1` (square) but main image is `2/3` — thumbnails mislead
- Size selector shows OOS as strikethrough but doesn't show low-stock inline
- Color selector is text labels only — no swatches
- No sticky "Add to Bag" bar on mobile when ATC button scrolls out of view
- "You may also like" uses `relatedProducts` prop but has weak UI presentation

**Recommended Changes:**
1. **Hover-zoom on desktop** — `cursor: zoom-in`, `transform: scale(2)` on mousemove. More intuitive than double-click.
2. **Thumbnail ratio** — `aspect-ratio: 2/3` to match main image. No more square crops.
3. **Color swatches** — circular color swatches (12×12px circles, border on selected).
4. **Low-stock size indicator** — inline "Only 2 left" hint next to low-stock size buttons.
5. **Sticky mobile ATC** — fixed bottom bar on mobile with `size | qty | Add to Bag`. Appears after scrolling past native ATC.
6. **Mobile image carousel** — full-width swipe carousel with dot indicators.
7. **"You may also like"** — proper 4-product horizontal scroll section below FAQ/reviews.

**Priority: High | Effort: Medium**

---

### 1.7 Cart Page
**Current state:** 2-column layout (items left, summary right). Full page.

**Issues:**
- Cart is a full page — industry moving to side-drawer cart (mini-cart)
- Empty state is just a dashed border box
- Quantity stepper touch targets `width: 30px` — too small for mobile
- No free shipping threshold progress indicator
- *Promo code handling:* Currently on `/checkout` only; cart displays applied discounts ✓

**Recommended Changes:**
1. **Side drawer cart** — slide-out panel (420px desktop, full-width mobile). Keep `/cart` as fallback route. Single biggest UX win.
2. **Free shipping progress bar** — "₹X away from free shipping!" fill bar. Increases AOV.
3. **Intentional checkout-only promo code placement (Conversion optimization)** — Keep promo code entry exclusively on `/checkout` where it already exists. Do NOT place an input on the cart page or mini-cart drawer to prevent "coupon hunting" cart abandonment (standard luxury/D2C boutique practice like *shopkshm* and Shopify default). Simply display the discount line on `/cart` and in the drawer if a code is active.
4. **Better empty cart** — SVG illustration + "Start Shopping" CTA + featured products below.
5. **Touch targets** — `min-height: 44px` on quantity stepper buttons (Apple HIG minimum).

**Priority: Medium | Effort: Medium**

---

### 1.8 Checkout Page
**Current state:** 2-column (form left, summary right), address + shipping + Razorpay modal payment. 866 lines, single page.

**Issues:**
- No step progression indicator
- No inline validation feedback
- Razorpay SDK loaded on-demand — 1–2s delay at payment time
- On mobile, order summary is below form — user can't see total while filling address
- No "Edit Cart" link from summary
- No `autocomplete` attributes on form fields

**Recommended Changes:**
1. **Step progress indicator** — 3-step: `Address → Review → Payment`. Each step is a discrete view.
2. **Inline form validation** — email format, phone (10 digits), pincode (6 digits) on blur. Green checkmark on valid.
3. **Mobile: summary at top** — collapsed accordion at top of form, expanded by default.
4. **Razorpay preload** — use `next/script strategy="beforeInteractive"` or `<link rel="preload">` in head.
5. **"Edit Cart" link** in checkout order summary.
6. **Form autocomplete** — `given-name`, `family-name`, `email`, `tel`, `street-address`, `postal-code`, etc.

**Priority: High | Effort: High**

---

### 1.9 Footer
**Current state:** Dark footer, ghost "Irraya" text, 4-column links, text-only social links.

**Issues:**
- "Careers", "Press", "Sustainability" all link to `/about` — inaccurate dead-ends
- No social media icons — text links only
- No payment method icons (trust signal)
- Ghost brand text at `opacity: 0.09` — nearly invisible
- Footer API failure renders no category links (silent failure)

**Recommended Changes:**
1. **Social icons** — SVG icons for Instagram, WhatsApp (Pinterest optional).
2. **Payment method icons strip** — Razorpay, Visa, Mastercard, UPI, RuPay at footer bottom.
3. **Fix dead links** — anchor to specific sections of `/about`, or remove until pages exist.
4. **Ghost text opacity** — increase to `0.13` or remove.
5. **Footer API fallback** — static hardcoded category links when `getProducts()` fails.

**Priority: Low | Effort: Low**

---

### 1.10 Mobile Responsiveness
**Current state:** Breakpoints at 1200, 1024, 768, 480px.

**Issues:**
- No 360px breakpoint — common Android size in India
- No 1920px+ rule — content looks sparse on 2K/4K monitors
- iOS horizontal scroll jank in scroll rows — missing `-webkit-overflow-scrolling: touch`
- Hero `objectPosition: center 25%` fixed — crops poorly on portrait mobile

**Recommended Changes:**
1. Add `@media (max-width: 360px)` — reduce font sizes and padding ~10%.
2. Add `@media (min-width: 1920px)` — increase container to `1600px`.
3. Verify `-webkit-overflow-scrolling: touch` on all horizontal scroll containers.
4. On mobile, hero `object-position: center center`.

**Priority: Medium | Effort: Low**

---

### 1.11 Typography & Spacing
**Current state:** Space Grotesk + DM Sans + Cormorant Garamond. Well chosen.

**Issues:**
- Cormorant Garamond loaded but barely used in theme CSS — wasted load
- Several font sizes below `0.72rem` (`0.58rem`, `0.65rem`) — WCAG AA risk for body text
- No documented usage of serif font in editorial contexts

**Recommended Changes:**
1. Use Cormorant Garamond for brand story pull-quotes and hero editorial quotes to justify the load, or remove from import.
2. Audit all text below `0.72rem` — ensure non-essential/decorative use only. Critical labels `≥ 0.78rem`.
3. The `display=swap` is already in the Google Fonts URL ✓ — confirm it renders correctly in production.

**Priority: Medium | Effort: Low**

---

## Section 2 — UX & Logic Improvements

### 2.1 Product Catalog — Filters & Sorting
**Issues:**
- No active filter count badge on "Filter" button
- Filter panel on mobile overlaps content (not a bottom sheet)
- Price range uses two text inputs — no range slider
- No "Clear all filters" single button
- Loading state shows empty grid (no skeletons)

**Recommended Changes:**
1. **Active filter badge** — "Filters (3)" on the button when active.
2. **Mobile bottom sheet filter** — slides up full-screen on mobile.
3. **Price range slider** — dual-handle range slider.
4. **"Clear all" button** — visible when any filter is active.
5. **Skeleton loading** — 10 card placeholder skeletons while loading.

**Priority: Medium | Effort: Medium**

---

### 2.2 Search
**Issues:**
- Entirely client-side, only matches product title
- No typeahead, no recent searches, no trending searches
- Navigates to `/search` page — high friction

**Recommended Changes:**
1. **Search overlay modal** — full-screen overlay on icon click. Real-time results as user types.
2. **Recent searches** — last 5 in LocalStorage, shown on focus with no query.
3. **Extended search** — match description, tags, category in addition to title.

**Priority: Medium | Effort: Medium**

---

### 2.3 Cart & Wishlist State
**Issues:**
- Brief "empty cart" flash on mount before localStorage loads
- Wishlist is client-only — not synced to account on login
- No cart stock re-validation before checkout
- Cart init failure is silent

**Recommended Changes:**
1. **Hydration** — `suppressHydrationWarning` on cart count, or `useEffect`-gated state.
2. **Wishlist sync** — on login, merge local wishlist into Medusa customer metadata.
3. **Cart stock check** — re-fetch stock for each cart item before showing checkout CTA.
4. **Cart error state** — visible banner + "Retry" on init failure.

**Priority: Medium | Effort: Medium**

---

### 2.4 Authentication Flow
**Issues:**
- No guest checkout — high cart abandonment cause *(Resolved: Guest checkout implemented end-to-end)*
- Login and register are separate pages — no unified auth modal
- No password strength indicator in UI
- JWT stored in localStorage — XSS vulnerable *(Resolved: migrated to HttpOnly cookie)*

**Recommended Changes:**
1. **Guest checkout** — *(Implemented)* allow proceeding without account, prefill registration form post-order.
2. **Unified auth modal** — "Sign In" opens modal overlay. User stays on current page after auth.
3. **Password strength meter** — 3-level indicator (weak / medium / strong) on register form.

**Priority: High | Effort: Medium**

---

### 2.5 Order Management
**Issues:**
- Order timeline steps not always populated correctly from Medusa status codes
- No order cancellation request flow
- PDF invoice generated client-side — can freeze UI for large orders
- Orders list has no pagination

**Recommended Changes:**
1. Map Medusa order status codes to timeline steps explicitly. Add "processing" state.
2. Pagination — 10 orders per page with "Load more".
3. Generate PDF server-side in a Next.js API route.

**Priority: Low | Effort: Medium**

---

### 2.6 Compare Feature
**Issues:**
- No "Compare" button visible anywhere on catalog/PDP — feature is hidden
- Compare state lost on page refresh (no localStorage persistence)

**Recommended Changes:**
1. Add "Compare" to product card hover row (alongside wishlist).
2. Persist compare list to LocalStorage.
3. Floating compare bar at bottom when 2+ products queued.

**Priority: Low | Effort: Low**

---

## Section 3 — Frontend Security

### 3.1 JWT Token Storage ✅ RESOLVED
**Implementation:**
1. Created Next.js Route Handler at `/api/auth/session` (`POST`, `GET`, `DELETE`) managing an `HttpOnly`, `SameSite=Lax`, `Secure` cookie (`irraya_session`).
2. Updated `AuthProvider.tsx`: Tokens are never persisted in plain `localStorage`. The active token is held in React state (memory-only) and restored via `/api/auth/session` on mount.
3. Added automatic legacy migration in `AuthProvider`: any legacy `localStorage` token is transparently transferred to the HttpOnly cookie and immediately wiped from `localStorage`.
4. Added test suite `frontend/tests/auth-session.spec.ts` (5 tests passing).

**Priority: Resolved | Effort: Completed**

---

### 3.2 Content Security Policy (CSP)
**Current state:** No CSP headers in `next.config.mjs` or nginx.

**Risk:** Any injected script (XSS, supply chain) can execute with full page access, including intercepting payment flows.

**Recommended Fix:**
1. Add CSP header via `next.config.mjs` `headers()` config.
2. Start with `Content-Security-Policy-Report-Only` to identify violations first.
3. Key directives: `default-src 'self'`, `script-src 'self' https://checkout.razorpay.com https://fonts.googleapis.com https://www.googletagmanager.com`, `frame-src https://api.razorpay.com`.
4. Also add: `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`.

**Priority: High | Effort: Medium**

---

### 3.3 Input Sanitization
**Current state:** `sanitizeDisplayName()` and `sanitizeEmail()` exist on auth inputs only.

**Issues:**
- Search queries, review text, address fields not explicitly sanitized before rendering
- Need audit of any `dangerouslySetInnerHTML` usage for untrusted content

**Recommended Fix:**
1. Audit all `dangerouslySetInnerHTML` — only Medusa admin content (trusted) should use it.
2. Add DOMPurify sanitization on user-submitted review text before display.
3. Ensure search query strings from URL params don't reach eval or unsafe template literals.

**Priority: Medium | Effort: Low**

---

### 3.4 Razorpay Key Handling ✅
**Current state:** `rzp-test-key.csv` is a local-only credentials reference file — it is already added to `.gitignore` and has never been committed to the repo. ✓

**Remaining best-practice note:**
- The Razorpay Key ID (publishable key) returned by the backend to the frontend is safe to expose ✓.
- The Razorpay Key Secret must only ever exist in backend environment variables and be used server-side for webhook HMAC verification. Verify it is never included in any `NEXT_PUBLIC_*` env var.

**Priority: Low | Effort: Minimal**

---

### 3.5 CSRF Protection
**Current state:** No CSRF tokens on form submissions.

**Risk:** Low currently (JWTs in localStorage mean custom headers prevent CSRF). If migrating to HttpOnly cookies (3.1), CSRF protection becomes mandatory.

**Recommended Fix:**
1. If keeping JWT in memory/localStorage: no action needed (custom headers block cross-site requests).
2. If migrating to cookies: implement Double Submit Cookie pattern or rely on `SameSite=Strict`.

**Priority: Medium (conditional on 3.1) | Effort: Medium**

---

### 3.6 Dependency Audit
**Recommended:**
1. Run `npm audit` in both `frontend/` and `backend/` — address high/critical vulnerabilities.
2. Set up Dependabot for automated security PRs.
3. `package-lock.json` is committed ✓ — good, ensures reproducible builds.

**Priority: Medium | Effort: Low**

---

### 3.7 Environment Variable Leakage
**Issues:**
- `config.ts` has hardcoded fallback Medusa publishable key — tempting pattern for secrets
- Root `.env` file — verify in `.gitignore` and check git history
- `frontend/.env.local` — verify in `.gitignore`

**Recommended Fix:**
1. Remove hardcoded publishable key fallback. Require env var explicitly; throw startup error in production if missing.
2. Audit root `.env`, `frontend/.env.*`, `backend/.env` — ensure all in `.gitignore`.
3. Use GCP Secret Manager for all production secrets.

**Priority: High | Effort: Low**

---

## Section 4 — Backend Security

### 4.1 Rate Limiting Coverage
**Current state:** OTP send (5/15min) and OTP verify (10/15min) are rate-limited. Good baseline.

**Issues:**
- No rate limit on `/store/products` — catalog can be scraped freely
- No rate limit on review submission
- `req.ip` behind nginx proxy may return internal IP — `trust proxy` not set
- No global per-IP rate limit for all store routes

**Recommended Fix:**
1. Global rate limit at nginx — `limit_req_zone` (e.g., 60 req/min per IP for store routes).
2. Rate limit review submissions (3 per hour per IP).
3. Set `app.set('trust proxy', 1)` in Medusa/Express config for accurate `X-Forwarded-For` parsing.

**Priority: High | Effort: Low**

---

### 4.2 CORS Configuration
**Issues:**
- Need to verify `STORE_CORS` is `https://irraya.com` not wildcard `*`
- Admin CORS must be restricted to admin panel domain only

**Recommended Fix:**
1. Verify `STORE_CORS = https://irraya.com` in `medusa-config.js`.
2. Verify `ADMIN_CORS` is restricted to Medusa admin domain only.
3. Document the allowed origins explicitly in config.

**Priority: High | Effort: Minimal**

---

### 4.3 Admin Route Protection
**Issues:**
- Frontend `/admin` route — unclear if role check actually blocks non-admin users from navigating to the URL
- Medusa admin panel at `https://api.irraya.com/app` is publicly accessible

**Recommended Fix:**
1. Add middleware in `frontend/src/app/admin/layout.tsx` checking `user?.role === 'admin'`, redirect to `/` otherwise.
2. Nginx: restrict `/app` path to known IPs or VPN (basic auth as fallback).

**Priority: High | Effort: Low**

---

### 4.4 Path Traversal Prevention
**Current state:** `filePath.startsWith("/app/uploads/")` check after `path.resolve()` ✓ — correct approach.

**Issues:**
- No Content-Type enforcement — admin could upload `.html` or `.svg` served as document (XSS via SVG)

**Recommended Fix:**
1. Set explicit Content-Type headers in file serving: only allow `image/jpeg`, `image/png`, `image/webp`.
2. `Content-Disposition: attachment` for non-image types.
3. Add MIME type validation in admin uploads — reject non-image files.

**Priority: Medium | Effort: Low**

---

### 4.5 Webhook Security ✅ VERIFIED
**Status:**
1. Audited `backend/src/api/store/payments/razorpay/webhook/route.ts` and `backend/src/lib/razorpay.ts`: HMAC-SHA256 signature verification is actively enforced using `crypto.timingSafeEqual` and `process.env.RAZORPAY_WEBHOOK_SECRET`.
2. `preserveRawBody: true` is properly configured in `backend/src/api/middlewares.ts`.
3. Created test script at `backend/scripts/verify-webhook-security.ts` and added `npm run test:security` in `backend/package.json` covering: valid signature match, tampered signature rejection, tampered payload rejection, and empty parameter rejection.

**Priority: Verified | Effort: Completed**

---

### 4.6 Database Query Safety
**Issues:**
- `getSaleUnitPrice()` does direct SQL — need to verify parameterized queries, not string interpolation

**Recommended Fix:**
1. Audit `getSaleUnitPrice()` and all raw SQL in `/backend/src/lib/` — ensure all user-provided values are parameterized.

**Priority: High | Effort: Low**

---

### 4.7 Logging & Sensitive Data
**Issues:**
- `console.error` throughout may log tokens, request bodies, passwords to production logs
- No structured logging — difficult to filter/alert on specific error types

**Recommended Fix:**
1. Replace `console.error/log` with `pino` logger — redact sensitive fields (token, password, phone, email).
2. Set log level `warn` in production.

**Priority: Medium | Effort: Medium**

---

## Section 5 — Performance

### 5.1 Image Optimization
**Issues:**
- Product card `sizes` says `25vw` but desktop renders 5-per-row (actually `20vw`) — Next.js over-fetches
- No CDN — every image/size combo re-processed on demand

**Recommended Fix:**
1. Fix `sizes` on product cards: `"(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"`.
2. Set `images.minimumCacheTTL: 86400` in `next.config.mjs`.
3. Add Cloudflare or GCP Cloud CDN in front of Next.js app.

**Priority: Medium | Effort: Low**

---

### 5.2 Server-Side Rendering & Caching
**Issues:**
- `getProducts()` uses `cache: "no-store"` — every page visit hits Medusa backend
- Footer calls `getProducts()` independently — 2 API calls per page render for same data
- No ISR anywhere

**Recommended Fix:**
1. Use `fetch(url, { next: { revalidate: 300 } })` for catalog data (5-min cache).
2. Share `getProducts()` result between page and footer via React cache / `unstable_cache`.

**Priority: Medium | Effort: Low**

---

### 5.3 Bundle Size
**Recommended Actions:**
1. Add `@next/bundle-analyzer` and audit the output.
2. `ReactMarkdown` adds ~30KB gzipped — consider lighter renderer or dynamic import.
3. Verify `Icons.tsx` tree-shaking is working (single file with many exports).

**Priority: Low | Effort: Low**

---

## Section 6 — SEO & Accessibility

### 6.1 SEO Improvements
**Issues:**
- No Product JSON-LD structured data — Google Rich Results require this for star ratings/price in SERPs
- No `canonical` on filtered PLP URLs — Google may index `/products?category=tops` as duplicate
- Per-product `og:image` may not be set

**Recommended Fix:**
1. Add `Product` JSON-LD to all PDP pages.
2. Add `canonical` on PLP pages pointing to base `/products` when filters active.
3. Add per-product `og:image` using product main image URL.

**Priority: High | Effort: Medium**

---

### 6.2 Accessibility (a11y)
**Issues:**
- Focus not trapped in mobile menu when open
- Size selector buttons have no `aria-pressed`
- `var(--text-muted): #8A8580` on `#FEFEFE` may fail WCAG AA 4.5:1 contrast ratio
- No "Skip to main content" link

**Recommended Fix:**
1. Add focus trap to mobile menu.
2. Add `aria-pressed` to size buttons.
3. Add visually-hidden "Skip to content" as first focusable element.
4. Run contrast audit on all text/background combinations.

**Priority: Medium | Effort: Medium**

---

## Implementation Priority Matrix

| # | Area | Priority | Effort | Impact |
|---|------|----------|--------|--------|
| 1 | JWT HttpOnly cookies (§3.1) | 🟢 Resolved | High | Security |
| 2 | Razorpay key handling (§3.4) | 🟢 Low (Verified) | Minimal | Security |
| 3 | Webhook signature verify (§4.5) | 🟢 Verified | Low | Security |
| 4 | Side drawer cart (§1.7) | 🟠 High | Medium | UX/Conversion |
| 5 | Hero carousel (§1.1) | 🟠 High | Medium | First impression |
| 6 | Mobile bottom nav bar (§1.2) | 🟠 High | Medium | Mobile UX |
| 7 | Checkout step flow (§1.8) | 🟠 High | High | Conversion |
| 8 | CSP headers (§3.2) | 🟠 High | Medium | Security |
| 9 | Product card swatches + quick add (§1.4) | 🟠 High | Medium | Conversion |
| 10 | Guest checkout (§2.4) | ✅ Done | Medium | Conversion |
| 11 | Sticky mobile ATC on PDP (§1.6) | 🟠 High | Low | Conversion |
| 12 | Admin route guard frontend (§4.3) | 🟠 High | Low | Security |
| 13 | CORS config audit (§4.2) | 🟠 High | Minimal | Security |
| 14 | Rate limiting nginx (§4.1) | 🟠 High | Low | Security |
| 15 | Product JSON-LD structured data (§6.1) | 🟡 Medium | Medium | SEO |
| 16 | ISR for catalog pages (§5.2) | 🟡 Medium | Low | Performance |
| 17 | Filter panel mobile bottom sheet (§2.1) | 🟡 Medium | Medium | UX |
| 18 | Homepage editorial section (§1.5) | 🟡 Medium | Medium | Brand |
| 19 | PDP image hover zoom (§1.6) | 🟡 Medium | Low | UX |
| 20 | Wishlist account sync (§2.3) | 🟡 Medium | Medium | UX |
| 21 | Free shipping progress bar (§1.7) | 🟡 Medium | Low | Conversion |
| 22 | Footer dead links fix (§1.9) | 🟢 Low | Low | Trust |
| 23 | Compare feature visibility (§2.6) | 🟢 Low | Low | UX |
| 24 | Newsletter section re-enable (§1.5) | 🟢 Low | Low | Marketing |
| 25 | Bundle size analysis (§5.3) | 🟢 Low | Low | Performance |

---

## Notes on Color Theming Preservation

All recommendations preserve and enhance the existing **Irraya Atelier** theme:
- `#712119` (brand burgundy) remains primary accent for CTAs, links, sale badges, active states
- `#FEFEFE` / `#F5F3EE` warm off-white backgrounds maintained throughout
- `#0E0E0E` rich black for primary text and CTA hover states
- **Space Grotesk + DM Sans** typography unchanged
- Sharp-radius (`border-radius: 6–10px`) editorial aesthetic preserved
- Flat cards, thin borders, no heavy drop shadows — minimal editorial language preserved

New additions (hero carousel, mini cart drawer, bottom nav) should use existing CSS tokens exclusively — no new color values without explicit design review.

---

*Prepared: October 2026 | Repo audit: irraya-web (Next.js/Atelier + Medusa.js) | References: shopkshm.com, terractive.in*
