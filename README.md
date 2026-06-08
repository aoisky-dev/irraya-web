# 🛍️ Irraya Fashion — Full-Stack E-Commerce Platform

> A modern, full-stack fashion e-commerce web application built with Next.js 15, Express 5, TypeScript, and Prisma. Designed for premium fashion retail with a clean, domain-driven backend architecture and a rich, responsive storefront.

---

## 📋 Table of Contents

- [Overview](#overview)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Features](#features)
- [Pages & Routes](#pages--routes)
- [Backend API Reference](#backend-api-reference)
- [Data Models](#data-models)
- [Architecture](#architecture)
- [Environment Variables](#environment-variables)
- [Default Accounts & Credentials](#default-accounts--credentials)
- [How to Run Locally](#how-to-run-locally)
- [Database Setup (PostgreSQL)](#database-setup-postgresql)
- [Running Tests](#running-tests)
- [Deployment](#deployment)
- [Design Documents](#design-documents)

---

## Overview

**Irraya Fashion** is a premium fashion e-commerce platform. The project is a full-stack monorepo with a **Next.js 15** storefront and an **Express 5 + TypeScript** REST API backend. The backend follows a **domain-driven design (DDD)** pattern, making it straightforward to migrate from in-memory repositories to a production PostgreSQL database via Prisma.

The platform supports browsing products with advanced filtering, managing a shopping cart, applying promo codes, wishlisting items, comparing products, and completing a full checkout and payment flow — all secured with JWT-based authentication and role-based access control (RBAC).

---

## 🚀 Tech Stack

### Frontend
| Technology | Version | Purpose |
|---|---|---|
| **Next.js** | 15.3.2 | App Router, SSR/ISR, routing |
| **React** | 19.1.0 | UI rendering |
| **TypeScript** | ^5.8.3 | Type safety |
| **Vanilla CSS** | — | Custom design system & animations |
| **Vitest** | ^2.1.9 | Unit testing |

### Backend
| Technology | Version | Purpose |
|---|---|---|
| **Node.js** | ≥ 20 | Runtime |
| **Express** | ^5.2.1 | HTTP server & REST API |
| **TypeScript** | ^5.8.3 | Type safety |
| **Prisma ORM** | ^5.22.0 | PostgreSQL data access (Phase 2) |
| **Zod** | ^3.25.76 | Schema validation |
| **Vitest** | ^2.1.9 | Unit & integration testing |

### Infrastructure
| Technology | Purpose |
|---|---|
| **PostgreSQL 15** | Production database (via Docker or Cloud SQL) |
| **Docker / docker-compose** | Local database container |
| **GCP (Cloud Run, Cloud SQL)** | Planned production deployment target |

---

## 📦 Project Structure

```
irraya-web/
├── frontend/                   # Next.js storefront
│   ├── src/
│   │   ├── app/                # Next.js App Router pages
│   │   │   ├── page.tsx        # Home page
│   │   │   ├── about/          # About Us page
│   │   │   ├── account/        # Customer account
│   │   │   ├── admin/          # Admin dashboard (RBAC-protected)
│   │   │   ├── cart/           # Shopping cart
│   │   │   ├── checkout/       # Checkout flow
│   │   │   ├── compare/        # Product comparison
│   │   │   ├── login/          # Login page
│   │   │   ├── order/          # Order confirmation
│   │   │   ├── privacy/        # Privacy policy
│   │   │   ├── products/       # Product listing & detail pages
│   │   │   ├── register/       # Registration page
│   │   │   ├── returns/        # Returns policy
│   │   │   ├── search/         # Search results
│   │   │   └── wishlist/       # Wishlist page
│   │   ├── components/         # Reusable UI components
│   │   │   ├── AddToCartButton.tsx
│   │   │   ├── AuthProvider.tsx
│   │   │   ├── Breadcrumb.tsx
│   │   │   ├── Carousel.tsx
│   │   │   ├── CartProvider.tsx
│   │   │   ├── CompareProvider.tsx
│   │   │   ├── FAQAccordion.tsx
│   │   │   ├── Footer.tsx
│   │   │   ├── Header.tsx
│   │   │   ├── NewsletterForm.tsx
│   │   │   ├── ProductCard.tsx
│   │   │   ├── ReviewList.tsx
│   │   │   └── WishlistProvider.tsx
│   │   └── lib/                # Utilities & API layer
│   │       ├── api/            # API client functions (products, cart, checkout)
│   │       ├── config.ts       # Environment config
│   │       ├── format.ts       # Currency/date formatting helpers
│   │       ├── mock-data.ts    # Fallback mock product data
│   │       └── types.ts        # Shared TypeScript interfaces
│   ├── tests/                  # Frontend unit tests
│   ├── .env.example            # Environment variable template
│   └── package.json
│
├── backend/                    # Express REST API server
│   ├── src/
│   │   ├── app.ts              # Composition root (dependency injection)
│   │   ├── index.ts            # HTTP server & all route handlers
│   │   ├── config/
│   │   │   ├── env.ts          # Environment variable loader
│   │   │   └── seed-data.ts    # In-memory product seed data
│   │   ├── domain/             # Business logic layer
│   │   │   ├── cart/           # CartService, cart entities
│   │   │   ├── customers/      # CustomerService
│   │   │   ├── orders/         # OrderService
│   │   │   ├── payments/       # PaymentService
│   │   │   ├── products/       # ProductService, ProductRepository interface
│   │   │   └── users/          # AuthService (JWT auth)
│   │   ├── infrastructure/     # Infrastructure implementations
│   │   │   ├── repositories/
│   │   │   │   ├── memory/     # InMemory*Repository (default, zero-setup)
│   │   │   │   └── prisma/     # PrismaProductRepository (PostgreSQL)
│   │   │   └── payment/        # MockPaymentGateway / Stripe (future)
│   │   ├── modules/
│   │   │   └── medusa/         # Medusa.js bridge (future integration)
│   │   └── shared/
│   │       └── errors/         # AppError (typed HTTP errors)
│   ├── prisma/
│   │   ├── schema.prisma       # Prisma schema (Product, ProductVariant)
│   │   └── seed.ts             # Database seeder
│   ├── tests/                  # Backend integration tests
│   ├── docker-compose.yml      # PostgreSQL container config
│   └── package.json
│
├── DESIGN_DOC_FASHION_COMMERCE.md  # Full system design document
└── README.md
```

---

## ✨ Features

### 🛒 Shopping Experience
- **Product Catalog** — Browse all products with category, color, size, and price range filters
- **Product Detail Pages** — Full-page view with image gallery, variant selector (size/color), stock status, and add-to-cart
- **Product Carousel** — Auto-playing carousel on the home page showcasing featured products
- **Product Reviews** — Star ratings and customer review display per product
- **Product Comparison** — Side-by-side comparison of multiple products
- **Search** — Search products by keyword with live results
- **Category Browse** — "Shop by Category" section with visual collection cards

### 🛍️ Cart & Checkout
- **Shopping Cart** — Add, update quantity, and remove items; real-time total calculation
- **Promo Codes** — Apply discount promo codes at cart level
- **Wishlist** — Save products for later, persisted via `WishlistProvider`
- **Checkout Flow** — Complete checkout process converting cart to order
- **Order Confirmation** — Order summary page with order ID and payment status

### 🔐 Authentication & Accounts
- **User Registration** — Create a new customer account
- **Login / Logout** — JWT-based authentication with Bearer token header
- **Auth Context** — `AuthProvider` manages user session across the app
- **Customer Account Page** — View account details and order history
- **Role-Based Access Control (RBAC)** — Two roles: `admin` and `customer`

### 🛡️ Admin Dashboard (`/admin`)
- **Revenue Stats** — Total revenue, total orders, and average order value
- **Order Management** — Live table of all orders with status badges
- **Admin-Only Route** — Protected by `AdminLayout` with RBAC enforcement

### 🏠 Content Pages
- **Home** — Hero banner, features row, category grid, featured product carousel, brand story, newsletter signup
- **About Us** — Brand story and philosophy
- **Privacy Policy** — Static privacy page
- **Returns Policy** — 30-day return policy information
- **Newsletter** — Email subscription form

---

## 🗺️ Pages & Routes

| Route | Page | Description |
|---|---|---|
| `/` | Home | Hero, collections, featured products, brand story, newsletter |
| `/about` | About Us | Brand story and philosophy |
| `/products` | Product Listing | Full catalog with filters (category, color, size, price) |
| `/products/[handle]` | Product Detail | Images, variants, add-to-cart, reviews |
| `/cart` | Shopping Cart | Line items, quantity controls, promo code, totals |
| `/checkout` | Checkout | Address & payment — converts cart to order |
| `/order/[id]` | Order Confirmation | Order summary after successful checkout |
| `/wishlist` | Wishlist | Saved products |
| `/compare` | Compare | Side-by-side product comparison |
| `/search` | Search | Keyword product search |
| `/account` | My Account | Customer profile and order history |
| `/login` | Login | JWT authentication |
| `/register` | Register | New account creation |
| `/admin` | Admin Dashboard | Revenue stats & order management (admin only) |
| `/privacy` | Privacy Policy | Legal privacy page |
| `/returns` | Returns | Return & refund policy |

---

## 🔌 Backend API Reference

The Express API server runs on **`http://localhost:4000`** by default. All endpoints are prefixed with `/api`.

### Health
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/health` | Server health, uptime, storage mode |

### Authentication
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/auth/register` | Register a new user (`email`, `passwordHash`, `firstName`, `lastName`) |
| `POST` | `/api/auth/login` | Login with credentials — returns JWT token |
| `GET` | `/api/auth/me` | Get current user from `Authorization: Bearer <token>` |

### Products
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/products` | List all published products (supports `q`, `category`, `color`, `size`, `minPrice`, `maxPrice` query params) |
| `GET` | `/api/products/:handle` | Get a single product by its URL handle |

### Cart
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/carts` | Create a new empty cart (INR currency) |
| `GET` | `/api/carts/:id` | Get cart by ID |
| `POST` | `/api/carts/:id/items` | Add item (`productId`, `variantId`, `quantity`) |
| `PATCH` | `/api/carts/:id/items/:itemId` | Update item quantity |
| `DELETE` | `/api/carts/:id/items/:itemId` | Remove item from cart |
| `POST` | `/api/carts/:id/promo` | Apply a promo code (`code`) |

### Checkout & Orders
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/checkout/:cartId` | Convert cart to order (returns Order object) |
| `GET` | `/api/orders/:id` | Get order by ID |

### Payments
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/payments/:orderId/authorize` | Authorize payment (`amountInCents`); marks order as `confirmed` |

### Admin
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/admin/orders` | List all orders (admin use) |
| `GET` | `/api/admin/stats` | Aggregate stats: total orders, revenue, average order value |

---

## 🗄️ Data Models

### Product
```typescript
{
  id: string;
  handle: string;        // URL-friendly slug (e.g., "urban-hoodie")
  title: string;
  description: string;
  category: string;
  status: "draft" | "published" | "archived";
  image?: string;
  videoUrl?: string;
  rating?: number;
  reviewsCount?: number;
  variants: ProductVariant[];
  metadata?: Record<string, string>;
}
```

### ProductVariant
```typescript
{
  id: string;
  sku: string;
  size: string;          // e.g., "S", "M", "L", "XL"
  color: string;
  priceInCents: number;  // All prices stored in smallest currency unit
  stock: number;
}
```

### Cart
```typescript
{
  id: string;
  currencyCode: "usd" | "inr";
  items: CartItem[];
  promoCode?: string;
  discountInCents?: number;
  subtotalInCents: number;
  totalInCents: number;
}
```

### Order
```typescript
{
  id: string;
  cartId: string;
  status: "pending" | "confirmed" | "fulfilled" | "cancelled";
  currencyCode: "usd" | "inr";
  items: OrderItem[];
  totalInCents: number;
  createdAt: string;
}
```

### Payment
```typescript
{
  id: string;
  orderId: string;
  provider: "mock" | "stripe";
  amountInCents: number;
  status: "requires_action" | "authorized" | "captured" | "failed";
  providerReference: string;
}
```

### User
```typescript
{
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: "admin" | "customer";
  createdAt: string;
}
```

---

## 🏗️ Architecture

The backend follows a **domain-driven, layered architecture**:

```
HTTP Layer (index.ts)
    ↓
Services (domain/*/Service.ts)   ← Business logic
    ↓
Repository interfaces            ← Abstraction boundary
    ↓
Infrastructure implementations
  ├── InMemory*Repository         ← Default (zero setup)
  └── PrismaProductRepository     ← PostgreSQL (production)
```

**Key design decisions:**
- **Dependency injection** via a central `appContainer` object in `app.ts` — all services and repositories are wired at startup
- **Storage mode toggle** — set `STORAGE_MODE=postgres` to switch from in-memory to PostgreSQL without changing service code
- **Mock payment gateway** — `MockPaymentGateway` always returns `authorized`, making it easy to develop and test the full checkout flow without Stripe credentials
- **Medusa.js bridge** — `modules/medusa/MedusaBridge.ts` is the prepared integration point for future migration to Medusa.js commerce engine

---

## 🔧 Environment Variables

### Backend (`backend/.env`)

| Variable | Default | Description |
|---|---|---|
| `PORT` | `4000` | Server port |
| `DATABASE_URL` | — | PostgreSQL connection string |
| `STORAGE_MODE` | `memory` | `memory` (default) or `postgres` |
| `PAYMENT_PROVIDER` | `mock` | `mock` or `stripe` |
| `CORS_ORIGIN` | `http://localhost:3000` | Allowed frontend origin |

**Example `backend/.env`:**
```env
DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:5433/irraya
STORAGE_MODE=memory
PAYMENT_PROVIDER=mock
CORS_ORIGIN=http://localhost:3000
PORT=4000
```

### Frontend (`frontend/.env.local`)

Copy from `.env.example`:

| Variable | Default | Description |
|---|---|---|
| `NEXT_PUBLIC_BACKEND_BASE_URL` | `http://localhost:4000/api` | Backend API base URL |
| `NEXT_PUBLIC_STORE_NAME` | `Irraya Fashion` | Store display name |

**Example `frontend/.env.local`:**
```env
NEXT_PUBLIC_BACKEND_BASE_URL=http://localhost:4000/api
NEXT_PUBLIC_STORE_NAME=Irraya Fashion
```

---

## 🔑 Default Accounts & Credentials

The backend is pre-seeded with the following accounts for testing and demonstration.

### Administrator Account
Grants access to the Admin Dashboard at `/admin`.
- **Email:** `admin@irraya.com`
- **Password:** `admin123`

### Demo Customer Account
For testing the standard customer experience (wishlist, cart, checkout).
- **Email:** `demo@irraya.com`
- **Password:** Any password (mock environment accepts any value)

> **Note:** All newly registered users are automatically assigned the `customer` role and **cannot** access `/admin`.

---

## 🛠️ How to Run Locally

### Prerequisites
- **Node.js** ≥ 20
- **npm** ≥ 9
- (Optional for PostgreSQL mode) **Docker Desktop**

### 1. Clone the repository
```bash
git clone <repo-url>
cd irraya-web
```

### 2. Start the Backend
```bash
cd backend
npm install
npm run dev
```
The backend API will be available at **`http://localhost:4000`**.

Storage defaults to **in-memory** — no database setup needed for development.

### 3. Start the Frontend
Open a **new terminal window**:
```bash
cd frontend
npm install
npm run dev
```
The frontend will be available at **`http://localhost:3000`**.

---

## 🐘 Database Setup (PostgreSQL)

To use real PostgreSQL persistence instead of in-memory storage:

### 1. Start the PostgreSQL container
```bash
cd backend
docker compose up -d
```
This starts a PostgreSQL 15 container on port **5433**.

### 2. Configure the environment
Ensure `backend/.env` contains:
```env
DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:5433/irraya
STORAGE_MODE=postgres
```

### 3. Run Prisma migrations & seed
```bash
cd backend
npx prisma migrate dev --name init
npx prisma db seed
```

### Prisma Schema (Current)
The current schema covers the product catalog:
- `Product` — id, handle, title, description, category, status, image
- `ProductVariant` — id, sku, size, color, priceInCents, stock

All other domains (cart, orders, payments, customers) use in-memory repositories in Phase 1, with Prisma adapters planned for Phase 2.

---

## 🧪 Running Tests

### Backend Tests
```bash
cd backend
npm test
```
Tests cover:
- **ProductService** — list published products, find by handle, 404 on unknown handle
- **CartService** — create cart, add/remove/update items, quantity increment deduplication
- **Order & Payment Flow** — create order from cart, retrieve order, list all orders, mock payment authorization, empty cart guard

### Frontend Tests
```bash
cd frontend
npm test
```
Tests cover:
- **format.ts** — currency formatting utilities

### Watch mode (both)
```bash
npm run test:watch
```

---

## 🚢 Deployment

The project is designed for **Google Cloud Platform (GCP)** deployment:

| Service | GCP Resource |
|---|---|
| Frontend (Next.js) | Cloud Run |
| Backend (Express) | Cloud Run |
| Database | Cloud SQL for PostgreSQL |
| Media/Images | Cloud Storage + Cloud CDN |
| Secrets | Secret Manager |
| Observability | Cloud Logging + Cloud Monitoring |

### CI/CD Strategy (GitHub Actions)
- **PR checks** — lint, typecheck, unit tests
- **Staging** — auto-deploy to Cloud Run on merge to `develop`
- **Production** — manual approval gate on merge to `main`

See [`DESIGN_DOC_FASHION_COMMERCE.md`](./DESIGN_DOC_FASHION_COMMERCE.md) for the full architecture and deployment plan.

---

## 📖 Design Documents

| Document | Description |
|---|---|
| [`DESIGN_DOC_FASHION_COMMERCE.md`](./DESIGN_DOC_FASHION_COMMERCE.md) | Full system architecture, data model, API design, GCP deployment plan, CI/CD, rollout phases, risk register, and acceptance criteria |
| [`frontend/DESIGN_SCHEMA.md`](./frontend/DESIGN_SCHEMA.md) | Frontend route map, folder structure, rendering strategy, backend API contract |
| [`backend/DESIGN_SCHEMA.md`](./backend/DESIGN_SCHEMA.md) | Backend domain layout, core entities, service/repository interfaces, Medusa integration plan |

---

## 📄 License

Private — all rights reserved. For internal development use only.