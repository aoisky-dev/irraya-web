import { describe, expect, it } from "vitest";
import { appContainer } from "../src/app.js";

describe("backend skeleton", () => {
  it("lists published products from the seeded repository", async () => {
    const products = await appContainer.services.productService.listPublishedProducts();

    expect(products.length).toBeGreaterThan(0);
    expect(products[0]?.status).toBe("published");
  });

  it("creates an order and initializes payment from demo cart", async () => {
    const order = await appContainer.services.orderService.createFromCart("cart_demo_001");
    const payment = await appContainer.services.paymentService.initializePayment(
      order.id,
      order.totalInCents
    );

    expect(order.status).toBe("pending");
    expect(payment.status).toBe("authorized");
  });
});

