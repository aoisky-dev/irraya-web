import { env } from "./config/env.js";
import { seedProducts } from "./config/seed-data.js";
import { CartService } from "./domain/cart/CartService.js";
import { CustomerService } from "./domain/customers/CustomerService.js";
import { OrderService } from "./domain/orders/OrderService.js";
import { PaymentService } from "./domain/payments/PaymentService.js";
import { ProductService } from "./domain/products/ProductService.js";
import { MockPaymentGateway } from "./infrastructure/payment/MockPaymentGateway.js";
import { InMemoryCartRepository } from "./infrastructure/repositories/memory/InMemoryCartRepository.js";
import { InMemoryCustomerRepository } from "./infrastructure/repositories/memory/InMemoryCustomerRepository.js";
import { InMemoryOrderRepository } from "./infrastructure/repositories/memory/InMemoryOrderRepository.js";
import { InMemoryProductRepository } from "./infrastructure/repositories/memory/InMemoryProductRepository.js";
import { InMemoryUserRepository } from "./infrastructure/repositories/memory/InMemoryUserRepository.js";
import type { ProductRepository } from "./domain/products/ProductRepository.js";
import { AuthService } from "./domain/users/AuthService.js";

// ── Product repository ───────────────────────────────────────
// Use in-memory by default so the backend works with zero setup.
// Set STORAGE_MODE=postgres and provide DATABASE_URL to use Postgres.
let productRepository: ProductRepository;

if (env.STORAGE_MODE === "postgres" && env.DATABASE_URL) {
  // Dynamically import Prisma only when needed so the app
  // doesn't crash when @prisma/client isn't generated yet.
  const { PrismaClient } = await import("@prisma/client");
  const { PrismaProductRepository } = await import(
    "./infrastructure/repositories/prisma/PrismaProductRepository.js"
  );
  const prisma = new PrismaClient();
  productRepository = new PrismaProductRepository(prisma);
  console.log("[backend] Using PostgreSQL storage");
} else {
  productRepository = new InMemoryProductRepository(seedProducts);
  console.log(`[backend] Using in-memory storage (${seedProducts.length} products loaded)`);
}

// ── Other repositories (always in-memory for MVP) ────────────
const cartRepository = new InMemoryCartRepository();
const customerRepository = new InMemoryCustomerRepository([
  {
    id: "cus_001",
    email: "demo@irraya.com",
    firstName: "Demo",
    lastName: "Customer"
  }
]);
const orderRepository = new InMemoryOrderRepository();
const paymentGateway = new MockPaymentGateway();
const userRepository = new InMemoryUserRepository();

// ── Services ─────────────────────────────────────────────────
const cartService = new CartService(cartRepository);
const orderService = new OrderService(orderRepository, cartService);

export const appContainer = {
  env,
  services: {
    productService: new ProductService(productRepository),
    cartService,
    orderService,
    paymentService: new PaymentService(paymentGateway),
    customerService: new CustomerService(customerRepository),
    authService: new AuthService(userRepository)
  },
  repositories: {
    products: productRepository,
    carts: cartRepository,
    orders: orderRepository,
    customers: customerRepository,
    users: userRepository
  }
};

export type AppContainer = typeof appContainer;
