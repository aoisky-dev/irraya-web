# Backend Skeleton (`backend`)

This directory now contains a **first implementation scaffold** for a fashion commerce backend aligned to Medusa-oriented architecture.

## What is included
- TypeScript backend project setup
- Domain-first folders for products, cart, orders, payments, customers
- Service and repository interfaces (with in-memory implementations)
- App container object that wires classes/objects together
- Placeholder Medusa bridge for upcoming Medusa integration
- Basic tests to validate end-to-end skeleton flow

## Quick start

```bash
cd /Users/bhanuteja.jogu/work-projects/irraya-web/backend
npm install
npm test
npm run start
```

## Current entry points
- `src/index.ts` -> bootstrap runner
- `src/app.ts` -> object graph/container setup
- `tests/app.spec.ts` -> skeleton flow tests

## Next implementation steps
1. Replace in-memory repositories with Postgres-backed repositories.
2. Replace `MockPaymentGateway` with Stripe Medusa plugin integration.
3. Add HTTP API layer (Express/Fastify or Medusa API modules).
4. Implement auth/session and customer lifecycle.
5. Add migrations and real data model constraints.

