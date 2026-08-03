import { afterEach, describe, expect, it, vi } from "vitest";
import { buildInvoiceText, createOrderRequest, getOrderRequests } from "../src/lib/api/orders";
import type { Order } from "../src/lib/types";

describe("order management api", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("loads customer order requests", async () => {
    const fetchMock = vi.fn(async (_input: RequestInfo | URL, _init?: RequestInit) => Response.json({
      requests: [
        {
          id: 1,
          order_id: "order_123",
          request_type: "return",
          status: "requested",
          reason: "Size or fit issue",
          notes: "Need smaller size",
          items: [{ item_id: "item_1", product_id: "prod_1", variant_id: "var_1", quantity: 1 }],
          created_at: "2026-07-18T00:00:00.000Z",
          updated_at: "2026-07-18T00:00:00.000Z"
        }
      ]
    }));
    vi.stubGlobal("fetch", fetchMock);

    const requests = await getOrderRequests("token_123", "order_123");

    expect(requests[0]).toMatchObject({
      id: "1",
      orderId: "order_123",
      type: "return",
      status: "requested",
      items: [{ itemId: "item_1", productId: "prod_1", variantId: "var_1", quantity: 1 }]
    });
    expect(String(fetchMock.mock.calls[0][0])).toBe("http://localhost:9000/store/customers/me/order-requests?order_id=order_123");
    expect(fetchMock.mock.calls[0][1]?.headers).toMatchObject({ Authorization: "Bearer token_123" });
  });

  it("submits cancel return or exchange requests", async () => {
    const fetchMock = vi.fn(async (_input: RequestInfo | URL, _init?: RequestInit) => Response.json({
      request: {
        id: 2,
        order_id: "order_123",
        request_type: "exchange",
        status: "requested",
        reason: "Size or fit issue",
        items: [{ item_id: "item_1", product_id: "prod_1", variant_id: "var_1", quantity: 1 }],
        created_at: "2026-07-18T00:00:00.000Z",
        updated_at: "2026-07-18T00:00:00.000Z"
      },
      message: "Request submitted."
    }));
    vi.stubGlobal("fetch", fetchMock);

    const result = await createOrderRequest({
      token: "token_123",
      orderId: "order_123",
      type: "exchange",
      reason: "Size or fit issue",
      notes: "Need medium",
      items: [{ itemId: "item_1", productId: "prod_1", variantId: "var_1", quantity: 1 }]
    });

    expect(result.request.type).toBe("exchange");
    expect(String(fetchMock.mock.calls[0][0])).toBe("http://localhost:9000/store/customers/me/order-requests");
    expect(fetchMock.mock.calls[0][1]?.method).toBe("POST");
    expect(JSON.parse(String(fetchMock.mock.calls[0][1]?.body))).toEqual({
      order_id: "order_123",
      request_type: "exchange",
      reason: "Size or fit issue",
      notes: "Need medium",
      items: [{ item_id: "item_1", product_id: "prod_1", variant_id: "var_1", quantity: 1 }]
    });
  });

  it("builds a downloadable invoice text document", () => {
    const order: Order = {
      id: "order_123",
      cartId: "cart_123",
      status: "confirmed",
      currencyCode: "inr",
      items: [
        { id: "item_1", productId: "prod_1", variantId: "var_1", title: "Linen Shirt", quantity: 2, unitPriceInCents: 250000 }
      ],
      totalInCents: 500000,
      payment: {
        id: "pay_123",
        orderId: "order_123",
        provider: "razorpay",
        amountInCents: 500000,
        status: "captured",
        providerReference: "order_rzp_123",
        providerPaymentId: "pay_123"
      },
      createdAt: "2026-07-18T00:00:00.000Z"
    };

    const invoice = buildInvoiceText(order);

    expect(invoice).toContain("Irraya Fashion Invoice");
    expect(invoice).toContain("Order ID: order_123");
    expect(invoice).toContain("Linen Shirt x 2");
    expect(invoice).toContain("Razorpay Payment ID: pay_123");
  });
});



