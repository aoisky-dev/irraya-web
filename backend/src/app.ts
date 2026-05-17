import { env } from "./config/env.js";
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
import { MedusaBridge } from "./modules/medusa/MedusaBridge.js";

const sampleProductRepository = new InMemoryProductRepository([
  {
    id: "prod_hoodie_001",
    handle: "urban-hoodie",
    title: "Urban Hoodie",
    description: "Premium cotton hoodie",
    category: "hoodies",
    status: "published",
    variants: [
      {
        id: "var_hoodie_black_m",
        sku: "UH-BLK-M",
        size: "M",
        color: "Black",
        priceInCents: 4999,
        stock: 25
      }
    ],
    metadata: {
      fit: "regular",
      material: "cotton"
    }
  }
]);

const sampleCartRepository = new InMemoryCartRepository([
  {
    id: "cart_demo_001",
    customerId: "cus_001",
    currencyCode: "usd",
    items: [
      {
        id: "item_001",
        productId: "prod_hoodie_001",
        variantId: "var_hoodie_black_m",
        quantity: 1,
        unitPriceInCents: 4999
      }
    ],
    subtotalInCents: 4999,
    totalInCents: 4999,
    updatedAt: new Date()
  }
]);

const sampleCustomerRepository = new InMemoryCustomerRepository([
  {
    id: "cus_001",
    email: "demo@irraya.com",
    firstName: "Demo",
    lastName: "Customer"
  }
]);

const orderRepository = new InMemoryOrderRepository();
const paymentGateway = new MockPaymentGateway();

export const appContainer = {
  env,
  medusaBridge: new MedusaBridge(),
  services: {
    productService: new ProductService(sampleProductRepository),
    cartService: new CartService(sampleCartRepository),
    orderService: new OrderService(orderRepository, new CartService(sampleCartRepository)),
    paymentService: new PaymentService(paymentGateway),
    customerService: new CustomerService(sampleCustomerRepository)
  },
  repositories: {
    products: sampleProductRepository,
    carts: sampleCartRepository,
    orders: orderRepository,
    customers: sampleCustomerRepository
  }
};

export type AppContainer = typeof appContainer;

