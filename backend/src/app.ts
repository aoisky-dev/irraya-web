import { env } from "./config/env.js";
import { seedProducts } from "./config/seed-data.js";
import { CartService } from "./domain/cart/CartService.js";
import { CustomerService } from "./domain/customers/CustomerService.js";
import { OrderService } from "./domain/orders/OrderService.js";
import { PaymentService } from "./domain/payments/PaymentService.js";
import { ProductService } from "./domain/products/ProductService.js";
import { MockPaymentGateway } from "./infrastructure/payment/MockPaymentGateway.js";
import { StripePaymentGateway } from "./infrastructure/payment/StripePaymentGateway.js";
import { InMemoryCartRepository } from "./infrastructure/repositories/memory/InMemoryCartRepository.js";
import { InMemoryCustomerRepository } from "./infrastructure/repositories/memory/InMemoryCustomerRepository.js";
import { InMemoryOrderRepository } from "./infrastructure/repositories/memory/InMemoryOrderRepository.js";
import { InMemoryProductRepository } from "./infrastructure/repositories/memory/InMemoryProductRepository.js";
import { InMemoryUserRepository } from "./infrastructure/repositories/memory/InMemoryUserRepository.js";
import type { ProductRepository } from "./domain/products/ProductRepository.js";
import type { CartRepository } from "./domain/cart/CartRepository.js";
import type { OrderRepository } from "./domain/orders/OrderRepository.js";
import type { CustomerRepository } from "./domain/customers/CustomerRepository.js";
import type { UserRepository } from "./domain/users/UserRepository.js";
import { AuthService } from "./domain/users/AuthService.js";

// ── Product repository ───────────────────────────────────────
// Use in-memory by default so the backend works with zero setup.
// Set STORAGE_MODE=postgres and provide DATABASE_URL to use Postgres.
let productRepository: ProductRepository;
let cartRepository: CartRepository;
let customerRepository: CustomerRepository;
let orderRepository: OrderRepository;
let userRepository: UserRepository;

let paymentGateway;
if (env.PAYMENT_PROVIDER === "stripe" && process.env.STRIPE_SECRET_KEY) {
  paymentGateway = new StripePaymentGateway(process.env.STRIPE_SECRET_KEY);
  console.log("[backend] Using Stripe payment gateway");
} else {
  paymentGateway = new MockPaymentGateway();
  console.log("[backend] Using Mock payment gateway");
}

if (env.STORAGE_MODE === "postgres" && env.DATABASE_URL) {
  const { PrismaClient } = await import("@prisma/client");
  const { PrismaProductRepository } = await import("./infrastructure/repositories/prisma/PrismaProductRepository.js");
  const { PrismaCartRepository } = await import("./infrastructure/repositories/prisma/PrismaCartRepository.js");
  const { PrismaCustomerRepository } = await import("./infrastructure/repositories/prisma/PrismaCustomerRepository.js");
  const { PrismaOrderRepository } = await import("./infrastructure/repositories/prisma/PrismaOrderRepository.js");
  const { PrismaUserRepository } = await import("./infrastructure/repositories/prisma/PrismaUserRepository.js");
  
  const prisma = new PrismaClient();
  productRepository = new PrismaProductRepository(prisma);
  cartRepository = new PrismaCartRepository(prisma);
  customerRepository = new PrismaCustomerRepository(prisma);
  orderRepository = new PrismaOrderRepository(prisma);
  userRepository = new PrismaUserRepository(prisma);
  console.log("[backend] Using PostgreSQL storage");
} else {
  productRepository = new InMemoryProductRepository(seedProducts);
  cartRepository = new InMemoryCartRepository();
  customerRepository = new InMemoryCustomerRepository([
    {
      id: "cus_001",
      email: "demo@irraya.com",
      firstName: "Demo",
      lastName: "Customer"
    }
  ]);
  orderRepository = new InMemoryOrderRepository();
  userRepository = new InMemoryUserRepository([
    {
      id: "usr_admin",
      email: "admin@irraya.com",
      passwordHash: "admin123", // We will fix this in auth task
      firstName: "Admin",
      lastName: "User",
      role: "admin",
      createdAt: new Date()
    }
  ]);
  console.log(`[backend] Using in-memory storage (${seedProducts.length} products loaded)`);
}

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
