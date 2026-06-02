import { describe, expect, it, beforeEach } from "vitest";
import { CartService } from "../src/domain/cart/CartService.js";
import { OrderService } from "../src/domain/orders/OrderService.js";
import { PaymentService } from "../src/domain/payments/PaymentService.js";
import { ProductService } from "../src/domain/products/ProductService.js";
import { MockPaymentGateway } from "../src/infrastructure/payment/MockPaymentGateway.js";
import { InMemoryCartRepository } from "../src/infrastructure/repositories/memory/InMemoryCartRepository.js";
import { InMemoryOrderRepository } from "../src/infrastructure/repositories/memory/InMemoryOrderRepository.js";
import { InMemoryProductRepository } from "../src/infrastructure/repositories/memory/InMemoryProductRepository.js";
import { seedProducts } from "../src/config/seed-data.js";

describe("Product Service", () => {
  let productService: ProductService;

  beforeEach(() => {
    const repo = new InMemoryProductRepository(seedProducts);
    productService = new ProductService(repo);
  });

  it("lists published products from seed data", async () => {
    const products = await productService.listPublishedProducts();
    expect(products.length).toBe(seedProducts.length);
    products.forEach((p) => expect(p.status).toBe("published"));
  });

  it("finds a product by handle", async () => {
    const product = await productService.getProductByHandle("urban-hoodie");
    expect(product.title).toBe("Urban Hoodie");
    expect(product.variants.length).toBeGreaterThan(0);
  });

  it("throws 404 for unknown handle", async () => {
    await expect(productService.getProductByHandle("non-existent")).rejects.toThrow(
      "Product not found"
    );
  });
});

describe("Cart Service", () => {
  let cartService: CartService;

  beforeEach(() => {
    cartService = new CartService(new InMemoryCartRepository());
  });

  it("creates a new empty cart", async () => {
    const cart = await cartService.createCart("cart_test_1", "inr");
    expect(cart.id).toBe("cart_test_1");
    expect(cart.items).toHaveLength(0);
    expect(cart.totalInCents).toBe(0);
  });

  it("adds items and recalculates total", async () => {
    await cartService.createCart("cart_test_2", "inr");
    const cart = await cartService.addItem("cart_test_2", {
      productId: "prod_1",
      variantId: "var_1",
      quantity: 2,
      unitPriceInCents: 2500
    });
    expect(cart.items).toHaveLength(1);
    expect(cart.totalInCents).toBe(5000);
  });

  it("increments quantity when adding same variant", async () => {
    await cartService.createCart("cart_test_3", "inr");
    await cartService.addItem("cart_test_3", {
      productId: "prod_1",
      variantId: "var_1",
      quantity: 1,
      unitPriceInCents: 2500
    });
    const cart = await cartService.addItem("cart_test_3", {
      productId: "prod_1",
      variantId: "var_1",
      quantity: 2,
      unitPriceInCents: 2500
    });
    expect(cart.items).toHaveLength(1);
    expect(cart.items[0].quantity).toBe(3);
    expect(cart.totalInCents).toBe(7500);
  });

  it("removes items", async () => {
    await cartService.createCart("cart_test_4", "inr");
    const cartWithItem = await cartService.addItem("cart_test_4", {
      productId: "prod_1",
      variantId: "var_1",
      quantity: 1,
      unitPriceInCents: 1000
    });
    const cart = await cartService.removeItem("cart_test_4", cartWithItem.items[0].id);
    expect(cart.items).toHaveLength(0);
    expect(cart.totalInCents).toBe(0);
  });

  it("updates quantity and removes when zero", async () => {
    await cartService.createCart("cart_test_5", "inr");
    const cartWithItem = await cartService.addItem("cart_test_5", {
      productId: "prod_1",
      variantId: "var_1",
      quantity: 3,
      unitPriceInCents: 1000
    });
    const cart = await cartService.updateItemQuantity(
      "cart_test_5",
      cartWithItem.items[0].id,
      0
    );
    expect(cart.items).toHaveLength(0);
  });
});

describe("Order & Payment Flow", () => {
  let cartService: CartService;
  let orderService: OrderService;
  let paymentService: PaymentService;

  beforeEach(async () => {
    cartService = new CartService(new InMemoryCartRepository());
    orderService = new OrderService(new InMemoryOrderRepository(), cartService);
    paymentService = new PaymentService(new MockPaymentGateway());

    await cartService.createCart("cart_order_1", "inr");
    await cartService.addItem("cart_order_1", {
      productId: "prod_hoodie_001",
      variantId: "var_hoodie_blk_m",
      quantity: 1,
      unitPriceInCents: 399920
    });
  });

  it("creates an order from cart", async () => {
    const order = await orderService.createFromCart("cart_order_1");
    expect(order.status).toBe("pending");
    expect(order.items).toHaveLength(1);
    expect(order.totalInCents).toBe(399920);
  });

  it("retrieves order by id", async () => {
    const order = await orderService.createFromCart("cart_order_1");
    const fetched = await orderService.getOrderById(order.id);
    expect(fetched.id).toBe(order.id);
  });

  it("lists all orders", async () => {
    await orderService.createFromCart("cart_order_1");
    const orders = await orderService.listAllOrders();
    expect(orders.length).toBe(1);
    expect(orders[0].totalInCents).toBe(399920);
  });

  it("initializes mock payment", async () => {
    const order = await orderService.createFromCart("cart_order_1");
    const payment = await paymentService.initializePayment(order.id, order.totalInCents);
    expect(payment.status).toBe("authorized");
    expect(payment.amountInCents).toBe(399920);
  });

  it("throws on empty cart checkout", async () => {
    await cartService.createCart("cart_empty", "inr");
    await expect(orderService.createFromCart("cart_empty")).rejects.toThrow(
      "Cannot create order from an empty cart"
    );
  });
});
