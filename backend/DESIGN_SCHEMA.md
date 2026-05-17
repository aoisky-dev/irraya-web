# Backend Design Schema (Initial)

## 1) Goal
Establish a clean backend layout before feature-by-feature implementation for:
- product catalog
- cart and checkout
- orders
- payments
- customers/account

Target backend stack remains **Medusa.js + PostgreSQL**, but this phase creates a domain scaffold that is easy to plug into Medusa services.

## 2) Layout

```text
backend/
  src/
    config/
      env.ts
    shared/
      errors/
        AppError.ts
    domain/
      products/
      cart/
      orders/
      payments/
      customers/
    infrastructure/
      repositories/
        memory/
      payment/
    modules/
      medusa/
        MedusaBridge.ts
    app.ts
    index.ts
  tests/
    app.spec.ts
  package.json
  tsconfig.json
```

## 3) Core Classes and Objects
- **Entity objects/interfaces**
  - `Product`, `ProductVariant`
  - `Cart`, `CartItem`
  - `Order`, `OrderItem`
  - `Payment`
  - `Customer`

- **Repository interfaces**
  - `ProductRepository`
  - `CartRepository`
  - `OrderRepository`
  - `CustomerRepository`

- **Service classes**
  - `ProductService`
  - `CartService`
  - `OrderService`
  - `PaymentService`
  - `CustomerService`

- **Gateway interfaces**
  - `PaymentGateway`

- **Infrastructure implementations (temporary)**
  - `InMemory*Repository`
  - `MockPaymentGateway`

- **Composition root**
  - `appContainer` object in `src/app.ts`

## 4) Request/Workflow Intent (Future HTTP Layer)
1. `GET /products` -> `ProductService.listPublishedProducts()`
2. `GET /products/:handle` -> `ProductService.getProductByHandle()`
3. `GET /carts/:id` -> `CartService.getCart()`
4. `POST /checkout/:cartId` -> `OrderService.createFromCart()`
5. `POST /payments/:orderId/authorize` -> `PaymentService.initializePayment()`

## 5) Database Mapping Intent (PostgreSQL)
Planned table families:
- `products`, `product_variants`, `product_collections`
- `customers`, `customer_addresses`
- `carts`, `cart_items`
- `orders`, `order_items`
- `payments`

Most of these map naturally to Medusa's model with selective custom metadata for fashion (size/color/fit/material).

## 6) Medusa Integration Plan
- Keep domain contracts stable.
- Replace repository implementations with Medusa-aware adapters and/or direct Postgres access where needed.
- Replace `MockPaymentGateway` with Stripe provider through Medusa payment modules.
- Move from in-process bootstrap to real API server with Medusa modules and webhooks.

## 7) Why this schema
- decouples business logic from infrastructure early
- keeps future Medusa migration incremental instead of big-bang rewrite
- provides a testable shape for each domain before external dependencies

